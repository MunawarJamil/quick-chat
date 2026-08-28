import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import type { SignOptions } from 'jsonwebtoken';

import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/requests/register.dto';
import { LoginDto } from './dto/requests/login.dto';
import { RefreshTokenDto } from './dto/requests/refresh-token.dto';
import { AuthResponseDto } from './dto/responses/auth-response.dto';
import { UserResponseDto } from './dto/responses/user-response.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { Prisma, User } from '@quick-chat/prisma-client';

@Injectable()
export class AuthService {
  private readonly accessSecret: string;
  private readonly refreshSecret: string;
  private readonly accessExpiresIn: SignOptions['expiresIn'];
  private readonly refreshExpiresInDays: number;

  private getRequiredEnv(key: string): string {
    const value = this.configService.get<string>(key);
    if (!value) {
      throw new Error(`Missing required environment variable: ${key}`);
    }
    return value;
  }

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    this.accessSecret = this.getRequiredEnv('JWT_ACCESS_SECRET');
    this.refreshSecret = this.getRequiredEnv('JWT_REFRESH_SECRET');

    this.accessExpiresIn =
      this.configService.get<SignOptions['expiresIn']>('JWT_ACCESS_EXPIRES_IN') ??
      '15m';

    this.refreshExpiresInDays = Number(
      this.configService.get<string>('JWT_REFRESH_EXPIRES_IN_DAYS') ?? 7,
    );
    if (
      !Number.isFinite(this.refreshExpiresInDays) ||
      this.refreshExpiresInDays <= 0
    ) {
      throw new Error('JWT_REFRESH_EXPIRES_IN_DAYS must be a positive number');
    }
  }

  private async generateTokens(
    payload: JwtPayload,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.accessSecret,
        expiresIn: this.accessExpiresIn,
      }),
      this.jwtService.signAsync(payload, {
        secret: this.refreshSecret,
        expiresIn: `${this.refreshExpiresInDays}d` as SignOptions['expiresIn'],
      }),
    ]);

    return { accessToken, refreshToken };
  }

  private async storeRefreshToken(
    userId: string,
    refreshToken: string,
    userAgent?: string,
    ipAddress?: string,
  ): Promise<void> {
    const tokenHash = await bcrypt.hash(refreshToken, 10);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + this.refreshExpiresInDays);

    await this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash,
        userAgent,
        ipAddress,
        expiresAt,
      },
    });
  }

  public mapUserResponse(user: User): UserResponseDto {
    return {
      success: true,
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      avatarUrl: user.avatarUrl,
      emailVerified: user.emailVerified,
    };
  }

  private async buildAuthResponse(
    user: User,
    userAgent?: string,
    ipAddress?: string,
  ): Promise<AuthResponseDto> {
    const tokens = await this.generateTokens({
      sub: user.id,
      email: user.email,
      platformRole: user.platformRole,
    });

    await this.storeRefreshToken(
      user.id,
      tokens.refreshToken,
      userAgent,
      ipAddress,
    );

    return {
      user: this.mapUserResponse(user),
      ...tokens,
    };
  }

  async register(
    dto: RegisterDto,
    userAgent?: string,
    ipAddress?: string,
  ): Promise<AuthResponseDto> {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase().trim() },
    });

    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    try {
      const user = await this.prisma.user.create({
        data: {
          fullName: dto.fullName.trim(),
          email: dto.email.toLowerCase().trim(),
          passwordHash,
          authProvider: 'LOCAL',
        },
      });

      return this.buildAuthResponse(user, userAgent, ipAddress);
    } catch (error: unknown) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Email already exists');
      }
      throw error;
    }
  }

  async login(
    dto: LoginDto,
    userAgent?: string,
    ipAddress?: string,
  ): Promise<AuthResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase().trim() },
    });

    if (!user || user.authProvider !== 'LOCAL' || !user.passwordHash) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isPasswordValid = await bcrypt.compare(
      dto.password,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    return this.buildAuthResponse(user, userAgent, ipAddress);
  }

  async refreshTokens(
    dto: RefreshTokenDto,
    userAgent?: string,
    ipAddress?: string,
  ): Promise<AuthResponseDto> {
    let payload: JwtPayload;

    try {
      payload = await this.jwtService.verifyAsync<JwtPayload>(
        dto.refreshToken,
        { secret: this.refreshSecret },
      );
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user || user.status !== 'ACTIVE') {
      throw new UnauthorizedException('User is no longer active');
    }

    // Find active non-revoked tokens for this user
    const activeTokens = await this.prisma.refreshToken.findMany({
      where: {
        userId: user.id,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
    });

    let matchedTokenRecord = null;
    for (const record of activeTokens) {
      const isMatch = await bcrypt.compare(dto.refreshToken, record.tokenHash);
      if (isMatch) {
        matchedTokenRecord = record;
        break;
      }
    }

    if (!matchedTokenRecord) {
      // Possible reuse attack: revoke all tokens for safety
      await this.prisma.refreshToken.updateMany({
        where: { userId: user.id, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Revoke previous token (Rotation)
    await this.prisma.refreshToken.update({
      where: { id: matchedTokenRecord.id },
      data: { revokedAt: new Date() },
    });

    // Issue new token pair
    return this.buildAuthResponse(user, userAgent, ipAddress);
  }

  async logout(userId: string, refreshToken?: string): Promise<{ success: boolean }> {
    if (refreshToken) {
      const activeTokens = await this.prisma.refreshToken.findMany({
        where: { userId, revokedAt: null },
      });

      for (const record of activeTokens) {
        const isMatch = await bcrypt.compare(refreshToken, record.tokenHash);
        if (isMatch) {
          await this.prisma.refreshToken.update({
            where: { id: record.id },
            data: { revokedAt: new Date() },
          });
          break;
        }
      }
    } else {
      // Revoke all active tokens for this user
      await this.prisma.refreshToken.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }

    return { success: true };
  }
}

import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/requests/register.dto';
import { AuthResponseDto } from './dto/responses/auth-response.dto';
import type { SignOptions } from 'jsonwebtoken';
import { UserResponseDto } from './dto/responses/user-response.dto';
import { Prisma, User } from '@quick-chat/prisma-client';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { LoginDto } from './dto/requests/login.dto';
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
      this.configService.get<SignOptions['expiresIn']>(
        'JWT_ACCESS_EXPIRES_IN',
      ) ?? '15m';

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
  ): Promise<void> {
    const tokenHash = await bcrypt.hash(refreshToken, 10);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + this.refreshExpiresInDays);

    await this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash,
        expiresAt,
      },
    });
  }

  private mapUserResponse(user: User): UserResponseDto {
    return {
      success: true,
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      avatarUrl: user.avatarUrl,
      emailVerified: user.emailVerified,
    };
  }

  private async buildAuthResponse(user: User): Promise<AuthResponseDto> {
    const tokens = await this.generateTokens({
      sub: user.id,
      email: user.email,
      platformRole: user.platformRole,
    });

    await this.storeRefreshToken(user.id, tokens.refreshToken);

    return {
      user: this.mapUserResponse(user),
      ...tokens,
    };
  }

  async register(dto: RegisterDto): Promise<AuthResponseDto> {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    try {
      const user = await this.prisma.user.create({
        data: {
          fullName: dto.fullName,
          email: dto.email,
          passwordHash,
          authProvider: 'LOCAL',
        },
      });

      return this.buildAuthResponse(user);
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

  async login(dto: LoginDto): Promise<AuthResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
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

    return this.buildAuthResponse(user);
  }
}

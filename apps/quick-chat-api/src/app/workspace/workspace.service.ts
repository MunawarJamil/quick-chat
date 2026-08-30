import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  MemberStatus,
  Prisma,
  Workspace,
  WorkspaceRole,
  WorkspaceStatus,
} from '@quick-chat/prisma-client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateWorkspaceDto } from './dto/requests/create-workspace.dto';
import { UpdateAiSettingsDto } from './dto/requests/update-ai-settings.dto';
import { UpdateWorkspaceDto } from './dto/requests/update-workspace.dto';
import { WorkspaceResponseDto } from './dto/responses/workspace-response.dto';

@Injectable()
export class WorkspaceService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Transforms raw workspace entity and member role into a public DTO
   */
  public mapToResponse(
    workspace: Workspace,
    currentUserRole?: WorkspaceRole,
  ): WorkspaceResponseDto {
    return {
      id: workspace.id,
      name: workspace.name,
      slug: workspace.slug,
      status: workspace.status,
      currentUserRole,
      aiSettings: (workspace.aiSettings as Record<string, unknown>) ?? null,
      createdAt: workspace.createdAt,
      updatedAt: workspace.updatedAt,
    };
  }

  /**
   * Helper to generate a URL-safe slug from a string
   */
  private slugify(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  /**
   * Ensures the generated or provided slug is unique
   */
  private async generateUniqueSlug(baseSlug: string): Promise<string> {
    let slug = baseSlug;
    let counter = 1;

    while (true) {
      const existing = await this.prisma.workspace.findUnique({
        where: { slug },
        select: { id: true },
      });

      if (!existing) {
        return slug;
      }

      slug = `${baseSlug}-${counter}`;
      counter++;
    }
  }

  /**
   * Verify membership and return the member record with role
   */
  private async getActiveMembership(workspaceId: string, userId: string) {
    const member = await this.prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId,
        },
      },
    });

    if (!member || member.status !== MemberStatus.ACTIVE) {
      throw new ForbiddenException(
        'You do not have active access to this workspace',
      );
    }

    return member;
  }

  /**
   * Create a new workspace and make creator the OWNER atomically
   */
  async createWorkspace(
    userId: string,
    dto: CreateWorkspaceDto,
  ): Promise<WorkspaceResponseDto> {
    const rawSlug = dto.slug
      ? this.slugify(dto.slug)
      : this.slugify(dto.name) || 'workspace';

    if (dto.slug) {
      const existing = await this.prisma.workspace.findUnique({
        where: { slug: rawSlug },
      });
      if (existing) {
        throw new ConflictException(`Workspace slug '${rawSlug}' is already taken`);
      }
    }

    const uniqueSlug = dto.slug
      ? rawSlug
      : await this.generateUniqueSlug(rawSlug);

    const result = await this.prisma.$transaction(async (tx) => {
      const workspace = await tx.workspace.create({
        data: {
          name: dto.name.trim(),
          slug: uniqueSlug,
          status: WorkspaceStatus.ACTIVE,
          aiSettings: (dto.aiSettings as unknown as Prisma.InputJsonValue) ?? Prisma.JsonNull,
        },
      });

      await tx.workspaceMember.create({
        data: {
          workspaceId: workspace.id,
          userId,
          role: WorkspaceRole.OWNER,
          status: MemberStatus.ACTIVE,
          joinedAt: new Date(),
        },
      });

      return workspace;
    });

    return this.mapToResponse(result, WorkspaceRole.OWNER);
  }

  /**
   * List all active workspaces where user is an active member
   */
  async getUserWorkspaces(userId: string): Promise<WorkspaceResponseDto[]> {
    const memberships = await this.prisma.workspaceMember.findMany({
      where: {
        userId,
        status: MemberStatus.ACTIVE,
        workspace: {
          deletedAt: null,
        },
      },
      include: {
        workspace: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    return memberships.map((membership) =>
      this.mapToResponse(membership.workspace, membership.role),
    );
  }

  /**
   * Get single workspace by ID (ensures active membership & not soft-deleted)
   */
  async getWorkspaceById(
    workspaceId: string,
    userId: string,
  ): Promise<WorkspaceResponseDto> {
    const membership = await this.getActiveMembership(workspaceId, userId);

    const workspace = await this.prisma.workspace.findFirst({
      where: {
        id: workspaceId,
        deletedAt: null,
      },
    });

    if (!workspace) {
      throw new NotFoundException('Workspace not found or has been deleted');
    }

    return this.mapToResponse(workspace, membership.role);
  }

  /**
   * Update workspace details (restricted to OWNER and ADMIN)
   */
  async updateWorkspace(
    workspaceId: string,
    userId: string,
    dto: UpdateWorkspaceDto,
  ): Promise<WorkspaceResponseDto> {
    const membership = await this.getActiveMembership(workspaceId, userId);

    if (
      membership.role !== WorkspaceRole.OWNER &&
      membership.role !== WorkspaceRole.ADMIN
    ) {
      throw new ForbiddenException(
        'Only workspace Owners and Admins can update workspace settings',
      );
    }

    const workspace = await this.prisma.workspace.findFirst({
      where: { id: workspaceId, deletedAt: null },
    });

    if (!workspace) {
      throw new NotFoundException('Workspace not found or has been deleted');
    }

    const updated = await this.prisma.workspace.update({
      where: { id: workspaceId },
      data: {
        ...(dto.name ? { name: dto.name.trim() } : {}),
        ...(dto.status ? { status: dto.status } : {}),
      },
    });

    return this.mapToResponse(updated, membership.role);
  }

  /**
   * Update workspace AI configuration (restricted to OWNER and ADMIN)
   */
  async updateAiSettings(
    workspaceId: string,
    userId: string,
    dto: UpdateAiSettingsDto,
  ): Promise<WorkspaceResponseDto> {
    const membership = await this.getActiveMembership(workspaceId, userId);

    if (
      membership.role !== WorkspaceRole.OWNER &&
      membership.role !== WorkspaceRole.ADMIN
    ) {
      throw new ForbiddenException(
        'Only workspace Owners and Admins can update AI settings',
      );
    }

    const workspace = await this.prisma.workspace.findFirst({
      where: { id: workspaceId, deletedAt: null },
    });

    if (!workspace) {
      throw new NotFoundException('Workspace not found or has been deleted');
    }

    const existingSettings =
      (workspace.aiSettings as Record<string, unknown>) || {};
    const mergedSettings = {
      ...existingSettings,
      ...dto,
    };

    const updated = await this.prisma.workspace.update({
      where: { id: workspaceId },
      data: {
        aiSettings: mergedSettings as unknown as Prisma.InputJsonValue,
      },
    });

    return this.mapToResponse(updated, membership.role);
  }

  /**
   * Soft-delete workspace (restricted strictly to OWNER)
   */
  async softDeleteWorkspace(
    workspaceId: string,
    userId: string,
  ): Promise<{ success: boolean; message: string }> {
    const membership = await this.getActiveMembership(workspaceId, userId);

    if (membership.role !== WorkspaceRole.OWNER) {
      throw new ForbiddenException('Only the workspace Owner can delete this workspace');
    }

    const workspace = await this.prisma.workspace.findFirst({
      where: { id: workspaceId, deletedAt: null },
    });

    if (!workspace) {
      throw new NotFoundException('Workspace not found or already deleted');
    }

    await this.prisma.workspace.update({
      where: { id: workspaceId },
      data: {
        deletedAt: new Date(),
        status: WorkspaceStatus.SUSPENDED,
      },
    });

    return {
      success: true,
      message: 'Workspace has been soft-deleted successfully',
    };
  }
}

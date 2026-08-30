import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import {
  MemberStatus,
  WorkspaceRole,
  WorkspaceStatus,
} from '@quick-chat/prisma-client';
import { PrismaService } from '../prisma/prisma.service';
import { WorkspaceService } from './workspace.service';

describe('WorkspaceService', () => {
  let service: WorkspaceService;
  let prisma: {
    workspace: {
      findUnique: jest.Mock;
      findFirst: jest.Mock;
      update: jest.Mock;
    };
    workspaceMember: {
      findUnique: jest.Mock;
      findMany: jest.Mock;
    };
    $transaction: jest.Mock;
  };

  const mockUserId = 'user-123';
  const mockWorkspaceId = 'workspace-123';

  const mockWorkspace = {
    id: mockWorkspaceId,
    name: 'Acme Corp',
    slug: 'acme-corp',
    status: WorkspaceStatus.ACTIVE,
    aiSettings: { systemPrompt: 'Be helpful' },
    deletedAt: null,
    createdAt: new Date('2026-08-30'),
    updatedAt: new Date('2026-08-30'),
  };

  const mockMember = {
    id: 'member-123',
    workspaceId: mockWorkspaceId,
    userId: mockUserId,
    role: WorkspaceRole.OWNER,
    status: MemberStatus.ACTIVE,
  };

  beforeEach(async () => {
    prisma = {
      workspace: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
      },
      workspaceMember: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
      },
      $transaction: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorkspaceService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    }).compile();

    service = module.get<WorkspaceService>(WorkspaceService);
  });

  describe('createWorkspace', () => {
    it('should create a workspace and assign creator as OWNER in a transaction', async () => {
      prisma.workspace.findUnique.mockResolvedValue(null);
      prisma.$transaction.mockImplementation(async (cb) => {
        return cb({
          workspace: {
            create: jest.fn().mockResolvedValue(mockWorkspace),
          },
          workspaceMember: {
            create: jest.fn().mockResolvedValue(mockMember),
          },
        });
      });

      const result = await service.createWorkspace(mockUserId, {
        name: 'Acme Corp',
      });

      expect(result.id).toBe(mockWorkspaceId);
      expect(result.currentUserRole).toBe(WorkspaceRole.OWNER);
      expect(result.slug).toBe('acme-corp');
    });

    it('should throw ConflictException if provided custom slug already exists', async () => {
      prisma.workspace.findUnique.mockResolvedValue({ id: 'existing-id' });

      await expect(
        service.createWorkspace(mockUserId, {
          name: 'Acme Corp',
          slug: 'acme-corp',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('getWorkspaceById', () => {
    it('should return workspace with role if user is active member', async () => {
      prisma.workspaceMember.findUnique.mockResolvedValue(mockMember);
      prisma.workspace.findFirst.mockResolvedValue(mockWorkspace);

      const result = await service.getWorkspaceById(mockWorkspaceId, mockUserId);

      expect(result.id).toBe(mockWorkspaceId);
      expect(result.currentUserRole).toBe(WorkspaceRole.OWNER);
    });

    it('should throw ForbiddenException if user is not an active member', async () => {
      prisma.workspaceMember.findUnique.mockResolvedValue(null);

      await expect(
        service.getWorkspaceById(mockWorkspaceId, mockUserId),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException if workspace is deleted or does not exist', async () => {
      prisma.workspaceMember.findUnique.mockResolvedValue(mockMember);
      prisma.workspace.findFirst.mockResolvedValue(null);

      await expect(
        service.getWorkspaceById(mockWorkspaceId, mockUserId),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateWorkspace', () => {
    it('should allow OWNER or ADMIN to update workspace details', async () => {
      prisma.workspaceMember.findUnique.mockResolvedValue(mockMember);
      prisma.workspace.findFirst.mockResolvedValue(mockWorkspace);
      prisma.workspace.update.mockResolvedValue({
        ...mockWorkspace,
        name: 'Acme Global',
      });

      const result = await service.updateWorkspace(mockWorkspaceId, mockUserId, {
        name: 'Acme Global',
      });

      expect(result.name).toBe('Acme Global');
    });

    it('should throw ForbiddenException if AGENT attempts to update workspace', async () => {
      prisma.workspaceMember.findUnique.mockResolvedValue({
        ...mockMember,
        role: WorkspaceRole.AGENT,
      });

      await expect(
        service.updateWorkspace(mockWorkspaceId, mockUserId, {
          name: 'Acme Global',
        }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('updateAiSettings', () => {
    it('should merge and update AI settings', async () => {
      prisma.workspaceMember.findUnique.mockResolvedValue(mockMember);
      prisma.workspace.findFirst.mockResolvedValue(mockWorkspace);
      prisma.workspace.update.mockResolvedValue({
        ...mockWorkspace,
        aiSettings: { systemPrompt: 'Updated prompt', temperature: 0.5 },
      });

      const result = await service.updateAiSettings(mockWorkspaceId, mockUserId, {
        systemPrompt: 'Updated prompt',
        temperature: 0.5,
      });

      expect(result.aiSettings).toEqual({
        systemPrompt: 'Updated prompt',
        temperature: 0.5,
      });
    });
  });

  describe('softDeleteWorkspace', () => {
    it('should allow OWNER to soft-delete workspace', async () => {
      prisma.workspaceMember.findUnique.mockResolvedValue(mockMember);
      prisma.workspace.findFirst.mockResolvedValue(mockWorkspace);
      prisma.workspace.update.mockResolvedValue({
        ...mockWorkspace,
        deletedAt: new Date(),
        status: WorkspaceStatus.SUSPENDED,
      });

      const result = await service.softDeleteWorkspace(
        mockWorkspaceId,
        mockUserId,
      );

      expect(result.success).toBe(true);
      expect(prisma.workspace.update).toHaveBeenCalledWith({
        where: { id: mockWorkspaceId },
        data: expect.objectContaining({
          status: WorkspaceStatus.SUSPENDED,
        }),
      });
    });

    it('should reject soft-deletion if caller is ADMIN instead of OWNER', async () => {
      prisma.workspaceMember.findUnique.mockResolvedValue({
        ...mockMember,
        role: WorkspaceRole.ADMIN,
      });

      await expect(
        service.softDeleteWorkspace(mockWorkspaceId, mockUserId),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});

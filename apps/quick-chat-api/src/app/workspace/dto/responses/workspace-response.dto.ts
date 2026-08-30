import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { WorkspaceRole, WorkspaceStatus } from '@quick-chat/prisma-client';

export class WorkspaceResponseDto {
  @ApiProperty({ example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' })
  id!: string;

  @ApiProperty({ example: 'Acme Corporation' })
  name!: string;

  @ApiProperty({ example: 'acme-corp' })
  slug!: string;

  @ApiProperty({ enum: WorkspaceStatus, example: WorkspaceStatus.ACTIVE })
  status!: WorkspaceStatus;

  @ApiPropertyOptional({
    description: 'Current user role inside this workspace (if queried in user context)',
    enum: WorkspaceRole,
    example: WorkspaceRole.OWNER,
  })
  currentUserRole?: WorkspaceRole;

  @ApiPropertyOptional({
    description: 'Configured AI settings for this workspace',
  })
  aiSettings?: Record<string, unknown> | null;

  @ApiProperty({ example: '2026-08-30T14:00:00.000Z' })
  createdAt!: Date;

  @ApiProperty({ example: '2026-08-30T14:00:00.000Z' })
  updatedAt!: Date;
}

import { ApiPropertyOptional } from '@nestjs/swagger';
import { WorkspaceStatus } from '@quick-chat/prisma-client';
import {
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class UpdateWorkspaceDto {
  @ApiPropertyOptional({
    description: 'Updated name of the workspace',
    example: 'Acme Global Ltd.',
  })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(60)
  name?: string;

  @ApiPropertyOptional({
    description: 'Workspace operational status',
    enum: WorkspaceStatus,
    example: WorkspaceStatus.ACTIVE,
  })
  @IsOptional()
  @IsEnum(WorkspaceStatus)
  status?: WorkspaceStatus;
}

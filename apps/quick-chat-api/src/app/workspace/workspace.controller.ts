import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateWorkspaceDto } from './dto/requests/create-workspace.dto';
import { UpdateAiSettingsDto } from './dto/requests/update-ai-settings.dto';
import { UpdateWorkspaceDto } from './dto/requests/update-workspace.dto';
import { WorkspaceResponseDto } from './dto/responses/workspace-response.dto';
import { WorkspaceService } from './workspace.service';

@ApiTags('Workspaces')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('workspaces')
export class WorkspaceController {
  constructor(private readonly workspaceService: WorkspaceService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new workspace' })
  @ApiCreatedResponse({
    description: 'Workspace created successfully with creator as OWNER',
    type: WorkspaceResponseDto,
  })
  create(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateWorkspaceDto,
  ): Promise<WorkspaceResponseDto> {
    return this.workspaceService.createWorkspace(userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all workspaces for current authenticated user' })
  @ApiOkResponse({
    description: 'List of workspaces where user has active membership',
    type: [WorkspaceResponseDto],
  })
  findUserWorkspaces(
    @CurrentUser('id') userId: string,
  ): Promise<WorkspaceResponseDto[]> {
    return this.workspaceService.getUserWorkspaces(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get workspace details by ID' })
  @ApiParam({ name: 'id', description: 'Workspace UUID' })
  @ApiOkResponse({
    description: 'Workspace details',
    type: WorkspaceResponseDto,
  })
  findById(
    @Param('id', new ParseUUIDPipe()) workspaceId: string,
    @CurrentUser('id') userId: string,
  ): Promise<WorkspaceResponseDto> {
    return this.workspaceService.getWorkspaceById(workspaceId, userId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update workspace general details (OWNER & ADMIN)' })
  @ApiParam({ name: 'id', description: 'Workspace UUID' })
  @ApiOkResponse({
    description: 'Updated workspace details',
    type: WorkspaceResponseDto,
  })
  update(
    @Param('id', new ParseUUIDPipe()) workspaceId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateWorkspaceDto,
  ): Promise<WorkspaceResponseDto> {
    return this.workspaceService.updateWorkspace(workspaceId, userId, dto);
  }

  @Patch(':id/ai-settings')
  @ApiOperation({ summary: 'Update workspace AI configuration (OWNER & ADMIN)' })
  @ApiParam({ name: 'id', description: 'Workspace UUID' })
  @ApiOkResponse({
    description: 'Updated workspace with new AI settings',
    type: WorkspaceResponseDto,
  })
  updateAiSettings(
    @Param('id', new ParseUUIDPipe()) workspaceId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateAiSettingsDto,
  ): Promise<WorkspaceResponseDto> {
    return this.workspaceService.updateAiSettings(workspaceId, userId, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Soft-delete workspace (OWNER only)' })
  @ApiParam({ name: 'id', description: 'Workspace UUID' })
  @ApiOkResponse({
    description: 'Workspace soft-deleted successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: {
          type: 'string',
          example: 'Workspace has been soft-deleted successfully',
        },
      },
    },
  })
  softDelete(
    @Param('id', new ParseUUIDPipe()) workspaceId: string,
    @CurrentUser('id') userId: string,
  ): Promise<{ success: boolean; message: string }> {
    return this.workspaceService.softDeleteWorkspace(workspaceId, userId);
  }
}

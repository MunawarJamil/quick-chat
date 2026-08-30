import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { UpdateAiSettingsDto } from './update-ai-settings.dto';

export class CreateWorkspaceDto {
  @ApiProperty({
    description: 'Name of the workspace / business',
    example: 'Acme Corporation',
    minLength: 2,
    maxLength: 60,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(60)
  name!: string;

  @ApiPropertyOptional({
    description: 'Unique URL-friendly slug. Auto-generated from name if omitted',
    example: 'acme-corp',
  })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(60)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'Slug must only contain lowercase alphanumeric characters separated by single hyphens',
  })
  slug?: string;

  @ApiPropertyOptional({
    description: 'Initial AI settings configuration',
    type: () => UpdateAiSettingsDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateAiSettingsDto)
  aiSettings?: UpdateAiSettingsDto;
}

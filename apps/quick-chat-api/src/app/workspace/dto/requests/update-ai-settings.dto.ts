import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class UpdateAiSettingsDto {
  @ApiPropertyOptional({
    description: 'System prompt instructions given to the AI bot',
    example: 'You are a helpful customer support agent for Acme Corp.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  systemPrompt?: string;

  @ApiPropertyOptional({
    description: 'Initial greeting message displayed to customers',
    example: 'Hello! How can I assist you today?',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  greetingMessage?: string;

  @ApiPropertyOptional({
    description: 'Fallback message when AI cannot answer from knowledge base',
    example: 'Let me connect you with a human agent for further assistance.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  fallbackMessage?: string;

  @ApiPropertyOptional({
    description: 'Temperature / creativity level for the LLM (0.0 to 1.0)',
    example: 0.2,
    minimum: 0,
    maximum: 1,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  temperature?: number;

  @ApiPropertyOptional({
    description: 'Confidence threshold for knowledge base RAG matching (0.0 to 1.0)',
    example: 0.7,
    minimum: 0,
    maximum: 1,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  confidenceThreshold?: number;

  @ApiPropertyOptional({
    description: 'Whether AI bot auto-replies to new incoming conversations',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isAiEnabled?: boolean;
}

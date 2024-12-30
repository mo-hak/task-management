import { IsString, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ProjectStatus } from '../types';

export class CreateProjectDto {
  @ApiProperty({ description: 'The name of the project' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'The description of the project', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ enum: ProjectStatus, description: 'The status of the project', required: false })
  @IsEnum(ProjectStatus)
  @IsOptional()
  status?: ProjectStatus;
} 
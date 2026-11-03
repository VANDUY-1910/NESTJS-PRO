import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  ValidateIf,
} from 'class-validator';

export class UpdateTaskDto {
  @ApiPropertyOptional({ maxLength: 255 })
  @ValidateIf((_object, value) => value !== undefined)
  @IsString({ message: 'TASK-FIELD-0001' })
  @IsNotEmpty({ message: 'TASK-FIELD-0001' })
  @Matches(/\S/, { message: 'TASK-FIELD-0001' })
  @MaxLength(255, { message: 'TASK-FIELD-0001' })
  title?: string;

  @ApiPropertyOptional({ maxLength: 255, nullable: true })
  @IsOptional()
  @IsString({ message: 'TASK-FIELD-0002' })
  @MaxLength(255, { message: 'TASK-FIELD-0002' })
  category?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString({ message: 'TASK-FIELD-0003' })
  description?: string | null;

  @ApiPropertyOptional()
  @ValidateIf((_object, value) => value !== undefined)
  @IsBoolean({ message: 'TASK-FIELD-0004' })
  isCompleted?: boolean;
}

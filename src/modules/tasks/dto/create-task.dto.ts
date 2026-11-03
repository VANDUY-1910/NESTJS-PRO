import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

export class CreateTaskDto {
  @ApiProperty({ maxLength: 255 })
  @IsString({ message: 'TASK-FIELD-0001' })
  @IsNotEmpty({ message: 'TASK-FIELD-0001' })
  @Matches(/\S/, { message: 'TASK-FIELD-0001' })
  @MaxLength(255, { message: 'TASK-FIELD-0001' })
  title: string;

  @ApiPropertyOptional({ maxLength: 255, nullable: true })
  @IsOptional()
  @IsString({ message: 'TASK-FIELD-0002' })
  @MaxLength(255, { message: 'TASK-FIELD-0002' })
  category?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString({ message: 'TASK-FIELD-0003' })
  description?: string | null;
}

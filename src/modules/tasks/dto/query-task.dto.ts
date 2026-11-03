import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class QueryTaskDto {
  @ApiPropertyOptional({ type: Boolean })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') {
      return true;
    }

    if (value === 'false') {
      return false;
    }

    return value;
  })
  @IsBoolean({ message: 'TASK-FIELD-0004' })
  isCompleted?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString({ message: 'TASK-FIELD-0002' })
  category?: string;
}

import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { MailProviderEnum } from '../mail.enum';

export class SendMailDto {
  @ApiProperty({ example: 'client@example.com', format: 'email' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsEmail()
  @IsNotEmpty()
  to: string;

  @ApiProperty({ example: 'Xác thực tài khoản' })
  @IsString()
  @IsNotEmpty()
  subject: string;

  @ApiProperty({ example: '<h1>Mã OTP của bạn là: 123456</h1>' })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiPropertyOptional({
    enum: MailProviderEnum,
    example: MailProviderEnum.SMTP,
  })
  @IsOptional()
  @IsEnum(MailProviderEnum)
  provider?: MailProviderEnum;
}

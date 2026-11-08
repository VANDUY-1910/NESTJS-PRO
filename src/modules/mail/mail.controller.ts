import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SendMailDto } from './dto/send-mail.dto';
import { MailService } from './mail.service';

@Controller('v1/mail')
@ApiTags('mail')
export class MailController {
  constructor(private readonly mailService: MailService) {}

  @Post('send')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send an email' })
  @ApiOkResponse({
    description: 'Email sent successfully',
    schema: { type: 'boolean', example: true },
  })
  sendMail(@Body() dto: SendMailDto): Promise<boolean> {
    return this.mailService.sendMail(dto);
  }
}

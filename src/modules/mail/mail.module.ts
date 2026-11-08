import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MailController } from './mail.controller';
import { MailService } from './mail.service';
import { MockMailProvider } from './providers/mock-mail.provider';
import { SmtpMailProvider } from './providers/smtp-mail.provider';

@Module({
  imports: [ConfigModule],
  controllers: [MailController],
  providers: [MailService, SmtpMailProvider, MockMailProvider],
  exports: [MailService],
})
export class MailModule {}

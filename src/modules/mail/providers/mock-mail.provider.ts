import { Injectable, Logger } from '@nestjs/common';
import { IMailProvider } from '../interfaces/mail-provider.interface';
import { MailProviderEnum } from '../mail.enum';

@Injectable()
export class MockMailProvider implements IMailProvider {
  readonly providerName = MailProviderEnum.MOCK;
  private readonly logger = new Logger(MockMailProvider.name);

  async sendMail(
    to: string,
    subject: string,
    content: string,
  ): Promise<boolean> {
    this.logger.log(
      `[MOCK MAIL SENT] To: ${to} | Subject: ${subject} | Content: ${content}`,
    );
    return true;
  }
}

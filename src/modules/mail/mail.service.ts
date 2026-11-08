import { BadRequestException, Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SendMailDto } from './dto/send-mail.dto';
import { IMailProvider } from './interfaces/mail-provider.interface';
import { MailProviderEnum } from './mail.enum';
import { MockMailProvider } from './providers/mock-mail.provider';
import { SmtpMailProvider } from './providers/smtp-mail.provider';

@Injectable()
export class MailService implements OnModuleInit {
  private readonly providersRegistry = new Map<string, IMailProvider>();

  constructor(
    private readonly smtpMailProvider: SmtpMailProvider,
    private readonly mockMailProvider: MockMailProvider,
    private readonly configService: ConfigService,
  ) {}

  onModuleInit(): void {
    this.providersRegistry.set(
      this.smtpMailProvider.providerName,
      this.smtpMailProvider,
    );
    this.providersRegistry.set(
      this.mockMailProvider.providerName,
      this.mockMailProvider,
    );
  }

  async sendMail(dto: SendMailDto): Promise<boolean> {
    const selectedProviderKey = (
      dto.provider ??
      this.configService.get<string>(
        'DEFAULT_MAIL_PROVIDER',
        MailProviderEnum.MOCK,
      )
    ).toLowerCase();
    const provider = this.providersRegistry.get(selectedProviderKey);

    if (!provider) {
      throw new BadRequestException(
        `Mail provider "${selectedProviderKey}" is not registered`,
      );
    }

    return provider.sendMail(dto.to, dto.subject, dto.content);
  }
}

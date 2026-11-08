import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createTransport, Transporter } from 'nodemailer';
import { IMailProvider } from '../interfaces/mail-provider.interface';
import { MailProviderEnum } from '../mail.enum';

@Injectable()
export class SmtpMailProvider implements IMailProvider {
  readonly providerName = MailProviderEnum.SMTP;
  private readonly transporter: Transporter;
  private readonly mailFrom: string;

  constructor(private readonly configService: ConfigService) {
    const port = Number(this.configService.get<string>('SMTP_PORT', '587'));
    const user = this.configService.get<string>('SMTP_USER');
    const pass = this.configService.get<string>('SMTP_PASS');

    this.mailFrom = this.configService.get<string>('MAIL_FROM') || user;
    this.transporter = createTransport({
      host: this.configService.get<string>('SMTP_HOST'),
      port,
      secure: port === 465,
      ...(user && pass ? { auth: { user, pass } } : {}),
    });
  }

  async sendMail(
    to: string,
    subject: string,
    content: string,
  ): Promise<boolean> {
    await this.transporter.sendMail({
      from: this.mailFrom,
      to,
      subject,
      html: content,
    });

    return true;
  }
}

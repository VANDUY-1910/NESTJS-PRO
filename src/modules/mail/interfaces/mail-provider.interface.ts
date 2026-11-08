export interface IMailProvider {
  readonly providerName: string;
  sendMail(to: string, subject: string, content: string): Promise<boolean>;
}

import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createTransport, Transporter } from 'nodemailer';
import { Logger } from '../utils/logger';

export class EmailError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'EmailError';
  }
}

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

@Injectable()
export class EmailNotifier implements OnModuleInit {
  private transporter: Transporter | null = null;
  private isInitialized = false;
  private fromEmail: string;
  private toEmail: string;
  private defaultSubject: string;

  constructor(
    private readonly logger: Logger,
    private readonly config: ConfigService,
  ) {
    this.fromEmail =
      this.config.get<string>('EMAIL_FROM') || 'auto-healing@example.com';
    this.toEmail = this.config.get<string>('EMAIL_TO') || 'admin@example.com';
    this.defaultSubject =
      this.config.get<string>('EMAIL_SUBJECT') ||
      'Auto Self-Healing System Alert';
  }

  async onModuleInit(): Promise<void> {
    try {
      await this.initializeTransporter();
    } catch (error) {
      this.handleError(
        'Email service initialization failed',
        error,
        'warn',
        false,
      );
    }
  }

  private async initializeTransporter(): Promise<void> {
    const host = this.config.get<string>('SMTP_HOST');
    const port = this.config.get<number>('SMTP_PORT');
    const user = this.config.get<string>('SMTP_USER');
    const pass = this.config.get<string>('SMTP_PASS');

    if (!host || !port || !user || !pass) {
      this.logger.warn(
        'Email configuration incomplete, email notifications disabled',
      );
      return;
    }

    this.transporter = createTransport({
      host,
      port,
      auth: { user, pass },
      secure: port === 465,
    });

    // Test the connection
    try {
      await this.transporter.verify();
      this.isInitialized = true;
      this.logger.info('Email service initialized successfully');
    } catch (error) {
      this.transporter = null;
      throw error;
    }
  }

  private formatMessage(message: string): string {
    const timestamp = new Date().toISOString();
    return `[${timestamp}] ${message}`;
  }

  private handleError(
    message: string,
    error: any,
    level: 'warn' | 'error' = 'error',
    throwError = false,
  ): void {
    const errorMessage = error instanceof Error ? error.message : String(error);
    this.logger[level](`${message}: ${errorMessage}`);

    if (throwError) {
      throw new EmailError(`${message}: ${errorMessage}`);
    }
  }

  async notify(
    message: string,
    options: Partial<EmailOptions> = {},
  ): Promise<void> {
    if (!this.isInitialized) {
      throw new EmailError('Email service not initialized');
    }

    if (!this.transporter) {
      throw new EmailError('Email transporter not available');
    }

    try {
      const formattedMessage = this.formatMessage(message);
      await this.transporter.sendMail({
        from: this.fromEmail,
        to: options.to ?? this.toEmail,
        subject: options.subject ?? this.defaultSubject,
        text: formattedMessage,
        html: options.html ?? formattedMessage.replace(/\n/g, '<br>'),
      });
      this.logger.info('Email notification sent successfully');
    } catch (error) {
      this.handleError(
        'Failed to send email notification',
        error,
        'error',
        true,
      ); // Throw رو فعال کن
    }
  }
}

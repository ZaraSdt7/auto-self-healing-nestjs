import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Logger } from '../utils/logger';
import * as nodemailer from 'nodemailer';
import { EmailOptions, SmtpConfig } from './interface/email.interface';

/**
 * Custom error class for email-related errors
 */
class EmailError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'EmailError';
  }
}

/**
 * Service for sending email notifications
 * Handles SMTP configuration, connection management, and email delivery
 */
@Injectable()
export class EmailNotifier implements OnModuleInit {
  private transporter: nodemailer.Transporter | null = null;
  private readonly fromEmail: string;
  private readonly toEmail: string;
  private readonly defaultSubject = 'Auto-Self Healing Alert';
  private isInitialized = false;
  private initializationAttempts = 0;
  private readonly maxInitAttempts = 3;
  private lastError: Error | null = null;

  constructor(
    private readonly logger: Logger,
    private readonly configService: ConfigService,
  ) {
    try {
      this.fromEmail = this.configService.getOrThrow<string>('EMAIL_FROM');
      this.toEmail = this.configService.getOrThrow<string>('EMAIL_TO');
      this.validateEmailAddresses();
    } catch (error) {
      this.handleError(
        'Email configuration error',
        error,
        'warn',
        false, // Don't throw during construction
      );
    }
  }

  /**
   * Initialize the email service when the module starts
   */
  async onModuleInit(): Promise<void> {
    try {
      await this.initializeTransporter();
    } catch (error) {
      this.handleError(
        'Email service initialization failed',
        error,
        'warn',
        false, // Don't throw to allow application to start
      );
    }
  }

  /**
   * Check if the email service is healthy
   * @returns True if the service is initialized and connected
   */
  async isHealthy(): Promise<boolean> {
    if (!this.isInitialized || !this.transporter) {
      return false;
    }

    try {
      await this.transporter.verify();
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Attempt to repair the email service if it's not working
   * @returns True if repair was successful
   */
  async attemptRepair(): Promise<boolean> {
    if (await this.isHealthy()) {
      return true; // Already healthy
    }

    this.logger.info('Attempting to repair email service');

    try {
      // Reset state
      this.isInitialized = false;
      this.transporter = null;
      this.initializationAttempts = 0;

      // Try to initialize again
      await this.initializeTransporter();

      const isHealthy = await this.isHealthy();
      if (isHealthy) {
        this.logger.info('Email service repaired successfully');
      }
      return isHealthy;
    } catch (error) {
      this.handleError('Failed to repair email service', error, 'error', false);
      return false;
    }
  }

  /**
   * Get the last error that occurred in the email service
   * @returns The last error or null if no error occurred
   */
  getLastError(): Error | null {
    return this.lastError;
  }

  /**
   * Send an email notification
   * @param message The message content
   * @param options Optional configuration for the email
   */
  async notify(
    message: string,
    options: Partial<EmailOptions> = {},
  ): Promise<void> {
    // Try to initialize if not already initialized
    if (!this.isInitialized) {
      try {
        await this.initializeTransporter();
      } catch (error) {
        this.handleError(
          'Failed to initialize email service for notification',
          error,
          'error',
          false, // Don't throw for notifications
        );
        return;
      }
    }

    if (!this.transporter) {
      this.logger.warn('Email service not available. Skipping notification.');
      return;
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
        false, // Don't throw for notifications
      );
    }
  }

  /**
   * Validate email addresses format
   * @throws EmailError if email addresses are invalid
   */
  private validateEmailAddresses(): void {
    if (!this.fromEmail || !this.toEmail) {
      throw new EmailError('Email addresses not configured');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.fromEmail)) {
      throw new EmailError(`Invalid from email address: ${this.fromEmail}`);
    }
    if (!emailRegex.test(this.toEmail)) {
      throw new EmailError(`Invalid to email address: ${this.toEmail}`);
    }
  }

  /**
   * Initialize the email transporter
   * @throws EmailError if initialization fails
   */
  private async initializeTransporter(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    if (this.initializationAttempts >= this.maxInitAttempts) {
      throw new EmailError(
        `Maximum initialization attempts (${this.maxInitAttempts}) reached`,
      );
    }

    this.initializationAttempts++;

    try {
      const config = this.createSmtpConfig();
      this.transporter = nodemailer.createTransport(config);
      await this.verifyConnection();
      this.isInitialized = true;
      this.lastError = null;
      this.logger.info('Email service initialized successfully');
    } catch (error) {
      this.isInitialized = false;
      this.transporter = null;
      this.lastError = this.createError(
        'Failed to initialize email transporter',
        error,
      );
      throw this.lastError;
    }
  }

  /**
   * Create SMTP configuration from environment variables
   * @returns SMTP configuration object
   * @throws EmailError if configuration is invalid
   */
  private createSmtpConfig(): SmtpConfig {
    try {
      const smtpHost = this.configService.getOrThrow<string>('SMTP_HOST');
      const smtpPort = this.configService.get<number>('SMTP_PORT', 587);
      const smtpUser = this.configService.getOrThrow<string>('SMTP_USER');
      const smtpPass = this.configService.getOrThrow<string>('SMTP_PASS');

      return {
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      };
    } catch (error) {
      throw this.createError('SMTP configuration error', error);
    }
  }

  /**
   * Verify connection to the SMTP server
   * @throws EmailError if connection fails
   */
  private async verifyConnection(): Promise<void> {
    if (!this.transporter) {
      throw new EmailError('Transporter not initialized');
    }

    try {
      await this.transporter.verify();
      this.logger.info('Successfully connected to SMTP server');
    } catch (error) {
      throw this.createError('SMTP connection verification failed', error);
    }
  }

  /**
   * Format a message with timestamp and standard layout
   * @param message The message to format
   * @returns Formatted message string
   */
  private formatMessage(message: string): string {
    const timestamp = new Date().toISOString();
    return [
      'Auto-Self Healing Alert',
      '',
      message,
      '',
      `Time: ${timestamp}`,
    ].join('\n');
  }

  /**
   * Create an EmailError with the given message and cause
   * @param message Error message
   * @param cause Original error
   * @returns EmailError instance
   */
  private createError(message: string, cause: unknown): EmailError {
    const errorMessage = this.formatErrorMessage(cause);
    return new EmailError(`${message}: ${errorMessage}`, cause);
  }

  /**
   * Handle errors consistently across the service
   * @param message Error message prefix
   * @param error The error that occurred
   * @param level Log level to use
   * @param shouldThrow Whether to throw the error
   * @throws EmailError if shouldThrow is true
   */
  private handleError(
    message: string,
    error: unknown,
    level: 'error' | 'warn' = 'error',
    shouldThrow = true,
  ): void {
    const errorMessage = this.formatErrorMessage(error);

    if (level === 'error') {
      this.logger.error(message, errorMessage);
    } else {
      this.logger.warn(`${message}: ${errorMessage}`);
    }

    // Store the last error for diagnostics
    this.lastError = error instanceof Error ? error : new Error(errorMessage);

    if (shouldThrow) {
      throw this.createError(message, error);
    }
  }

  /**
   * Format an error for logging, handling different error types
   * @param error The error to format
   * @returns Formatted error message
   */
  private formatErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }
    if (error === null) {
      return 'null';
    }
    if (error === undefined) {
      return 'undefined';
    }
    if (typeof error === 'object') {
      try {
        return JSON.stringify(error);
      } catch {
        return '[Complex Object]';
      }
    }
    // Safe handling for primitives
    switch (typeof error) {
      case 'string':
        return error;
      case 'number':
        return error.toString();
      case 'boolean':
        return error ? 'true' : 'false';
      case 'function':
        return '[Function]';
      case 'symbol':
        return error.toString();
      case 'bigint':
        return error.toString();
      default:
        return `[${typeof error}]`;
    }
  }
}

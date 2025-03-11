import { Injectable } from '@nestjs/common';
import { Logger } from '../utils/logger';
import { Cron } from '@nestjs/schedule';
import { NpmAuditService } from '../integrations/npm-audit';

@Injectable()
export class SecurityPatcher {
  constructor(
    private logger: Logger,
    private npmAudit: NpmAuditService,
  ) {
    this.logger.info('Security patching started');
  }

  @Cron('0 0 * * *') // every day at midnight
  async checkSecurity() {
    this.logger.info('Checking for security vulnerabilities...');
    const vulnerabilities = await this.npmAudit.runAudit();

    if (vulnerabilities.length > 0) {
      this.logger.warn(
        `Found ${vulnerabilities.length} vulnerabilities: ${JSON.stringify(vulnerabilities)}`,
      );
    } else {
      this.logger.info('No security vulnerabilities found');
    }
  }
}

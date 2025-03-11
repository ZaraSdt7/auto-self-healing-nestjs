import { Injectable } from '@nestjs/common';
import { Logger } from '../utils/logger';
import { exec } from 'child_process';
import { promisify } from 'util';
import { NpmAuditResult, VulnerabilityInfo } from './interface/npm.interface';

const execAsync = promisify(exec);

@Injectable()
export class NpmAuditService {
  constructor(private readonly logger: Logger) {}

  async runAudit(): Promise<VulnerabilityInfo[]> {
    try {
      this.logger.info('Running npm audit...');
      const { stdout } = await execAsync('npm audit --json');

      // Parse with error handling
      let auditData: NpmAuditResult;
      try {
        auditData = JSON.parse(stdout) as NpmAuditResult;
      } catch (parseError) {
        this.logger.error('Failed to parse npm audit output', parseError);
        return [];
      }

      if (!auditData.vulnerabilities) {
        this.logger.info('No vulnerabilities found');
        return [];
      }

      const vulnerabilities = Object.entries(auditData.vulnerabilities).map(
        ([name, data]) => ({
          name,
          severity: data.severity,
          fixAvailable: !!data.fixAvailable,
        }),
      );

      this.logger.info(`Found ${vulnerabilities.length} vulnerabilities`);
      return vulnerabilities;
    } catch (error) {
      this.logger.error(
        'NPM audit failed',
        error instanceof Error ? error.message : String(error),
      );
      return [];
    }
  }

  async fixVulnerabilities(): Promise<boolean> {
    try {
      this.logger.info('Attempting to fix vulnerabilities...');
      await execAsync('npm audit fix');
      this.logger.info('Vulnerabilities fixed successfully');
      return true;
    } catch (error) {
      this.logger.error(
        'Failed to fix vulnerabilities',
        error instanceof Error ? error.message : String(error),
      );
      return false;
    }
  }
}

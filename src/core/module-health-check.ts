import { Injectable } from '@nestjs/common';
import { Logger } from '../utils/logger';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class ModuleHealthCheck {
  constructor(private logger: Logger) {
    this.logger.info('ModuleHealthCheck initialized');
  }

  @Cron(CronExpression.EVERY_5_MINUTES)
  async checkHealth() {
    this.logger.info('Performing module health check...');

    const healthStatus = await this.performChecks();
    if (!healthStatus.isHealthy) {
      this.logger.warn(
        `Module health issues detected: ${healthStatus.details.join(', ')}`,
      );
    } else {
      this.logger.info('All modules are healthy');
    }
  }

  private async performChecks(): Promise<{
    isHealthy: boolean;
    details: string[];
  }> {
    const details: string[] = [];
    let isHealthy = true;

    // Check for memory usage
    const memoryUsage = process.memoryUsage().rss / 1024 / 1024;
    if (memoryUsage > 150) {
      isHealthy = false;
      details.push(`High memory usage: ${memoryUsage.toFixed(2)} MB`);
    }

    // Add a simulated API response time check with await
    const responseTime = await Promise.resolve(this.simulateResponseTime());
    if (responseTime > 500) {
      isHealthy = false;
      details.push(`Slow response time: ${responseTime}ms`);
    }

    return { isHealthy, details };
  }

  private simulateResponseTime(): number {
    return Math.random() * 2000; // 0 to 2000 milliseconds
  }
}

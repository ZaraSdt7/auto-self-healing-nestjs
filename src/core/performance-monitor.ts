import { Injectable } from '@nestjs/common';
import { Logger } from '../utils/logger';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class PerformanceMonitor {
  constructor(private logger: Logger) {
    this.logger.info('Performance monitoring started');
  }

  @Cron(CronExpression.EVERY_MINUTE) // every minutes
  checkPerformance() {
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();

    const memoryMb = memoryUsage.rss / 1024 / 1024;
    if (memoryMb > 100) {
      this.logger.warn(`High memory usage detected: ${memoryMb.toFixed(2)} MB`);
    }

    this.logger.debug(
      `Memory: ${memoryMb.toFixed(2)} MB, CPU: ${cpuUsage.user / 1000}ms user time`,
    );
  }
}

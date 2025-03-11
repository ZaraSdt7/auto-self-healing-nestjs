import { Injectable } from '@nestjs/common';
import { Logger } from './logger';

@Injectable()
export class ResourceOptimizer {
  constructor(private logger: Logger) {}

  optimizeResources(): { cpuThreshold: number; memoryThreshold: number } {
    const memoryUsage = process.memoryUsage().rss / 1024 / 1024; // megabytes
    const cpuUsage = process.cpuUsage().user / 1000; // milliseconds

    const cpuThreshold = 80; // 80% CPU usage
    const memoryThreshold = 200; // 200 MB memory usage

    if (memoryUsage > memoryThreshold) {
      this.logger.warn(
        `Memory usage exceeds threshold: ${memoryUsage.toFixed(2)} MB > ${memoryThreshold} MB`,
      );
      this.suggestMemoryOptimization();
    }

    if (cpuUsage > cpuThreshold) {
      this.logger.warn(
        `CPU usage exceeds threshold: ${cpuUsage.toFixed(2)}ms > ${cpuThreshold}ms`,
      );
      this.suggestCpuOptimization();
    }

    return { cpuThreshold, memoryThreshold };
  }

  private suggestMemoryOptimization() {
    this.logger.info(
      'Suggestions: Clear unused variables, reduce object allocations',
    );
  }

  private suggestCpuOptimization() {
    this.logger.info(
      'Suggestions: Optimize loops, reduce synchronous operations',
    );
  }
}

import { Logger } from 'src/utils/logger';

export class PerformanceMonitor {
  private monitoringInterval: NodeJS.Timeout | null = null;
  private memoryThreshold = 200; // MB

  constructor(private logger: Logger) {}

  startMonitoring(intervalMs = 5000): void {
    if (this.monitoringInterval) {
      this.logger.warn('Performance monitoring already started');
      return;
    }

    this.monitoringInterval = setInterval(() => {
      this.checkMemoryUsage();
    }, intervalMs);

    this.logger.info('Performance monitoring started');
  }

  stopMonitoring(): void {
    if (!this.monitoringInterval) {
      return;
    }

    clearInterval(this.monitoringInterval);
    this.monitoringInterval = null;
    this.logger.info('Performance monitoring stopped');
  }

  setMemoryThreshold(thresholdMB: number): void {
    this.memoryThreshold = thresholdMB;
    this.logger.info(`Memory threshold updated: ${thresholdMB}MB`);
  }

  private checkMemoryUsage(): void {
    const memoryUsage = process.memoryUsage();
    const heapUsedMB = Math.round(memoryUsage.heapUsed / 1024 / 1024);

    if (heapUsedMB > this.memoryThreshold) {
      this.logger.warn(`High memory usage: ${heapUsedMB} MB`);
      this.optimizeMemory();
    }
  }

  private optimizeMemory(): void {
    if (typeof global.gc === 'function') {
      global.gc();
      this.logger.info('Memory optimized');
    } else {
      this.logger.warn(
        'Manual garbage collection not available. Start with --expose-gc flag',
      );
    }
  }
}

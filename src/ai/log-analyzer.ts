import { Injectable } from '@nestjs/common';
import { Logger } from '../utils/logger';

@Injectable()
export class LogAnalyzer {
  private logs: { timestamp: number; message: string }[] = [];

  constructor(private logger: Logger) {
    this.logger.info('LogAnalyzer initialized');
  }

  addLog(message: string) {
    this.logs.push({ timestamp: Date.now(), message });
    if (this.logs.length > 1000) this.logs.shift();
    this.logger.debug(`Log added: ${message}`);
  }

  getRecentLogs(minutes = 5): string[] {
    const cutoff = Date.now() - minutes * 60 * 1000;
    return this.logs
      .filter((log) => log.timestamp > cutoff)
      .map((log) => log.message);
  }

  analyzePatterns(): { pattern: string; frequency: number }[] {
    const patterns: { [key: string]: number } = {};
    this.logs.forEach((log) => {
      const key = log.message.split(' ')[0];
      patterns[key] = (patterns[key] || 0) + 1;
    });
    return Object.entries(patterns)
      .map(([pattern, frequency]) => ({ pattern, frequency }))
      .sort((a, b) => b.frequency - a.frequency);
  }
}

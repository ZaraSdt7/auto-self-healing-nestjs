import { Injectable } from '@nestjs/common';
import { Logger } from '../utils/logger';
import { LogAnalyzer } from './log-analyzer';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ErrorPrediction } from 'src/ai/interface/ai.interface';

// Define the interface locally instead of importing it

@Injectable()
export class ErrorPredictor {
  private logAnalyzer: LogAnalyzer;

  constructor(private logger: Logger) {
    this.logAnalyzer = new LogAnalyzer(this.logger);
    this.logger.info('ErrorPredictor initialized');
  }

  @Cron(CronExpression.EVERY_10_SECONDS) // every 10 sec
  async predictErrors() {
    const recentLogs = await Promise.resolve(this.logAnalyzer.getRecentLogs());
    const prediction = this.analyzeLogs(recentLogs);

    if (prediction.confidence > 0.8) {
      this.logger.warn(
        `Potential error predicted: ${prediction.message} (Confidence: ${(prediction.confidence * 100).toFixed(2)}%)`,
      );
    } else {
      this.logger.debug('No significant error patterns detected');
    }
  }

  private analyzeLogs(logs: string[]): ErrorPrediction {
    const errorCount = logs.filter((log) =>
      log.toLowerCase().includes('error'),
    ).length;
    const slowCount = logs.filter((log) =>
      log.toLowerCase().includes('slow'),
    ).length;
    const totalLogs = logs.length || 1; // Prevent division by zero

    if (errorCount / totalLogs > 0.3) {
      // more than 30% less
      return { message: 'High error rate detected', confidence: 0.9 };
    }
    if (slowCount / totalLogs > 0.2) {
      //more than 20% less
      return {
        message: 'Potential performance issue detected',
        confidence: 0.85,
      };
    }
    return { message: 'No issues detected', confidence: 0 };
  }

  addLog(message: string) {
    this.logAnalyzer.addLog(message);
  }
}

import { Injectable } from '@nestjs/common';
import { Logger } from '../utils/logger';
import { LearningData, RepairSuggestion } from './interface/repair.interface';

@Injectable()
export class SelfLearningRepair {
  private repairs: Map<string, LearningData> = new Map();

  constructor(private logger: Logger) {}

  suggestFix(errorMessage: string): RepairSuggestion | null {
    const data = this.repairs.get(errorMessage);
    if (!data) return null;

    const total = data.successCount + data.failCount;
    const confidence = total > 0 ? data.successCount / total : 0;
    this.logger.debug(
      `Suggested fix for "${errorMessage}": ${data.solution} (confidence: ${confidence})`,
    );
    return { solution: data.solution, confidence };
  }

  learn(errorMessage: string, solution: string, success: boolean): void {
    const data = this.repairs.get(errorMessage) || {
      solution,
      successCount: 0,
      failCount: 0,
    };
    if (success) data.successCount++;
    else data.failCount++;

    this.repairs.set(errorMessage, data);
    this.logger.info(
      `Learned fix for "${errorMessage}": ${solution} (success: ${success})`,
    );
  }

  updateConfidence(
    errorMessage: string,
    solution: string,
    success: boolean,
  ): void {
    const data = this.repairs.get(errorMessage);
    if (!data) {
      this.learn(errorMessage, solution, success);
      return;
    }

    if (success) data.successCount++;
    else data.failCount++;

    this.repairs.set(errorMessage, data);
  }

  getLearningReport(): Record<
    string,
    { solution: string; confidence: number }
  > {
    const report: Record<string, { solution: string; confidence: number }> = {};

    this.repairs.forEach((data, errorMessage) => {
      const total = data.successCount + data.failCount;
      const confidence = total > 0 ? data.successCount / total : 0;
      report[errorMessage] = {
        solution: data.solution,
        confidence,
      };
    });

    return report;
  }
}

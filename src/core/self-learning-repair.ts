import { RedisClient } from 'src/db/redis-client';
import { Logger } from 'src/utils/logger';
import { RepairRecord } from './interface/repair.interface';

export class SelfLearningRepair {
  private redis: RedisClient;

  constructor(private logger: Logger) {
    this.redis = new RedisClient(logger);
  }

  async learn(
    error: string,
    success: boolean,
    solution: string = 'self-learning',
  ): Promise<void> {
    const confidence = success ? 1 : 0;
    const record: RepairRecord = {
      error,
      solution,
      timestamp: new Date(),
      success,
      confidence,
    };

    const key = this.getKey(error, record.solution);
    await this.redis.Set(key, { data: JSON.stringify(record) });
    await this.redis.zAdd('repairs', confidence, error);
  }

  async getRepairSuggestions(
    error: string,
  ): Promise<{ solution: string; confidence: number } | null> {
    const results = await this.redis.RangeWithScores(
      `repairs:${error}`,
      -1,
      -1,
    );

    if (!results?.length) return null;

    const topResult = results[0];
    if (!topResult?.score || topResult.score <= 0) return null;

    const { value, score: confidence } = topResult;

    this.logger.debug(
      `Suggested fix for ${error}: ${value} (${confidence * 100}%)`,
    );

    return { solution: value, confidence };
  }

  async updateConfidence(
    error: string,
    solution: string,
    success: boolean,
  ): Promise<void> {
    const current = await this.getRepairSuggestions(error);
    const key = this.getKey(error, solution);

    if (!current || current.solution !== solution) {
      if (success) await this.learn(error, success, solution);
      return;
    }

    const newConfidence = this.calculateConfidence(current.confidence, success);
    await this.redis.Set(key, {
      confidence: newConfidence.toString(),
      success: success ? '1' : '0',
    });
    await this.redis.zAdd(`repairs:${error}`, newConfidence, solution);
    this.logger.info(
      `Updated confidence for ${error} -> ${solution}: ${newConfidence}`,
    );
  }

  private calculateConfidence(current: number, success: boolean): number {
    const adjustment = success ? 0.1 : -0.1;
    return Math.min(Math.max(current + adjustment, 0), 1);
  }

  async getLearningReport(): Promise<
    Array<{
      error: string;
      bestSolution: string;
      confidence: number;
    }>
  > {
    const keys = await this.redis.keys('repairs:*');
    const report: Array<{
      error: string;
      bestSolution: string;
      confidence: number;
    }> = [];

    for (const key of keys) {
      const error = key.replace('repairs:', '');
      const results = await this.redis.RangeWithScores(key, -1, -1);

      if (results?.length) {
        report.push({
          error,
          bestSolution: results[0].value,
          confidence: results[0].score,
        });
      }
    }

    this.logger.info('Generated learning report');
    return report;
  }

  private getKey(error: string, solution: string): string {
    return `repair:${error}:${solution}`;
  }
}

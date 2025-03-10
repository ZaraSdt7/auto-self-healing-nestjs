/* eslint-disable */
import { Logger } from '../utils/logger';
import { createClient } from 'redis';
import { RedisClientInterface } from './redis.interface';

export class RedisClient {
  private client: RedisClientInterface;

  constructor(
    private logger: Logger,
    private redisUrl: string = 'redis://localhost:6379',
  ) {
    this.client = createClient({ url: this.redisUrl }) as unknown as RedisClientInterface;
    this.client.on('error', (err) =>
      this.logger.error('Redis connection error', err),
    );
    this.connect().catch(err => this.logger.error('Redis connection failed', err));
  }

  private async connect() {
    await this.client.connect();
    this.logger.info('Connected to Redis');
  }

  async Set(key: string, data: Record<string, string>) {
    await this.client.Set(key, data);
  }

  async GetAll(key: string): Promise<Record<string, string>> {
    return await this.client.GetAll(key);
  }

  async zAdd(key: string, score: number, value: string) {
    await this.client.Add(key, { score, value });
  }

  async RangeWithScores(key: string, start: number, end: number) {
    return await this.client.RangeWithScores(key, start, end);
  }

  async keys(pattern: string): Promise<string[]> {
    return await this.client.keys(pattern);
  }

  async clearAll() {
    await this.client.clearAll();
    this.logger.info('Redis data cleared');
  }
}

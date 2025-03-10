export interface RedisClientInterface {
  connect(): Promise<void>;
  on(event: string, listener: (arg: any) => void): void;
  Set(key: string, data: Record<string, string>): Promise<number>;
  GetAll(key: string): Promise<Record<string, string>>;
  Add(key: string, args: { score: number; value: string }): Promise<number>;
  RangeWithScores(
    key: string,
    start: number,
    end: number,
  ): Promise<Array<{ score: number; value: string }>>;
  keys(pattern: string): Promise<string[]>;
  clearAll(): Promise<string>;
}

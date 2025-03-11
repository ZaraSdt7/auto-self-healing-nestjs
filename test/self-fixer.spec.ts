import { SelfFixer } from '../src/core/self-fixer';
import { Logger } from '../src/utils/logger';
import { GithubService } from '../src/integrations/github.service';
import { ConfigService } from '@nestjs/config';

describe('SelfFixer', () => {
  let fixer: SelfFixer;
  let logger: Logger;
  let githubService: GithubService;

  beforeEach(() => {
    logger = new Logger();
    const configService = new ConfigService({ GITHUB_TOKEN: 'test-token' });
    githubService = new GithubService(logger, configService);
    fixer = new SelfFixer(logger, githubService);
  });

  it('should attempt to fix database connection error', async () => {
    jest.spyOn(fixer as any, 'fixDatabaseConnection').mockResolvedValue(true);
    const result = await fixer.attemptFix(
      new Error('database connection failed'),
    );
    expect(result).toBe(true);
  });

  it('should create PR if no fix is found', async () => {
    const createPRSpy = jest
      .spyOn(githubService, 'createPullRequest')
      .mockResolvedValue('http://pr-url');
    const result = await fixer.attemptFix(new Error('unknown error'));
    expect(createPRSpy).toHaveBeenCalled();
    expect(result).toBe(false);
  });
});

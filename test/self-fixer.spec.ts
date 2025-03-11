import { Test, TestingModule } from '@nestjs/testing';
import { SelfFixer } from '../src/core/self-fixer';
import { GithubService } from '../src/integrations/github.service';
import { Logger } from '../src/utils/logger';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { of } from 'rxjs';

describe('SelfFixer', () => {
  let selfFixer: SelfFixer;
  let githubService: GithubService;
  let logger: Logger;
  let mockGetRepo: jest.Mock;
  let mockLogInfo: jest.Mock;
  let mockLogError: jest.Mock;

  beforeEach(async () => {
    mockGetRepo = jest.fn().mockResolvedValue({ name: 'mock-repo' });
    mockLogInfo = jest.fn();
    mockLogError = jest.fn();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SelfFixer,
        {
          provide: GithubService,
          useValue: {
            getRepo: mockGetRepo,
          },
        },
        {
          provide: HttpService,
          useValue: {
            get: jest.fn(() => of({ data: { name: 'mock-repo' } })),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('mock-token'),
          },
        },
        {
          provide: Logger,
          useValue: {
            log: jest.fn(),
            info: mockLogInfo,
            error: mockLogError,
            warn: jest.fn(),
          },
        },
      ],
    }).compile();

    selfFixer = module.get<SelfFixer>(SelfFixer);
    githubService = module.get<GithubService>(GithubService);
    logger = module.get<Logger>(Logger);
  });

  it('should be defined', () => {
    expect(selfFixer).toBeDefined();
    expect(githubService).toBeDefined();
    expect(logger).toBeDefined();
  });

  it('should attempt to fix an error', async () => {
    const result = await selfFixer.attemptFix(new Error('Test error'));
    expect(result).toBeDefined();
    expect(mockLogInfo).toHaveBeenCalledWith(
      expect.stringContaining('Attempting to fix'),
    );
  });

  it('should handle database connection errors', async () => {
    // Mock the private method using type assertion
    jest
      .spyOn(selfFixer as any, 'fixDatabaseConnection')
      .mockResolvedValue(true);

    const result = await selfFixer.attemptFix(
      new Error('database connection failed'),
    );

    expect(result).toBe(true);
    expect(mockLogInfo).toHaveBeenCalledWith(
      expect.stringContaining('Attempting to fix'),
    );
  });

  it('should handle service timeout errors', async () => {
    // Mock the private method using type assertion
    jest.spyOn(selfFixer as any, 'restartService').mockResolvedValue(true);

    const result = await selfFixer.attemptFix(
      new Error('service timeout occurred'),
    );

    expect(result).toBe(true);
    expect(mockLogInfo).toHaveBeenCalledWith(
      expect.stringContaining('Attempting to fix'),
    );
  });

  it('should handle errors that cannot be fixed', async () => {
    const result = await selfFixer.attemptFix(
      new Error('unknown error that cannot be fixed'),
    );

    expect(result).toBe(false);
    expect(mockLogInfo).toHaveBeenCalledWith(
      expect.stringContaining('Attempting to fix'),
    );
  });

  it('should handle errors during fix attempt', async () => {
    jest.spyOn(selfFixer as any, 'tryDefaultFixes').mockImplementation(() => {
      throw new Error('Error during fix');
    });

    const result = await selfFixer.attemptFix(new Error('Test error'));

    expect(result).toBe(false);
    expect(mockLogError).toHaveBeenCalledWith(
      'Error during fix attempt',
      expect.any(String),
    );
  });

  it('should get repair report', () => {
    const report = selfFixer.getRepairReport();
    expect(report).toBeDefined();
  });
});

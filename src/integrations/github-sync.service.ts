import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Logger } from '../utils/logger';
import { GithubService } from './github.service';

@Injectable()
export class GithubSyncService implements OnModuleInit {
  constructor(
    private readonly configService: ConfigService,
    private readonly githubService: GithubService,
    private readonly logger: Logger,
  ) {}

  async onModuleInit(): Promise<void> {
    try {
      const token = this.configService.get<string>('GITHUB_TOKEN');
      const owner = this.configService.get<string>('GITHUB_OWNER');
      const repo = this.configService.get<string>('GITHUB_REPO');

      if (!token || !owner || !repo) {
        this.logger.warn('GitHub configuration missing. Sync skipped.');
        return;
      }

      this.logger.info('Starting initial GitHub sync...');
      await this.syncWithGithub(owner, repo);
      this.logger.info('Initial GitHub sync completed.');
    } catch (error) {
      this.logger.error(`Failed to sync with GitHub: ${error as Error}`);
    }
  }

  async syncWithGithub(owner: string, repo: string): Promise<void> {
    interface RepoData {
      data: {
        [key: string]: unknown;
      };
    }

    const repoData = (await this.githubService.getRepo(
      owner,
      repo,
    )) as RepoData;
    this.logger.info(`Synced repo data: ${JSON.stringify(repoData.data)}`);
  }
}

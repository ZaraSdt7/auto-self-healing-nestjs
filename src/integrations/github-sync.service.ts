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
    try {
      const repoData = await this.githubService.getRepo(owner, repo);
      if (!repoData) {
        this.logger.warn('No repo data received from GitHub');
        return;
      }

      // Log important repository information instead of the entire object
      this.logger.info(
        `Synced repo: ${repoData.full_name} (ID: ${repoData.id}) - ${
          repoData.private ? 'Private' : 'Public'
        } repository owned by ${repoData.owner.login}`,
      );
    } catch (error) {
      this.logger.error(
        `Error syncing with GitHub: ${(error as Error).message}`,
      );
      throw error;
    }
  }
}

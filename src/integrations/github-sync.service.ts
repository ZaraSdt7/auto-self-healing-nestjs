import { Injectable } from '@nestjs/common';
import { Logger } from '../utils/logger';
import { ConfigService } from '@nestjs/config';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

@Injectable()
export class GithubSyncService {
  constructor(
    private logger: Logger,
    private configService: ConfigService,
  ) {}

  async syncGithubCredentials(): Promise<boolean> {
    this.logger.info('Attempting to sync GitHub credentials from VSCode...');

    try {
      const isVSCode =
        process.env.VSCODE_PID || process.env.VSCODE_GIT_IPC_HANDLE;

      if (!isVSCode) {
        this.logger.warn('Not running in VSCode. Skipping auto-sync.');
        return false;
      }

      const githubToken = await this.getGithubToken();
      const githubUser = await this.getGitConfig('user.name');
      const githubRepo = await this.detectCurrentRepo();

      if (githubToken && githubUser && githubRepo) {
        process.env.GITHUB_TOKEN = githubToken;
        process.env.GITHUB_OWNER = githubUser;
        process.env.GITHUB_REPO = githubRepo;

        this.logger.info('GitHub credentials synced successfully');
        return true;
      } else {
        this.logger.warn('Could not fetch all GitHub credentials');
        return false;
      }
    } catch (error) {
      this.logger.error('Failed to sync GitHub credentials', error);
      return false;
    }
  }

  private async getGithubToken(): Promise<string | null> {
    try {
      const { stdout } = await execAsync(
        'echo "protocol=https\nhost=github.com\n\n" | git credential fill',
      );
      const lines = stdout.split('\n');
      const passwordLine = lines.find((line) => line.startsWith('password='));
      return passwordLine ? passwordLine.replace('password=', '') : null;
    } catch {
      this.logger.debug('No GitHub token found in credentials');
      return null;
    }
  }

  private async getGitConfig(key: string): Promise<string | null> {
    try {
      const { stdout } = await execAsync(`git config --get ${key}`);
      return stdout.trim() || null;
    } catch {
      this.logger.debug(`No git config found for ${key}`);
      return null;
    }
  }

  private async detectCurrentRepo(): Promise<string | null> {
    try {
      const { stdout } = await execAsync('git config --get remote.origin.url');
      const match = stdout.match(/github\.com[/:]([^/]+)\/(.+)\.git/);
      return match ? match[2] : null;
    } catch {
      this.logger.debug('No GitHub repo detected');
      return null;
    }
  }
}

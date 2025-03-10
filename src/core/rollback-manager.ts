import { Logger } from 'src/utils/logger';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

interface RollbackOptions {
  commitCount?: number;
  branch?: string;
  stashChanges?: boolean;
}

export class RollbackManager {
  private gitRoot: string | null = null;

  constructor(private logger: Logger) {}

  async initialize(projectPath: string = process.cwd()): Promise<boolean> {
    try {
      // Check if the directory is a git repository
      const { stdout } = await execAsync('git rev-parse --show-toplevel', {
        cwd: projectPath,
      });
      this.gitRoot = stdout.trim();
      this.logger.info(
        `Rollback manager initialized for repository: ${this.gitRoot}`,
      );
      return true;
    } catch (error) {
      this.logger.error(
        `Failed to initialize rollback manager: ${error instanceof Error ? error.message : String(error)}`,
      );
      return false;
    }
  }

  async rollback(options: RollbackOptions = {}): Promise<boolean> {
    if (!this.gitRoot) {
      this.logger.error('Rollback manager not initialized');
      return false;
    }

    const { commitCount = 1, branch = '', stashChanges = true } = options;

    try {
      // Stash any uncommitted changes if requested
      if (stashChanges) {
        this.logger.info('Stashing uncommitted changes');
        await execAsync('git stash', { cwd: this.gitRoot });
      }

      // If branch is specified, switch to it
      if (branch) {
        this.logger.info(`Switching to branch: ${branch}`);
        await execAsync(`git checkout ${branch}`, { cwd: this.gitRoot });
      }

      // Perform the rollback
      this.logger.info(`Rolling back ${commitCount} commit(s)`);
      await execAsync(`git reset --hard HEAD~${commitCount}`, {
        cwd: this.gitRoot,
      });

      this.logger.info('Rollback completed successfully');
      return true;
    } catch (error) {
      this.logger.error(
        `Rollback failed: ${error instanceof Error ? error.message : String(error)}`,
      );
      return false;
    }
  }

  async getCommitHistory(
    count: number = 5,
  ): Promise<Array<{ hash: string; message: string; date: string }>> {
    if (!this.gitRoot) {
      this.logger.error('Rollback manager not initialized');
      return [];
    }

    try {
      const { stdout } = await execAsync(
        `git log -${count} --pretty=format:"%h|%s|%ad" --date=short`,
        { cwd: this.gitRoot },
      );

      return stdout
        .split('\n')
        .filter((line) => line.trim())
        .map((line) => {
          const [hash, message, date] = line.split('|');
          return { hash, message, date };
        });
    } catch (error) {
      this.logger.error(
        `Failed to get commit history: ${error instanceof Error ? error.message : String(error)}`,
      );
      return [];
    }
  }

  async createRestorePoint(
    message: string = 'Auto-save before changes',
  ): Promise<string | null> {
    if (!this.gitRoot) {
      this.logger.error('Rollback manager not initialized');
      return null;
    }

    try {
      // Stage all changes
      await execAsync('git add -A', { cwd: this.gitRoot });

      // Create commit
      const { stdout } = await execAsync(`git commit -m "${message}"`, {
        cwd: this.gitRoot,
      });
      const commitHash = stdout.match(/\[[\w\s]+\s([a-f0-9]+)\]/)?.[1] || null;

      if (commitHash) {
        this.logger.info(`Created restore point: ${commitHash} - ${message}`);
        return commitHash;
      }

      return null;
    } catch (error) {
      this.logger.error(
        `Failed to create restore point: ${error instanceof Error ? error.message : String(error)}`,
      );
      return null;
    }
  }
}

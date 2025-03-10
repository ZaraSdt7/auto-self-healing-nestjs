import { Injectable } from '@nestjs/common';
import { Octokit } from '@octokit/rest';
import { ConfigService } from '@nestjs/config';
import { Logger } from 'src/utils/logger';
import {
  ApiOperation,
  CommitOptions,
  IssueOptions,
  PullRequestOptions,
} from './interface/github.interface';

@Injectable()
export class GithubService {
  private readonly octokit: Octokit;
  private readonly defaultOwner: string;
  private readonly defaultRepo: string;
  private readonly defaultBranch: string;

  constructor(
    private readonly logger: Logger,
    private readonly configService: ConfigService,
  ) {
    const githubToken = this.configService.get<string>('GITHUB_TOKEN');
    if (!githubToken) {
      throw new Error('GITHUB_TOKEN is not defined in configuration');
    }

    this.octokit = new Octokit({ auth: githubToken });
    this.defaultOwner = this.configService.getOrThrow<string>('GITHUB_OWNER');
    this.defaultRepo = this.configService.getOrThrow<string>('GITHUB_REPO');
    this.defaultBranch = this.configService.get<string>(
      'GITHUB_DEFAULT_BRANCH',
      'main',
    );

    this.logger.info(
      `GithubService initialized for ${this.defaultOwner}/${this.defaultRepo}`,
    );
  }

  // Generic error handling method
  private async executeWithErrorHandling<T>(
    operation: ApiOperation<T>,
    operationName: string,
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to ${operationName}: ${errorMessage}`);
      throw new Error(
        `Failed to ${operationName}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  async createPullRequest(options: PullRequestOptions): Promise<string> {
    const {
      title,
      body,
      branch,
      owner = this.defaultOwner,
      repo = this.defaultRepo,
      draft = false,
      base = this.defaultBranch,
    } = options;

    return this.executeWithErrorHandling(async () => {
      const response = await this.octokit.pulls.create({
        owner,
        repo,
        title,
        body,
        head: branch,
        base,
        draft,
      });

      const prUrl = response.data.html_url;
      this.logger.info(`Pull Request created: ${prUrl}`);
      return prUrl;
    }, 'create Pull Request');
  }

  async createIssue(options: IssueOptions): Promise<string> {
    const {
      title,
      body,
      labels = [],
      assignees = [],
      owner = this.defaultOwner,
      repo = this.defaultRepo,
    } = options;

    return this.executeWithErrorHandling(async () => {
      const response = await this.octokit.issues.create({
        owner,
        repo,
        title,
        body,
        labels,
        assignees,
      });

      const issueUrl = response.data.html_url;
      this.logger.info(`Issue created: ${issueUrl}`);
      return issueUrl;
    }, 'create Issue');
  }

  async createCommit(options: CommitOptions): Promise<string> {
    const { message, files, branch = this.defaultBranch } = options;
    const owner = this.defaultOwner;
    const repo = this.defaultRepo;

    return this.executeWithErrorHandling(async () => {
      // Get the latest commit SHA
      const { data: ref } = await this.octokit.git.getRef({
        owner,
        repo,
        ref: `heads/${branch}`,
      });
      const latestCommit = ref.object.sha;

      // Create blobs for each file
      const fileBlobs = await Promise.all(
        files.map(async (file) => {
          const { data } = await this.octokit.git.createBlob({
            owner,
            repo,
            content: file.content,
            encoding: 'utf-8',
          });
          return { path: file.path, sha: data.sha };
        }),
      );

      // Create tree
      const { data: tree } = await this.octokit.git.createTree({
        owner,
        repo,
        base_tree: latestCommit,
        tree: fileBlobs.map((blob) => ({
          path: blob.path,
          mode: '100644',
          type: 'blob',
          sha: blob.sha,
        })),
      });

      // Create commit
      const { data: commit } = await this.octokit.git.createCommit({
        owner,
        repo,
        message,
        tree: tree.sha,
        parents: [latestCommit],
      });

      // Update branch reference
      await this.octokit.git.updateRef({
        owner,
        repo,
        ref: `heads/${branch}`,
        sha: commit.sha,
      });

      this.logger.info(`Created commit ${commit.sha} on ${branch}`);
      return commit.sha;
    }, 'create commit');
  }

  async getBranchProtection(
    branch: string = this.defaultBranch,
  ): Promise<boolean> {
    try {
      await this.octokit.repos.getBranchProtection({
        owner: this.defaultOwner,
        repo: this.defaultRepo,
        branch,
      });
      return true;
    } catch {
      return false;
    }
  }

  async createBranch(
    name: string,
    fromBranch: string = this.defaultBranch,
  ): Promise<void> {
    return this.executeWithErrorHandling(async () => {
      const { data: ref } = await this.octokit.git.getRef({
        owner: this.defaultOwner,
        repo: this.defaultRepo,
        ref: `heads/${fromBranch}`,
      });

      await this.octokit.git.createRef({
        owner: this.defaultOwner,
        repo: this.defaultRepo,
        ref: `refs/heads/${name}`,
        sha: ref.object.sha,
      });

      this.logger.info(`Created branch ${name} from ${fromBranch}`);
    }, 'create branch');
  }

  async getRateLimitInfo(): Promise<{
    remaining: number;
    limit: number;
    resetAt: Date;
  }> {
    return this.executeWithErrorHandling(async () => {
      const { data } = await this.octokit.rateLimit.get();

      return {
        remaining: data.rate.remaining,
        limit: data.rate.limit,
        resetAt: new Date(data.rate.reset * 1000),
      };
    }, 'get rate limit info');
  }

  async fileExists(
    path: string,
    branch: string = this.defaultBranch,
  ): Promise<boolean> {
    try {
      await this.octokit.repos.getContent({
        owner: this.defaultOwner,
        repo: this.defaultRepo,
        path,
        ref: branch,
      });
      return true;
    } catch {
      return false;
    }
  }
}

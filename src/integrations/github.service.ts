import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { Logger } from '../utils/logger';
import { firstValueFrom } from 'rxjs';
import { AxiosError } from 'axios';
import { RepoData } from './interface/github.interface';

@Injectable()
export class GithubService {
  constructor(
    private readonly httpService: HttpService,
    private configService: ConfigService,
    private logger: Logger,
  ) {}

  async getRepo(owner: string, repo: string): Promise<RepoData> {
    const token = this.configService.get<string>('GITHUB_TOKEN');
    const url = `https://api.github.com/repos/${owner}/${repo}`;

    this.logger.info(
      `Fetching repo: ${url} with token starting with ${token?.slice(0, 6)}...`,
    );

    try {
      const response = await firstValueFrom(
        this.httpService.get(url, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/vnd.github.v3+json',
          },
        }),
      );
      this.logger.info(`Fetched repo data for ${owner}/${repo}`);
      return response.data as RepoData;
    } catch (error) {
      const axiosError = error as AxiosError;
      const errorMessage = axiosError.message || 'Unknown error';
      const statusCode = axiosError.response?.status ?? 'unknown';
      const responseData = axiosError.response?.data
        ? JSON.stringify(axiosError.response.data)
        : 'none';

      this.logger.error(
        `Error fetching repo: ${errorMessage}, Status: ${statusCode}, Data: ${responseData}`,
      );
      throw error;
    }
  }
}

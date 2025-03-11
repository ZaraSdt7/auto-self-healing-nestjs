import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { Logger } from '../utils/logger';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class GithubService {
  constructor(
    private readonly httpService: HttpService,
    private configService: ConfigService,
    private logger: Logger,
  ) {}

  async getRepo(owner: string, repo: string): Promise<any> {
    const token = this.configService.get<string>('GITHUB_TOKEN');
    const url = `https://api.github.com/repos/${owner}/${repo}`;

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
      return response.data; // Only returns the data
    } catch (error) {
      this.logger.error(`Error fetching repo: ${error as Error}`);
      throw error;
    }
  }
}

import { Module } from '@nestjs/common';
import { GithubService } from './github.service';
import { GithubSyncService } from './github-sync.service';
import { HttpModule } from '@nestjs/axios';
import { Logger } from '../utils/logger';

@Module({
  imports: [HttpModule],
  providers: [GithubService, GithubSyncService, Logger],
  exports: [GithubService, GithubSyncService],
})
export class GithubModule {}

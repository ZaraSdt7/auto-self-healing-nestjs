import { Module } from '@nestjs/common';
import { GithubService } from './github.service';
import { GithubSyncService } from './github-sync.service';
import { ConfigModule } from '@nestjs/config';
import { Logger } from 'src/utils/logger';

@Module({
  imports: [ConfigModule],
  providers: [GithubService, GithubSyncService, Logger],
  exports: [GithubService, GithubSyncService],
})
export class GithubModule {}

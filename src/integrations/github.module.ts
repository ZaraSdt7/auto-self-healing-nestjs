import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GithubService } from './github.service';
import { GithubSyncService } from './github-sync.service';
import { NpmAuditService } from './npm-audit';
import { EmailNotifier } from './email-notifier';
import { Logger } from 'src/utils/logger';

@Module({
  imports: [ConfigModule],
  providers: [
    GithubService,
    GithubSyncService,
    NpmAuditService,
    EmailNotifier,
    Logger,
  ],
  exports: [GithubService, GithubSyncService, NpmAuditService, EmailNotifier],
})
export class GithubModule {}

import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { Logger } from './utils/logger';
import { ErrorDetector } from './core/error-detector';
import { SelfFixer } from './core/self-fixer';
import { PerformanceMonitor } from './core/performance-monitor';
import { SecurityPatcher } from './core/security-patcher';
import { RollbackManager } from './core/rollback-manager';
import { ModuleHealthCheck } from './core/module-health-check';
import { EmailNotifier } from './integrations/email-notifier';
import { ErrorPredictor } from './ai/error-predictor';
import { GithubModule } from './integrations/github.module';
import { GithubSyncService } from './integrations/github-sync.service';
import { QueryOptimizer } from './utils/query-optimizer';
import { ResourceOptimizer } from './utils/resource-optimizer';
import { LogAnalyzer } from './ai/log-analyzer';
import { CodeAnalyzer } from './ai/code-analyzer';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, cache: true }),
    ScheduleModule.forRoot(),
    GithubModule,
  ],
  providers: [
    Logger,
    ErrorDetector,
    SelfFixer,
    PerformanceMonitor,
    SecurityPatcher,
    RollbackManager,
    ModuleHealthCheck,
    ErrorPredictor,
    QueryOptimizer,
    ResourceOptimizer,
    LogAnalyzer,
    CodeAnalyzer,
    {
      provide: EmailNotifier,
      useFactory: (logger: Logger, config: ConfigService) =>
        new EmailNotifier(logger, config),
      inject: [Logger, ConfigService],
    },
  ],
  exports: [
    Logger,
    ErrorDetector,
    SelfFixer,
    PerformanceMonitor,
    SecurityPatcher,
    RollbackManager,
    ModuleHealthCheck,
    ErrorPredictor,
    QueryOptimizer,
    ResourceOptimizer,
    LogAnalyzer,
    CodeAnalyzer,
    EmailNotifier,
    GithubSyncService,
  ],
})
export class AutoSelfHealingModule {}

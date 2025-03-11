import { NestFactory } from '@nestjs/core';
import { DynamicModule } from '@nestjs/common';
import { Logger } from './utils/logger';
import { ErrorDetector } from './core/error-detector';
import { SelfFixer } from './core/self-fixer';
import { ErrorPredictor } from './ai/error-predictor';
import { EmailNotifier } from './integrations/email-notifier';
import { GithubSyncService } from './integrations/github-sync.service';
import { QueryOptimizer } from './utils/query-optimizer';
import { ResourceOptimizer } from './utils/resource-optimizer';
import { CodeAnalyzer } from './ai/code-analyzer';

export class AutoSelfHealingMain {
  static async bootstrap(mainModule: DynamicModule): Promise<void> {
    const app = await NestFactory.create(mainModule, {
      bufferLogs: true,
      logger: ['error', 'warn', 'log'],
    });

    await app.init();

    // Initialize services
    const logger = app.get(Logger);
    const syncService = app.get(GithubSyncService);
    const detector = app.get(ErrorDetector);
    const fixer = app.get(SelfFixer);
    const predictor = app.get(ErrorPredictor);
    const notifier = app.get(EmailNotifier);
    const queryOptimizer = app.get(QueryOptimizer);
    const resourceOptimizer = app.get(ResourceOptimizer);
    const codeAnalyzer = app.get(CodeAnalyzer);

    // Sync GitHub
    await this.syncGithub(syncService, logger);

    // Detect errors
    this.connectErrorHandling(detector, fixer, predictor, notifier, logger);

    // Run initial checks test service
    await this.runInitialChecks(
      logger,
      queryOptimizer,
      resourceOptimizer,
      codeAnalyzer,
    );

    logger.info('🚀 Auto-Self Healing NestJS initialized successfully');
    await app.listen(3000);
  }

  private static async syncGithub(
    syncService: GithubSyncService,
    logger: Logger,
  ): Promise<void> {
    try {
      const synced = await syncService.syncGithubCredentials();
      logger.info(
        synced
          ? 'GitHub synced automatically from VSCode'
          : 'GitHub auto-sync skipped',
      );
    } catch (error) {
      logger.warn(`GitHub sync failed, ${error as Error}.message`);
    }
  }

  private static connectErrorHandling(
    detector: ErrorDetector,
    fixer: SelfFixer,
    predictor: ErrorPredictor,
    notifier: EmailNotifier,
    logger: Logger,
  ): void {
    detector.onError((error: Error) => {
      void (async () => {
        try {
          predictor.addLog(`Error detected: ${error.message}`);
          const fixed = await fixer.attemptFix(error);
          const message = fixed
            ? `Fixed: ${error.message}`
            : `Unresolved error: ${error.message}`;
          if (notifier) {
            await notifier.notify(message);
          }
          logger.info(message);
        } catch (fixError) {
          logger.error('Error handling failed', fixError);
        }
      })();
    });
  }

  private static async runInitialChecks(
    logger: Logger,
    queryOptimizer: QueryOptimizer,
    resourceOptimizer: ResourceOptimizer,
    codeAnalyzer: CodeAnalyzer,
  ): Promise<void> {
    try {
      const sampleQuery = 'SELECT * FROM users WHERE id = 1';
      logger.info(
        `Optimizing sample query: ${queryOptimizer.optimizeQuery(sampleQuery)}`,
      );

      const resources = resourceOptimizer.optimizeResources();
      logger.info(
        `Resource thresholds: CPU ${resources.cpuThreshold}ms, Memory ${resources.memoryThreshold}MB`,
      );

      const codeIssues = await codeAnalyzer.analyzeFile('src/index.ts');
      logger.info(`Code analysis: ${codeIssues.length} issues found`);
    } catch (error) {
      logger.warn(`Initial checks failed, ${error as Error}.message`);
    }
  }
}

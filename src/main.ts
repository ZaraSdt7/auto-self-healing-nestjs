import { NestFactory } from '@nestjs/core';
import { Logger } from './utils/logger';
import { AutoSelfHealingModule } from './app.module';

async function bootstrap() {
  const logger = new Logger();
  logger.info('Starting application bootstrap...');
  const app = await NestFactory.create(AutoSelfHealingModule);
  logger.info('Nest application created.');
  await app.listen(3000);
  logger.info(`Application is running on: ${await app.getUrl()}`);
}

bootstrap().catch((err) => {
  console.error('Error during bootstrap:', err);
  process.exit(1);
});

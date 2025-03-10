import { Logger } from 'src/utils/logger';

export class ErrorDetector {
  constructor(private logger: Logger) {}

  onError(callBack: (err: Error) => void) {
    process.on('uncaughtException', (err) => {
      this.logger.error(`Uncaught exception: ${err.message}`);
      callBack(err);
    });

    process.on('unhandledRejection', (reason) => {
      this.logger.error(`Unhandled rejection: ${JSON.stringify(reason)}`);
      const error =
        reason instanceof Error ? reason : new Error(JSON.stringify(reason));

      callBack(error);
    });
  }
}

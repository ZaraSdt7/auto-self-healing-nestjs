import { Logger } from '../src/utils/logger';
import { ErrorDetector } from '../src/core/error-detector';

describe('ErrorDetector', () => {
  let detector: ErrorDetector;
  let logger: Logger;

  beforeEach(() => {
    logger = new Logger();
    detector = new ErrorDetector(logger);
  });

  it('should detect uncaught exceptions', (done) => {
    const callback = jest.fn();
    detector.onError(callback);

    process.emit('uncaughtException', new Error('Uncaught test error'));
    setTimeout(() => {
      expect(callback).toHaveBeenCalledWith(expect.any(Error));
      done();
    }, 100);
  });

  it('should detect unhandled rejections', (done) => {
    const callback = jest.fn();
    detector.onError(callback);

    process.emit(
      'unhandledRejection',
      'Unhandled test rejection',
      Promise.resolve(),
    );
    setTimeout(() => {
      expect(callback).toHaveBeenCalledWith(expect.any(Error));
      done();
    }, 100);
  });
});

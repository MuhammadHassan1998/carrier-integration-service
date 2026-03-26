import { AppError } from '../errors/AppError';
import { logger } from './logger';

export interface RetryOptions {
  maxAttempts: number;
  baseDelayMs: number;
  maxDelayMs: number;
  requestId?: string;
}

const DEFAULT_OPTIONS: RetryOptions = {
  maxAttempts: 3,
  baseDelayMs: 100,
  maxDelayMs: 5_000,
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function backoffMs(attempt: number, opts: RetryOptions): number {
  const exponential = opts.baseDelayMs * Math.pow(2, attempt);
  return Math.random() * Math.min(opts.maxDelayMs, exponential);
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: Partial<RetryOptions> = {},
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  for (let attempt = 0; attempt < opts.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      const isLastAttempt = attempt === opts.maxAttempts - 1;
      const isRetryable = err instanceof AppError && err.isRetryable();

      if (isLastAttempt || !isRetryable) {
        throw err;
      }

      const delay = backoffMs(attempt, opts);
      logger.warn('Transient error — retrying', {
        requestId: opts.requestId,
        attempt: attempt + 1,
        maxAttempts: opts.maxAttempts,
        delayMs: Math.round(delay),
        error: err instanceof Error ? err.message : String(err),
      });

      await sleep(delay);
    }
  }

  throw new AppError('UNKNOWN_ERROR', 'Retry loop exited without result or error');
}

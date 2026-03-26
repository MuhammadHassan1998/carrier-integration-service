import { AppError } from '../errors/AppError';
import { Carrier } from '../carriers/base/Carrier';
import { RateQuote } from '../domain/models/RateQuote';
import { RateRequest } from '../domain/models/RateRequest';
import { validateRateRequest } from '../domain/schemas/rateRequestSchema';
import { logger } from '../utils/logger';

export class RateService {
  constructor(private readonly carriers: Carrier[]) {}

  async getRates(rawRequest: unknown): Promise<RateQuote[]> {
    const request = this.validate(rawRequest);

    logger.info('Getting rates', {
      requestId: request.requestId,
      carriers: this.carriers.map((c) => c.name),
      packages: request.packages.length,
    });

    const results = await Promise.allSettled(
      this.carriers.map((carrier) => carrier.getRates(request)),
    );

    const quotes: RateQuote[] = [];

    for (const [i, result] of results.entries()) {
      if (result.status === 'fulfilled') {
        quotes.push(...result.value);
      } else {
        logger.warn('Carrier request failed', {
          requestId: request.requestId,
          carrier: this.carriers[i]?.name,
          error: result.reason instanceof Error ? result.reason.message : String(result.reason),
        });
      }
    }

    if (quotes.length === 0) {
      throw new AppError('CARRIER_ERROR', 'No carriers returned rate quotes', 503);
    }

    return quotes.sort((a, b) => a.totalCharge - b.totalCharge);
  }

  private validate(raw: unknown): RateRequest {
    try {
      return validateRateRequest(raw);
    } catch (err) {
      if (err instanceof AppError) throw err;
      throw new AppError('VALIDATION_ERROR', 'Invalid rate request', 400, err);
    }
  }
}

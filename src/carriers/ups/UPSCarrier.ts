import { Carrier } from '../base/Carrier';
import { RateRequest } from '../../domain/models/RateRequest';
import { RateQuote } from '../../domain/models/RateQuote';
import { logger } from '../../utils/logger';
import { UpsClient } from './upsClient';
import { mapFromUpsResponse, mapToUpsRequest } from './upsMapper';

export class UPSCarrier implements Carrier {
  readonly name = 'UPS';

  constructor(private readonly client: UpsClient) {}

  async getRates(request: RateRequest): Promise<RateQuote[]> {
    logger.info('Fetching UPS rates', { requestId: request.requestId });

    const upsRequest = mapToUpsRequest(request);
    const upsResponse = await this.client.getRates(upsRequest, request.requestId);
    const quotes = mapFromUpsResponse(upsResponse.RateResponse.RatedShipment);

    logger.info('UPS rates received', {
      requestId: request.requestId,
      quoteCount: quotes.length,
    });

    return quotes;
  }
}

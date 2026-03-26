import { loadConfig } from './config/env';
import { FetchHttpClient } from './http/httpClient';
import { CarrierFactory } from './carriers/CarrierFactory';
import { RateService } from './services/rateService';

export function createRateService(): RateService {
  const config = loadConfig();
  const http = new FetchHttpClient(config.HTTP_TIMEOUT_MS);
  const factory = new CarrierFactory(config, http);
  return new RateService(factory.createAll());
}

export type { RateRequest } from './domain/models/RateRequest';
export type { RateQuote } from './domain/models/RateQuote';
export type { Address } from './domain/models/Address';
export type { Package } from './domain/models/Package';

import { describe, it, expect } from 'vitest';
import { TokenManager } from '../../src/auth/tokenManager';
import { UpsClient } from '../../src/carriers/ups/upsClient';
import { UPSCarrier } from '../../src/carriers/ups/UPSCarrier';
import { RateService } from '../../src/services/rateService';
import { HttpClient, HttpResponse } from '../../src/http/httpClient';
import { Config } from '../../src/config/env';
import { RateRequest } from '../../src/domain/models/RateRequest';

const TOKEN = { access_token: 'test-token', token_type: 'Bearer', expires_in: 3600 };
const RATE_RESPONSE = { RateResponse: { Response: { ResponseStatus: { Code: '1', Description: 'Success' } }, RatedShipment: [{ Service: { Code: '03' }, TotalCharges: { CurrencyCode: 'USD', MonetaryValue: '12.50' }, TransportationCharges: { CurrencyCode: 'USD', MonetaryValue: '12.50' }, ServiceOptionsCharges: { CurrencyCode: 'USD', MonetaryValue: '0.00' }, GuaranteedDelivery: { BusinessDaysInTransit: '3' } }] } };
const REQUEST: RateRequest = { requestId: 'req-123', shipper: { street: ['123 Warehouse Blvd'], city: 'Atlanta', state: 'GA', postalCode: '30301', countryCode: 'US' }, recipient: { street: ['456 Customer Ave'], city: 'New York', state: 'NY', postalCode: '10001', countryCode: 'US' }, packages: [{ weight: 5.5, weightUnit: 'LBS', length: 12, width: 8, height: 6, dimensionUnit: 'IN' }] };
const CONFIG: Config = { APP_NAME: 'test-app', UPS_CLIENT_ID: 'id', UPS_CLIENT_SECRET: 'secret', UPS_BASE_URL: 'https://wwwcie.ups.com', UPS_RATE_PATH: '/api/rating/v2403/Shop', HTTP_TIMEOUT_MS: 5000, RETRY_MAX_ATTEMPTS: 1, RETRY_BASE_DELAY_MS: 0, LOG_LEVEL: 'error' };

class MockHttpClient implements HttpClient {
  calls: Array<{ url: string; body: string; headers: Record<string, string> }> = [];
  async post<T>(url: string, body: string, headers: Record<string, string>): Promise<HttpResponse<T>> {
    this.calls.push({ url, body, headers });
    if (url.includes('/security/v1/oauth/token')) return { status: 200, data: TOKEN as T };
    return { status: 200, data: RATE_RESPONSE as T };
  }
}

function buildService(http = new MockHttpClient()) {
  const tokenManager = new TokenManager(CONFIG, http);
  const client = new UpsClient(CONFIG, tokenManager, http);
  const carrier = new UPSCarrier(client);
  return { http, carrier, service: new RateService([carrier]) };
}

describe('UPS integration', () => {
  it('maps the request into UPS format', async () => {
    const { http, carrier } = buildService();
    await carrier.getRates(REQUEST);
    const body = JSON.parse(http.calls[1].body);
    expect(body.RateRequest.Shipment.Shipper.Address.City).toBe('Atlanta');
    expect(body.RateRequest.Shipment.Package[0].Dimensions.Length).toBe('12');
  });

  it('returns normalized quotes', async () => {
    const { carrier } = buildService();
    const [quote] = await carrier.getRates(REQUEST);
    expect(quote).toMatchObject({ carrier: 'UPS', serviceCode: '03', serviceName: 'UPS Ground', totalCharge: 12.5, currency: 'USD', transitDays: 3 });
  });

  it('reuses the token across requests', async () => {
    const { http, carrier } = buildService();
    await carrier.getRates(REQUEST);
    await carrier.getRates(REQUEST);
    expect(http.calls.filter((c) => c.url.includes('/security/v1/oauth/token'))).toHaveLength(1);
  });

  it('rejects invalid requests', async () => {
    const { service } = buildService();
    await expect(service.getRates({ bad: true })).rejects.toMatchObject({ code: 'VALIDATION_ERROR' });
  });

  it('returns quotes sorted by price', async () => {
    const { service } = buildService();
    const quotes = await service.getRates(REQUEST);
    expect(quotes.map((q) => q.totalCharge)).toEqual([12.5]);
  });
});

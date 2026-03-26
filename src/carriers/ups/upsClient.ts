import { AppError } from '../../errors/AppError';
import { Config } from '../../config/env';
import { HttpClient } from '../../http/httpClient';
import { TokenManager } from '../../auth/tokenManager';
import { logger } from '../../utils/logger';
import { withRetry } from '../../utils/retry';
import { UpsErrorResponse, UpsRateRequest, UpsRateResponse } from './upsTypes';

function extractUpsErrorMessage(body: unknown): string | null {
  try {
    return (body as UpsErrorResponse)?.response?.errors?.[0]?.message ?? null;
  } catch {
    return null;
  }
}

export class UpsClient {
  private readonly rateUrl: string;

  constructor(
    private readonly config: Config,
    private readonly tokenManager: TokenManager,
    private readonly http: HttpClient,
  ) {
    this.rateUrl = `${config.UPS_BASE_URL}${config.UPS_RATE_PATH}`;
  }

  async getRates(payload: UpsRateRequest, requestId: string): Promise<UpsRateResponse> {
    return withRetry(() => this.doRequest(payload, requestId), {
      maxAttempts: this.config.RETRY_MAX_ATTEMPTS,
      baseDelayMs: this.config.RETRY_BASE_DELAY_MS,
      requestId,
    });
  }

  private async doRequest(payload: UpsRateRequest, requestId: string): Promise<UpsRateResponse> {
    const token = await this.tokenManager.getToken();

    logger.info('Calling UPS rating API', { requestId, url: this.rateUrl });

    const response = await this.http.post<UpsRateResponse | UpsErrorResponse>(
      this.rateUrl,
      JSON.stringify(payload),
      {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        transId: requestId,
        transactionSrc: this.config.APP_NAME,
      },
    );

    if (response.status === 401) {
      this.tokenManager.invalidate();
      throw new AppError('AUTH_ERROR', 'UPS rejected the bearer token', 401);
    }

    if (response.status >= 500) {
      const msg = extractUpsErrorMessage(response.data);
      throw new AppError('UPSTREAM_ERROR', msg ?? `UPS returned ${response.status}`, response.status);
    }

    if (response.status >= 400) {
      const msg = extractUpsErrorMessage(response.data);
      throw new AppError('CARRIER_ERROR', msg ?? `UPS returned ${response.status}`, response.status);
    }

    const body = response.data as UpsRateResponse;
    const statusCode = body?.RateResponse?.Response?.ResponseStatus?.Code;

    if (statusCode !== '1') {
      throw new AppError('CARRIER_ERROR', 'UPS returned an unsuccessful response', 422);
    }

    return body;
  }
}

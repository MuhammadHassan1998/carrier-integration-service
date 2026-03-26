import { AppError } from '../errors/AppError';
import { Config } from '../config/env';
import { HttpClient } from '../http/httpClient';
import { logger } from '../utils/logger';

interface UpsTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

interface CachedToken {
  value: string;
  expiresAt: number;
}

const EXPIRY_BUFFER_MS = 60_000;

export class TokenManager {
  private cached: CachedToken | null = null;

  constructor(
    private readonly config: Config,
    private readonly http: HttpClient,
  ) {}

  async getToken(): Promise<string> {
    if (this.cached !== null && Date.now() < this.cached.expiresAt) {
      return this.cached.value;
    }
    return this.fetchFreshToken();
  }

  invalidate(): void {
    this.cached = null;
  }

  private async fetchFreshToken(): Promise<string> {
    logger.debug('Fetching UPS token');

    const credentials = Buffer.from(
      `${this.config.UPS_CLIENT_ID}:${this.config.UPS_CLIENT_SECRET}`,
    ).toString('base64');

    const response = await this.http.post<UpsTokenResponse>(
      `${this.config.UPS_BASE_URL}/security/v1/oauth/token`,
      'grant_type=client_credentials',
      {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${credentials}`,
      },
    );

    if (response.status !== 200) {
      throw new AppError('AUTH_ERROR', `UPS authentication failed (HTTP ${response.status})`, 401);
    }

    const { access_token, expires_in } = response.data;

    if (!access_token) {
      throw new AppError('AUTH_ERROR', 'UPS token response missing access_token', 401);
    }

    this.cached = {
      value: access_token,
      expiresAt: Date.now() + expires_in * 1_000 - EXPIRY_BUFFER_MS,
    };

    logger.debug('UPS token received', { expiresInSeconds: expires_in });

    return access_token;
  }
}

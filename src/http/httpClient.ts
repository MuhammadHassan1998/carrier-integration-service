import { AppError } from '../errors/AppError';

export interface HttpResponse<T> {
  status: number;
  data: T;
}

export interface HttpClient {
  post<T>(url: string, body: string, headers: Record<string, string>): Promise<HttpResponse<T>>;
}

export class FetchHttpClient implements HttpClient {
  constructor(private readonly timeoutMs: number = 10_000) {}

  async post<T>(
    url: string,
    body: string,
    headers: Record<string, string>,
  ): Promise<HttpResponse<T>> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body,
        signal: controller.signal,
      });

      let data: T;
      try {
        data = (await response.json()) as T;
      } catch {
        throw new AppError('PARSE_ERROR', `Failed to parse JSON response from ${url}`, response.status);
      }

      return { status: response.status, data };
    } catch (err) {
      if (err instanceof AppError) throw err;

      if (err instanceof Error && err.name === 'AbortError') {
        throw new AppError('TIMEOUT_ERROR', `Request to ${url} timed out after ${this.timeoutMs}ms`, 504);
      }

      throw new AppError(
        'NETWORK_ERROR',
        `Network error calling ${url}: ${err instanceof Error ? err.message : String(err)}`,
        502,
        err,
      );
    } finally {
      clearTimeout(timeoutId);
    }
  }
}

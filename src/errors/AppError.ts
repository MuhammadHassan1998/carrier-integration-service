export type ErrorCode =
  | 'AUTH_ERROR'
  | 'VALIDATION_ERROR'
  | 'NETWORK_ERROR'
  | 'TIMEOUT_ERROR'
  | 'PARSE_ERROR'
  | 'UPSTREAM_ERROR'
  | 'CARRIER_ERROR'
  | 'UNKNOWN_ERROR';

export class AppError extends Error {
  readonly code: ErrorCode;
  readonly httpStatus?: number;
  readonly cause?: unknown;

  constructor(code: ErrorCode, message: string, httpStatus?: number, cause?: unknown) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.httpStatus = httpStatus;
    this.cause = cause;
    Object.setPrototypeOf(this, new.target.prototype);
  }

  isRetryable(): boolean {
    return (
      this.code === 'NETWORK_ERROR' ||
      this.code === 'TIMEOUT_ERROR' ||
      this.httpStatus === 500 ||
      this.httpStatus === 502 ||
      this.httpStatus === 503 ||
      this.httpStatus === 504
    );
  }

  toJSON() {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      httpStatus: this.httpStatus,
    };
  }
}

import { HttpException, HttpStatus } from '@nestjs/common';

export type ApiErrorType =
  | 'validation_error'
  | 'authentication_error'
  | 'authorization_error'
  | 'not_found_error'
  | 'conflict_error'
  | 'rate_limit_error'
  | 'api_error';

export interface ApiErrorDetail {
  field: string;
  code: string;
  message: string;
}

/**
 * Thrown by feature services to produce the fintech-style error envelope
 * (`{error:{code,message,type,requestId,details}}`) built by HttpExceptionFilter.
 * `code` is the stable lookup key into ERROR_MESSAGES for i18n.
 */
export class ApiException extends HttpException {
  constructor(
    public readonly code: string,
    status: HttpStatus,
    public readonly type: ApiErrorType,
    public readonly details?: ApiErrorDetail[],
  ) {
    super(code, status);
  }
}

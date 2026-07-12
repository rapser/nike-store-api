import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import {
  ApiErrorDetail,
  ApiErrorType,
  ApiException,
} from '../exceptions/api.exception';
import { getErrorMessage, resolveLanguage } from '../i18n/error-messages';

interface FallbackMapping {
  code: string;
  type: ApiErrorType;
}

const STATUS_FALLBACK: Record<number, FallbackMapping> = {
  400: { code: 'VALIDATION_ERROR', type: 'validation_error' },
  401: { code: 'UNAUTHORIZED', type: 'authentication_error' },
  403: { code: 'FORBIDDEN', type: 'authorization_error' },
  404: { code: 'NOT_FOUND', type: 'not_found_error' },
  409: { code: 'VALIDATION_ERROR', type: 'conflict_error' },
  422: { code: 'VALIDATION_ERROR', type: 'validation_error' },
  429: { code: 'RATE_LIMIT_EXCEEDED', type: 'rate_limit_error' },
};

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('ExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const req = ctx.getRequest<Request>();
    const res = ctx.getResponse<Response>();
    const requestId = req.requestId ?? 'req_unknown';
    const language = resolveLanguage(req.headers['accept-language']);

    const { status, code, type, details } = this.resolve(exception);
    const message = getErrorMessage(code, language);

    if (status >= 500) {
      this.logger.error(
        `[${requestId}] ${req.method} ${req.originalUrl} -> ${status} ${code}`,
        (exception as Error)?.stack,
      );
    }

    res.status(status).json({
      error: {
        code,
        message,
        type,
        requestId,
        ...(details ? { details } : {}),
      },
    });
  }

  private resolve(exception: unknown): {
    status: number;
    code: string;
    type: ApiErrorType;
    details?: ApiErrorDetail[];
  } {
    if (exception instanceof ApiException) {
      return {
        status: exception.getStatus(),
        code: exception.code,
        type: exception.type,
        details: exception.details,
      };
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const fallback = STATUS_FALLBACK[status] ?? {
        code: 'INTERNAL_ERROR',
        type: 'api_error',
      };
      return { status, code: fallback.code, type: fallback.type };
    }

    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      code: 'INTERNAL_ERROR',
      type: 'api_error',
    };
  }
}

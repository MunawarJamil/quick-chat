import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';

import { REQUEST_ID_HEADER } from '../middleware/request-id.middleware';
import { Sentry } from '../../config/sentry';

type RequestLike = {
  method?: string;
  originalUrl?: string;
  url?: string;
  headers: Record<string, string | string[] | undefined>;
};

type ResponseLike = {
  status(code: number): {
    json(body: unknown): void;
  };
};

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const httpContext = host.switchToHttp();
    const req = httpContext.getRequest<RequestLike>();
    const res = httpContext.getResponse<ResponseLike>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const requestId = req.headers[REQUEST_ID_HEADER];
    const method = req.method || 'UNKNOWN';
    const path = req.originalUrl || req.url || 'UNKNOWN';

    const message =
      exception instanceof Error ? exception.message : 'Unexpected error';

    Sentry.captureException(exception, {
      tags: {
        requestId: String(requestId || ''),
        method,
        path,
      },
    });

    this.logger.error(
      JSON.stringify({
        event: 'http_request_failed',
        requestId,
        method,
        path,
        statusCode: status,
        message,
      }),
    );

    res.status(status).json({
      statusCode: status,
      message:
        status === HttpStatus.INTERNAL_SERVER_ERROR
          ? 'Internal server error'
          : message,
      requestId,
      timestamp: new Date().toISOString(),
      path,
    });
  }
}
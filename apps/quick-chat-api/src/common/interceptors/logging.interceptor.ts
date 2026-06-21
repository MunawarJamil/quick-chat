import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';

import { REQUEST_ID_HEADER } from '../middleware/request-id.middleware';
import { redactSensitiveData } from '../utils/redact-sensitive-data';

type RequestLike = {
  method?: string;
  originalUrl?: string;
  url?: string;
  headers: Record<string, string | string[] | undefined>;
  body?: unknown;
};

type ResponseLike = {
  statusCode?: number;
};

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const httpContext = context.switchToHttp();
    const req = httpContext.getRequest<RequestLike>();
    const res = httpContext.getResponse<ResponseLike>();

    const startedAt = Date.now();
    const requestId = req.headers[REQUEST_ID_HEADER];
    const method = req.method || 'UNKNOWN';
    const path = req.originalUrl || req.url || 'UNKNOWN';

    return next.handle().pipe(
      tap(() => {
        const durationMs = Date.now() - startedAt;

        this.logger.log(
          JSON.stringify({
            event: 'http_request_completed',
            requestId,
            method,
            path,
            statusCode: res.statusCode,
            durationMs,
            body: redactSensitiveData(req.body),
          }),
        );
      }),
    );
  }
}

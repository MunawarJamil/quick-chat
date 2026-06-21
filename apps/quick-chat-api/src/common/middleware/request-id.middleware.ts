import { Injectable, NestMiddleware } from '@nestjs/common';
import { randomUUID } from 'crypto';

export const REQUEST_ID_HEADER = 'x-request-id';

type RequestWithHeaders = {
  headers: Record<string, string | string[] | undefined>;
};

type ResponseWithSetHeader = {
  setHeader(name: string, value: string): void;
};

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(req: RequestWithHeaders, res: ResponseWithSetHeader, next: () => void) {
    const incomingRequestId = req.headers[REQUEST_ID_HEADER];
    const requestId = Array.isArray(incomingRequestId)
      ? incomingRequestId[0]
      : incomingRequestId || randomUUID();

    req.headers[REQUEST_ID_HEADER] = requestId;
    res.setHeader(REQUEST_ID_HEADER, requestId);

    next();
  }
}

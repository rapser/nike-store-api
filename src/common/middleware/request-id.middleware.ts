import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

declare module 'express-serve-static-core' {
  interface Request {
    requestId?: string;
  }
}

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const requestId = `req_${randomUUID().replace(/-/g, '').slice(0, 12)}`;
    req.requestId = requestId;
    res.setHeader('X-Request-Id', requestId);
    next();
  }
}

import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';

@Injectable()
export class RequestLoggingMiddleware implements NestMiddleware {
  private readonly logger = new Logger(RequestLoggingMiddleware.name);

  use(req: Request, res: Response, next: NextFunction): void {
    const startedAt = Date.now();
    const { method, originalUrl } = req;

    res.on('finish', () => {
      const elapsedMs = Date.now() - startedAt;
      const contentLength = res.getHeader('content-length');
      this.logger.log(
        `${method} ${originalUrl} ${res.statusCode} ${elapsedMs}ms${
          contentLength !== undefined ? ` ${String(contentLength)}b` : ''
        }`,
      );
    });

    next();
  }
}

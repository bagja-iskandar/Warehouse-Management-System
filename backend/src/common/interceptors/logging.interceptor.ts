import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    const { method, url } = request;
    const correlationId =
      ((request.headers['x-request-id'] ||
        request.headers['x-correlation-id']) as string | undefined) ||
      `wms_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;

    // Set correlation ID header in response
    response.setHeader('x-request-id', correlationId);

    const startTime = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = Date.now() - startTime;
          const { statusCode } = response;
          this.logger.log(`[${correlationId}] ${method} ${url} ${statusCode} - ${duration}ms`);
        },
        error: (error: Error) => {
          const duration = Date.now() - startTime;
          this.logger.warn(
            `[${correlationId}] ${method} ${url} ERROR: ${error.message} - ${duration}ms`,
          );
        },
      }),
    );
  }
}

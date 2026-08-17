import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiResponseDto, ResponseMetaDto } from '../dto/api-response.dto';
import { Request } from 'express';

interface PaginatedData<T> {
  items: T[];
  page?: number;
  limit?: number;
  totalItems?: number;
  totalPages?: number;
  [key: string]: unknown;
}

@Injectable()
export class TransformResponseInterceptor<T> implements NestInterceptor<T, ApiResponseDto<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<ApiResponseDto<T>> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request>();

    // Skip wrapping for Swagger docs or raw stream endpoints if any
    if (request.url.startsWith('/api/docs')) {
      return next.handle();
    }

    const correlationId = (request.headers['x-correlation-id'] ||
      request.headers['x-request-id']) as string | undefined;

    return next.handle().pipe(
      map((responsePayload) => {
        // If response is already formatted as ApiResponseDto, return as is
        if (
          responsePayload &&
          typeof responsePayload === 'object' &&
          'success' in responsePayload &&
          'data' in responsePayload
        ) {
          return responsePayload;
        }

        let message = 'Request successful';
        let data: unknown = responsePayload;
        const meta: ResponseMetaDto = {
          timestamp: new Date().toISOString(),
          path: request.url,
          correlationId,
        };

        // Check if payload contains custom message wrapper { message, data }
        if (
          responsePayload &&
          typeof responsePayload === 'object' &&
          'message' in responsePayload &&
          'data' in responsePayload
        ) {
          message = (responsePayload as { message: string }).message;
          data = (responsePayload as { data: unknown }).data;
        }

        // Check if data is paginated structure { items, page, limit, totalItems, totalPages }
        if (
          data &&
          typeof data === 'object' &&
          'items' in data &&
          ('totalItems' in data || 'page' in data || 'totalPages' in data)
        ) {
          const paginated = data as PaginatedData<unknown>;
          meta.page = paginated.page;
          meta.limit = paginated.limit;
          meta.totalItems = paginated.totalItems;
          meta.totalPages = paginated.totalPages;
          data = paginated.items;
        }

        return {
          success: true,
          message,
          data: (data !== undefined ? data : null) as T,
          meta,
        };
      }),
    );
  }
}

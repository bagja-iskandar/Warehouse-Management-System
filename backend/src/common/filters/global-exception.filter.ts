import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ApiErrorResponseDto, ValidationErrorDetailDto } from '../dto/api-response.dto';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const correlationId =
      ((request.headers['x-request-id'] ||
        request.headers['x-correlation-id']) as string | undefined) ||
      `wms_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;

    // Set correlation ID in outgoing response headers
    response.setHeader('x-request-id', correlationId);

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error occurred';
    let code = 'INTERNAL_SERVER_ERROR';
    let errors: ValidationErrorDetailDto[] | undefined = undefined;

    // 1. Handle standard NestJS HttpExceptions
    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      switch (statusCode) {
        case HttpStatus.BAD_REQUEST:
          code = 'BAD_REQUEST';
          break;
        case HttpStatus.UNAUTHORIZED:
          code = 'UNAUTHORIZED';
          break;
        case HttpStatus.FORBIDDEN:
          code = 'FORBIDDEN';
          break;
        case HttpStatus.NOT_FOUND:
          code = 'NOT_FOUND';
          break;
        case HttpStatus.CONFLICT:
          code = 'CONFLICT';
          break;
        case HttpStatus.UNPROCESSABLE_ENTITY:
          code = 'UNPROCESSABLE_ENTITY';
          break;
        case HttpStatus.TOO_MANY_REQUESTS:
          code = 'TOO_MANY_REQUESTS';
          break;
        default:
          code = `HTTP_${statusCode}`;
      }

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const resObj = exceptionResponse as Record<string, unknown>;

        if (typeof resObj.message === 'string') {
          message = resObj.message;
        } else if (Array.isArray(resObj.message)) {
          code = 'VALIDATION_FAILED';
          message = 'Validation failed';
          errors = resObj.message.map((msg: unknown) => {
            if (typeof msg === 'string') {
              const parts = msg.split(' ');
              return {
                field: parts[0] || 'field',
                message: msg,
              };
            }
            return {
              field: 'general',
              message: String(msg),
            };
          });
        }

        if (typeof resObj.error === 'string' && !errors) {
          code = (resObj.error as string).toUpperCase().replace(/\s+/g, '_');
        }
      }
    }
    // 2. Handle Prisma Client Known Request Errors
    else if (
      exception &&
      typeof exception === 'object' &&
      'code' in exception &&
      typeof (exception as any).code === 'string' &&
      (exception as any).code.startsWith('P')
    ) {
      const prismaCode = (exception as any).code;

      switch (prismaCode) {
        case 'P2002': {
          statusCode = HttpStatus.CONFLICT;
          code = 'DUPLICATE_RESOURCE_CONFLICT';
          const target = (exception as any).meta?.target;
          const targetField = Array.isArray(target) ? target.join(', ') : target;
          message = targetField
            ? `Data with specified ${targetField} already exists in the system.`
            : 'A resource with this unique value already exists in the system.';
          break;
        }
        case 'P2025': {
          statusCode = HttpStatus.NOT_FOUND;
          code = 'RESOURCE_NOT_FOUND';
          message = 'The requested resource was not found or has been deleted from the system.';
          break;
        }
        case 'P2003': {
          statusCode = HttpStatus.BAD_REQUEST;
          code = 'FOREIGN_KEY_CONSTRAINT_VIOLATION';
          message = 'Operation cannot be processed due to relational data dependency.';
          break;
        }
        case 'P2014': {
          statusCode = HttpStatus.BAD_REQUEST;
          code = 'REQUIRED_RELATION_VIOLATION';
          message = 'The requested change violates a required data relationship.';
          break;
        }
        default: {
          statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
          code = `PRISMA_${prismaCode}`;
          message = 'A database storage error occurred.';
          break;
        }
      }

      this.logger.warn(
        `[${correlationId}] Prisma exception ${prismaCode} on ${request.method} ${request.url}: ${message}`,
      );
    }
    // 3. Handle unhandled Error instances
    else if (exception instanceof Error) {
      this.logger.error(
        `[${correlationId}] Unhandled exception on ${request.method} ${request.url}: ${exception.message}`,
        exception.stack,
      );

      if (process.env.NODE_ENV !== 'production') {
        message = exception.message || 'An unexpected internal error occurred';
      } else {
        message = 'An unexpected internal server error occurred. Please contact administrator.';
      }
    }

    const errorResponse: ApiErrorResponseDto = {
      success: false,
      message,
      code,
      data: null,
      ...(errors && errors.length > 0 ? { errors } : {}),
      meta: {
        timestamp: new Date().toISOString(),
        path: request.url,
        correlationId,
      },
      statusCode,
    };

    response.status(statusCode).json(errorResponse);
  }
}

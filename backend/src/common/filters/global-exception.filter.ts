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

    const correlationId = (request.headers['x-correlation-id'] ||
      request.headers['x-request-id']) as string | undefined;

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error occurred';
    let errors: ValidationErrorDetailDto[] | undefined = undefined;

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const resObj = exceptionResponse as Record<string, unknown>;

        if (typeof resObj.message === 'string') {
          message = resObj.message;
        } else if (Array.isArray(resObj.message)) {
          // Format validation errors from ValidationPipe
          message = 'Validation failed';
          errors = resObj.message.map((msg: unknown) => {
            if (typeof msg === 'string') {
              // Parse "field error description"
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

        // Keep clean message from exception
        if (typeof resObj.message === 'string') {
          message = resObj.message;
        }
      }
    } else if (exception instanceof Error) {
      this.logger.error(
        `Unhandled exception on ${request.method} ${request.url}: ${exception.message}`,
        exception.stack,
      );

      // In development mode, provide error message; in production, keep generic
      if (process.env.NODE_ENV !== 'production') {
        message = exception.message || 'An unexpected internal error occurred';
      }
    }

    const errorResponse: ApiErrorResponseDto = {
      success: false,
      message,
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

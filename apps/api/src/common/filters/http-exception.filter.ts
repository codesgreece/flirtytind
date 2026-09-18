import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const isProd = process.env.NODE_ENV === 'production';

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let body: Record<string, unknown> = {
      statusCode: status,
      message: 'Internal server error',
    };

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      if (typeof res === 'string') {
        body = { statusCode: status, message: res };
      } else {
        body = { statusCode: status, ...(res as object) };
      }
    } else if (exception instanceof Error) {
      this.logger.error(exception.message, exception.stack);
      body = {
        statusCode: status,
        message: isProd ? 'Internal server error' : exception.message,
      };
      if (!isProd) {
        body.stack = exception.stack;
      }
    }

    // Never leak stack traces in production responses
    if (isProd && 'stack' in body) {
      delete body.stack;
    }

    response.status(status).json({
      ...body,
      timestamp: new Date().toISOString(),
    });
  }
}

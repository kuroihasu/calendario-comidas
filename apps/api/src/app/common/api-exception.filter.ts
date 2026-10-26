import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { ThrottlerException } from '@nestjs/throttler';
import { Prisma } from '@prisma/client';
import { ApiErrorBody, ApiErrorCode } from '@cc/contracts';
import type { Request, Response } from 'express';
import { ApiException } from './errors';

const STATUS_CODES: Partial<Record<number, ApiErrorCode>> = {
  400: 'VALIDATION_ERROR',
  401: 'UNAUTHENTICATED',
  403: 'FORBIDDEN',
  404: 'NOT_FOUND',
  409: 'CONFLICT',
  422: 'BUSINESS_RULE',
  429: 'RATE_LIMITED',
};

/** Traduce cualquier error al formato único y nunca expone trazas ni SQL. */
@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('API');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const req = ctx.getRequest<Request & { id?: string }>();
    const res = ctx.getResponse<Response>();
    const requestId = req.id;

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let body: ApiErrorBody['error'] = { code: 'INTERNAL', message: 'Error inesperado', requestId };

    if (exception instanceof ApiException) {
      status = exception.getStatus();
      body = { code: exception.code, message: exception.message, ...exception.extra, requestId };
    } else if (exception instanceof ThrottlerException) {
      status = HttpStatus.TOO_MANY_REQUESTS;
      body = { code: 'RATE_LIMITED', message: 'Demasiadas solicitudes, intenta en un momento', requestId };
      res.setHeader('Retry-After', '60');
    } else if (exception instanceof Prisma.PrismaClientKnownRequestError && exception.code === 'P2002') {
      status = HttpStatus.CONFLICT;
      body = { code: 'CONFLICT', message: 'Ya existe un registro con ese valor único', requestId };
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      body = { code: STATUS_CODES[status] ?? 'INTERNAL', message: exception.message, requestId };
    }

    if (status >= 500) {
      this.logger.error(`${req.method} ${req.url} [${requestId}]`, (exception as Error)?.stack);
    }
    res.status(status).json({ error: body } satisfies ApiErrorBody);
  }
}

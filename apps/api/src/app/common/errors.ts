import { HttpException, HttpStatus } from '@nestjs/common';
import { ApiErrorCode } from '@cc/contracts';

/** Error conocido de la API; el filtro global lo traduce al formato único. */
export class ApiException extends HttpException {
  constructor(
    status: HttpStatus,
    readonly code: ApiErrorCode,
    message: string,
    readonly extra: { subcode?: string; details?: { path: string; message: string }[] } = {},
  ) {
    super(message, status);
  }
}

export class ValidationError extends ApiException {
  constructor(details: { path: string; message: string }[]) {
    super(HttpStatus.BAD_REQUEST, 'VALIDATION_ERROR', 'Hay campos con errores', { details });
  }
}

export class NotFound extends ApiException {
  constructor(what: string) {
    super(HttpStatus.NOT_FOUND, 'NOT_FOUND', `${what} no existe`);
  }
}

export class Conflict extends ApiException {
  constructor(message: string) {
    super(HttpStatus.CONFLICT, 'CONFLICT', message);
  }
}

export class Unauthenticated extends ApiException {
  constructor(message = 'Necesitas iniciar sesión') {
    super(HttpStatus.UNAUTHORIZED, 'UNAUTHENTICATED', message);
  }
}

export class Forbidden extends ApiException {
  constructor(message = 'Tu rol no permite esta acción') {
    super(HttpStatus.FORBIDDEN, 'FORBIDDEN', message);
  }
}

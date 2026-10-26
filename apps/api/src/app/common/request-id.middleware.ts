import { randomUUID } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';

/** Cada respuesta lleva un requestId para cruzarla con los logs. */
export function requestId(req: Request & { id?: string }, res: Response, next: NextFunction) {
  req.id = (req.headers['x-request-id'] as string) || randomUUID();
  res.setHeader('X-Request-Id', req.id);
  next();
}

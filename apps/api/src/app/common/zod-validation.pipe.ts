import { PipeTransform } from '@nestjs/common';
import { ZodSchema } from 'zod';
import { ValidationError } from './errors';

/** Valida body o query con un esquema Zod compartido; es la validación que manda. */
export class ZodValidationPipe<T> implements PipeTransform<unknown, T> {
  constructor(private readonly schema: ZodSchema<T>) {}

  transform(value: unknown): T {
    const result = this.schema.safeParse(value);
    if (!result.success) {
      throw new ValidationError(
        result.error.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
      );
    }
    return result.data;
  }
}

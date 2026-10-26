import { CanActivate, ExecutionContext, Injectable, SetMetadata } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import { Forbidden, Unauthenticated } from '../common/errors';

export const SESSION_COOKIE = 'cc_admin';

export interface AdminSession {
  sub: string;
  email: string;
  role: 'admin' | 'editor';
}

export type AdminRequest = Request & { admin?: AdminSession };

const ROLES_KEY = 'roles';
/** Limita un endpoint a ciertos roles; sin el decorador basta con estar logueado. */
export const Roles = (...roles: AdminSession['role'][]) => SetMetadata(ROLES_KEY, roles);

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest<AdminRequest>();
    const token = req.cookies?.[SESSION_COOKIE];
    if (!token) throw new Unauthenticated();
    try {
      req.admin = await this.jwt.verifyAsync<AdminSession>(token);
    } catch {
      throw new Unauthenticated('Tu sesión expiró');
    }
    const roles = this.reflector.getAllAndOverride<AdminSession['role'][]>(ROLES_KEY, [ctx.getHandler(), ctx.getClass()]);
    if (roles?.length && !roles.includes(req.admin.role)) throw new Forbidden();
    return true;
  }
}

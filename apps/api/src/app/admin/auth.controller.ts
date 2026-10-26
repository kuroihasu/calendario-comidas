import { Body, Controller, Get, HttpCode, Post, Req, Res, UseGuards } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Throttle } from '@nestjs/throttler';
import { verify } from 'argon2';
import { loginSchema } from '@cc/contracts';
import type { Response } from 'express';
import { PrismaService } from '../prisma/prisma.service';
import { Unauthenticated } from '../common/errors';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { AdminGuard, AdminRequest, AdminSession, SESSION_COOKIE } from './auth.guard';

const SESSION_HOURS = 12;

@Controller('admin')
export class AuthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  @Post('login')
  @HttpCode(200)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async login(
    @Body(new ZodValidationPipe(loginSchema)) body: { email: string; password: string },
    @Res({ passthrough: true }) res: Response,
  ) {
    const user = await this.prisma.adminUser.findUnique({ where: { email: body.email } });
    if (!user || !(await verify(user.passwordHash, body.password))) {
      throw new Unauthenticated('Correo o contraseña incorrectos');
    }
    const session: AdminSession = { sub: user.id, email: user.email, role: user.role };
    const token = await this.jwt.signAsync(session, { expiresIn: `${SESSION_HOURS}h` });
    res.cookie(SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: 'strict',
      secure: process.env['NODE_ENV'] === 'production',
      maxAge: SESSION_HOURS * 3_600_000,
      path: '/',
    });
    return { email: user.email, role: user.role };
  }

  @Post('logout')
  @HttpCode(204)
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie(SESSION_COOKIE, { path: '/' });
  }

  @Get('me')
  @UseGuards(AdminGuard)
  me(@Req() req: AdminRequest) {
    return { email: req.admin?.email, role: req.admin?.role };
  }
}

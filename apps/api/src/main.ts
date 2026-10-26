import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import { AppModule } from './app/app.module';
import { requestId } from './app/common/request-id.middleware';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api/v1');
  app.use(requestId);
  app.use(cookieParser());
  app.getHttpAdapter().getInstance().set('trust proxy', 1);
  const port = process.env['PORT'] || 3000;
  await app.listen(port);
  Logger.log(`API en http://localhost:${port}/api/v1`);
}

bootstrap();

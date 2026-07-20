import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import type { Environment } from '@smart-citizen/shared-configuration';
import cookieParser = require('cookie-parser');
import { AppModule } from './app/app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configuration = app.get(ConfigService<Environment, true>);
  const globalPrefix = 'api/v1';

  app.setGlobalPrefix(globalPrefix);
  app.use(cookieParser());
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );
  app.enableCors({
    origin: configuration.get('WEB_ORIGIN', { infer: true }),
    credentials: true,
  });

  if (configuration.get('NODE_ENV', { infer: true }) !== 'production') {
    const openApiConfig = new DocumentBuilder()
      .setTitle('Smart Citizen API')
      .setDescription('Administrative API for Smart Citizen communities.')
      .setVersion('1.0')
      .build();
    const document = SwaggerModule.createDocument(app, openApiConfig);
    SwaggerModule.setup('api/docs', app, document);
  }

  const port = configuration.get('PORT', { infer: true });
  await app.listen(port);
  Logger.log(`API available at http://localhost:${port}/${globalPrefix}`);
}

void bootstrap();

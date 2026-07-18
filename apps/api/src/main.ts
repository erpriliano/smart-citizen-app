import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { parseEnvironment } from '@smart-citizen/shared-configuration';
import { AppModule } from './app/app.module';

async function bootstrap() {
  const environment = parseEnvironment(process.env);
  const app = await NestFactory.create(AppModule);
  const globalPrefix = 'api/v1';

  app.setGlobalPrefix(globalPrefix);
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
    }),
  );
  app.enableCors({
    origin: environment.WEB_ORIGIN,
  });

  if (environment.NODE_ENV !== 'production') {
    const openApiConfig = new DocumentBuilder()
      .setTitle('Smart Citizen API')
      .setDescription('Administrative API for Smart Citizen communities.')
      .setVersion('1.0')
      .build();
    const document = SwaggerModule.createDocument(app, openApiConfig);
    SwaggerModule.setup('api/docs', app, document);
  }

  const port = environment.PORT;
  await app.listen(port);
  Logger.log(`API available at http://localhost:${port}/${globalPrefix}`);
}

void bootstrap();

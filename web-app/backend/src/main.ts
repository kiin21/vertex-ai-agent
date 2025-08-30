import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { ValidationExceptionFilter } from './common/filters/validation-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { SecurityAuditInterceptor } from './common/interceptors/security-audit.interceptor';
import { SanitizationPipe } from './common/pipes/sanitization.pipe';
import { swaggerConfig } from './config/swagger.config';
import helmet from 'helmet';
import * as compression from 'compression';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Security middleware
  if (configService.get<boolean>('app.security.enableHelmet', true)) {
    app.use(
      helmet({
        contentSecurityPolicy: {
          directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", 'data:', 'https:'],
          },
        },
        crossOriginEmbedderPolicy: false, // Disable for Swagger UI
      }),
    );
  }

  app.use(compression());

  // CORS
  if (configService.get<boolean>('app.security.enableCors', true)) {
    app.enableCors({
      origin: configService.get<string>('app.cors.origin'),
      credentials: configService.get<boolean>('app.cors.credentials'),
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    });
  }

  // Global prefix
  app.setGlobalPrefix(configService.get<string>('app.apiPrefix', 'api'));

  // Global pipes
  app.useGlobalPipes(
    new SanitizationPipe(), // Add sanitization pipe
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      disableErrorMessages:
        configService.get<string>('app.nodeEnv') === 'production',
    }),
  );

  // Global filters
  app.useGlobalFilters(
    new HttpExceptionFilter(),
    new ValidationExceptionFilter(),
  );

  // Global interceptors
  app.useGlobalInterceptors(
    new SecurityAuditInterceptor(),
    new LoggingInterceptor(),
    new TransformInterceptor(),
  );

  // Swagger Documentation
  if (configService.get<string>('app.nodeEnv') !== 'production') {
    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api-docs', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
        tagsSorter: 'alpha',
        operationsSorter: 'alpha',
      },
      customSiteTitle: 'Student360 AI API Documentation',
      customfavIcon: '/favicon.ico',
      customCss: `
        .swagger-ui .topbar { display: none }
        .swagger-ui .info { margin: 20px 0 }
        .swagger-ui .info .title { color: #2c3e50 }
      `,
    });
  }

  const port = configService.get<number>('app.port', 3000);
  await app.listen(port);
  console.log(`🚀 Application is running on: http://localhost:${port}`);
  console.log(`📚 Swagger documentation: http://localhost:${port}/api-docs`);
}

bootstrap();

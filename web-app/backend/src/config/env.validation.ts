import { plainToInstance, Transform } from 'class-transformer';
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  validateSync,
} from 'class-validator';

enum Environment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

export class EnvironmentVariables {
  @IsEnum(Environment)
  @IsOptional()
  NODE_ENV: Environment = Environment.Development;

  @IsNumber()
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  PORT: number = 3000;

  @IsString()
  @IsOptional()
  API_PREFIX: string = 'api';

  // Database Configuration
  @IsString()
  @IsOptional()
  DATABASE_HOST: string = 'localhost';

  @IsNumber()
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  DATABASE_PORT: number = 5432;

  @IsString()
  @IsOptional()
  DATABASE_USERNAME: string = 'student_api';

  @IsString()
  @IsOptional()
  DATABASE_PASSWORD: string = 'password';

  @IsString()
  @IsOptional()
  DATABASE_NAME: string = 'student_db';

  // JWT Configuration
  @IsString()
  JWT_SECRET: string;

  @IsString()
  @IsOptional()
  JWT_EXPIRES_IN: string = '24h';

  // CORS Configuration
  @IsString()
  @IsOptional()
  CORS_ORIGIN: string = 'http://localhost:3001';

  @IsString()
  @IsOptional()
  CORS_CREDENTIALS: string = 'true';

  // Swagger Configuration
  @IsString()
  @IsOptional()
  SWAGGER_ENABLED: string = 'true';

  @IsString()
  @IsOptional()
  SWAGGER_TITLE: string = 'Student360 API';

  @IsString()
  @IsOptional()
  SWAGGER_DESCRIPTION: string = 'Student360 AI Mentoring API Documentation';

  @IsString()
  @IsOptional()
  SWAGGER_VERSION: string = '1.0.0';

  @IsString()
  @IsOptional()
  SWAGGER_TAG: string = 'student360-api';

  // Google Cloud Configuration
  @IsString()
  @IsOptional()
  GOOGLE_CLOUD_PROJECT_ID: string;

  @IsString()
  @IsOptional()
  GOOGLE_CLOUD_LOCATION: string = 'us-central1';

  @IsString()
  @IsOptional()
  REASONING_ENGINE_ID: string;

  // Google Cloud Vertex AI Configuration
  @IsString()
  @IsOptional()
  VERTEX_AI_MODEL: string = 'gemini-1.5-pro';

  @IsNumber()
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  VERTEX_AI_MAX_TOKENS: number = 2048;

  @IsNumber()
  @IsOptional()
  @Transform(({ value }) => parseFloat(value))
  VERTEX_AI_TEMPERATURE: number = 0.7;

  @IsNumber()
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  VERTEX_AI_TIMEOUT: number = 30000;

  // Rate Limiting
  @IsNumber()
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  RATE_LIMIT_TTL: number = 60;

  @IsNumber()
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  RATE_LIMIT_LIMIT: number = 100;
}

export function validate(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    throw new Error(errors.toString());
  }
  return validatedConfig;
}

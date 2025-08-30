import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  port: parseInt(process.env.PORT, 10) || 3000,
  apiPrefix: process.env.API_PREFIX || 'api',
  nodeEnv: process.env.NODE_ENV || 'development',
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3001',
    credentials: process.env.CORS_CREDENTIALS === 'true' || true,
  },
  swagger: {
    enabled:
      process.env.SWAGGER_ENABLED === 'true' ||
      process.env.NODE_ENV !== 'production',
    title: process.env.SWAGGER_TITLE || 'Student360 API',
    description:
      process.env.SWAGGER_DESCRIPTION ||
      'Student360 AI Mentoring API Documentation',
    version: process.env.SWAGGER_VERSION || '1.0.0',
    tag: process.env.SWAGGER_TAG || 'student360-api',
  },
  jwt: {
    secret:
      process.env.JWT_SECRET ||
      'your-super-secret-jwt-key-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    accessTokenExpiry: process.env.JWT_ACCESS_TOKEN_EXPIRY || '15m',
    refreshTokenExpiry: process.env.JWT_REFRESH_TOKEN_EXPIRY || '7d',
  },
  rateLimit: {
    ttl: parseInt(process.env.RATE_LIMIT_TTL, 10) || 60,
    limit: parseInt(process.env.RATE_LIMIT_LIMIT, 10) || 100,
  },
  security: {
    saltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS, 10) || 12,
    enableHelmet: process.env.ENABLE_HELMET !== 'false',
    enableCors: process.env.ENABLE_CORS !== 'false',
  },
}));

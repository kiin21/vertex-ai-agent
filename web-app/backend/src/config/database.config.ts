import { registerAs } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';
import { User } from '../users/entities/user.entity';
import { UserProfile } from '../users/entities/user-profile.entity';
import { Student } from '../students/entities/student.entity';
import { AgentSession } from '../agents/entities/agent-session.entity';

export default registerAs('database', (): TypeOrmModuleOptions => {
  const isProduction = process.env.NODE_ENV === 'production';
  const isDevelopment = process.env.NODE_ENV === 'development';

  return {
    type: 'postgres',
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT, 10) || 5432,
    username: process.env.DATABASE_USERNAME || 'student_api',
    password: process.env.DATABASE_PASSWORD || 'password',
    database: process.env.DATABASE_NAME || 'student_db',

    // Entity configuration
    entities: [User, UserProfile, Student, AgentSession],

    // Migration configuration
    migrations: [__dirname + '/../database/migrations/*{.ts,.js}'],
    migrationsTableName: 'migrations',
    migrationsRun: false,

    // Development settings
    synchronize:
      !isProduction &&
      (process.env.DATABASE_SYNCHRONIZE === 'true' || isDevelopment),
    logging: isDevelopment || process.env.DATABASE_LOGGING === 'true',

    // Connection pooling
    extra: {
      connectionLimit:
        parseInt(process.env.DATABASE_CONNECTION_LIMIT, 10) || 10,
      acquireTimeout:
        parseInt(process.env.DATABASE_ACQUIRE_TIMEOUT, 10) || 30000,
      timeout: parseInt(process.env.DATABASE_TIMEOUT, 10) || 30000,

      // SSL configuration for production
      ...(isProduction && {
        ssl: {
          require: true,
          rejectUnauthorized:
            process.env.DATABASE_SSL_REJECT_UNAUTHORIZED === 'true',
        },
      }),
    },

    // Connection pooling settings
    maxQueryExecutionTime:
      parseInt(process.env.DATABASE_MAX_QUERY_TIME, 10) || 5000,

    // Use snake_case naming strategy
    namingStrategy: new SnakeNamingStrategy(),

    // Cache settings
    cache: isProduction
      ? {
          type: 'redis',
          options: {
            host: process.env.REDIS_HOST || 'localhost',
            port: parseInt(process.env.REDIS_PORT, 10) || 6379,
            password: process.env.REDIS_PASSWORD,
          },
          duration: 30000, // 30 seconds
        }
      : false,

    // Retry connection
    retryAttempts: isProduction ? 3 : 1,
    retryDelay: 3000,
    autoLoadEntities: true,

    // Drop schema in test environment
    dropSchema: process.env.NODE_ENV === 'test',
  };
});

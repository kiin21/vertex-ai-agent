import { Module, Global } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { SecurityMonitoringService } from './services/security-monitoring.service';
import { PasswordSecurityService } from './services/password-security.service';
import { CustomThrottlerGuard } from './guards/throttler.guard';
import { RolesGuard } from './guards/roles.guard';
import { JwtAuthGuard } from './guards/auth.guard';

@Global()
@Module({
  imports: [
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => [
        {
          name: 'default',
          ttl: configService.get<number>('throttler.ttl', 60000),
          limit: configService.get<number>('throttler.limit', 10),
        },
        {
          name: 'auth',
          ttl: configService.get<number>('throttler.auth.ttl', 900000), // 15 minutes
          limit: configService.get<number>('throttler.auth.limit', 5),
        },
      ],
    }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('app.jwt.secret'),
        signOptions: {
          expiresIn: configService.get<string>('app.jwt.expiresIn'),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [
    SecurityMonitoringService,
    PasswordSecurityService,
    CustomThrottlerGuard,
    RolesGuard,
    JwtAuthGuard,
  ],
  exports: [
    SecurityMonitoringService,
    PasswordSecurityService,
    CustomThrottlerGuard,
    RolesGuard,
    JwtAuthGuard,
    ThrottlerModule,
    JwtModule,
  ],
})
export class SecurityModule {}

import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, headers, ip, user } = request;
    const now = Date.now();
    const userAgent = headers['user-agent'] || 'Unknown';
    const userId = user?.sub || 'Anonymous';

    // Sanitize sensitive data from body
    const sanitizedBody = this.sanitizeRequestBody(request.body);

    this.logger.log(
      `📥 [${method}] ${url} | User: ${userId} | IP: ${ip} | UA: ${userAgent} | Body: ${JSON.stringify(
        sanitizedBody,
      )}`,
    );

    return next.handle().pipe(
      tap(() => {
        const response = context.switchToHttp().getResponse();
        const { statusCode } = response;
        const responseTime = Date.now() - now;

        this.logger.log(
          `📤 [${method}] ${url} | Status: ${statusCode} | Time: ${responseTime}ms | User: ${userId}`,
        );

        // Log slow requests
        if (responseTime > 1000) {
          this.logger.warn(
            `🐌 Slow Request: [${method}] ${url} took ${responseTime}ms | User: ${userId}`,
          );
        }
      }),
      catchError((error) => {
        const responseTime = Date.now() - now;

        this.logger.error(
          `❌ [${method}] ${url} | Error: ${error.message} | Time: ${responseTime}ms | User: ${userId} | IP: ${ip}`,
        );

        // Log security-related errors with more detail
        if (this.isSecurityError(error)) {
          this.logger.warn(
            `🔐 Security Alert: ${error.message} | [${method}] ${url} | User: ${userId} | IP: ${ip} | UA: ${userAgent}`,
          );
        }

        return throwError(() => error);
      }),
    );
  }

  private sanitizeRequestBody(body: any): any {
    if (!body) return {};

    const sensitiveFields = [
      'password',
      'token',
      'secret',
      'key',
      'authorization',
    ];
    const sanitized = { ...body };

    sensitiveFields.forEach((field) => {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    });

    return sanitized;
  }

  private isSecurityError(error: any): boolean {
    const securityErrorNames = [
      'UnauthorizedException',
      'ForbiddenException',
      'ThrottlerException',
    ];

    const securityMessages = [
      'invalid token',
      'unauthorized',
      'forbidden',
      'rate limit',
      'too many requests',
    ];

    return (
      securityErrorNames.includes(error.constructor.name) ||
      securityMessages.some((msg) => error.message?.toLowerCase().includes(msg))
    );
  }
}

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
export class SecurityAuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger(SecurityAuditInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, headers, ip, user } = request;
    const userAgent = headers['user-agent'] || 'Unknown';
    const userId = user?.sub || 'Anonymous';

    // Log sensitive operations
    if (this.isSensitiveOperation(method, url)) {
      this.logger.warn(
        `🔍 Sensitive Operation: [${method}] ${url} | User: ${userId} | IP: ${ip} | UA: ${userAgent}`,
      );
    }

    // Check for suspicious patterns
    this.checkSuspiciousPatterns(request);

    return next.handle().pipe(
      tap((_data) => {
        // Log successful sensitive operations
        if (this.isSensitiveOperation(method, url)) {
          this.logger.log(
            `✅ Sensitive Operation Completed: [${method}] ${url} | User: ${userId}`,
          );
        }
      }),
      catchError((error) => {
        // Log failed sensitive operations
        if (this.isSensitiveOperation(method, url)) {
          this.logger.error(
            `❌ Sensitive Operation Failed: [${method}] ${url} | User: ${userId} | Error: ${error.message}`,
          );
        }

        return throwError(() => error);
      }),
    );
  }

  private isSensitiveOperation(method: string, url: string): boolean {
    const sensitivePatterns = [
      /\/auth\/(login|register|logout)/,
      /\/users\/\d+\/password/,
      /\/admin/,
      /\/api\/agents/,
      /delete/i,
    ];

    const sensitiveMethods = ['DELETE', 'PUT', 'PATCH'];

    return (
      sensitivePatterns.some((pattern) => pattern.test(url)) ||
      sensitiveMethods.includes(method.toUpperCase())
    );
  }

  private checkSuspiciousPatterns(request: any): void {
    const { headers, url, ip, user } = request;
    const userAgent = headers['user-agent'] || '';
    const userId = user?.sub || 'Anonymous';

    // Check for suspicious user agents
    const suspiciousAgents = [/bot/i, /crawler/i, /scanner/i, /curl/i, /wget/i];

    if (suspiciousAgents.some((pattern) => pattern.test(userAgent))) {
      this.logger.warn(
        `🤖 Suspicious User Agent: ${userAgent} | URL: ${url} | IP: ${ip} | User: ${userId}`,
      );
    }

    // Check for path traversal attempts
    if (url.includes('../') || url.includes('..\\')) {
      this.logger.warn(
        `🚨 Path Traversal Attempt: ${url} | IP: ${ip} | User: ${userId}`,
      );
    }

    // Check for SQL injection patterns
    const sqlPatterns = [
      /('|\\'|;|\\|--|%27|%3B|%3D)/i,
      /(union|select|insert|delete|update|drop|create|alter|exec|execute)/i,
    ];

    if (sqlPatterns.some((pattern) => pattern.test(url))) {
      this.logger.warn(
        `🚨 Potential SQL Injection: ${url} | IP: ${ip} | User: ${userId}`,
      );
    }

    // Check for XSS patterns
    const xssPatterns = [/<script/i, /javascript:/i, /onclick=/i, /onerror=/i];

    if (xssPatterns.some((pattern) => pattern.test(url))) {
      this.logger.warn(
        `🚨 Potential XSS Attempt: ${url} | IP: ${ip} | User: ${userId}`,
      );
    }
  }
}

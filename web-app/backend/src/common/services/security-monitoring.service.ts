import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface SecurityEvent {
  type:
    | 'AUTHENTICATION_FAILURE'
    | 'RATE_LIMIT_EXCEEDED'
    | 'SUSPICIOUS_ACTIVITY'
    | 'UNAUTHORIZED_ACCESS'
    | 'VALIDATION_ERROR';
  userId?: string;
  ip: string;
  userAgent?: string;
  url: string;
  method: string;
  details?: any;
  timestamp: Date;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

@Injectable()
export class SecurityMonitoringService {
  private readonly logger = new Logger(SecurityMonitoringService.name);
  private securityEvents: Map<string, SecurityEvent[]> = new Map();
  private readonly maxEventsPerIP = 100;
  private readonly eventRetentionHours = 24;

  constructor(private configService: ConfigService) {
    // Clean up old events every hour
    setInterval(() => this.cleanupOldEvents(), 60 * 60 * 1000);
  }

  logSecurityEvent(event: Omit<SecurityEvent, 'timestamp'>): void {
    const fullEvent: SecurityEvent = {
      ...event,
      timestamp: new Date(),
    };

    // Store event for analysis
    this.storeEvent(event.ip, fullEvent);

    // Log based on severity
    switch (event.severity) {
      case 'CRITICAL':
        this.logger.error(
          `🚨 CRITICAL SECURITY EVENT: ${event.type} | User: ${
            event.userId || 'Anonymous'
          } | IP: ${event.ip} | ${event.method} ${event.url}`,
        );
        break;
      case 'HIGH':
        this.logger.warn(
          `⚠️ HIGH SECURITY EVENT: ${event.type} | User: ${
            event.userId || 'Anonymous'
          } | IP: ${event.ip} | ${event.method} ${event.url}`,
        );
        break;
      case 'MEDIUM':
        this.logger.warn(
          `🔸 MEDIUM SECURITY EVENT: ${event.type} | User: ${
            event.userId || 'Anonymous'
          } | IP: ${event.ip} | ${event.method} ${event.url}`,
        );
        break;
      case 'LOW':
        this.logger.log(
          `🔹 LOW SECURITY EVENT: ${event.type} | User: ${
            event.userId || 'Anonymous'
          } | IP: ${event.ip} | ${event.method} ${event.url}`,
        );
        break;
    }

    // Check for patterns that might indicate an attack
    this.analyzeSecurityPatterns(event.ip);
  }

  private storeEvent(ip: string, event: SecurityEvent): void {
    if (!this.securityEvents.has(ip)) {
      this.securityEvents.set(ip, []);
    }

    const events = this.securityEvents.get(ip)!;
    events.push(event);

    // Keep only the most recent events
    if (events.length > this.maxEventsPerIP) {
      events.splice(0, events.length - this.maxEventsPerIP);
    }
  }

  private analyzeSecurityPatterns(ip: string): void {
    const events = this.securityEvents.get(ip) || [];
    const recentEvents = events.filter(
      (event) => Date.now() - event.timestamp.getTime() < 60 * 60 * 1000, // Last hour
    );

    // Check for brute force attacks
    const authFailures = recentEvents.filter(
      (event) => event.type === 'AUTHENTICATION_FAILURE',
    );

    if (authFailures.length >= 5) {
      this.logger.error(
        `🚨 POTENTIAL BRUTE FORCE ATTACK: ${authFailures.length} authentication failures from IP ${ip} in the last hour`,
      );
    }

    // Check for suspicious activity patterns
    const suspiciousEvents = recentEvents.filter(
      (event) => event.type === 'SUSPICIOUS_ACTIVITY',
    );

    if (suspiciousEvents.length >= 10) {
      this.logger.error(
        `🚨 HIGH SUSPICIOUS ACTIVITY: ${suspiciousEvents.length} suspicious events from IP ${ip} in the last hour`,
      );
    }

    // Check for rate limit violations
    const rateLimitEvents = recentEvents.filter(
      (event) => event.type === 'RATE_LIMIT_EXCEEDED',
    );

    if (rateLimitEvents.length >= 20) {
      this.logger.error(
        `🚨 AGGRESSIVE RATE LIMITING: ${rateLimitEvents.length} rate limit violations from IP ${ip} in the last hour`,
      );
    }
  }

  getSecuritySummary(): any {
    const summary = {
      totalIPs: this.securityEvents.size,
      recentEvents: 0,
      eventsByType: {} as Record<string, number>,
      eventsBySeverity: {} as Record<string, number>,
      topOffendingIPs: [] as { ip: string; eventCount: number }[],
    };

    const oneHourAgo = Date.now() - 60 * 60 * 1000;

    for (const [ip, events] of this.securityEvents.entries()) {
      const recentIPEvents = events.filter(
        (event) => event.timestamp.getTime() > oneHourAgo,
      );

      summary.recentEvents += recentIPEvents.length;

      if (recentIPEvents.length > 0) {
        summary.topOffendingIPs.push({
          ip,
          eventCount: recentIPEvents.length,
        });
      }

      for (const event of recentIPEvents) {
        summary.eventsByType[event.type] =
          (summary.eventsByType[event.type] || 0) + 1;
        summary.eventsBySeverity[event.severity] =
          (summary.eventsBySeverity[event.severity] || 0) + 1;
      }
    }

    // Sort top offending IPs
    summary.topOffendingIPs.sort((a, b) => b.eventCount - a.eventCount);
    summary.topOffendingIPs = summary.topOffendingIPs.slice(0, 10);

    return summary;
  }

  private cleanupOldEvents(): void {
    const cutoffTime = Date.now() - this.eventRetentionHours * 60 * 60 * 1000;
    let cleanedCount = 0;

    for (const [ip, events] of this.securityEvents.entries()) {
      const filteredEvents = events.filter(
        (event) => event.timestamp.getTime() > cutoffTime,
      );

      if (filteredEvents.length === 0) {
        this.securityEvents.delete(ip);
      } else {
        this.securityEvents.set(ip, filteredEvents);
      }

      cleanedCount += events.length - filteredEvents.length;
    }

    if (cleanedCount > 0) {
      this.logger.log(`🧹 Cleaned up ${cleanedCount} old security events`);
    }
  }
}

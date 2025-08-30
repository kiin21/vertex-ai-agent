import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { ExecutionContext } from '@nestjs/common';

@Injectable()
export class CustomThrottlerGuard extends ThrottlerGuard {
  protected errorMessage = 'Too many requests. Please try again later.';

  protected async getTracker(req: Record<string, any>): Promise<string> {
    // Use IP address and user ID (if authenticated) for more precise rate limiting
    const ip = req.ip || req.connection.remoteAddress;
    const userId = req.user?.userId;

    return userId ? `${ip}-${userId}` : ip;
  }

  protected generateKey(
    context: ExecutionContext,
    suffix: string,
    name: string,
  ): string {
    const handler = context.getHandler();
    const className = context.getClass();

    // Create more specific rate limiting keys based on endpoint
    return `${className.name}-${handler.name}-${suffix}-${name}`;
  }
}

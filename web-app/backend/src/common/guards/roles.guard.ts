import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
  MODERATOR = 'moderator',
}

export const ROLES_KEY = 'roles';

@Injectable()
export class RolesGuard implements CanActivate {
  private readonly logger = new Logger(RolesGuard.name);

  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      this.logger.warn('Role check failed: No user in request');
      throw new ForbiddenException('User not authenticated');
    }

    const userRoles = user.roles || [];
    const hasRole = requiredRoles.some((role) => userRoles.includes(role));

    if (!hasRole) {
      this.logger.warn(
        `Role check failed: User ${user.sub} with roles [${userRoles}] attempted to access resource requiring [${requiredRoles}]`,
      );
      throw new ForbiddenException('Insufficient permissions');
    }

    this.logger.log(`Role check passed: User ${user.sub} has required roles`);
    return true;
  }
}

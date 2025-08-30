import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  private readonly logger = new Logger(JwtAuthGuard.name);

  constructor(
    private jwtService: JwtService,
    private reflector: Reflector,
    private configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      this.logger.warn(
        `Authentication failed: No token provided from IP ${request.ip}`,
      );
      throw new UnauthorizedException('Token not found');
    }

    try {
      const payload = await this.validateToken(token);
      request.user = payload;

      // Check if user is active/enabled
      if (payload.status && payload.status !== 'active') {
        this.logger.warn(
          `Authentication failed: User ${payload.sub} is not active`,
        );
        throw new ForbiddenException('User account is not active');
      }

      // Log successful authentication
      this.logger.log(`User ${payload.sub} authenticated successfully`);

      return true;
    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw error;
      }

      this.logger.warn(
        `Authentication failed: ${error.message} from IP ${request.ip}`,
      );
      throw new UnauthorizedException('Invalid token');
    }
  }

  private async validateToken(token: string): Promise<any> {
    try {
      const payload = this.jwtService.verify(token);

      // Check token expiration with buffer
      const now = Math.floor(Date.now() / 1000);
      const bufferTime = this.configService.get<number>(
        'auth.tokenExpirationBuffer',
        60,
      ); // 60 seconds buffer

      if (payload.exp && payload.exp - bufferTime <= now) {
        throw new UnauthorizedException('Token is about to expire');
      }

      // Validate required fields
      if (!payload.sub || !payload.email) {
        throw new UnauthorizedException('Invalid token payload');
      }

      return payload;
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new UnauthorizedException('Token has expired');
      } else if (error.name === 'JsonWebTokenError') {
        throw new UnauthorizedException('Malformed token');
      } else if (error.name === 'NotBeforeError') {
        throw new UnauthorizedException('Token not active yet');
      }
      throw error;
    }
  }

  private extractTokenFromHeader(request: any): string | undefined {
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      return undefined;
    }

    const [type, token] = authHeader.split(' ');

    // Validate Bearer token format
    if (type !== 'Bearer' || !token || token.length === 0) {
      return undefined;
    }

    // Basic token format validation
    if (token.split('.').length !== 3) {
      return undefined;
    }

    return token;
  }
}

import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { LoginDto, RegisterDto, RefreshTokenDto } from './dto';
import { User } from '../users/entities/user.entity';

export interface AuthResult {
  access_token: string;
  refresh_token: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
}

export interface TokenPayload {
  email: string;
  sub: string;
  role: string;
  type?: 'access' | 'refresh';
}

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  private generateAccessToken(payload: TokenPayload): string {
    return this.jwtService.sign(
      { ...payload, type: 'access' },
      {
        expiresIn: this.configService.get<string>(
          'app.jwt.accessTokenExpiry',
          '15m',
        ),
        secret: this.configService.get<string>('app.jwt.secret'),
      },
    );
  }

  private generateRefreshToken(payload: TokenPayload): string {
    return this.jwtService.sign(
      { ...payload, type: 'refresh' },
      {
        expiresIn: this.configService.get<string>(
          'app.jwt.refreshTokenExpiry',
          '7d',
        ),
        secret: this.configService.get<string>('app.jwt.secret'),
      },
    );
  }

  private generateTokens(user: User) {
    const payload: TokenPayload = {
      email: user.email,
      sub: user.id,
      role: user.role,
    };

    return {
      access_token: this.generateAccessToken(payload),
      refresh_token: this.generateRefreshToken(payload),
    };
  }

  async login(loginDto: LoginDto): Promise<AuthResult> {
    // Validate input
    if (!loginDto.email || !loginDto.password) {
      throw new BadRequestException('Email and password are required');
    }

    const user = await this.usersService.validateUser(
      loginDto.email,
      loginDto.password,
    );

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!user.isActive) {
      throw new UnauthorizedException(
        'Account is deactivated. Please contact support.',
      );
    }

    const tokens = this.generateTokens(user);

    return {
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  }

  async register(registerDto: RegisterDto): Promise<AuthResult> {
    // Check if user already exists
    const existingUser = await this.usersService.findByEmail(registerDto.email);
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Create new user
    try {
      const user = await this.usersService.create(registerDto);

      const tokens = this.generateTokens(user);

      return {
        ...tokens,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      };
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new BadRequestException('Failed to create user account');
    }
  }

  async validateUserById(userId: string): Promise<User> {
    return this.usersService.findOne(userId);
  }

  async refreshToken(refreshTokenDto: RefreshTokenDto): Promise<AuthResult> {
    try {
      const payload = this.jwtService.verify(refreshTokenDto.refresh_token, {
        secret: this.configService.get<string>('app.jwt.secret'),
      }) as TokenPayload;

      if (payload.type !== 'refresh') {
        throw new UnauthorizedException('Invalid token type');
      }

      const user = await this.usersService.findOne(payload.sub);
      if (!user || !user.isActive) {
        throw new UnauthorizedException('User not found or inactive');
      }

      const tokens = this.generateTokens(user);

      return {
        ...tokens,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async seedAdminUser(): Promise<void> {
    const adminEmail = 'admin@example.com';
    const existingAdmin = await this.usersService.findByEmail(adminEmail);

    if (!existingAdmin) {
      await this.usersService.create({
        name: 'Admin User',
        email: adminEmail,
        password: 'admin123',
        role: 'admin' as any,
      });
    }
  }
}

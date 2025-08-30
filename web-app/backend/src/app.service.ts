import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Welcome to Student API! 🎓';
  }

  healthCheck(): object {
    return {
      status: 'OK',
      message: 'Student API is running successfully',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
    };
  }
}

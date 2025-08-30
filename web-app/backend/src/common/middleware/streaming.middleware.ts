import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class StreamingMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Only apply to streaming endpoints
    if (req.path.includes('/chat/stream') || req.path.includes('/chat/sse')) {
      // Optimize for streaming
      res.setHeader('X-Accel-Buffering', 'no'); // Nginx
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');

      // Keep connection alive
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('Keep-Alive', 'timeout=60, max=1000');

      // CORS for streaming
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Cache-Control');
      res.setHeader('Access-Control-Expose-Headers', 'Content-Type');

      // Handle preflight requests
      if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
      }
    }

    next();
  }
}

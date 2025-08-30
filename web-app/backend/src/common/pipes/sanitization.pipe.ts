import { Injectable, PipeTransform, BadRequestException } from '@nestjs/common';
import { plainToClass } from 'class-transformer';
import { validate } from 'class-validator';

@Injectable()
export class SanitizationPipe implements PipeTransform {
  async transform(value: any, { metatype }: any) {
    if (!metatype || !this.toValidate(metatype)) {
      return value;
    }

    // Sanitize strings to prevent XSS and injection attacks
    const sanitizedValue = this.sanitizeInput(value);

    const object = plainToClass(metatype, sanitizedValue);
    const errors = await validate(object);

    if (errors.length > 0) {
      const errorMessages = errors
        .map((error) => {
          return Object.values(error.constraints || {}).join(', ');
        })
        .join('; ');

      throw new BadRequestException(`Validation failed: ${errorMessages}`);
    }

    return object;
  }

  private toValidate(metatype: any): boolean {
    const types: any[] = [String, Boolean, Number, Array, Object];
    return !types.includes(metatype);
  }

  private sanitizeInput(value: any): any {
    if (typeof value === 'string') {
      return this.sanitizeString(value);
    }

    if (Array.isArray(value)) {
      return value.map((item) => this.sanitizeInput(item));
    }

    if (typeof value === 'object' && value !== null) {
      const sanitized: any = {};
      for (const key in value) {
        if (Object.prototype.hasOwnProperty.call(value, key)) {
          sanitized[key] = this.sanitizeInput(value[key]);
        }
      }
      return sanitized;
    }

    return value;
  }

  private sanitizeString(input: string): string {
    // Remove potential XSS vectors
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '') // Remove iframe tags
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+\s*=/gi, '') // Remove event handlers like onclick=
      .replace(/data:text\/html/gi, '') // Remove data URLs
      .trim();
  }
}

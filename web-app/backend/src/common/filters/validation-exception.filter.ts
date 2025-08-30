import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { ValidationError } from 'class-validator';

@Catch(BadRequestException)
export class ValidationExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(ValidationExceptionFilter.name);

  catch(exception: BadRequestException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest();
    const status = exception.getStatus();

    const exceptionResponse = exception.getResponse() as any;

    // Check if this is a validation error
    if (this.isValidationError(exceptionResponse)) {
      const validationErrors = this.formatValidationErrors(
        exceptionResponse.message,
      );

      this.logger.warn(
        `Validation Failed: ${request.method} ${
          request.url
        } | Errors: ${JSON.stringify(validationErrors)} | IP: ${request.ip}`,
      );

      response.status(status).json({
        statusCode: status,
        error: 'Validation Failed',
        message: 'Request validation failed',
        details: validationErrors,
        timestamp: new Date().toISOString(),
        path: request.url,
      });
    } else {
      // Handle other bad request exceptions
      response.status(status).json({
        statusCode: status,
        error: 'Bad Request',
        message: exception.message,
        timestamp: new Date().toISOString(),
        path: request.url,
      });
    }
  }

  private isValidationError(exceptionResponse: any): boolean {
    return (
      exceptionResponse &&
      Array.isArray(exceptionResponse.message) &&
      exceptionResponse.message.length > 0 &&
      typeof exceptionResponse.message[0] === 'string'
    );
  }

  private formatValidationErrors(errors: string[] | ValidationError[]): any {
    if (!Array.isArray(errors)) {
      return [];
    }

    return errors.map((error) => {
      if (typeof error === 'string') {
        return { message: error };
      } else if (error.constraints) {
        return {
          property: error.property,
          value: error.value,
          constraints: error.constraints,
        };
      }
      return error;
    });
  }
}

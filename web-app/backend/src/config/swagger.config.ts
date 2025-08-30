import { DocumentBuilder } from '@nestjs/swagger';

export const swaggerConfig = new DocumentBuilder()
  .setTitle('Student360 AI Mentoring Platform API')
  .setDescription(
    `
    ## Student360 AI Mentoring Platform API

    A comprehensive AI-powered mentoring platform that provides personalized guidance for students across multiple domains including career development, e-learning, and financial planning.

    ### Features:
    - **AI-Powered Mentoring**: Intelligent agents for career, learning, and financial guidance
    - **User Management**: Secure authentication and comprehensive user profiles
    - **Student Records**: Academic information and performance tracking
    - **Session Management**: Conversation history and context-aware interactions
    - **Multi-Agent System**: Specialized agents for different mentoring domains

    ### Authentication:
    This API uses JWT-based authentication. Include the Bearer token in the Authorization header for protected endpoints.

    ### API Versioning:
    All endpoints are versioned and follow RESTful conventions.

    ### Response Format:
    All API responses follow a consistent format with proper HTTP status codes and error handling.
  `,
  )
  .setVersion('1.0.0')
  .setContact(
    'Student360 Development Team',
    'https://student360.ai',
    'support@student360.ai',
  )
  .setLicense('MIT', 'https://opensource.org/licenses/MIT')
  .addServer('http://localhost:3000', 'Development Server')
  .addServer('https://api.student360.ai', 'Production Server')
  .addTag('Authentication', 'User authentication and session management')
  .addTag('Users', 'User profile management and preferences')
  .addTag('Students', 'Student academic records and information')
  .addTag('AI Agents', 'AI-powered mentoring and guidance services')
  .addTag('Agent Sessions', 'Conversation history and session management')
  .addTag('Health', 'System health and monitoring endpoints')
  .addBearerAuth(
    {
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
      name: 'JWT',
      description: 'Enter JWT token (without Bearer prefix)',
      in: 'header',
    },
    'JWT-auth',
  )
  .build();

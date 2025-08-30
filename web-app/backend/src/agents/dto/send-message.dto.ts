import { IsNotEmpty, IsString, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SendMessageDto {
  @ApiProperty({
    example: 'user123',
    description: 'User ID sending the message',
  })
  @IsNotEmpty()
  @IsUUID()
  userId: string;

  @ApiProperty({
    example: 'session-uuid-123',
    description: 'Session ID for the chat',
  })
  @IsNotEmpty()
  @IsUUID()
  sessionId: string;

  @ApiProperty({
    example: 'Hello, how can you help me with my studies?',
    description: 'Message content',
  })
  @IsNotEmpty()
  @IsString()
  message: string;
}

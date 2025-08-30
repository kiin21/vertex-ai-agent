import { ApiProperty } from '@nestjs/swagger';
import { AgentChatRole, AgentChatAuthor } from '../entities';

export class ChatMessageResponseDto {
  @ApiProperty({ example: 'uuid-123' })
  id: string;

  @ApiProperty({ example: 'session-uuid-123' })
  sessionId: string;

  @ApiProperty({ enum: AgentChatRole })
  role: AgentChatRole;

  @ApiProperty({ enum: AgentChatAuthor })
  author: AgentChatAuthor;

  @ApiProperty({ example: 'Hello, how can I help you today?' })
  content: string;

  @ApiProperty({ example: 1756490954 })
  timestamp: number;

  @ApiProperty({ required: false })
  finishReason?: string;

  @ApiProperty({ required: false })
  usageMetadata?: Record<string, any>;

  @ApiProperty()
  createdAt: Date;
}

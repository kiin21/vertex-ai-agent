import { ApiProperty } from '@nestjs/swagger';
import { AgentSessionState } from '../entities';

export class SessionResponseDto {
  @ApiProperty({ example: 'uuid-123' })
  id: string;

  @ApiProperty({ example: 'external-session-id-123' })
  externalId: string;

  @ApiProperty({ example: 'user-uuid-123' })
  userId: string;

  @ApiProperty({ example: 'app-name-123' })
  appName: string;

  @ApiProperty({ enum: AgentSessionState })
  state: AgentSessionState;

  @ApiProperty({ required: false })
  title?: string;

  @ApiProperty({ required: false })
  summary?: string;

  @ApiProperty({ example: 5 })
  messageCount: number;

  @ApiProperty({ example: 1756490954.9925039 })
  lastUpdateTime: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

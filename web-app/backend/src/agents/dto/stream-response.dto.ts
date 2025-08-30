import { ApiProperty } from '@nestjs/swagger';

export class StreamResponseDto {
  @ApiProperty({ example: 'Hello, how can I help you today?' })
  content: string;

  @ApiProperty({ example: 'STOP', required: false })
  finishReason?: string;

  @ApiProperty({ required: false })
  usageMetadata?: Record<string, any>;

  @ApiProperty({ example: 'invocation-id-123' })
  invocationId: string;

  @ApiProperty({ example: 'orchestrator_agent' })
  author: string;

  @ApiProperty({ example: 1756491188.991288 })
  timestamp: number;
}

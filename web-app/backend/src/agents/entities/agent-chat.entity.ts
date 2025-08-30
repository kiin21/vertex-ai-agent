import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { AgentSession } from './agent-session.entity';

export enum AgentChatRole {
  USER = 'user',
  MODEL = 'model',
  SYSTEM = 'system',
}

export enum AgentChatAuthor {
  USER = 'user',
  ORCHESTRATOR_AGENT = 'orchestrator_agent',
  SYSTEM = 'system',
}

@Entity('agent_chats')
@Index(['sessionId', 'timestamp'])
export class AgentChat {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'session_id', type: 'uuid' })
  sessionId: string;

  @Column({
    type: 'enum',
    enum: AgentChatRole,
    default: AgentChatRole.USER,
  })
  role: AgentChatRole;

  @Column({
    type: 'enum',
    enum: AgentChatAuthor,
    default: AgentChatAuthor.USER,
  })
  author: AgentChatAuthor;

  @Column({ type: 'text' })
  content: string;

  @Column({ name: 'finish_reason', type: 'varchar', nullable: true })
  finishReason: string;

  @Column({ name: 'usage_metadata', type: 'json', nullable: true })
  usageMetadata: Record<string, any>;

  @Column({ type: 'bigint', default: () => 'EXTRACT(EPOCH FROM NOW())' })
  timestamp: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relationships
  @ManyToOne(() => AgentSession, (session) => session.chats, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'session_id' })
  session: AgentSession;

  // Static factory method
  static fromExternalEvent(sessionId: string, event: any): AgentChat {
    const chat = new AgentChat();
    chat.sessionId = sessionId;

    // Fix role mapping - use the role from the processed event
    chat.role = event.role === 'model' ? AgentChatRole.MODEL :
      event.role === 'system' ? AgentChatRole.SYSTEM : AgentChatRole.USER;

    // Fix author mapping - check the author field properly
    if (event.author === 'orchestrator_agent') {
      chat.author = AgentChatAuthor.ORCHESTRATOR_AGENT;
    } else if (event.author === 'system') {
      chat.author = AgentChatAuthor.SYSTEM;
    } else {
      chat.author = AgentChatAuthor.USER;
    }

    // The content should already be extracted as a string from the service
    chat.content = event.content || '';

    // Map metadata fields properly
    chat.finishReason = event.finishReason || event.finish_reason;
    chat.usageMetadata = event.usageMetadata || event.usage_metadata;
    chat.timestamp = Math.floor(event.timestamp || Date.now() / 1000);

    return chat;
  }

  private static extractContentText(content: any): string {
    if (typeof content === 'string') {
      return content;
    }

    if (content?.parts && Array.isArray(content.parts)) {
      return content.parts
        .map((part: any) => part.text || '')
        .filter((text: string) => text.trim())
        .join(' ');
    }

    return content?.text || '';
  }
}

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum AgentSessionState {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  DELETED = 'deleted',
}

@Entity('agent_sessions')
@Index(['userId', 'createdAt'])
export class AgentSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'external_id', type: 'varchar' })
  externalId: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ name: 'app_name', type: 'varchar' })
  appName: string;

  @Column({
    type: 'enum',
    enum: AgentSessionState,
    default: AgentSessionState.ACTIVE,
  })
  state: AgentSessionState;

  @Column({ name: 'session_metadata', type: 'json', nullable: true })
  sessionMetadata: Record<string, any>;

  @Column({ name: 'last_update_time', type: 'bigint', default: () => 'EXTRACT(EPOCH FROM NOW())' })
  lastUpdateTime: number;

  @Column({ type: 'varchar', nullable: true })
  title: string;

  @Column({ type: 'text', nullable: true })
  summary: string;

  @Column({ name: 'message_count', type: 'int', default: 0 })
  messageCount: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relationships
  @ManyToOne(() => User, (user) => user.agentSessions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @OneToMany('AgentChat', 'session', {
    cascade: true,
    lazy: true,
  })
  chats: any[];

  // Helper methods
  updateFromExternalSession(externalSession: any): void {
    this.lastUpdateTime = Math.floor(externalSession.lastUpdateTime);
    this.sessionMetadata = externalSession.state || {};
    this.updatedAt = new Date();
  }

  incrementMessageCount(): void {
    this.messageCount += 1;
    this.updatedAt = new Date();
  }
}

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToOne,
  OneToMany,
  Index,
  JoinColumn,
} from 'typeorm';
import { UserProfile } from './user-profile.entity';
import { AgentSession } from '../../agents/entities/agent-session.entity';
import { Exclude } from 'class-transformer';

export enum UserRole {
  ADMIN = 'admin',
  TEACHER = 'teacher',
  STUDENT = 'student',
}

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  PENDING_VERIFICATION = 'pending_verification',
}

@Entity('users')
@Index(['email', 'deletedAt'])
@Index(['status', 'deletedAt'])
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  @Index()
  name: string;

  @Column({ type: 'varchar', length: 320, unique: true })
  @Index()
  email: string;

  @Column({ type: 'varchar', length: 255 })
  @Exclude({ toPlainOnly: true })
  password: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.STUDENT })
  @Index()
  role: UserRole;

  @Column({
    type: 'enum',
    enum: UserStatus,
    default: UserStatus.ACTIVE,
    name: 'status',
  })
  @Index()
  status: UserStatus;

  @Column({ name: 'email_verified', type: 'boolean', default: false })
  emailVerified: boolean;

  @Column({ name: 'last_login_at', type: 'timestamp', nullable: true })
  lastLoginAt: Date;

  @Column({ name: 'login_attempts', type: 'int', default: 0 })
  loginAttempts: number;

  @Column({ name: 'locked_until', type: 'timestamp', nullable: true })
  lockedUntil: Date;

  @Column({ name: 'password_changed_at', type: 'timestamp', nullable: true })
  passwordChangedAt: Date;

  // Relationships
  @OneToOne(() => UserProfile, (profile) => profile.user, {
    cascade: true,
    eager: false,
  })
  @JoinColumn({ name: 'profile_id' })
  profile: UserProfile;

  @OneToMany(() => AgentSession, (session) => session.user, {
    cascade: false,
    lazy: true,
  })
  agentSessions: AgentSession[];

  // Timestamps
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date;

  // Virtual properties
  get isLocked(): boolean {
    return this.lockedUntil && this.lockedUntil > new Date();
  }

  get isActive(): boolean {
    return this.status === UserStatus.ACTIVE && !this.deletedAt;
  }

  // Methods
  lockAccount(minutes: number = 30): void {
    this.lockedUntil = new Date(Date.now() + minutes * 60 * 1000);
  }

  unlockAccount(): void {
    this.lockedUntil = null;
    this.loginAttempts = 0;
  }

  incrementLoginAttempts(): void {
    this.loginAttempts += 1;
  }

  resetLoginAttempts(): void {
    this.loginAttempts = 0;
    this.lockedUntil = null;
  }

  updateLastLogin(): void {
    this.lastLoginAt = new Date();
    this.resetLoginAttempts();
  }
}

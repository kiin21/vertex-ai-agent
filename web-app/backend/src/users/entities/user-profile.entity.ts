import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';

export interface FinancePreferences {
  budget_range?: {
    min: number;
    max: number;
  };
  expense_categories?: string[];
  saving_goals?: {
    target_amount: number;
    target_date: Date;
    purpose: string;
  }[];
  financial_priorities?: string[];
}

export interface CareerGoals {
  target_industries?: string[];
  desired_positions?: string[];
  skills_to_develop?: string[];
  timeline?: {
    short_term: string; // 1-2 years
    long_term: string; // 5+ years
  };
  preferred_work_environment?: string[];
}

export interface LearningHistory {
  completed_courses?: {
    course_name: string;
    platform: string;
    completion_date: Date;
    rating: number;
  }[];
  preferred_learning_style?: string[];
  subjects_of_interest?: string[];
  learning_goals?: string[];
  time_availability?: {
    hours_per_week: number;
    preferred_schedule: string[];
  };
}

@Entity('user_profiles')
export class UserProfile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => User, (user) => user.profile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ type: 'jsonb', nullable: true })
  finance_preferences: FinancePreferences;

  @Column({ type: 'jsonb', nullable: true })
  career_goals: CareerGoals;

  @Column({ type: 'jsonb', nullable: true })
  learning_history: LearningHistory;

  @Column({ type: 'varchar', length: 100, nullable: true })
  university: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  major: string;

  @Column({ name: 'year_of_study', type: 'int', nullable: true })
  yearOfStudy: number;

  @Column({ type: 'text', array: true, nullable: true })
  interests: string[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

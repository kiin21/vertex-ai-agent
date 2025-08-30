import { ApiProperty } from '@nestjs/swagger';
import {
  FinancePreferences,
  CareerGoals,
  LearningHistory,
} from '../entities/user-profile.entity';

export class UserProfileResponseDto {
  @ApiProperty({ example: 'uuid-123', description: 'Profile ID' })
  id: string;

  @ApiProperty({ example: 'uuid-456', description: 'User ID' })
  userId: string;

  @ApiProperty({
    example: 'Harvard University',
    description: 'University name',
  })
  university?: string;

  @ApiProperty({
    example: 'Computer Science',
    description: 'Major/field of study',
  })
  major?: string;

  @ApiProperty({ example: 2, description: 'Year of study' })
  yearOfStudy?: number;

  @ApiProperty({
    example: ['programming', 'machine_learning', 'web_development'],
    description: 'Areas of interest',
  })
  interests?: string[];

  @ApiProperty({ description: 'Finance preferences' })
  finance_preferences?: FinancePreferences;

  @ApiProperty({ description: 'Career goals' })
  career_goals?: CareerGoals;

  @ApiProperty({ description: 'Learning history' })
  learning_history?: LearningHistory;

  @ApiProperty({
    example: '2024-01-01T00:00:00Z',
    description: 'Creation date',
  })
  createdAt: Date;

  @ApiProperty({
    example: '2024-01-01T00:00:00Z',
    description: 'Last update date',
  })
  updatedAt: Date;
}

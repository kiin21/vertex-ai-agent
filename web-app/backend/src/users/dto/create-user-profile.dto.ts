import {
  IsOptional,
  IsString,
  IsNumber,
  IsArray,
  ValidateNested,
  Length,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class FinancePreferencesDto {
  @ApiProperty({
    example: { min: 100, max: 1000 },
    description: 'Budget range in USD',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => Object)
  budget_range?: {
    min: number;
    max: number;
  };

  @ApiProperty({
    example: ['food', 'transport', 'entertainment'],
    description: 'Expense categories',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  expense_categories?: string[];

  @ApiProperty({
    example: [
      {
        target_amount: 5000,
        target_date: '2024-12-31',
        purpose: 'Emergency fund',
      },
    ],
    description: 'Saving goals',
  })
  @IsOptional()
  @IsArray()
  saving_goals?: {
    target_amount: number;
    target_date: Date;
    purpose: string;
  }[];

  @ApiProperty({
    example: ['saving', 'investing', 'debt_repayment'],
    description: 'Financial priorities',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  financial_priorities?: string[];
}

export class CareerGoalsDto {
  @ApiProperty({
    example: ['technology', 'healthcare', 'finance'],
    description: 'Target industries',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  target_industries?: string[];

  @ApiProperty({
    example: ['software_engineer', 'data_scientist', 'product_manager'],
    description: 'Desired job positions',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  desired_positions?: string[];

  @ApiProperty({
    example: ['python', 'machine_learning', 'communication'],
    description: 'Skills to develop',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  skills_to_develop?: string[];

  @ApiProperty({
    example: {
      short_term: 'Get internship',
      long_term: 'Become senior developer',
    },
    description: 'Career timeline',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => Object)
  timeline?: {
    short_term: string;
    long_term: string;
  };

  @ApiProperty({
    example: ['remote', 'startup', 'flexible_hours'],
    description: 'Preferred work environment',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  preferred_work_environment?: string[];
}

export class LearningHistoryDto {
  @ApiProperty({
    example: [
      {
        course_name: 'Python Basics',
        platform: 'Coursera',
        completion_date: '2024-01-15',
        rating: 5,
      },
    ],
    description: 'Completed courses',
  })
  @IsOptional()
  @IsArray()
  completed_courses?: {
    course_name: string;
    platform: string;
    completion_date: Date;
    rating: number;
  }[];

  @ApiProperty({
    example: ['visual', 'hands_on', 'self_paced'],
    description: 'Preferred learning styles',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  preferred_learning_style?: string[];

  @ApiProperty({
    example: ['programming', 'data_science', 'web_development'],
    description: 'Subjects of interest',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  subjects_of_interest?: string[];

  @ApiProperty({
    example: ['Complete computer science degree', 'Learn machine learning'],
    description: 'Learning goals',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  learning_goals?: string[];

  @ApiProperty({
    example: {
      hours_per_week: 10,
      preferred_schedule: ['weekends', 'evenings'],
    },
    description: 'Time availability for learning',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => Object)
  time_availability?: {
    hours_per_week: number;
    preferred_schedule: string[];
  };
}

export class CreateUserProfileDto {
  @ApiProperty({
    example: 'Harvard University',
    description: 'University name',
  })
  @IsOptional()
  @IsString()
  @Length(1, 100)
  university?: string;

  @ApiProperty({
    example: 'Computer Science',
    description: 'Major/field of study',
  })
  @IsOptional()
  @IsString()
  @Length(1, 100)
  major?: string;

  @ApiProperty({ example: 2, description: 'Year of study' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(10)
  yearOfStudy?: number;

  @ApiProperty({
    example: ['programming', 'machine_learning', 'web_development'],
    description: 'Areas of interest',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  interests?: string[];

  @ApiProperty({ description: 'Finance preferences' })
  @IsOptional()
  @ValidateNested()
  @Type(() => FinancePreferencesDto)
  finance_preferences?: FinancePreferencesDto;

  @ApiProperty({ description: 'Career goals' })
  @IsOptional()
  @ValidateNested()
  @Type(() => CareerGoalsDto)
  career_goals?: CareerGoalsDto;

  @ApiProperty({ description: 'Learning history' })
  @IsOptional()
  @ValidateNested()
  @Type(() => LearningHistoryDto)
  learning_history?: LearningHistoryDto;
}

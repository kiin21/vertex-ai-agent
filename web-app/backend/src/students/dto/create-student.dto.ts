import {
  IsNotEmpty,
  IsString,
  IsEmail,
  IsDateString,
  IsOptional,
  Length,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateStudentDto {
  @ApiProperty({ example: 'John', description: 'First name of the student' })
  @IsNotEmpty()
  @IsString()
  @Length(2, 100)
  firstName: string;

  @ApiProperty({ example: 'Doe', description: 'Last name of the student' })
  @IsNotEmpty()
  @IsString()
  @Length(2, 100)
  lastName: string;

  @ApiProperty({
    example: 'john.doe@example.com',
    description: 'Email address of the student',
  })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({
    example: '2000-01-15',
    description: 'Date of birth (YYYY-MM-DD)',
  })
  @IsNotEmpty()
  @IsDateString()
  dateOfBirth: string;

  @ApiProperty({ example: '10th Grade', description: 'Student grade/class' })
  @IsNotEmpty()
  @IsString()
  @Length(1, 50)
  grade: string;

  @ApiProperty({ example: '2024-2025', description: 'Academic year' })
  @IsNotEmpty()
  @IsString()
  @Length(1, 20)
  academicYear: string;

  @ApiPropertyOptional({
    example: '+1234567890',
    description: 'Phone number of the student',
  })
  @IsOptional()
  @IsString()
  @Length(10, 20)
  phone?: string;

  @ApiPropertyOptional({
    example: '123 Main St, City, State',
    description: 'Address of the student',
  })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({
    example: '2024-01-15',
    description: 'Enrollment date (YYYY-MM-DD)',
  })
  @IsOptional()
  @IsDateString()
  enrollmentDate?: string;
}

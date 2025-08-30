import { ApiProperty } from '@nestjs/swagger';
import { Student } from '../entities/student.entity';

export class StudentResponseDto {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Student ID',
  })
  id: string;

  @ApiProperty({ example: 'John', description: 'First name' })
  firstName: string;

  @ApiProperty({ example: 'Doe', description: 'Last name' })
  lastName: string;

  @ApiProperty({
    example: 'john.doe@example.com',
    description: 'Email address',
  })
  email: string;

  @ApiProperty({ example: '2000-01-15', description: 'Date of birth' })
  dateOfBirth: Date;

  @ApiProperty({ example: '10th Grade', description: 'Grade/class' })
  grade: string;

  @ApiProperty({ example: '2024-01-15', description: 'Enrollment date' })
  enrollmentDate: Date;

  @ApiProperty({ example: true, description: 'Active status' })
  isActive: boolean;

  @ApiProperty({
    example: '+1234567890',
    description: 'Phone number',
    required: false,
  })
  phone?: string;

  @ApiProperty({
    example: '123 Main St, City, State',
    description: 'Address',
    required: false,
  })
  address?: string;

  @ApiProperty({
    example: '2024-01-15T10:00:00Z',
    description: 'Created timestamp',
  })
  createdAt: Date;

  @ApiProperty({
    example: '2024-01-15T10:00:00Z',
    description: 'Updated timestamp',
  })
  updatedAt: Date;

  constructor(student: Student) {
    this.id = student.id;
    this.firstName = student.firstName;
    this.lastName = student.lastName;
    this.email = student.email;
    this.dateOfBirth = student.dateOfBirth;
    this.grade = student.grade;
    this.enrollmentDate = student.enrollmentDate;
    this.isActive = student.isActive;
    this.phone = student.phone;
    this.address = student.address;
    this.createdAt = student.createdAt;
    this.updatedAt = student.updatedAt;
  }
}

export class PaginatedStudentResponseDto {
  @ApiProperty({ type: [StudentResponseDto], description: 'Students data' })
  data: StudentResponseDto[];

  @ApiProperty({ example: 100, description: 'Total count of students' })
  total: number;

  @ApiProperty({ example: 1, description: 'Current page' })
  page: number;

  @ApiProperty({ example: 10, description: 'Items per page' })
  limit: number;

  @ApiProperty({ example: 10, description: 'Total pages' })
  totalPages: number;
}

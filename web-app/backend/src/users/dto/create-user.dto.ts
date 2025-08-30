import {
  IsNotEmpty,
  IsString,
  IsEmail,
  IsEnum,
  Length,
  MinLength,
  Matches,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../entities/user.entity';

export class CreateUserDto {
  @ApiProperty({ example: 'John Doe', description: 'Full name of the user' })
  @IsNotEmpty({ message: 'Name is required' })
  @IsString()
  @Length(2, 255, { message: 'Name must be between 2 and 255 characters' })
  name: string;

  @ApiProperty({
    example: 'john.doe@example.com',
    description: 'Email address of the user',
  })
  @IsNotEmpty({ message: 'Email is required' })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email: string;

  @ApiProperty({
    example: 'StrongPassword123!',
    description:
      'Password for the user (minimum 8 characters, must contain uppercase, lowercase, number and special character, no common patterns)',
  })
  @IsNotEmpty({ message: 'Password is required' })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
    {
      message:
        'Password must contain at least one uppercase letter, one lowercase letter, one number and one special character',
    },
  )
  @Matches(/^(?!.*(.)\1{2,})/, {
    message:
      'Password cannot contain more than 2 consecutive identical characters',
  })
  @Matches(/^(?!.*(123|abc|password|admin|user|test))/i, {
    message: 'Password cannot contain common words or patterns',
  })
  password: string;

  @ApiProperty({
    example: UserRole.STUDENT,
    description: 'Role of the user',
    enum: UserRole,
    default: UserRole.STUDENT,
  })
  @IsEnum(UserRole, { message: 'Role must be a valid user role' })
  role: UserRole = UserRole.STUDENT;
}

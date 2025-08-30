import { PartialType } from '@nestjs/swagger';
import { CreateStudentDto } from './create-student.dto';
import { IsOptional, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateStudentDto extends PartialType(CreateStudentDto) {
  @ApiPropertyOptional({
    example: true,
    description: 'Whether the student is active',
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

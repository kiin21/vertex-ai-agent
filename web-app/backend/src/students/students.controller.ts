import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { StudentsService } from './students.service';
import {
  CreateStudentDto,
  UpdateStudentDto,
  StudentQueryDto,
  StudentResponseDto,
  PaginatedStudentResponseDto,
} from './dto';
import { JwtAuthGuard } from '../common/guards/auth.guard';

@ApiTags('Students')
@Controller('students')
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create a new student' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Student created successfully',
    type: StudentResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  async create(
    @Body() createStudentDto: CreateStudentDto,
  ): Promise<StudentResponseDto> {
    return this.studentsService.create(createStudentDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all students with pagination and filtering' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Students retrieved successfully',
    type: PaginatedStudentResponseDto,
  })
  async findAll(
    @Query() queryDto: StudentQueryDto,
  ): Promise<PaginatedStudentResponseDto> {
    return this.studentsService.findAll(queryDto);
  }

  @Get('seed-mock-data')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Seed mock student data for testing' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Mock data seeded successfully',
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  async seedMockData(): Promise<{ message: string }> {
    await this.studentsService.seedMockData();
    return { message: 'Mock student data seeded successfully' };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get student by ID' })
  @ApiParam({ name: 'id', description: 'Student ID', type: 'string' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Student retrieved successfully',
    type: StudentResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Student not found',
  })
  async findOne(@Param('id') id: string): Promise<StudentResponseDto> {
    return this.studentsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update student by ID' })
  @ApiParam({ name: 'id', description: 'Student ID', type: 'string' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Student updated successfully',
    type: StudentResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Student not found',
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  async update(
    @Param('id') id: string,
    @Body() updateStudentDto: UpdateStudentDto,
  ): Promise<StudentResponseDto> {
    return this.studentsService.update(id, updateStudentDto);
  }

  @Patch(':id/deactivate')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Deactivate student (soft delete)' })
  @ApiParam({ name: 'id', description: 'Student ID', type: 'string' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Student deactivated successfully',
    type: StudentResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Student not found',
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  async softDelete(@Param('id') id: string): Promise<StudentResponseDto> {
    return this.studentsService.softDelete(id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Delete student permanently' })
  @ApiParam({ name: 'id', description: 'Student ID', type: 'string' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Student deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Student not found',
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  async remove(@Param('id') id: string): Promise<void> {
    return this.studentsService.remove(id);
  }
}

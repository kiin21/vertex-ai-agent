import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { StudentsService } from './students.service';
import { StudentsController } from './students.controller';
import { Student } from './entities/student.entity';
import { StudentRepository } from './repositories/student.repository';

@Module({
  imports: [TypeOrmModule.forFeature([Student]), JwtModule],
  controllers: [StudentsController],
  providers: [StudentsService, StudentRepository],
  exports: [StudentsService, StudentRepository],
})
export class StudentsModule {}

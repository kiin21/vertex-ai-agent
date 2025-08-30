import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../../users/entities/user.entity';
import { UserProfile } from '../../users/entities/user-profile.entity';
import { Student } from '../../students/entities/student.entity';
import { DatabaseSeeder } from './database.seeder';

@Module({
  imports: [TypeOrmModule.forFeature([User, UserProfile, Student])],
  providers: [DatabaseSeeder],
  exports: [DatabaseSeeder],
})
export class SeederModule {}

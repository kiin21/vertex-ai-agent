import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UserProfileService } from './user-profile.service';
import { UsersController } from './users.controller';
import { User } from './entities/user.entity';
import { UserProfile } from './entities/user-profile.entity';
import { UserRepository } from './repositories/user.repository';

@Module({
  imports: [TypeOrmModule.forFeature([User, UserProfile])],
  controllers: [UsersController],
  providers: [UsersService, UserProfileService, UserRepository],
  exports: [UsersService, UserProfileService, UserRepository],
})
export class UsersModule {}

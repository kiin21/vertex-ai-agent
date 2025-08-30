import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserProfile } from './entities/user-profile.entity';
import {
  CreateUserProfileDto,
  UpdateUserProfileDto,
  UserProfileResponseDto,
} from './dto';

@Injectable()
export class UserProfileService {
  constructor(
    @InjectRepository(UserProfile)
    private userProfileRepository: Repository<UserProfile>,
  ) {}

  async create(
    userId: string,
    createUserProfileDto: CreateUserProfileDto,
  ): Promise<UserProfile> {
    // Check if profile already exists for this user
    const existingProfile = await this.userProfileRepository.findOne({
      where: { userId },
    });

    if (existingProfile) {
      throw new ConflictException('User profile already exists');
    }

    const profile = this.userProfileRepository.create({
      userId,
      ...createUserProfileDto,
    });

    return this.userProfileRepository.save(profile);
  }

  async findByUserId(userId: string): Promise<UserProfile | null> {
    return this.userProfileRepository.findOne({
      where: { userId },
      relations: ['user'],
    });
  }

  async findOne(id: string): Promise<UserProfile> {
    const profile = await this.userProfileRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!profile) {
      throw new NotFoundException(`User profile with ID ${id} not found`);
    }

    return profile;
  }

  async update(
    userId: string,
    updateUserProfileDto: UpdateUserProfileDto,
  ): Promise<UserProfile> {
    const profile = await this.userProfileRepository.findOne({
      where: { userId },
    });

    if (!profile) {
      // Create new profile if it doesn't exist
      return this.create(userId, updateUserProfileDto);
    }

    // Update existing profile
    await this.userProfileRepository.update(profile.id, updateUserProfileDto);

    return this.userProfileRepository.findOne({
      where: { id: profile.id },
      relations: ['user'],
    });
  }

  async remove(userId: string): Promise<void> {
    const profile = await this.userProfileRepository.findOne({
      where: { userId },
    });

    if (!profile) {
      throw new NotFoundException(`User profile for user ${userId} not found`);
    }

    await this.userProfileRepository.remove(profile);
  }

  async getProfileWithUserData(
    userId: string,
  ): Promise<UserProfileResponseDto | null> {
    const profile = await this.findByUserId(userId);

    if (!profile) {
      return null;
    }

    return {
      id: profile.id,
      userId: profile.userId,
      university: profile.university,
      major: profile.major,
      yearOfStudy: profile.yearOfStudy,
      interests: profile.interests,
      finance_preferences: profile.finance_preferences,
      career_goals: profile.career_goals,
      learning_history: profile.learning_history,
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt,
    };
  }
}

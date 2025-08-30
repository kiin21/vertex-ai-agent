import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole, UserStatus } from '../../users/entities/user.entity';
import { UserProfile } from '../../users/entities/user-profile.entity';
import { Student } from '../../students/entities/student.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class DatabaseSeeder {
  private readonly logger = new Logger(DatabaseSeeder.name);

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(UserProfile)
    private userProfileRepository: Repository<UserProfile>,
    @InjectRepository(Student)
    private studentRepository: Repository<Student>,
  ) {}

  async seed(): Promise<void> {
    this.logger.log('Starting database seeding...');

    await this.seedUsers();
    await this.seedStudents();

    this.logger.log('Database seeding completed successfully!');
  }

  private async seedUsers(): Promise<void> {
    const userCount = await this.userRepository.count();
    if (userCount > 0) {
      this.logger.log('Users already exist, skipping user seeding');
      return;
    }

    this.logger.log('Seeding users...');

    // Create admin user
    const adminPassword = await bcrypt.hash('Admin123!', 12);
    const admin = this.userRepository.create({
      name: 'System Administrator',
      email: 'admin@student360.ai',
      password: adminPassword,
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
      emailVerified: true,
    });
    await this.userRepository.save(admin);

    // Create admin profile
    const adminProfile = this.userProfileRepository.create({
      userId: admin.id,
      finance_preferences: {
        budget_range: { min: 0, max: 10000 },
        expense_categories: ['education', 'technology', 'books'],
        financial_priorities: ['savings', 'education', 'emergency_fund'],
      },
      career_goals: {
        target_industries: ['education', 'technology'],
        desired_positions: ['administrator', 'manager'],
        skills_to_develop: ['leadership', 'management'],
        timeline: {
          short_term: 'Manage platform effectively',
          long_term: 'Scale educational technology',
        },
      },
      learning_history: {
        subjects_of_interest: ['administration', 'education', 'technology'],
        learning_goals: ['platform management', 'user experience'],
      },
      university: 'System University',
      major: 'Educational Administration',
      yearOfStudy: null,
      interests: ['education', 'technology', 'management'],
    });
    await this.userProfileRepository.save(adminProfile);

    // Create teacher user
    const teacherPassword = await bcrypt.hash('Teacher123!', 12);
    const teacher = this.userRepository.create({
      name: 'Dr. Jane Smith',
      email: 'teacher@student360.ai',
      password: teacherPassword,
      role: UserRole.TEACHER,
      status: UserStatus.ACTIVE,
      emailVerified: true,
    });
    await this.userRepository.save(teacher);

    // Create teacher profile
    const teacherProfile = this.userProfileRepository.create({
      userId: teacher.id,
      finance_preferences: {
        budget_range: { min: 3000, max: 8000 },
        expense_categories: ['education', 'research', 'books'],
        financial_priorities: ['research', 'education', 'retirement'],
      },
      career_goals: {
        target_industries: ['education', 'research'],
        desired_positions: ['professor', 'researcher'],
        skills_to_develop: ['research', 'teaching', 'mentoring'],
        timeline: {
          short_term: 'Improve teaching methods',
          long_term: 'Become department head',
        },
      },
      learning_history: {
        subjects_of_interest: ['computer science', 'ai', 'education'],
        learning_goals: ['ai integration', 'modern teaching methods'],
      },
      university: 'Tech University',
      major: 'Computer Science',
      yearOfStudy: null,
      interests: ['artificial intelligence', 'education', 'research'],
    });
    await this.userProfileRepository.save(teacherProfile);

    // Create sample student user
    const studentPassword = await bcrypt.hash('Student123!', 12);
    const student = this.userRepository.create({
      name: 'John Doe',
      email: 'student@student360.ai',
      password: studentPassword,
      role: UserRole.STUDENT,
      status: UserStatus.ACTIVE,
      emailVerified: true,
    });
    await this.userRepository.save(student);

    // Create student profile
    const studentProfile = this.userProfileRepository.create({
      userId: student.id,
      finance_preferences: {
        budget_range: { min: 500, max: 2000 },
        expense_categories: ['tuition', 'books', 'food', 'transportation'],
        saving_goals: [
          {
            target_amount: 5000,
            target_date: new Date(2025, 11, 31),
            purpose: 'Emergency fund',
          },
        ],
        financial_priorities: ['education', 'basic_needs', 'savings'],
      },
      career_goals: {
        target_industries: ['technology', 'finance'],
        desired_positions: ['software engineer', 'data analyst'],
        skills_to_develop: ['programming', 'data analysis', 'machine learning'],
        timeline: {
          short_term: 'Complete degree with honors',
          long_term: 'Become senior software engineer',
        },
        preferred_work_environment: ['tech_startup', 'remote', 'collaborative'],
      },
      learning_history: {
        completed_courses: [
          {
            course_name: 'Introduction to Programming',
            platform: 'University',
            completion_date: new Date(2024, 5, 15),
            rating: 4.5,
          },
        ],
        preferred_learning_style: ['visual', 'hands-on', 'interactive'],
        subjects_of_interest: ['programming', 'ai', 'data science'],
        learning_goals: [
          'master python',
          'learn machine learning',
          'build portfolio',
        ],
        time_availability: {
          hours_per_week: 20,
          preferred_schedule: ['evening', 'weekend'],
        },
      },
      university: 'Tech University',
      major: 'Computer Science',
      yearOfStudy: 3,
      interests: ['programming', 'artificial intelligence', 'gaming', 'music'],
    });
    await this.userProfileRepository.save(studentProfile);

    this.logger.log(`Created ${3} users with profiles`);
  }

  private async seedStudents(): Promise<void> {
    const studentCount = await this.studentRepository.count();
    if (studentCount > 0) {
      this.logger.log('Students already exist, skipping student seeding');
      return;
    }

    this.logger.log('Seeding students...');

    // Get the student user we created
    const studentUser = await this.userRepository.findOne({
      where: { email: 'student@student360.ai' },
    });

    if (!studentUser) {
      this.logger.error('Student user not found, cannot create student record');
      return;
    }

    // Create student record
    const student = this.studentRepository.create({
      userId: studentUser.id,
      studentId: 'STU001',
      firstName: 'John',
      lastName: 'Doe',
      email: 'student@student360.ai',
      dateOfBirth: new Date(2002, 5, 15),
      gender: 'male',
      grade: 'Junior',
      academicYear: '2024-2025',
      enrollmentDate: new Date(2022, 8, 1),
      isActive: true,
      phone: '+1234567890',
      address: '123 University Ave, College Town, CT 12345',
      emergencyContact: {
        name: 'Jane Doe',
        relationship: 'Mother',
        phone: '+1234567891',
        email: 'jane.doe@email.com',
      },
      academicInfo: {
        gpa: 3.75,
        credits: 90,
        major: 'Computer Science',
        minor: 'Mathematics',
        advisor: 'Dr. Jane Smith',
        transcript: [
          {
            semester: 'Fall 2023',
            courses: [
              {
                code: 'CS301',
                name: 'Data Structures',
                credits: 3,
                grade: 'A',
              },
              { code: 'CS302', name: 'Algorithms', credits: 3, grade: 'B+' },
              {
                code: 'MATH301',
                name: 'Linear Algebra',
                credits: 3,
                grade: 'A-',
              },
            ],
          },
        ],
      },
      preferences: {
        notifications: true,
        communicationMethod: 'email',
        learningStyle: ['visual', 'hands-on'],
        subjects: ['programming', 'mathematics', 'artificial intelligence'],
      },
    });

    await this.studentRepository.save(student);

    this.logger.log('Created sample student record');
  }

  async clear(): Promise<void> {
    this.logger.log('Clearing database...');

    await this.studentRepository.delete({});
    await this.userProfileRepository.delete({});
    await this.userRepository.delete({});

    this.logger.log('Database cleared successfully!');
  }
}

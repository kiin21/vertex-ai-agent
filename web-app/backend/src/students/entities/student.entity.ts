import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('students')
@Index(['email', 'deletedAt'])
@Index(['userId', 'deletedAt'])
@Index(['isActive', 'deletedAt'])
export class Student {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  userId: string;

  @Column({ name: 'student_id', type: 'varchar', length: 50, unique: true })
  @Index()
  studentId: string;

  @Column({ name: 'first_name', type: 'varchar', length: 100 })
  firstName: string;

  @Column({ name: 'last_name', type: 'varchar', length: 100 })
  lastName: string;

  @Column({ type: 'varchar', length: 320, unique: true })
  @Index()
  email: string;

  @Column({ name: 'date_of_birth', type: 'date' })
  dateOfBirth: Date;

  @Column({ type: 'varchar', length: 10, nullable: true })
  gender: string;

  @Column({ type: 'varchar', length: 50 })
  grade: string;

  @Column({ name: 'academic_year', type: 'varchar', length: 20 })
  academicYear: string;

  @Column({
    name: 'enrollment_date',
    type: 'date',
    default: () => 'CURRENT_DATE',
  })
  enrollmentDate: Date;

  @Column({ name: 'graduation_date', type: 'date', nullable: true })
  graduationDate: Date;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  @Index()
  isActive: boolean;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone: string;

  @Column({ type: 'text', nullable: true })
  address: string;

  @Column({ name: 'emergency_contact', type: 'jsonb', nullable: true })
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
    email?: string;
  };

  @Column({ name: 'academic_info', type: 'jsonb', nullable: true })
  academicInfo: {
    gpa?: number;
    credits?: number;
    major?: string;
    minor?: string;
    advisor?: string;
    transcript?: {
      semester: string;
      courses: Array<{
        code: string;
        name: string;
        credits: number;
        grade: string;
      }>;
    }[];
  };

  @Column({ name: 'preferences', type: 'jsonb', nullable: true })
  preferences: {
    notifications: boolean;
    communicationMethod: 'email' | 'sms' | 'both';
    learningStyle: string[];
    subjects: string[];
  };

  // Relationships
  @ManyToOne(() => User, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'user_id' })
  user: User;

  // Timestamps
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date;

  // Virtual properties
  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }

  get age(): number {
    const today = new Date();
    const birthDate = new Date(this.dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }

    return age;
  }

  get isGraduated(): boolean {
    return this.graduationDate && this.graduationDate <= new Date();
  }

  // Methods
  updateGPA(newGPA: number): void {
    if (!this.academicInfo) {
      this.academicInfo = {};
    }
    this.academicInfo.gpa = newGPA;
  }

  addCourse(
    semester: string,
    course: { code: string; name: string; credits: number; grade: string },
  ): void {
    if (!this.academicInfo) {
      this.academicInfo = { transcript: [] };
    }
    if (!this.academicInfo.transcript) {
      this.academicInfo.transcript = [];
    }

    let semesterRecord = this.academicInfo.transcript.find(
      (t) => t.semester === semester,
    );
    if (!semesterRecord) {
      semesterRecord = { semester, courses: [] };
      this.academicInfo.transcript.push(semesterRecord);
    }

    semesterRecord.courses.push(course);
  }
}

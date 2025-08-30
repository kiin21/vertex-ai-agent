import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, Like, MoreThanOrEqual } from 'typeorm';
import { Student } from '../entities/student.entity';

@Injectable()
export class StudentRepository {
  constructor(
    @InjectRepository(Student)
    private readonly repository: Repository<Student>,
  ) {}

  async findById(id: string): Promise<Student | null> {
    return this.repository.findOne({
      where: { id },
      relations: ['user'],
    });
  }

  async findByStudentId(studentId: string): Promise<Student | null> {
    return this.repository.findOne({
      where: { studentId },
      relations: ['user'],
    });
  }

  async findByEmail(email: string): Promise<Student | null> {
    return this.repository.findOne({
      where: { email },
      relations: ['user'],
    });
  }

  async findByUserId(userId: string): Promise<Student | null> {
    return this.repository.findOne({
      where: { userId },
      relations: ['user'],
    });
  }

  async create(studentData: Partial<Student>): Promise<Student> {
    const student = this.repository.create(studentData);
    return this.repository.save(student);
  }

  async update(id: string, updateData: Partial<Student>): Promise<Student> {
    await this.repository.update(id, updateData);
    return this.findById(id);
  }

  async softDelete(id: string): Promise<void> {
    await this.repository.softDelete(id);
  }

  async restore(id: string): Promise<void> {
    await this.repository.restore(id);
  }

  async findActive(): Promise<Student[]> {
    return this.repository.find({
      where: { isActive: true },
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByGrade(grade: string): Promise<Student[]> {
    return this.repository.find({
      where: { grade },
      relations: ['user'],
      order: { lastName: 'ASC', firstName: 'ASC' },
    });
  }

  async findByAcademicYear(academicYear: string): Promise<Student[]> {
    return this.repository.find({
      where: { academicYear },
      relations: ['user'],
      order: { lastName: 'ASC', firstName: 'ASC' },
    });
  }

  async search(searchTerm: string): Promise<Student[]> {
    return this.repository.find({
      where: [
        { firstName: Like(`%${searchTerm}%`) },
        { lastName: Like(`%${searchTerm}%`) },
        { email: Like(`%${searchTerm}%`) },
        { studentId: Like(`%${searchTerm}%`) },
      ],
      relations: ['user'],
      order: { lastName: 'ASC', firstName: 'ASC' },
    });
  }

  async findWithPagination(
    page: number = 1,
    limit: number = 10,
    filters?: FindOptionsWhere<Student>,
  ): Promise<{
    data: Student[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const skip = (page - 1) * limit;

    const [data, total] = await this.repository.findAndCount({
      where: filters,
      relations: ['user'],
      skip,
      take: limit,
      order: { lastName: 'ASC', firstName: 'ASC' },
    });

    return {
      data,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async updateGPA(id: string, gpa: number): Promise<void> {
    const student = await this.findById(id);
    if (student) {
      student.updateGPA(gpa);
      await this.repository.save(student);
    }
  }

  async addCourse(
    id: string,
    semester: string,
    course: { code: string; name: string; credits: number; grade: string },
  ): Promise<void> {
    const student = await this.findById(id);
    if (student) {
      student.addCourse(semester, course);
      await this.repository.save(student);
    }
  }

  async updateEmergencyContact(
    id: string,
    emergencyContact: {
      name: string;
      relationship: string;
      phone: string;
      email?: string;
    },
  ): Promise<void> {
    await this.repository.update(id, { emergencyContact });
  }

  async updatePreferences(
    id: string,
    preferences: {
      notifications: boolean;
      communicationMethod: 'email' | 'sms' | 'both';
      learningStyle: string[];
      subjects: string[];
    },
  ): Promise<void> {
    await this.repository.update(id, { preferences });
  }

  async graduate(id: string, graduationDate: Date): Promise<void> {
    await this.repository.update(id, {
      graduationDate,
      isActive: false,
    });
  }

  async reactivate(id: string): Promise<void> {
    await this.repository.update(id, {
      isActive: true,
      graduationDate: null,
    });
  }

  async getStatistics(): Promise<{
    total: number;
    active: number;
    graduated: number;
    byGrade: Record<string, number>;
    byAcademicYear: Record<string, number>;
  }> {
    const [total, active] = await Promise.all([
      this.repository.count(),
      this.repository.count({ where: { isActive: true } }),
    ]);

    const graduated = await this.repository.count({
      where: { isActive: false },
    });

    // Get distribution by grade
    const gradeDistribution = await this.repository
      .createQueryBuilder('student')
      .select('student.grade', 'grade')
      .addSelect('COUNT(*)', 'count')
      .groupBy('student.grade')
      .getRawMany();

    const byGrade: Record<string, number> = {};
    for (const item of gradeDistribution) {
      byGrade[item.grade] = parseInt(item.count);
    }

    // Get distribution by academic year
    const yearDistribution = await this.repository
      .createQueryBuilder('student')
      .select('student.academicYear', 'academicYear')
      .addSelect('COUNT(*)', 'count')
      .groupBy('student.academicYear')
      .getRawMany();

    const byAcademicYear: Record<string, number> = {};
    for (const item of yearDistribution) {
      byAcademicYear[item.academicYear] = parseInt(item.count);
    }

    return {
      total,
      active,
      graduated,
      byGrade,
      byAcademicYear,
    };
  }

  async count(filters?: FindOptionsWhere<Student>): Promise<number> {
    return this.repository.count({ where: filters });
  }

  async findRecentEnrollments(days: number = 30): Promise<Student[]> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    return this.repository.find({
      where: {
        enrollmentDate: MoreThanOrEqual(cutoffDate),
      },
      relations: ['user'],
      order: { enrollmentDate: 'DESC' },
    });
  }
}

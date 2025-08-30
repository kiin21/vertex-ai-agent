import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, In } from 'typeorm';
import { User, UserStatus } from '../entities/user.entity';

@Injectable()
export class UserRepository {
  constructor(
    @InjectRepository(User)
    private readonly repository: Repository<User>,
  ) {}

  async findById(id: string): Promise<User | null> {
    return this.repository.findOne({
      where: { id },
      relations: ['profile'],
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.repository.findOne({
      where: { email },
      relations: ['profile'],
    });
  }

  async findByEmailWithPassword(email: string): Promise<User | null> {
    return this.repository.findOne({
      where: { email },
      select: [
        'id',
        'email',
        'password',
        'role',
        'status',
        'loginAttempts',
        'lockedUntil',
      ],
    });
  }

  async create(userData: Partial<User>): Promise<User> {
    const user = this.repository.create(userData);
    return this.repository.save(user);
  }

  async update(id: string, updateData: Partial<User>): Promise<User> {
    await this.repository.update(id, updateData);
    return this.findById(id);
  }

  async softDelete(id: string): Promise<void> {
    await this.repository.softDelete(id);
  }

  async restore(id: string): Promise<void> {
    await this.repository.restore(id);
  }

  async findActive(): Promise<User[]> {
    return this.repository.find({
      where: { status: UserStatus.ACTIVE },
      relations: ['profile'],
    });
  }

  async findByRole(role: string): Promise<User[]> {
    return this.repository.find({
      where: { role: role as any },
      relations: ['profile'],
    });
  }

  async findWithPagination(
    page: number = 1,
    limit: number = 10,
    filters?: FindOptionsWhere<User>,
  ): Promise<{
    data: User[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const skip = (page - 1) * limit;

    const [data, total] = await this.repository.findAndCount({
      where: filters,
      relations: ['profile'],
      skip,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    return {
      data,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async updateLastLogin(id: string): Promise<void> {
    await this.repository.update(id, {
      lastLoginAt: new Date(),
      loginAttempts: 0,
      lockedUntil: null,
    });
  }

  async incrementLoginAttempts(id: string): Promise<void> {
    await this.repository.increment({ id }, 'loginAttempts', 1);
  }

  async lockAccount(id: string, minutes: number = 30): Promise<void> {
    const lockedUntil = new Date(Date.now() + minutes * 60 * 1000);
    await this.repository.update(id, { lockedUntil });
  }

  async unlockAccount(id: string): Promise<void> {
    await this.repository.update(id, {
      lockedUntil: null,
      loginAttempts: 0,
    });
  }

  async changePassword(id: string, hashedPassword: string): Promise<void> {
    await this.repository.update(id, {
      password: hashedPassword,
      passwordChangedAt: new Date(),
    });
  }

  async verifyEmail(id: string): Promise<void> {
    await this.repository.update(id, {
      emailVerified: true,
      status: UserStatus.ACTIVE,
    });
  }

  async changeStatus(id: string, status: UserStatus): Promise<void> {
    await this.repository.update(id, { status });
  }

  async count(filters?: FindOptionsWhere<User>): Promise<number> {
    return this.repository.count({ where: filters });
  }

  async findByIds(ids: string[]): Promise<User[]> {
    return this.repository.find({
      where: { id: In(ids) },
      relations: ['profile'],
    });
  }
}

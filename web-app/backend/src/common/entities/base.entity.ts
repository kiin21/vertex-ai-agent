import {
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Column,
} from 'typeorm';

export abstract class BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date;

  @Column({ name: 'created_by', type: 'uuid', nullable: true })
  createdBy: string;

  @Column({ name: 'updated_by', type: 'uuid', nullable: true })
  updatedBy: string;

  // Virtual properties
  get isDeleted(): boolean {
    return !!this.deletedAt;
  }

  // Methods
  softDelete(deletedBy?: string): void {
    this.deletedAt = new Date();
    if (deletedBy) {
      this.updatedBy = deletedBy;
    }
  }

  restore(): void {
    this.deletedAt = null;
  }
}

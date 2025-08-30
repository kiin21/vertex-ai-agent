export interface IStudent {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  dateOfBirth: Date;
  grade: string;
  enrollmentDate: Date;
  isActive: boolean;
  phone?: string;
  address?: string;
  createdAt: Date;
  updatedAt: Date;
}

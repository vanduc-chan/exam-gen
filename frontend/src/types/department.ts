export interface Department {
  id: string;
  code: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DepartmentRequest {
  code: string;
  name: string;
  description?: string;
  isActive?: boolean;
}

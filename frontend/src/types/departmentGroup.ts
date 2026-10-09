export interface DepartmentGroup {
  id: string;
  code: string;
  name: string;
  description?: string;
  departmentId: string;
  departmentName?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DepartmentGroupRequest {
  code: string;
  name: string;
  description?: string;
  departmentId: string;
  isActive?: boolean;
}

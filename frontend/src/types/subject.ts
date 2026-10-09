export interface Subject {
  id: string;
  subjectCode: string;
  subjectName: string;
  description?: string;
  departmentGroupId?: string;
  departmentGroupName?: string;
  isActive?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SubjectRequest {
  subjectCode: string;
  subjectName: string;
  description?: string;
  departmentGroupId?: string;
  isActive?: boolean;
}

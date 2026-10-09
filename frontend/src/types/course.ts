export interface Course {
  id: string;
  courseCode: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CourseRequest {
  courseCode: string;
  name: string;
  description?: string;
  isActive?: boolean;
}

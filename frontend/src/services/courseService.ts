import api from '@/lib/api';
import { Course, CourseRequest } from '@/types/course';
import { ApiResponse } from '@/types/common';

export const courseService = {
  getAll: async () => {
    const response = await api.get<ApiResponse<Course[]>>('/courses');
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get<ApiResponse<Course>>(`/courses/${id}`);
    return response.data;
  },

  create: async (data: CourseRequest) => {
    const response = await api.post<ApiResponse<Course>>('/courses', data);
    return response.data;
  },

  update: async (id: string, data: CourseRequest) => {
    const response = await api.put<ApiResponse<Course>>(`/courses/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete<ApiResponse<void>>(`/courses/${id}`);
    return response.data;
  },
};

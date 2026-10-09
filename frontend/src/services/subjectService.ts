import api from '@/lib/api';
import { Subject, SubjectRequest } from '@/types/subject';
import { ApiResponse } from '@/types/common';

export const subjectService = {
  getAll: async (departmentGroupId?: string) => {
    const params = departmentGroupId ? { departmentGroupId } : {};
    const response = await api.get<ApiResponse<Subject[]>>('/subjects', { params });
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get<ApiResponse<Subject>>(`/subjects/${id}`);
    return response.data;
  },

  create: async (data: SubjectRequest) => {
    const response = await api.post<ApiResponse<Subject>>('/subjects', data);
    return response.data;
  },

  update: async (id: string, data: SubjectRequest) => {
    const response = await api.put<ApiResponse<Subject>>(`/subjects/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete<ApiResponse<void>>(`/subjects/${id}`);
    return response.data;
  },
};

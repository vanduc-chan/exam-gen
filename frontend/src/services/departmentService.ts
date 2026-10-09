import api from '@/lib/api';
import { Department, DepartmentRequest } from '@/types/department';
import { ApiResponse } from '@/types/common';

export const departmentService = {
  getAll: async () => {
    const response = await api.get<ApiResponse<Department[]>>('/departments');
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get<ApiResponse<Department>>(`/departments/${id}`);
    return response.data;
  },

  create: async (data: DepartmentRequest) => {
    const response = await api.post<ApiResponse<Department>>('/departments', data);
    return response.data;
  },

  update: async (id: string, data: DepartmentRequest) => {
    const response = await api.put<ApiResponse<Department>>(`/departments/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete<ApiResponse<void>>(`/departments/${id}`);
    return response.data;
  },
};

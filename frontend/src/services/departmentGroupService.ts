import api from '@/lib/api';
import { DepartmentGroup, DepartmentGroupRequest } from '@/types/departmentGroup';
import { ApiResponse } from '@/types/common';

export const departmentGroupService = {
  getAll: async (departmentId?: string) => {
    const params = departmentId ? { departmentId } : {};
    const response = await api.get<ApiResponse<DepartmentGroup[]>>('/department-groups', { params });
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get<ApiResponse<DepartmentGroup>>(`/department-groups/${id}`);
    return response.data;
  },

  create: async (data: DepartmentGroupRequest) => {
    const response = await api.post<ApiResponse<DepartmentGroup>>('/department-groups', data);
    return response.data;
  },

  update: async (id: string, data: DepartmentGroupRequest) => {
    const response = await api.put<ApiResponse<DepartmentGroup>>(`/department-groups/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete<ApiResponse<void>>(`/department-groups/${id}`);
    return response.data;
  },
};

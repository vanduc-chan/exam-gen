import api from '@/lib/api';
import { ApiResponse } from '@/types/common';

export const dashboardService = {
  getStats: async () => {
    const response = await api.get<ApiResponse<Record<string, number>>>('/dashboard/stats');
    return response.data;
  },
};

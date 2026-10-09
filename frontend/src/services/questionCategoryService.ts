import api from '@/lib/api';
import { QuestionCategory } from '@/types/questionCategory';
import { ApiResponse } from '@/types/common';

export const questionCategoryService = {
  getAll: async () => {
    const response = await api.get<ApiResponse<QuestionCategory[]>>('/question-categories');
    return response.data;
  },
};

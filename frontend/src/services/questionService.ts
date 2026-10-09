import api from '@/lib/api';
import { Question, QuestionRequest, QuestionType, DifficultyLevel } from '@/types/question';
import { ApiResponse, PageResponse } from '@/types/common';

interface GetQuestionsParams {
  page?: number;
  size?: number;
  subjectId?: string;
  type?: QuestionType;
  level?: DifficultyLevel;
  search?: string;
}

export const questionService = {
  getQuestions: async (params: GetQuestionsParams) => {
    const response = await api.get<ApiResponse<PageResponse<Question>>>('/questions', { params });
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get<ApiResponse<Question>>(`/questions/${id}`);
    return response.data;
  },

  create: async (data: QuestionRequest) => {
    const response = await api.post<ApiResponse<Question>>('/questions', data);
    return response.data;
  },

  update: async (id: string, data: QuestionRequest) => {
    const response = await api.put<ApiResponse<Question>>(`/questions/${id}`, data);
    return response.data;
  },

  deleteMultiple: async (ids: string[]) => {
    const response = await api.delete<ApiResponse<void>>('/questions', { data: ids });
    return response.data;
  },

  countActive: async (subjectId: string, type: QuestionType) => {
    const response = await api.get<ApiResponse<number>>('/questions/count', {
      params: { subjectId, type }
    });
    return response.data;
  },

  importExcel: async (formData: FormData) => {
    const response = await api.post<ApiResponse<Question[]>>('/questions/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }
};

import api from '@/lib/api';
import { Exam, ExamRequest } from '@/types/exam';
import { ApiResponse, PageResponse } from '@/types/common';

interface GetExamsParams {
  page?: number;
  size?: number;
  subjectId?: string;
  courseId?: string;
  search?: string;
}

export const examService = {
  getExams: async (params: GetExamsParams) => {
    const response = await api.get<ApiResponse<PageResponse<Exam>>>('/exams', { params });
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get<ApiResponse<Exam>>(`/exams/${id}`);
    return response.data;
  },

  generate: async (data: ExamRequest) => {
    const response = await api.post<ApiResponse<Exam>>('/exams/generate', data);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete<ApiResponse<void>>(`/exams/${id}`);
    return response.data;
  },

  exportToZip: async (id: string) => {
    const response = await api.get(`/export/exams/${id}/zip`, {
      responseType: 'blob',
    });
    return response.data;
  },
};

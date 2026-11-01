import api from '@/lib/api';
import { Exam } from '@/types/exam';
import {
  BatchSubjectAvailabilityRequest,
  ExamBlueprint,
  ExamBlueprintRequest,
  GraduationExamRequest,
  SlotAvailabilityRequest,
  SlotAvailabilityResponse,
  SubjectAvailabilityItemResponse,
} from '@/types/graduationExam';
import { ApiResponse, PageResponse } from '@/types/common';

interface GetGraduationExamsParams {
  page?: number;
  size?: number;
  courseId?: string;
  search?: string;
}

export const graduationExamService = {
  getGraduationExams: async (params: GetGraduationExamsParams) => {
    const response = await api.get<ApiResponse<PageResponse<Exam>>>('/graduation-exams', { params });
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get<ApiResponse<Exam>>(`/graduation-exams/${id}`);
    return response.data;
  },

  generate: async (data: GraduationExamRequest) => {
    const response = await api.post<ApiResponse<Exam>>('/graduation-exams/generate', data);
    return response.data;
  },

  update: async (id: string, data: GraduationExamRequest) => {
    const response = await api.put<ApiResponse<Exam>>(`/graduation-exams/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete<ApiResponse<void>>(`/graduation-exams/${id}`);
    return response.data;
  },

  checkSlotAvailability: async (data: SlotAvailabilityRequest) => {
    const response = await api.post<ApiResponse<SlotAvailabilityResponse>>(
      '/graduation-exams/check-availability',
      data
    );
    return response.data;
  },

  checkBatchAvailability: async (data: BatchSubjectAvailabilityRequest) => {
    const response = await api.post<ApiResponse<Record<string, SubjectAvailabilityItemResponse>>>(
      '/graduation-exams/check-availability-batch',
      data
    );
    return response.data;
  },

  // Blueprints ("Khung đề mẫu")
  getBlueprints: async (courseId?: string) => {
    const response = await api.get<ApiResponse<ExamBlueprint[]>>('/exam-blueprints', {
      params: courseId ? { courseId } : undefined,
    });
    return response.data;
  },

  getBlueprintById: async (id: string) => {
    const response = await api.get<ApiResponse<ExamBlueprint>>(`/exam-blueprints/${id}`);
    return response.data;
  },

  createBlueprint: async (data: ExamBlueprintRequest) => {
    const response = await api.post<ApiResponse<ExamBlueprint>>('/exam-blueprints', data);
    return response.data;
  },

  updateBlueprint: async (id: string, data: ExamBlueprintRequest) => {
    const response = await api.put<ApiResponse<ExamBlueprint>>(`/exam-blueprints/${id}`, data);
    return response.data;
  },

  deleteBlueprint: async (id: string) => {
    const response = await api.delete<ApiResponse<void>>(`/exam-blueprints/${id}`);
    return response.data;
  },
};

import { Course } from './course';

export enum QuestionType {
  LY_THUYET = 'LY_THUYET',
  THUC_HANH = 'THUC_HANH',
  TU_LUAN = 'TU_LUAN',
  TINH_HUONG = 'TINH_HUONG'
}

export enum DifficultyLevel {
  EASY = 'EASY',
  MEDIUM = 'MEDIUM',
  HARD = 'HARD'
}

export interface Question {
  id: string;
  code: string;
  content: string;
  type: QuestionType;
  difficultyLevel: DifficultyLevel;
  score: number;
  answer?: string;
  mediaUrl?: string;
  subjectId: string;
  subjectName: string;
  courses?: Course[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface QuestionRequest {
  code?: string;
  content: string;
  type: QuestionType;
  difficultyLevel: DifficultyLevel;
  score?: number;
  answer?: string;
  mediaUrl?: string;
  subjectId: string;
  courseIds?: string[];
  isActive?: boolean;
}



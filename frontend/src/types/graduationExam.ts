import { DifficultyLevel, QuestionType } from './question';

export enum SlotSourceType {
  BANK_RANDOM = 'BANK_RANDOM',
  BANK_PICKED = 'BANK_PICKED',
  BANK_FIXED = 'BANK_FIXED',
}

export interface BlueprintSlot {
  id: string;
  slotOrder: number;
  sourceType: SlotSourceType;
  subjectId?: string;
  subjectName?: string;
  questionType?: QuestionType | null;
  difficultyLevel?: DifficultyLevel | null;
  questionCount: number;
  score?: number;
  questionIds?: string[];
}

export interface BlueprintSection {
  id: string;
  sectionOrder: number;
  title: string;
  subjectId?: string;
  subjectName?: string;
  slots: BlueprintSlot[];
}

export interface ExamBlueprint {
  id: string;
  name: string;
  description?: string;
  courseIds: string[];
  courseNames: string[];
  courseCodes: string[];
  sections: BlueprintSection[];
  totalQuestions: number;
  totalScore: number;
  createdAt: string;
  updatedAt: string;
}

export interface ExamBlueprintRequest {
  name: string;
  description?: string;
  courseIds: string[];
  sections: BlueprintSection[];
}

export interface GraduationExamRequest {
  title: string;
  courseIds: string[];
  semester?: string;
  academicYear?: string;
  unit?: string;
  examDate?: string;
  durationMinutes?: number;
  numberOfExams: number;
  examsPerBatch: number;
  blueprintId?: string;
  sections: BlueprintSection[];
  regenerateQuestions?: boolean;
}

export interface SlotAvailabilityRequest {
  courseIds: string[];
  subjectId?: string;
  questionType?: QuestionType | null;
  difficultyLevel?: DifficultyLevel | null;
}

export interface SlotAvailabilityResponse {
  availableCount: number;
  valid: boolean;
  message: string;
}

export interface BatchSubjectAvailabilityRequest {
  courseIds: string[];
  subjectIds: string[];
}

export interface SubjectAvailabilityItemResponse {
  subjectId: string;
  subjectName: string;
  totalAvailable: number;
  countByType: Record<string, number>;
  valid: boolean;
  message: string;
}

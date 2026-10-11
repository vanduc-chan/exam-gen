export enum ExamStructureType {
  THEORY_PRACTICE = 'THEORY_PRACTICE',
  ESSAY = 'ESSAY',
  THEORY_PRACTICE_SITUATION = 'THEORY_PRACTICE_SITUATION',
  CUSTOM = 'CUSTOM'
}

export enum ExamStatus {
  DRAFT = 'DRAFT',
  GENERATED = 'GENERATED',
  EXPORTED = 'EXPORTED'
}

export interface Exam {
  id: string;
  code: string;
  title: string;
  subjectId: string;
  subjectName: string;
  courseId: string;
  courseName: string;
  semester: string;
  academicYear: string;
  durationMinutes: number;
  examStructure?: ExamStructureType;
  numberOfTheories?: number;
  numberOfPractices?: number;
  numberOfEssays?: number;
  numberOfSituations?: number;
  numberOfExams: number;
  status: ExamStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ExamRequest {
  title: string;
  subjectId: string;
  courseId: string;
  semester: string;
  academicYear: string;
  durationMinutes: number;
  examStructure?: ExamStructureType;
  numberOfExams: number;
  numberOfTheories?: number;
  numberOfPractices?: number;
  numberOfEssays?: number;
  numberOfSituations?: number;
  regenerateQuestions?: boolean;
}

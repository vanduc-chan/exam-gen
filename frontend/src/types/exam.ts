export enum ExamStructureType {
  THEORY_PRACTICE = 'THEORY_PRACTICE',
  ESSAY = 'ESSAY',
  THEORY_PRACTICE_SITUATION = 'THEORY_PRACTICE_SITUATION'
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
  examStructure: ExamStructureType;
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
  examStructure: ExamStructureType;
  numberOfExams: number;
}

export interface Question {
  id?: number;
  text: string;
  imageUrl?: string;
  type: 'MULTIPLE_CHOICE' | 'DIRECT_ANSWER';
  duration: number; // en secondes
  choices?: string[];
  correctAnswer: string;
}

export interface Exam {
  id?: number;
  title: string;
  description?: string;
  questions: Question[];
  shareLink?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface StudentAnswer {
  id?: number;
  examId: number;
  studentEmail: string;
  questionId: number;
  answer: string;
  isCorrect?: boolean;
  score?: number;
}

export interface ExamResult {
  examId: number;
  studentEmail: string;
  totalScore: number;
  answers: StudentAnswer[];
} 
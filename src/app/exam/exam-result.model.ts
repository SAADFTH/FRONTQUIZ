export interface ExamResult {
  examId: number;
  score: number;
  timeSpent: number;
  answers: {
    questionId: number;
    studentAnswer: string;
    correctAnswer: string;
    isCorrect: boolean;
  }[];
}


export interface AnswerResult {
  questionId: number;
  questionText: string;
  studentAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
} 
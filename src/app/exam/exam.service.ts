import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap, map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { Exam, ExamResult } from './exam.model';
import { AuthService } from '../auth/auth.service';

@Injectable({
  providedIn: 'root'
})
export class ExamService {
  private headers = new HttpHeaders({
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  });

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  private checkProfessorRole(): boolean {
    const currentUser = this.authService.getCurrentUser();
    return currentUser?.role === 'PROFESSOR';
  }

  getProfessorExams(): Observable<Exam[]> {
    console.log('ExamService - Récupération des examens du professeur');
    return this.http.get<Exam[]>(`${environment.apiUrl}/professor/exams`, { headers: this.headers }).pipe(
      tap(exams => console.log('ExamService - Examens reçus:', exams)),
      catchError(this.handleError)
    );
  }

  private handleError(error: HttpErrorResponse) {
    console.error('ExamService - Erreur HTTP:', {
      status: error.status,
      statusText: error.statusText,
      url: error.url,
      error: error.error,
      rawResponse: error instanceof HttpErrorResponse ? error : 'Non HTTP Error'
    });
    
    let errorMessage = 'Une erreur est survenue';
    
    if (error.status === 200 && error.error instanceof ProgressEvent) {
      console.log('ExamService - Réponse brute reçue:', error);
      errorMessage = 'Erreur lors de la lecture de la réponse du serveur';
    } else if (error.status === 403) {
      errorMessage = 'Vous n\'avez pas les permissions nécessaires pour accéder à cette ressource';
    } else if (error.status === 401) {
      errorMessage = 'Votre session a expiré, veuillez vous reconnecter';
    } else if (error.error instanceof ErrorEvent) {
      errorMessage = `Erreur: ${error.error.message}`;
    } else if (error.error?.message) {
      errorMessage = error.error.message;
    }
    
    return throwError(() => new Error(errorMessage));
  }

  getAvailableExams(): Observable<Exam[]> {
    console.log('ExamService - Récupération des examens disponibles');
    return this.http.get<Exam[]>(`${environment.apiUrl}/student/exams/available`, { headers: this.headers }).pipe(
      tap(response => console.log('ExamService - Réponse des examens disponibles:', response)),
      catchError(this.handleError.bind(this))
    );
  }

  getCompletedExams(): Observable<Exam[]> {
    return this.http.get<Exam[]>(`${environment.apiUrl}/student/exams/completed`, { headers: this.headers }).pipe(
      tap(response => console.log('ExamService - Réponse des examens complétés:', response)),
      catchError(this.handleError)
    );
  }

  getExam(id: number): Observable<Exam> {
    console.log(`ExamService - Récupération de l'examen ${id}`);
    const role = this.checkProfessorRole() ? 'professor' : 'student';
    return this.http.get<Exam>(`${environment.apiUrl}/${role}/exams/${id}`, { 
      headers: this.headers,
      observe: 'response'
    }).pipe(
      tap(response => {
        console.log('ExamService - Headers de la réponse:', {
          contentType: response.headers.get('Content-Type'),
          contentLength: response.headers.get('Content-Length'),
          allHeaders: Object.fromEntries(response.headers.keys().map(key => [key, response.headers.get(key)]))
        });
        console.log('ExamService - Corps de la réponse brut:', response.body);
        if (response.body) {
          console.log('ExamService - Structure de la réponse:', {
            hasId: 'id' in response.body,
            hasName: 'name' in response.body,
            hasQuestions: 'questions' in response.body,
            questionsType: response.body.questions ? typeof response.body.questions : 'undefined',
            isQuestionsArray: Array.isArray(response.body.questions),
            questionsLength: Array.isArray(response.body.questions) ? response.body.questions.length : 'N/A'
          });
        }
      }),
      map(response => {
        if (!response.body) {
          throw new Error('La réponse du serveur est vide');
        }
        return response.body;
      }),
      catchError(this.handleError.bind(this))
    );
  }

  createExam(exam: Partial<Exam>): Observable<Exam> {
    return this.http.post<Exam>(`${environment.apiUrl}/professor/exams`, exam, { headers: this.headers }).pipe(
      catchError(this.handleError)
    );
  }

  updateExam(id: number, exam: Partial<Exam>): Observable<Exam> {
    if (!this.checkProfessorRole()) {
      return throwError(() => new Error('Seuls les professeurs peuvent modifier les examens'));
    }

    return this.http.put<Exam>(`${environment.apiUrl}/professor/exams/${id}`, exam, { headers: this.headers }).pipe(
      catchError(this.handleError)
    );
  }

  deleteExam(id: number): Observable<void> {
    if (!this.checkProfessorRole()) {
      return throwError(() => new Error('Seuls les professeurs peuvent supprimer les examens'));
    }

    return this.http.delete<void>(`${environment.apiUrl}/professor/exams/${id}`, { headers: this.headers }).pipe(
      catchError(this.handleError)
    );
  }

  submitExam(examId: number, answers: { questionId: number; answer: string }[]): Observable<ExamResult> {
    const submissions = answers.map(a => ({
      question: { id: a.questionId },
      answer: a.answer,
      isCorrect: false // Le backend déterminera si la réponse est correcte
    }));

    return this.http.post<ExamResult>(`${environment.apiUrl}/student/exams/${examId}/submit`, submissions, { headers: this.headers }).pipe(
      catchError(this.handleError)
    );
  }

  getExamResult(examId: number): Observable<ExamResult> {
    return this.http.get<ExamResult>(`${environment.apiUrl}/student/exams/${examId}/result`, { headers: this.headers }).pipe(
      catchError(this.handleError)
    );
  }

  getProfessorExam(id: number): Observable<Exam> {
    return this.http.get<Exam>(`${environment.apiUrl}/professor/exams/${id}`).pipe(
      catchError(this.handleError)
    );
  }

  uploadImage(file: File): Observable<string> {
    const formData = new FormData();
    formData.append('file', file);
    
    return this.http.post<string>(`${environment.apiUrl}/professor/exams/upload-image`, formData).pipe(
      catchError(this.handleError)
    );
  }

  getExamForStudent(examId: number): Observable<Exam> {
    return this.http.get<Exam>(`${environment.apiUrl}/student/exams/${examId}`, { headers: this.headers }).pipe(
      catchError(this.handleError)
    );
  }
  getExamByAccessCode(code: string): Observable<Exam> {
    return this.http.get<Exam>(`${environment.apiUrl}/exams/access/${code}`);
  }
  addQuestionToExam(examId: number, question: { text: string, options: string[], correctAnswer: string }): Observable<any> {
    if (!this.checkProfessorRole()) {
      return throwError(() => new Error('Seuls les professeurs peuvent ajouter des questions'));
    }
  
    return this.http.post(`${environment.apiUrl}/professor/exams/${examId}/questions`, question, {
      headers: this.headers
    }).pipe(
      catchError(this.handleError)
    );
  }
  
  
} 
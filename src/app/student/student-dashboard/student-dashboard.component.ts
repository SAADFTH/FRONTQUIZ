import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ExamService } from '../../exam/exam.service';
import { Exam } from '../../exam/exam.model';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
  selector: 'app-student-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="container mx-auto px-4 py-8">
      <h1 class="text-3xl font-bold mb-6">Tableau de bord de l'étudiant</h1>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="bg-white rounded-lg shadow p-6">
          <h2 class="text-xl font-semibold mb-4">Entrer un code d'examen</h2>
          <form (ngSubmit)="submitExamCode()">
            <input
              type="text"
              [(ngModel)]="examCode"
              name="examCode"
              class="border border-gray-300 p-2 rounded w-full mb-4"
              placeholder="Code de l'examen"
              required
              minlength="8"
            />
            <button 
              type="submit" 
              class="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
              [disabled]="!examCode"
            >
              Commencer l'examen
            </button>
          </form>
          <div *ngIf="errorMessage" class="text-red-600 mt-2">{{ errorMessage }}</div>
        </div>
        
        <div class="bg-white rounded-lg shadow p-6">
          <h2 class="text-xl font-semibold mb-4">Mes résultats</h2>
          <div *ngIf="recentResults.length > 0; else noResults">
            <div *ngFor="let result of recentResults" class="mb-4 p-3 border-b">
              <h3 class="font-medium">{{ result.examName }}</h3>
              <p>Score: {{ result.score }}%</p>
              <p>Date: {{ result.date | date }}</p>
            </div>
          </div>
          <ng-template #noResults>
            <p>Aucun résultat disponible pour le moment.</p>
          </ng-template>
        </div>
      </div>
    </div>
  `,
  styles: [`
    button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  `]
})
export class StudentDashboardComponent {
  examCode: string = '';
  errorMessage: string | null = null;
  recentResults: any[] = []; // À remplacer par votre modèle de résultats

  constructor(private examService: ExamService, private router: Router) {}

  submitExamCode(): void {
    if (!this.examCode) return;
    
    this.errorMessage = null;
    
    this.examService.getExamByAccessCode(this.examCode)
      .pipe(
        catchError(error => {
          console.error('Error accessing exam:', error);
          this.errorMessage = this.getErrorMessage(error.status);
          return of(null);
        })
      )
      .subscribe({
        next: (exam: Exam | null) => {
          if (exam?.id) {
            this.router.navigate(['/student/exams', exam.id, 'take']);
          } else if (exam === null) {
            // Géré par catchError
          } else {
            this.errorMessage = 'Code invalide ou examen introuvable.';
          }
        }
      });
  }

  private getErrorMessage(status: number): string {
    switch (status) {
      case 403:
        return 'Accès refusé à cet examen.';
      case 404:
        return 'Aucun examen trouvé avec ce code.';
      case 0:
        return 'Impossible de se connecter au serveur.';
      default:
        return 'Une erreur est survenue. Veuillez réessayer.';
    }
  }

  // À implémenter pour charger les résultats
  loadRecentResults(): void {
    // this.examService.getStudentResults().subscribe(results => {
    //   this.recentResults = results;
    // });
  }
}
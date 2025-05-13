import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormArray, FormControl } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ExamService } from '../../services/exam.service';
import { Exam, Question, Answer } from '../../models/exam.model';

@Component({
  selector: 'app-exam-form',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="bg-white shadow sm:rounded-lg">
      <div class="px-4 py-5 sm:p-6">
        <h3 class="text-lg leading-6 font-medium text-gray-900">
          {{ isEditMode ? 'Edit Exam' : 'Create New Exam' }}
        </h3>
        <form [formGroup]="examForm" (ngSubmit)="onSubmit()" class="mt-5 space-y-6">
          <div>
            <label for="title" class="block text-sm font-medium text-gray-700">Title</label>
            <input type="text" id="title" formControlName="title"
              class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
          </div>

          <div>
            <label for="description" class="block text-sm font-medium text-gray-700">Description</label>
            <textarea id="description" formControlName="description" rows="3"
              class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"></textarea>
          </div>

          <div formArrayName="questions">
            <div class="flex justify-between items-center mb-4">
              <h4 class="text-lg font-medium text-gray-900">Questions</h4>
              <button type="button" (click)="addQuestion()"
                class="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                Add Question
              </button>
            </div>

            <div *ngFor="let question of questions.controls; let i = index" [formGroupName]="i"
              class="border rounded-lg p-4 mb-4">
              <div class="flex justify-between items-start mb-4">
                <h5 class="text-md font-medium text-gray-900">Question {{ i + 1 }}</h5>
                <button type="button" (click)="removeQuestion(i)"
                  class="text-red-600 hover:text-red-900">Remove</button>
              </div>

              <div class="space-y-4">
                <div>
                  <label [for]="'text-' + i" class="block text-sm font-medium text-gray-700">Question Text</label>
                  <input type="text" [id]="'text-' + i" formControlName="text"
                    class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                </div>

                <div>
                  <label [for]="'type-' + i" class="block text-sm font-medium text-gray-700">Question Type</label>
                  <select [id]="'type-' + i" formControlName="type"
                    class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                    <option value="MULTIPLE_CHOICE">Multiple Choice</option>
                    <option value="DIRECT_ANSWER">Direct Answer</option>
                  </select>
                </div>

                <div>
                  <label [for]="'duration-' + i" class="block text-sm font-medium text-gray-700">Duration (seconds)</label>
                  <input type="number" [id]="'duration-' + i" formControlName="duration"
                    class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                </div>

                <div *ngIf="question.get('type')?.value === 'MULTIPLE_CHOICE'" formArrayName="choices">
                  <div class="flex justify-between items-center mb-2">
                    <label class="block text-sm font-medium text-gray-700">Choices</label>
                    <button type="button" (click)="addChoice(i)"
                      class="text-indigo-600 hover:text-indigo-900">Add Choice</button>
                  </div>
                  <div *ngFor="let choice of getChoices(i).controls; let j = index" [formGroupName]="j" class="flex items-center space-x-2">
                    <input type="text" formControlName="text"
                      class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                    <button type="button" (click)="removeChoice(i, j)"
                      class="text-red-600 hover:text-red-900">Remove</button>
                  </div>
                </div>

                <div>
                  <label [for]="'correctAnswer-' + i" class="block text-sm font-medium text-gray-700">Correct Answer</label>
                  <input type="text" [id]="'correctAnswer-' + i" formControlName="correctAnswer"
                    class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                </div>
              </div>
            </div>
          </div>

          <div class="flex justify-end">
            <button type="button" (click)="onCancel()"
              class="mr-3 inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
              Cancel
            </button>
            <button type="submit"
              class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
              {{ isEditMode ? 'Update' : 'Create' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: []
})
export class ExamFormComponent implements OnInit {
  examForm: FormGroup;
  isEditMode = false;
  examId?: number;

  constructor(
    private fb: FormBuilder,
    private examService: ExamService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.examForm = this.fb.group({
      title: ['', Validators.required],
      description: [''],
      questions: this.fb.array([])
    });
  }

  ngOnInit() {
    this.examId = this.route.snapshot.params['id'];
    if (this.examId) {
      this.isEditMode = true;
      this.loadExam();
    } else {
      // Générer un code d'accès par défaut pour les nouveaux examens
      this.generateAccessCode();
    }
  }

  get questions() {
    return this.examForm.get('questions') as FormArray;
  }

  getAnswers(questionIndex: number) {
    return this.questions.at(questionIndex).get('answers') as FormArray;
  }

  // Générer un code d'accès aléatoire
  generateAccessCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    this.examForm.get('accessCode')?.setValue(code);
  }

  addQuestion() {
    const questionForm = this.fb.group({
      id: [0],
      text: ['', Validators.required],
      type: ['MULTIPLE_CHOICE', Validators.required],
      timeLimit: [60, [Validators.required, Validators.min(10)]],
      imageUrl: [''],
      correctAnswer: [''],
      answers: this.fb.array([])
    });

    // Ajouter deux options de réponse par défaut pour les QCM
    if (questionForm.get('type')?.value === 'MULTIPLE_CHOICE') {
      this.addAnswer(this.questions.length);
      this.addAnswer(this.questions.length);
    }

    this.questions.push(questionForm);
  }

  removeQuestion(index: number) {
    this.questions.removeAt(index);
  }

  addAnswer(questionIndex: number) {
    const answersArray = this.getAnswers(questionIndex);
    const answerForm = this.fb.group({
      id: [0],
      text: ['', Validators.required],
      isCorrect: [false]
    });

    answersArray.push(answerForm);
  }

  removeAnswer(questionIndex: number, answerIndex: number) {
    const answersArray = this.getAnswers(questionIndex);
    answersArray.removeAt(answerIndex);
  }

  loadExam() {
    this.examService.getExam(this.examId).subscribe({
      next: (exam) => {
        this.examForm.patchValue({
          title: exam.name,
          description: exam.description,
          accessCode: exam.accessCode
        });

        // Effacer les questions existantes
        while (this.questions.length) {
          this.questions.removeAt(0);
        }

        // Ajouter les questions de l'examen chargé
        exam.questions.forEach(question => {
          const questionForm = this.fb.group({
            id: [question.id],
            text: [question.text, Validators.required],
            type: [question.type, Validators.required],
            timeLimit: [question.timeLimit, [Validators.required, Validators.min(10)]],
            imageUrl: [question.imageUrl || ''],
            correctAnswer: [''],
            answers: this.fb.array([])
          });

          // Ajouter les options pour les questions à choix multiples
          if (question.type === 'MULTIPLE_CHOICE' && question.answers) {
            const answersArray = questionForm.get('answers') as FormArray;
            question.answers.forEach(answer => {
              const answerForm = this.fb.group({
                id: [answer.id],
                text: [answer.text, Validators.required],
                isCorrect: [answer.isCorrect]
              });
              answersArray.push(answerForm);
            });
          } else if (question.type === 'DIRECT_ANSWER' && question.answers && question.answers.length > 0) {
            // Définir la réponse correcte pour les questions à réponse directe
            const correctAnswer = question.answers.find(a => a.isCorrect);
            if (correctAnswer) {
              questionForm.patchValue({ correctAnswer: correctAnswer.text });
            }
          }

          this.questions.push(questionForm);
        });
      },
      error: (error) => {
        console.error('Erreur lors du chargement de l\'examen', error);
      }
    });
  }

  onSubmit() {
    if (this.examForm.invalid) {
      return;
    }

    const formValue = this.examForm.value;
    const exam: Exam = {
      id: this.isEditMode ? this.examId : 0,
      name: formValue.title,
      description: formValue.description,
      accessCode: formValue.accessCode,
      professorId: 0, // This will be set by the backend based on the authenticated user
      questions: formValue.questions.map((q: any) => {
        // Préparer les réponses pour les questions QCM
        let answers: Answer[] = [];
        if (q.type === 'MULTIPLE_CHOICE' && q.answers && q.answers.length > 0) {
          answers = q.answers.map((a: any) => ({
            id: a.id || 0,
            text: a.text,
            isCorrect: a.isCorrect || false
          }));
        } else if (q.type === 'DIRECT_ANSWER' && q.correctAnswer) {
          // Pour les questions à réponse directe, créer une seule réponse correcte
          answers = [{
            id: 0,
            text: q.correctAnswer,
            isCorrect: true
          }];
        }

        return {
          id: q.id || 0,
          text: q.text,
          type: q.type,
          timeLimit: q.timeLimit || 60, // Valeur par défaut de 60 secondes
          imageUrl: q.imageUrl || null,
          answers: answers
        };
      }),
      duration: this.calculateTotalDuration(formValue.questions) // Calculer la durée totale
    };

    if (this.isEditMode) {
      this.examService.updateExam(this.examId, exam).subscribe({
        next: (updatedExam) => {
          console.log('Examen mis à jour avec succès', updatedExam);
          this.router.navigate(['/professor/exams']);
        },
        error: (error) => {
          console.error('Erreur lors de la mise à jour de l\'examen', error);
        }
      });
    } else {
      this.examService.createExam(exam).subscribe({
        next: (createdExam) => {
          console.log('Examen créé avec succès', createdExam);
          this.router.navigate(['/professor/exams']);
        },
        error: (error) => {
          console.error('Erreur lors de la création de l\'examen', error);
        }
      });
    }
  }

  // Calculer la durée totale de l'examen en secondes
  calculateTotalDuration(questions: any[]): number {
    if (!questions || questions.length === 0) return 0;
    return questions.reduce((total, q) => total + (q.timeLimit || 60), 0);
  }

  onCancel() {
    this.router.navigate(['/exams']);
  }
}

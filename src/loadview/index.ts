import Electrobun, { Electroview } from "electrobun/view";
import { RPCType } from "../types/rpc";
import { Quiz, QuizQuestion } from "../types/questions";

console.log("Hello Electrobun view loaded!");

const rpc = Electroview.defineRPC<RPCType>({
  maxRequestTime: 60000,
  handlers: {
    requests: {}
  }
});

class QuizManager {
  private quiz: Quiz | null = null;
  private currentQuestionIndex: number = 0;
  private selectedAnswers: { [questionId: string]: string } = {};
  private startTime: number = 0;
  private timerInterval: NodeJS.Timeout | null = null;
  private playerName: string = '';

  // DOM elements
  private questionText: HTMLElement;
  private optionsContainer: HTMLElement;
  private prevBtn: HTMLButtonElement;
  private nextBtn: HTMLButtonElement;
  private quizImage: HTMLImageElement;
  private nameModal: HTMLElement;
  private quizContainer: HTMLElement;
  private nameInput: HTMLInputElement;
  private startBtn: HTMLButtonElement;
  private nameError: HTMLElement;
  private displayPlayerName: HTMLElement;
  private closeBtn: HTMLButtonElement;

  constructor() {
    this.questionText = document.getElementById('question-text')!;
    this.optionsContainer = document.getElementById('options-container')!;
    this.prevBtn = document.getElementById('prev-btn') as HTMLButtonElement;
    this.nextBtn = document.getElementById('next-btn') as HTMLButtonElement;
    this.quizImage = document.querySelector('.quiz-image') as HTMLImageElement;
    this.nameModal = document.getElementById('nameModal')!;
    this.quizContainer = document.getElementById('quizContainer')!;
    this.nameInput = document.getElementById('playerName') as HTMLInputElement;
    this.startBtn = document.getElementById('startQuizBtn') as HTMLButtonElement;
    this.nameError = document.getElementById('nameError')!;
    this.displayPlayerName = document.getElementById('displayPlayerName')!;
    this.closeBtn = document.getElementById('closeQuizBtn') as HTMLButtonElement;

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    // Quiz navigation
    this.prevBtn.addEventListener('click', () => this.previousQuestion());
    this.nextBtn.addEventListener('click', () => this.nextQuestion());
    
    // Back to menu / close button
    if (this.closeBtn) {
      this.closeBtn.addEventListener('click', () => this.handleBackToMenuClick());
    }
    
    // Modal events
    this.startBtn.addEventListener('click', () => this.handleStartQuiz());
    this.nameInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.handleStartQuiz();
      }
    });
    
    // Real-time validation
    this.nameInput.addEventListener('input', () => {
      this.validateName();
    });
    
    // Focus name input when modal loads
    setTimeout(() => {
      this.nameInput.focus();
    }, 400);
  }

  private handleBackToMenuClick(): void {
    const ok = confirm('Return to menu? Any progress will be lost.');
    if (!ok) return;

    // stop timer if running
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }

    // navigate back to menu view
    window.location.href = 'views://menuview/index.html';
  }

  private validateName(): boolean {
    const name = this.nameInput.value.trim();
    
    if (name.length < 2) {
      this.showNameError('Name must be at least 2 characters long');
      return false;
    }
    
    if (name.length > 50) {
      this.showNameError('Name must be less than 50 characters');
      return false;
    }
    
    if (!/^[a-zA-Z\s\-'\.]+$/.test(name)) {
      this.showNameError('Name can only contain letters, spaces, hyphens, apostrophes, and periods');
      return false;
    }
    
    this.hideNameError();
    return true;
  }

  private showNameError(message: string): void {
    this.nameError.textContent = message;
    this.nameError.style.display = 'block';
    this.nameInput.style.borderColor = '#dc3545';
    this.startBtn.disabled = true;
  }

  private hideNameError(): void {
    this.nameError.style.display = 'none';
    this.nameInput.style.borderColor = '#0078d7';
    this.startBtn.disabled = false;
  }

  private handleStartQuiz(): void {
    if (!this.validateName()) {
      this.nameInput.focus();
      return;
    }

    this.playerName = this.nameInput.value.trim();
    this.displayPlayerName.textContent = this.playerName;
    
    // Hide modal and show quiz with animation
    this.nameModal.style.animation = 'fadeOut 0.3s ease';
    setTimeout(() => {
      this.nameModal.classList.add('modal-hidden');
      this.quizContainer.classList.add('quiz-shown');
      this.quizContainer.style.display = 'flex';
      
      // Start the quiz if it's loaded
      if (this.quiz) {
        this.startQuiz();
      }
    }, 300);
  }

  public loadQuiz(quiz: Quiz): void {
    this.quiz = quiz;
    
    // If player name is already entered, start the quiz
    if (this.playerName) {
      this.startQuiz();
    }
    // Otherwise, quiz will start when player enters name
  }

  private startQuiz(): void {
    if (!this.quiz) return;
    
    this.currentQuestionIndex = 0;
    this.selectedAnswers = {};
    this.startTime = Date.now();

    // Randomize questions if enabled
    if (this.quiz.random) {
      this.quiz.questions = [...this.quiz.questions].sort(() => Math.random() - 0.5);
    }

    this.renderCurrentQuestion();
    this.startTimer();
    this.updateNavigationButtons();
  }

  private renderCurrentQuestion(): void {
    if (!this.quiz || this.currentQuestionIndex >= this.quiz.questions.length) {
      return;
    }

    const question = this.quiz.questions[this.currentQuestionIndex];
    
    // Update question text
    this.questionText.textContent = question.question;
    
    // Update image
    if (question.imageBase64) {
      this.quizImage.src = `${question.imageBase64}`;
      this.quizImage.style.display = 'block';
    } else {
      this.quizImage.style.display = 'none';
    }

    // Clear and populate options
    this.optionsContainer.innerHTML = '';
    
    question.possibleAnswers.forEach((answer, index) => {
      const button = document.createElement('button');
      button.className = 'quiz-option';
      button.textContent = answer.text;
      button.dataset.answerId = answer.id;
      button.dataset.answerIndex = index.toString();
      
      // Check if this option was previously selected
      if (this.selectedAnswers[question.id] === answer.id) {
        button.classList.add('selected');
      }
      
      button.addEventListener('click', () => this.selectAnswer(question.id, answer.id, button));
      this.optionsContainer.appendChild(button);
    });

    // Update progress indicator
    this.updateProgressIndicator();
  }

  private selectAnswer(questionId: string, answerId: string, buttonElement: HTMLButtonElement): void {
    // Remove selection from all options
    this.optionsContainer.querySelectorAll('.quiz-option').forEach(btn => {
      btn.classList.remove('selected');
    });
    
    // Add selection to clicked option
    buttonElement.classList.add('selected');
    
    // Store the selected answer
    this.selectedAnswers[questionId] = answerId;
    
    // Auto-advance to next question after a short delay
    setTimeout(() => {
      this.nextQuestion();
    }, 500);
  }

  private previousQuestion(): void {
    if (this.currentQuestionIndex > 0) {
      this.currentQuestionIndex--;
      this.renderCurrentQuestion();
      this.updateNavigationButtons();
    }
  }

  private nextQuestion(): void {
    if (!this.quiz) return;

    if (this.currentQuestionIndex < this.quiz.questions.length - 1) {
      this.currentQuestionIndex++;
      this.renderCurrentQuestion();
      this.updateNavigationButtons();
    } else {
      // Quiz completed
      this.completeQuiz();
    }
  }

  private updateNavigationButtons(): void {
    if (!this.quiz) return;

    this.prevBtn.disabled = this.currentQuestionIndex === 0;
    this.nextBtn.textContent = this.currentQuestionIndex === this.quiz.questions.length - 1 ? 'Finish' : 'Next';
  }

  private updateProgressIndicator(): void {
    if (!this.quiz) return;

    let progressIndicator = document.querySelector('.progress-indicator') as HTMLElement;
    if (!progressIndicator) {
      progressIndicator = document.createElement('div');
      progressIndicator.className = 'progress-indicator';
      this.quizContainer.insertBefore(progressIndicator, this.questionText);
    }

    const progress = ((this.currentQuestionIndex + 1) / this.quiz.questions.length) * 100;
    progressIndicator.innerHTML = `
      <div class="progress-bar">
        <div class="progress-fill" style="width: ${progress}%"></div>
      </div>
      <div class="progress-text">
        Question ${this.currentQuestionIndex + 1} of ${this.quiz.questions.length}
      </div>
    `;
  }

  private startTimer(): void {
    if (!this.quiz || !this.quiz.totalTimeSeconds) return;

    let timeRemaining = this.quiz.totalTimeSeconds;
    
    let timerDisplay = document.querySelector('.timer-display') as HTMLElement;
    if (!timerDisplay) {
      timerDisplay = document.createElement('div');
      timerDisplay.className = 'timer-display';
      this.quizContainer.insertBefore(timerDisplay, document.querySelector('.progress-indicator'));
    }

    this.timerInterval = setInterval(() => {
      timeRemaining--;
      
      const minutes = Math.floor(timeRemaining / 60);
      const seconds = timeRemaining % 60;
      timerDisplay.textContent = `Time: ${minutes}:${seconds.toString().padStart(2, '0')}`;
      
      if (timeRemaining <= 0) {
        this.completeQuiz();
      }
      
      if (timeRemaining <= 60) {
        timerDisplay.classList.add('timer-warning');
      }
    }, 1000);
  }

  private completeQuiz(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }

    const completionTime = Date.now() - this.startTime;
    const results = this.calculateResults();
    
    console.log('Quiz completed!', {
      playerName: this.playerName,
      quiz: this.quiz,
      selectedAnswers: this.selectedAnswers,
      results,
      completionTime
    });

    rpc.request.saveQuizAnswers({ quizId: this.quiz!.id, answers: this.selectedAnswers, timeTakenSeconds: Math.round(completionTime / 1000), playerName: this.playerName }).then((response) => {
        if (response.success) {
            console.log("Quiz answers saved successfully.");
        } else {
            console.error("Failed to save quiz answers.");
        }
    }).catch((error) => {
        console.error("Error saving quiz answers:", error);
    });

    this.showResults(results, completionTime);
  }

  private calculateResults(): { score: number; totalQuestions: number; percentage: number } {
    if (!this.quiz) return { score: 0, totalQuestions: 0, percentage: 0 };

    let correctAnswers = 0;
    
    this.quiz.questions.forEach(question => {
      if (this.selectedAnswers[question.id]) {
        // Placeholder: In a real implementation, you'd check against the correct answer
        // correctAnswers += this.selectedAnswers[question.id] === question.correctAnswerId ? 1 : 0;
      }
    });

    const totalQuestions = this.quiz.questions.length;
    const percentage = Math.round((correctAnswers / totalQuestions) * 100);

    return { score: correctAnswers, totalQuestions, percentage };
  }

  private showResults(results: any, completionTime: number): void {
    this.quizContainer.innerHTML = `
      <div class="results-screen">
        <h2>Great job, ${this.playerName}!</h2>
        <div class="results-stats">
          <p>Questions Answered: ${Object.keys(this.selectedAnswers).length} / ${results.totalQuestions}</p>
          <p>Time Taken: ${Math.round(completionTime / 1000)} seconds</p>
        </div>
        <button class="restart-btn" onclick="window.location.reload()">Take Another Quiz</button>
        <button class="restart-btn" onclick="window.location.href='views://menuview/index.html'">Back to Menu</button>
      </div>
    `;
  }
}

// Add fadeOut animation to CSS
const style = document.createElement('style');
style.textContent = `
  @keyframes fadeOut {
    from { opacity: 1; }
    to { opacity: 0; }
  }
`;
document.head.appendChild(style);

// Initialize the quiz manager
const quizManager = new QuizManager();

const electrobun = new Electrobun.Electroview({ rpc });
try {
await electrobun.rpc!.request.loadQuiz({}).then((result) => {
    console.log("result: ", result);
    
    if (result) {
      quizManager.loadQuiz(result);
    } else {
      console.error("Failed to load quiz.");
      window.location.href = 'views://menuview/index.html';
    }
});
} catch (error) {
    console.error("Error loading quiz:", error);
    window.location.href = 'views://menuview/index.html';
}
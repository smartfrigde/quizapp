import Electrobun, { Electroview } from "electrobun/view";
import { RPCType } from "../types/rpc";
import { QuizResults, QuizAttempt, Quiz, QuizAnswerKey, ProcessedAttempt } from "../types/questions";

console.log("Quiz Checker loaded!");

const rpc = Electroview.defineRPC<RPCType>({
  maxRequestTime: 60000,
  handlers: {
    requests: {}
  }
});

class QuizChecker {
  private quizResults: QuizResults | null = null;
  private currentQuiz: Quiz | null = null;
  private currentAnswerKey: QuizAnswerKey | null = null;
  private currentAttempts: QuizAttempt[] = [];
  
  // DOM elements
  private loadSection: HTMLElement;
  private resultsSection: HTMLElement;
  private loadFileBtn: HTMLButtonElement;
  private loadFolderBtn: HTMLButtonElement;
  private backBtn: HTMLButtonElement;
  private exportCsvBtn: HTMLButtonElement;
  private playersTableBody: HTMLElement;
  private playerModal: HTMLElement;
  private closeModalBtn: HTMLButtonElement;

  constructor() {
    this.loadSection = document.getElementById('loadSection')!;
    this.resultsSection = document.getElementById('resultsSection')!;
    this.loadFileBtn = document.getElementById('loadFileBtn') as HTMLButtonElement;
    this.loadFolderBtn = document.getElementById('loadFolderBtn') as HTMLButtonElement;
    this.backBtn = document.getElementById('backBtn') as HTMLButtonElement;
    this.exportCsvBtn = document.getElementById('exportCsvBtn') as HTMLButtonElement;
    this.playersTableBody = document.getElementById('playersTableBody')!;
    this.playerModal = document.getElementById('playerModal')!;
    this.closeModalBtn = document.getElementById('closeModalBtn') as HTMLButtonElement;

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    this.loadFileBtn.addEventListener('click', () => this.loadSingleFile());
    this.loadFolderBtn.addEventListener('click', () => this.loadFolder());
    this.backBtn.addEventListener('click', () => this.showLoadSection());
    this.exportCsvBtn.addEventListener('click', () => this.exportToCsv());
    this.closeModalBtn.addEventListener('click', () => this.closePlayerModal());
    
    // Close modal when clicking overlay
    this.playerModal.addEventListener('click', (e) => {
      if (e.target === this.playerModal) {
        this.closePlayerModal();
      }
    });
  }

  private async loadSingleFile(): Promise<void> {
    try {
      // Load a single attempt file
      const attempt = await rpc.request.loadQuizAnswersFile({});
      await this.processFiles([attempt]);
    } catch (error) {
      console.error('Error loading file:', error);
      alert('Error loading file. Please try again.');
    }
  }

  private async loadFolder(): Promise<void> {
    try {
      // Load all attempt files from folder
      const attempts = await rpc.request.loadQuizAnswersFolder({});
      await this.processFiles(attempts);
    } catch (error) {
      console.error('Error loading folder:', error);
      alert('Error loading folder. Please try again.');
    }
  }

  private async processFiles(attempts: QuizAttempt[]): Promise<void> {
    if (attempts.length === 0) {
      alert('No valid quiz attempts found.');
      return;
    }

    this.currentAttempts = attempts;

    // Load the quiz file
    try {
      this.currentQuiz = await rpc.request.loadQuiz({});
    } catch (error) {
      alert('Please select the quiz file.');
      return;
    }

    // Load the answer key
    try {
      this.currentAnswerKey = await rpc.request.loadAnswerKey({});
    } catch (error) {
      alert('Please select the answer key file.');
      return;
    }

    // Validate that the quiz IDs match
    const quizId = this.currentQuiz.id;
    const answerKeyQuizId = this.currentAnswerKey.quizId;
    const attemptQuizIds = [...new Set(attempts.map(a => a.quizId))];

    if (answerKeyQuizId !== quizId) {
      alert('Answer key does not match the selected quiz.');
      return;
    }

    if (!attemptQuizIds.every(id => id === quizId)) {
      alert('Some quiz attempts do not match the selected quiz.');
      return;
    }

    // Process the results
    const results = await rpc.request.processQuizResults({
      quiz: this.currentQuiz,
      answerKey: this.currentAnswerKey,
      attempts: this.currentAttempts
    });

    this.displayResults(results);
  }

  private displayResults(results: QuizResults): void {
        this.quizResults = results;
        
        // Update quiz info
        document.getElementById('quizTitle')!.textContent = results.quiz.name;
        document.getElementById('quizDescription')!.textContent = results.quiz.description;
        document.getElementById('totalQuestions')!.textContent = `${results.quiz.questions.length} questions`;
        document.getElementById('totalAttempts')!.textContent = `${results.attempts.length} attempts`;
        
        const averageScore = results.attempts.length > 0 
          ? Math.round(results.attempts.reduce((sum, attempt) => sum + attempt.percentage, 0) / results.attempts.length)
          : 0;
        document.getElementById('averageScore')!.textContent = `${averageScore}% average`;

        // Sort attempts by playerNumber if present (those with playerNumber come first, ascending).
        // Fallback: attempts without playerNumber are sorted by playerName.
        const sortedAttempts = [...results.attempts].sort((a, b) => {
            const pa = (a as any).playerNumber;
            const pb = (b as any).playerNumber;

            const hasA = pa !== undefined && pa !== null;
            const hasB = pb !== undefined && pb !== null;

            if (hasA && hasB) {
                return Number(pa) - Number(pb);
            }
            if (hasA && !hasB) return -1;
            if (!hasA && hasB) return 1;

            // both missing -> sort by playerName
            const na = (a.playerName || '').toLowerCase();
            const nb = (b.playerName || '').toLowerCase();
            return na.localeCompare(nb);
        });

        // Populate players table with sorted list
        this.populatePlayersTable(sortedAttempts);
        
        // Generate question analysis (use original results for analytics)
        this.generateQuestionAnalysis(results);
        
        // Show results section
        this.loadSection.style.display = 'none';
        this.resultsSection.style.display = 'block';
  }

  private populatePlayersTable(attempts: ProcessedAttempt[]): void {
    this.playersTableBody.innerHTML = '';
    
    attempts.forEach(attempt => {
      const row = document.createElement('tr');
      
      const percentageClass = this.getPercentageClass(attempt.percentage);
      const completedDate = new Date(attempt.completedAt).toLocaleString();
      const timeFormatted = this.formatTime(attempt.totalTimeSeconds);
      
      row.innerHTML = `
        <td>${attempt.playerName}</td>
        <td class="score-cell">${attempt.score}/${this.quizResults!.quiz.questions.length}</td>
        <td class="${percentageClass}">${attempt.percentage}%</td>
        <td>${timeFormatted}</td>
        <td>${completedDate}</td>
        <td>
          <button class="view-btn" onclick="window.quizChecker.showPlayerDetails('${attempt.id}')">
            View Details
          </button>
        </td>
      `;
      
      this.playersTableBody.appendChild(row);
    });
  }

  private generateQuestionAnalysis(results: QuizResults): void {
    const analysisGrid = document.getElementById('analysisGrid')!;
    analysisGrid.innerHTML = '';
    
    results.quiz.questions.forEach((question, index) => {
      const correctAnswers = results.attempts.filter(attempt => {
        const playerAnswer = attempt.answers.find(a => a.questionId === question.id);
        return playerAnswer && results.answerKey.correctAnswers[question.id] === playerAnswer.selectedAnswerId;
      }).length;
      
      const totalAnswers = results.attempts.length;
      const correctRate = totalAnswers > 0 ? Math.round((correctAnswers / totalAnswers) * 100) : 0;
      const rateClass = this.getRateClass(correctRate);
      
      const questionCard = document.createElement('div');
      questionCard.className = 'question-card';
      questionCard.innerHTML = `
        <div class="question-number">Question ${index + 1}</div>
        <div class="question-text">${question.question}</div>
        <div class="correct-rate ${rateClass}">${correctRate}% Correct</div>
        <div class="question-details">${correctAnswers}/${totalAnswers} players answered correctly</div>
      `;
      
      analysisGrid.appendChild(questionCard);
    });
  }

  public showPlayerDetails(attemptId: string): void {
    const attempt = this.quizResults!.attempts.find(a => a.id === attemptId);
    if (!attempt) return;
    
    // Update modal header
    document.getElementById('modalPlayerName')!.textContent = `${attempt.playerName}'s Results`;
    
    // Update summary stats
    document.getElementById('modalScore')!.textContent = attempt.score.toString();
    document.getElementById('modalPercentage')!.textContent = `${attempt.percentage}%`;
    document.getElementById('modalTime')!.textContent = this.formatTime(attempt.totalTimeSeconds);
    
    // Populate answers review
    const answersReview = document.getElementById('answersReview')!;
    answersReview.innerHTML = '<h4>Answer Review</h4>';
    
    attempt.answers.forEach(playerAnswer => {
      const question = this.quizResults!.quiz.questions.find(q => q.id === playerAnswer.questionId);
      if (!question) return;
      
      const selectedAnswer = question.possibleAnswers.find(a => a.id === playerAnswer.selectedAnswerId);
      const correctAnswerId = this.quizResults!.answerKey.correctAnswers[playerAnswer.questionId];
      const correctAnswer = question.possibleAnswers.find(a => a.id === correctAnswerId);
      const isCorrect = playerAnswer.selectedAnswerId === correctAnswerId;
      
      const answerItem = document.createElement('div');
      answerItem.className = `answer-item ${isCorrect ? 'answer-correct' : 'answer-incorrect'}`;
      
      answerItem.innerHTML = `
        <div class="answer-question">${question.question}</div>
        <div class="answer-choice">
          <span class="answer-icon">${isCorrect ? '✅' : '❌'}</span>
          <span class="answer-text">Selected: ${selectedAnswer?.text || 'No answer'}</span>
        </div>
        ${!isCorrect ? `
          <div class="answer-choice">
            <span class="answer-icon">✓</span>
            <span class="answer-text">Correct: ${correctAnswer?.text}</span>
          </div>
        ` : ''}
      `;
      
      answersReview.appendChild(answerItem);
    });
    
    this.playerModal.style.display = 'flex';
  }

  private closePlayerModal(): void {
    this.playerModal.style.display = 'none';
  }

  private async exportToCsv(): Promise<void> {
    if (!this.quizResults) return;
    
    try {
      await rpc.request.exportQuizResultsToCsv({ results: this.quizResults });
      alert('Results exported successfully!');
    } catch (error) {
      console.error('Error exporting CSV:', error);
      alert('Error exporting results. Please try again.');
    }
  }

  private showLoadSection(): void {
    this.resultsSection.style.display = 'none';
    this.loadSection.style.display = 'block';
    this.quizResults = null;
    this.currentQuiz = null;
    this.currentAnswerKey = null;
    this.currentAttempts = [];
  }

  private getPercentageClass(percentage: number): string {
    if (percentage >= 80) return 'percentage-high';
    if (percentage >= 60) return 'percentage-medium';
    return 'percentage-low';
  }

  private getRateClass(rate: number): string {
    if (rate >= 80) return 'rate-high';
    if (rate >= 60) return 'rate-medium';
    return 'rate-low';
  }

  private formatTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
}

// Initialize the quiz checker and make it globally available
const quizChecker = new QuizChecker();
(window as any).quizChecker = quizChecker;

const electrobun = new Electrobun.Electroview({ rpc });
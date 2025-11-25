import Electrobun, { Electroview } from "electrobun/view";
import { RPCType } from "../types/rpc";
import { Quiz, QuizQuestion, QuizAnswer } from "../types/questions";

const rpc = Electroview.defineRPC<RPCType>({
  maxRequestTime: 60000,
  handlers: {
    requests: {}
  }
});

interface CreateQuestion {
    text: string;
    options: string[];
    correctAnswer: number;
    image: string;
}

class QuizCreator {
    private questions: CreateQuestion[] = [];
    private currentQuestionIndex: number = 0;
    
    // Form elements
    private quizTitle!: HTMLInputElement;
    private quizDescription!: HTMLTextAreaElement;
    private timeLimit!: HTMLInputElement;
    private randomizeQuestions!: HTMLInputElement;
    private questionText!: HTMLTextAreaElement;
    private questionImageFile!: HTMLInputElement;
    private uploadImageBtn!: HTMLButtonElement;
    private imagePreview!: HTMLDivElement;
    private previewImg!: HTMLImageElement;
    private removeImageBtn!: HTMLButtonElement;
    private optionsContainer!: HTMLDivElement;

    // <-- added hidden import file input
    private importFileInput!: HTMLInputElement;
    
    // Navigation elements
    private prevButton!: HTMLButtonElement;
    private nextButton!: HTMLButtonElement;
    private addButton!: HTMLButtonElement;
    
    // UI elements
    private currentQuestionNum!: HTMLElement;
    private totalQuestions!: HTMLElement;
    private questionsPreview!: HTMLDivElement;
    
    // Action buttons
    private backToMenuBtn!: HTMLButtonElement;
    private saveQuizBtn!: HTMLButtonElement;
    private importFromFileBtn!: HTMLButtonElement;

    constructor() {
        this.initializeElements();
        this.setupEventListeners();
        this.initializeFirstQuestion();
    }

    private initializeElements(): void {
        // Form elements
        this.quizTitle = document.getElementById('quizTitle') as HTMLInputElement;
        this.quizDescription = document.getElementById('quizDescription') as HTMLTextAreaElement;
        this.timeLimit = document.getElementById('timeLimit') as HTMLInputElement;
        this.randomizeQuestions = document.getElementById('randomizeQuestions') as HTMLInputElement;
        this.questionText = document.getElementById('questionText') as HTMLTextAreaElement;
        this.questionImageFile = document.getElementById('questionImageFile') as HTMLInputElement;
        this.uploadImageBtn = document.getElementById('uploadImageBtn') as HTMLButtonElement;
        this.imagePreview = document.getElementById('imagePreview') as HTMLDivElement;
        this.previewImg = document.getElementById('previewImg') as HTMLImageElement;
        this.removeImageBtn = document.getElementById('removeImageBtn') as HTMLButtonElement;
        this.optionsContainer = document.getElementById('optionsContainer') as HTMLDivElement;
        
        // create hidden file input for .txt import (added)
        this.importFileInput = document.createElement('input');
        this.importFileInput.type = 'file';
        this.importFileInput.accept = '.txt,.text';
        this.importFileInput.style.display = 'none';
        document.body.appendChild(this.importFileInput);
        
        // Navigation elements
        this.prevButton = document.getElementById('prevQuestion') as HTMLButtonElement;
        this.nextButton = document.getElementById('nextQuestion') as HTMLButtonElement;
        this.addButton = document.getElementById('addQuestion') as HTMLButtonElement;
        
        // UI elements
        this.currentQuestionNum = document.getElementById('currentQuestionNum') as HTMLElement;
        this.totalQuestions = document.getElementById('totalQuestions') as HTMLElement;
        this.questionsPreview = document.getElementById('questionsPreview') as HTMLDivElement;
        
        // Action buttons
        this.backToMenuBtn = document.getElementById('backToMenu') as HTMLButtonElement;
        this.saveQuizBtn = document.getElementById('saveQuiz') as HTMLButtonElement;
        this.importFromFileBtn = document.getElementById('importFromFile') as HTMLButtonElement;
    }

    private setupEventListeners(): void {
        // Navigation
        this.prevButton.addEventListener('click', () => this.previousQuestion());
        this.nextButton.addEventListener('click', () => this.nextQuestion());
        this.addButton.addEventListener('click', () => this.addNewQuestion());
        
        // Form changes
        this.questionText.addEventListener('blur', () => this.saveCurrentQuestion());
        
        // Image upload handlers
        this.uploadImageBtn.addEventListener('click', () => this.triggerImageUpload());
        this.questionImageFile.addEventListener('change', () => this.handleImageUpload());
        this.removeImageBtn.addEventListener('click', () => this.removeImage());
        
        // Quiz settings validation
        this.timeLimit.addEventListener('input', () => this.validateTimeLimit());
        this.timeLimit.addEventListener('blur', () => this.validateTimeLimit());
        
        // Actions
        this.backToMenuBtn.addEventListener('click', () => this.goBackToMenu());
        this.saveQuizBtn.addEventListener('click', () => this.saveQuiz());
        this.importFromFileBtn.addEventListener('click', () => this.importFromFile());

        // wire hidden import input change (added)
        this.importFileInput.addEventListener('change', () => this.handleFileImport());
    }

    private validateTimeLimit(): void {
        // Ensure the time limit is a number between 1 and 180 (minutes).
        const raw = this.timeLimit.value.trim();
        if (!raw) return;

        const minutes = parseInt(raw, 10);
        if (isNaN(minutes)) {
            // Clear invalid input
            this.timeLimit.value = '';
            return;
        }

        const min = 1;
        const max = 180;

        if (minutes < min) {
            this.timeLimit.value = String(min);
        } else if (minutes > max) {
            this.timeLimit.value = String(max);
        }
    }

    private triggerImageUpload(): void {
        this.questionImageFile.click();
    }

    private async handleImageUpload(): Promise<void> {
        const file = this.questionImageFile.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            this.showImageError('Please select a valid image file.');
            return;
        }

        // Validate file size (5MB max)
        const maxSize = 5 * 1024 * 1024; // 5MB in bytes
        if (file.size > maxSize) {
            this.showImageError('Image file must be smaller than 5MB.');
            return;
        }

        try {
            const base64String = await this.convertToBase64(file);
            
            // Save to current question
            const currentQuestion = this.questions[this.currentQuestionIndex];
            currentQuestion.image = base64String;
            
            // Update preview
            this.updateImagePreview(base64String);
            this.showImageSuccess('Image uploaded successfully!');
            
            // Update questions preview to show image indicator
            this.updateQuestionsPreview();
            
        } catch (error) {
            console.error('Error converting image to base64:', error);
            this.showImageError('Failed to process image. Please try again.');
        }
    }

    private convertToBase64(file: File): Promise<string> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                if (typeof reader.result === 'string') {
                    resolve(reader.result);
                } else {
                    reject(new Error('Failed to convert file to base64'));
                }
            };
            reader.onerror = () => reject(reader.error);
            reader.readAsDataURL(file);
        });
    }

    private updateImagePreview(base64String: string): void {
        this.previewImg.src = base64String;
        this.imagePreview.style.display = 'block';
    }

    private removeImage(): void {
        const currentQuestion = this.questions[this.currentQuestionIndex];
        currentQuestion.image = '';
        
        this.imagePreview.style.display = 'none';
        this.previewImg.src = '';
        this.questionImageFile.value = '';
        
        // Clear any error/success messages
        this.clearImageMessages();
        
        // Update questions preview
        this.updateQuestionsPreview();
    }

    private showImageError(message: string): void {
        this.clearImageMessages();
        const errorDiv = document.createElement('div');
        errorDiv.className = 'image-upload-error';
        errorDiv.textContent = message;
        this.imagePreview.parentNode?.appendChild(errorDiv);
        
        // Auto-remove after 5 seconds
        setTimeout(() => errorDiv.remove(), 5000);
    }

    private showImageSuccess(message: string): void {
        this.clearImageMessages();
        const successDiv = document.createElement('div');
        successDiv.className = 'image-upload-success';
        successDiv.textContent = message;
        this.imagePreview.parentNode?.appendChild(successDiv);
        
        // Auto-remove after 3 seconds
        setTimeout(() => successDiv.remove(), 3000);
    }

    private clearImageMessages(): void {
        const container = this.imagePreview.parentNode;
        if (container) {
            const errors = container.querySelectorAll('.image-upload-error, .image-upload-success');
            errors.forEach(el => el.remove());
        }
    }

    private initializeFirstQuestion(): void {
        this.questions = [{
            text: '',
            options: ['', ''], // Start with 2 options minimum
            correctAnswer: 0,
            image: ''
        }];
        
        this.currentQuestionIndex = 0;
        this.loadQuestion(0);
    }

    private loadQuestion(index: number): void {
        if (index < 0 || index >= this.questions.length) return;
        
        // Save current question before switching (but not on initial load)
        if (this.currentQuestionIndex !== index) {
            this.saveCurrentQuestion();
        }
        
        this.currentQuestionIndex = index;
        
        const question = this.questions[index];
        this.questionText.value = question.text;
        
        // Load image if exists
        if (question.image) {
            this.updateImagePreview(question.image);
        } else {
            this.imagePreview.style.display = 'none';
            this.previewImg.src = '';
        }
        
        // Clear file input to prevent confusion
        this.questionImageFile.value = '';
        
        // Always render options container
        this.renderOptionsContainer(question.options, question.correctAnswer);
        
        this.updateUI();
    }

    private renderOptionsContainer(options: string[], correctAnswerIndex: number): void {
        this.optionsContainer.innerHTML = '';
        
        options.forEach((option, index) => {
            const optionDiv = this.createOptionElement(option, index, correctAnswerIndex);
            this.optionsContainer.appendChild(optionDiv);
        });
        
        // Add "Add Option" button if less than 6 options
        if (options.length < 6) {
            const addButton = document.createElement('button');
            addButton.type = 'button';
            addButton.className = 'add-option-btn';
            addButton.innerHTML = '+ Add Option';
            addButton.addEventListener('click', () => this.addOption());
            this.optionsContainer.appendChild(addButton);
        }
    }

    private createOptionElement(optionText: string, index: number, correctAnswerIndex: number): HTMLDivElement {
        const optionDiv = document.createElement('div');
        optionDiv.className = 'option-input';
        optionDiv.dataset.optionIndex = index.toString();
        
        const optionLabels = ['A', 'B', 'C', 'D', 'E', 'F'];
        const label = optionLabels[index] || `${index + 1}`;
        
        // Create elements programmatically for better event handling
        const textInput = document.createElement('input');
        textInput.type = 'text';
        textInput.placeholder = `Option ${label}`;
        textInput.maxLength = 100;
        textInput.value = optionText;
        textInput.addEventListener('blur', () => this.saveCurrentQuestion());
        
        const radioInput = document.createElement('input');
        radioInput.type = 'radio';
        radioInput.name = 'correctAnswer';
        radioInput.value = index.toString();
        radioInput.title = 'Mark as correct answer';
        radioInput.checked = (index === correctAnswerIndex);
        radioInput.addEventListener('change', () => this.saveCurrentQuestion());
        
        optionDiv.appendChild(textInput);
        optionDiv.appendChild(radioInput);
        
        // Add remove button for options beyond the first 2
        if (index >= 2) {
            const removeButton = document.createElement('button');
            removeButton.type = 'button';
            removeButton.className = 'remove-option-btn';
            removeButton.textContent = '×';
            removeButton.title = 'Remove option';
            removeButton.addEventListener('click', () => this.removeOption(index));
            optionDiv.appendChild(removeButton);
        }
        
        return optionDiv;
    }

    public addOption(): void {
        const currentQuestion = this.questions[this.currentQuestionIndex];
        
        if (currentQuestion.options.length >= 6) {
            alert('Maximum of 6 options allowed per question.');
            return;
        }
        
        // Save current state first
        this.saveCurrentQuestion();
        
        // Add new empty option
        currentQuestion.options.push('');
        
        // Re-render options
        this.renderOptionsContainer(currentQuestion.options, currentQuestion.correctAnswer);
        
        // Focus on the new option input
        const newOptionInput = this.optionsContainer.querySelector(`[data-option-index="${currentQuestion.options.length - 1}"] input[type="text"]`) as HTMLInputElement;
        if (newOptionInput) {
            newOptionInput.focus();
        }
    }

    public removeOption(optionIndex: number): void {
        const currentQuestion = this.questions[this.currentQuestionIndex];
        
        if (currentQuestion.options.length <= 2) {
            alert('Minimum of 2 options required per question.');
            return;
        }
        
        // Save current state first
        this.saveCurrentQuestion();
        
        // Remove the option
        currentQuestion.options.splice(optionIndex, 1);
        
        // Adjust correct answer index if needed
        if (currentQuestion.correctAnswer >= optionIndex) {
            if (currentQuestion.correctAnswer === optionIndex) {
                // If we're removing the correct answer, set it to the first option
                currentQuestion.correctAnswer = 0;
            } else if (currentQuestion.correctAnswer > optionIndex) {
                // Shift the correct answer index down
                currentQuestion.correctAnswer--;
            }
        }
        
        // Re-render options
        this.renderOptionsContainer(currentQuestion.options, currentQuestion.correctAnswer);
    }

    private saveCurrentQuestion(): void {
        if (this.currentQuestionIndex < 0 || this.currentQuestionIndex >= this.questions.length) return;
        
        const question = this.questions[this.currentQuestionIndex];
        question.text = this.questionText.value.trim();
        // Note: image is already saved in handleImageUpload()
        
        // Get options from current DOM elements
        const optionInputs = this.optionsContainer.querySelectorAll('.option-input');
        const newOptions: string[] = [];
        let newCorrectAnswer = 0;
        
        optionInputs.forEach((optionDiv, index) => {
            const textInput = optionDiv.querySelector('input[type="text"]') as HTMLInputElement;
            const radioInput = optionDiv.querySelector('input[type="radio"]') as HTMLInputElement;
            
            if (textInput) {
                newOptions[index] = textInput.value.trim();
                if (radioInput && radioInput.checked) {
                    newCorrectAnswer = index;
                }
            }
        });
        
        question.options = newOptions;
        question.correctAnswer = newCorrectAnswer;
        
        this.updateQuestionsPreview();
    }

    private addNewQuestion(): void {
        this.saveCurrentQuestion();
        
        const newQuestion: CreateQuestion = {
            text: '',
            options: ['', ''], // Start with 2 options minimum
            correctAnswer: 0,
            image: ''
        };
        
        this.questions.push(newQuestion);
        this.loadQuestion(this.questions.length - 1);
    }

    private deleteQuestion(index: number): void {
        if (this.questions.length <= 1) {
            alert('You must have at least one question.');
            return;
        }
        
        this.questions.splice(index, 1);
        
        // Adjust current index if necessary
        if (this.currentQuestionIndex >= this.questions.length) {
            this.currentQuestionIndex = this.questions.length - 1;
        }
        
        this.loadQuestion(this.currentQuestionIndex);
    }

    private previousQuestion(): void {
        if (this.currentQuestionIndex > 0) {
            this.loadQuestion(this.currentQuestionIndex - 1);
        }
    }

    private nextQuestion(): void {
        if (this.currentQuestionIndex < this.questions.length - 1) {
            this.loadQuestion(this.currentQuestionIndex + 1);
        }
    }

    private updateUI(): void {
        this.updateNavigationButtons();
        this.updateQuestionCounter();
        this.updateQuestionsPreview();
    }

    private updateNavigationButtons(): void {
        this.prevButton.disabled = (this.currentQuestionIndex === 0);
        this.nextButton.disabled = (this.currentQuestionIndex === this.questions.length - 1);
    }

    private updateQuestionCounter(): void {
        this.currentQuestionNum.textContent = (this.currentQuestionIndex + 1).toString();
        this.totalQuestions.textContent = this.questions.length.toString();
    }

    private updateQuestionsPreview(): void {
        this.questionsPreview.innerHTML = '';
        
        this.questions.forEach((question, index) => {
            const questionItem = document.createElement('div');
            questionItem.className = `question-item ${index === this.currentQuestionIndex ? 'active' : ''} ${question.image ? 'has-image' : ''}`;
            questionItem.dataset.index = index.toString();
            
            const questionNumber = document.createElement('span');
            questionNumber.className = 'question-number';
            questionNumber.textContent = (index + 1).toString();
            
            const questionPreview = document.createElement('span');
            questionPreview.className = 'question-preview';
            questionPreview.textContent = question.text || 'New question...';
            
            const deleteButton = document.createElement('button');
            deleteButton.className = 'delete-question';
            deleteButton.textContent = '×';
            deleteButton.title = 'Delete question';
            deleteButton.addEventListener('click', (e: Event) => {
                e.stopPropagation();
                if (confirm('Are you sure you want to delete this question?')) {
                    this.deleteQuestion(index);
                }
            });
            
            questionItem.appendChild(questionNumber);
            questionItem.appendChild(questionPreview);
            if (this.questions.length > 1) { // Only show delete if more than 1 question
                questionItem.appendChild(deleteButton);
            }
            
            questionItem.addEventListener('click', () => {
                this.loadQuestion(index);
            });
            
            this.questionsPreview.appendChild(questionItem);
        });
    }

    private goBackToMenu(): void {
        if (confirm('Are you sure you want to go back? Any unsaved changes will be lost.')) {
            console.log('Navigating back to menu...');
            window.location.href = 'views://menuview/index.html';
        }
    }

    // replace placeholder import method with real implementation (added)
    private importFromFile(): void {
        const instructions = `Import Quiz from Text File

Format:
- Each question starts with number + dot (e.g. "31. Question text")
- Options start with letter + dot (A. B. C. ...)
- Mark correct option with * either before the letter ("*A.") or at the end of the line ("...*")
- Up to 6 options (A-F)
Click OK to choose a .txt file.`;
        if (confirm(instructions)) {
            this.importFileInput.click();
        }
    }

    private async handleFileImport(): Promise<void> {
        const file = this.importFileInput.files?.[0];
        if (!file) return;

        if (!file.name.toLowerCase().endsWith('.txt') && !file.name.toLowerCase().endsWith('.text')) {
            alert('Please select a .txt file.');
            this.importFileInput.value = '';
            return;
        }

        try {
            const content = await this.readFileContent(file);
            const parsed = this.parseTextQuestions(content);

            if (parsed.length === 0) {
                alert('No valid questions found in the file. Check format and try again.');
                this.importFileInput.value = '';
                return;
            }

            if (!confirm(`Found ${parsed.length} questions. This will replace current quiz. Continue?`)) {
                this.importFileInput.value = '';
                return;
            }

            this.questions = parsed;
            this.currentQuestionIndex = 0;
            this.loadQuestion(0);
            alert(`Imported ${parsed.length} questions.`);
        } catch (err) {
            console.error('Import error', err);
            alert('Failed to import file.');
        } finally {
            this.importFileInput.value = '';
        }
    }

    private readFileContent(file: File): Promise<string> {
        return new Promise((resolve, reject) => {
            const r = new FileReader();
            r.onload = () => {
                if (typeof r.result === 'string') resolve(r.result);
                else reject(new Error('Failed to read file'));
            };
            r.onerror = () => reject(r.error);
            r.readAsText(file, 'utf-8');
        });
    }

    private parseTextQuestions(content: string): CreateQuestion[] {
        const lines = content.split(/\r?\n/);
        const questions: CreateQuestion[] = [];
        let current: Partial<CreateQuestion> | null = null;

        for (let raw of lines) {
            const line = raw.trim();
            if (!line) continue;

            const qMatch = line.match(/^(\d+)\.\s*(.+)$/);
            if (qMatch) {
                if (current && this.isValidQuestion(current)) {
                    // normalize options array to remove gaps
                    current.options = current.options!.map(o => o || '').slice(0, 6);
                    questions.push(current as CreateQuestion);
                }
                current = { text: qMatch[2].trim(), options: [], correctAnswer: 0, image: '' };
                continue;
            }

            // accept leading '*' or '+' (e.g. "*A." or "+D.") and trailing '*' or '+'
            const optMatch = line.match(/^([*+]?)([A-Fa-f])\.\s*(.+)$/);
            if (optMatch && current) {
                const [, mark, letter, rest] = optMatch;
                const idx = letter.toUpperCase().charCodeAt(0) - 65;
                // ensure size
                while (current.options!.length <= idx) current.options!.push('');
                let text = rest.trim();
                let isCorrect = mark === '*' || mark === '+';
                if (text.endsWith('*') || text.endsWith('+')) {
                    text = text.slice(0, -1).trim();
                    isCorrect = true;
                }
                current.options![idx] = text;
                if (isCorrect) current.correctAnswer = idx;
                continue;
            }

            // continuation of question text if current exists
            if (current && !/^[A-Fa-f]\./.test(line) && !/^\d+\./.test(line)) {
                current.text += ' ' + line;
            }
        }

        if (current && this.isValidQuestion(current)) {
            current.options = current.options!.map(o => o || '').slice(0, 6);
            questions.push(current as CreateQuestion);
        }

        return questions;
    }

    private isValidQuestion(q: Partial<CreateQuestion>): boolean {
        if (!q.text || !q.options) return false;
        const filled = q.options.filter(o => o && o.trim()).length;
        return filled >= 2 && q.correctAnswer !== undefined && q.correctAnswer < q.options.length;
    }

    private async saveQuiz(): Promise<Quiz | void> {
        this.saveCurrentQuestion();
        
        // Validate quiz
        if (!this.quizTitle.value.trim()) {
            alert('Please enter a quiz title.');
            this.quizTitle.focus();
            return;
        }
        
        // Validate time limit
        const timeLimitMinutes = parseInt(this.timeLimit.value);
        if (isNaN(timeLimitMinutes) || timeLimitMinutes < 1 || timeLimitMinutes > 180) {
            alert('Please enter a valid time limit between 1 and 180 minutes.');
            this.timeLimit.focus();
            return;
        }
        
        // Check if all questions have text and at least 2 options
        for (let i = 0; i < this.questions.length; i++) {
            const question = this.questions[i];
            if (!question.text.trim()) {
                alert(`Question ${i + 1} is missing text.`);
                this.loadQuestion(i);
                this.questionText.focus();
                return;
            }
            
            const filledOptions = question.options.filter(opt => opt.trim()).length;
            if (filledOptions < 2) {
                alert(`Question ${i + 1} needs at least 2 answer options.`);
                this.loadQuestion(i);
                return;
            }
            
            // Check if correct answer is valid
            if (question.correctAnswer >= filledOptions) {
                alert(`Question ${i + 1} has an invalid correct answer selection.`);
                this.loadQuestion(i);
                return;
            }
        }
        
        // Generate unique ID for the quiz
        const quizId = `quiz-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        // Prepare quiz data in .quiz format
        const quizData: Quiz = {
            id: quizId,
            name: this.quizTitle.value.trim(),
            description: this.quizDescription.value.trim() || "Custom created quiz",
            totalTimeSeconds: timeLimitMinutes * 60, // Convert minutes to seconds
            random: this.randomizeQuestions.checked, // Get checkbox value
            questions: this.questions.map((q, index) => {
                const questionId = `q${index + 1}-${q.text.toLowerCase().replace(/[^a-z0-9]/g, '-').substring(0, 20)}`;
                
                const possibleAnswers: QuizAnswer[] = q.options
                    .filter(opt => opt.trim()) // Only include non-empty options
                    .map((option, optIndex) => ({
                        id: `${questionId}-${String.fromCharCode(97 + optIndex)}`, // q1-a, q1-b, etc.
                        text: option.trim()
                    }));

                const question: QuizQuestion = {
                    id: questionId,
                    question: q.text.trim(),
                    imageBase64: q.image || "", // Use base64 string directly
                    possibleAnswers
                };

                return question;
            })
        };
        
        // Create answer key (separate file for quiz creator)
        const answerKey = {
            quizId: quizId,
            correctAnswers: {} as Record<string, string>,
            version: "1.0",
            createdAt: new Date().toISOString()
        };
        
        // Map correct answers to the answer key
        this.questions.forEach((q, index) => {
            const questionId = `q${index + 1}-${q.text.toLowerCase().replace(/[^a-z0-9]/g, '-').substring(0, 20)}`;
            const correctOptionIndex = q.correctAnswer;
            const filledOptions = q.options.filter(opt => opt.trim());
            if (correctOptionIndex < filledOptions.length) {
                const correctAnswerId = `${questionId}-${String.fromCharCode(97 + correctOptionIndex)}`;
                answerKey.correctAnswers[questionId] = correctAnswerId;
            }
        });
        
        console.log('Quiz data (.quiz format):', JSON.stringify(quizData, null, 2));
        console.log('Answer key (.key format):', JSON.stringify(answerKey, null, 2));
        
        try {
            await rpc.request.saveQuizFiles({quiz: JSON.stringify(quizData), answerKey: JSON.stringify(answerKey)});
            
            const timeDisplay = timeLimitMinutes === 1 ? '1 minute' : `${timeLimitMinutes} minutes`;
            const randomDisplay = this.randomizeQuestions.checked ? 'Yes' : 'No';
            const imageCount = this.questions.filter(q => q.image).length;
            
            alert(`Quiz "${quizData.name}" has been created!\n\nFiles generated:\n- ${quizData.name.replace(/[^a-z0-9]/gi, '_')}.quiz (for students)\n- ${quizData.name.replace(/[^a-z0-9]/gi, '_')}_answers.key (for instructor)\n\nQuestions: ${quizData.questions.length}\nWith images: ${imageCount}\nTime limit: ${timeDisplay}\nRandomize: ${randomDisplay}`);
            
            return quizData;
        } catch (error) {
            console.error('Error saving quiz files:', error);
            alert('Failed to save quiz files. Please try again.');
        }
    }

}

// Declare global interface for window object
declare global {
    interface Window {
        quizCreator: QuizCreator;
    }
}

// Initialize the quiz creator when the page loads
document.addEventListener('DOMContentLoaded', function() {
    const quizCreator = new QuizCreator();
    
    // Make it globally accessible for debugging and remove option functionality
    window.quizCreator = quizCreator;
    
    const electrobun = new Electrobun.Electroview({ rpc });
});


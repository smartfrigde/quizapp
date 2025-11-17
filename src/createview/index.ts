import Electrobun, { Electroview } from "electrobun/view";
import { RPCType } from "../types/rpc";
const rpc = Electroview.defineRPC<RPCType>({
  maxRequestTime: 60000,
  handlers: {
    requests: {}
  }
});
class QuizCreator {
    constructor() {
        this.questions = [];
        this.currentQuestionIndex = 0;
        this.initializeElements();
        this.addEventListeners();
        this.createDefaultQuestion();
        this.updateUI();
    }

    initializeElements() {
        // Form elements
        this.quizTitle = document.getElementById('quizTitle');
        this.quizDescription = document.getElementById('quizDescription');
        this.questionText = document.getElementById('questionText');
        this.questionImage = document.getElementById('questionImage');
        this.optionsContainer = document.getElementById('optionsContainer');
        
        // Navigation elements
        this.prevButton = document.getElementById('prevQuestion');
        this.nextButton = document.getElementById('nextQuestion');
        this.addButton = document.getElementById('addQuestion');
        
        // UI elements
        this.currentQuestionNum = document.getElementById('currentQuestionNum');
        this.totalQuestions = document.getElementById('totalQuestions');
        this.questionsPreview = document.getElementById('questionsPreview');
        
        // Action buttons - renamed to avoid conflicts
        this.backToMenuBtn = document.getElementById('backToMenu');
        this.saveQuizBtn = document.getElementById('saveQuiz');
    }

    addEventListeners() {
        // Navigation
        this.prevButton.addEventListener('click', () => this.previousQuestion());
        this.nextButton.addEventListener('click', () => this.nextQuestion());
        this.addButton.addEventListener('click', () => this.addNewQuestion());
        
        // Form changes
        this.questionText.addEventListener('input', () => this.saveCurrentQuestion());
        this.questionImage.addEventListener('input', () => this.saveCurrentQuestion());
        
        // Option changes
        const optionInputs = this.optionsContainer.querySelectorAll('input[type="text"]');
        const radioInputs = this.optionsContainer.querySelectorAll('input[type="radio"]');
        
        optionInputs.forEach((input, index) => {
            input.addEventListener('input', () => this.saveCurrentQuestion());
        });
        
        radioInputs.forEach((radio) => {
            radio.addEventListener('change', () => this.saveCurrentQuestion());
        });
        
        // Actions - using renamed properties
        this.backToMenuBtn.addEventListener('click', () => this.goBackToMenu());
        this.saveQuizBtn.addEventListener('click', () => this.saveQuiz());
        
        // Auto-save on any input
        document.addEventListener('input', () => this.updateQuestionPreview());
    }

    createDefaultQuestion() {
        const defaultQuestion = {
            text: '',
            options: ['', '', '', ''],
            correctAnswer: 0,
            image: ''
        };
        this.questions = [defaultQuestion];
        this.currentQuestionIndex = 0;
    }

    saveCurrentQuestion() {
        if (this.currentQuestionIndex >= this.questions.length) return;
        
        const question = this.questions[this.currentQuestionIndex];
        question.text = this.questionText.value;
        question.image = this.questionImage.value;
        
        // Save options
        const optionInputs = this.optionsContainer.querySelectorAll('input[type="text"]');
        optionInputs.forEach((input, index) => {
            question.options[index] = input.value;
        });
        
        // Save correct answer
        const selectedRadio = this.optionsContainer.querySelector('input[type="radio"]:checked');
        if (selectedRadio) {
            question.correctAnswer = parseInt(selectedRadio.value);
        }
        
        this.updateQuestionPreview();
    }

    loadQuestion(index) {
        if (index < 0 || index >= this.questions.length) return;
        
        const question = this.questions[index];
        this.questionText.value = question.text;
        this.questionImage.value = question.image || '';
        
        // Load options
        const optionInputs = this.optionsContainer.querySelectorAll('input[type="text"]');
        optionInputs.forEach((input, i) => {
            input.value = question.options[i] || '';
        });
        
        // Load correct answer
        const radioInputs = this.optionsContainer.querySelectorAll('input[type="radio"]');
        radioInputs.forEach((radio, i) => {
            radio.checked = (i === question.correctAnswer);
        });
        
        this.currentQuestionIndex = index;
        this.updateUI();
    }

    addNewQuestion() {
        this.saveCurrentQuestion();
        
        const newQuestion = {
            text: '',
            options: ['', '', '', ''],
            correctAnswer: 0,
            image: ''
        };
        
        this.questions.push(newQuestion);
        this.loadQuestion(this.questions.length - 1);
        this.updateQuestionsPreview();
    }

    deleteQuestion(index) {
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
        this.updateQuestionsPreview();
    }

    previousQuestion() {
        if (this.currentQuestionIndex > 0) {
            this.saveCurrentQuestion();
            this.loadQuestion(this.currentQuestionIndex - 1);
        }
    }

    nextQuestion() {
        if (this.currentQuestionIndex < this.questions.length - 1) {
            this.saveCurrentQuestion();
            this.loadQuestion(this.currentQuestionIndex + 1);
        }
    }

    updateUI() {
        // Update navigation buttons
        this.prevButton.disabled = (this.currentQuestionIndex === 0);
        this.nextButton.disabled = (this.currentQuestionIndex === this.questions.length - 1);
        
        // Update question counter
        this.currentQuestionNum.textContent = this.currentQuestionIndex + 1;
        this.totalQuestions.textContent = this.questions.length;
        
        // Update questions preview
        this.updateQuestionsPreview();
    }

    updateQuestionsPreview() {
        this.questionsPreview.innerHTML = '';
        
        this.questions.forEach((question, index) => {
            const questionItem = document.createElement('div');
            questionItem.className = `question-item ${index === this.currentQuestionIndex ? 'active' : ''}`;
            questionItem.dataset.index = index;
            
            const questionNumber = document.createElement('span');
            questionNumber.className = 'question-number';
            questionNumber.textContent = index + 1;
            
            const questionPreview = document.createElement('span');
            questionPreview.className = 'question-preview';
            questionPreview.textContent = question.text || 'New question...';
            
            const deleteButton = document.createElement('button');
            deleteButton.className = 'delete-question';
            deleteButton.textContent = '×';
            deleteButton.title = 'Delete question';
            deleteButton.addEventListener('click', (e) => {
                e.stopPropagation();
                this.deleteQuestion(index);
            });
            
            questionItem.appendChild(questionNumber);
            questionItem.appendChild(questionPreview);
            questionItem.appendChild(deleteButton);
            
            questionItem.addEventListener('click', () => {
                this.saveCurrentQuestion();
                this.loadQuestion(index);
            });
            
            this.questionsPreview.appendChild(questionItem);
        });
    }

    updateQuestionPreview() {
        const currentItem = this.questionsPreview.querySelector(`[data-index="${this.currentQuestionIndex}"] .question-preview`);
        if (currentItem) {
            currentItem.textContent = this.questionText.value || 'New question...';
        }
    }

    goBackToMenu() {
        if (confirm('Are you sure you want to go back? Any unsaved changes will be lost.')) {
            console.log('Navigating back to menu...');
            window.location.href = 'views://menuview/index.html';
        }
    }

    async saveQuiz() {
        this.saveCurrentQuestion();
        
        // Validate quiz
        if (!this.quizTitle.value.trim()) {
            alert('Please enter a quiz title.');
            this.quizTitle.focus();
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
        }
        
        // Generate unique ID for the quiz
        const quizId = `quiz-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        // Prepare quiz data in .quiz format
        const quizData = {
            id: quizId,
            name: this.quizTitle.value.trim(),
            description: this.quizDescription.value.trim() || "Custom created quiz",
            totalTimeSeconds: 900, // Default 15 minutes
            random: false, // Can be made configurable
            questions: this.questions.map((q, index) => {
                const questionId = `q${index + 1}-${q.text.toLowerCase().replace(/[^a-z0-9]/g, '-').substring(0, 20)}`;
                
                return {
                    id: questionId,
                    question: q.text.trim(),
                    imageBase64: q.image && q.image.trim() ? q.image.trim() : "",
                    possibleAnswers: q.options
                        .filter(opt => opt.trim()) // Only include non-empty options
                        .map((option, optIndex) => ({
                            id: `${questionId}-${String.fromCharCode(97 + optIndex)}`, // q1-a, q1-b, etc.
                            text: option.trim()
                        }))
                };
            })
        };
        
        // Create answer key (separate file for quiz creator)
        const answerKey = {
            quizId: quizId,
            correctAnswers: {},
            version: "1.0",
            createdAt: new Date().toISOString()
        };
        
        // Map correct answers to the answer key
        this.questions.forEach((q, index) => {
            const questionId = `q${index + 1}-${q.text.toLowerCase().replace(/[^a-z0-9]/g, '-').substring(0, 20)}`;
            const correctOptionIndex = q.correctAnswer;
            if (correctOptionIndex < q.options.filter(opt => opt.trim()).length) {
                const correctAnswerId = `${questionId}-${String.fromCharCode(97 + correctOptionIndex)}`;
                answerKey.correctAnswers[questionId] = correctAnswerId;
            }
        });
        
        console.log('Quiz data (.quiz format):', JSON.stringify(quizData, null, 2));
        console.log('Answer key (.json format):', JSON.stringify(answerKey, null, 2));
        
        await rpc.request.saveQuizFiles({quiz: JSON.stringify(quizData), answerKey: JSON.stringify(answerKey)});
        
        alert(`Quiz "${quizData.name}" has been created!\n\nFiles generated:\n- ${quizData.name.replace(/[^a-z0-9]/gi, '_')}.quiz (for students)\n- ${quizData.name.replace(/[^a-z0-9]/gi, '_')}_answers.key (for instructor)\n\nQuestions: ${quizData.questions.length}\nTime limit: ${Math.floor(quizData.totalTimeSeconds/60)} minutes`);
        
        return quizData;
    }
}

// Initialize the quiz creator when the page loads
document.addEventListener('DOMContentLoaded', function() {
    const quizCreator = new QuizCreator();
    
    // Make it globally accessible for debugging
    window.quizCreator = quizCreator;
    const electrobun = new Electrobun.Electroview({ rpc });
});


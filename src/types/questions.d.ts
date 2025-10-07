export interface QuizQuestion {
    id: string; // unique identifier
    question: string;
    possibleAnswers: QuizAnswer[];
    imageBase64: string;
}

export interface QuizAnswer {
    id: string;
    text: string; // text of the chosen answer
}

export interface Quiz {
    questions: QuizQuestion[];
    name: string; // name of the quiz
    description: string; // short description of the quiz
    id: string; // unique identifier
    totalTimeSeconds: number; // total time for the quiz
    random: boolean; // randomizes question order if true
}

// NEW: Separate answer key that only the quiz creator has
export interface QuizAnswerKey {
    quizId: string;
    correctAnswers: { [questionId: string]: string }; // questionId -> correct answerId
    version: string;
    createdAt: string;
}

export interface PlayerAnswer {
    questionId: string;
    selectedAnswerId: string;
    timeSpent?: number; // optional time spent on this question
}

// Player attempt file - doesn't contain correctness info
export interface QuizAttempt {
    id: string; // unique identifier for this attempt
    quizId: string;
    playerName: string;
    answers: PlayerAnswer[];
    totalTimeSeconds: number;
    completedAt: string; // ISO timestamp
    version: string; // format version for compatibility
}

// Processed results after combining attempts with answer key
export interface ProcessedAttempt {
    id: string;
    quizId: string;
    playerName: string;
    answers: PlayerAnswer[];
    totalTimeSeconds: number;
    completedAt: string;
    score: number; // calculated when combined with answer key
    percentage: number; // calculated when combined with answer key
    version: string;
}

export interface QuizResults {
    quiz: Quiz;
    answerKey: QuizAnswerKey;
    attempts: ProcessedAttempt[];
    createdAt: string;
    version: string;
}
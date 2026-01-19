// RPC type definitions for Electron IPC
// These types are kept for reference but are now implemented via Electron IPC

import { Quiz, QuizResults, QuizAttempt, QuizAnswerKey } from "./questions";

export type RPCType = {
  // IPC request types matching Electron IPC handlers
  requests: {
    loadQuiz: {
      params: {};
      response: Quiz;
    };
    saveQuizAnswers: {
      params: { quizId: string; answers: { [questionId: string]: string }; timeTakenSeconds: number; playerName: string; playerNumber?: number };
      response: { success: boolean };
    };
    loadQuizAnswersFile: {
      params: {};
      response: QuizAttempt;
    };
    loadQuizAnswersFolder: {
      params: {};
      response: QuizAttempt[];
    };
    loadAnswerKey: {
      params: {};
      response: QuizAnswerKey;
    };
    processQuizResults: {
      params: { quiz: Quiz; answerKey: QuizAnswerKey; attempts: QuizAttempt[] };
      response: QuizResults;
    };
    exportQuizResultsToCsv: {
      params: { results: QuizResults };
      response: { success: boolean };
    };
    saveQuizFiles: {
      params: { quiz: string; answerKey: string };
      response: { success: boolean };
    };
  };
};

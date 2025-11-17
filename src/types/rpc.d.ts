import { RPCSchema } from "electrobun";
import { Quiz, QuizResults, QuizAttempt, QuizAnswerKey } from "./questions";

export type RPCType = {
  // functions that execute in the main process
  bun: RPCSchema<{
    requests: {
      loadQuiz: {
        params: {};
        response: Quiz;
      };
      saveQuizAnswers: {
        params: { quizId: string; answers: { [questionId: string]: string }; timeTakenSeconds: number; playerName: string };
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
        params: { quiz: Quiz; answerKey: QuizAnswerKey };
        response: { success: boolean };
      }
    };
    messages: {};
  }>;
  // functions that execute in the browser context
  webview: RPCSchema<{
    requests: {};
    messages: {};
  }>;
};

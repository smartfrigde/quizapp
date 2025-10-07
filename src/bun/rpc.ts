import { RPCType } from "../types/rpc";
import { BrowserView } from "electrobun/bun";
import { Utils } from "electrobun/bun";
import { join } from "path";
import { homedir } from "os";
import { QuizResults, QuizAttempt, Quiz, QuizAnswerKey, ProcessedAttempt, PlayerAnswer } from "../types/questions";

export const webviewRPC = BrowserView.defineRPC<RPCType>({
  maxRequestTime: 5000,
  handlers: {
    requests: {
      loadQuiz: async () => {
        const chosenPaths = await Utils.openFileDialog({
          startingFolder: join(homedir(), "Desktop"),
          allowedFileTypes: "quiz",
          canChooseFiles: true,
          canChooseDirectory: false,
          allowsMultipleSelection: false,
        });

        console.log("chosen paths", chosenPaths);
        if (chosenPaths.length === 0) {
          throw new Error("No file chosen");
        }
        const filePath = chosenPaths[0];
        const fileContent = await Bun.file(filePath).json();
        return fileContent;
      },

      saveQuizAnswers: async ({ quizId, answers, timeTakenSeconds, playerName }) => {
        // Create a QuizAttempt object (without correctness info)
        const attempt: QuizAttempt = {
          id: `attempt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          quizId,
          playerName,
          answers: Object.entries(answers).map(([questionId, selectedAnswerId]) => ({
            questionId,
            selectedAnswerId,
          })),
          totalTimeSeconds: timeTakenSeconds,
          completedAt: new Date().toISOString(),
          version: "1.0"
        };

        const savePath = join(homedir(), "Desktop", `${quizId}_${playerName}_${Date.now()}_attempt.json`);
        await Bun.write(savePath, JSON.stringify(attempt, null, 2));
        return { success: true };
      },

      loadQuizAnswersFile: async () => {
        const chosenPaths = await Utils.openFileDialog({
          startingFolder: join(homedir(), "Desktop"),
          allowedFileTypes: "json",
          canChooseFiles: true,
          canChooseDirectory: false,
          allowsMultipleSelection: false,
        });

        if (chosenPaths.length === 0) {
          throw new Error("No file chosen");
        }

        const filePath = chosenPaths[0];
        const attempt = await Bun.file(filePath).json() as QuizAttempt;
        return attempt;
      },

      loadQuizAnswersFolder: async () => {
        const chosenPaths = await Utils.openFileDialog({
          startingFolder: join(homedir(), "Desktop"),
          allowedFileTypes: "",
          canChooseFiles: false,
          canChooseDirectory: true,
          allowsMultipleSelection: false,
        });

        if (chosenPaths.length === 0) {
          throw new Error("No folder chosen");
        }

        const folderPath = chosenPaths[0];
        const files = await Array.fromAsync(new Bun.Glob("*_attempt.json").scan(folderPath));
        
        const attempts: QuizAttempt[] = [];

        for (const file of files) {
          try {
            const filePath = join(folderPath, file);
            const data = await Bun.file(filePath).json();
            
            // Validate it's a QuizAttempt
            if (data.quizId && data.playerName && data.answers) {
              attempts.push(data as QuizAttempt);
            }
          } catch (error) {
            console.warn(`Skipping invalid file: ${file}`);
          }
        }

        return attempts;
      },

      loadAnswerKey: async () => {
        const chosenPaths = await Utils.openFileDialog({
          startingFolder: join(homedir(), "Desktop"),
          allowedFileTypes: "json",
          canChooseFiles: true,
          canChooseDirectory: false,
          allowsMultipleSelection: false,
        });

        if (chosenPaths.length === 0) {
          throw new Error("No answer key file chosen");
        }

        const filePath = chosenPaths[0];
        const answerKey = await Bun.file(filePath).json() as QuizAnswerKey;
        return answerKey;
      },

      processQuizResults: async ({ quiz, answerKey, attempts }) => {
        // Process attempts by comparing with answer key
        const processedAttempts: ProcessedAttempt[] = attempts.map(attempt => {
          let score = 0;
          const processedAnswers: PlayerAnswer[] = attempt.answers.map(playerAnswer => {
            const isCorrect = answerKey.correctAnswers[playerAnswer.questionId] === playerAnswer.selectedAnswerId;
            if (isCorrect) score++;
            return playerAnswer;
          });

          const percentage = Math.round((score / quiz.questions.length) * 100);

          return {
            ...attempt,
            answers: processedAnswers,
            score,
            percentage
          };
        });

        const results: QuizResults = {
          quiz,
          answerKey,
          attempts: processedAttempts,
          createdAt: new Date().toISOString(),
          version: "1.0"
        };

        return results;
      },

      exportQuizResultsToCsv: async ({ results }) => {
        const csvData = [
          // Header row
          ['Player Name', 'Score', 'Percentage', 'Time Taken (seconds)', 'Completed At']
        ];

        // Data rows
        results.attempts.forEach(attempt => {
          csvData.push([
            attempt.playerName,
            `${attempt.score}/${results.quiz.questions.length}`,
            `${attempt.percentage}%`,
            attempt.totalTimeSeconds.toString(),
            attempt.completedAt
          ]);
        });

        // Convert to CSV string
        const csvContent = csvData.map(row => 
          row.map(cell => `"${cell}"`).join(',')
        ).join('\n');

        const savePath = join(homedir(), "Desktop", `quiz_results_${Date.now()}.csv`);
        await Bun.write(savePath, csvContent);

        return { success: true };
      },
    },

    messages: {},
  },
});
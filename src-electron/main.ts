import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import * as path from 'path';
import * as fs from 'fs/promises';
import { homedir } from 'os';
import { Quiz, QuizAttempt, QuizAnswerKey, QuizResults, ProcessedAttempt, PlayerAnswer } from '../src/types/questions';

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    title: 'EduQuiz',
    width: 800,
    height: 800,
    x: 200,
    y: 200,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // Load menuview in development or production
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173/menuview/index.html');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/src/menuview/index.html'));
  }
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC Handlers
ipcMain.handle('loadQuiz', async () => {
  const result = await dialog.showOpenDialog(mainWindow!, {
    defaultPath: path.join(homedir(), 'Desktop'),
    filters: [
      { name: 'Quiz Files', extensions: ['quiz'] },
      { name: 'All Files', extensions: ['*'] },
    ],
    properties: ['openFile'],
  });

  if (result.canceled || result.filePaths.length === 0) {
    throw new Error('No file chosen');
  }

  const filePath = result.filePaths[0];
  const fileContent = await fs.readFile(filePath, 'utf-8');
  return JSON.parse(fileContent);
});

ipcMain.handle('saveQuizAnswers', async (_, { quizId, answers, timeTakenSeconds, playerName, playerNumber }: {
  quizId: string;
  answers: { [questionId: string]: string };
  timeTakenSeconds: number;
  playerName: string;
  playerNumber?: number;
}) => {
  const attempt: QuizAttempt = {
    id: `attempt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    quizId,
    playerName,
    playerNumber,
    answers: Object.entries(answers).map(([questionId, selectedAnswerId]) => ({
      questionId,
      selectedAnswerId: selectedAnswerId as string,
    })),
    totalTimeSeconds: timeTakenSeconds,
    completedAt: new Date().toISOString(),
    version: '1.0',
  };

  const savePath = path.join(homedir(), 'Desktop', `${quizId}_${playerName}_${Date.now()}_attempt.json`);
  await fs.writeFile(savePath, JSON.stringify(attempt, null, 2));
  return { success: true };
});

ipcMain.handle('loadQuizAnswersFile', async () => {
  const result = await dialog.showOpenDialog(mainWindow!, {
    defaultPath: path.join(homedir(), 'Desktop'),
    filters: [
      { name: 'JSON Files', extensions: ['json'] },
      { name: 'All Files', extensions: ['*'] },
    ],
    properties: ['openFile'],
  });

  if (result.canceled || result.filePaths.length === 0) {
    throw new Error('No file chosen');
  }

  const filePath = result.filePaths[0];
  const fileContent = await fs.readFile(filePath, 'utf-8');
  return JSON.parse(fileContent) as QuizAttempt;
});

ipcMain.handle('loadQuizAnswersFolder', async () => {
  const result = await dialog.showOpenDialog(mainWindow!, {
    defaultPath: path.join(homedir(), 'Desktop'),
    properties: ['openDirectory'],
  });

  if (result.canceled || result.filePaths.length === 0) {
    throw new Error('No folder chosen');
  }

  const folderPath = result.filePaths[0];
  const files = await fs.readdir(folderPath);
  const attempts: QuizAttempt[] = [];

  for (const file of files) {
    if (file.endsWith('_attempt.json')) {
      try {
        const filePath = path.join(folderPath, file);
        const data = await fs.readFile(filePath, 'utf-8');
        const attempt = JSON.parse(data);

        if (attempt.quizId && attempt.playerName && attempt.answers) {
          attempts.push(attempt as QuizAttempt);
        }
      } catch (error) {
        console.warn(`Skipping invalid file: ${file}`);
      }
    }
  }

  return attempts;
});

ipcMain.handle('loadAnswerKey', async () => {
  const result = await dialog.showOpenDialog(mainWindow!, {
    defaultPath: path.join(homedir(), 'Desktop'),
    filters: [
      { name: 'JSON Files', extensions: ['json'] },
      { name: 'All Files', extensions: ['*'] },
    ],
    properties: ['openFile'],
  });

  if (result.canceled || result.filePaths.length === 0) {
    throw new Error('No answer key file chosen');
  }

  const filePath = result.filePaths[0];
  const fileContent = await fs.readFile(filePath, 'utf-8');
  return JSON.parse(fileContent) as QuizAnswerKey;
});

ipcMain.handle('processQuizResults', async (_, { quiz, answerKey, attempts }) => {
  const processedAttempts: ProcessedAttempt[] = attempts.map((attempt: QuizAttempt) => {
    let score = 0;
    const processedAnswers: PlayerAnswer[] = attempt.answers.map((playerAnswer) => {
      const isCorrect = answerKey.correctAnswers[playerAnswer.questionId] === playerAnswer.selectedAnswerId;
      if (isCorrect) score++;
      return playerAnswer;
    });

    const percentage = Math.round((score / quiz.questions.length) * 100);

    return {
      ...attempt,
      answers: processedAnswers,
      score,
      percentage,
    };
  });

  const results: QuizResults = {
    quiz,
    answerKey,
    attempts: processedAttempts,
    createdAt: new Date().toISOString(),
    version: '1.0',
  };

  return results;
});

ipcMain.handle('exportQuizResultsToCsv', async (_, { results }) => {
  const csvData = [
    ['Player Name', 'Score', 'Percentage', 'Time Taken (seconds)', 'Completed At'],
  ];

  results.attempts.forEach((attempt: ProcessedAttempt) => {
    csvData.push([
      attempt.playerName,
      `${attempt.score}/${results.quiz.questions.length}`,
      `${attempt.percentage}%`,
      attempt.totalTimeSeconds.toString(),
      attempt.completedAt,
    ]);
  });

  const csvContent = csvData.map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n');

  const savePath = path.join(homedir(), 'Desktop', `quiz_results_${Date.now()}.csv`);
  await fs.writeFile(savePath, csvContent);

  return { success: true };
});

ipcMain.handle('saveQuizFiles', async (_, { quiz, answerKey }) => {
  const result = await dialog.showOpenDialog(mainWindow!, {
    defaultPath: path.join(homedir(), 'Desktop'),
    filters: [
      { name: 'JSON Files', extensions: ['json'] },
      { name: 'All Files', extensions: ['*'] },
    ],
    properties: ['openDirectory'],
  });

  if (result.canceled || result.filePaths.length === 0) {
    throw new Error('No folder chosen for saving quiz');
  }

  const chosenPath = result.filePaths[0];
  const parsedQuiz: Quiz = typeof quiz === 'string' ? JSON.parse(quiz) : quiz;
  const parsedAnswerKey: QuizAnswerKey = typeof answerKey === 'string' ? JSON.parse(answerKey) : answerKey;

  await fs.writeFile(
    path.join(chosenPath, `${parsedQuiz.name.replace(/[^a-z0-9]/gi, '_')}.quiz`),
    JSON.stringify(parsedQuiz, null, 2)
  );
  await fs.writeFile(
    path.join(chosenPath, `${parsedQuiz.name.replace(/[^a-z0-9]/gi, '_')}_answers.json`),
    JSON.stringify(parsedAnswerKey, null, 2)
  );

  return { success: true };
});

// Handle navigation between views
ipcMain.handle('navigate', async (_, viewName: string) => {
  if (!mainWindow) return;

  const viewPath = process.env.NODE_ENV === 'development'
    ? `http://localhost:5173/${viewName}/index.html`
    : path.join(__dirname, `../dist/src/${viewName}/index.html`);

  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL(viewPath);
  } else {
    mainWindow.loadFile(viewPath);
  }
});

import { contextBridge, ipcRenderer } from 'electron';

// Expose IPC methods to renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  // RPC-like interface for IPC calls
  request: {
    loadQuiz: () => ipcRenderer.invoke('loadQuiz'),
    saveQuizAnswers: (params: { quizId: string; answers: { [questionId: string]: string }; timeTakenSeconds: number; playerName: string; playerNumber?: number }) =>
      ipcRenderer.invoke('saveQuizAnswers', params),
    loadQuizAnswersFile: () => ipcRenderer.invoke('loadQuizAnswersFile'),
    loadQuizAnswersFolder: () => ipcRenderer.invoke('loadQuizAnswersFolder'),
    loadAnswerKey: () => ipcRenderer.invoke('loadAnswerKey'),
    processQuizResults: (params: { quiz: any; answerKey: any; attempts: any[] }) =>
      ipcRenderer.invoke('processQuizResults', params),
    exportQuizResultsToCsv: (params: { results: any }) =>
      ipcRenderer.invoke('exportQuizResultsToCsv', params),
    saveQuizFiles: (params: { quiz: string; answerKey: string }) =>
      ipcRenderer.invoke('saveQuizFiles', params),
  },
  navigate: (viewName: string) => ipcRenderer.invoke('navigate', viewName),
});

// Type declaration for window.electronAPI
declare global {
  interface Window {
    electronAPI: {
      request: {
        loadQuiz: () => Promise<any>;
        saveQuizAnswers: (params: { quizId: string; answers: { [questionId: string]: string }; timeTakenSeconds: number; playerName: string; playerNumber?: number }) => Promise<{ success: boolean }>;
        loadQuizAnswersFile: () => Promise<any>;
        loadQuizAnswersFolder: () => Promise<any[]>;
        loadAnswerKey: () => Promise<any>;
        processQuizResults: (params: { quiz: any; answerKey: any; attempts: any[] }) => Promise<any>;
        exportQuizResultsToCsv: (params: { results: any }) => Promise<{ success: boolean }>;
        saveQuizFiles: (params: { quiz: string; answerKey: string }) => Promise<{ success: boolean }>;
      };
      navigate: (viewName: string) => Promise<void>;
    };
  }
}

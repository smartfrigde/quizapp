import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Card,
  CardContent,
  CardActionArea,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  AppBar,
  Toolbar,
  IconButton,
  Chip,
  Grid,
  Alert,
  Avatar,
  Divider,
} from '@mui/material';
import { ArrowBack, FileDownload, Close, Visibility, Assessment } from '@mui/icons-material';
import { QuizResults, QuizAttempt, Quiz, QuizAnswerKey, ProcessedAttempt } from '../types/questions';

export const CheckView: React.FC = () => {
  const [quizResults, setQuizResults] = useState<QuizResults | null>(null);
  const [showLoadSection, setShowLoadSection] = useState(true);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);

  const navigateToMenu = async () => {
    if (window.electronAPI) {
      await window.electronAPI.navigate('menuview');
    } else {
      window.location.href = '../menuview/index.html';
    }
  };

  const loadSingleFile = async () => {
    try {
      if (!window.electronAPI) {
        throw new Error('Electron API not available');
      }
      const attempt = await window.electronAPI.request.loadQuizAnswersFile();
      await processFiles([attempt]);
    } catch (error) {
      console.error('Error loading file:', error);
      alert('Error loading file. Please try again.');
    }
  };

  const loadFolder = async () => {
    try {
      if (!window.electronAPI) {
        throw new Error('Electron API not available');
      }
      const attempts = await window.electronAPI.request.loadQuizAnswersFolder();
      await processFiles(attempts);
    } catch (error) {
      console.error('Error loading folder:', error);
      alert('Error loading folder. Please try again.');
    }
  };

  const processFiles = async (attempts: QuizAttempt[]) => {
    if (attempts.length === 0) {
      alert('No valid quiz attempts found.');
      return;
    }

    let currentQuiz: Quiz;
    let currentAnswerKey: QuizAnswerKey;

    try {
      if (!window.electronAPI) {
        throw new Error('Electron API not available');
      }
      currentQuiz = await window.electronAPI.request.loadQuiz();
    } catch (error) {
      alert('Please select the quiz file.');
      return;
    }

    try {
      if (!window.electronAPI) {
        throw new Error('Electron API not available');
      }
      currentAnswerKey = await window.electronAPI.request.loadAnswerKey();
    } catch (error) {
      alert('Please select the answer key file.');
      return;
    }

    const quizId = currentQuiz.id;
    const answerKeyQuizId = currentAnswerKey.quizId;
    const attemptQuizIds = [...new Set(attempts.map((a) => a.quizId))];

    if (answerKeyQuizId !== quizId) {
      alert('Answer key does not match the selected quiz.');
      return;
    }

    if (!attemptQuizIds.every((id) => id === quizId)) {
      alert('Some quiz attempts do not match the selected quiz.');
      return;
    }

    try {
      if (!window.electronAPI) {
        throw new Error('Electron API not available');
      }
      const results = await window.electronAPI.request.processQuizResults({
        quiz: currentQuiz,
        answerKey: currentAnswerKey,
        attempts: attempts,
      });

      displayResults(results);
    } catch (error) {
      console.error('Error processing results:', error);
      alert('Error processing results. Please try again.');
    }
  };

  const displayResults = (results: QuizResults) => {
    setQuizResults(results);
    setShowLoadSection(false);
  };

  const showLoadSectionView = () => {
    setShowLoadSection(true);
    setQuizResults(null);
    setSelectedPlayerId(null);
  };

  const exportToCsv = async () => {
    if (!quizResults) return;

    try {
      if (!window.electronAPI) {
        throw new Error('Electron API not available');
      }
      await window.electronAPI.request.exportQuizResultsToCsv({ results: quizResults });
      alert('Results exported successfully!');
    } catch (error) {
      console.error('Error exporting CSV:', error);
      alert('Error exporting results. Please try again.');
    }
  };

  const showPlayerDetails = (attemptId: string) => {
    setSelectedPlayerId(attemptId);
  };

  const closePlayerModal = () => {
    setSelectedPlayerId(null);
  };

  const getPercentageColor = (percentage: number): 'success' | 'warning' | 'error' => {
    if (percentage >= 80) return 'success';
    if (percentage >= 60) return 'warning';
    return 'error';
  };

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (showLoadSection) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
        <AppBar position="static" elevation={2}>
          <Toolbar sx={{ px: { xs: 2, sm: 3 } }}>
            <IconButton edge="start" color="inherit" onClick={navigateToMenu} sx={{ mr: 2 }}>
              <ArrowBack />
            </IconButton>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 600 }}>
              Quiz Results Checker
            </Typography>
          </Toolbar>
        </AppBar>

        <Container maxWidth="sm" sx={{ py: { xs: 4, sm: 6 } }}>
          <Box sx={{ textAlign: 'center', mb: 5 }}>
            <Avatar
              sx={{
                width: 80,
                height: 80,
                mx: 'auto',
                mb: 3,
                background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
              }}
            >
              <Assessment sx={{ fontSize: 40 }} />
            </Avatar>
            <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 600 }}>
              Quiz Results Checker
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
              Review and analyze quiz results from multiple players
            </Typography>
          </Box>

          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Card sx={{ border: '1px solid rgba(0, 0, 0, 0.12)' }}>
                <CardActionArea onClick={loadSingleFile}>
                  <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 3, p: 3 }}>
                    <Avatar sx={{ bgcolor: 'primary.main', width: 56, height: 56, border: '2px solid rgba(255, 255, 255, 0.3)' }}>
                      <Typography sx={{ fontSize: 28 }}>📄</Typography>
                    </Avatar>
                    <Box sx={{ flex: 1, textAlign: 'left' }}>
                      <Typography variant="h6" component="h3" gutterBottom sx={{ fontWeight: 600 }}>
                        Load Single File
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Load answers from a single JSON file
                      </Typography>
                    </Box>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>

            <Grid item xs={12}>
              <Card sx={{ border: '1px solid rgba(0, 0, 0, 0.12)' }}>
                <CardActionArea onClick={loadFolder}>
                  <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 3, p: 3 }}>
                    <Avatar sx={{ bgcolor: 'secondary.main', width: 56, height: 56, border: '2px solid rgba(255, 255, 255, 0.3)' }}>
                      <Typography sx={{ fontSize: 28 }}>📁</Typography>
                    </Avatar>
                    <Box sx={{ flex: 1, textAlign: 'left' }}>
                      <Typography variant="h6" component="h3" gutterBottom sx={{ fontWeight: 600 }}>
                        Load Folder
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Load all answer files from a folder
                      </Typography>
                    </Box>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          </Grid>
        </Container>
      </Box>
    );
  }

  if (!quizResults) return null;

  const sortedAttempts = [...quizResults.attempts].sort((a, b) => {
    const pa = (a as any).playerNumber;
    const pb = (b as any).playerNumber;

    const hasA = pa !== undefined && pa !== null;
    const hasB = pb !== undefined && pb !== null;

    if (hasA && hasB) {
      return Number(pa) - Number(pb);
    }
    if (hasA && !hasB) return -1;
    if (!hasA && hasB) return 1;

    const na = (a.playerName || '').toLowerCase();
    const nb = (b.playerName || '').toLowerCase();
    return na.localeCompare(nb);
  });

  const averageScore =
    quizResults.attempts.length > 0
      ? Math.round(quizResults.attempts.reduce((sum, attempt) => sum + attempt.percentage, 0) / quizResults.attempts.length)
      : 0;

  const selectedAttempt = selectedPlayerId ? quizResults.attempts.find((a) => a.id === selectedPlayerId) : null;

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar position="static" elevation={2}>
        <Toolbar sx={{ px: { xs: 2, sm: 3 } }}>
          <IconButton edge="start" color="inherit" onClick={showLoadSectionView} sx={{ mr: 2 }}>
            <ArrowBack />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 600 }}>
            {quizResults.quiz.name}
          </Typography>
          <Button color="inherit" startIcon={<FileDownload />} onClick={exportToCsv} sx={{ fontWeight: 500 }}>
            Export CSV
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ py: { xs: 2, sm: 3 } }}>
        <Card sx={{ mb: 3, border: '1px solid rgba(0, 0, 0, 0.12)' }}>
          <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
            <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 600, mb: 1 }}>
              {quizResults.quiz.name}
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              {quizResults.quiz.description}
            </Typography>
            <Divider sx={{ my: 2 }} />
            <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
              <Chip label={`${quizResults.quiz.questions.length} questions`} size="medium" />
              <Chip label={`${quizResults.attempts.length} attempts`} size="medium" />
              <Chip label={`${averageScore}% average`} size="medium" color="primary" />
            </Box>
          </CardContent>
        </Card>

        <Card sx={{ mb: 3, border: '1px solid rgba(0, 0, 0, 0.12)' }}>
          <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
              Player Results
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Player Name</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>Score</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>Percentage</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>Time Taken</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Completed At</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {sortedAttempts.map((attempt) => (
                    <TableRow key={attempt.id} hover>
                      <TableCell sx={{ fontWeight: 500 }}>{attempt.playerName}</TableCell>
                      <TableCell align="right">
                        {attempt.score}/{quizResults.quiz.questions.length}
                      </TableCell>
                      <TableCell align="right">
                        <Chip label={`${attempt.percentage}%`} size="small" color={getPercentageColor(attempt.percentage)} />
                      </TableCell>
                      <TableCell align="right">{formatTime(attempt.totalTimeSeconds)}</TableCell>
                      <TableCell>{new Date(attempt.completedAt).toLocaleString()}</TableCell>
                      <TableCell align="right">
                        <Button size="small" startIcon={<Visibility />} onClick={() => showPlayerDetails(attempt.id)}>
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>

        <Card sx={{ border: '1px solid rgba(0, 0, 0, 0.12)' }}>
          <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
              Question Analysis
            </Typography>
            <Grid container spacing={2}>
              {quizResults.quiz.questions.map((question, index) => {
                const correctAnswers = quizResults.attempts.filter((attempt) => {
                  const playerAnswer = attempt.answers.find((a) => a.questionId === question.id);
                  return (
                    playerAnswer &&
                    quizResults.answerKey.correctAnswers[question.id] === playerAnswer.selectedAnswerId
                  );
                }).length;

                const totalAnswers = quizResults.attempts.length;
                const correctRate = totalAnswers > 0 ? Math.round((correctAnswers / totalAnswers) * 100) : 0;

                return (
                  <Grid item xs={12} sm={6} md={4} key={question.id}>
                    <Card variant="outlined" sx={{ height: '100%', border: '1px solid rgba(0, 0, 0, 0.12)' }}>
                      <CardContent>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ fontWeight: 600 }}>
                          Question {index + 1}
                        </Typography>
                        <Typography variant="body2" gutterBottom sx={{ mb: 2, minHeight: 40 }}>
                          {question.question}
                        </Typography>
                        <Box sx={{ mt: 2 }}>
                          <Chip label={`${correctRate}% Correct`} size="small" color={getPercentageColor(correctRate)} />
                        </Box>
                        <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1.5 }}>
                          {correctAnswers}/{totalAnswers} players answered correctly
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          </CardContent>
        </Card>
      </Container>

      <Dialog open={!!selectedAttempt} onClose={closePlayerModal} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {selectedAttempt?.playerName}'s Results
            </Typography>
            <IconButton onClick={closePlayerModal} size="small">
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedAttempt && (
            <Box>
              <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
                <Chip label={`${selectedAttempt.score} Correct`} color="primary" size="medium" />
                <Chip label={`${selectedAttempt.percentage}%`} color={getPercentageColor(selectedAttempt.percentage)} size="medium" />
                <Chip label={formatTime(selectedAttempt.totalTimeSeconds)} size="medium" />
              </Box>

              <Divider sx={{ my: 3 }} />

              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                Answer Review
              </Typography>
              {selectedAttempt.answers.map((playerAnswer) => {
                const question = quizResults.quiz.questions.find((q) => q.id === playerAnswer.questionId);
                if (!question) return null;

                const selectedAnswer = question.possibleAnswers.find((a) => a.id === playerAnswer.selectedAnswerId);
                const correctAnswerId = quizResults.answerKey.correctAnswers[question.id];
                const correctAnswer = question.possibleAnswers.find((a) => a.id === correctAnswerId);
                const isCorrect = playerAnswer.selectedAnswerId === correctAnswerId;

                return (
                  <Alert
                    key={playerAnswer.questionId}
                    severity={isCorrect ? 'success' : 'error'}
                    sx={{ mb: 2 }}
                  >
                    <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
                      {question.question}
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 0.5 }}>
                      Selected: {selectedAnswer?.text || 'No answer'}
                    </Typography>
                    {!isCorrect && (
                      <Typography variant="body2" sx={{ mt: 0.5, fontWeight: 500 }}>
                        Correct: {correctAnswer?.text}
                      </Typography>
                    )}
                  </Alert>
                );
              })}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={closePlayerModal} variant="contained" fullWidth>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

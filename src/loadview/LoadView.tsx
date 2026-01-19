import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
  Card,
  CardContent,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  IconButton,
  AppBar,
  Toolbar,
  Chip,
  Avatar,
  Paper,
} from '@mui/material';
import { Close, ArrowBack, ArrowForward, ZoomIn, Person, Timer } from '@mui/icons-material';
import { Quiz, QuizQuestion } from '../types/questions';

export const LoadView: React.FC = () => {
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<{ [questionId: string]: string }>({});
  const [startTime, setStartTime] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [playerName, setPlayerName] = useState('');
  const [playerNumber, setPlayerNumber] = useState<number | undefined>(undefined);
  const [nameError, setNameError] = useState('');
  const [showNameModal, setShowNameModal] = useState(true);
  const [showResults, setShowResults] = useState(false);
  const [completionTime, setCompletionTime] = useState(0);
  const [enlargedImage, setEnlargedImage] = useState<string | null>(null);

  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadQuiz();
  }, []);

  useEffect(() => {
    if (quiz && !showNameModal && quiz.totalTimeSeconds > 0) {
      startTimer();
      return () => {
        if (timerIntervalRef.current) {
          clearInterval(timerIntervalRef.current);
        }
      };
    }
  }, [quiz, showNameModal]);

  const loadQuiz = async () => {
    try {
      if (!window.electronAPI) {
        throw new Error('Electron API not available');
      }
      const result = await window.electronAPI.request.loadQuiz();
      if (result) {
        setQuiz(result);
      } else {
        navigateToMenu();
      }
    } catch (error) {
      console.error('Error loading quiz:', error);
      navigateToMenu();
    }
  };

  const navigateToMenu = async () => {
    if (window.electronAPI) {
      await window.electronAPI.navigate('menuview');
    } else {
      window.location.href = '../menuview/index.html';
    }
  };

  const validateName = (name: string): boolean => {
    const trimmed = name.trim();

    if (trimmed.length < 2) {
      setNameError('Name must be at least 2 characters long');
      return false;
    }

    if (trimmed.length > 50) {
      setNameError('Name must be less than 50 characters');
      return false;
    }

    if (!/^[a-zA-Z\s\-'\.]+$/.test(trimmed)) {
      setNameError('Name can only contain letters, spaces, hyphens, apostrophes, and periods');
      return false;
    }

    setNameError('');
    return true;
  };

  const validatePlayerNumber = (value: string): boolean => {
    const trimmed = value.trim();
    if (!trimmed) {
      setPlayerNumber(undefined);
      return true;
    }
    const n = parseInt(trimmed, 10);
    if (isNaN(n) || n < 1 || n > 99999) {
      alert('Player number must be a positive integer (1-99999) or left empty.');
      return false;
    }
    setPlayerNumber(n);
    return true;
  };

  const handleStartQuiz = () => {
    const name = playerName.trim();
    if (!validateName(name)) return;

    const playerNumInput = document.getElementById('playerNumber') as HTMLInputElement;
    if (playerNumInput && !validatePlayerNumber(playerNumInput.value)) return;

    setPlayerName(name);
    setShowNameModal(false);

    if (quiz) {
      startQuiz();
    }
  };

  const startQuiz = () => {
    if (!quiz) return;

    setCurrentQuestionIndex(0);
    setSelectedAnswers({});
    setStartTime(Date.now());
    setTimeRemaining(quiz.totalTimeSeconds);

    if (quiz.random) {
      const shuffled = [...quiz.questions].sort(() => Math.random() - 0.5);
      setQuiz({ ...quiz, questions: shuffled });
    }
  };

  const startTimer = () => {
    if (!quiz || quiz.totalTimeSeconds === 0) return;

    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }

    timerIntervalRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          completeQuiz();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const selectAnswer = (questionId: string, answerId: string) => {
    setSelectedAnswers((prev) => ({ ...prev, [questionId]: answerId }));
  };

  const handleNext = () => {
    if (!quiz) return;

    if (currentQuestionIndex < quiz.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      completeQuiz();
    }
  };

  const previousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const completeQuiz = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    const completionTime = Date.now() - startTime;
    setCompletionTime(completionTime);
    setShowResults(true);

    const payload: any = {
      quizId: quiz!.id,
      answers: selectedAnswers,
      timeTakenSeconds: Math.round(completionTime / 1000),
      playerName: playerName,
    };
    if (playerNumber !== undefined) payload.playerNumber = playerNumber;

    if (window.electronAPI) {
      window.electronAPI.request
        .saveQuizAnswers(payload)
        .then((response) => {
          if (response.success) {
            console.log('Quiz answers saved successfully.');
          } else {
            console.error('Failed to save quiz answers.');
          }
        })
        .catch((error) => {
          console.error('Error saving quiz answers:', error);
        });
    }
  };

  const handleBackToMenu = async () => {
    const ok = confirm('Return to menu? Any progress will be lost.');
    if (!ok) return;

    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    navigateToMenu();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleStartQuiz();
    }
  };

  const openImageModal = (imageSrc: string) => {
    setEnlargedImage(imageSrc);
  };

  const closeImageModal = () => {
    setEnlargedImage(null);
  };

  if (showResults) {
    const totalQuestions = quiz?.questions.length || 0;
    const answeredCount = Object.keys(selectedAnswers).length;
    const timeSeconds = Math.round(completionTime / 1000);
    const minutes = Math.floor(timeSeconds / 60);
    const seconds = timeSeconds % 60;

    return (
      <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 3 }}>
        <Container maxWidth="sm">
          <Card sx={{ border: '1px solid rgba(0, 0, 0, 0.12)' }}>
            <CardContent sx={{ textAlign: 'center', p: 5 }}>
              <Avatar
                sx={{
                  width: 80,
                  height: 80,
                  mx: 'auto',
                  mb: 3,
                  background: 'linear-gradient(135deg, #2e7d32 0%, #4caf50 100%)',
                  fontSize: '2.5rem',
                }}
              >
                ✓
              </Avatar>
              <Typography variant="h4" component="h2" gutterBottom sx={{ fontWeight: 600, mb: 1 }}>
                Great job, {playerName}!
              </Typography>
              <Box sx={{ my: 4, display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
                <Chip
                  label={`${answeredCount}/${totalQuestions} Questions`}
                  color="primary"
                  sx={{ fontSize: '0.9375rem', py: 2.5, px: 1 }}
                />
                <Chip
                  label={`${minutes}:${seconds.toString().padStart(2, '0')}`}
                  icon={<Timer />}
                  sx={{ fontSize: '0.9375rem', py: 2.5, px: 1 }}
                />
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 4 }}>
                <Button variant="contained" fullWidth size="large" onClick={() => window.location.reload()}>
                  Take Another Quiz
                </Button>
                <Button variant="outlined" fullWidth size="large" onClick={navigateToMenu}>
                  Back to Menu
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Container>
      </Box>
    );
  }

  if (!quiz) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'background.default' }}>
        <Typography>Loading quiz...</Typography>
      </Box>
    );
  }

  const currentQuestion = quiz.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / quiz.questions.length) * 100;
  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;
  const timerWarning = timeRemaining <= 60;
  const hasSelectedAnswer = selectedAnswers[currentQuestion.id] !== undefined;
  const isLastQuestion = currentQuestionIndex === quiz.questions.length - 1;

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', display: 'flex', flexDirection: 'column' }}>
      <AppBar position="static" elevation={2}>
        <Toolbar sx={{ px: { xs: 2, sm: 3 } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
            <Chip
              icon={<Person />}
              label={playerName}
              sx={{
                bgcolor: 'rgba(255, 255, 255, 0.2)',
                color: 'white',
                fontWeight: 500,
                backdropFilter: 'blur(10px)',
              }}
            />
            {quiz.totalTimeSeconds > 0 && (
              <Chip
                icon={<Timer />}
                label={`${minutes}:${seconds.toString().padStart(2, '0')}`}
                sx={{
                  bgcolor: timerWarning ? 'rgba(211, 47, 47, 0.3)' : 'rgba(255, 255, 255, 0.2)',
                  color: 'white',
                  fontWeight: 600,
                  fontVariantNumeric: 'tabular-nums',
                  backdropFilter: 'blur(10px)',
                }}
              />
            )}
          </Box>
          <IconButton color="inherit" onClick={handleBackToMenu} sx={{ ml: 1 }}>
            <Close />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Container maxWidth="md" sx={{ flex: 1, py: { xs: 2, sm: 3 } }}>
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
              Question {currentQuestionIndex + 1} of {quiz.questions.length}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
              {Math.round(progress)}%
            </Typography>
          </Box>
          <LinearProgress variant="determinate" value={progress} />
        </Box>

        <Card sx={{ border: '1px solid rgba(0, 0, 0, 0.12)' }}>
          <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
            <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
              {currentQuestion.question}
            </Typography>

            {currentQuestion.imageBase64 && (
              <Box sx={{ my: 3, position: 'relative', borderRadius: 2, overflow: 'hidden' }}>
                <Box
                  component="img"
                  src={currentQuestion.imageBase64}
                  alt="Question"
                  sx={{
                    width: '100%',
                    height: 'auto',
                    display: 'block',
                    cursor: 'zoom-in',
                    transition: 'transform 0.2s ease',
                    '&:hover': { transform: 'scale(1.02)' },
                  }}
                  onClick={() => openImageModal(currentQuestion.imageBase64)}
                />
                <Paper
                  sx={{
                    position: 'absolute',
                    bottom: 16,
                    right: 16,
                    bgcolor: 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(10px)',
                    borderRadius: 2,
                    p: 0.5,
                  }}
                >
                  <IconButton
                    onClick={() => openImageModal(currentQuestion.imageBase64)}
                    size="small"
                    sx={{ color: 'primary.main' }}
                  >
                    <ZoomIn />
                  </IconButton>
                </Paper>
              </Box>
            )}

            <FormControl component="fieldset" sx={{ width: '100%', mt: 2 }}>
              <RadioGroup
                value={selectedAnswers[currentQuestion.id] || ''}
                onChange={(e) => selectAnswer(currentQuestion.id, e.target.value)}
              >
                {currentQuestion.possibleAnswers.map((answer, index) => {
                  const isSelected = selectedAnswers[currentQuestion.id] === answer.id;
                  return (
                    <Card
                      key={answer.id}
                      sx={{
                        mb: 1.5,
                        border: isSelected ? 2 : 1,
                        borderColor: isSelected ? 'primary.main' : 'rgba(0, 0, 0, 0.12)',
                        bgcolor: isSelected ? 'action.selected' : 'background.paper',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          borderColor: 'primary.main',
                          bgcolor: 'action.hover',
                          borderWidth: 2,
                        },
                      }}
                    >
                      <FormControlLabel
                        value={answer.id}
                        control={<Radio />}
                        label={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1 }}>
                            <Chip
                              label={String.fromCharCode(65 + index)}
                              size="small"
                              sx={{
                                minWidth: 32,
                                fontWeight: 600,
                                bgcolor: isSelected ? 'primary.main' : 'action.selected',
                                color: isSelected ? 'white' : 'text.primary',
                              }}
                            />
                            <Typography variant="body1" sx={{ flex: 1 }}>
                              {answer.text}
                            </Typography>
                          </Box>
                        }
                        sx={{ m: 0, width: '100%', px: 2 }}
                      />
                    </Card>
                  );
                })}
              </RadioGroup>
            </FormControl>

            <Box
              sx={{
                display: 'flex',
                gap: 2,
                justifyContent: 'space-between',
                mt: 4,
                pt: 3,
                borderTop: 1,
                borderColor: 'divider',
              }}
            >
              <Button
                variant="outlined"
                startIcon={<ArrowBack />}
                onClick={previousQuestion}
                disabled={currentQuestionIndex === 0}
                size="large"
              >
                Previous
              </Button>
              <Button
                variant="contained"
                endIcon={<ArrowForward />}
                onClick={handleNext}
                disabled={!hasSelectedAnswer}
                size="large"
              >
                {isLastQuestion ? 'Finish Quiz' : 'Next Question'}
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Container>

      <Dialog open={showNameModal} onClose={() => {}} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ pb: 2 }}>
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            Welcome to EduQuiz!
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" gutterBottom sx={{ mb: 2 }}>
            Please enter your name to begin
          </Typography>
          <TextField
            autoFocus
            fullWidth
            margin="normal"
            label="Name"
            placeholder="Enter your name..."
            value={playerName}
            onChange={(e) => {
              const value = e.target.value;
              setPlayerName(value);
              validateName(value);
            }}
            onKeyPress={handleKeyPress}
            error={!!nameError}
            helperText={nameError}
            inputProps={{ maxLength: 50 }}
          />
          <TextField
            fullWidth
            margin="normal"
            label="Player Number (optional)"
            type="number"
            placeholder="Player number"
            value={playerNumber || ''}
            onChange={(e) => {
              const value = e.target.value;
              if (value) {
                validatePlayerNumber(value);
              } else {
                setPlayerNumber(undefined);
              }
            }}
            onKeyPress={handleKeyPress}
            inputProps={{ min: 1, max: 99999 }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={handleStartQuiz} variant="contained" disabled={!!nameError} fullWidth size="large">
            Start Quiz
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!enlargedImage} onClose={closeImageModal} maxWidth="lg" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Question Image</Typography>
            <IconButton onClick={closeImageModal} size="small">
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
            <Box component="img" src={enlargedImage || ''} alt="Question image" sx={{ maxWidth: '100%', maxHeight: '80vh', borderRadius: 2 }} />
          </Box>
        </DialogContent>
      </Dialog>
    </Box>
  );
};

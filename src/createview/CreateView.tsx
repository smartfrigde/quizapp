import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  TextField,
  Card,
  CardContent,
  FormControlLabel,
  Checkbox,
  IconButton,
  AppBar,
  Toolbar,
  Chip,
  LinearProgress,
  Radio,
  RadioGroup,
  FormControl,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Avatar,
  Divider,
  Paper,
} from '@mui/material';
import {
  ArrowBack,
  Add,
  Delete,
  ContentCopy,
  ArrowUpward,
  ArrowDownward,
  Image as ImageIcon,
  Close,
  FolderOpen,
  Description,
  Save,
} from '@mui/icons-material';
import { Quiz, QuizQuestion, QuizAnswer } from '../types/questions';

interface CreateQuestion {
  id: string;
  text: string;
  options: string[];
  correctAnswer: number;
  image: string;
}

const generateId = () => `q-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

export const CreateView: React.FC = () => {
  const [quizTitle, setQuizTitle] = useState('');
  const [quizDescription, setQuizDescription] = useState('');
  const [timeLimit, setTimeLimit] = useState('15');
  const [randomizeQuestions, setRandomizeQuestions] = useState(false);
  const [questions, setQuestions] = useState<CreateQuestion[]>([
    { id: generateId(), text: '', options: ['', ''], correctAnswer: 0, image: '' },
  ]);
  const [imageErrors, setImageErrors] = useState<{ [key: string]: string }>({});
  const [imageSuccess, setImageSuccess] = useState<{ [key: string]: string }>({});
  const [isEditing, setIsEditing] = useState(false);
  const [originalQuizId, setOriginalQuizId] = useState<string | null>(null);

  const questionImageFileRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});
  const importFileInputRef = useRef<HTMLInputElement>(null);
  const questionEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    questionEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [questions.length]);

  const navigateToMenu = async () => {
    if (confirm('Are you sure you want to go back? Any unsaved changes will be lost.')) {
      if (window.electronAPI) {
        await window.electronAPI.navigate('menuview');
      } else {
        window.location.href = '../menuview/index.html';
      }
    }
  };

  const loadQuizForEditing = async () => {
    try {
      if (!window.electronAPI) {
        throw new Error('Electron API not available');
      }
      const quiz: Quiz = await window.electronAPI.request.loadQuiz();

      setQuizTitle(quiz.name);
      setQuizDescription(quiz.description);
      setTimeLimit(String(Math.floor(quiz.totalTimeSeconds / 60)));
      setRandomizeQuestions(quiz.random);
      setOriginalQuizId(quiz.id);
      setIsEditing(true);

      const convertedQuestions: CreateQuestion[] = quiz.questions.map((q) => ({
        id: q.id,
        text: q.question,
        options: q.possibleAnswers.map((a) => a.text),
        correctAnswer: 0,
        image: q.imageBase64 || '',
      }));

      try {
        const answerKey = await window.electronAPI.request.loadAnswerKey();
        convertedQuestions.forEach((cq, qIndex) => {
          const quizQuestion = quiz.questions[qIndex];
          const correctAnswerId = answerKey.correctAnswers[quizQuestion.id];
          const correctIndex = quizQuestion.possibleAnswers.findIndex((a) => a.id === correctAnswerId);
          if (correctIndex >= 0) {
            cq.correctAnswer = correctIndex;
          }
        });
      } catch (error) {
        console.warn('Could not load answer key, correct answers will be reset');
      }

      setQuestions(convertedQuestions.length > 0 ? convertedQuestions : [
        { id: generateId(), text: '', options: ['', ''], correctAnswer: 0, image: '' },
      ]);
    } catch (error) {
      console.error('Error loading quiz:', error);
      alert('Failed to load quiz. Please try again.');
    }
  };

  const validateTimeLimit = (value: string): string => {
    const trimmed = value.trim();
    if (!trimmed) return '15';

    const minutes = parseInt(trimmed, 10);
    if (isNaN(minutes)) return '15';

    if (minutes < 1) return '1';
    if (minutes > 180) return '180';

    return String(minutes);
  };

  const handleTimeLimitChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const validated = validateTimeLimit(e.target.value);
    setTimeLimit(validated);
  };

  const updateQuestion = (questionId: string, updates: Partial<CreateQuestion>) => {
    setQuestions((prev) => prev.map((q) => (q.id === questionId ? { ...q, ...updates } : q)));
  };

  const handleQuestionTextChange = (questionId: string, text: string) => {
    updateQuestion(questionId, { text });
  };

  const handleOptionChange = (questionId: string, index: number, value: string) => {
    const question = questions.find((q) => q.id === questionId);
    if (!question) return;

    const newOptions = [...question.options];
    newOptions[index] = value;
    updateQuestion(questionId, { options: newOptions });
  };

  const handleCorrectAnswerChange = (questionId: string, index: number) => {
    updateQuestion(questionId, { correctAnswer: index });
  };

  const addOption = (questionId: string) => {
    const question = questions.find((q) => q.id === questionId);
    if (!question) return;

    if (question.options.length >= 6) {
      alert('Maximum of 6 options allowed per question.');
      return;
    }

    const newOptions = [...question.options, ''];
    updateQuestion(questionId, { options: newOptions });
  };

  const removeOption = (questionId: string, index: number) => {
    const question = questions.find((q) => q.id === questionId);
    if (!question) return;

    if (question.options.length <= 2) {
      alert('Minimum of 2 options required per question.');
      return;
    }

    const newOptions = question.options.filter((_, i) => i !== index);
    let newCorrectAnswer = question.correctAnswer;

    if (question.correctAnswer === index) {
      newCorrectAnswer = 0;
    } else if (question.correctAnswer > index) {
      newCorrectAnswer = question.correctAnswer - 1;
    }

    updateQuestion(questionId, { options: newOptions, correctAnswer: newCorrectAnswer });
  };

  const triggerImageUpload = (questionId: string) => {
    questionImageFileRefs.current[questionId]?.click();
  };

  const handleImageUpload = async (questionId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setImageErrors((prev) => ({ ...prev, [questionId]: 'Please select a valid image file.' }));
      setTimeout(() => {
        setImageErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[questionId];
          return newErrors;
        });
      }, 5000);
      return;
    }

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      setImageErrors((prev) => ({ ...prev, [questionId]: 'Image file must be smaller than 5MB.' }));
      setTimeout(() => {
        setImageErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[questionId];
          return newErrors;
        });
      }, 5000);
      return;
    }

    try {
      const base64String = await convertToBase64(file);
      updateQuestion(questionId, { image: base64String });
      setImageSuccess((prev) => ({ ...prev, [questionId]: 'Image uploaded successfully!' }));
      setTimeout(() => {
        setImageSuccess((prev) => {
          const newSuccess = { ...prev };
          delete newSuccess[questionId];
          return newSuccess;
        });
      }, 3000);
      setImageErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[questionId];
        return newErrors;
      });
    } catch (error) {
      console.error('Error converting image to base64:', error);
      setImageErrors((prev) => ({ ...prev, [questionId]: 'Failed to process image. Please try again.' }));
      setTimeout(() => {
        setImageErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[questionId];
          return newErrors;
        });
      }, 5000);
    }

    if (questionImageFileRefs.current[questionId]) {
      questionImageFileRefs.current[questionId]!.value = '';
    }
  };

  const convertToBase64 = (file: File): Promise<string> => {
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
  };

  const removeImage = (questionId: string) => {
    updateQuestion(questionId, { image: '' });
    setImageErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[questionId];
      return newErrors;
    });
    setImageSuccess((prev) => {
      const newSuccess = { ...prev };
      delete newSuccess[questionId];
      return newSuccess;
    });
    if (questionImageFileRefs.current[questionId]) {
      questionImageFileRefs.current[questionId]!.value = '';
    }
  };

  const addNewQuestion = () => {
    const newQuestion: CreateQuestion = {
      id: generateId(),
      text: '',
      options: ['', ''],
      correctAnswer: 0,
      image: '',
    };
    setQuestions([...questions, newQuestion]);
  };

  const deleteQuestion = (questionId: string) => {
    if (questions.length <= 1) {
      alert('You must have at least one question.');
      return;
    }

    if (confirm('Are you sure you want to delete this question?')) {
      setQuestions(questions.filter((q) => q.id !== questionId));
    }
  };

  const duplicateQuestion = (questionId: string) => {
    const question = questions.find((q) => q.id === questionId);
    if (!question) return;

    const duplicated: CreateQuestion = {
      id: generateId(),
      text: question.text,
      options: [...question.options],
      correctAnswer: question.correctAnswer,
      image: question.image,
    };

    const index = questions.findIndex((q) => q.id === questionId);
    const newQuestions = [...questions];
    newQuestions.splice(index + 1, 0, duplicated);
    setQuestions(newQuestions);
  };

  const moveQuestion = (questionId: string, direction: 'up' | 'down') => {
    const index = questions.findIndex((q) => q.id === questionId);
    if (index === -1) return;

    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === questions.length - 1) return;

    const newQuestions = [...questions];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    [newQuestions[index], newQuestions[newIndex]] = [newQuestions[newIndex], newQuestions[index]];
    setQuestions(newQuestions);
  };

  const importFromFile = () => {
    const instructions = `Import Quiz from Text File

Format:
- Each question starts with number + dot (e.g. "31. Question text")
- Options start with letter + dot (A. B. C. ...)
- Mark correct option with * either before the letter ("*A.") or at the end of the line ("...*")
- Up to 6 options (A-F)
Click OK to choose a .txt file.`;

    if (confirm(instructions)) {
      importFileInputRef.current?.click();
    }
  };

  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.txt') && !file.name.toLowerCase().endsWith('.text')) {
      alert('Please select a .txt file.');
      if (importFileInputRef.current) {
        importFileInputRef.current.value = '';
      }
      return;
    }

    try {
      const content = await readFileContent(file);
      const parsed = parseTextQuestions(content);

      if (parsed.length === 0) {
        alert('No valid questions found in the file. Check format and try again.');
        if (importFileInputRef.current) {
          importFileInputRef.current.value = '';
        }
        return;
      }

      if (!confirm(`Found ${parsed.length} questions. This will replace current quiz. Continue?`)) {
        if (importFileInputRef.current) {
          importFileInputRef.current.value = '';
        }
        return;
      }

      const convertedQuestions: CreateQuestion[] = parsed.map((q) => ({
        id: generateId(),
        ...q,
      }));

      setQuestions(convertedQuestions);
      alert(`Imported ${parsed.length} questions.`);
    } catch (err) {
      console.error('Import error', err);
      alert('Failed to import file.');
    } finally {
      if (importFileInputRef.current) {
        importFileInputRef.current.value = '';
      }
    }
  };

  const readFileContent = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result);
        } else {
          reject(new Error('Failed to read file'));
        }
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsText(file, 'utf-8');
    });
  };

  const parseTextQuestions = (content: string): Omit<CreateQuestion, 'id'>[] => {
    const lines = content.split(/\r?\n/);
    const questions: Omit<CreateQuestion, 'id'>[] = [];
    let current: Partial<Omit<CreateQuestion, 'id'>> | null = null;

    for (const raw of lines) {
      const line = raw.trim();
      if (!line) continue;

      const qMatch = line.match(/^(\d+)\.\s*(.+)$/);
      if (qMatch) {
        if (current && isValidQuestion(current)) {
          current.options = current.options!.map((o) => o || '').slice(0, 6);
          questions.push(current as Omit<CreateQuestion, 'id'>);
        }
        current = { text: qMatch[2].trim(), options: [], correctAnswer: 0, image: '' };
        continue;
      }

      const optMatch = line.match(/^([*+]?)([A-Fa-f])\.\s*(.+)$/);
      if (optMatch && current) {
        const [, mark, letter, rest] = optMatch;
        const idx = letter.toUpperCase().charCodeAt(0) - 65;
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

      if (current && !/^[A-Fa-f]\./.test(line) && !/^\d+\./.test(line)) {
        current.text += ' ' + line;
      }
    }

    if (current && isValidQuestion(current)) {
      current.options = current.options!.map((o) => o || '').slice(0, 6);
      questions.push(current as Omit<CreateQuestion, 'id'>);
    }

    return questions;
  };

  const isValidQuestion = (q: Partial<Omit<CreateQuestion, 'id'>>): boolean => {
    if (!q.text || !q.options) return false;
    const filled = q.options.filter((o) => o && o.trim()).length;
    return filled >= 2 && q.correctAnswer !== undefined && q.correctAnswer < q.options.length;
  };

  const saveQuiz = async () => {
    if (!quizTitle.trim()) {
      alert('Please enter a quiz title.');
      return;
    }

    const timeLimitMinutes = parseInt(timeLimit);
    if (isNaN(timeLimitMinutes) || timeLimitMinutes < 1 || timeLimitMinutes > 180) {
      alert('Please enter a valid time limit between 1 and 180 minutes.');
      return;
    }

    for (let i = 0; i < questions.length; i++) {
      const question = questions[i];
      if (!question.text.trim()) {
        alert(`Question ${i + 1} is missing text.`);
        return;
      }

      const filledOptions = question.options.filter((opt) => opt.trim()).length;
      if (filledOptions < 2) {
        alert(`Question ${i + 1} needs at least 2 answer options.`);
        return;
      }

      if (question.correctAnswer >= filledOptions) {
        alert(`Question ${i + 1} has an invalid correct answer selection.`);
        return;
      }
    }

    const quizId = isEditing && originalQuizId ? originalQuizId : `quiz-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const quizData: Quiz = {
      id: quizId,
      name: quizTitle.trim(),
      description: quizDescription.trim() || 'Custom created quiz',
      totalTimeSeconds: timeLimitMinutes * 60,
      random: randomizeQuestions,
      questions: questions.map((q, index) => {
        const questionId = q.id.startsWith('q-') ? q.id : `q${index + 1}-${q.text.toLowerCase().replace(/[^a-z0-9]/g, '-').substring(0, 20)}`;

        const possibleAnswers: QuizAnswer[] = q.options
          .filter((opt) => opt.trim())
          .map((option, optIndex) => ({
            id: `${questionId}-${String.fromCharCode(97 + optIndex)}`,
            text: option.trim(),
          }));

        const question: QuizQuestion = {
          id: questionId,
          question: q.text.trim(),
          imageBase64: q.image || '',
          possibleAnswers,
        };

        return question;
      }),
    };

    const answerKey = {
      quizId: quizId,
      correctAnswers: {} as Record<string, string>,
      version: '1.0',
      createdAt: new Date().toISOString(),
    };

    questions.forEach((q, index) => {
      const questionId = q.id.startsWith('q-') ? q.id : `q${index + 1}-${q.text.toLowerCase().replace(/[^a-z0-9]/g, '-').substring(0, 20)}`;
      const correctOptionIndex = q.correctAnswer;
      const filledOptions = q.options.filter((opt) => opt.trim());
      if (correctOptionIndex < filledOptions.length) {
        const correctAnswerId = `${questionId}-${String.fromCharCode(97 + correctOptionIndex)}`;
        answerKey.correctAnswers[questionId] = correctAnswerId;
      }
    });

    try {
      if (!window.electronAPI) {
        throw new Error('Electron API not available');
      }

      await window.electronAPI.request.saveQuizFiles({
        quiz: JSON.stringify(quizData),
        answerKey: JSON.stringify(answerKey),
      });

      const timeDisplay = timeLimitMinutes === 1 ? '1 minute' : `${timeLimitMinutes} minutes`;
      const randomDisplay = randomizeQuestions ? 'Yes' : 'No';
      const imageCount = questions.filter((q) => q.image).length;

      alert(
        `Quiz "${quizData.name}" has been ${isEditing ? 'updated' : 'created'}!\n\nFiles generated:\n- ${quizData.name.replace(/[^a-z0-9]/gi, '_')}.quiz (for students)\n- ${quizData.name.replace(/[^a-z0-9]/gi, '_')}_answers.key (for instructor)\n\nQuestions: ${quizData.questions.length}\nWith images: ${imageCount}\nTime limit: ${timeDisplay}\nRandomize: ${randomDisplay}`
      );

      setIsEditing(false);
      setOriginalQuizId(null);
    } catch (error) {
      console.error('Error saving quiz files:', error);
      alert('Failed to save quiz files. Please try again.');
    }
  };

  const optionLabels = ['A', 'B', 'C', 'D', 'E', 'F'];

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', display: 'flex', flexDirection: 'column' }}>
      <AppBar position="static" elevation={2}>
        <Toolbar sx={{ px: { xs: 2, sm: 3 } }}>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 600 }}>
            {isEditing ? 'Edit Quiz' : 'Create a Quiz'}
          </Typography>
          <Button color="inherit" startIcon={<FolderOpen />} onClick={loadQuizForEditing} sx={{ mr: 1 }}>
            Load Quiz
          </Button>
          <Button color="inherit" startIcon={<Description />} onClick={importFromFile} sx={{ mr: 1 }}>
            Import Text
          </Button>
          <IconButton color="inherit" onClick={navigateToMenu}>
            <ArrowBack />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ flex: 1, py: { xs: 2, sm: 3 } }}>
        <Card sx={{ mb: 3, border: '1px solid rgba(0, 0, 0, 0.12)' }}>
          <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
            <TextField
              fullWidth
              label="Quiz Title"
              placeholder="Untitled Quiz"
              value={quizTitle}
              onChange={(e) => setQuizTitle(e.target.value)}
              sx={{ mb: 2 }}
              variant="outlined"
            />
            <TextField
              fullWidth
              multiline
              rows={2}
              label="Description (optional)"
              placeholder="Quiz description..."
              value={quizDescription}
              onChange={(e) => setQuizDescription(e.target.value)}
              sx={{ mb: 2 }}
              variant="outlined"
            />
            <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', alignItems: 'center' }}>
              <TextField
                label="Time Limit (minutes)"
                type="number"
                value={timeLimit}
                onChange={handleTimeLimitChange}
                inputProps={{ min: 1, max: 180 }}
                sx={{ width: { xs: '100%', sm: 200 } }}
                variant="outlined"
              />
              <FormControlLabel
                control={<Checkbox checked={randomizeQuestions} onChange={(e) => setRandomizeQuestions(e.target.checked)} />}
                label="Randomize question order"
              />
            </Box>
          </CardContent>
        </Card>

        {questions.map((question, index) => (
          <Card key={question.id} sx={{ mb: 3, border: '1px solid rgba(0, 0, 0, 0.12)' }}>
            <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Chip label={`Question ${index + 1}`} color="primary" sx={{ fontWeight: 600 }} />
                <Box>
                  <IconButton size="small" onClick={() => duplicateQuestion(question.id)} title="Duplicate" sx={{ mr: 0.5 }}>
                    <ContentCopy fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => moveQuestion(question.id, 'up')}
                    disabled={index === 0}
                    title="Move up"
                    sx={{ mr: 0.5 }}
                  >
                    <ArrowUpward fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => moveQuestion(question.id, 'down')}
                    disabled={index === questions.length - 1}
                    title="Move down"
                    sx={{ mr: 0.5 }}
                  >
                    <ArrowDownward fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => deleteQuestion(question.id)}
                    disabled={questions.length === 1}
                    color="error"
                    title="Delete"
                  >
                    <Delete fontSize="small" />
                  </IconButton>
                </Box>
              </Box>

              <TextField
                fullWidth
                multiline
                rows={2}
                label="Question"
                placeholder="Question text..."
                value={question.text}
                onChange={(e) => handleQuestionTextChange(question.id, e.target.value)}
                sx={{ mb: 3 }}
                variant="outlined"
              />

              <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600, color: 'text.secondary' }}>
                Answer Options
              </Typography>
              <FormControl component="fieldset" sx={{ width: '100%' }}>
                {question.options.map((option, optIndex) => (
                  <Box key={optIndex} sx={{ display: 'flex', gap: 1.5, mb: 1.5, alignItems: 'flex-start' }}>
                    <Chip
                      label={optionLabels[optIndex] || optIndex + 1}
                      size="small"
                      sx={{
                        minWidth: 40,
                        fontWeight: 600,
                        bgcolor: question.correctAnswer === optIndex ? 'primary.main' : 'action.selected',
                        color: question.correctAnswer === optIndex ? 'white' : 'text.primary',
                      }}
                    />
                    <TextField
                      fullWidth
                      size="small"
                      placeholder={`Option ${optionLabels[optIndex] || optIndex + 1}`}
                      value={option}
                      onChange={(e) => handleOptionChange(question.id, optIndex, e.target.value)}
                      variant="outlined"
                    />
                    <FormControlLabel
                      control={
                        <Radio
                          checked={question.correctAnswer === optIndex}
                          onChange={() => handleCorrectAnswerChange(question.id, optIndex)}
                        />
                      }
                      label="Correct"
                      sx={{ m: 0, whiteSpace: 'nowrap' }}
                    />
                    {question.options.length > 2 && (
                      <IconButton size="small" onClick={() => removeOption(question.id, optIndex)} color="error">
                        <Delete fontSize="small" />
                      </IconButton>
                    )}
                  </Box>
                ))}
              </FormControl>
              {question.options.length < 6 && (
                <Button startIcon={<Add />} onClick={() => addOption(question.id)} size="small" sx={{ mt: 1.5 }}>
                  Add Option
                </Button>
              )}

              <Divider sx={{ my: 3 }} />

              <Box>
                <input
                  ref={(el) => (questionImageFileRefs.current[question.id] = el)}
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={(e) => handleImageUpload(question.id, e)}
                />
                {question.image ? (
                  <Box>
                    <Box
                      component="img"
                      src={question.image}
                      alt="Preview"
                      sx={{ maxWidth: '100%', maxHeight: 300, borderRadius: 2, mb: 1.5, border: 1, borderColor: 'divider' }}
                    />
                    <Button startIcon={<Delete />} onClick={() => removeImage(question.id)} size="small" color="error">
                      Remove Image
                    </Button>
                  </Box>
                ) : (
                  <Button startIcon={<ImageIcon />} onClick={() => triggerImageUpload(question.id)} variant="outlined" size="small">
                    Add Image (optional)
                  </Button>
                )}
                {imageErrors[question.id] && (
                  <Alert severity="error" sx={{ mt: 1.5 }}>
                    {imageErrors[question.id]}
                  </Alert>
                )}
                {imageSuccess[question.id] && (
                  <Alert severity="success" sx={{ mt: 1.5 }}>
                    {imageSuccess[question.id]}
                  </Alert>
                )}
              </Box>
            </CardContent>
          </Card>
        ))}

        <Card sx={{ border: '1px solid rgba(0, 0, 0, 0.12)' }}>
          <CardContent sx={{ p: 3, textAlign: 'center' }}>
            <Button startIcon={<Add />} onClick={addNewQuestion} fullWidth variant="outlined" size="large">
              Add Question
            </Button>
          </CardContent>
        </Card>

        <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
          <Button startIcon={<ArrowBack />} onClick={navigateToMenu} variant="outlined" fullWidth size="large">
            Back to Menu
          </Button>
          <Button startIcon={<Save />} onClick={saveQuiz} variant="contained" fullWidth size="large">
            {isEditing ? 'Update Quiz' : 'Save Quiz'}
          </Button>
        </Box>
      </Container>

      <div ref={questionEndRef} />

      <input
        ref={importFileInputRef}
        type="file"
        accept=".txt,.text"
        style={{ display: 'none' }}
        onChange={handleFileImport}
      />
    </Box>
  );
};

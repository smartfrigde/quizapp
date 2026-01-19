import React from 'react';
import { Box, Container, Typography, Card, CardContent, CardActionArea, Grid, Avatar } from '@mui/material';
import { Description, Create, CheckCircle } from '@mui/icons-material';

export const MenuView: React.FC = () => {
  const handleLoadQuiz = async () => {
    if (window.electronAPI) {
      await window.electronAPI.navigate('loadview');
    } else {
      window.location.href = './loadview/index.html';
    }
  };

  const handleCreateQuiz = async () => {
    if (window.electronAPI) {
      await window.electronAPI.navigate('createview');
    } else {
      window.location.href = './createview/index.html';
    }
  };

  const handleCheckAnswers = async () => {
    if (window.electronAPI) {
      await window.electronAPI.navigate('checkview');
    } else {
      window.location.href = './checkview/index.html';
    }
  };

  const menuItems = [
    {
      title: 'Load a Quiz',
      description: 'Take an existing quiz',
      icon: <Description sx={{ fontSize: 40 }} />,
      onClick: handleLoadQuiz,
      color: '#1976d2',
      gradient: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
    },
    {
      title: 'Create a Quiz',
      description: 'Make your own quiz',
      icon: <Create sx={{ fontSize: 40 }} />,
      onClick: handleCreateQuiz,
      color: '#9c27b0',
      gradient: 'linear-gradient(135deg, #9c27b0 0%, #ba68c8 100%)',
    },
    {
      title: 'Check Answers',
      description: 'Review your answers',
      icon: <CheckCircle sx={{ fontSize: 40 }} />,
      onClick: handleCheckAnswers,
      color: '#2e7d32',
      gradient: 'linear-gradient(135deg, #2e7d32 0%, #4caf50 100%)',
    },
  ];

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
        p: { xs: 2, sm: 3 },
      }}
    >
      <Container maxWidth="sm">
        <Box sx={{ textAlign: 'center', mb: 5 }}>
          <Typography
            variant="h3"
            component="h1"
            gutterBottom
            sx={{
              fontWeight: 700,
              background: 'linear-gradient(135deg, #1976d2 0%, #9c27b0 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              mb: 1,
            }}
          >
            EduQuiz
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ fontSize: '1rem' }}>
            Choose an option to get started
          </Typography>
        </Box>

        <Grid container spacing={3}>
          {menuItems.map((item, index) => (
            <Grid item xs={12} key={index}>
              <Card
                sx={{
                  overflow: 'hidden',
                  position: 'relative',
                  border: '1px solid rgba(0, 0, 0, 0.12)',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    borderColor: 'rgba(0, 0, 0, 0.2)',
                  },
                  transition: 'all 0.2s ease-in-out',
                }}
              >
                <CardActionArea onClick={item.onClick} sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                    <Avatar
                      sx={{
                        width: 64,
                        height: 64,
                        background: item.gradient,
                        boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.15)',
                        border: '2px solid rgba(255, 255, 255, 0.3)',
                      }}
                    >
                      {item.icon}
                    </Avatar>
                    <Box sx={{ flex: 1, textAlign: 'left' }}>
                      <Typography variant="h6" component="h3" gutterBottom sx={{ fontWeight: 600 }}>
                        {item.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {item.description}
                      </Typography>
                    </Box>
                  </Box>
                </CardActionArea>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
};

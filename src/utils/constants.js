// src/utils/constants.js

export const Colors = {
    // Primary colors
    primary: '#FF9F1C',
    primaryDark: '#E88F0A',
    
    // Secondary colors
    secondary: '#4ECDC4',
    secondaryDark: '#44B5AD',
    
    // Accent colors
    accent: '#FFD93D',
    success: '#4ECDC4',
    error: '#FF6B6B',
    warning: '#FFA726',
    info: '#667eea',
    
    // Background colors
    background: '#FFFCF2',
    surface: '#FFFFFF',
    
    // Text colors
    textPrimary: '#333333',
    textSecondary: '#666666',
    textLight: '#999999',
    textOnPrimary: '#FFFFFF',
    
    // Difficulty colors
    easy: '#4ECDC4',
    medium: '#FFA726',
    hard: '#FF6B6B',
    
    // Category gradient colors
    categoryGradients: [
      ['#667eea', '#764ba2'],
      ['#f093fb', '#f5576c'],
      ['#4facfe', '#00f2fe'],
      ['#43e97b', '#38f9d7'],
      ['#fa709a', '#fee140'],
      ['#30cfd0', '#330867'],
      ['#a8edea', '#fed6e3'],
      ['#ff9a9e', '#fecfef'],
      ['#FFD93D', '#FFC107'],
      ['#00BBF9', '#0081CF'],
    ],
  };
  
  export const Fonts = {
    primary: {
      regular: 'ArialRoundedMTBold',
      bold: 'ArialRoundedMTBold',
    },
    secondary: {
      regular: 'ChalkboardSE-Regular',
      bold: 'ChalkboardSE-Regular',
    },
    accent: {
      regular: 'Noteworthy-Bold',
      bold: 'Noteworthy-Bold',
    },
    // Fallbacks for Android
    android: {
      regular: 'sans-serif',
      medium: 'sans-serif-medium',
      bold: 'sans-serif-bold',
    },
  };
  
  export const Rewards = {
    // Time rewards in seconds
    correctAnswer: 30,
    streakMilestone: 120,
    dailyGoalSmall: 2700, // 45 minutes
    dailyGoalMedium: 3600, // 1 hour
    dailyGoalLarge: 5400, // 1.5 hours
    dailyGoalHuge: 7200, // 2 hours
  };
  
  export const Milestones = {
    streakMilestones: [5, 10, 15, 20, 25, 30, 50, 100],
    scoreMilestones: [100, 500, 1000, 5000, 10000],
  };
  
  export const Sounds = {
    buttonPress: 'button_press.mp3',
    correctAnswer: 'correct.mp3',
    wrongAnswer: 'wrong.mp3',
    milestone: 'milestone.mp3',
    timeWarning: 'warning.mp3',
    menuMusic: 'menu_music.mp3',
    quizMusic: 'quiz_music.mp3',
  };
  
  export const Animations = {
    duration: {
      fast: 200,
      normal: 300,
      slow: 600,
    },
    spring: {
      friction: 8,
      tension: 40,
    },
  };
  
  export const Layout = {
    padding: 20,
    borderRadius: {
      small: 10,
      medium: 15,
      large: 20,
      huge: 25,
    },
    shadow: {
      small: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
      },
      medium: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 3,
      },
      large: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 5,
        elevation: 5,
      },
    },
  };
  
  export const CategoryIcons = {
    'Science': 'flask',
    'Math': 'calculator',
    'History': 'book-open-variant',
    'Geography': 'earth',
    'Literature': 'bookshelf',
    'Technology': 'laptop',
    'Sports': 'basketball',
    'Art': 'palette',
    'Music': 'music-note',
    'General': 'head-question',
    'All': 'view-grid',
  };
  
  export const MascotMessages = {
    welcome: [
      "Welcome back! Ready to learn something new? 🌟",
      "Hey there, genius! Time to train that brain! 🧠",
      "Great to see you! Let's earn some screen time! ⏰",
    ],
    correctAnswer: [
      "Brilliant! You got it right! 🎉",
      "Amazing work! Keep it up! 💪",
      "You're on fire! Great answer! 🔥",
      "Fantastic! Your brain is growing! 🌱",
    ],
    wrongAnswer: [
      "Not quite right, but that's okay! Learning is all about trying! 💙",
      "Good effort! Let's learn from this one! 📚",
      "Keep going! Every mistake makes you smarter! 🌟",
    ],
    streak: {
      5: "5 in a row! You're doing great! 🎯",
      10: "10 correct! You're unstoppable! 🚀",
      15: "15 streak! You're a quiz master! 👑",
      20: "20 in a row! Absolutely incredible! 🌟",
    },
    timeWarning: [
      "Running low on time! Answer some questions to earn more! ⏰",
      "Time's almost up! Let's get some more questions answered! 📚",
    ],
  };
  
  export default {
    Colors,
    Fonts,
    Rewards,
    Milestones,
    Sounds,
    Animations,
    Layout,
    CategoryIcons,
    MascotMessages,
  };
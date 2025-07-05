// src/screens/QuizScreen.js
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Platform,
  BackHandler,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import QuizService from '../services/QuizService';
import EnhancedTimerService from '../services/EnhancedTimerService';
import ScoreService from '../services/ScoreService';
import SoundService from '../services/SoundService';
import DailyGoalsService from '../services/DailyGoalsService';
import AnalyticsService from '../services/AnalyticsService';
import NotificationService from '../services/NotificationService';
import Mascot from '../components/Mascot';
import PeekingMascot from '../components/PeekingMascot';
import BannerAdComponent from '../components/BannerAd';
import { Colors, Animations, MascotMessages } from '../utils/constants';

const { width, height } = Dimensions.get('window');

const QuizScreen = ({ navigation, route }) => {
  const { category = 'All', difficulty = 'Mixed' } = route.params || {};
  
  // Quiz state
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [isCorrect, setIsCorrect] = useState(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [questionNumber, setQuestionNumber] = useState(1);
  const [streakCount, setStreakCount] = useState(0);
  const [timeEarned, setTimeEarned] = useState(0);
  const [answerStartTime, setAnswerStartTime] = useState(Date.now());
  
  // Stats for session
  const [sessionStats, setSessionStats] = useState({
    totalQuestions: 0,
    correctAnswers: 0,
    wrongAnswers: 0,
    totalTimeEarned: 0,
    categoriesPlayed: new Set(),
    difficultiesPlayed: new Set(),
  });
  
  // Mascot state
  const [showMascot, setShowMascot] = useState(false);
  const [mascotType, setMascotType] = useState('happy');
  const [mascotMessage, setMascotMessage] = useState('');
  const [mascotEnabled, setMascotEnabled] = useState(true);
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const questionScale = useRef(new Animated.Value(0.9)).current;
  const optionAnims = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const streakAnim = useRef(new Animated.Value(1)).current;
  
  useEffect(() => {
    // Start quiz music
    SoundService.playQuizMusic();
    
    // Track screen view
    AnalyticsService.trackScreen('Quiz', `${category}_${difficulty}`);
    
    // Load first question
    loadNewQuestion();
    
    // Animate entrance
    animateEntrance();
    
    // Handle back button
    const backHandler = BackHandler.addEventListener('hardwareBackPress', handleBackPress);
    
    return () => {
      backHandler.remove();
      SoundService.stopMusic();
    };
  }, []);
  
  useEffect(() => {
    // Update daily goals when stats change
    if (sessionStats.totalQuestions > 0) {
      updateDailyGoalsProgress();
    }
  }, [sessionStats]);
  
  const animateEntrance = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.spring(questionScale, {
        toValue: 1,
        friction: 8,
        tension: 40,
        delay: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      animateOptions();
    });
  };
  
  const animateOptions = () => {
    const animations = optionAnims.map((anim, index) =>
      Animated.sequence([
        Animated.delay(index * 100),
        Animated.spring(anim, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
      ])
    );
    
    Animated.parallel(animations).start();
  };
  
  const animateQuestionTransition = (callback) => {
    // Fade out current question
    Animated.parallel([
      Animated.timing(questionScale, {
        toValue: 0.8,
        duration: 200,
        useNativeDriver: true,
      }),
      ...optionAnims.map(anim =>
        Animated.timing(anim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        })
      ),
    ]).start(() => {
      callback();
      
      // Fade in new question
      Animated.spring(questionScale, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }).start(() => {
        animateOptions();
      });
    });
  };
  
  const loadNewQuestion = () => {
    const question = QuizService.getRandomQuestion(category, difficulty);
    
    if (!question) {
      Alert.alert(
        'No Questions Available',
        'Unable to load questions. Please try again.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
      return;
    }
    
    setCurrentQuestion(question);
    setSelectedAnswer(null);
    setIsCorrect(null);
    setShowExplanation(false);
    setAnswerStartTime(Date.now());
    
    // Update session stats
    if (question.category) {
      sessionStats.categoriesPlayed.add(question.category);
    }
    if (question.level) {
      sessionStats.difficultiesPlayed.add(question.level);
    }
  };
  
  const handleAnswerSelect = async (option) => {
    if (selectedAnswer) return; // Already answered
    
    const answerTime = (Date.now() - answerStartTime) / 1000; // Time in seconds
    const correct = option === currentQuestion.correctAnswer;
    
    setSelectedAnswer(option);
    setIsCorrect(correct);
    setShowExplanation(true);
    
    // Update session stats
    const newStats = {
      ...sessionStats,
      totalQuestions: sessionStats.totalQuestions + 1,
      correctAnswers: correct ? sessionStats.correctAnswers + 1 : sessionStats.correctAnswers,
      wrongAnswers: correct ? sessionStats.wrongAnswers : sessionStats.wrongAnswers + 1,
    };
    
    if (correct) {
      // Play correct sound
      SoundService.playCorrect();
      
      // Update streak
      const newStreak = streakCount + 1;
      setStreakCount(newStreak);
      
      // Animate streak
      Animated.sequence([
        Animated.spring(streakAnim, {
          toValue: 1.2,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.spring(streakAnim, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start();
      
      // Add time
      const baseTime = 30; // 30 seconds per correct answer
      let bonusTime = 0;
      
      // Check for streak milestone
      if (ScoreService.checkStreakMilestone(newStreak)) {
        bonusTime = 120; // 2 minutes bonus
        SoundService.playStreak();
        NotificationService.showStreakNotification(newStreak);
        showMascotForStreak(newStreak);
        
        // Update daily goals
        DailyGoalsService.updateProgress('streak_milestone', newStreak);
      }
      
      const totalTimeAdded = baseTime + bonusTime;
      await EnhancedTimerService.addEarnedTime(totalTimeAdded);
      setTimeEarned(timeEarned + totalTimeAdded);
      newStats.totalTimeEarned = sessionStats.totalTimeEarned + totalTimeAdded;
      
      // Update score
      const scoreResult = await ScoreService.addCorrectAnswer();
      
      // Update daily goals
      await DailyGoalsService.updateProgress('question_answered', 1);
      await DailyGoalsService.updateProgress('correct_answer', 1);
      await DailyGoalsService.updateProgress('time_earned', totalTimeAdded);
      await DailyGoalsService.updateProgress('streak_update', newStreak);
      
      // Track analytics
      AnalyticsService.trackAnswerSelected(true, currentQuestion.category, answerTime, newStreak);
      
      // Show correct answer mascot if no streak message
      if (!ScoreService.checkStreakMilestone(newStreak)) {
        showMascotForCorrectAnswer();
      }
    } else {
      // Play wrong sound
      SoundService.playWrong();
      
      // Reset streak
      const lostStreak = streakCount;
      setStreakCount(0);
      
      // Update score
      await ScoreService.addWrongAnswer();
      
      // Update daily goals
      await DailyGoalsService.updateProgress('question_answered', 1);
      
      // Track analytics
      AnalyticsService.trackAnswerSelected(false, currentQuestion.category, answerTime, 0);
      
      // Show wrong answer mascot
      showMascotForWrongAnswer();
    }
    
    setSessionStats(newStats);
    
    // Auto-advance after delay
    setTimeout(() => {
      handleNextQuestion();
    }, 3000);
  };
  
  const handleNextQuestion = () => {
    animateQuestionTransition(() => {
      setQuestionNumber(questionNumber + 1);
      loadNewQuestion();
    });
  };
  
  const handleBackPress = () => {
    Alert.alert(
      'Exit Quiz?',
      'Are you sure you want to leave? Your progress will be saved.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Exit', 
          onPress: () => {
            completeQuizSession();
            navigation.goBack();
          }
        },
      ]
    );
    return true;
  };
  
  const completeQuizSession = async () => {
    // Calculate session accuracy
    const accuracy = sessionStats.totalQuestions > 0
      ? Math.round((sessionStats.correctAnswers / sessionStats.totalQuestions) * 100)
      : 0;
    
    // Update daily goals for session completion
    if (sessionStats.totalQuestions >= 10) {
      await DailyGoalsService.updateProgress('quiz_completed', 1, {
        accuracy,
        totalQuestions: sessionStats.totalQuestions,
      });
    }
    
    // Update category/difficulty goals
    sessionStats.categoriesPlayed.forEach(cat => {
      DailyGoalsService.updateProgress('category_played', 1, { category: cat });
    });
    
    sessionStats.difficultiesPlayed.forEach(diff => {
      DailyGoalsService.updateProgress('difficulty_played', 1, { difficulty: diff });
    });
    
    // Track session completion
    AnalyticsService.trackQuizEvent('quiz_session_completed', {
      total_questions: sessionStats.totalQuestions,
      correct_answers: sessionStats.correctAnswers,
      accuracy,
      time_earned: sessionStats.totalTimeEarned,
      categories: Array.from(sessionStats.categoriesPlayed),
      difficulties: Array.from(sessionStats.difficultiesPlayed),
    });
    
    // Show interstitial ad after quiz completion
    if (sessionStats.totalQuestions >= 5) {
      await AdMobService.showInterstitialAd();
    }
  };
  
  const updateDailyGoalsProgress = () => {
    // This is called periodically to update progress
    // Most updates happen in handleAnswerSelect
  };
  
  const showMascotForCorrectAnswer = () => {
    const messages = MascotMessages.correctAnswer;
    const randomMessage = messages[Math.floor(Math.random() * messages.length)];
    
    setMascotType('happy');
    setMascotMessage(randomMessage + `\n\nYou earned 30 seconds! ⏱️`);
    setShowMascot(true);
  };
  
  const showMascotForWrongAnswer = () => {
    const messages = MascotMessages.wrongAnswer;
    const randomMessage = messages[Math.floor(Math.random() * messages.length)];
    
    setMascotType('sad');
    setMascotMessage(randomMessage + `\n\nThe answer was: ${currentQuestion.correctAnswer}\n\nTap me for explanation!`);
    setShowMascot(true);
  };
  
  const showMascotForStreak = (streak) => {
    const message = MascotMessages.streak[streak] || `Amazing ${streak} streak! 🔥`;
    
    setMascotType('celebration');
    setMascotMessage(message + `\n\nYou earned 2 bonus minutes! 🎉`);
    setShowMascot(true);
  };
  
  const handleMascotPress = () => {
    if (showExplanation && currentQuestion) {
      setMascotType('thoughtful');
      setMascotMessage(`Here's why:\n\n${currentQuestion.explanation}`);
    }
  };
  
  const renderOption = (option, index) => {
    const isSelected = selectedAnswer === option;
    const isCorrectOption = option === currentQuestion.correctAnswer;
    const showResult = selectedAnswer !== null;
    
    let backgroundColor = Colors.surface;
    let borderColor = '#E0E0E0';
    let textColor = Colors.textPrimary;
    let iconName = null;
    
    if (showResult) {
      if (isCorrectOption) {
        backgroundColor = Colors.success;
        borderColor = Colors.success;
        textColor = Colors.textOnPrimary;
        iconName = 'check-circle';
      } else if (isSelected && !isCorrect) {
        backgroundColor = Colors.error;
        borderColor = Colors.error;
        textColor = Colors.textOnPrimary;
        iconName = 'close-circle';
      }
    } else if (isSelected) {
      borderColor = Colors.primary;
    }
    
    return (
      <Animated.View
        key={option}
        style={[
          styles.optionContainer,
          {
            opacity: optionAnims[index],
            transform: [{
              translateX: optionAnims[index].interpolate({
                inputRange: [0, 1],
                outputRange: [50, 0],
              }),
            }],
          },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.option,
            { backgroundColor, borderColor },
          ]}
          onPress={() => handleAnswerSelect(option)}
          disabled={selectedAnswer !== null}
          activeOpacity={0.8}
        >
          <View style={styles.optionLabel}>
            <Text style={[styles.optionLetter, { color: textColor }]}>{option}</Text>
          </View>
          <Text style={[styles.optionText, { color: textColor }]}>
            {currentQuestion.options[option]}
          </Text>
          {iconName && (
            <Icon name={iconName} size={24} color={textColor} style={styles.optionIcon} />
          )}
        </TouchableOpacity>
      </Animated.View>
    );
  };
  
  if (!currentQuestion) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading question...</Text>
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      <Animated.View 
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBackPress}
          >
            <Icon name="close" size={28} color={Colors.textPrimary} />
          </TouchableOpacity>
          
          <View style={styles.headerInfo}>
            <Text style={styles.categoryText}>
              {currentQuestion.category} • {currentQuestion.level}
            </Text>
            <Text style={styles.questionNumber}>Question {questionNumber}</Text>
          </View>
          
          <TouchableOpacity style={styles.settingsButton}>
            <Icon name="cog" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
        </View>
        
        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <Animated.View
              style={[
                styles.progressFill,
                {
                  width: progressAnim.interpolate({
                    inputRange: [0, 100],
                    outputRange: ['0%', '100%'],
                  }),
                },
              ]}
            />
          </View>
        </View>
        
        {/* Stats Bar */}
        <View style={styles.statsBar}>
          <View style={styles.statItem}>
            <Icon name="fire" size={20} color={Colors.error} />
            <Animated.Text 
              style={[
                styles.statText,
                {
                  transform: [{ scale: streakAnim }],
                },
              ]}
            >
              {streakCount}
            </Animated.Text>
          </View>
          
          <View style={styles.statItem}>
            <Icon name="timer" size={20} color={Colors.primary} />
            <Text style={styles.statText}>+{Math.floor(timeEarned / 60)}m {timeEarned % 60}s</Text>
          </View>
          
          <View style={styles.statItem}>
            <Icon name="check" size={20} color={Colors.success} />
            <Text style={styles.statText}>{sessionStats.correctAnswers}/{sessionStats.totalQuestions}</Text>
          </View>
        </View>
        
        {/* Question */}
        <Animated.View
          style={[
            styles.questionContainer,
            {
              transform: [{ scale: questionScale }],
            },
          ]}
        >
          <Text style={styles.questionText}>{currentQuestion.question}</Text>
        </Animated.View>
        
        {/* Options */}
        <View style={styles.optionsContainer}>
          {['A', 'B', 'C', 'D'].map((option, index) => renderOption(option, index))}
        </View>
        
        {/* Skip Button */}
        {!selectedAnswer && (
          <TouchableOpacity
            style={styles.skipButton}
            onPress={handleNextQuestion}
          >
            <Text style={styles.skipText}>Skip Question</Text>
            <Icon name="chevron-right" size={20} color={Colors.textSecondary} />
          </TouchableOpacity>
        )}
        
        {/* Banner Ad - Shows in empty space below quiz */}
        <View style={styles.adContainer}>
          <BannerAdComponent />
        </View>
      </Animated.View>
      
      {/* Mascot */}
      {showMascot && mascotEnabled && (
        <Mascot
          type={mascotType}
          message={mascotMessage}
          onDismiss={() => setShowMascot(false)}
          onPress={handleMascotPress}
        />
      )}
      
      {/* Peeking Mascot */}
      {mascotEnabled && !showMascot && (
        <PeekingMascot
          onPress={() => {
            setMascotType('encouraging');
            setMascotMessage(`You're doing great! 💪\n\nCurrent streak: ${streakCount}\nTime earned: ${Math.floor(timeEarned / 60)}m ${timeEarned % 60}s`);
            setShowMascot(true);
          }}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? 10 : 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  backButton: {
    padding: 8,
  },
  headerInfo: {
    flex: 1,
    alignItems: 'center',
  },
  categoryText: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontFamily: Platform.select({
      ios: 'Noteworthy-Bold',
      android: 'sans-serif',
    }),
  },
  questionNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    marginTop: 2,
    fontFamily: Platform.select({
      ios: 'ArialRoundedMTBold',
      android: 'sans-serif-medium',
    }),
  },
  settingsButton: {
    padding: 8,
  },
  progressContainer: {
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#E0E0E0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 3,
  },
  statsBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginBottom: 20,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  statText: {
    marginLeft: 5,
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    fontFamily: Platform.select({
      ios: 'ArialRoundedMTBold',
      android: 'sans-serif-medium',
    }),
  },
  questionContainer: {
    backgroundColor: Colors.surface,
    marginHorizontal: 20,
    padding: 25,
    borderRadius: 20,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  questionText: {
    fontSize: 20,
    color: Colors.textPrimary,
    textAlign: 'center',
    lineHeight: 28,
    fontFamily: Platform.select({
      ios: 'ChalkboardSE-Regular',
      android: 'sans-serif-medium',
    }),
  },
  optionsContainer: {
    paddingHorizontal: 20,
  },
  optionContainer: {
    marginBottom: 12,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: 18,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  optionLabel: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  optionLetter: {
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: Platform.select({
      ios: 'ArialRoundedMTBold',
      android: 'sans-serif-medium',
    }),
  },
  optionText: {
    flex: 1,
    fontSize: 16,
    fontFamily: Platform.select({
      ios: 'Noteworthy-Bold',
      android: 'sans-serif',
    }),
  },
  optionIcon: {
    marginLeft: 10,
  },
  skipButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    paddingVertical: 10,
  },
  skipText: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginRight: 5,
    fontFamily: Platform.select({
      ios: 'Noteworthy-Bold',
      android: 'sans-serif',
    }),
  },
  adContainer: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  loadingText: {
    fontSize: 18,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 50,
  },
});

export default QuizScreen;
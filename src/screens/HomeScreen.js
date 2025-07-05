// src/screens/HomeScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Platform,
  Animated,
  Easing,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LinearGradient from 'react-native-linear-gradient';

// Import services
import EnhancedTimerService from '../services/EnhancedTimerService';
import QuizService from '../services/QuizService';
import ScoreService from '../services/ScoreService';
import SoundService from '../services/SoundService';
import DailyGoalsService from '../services/DailyGoalsService';
import AnalyticsService from '../services/AnalyticsService';
import AdMobService from '../services/AdMobService';

// Import components
import PeekingMascot from '../components/PeekingMascot';
import Mascot from '../components/Mascot';

const { width, height } = Dimensions.get('window');

const HomeScreen = ({ navigation }) => {
  const [availableTime, setAvailableTime] = useState(0);
  const [scoreInfo, setScoreInfo] = useState(null);
  const [categories, setCategories] = useState([]);
  const [showCategories, setShowCategories] = useState(false);
  const [dailyStreak, setDailyStreak] = useState(0);
  const [dailyGoals, setDailyGoals] = useState([]);
  const [hasPlayedToday, setHasPlayedToday] = useState(false);
  
  // Mascot states
  const [showMascot, setShowMascot] = useState(false);
  const [mascotType, setMascotType] = useState('happy');
  const [mascotMessage, setMascotMessage] = useState('');
  const [mascotEnabled, setMascotEnabled] = useState(true);
  
  // Animation values
  const fadeAnim = new Animated.Value(0);
  const scaleAnim = new Animated.Value(0.9);
  const slideAnim = new Animated.Value(height);
  
  // Difficulty animations
  const easyAnim = new Animated.Value(0);
  const mediumAnim = new Animated.Value(0);
  const hardAnim = new Animated.Value(0);
  
  useEffect(() => {
    const setupScreen = async () => {
      await loadSettings();
      await loadData();
      await loadCategories();
      
      // Start menu music
      SoundService.playMenuMusic();
      
      // Track screen view
      AnalyticsService.trackScreen('Home');
      
      // Animate entrance
      animateEntrance();
      
      // Show initial mascot message
      setTimeout(() => {
        showInitialMascotMessage();
      }, 1000);
    };
    
    setupScreen();
    
    // Set up timer listener
    const unsubscribe = EnhancedTimerService.addEventListener((timerData) => {
      setAvailableTime(timerData.availableTime);
    });
    
    // Set up daily reset listener
    ScoreService.setDailyResetCallback(handleDailyReset);
    
    // Refresh data on focus
    const focusListener = navigation.addListener('focus', () => {
      loadData();
      SoundService.playMenuMusic();
    });
    
    return () => {
      unsubscribe();
      focusListener();
      SoundService.stopMusic();
    };
  }, []);
  
  const animateEntrance = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.delay(200),
        Animated.spring(easyAnim, {
          toValue: 1,
          friction: 6,
          tension: 40,
          useNativeDriver: true,
        }),
      ]),
      Animated.sequence([
        Animated.delay(400),
        Animated.spring(mediumAnim, {
          toValue: 1,
          friction: 6,
          tension: 40,
          useNativeDriver: true,
        }),
      ]),
      Animated.sequence([
        Animated.delay(600),
        Animated.spring(hardAnim, {
          toValue: 1,
          friction: 6,
          tension: 40,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  };
  
  const loadData = async () => {
    try {
      // Load score info
      const score = ScoreService.getScoreInfo();
      setScoreInfo(score);
      
      // Load available time
      const time = EnhancedTimerService.getAvailableTime();
      setAvailableTime(time);
      
      // Load daily streak
      const streakData = await AsyncStorage.getItem('brainbites_daily_streak');
      if (streakData) {
        const parsed = JSON.parse(streakData);
        setDailyStreak(parsed.streak || 0);
        
        const today = new Date().toDateString();
        setHasPlayedToday(parsed.lastPlayedDate === today);
      }
      
      // Load daily goals
      const goals = await DailyGoalsService.getDailyGoals();
      setDailyGoals(goals);
      
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };
  
  const loadCategories = async () => {
    try {
      const cats = await QuizService.getCategories();
      if (cats && cats.length > 0) {
        setCategories(cats);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };
  
  const loadSettings = async () => {
    try {
      const mascotSetting = await AsyncStorage.getItem('brainbites_show_mascot');
      if (mascotSetting !== null) {
        setMascotEnabled(mascotSetting === 'true');
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };
  
  const showInitialMascotMessage = () => {
    if (!mascotEnabled) return;
    
    if (!hasPlayedToday) {
      setMascotType('happy');
      setMascotMessage(`Welcome back! 🌟\n\nReady to continue your learning journey?\nChoose a difficulty level to get started!`);
      setShowMascot(true);
    }
  };
  
  const showMascotMessage = (type, message) => {
    setMascotType(type);
    setMascotMessage(message);
    setShowMascot(true);
  };ot(true);
    }
  };
  
  const handleDifficultyPress = async (difficulty) => {
    SoundService.playButtonPress();
    setShowMascot(false);
    SoundService.stopMusic();
    
    navigation.navigate('Quiz', { 
      category: 'All',
      difficulty: difficulty 
    });
  };
  
  const handleCategoryPress = async (category) => {
    SoundService.playButtonPress();
    setShowMascot(false);
    SoundService.stopMusic();
    
    navigation.navigate('Quiz', { 
      category: category,
      difficulty: 'Mixed' 
    });
  };
  
  const toggleCategories = () => {
    SoundService.playButtonPress();
    
    if (showCategories) {
      // Hide categories
      Animated.timing(slideAnim, {
        toValue: height,
        duration: 300,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start(() => {
        setShowCategories(false);
      });
    } else {
      // Show categories
      setShowCategories(true);
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }).start();
    }
  };
  
  const handleDailyReset = async (resetData) => {
    SoundService.playStreak();
    
    let newStreak = dailyStreak;
    if (resetData.yesterdayScore > 0) {
      newStreak = dailyStreak + 1;
    } else {
      newStreak = 0;
    }
    
    const today = new Date().toDateString();
    const streakData = {
      streak: newStreak,
      lastPlayedDate: today
    };
    
    await AsyncStorage.setItem('brainbites_daily_streak', JSON.stringify(streakData));
    
    setDailyStreak(newStreak);
    setHasPlayedToday(false);
  };
  
  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };
  
  const handlePeekingMascotPress = () => {
    if (!mascotEnabled) return;
    
    const time = EnhancedTimerService.getAvailableTime();
    const formattedTime = formatTime(time);
    
    let message = `📊 Today's Stats:\n\n`;
    message += `🎯 Daily Score: ${(scoreInfo?.dailyScore ?? 0).toLocaleString()}\n`;
    message += `🔥 Current Streak: ${scoreInfo?.currentStreak ?? 0}\n`;
    message += `⏱️ Available Time: ${formattedTime}\n`;
    message += `📅 Daily Login Streak: ${dailyStreak} days\n\n`;
    message += `Keep up the great work! 💪`;
    
    setMascotType('happy');
    setMascotMessage(message);
    setShowMascot(true);
  };
  
  const renderDifficultyButton = (difficulty, color, icon, animValue) => {
    const gradientColors = {
      Easy: ['#4ECDC4', '#44B5AD'],
      Medium: ['#FFA726', '#FF9800'],
      Hard: ['#FF6B6B', '#FF5252']
    };
    
    return (
      <Animated.View
        style={[
          styles.difficultyButtonContainer,
          {
            opacity: animValue,
            transform: [{
              scale: animValue.interpolate({
                inputRange: [0, 1],
                outputRange: [0.8, 1],
              })
            }]
          }
        ]}
      >
        <TouchableOpacity
          style={styles.difficultyButton}
          onPress={() => handleDifficultyPress(difficulty)}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={gradientColors[difficulty]}
            style={styles.difficultyGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Icon name={icon} size={40} color="#FFF" />
            <Text style={styles.difficultyText}>{difficulty}</Text>
            <Text style={styles.difficultySubtext}>
              {difficulty === 'Easy' && '1-2 grade level'}
              {difficulty === 'Medium' && '3-5 grade level'}
              {difficulty === 'Hard' && '6+ grade level'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    );
  };
  
  const renderCategoryCard = (category, index) => {
    const categoryIcons = {
      'Science': 'flask',
      'Math': 'calculator',
      'History': 'book-open-variant',
      'Geography': 'earth',
      'Literature': 'bookshelf',
      'Technology': 'laptop',
      'Sports': 'basketball',
      'Art': 'palette',
      'Music': 'music-note',
      'General': 'head-question'
    };
    
    const categoryColors = [
      ['#667eea', '#764ba2'],
      ['#f093fb', '#f5576c'],
      ['#4facfe', '#00f2fe'],
      ['#43e97b', '#38f9d7'],
      ['#fa709a', '#fee140'],
      ['#30cfd0', '#330867'],
      ['#a8edea', '#fed6e3'],
      ['#ff9a9e', '#fecfef'],
    ];
    
    const colorIndex = index % categoryColors.length;
    
    return (
      <TouchableOpacity
        key={category}
        style={styles.categoryCard}
        onPress={() => handleCategoryPress(category)}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={categoryColors[colorIndex]}
          style={styles.categoryGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Icon name={categoryIcons[category] || 'help-circle'} size={32} color="#FFF" />
          <Text style={styles.categoryText}>{category}</Text>
        </LinearGradient>
      </TouchableOpacity>
    );
  };
  
  return (
    <View style={styles.container}>
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>BrainBites</Text>
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={() => {
              SoundService.playButtonPress();
              navigation.navigate('Settings');
            }}
          >
            <Icon name="cog" size={28} color="#333" />
          </TouchableOpacity>
        </View>
        
        {/* Stats Bar */}
        <View style={styles.statsBar}>
          <View style={styles.statItem}>
            <Icon name="timer" size={20} color="#FF9F1C" />
            <Text style={styles.statText}>{formatTime(availableTime)}</Text>
          </View>
          <View style={styles.statItem}>
            <Icon name="fire" size={20} color="#FF6B6B" />
            <Text style={styles.statText}>{dailyStreak} days</Text>
          </View>
          <View style={styles.statItem}>
            <Icon name="trophy" size={20} color="#4ECDC4" />
            <Text style={styles.statText}>{scoreInfo?.dailyScore || 0}</Text>
          </View>
        </View>
        
        {/* Watch Ad for Bonus Time */}
        <TouchableOpacity
          style={styles.watchAdButton}
          onPress={async () => {
            SoundService.playButtonPress();
            const reward = await AdMobService.showRewardedAd();
            if (reward) {
              // Give 5 minutes bonus time for watching ad
              await EnhancedTimerService.addBonusTime(300);
              showMascotMessage('celebration', 'Awesome! You earned 5 bonus minutes! 🎉\n\nEnjoy your extra time!');
              AnalyticsService.trackQuizEvent('watched_ad_for_time', { reward_seconds: 300 });
            }
          }}
        >
          <LinearGradient
            colors={['#00BBF9', '#0081CF']}
            style={styles.watchAdGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Icon name="play-circle" size={24} color="#FFF" />
            <Text style={styles.watchAdText}>Watch Ad for +5 min</Text>
          </LinearGradient>
        </TouchableOpacity>
        
        {/* Daily Goals Button */}
        <TouchableOpacity
          style={styles.dailyGoalsButton}
          onPress={() => {
            SoundService.playButtonPress();
            navigation.navigate('DailyGoals');
          }}
        >
          <LinearGradient
            colors={['#667eea', '#764ba2']}
            style={styles.dailyGoalsGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Icon name="target" size={24} color="#FFF" />
            <Text style={styles.dailyGoalsText}>Daily Goals</Text>
            <Icon name="chevron-right" size={24} color="#FFF" />
          </LinearGradient>
        </TouchableOpacity>
        
        {/* Difficulty Buttons */}
        <View style={styles.difficultyContainer}>
          <Text style={styles.sectionTitle}>Choose Your Level</Text>
          {renderDifficultyButton('Easy', '#4ECDC4', 'emoticon-happy', easyAnim)}
          {renderDifficultyButton('Medium', '#FFA726', 'emoticon-neutral', mediumAnim)}
          {renderDifficultyButton('Hard', '#FF6B6B', 'emoticon-cool', hardAnim)}
        </View>
        
        {/* Categories Button */}
        <TouchableOpacity
          style={styles.categoriesButton}
          onPress={toggleCategories}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#FF9F1C', '#FFB84D']}
            style={styles.categoriesGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Icon name="view-grid" size={24} color="#FFF" />
            <Text style={styles.categoriesText}>Categories</Text>
            <Icon 
              name={showCategories ? "chevron-down" : "chevron-up"} 
              size={24} 
              color="#FFF" 
            />
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
      
      {/* Categories Modal */}
      {showCategories && (
        <Animated.View 
          style={[
            styles.categoriesModal,
            {
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <View style={styles.categoriesHeader}>
            <Text style={styles.categoriesTitle}>Select a Category</Text>
            <TouchableOpacity onPress={toggleCategories}>
              <Icon name="close" size={28} color="#333" />
            </TouchableOpacity>
          </View>
          <ScrollView 
            style={styles.categoriesScroll}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.categoriesGrid}>
              {categories.map((category, index) => renderCategoryCard(category, index))}
            </View>
          </ScrollView>
        </Animated.View>
      )}
      
      {/* Mascot */}
      {showMascot && mascotEnabled && (
        <Mascot
          type={mascotType}
          message={mascotMessage}
          onDismiss={() => setShowMascot(false)}
        />
      )}
      
      {/* Peeking Mascot */}
      {mascotEnabled && (
        <PeekingMascot onPress={handlePeekingMascotPress} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFCF2',
  },
  content: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? 10 : 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FF9F1C',
    fontFamily: Platform.select({
      ios: 'ArialRoundedMTBold',
      android: 'sans-serif-medium',
    }),
  },
  settingsButton: {
    padding: 8,
  },
  statsBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#FFF',
    marginHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    marginBottom: 20,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    marginLeft: 5,
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    fontFamily: Platform.select({
      ios: 'Noteworthy-Bold',
      android: 'sans-serif-medium',
    }),
  },
  watchAdButton: {
    marginHorizontal: 20,
    marginBottom: 10,
  },
  watchAdGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 15,
  },
  watchAdText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
    marginLeft: 8,
    fontFamily: Platform.select({
      ios: 'ArialRoundedMTBold',
      android: 'sans-serif-medium',
    }),
  },
  dailyGoalsButton: {
    marginHorizontal: 20,
    marginBottom: 30,
  },
  dailyGoalsGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 15,
  },
  dailyGoalsText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
    flex: 1,
    marginLeft: 10,
    fontFamily: Platform.select({
      ios: 'ChalkboardSE-Regular',
      android: 'sans-serif-medium',
    }),
  },
  difficultyContainer: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
    fontFamily: Platform.select({
      ios: 'ChalkboardSE-Regular',
      android: 'sans-serif-medium',
    }),
  },
  difficultyButtonContainer: {
    marginBottom: 15,
  },
  difficultyButton: {
    width: '100%',
  },
  difficultyGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 25,
    borderRadius: 20,
  },
  difficultyText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
    marginLeft: 20,
    flex: 1,
    fontFamily: Platform.select({
      ios: 'ArialRoundedMTBold',
      android: 'sans-serif-medium',
    }),
  },
  difficultySubtext: {
    fontSize: 14,
    color: '#FFF',
    opacity: 0.9,
    fontFamily: Platform.select({
      ios: 'Noteworthy-Bold',
      android: 'sans-serif',
    }),
  },
  categoriesButton: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
  },
  categoriesGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 18,
    paddingHorizontal: 25,
    borderRadius: 25,
  },
  categoriesText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
    flex: 1,
    marginLeft: 10,
    fontFamily: Platform.select({
      ios: 'ArialRoundedMTBold',
      android: 'sans-serif-medium',
    }),
  },
  categoriesModal: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: height * 0.7,
    backgroundColor: '#FFF',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 10,
  },
  categoriesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 25,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  categoriesTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    fontFamily: Platform.select({
      ios: 'ChalkboardSE-Regular',
      android: 'sans-serif-medium',
    }),
  },
  categoriesScroll: {
    flex: 1,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 15,
    justifyContent: 'space-between',
  },
  categoryCard: {
    width: (width - 50) / 2,
    marginBottom: 15,
  },
  categoryGradient: {
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 100,
  },
  categoryText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
    marginTop: 8,
    textAlign: 'center',
    fontFamily: Platform.select({
      ios: 'Noteworthy-Bold',
      android: 'sans-serif-medium',
    }),
  },
});

export default HomeScreen;
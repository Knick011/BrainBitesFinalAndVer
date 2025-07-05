// src/screens/WelcomeScreen.js
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Platform,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import SoundService from '../services/SoundService';
import AnalyticsService from '../services/AnalyticsService';
import Mascot from '../components/Mascot';
import { Colors, Fonts, Layout, Animations } from '../utils/constants';

const { width, height } = Dimensions.get('window');

const WelcomeScreen = ({ navigation }) => {
  const [currentPage, setCurrentPage] = useState(0);
  const [showMascot, setShowMascot] = useState(false);
  const [mascotType, setMascotType] = useState('excited');
  const [mascotMessage, setMascotMessage] = useState('');
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const pageAnimations = useRef(
    [...Array(6)].map(() => new Animated.Value(0))
  ).current;
  
  // Scroll view ref
  const scrollViewRef = useRef(null);
  
  const pages = [
    {
      title: "Welcome to BrainBites!",
      subtitle: "Turn Learning into Your Superpower",
      description: "Hey there! Ready to make screen time work FOR you? With BrainBites, every question you answer correctly earns you more time to enjoy your favorite apps!",
      icon: "brain",
      gradient: [Colors.primary, Colors.primaryDark],
      mascotMessage: "Hey there, future genius! 🌟\n\nI'm CaBBy, your Brain Bites buddy! I'm SO excited to help you on this amazing learning journey!\n\nTogether, we'll make learning fun and rewarding! 🎉",
    },
    {
      title: "Learn & Earn Time",
      subtitle: "Knowledge = Freedom",
      description: "Here's the magic: Each correct answer gives you 30 seconds of app time! Build streaks of 5, 10, or more to earn bonus minutes. The more you learn, the more freedom you have!",
      icon: "timer-sand",
      gradient: [Colors.error, '#FF8A80'],
      mascotMessage: "Here's how the magic works! ✨\n\n🎯 Right answer = 30 seconds\n🔥 5-question streak = 2 bonus minutes\n📈 Keep learning = keep earning!\n\nIt's like leveling up in real life! 🎮",
    },
    {
      title: "Your Time, Your Choice",
      subtitle: "Use It However You Want",
      description: "Earned time is YOUR time! Use it on social media, games, videos - whatever makes you happy. You've earned it through learning, so enjoy it guilt-free!",
      icon: "heart-multiple",
      gradient: [Colors.secondary, Colors.secondaryDark],
      mascotMessage: "Time to enjoy yourself! 🎊\n\nYour earned time is YOURS to use:\n\n📱 Social apps\n🎮 Gaming\n📺 Videos\n\nYou earned it, you enjoy it! 😊",
    },
    {
      title: "Smart Time Management",
      subtitle: "Stay in Control",
      description: "When your earned time runs out, you'll get a friendly reminder. After a 5-minute buffer, you'll start losing points - but don't worry! Just answer a few questions to get back on track.",
      icon: "shield-check",
      gradient: [Colors.warning, '#FFB74D'],
      mascotMessage: "Quick heads up! ⚠️\n\nWhen earned time runs out, you get a 5-minute buffer. After that, you'll lose points slowly.\n\nBut hey - just answer a few questions and you're back in the green! No stress! 😌",
    },
    {
      title: "Mistakes Are Learning",
      subtitle: "No Penalty for Trying",
      description: "Wrong answers won't hurt your score - they just reset your streak. Every mistake is a chance to learn something new. The more you play, the smarter you get!",
      icon: "lightbulb-on",
      gradient: ['#667eea', '#764ba2'],
      mascotMessage: "Mistakes are your friends! 🤝\n\nWrong answers won't hurt your score. They're just:\n\n🧠 Learning opportunities\n💪 Chances to grow\n🎯 Steps to mastery\n\nEvery expert was once a beginner! ✨",
    },
    {
      title: "Ready to Start?",
      subtitle: "Your Journey Begins Now",
      description: "You're all set! Remember - this isn't about restriction, it's about balance. Learn, earn, enjoy, repeat. Let's make every moment count!",
      icon: "rocket-launch",
      gradient: [Colors.info, '#7986CB'],
      mascotMessage: "You're absolutely ready! 🚀\n\nThis is YOUR journey. Learn at your pace, earn your time, and have fun!\n\nI believe in you! Let's do this together! 💪✨",
    },
  ];
  
  useEffect(() => {
    // Start welcome music
    SoundService.playMenuMusic();
    
    // Track screen view
    AnalyticsService.trackScreen('Welcome', 'Onboarding');
    
    // Animate entrance
    animateEntrance();
    
    // Show mascot after delay
    setTimeout(() => {
      updateMascotForPage(0);
    }, 1500);
    
    return () => {
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
    ]).start(() => {
      animatePage(0);
    });
  };
  
  const animatePage = (pageIndex) => {
    Animated.spring(pageAnimations[pageIndex], {
      toValue: 1,
      friction: 8,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };
  
  const updateMascotForPage = (pageIndex) => {
    const page = pages[pageIndex];
    const mascotTypes = ['excited', 'happy', 'gamemode', 'thoughtful', 'encouraging', 'excited'];
    
    setMascotType(mascotTypes[pageIndex]);
    setMascotMessage(page.mascotMessage);
    setShowMascot(true);
  };
  
  const handleNext = () => {
    if (currentPage < pages.length - 1) {
      SoundService.playButtonPress();
      
      const nextPage = currentPage + 1;
      setCurrentPage(nextPage);
      
      // Animate progress
      Animated.timing(progressAnim, {
        toValue: (nextPage / (pages.length - 1)) * 100,
        duration: 300,
        useNativeDriver: false,
      }).start();
      
      // Scroll to next page
      scrollViewRef.current?.scrollTo({
        x: nextPage * width,
        animated: true,
      });
      
      // Animate new page
      setTimeout(() => {
        animatePage(nextPage);
        updateMascotForPage(nextPage);
      }, 300);
      
      // Track progress
      AnalyticsService.trackQuizEvent('onboarding_progress', {
        page: nextPage,
        total_pages: pages.length,
      });
    }
  };
  
  const handlePrevious = () => {
    if (currentPage > 0) {
      SoundService.playButtonPress();
      
      const prevPage = currentPage - 1;
      setCurrentPage(prevPage);
      
      // Animate progress
      Animated.timing(progressAnim, {
        toValue: (prevPage / (pages.length - 1)) * 100,
        duration: 300,
        useNativeDriver: false,
      }).start();
      
      // Scroll to previous page
      scrollViewRef.current?.scrollTo({
        x: prevPage * width,
        animated: true,
      });
      
      // Update mascot
      setTimeout(() => {
        updateMascotForPage(prevPage);
      }, 300);
    }
  };
  
  const handleGetStarted = async () => {
    SoundService.playSuccess();
    
    // Mark onboarding as complete
    await AsyncStorage.setItem('brainbites_onboarding_complete', 'true');
    
    // Track completion
    AnalyticsService.trackQuizEvent('onboarding_completed', {
      total_time: Date.now(),
    });
    
    // Navigate to home
    navigation.replace('Home');
  };
  
  const handleSkip = () => {
    SoundService.playButtonPress();
    
    // Jump to last page
    const lastPage = pages.length - 1;
    setCurrentPage(lastPage);
    
    scrollViewRef.current?.scrollTo({
      x: lastPage * width,
      animated: true,
    });
    
    // Animate progress
    Animated.timing(progressAnim, {
      toValue: 100,
      duration: 300,
      useNativeDriver: false,
    }).start();
    
    setTimeout(() => {
      animatePage(lastPage);
      updateMascotForPage(lastPage);
    }, 300);
  };
  
  const renderPage = (page, index) => {
    const isLastPage = index === pages.length - 1;
    
    return (
      <Animated.View
        key={index}
        style={[
          styles.page,
          {
            opacity: pageAnimations[index],
            transform: [{
              scale: pageAnimations[index].interpolate({
                inputRange: [0, 1],
                outputRange: [0.9, 1],
              }),
            }],
          },
        ]}
      >
        <LinearGradient
          colors={page.gradient}
          style={styles.pageGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.pageContent}>
            <View style={styles.iconContainer}>
              <Icon name={page.icon} size={80} color="#FFF" />
            </View>
            
            <Text style={styles.pageTitle}>{page.title}</Text>
            <Text style={styles.pageSubtitle}>{page.subtitle}</Text>
            <Text style={styles.pageDescription}>{page.description}</Text>
            
            {isLastPage && (
              <TouchableOpacity
                style={styles.getStartedButton}
                onPress={handleGetStarted}
                activeOpacity={0.8}
              >
                <Text style={styles.getStartedText}>Get Started!</Text>
                <Icon name="arrow-right" size={24} color={Colors.primary} />
              </TouchableOpacity>
            )}
          </View>
        </LinearGradient>
      </Animated.View>
    );
  };
  
  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        {/* Skip Button */}
        {currentPage < pages.length - 1 && (
          <TouchableOpacity
            style={styles.skipButton}
            onPress={handleSkip}
          >
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        )}
        
        {/* Pages */}
        <ScrollView
          ref={scrollViewRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          scrollEnabled={false}
          style={styles.scrollView}
        >
          {pages.map((page, index) => renderPage(page, index))}
        </ScrollView>
        
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
          <View style={styles.dots}>
            {pages.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.dot,
                  index === currentPage && styles.dotActive,
                ]}
              />
            ))}
          </View>
        </View>
        
        {/* Navigation Buttons */}
        {currentPage < pages.length - 1 && (
          <View style={styles.navigation}>
            <TouchableOpacity
              style={[styles.navButton, currentPage === 0 && styles.navButtonDisabled]}
              onPress={handlePrevious}
              disabled={currentPage === 0}
            >
              <Icon 
                name="chevron-left" 
                size={28} 
                color={currentPage === 0 ? '#CCC' : Colors.textPrimary} 
              />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.nextButton}
              onPress={handleNext}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[Colors.primary, Colors.primaryDark]}
                style={styles.nextButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.nextButtonText}>Next</Text>
                <Icon name="chevron-right" size={24} color="#FFF" />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}
      </Animated.View>
      
      {/* Mascot */}
      {showMascot && (
        <Mascot
          type={mascotType}
          message={mascotMessage}
          onDismiss={() => setShowMascot(false)}
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
  },
  skipButton: {
    position: 'absolute',
    top: Platform.OS === 'android' ? 20 : 50,
    right: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    zIndex: 10,
  },
  skipText: {
    fontSize: 16,
    color: '#FFF',
    fontFamily: Platform.select({
      ios: Fonts.accent.regular,
      android: Fonts.android.regular,
    }),
  },
  scrollView: {
    flex: 1,
  },
  page: {
    width: width,
    height: '100%',
  },
  pageGradient: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? 60 : 100,
    paddingBottom: 120,
  },
  pageContent: {
    flex: 1,
    paddingHorizontal: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  pageTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFF',
    textAlign: 'center',
    marginBottom: 10,
    fontFamily: Platform.select({
      ios: Fonts.primary.bold,
      android: Fonts.android.bold,
    }),
  },
  pageSubtitle: {
    fontSize: 20,
    color: '#FFF',
    textAlign: 'center',
    marginBottom: 20,
    opacity: 0.9,
    fontFamily: Platform.select({
      ios: Fonts.secondary.regular,
      android: Fonts.android.medium,
    }),
  },
  pageDescription: {
    fontSize: 16,
    color: '#FFF',
    textAlign: 'center',
    lineHeight: 24,
    opacity: 0.8,
    fontFamily: Platform.select({
      ios: Fonts.accent.regular,
      android: Fonts.android.regular,
    }),
  },
  getStartedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 30,
    marginTop: 40,
    ...Layout.shadow.large,
  },
  getStartedText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.primary,
    marginRight: 10,
    fontFamily: Platform.select({
      ios: Fonts.primary.bold,
      android: Fonts.android.bold,
    }),
  },
  progressContainer: {
    position: 'absolute',
    bottom: 80,
    left: 30,
    right: 30,
  },
  progressBar: {
    height: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 20,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    marginHorizontal: 4,
  },
  dotActive: {
    backgroundColor: Colors.primary,
    width: 24,
  },
  navigation: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  navButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    ...Layout.shadow.medium,
  },
  navButtonDisabled: {
    opacity: 0.5,
  },
  nextButton: {
    flex: 1,
    marginLeft: 20,
  },
  nextButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: 25,
    ...Layout.shadow.medium,
  },
  nextButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
    marginRight: 5,
    fontFamily: Platform.select({
      ios: Fonts.primary.bold,
      android: Fonts.android.bold,
    }),
  },
});

export default WelcomeScreen;
// src/screens/DailyGoalsScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Platform,
  RefreshControl,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import DailyGoalsService from '../services/DailyGoalsService';
import SoundService from '../services/SoundService';
import AnalyticsService from '../services/AnalyticsService';
import Mascot from '../components/Mascot';

const { width } = Dimensions.get('window');

const DailyGoalsScreen = ({ navigation }) => {
  const [goals, setGoals] = useState([]);
  const [completionStats, setCompletionStats] = useState({ total: 0, completed: 0, percentage: 0 });
  const [refreshing, setRefreshing] = useState(false);
  const [showMascot, setShowMascot] = useState(false);
  const [mascotMessage, setMascotMessage] = useState('');
  const [mascotType, setMascotType] = useState('happy');
  
  // Animation values
  const fadeAnim = new Animated.Value(0);
  const progressAnim = new Animated.Value(0);
  
  useEffect(() => {
    loadGoals();
    animateEntrance();
    
    // Track screen view
    AnalyticsService.trackScreen('DailyGoals');
    
    return () => {
      // Cleanup
    };
  }, []);
  
  const animateEntrance = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(progressAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  };
  
  const loadGoals = async () => {
    try {
      const dailyGoals = await DailyGoalsService.getDailyGoals();
      setGoals(dailyGoals);
      
      const stats = DailyGoalsService.getCompletionStats();
      setCompletionStats(stats);
      
      // Show mascot message based on completion
      if (stats.completed === 0) {
        showMascotMessage('excited', 'Ready to tackle today\'s goals? 🎯\n\nComplete challenges to earn bonus screen time!');
      } else if (stats.completed === stats.total) {
        showMascotMessage('celebration', 'AMAZING! You completed all daily goals! 🎉\n\nYou\'re a true BrainBites champion!');
      }
    } catch (error) {
      console.error('Error loading goals:', error);
    }
  };
  
  const showMascotMessage = (type, message) => {
    setMascotType(type);
    setMascotMessage(message);
    setShowMascot(true);
  };
  
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadGoals();
    setRefreshing(false);
  };
  
  const handleClaimReward = async (goalId) => {
    SoundService.playSuccess();
    
    const claimed = await DailyGoalsService.claimReward(goalId);
    if (claimed) {
      showMascotMessage('celebration', 'Reward claimed! 🎉\n\nEnjoy your bonus screen time!');
      await loadGoals();
    }
  };
  
  const renderGoalCard = (goal, index) => {
    const progress = goal.progress;
    const progressPercentage = Math.min((progress.current / goal.target) * 100, 100);
    const isCompleted = progress.completed;
    const canClaim = isCompleted && !progress.claimedReward;
    
    const cardAnim = new Animated.Value(0);
    
    Animated.sequence([
      Animated.delay(index * 100),
      Animated.spring(cardAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
    
    return (
      <Animated.View
        key={goal.id}
        style={[
          styles.goalCard,
          {
            opacity: cardAnim,
            transform: [{
              scale: cardAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.8, 1],
              }),
            }],
          },
        ]}
      >
        <LinearGradient
          colors={isCompleted ? ['#4ECDC4', '#44A39A'] : ['#FFF', '#F8F8F8']}
          style={styles.goalGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.goalHeader}>
            <View style={[styles.goalIconContainer, { backgroundColor: goal.color }]}>
              <Icon name={goal.icon} size={28} color="#FFF" />
            </View>
            <View style={styles.goalInfo}>
              <Text style={[styles.goalTitle, isCompleted && styles.completedText]}>
                {goal.title}
              </Text>
              <Text style={[styles.goalDescription, isCompleted && styles.completedText]}>
                {goal.description}
              </Text>
            </View>
            {isCompleted && (
              <Icon name="check-circle" size={32} color="#FFF" />
            )}
          </View>
          
          {/* Progress Bar */}
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <Animated.View
                style={[
                  styles.progressFill,
                  {
                    width: `${progressPercentage}%`,
                    backgroundColor: isCompleted ? '#FFF' : goal.color,
                  },
                ]}
              />
            </View>
            <Text style={[styles.progressText, isCompleted && styles.completedText]}>
              {progress.current} / {goal.target}
              {goal.type === 'time_earned' && ' seconds'}
              {goal.type === 'categories_played' && ' categories'}
              {goal.type === 'difficulties_played' && ' levels'}
            </Text>
          </View>
          
          {/* Reward Section */}
          <View style={styles.rewardSection}>
            <Icon 
              name="gift" 
              size={20} 
              color={isCompleted ? '#FFF' : '#666'} 
            />
            <Text style={[styles.rewardText, isCompleted && styles.completedText]}>
              {goal.reward}
            </Text>
            {canClaim && (
              <TouchableOpacity
                style={styles.claimButton}
                onPress={() => handleClaimReward(goal.id)}
                activeOpacity={0.8}
              >
                <Text style={styles.claimButtonText}>Claim</Text>
              </TouchableOpacity>
            )}
            {progress.claimedReward && (
              <View style={styles.claimedBadge}>
                <Icon name="check" size={16} color="#4ECDC4" />
                <Text style={styles.claimedText}>Claimed</Text>
              </View>
            )}
          </View>
        </LinearGradient>
      </Animated.View>
    );
  };
  
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            SoundService.playButtonPress();
            navigation.goBack();
          }}
        >
          <Icon name="arrow-left" size={28} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Daily Goals</Text>
        <View style={{ width: 44 }} />
      </View>
      
      {/* Progress Overview */}
      <Animated.View 
        style={[
          styles.progressOverview,
          {
            opacity: fadeAnim,
            transform: [{
              scale: progressAnim,
            }],
          },
        ]}
      >
        <LinearGradient
          colors={['#667eea', '#764ba2']}
          style={styles.overviewGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Text style={styles.overviewTitle}>Today's Progress</Text>
          <View style={styles.overviewStats}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{completionStats.completed}</Text>
              <Text style={styles.statLabel}>Completed</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{completionStats.total}</Text>
              <Text style={styles.statLabel}>Total Goals</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{completionStats.percentage}%</Text>
              <Text style={styles.statLabel}>Progress</Text>
            </View>
          </View>
          
          {/* Overall Progress Bar */}
          <View style={styles.overallProgressBar}>
            <Animated.View
              style={[
                styles.overallProgressFill,
                {
                  width: `${completionStats.percentage}%`,
                },
              ]}
            />
          </View>
        </LinearGradient>
      </Animated.View>
      
      {/* Goals List */}
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#FF9F1C']}
          />
        }
      >
        <Animated.View style={{ opacity: fadeAnim }}>
          {goals.map((goal, index) => renderGoalCard(goal, index))}
        </Animated.View>
        
        {/* Bottom Spacing */}
        <View style={{ height: 30 }} />
      </ScrollView>
      
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
    backgroundColor: '#FFFCF2',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 10 : 40,
    paddingBottom: 20,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    fontFamily: Platform.select({
      ios: 'ChalkboardSE-Regular',
      android: 'sans-serif-medium',
    }),
  },
  progressOverview: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  overviewGradient: {
    padding: 20,
    borderRadius: 20,
  },
  overviewTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 15,
    textAlign: 'center',
    fontFamily: Platform.select({
      ios: 'ArialRoundedMTBold',
      android: 'sans-serif-medium',
    }),
  },
  overviewStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFF',
    fontFamily: Platform.select({
      ios: 'ArialRoundedMTBold',
      android: 'sans-serif-medium',
    }),
  },
  statLabel: {
    fontSize: 14,
    color: '#FFF',
    opacity: 0.9,
    marginTop: 4,
    fontFamily: Platform.select({
      ios: 'Noteworthy-Bold',
      android: 'sans-serif',
    }),
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#FFF',
    opacity: 0.3,
  },
  overallProgressBar: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  overallProgressFill: {
    height: '100%',
    backgroundColor: '#FFF',
    borderRadius: 4,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  goalCard: {
    marginBottom: 15,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  goalGradient: {
    padding: 20,
    borderRadius: 20,
  },
  goalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  goalIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  goalInfo: {
    flex: 1,
  },
  goalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
    fontFamily: Platform.select({
      ios: 'ArialRoundedMTBold',
      android: 'sans-serif-medium',
    }),
  },
  goalDescription: {
    fontSize: 14,
    color: '#666',
    fontFamily: Platform.select({
      ios: 'Noteworthy-Bold',
      android: 'sans-serif',
    }),
  },
  completedText: {
    color: '#FFF',
  },
  progressContainer: {
    marginBottom: 15,
  },
  progressBar: {
    height: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 5,
  },
  progressText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'right',
    fontFamily: Platform.select({
      ios: 'Noteworthy-Bold',
      android: 'sans-serif',
    }),
  },
  rewardSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  rewardText: {
    flex: 1,
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
    fontFamily: Platform.select({
      ios: 'ChalkboardSE-Regular',
      android: 'sans-serif-medium',
    }),
  },
  claimButton: {
    backgroundColor: '#FFF',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  claimButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4ECDC4',
    fontFamily: Platform.select({
      ios: 'ArialRoundedMTBold',
      android: 'sans-serif-medium',
    }),
  },
  claimedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  claimedText: {
    fontSize: 12,
    color: '#4ECDC4',
    marginLeft: 4,
    fontWeight: '600',
    fontFamily: Platform.select({
      ios: 'Noteworthy-Bold',
      android: 'sans-serif-medium',
    }),
  },
});

export default DailyGoalsScreen;
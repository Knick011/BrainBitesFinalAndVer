// src/screens/LeaderboardScreen.js
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Animated,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import ScoreService from '../services/ScoreService';
import SoundService from '../services/SoundService';
import AnalyticsService from '../services/AnalyticsService';
import { Colors, Fonts, Layout } from '../utils/constants';

const LeaderboardScreen = ({ navigation }) => {
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState('weekly'); // weekly, monthly, allTime
  const [userRank, setUserRank] = useState(null);
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const listAnimations = useRef([]).current;
  
  useEffect(() => {
    loadLeaderboard();
    animateEntrance();
    
    // Track screen view
    AnalyticsService.trackScreen('Leaderboard');
  }, []);
  
  useEffect(() => {
    loadLeaderboard();
  }, [selectedTab]);
  
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
    ]).start();
  };
  
  const animateList = () => {
    const animations = leaderboardData.map((_, index) => {
      if (!listAnimations[index]) {
        listAnimations[index] = new Animated.Value(0);
      }
      
      return Animated.sequence([
        Animated.delay(index * 50),
        Animated.spring(listAnimations[index], {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
      ]);
    });
    
    Animated.parallel(animations).start();
  };
  
  const loadLeaderboard = async () => {
    try {
      // In a real app, this would fetch from a server with different time periods
      const data = await ScoreService.getLeaderboardData();
      
      // Simulate different data for different tabs
      let processedData = [...data];
      
      if (selectedTab === 'weekly') {
        // Simulate weekly scores (lower than all-time)
        processedData = data.map(entry => ({
          ...entry,
          score: Math.floor(entry.score * 0.3),
          streak: Math.min(entry.streak, 7),
        }));
      } else if (selectedTab === 'monthly') {
        // Simulate monthly scores
        processedData = data.map(entry => ({
          ...entry,
          score: Math.floor(entry.score * 0.7),
          streak: Math.min(entry.streak, 20),
        }));
      }
      
      // Sort by score
      processedData.sort((a, b) => b.score - a.score);
      
      // Add rank numbers
      processedData = processedData.map((entry, index) => ({
        ...entry,
        rank: index + 1,
      }));
      
      setLeaderboardData(processedData);
      
      // Find user's rank
      const userEntry = processedData.find(entry => entry.isCurrentUser);
      if (userEntry) {
        setUserRank(userEntry.rank);
      }
      
      // Animate list after data loads
      setTimeout(animateList, 100);
    } catch (error) {
      console.error('Error loading leaderboard:', error);
    }
  };
  
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadLeaderboard();
    setRefreshing(false);
  };
  
  const handleTabChange = (tab) => {
    SoundService.playButtonPress();
    setSelectedTab(tab);
    
    // Track tab change
    AnalyticsService.trackQuizEvent('leaderboard_tab_changed', { tab });
  };
  
  const renderTopThree = () => {
    const topThree = leaderboardData.slice(0, 3);
    if (topThree.length === 0) return null;
    
    const podiumOrder = [1, 0, 2]; // 2nd, 1st, 3rd place order for podium
    
    return (
      <View style={styles.topThreeContainer}>
        {podiumOrder.map((index) => {
          const entry = topThree[index];
          if (!entry) return <View key={index} style={styles.podiumPlaceholder} />;
          
          const isFirst = index === 0;
          const isSecond = index === 1;
          const isThird = index === 2;
          
          const height = isFirst ? 120 : isSecond ? 100 : 80;
          const crownIcon = isFirst ? 'crown' : isSecond ? 'medal' : 'award';
          const crownColor = isFirst ? '#FFD700' : isSecond ? '#C0C0C0' : '#CD7F32';
          
          return (
            <Animated.View
              key={entry.rank}
              style={[
                styles.podiumItem,
                {
                  opacity: listAnimations[index] || 1,
                  transform: [{
                    translateY: listAnimations[index]?.interpolate({
                      inputRange: [0, 1],
                      outputRange: [50, 0],
                    }) || 0,
                  }],
                },
              ]}
            >
              <View style={styles.podiumUser}>
                <View style={[styles.podiumAvatar, { backgroundColor: entry.color || Colors.primary }]}>
                  <Text style={styles.podiumAvatarText}>
                    {entry.name.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <Icon name={crownIcon} size={24} color={crownColor} style={styles.crownIcon} />
                <Text style={styles.podiumName} numberOfLines={1}>
                  {entry.name}
                </Text>
                <Text style={styles.podiumScore}>{entry.score.toLocaleString()}</Text>
              </View>
              <LinearGradient
                colors={[Colors.primary, Colors.primaryDark]}
                style={[styles.podium, { height }]}
              >
                <Text style={styles.podiumRank}>{entry.rank}</Text>
              </LinearGradient>
            </Animated.View>
          );
        })}
      </View>
    );
  };
  
  const renderLeaderboardItem = (entry, index) => {
    const isCurrentUser = entry.isCurrentUser;
    const showInList = entry.rank > 3;
    
    if (!showInList) return null;
    
    const animationIndex = index - 3; // Adjust for top 3
    
    return (
      <Animated.View
        key={entry.rank}
        style={[
          styles.leaderboardItem,
          isCurrentUser && styles.currentUserItem,
          {
            opacity: listAnimations[animationIndex] || 1,
            transform: [{
              translateX: listAnimations[animationIndex]?.interpolate({
                inputRange: [0, 1],
                outputRange: [50, 0],
              }) || 0,
            }],
          },
        ]}
      >
        <View style={styles.rankContainer}>
          <Text style={[styles.rankText, isCurrentUser && styles.currentUserText]}>
            #{entry.rank}
          </Text>
        </View>
        
        <View style={[styles.userAvatar, { backgroundColor: entry.color || Colors.secondary }]}>
          <Text style={styles.userAvatarText}>
            {entry.name.charAt(0).toUpperCase()}
          </Text>
        </View>
        
        <View style={styles.userInfo}>
          <Text style={[styles.userName, isCurrentUser && styles.currentUserText]}>
            {entry.name}
          </Text>
          <View style={styles.userStats}>
            <Icon name="fire" size={14} color={isCurrentUser ? Colors.primary : Colors.error} />
            <Text style={[styles.userStreak, isCurrentUser && styles.currentUserText]}>
              {entry.streak} streak
            </Text>
          </View>
        </View>
        
        <Text style={[styles.userScore, isCurrentUser && styles.currentUserText]}>
          {entry.score.toLocaleString()}
        </Text>
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
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              SoundService.playButtonPress();
              navigation.goBack();
            }}
          >
            <Icon name="arrow-left" size={28} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Leaderboard</Text>
          <TouchableOpacity style={styles.shareButton}>
            <Icon name="share-variant" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
        </View>
        
        {/* Tabs */}
        <View style={styles.tabs}>
          {['weekly', 'monthly', 'allTime'].map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, selectedTab === tab && styles.tabActive]}
              onPress={() => handleTabChange(tab)}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabText, selectedTab === tab && styles.tabTextActive]}>
                {tab === 'allTime' ? 'All Time' : tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        
        {/* Your Rank Card */}
        {userRank && (
          <LinearGradient
            colors={[Colors.primary, Colors.primaryDark]}
            style={styles.userRankCard}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Icon name="trophy" size={32} color="#FFF" />
            <View style={styles.userRankInfo}>
              <Text style={styles.userRankLabel}>Your Rank</Text>
              <Text style={styles.userRankNumber}>#{userRank}</Text>
            </View>
            <TouchableOpacity style={styles.improveButton}>
              <Text style={styles.improveButtonText}>Play to Improve</Text>
              <Icon name="chevron-right" size={20} color="#FFF" />
            </TouchableOpacity>
          </LinearGradient>
        )}
        
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[Colors.primary]}
            />
          }
        >
          {/* Top 3 Podium */}
          {renderTopThree()}
          
          {/* Rest of Leaderboard */}
          <View style={styles.leaderboardList}>
            {leaderboardData.map((entry, index) => renderLeaderboardItem(entry, index))}
          </View>
          
          {/* Empty State */}
          {leaderboardData.length === 0 && (
            <View style={styles.emptyState}>
              <Icon name="trophy-outline" size={80} color={Colors.textLight} />
              <Text style={styles.emptyStateText}>No leaderboard data yet</Text>
              <Text style={styles.emptyStateSubtext}>Be the first to set a high score!</Text>
            </View>
          )}
          
          {/* Bottom Spacing */}
          <View style={{ height: 50 }} />
        </ScrollView>
      </Animated.View>
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
    color: Colors.textPrimary,
    fontFamily: Platform.select({
      ios: Fonts.secondary.regular,
      android: Fonts.android.medium,
    }),
  },
  shareButton: {
    padding: 8,
  },
  tabs: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: '#F0F0F0',
    borderRadius: Layout.borderRadius.large,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: Layout.borderRadius.medium,
  },
  tabActive: {
    backgroundColor: Colors.surface,
    ...Layout.shadow.small,
  },
  tabText: {
    fontSize: 16,
    color: Colors.textSecondary,
    fontFamily: Platform.select({
      ios: Fonts.accent.regular,
      android: Fonts.android.regular,
    }),
  },
  tabTextActive: {
    color: Colors.primary,
    fontWeight: '600',
    fontFamily: Platform.select({
      ios: Fonts.primary.bold,
      android: Fonts.android.medium,
    }),
  },
  userRankCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    borderRadius: Layout.borderRadius.large,
    ...Layout.shadow.medium,
  },
  userRankInfo: {
    flex: 1,
    marginLeft: 15,
  },
  userRankLabel: {
    fontSize: 14,
    color: '#FFF',
    opacity: 0.9,
    fontFamily: Platform.select({
      ios: Fonts.accent.regular,
      android: Fonts.android.regular,
    }),
  },
  userRankNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFF',
    fontFamily: Platform.select({
      ios: Fonts.primary.bold,
      android: Fonts.android.bold,
    }),
  },
  improveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  improveButtonText: {
    fontSize: 14,
    color: '#FFF',
    marginRight: 5,
    fontFamily: Platform.select({
      ios: Fonts.accent.regular,
      android: Fonts.android.regular,
    }),
  },
  scrollView: {
    flex: 1,
  },
  topThreeContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 30,
  },
  podiumItem: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 10,
  },
  podiumPlaceholder: {
    flex: 1,
  },
  podiumUser: {
    alignItems: 'center',
    marginBottom: 10,
  },
  podiumAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 5,
  },
  podiumAvatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
    fontFamily: Platform.select({
      ios: Fonts.primary.bold,
      android: Fonts.android.bold,
    }),
  },
  crownIcon: {
    position: 'absolute',
    top: -10,
    right: 10,
  },
  podiumName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginTop: 5,
    fontFamily: Platform.select({
      ios: Fonts.accent.regular,
      android: Fonts.android.medium,
    }),
  },
  podiumScore: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.primary,
    fontFamily: Platform.select({
      ios: Fonts.primary.bold,
      android: Fonts.android.bold,
    }),
  },
  podium: {
    width: '100%',
    borderTopLeftRadius: Layout.borderRadius.medium,
    borderTopRightRadius: Layout.borderRadius.medium,
    justifyContent: 'center',
    alignItems: 'center',
  },
  podiumRank: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFF',
    fontFamily: Platform.select({
      ios: Fonts.primary.bold,
      android: Fonts.android.bold,
    }),
  },
  leaderboardList: {
    paddingHorizontal: 20,
  },
  leaderboardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: 15,
    borderRadius: Layout.borderRadius.medium,
    marginBottom: 10,
    ...Layout.shadow.small,
  },
  currentUserItem: {
    backgroundColor: `${Colors.primary}10`,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  rankContainer: {
    width: 40,
    alignItems: 'center',
  },
  rankText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textSecondary,
    fontFamily: Platform.select({
      ios: Fonts.primary.regular,
      android: Fonts.android.medium,
    }),
  },
  currentUserText: {
    color: Colors.primary,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  userAvatarText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
    fontFamily: Platform.select({
      ios: Fonts.primary.bold,
      android: Fonts.android.bold,
    }),
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    fontFamily: Platform.select({
      ios: Fonts.primary.regular,
      android: Fonts.android.medium,
    }),
  },
  userStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  userStreak: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginLeft: 4,
    fontFamily: Platform.select({
      ios: Fonts.accent.regular,
      android: Fonts.android.regular,
    }),
  },
  userScore: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    fontFamily: Platform.select({
      ios: Fonts.primary.bold,
      android: Fonts.android.bold,
    }),
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginTop: 20,
    fontFamily: Platform.select({
      ios: Fonts.primary.regular,
      android: Fonts.android.medium,
    }),
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: Colors.textLight,
    marginTop: 8,
    fontFamily: Platform.select({
      ios: Fonts.accent.regular,
      android: Fonts.android.regular,
    }),
  },
});

export default LeaderboardScreen;
// src/components/DailyGoalCard.js
import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import { Colors, Fonts, Layout } from '../utils/constants';

const DailyGoalCard = ({
  goal,
  progress,
  onClaim,
  index = 0,
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    // Entrance animation
    Animated.sequence([
      Animated.delay(index * 100),
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
    
    // Progress animation
    const progressPercentage = Math.min((progress.current / goal.target) * 100, 100);
    Animated.timing(progressAnim, {
      toValue: progressPercentage,
      duration: 800,
      delay: index * 100 + 200,
      useNativeDriver: false,
    }).start();
  }, [progress.current, goal.target]);
  
  const isCompleted = progress.completed;
  const canClaim = isCompleted && !progress.claimedReward;
  const progressPercentage = Math.min((progress.current / goal.target) * 100, 100);
  
  const handlePress = () => {
    if (canClaim && onClaim) {
      onClaim(goal.id);
    }
  };
  
  const formatProgress = () => {
    switch (goal.type) {
      case 'time_earned':
        const currentMinutes = Math.floor(progress.current / 60);
        const targetMinutes = Math.floor(goal.target / 60);
        return `${currentMinutes}/${targetMinutes} min`;
      case 'categories_played':
      case 'difficulties_played':
        return `${progress.current}/${goal.target}`;
      default:
        return `${progress.current}/${goal.target}`;
    }
  };
  
  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      <TouchableOpacity
        activeOpacity={canClaim ? 0.8 : 1}
        onPress={handlePress}
        disabled={!canClaim}
      >
        <LinearGradient
          colors={isCompleted ? [goal.color, adjustColor(goal.color, -20)] : ['#FFF', '#F8F8F8']}
          style={styles.card}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={[styles.iconContainer, { backgroundColor: isCompleted ? '#FFF' : goal.color }]}>
              <Icon
                name={goal.icon}
                size={28}
                color={isCompleted ? goal.color : '#FFF'}
              />
            </View>
            <View style={styles.titleContainer}>
              <Text style={[styles.title, isCompleted && styles.titleCompleted]}>
                {goal.title}
              </Text>
              <Text style={[styles.description, isCompleted && styles.descriptionCompleted]}>
                {goal.description}
              </Text>
            </View>
            {isCompleted && (
              <Icon name="check-circle" size={28} color="#FFF" />
            )}
          </View>
          
          {/* Progress Section */}
          <View style={styles.progressSection}>
            <View style={styles.progressBar}>
              <Animated.View
                style={[
                  styles.progressFill,
                  {
                    width: progressAnim.interpolate({
                      inputRange: [0, 100],
                      outputRange: ['0%', '100%'],
                    }),
                    backgroundColor: isCompleted ? '#FFF' : goal.color,
                  },
                ]}
              />
            </View>
            <Text style={[styles.progressText, isCompleted && styles.progressTextCompleted]}>
              {formatProgress()}
            </Text>
          </View>
          
          {/* Reward Section */}
          <View style={styles.rewardSection}>
            <View style={styles.rewardInfo}>
              <Icon
                name="gift"
                size={20}
                color={isCompleted ? '#FFF' : Colors.textSecondary}
              />
              <Text style={[styles.rewardText, isCompleted && styles.rewardTextCompleted]}>
                {goal.reward}
              </Text>
            </View>
            
            {canClaim && (
              <Animated.View
                style={[
                  styles.claimButton,
                  {
                    transform: [{
                      scale: fadeAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.8, 1],
                      }),
                    }],
                  },
                ]}
              >
                <LinearGradient
                  colors={['#FFF', '#F0F0F0']}
                  style={styles.claimButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0, y: 1 }}
                >
                  <Text style={styles.claimButtonText}>Claim Reward!</Text>
                </LinearGradient>
              </Animated.View>
            )}
            
            {progress.claimedReward && (
              <View style={styles.claimedBadge}>
                <Icon name="check" size={16} color={Colors.success} />
                <Text style={styles.claimedText}>Claimed</Text>
              </View>
            )}
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
};

// Helper function to adjust color brightness
const adjustColor = (color, amount) => {
  const clamp = (num) => Math.min(255, Math.max(0, num));
  
  // Convert hex to RGB
  const hex = color.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  
  // Adjust brightness
  const newR = clamp(r + amount);
  const newG = clamp(g + amount);
  const newB = clamp(b + amount);
  
  // Convert back to hex
  const toHex = (n) => n.toString(16).padStart(2, '0');
  return `#${toHex(newR)}${toHex(newG)}${toHex(newB)}`;
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 15,
    borderRadius: Layout.borderRadius.large,
    ...Layout.shadow.medium,
  },
  card: {
    padding: 20,
    borderRadius: Layout.borderRadius.large,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    marginBottom: 4,
    fontFamily: Platform.select({
      ios: Fonts.primary.bold,
      android: Fonts.android.bold,
    }),
  },
  titleCompleted: {
    color: '#FFF',
  },
  description: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontFamily: Platform.select({
      ios: Fonts.accent.regular,
      android: Fonts.android.regular,
    }),
  },
  descriptionCompleted: {
    color: '#FFF',
    opacity: 0.9,
  },
  progressSection: {
    marginBottom: 15,
  },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'right',
    fontFamily: Platform.select({
      ios: Fonts.accent.regular,
      android: Fonts.android.regular,
    }),
  },
  progressTextCompleted: {
    color: '#FFF',
    opacity: 0.9,
  },
  rewardSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  rewardInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  rewardText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginLeft: 8,
    fontFamily: Platform.select({
      ios: Fonts.secondary.regular,
      android: Fonts.android.medium,
    }),
  },
  rewardTextCompleted: {
    color: '#FFF',
    fontWeight: '600',
  },
  claimButton: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  claimButtonGradient: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  claimButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.primary,
    fontFamily: Platform.select({
      ios: Fonts.primary.bold,
      android: Fonts.android.bold,
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
    color: Colors.success,
    marginLeft: 4,
    fontWeight: '600',
    fontFamily: Platform.select({
      ios: Fonts.accent.regular,
      android: Fonts.android.medium,
    }),
  },
});

export default DailyGoalCard;
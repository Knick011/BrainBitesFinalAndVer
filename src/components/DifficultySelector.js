// src/components/DifficultySelector.js
import React, { useRef } from 'react';
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

const DifficultySelector = ({ 
  selectedDifficulty = 'Medium', 
  onSelect,
  showDescription = true 
}) => {
  const scaleAnims = useRef({
    Easy: new Animated.Value(1),
    Medium: new Animated.Value(1),
    Hard: new Animated.Value(1),
  }).current;
  
  const difficulties = [
    {
      level: 'Easy',
      icon: 'emoticon-happy',
      color: [Colors.easy, '#44B5AD'],
      description: '1-2 grade level',
      points: '+10 pts',
    },
    {
      level: 'Medium',
      icon: 'emoticon-neutral',
      color: [Colors.medium, '#FF9800'],
      description: '3-5 grade level',
      points: '+15 pts',
    },
    {
      level: 'Hard',
      icon: 'emoticon-cool',
      color: [Colors.hard, '#FF5252'],
      description: '6+ grade level',
      points: '+20 pts',
    },
  ];
  
  const handlePress = (level) => {
    // Animate selection
    Animated.sequence([
      Animated.timing(scaleAnims[level], {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnims[level], {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
    
    if (onSelect) {
      onSelect(level);
    }
  };
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Select Difficulty</Text>
      
      <View style={styles.difficulties}>
        {difficulties.map((diff) => {
          const isSelected = selectedDifficulty === diff.level;
          
          return (
            <Animated.View
              key={diff.level}
              style={[
                styles.difficultyWrapper,
                {
                  transform: [{ scale: scaleAnims[diff.level] }],
                },
              ]}
            >
              <TouchableOpacity
                onPress={() => handlePress(diff.level)}
                activeOpacity={0.8}
                style={styles.difficultyTouchable}
              >
                <LinearGradient
                  colors={isSelected ? diff.color : ['#F0F0F0', '#E0E0E0']}
                  style={[
                    styles.difficulty,
                    isSelected && styles.difficultySelected,
                  ]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Icon
                    name={diff.icon}
                    size={36}
                    color={isSelected ? '#FFF' : Colors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.difficultyLevel,
                      isSelected && styles.difficultyLevelSelected,
                    ]}
                  >
                    {diff.level}
                  </Text>
                  {showDescription && (
                    <>
                      <Text
                        style={[
                          styles.difficultyDescription,
                          isSelected && styles.difficultyDescriptionSelected,
                        ]}
                      >
                        {diff.description}
                      </Text>
                      <View style={styles.pointsBadge}>
                        <Text
                          style={[
                            styles.pointsText,
                            isSelected && styles.pointsTextSelected,
                          ]}
                        >
                          {diff.points}
                        </Text>
                      </View>
                    </>
                  )}
                  {isSelected && (
                    <Icon
                      name="check-circle"
                      size={20}
                      color="#FFF"
                      style={styles.checkIcon}
                    />
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: 20,
    fontFamily: Platform.select({
      ios: Fonts.secondary.bold,
      android: Fonts.android.medium,
    }),
  },
  difficulties: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
  },
  difficultyWrapper: {
    flex: 1,
    marginHorizontal: 5,
  },
  difficultyTouchable: {
    width: '100%',
  },
  difficulty: {
    paddingVertical: 20,
    paddingHorizontal: 10,
    borderRadius: Layout.borderRadius.large,
    alignItems: 'center',
    minHeight: 140,
    ...Layout.shadow.small,
  },
  difficultySelected: {
    ...Layout.shadow.medium,
  },
  difficultyLevel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.textSecondary,
    marginTop: 8,
    fontFamily: Platform.select({
      ios: Fonts.primary.bold,
      android: Fonts.android.bold,
    }),
  },
  difficultyLevelSelected: {
    color: '#FFF',
  },
  difficultyDescription: {
    fontSize: 11,
    color: Colors.textLight,
    marginTop: 4,
    textAlign: 'center',
    fontFamily: Platform.select({
      ios: Fonts.accent.regular,
      android: Fonts.android.regular,
    }),
  },
  difficultyDescriptionSelected: {
    color: '#FFF',
    opacity: 0.9,
  },
  pointsBadge: {
    marginTop: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 10,
  },
  pointsText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.textSecondary,
    fontFamily: Platform.select({
      ios: Fonts.primary.regular,
      android: Fonts.android.medium,
    }),
  },
  pointsTextSelected: {
    color: '#FFF',
  },
  checkIcon: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
});

export default DifficultySelector;
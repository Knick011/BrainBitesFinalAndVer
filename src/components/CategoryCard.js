// src/components/CategoryCard.js
import React, { useRef, useEffect } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  Animated,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import { Colors, Fonts, Layout, CategoryIcons } from '../utils/constants';

const CategoryCard = ({ 
  category, 
  onPress, 
  index = 0, 
  isSelected = false,
  questionCount = 0,
  color 
}) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    // Entrance animation
    Animated.sequence([
      Animated.delay(index * 50),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);
  
  const handlePressIn = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 0.95,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };
  
  const handlePressOut = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(rotateAnim, {
        toValue: 0,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };
  
  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '5deg'],
  });
  
  const defaultColors = ['#667eea', '#764ba2'];
  const gradientColors = color || defaultColors;
  
  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [
            { scale: scaleAnim },
            { rotate },
          ],
        },
      ]}
    >
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={styles.touchable}
      >
        <LinearGradient
          colors={gradientColors}
          style={[
            styles.card,
            isSelected && styles.cardSelected,
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Icon 
            name={CategoryIcons[category] || 'help-circle'} 
            size={40} 
            color="#FFF" 
          />
          <Text style={styles.categoryName}>{category}</Text>
          {questionCount > 0 && (
            <Text style={styles.questionCount}>{questionCount} questions</Text>
          )}
          {isSelected && (
            <Icon 
              name="check-circle" 
              size={24} 
              color="#FFF" 
              style={styles.checkIcon}
            />
          )}
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '47%',
    marginBottom: 15,
  },
  touchable: {
    width: '100%',
  },
  card: {
    padding: 20,
    borderRadius: Layout.borderRadius.large,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
    ...Layout.shadow.medium,
  },
  cardSelected: {
    borderWidth: 3,
    borderColor: '#FFF',
  },
  categoryName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
    marginTop: 10,
    textAlign: 'center',
    fontFamily: Platform.select({
      ios: Fonts.primary.bold,
      android: Fonts.android.bold,
    }),
  },
  questionCount: {
    fontSize: 12,
    color: '#FFF',
    opacity: 0.8,
    marginTop: 5,
    fontFamily: Platform.select({
      ios: Fonts.accent.regular,
      android: Fonts.android.regular,
    }),
  },
  checkIcon: {
    position: 'absolute',
    top: 10,
    right: 10,
  },
});

export default CategoryCard;
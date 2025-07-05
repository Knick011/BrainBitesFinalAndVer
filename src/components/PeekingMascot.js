// src/components/PeekingMascot.js
import React, { useEffect, useRef } from 'react';
import {
  View,
  TouchableOpacity,
  Animated,
  StyleSheet,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const PeekingMascot = ({ onPress, position = 'bottom-right' }) => {
  const slideAnim = useRef(new Animated.Value(100)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    // Slide in animation
    Animated.spring(slideAnim, {
      toValue: 0,
      friction: 8,
      tension: 40,
      delay: 1000,
      useNativeDriver: true,
    }).start();
    
    // Continuous bounce
    Animated.loop(
      Animated.sequence([
        Animated.timing(bounceAnim, {
          toValue: -5,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(bounceAnim, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
        }),
      ]),
    ).start();
    
    // Occasional wiggle
    const wiggle = () => {
      Animated.sequence([
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(rotateAnim, {
          toValue: -1,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(rotateAnim, {
          toValue: 0,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();
    };
    
    const wiggleInterval = setInterval(wiggle, 5000);
    
    return () => clearInterval(wiggleInterval);
  }, []);
  
  const getPositionStyle = () => {
    switch (position) {
      case 'bottom-right':
        return {
          bottom: 20,
          right: 20,
        };
      case 'bottom-left':
        return {
          bottom: 20,
          left: 20,
        };
      case 'top-right':
        return {
          top: Platform.OS === 'ios' ? 60 : 40,
          right: 20,
        };
      case 'top-left':
        return {
          top: Platform.OS === 'ios' ? 60 : 40,
          left: 20,
        };
      default:
        return {
          bottom: 20,
          right: 20,
        };
    }
  };
  
  const spin = rotateAnim.interpolate({
    inputRange: [-1, 1],
    outputRange: ['-10deg', '10deg'],
  });
  
  return (
    <Animated.View
      style={[
        styles.container,
        getPositionStyle(),
        {
          transform: [
            { translateY: slideAnim },
            { translateY: bounceAnim },
            { rotate: spin },
          ],
        },
      ]}
    >
      <TouchableOpacity
        style={styles.mascot}
        onPress={onPress}
        activeOpacity={0.8}
      >
        <View style={styles.mascotInner}>
          <Icon name="emoticon-happy" size={40} color="#FFF" />
          
          {/* Peeking eyes */}
          <View style={styles.eyes}>
            <View style={styles.eye} />
            <View style={styles.eye} />
          </View>
          
          {/* Speech indicator */}
          <View style={styles.speechIndicator}>
            <View style={styles.dot} />
            <View style={[styles.dot, styles.dotMiddle]} />
            <View style={styles.dot} />
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    zIndex: 999,
  },
  mascot: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#4ECDC4',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },
  mascotInner: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  eyes: {
    position: 'absolute',
    flexDirection: 'row',
    top: 20,
  },
  eye: {
    width: 6,
    height: 6,
    backgroundColor: '#333',
    borderRadius: 3,
    marginHorizontal: 6,
  },
  speechIndicator: {
    position: 'absolute',
    top: -20,
    right: -10,
    backgroundColor: '#FFF',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 4,
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  dot: {
    width: 4,
    height: 4,
    backgroundColor: '#666',
    borderRadius: 2,
    marginHorizontal: 1,
  },
  dotMiddle: {
    marginHorizontal: 2,
  },
});

export default PeekingMascot;
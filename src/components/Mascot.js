// src/components/Mascot.js
import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const { width, height } = Dimensions.get('window');

const Mascot = ({ type = 'happy', message = '', onDismiss, position = 'center' }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    // Entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
    
    // Continuous bounce animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(bounceAnim, {
          toValue: -10,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(bounceAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, []);
  
  const handleDismiss = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.8,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      if (onDismiss) onDismiss();
    });
  };
  
  const getMascotStyle = () => {
    switch (type) {
      case 'happy':
        return {
          backgroundColor: '#4ECDC4',
          icon: 'emoticon-happy',
        };
      case 'excited':
        return {
          backgroundColor: '#FFD93D',
          icon: 'emoticon-excited',
        };
      case 'sad':
        return {
          backgroundColor: '#6C8EBF',
          icon: 'emoticon-sad',
        };
      case 'thoughtful':
        return {
          backgroundColor: '#9B5DE5',
          icon: 'emoticon-neutral',
        };
      case 'encouraging':
        return {
          backgroundColor: '#F15BB5',
          icon: 'emoticon-wink',
        };
      case 'celebration':
        return {
          backgroundColor: '#00BBF9',
          icon: 'party-popper',
        };
      case 'gamemode':
        return {
          backgroundColor: '#FF6B6B',
          icon: 'gamepad-variant',
        };
      default:
        return {
          backgroundColor: '#4ECDC4',
          icon: 'emoticon-happy',
        };
    }
  };
  
  const mascotStyle = getMascotStyle();
  
  return (
    <TouchableOpacity
      style={styles.overlay}
      activeOpacity={1}
      onPress={handleDismiss}
    >
      <Animated.View
        style={[
          styles.container,
          position === 'bottom' && styles.bottomPosition,
          {
            opacity: fadeAnim,
            transform: [
              { scale: scaleAnim },
              { translateY: bounceAnim },
            ],
          },
        ]}
      >
        <TouchableOpacity
          style={styles.content}
          activeOpacity={0.95}
          onPress={(e) => e.stopPropagation()}
        >
          {/* Mascot Character */}
          <View style={[styles.mascot, { backgroundColor: mascotStyle.backgroundColor }]}>
            <Icon name={mascotStyle.icon} size={60} color="#FFF" />
            
            {/* Eyes animation */}
            <View style={styles.eyes}>
              <View style={styles.eye} />
              <View style={styles.eye} />
            </View>
          </View>
          
          {/* Speech Bubble */}
          <View style={styles.speechBubble}>
            <View style={styles.speechBubbleArrow} />
            <Text style={styles.message}>{message}</Text>
          </View>
          
          {/* Close button */}
          <TouchableOpacity
            style={styles.closeButton}
            onPress={handleDismiss}
          >
            <Icon name="close" size={24} color="#666" />
          </TouchableOpacity>
        </TouchableOpacity>
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  container: {
    width: width * 0.9,
    maxWidth: 400,
  },
  bottomPosition: {
    position: 'absolute',
    bottom: 100,
  },
  content: {
    alignItems: 'center',
  },
  mascot: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: -20,
    zIndex: 2,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  eyes: {
    position: 'absolute',
    flexDirection: 'row',
    top: 35,
  },
  eye: {
    width: 8,
    height: 8,
    backgroundColor: '#333',
    borderRadius: 4,
    marginHorizontal: 8,
  },
  speechBubble: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 20,
    paddingTop: 30,
    minHeight: 150,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  speechBubbleArrow: {
    position: 'absolute',
    top: -10,
    left: '50%',
    marginLeft: -10,
    width: 0,
    height: 0,
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderBottomWidth: 10,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#FFF',
  },
  message: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    lineHeight: 24,
    fontFamily: Platform.select({
      ios: 'ChalkboardSE-Regular',
      android: 'sans-serif',
    }),
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    padding: 5,
  },
});

export default Mascot;
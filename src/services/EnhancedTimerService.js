// src/services/EnhancedTimerService.js
import AsyncStorage from '@react-native-async-storage/async-storage';
// Note: BackgroundTimer functionality is integrated into the notification system
import NotificationService from './NotificationService';
import ScoreService from './ScoreService';
import { AppState } from 'react-native';

class EnhancedTimerService {
  constructor() {
    this.STORAGE_KEY = 'brainbites_timer_data';
    this.listeners = [];
    this.timerData = {
      availableTime: 0,
      totalEarnedTime: 0,
      lastUpdateTime: Date.now(),
      isTimerRunning: false,
      currentAppStartTime: null,
      overtimeBuffer: 300, // 5 minute buffer before negative scoring
    };
    this.backgroundTimer = null;
    this.appStateListener = null;
    this.updateInterval = null;
  }

  async initialize() {
    await this.loadSavedData();
    this.setupAppStateListener();
    this.startUpdateInterval();
    
    // Update notification on init
    this.updateNotification();
  }

  async loadSavedData() {
    try {
      const savedData = await AsyncStorage.getItem(this.STORAGE_KEY);
      if (savedData) {
        const parsed = JSON.parse(savedData);
        this.timerData = { ...this.timerData, ...parsed };
        
        // Update time based on elapsed time while app was closed
        if (this.timerData.isTimerRunning && this.timerData.lastUpdateTime) {
          const elapsed = Math.floor((Date.now() - this.timerData.lastUpdateTime) / 1000);
          this.timerData.availableTime -= elapsed;
          this.timerData.isTimerRunning = false; // Stop timer on app restart
        }
      }
    } catch (error) {
      console.error('Error loading timer data:', error);
    }
  }

  async saveData() {
    try {
      const dataToSave = {
        ...this.timerData,
        lastUpdateTime: Date.now(),
      };
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(dataToSave));
    } catch (error) {
      console.error('Error saving timer data:', error);
    }
  }

  setupAppStateListener() {
    this.appStateListener = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'background' || nextAppState === 'inactive') {
        // App going to background
        if (this.timerData.isTimerRunning) {
          this.startBackgroundTimer();
        }
      } else if (nextAppState === 'active') {
        // App coming to foreground
        this.stopBackgroundTimer();
        if (this.timerData.isTimerRunning) {
          this.updateTimerFromBackground();
        }
      }
    });
  }

  startUpdateInterval() {
    // Update every second when app is active
    this.updateInterval = setInterval(() => {
      if (this.timerData.isTimerRunning) {
        this.updateTimer();
      }
    }, 1000);
  }

  startBackgroundTimer() {
    // When app goes to background, the persistent notification will show the timer
    // No need for actual background timer as the notification handles display
    this.saveData();
  }

  stopBackgroundTimer() {
    // Notification will be updated when app comes back
    this.updateTimerFromBackground();
  }

  updateTimerFromBackground() {
    // Calculate time elapsed while in background
    const elapsed = Math.floor((Date.now() - this.timerData.lastUpdateTime) / 1000);
    if (elapsed > 0) {
      this.timerData.availableTime -= elapsed;
      this.notifyListeners();
      this.updateNotification();
    }
  }

  updateTimer() {
    if (!this.timerData.isTimerRunning) return;
    
    this.timerData.availableTime -= 1;
    
    // Check for overtime and handle negative scoring
    if (this.timerData.availableTime < -this.timerData.overtimeBuffer) {
      // User has exceeded buffer, start negative scoring
      ScoreService.handleOvertimeUsage(Math.abs(this.timerData.availableTime));
    }
    
    // Warning notifications
    if (this.timerData.availableTime === 300) { // 5 minutes warning
      NotificationService.showTimeWarningNotification(5);
    } else if (this.timerData.availableTime === 60) { // 1 minute warning
      NotificationService.showTimeWarningNotification(1);
    }
    
    this.saveData();
    this.notifyListeners();
    this.updateNotification();
  }

  startAppTimer(appId) {
    this.timerData.isTimerRunning = true;
    this.timerData.currentAppStartTime = Date.now();
    this.saveData();
    this.notifyListeners();
  }

  stopAppTimer() {
    this.timerData.isTimerRunning = false;
    this.timerData.currentAppStartTime = null;
    this.saveData();
    this.notifyListeners();
    this.updateNotification();
  }

  addEarnedTime(seconds) {
    this.timerData.availableTime += seconds;
    this.timerData.totalEarnedTime += seconds;
    this.saveData();
    this.notifyListeners();
    this.updateNotification();
    
    return this.timerData.availableTime;
  }

  addBonusTime(seconds) {
    return this.addEarnedTime(seconds);
  }

  getAvailableTime() {
    return this.timerData.availableTime;
  }

  getTotalEarnedTime() {
    return this.timerData.totalEarnedTime;
  }

  isTimerRunning() {
    return this.timerData.isTimerRunning;
  }

  getTimerStatus() {
    return {
      availableTime: this.timerData.availableTime,
      isRunning: this.timerData.isTimerRunning,
      isOvertime: this.timerData.availableTime < 0,
      inBuffer: this.timerData.availableTime < 0 && this.timerData.availableTime > -this.timerData.overtimeBuffer,
      totalEarned: this.timerData.totalEarnedTime,
    };
  }

  formatTime(seconds) {
    const absSeconds = Math.abs(seconds);
    const hours = Math.floor(absSeconds / 3600);
    const minutes = Math.floor((absSeconds % 3600) / 60);
    const secs = absSeconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  }

  updateNotification() {
    const isNegative = this.timerData.availableTime < 0;
    NotificationService.updatePersistentTimerNotification(
      this.timerData.availableTime,
      isNegative
    );
  }

  addEventListener(callback) {
    this.listeners.push(callback);
    
    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback);
    };
  }

  notifyListeners() {
    const status = this.getTimerStatus();
    this.listeners.forEach(listener => {
      try {
        listener(status);
      } catch (error) {
        console.error('Error in timer listener:', error);
      }
    });
  }

  async reset() {
    this.timerData = {
      availableTime: 0,
      totalEarnedTime: 0,
      lastUpdateTime: Date.now(),
      isTimerRunning: false,
      currentAppStartTime: null,
      overtimeBuffer: 300,
    };
    
    await this.saveData();
    this.notifyListeners();
    NotificationService.clearPersistentTimerNotification();
  }

  cleanup() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
    if (this.appStateListener) {
      this.appStateListener.remove();
    }
    this.stopBackgroundTimer();
    NotificationService.clearPersistentTimerNotification();
  }
}

export default new EnhancedTimerService();
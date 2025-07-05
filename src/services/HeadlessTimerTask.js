// src/services/HeadlessTimerTask.js
import { AppRegistry } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NotificationService from './NotificationService';

const TimerHeadlessTask = async () => {
  try {
    // Get current timer data
    const timerData = await AsyncStorage.getItem('brainbites_timer_data');
    if (!timerData) return;
    
    const data = JSON.parse(timerData);
    
    // Only update if timer is running
    if (!data.isTimerRunning) return;
    
    // Calculate elapsed time
    const now = Date.now();
    const elapsed = Math.floor((now - data.lastUpdateTime) / 1000);
    
    // Update available time
    data.availableTime -= elapsed;
    data.lastUpdateTime = now;
    
    // Save updated data
    await AsyncStorage.setItem('brainbites_timer_data', JSON.stringify(data));
    
    // Update notification
    const isNegative = data.availableTime < 0;
    NotificationService.updatePersistentTimerNotification(
      data.availableTime,
      isNegative
    );
    
  } catch (error) {
    console.error('Error in headless timer task:', error);
  }
};

// Register the headless task
AppRegistry.registerHeadlessTask('TimerHeadlessTask', () => TimerHeadlessTask);

export default TimerHeadlessTask;
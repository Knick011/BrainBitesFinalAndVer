// src/services/NotificationService.js
import PushNotification from 'react-native-push-notification';
import { Platform } from 'react-native';

class NotificationService {
  constructor() {
    this.configured = false;
    this.persistentNotificationId = 999999; // Special ID for persistent timer
  }

  initialize() {
    if (this.configured) return;

    PushNotification.configure({
      onRegister: function (token) {
        console.log('Notification TOKEN:', token);
      },

      onNotification: function (notification) {
        console.log('NOTIFICATION:', notification);
        
        // Handle notification tap
        if (notification.userInteraction) {
          // User tapped on notification
          console.log('User tapped notification');
        }
        
        // Required on iOS
        notification.finish(PushNotificationIOS.FetchResult.NoData);
      },

      onAction: function (notification) {
        console.log('ACTION:', notification.action);
        console.log('NOTIFICATION:', notification);
      },

      onRegistrationError: function(err) {
        console.error(err.message, err);
      },

      permissions: {
        alert: true,
        badge: true,
        sound: true,
      },

      popInitialNotification: true,
      requestPermissions: Platform.OS === 'ios',
    });

    // Create notification channels for Android
    if (Platform.OS === 'android') {
      // Silent channel for persistent timer
      PushNotification.createChannel(
        {
          channelId: 'brainbites-timer-silent',
          channelName: 'Timer Updates',
          channelDescription: 'Silent updates for screen time timer',
          playSound: false,
          soundName: null,
          importance: 2, // Low importance for silent notifications
          vibrate: false,
        },
        (created) => console.log(`Silent channel created: ${created}`)
      );

      // Normal channel for other notifications
      PushNotification.createChannel(
        {
          channelId: 'brainbites-default',
          channelName: 'BrainBites Notifications',
          channelDescription: 'General notifications from BrainBites',
          playSound: true,
          soundName: 'default',
          importance: 4, // High importance
          vibrate: true,
        },
        (created) => console.log(`Default channel created: ${created}`)
      );

      // Rewards channel
      PushNotification.createChannel(
        {
          channelId: 'brainbites-rewards',
          channelName: 'Rewards & Achievements',
          channelDescription: 'Notifications for earned rewards and achievements',
          playSound: true,
          soundName: 'default',
          importance: 4,
          vibrate: true,
        },
        (created) => console.log(`Rewards channel created: ${created}`)
      );
    }

    this.configured = true;
    console.log('NotificationService initialized');
  }

  // Update persistent timer notification (SILENT)
  updatePersistentTimerNotification(availableTime, isNegative = false) {
    const hours = Math.floor(Math.abs(availableTime) / 3600);
    const minutes = Math.floor((Math.abs(availableTime) % 3600) / 60);
    const seconds = Math.abs(availableTime) % 60;
    
    let timeString = '';
    if (hours > 0) {
      timeString = `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      timeString = `${minutes}m ${seconds}s`;
    } else {
      timeString = `${seconds}s`;
    }
    
    let title = 'BrainBites Timer';
    let message = '';
    
    if (isNegative) {
      title = '⚠️ Overtime Alert';
      message = `You're ${timeString} over! Answer questions to earn more time.`;
    } else if (availableTime === 0) {
      title = '⏰ Time\'s Up!';
      message = 'Answer some questions to earn more screen time!';
    } else {
      title = '⏱️ Screen Time Available';
      message = `${timeString} remaining`;
    }

    PushNotification.localNotification({
      id: this.persistentNotificationId,
      channelId: 'brainbites-timer-silent', // Use silent channel
      title: title,
      message: message,
      ongoing: true, // Makes it persistent on Android
      autoCancel: false,
      playSound: false, // Silent
      vibrate: false, // No vibration
      priority: 'low', // Low priority for silent
      smallIcon: 'ic_notification',
      largeIcon: 'ic_launcher',
      color: isNegative ? '#FF6B6B' : '#4ECDC4',
      actions: ['Open App', 'Dismiss'],
      invokeApp: false,
      when: null, // Hide timestamp
      usesChronometer: false,
      timeoutAfter: null, // Never timeout
    });
  }

  // Clear persistent timer notification
  clearPersistentTimerNotification() {
    PushNotification.cancelLocalNotification(this.persistentNotificationId.toString());
  }

  // Show achievement notification (NORMAL - with sound)
  showAchievementNotification(title, message, data = {}) {
    PushNotification.localNotification({
      channelId: 'brainbites-rewards',
      title: `🏆 ${title}`,
      message: message,
      playSound: true,
      soundName: 'default',
      vibrate: true,
      priority: 'high',
      smallIcon: 'ic_notification',
      largeIcon: 'ic_launcher',
      color: '#FFD700',
      bigText: message,
      subText: 'Achievement Unlocked',
      ...data,
    });
  }

  // Show daily goal completion (NORMAL - with sound)
  showDailyGoalNotification(goalTitle, reward) {
    PushNotification.localNotification({
      channelId: 'brainbites-rewards',
      title: '🎯 Daily Goal Complete!',
      message: `You completed "${goalTitle}" and earned ${reward}!`,
      playSound: true,
      soundName: 'default',
      vibrate: true,
      priority: 'high',
      smallIcon: 'ic_notification',
      largeIcon: 'ic_launcher',
      color: '#4ECDC4',
      bigText: `Congratulations! You completed "${goalTitle}" and earned ${reward}! Keep up the great work!`,
      subText: 'Daily Goal',
    });
  }

  // Show streak milestone (NORMAL - with sound)
  showStreakNotification(streakCount) {
    const messages = {
      5: 'You\'re on fire! 5 correct answers in a row!',
      10: 'Incredible! 10 question streak!',
      15: 'Unstoppable! 15 questions mastered!',
      20: 'Legendary! 20 correct answers!',
      25: 'Mind-blowing! 25 question streak!',
      30: 'You\'re a genius! 30 in a row!',
    };

    const message = messages[streakCount] || `Amazing ${streakCount} question streak!`;

    PushNotification.localNotification({
      channelId: 'brainbites-rewards',
      title: '🔥 Streak Milestone!',
      message: message,
      playSound: true,
      soundName: 'default',
      vibrate: true,
      priority: 'high',
      smallIcon: 'ic_notification',
      largeIcon: 'ic_launcher',
      color: '#FF6B6B',
      bigText: message + ' You earned 2 bonus minutes!',
      subText: 'Streak Bonus',
    });
  }

  // Show time warning (NORMAL - with sound)
  showTimeWarningNotification(minutesLeft) {
    PushNotification.localNotification({
      channelId: 'brainbites-default',
      title: '⏰ Time Running Low',
      message: `Only ${minutesLeft} minutes left! Answer questions to earn more time.`,
      playSound: true,
      soundName: 'default',
      vibrate: true,
      priority: 'high',
      smallIcon: 'ic_notification',
      largeIcon: 'ic_launcher',
      color: '#FFA726',
      actions: ['Play Quiz', 'Remind Later'],
    });
  }

  // Show daily reminder (NORMAL - with sound)
  scheduleDailyReminder(hour = 15, minute = 0) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(hour, minute, 0, 0);

    PushNotification.localNotificationSchedule({
      channelId: 'brainbites-default',
      title: '🧠 Time to BrainBite!',
      message: 'Ready to learn something new and earn screen time?',
      date: tomorrow,
      playSound: true,
      soundName: 'default',
      vibrate: true,
      priority: 'high',
      smallIcon: 'ic_notification',
      largeIcon: 'ic_launcher',
      color: '#FF9F1C',
      repeatType: 'day',
      repeatTime: 1,
    });
  }

  // Cancel all notifications
  cancelAllNotifications() {
    PushNotification.cancelAllLocalNotifications();
  }

  // Get scheduled notifications
  getScheduledNotifications(callback) {
    PushNotification.getScheduledLocalNotifications(callback);
  }

  // Check permissions
  checkPermissions(callback) {
    PushNotification.checkPermissions(callback);
  }

  // Request permissions
  requestPermissions() {
    PushNotification.requestPermissions();
  }

  // Set application badge number (iOS)
  setApplicationBadgeNumber(number) {
    PushNotification.setApplicationIconBadgeNumber(number);
  }
}

export default new NotificationService();
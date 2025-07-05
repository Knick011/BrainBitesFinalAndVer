// src/services/AppLauncherService.js
import { Linking, Alert, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import EnhancedTimerService from './EnhancedTimerService';
import AnalyticsService from './AnalyticsService';

// Popular app URL schemes
const APP_SCHEMES = {
  // Social Media
  instagram: 'instagram://user?username=',
  facebook: 'fb://profile',
  twitter: 'twitter://user?screen_name=',
  tiktok: 'tiktok://user',
  snapchat: 'snapchat://user',
  whatsapp: 'whatsapp://send',
  
  // Gaming
  roblox: 'roblox://',
  minecraft: 'minecraft://',
  pubg: 'pubg://',
  fortnite: 'fortnite://',
  
  // Video
  youtube: 'youtube://',
  netflix: 'netflix://',
  twitch: 'twitch://',
  
  // Others
  spotify: 'spotify://',
  discord: 'discord://',
};

class AppLauncherService {
  constructor() {
    this.trackedApps = [];
    this.STORAGE_KEY = 'brainbites_tracked_apps';
  }

  async initialize() {
    await this.loadTrackedApps();
  }

  async loadTrackedApps() {
    try {
      const saved = await AsyncStorage.getItem(this.STORAGE_KEY);
      if (saved) {
        this.trackedApps = JSON.parse(saved);
      }
    } catch (error) {
      console.error('Error loading tracked apps:', error);
    }
  }

  async saveTrackedApps() {
    try {
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.trackedApps));
    } catch (error) {
      console.error('Error saving tracked apps:', error);
    }
  }

  // Launch an app if user has time available
  async launchApp(appId) {
    const availableTime = EnhancedTimerService.getAvailableTime();
    
    if (availableTime <= 0) {
      Alert.alert(
        'No Time Available',
        'You need to earn more screen time by answering questions!',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Play Quiz', onPress: () => this.navigateToQuiz() }
        ]
      );
      return false;
    }

    const scheme = APP_SCHEMES[appId];
    if (!scheme) {
      Alert.alert('App Not Supported', 'This app is not in our supported list yet.');
      return false;
    }

    try {
      const canOpen = await Linking.canOpenURL(scheme);
      if (canOpen) {
        await Linking.openURL(scheme);
        
        // Start timer for this app
        EnhancedTimerService.startAppTimer(appId);
        
        // Track app launch
        AnalyticsService.trackQuizEvent('app_launched', {
          app_id: appId,
          available_time: availableTime,
        });
        
        // Add to tracked apps
        this.addTrackedApp(appId);
        
        return true;
      } else {
        Alert.alert('App Not Installed', `${appId} doesn't seem to be installed on your device.`);
        return false;
      }
    } catch (error) {
      console.error('Error launching app:', error);
      Alert.alert('Error', 'Failed to launch the app.');
      return false;
    }
  }

  // Add app to tracked list
  async addTrackedApp(appId) {
    if (!this.trackedApps.some(app => app.id === appId)) {
      this.trackedApps.push({
        id: appId,
        lastUsed: Date.now(),
        useCount: 1,
      });
    } else {
      const app = this.trackedApps.find(app => app.id === appId);
      app.lastUsed = Date.now();
      app.useCount++;
    }
    
    // Sort by use count
    this.trackedApps.sort((a, b) => b.useCount - a.useCount);
    
    await this.saveTrackedApps();
  }

  // Get list of available apps
  getAvailableApps() {
    return Object.keys(APP_SCHEMES).map(id => ({
      id,
      name: this.getAppDisplayName(id),
      icon: this.getAppIcon(id),
    }));
  }

  // Get frequently used apps
  getFrequentApps(limit = 5) {
    return this.trackedApps.slice(0, limit);
  }

  getAppDisplayName(appId) {
    const names = {
      instagram: 'Instagram',
      facebook: 'Facebook',
      twitter: 'Twitter',
      tiktok: 'TikTok',
      snapchat: 'Snapchat',
      whatsapp: 'WhatsApp',
      youtube: 'YouTube',
      netflix: 'Netflix',
      spotify: 'Spotify',
      discord: 'Discord',
      roblox: 'Roblox',
      minecraft: 'Minecraft',
      pubg: 'PUBG',
      fortnite: 'Fortnite',
      twitch: 'Twitch',
    };
    return names[appId] || appId;
  }

  getAppIcon(appId) {
    // Return icon names for react-native-vector-icons
    const icons = {
      instagram: 'instagram',
      facebook: 'facebook',
      twitter: 'twitter',
      tiktok: 'music-note',
      snapchat: 'snapchat',
      whatsapp: 'whatsapp',
      youtube: 'youtube',
      netflix: 'netflix',
      spotify: 'spotify',
      discord: 'discord',
      roblox: 'gamepad-variant',
      minecraft: 'minecraft',
      pubg: 'pistol',
      fortnite: 'fort-awesome',
      twitch: 'twitch',
    };
    return icons[appId] || 'application';
  }

  // Navigate to quiz (needs navigation ref)
  navigateToQuiz() {
    // This would need to be connected to navigation
    console.log('Navigate to quiz');
  }
}

export default new AppLauncherService();
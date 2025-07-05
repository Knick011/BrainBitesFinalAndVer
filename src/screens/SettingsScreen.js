// src/screens/SettingsScreen.js
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Switch, 
  ScrollView, 
  Alert,
  Platform,
  Modal,
  Animated,
  Linking,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import EnhancedTimerService from '../services/EnhancedTimerService';
import QuizService from '../services/QuizService';
import SoundService from '../services/SoundService';
import ScoreService from '../services/ScoreService';
import NotificationService from '../services/NotificationService';
import DailyGoalsService from '../services/DailyGoalsService';
import AnalyticsService from '../services/AnalyticsService';
import AdMobService from '../services/AdMobService';
import { Colors, Fonts, Layout } from '../utils/constants';

const SettingsScreen = ({ navigation }) => {
  // Settings state
  const [normalReward, setNormalReward] = useState(30);
  const [milestoneReward, setMilestoneReward] = useState(120);
  const [showMascot, setShowMascot] = useState(true);
  const [soundsEnabled, setSoundsEnabled] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [adsEnabled, setAdsEnabled] = useState(true);
  const [dailyReminder, setDailyReminder] = useState(true);
  const [reminderTime, setReminderTime] = useState({ hour: 15, minute: 0 });
  
  // Stats state
  const [scoreInfo, setScoreInfo] = useState(null);
  const [questionStats, setQuestionStats] = useState(null);
  const [appVersion] = useState('1.0.0');
  
  // Modal states
  const [showRewardModal, setShowRewardModal] = useState(false);
  const [rewardModalType, setRewardModalType] = useState('normal');
  const [showTimePickerModal, setShowTimePickerModal] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);
  
  // Animation values
  const fadeAnim = new Animated.Value(0);
  const slideAnim = new Animated.Value(50);
  
  useEffect(() => {
    loadSettings();
    loadStats();
    animateEntrance();
    
    // Track screen view
    AnalyticsService.trackScreen('Settings');
  }, []);
  
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
  
  const loadSettings = async () => {
    try {
      // Load all settings
      const settings = await AsyncStorage.multiGet([
        'brainbites_show_mascot',
        'brainbites_sounds_enabled',
        'brainbites_notifications_enabled',
        'brainbites_ads_enabled',
        'brainbites_daily_reminder',
        'brainbites_reminder_time',
        'brainbites_normal_reward',
        'brainbites_milestone_reward',
      ]);
      
      settings.forEach(([key, value]) => {
        if (value !== null) {
          switch (key) {
            case 'brainbites_show_mascot':
              setShowMascot(value === 'true');
              break;
            case 'brainbites_sounds_enabled':
              setSoundsEnabled(value === 'true');
              break;
            case 'brainbites_notifications_enabled':
              setNotificationsEnabled(value === 'true');
              break;
            case 'brainbites_ads_enabled':
              setAdsEnabled(value === 'true');
              break;
            case 'brainbites_daily_reminder':
              setDailyReminder(value === 'true');
              break;
            case 'brainbites_reminder_time':
              const time = JSON.parse(value);
              setReminderTime(time);
              break;
            case 'brainbites_normal_reward':
              setNormalReward(parseInt(value, 10));
              break;
            case 'brainbites_milestone_reward':
              setMilestoneReward(parseInt(value, 10));
              break;
          }
        }
      });
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };
  
  const loadStats = async () => {
    try {
      const score = ScoreService.getScoreInfo();
      setScoreInfo(score);
      
      const stats = QuizService.getQuestionStats();
      setQuestionStats(stats);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };
  
  const handleToggleMascot = async (value) => {
    setShowMascot(value);
    await AsyncStorage.setItem('brainbites_show_mascot', value.toString());
    AnalyticsService.trackSettingsChange('mascot_enabled', value);
  };
  
  const handleToggleSounds = async (value) => {
    setSoundsEnabled(value);
    await AsyncStorage.setItem('brainbites_sounds_enabled', value.toString());
    SoundService.setSoundEnabled(value);
    
    if (value) {
      SoundService.playButtonPress();
    }
    
    AnalyticsService.trackSettingsChange('sounds_enabled', value);
  };
  
  const handleToggleNotifications = async (value) => {
    setNotificationsEnabled(value);
    await AsyncStorage.setItem('brainbites_notifications_enabled', value.toString());
    
    if (value) {
      NotificationService.requestPermissions();
    }
    
    AnalyticsService.trackSettingsChange('notifications_enabled', value);
  };
  
  const handleToggleAds = async (value) => {
    setAdsEnabled(value);
    await AsyncStorage.setItem('brainbites_ads_enabled', value.toString());
    await AdMobService.setAdsEnabled(value);
    
    AnalyticsService.trackSettingsChange('ads_enabled', value);
  };
  
  const handleToggleDailyReminder = async (value) => {
    setDailyReminder(value);
    await AsyncStorage.setItem('brainbites_daily_reminder', value.toString());
    
    if (value) {
      NotificationService.scheduleDailyReminder(reminderTime.hour, reminderTime.minute);
    } else {
      // Cancel daily reminders
      NotificationService.cancelAllNotifications();
    }
    
    AnalyticsService.trackSettingsChange('daily_reminder', value);
  };
  
  const handleRewardChange = async (type, value) => {
    SoundService.playButtonPress();
    
    if (type === 'normal') {
      setNormalReward(value);
      await AsyncStorage.setItem('brainbites_normal_reward', value.toString());
    } else {
      setMilestoneReward(value);
      await AsyncStorage.setItem('brainbites_milestone_reward', value.toString());
    }
    
    setShowRewardModal(false);
    AnalyticsService.trackSettingsChange(`${type}_reward`, value);
  };
  
  const handleReminderTimeChange = async (hour, minute) => {
    const newTime = { hour, minute };
    setReminderTime(newTime);
    await AsyncStorage.setItem('brainbites_reminder_time', JSON.stringify(newTime));
    
    if (dailyReminder) {
      NotificationService.scheduleDailyReminder(hour, minute);
    }
    
    setShowTimePickerModal(false);
    AnalyticsService.trackSettingsChange('reminder_time', `${hour}:${minute}`);
  };
  
  const handleClearProgress = async () => {
    SoundService.playButtonPress();
    
    Alert.alert(
      'Reset All Progress',
      'This will reset all your progress, scores, streaks, time credits, and daily goals. This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Reset Everything',
          style: 'destructive',
          onPress: async () => {
            try {
              // Reset all services
              await ScoreService.resetAllScores();
              await EnhancedTimerService.reset();
              await DailyGoalsService.resetDailyGoals();
              await QuizService.resetUsedQuestions();
              
              // Clear all AsyncStorage data
              const keys = await AsyncStorage.getAllKeys();
              const brainbitesKeys = keys.filter(key => key.startsWith('brainbites_'));
              await AsyncStorage.multiRemove(brainbitesKeys);
              
              // Play sound
              SoundService.playSuccess();
              
              // Track event
              AnalyticsService.trackSettingsChange('progress_reset', true);
              
              Alert.alert(
                'Progress Reset',
                'All your progress has been reset. Start fresh!',
                [
                  {
                    text: 'OK',
                    onPress: () => navigation.navigate('Welcome'),
                  },
                ]
              );
            } catch (error) {
              console.error('Error resetting progress:', error);
              Alert.alert('Error', 'Failed to reset progress. Please try again.');
            }
          },
        },
      ]
    );
  };
  
  const handleExportData = async () => {
    SoundService.playButtonPress();
    
    try {
      // Collect all user data
      const userData = {
        scores: ScoreService.getScoreInfo(),
        settings: {
          showMascot,
          soundsEnabled,
          notificationsEnabled,
          dailyReminder,
          reminderTime,
          normalReward,
          milestoneReward,
        },
        stats: {
          questionStats,
          dailyGoals: await DailyGoalsService.getDailyGoals(),
          completionStats: DailyGoalsService.getCompletionStats(),
        },
        exportDate: new Date().toISOString(),
        appVersion,
      };
      
      // Convert to JSON string
      const dataString = JSON.stringify(userData, null, 2);
      
      // Here you would implement actual export functionality
      // For now, show an alert with the option to copy
      Alert.alert(
        'Export Data',
        'Your data has been prepared for export. In a future update, you\'ll be able to save this to a file or share it.',
        [{ text: 'OK' }]
      );
      
      AnalyticsService.trackSettingsChange('data_exported', true);
    } catch (error) {
      console.error('Error exporting data:', error);
      Alert.alert('Error', 'Failed to export data. Please try again.');
    }
  };
  
  const renderSettingItem = (title, subtitle, value, onToggle, icon) => (
    <View style={styles.settingItem}>
      <View style={styles.settingIcon}>
        <Icon name={icon} size={24} color={Colors.primary} />
      </View>
      <View style={styles.settingInfo}>
        <Text style={styles.settingTitle}>{title}</Text>
        {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: '#E0E0E0', true: Colors.primary }}
        thumbColor={value ? Colors.primaryDark : '#F0F0F0'}
      />
    </View>
  );
  
  const renderRewardModal = () => (
    <Modal
      visible={showRewardModal}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowRewardModal(false)}
    >
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={() => setShowRewardModal(false)}
      >
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>
            {rewardModalType === 'normal' ? 'Correct Answer Reward' : 'Streak Milestone Reward'}
          </Text>
          <Text style={styles.modalSubtitle}>
            {rewardModalType === 'normal' 
              ? 'Time earned for each correct answer'
              : 'Bonus time for reaching streak milestones (5, 10, 15...)'}
          </Text>
          
          <View style={styles.rewardOptions}>
            {[15, 30, 45, 60, 90, 120].map((seconds) => (
              <TouchableOpacity
                key={seconds}
                style={[
                  styles.rewardOption,
                  (rewardModalType === 'normal' ? normalReward : milestoneReward) === seconds && styles.rewardOptionSelected,
                ]}
                onPress={() => handleRewardChange(rewardModalType, seconds)}
              >
                <Text
                  style={[
                    styles.rewardOptionText,
                    (rewardModalType === 'normal' ? normalReward : milestoneReward) === seconds && styles.rewardOptionTextSelected,
                  ]}
                >
                  {seconds < 60 ? `${seconds}s` : `${seconds / 60}m`}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          
          <TouchableOpacity
            style={styles.modalCloseButton}
            onPress={() => setShowRewardModal(false)}
          >
            <Text style={styles.modalCloseText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
  
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
          <Text style={styles.headerTitle}>Settings</Text>
          <View style={{ width: 44 }} />
        </View>
        
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
        >
          {/* Stats Overview */}
          <View style={styles.statsContainer}>
            <LinearGradient
              colors={[Colors.primary, Colors.primaryDark]}
              style={styles.statsGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.statsTitle}>Your Progress</Text>
              <View style={styles.statsGrid}>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{scoreInfo?.totalScore || 0}</Text>
                  <Text style={styles.statLabel}>Total Score</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{scoreInfo?.highestStreak || 0}</Text>
                  <Text style={styles.statLabel}>Best Streak</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{scoreInfo?.accuracy || 0}%</Text>
                  <Text style={styles.statLabel}>Accuracy</Text>
                </View>
              </View>
            </LinearGradient>
          </View>
          
          {/* Settings Sections */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>App Preferences</Text>
            
            {renderSettingItem(
              'Show Mascot',
              'CaBBy will guide and encourage you',
              showMascot,
              handleToggleMascot,
              'emoticon-happy'
            )}
            
            {renderSettingItem(
              'Sound Effects',
              'Play sounds for actions and achievements',
              soundsEnabled,
              handleToggleSounds,
              'volume-high'
            )}
            
            {renderSettingItem(
              'Notifications',
              'Receive achievement and reminder notifications',
              notificationsEnabled,
              handleToggleNotifications,
              'bell'
            )}
            
            {renderSettingItem(
              'Show Ads',
              'Support us by viewing ads',
              adsEnabled,
              handleToggleAds,
              'advertisements'
            )}
          </View>
          
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Time Rewards</Text>
            
            <TouchableOpacity
              style={styles.rewardSetting}
              onPress={() => {
                SoundService.playButtonPress();
                setRewardModalType('normal');
                setShowRewardModal(true);
              }}
            >
              <View style={styles.settingIcon}>
                <Icon name="check-circle" size={24} color={Colors.success} />
              </View>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Correct Answer Reward</Text>
                <Text style={styles.settingSubtitle}>Currently: {normalReward} seconds</Text>
              </View>
              <Icon name="chevron-right" size={24} color={Colors.textSecondary} />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.rewardSetting}
              onPress={() => {
                SoundService.playButtonPress();
                setRewardModalType('milestone');
                setShowRewardModal(true);
              }}
            >
              <View style={styles.settingIcon}>
                <Icon name="fire" size={24} color={Colors.error} />
              </View>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Streak Milestone Bonus</Text>
                <Text style={styles.settingSubtitle}>Currently: {milestoneReward / 60} minutes</Text>
              </View>
              <Icon name="chevron-right" size={24} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Daily Reminders</Text>
            
            {renderSettingItem(
              'Daily Reminder',
              'Get reminded to complete daily goals',
              dailyReminder,
              handleToggleDailyReminder,
              'calendar-clock'
            )}
            
            {dailyReminder && (
              <TouchableOpacity
                style={styles.rewardSetting}
                onPress={() => {
                  SoundService.playButtonPress();
                  setShowTimePickerModal(true);
                }}
              >
                <View style={styles.settingIcon}>
                  <Icon name="clock-outline" size={24} color={Colors.primary} />
                </View>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingTitle}>Reminder Time</Text>
                  <Text style={styles.settingSubtitle}>
                    {`${reminderTime.hour.toString().padStart(2, '0')}:${reminderTime.minute.toString().padStart(2, '0')}`}
                  </Text>
                </View>
                <Icon name="chevron-right" size={24} color={Colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>
          
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Data Management</Text>
            
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleExportData}
            >
              <Icon name="export" size={24} color={Colors.primary} />
              <Text style={styles.actionButtonText}>Export My Data</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.actionButton, styles.dangerButton]}
              onPress={handleClearProgress}
            >
              <Icon name="delete-forever" size={24} color={Colors.error} />
              <Text style={[styles.actionButtonText, styles.dangerText]}>
                Reset All Progress
              </Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About</Text>
            
            <TouchableOpacity
              style={styles.aboutItem}
              onPress={() => setShowAboutModal(true)}
            >
              <Text style={styles.aboutLabel}>Version</Text>
              <Text style={styles.aboutValue}>{appVersion}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.aboutItem}
              onPress={() => Linking.openURL('https://brainbites.app/privacy')}
            >
              <Text style={styles.aboutLabel}>Privacy Policy</Text>
              <Icon name="open-in-new" size={18} color={Colors.textSecondary} />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.aboutItem}
              onPress={() => Linking.openURL('https://brainbites.app/terms')}
            >
              <Text style={styles.aboutLabel}>Terms of Service</Text>
              <Icon name="open-in-new" size={18} color={Colors.textSecondary} />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.aboutItem}
              onPress={() => Linking.openURL('mailto:support@brainbites.app')}
            >
              <Text style={styles.aboutLabel}>Contact Support</Text>
              <Icon name="email" size={18} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>
          
          {/* Bottom spacing */}
          <View style={{ height: 50 }} />
        </ScrollView>
      </Animated.View>
      
      {/* Modals */}
      {renderRewardModal()}
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
  scrollView: {
    flex: 1,
  },
  statsContainer: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  statsGradient: {
    padding: 20,
    borderRadius: Layout.borderRadius.large,
    ...Layout.shadow.medium,
  },
  statsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.textOnPrimary,
    textAlign: 'center',
    marginBottom: 20,
    fontFamily: Platform.select({
      ios: Fonts.primary.bold,
      android: Fonts.android.bold,
    }),
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.textOnPrimary,
    fontFamily: Platform.select({
      ios: Fonts.primary.bold,
      android: Fonts.android.bold,
    }),
  },
  statLabel: {
    fontSize: 14,
    color: Colors.textOnPrimary,
    opacity: 0.9,
    marginTop: 4,
    fontFamily: Platform.select({
      ios: Fonts.accent.regular,
      android: Fonts.android.regular,
    }),
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: Colors.textOnPrimary,
    opacity: 0.3,
  },
  section: {
    marginHorizontal: 20,
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    marginBottom: 15,
    fontFamily: Platform.select({
      ios: Fonts.secondary.bold,
      android: Fonts.android.medium,
    }),
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: 15,
    borderRadius: Layout.borderRadius.medium,
    marginBottom: 10,
    ...Layout.shadow.small,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${Colors.primary}20`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  settingInfo: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    fontFamily: Platform.select({
      ios: Fonts.primary.regular,
      android: Fonts.android.medium,
    }),
  },
  settingSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 2,
    fontFamily: Platform.select({
      ios: Fonts.accent.regular,
      android: Fonts.android.regular,
    }),
  },
  rewardSetting: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: 15,
    borderRadius: Layout.borderRadius.medium,
    marginBottom: 10,
    ...Layout.shadow.small,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    padding: 15,
    borderRadius: Layout.borderRadius.medium,
    marginBottom: 10,
    ...Layout.shadow.small,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
    marginLeft: 10,
    fontFamily: Platform.select({
      ios: Fonts.primary.regular,
      android: Fonts.android.medium,
    }),
  },
  dangerButton: {
    backgroundColor: `${Colors.error}10`,
  },
  dangerText: {
    color: Colors.error,
  },
  aboutItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  aboutLabel: {
    fontSize: 16,
    color: Colors.textPrimary,
    fontFamily: Platform.select({
      ios: Fonts.accent.regular,
      android: Fonts.android.regular,
    }),
  },
  aboutValue: {
    fontSize: 16,
    color: Colors.textSecondary,
    fontFamily: Platform.select({
      ios: Fonts.accent.regular,
      android: Fonts.android.regular,
    }),
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderRadius: Layout.borderRadius.large,
    padding: 25,
    width: '85%',
    maxWidth: 400,
    ...Layout.shadow.large,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: 10,
    fontFamily: Platform.select({
      ios: Fonts.primary.bold,
      android: Fonts.android.bold,
    }),
  },
  modalSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
    fontFamily: Platform.select({
      ios: Fonts.accent.regular,
      android: Fonts.android.regular,
    }),
  },
  rewardOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  rewardOption: {
    width: '30%',
    paddingVertical: 15,
    borderRadius: Layout.borderRadius.medium,
    backgroundColor: '#F0F0F0',
    marginBottom: 10,
    alignItems: 'center',
  },
  rewardOptionSelected: {
    backgroundColor: Colors.primary,
  },
  rewardOptionText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    fontFamily: Platform.select({
      ios: Fonts.primary.regular,
      android: Fonts.android.medium,
    }),
  },
  rewardOptionTextSelected: {
    color: Colors.textOnPrimary,
  },
  modalCloseButton: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  modalCloseText: {
    fontSize: 16,
    color: Colors.textSecondary,
    fontFamily: Platform.select({
      ios: Fonts.accent.regular,
      android: Fonts.android.regular,
    }),
  },
});

export default SettingsScreen;
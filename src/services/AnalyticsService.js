// src/services/AnalyticsService.js
import analytics from '@react-native-firebase/analytics';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

class AnalyticsService {
  constructor() {
    this.isEnabled = true;
    this.userId = null;
    this.sessionStartTime = null;
  }

  // Initialize analytics
  async initialize() {
    try {
      // Check if analytics is enabled in settings
      const analyticsEnabled = await AsyncStorage.getItem('brainbites_analytics_enabled');
      if (analyticsEnabled !== null) {
        this.isEnabled = analyticsEnabled === 'true';
      }

      if (this.isEnabled) {
        // Enable analytics collection
        await analytics().setAnalyticsCollectionEnabled(true);
        
        // Set default user properties
        await analytics().setUserProperty('app_version', '1.0.0');
        await analytics().setUserProperty('platform', Platform.OS);
        await analytics().setUserProperty('platform_version', Platform.Version.toString());
        
        // Generate or retrieve user ID
        let userId = await AsyncStorage.getItem('brainbites_user_id');
        if (!userId) {
          userId = this.generateUserId();
          await AsyncStorage.setItem('brainbites_user_id', userId);
        }
        this.userId = userId;
        await analytics().setUserId(userId);
        
        // Start session
        this.sessionStartTime = Date.now();
        
        console.log('Analytics initialized successfully');
      }
      
      return true;
    } catch (error) {
      console.error('Error initializing analytics:', error);
      return false;
    }
  }

  // Generate unique user ID
  generateUserId() {
    return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  // Track screen views
  async trackScreen(screenName, screenClass = null) {
    if (!this.isEnabled) return;
    
    try {
      await analytics().logScreenView({
        screen_name: screenName,
        screen_class: screenClass || screenName,
      });
      console.log(`Tracked screen: ${screenName}`);
    } catch (error) {
      console.error('Error tracking screen:', error);
    }
  }

  // Track app launches
  async trackAppLaunch(isFirstLaunch = false) {
    if (!this.isEnabled) return;
    
    try {
      if (isFirstLaunch) {
        await analytics().logEvent('first_open', {
          timestamp: Date.now(),
        });
      }
      
      await analytics().logAppOpen();
      
      // Track launch source
      await analytics().logEvent('app_launch', {
        is_first_launch: isFirstLaunch,
        timestamp: Date.now(),
      });
      
      console.log('Tracked app launch');
    } catch (error) {
      console.error('Error tracking app launch:', error);
    }
  }

  // Track quiz events
  async trackQuizEvent(eventName, parameters = {}) {
    if (!this.isEnabled) return;
    
    try {
      // Add common parameters
      const enrichedParams = {
        ...parameters,
        timestamp: Date.now(),
        session_id: this.sessionStartTime,
        user_id: this.userId,
      };
      
      await analytics().logEvent(eventName, enrichedParams);
      console.log(`Tracked quiz event: ${eventName}`, parameters);
    } catch (error) {
      console.error('Error tracking quiz event:', error);
    }
  }

  // Track answer selection
  async trackAnswerSelected(isCorrect, category, timeToAnswer, currentStreak) {
    await this.trackQuizEvent('answer_selected', {
      is_correct: isCorrect,
      category: category || 'unknown',
      time_to_answer: Math.round(timeToAnswer),
      current_streak: currentStreak,
      difficulty: 'medium', // You can pass this as parameter
    });
  }

  // Track quiz session
  async trackQuizSession(sessionData) {
    await this.trackQuizEvent('quiz_session_completed', {
      total_questions: sessionData.totalQuestions,
      correct_answers: sessionData.correctAnswers,
      wrong_answers: sessionData.wrongAnswers,
      accuracy: sessionData.accuracy,
      time_earned: sessionData.timeEarned,
      categories_played: sessionData.categories,
      session_duration: sessionData.duration,
    });
  }

  // Track streak milestones
  async trackStreakMilestone(streakCount, category) {
    await this.trackQuizEvent('streak_milestone', {
      streak_count: streakCount,
      category: category || 'mixed',
      milestone_type: this.getStreakMilestoneType(streakCount),
    });
    
    // Log Firebase predefined event for achievements
    if (streakCount >= 10) {
      await analytics().logEvent('unlock_achievement', {
        achievement_id: `streak_${streakCount}`,
      });
    }
  }

  // Track time earned
  async trackTimeEarned(secondsEarned, method, totalTime) {
    await this.trackQuizEvent('time_earned', {
      seconds_earned: secondsEarned,
      method: method, // 'correct_answer', 'streak_bonus', 'watch_ad', 'daily_goal'
      total_time: totalTime,
      earnings_type: secondsEarned >= 120 ? 'bonus' : 'regular',
    });
  }

  // Track daily score
  async trackDailyScore(score, questionsAnswered, timeSpent) {
    await this.trackQuizEvent('daily_score_update', {
      daily_score: score,
      questions_answered: questionsAnswered,
      time_spent: Math.round(timeSpent),
      score_per_question: questionsAnswered > 0 ? Math.round(score / questionsAnswered) : 0,
    });
  }

  // Track user engagement
  async trackUserEngagement(sessionDuration, questionsCompleted) {
    await this.trackQuizEvent('session_engagement', {
      session_duration: Math.round(sessionDuration),
      questions_completed: questionsCompleted,
      engagement_level: this.calculateEngagementLevel(sessionDuration, questionsCompleted),
    });
  }

  // Track daily goals
  async trackDailyGoalProgress(goalId, progress, completed = false) {
    await this.trackQuizEvent('daily_goal_progress', {
      goal_id: goalId,
      progress_percentage: progress,
      is_completed: completed,
    });
  }

  // Track daily goal completion
  async trackDailyGoalCompleted(goalId, rewardSeconds) {
    await this.trackQuizEvent('daily_goal_completed', {
      goal_id: goalId,
      reward_seconds: rewardSeconds,
      completion_time: Date.now(),
    });
    
    // Log achievement
    await analytics().logEvent('unlock_achievement', {
      achievement_id: `daily_goal_${goalId}`,
    });
  }

  // Track ad interactions
  async trackAdEvent(adType, action, reward = null) {
    const eventName = `ad_${action}`;
    const params = {
      ad_type: adType, // 'banner', 'rewarded'
      ad_placement: adType === 'banner' ? 'quiz_screen' : 'home_screen',
    };
    
    if (reward) {
      params.reward_amount = reward;
      params.reward_type = 'time_seconds';
    }
    
    await this.trackQuizEvent(eventName, params);
    
    // Track revenue event for rewarded ads
    if (action === 'rewarded' && reward) {
      await analytics().logEvent('earn_virtual_currency', {
        virtual_currency_name: 'time_seconds',
        value: reward,
      });
    }
  }

  // Track settings changes
  async trackSettingsChange(settingName, value) {
    await this.trackQuizEvent('settings_changed', {
      setting_name: settingName,
      setting_value: value.toString(),
      setting_type: typeof value,
    });
  }

  // Track errors
  async trackError(errorType, errorMessage, fatal = false) {
    try {
      await analytics().logEvent('app_error', {
        error_type: errorType,
        error_message: errorMessage,
        is_fatal: fatal,
        stack_trace: new Error().stack,
      });
      
      console.error(`Tracked error: ${errorType} - ${errorMessage}`);
    } catch (error) {
      console.error('Error tracking error:', error);
    }
  }

  // Track timer events
  async trackTimerEvent(event, timeRemaining) {
    await this.trackQuizEvent(`timer_${event}`, {
      time_remaining: timeRemaining,
      is_overtime: timeRemaining < 0,
      overtime_amount: timeRemaining < 0 ? Math.abs(timeRemaining) : 0,
    });
  }

  // Track app navigation
  async trackNavigation(from, to, method = 'button') {
    await this.trackQuizEvent('navigation', {
      from_screen: from,
      to_screen: to,
      navigation_method: method,
    });
  }

  // Track tutorial/onboarding
  async trackOnboardingStep(step, completed = false) {
    await this.trackQuizEvent('onboarding_step', {
      step_number: step,
      step_completed: completed,
      total_steps: 6,
    });
    
    if (completed && step === 6) {
      await analytics().logEvent('tutorial_complete');
    }
  }

  // Track user properties
  async setUserProperty(name, value) {
    if (!this.isEnabled) return;
    
    try {
      await analytics().setUserProperty(name, value ? value.toString() : null);
      console.log(`Set user property: ${name} = ${value}`);
    } catch (error) {
      console.error('Error setting user property:', error);
    }
  }

  // Update user profile
  async updateUserProfile(profile) {
    if (!this.isEnabled) return;
    
    try {
      // Set multiple user properties
      if (profile.totalScore !== undefined) {
        await this.setUserProperty('total_score', profile.totalScore);
      }
      if (profile.highestStreak !== undefined) {
        await this.setUserProperty('highest_streak', profile.highestStreak);
      }
      if (profile.questionsAnswered !== undefined) {
        await this.setUserProperty('total_questions', profile.questionsAnswered);
      }
      if (profile.accuracy !== undefined) {
        await this.setUserProperty('overall_accuracy', profile.accuracy);
      }
      if (profile.favoriteCategory) {
        await this.setUserProperty('favorite_category', profile.favoriteCategory);
      }
      
      // Set user level based on score
      const level = this.calculateUserLevel(profile.totalScore);
      await this.setUserProperty('user_level', level);
      
    } catch (error) {
      console.error('Error updating user profile:', error);
    }
  }

  // Track purchase (for future monetization)
  async trackPurchase(itemId, itemName, value, currency = 'USD') {
    if (!this.isEnabled) return;
    
    try {
      await analytics().logEvent('purchase', {
        item_id: itemId,
        item_name: itemName,
        value: value,
        currency: currency,
      });
    } catch (error) {
      console.error('Error tracking purchase:', error);
    }
  }

  // Helper methods
  getStreakMilestoneType(streak) {
    if (streak >= 50) return 'legendary';
    if (streak >= 25) return 'expert';
    if (streak >= 10) return 'advanced';
    if (streak >= 5) return 'beginner';
    return 'none';
  }

  calculateEngagementLevel(duration, questions) {
    const avgTimePerQuestion = duration / questions;
    if (avgTimePerQuestion < 10) return 'low';
    if (avgTimePerQuestion < 30) return 'medium';
    return 'high';
  }

  calculateUserLevel(totalScore) {
    if (totalScore >= 10000) return 'expert';
    if (totalScore >= 5000) return 'advanced';
    if (totalScore >= 1000) return 'intermediate';
    if (totalScore >= 100) return 'beginner';
    return 'novice';
  }

  // Toggle analytics (for privacy)
  async toggleAnalytics(enabled) {
    this.isEnabled = enabled;
    await AsyncStorage.setItem('brainbites_analytics_enabled', enabled.toString());
    await analytics().setAnalyticsCollectionEnabled(enabled);
    
    console.log(`Analytics ${enabled ? 'enabled' : 'disabled'}`);
  }

  // Get analytics status
  getAnalyticsStatus() {
    return {
      enabled: this.isEnabled,
      userId: this.userId,
      sessionStartTime: this.sessionStartTime,
    };
  }
}

export default new AnalyticsService();
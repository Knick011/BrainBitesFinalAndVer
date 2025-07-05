// src/services/DailyGoalsService.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import NotificationService from './NotificationService';
import ScoreService from './ScoreService';
import EnhancedTimerService from './EnhancedTimerService';
import AnalyticsService from './AnalyticsService';

class DailyGoalsService {
  constructor() {
    this.STORAGE_KEY = 'brainbites_daily_goals';
    this.PROGRESS_KEY = 'brainbites_daily_goals_progress';
    this.currentGoals = [];
    this.goalProgress = {};
    this.lastResetDate = null;
  }

  async initialize() {
    await this.loadGoalsAndProgress();
    await this.checkAndResetDaily();
  }

  // Define all possible daily goals
  getAllPossibleGoals() {
    return [
      {
        id: 'answer_15',
        title: 'Knowledge Seeker',
        description: 'Answer 15 questions',
        target: 15,
        type: 'questions_answered',
        reward: '1 hour of extra screen time',
        rewardSeconds: 3600,
        icon: 'brain',
        color: '#4ECDC4',
      },
      {
        id: 'streak_10',
        title: 'Streak Master',
        description: 'Get a 10 question streak',
        target: 10,
        type: 'streak',
        reward: '1 hour of extra screen time',
        rewardSeconds: 3600,
        icon: 'fire',
        color: '#FF6B6B',
      },
      {
        id: 'answer_25',
        title: 'Quiz Champion',
        description: 'Answer 25 questions',
        target: 25,
        type: 'questions_answered',
        reward: '90 minutes of extra screen time',
        rewardSeconds: 5400,
        icon: 'trophy',
        color: '#FFD700',
      },
      {
        id: 'correct_20',
        title: 'Accuracy Expert',
        description: 'Get 20 correct answers',
        target: 20,
        type: 'correct_answers',
        reward: '75 minutes of extra screen time',
        rewardSeconds: 4500,
        icon: 'check-circle',
        color: '#4ECDC4',
      },
      {
        id: 'streak_5_twice',
        title: 'Consistent Learner',
        description: 'Get two 5+ question streaks',
        target: 2,
        type: 'streak_count',
        reward: '45 minutes of extra screen time',
        rewardSeconds: 2700,
        icon: 'repeat',
        color: '#9C27B0',
      },
      {
        id: 'play_3_categories',
        title: 'Well Rounded',
        description: 'Play in 3 different categories',
        target: 3,
        type: 'categories_played',
        reward: '1 hour of extra screen time',
        rewardSeconds: 3600,
        icon: 'view-grid',
        color: '#FF9F1C',
      },
      {
        id: 'perfect_quiz',
        title: 'Perfect Score',
        description: 'Complete a quiz with 100% accuracy (min 10 questions)',
        target: 1,
        type: 'perfect_quiz',
        reward: '2 hours of extra screen time',
        rewardSeconds: 7200,
        icon: 'star',
        color: '#FFD700',
      },
      {
        id: 'earn_30_min',
        title: 'Time Builder',
        description: 'Earn 30 minutes of screen time',
        target: 1800, // 30 minutes in seconds
        type: 'time_earned',
        reward: '30 bonus minutes',
        rewardSeconds: 1800,
        icon: 'clock-plus',
        color: '#2196F3',
      },
      {
        id: 'morning_session',
        title: 'Early Bird',
        description: 'Complete a quiz before 10 AM',
        target: 1,
        type: 'time_based',
        reward: '45 minutes of extra screen time',
        rewardSeconds: 2700,
        icon: 'weather-sunny',
        color: '#FFC107',
      },
      {
        id: 'difficulty_master',
        title: 'Difficulty Master',
        description: 'Play all 3 difficulty levels',
        target: 3,
        type: 'difficulties_played',
        reward: '1 hour of extra screen time',
        rewardSeconds: 3600,
        icon: 'stairs',
        color: '#E91E63',
      },
    ];
  }

  // Get random daily goals for today
  async generateDailyGoals() {
    const allGoals = this.getAllPossibleGoals();
    
    // Select 3 random goals for the day
    const shuffled = allGoals.sort(() => 0.5 - Math.random());
    const selectedGoals = shuffled.slice(0, 3);
    
    // Initialize progress for each goal
    const progress = {};
    selectedGoals.forEach(goal => {
      progress[goal.id] = {
        current: 0,
        completed: false,
        claimedReward: false,
      };
    });
    
    this.currentGoals = selectedGoals;
    this.goalProgress = progress;
    
    // Save to storage
    await this.saveGoalsAndProgress();
    
    return selectedGoals;
  }

  // Load goals and progress from storage
  async loadGoalsAndProgress() {
    try {
      const goalsData = await AsyncStorage.getItem(this.STORAGE_KEY);
      const progressData = await AsyncStorage.getItem(this.PROGRESS_KEY);
      
      if (goalsData) {
        const parsed = JSON.parse(goalsData);
        this.currentGoals = parsed.goals || [];
        this.lastResetDate = parsed.lastResetDate || null;
      }
      
      if (progressData) {
        this.goalProgress = JSON.parse(progressData);
      }
    } catch (error) {
      console.error('Error loading daily goals:', error);
    }
  }

  // Save goals and progress to storage
  async saveGoalsAndProgress() {
    try {
      const goalsData = {
        goals: this.currentGoals,
        lastResetDate: this.lastResetDate,
      };
      
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(goalsData));
      await AsyncStorage.setItem(this.PROGRESS_KEY, JSON.stringify(this.goalProgress));
    } catch (error) {
      console.error('Error saving daily goals:', error);
    }
  }

  // Check if we need to reset daily goals
  async checkAndResetDaily() {
    const today = new Date().toDateString();
    
    if (this.lastResetDate !== today) {
      // It's a new day, generate new goals
      await this.generateDailyGoals();
      this.lastResetDate = today;
      await this.saveGoalsAndProgress();
    }
  }

  // Update goal progress
  async updateProgress(type, value, metadata = {}) {
    let updated = false;
    
    for (const goal of this.currentGoals) {
      if (goal.completed || this.goalProgress[goal.id]?.completed) {
        continue;
      }
      
      switch (goal.type) {
        case 'questions_answered':
          if (type === 'question_answered') {
            this.goalProgress[goal.id].current += 1;
            updated = true;
          }
          break;
          
        case 'correct_answers':
          if (type === 'correct_answer') {
            this.goalProgress[goal.id].current += 1;
            updated = true;
          }
          break;
          
        case 'streak':
          if (type === 'streak_update' && value >= goal.target) {
            this.goalProgress[goal.id].current = goal.target;
            updated = true;
          }
          break;
          
        case 'streak_count':
          if (type === 'streak_milestone' && value >= 5) {
            this.goalProgress[goal.id].current += 1;
            updated = true;
          }
          break;
          
        case 'categories_played':
          if (type === 'category_played' && metadata.category) {
            // Track unique categories
            if (!this.goalProgress[goal.id].categories) {
              this.goalProgress[goal.id].categories = new Set();
            }
            this.goalProgress[goal.id].categories.add(metadata.category);
            this.goalProgress[goal.id].current = this.goalProgress[goal.id].categories.size;
            updated = true;
          }
          break;
          
        case 'perfect_quiz':
          if (type === 'quiz_completed' && metadata.accuracy === 100 && metadata.totalQuestions >= 10) {
            this.goalProgress[goal.id].current = 1;
            updated = true;
          }
          break;
          
        case 'time_earned':
          if (type === 'time_earned' && value > 0) {
            this.goalProgress[goal.id].current += value;
            updated = true;
          }
          break;
          
        case 'time_based':
          if (type === 'quiz_completed' && goal.id === 'morning_session') {
            const hour = new Date().getHours();
            if (hour < 10) {
              this.goalProgress[goal.id].current = 1;
              updated = true;
            }
          }
          break;
          
        case 'difficulties_played':
          if (type === 'difficulty_played' && metadata.difficulty) {
            if (!this.goalProgress[goal.id].difficulties) {
              this.goalProgress[goal.id].difficulties = new Set();
            }
            this.goalProgress[goal.id].difficulties.add(metadata.difficulty);
            this.goalProgress[goal.id].current = this.goalProgress[goal.id].difficulties.size;
            updated = true;
          }
          break;
      }
      
      // Check if goal is completed
      if (this.goalProgress[goal.id].current >= goal.target && !this.goalProgress[goal.id].completed) {
        this.goalProgress[goal.id].completed = true;
        
        // Show completion notification
        NotificationService.showDailyGoalNotification(goal.title, goal.reward);
        
        // Track achievement
        AnalyticsService.trackQuizEvent('daily_goal_completed', {
          goal_id: goal.id,
          goal_title: goal.title,
          reward_seconds: goal.rewardSeconds,
        });
      }
    }
    
    if (updated) {
      await this.saveGoalsAndProgress();
    }
    
    return updated;
  }

  // Claim reward for completed goal
  async claimReward(goalId) {
    const goal = this.currentGoals.find(g => g.id === goalId);
    const progress = this.goalProgress[goalId];
    
    if (!goal || !progress || !progress.completed || progress.claimedReward) {
      return false;
    }
    
    // Add time to timer
    await EnhancedTimerService.addBonusTime(goal.rewardSeconds);
    
    // Mark as claimed
    this.goalProgress[goalId].claimedReward = true;
    await this.saveGoalsAndProgress();
    
    // Track reward claim
    AnalyticsService.trackQuizEvent('daily_goal_reward_claimed', {
      goal_id: goal.id,
      reward_seconds: goal.rewardSeconds,
    });
    
    return true;
  }

  // Get current daily goals with progress
  async getDailyGoals() {
    await this.checkAndResetDaily();
    
    return this.currentGoals.map(goal => ({
      ...goal,
      progress: this.goalProgress[goal.id] || { current: 0, completed: false, claimedReward: false },
    }));
  }

  // Get progress for a specific goal
  getGoalProgress(goalId) {
    return this.goalProgress[goalId] || { current: 0, completed: false, claimedReward: false };
  }

  // Get completion stats
  getCompletionStats() {
    const total = this.currentGoals.length;
    const completed = Object.values(this.goalProgress).filter(p => p.completed).length;
    const claimed = Object.values(this.goalProgress).filter(p => p.claimedReward).length;
    
    return {
      total,
      completed,
      claimed,
      percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
  }

  // Reset all goals (for testing or manual reset)
  async resetDailyGoals() {
    this.lastResetDate = null;
    await this.checkAndResetDaily();
  }
}

export default new DailyGoalsService();
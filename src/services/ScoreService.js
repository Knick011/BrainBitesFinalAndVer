// src/services/ScoreService.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import EnhancedTimerService from './EnhancedTimerService';

class ScoreService {
  constructor() {
    this.STORAGE_KEY = 'brainbites_score_data';
    this.scoreData = {
      totalScore: 0,
      dailyScore: 0,
      currentStreak: 0,
      highestStreak: 0,
      questionsAnswered: 0,
      correctAnswers: 0,
      wrongAnswers: 0,
      lastResetDate: null,
      negativeScoreBuffer: 0, // Buffer before negative scoring starts
    };
    this.dailyResetCallback = null;
    this.streakMilestones = [5, 10, 15, 20, 25, 30, 50, 100];
  }

  async loadSavedData() {
    try {
      const savedData = await AsyncStorage.getItem(this.STORAGE_KEY);
      if (savedData) {
        const parsed = JSON.parse(savedData);
        this.scoreData = { ...this.scoreData, ...parsed };
      }
      
      // Check for daily reset
      await this.checkDailyReset();
    } catch (error) {
      console.error('Error loading score data:', error);
    }
  }

  async saveData() {
    try {
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.scoreData));
    } catch (error) {
      console.error('Error saving score data:', error);
    }
  }

  async checkDailyReset() {
    const today = new Date().toDateString();
    
    if (this.scoreData.lastResetDate !== today) {
      // It's a new day!
      const yesterdayScore = this.scoreData.dailyScore;
      
      // Reset daily values
      this.scoreData.dailyScore = 0;
      this.scoreData.lastResetDate = today;
      this.scoreData.negativeScoreBuffer = 0;
      
      await this.saveData();
      
      // Notify callback if set
      if (this.dailyResetCallback) {
        this.dailyResetCallback({
          yesterdayScore,
          newDate: today,
        });
      }
    }
  }

  setDailyResetCallback(callback) {
    this.dailyResetCallback = callback;
  }

  // Add points for correct answer
  async addCorrectAnswer(basePoints = 10) {
    this.scoreData.questionsAnswered++;
    this.scoreData.correctAnswers++;
    this.scoreData.currentStreak++;
    
    // Calculate points with streak bonus
    let points = basePoints;
    if (this.scoreData.currentStreak > 1) {
      const streakBonus = Math.min(this.scoreData.currentStreak - 1, 10) * 2;
      points += streakBonus;
    }
    
    this.scoreData.totalScore += points;
    this.scoreData.dailyScore += points;
    
    // Update highest streak
    if (this.scoreData.currentStreak > this.scoreData.highestStreak) {
      this.scoreData.highestStreak = this.scoreData.currentStreak;
    }
    
    await this.saveData();
    
    return {
      pointsEarned: points,
      currentStreak: this.scoreData.currentStreak,
      isNewHighStreak: this.scoreData.currentStreak === this.scoreData.highestStreak,
    };
  }

  // Handle wrong answer
  async addWrongAnswer() {
    this.scoreData.questionsAnswered++;
    this.scoreData.wrongAnswers++;
    
    // Reset streak but no negative points for wrong answers
    const previousStreak = this.scoreData.currentStreak;
    this.scoreData.currentStreak = 0;
    
    await this.saveData();
    
    return {
      streakLost: previousStreak,
      pointsLost: 0, // No points lost for wrong answers
    };
  }

  // Handle negative scoring for overtime usage
  async handleOvertimeUsage(secondsOvertime) {
    // Check if user has used all earned time AND buffer
    const availableTime = EnhancedTimerService.getAvailableTime();
    
    if (availableTime >= 0) {
      // Still have earned time, no negative scoring
      return 0;
    }
    
    // Calculate negative score with reduced impact
    // Only start deducting after 5 minutes of overtime (300 seconds buffer)
    const BUFFER_SECONDS = 300;
    const effectiveOvertime = Math.max(0, Math.abs(availableTime) - BUFFER_SECONDS);
    
    if (effectiveOvertime <= 0) {
      return 0; // Still in buffer period
    }
    
    // Reduced negative impact: -1 point per 2 minutes of overtime
    const negativePoints = Math.floor(effectiveOvertime / 120); // 120 seconds = 2 minutes
    
    if (negativePoints > 0) {
      this.scoreData.totalScore = Math.max(0, this.scoreData.totalScore - negativePoints);
      this.scoreData.dailyScore = Math.max(0, this.scoreData.dailyScore - negativePoints);
      await this.saveData();
    }
    
    return negativePoints;
  }

  // Check if streak milestone reached
  checkStreakMilestone(streak) {
    return this.streakMilestones.includes(streak);
  }

  // Get current score info
  getScoreInfo() {
    return {
      totalScore: this.scoreData.totalScore,
      dailyScore: this.scoreData.dailyScore,
      currentStreak: this.scoreData.currentStreak,
      highestStreak: this.scoreData.highestStreak,
      questionsAnswered: this.scoreData.questionsAnswered,
      correctAnswers: this.scoreData.correctAnswers,
      wrongAnswers: this.scoreData.wrongAnswers,
      accuracy: this.scoreData.questionsAnswered > 0 
        ? Math.round((this.scoreData.correctAnswers / this.scoreData.questionsAnswered) * 100)
        : 0,
    };
  }

  // Get leaderboard data
  async getLeaderboardData() {
    try {
      // In a real app, this would fetch from a server
      // For now, return local data with mock entries
      const localEntry = {
        rank: 1,
        name: 'You',
        score: this.scoreData.totalScore,
        streak: this.scoreData.highestStreak,
        isCurrentUser: true,
      };
      
      // Mock other users
      const mockUsers = [
        { rank: 2, name: 'Alex B.', score: Math.floor(this.scoreData.totalScore * 0.9), streak: 15 },
        { rank: 3, name: 'Sarah M.', score: Math.floor(this.scoreData.totalScore * 0.8), streak: 12 },
        { rank: 4, name: 'Mike T.', score: Math.floor(this.scoreData.totalScore * 0.7), streak: 10 },
        { rank: 5, name: 'Emma L.', score: Math.floor(this.scoreData.totalScore * 0.6), streak: 8 },
      ];
      
      return [localEntry, ...mockUsers];
    } catch (error) {
      console.error('Error getting leaderboard data:', error);
      return [];
    }
  }

  // Reset all scores
  async resetAllScores() {
    this.scoreData = {
      totalScore: 0,
      dailyScore: 0,
      currentStreak: 0,
      highestStreak: 0,
      questionsAnswered: 0,
      correctAnswers: 0,
      wrongAnswers: 0,
      lastResetDate: new Date().toDateString(),
      negativeScoreBuffer: 0,
    };
    
    await this.saveData();
  }

  // Get statistics
  getStatistics() {
    const stats = {
      ...this.getScoreInfo(),
      averagePointsPerQuestion: this.scoreData.questionsAnswered > 0
        ? Math.round(this.scoreData.totalScore / this.scoreData.questionsAnswered)
        : 0,
      questionsToday: this.scoreData.questionsAnswered, // This would need separate tracking for true daily count
      daysPlayed: 1, // This would need separate tracking
    };
    
    return stats;
  }
}

export default new ScoreService();
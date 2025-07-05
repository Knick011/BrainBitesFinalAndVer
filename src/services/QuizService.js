// src/services/QuizService.js
import RNFS from 'react-native-fs';
import Papa from 'papaparse';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

class QuizService {
  constructor() {
    this.questions = [];
    this.categories = [];
    this.usedQuestionIds = new Set();
    this.STORAGE_KEY = 'brainbites_used_questions';
    this.lastCategory = null;
    this.lastDifficulty = null;
  }

  async loadQuestions() {
    try {
      // Load used questions from storage
      await this.loadUsedQuestions();
      
      // Path to the CSV file
      const csvPath = Platform.OS === 'ios' 
        ? `${RNFS.MainBundlePath}/questions.csv`
        : 'questions.csv';
      
      // Read the CSV file
      let csvContent;
      if (Platform.OS === 'ios') {
        csvContent = await RNFS.readFile(csvPath, 'utf8');
      } else {
        // For Android, read from assets
        csvContent = await RNFS.readFileAssets(csvPath, 'utf8');
      }
      
      // Parse CSV with new format
      const parsed = Papa.parse(csvContent, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: true,
      });
      
      if (parsed.errors.length > 0) {
        console.error('CSV parsing errors:', parsed.errors);
      }
      
      // Process questions with new format
      this.questions = parsed.data.map((row, index) => ({
        id: row.id || index + 1,
        category: row.category || 'General',
        question: row.question,
        options: {
          A: row.optionA,
          B: row.optionB,
          C: row.optionC,
          D: row.optionD,
        },
        correctAnswer: row.correctAnswer,
        explanation: row.explanation || 'No explanation available.',
        level: row.level || 'Medium', // Easy, Medium, or Hard
      })).filter(q => q.question && q.options.A); // Filter out invalid questions
      
      // Extract unique categories
      const categorySet = new Set(this.questions.map(q => q.category));
      this.categories = Array.from(categorySet);
      
      console.log(`Loaded ${this.questions.length} questions across ${this.categories.length} categories`);
      
      // If we've used too many questions, reset
      if (this.usedQuestionIds.size > this.questions.length * 0.8) {
        await this.resetUsedQuestions();
      }
      
      return true;
    } catch (error) {
      console.error('Error loading questions:', error);
      
      // Load default questions as fallback
      this.loadDefaultQuestions();
      return false;
    }
  }

  loadDefaultQuestions() {
    // Fallback questions if CSV fails to load
    this.questions = [
      {
        id: 1,
        category: 'Science',
        question: 'What is the chemical symbol for water?',
        options: { A: 'H2O', B: 'CO2', C: 'O2', D: 'NaCl' },
        correctAnswer: 'A',
        explanation: 'Water is composed of two hydrogen atoms and one oxygen atom, represented as H2O.',
        level: 'Easy'
      },
      {
        id: 2,
        category: 'Math',
        question: 'What is 15% of 200?',
        options: { A: '20', B: '25', C: '30', D: '35' },
        correctAnswer: 'C',
        explanation: '15% of 200 = 0.15 × 200 = 30',
        level: 'Medium'
      },
      {
        id: 3,
        category: 'History',
        question: 'In which year did World War II end?',
        options: { A: '1943', B: '1944', C: '1945', D: '1946' },
        correctAnswer: 'C',
        explanation: 'World War II ended in 1945 with the surrender of Japan in August.',
        level: 'Easy'
      },
      // Add more default questions as needed
    ];
    
    this.categories = ['Science', 'Math', 'History'];
  }

  async loadUsedQuestions() {
    try {
      const stored = await AsyncStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        this.usedQuestionIds = new Set(parsed.usedIds || []);
      }
    } catch (error) {
      console.error('Error loading used questions:', error);
    }
  }

  async saveUsedQuestions() {
    try {
      const data = {
        usedIds: Array.from(this.usedQuestionIds),
        lastUpdated: Date.now(),
      };
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving used questions:', error);
    }
  }

  async resetUsedQuestions() {
    this.usedQuestionIds.clear();
    await AsyncStorage.removeItem(this.STORAGE_KEY);
    console.log('Reset used questions');
  }

  getCategories() {
    return this.categories;
  }

  getDifficultyLevels() {
    return ['Easy', 'Medium', 'Hard'];
  }

  getRandomQuestion(category = 'All', difficulty = 'Mixed') {
    // Filter questions based on category and difficulty
    let availableQuestions = this.questions.filter(q => !this.usedQuestionIds.has(q.id));
    
    // Apply category filter
    if (category && category !== 'All') {
      availableQuestions = availableQuestions.filter(q => q.category === category);
    }
    
    // Apply difficulty filter
    if (difficulty && difficulty !== 'Mixed') {
      availableQuestions = availableQuestions.filter(q => q.level === difficulty);
    }
    
    // If no questions available with current filters, expand search
    if (availableQuestions.length === 0) {
      console.log('No unused questions found, expanding search...');
      
      // Try without used filter
      availableQuestions = this.questions;
      
      if (category && category !== 'All') {
        availableQuestions = availableQuestions.filter(q => q.category === category);
      }
      
      if (difficulty && difficulty !== 'Mixed') {
        availableQuestions = availableQuestions.filter(q => q.level === difficulty);
      }
      
      // If still no questions, remove difficulty filter
      if (availableQuestions.length === 0 && difficulty !== 'Mixed') {
        availableQuestions = this.questions.filter(q => 
          category === 'All' || q.category === category
        );
      }
      
      // If still no questions, use all questions
      if (availableQuestions.length === 0) {
        availableQuestions = this.questions;
      }
      
      // Reset used questions if we're recycling
      if (availableQuestions.length > 0) {
        this.resetUsedQuestions();
      }
    }
    
    if (availableQuestions.length === 0) {
      console.error('No questions available!');
      return null;
    }
    
    // Select random question
    const randomIndex = Math.floor(Math.random() * availableQuestions.length);
    const question = availableQuestions[randomIndex];
    
    // Mark as used
    this.usedQuestionIds.add(question.id);
    this.saveUsedQuestions();
    
    // Store last category and difficulty
    this.lastCategory = question.category;
    this.lastDifficulty = question.level;
    
    return question;
  }

  getQuestionsByCategory(category, limit = 10) {
    const categoryQuestions = this.questions.filter(q => q.category === category);
    
    // Shuffle and return limited number
    const shuffled = categoryQuestions.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, limit);
  }

  getQuestionsByDifficulty(difficulty, limit = 10) {
    const difficultyQuestions = this.questions.filter(q => q.level === difficulty);
    
    // Shuffle and return limited number
    const shuffled = difficultyQuestions.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, limit);
  }

  getQuestionStats() {
    const stats = {
      total: this.questions.length,
      used: this.usedQuestionIds.size,
      remaining: this.questions.length - this.usedQuestionIds.size,
      byCategory: {},
      byDifficulty: {
        Easy: 0,
        Medium: 0,
        Hard: 0,
      },
    };
    
    // Count by category and difficulty
    this.questions.forEach(q => {
      // By category
      if (!stats.byCategory[q.category]) {
        stats.byCategory[q.category] = 0;
      }
      stats.byCategory[q.category]++;
      
      // By difficulty
      if (stats.byDifficulty[q.level] !== undefined) {
        stats.byDifficulty[q.level]++;
      }
    });
    
    return stats;
  }

  // Get question distribution info
  getQuestionDistribution() {
    const distribution = {
      categories: {},
      difficulties: {},
      combined: {},
    };
    
    this.questions.forEach(q => {
      // Category distribution
      distribution.categories[q.category] = (distribution.categories[q.category] || 0) + 1;
      
      // Difficulty distribution
      distribution.difficulties[q.level] = (distribution.difficulties[q.level] || 0) + 1;
      
      // Combined distribution
      const key = `${q.category}-${q.level}`;
      distribution.combined[key] = (distribution.combined[key] || 0) + 1;
    });
    
    return distribution;
  }

  // Search questions by keyword
  searchQuestions(keyword) {
    const lowerKeyword = keyword.toLowerCase();
    return this.questions.filter(q => 
      q.question.toLowerCase().includes(lowerKeyword) ||
      q.category.toLowerCase().includes(lowerKeyword) ||
      Object.values(q.options).some(opt => 
        opt && opt.toLowerCase().includes(lowerKeyword)
      )
    );
  }

  // Get last played category and difficulty
  getLastPlayed() {
    return {
      category: this.lastCategory,
      difficulty: this.lastDifficulty,
    };
  }
}

export default new QuizService();
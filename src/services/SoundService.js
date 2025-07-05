// src/services/SoundService.js
import Sound from 'react-native-sound';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Enable playback in silence mode
Sound.setCategory('Playback');

class SoundService {
  constructor() {
    this.sounds = {};
    this.musicVolume = 0.3;
    this.effectsVolume = 0.6;
    this.soundEnabled = true;
    this.currentMusic = null;
    this.isInitialized = false;
  }

  async initialize() {
    try {
      // Load sound settings
      const soundSetting = await AsyncStorage.getItem('brainbites_sounds_enabled');
      if (soundSetting !== null) {
        this.soundEnabled = soundSetting === 'true';
      }

      // Preload all sounds
      await this.preloadSounds();
      
      this.isInitialized = true;
      console.log('SoundService initialized successfully');
    } catch (error) {
      console.error('Error initializing SoundService:', error);
    }
  }

  async preloadSounds() {
    const soundFiles = {
      // UI Sounds
      buttonPress: 'button_press.mp3',
      success: 'success.mp3',
      error: 'error.mp3',
      
      // Quiz Sounds
      correct: 'correct_answer.mp3',
      wrong: 'wrong_answer.mp3',
      streak: 'streak_milestone.mp3',
      
      // Music
      menuMusic: 'menu_music.mp3',
      quizMusic: 'quiz_music.mp3',
      
      // Notifications
      timeWarning: 'time_warning.mp3',
      achievement: 'achievement.mp3',
    };

    const loadPromises = Object.entries(soundFiles).map(([key, filename]) => {
      return new Promise((resolve, reject) => {
        const sound = new Sound(filename, Sound.MAIN_BUNDLE, (error) => {
          if (error) {
            console.error(`Failed to load sound ${filename}:`, error);
            reject(error);
          } else {
            this.sounds[key] = sound;
            
            // Set appropriate volume
            if (key.includes('Music')) {
              sound.setVolume(this.musicVolume);
            } else {
              sound.setVolume(this.effectsVolume);
            }
            
            resolve();
          }
        });
      });
    });

    try {
      await Promise.all(loadPromises);
      console.log('All sounds preloaded successfully');
    } catch (error) {
      console.error('Error preloading sounds:', error);
    }
  }

  setSoundEnabled(enabled) {
    this.soundEnabled = enabled;
    
    if (!enabled && this.currentMusic) {
      this.stopMusic();
    }
  }

  setMusicVolume(volume) {
    this.musicVolume = Math.max(0, Math.min(1, volume));
    
    // Update volume for all music sounds
    Object.entries(this.sounds).forEach(([key, sound]) => {
      if (key.includes('Music')) {
        sound.setVolume(this.musicVolume);
      }
    });
  }

  setEffectsVolume(volume) {
    this.effectsVolume = Math.max(0, Math.min(1, volume));
    
    // Update volume for all effect sounds
    Object.entries(this.sounds).forEach(([key, sound]) => {
      if (!key.includes('Music')) {
        sound.setVolume(this.effectsVolume);
      }
    });
  }

  playSound(soundKey, callback) {
    if (!this.soundEnabled || !this.sounds[soundKey]) {
      if (callback) callback();
      return;
    }

    const sound = this.sounds[soundKey];
    
    // Reset to beginning
    sound.setCurrentTime(0);
    
    // Play the sound
    sound.play((success) => {
      if (!success) {
        console.error(`Sound playback failed for ${soundKey}`);
      }
      if (callback) callback();
    });
  }

  // UI Sounds
  playButtonPress() {
    this.playSound('buttonPress');
  }

  playSuccess() {
    this.playSound('success');
  }

  playError() {
    this.playSound('error');
  }

  // Quiz Sounds
  playCorrect() {
    this.playSound('correct');
  }

  playWrong() {
    this.playSound('wrong');
  }

  playStreak() {
    this.playSound('streak');
  }

  playAchievement() {
    this.playSound('achievement');
  }

  playTimeWarning() {
    this.playSound('timeWarning');
  }

  // Music Management
  playMenuMusic() {
    if (!this.soundEnabled) return;
    
    // Stop any current music
    this.stopMusic();
    
    const music = this.sounds.menuMusic;
    if (!music) return;
    
    // Set to loop
    music.setNumberOfLoops(-1);
    music.setVolume(this.musicVolume);
    
    // Play
    music.play((success) => {
      if (success) {
        this.currentMusic = 'menuMusic';
      } else {
        console.error('Menu music playback failed');
      }
    });
  }

  playQuizMusic() {
    if (!this.soundEnabled) return;
    
    // Stop any current music
    this.stopMusic();
    
    const music = this.sounds.quizMusic;
    if (!music) return;
    
    // Set to loop
    music.setNumberOfLoops(-1);
    music.setVolume(this.musicVolume);
    
    // Play
    music.play((success) => {
      if (success) {
        this.currentMusic = 'quizMusic';
      } else {
        console.error('Quiz music playback failed');
      }
    });
  }

  stopMusic() {
    if (this.currentMusic && this.sounds[this.currentMusic]) {
      this.sounds[this.currentMusic].stop();
      this.currentMusic = null;
    }
  }

  pauseMusic() {
    if (this.currentMusic && this.sounds[this.currentMusic]) {
      this.sounds[this.currentMusic].pause();
    }
  }

  resumeMusic() {
    if (this.currentMusic && this.sounds[this.currentMusic] && this.soundEnabled) {
      this.sounds[this.currentMusic].play();
    }
  }

  fadeOutMusic(duration = 1000) {
    if (!this.currentMusic || !this.sounds[this.currentMusic]) return;
    
    const music = this.sounds[this.currentMusic];
    const steps = 20;
    const stepDuration = duration / steps;
    const volumeStep = this.musicVolume / steps;
    let currentStep = 0;
    
    const fadeInterval = setInterval(() => {
      currentStep++;
      const newVolume = Math.max(0, this.musicVolume - (volumeStep * currentStep));
      music.setVolume(newVolume);
      
      if (currentStep >= steps) {
        clearInterval(fadeInterval);
        this.stopMusic();
        music.setVolume(this.musicVolume); // Reset volume for next play
      }
    }, stepDuration);
  }

  fadeInMusic(soundKey, duration = 1000) {
    if (!this.soundEnabled || !this.sounds[soundKey]) return;
    
    const music = this.sounds[soundKey];
    music.setVolume(0);
    
    // Start playing at 0 volume
    music.setNumberOfLoops(-1);
    music.play((success) => {
      if (!success) {
        console.error(`Failed to start ${soundKey}`);
        return;
      }
      
      this.currentMusic = soundKey;
      
      // Fade in
      const steps = 20;
      const stepDuration = duration / steps;
      const volumeStep = this.musicVolume / steps;
      let currentStep = 0;
      
      const fadeInterval = setInterval(() => {
        currentStep++;
        const newVolume = Math.min(this.musicVolume, volumeStep * currentStep);
        music.setVolume(newVolume);
        
        if (currentStep >= steps) {
          clearInterval(fadeInterval);
        }
      }, stepDuration);
    });
  }

  // Stop all sounds
  stopAllSounds() {
    Object.values(this.sounds).forEach(sound => {
      if (sound) {
        sound.stop();
      }
    });
    this.currentMusic = null;
  }

  // Clean up resources
  release() {
    this.stopAllSounds();
    
    Object.values(this.sounds).forEach(sound => {
      if (sound) {
        sound.release();
      }
    });
    
    this.sounds = {};
    this.isInitialized = false;
  }
}

export default new SoundService();
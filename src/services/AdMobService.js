// src/services/AdMobService.js
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  BannerAd,
  BannerAdSize,
  RewardedAd,
  RewardedAdEventType,
  TestIds,
  AdEventType,
} from 'react-native-google-mobile-ads';

class AdMobService {
  constructor() {
    // Your actual AdMob IDs
    this.appId = 'ca-app-pub-7353957756801275~5242496423';
    
    // Ad Unit IDs - Use test IDs in development, real IDs in production
    this.bannerAdId = __DEV__ 
      ? TestIds.BANNER // Test banner for development
      : 'ca-app-pub-7353957756801275/3370462815'; // Your real banner ID
      
    this.rewardedAdId = __DEV__
      ? TestIds.REWARDED // Test rewarded for development
      : 'ca-app-pub-7353957756801275/3777656920'; // Your real rewarded ID
      
    this.adsEnabled = true;
    this.rewardedAd = null;
    this.rewardedAdLoaded = false;
    this.rewardCallbacks = null;
  }

  async initialize() {
    try {
      // Check if ads are enabled in settings
      const adsEnabled = await AsyncStorage.getItem('brainbites_ads_enabled');
      if (adsEnabled !== null) {
        this.adsEnabled = adsEnabled === 'true';
      }
      
      // Initialize rewarded ad
      if (this.adsEnabled) {
        this.loadRewardedAd();
      }
      
      console.log('AdMob Service initialized with App ID:', this.appId);
    } catch (error) {
      console.error('Error initializing AdMob:', error);
    }
  }

  // Toggle ads on/off
  async setAdsEnabled(enabled) {
    this.adsEnabled = enabled;
    await AsyncStorage.setItem('brainbites_ads_enabled', enabled.toString());
    
    if (enabled) {
      this.loadRewardedAd();
    } else {
      // Clean up ads if disabled
      if (this.rewardedAd) {
        this.rewardedAd = null;
        this.rewardedAdLoaded = false;
      }
    }
  }

  // Get banner ad configuration
  getBannerAdConfig() {
    if (!this.adsEnabled) return null;
    
    return {
      unitId: this.bannerAdId,
      size: BannerAdSize.ANCHORED_ADAPTIVE_BANNER,
      requestOptions: {
        requestNonPersonalizedAdsOnly: true,
      },
    };
  }

  // Load rewarded ad
  loadRewardedAd() {
    if (!this.adsEnabled) return;
    
    // Create rewarded ad instance
    this.rewardedAd = RewardedAd.createForAdRequest(this.rewardedAdId, {
      requestNonPersonalizedAdsOnly: true,
    });
    
    // Set up event listeners
    const unsubscribeLoaded = this.rewardedAd.addAdEventListener(
      RewardedAdEventType.LOADED,
      () => {
        console.log('Rewarded ad loaded');
        this.rewardedAdLoaded = true;
      }
    );
    
    const unsubscribeEarned = this.rewardedAd.addAdEventListener(
      RewardedAdEventType.EARNED_REWARD,
      (reward) => {
        console.log('User earned reward:', reward);
        if (this.rewardCallbacks && this.rewardCallbacks.onRewarded) {
          this.rewardCallbacks.onRewarded(reward);
        }
      }
    );
    
    const unsubscribeClosed = this.rewardedAd.addAdEventListener(
      AdEventType.CLOSED,
      () => {
        console.log('Rewarded ad closed');
        if (this.rewardCallbacks && this.rewardCallbacks.onClosed) {
          this.rewardCallbacks.onClosed();
        }
        // Load next ad
        this.rewardedAdLoaded = false;
        this.loadRewardedAd();
      }
    );
    
    const unsubscribeError = this.rewardedAd.addAdEventListener(
      AdEventType.ERROR,
      (error) => {
        console.error('Rewarded ad error:', error);
        this.rewardedAdLoaded = false;
        // Retry loading after error
        setTimeout(() => this.loadRewardedAd(), 30000); // Retry after 30 seconds
      }
    );
    
    // Load the ad
    this.rewardedAd.load();
  }

  // Show rewarded ad (for bonus time)
  async showRewardedAd(callbacks = {}) {
    if (!this.adsEnabled) {
      console.log('Ads are disabled');
      return false;
    }
    
    if (!this.rewardedAdLoaded || !this.rewardedAd) {
      console.log('Rewarded ad not ready');
      // Try to load ad
      this.loadRewardedAd();
      return false;
    }
    
    try {
      // Store callbacks
      this.rewardCallbacks = callbacks;
      
      // Show the ad
      await this.rewardedAd.show();
      return true;
    } catch (error) {
      console.error('Error showing rewarded ad:', error);
      this.rewardedAdLoaded = false;
      this.loadRewardedAd();
      return false;
    }
  }

  // Check if rewarded ad is ready
  isRewardedAdReady() {
    return this.adsEnabled && this.rewardedAdLoaded && this.rewardedAd !== null;
  }

  // Get ad status
  getAdStatus() {
    return {
      adsEnabled: this.adsEnabled,
      rewardedAdReady: this.isRewardedAdReady(),
      bannerAdId: this.bannerAdId,
    };
  }
}

export default new AdMobService();
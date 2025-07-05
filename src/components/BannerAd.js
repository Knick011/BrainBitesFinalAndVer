// src/components/BannerAd.js
import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';
import AdMobService from '../services/AdMobService';

const BannerAdComponent = ({ style }) => {
  const [adLoaded, setAdLoaded] = useState(false);
  const [adError, setAdError] = useState(false);
  
  const adConfig = AdMobService.getBannerAdConfig();
  
  if (!adConfig || !AdMobService.adsEnabled) {
    return null;
  }
  
  return (
    <View style={[styles.container, style]}>
      <BannerAd
        unitId={adConfig.unitId}
        size={adConfig.size}
        requestOptions={adConfig.requestOptions}
        onAdLoaded={() => {
          console.log('Banner ad loaded successfully');
          setAdLoaded(true);
          setAdError(false);
        }}
        onAdFailedToLoad={(error) => {
          console.error('Banner ad failed to load:', error);
          setAdError(true);
          setAdLoaded(false);
        }}
        onAdOpened={() => {
          console.log('Banner ad opened');
        }}
        onAdClosed={() => {
          console.log('Banner ad closed');
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
});

export default BannerAdComponent;
// App.js - Simplified version to get the app running
import React, { useEffect, useState } from 'react';
import { 
  StatusBar, 
  View, 
  Text, 
  ActivityIndicator, 
  StyleSheet, 
  LogBox, 
  Platform,
  Dimensions 
} from 'react-native';

// Ignore specific warnings
LogBox.ignoreLogs([
  'ViewPropTypes will be removed',
  'ColorPropType will be removed',
]);

const App = () => {
  const [isInitializing, setIsInitializing] = useState(true);
  
  useEffect(() => {
    // Hide status bar for full screen
    StatusBar.setHidden(true);
    StatusBar.setBarStyle('light-content');
    
    if (Platform.OS === 'android') {
      StatusBar.setBackgroundColor('transparent');
      StatusBar.setTranslucent(true);
    }
    
    // Simulate initialization
    setTimeout(() => {
      setIsInitializing(false);
    }, 2000);
  }, []);
  
  if (isInitializing) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar hidden={true} />
        <Text style={styles.loadingTitle}>BrainBites</Text>
        <Text style={styles.loadingSubtitle}>Loading your learning adventure...</Text>
        <ActivityIndicator size="large" color="#FF9F1C" style={styles.loader} />
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      <StatusBar hidden={true} />
      <Text style={styles.title}>Welcome to BrainBites!</Text>
      <Text style={styles.subtitle}>Your learning adventure awaits...</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFCF2',
    paddingTop: Platform.OS === 'android' ? 0 : 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFCF2',
    paddingTop: Platform.OS === 'android' ? 0 : 20,
  },
  loadingTitle: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FF9F1C',
    marginBottom: 10,
    fontFamily: Platform.select({
      ios: 'ArialRoundedMTBold',
      android: 'sans-serif-medium',
    }),
  },
  loadingSubtitle: {
    fontSize: 18,
    color: '#666',
    marginBottom: 30,
    fontFamily: Platform.select({
      ios: 'Noteworthy-Bold',
      android: 'sans-serif',
    }),
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FF9F1C',
    marginBottom: 20,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
  },
  loader: {
    marginTop: 20,
  },
});

export default App;
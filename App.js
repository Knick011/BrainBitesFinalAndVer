// App.js - Main entry point with full screen support
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
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import screens
import WelcomeScreen from './src/screens/WelcomeScreen';
import HomeScreen from './src/screens/HomeScreen';
import QuizScreen from './src/screens/QuizScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import LeaderboardScreen from './src/screens/LeaderboardScreen';
import DailyGoalsScreen from './src/screens/DailyGoalsScreen';

// Import services
import EnhancedTimerService from './src/services/EnhancedTimerService';
import SoundService from './src/services/SoundService';
import QuizService from './src/services/QuizService';
import ScoreService from './src/services/ScoreService';
import NotificationService from './src/services/NotificationService';
import AnalyticsService from './src/services/AnalyticsService';
import DailyGoalsService from './src/services/DailyGoalsService';
import AdMobService from './src/services/AdMobService';

// Ignore specific warnings
LogBox.ignoreLogs([
  'ViewPropTypes will be removed',
  'ColorPropType will be removed',
]);

const Stack = createStackNavigator();

const App = () => {
  const [isInitializing, setIsInitializing] = useState(true);
  const [isFirstLaunch, setIsFirstLaunch] = useState(true);
  
  useEffect(() => {
    // Hide status bar for full screen
    StatusBar.setHidden(true);
    StatusBar.setBarStyle('light-content');
    
    if (Platform.OS === 'android') {
      StatusBar.setBackgroundColor('transparent');
      StatusBar.setTranslucent(true);
    }
    
    const initializeServices = async () => {
      try {
        console.log("Initializing BrainBites services...");
        
        // Initialize Analytics first
        await AnalyticsService.initialize();
        console.log("✓ Analytics service initialized");
        
        // Check if first launch
        const hasLaunchedBefore = await AsyncStorage.getItem('brainbites_onboarding_complete');
        const isFirstTime = hasLaunchedBefore !== 'true';
        setIsFirstLaunch(isFirstTime);
        
        // Track app launch
        await AnalyticsService.trackAppLaunch(isFirstTime);
        
        // Initialize sounds
        await SoundService.initialize();
        console.log("✓ Sound service initialized");
        
        // Load questions
        await QuizService.loadQuestions();
        console.log("✓ Quiz service initialized");
        
        // Initialize score service
        await ScoreService.loadSavedData();
        console.log("✓ Score service initialized");
        
        // Initialize timer service
        await EnhancedTimerService.initialize();
        console.log("✓ Timer service initialized");
        
        // Initialize notifications
        await NotificationService.initialize();
        console.log("✓ Notification service initialized");
        
        // Initialize daily goals
        await DailyGoalsService.initialize();
        console.log("✓ Daily goals service initialized");
        
        // Initialize ads
        await AdMobService.initialize();
        console.log("✓ AdMob service initialized");
        
        // Add slight delay for smooth transition
        setTimeout(() => {
          setIsInitializing(false);
        }, 1500);
        
      } catch (error) {
        console.error("Error initializing services:", error);
        setIsInitializing(false);
      }
    };
    
    initializeServices();
    
    // Cleanup function
    return () => {
      SoundService.stopAllSounds();
      EnhancedTimerService.cleanup();
    };
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
    <SafeAreaProvider>
      <StatusBar hidden={true} />
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName={isFirstLaunch ? "Welcome" : "Home"}
          screenOptions={{
            headerShown: false,
            cardStyle: { backgroundColor: '#FFFCF2' },
            animationEnabled: true,
            gestureEnabled: true,
          }}
        >
          <Stack.Screen 
            name="Welcome" 
            component={WelcomeScreen}
            options={{
              gestureEnabled: false,
            }}
          />
          <Stack.Screen 
            name="Home" 
            component={HomeScreen}
            options={{
              gestureEnabled: false,
            }}
          />
          <Stack.Screen 
            name="Quiz" 
            component={QuizScreen}
            options={{
              gestureEnabled: false,
            }}
          />
          <Stack.Screen 
            name="Settings" 
            component={SettingsScreen}
          />
          <Stack.Screen 
            name="Leaderboard" 
            component={LeaderboardScreen}
          />
          <Stack.Screen 
            name="DailyGoals" 
            component={DailyGoalsScreen}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
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
  loader: {
    marginTop: 20,
  },
});

export default App;
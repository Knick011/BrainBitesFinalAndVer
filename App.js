// App.js - With debugging and error handling
import React, { Component } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  LogBox,
  Alert,
} from 'react-native';

// Ignore specific warnings
LogBox.ignoreLogs([
  'ViewPropTypes will be removed',
  'ColorPropType will be removed',
  'Require cycle:',
  'Non-serializable values were found',
]);

// Error Boundary Component
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Oops! Something went wrong</Text>
          <Text style={styles.errorText}>{this.state.error?.toString()}</Text>
          <TouchableOpacity 
            style={styles.errorButton}
            onPress={() => this.setState({ hasError: false, error: null })}
          >
            <Text style={styles.errorButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}

// Main App Component
const App = () => {
  const [isLoading, setIsLoading] = React.useState(true);
  const [debugInfo, setDebugInfo] = React.useState('');

  React.useEffect(() => {
    console.log('App.js mounted successfully');
    
    // Add debug info
    const info = `
React Native: ${Platform.constants.reactNativeVersion?.major || 'unknown'}.${Platform.constants.reactNativeVersion?.minor || 'unknown'}.${Platform.constants.reactNativeVersion?.patch || 'unknown'}
Platform: ${Platform.OS} ${Platform.Version}
DEV: ${__DEV__}
    `.trim();
    
    setDebugInfo(info);
    console.log('Debug Info:', info);
    
    // Simulate initialization
    setTimeout(() => {
      console.log('Loading complete');
      setIsLoading(false);
    }, 2000);
    
    // Show alert on mount (for debugging)
    if (__DEV__) {
      console.log('App is running in development mode');
    }
  }, []);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.title}>🧠 BrainBites</Text>
        <ActivityIndicator size="large" color="#FF9F1C" />
        <Text style={styles.loadingText}>Loading...</Text>
        <Text style={styles.debugText}>{debugInfo}</Text>
      </View>
    );
  }

  return (
    <ErrorBoundary>
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFCF2" />
        <ScrollView 
          contentInsetAdjustmentBehavior="automatic"
          style={styles.scrollView}
        >
          <View style={styles.content}>
            <Text style={styles.title}>🧠 BrainBites</Text>
            <Text style={styles.subtitle}>Learn & Earn Screen Time!</Text>
            
            <View style={styles.card}>
              <Text style={styles.cardTitle}>App is Running!</Text>
              <Text style={styles.cardText}>
                If you can see this, the app is working correctly.
              </Text>
              <Text style={styles.debugInfo}>{debugInfo}</Text>
            </View>
            
            <TouchableOpacity 
              style={styles.button}
              onPress={() => {
                console.log('Button pressed!');
                Alert.alert('Success', 'Button is working!');
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.buttonText}>Test Button</Text>
            </TouchableOpacity>
            
            {/* Add more test content to ensure scrolling works */}
            <View style={styles.testSection}>
              <Text style={styles.sectionTitle}>Quick Tests</Text>
              <TouchableOpacity 
                style={[styles.testButton, { backgroundColor: '#4ECDC4' }]}
                onPress={() => Alert.alert('Test 1', 'Working!')}
              >
                <Text style={styles.buttonText}>Test Alert</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.testButton, { backgroundColor: '#FF6B6B' }]}
                onPress={() => console.log('Console log test')}
              >
                <Text style={styles.buttonText}>Test Console</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </ErrorBoundary>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFCF2',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFCF2',
    padding: 20,
  },
  content: {
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FF9F1C',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 20,
    color: '#666',
    marginBottom: 30,
    textAlign: 'center',
  },
  loadingText: {
    marginTop: 20,
    fontSize: 18,
    color: '#666',
  },
  debugText: {
    marginTop: 10,
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#FFF',
    padding: 20,
    borderRadius: 15,
    marginBottom: 30,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  cardText: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
    marginBottom: 10,
  },
  debugInfo: {
    fontSize: 12,
    color: '#999',
    fontFamily: Platform.select({
      ios: 'Courier',
      android: 'monospace',
    }),
    marginTop: 10,
  },
  button: {
    backgroundColor: '#FF9F1C',
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 25,
    elevation: 5,
    marginBottom: 20,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  testSection: {
    width: '100%',
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
    textAlign: 'center',
  },
  testButton: {
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 20,
    marginBottom: 10,
  },
  // Error boundary styles
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFCF2',
    padding: 20,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF6B6B',
    marginBottom: 10,
  },
  errorText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  errorButton: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 20,
  },
  errorButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default App;
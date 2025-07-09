#!/bin/bash

echo "🔧 Installing stable React Native 0.71.14..."
echo "This version has better compatibility with most dependencies"
echo ""

# Step 1: Clean up current project
echo "🧹 Cleaning up current installation..."
rm -rf node_modules
rm -rf android/app/build
rm -rf android/build
rm -rf android/.gradle
rm -f package-lock.json
rm -f yarn.lock

# For iOS
if [[ "$OSTYPE" == "darwin"* ]]; then
    cd ios
    rm -rf Pods
    rm -f Podfile.lock
    cd ..
fi

# Step 2: Create new package.json with stable versions
echo "📦 Creating package.json with stable versions..."
cat > package.json << 'EOF'
{
  "name": "BrainBites",
  "version": "0.0.1",
  "private": true,
  "scripts": {
    "android": "react-native run-android",
    "ios": "react-native run-ios",
    "lint": "eslint .",
    "start": "react-native start",
    "test": "jest",
    "clean": "cd android && ./gradlew clean && cd ..",
    "reset-cache": "npx react-native start --reset-cache"
  },
  "dependencies": {
    "react": "18.2.0",
    "react-native": "0.71.14",
    "@react-native-async-storage/async-storage": "^1.17.11",
    "@react-navigation/native": "^6.1.7",
    "@react-navigation/stack": "^6.3.17",
    "react-native-gesture-handler": "^2.12.1",
    "react-native-linear-gradient": "^2.8.3",
    "react-native-reanimated": "^3.3.0",
    "react-native-safe-area-context": "^4.6.3",
    "react-native-screens": "^3.22.1",
    "react-native-vector-icons": "^9.2.0"
  },
  "devDependencies": {
    "@babel/core": "^7.20.0",
    "@babel/preset-env": "^7.20.0",
    "@babel/runtime": "^7.20.0",
    "@react-native-community/eslint-config": "^3.2.0",
    "@tsconfig/react-native": "^2.0.2",
    "@types/jest": "^29.2.1",
    "@types/react": "^18.0.24",
    "@types/react-test-renderer": "^18.0.0",
    "babel-jest": "^29.2.1",
    "babel-plugin-module-resolver": "^5.0.0",
    "eslint": "^8.19.0",
    "jest": "^29.2.1",
    "metro-react-native-babel-preset": "0.73.10",
    "prettier": "^2.4.1",
    "react-test-renderer": "18.2.0",
    "typescript": "4.8.4"
  },
  "jest": {
    "preset": "react-native"
  }
}
EOF

# Step 3: Install dependencies
echo "📥 Installing dependencies..."
npm install

# Step 4: Fix Android build.gradle for compatibility
echo "🔧 Fixing Android configuration..."
cat > android/build.gradle << 'EOF'
// Top-level build file where you can add configuration options common to all sub-projects/modules.

buildscript {
    ext {
        buildToolsVersion = "33.0.0"
        minSdkVersion = 21
        compileSdkVersion = 33
        targetSdkVersion = 33
        
        // We use NDK 23 for compatibility
        ndkVersion = "23.1.7779620"
    }
    repositories {
        google()
        mavenCentral()
    }
    dependencies {
        classpath("com.android.tools.build:gradle:7.3.1")
        classpath("com.facebook.react:react-native-gradle-plugin")
    }
}

allprojects {
    repositories {
        google()
        mavenCentral()
        maven { url "https://www.jitpack.io" }
    }
}
EOF

# Step 5: Fix gradle wrapper
echo "📦 Updating Gradle wrapper..."
cat > android/gradle/wrapper/gradle-wrapper.properties << 'EOF'
distributionBase=GRADLE_USER_HOME
distributionPath=wrapper/dists
distributionUrl=https\://services.gradle.org/distributions/gradle-7.5.1-all.zip
networkTimeout=10000
zipStoreBase=GRADLE_USER_HOME
zipStorePath=wrapper/dists
EOF

# Step 6: Create metro.config.js
echo "📝 Creating metro.config.js..."
cat > metro.config.js << 'EOF'
const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');

const defaultConfig = getDefaultConfig(__dirname);

const config = {
  transformer: {
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,
        inlineRequires: true,
      },
    }),
  },
  resolver: {
    sourceExts: ['jsx', 'js', 'ts', 'tsx', 'json'],
  },
};

module.exports = mergeConfig(defaultConfig, config);
EOF

# Step 7: Create babel.config.js
echo "📝 Creating babel.config.js..."
cat > babel.config.js << 'EOF'
module.exports = {
  presets: ['module:metro-react-native-babel-preset'],
  plugins: [
    'react-native-reanimated/plugin',
    [
      'module-resolver',
      {
        root: ['./src'],
        extensions: ['.ios.js', '.android.js', '.js', '.ts', '.tsx', '.json'],
        alias: {
          '@components': './src/components',
          '@screens': './src/screens',
          '@services': './src/services',
          '@utils': './src/utils',
          '@assets': './assets',
        },
      },
    ],
  ],
};
EOF

# Step 8: Create a simple working App.js
echo "📱 Creating App.js..."
cat > App.js << 'EOF'
import React, { useEffect, useState } from 'react';
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
} from 'react-native';

const App = () => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate initialization
    setTimeout(() => {
      setIsLoading(false);
    }, 2000);
  }, []);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.title}>🧠 BrainBites</Text>
        <ActivityIndicator size="large" color="#FF9F1C" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFCF2" />
      <ScrollView contentInsetAdjustmentBehavior="automatic">
        <View style={styles.content}>
          <Text style={styles.title}>🧠 BrainBites</Text>
          <Text style={styles.subtitle}>Learn & Earn Screen Time!</Text>
          
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Welcome!</Text>
            <Text style={styles.cardText}>
              This is React Native {Platform.constants.reactNativeVersion.major}.
              {Platform.constants.reactNativeVersion.minor}.
              {Platform.constants.reactNativeVersion.patch}
            </Text>
            <Text style={styles.cardText}>
              Running on {Platform.OS} {Platform.Version}
            </Text>
          </View>
          
          <TouchableOpacity style={styles.button}>
            <Text style={styles.buttonText}>Start Learning</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFCF2',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFCF2',
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
  },
  subtitle: {
    fontSize: 20,
    color: '#666',
    marginBottom: 30,
  },
  loadingText: {
    marginTop: 20,
    fontSize: 18,
    color: '#666',
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
    marginBottom: 5,
  },
  button: {
    backgroundColor: '#FF9F1C',
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 25,
    elevation: 5,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default App;
EOF

# Step 9: Link vector icons for Android
echo "🔗 Setting up vector icons..."
mkdir -p android/app/src/main/assets/fonts
if [ -f "node_modules/react-native-vector-icons/Fonts/MaterialCommunityIcons.ttf" ]; then
    cp node_modules/react-native-vector-icons/Fonts/*.ttf android/app/src/main/assets/fonts/
fi

# Add vector icons to build.gradle
echo "
apply from: \"../../node_modules/react-native-vector-icons/fonts.gradle\"" >> android/app/build.gradle

# Step 10: Clean and prepare
echo "🧹 Cleaning Android build..."
cd android
./gradlew clean
cd ..

echo "✅ Installation complete!"
echo ""
echo "Next steps:"
echo "1. Run: npx react-native start --reset-cache"
echo "2. In another terminal: npx react-native run-android"
echo ""
echo "This setup uses React Native 0.71.14 which is more stable with:"
echo "- Better dependency compatibility"
echo "- Proven stability"
echo "- Working with SDK 33"
echo ""
echo "Once it's running, you can gradually add your components back."
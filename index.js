/**
 * @format
 */

import { AppRegistry, LogBox } from 'react-native';
import App from './App';
import { name as appName } from './app.json';

// Disable warnings in development
if (__DEV__) {
    LogBox.ignoreLogs([
        'ViewPropTypes will be removed',
        'ColorPropType will be removed',
        'Require cycle:',
        'Non-serializable values were found',
    ]);
    
    console.log('=================================');
    console.log('BrainBites App Starting...');
    console.log('App Name:', appName);
    console.log('Dev Mode:', __DEV__);
    console.log('=================================');
}

// Register the main app component
AppRegistry.registerComponent(appName, () => App);

// Add global error handler for debugging
if (__DEV__) {
    const originalError = console.error;
    console.error = (...args) => {
        console.log('ERROR CAUGHT:', ...args);
        originalError(...args);
    };
}
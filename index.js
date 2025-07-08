// index.js
import { AppRegistry, LogBox } from 'react-native';
import App from './App.js';
import { name as appName } from './app.json';

// Configure LogBox
LogBox.ignoreLogs([
  'ViewPropTypes will be removed',
  'ColorPropType will be removed',
  'Remote debugger',
  'Non-serializable values were found in the navigation state',
]);

// Disable yellow box in production
if (!__DEV__) {
  console.log = () => {};
  console.warn = () => {};
  console.error = () => {};
}

// Register the app
AppRegistry.registerComponent(appName, () => App);
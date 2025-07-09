import messaging from '@react-native-firebase/messaging';
import { Alert, Platform } from 'react-native';

class PushNotificationService {
  async requestPermission() {
    const authStatus = await messaging().requestPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;
    return enabled;
  }

  async getToken() {
    return await messaging().getToken();
  }

  listenForMessages() {
    messaging().onMessage(async remoteMessage => {
      Alert.alert(
        remoteMessage.notification?.title || 'Notification',
        remoteMessage.notification?.body || '',
        [{ text: 'OK' }]
      );
    });
  }
}

export default new PushNotificationService(); 
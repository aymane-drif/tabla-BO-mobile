import 'react-native-gesture-handler';
import {AppRegistry} from 'react-native';
import App from './App'; // Assuming your main App component is in App.js or App.tsx
import {name as appName} from './app.json';
import messaging from '@react-native-firebase/messaging';
import AsyncStorage from '@react-native-async-storage/async-storage'; // Import AsyncStorage
import * as ExpoNotifications from 'expo-notifications'; // Import expo-notifications

console.log('Registering background message handler...');
ExpoNotifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true, // Show an alert banner
    shouldPlaySound: true, // Play a sound
    shouldSetBadge: true, // Whether to update the app icon badge number (iOS)
    shouldShowBanner: true, // Show a banner notification
    shouldShowList: true, // Show in notification list
  }),
});
// This handler will be called when a notification is received while the app is in the background or killed state.
messaging().setBackgroundMessageHandler(async remoteMessage => {
  let title ;
  let body;
  if (!remoteMessage)
    return;

  try {
    if (remoteMessage.notification) {
      title = remoteMessage.notification.title;
      body = remoteMessage.notification.body;
    } else if (remoteMessage.data) {
      // Fallback if notification payload is not standard, but title/body are in data
      // Adjust property names (e.g., data.title, data.message) as per your data payload structure
      title = remoteMessage.data.title || remoteMessage.data.message;
      body = remoteMessage.data.body || remoteMessage.data.details;
    }

    if (title && body) {
      await ExpoNotifications.scheduleNotificationAsync({
        content: {
          title: title,
          body: body,
          data: remoteMessage.data, // Pass along data for tap handling
        },
        trigger: null, // Immediate delivery
      });
    } else {
      console.warn('[wel wtf] Could not determine title or body for foreground notification.', remoteMessage);
    }
  } catch (error) {
    console.error('[NotificationContext] Error handling foreground notification:', error);
  }
});

AppRegistry.registerComponent(appName, () => App);


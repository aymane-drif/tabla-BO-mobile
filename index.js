import 'react-native-gesture-handler';
import {AppRegistry} from 'react-native';
import App from './App'; // Assuming your main App component is in App.js or App.tsx
import {name as appName} from './app.json';
import messaging from '@react-native-firebase/messaging';

// Register background handler
// This handler must be registered outside of your component lifecycle,
// typically in the entry file (index.js).
messaging().setBackgroundMessageHandler(async remoteMessage => {
  console.log('Message handled in the background!', remoteMessage);

  // Here you can:
  // - Perform background tasks (e.g., update local data, badge count).
  // - Schedule a local notification if needed (though FCM often handles the display).
  // - IMPORTANT: Do NOT attempt to update UI directly or navigate from here,
  //   as the app might not be in a state to handle UI updates.
  //   If you need to trigger UI changes upon app open, use getInitialNotification()
  //   or onNotificationOpenedApp() listeners within your app components.

  // Example: If your backend sends a specific data payload indicating a new message count
  // if (remoteMessage.data && remoteMessage.data.unreadCount) {
  //   // Store this count or update a badge, e.g., using a library like react-native-push-notification
  // }
});

// It's good practice to also check if the app was launched from a notification
// when it was in a killed state. This is handled by getInitialNotification()
// in your main app logic (e.g., Notifications.tsx or a root component).

AppRegistry.registerComponent(appName, () => App);

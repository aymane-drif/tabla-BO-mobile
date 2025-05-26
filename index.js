import 'react-native-gesture-handler';
import {AppRegistry} from 'react-native';
import App from './App'; // Assuming your main App component is in App.js or App.tsx
import {name as appName} from './app.json';
import messaging from '@react-native-firebase/messaging';
import AsyncStorage from '@react-native-async-storage/async-storage'; // Import AsyncStorage

// Register background handler
// This handler must be registered outside of your component lifecycle,
// typically in the entry file (index.js).
console.log('Registering background message handler...');
// This handler will be called when a notification is received while the app is in the background or killed state.
messaging().setBackgroundMessageHandler(async remoteMessage => {
  console.log('Message handled in the background!', remoteMessage);

  try {
    const { data, notification } = remoteMessage;

    // --- Perform background tasks here ---
    // These tasks should be lightweight and complete quickly.
    // Avoid long-running operations or direct UI manipulations.

    // Example 1: Update application badge count based on data payload
    if (data && data.unreadCount) {
      const newUnreadCount = parseInt(data.unreadCount, 10);
      if (!isNaN(newUnreadCount)) {
        console.log(`Background: Received unread count: ${newUnreadCount}`);
        // TODO: Implement logic to update the app\\'s badge count.
        // This might involve a native module or a library like @notifee/react-native or react-native-push-notification.
        // e.g., await YourBadgeUpdateModule.setBadgeCount(newUnreadCount);
      } else {
        console.warn('Background: Received unreadCount is not a valid number.', data.unreadCount);
      }
    }

    // Example 2: Store data for later use when the app opens
    if (data && data.someImportantInfo) {
      console.log('Background: Storing important info:', data.someImportantInfo);
      // Implement logic to store this data, e.g., using AsyncStorage.
      await AsyncStorage.setItem('backgroundNotificationData', JSON.stringify({ 
        someImportantInfo: data.someImportantInfo,
        receivedAt: new Date().toISOString() 
      }));
      console.log('Background: Important info stored successfully.');
    }

    // Example 3: If you need to trigger a local notification from a data-only message
    // Note: FCM often handles displaying notifications sent with a 'notification' payload automatically.
    // This is more for data-only messages where you want to control the notification display.
    if (data && !notification && data.showLocalNotification === 'true') {
      console.log('Background: Data message received, scheduling local notification.');
      // TODO: Implement logic to display a local notification.
      // This would typically use a library like @notifee/react-native.
      // e.g., await displayLocalNotification(data.title, data.body);
    }

    // --- End of background tasks ---

    // IMPORTANT REMINDERS:
    // 1. UI Updates: Do NOT attempt to update UI directly or navigate from this handler.
    //    The app might not be in a state to handle UI updates.
    // 2. App Launch: To handle UI changes or navigation when the app is opened from a
    //    notification (either from background or killed state), use listeners like
    //    `messaging().getInitialNotification()` and `messaging().onNotificationOpenedApp()`
    //    within your app\\'s component lifecycle (e.g., in your main App component or a dedicated notifications manager).

  } catch (error) {
    console.error('Error processing background message:', error);
    // It\\'s crucial to catch errors here to prevent the app from crashing
    // or the background handler from failing silently.
  }
});

// It's good practice to also check if the app was launched from a notification
// when it was in a killed state. This is handled by getInitialNotification()
// in your main app logic (e.g., Notifications.tsx or a root component).

AppRegistry.registerComponent(appName, () => App);


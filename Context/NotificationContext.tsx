import React, { createContext, useContext, useState, useEffect, useCallback, use } from 'react';
import { PermissionsAndroid, Platform } from 'react-native';
import messaging, { FirebaseMessagingTypes } from '@react-native-firebase/messaging';
import { useRouter } from 'expo-router';
import { useAuth } from './AuthContext';
import { api } from '@/api/axiosInstance';
import * as ExpoNotifications from 'expo-notifications'; // Import expo-notifications

// Define types
export type NotificationCountType = {
  read: number;
  total: number;
  unread: number;
};

export type PermissionStatus = 'granted' | 'denied' | 'undetermined';

type NotificationContextType = {
  notificationCounts: NotificationCountType;
  permissionStatus: PermissionStatus;
  checkAndRequestPermissions: (requestIfDenied?: boolean) => Promise<PermissionStatus>;
  fetchNotificationCounts: () => Promise<void>;
  onForegroundMessage: (callback: (message: FirebaseMessagingTypes.RemoteMessage) => void) => () => void;
  onNotificationOpen: (callback: (message: FirebaseMessagingTypes.RemoteMessage) => void) => () => void;
};

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  
  const [notificationCounts, setNotificationCounts] = useState<NotificationCountType>({ read: 0, total: 0, unread: 0 });
  const [permissionStatus, setPermissionStatus] = useState<PermissionStatus>('undetermined');
  const { isAuthenticated, restaurantId, registerDeviceForNotifications } = useAuth();
  const router = useRouter();
  
  // Foreground message listeners
  const [foregroundListeners, setForegroundListeners] = useState<
    ((message: FirebaseMessagingTypes.RemoteMessage) => void)[]
  >([]);
  
  // Notification open listeners
  const [openListeners, setOpenListeners] = useState<
    ((message: FirebaseMessagingTypes.RemoteMessage) => void)[]
  >([]);

  // Check and request notification permissions
  const checkAndRequestPermissions = useCallback(async (requestIfDenied = false): Promise<PermissionStatus> => {
    let currentStatus: PermissionStatus = 'undetermined';
    
    if (Platform.OS === 'ios') {
      const authStatus = await messaging().hasPermission();
      if (authStatus === messaging.AuthorizationStatus.AUTHORIZED || 
          authStatus === messaging.AuthorizationStatus.PROVISIONAL) {
        currentStatus = 'granted';
      } else if (authStatus === messaging.AuthorizationStatus.DENIED) {
        currentStatus = 'denied';
      }
      
      if ((authStatus === messaging.AuthorizationStatus.NOT_DETERMINED || 
          (requestIfDenied && authStatus === messaging.AuthorizationStatus.DENIED))) {
        const requestStatus = await messaging().requestPermission();
        if (requestStatus === messaging.AuthorizationStatus.AUTHORIZED || 
            requestStatus === messaging.AuthorizationStatus.PROVISIONAL) {
          currentStatus = 'granted';
        } else if (requestStatus === messaging.AuthorizationStatus.DENIED) {
          currentStatus = 'denied';
        }
      }
    } else if (Platform.OS === 'android') {
      // Android permissions handling
      currentStatus = 'granted'; // Android defaults to granted if app is installed
      
      // For Android 13+ (API level 33+), explicit permission is required
      if (Platform.Version >= 33 && requestIfDenied) {
        try {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
          );
          if (granted === PermissionsAndroid.RESULTS.GRANTED) {
            currentStatus = 'granted';
          } else {
            currentStatus = 'denied';
          }
        } catch (err) {
          console.error('Error requesting notification permission:', err);
        }
      }
    }
    
    setPermissionStatus(currentStatus);
    return currentStatus;
  }, []);

  // Fetch notification counts
  const fetchNotificationCounts = useCallback(async () => {
    if (!isAuthenticated) return;
    
    try {
      const response = await api.get('/api/v1/notifications/count/');
      setNotificationCounts(response.data || { read: 0, total: 0, unread: 0 });
    } catch (error) {
      console.error('Failed to fetch notification counts:', error);
    }
  }, [isAuthenticated]);

  // Add a foreground message listener
  const onForegroundMessage = useCallback((callback: (remoteMessage: FirebaseMessagingTypes.RemoteMessage) => void) => {
    setForegroundListeners(prev => [...prev, callback]);

    // Return cleanup function
    return () => {
      setForegroundListeners(prev => prev.filter(listener => listener !== callback));
    };
  }, []);

  // Add a notification open listener
  const onNotificationOpen = useCallback((callback: (message: FirebaseMessagingTypes.RemoteMessage) => void) => {
    setOpenListeners(prev => [...prev, callback]);
    
    // Return cleanup function
    return () => {
      setOpenListeners(prev => prev.filter(listener => listener !== callback));
    };
  }, []);

  useEffect(() => {
    if(!isAuthenticated || !restaurantId) 
        return;
    
    fetchNotificationCounts();
  }, [isAuthenticated, restaurantId, fetchNotificationCounts]);

  // Set up notification handlers when app mounts
  useEffect(() => {
    if (!isAuthenticated) return;
    
    // Check permissions on mount
    checkAndRequestPermissions(false);
    
    // Handle foreground messages
    const foregroundUnsubscribe = messaging().onMessage(async remoteMessage => {
      console.log('[NotificationContext] Message received in foreground:', remoteMessage);
      let title: string | undefined;
      let body: string | undefined;
      if(!remoteMessage)
        return;

      try {
        if (remoteMessage.notification) {
        title = remoteMessage.notification.title;
        body = remoteMessage.notification.body;
      } else if (remoteMessage.data) {
        // Fallback if notification payload is not standard, but title/body are in data
        // Adjust property names (e.g., data.title, data.message) as per your data payload structure
        title = remoteMessage.data.title as string || remoteMessage.data.message as string;
        body = remoteMessage.data.body as string || remoteMessage.data.details as string;
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

      // Update notification counts
      fetchNotificationCounts();
      
      // Call all registered foreground listeners
      foregroundListeners.forEach(listener => {
        try {
          listener(remoteMessage);
        } catch (error) {
          console.error('[NotificationContext] Error in foreground listener:', error);
        }
      });
    });
    
    // Handle notification tap when app is in background
    const backgroundUnsubscribe = messaging().onNotificationOpenedApp(remoteMessage => {
      console.log('[NotificationContext] Notification caused app to open from background state:', remoteMessage);
      
      // Default navigation behavior for reservation notifications
      const reservationId = remoteMessage?.data?.reservation_id;
      if (reservationId) {
        console.log(`[NotificationContext] Navigating to reservation ID: ${reservationId}`);
        router.push(`/(tabs)?reservation_id=${reservationId}`);
      }
      
      // Call all registered open listeners
      openListeners.forEach(listener => {
        try {
          listener(remoteMessage);
        } catch (error) {
          console.error('[NotificationContext] Error in notification open listener:', error);
        }
      });
    });
    
    // Check if app was opened from quit state via notification
    messaging().getInitialNotification().then(remoteMessage => {
      if (remoteMessage) {
        console.log('[NotificationContext] Notification caused app to open from quit state:', remoteMessage);
        
        const reservationId = remoteMessage?.data?.reservation_id;
        if (reservationId) {
          console.log(`[NotificationContext] Navigating to reservation ID: ${reservationId} from quit state`);
          router.push(`/(tabs)?reservation_id=${reservationId}`);
        }
        
        // Call all registered open listeners
        openListeners.forEach(listener => {
          try {
            listener(remoteMessage);
          } catch (error) {
            console.error('[NotificationContext] Error in initial notification listener:', error);
          }
        });
      }
    });
    
    // Set up token refresh handler
    const tokenRefreshUnsubscribe = messaging().onTokenRefresh(token => {
      console.log('[NotificationContext] FCM token refreshed');
      registerDeviceForNotifications();
    });
    
    // Clean up all listeners on unmount
    return () => {
      foregroundUnsubscribe();
      backgroundUnsubscribe();
      tokenRefreshUnsubscribe();
    };
  }, [isAuthenticated, checkAndRequestPermissions, fetchNotificationCounts, foregroundListeners, openListeners, router, registerDeviceForNotifications]);

  const value = {
    notificationCounts,
    permissionStatus,
    checkAndRequestPermissions,
    fetchNotificationCounts,
    onForegroundMessage,
    onNotificationOpen
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
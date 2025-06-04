import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, SafeAreaView, Alert, ActivityIndicator, Button, Platform, Linking } from 'react-native'; // Added Linking
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import NotificationItem from '../components/notification/NotificationItem';
import { useTheme } from '../Context/ThemeContext';
import { api } from '@/api/axiosInstance';
import messaging from '@react-native-firebase/messaging';
import { useAuth } from '../Context/AuthContext'; // Import useAuth
import { ErrorBoundaryProps, useRouter as useExpoRouter } from 'expo-router';
import { PermissionsAndroid } from 'react-native';
import { Feather } from '@expo/vector-icons'; // For icons in permission alert

export type NotificationType = { // Assuming this structure based on dummy data and web app
  user_notification_id: number;
  notification_id: number;
  restaurant_id: number;
  restaurant_name: string;
  notification_type: string; // e.g., 'RESERVATION', 'ALERT'
  title: string;
  message: string;
  data: {
    action?: string;
    status?: string;
    event_type?: string;
    reservation_id?: string;
    restaurant_name?: string;
    restaurant_id_payload?: string;
    [key: string]: any; // Allow other properties in data
  };
  created_at: string;
  is_read: boolean;
  read_at: string | null;
};

interface NotificationsApiResponse {
  results: NotificationType[];
  count: number; // Total count of notifications matching filters for the current tab
}

interface NotificationCountType {
  read: number;
  total: number;
  unread: number;
}

const PAGE_SIZE = 20;
type ActiveTab = 'unread' | 'read';

// Define PermissionStatus type
type PermissionStatus = 'granted' | 'denied' | 'blocked' | 'undetermined';


export function ErrorBoundary(props: ErrorBoundaryProps) {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Something went wrong with Notifications.</Text>
      <Text>{props.error.message}</Text>
      <Button onPress={props.retry} title="Try Again" />
    </View>
  );
}

// Skeleton Loader for Notification Item
const NotificationItemSkeleton = ({ colors }: { colors: ReturnType<typeof useTheme>['colors'] }) => {
  const styles = getStyles(colors); // Assuming getStyles is accessible or pass styles
  return (
    <View style={styles.skeletonItem}>
      <View style={styles.skeletonIcon} />
      <View style={styles.skeletonTextContainer}>
        <View style={[styles.skeletonTextLine, { width: '70%' }]} />
        <View style={[styles.skeletonTextLine, { width: '90%', marginTop: 6 }]} />
        <View style={[styles.skeletonTextLine, { width: '50%', marginTop: 6 }]} />
      </View>
    </View>
  );
};


const Notifications = () => {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const router = useExpoRouter();
  const { isAuthenticated, registerDeviceForNotifications } = useAuth();
  const [notifications, setNotifications] = useState<NotificationType[]>([]);
  const [activeTab, setActiveTab] = useState<ActiveTab>('unread');
  
  const [isLoading, setIsLoading] = useState(false);
  const [isPageLoading, setIsPageLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notificationCounts, setNotificationCounts] = useState<NotificationCountType>({ read: 0, total: 0, unread: 0 });
  
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [notificationPermissionStatus, setNotificationPermissionStatus] = useState<PermissionStatus>('undetermined');
  const initialLoadDone = useRef(false); // To track initial permission check

  const checkAndRequestPermissions = useCallback(async (requestIfDenied = false) => {
    let currentStatus: PermissionStatus = 'undetermined';
    if (Platform.OS === 'ios') {
      const authStatus = await messaging().hasPermission();
      if (authStatus === messaging.AuthorizationStatus.AUTHORIZED || authStatus === messaging.AuthorizationStatus.PROVISIONAL) {
        currentStatus = 'granted';
      } else if (authStatus === messaging.AuthorizationStatus.DENIED) {
        currentStatus = 'denied';
      } else { // NOT_DETERMINED or other
        currentStatus = 'undetermined';
      }

      if ((currentStatus === 'denied' || currentStatus === 'undetermined') && requestIfDenied) {
        const requestedAuthStatus = await messaging().requestPermission();
        if (requestedAuthStatus === messaging.AuthorizationStatus.AUTHORIZED || requestedAuthStatus === messaging.AuthorizationStatus.PROVISIONAL) {
          currentStatus = 'granted';
        } else {
          currentStatus = 'denied'; // User denied or did not grant
        }
      }
    } else if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
      if (granted) {
        currentStatus = 'granted';
      } else {
        currentStatus = 'denied'; // Initially assume denied if not explicitly granted
      }

      if (currentStatus === 'denied' && requestIfDenied) {
        const permissionRequestResult = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
        if (permissionRequestResult === PermissionsAndroid.RESULTS.GRANTED) {
          currentStatus = 'granted';
        } else if (permissionRequestResult === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
          currentStatus = 'blocked';
        } else {
          currentStatus = 'denied';
        }
      }
    }
    setNotificationPermissionStatus(currentStatus);
    if (currentStatus === 'granted' && isAuthenticated) {
       registerDeviceForNotifications(); // Register if permission granted
    }
    return currentStatus;
  }, [isAuthenticated, registerDeviceForNotifications]);


  const fetchNotificationCounts = useCallback(async () => {
    try {
      const response = await api.get<NotificationCountType>('/api/v1/notifications/count/');
      setNotificationCounts(response.data || { read: 0, total: 0, unread: 0 });
    } catch (err) {
      console.error('Failed to fetch notification counts:', err);
      // setError('Failed to load notification counts.'); // Optionally show error for counts
    }
  }, []);

  const fetchNotifications = useCallback(async (page: number, tab: ActiveTab, isRefresh: boolean = false) => {
    if (isRefresh) {
      setIsLoading(true);
      setNotifications([]); // Clear previous notifications on refresh
    } else {
      setIsPageLoading(true); // Loading more indicator
    }
    setError(null);

    try {
      const params = { page_size: PAGE_SIZE, page, read: tab === 'read' };
      const response = await api.get<NotificationsApiResponse>('/api/v1/notifications/', { params });
      
      const apiResults = response.data.results || [];
      const totalItemsForCurrentTab = response.data.count || 0;

      setNotifications(prev => isRefresh ? apiResults : [...prev, ...apiResults]);
      setHasMore(page * PAGE_SIZE < totalItemsForCurrentTab);
      setCurrentPage(page);
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || err.message || 'Failed to fetch notifications';
      console.error(`Error fetching ${tab} notifications:`, errorMsg, err);
      setError(errorMsg);
      if (isRefresh) setNotifications([]);
      setHasMore(false);
    } finally {
      setIsLoading(false);
      setIsPageLoading(false);
    }
    
  }, []);

  // Combined effect for initial load and tab changes
  useEffect(() => {
    if (isAuthenticated) {
      if (!initialLoadDone.current) {
        checkAndRequestPermissions(false); // Check permissions once on initial authenticated load
        initialLoadDone.current = true;
      }
      fetchNotificationCounts();
      fetchNotifications(1, activeTab, true); // Fetch notifications for the current tab
    } else {
      // Clear data if user becomes unauthenticated (e.g., token expiry while screen is open)
      setNotifications([]);
      setNotificationCounts({ read: 0, total: 0, unread: 0 });
      setNotificationPermissionStatus('undetermined');
      initialLoadDone.current = false; // Reset for next authenticated session
    }
  }, [activeTab, isAuthenticated, checkAndRequestPermissions, fetchNotificationCounts, fetchNotifications]);


  // Effect for FCM setup and message handling
  useEffect(() => {
    if (!isAuthenticated || notificationPermissionStatus !== 'granted') {
        // If permission is not granted, we still want to clear listeners if they were somehow set up before
        // or if the status changes from granted to something else.
        // However, new listeners are only set up if status is 'granted'.
        const noOp = () => {};
        const unsubscribeForeground = messaging().onMessage(noOp); // Ensure existing listeners are replaced/cleared
        const unsubscribeOpenedApp = messaging().onNotificationOpenedApp(noOp);
        // No need to call getInitialNotification here if permission isn't granted
        const unsubscribeTokenRefresh = messaging().onTokenRefresh(noOp);
        
        unsubscribeForeground();
        unsubscribeOpenedApp();
        unsubscribeTokenRefresh();
        return;
    }

    // Foreground messages
    const unsubscribeForeground = messaging().onMessage(async remoteMessage => {
      // Add a check to prevent multiple refreshes if one is already in progress
      if (isLoading) {
        console.log('Notifications screen: Refresh already in progress, skipping immediate refresh for new message.');
        return;
      }
      console.log('FCM Message received in foreground on Notifications screen:', remoteMessage);
      // It's generally good practice to fetch counts first, then the list.
      await fetchNotificationCounts(); 
      await fetchNotifications(1, activeTab, true); 
    });

    // Handle notification tap when app is in background
    const unsubscribeOpenedApp = messaging().onNotificationOpenedApp(remoteMessage => {
      console.log('[Notifications.tsx] onNotificationOpenedApp: Notification caused app to open from background state:', JSON.stringify(remoteMessage, null, 2));
      const reservationId = remoteMessage?.data?.reservation_id;
      if (reservationId) {
        console.log(`[Notifications.tsx] onNotificationOpenedApp: Found reservation_id: ${reservationId}. Attempting to navigate.`);
        router.push(`/?reservation_id=${reservationId}`);
      } else {
        console.log('[Notifications.tsx] onNotificationOpenedApp: No reservation_id found in notification data.');
      }
      // These fetches are for the Notifications.tsx screen itself.
      // If navigation to index.tsx occurs, these might be interrupted or run for a screen that's about to unmount.
      console.log('[Notifications.tsx] onNotificationOpenedApp: Fetching notification counts and list for Notifications.tsx screen.');
      fetchNotificationCounts();
      fetchNotifications(1, activeTab, true);
    });

    // Handle notification tap when app is opened from quit state
    messaging()
      .getInitialNotification()
      .then(remoteMessage => {
        if (remoteMessage) {
          console.log('[Notifications.tsx] getInitialNotification: Notification caused app to open from quit state:', JSON.stringify(remoteMessage, null, 2));
          const reservationId = remoteMessage?.data?.reservation_id;
          if (reservationId) {
            console.log(`[Notifications.tsx] getInitialNotification: Found reservation_id: ${reservationId}. Attempting to navigate.`);
            router.push(`/?reservation_id=${reservationId}`);
          } else {
            console.log('[Notifications.tsx] getInitialNotification: No reservation_id found in notification data.');
          }
          // Similar to above, these fetches are for Notifications.tsx
          console.log('[Notifications.tsx] getInitialNotification: Fetching notification counts and list for Notifications.tsx screen.');
          fetchNotificationCounts();
          fetchNotifications(1, activeTab, true);
        }
      });
    
    const unsubscribeTokenRefresh = messaging().onTokenRefresh(newToken => {
        if (isAuthenticated) { // Ensure still authenticated
            registerDeviceForNotifications(); 
        }
    });

    return () => {
      unsubscribeForeground();
      unsubscribeOpenedApp();
      unsubscribeTokenRefresh();
    };
  }, [isAuthenticated, router, registerDeviceForNotifications, notificationPermissionStatus, activeTab, fetchNotificationCounts, fetchNotifications]);
  
  useFocusEffect(
    useCallback(() => {
      if (isAuthenticated) {
        checkAndRequestPermissions(false).then(status => {
            // Fetch data regardless of native permission for in-app notifications
            // but ensure counts and list are up-to-date.
            fetchNotificationCounts();
            fetchNotifications(1, activeTab, true);
        });
      }
    }, [isAuthenticated, checkAndRequestPermissions, fetchNotificationCounts, fetchNotifications, activeTab])
  );

  const handleMarkAsRead = useCallback(async (notificationToMark: NotificationType, shouldNavigate = true) => {
    const reservationId = notificationToMark.data?.reservation_id;

    // If already read and navigation is intended for a reservation, navigate directly.
    if (notificationToMark.is_read && shouldNavigate && notificationToMark.notification_type === 'RESERVATION' && reservationId) {
        router.push({ pathname: '/', params: { reservation_id: reservationId } });
        return;
    }
    // If already read and no navigation is intended, or it's not a reservation type that navigates, do nothing.
    if (notificationToMark.is_read && (!shouldNavigate || !(notificationToMark.notification_type === 'RESERVATION' && reservationId))) {
        return;
    }

    // If not read, proceed to mark as read
    try {
      await api.post(`/api/v1/notifications/${notificationToMark.user_notification_id}/mark-read/`);

      // API call successful, now update UI
      setNotifications(prev => 
        prev.map(n => 
          n.user_notification_id === notificationToMark.user_notification_id 
            ? { ...n, is_read: true, read_at: new Date().toISOString() } 
            : n
        )
      );

      if (activeTab === 'unread') {
          setNotifications(prev => prev.filter(n => n.user_notification_id !== notificationToMark.user_notification_id));
      }
      
      await fetchNotificationCounts(); // Refresh counts

      if (shouldNavigate && notificationToMark.notification_type === 'RESERVATION' && reservationId) {
        router.push({ pathname: '/', params: { reservation_id: reservationId } });
      }
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
      Alert.alert("Error", "Could not mark notification as read. Please try again.");
      // Optionally, to ensure data consistency after an error, you might want to refetch
      // or at least refresh counts if the server state might be uncertain.
      await fetchNotificationCounts();
    }
  }, [router, activeTab, fetchNotificationCounts, notifications]); 

  const handleMarkAllAsRead = async () => {
    if (notificationCounts.unread === 0) return;
    setIsLoading(true);
    try {
      await api.post('/api/v1/notifications/mark-all-read/');
      await fetchNotificationCounts();
      // Refresh the current tab; if it was 'unread', it should now be empty or show newly fetched 'read' items if tab switched.
      fetchNotifications(1, activeTab, true); 
    } catch (err) {
      console.error('Failed to mark all as read:', err);
      Alert.alert("Error", "Could not mark all notifications as read.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearAll = () => {
    if (notificationCounts.total === 0) return;
    Alert.alert(
      "Clear All Notifications",
      "Are you sure you want to clear all notifications? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Clear All", 
          style: "destructive", 
          onPress: async () => {
            setIsLoading(true);
            try {
              await api.delete('/api/v1/notifications/clear-all/');
              setNotifications([]);
              await fetchNotificationCounts();
              // Current tab will be empty after clearing all
              fetchNotifications(1, activeTab, true); 
            } catch (err) {
              console.error('Failed to clear all notifications:', err);
              Alert.alert("Error", "Could not clear all notifications.");
            } finally {
              setIsLoading(false);
            }
          } 
        }
      ]
    );
  };
  
  const handleLoadMore = () => {
    if (hasMore && !isPageLoading && !isLoading) {
      fetchNotifications(currentPage + 1, activeTab, false);
    }
  };

  const renderItem = ({ item }: { item: NotificationType }) => (
    <NotificationItem notification={item} onPress={handleMarkAsRead} />
  );

  const renderFooter = () => {
    if (isPageLoading) {
      return <ActivityIndicator size="large" color={colors.primary} style={{ marginVertical: 20 }} />;
    }
    if (hasMore && !isLoading) { // Show Load More button only if not initial loading
      return (
        <TouchableOpacity style={styles.loadMoreButton} onPress={handleLoadMore}>
          <Text style={styles.loadMoreButtonText}>Load More</Text>
        </TouchableOpacity>
      );
    }
    return null;
  };

  const handleRequestPermissionAgain = async () => {
    const status = await checkAndRequestPermissions(true); // Request again
    if (status === 'blocked' || (Platform.OS === 'ios' && status === 'denied')) {
        Alert.alert(
            "Permission Blocked",
            "Notification permissions are blocked. Please enable them in your phone settings.",
            [
                { text: "Cancel", style: "cancel" },
                { text: "Open Settings", onPress: () => Linking.openSettings() }
            ]
        );
    } else if (status === 'granted') {
        // Permissions granted, data will be refreshed by focus effect or next tab change.
        // Optionally, trigger a refresh immediately if desired.
        fetchNotificationCounts();
        fetchNotifications(1, activeTab, true);
    }
  };

  const renderPermissionAlert = () => {
    if (notificationPermissionStatus === 'denied' || notificationPermissionStatus === 'blocked') {
      const message = notificationPermissionStatus === 'blocked'
        ? "Notifications are blocked. Enable them in settings for updates."
        : "Enable notifications to receive important updates.";
      return (
        <View style={styles.permissionAlertContainer}>
          <Feather name="bell-off" size={20} color={colors.text} />
          <Text style={styles.permissionAlertText}>{message}</Text>
          <TouchableOpacity onPress={handleRequestPermissionAgain} style={styles.permissionAlertButton}>
            <Text style={styles.permissionAlertButtonText}>
              {notificationPermissionStatus === 'blocked' ? "Open Settings" : "Enable"}
            </Text>
          </TouchableOpacity>
        </View>
      );
    }
    return null;
  };


  // Removed the top-level if (!isAuthenticated) check here.
  // AuthContext and router should handle unauthenticated navigation.
  
  const renderContent = () => {
    if (isLoading && notifications.length === 0 && !error) {
      return (
        <View style={styles.list}>
          {[...Array(5)].map((_, index) => (
            <NotificationItemSkeleton key={index} colors={colors} />
          ))}
        </View>
      );
    }

    if (error && notifications.length === 0) { // Show error prominently if no data and error occurred
      return (
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error}</Text>
          <Button title="Retry" onPress={() => fetchNotifications(1, activeTab, true)} color={colors.primary} />
        </View>
      );
    }
    
    // Updated empty state: Only shows if list is empty, not tied to permission status here.
    if (notifications.length === 0 && !isLoading && !error) { 
        return (
            <View style={styles.emptyStateContainer}>
                <Feather name={activeTab === 'unread' ? "mail" : "check-circle"} size={48} color={colors.subtext} />
                <Text style={[styles.emptyStateText, {marginTop: 10}]}>
                {activeTab === 'unread' ? 'No unread notifications.' : 'No read notifications.'}
                </Text>
            </View>
        );
    }

    // Default: show list
    return (
      <FlatList
        data={notifications}
        renderItem={renderItem}
        keyExtractor={item => item.user_notification_id.toString()}
        style={styles.list}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
        refreshing={isLoading && notifications.length > 0}
        onRefresh={() => fetchNotifications(1, activeTab, true)}
        ListHeaderComponent={error && notifications.length > 0 ? ( // Inline error if data is already present
            <View style={styles.inlineErrorContainer}>
              <Text style={styles.inlineErrorText}>{error} Pull to refresh.</Text>
            </View>
          ) : null}
      />
    );
  };


  return (
    <SafeAreaView style={styles.safeArea}>
      {renderPermissionAlert()} 
      <View style={styles.container}>
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'unread' && styles.activeTabButton]}
            onPress={() => setActiveTab('unread')}
          >
            <Text style={[styles.tabButtonText, activeTab === 'unread' && styles.activeTabButtonText]}>
              Unread ({notificationCounts.unread})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'read' && styles.activeTabButton]}
            onPress={() => setActiveTab('read')}
          >
            <Text style={[styles.tabButtonText, activeTab === 'read' && styles.activeTabButtonText]}>
              Read ({notificationCounts.read})
            </Text>
          </TouchableOpacity>
        </View>

        {renderContent()}

        {notificationCounts.total > 0 && !error && ( // Hide footer actions if there's a major error screen
          <View style={styles.footerActions}>
            <TouchableOpacity
              onPress={handleMarkAllAsRead}
              disabled={isLoading || notificationCounts.unread === 0}
              style={[styles.footerButton, (isLoading || notificationCounts.unread === 0) && styles.disabledButton]}
            >
              <Text style={styles.footerButtonText}>Mark all as read ({notificationCounts.unread})</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleClearAll}
              disabled={isLoading || notificationCounts.total === 0}
              style={[styles.footerButton, styles.clearButton, (isLoading || notificationCounts.total === 0) && styles.disabledButton]}
            >
              <Text style={[styles.footerButtonText, styles.clearButtonText]}>Clear all ({notificationCounts.total})</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const getStyles = (colors: ReturnType<typeof useTheme>['colors']) => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  errorContainer: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: colors.danger + '20', // Light danger background
    borderBottomWidth: 1,
    borderBottomColor: colors.danger + '50',
  },
  inlineErrorContainer: { // For less intrusive errors when data is present
    padding: 10,
    backgroundColor: colors.warning, // A lighter error color
    alignItems: 'center',
  },
  inlineErrorText: {
    color: colors.text,
    fontSize: 14,
    textAlign: 'center',
  },
  errorText: {
    color: colors.danger,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 10,
  },
  // ...existing header styles (if any were defined, currently not)
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTabButton: {
    borderBottomColor: colors.primary,
  },
  tabButtonText: {
    fontSize: 14,
    color: colors.subtext, // Changed from secondary to subtext for potentially better contrast
  },
  activeTabButtonText: {
    color: colors.primary,
    fontWeight: 'bold',
  },
  list: {
    flex: 1,
    backgroundColor: colors.background, // Ensure list has background
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyStateText: {
    fontSize: 16,
    color: colors.subtext, // Changed from secondary
  },
  footerActions: {
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.card,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 4,
    // backgroundColor: colors.primary, // Using text buttons for actions
  },
  footerButtonText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '600',
    // textDecorationLine: 'underline', // Consider removing underline for cleaner look, or make conditional
  },
  clearButton: {
    // backgroundColor: colors.danger, // If you want a background color
  },
  clearButtonText: {
    color: colors.danger,
  },
  disabledButton: {
    opacity: 0.5,
  },
  loadMoreButton: {
    padding: 15,
    alignItems: 'center',
    backgroundColor: colors.card, // Or transparent
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  loadMoreButtonText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: 'bold',
  },
  // Skeleton Styles
  skeletonItem: {
    flexDirection: 'row',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.card,
    alignItems: 'center',
  },
  skeletonIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.border,
    marginRight: 15,
  },
  skeletonTextContainer: {
    flex: 1,
  },
  skeletonTextLine: {
    height: 12,
    backgroundColor: colors.border,
    borderRadius: 4,
    marginBottom: 8,
  },
  // Permission Alert Styles
  permissionAlertContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    // backgroundColor: colors.warning, // A distinct color for warnings
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: colors.warning + '50', // Slightly darker border for the warning
  },
  permissionAlertText: {
    flex: 1,
    color: colors.text, // Text color that contrasts with warningBackground
    fontSize: 13,
    marginLeft: 10,
    marginRight: 10,
  },
  permissionAlertButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 4,
    backgroundColor: colors.warning, // Button color for the alert
  },
  permissionAlertButtonText: {
    color: colors.text, // Text color for the button
    fontSize: 13,
    fontWeight: 'bold',
  },
});

export default Notifications;

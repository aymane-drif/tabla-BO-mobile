import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, SafeAreaView, Alert, ActivityIndicator, Button, Platform } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import NotificationItem from '../components/notification/NotificationItem';
import { useTheme } from '../Context/ThemeContext';
import { api } from '@/api/axiosInstance';
import messaging from '@react-native-firebase/messaging';
import { useAuth } from '../Context/AuthContext'; // Import useAuth
import { ErrorBoundaryProps, useRouter as useExpoRouter } from 'expo-router';
import {PermissionsAndroid} from 'react-native';

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
export function ErrorBoundary(props: ErrorBoundaryProps) {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Something went wrong with Notifications.</Text>
      <Text>{props.error.message}</Text>
      <Button onPress={props.retry} title="Try Again" />
    </View>
  );
}

const Notifications = () => {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  // const navigation = useNavigation(); // Prefer expo-router's useRouter
  const router = useExpoRouter(); // Use expo-router's useRouter
  const { isAuthenticated, registerDeviceForNotifications } = useAuth(); // Get auth state
  const [notifications, setNotifications] = useState<NotificationType[]>([]);
  const [activeTab, setActiveTab] = useState<ActiveTab>('unread');
  
  const [isLoading, setIsLoading] = useState(false);
  const [isPageLoading, setIsPageLoading] = useState(false); // For loading more
  const [error, setError] = useState<string | null>(null);
  const [notificationCounts, setNotificationCounts] = useState<NotificationCountType>({ read: 0, total: 0, unread: 0 });
  
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

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

  const fetchAndRefresh = useCallback(() => {
    fetchNotificationCounts();
    fetchNotifications(1, activeTab, true);
  }, [fetchNotificationCounts, fetchNotifications, activeTab]);

  useEffect(() => {
    // router.replace('/select-restaurant'); 
  }
  , []);
  useEffect(() => {
  // Ensure this is called after fetching notifications
    if (isAuthenticated) { // Only fetch if authenticated
      fetchAndRefresh();
    } else {
      // Clear notifications if user logs out while on this screen
      setNotifications([]);
      setNotificationCounts({ read: 0, total: 0, unread: 0 });
    }
  }, [activeTab, isAuthenticated, fetchAndRefresh]);

  useEffect(() => {
    if (!isAuthenticated) return;

    // Request permission and register token (might be redundant if AuthContext handles it well, but good for robustness)
    const setupPermissions = async () => {
        if (Platform.OS === 'ios') {
            const authStatus = await messaging().requestPermission();
            const enabled =
              authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
              authStatus === messaging.AuthorizationStatus.PROVISIONAL;
            if (enabled) {
              // console.log('Authorization status:', authStatus);
              // Consider calling registerDeviceForNotifications here if not handled by AuthContext on app load
            }
        }else if (Platform.OS === 'android') {
          PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
        }
        // Android permission is typically handled by default or via AndroidManifest
        // For Android 13+, messaging().requestPermission() or PermissionsAndroid is needed.
        // Assuming AuthContext's registerDeviceForNotifications covers this.
    };
    setupPermissions();

    // Foreground messages
    const unsubscribeForeground = messaging().onMessage(async remoteMessage => {
      console.log('FCM Message received in foreground:', remoteMessage);
      // console.log('A new FCM message arrived in foreground!', JSON.stringify(remoteMessage));
      // Refresh notification list and counts
      fetchAndRefresh();
    });

    // Handle notification tap when app is in background
    const unsubscribeOpenedApp = messaging().onNotificationOpenedApp(remoteMessage => {
      console.log('FCM Message received in foreground:', remoteMessage);
      // console.log('Notification caused app to open from background state:', remoteMessage);
      if (remoteMessage?.data?.reservation_id) {
        const reservationId = remoteMessage.data.reservation_id;
        router.push(`/?reservation_id=${reservationId}`);
      }
      // Potentially mark as read or refresh list
      fetchAndRefresh();
    });

    // Handle notification tap when app is opened from quit state
    messaging()
      .getInitialNotification()
      .then(remoteMessage => {
        if (remoteMessage) {
          // console.log('Notification caused app to open from quit state:', remoteMessage);
          if (remoteMessage?.data?.reservation_id) {
            const reservationId = remoteMessage.data.reservation_id;
            router.push(`/?reservation_id=${reservationId}`);
          }
          // Potentially mark as read or refresh list
          fetchAndRefresh();
        }
      });
    
    // Token refresh listener
    const unsubscribeTokenRefresh = messaging().onTokenRefresh(newToken => {
        // console.log('FCM Token refreshed:', newToken);
        // Re-register the new token with your backend
        if (isAuthenticated) {
            registerDeviceForNotifications(); // This function in AuthContext should handle sending the new token
        }
    });

    return () => {
      unsubscribeForeground();
      unsubscribeOpenedApp();
      unsubscribeTokenRefresh();
    };
  }, [isAuthenticated, router, fetchAndRefresh, registerDeviceForNotifications]);
  
  // Refresh data when the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (isAuthenticated) {
        fetchAndRefresh();
      }
    }, [isAuthenticated, fetchAndRefresh])
  );

  const handleMarkAsRead = useCallback(async (notificationToMark: NotificationType, shouldNavigate = true) => {
    const reservationId = notificationToMark.data?.reservation_id;

    if (notificationToMark.is_read && shouldNavigate && notificationToMark.notification_type === 'RESERVATION' && reservationId) {
        router.push({ pathname: '/', params: { reservation_id: reservationId } });
        return;
    }
    if(notificationToMark.is_read && !shouldNavigate) return; // If already read and no navigation, do nothing.
    if(notificationToMark.is_read && shouldNavigate && !(notificationToMark.notification_type === 'RESERVATION' && reservationId)) {
        // Already read, but no valid reservation to navigate to, or not a reservation notification.
        // Potentially do nothing or handle other notification types if they have navigation targets.
        return;
    }


    const originalNotifications = [...notifications];
    // Optimistic update
    setNotifications(prev => 
      prev.map(n => 
        n.user_notification_id === notificationToMark.user_notification_id 
          ? { ...n, is_read: true, read_at: new Date().toISOString() } 
          : n
      )
    );
    if (activeTab === 'unread') { // If on unread tab, remove it visually
        setNotifications(prev => prev.filter(n => n.user_notification_id !== notificationToMark.user_notification_id));
    }

    try {
      await api.post(`/api/v1/notifications/${notificationToMark.user_notification_id}/mark-read/`);
      await fetchNotificationCounts(); // Refresh counts
      // Optionally, refetch the current page for consistency if optimistic update is not enough
      // await fetchNotifications(1, activeTab, true); // Or just rely on counts and optimistic update

      if (shouldNavigate && notificationToMark.notification_type === 'RESERVATION' && reservationId) {
        router.push({ pathname: '/', params: { reservation_id: reservationId } });
      }
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
      setNotifications(originalNotifications); // Revert optimistic update
      await fetchNotificationCounts(); // Refresh counts anyway
      Alert.alert("Error", "Could not mark notification as read.");
    }
  }, [router, notifications, activeTab, fetchNotificationCounts, fetchNotifications]);

  const handleMarkAllAsRead = async () => {
    if (notificationCounts.unread === 0) return;
    setIsLoading(true);
    try {
      await api.post('/api/v1/notifications/mark-all-read/');
      await fetchNotificationCounts();
      // Refresh the current tab; if it was 'unread', it should now be empty or show newly fetched 'read' items if tab switched.
      await fetchNotifications(1, activeTab, true); 
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
              await fetchNotifications(1, activeTab, true); 
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

  if (!isAuthenticated) {
    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.centered}>
                <Text style={{color: colors.text, fontSize: 16}}>Please log in to see notifications.</Text>
                {/* Optionally, add a login button */}
            </View>
        </SafeAreaView>
    );
  }

  if (isLoading && notifications.length === 0) { // Initial loading state
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{ color: colors.text, marginTop: 10 }}>Loading notifications...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'unread' && styles.activeTabButton]}
            onPress={() => {
              setActiveTab('unread');
              // fetchNotifications(1, 'unread', true) will be called by useEffect due to activeTab change
            }}
          >
            <Text style={[styles.tabButtonText, activeTab === 'unread' && styles.activeTabButtonText]}>
              Unread ({notificationCounts.unread})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'read' && styles.activeTabButton]}
            onPress={() => {
              setActiveTab('read');
              // fetchNotifications(1, 'read', true) will be called by useEffect due to activeTab change
            }}
          >
            <Text style={[styles.tabButtonText, activeTab === 'read' && styles.activeTabButtonText]}>
              Read ({notificationCounts.read})
            </Text>
          </TouchableOpacity>
        </View>

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <Button title="Retry" onPress={() => fetchNotifications(1, activeTab, true)} color={colors.primary} />
          </View>
        )}

        {notifications.length === 0 && !isLoading && !error ? (
          <View style={styles.emptyStateContainer}>
            <Text style={styles.emptyStateText}>
              {activeTab === 'unread' ? 'No unread notifications.' : 'No read notifications.'}
            </Text>
          </View>
        ) : (
          <FlatList
            data={notifications} // Use API-fetched notifications
            renderItem={renderItem}
            keyExtractor={item => item.user_notification_id.toString()}
            style={styles.list}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.5}
            ListFooterComponent={renderFooter}
            refreshing={isLoading && notifications.length > 0} // Show refresh control if loading new set while old data is visible
            onRefresh={() => fetchNotifications(1, activeTab, true)} // Pull to refresh
          />
        )}

        {notificationCounts.total > 0 && (
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
  }
});

export default Notifications;

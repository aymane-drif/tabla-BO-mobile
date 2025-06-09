import React, { useState, useEffect, useCallback, useRef, use } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, SafeAreaView, Alert, ActivityIndicator, Button, Platform, Linking } from 'react-native'; // Added Linking
import {useFocusEffect } from '@react-navigation/native';
import NotificationItem from '../components/notification/NotificationItem';
import { useTheme } from '../Context/ThemeContext';
import { api } from '@/api/axiosInstance';
import { useAuth } from '../Context/AuthContext'; // Import useAuth
import { ErrorBoundaryProps, useRouter as useExpoRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons'; // For icons in permission alert
import { useNotifications } from '@/Context/NotificationContext';

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
  const { isAuthenticated, restaurantId,registerDeviceForNotifications } = useAuth();

    // Replace individual state with context
  const { 
    notificationCounts, 
    permissionStatus: notificationPermissionStatus,
    checkAndRequestPermissions,
    fetchNotificationCounts,
    onForegroundMessage
  } = useNotifications();
  const [notifications, setNotifications] = useState<NotificationType[]>([]);
  const [activeTab, setActiveTab] = useState<ActiveTab>('unread');
  
  const [isLoading, setIsLoading] = useState(false);
  const [isPageLoading, setIsPageLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const initialLoadDone = useRef(false); // To track initial permission check

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


  // Effect for FCM setup and message handling
    useEffect(() => {
    const unsubscribe = onForegroundMessage(async (remoteMessage) => {
      // Only refresh if this screen is focused
      if (!isLoading) {
        await fetchNotifications(1, activeTab, true);
      }
    });
    
    return unsubscribe;
  }, [onForegroundMessage, activeTab, isLoading]);
  
  useFocusEffect(
    useCallback(() => {
      if (isAuthenticated && restaurantId) {
        checkAndRequestPermissions(false).then(status => {
            // Fetch data regardless of native permission for in-app notifications
            // but ensure counts and list are up-to-date.
            fetchNotificationCounts();
            fetchNotifications(1, activeTab, true);
        });
      }
    }, [isAuthenticated, restaurantId, checkAndRequestPermissions, fetchNotificationCounts, fetchNotifications, activeTab])
  );

  const handleMarkAsRead = useCallback(async (notificationToMark: NotificationType, shouldNavigate = true) => {
    const reservationId = notificationToMark.data?.reservation_id;
    
    // If already read and navigation is intended for a reservation, navigate directly.
    if (notificationToMark.is_read && shouldNavigate && notificationToMark.notification_type === 'RESERVATION' && reservationId) {

        router.push({ pathname: '/(tabs)', params: { reservation_id: reservationId } });
        return;
    }
    // If already read and no navigation is intended, or it's not a reservation type that navigates, do nothing.
    if (notificationToMark.is_read && (!shouldNavigate || !(notificationToMark.notification_type === 'RESERVATION' && reservationId))) {
        return;
    }

    // If not read, proceed to mark as read
    try {
      await api.post(`/api/v1/notifications/${notificationToMark.user_notification_id}/mark-read/`);
      
      await fetchNotificationCounts(); // Refresh counts
      console.log(shouldNavigate && notificationToMark.notification_type === 'RESERVATION' && reservationId)
      if (shouldNavigate && notificationToMark.notification_type === 'RESERVATION' && reservationId) {
        router.push({ pathname: '/(tabs)', params: { reservation_id: reservationId } });
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
    const status = await checkAndRequestPermissions(true) as string; // Request again
    console.log(status);
    if (status === 'blocked' || status === 'denied' || (Platform.OS === 'ios' && status === 'denied')) {
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
    if ((notificationPermissionStatus as string) === 'denied' || (notificationPermissionStatus as string) === 'blocked') {
      const message = (notificationPermissionStatus as string) === 'blocked'
        ? "Notifications are blocked. Enable them in settings for updates."
        : "Enable notifications to receive important updates.";
      return (
        <View style={styles.permissionAlertContainer}>
          <Feather name="bell-off" size={20} color={colors.text} />
          <Text style={styles.permissionAlertText}>{message}</Text>
          <TouchableOpacity onPress={handleRequestPermissionAgain} style={styles.permissionAlertButton}>
            <Text style={styles.permissionAlertButtonText}>
              {(notificationPermissionStatus as string) === 'blocked' ? "Open Settings" : "Enable"}
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

  useEffect(() => {
    console.log('[Notifications] Notification permission status:', notificationPermissionStatus);
  },[notificationPermissionStatus])

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

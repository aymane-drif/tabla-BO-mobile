import React, { useEffect } from 'react';
import { View, ActivityIndicator, Image } from 'react-native';
import { useLocalSearchParams, usePathname, useRouter } from 'expo-router';
import { useAuth } from '@/Context/AuthContext';
import { useTheme } from '@/Context/ThemeContext';
import * as ExpoNotifications from 'expo-notifications'; // Import expo-notifications

export default function SplashScreen() {
  const { isLoading, isAuthenticated, user } = useAuth();
  const router = useRouter();
  const { colors } = useTheme();

useEffect(() => {
  const foregroundSubscription = ExpoNotifications.addNotificationResponseReceivedListener(response => {
    const notificationData = response.notification.request.content.data;
    if (notificationData && notificationData.reservation_id) {
      router.push({ pathname: '/(tabs)', params: { reservation_id: notificationData.reservation_id as string } });
    }
  });
  const navigationTimeout = setTimeout(() => {
    if (!isLoading) {
      // Handle notification tap when app is opened from killed state
      ExpoNotifications.getLastNotificationResponseAsync().then(response => {
        if (response) {
          const notificationData = response.notification.request.content.data;
          if (notificationData && notificationData.reservation_id) {
            router.push({ pathname: '/(tabs)', params: { reservation_id: notificationData.reservation_id as string } });
          }
        }
      });
      // Auth check is complete, now we can safely navigate
      if (!isAuthenticated) {
        router.replace('/login');
      } else if (!user?.restaurantId && !user?.is_superuser && !user?.is_staff) {
        router.replace('/select-restaurant');
      } else {
        router.replace('/(tabs)');
      }
    } else {
      // If still loading after timeout, redirect to login as fallback
      console.warn('Auth state check timed out, redirecting to login');
      router.replace('/login');
    }
  }, 3000); // Increased timeout to allow auth to complete

  return () => {
    foregroundSubscription.remove();
    clearTimeout(navigationTimeout);
  };
}, [isLoading, isAuthenticated, user, router]);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
      <Image source={require('../assets/images/android/res/mipmap-xxxhdpi/ic_launcher_foreground.png')} style={{
              width: 150,
              height: 150,
              marginBottom: 30,
              transform: [{ scale: 2 }],
      }} resizeMode="cover" />
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}
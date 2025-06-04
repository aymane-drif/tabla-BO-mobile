import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { SplashScreen, Stack, useRouter, usePathname } from 'expo-router';
import { useEffect } from 'react';
import { useColorScheme, View, ActivityIndicator } from 'react-native';
import { AuthProvider, useAuth } from '@/Context/AuthContext';
import { useTheme } from '@/Context/ThemeContext';
import messaging from '@react-native-firebase/messaging';
export {
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: '(tabs)', // Or your preferred initial route
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  const { isLoading, isAuthenticated, user } = useAuth();
  const colorScheme = useColorScheme();
  const router = useRouter();
  const pathName = usePathname();
  const {colors} = useTheme();

  useEffect(() => {
    if (isLoading) {
      console.log("RootLayoutNav Effect: Auth state is loading.");
      return; // Wait for auth state to load
    }

    // Auth state is loaded, now handle navigation
    if (!isAuthenticated) {
      console.log("RootLayoutNav Effect: Not authenticated. Redirecting to /login.");
      router.replace('/login');
    } else {
      // Handles notification tap when app is in background
      const unsubscribeOpenedApp = messaging().onNotificationOpenedApp(remoteMessage => {
        console.log('GLOBAL: Notification caused app to open from background state:', remoteMessage);
        const reservationId = remoteMessage?.data?.reservation_id;
        if (reservationId) {
          console.log(`GLOBAL: Navigating to reservation ID: ${reservationId}`);
          // This path should lead to your (tabs)/index.tsx screen
          router.push(`/?reservation_id=${reservationId}`);
        }
      });

      // Handles notification tap when app is opened from quit state
      messaging().getInitialNotification().then(remoteMessage => {
        if (remoteMessage) {
          console.log('GLOBAL: Notification caused app to open from quit state:', remoteMessage);
          const reservationId = remoteMessage?.data?.reservation_id;
          if (reservationId) {
            console.log(`GLOBAL: Navigating to reservation ID: ${reservationId} from quit state`);
            router.push(`/?reservation_id=${reservationId}`);
          }
        }
      });
      // User is authenticated
      if (!user?.restaurantId && !user?.is_superuser && !user?.is_staff) {
        console.log("RootLayoutNav Effect: Authenticated, no restaurant/superuser/staff. Redirecting to /select-restaurant.");
        router.replace('/select-restaurant');
      } else {
        console.log("RootLayoutNav Effect: Authenticated and configured. Ensuring user is on an app screen (e.g., not /login).");
        // If the user is authenticated and configured, but somehow on /login or /select-restaurant,
        // redirect them to the main app area.
        // This check might need current route information if you want to be very specific.
        // For now, if they are authenticated and configured, we assume they should be in '(tabs)' or similar.
        // If they are already on a valid screen within the authenticated stack, this won't cause a new navigation.
        // If they were on /login, this would move them.
        // Consider checking current route if this causes unwanted navigation.
        // Example: if (router.pathname === '/login' || router.pathname === '/select-restaurant') router.replace('/(tabs)');
      }
      
      return () => {
        unsubscribeOpenedApp();
      };
    }
  }, [isLoading, isAuthenticated, user, router]);

  if (isLoading) {
    console.log("RootLayoutNav Render: isLoading is true. Showing ActivityIndicator.");
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.text} />
      </View>
    );
  }

  // Always render the ThemeProvider and Stack.
  // The useEffect above handles redirecting to the correct screen within this Stack.
  console.log("RootLayoutNav Render: isLoading is false. Rendering ThemeProvider and Stack.");
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        {/* Define all top-level screens here */}
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="select-restaurant" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="Profile" options={{ 
          headerShown: true,
          presentation: 'modal',
          headerStyle: {
          backgroundColor: (colors.background),
          },
          headerTintColor: (colors.text),
         }}/>
        <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
        <Stack.Screen name="Notifications" options={{ 
          headerShown: true,
          headerStyle: {
          backgroundColor: (colors.background),
          },
          headerTintColor: (colors.text),
         }} />
      </Stack>
    </ThemeProvider>
  );
}

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null; // Wait for fonts to load
  }

  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}
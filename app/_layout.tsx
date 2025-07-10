import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { SplashScreen, Stack, useRouter, usePathname, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import { useColorScheme, View, ActivityIndicator, Platform } from 'react-native';
import { AuthProvider, useAuth } from '@/Context/AuthContext';
import { useTheme } from '@/Context/ThemeContext';
import { NotificationProvider } from '@/Context/NotificationContext';
import { getTrackingPermissionsAsync, requestTrackingPermissionsAsync } from 'expo-tracking-transparency';
export {
  ErrorBoundary,
} from 'expo-router';
import * as ExpoNotifications from 'expo-notifications'; // Import expo-notifications
import './../i18n'; // Import the i18n configuration
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n from '../i18n'; // Import the i18n configuration

globalThis.RNFB_SILENCE_MODULAR_DEPRECATION_WARNINGS = true;

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: 'index', // Or your preferred initial route
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

ExpoNotifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true, // Show an alert banner
    shouldPlaySound: true, // Play a sound
    shouldSetBadge: false, // Whether to update the app icon badge number (iOS)
    shouldShowBanner: true, // Show a banner notification
    shouldShowList: true, // Show in notification list
  }),
});

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const { colors } = useTheme();
  const router = useRouter();
  const { t } = useTranslation();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        {/* Add splash screen to Stack */}
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="select-restaurant" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="Profile" options={{ 
          headerShown: true,
          title: t('profile'),
          presentation: 'modal',
          headerStyle: {
          backgroundColor: (colors.background),
          },
          headerTintColor: (colors.text),
         }}/>
        {/* <Stack.Screen name="modal" options={{ presentation: 'modal' }} /> */}
        <Stack.Screen name="Notifications" options={{ 
          headerShown: true,
          title: t('notifications'),
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
    const requestTrackingPermission = async () => {
      // You can optionally check if the permission has already been granted
      const { granted } = await getTrackingPermissionsAsync();
      if (granted) {
        return;
      }
      const { status } = await requestTrackingPermissionsAsync();
      if (status === "granted") {
        console.log("Yay! I have user permission to track them");
      }
    };
    // check if ios then request tracking permission 
    if(Platform.OS === 'ios'){
      requestTrackingPermission()
    }
  }, []);

    // Add an effect to check and apply saved language
    useEffect(() => {
      const applyStoredLanguage = async () => {
        try {
          const savedLanguage = await AsyncStorage.getItem('app-language');
          console.log(`Stored language: ${savedLanguage}`);
          if (savedLanguage) {
            i18n.changeLanguage(savedLanguage);
            console.log(`Applied stored language: ${savedLanguage}`);
          }
        } catch (error) {
          console.error("Failed to load language preference:", error);
        }
      };
      
      applyStoredLanguage();
    }, []);


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
      <NotificationProvider>
        <RootLayoutNav />
      </NotificationProvider>
    </AuthProvider>
  );
}
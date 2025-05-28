import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios"; // Main axios for login/logout within context
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from "@/api/axiosInstance"; // Import the configured axios instance
import messaging from '@react-native-firebase/messaging';
import { Platform } from "react-native";

// Define the shape of your auth state and context
interface User {
  id: string | number;
  email?: string;
  restaurantId?: string | null; // Or number
  is_superuser?: boolean;
  is_staff?: boolean;
  is_manager?: boolean; // from your login response
  // Add other user properties as needed
}

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  restaurantId: string | null; // This can be derived from user.restaurantId or kept separate
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
}

interface AuthContextType extends AuthState {
  login: (credentials: any) => Promise<void>;
  logout: () => void;
  getTokens: () => { accessToken: string | null; refreshToken: string | null; restaurantId: string | null };
  refreshAccessToken: () => Promise<boolean>;
  updateRestaurantSelection: (restaurantId: string) => Promise<void>;
  registerDeviceForNotifications: () => Promise<void>; // New function
}

const AUTH_ACCESS_TOKEN_KEY = 'authAccessToken';
const AUTH_REFRESH_TOKEN_KEY = 'authRefreshToken';
const RESTAURANT_ID_KEY = 'restaurantId'; // We might primarily use user.restaurantId
const AUTH_USER_KEY = 'authUser'; // New key for storing user object

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    accessToken: null,
    refreshToken: null,
    restaurantId: null, // Initialize as null, will be set from user or selection
    isAuthenticated: false,
    isLoading: true,
    user: null,
  });

  const getTokens = () => {
    return {
      accessToken: authState.accessToken,
      refreshToken: authState.refreshToken,
      restaurantId: authState.user?.restaurantId || authState.restaurantId, // Prefer user.restaurantId
    };
  };

  useEffect(() => {
    console.log('[AuthContext] Initializing AuthProvider',{authState, common: api.defaults.headers.common, axiosCommon: axios.defaults.headers.common});

  }, []);

  // Effect to update axios instance defaults when authState changes
  useEffect(() => {
    if (authState.accessToken) {
      api.defaults.headers.common['Authorization'] = `Bearer ${authState.accessToken}`;
      console.log('[AuthContext] Set Authorization header:', api.defaults.headers.common['Authorization']);
    } else {
      delete api.defaults.headers.common['Authorization'];
      console.log('[AuthContext] Removed Authorization header');
    }
    // Use restaurantId from user object if available, otherwise from authState directly
    const currentRestaurantId = authState.user?.restaurantId || authState.restaurantId;
    if (currentRestaurantId) {
      api.defaults.headers.common['X-Restaurant-ID'] = currentRestaurantId;
      console.log('[AuthContext] Set X-Restaurant-ID header:', api.defaults.headers.common['X-Restaurant-ID']);
    } else {
      delete api.defaults.headers.common['X-Restaurant-ID'];
      console.log('[AuthContext] Removed X-Restaurant-ID header');
    }
  }, [authState.accessToken, authState.restaurantId, authState.user]);

  const registerDeviceForNotifications = async () => {
    try {
      // Request permission for iOS and Android 13+
      if (Platform.OS === 'ios') {
        const authStatus = await messaging().requestPermission();
        const enabled =
          authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
          authStatus === messaging.AuthorizationStatus.PROVISIONAL;
        if (!enabled) {
          console.log('User has not granted notification permission');
          return;
        }
      } else { // Android
        // For Android 13 (API level 33) and above, POST_NOTIFICATIONS permission is needed.
        // messaging().requestPermission() should ideally handle this.
        // If not, you might need PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
        // For simplicity, we assume messaging().requestPermission() covers it or permissions are granted.
      }

      const fcmToken = await messaging().getToken();
      if (fcmToken) {
        // console.log("FCM Token:", fcmToken);
        // Send this token to your backend
        console.log("FCM token registered successfully:", { token: fcmToken, device_type: Platform.OS?.toUpperCase() || 'WEB'});
        const res = await api.post('/api/v1/device-tokens/', { token: fcmToken, device_type: /*Platform.OS?.toUpperCase() ||*/ 'WEB'})//:  }); // Example endpoint
        // console.log('FCM token sent to server successfully.');
      } else {
        console.log("Failed to get FCM token");
      }
    } catch (error) {
      if (error && typeof error === 'object' && 'response' in error && error.response && typeof error.response === 'object' && 'data' in error.response) {
        // @ts-ignore
        console.log("Error registering device for notifications:", error.response.data);
      } else {
        console.log("Error registering device for notifications:", error);
      }
    }
  };

  const unregisterDeviceToken = async () => {
    try {
      const fcmToken = await messaging().getToken(); // Get current token to unregister
      if (fcmToken) {
        // Call your backend to remove/invalidate this token for the user
        await api.delete('/api/v1/device-tokens/', { data: { token: fcmToken } }); // Example endpoint
        // console.log('FCM token unregistered from server.');
        // You might also delete the token locally if Firebase allows, but usually server-side invalidation is key.
        // await messaging().deleteToken(); // This deletes the token, new one will be generated next time.
      }
    } catch (error) {
      console.error("Error unregistering device token:", error);
    }
  };

  const login = async (credentials: any) => {
    setAuthState(prev => ({ ...prev, isLoading: true }));
    try {
      const response = await api.post("/api/v1/bo/managers/login/", credentials);
      const { access, refresh, user } = response.data; // Adjusted to match typical token names and user object

      if (!access || !user) {
        throw new Error("Login failed: No token or user data received.");
      }
      
      const userData: User = { // Construct a User object based on your API response
        id: user.id,
        email: user.email,
        restaurantId: user.restaurant_id || user.restaurantId || null, // Handle variations
        is_superuser: user.is_superuser,
        is_staff: user.is_staff,
        is_manager: user.is_manager,
      };

      await AsyncStorage.setItem(AUTH_ACCESS_TOKEN_KEY, access);
      if (refresh) {
        await AsyncStorage.setItem(AUTH_REFRESH_TOKEN_KEY, refresh);
      }
      await AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(userData));
      if (userData.restaurantId) { // Also store restaurantId separately if needed, or rely on user object
        await AsyncStorage.setItem(RESTAURANT_ID_KEY, userData.restaurantId);
      }

      setAuthState({
        accessToken: access,
        refreshToken: refresh || null,
        restaurantId: userData.restaurantId || null,
        isAuthenticated: true,
        isLoading: false,
        user: userData,
      });
      await registerDeviceForNotifications(); // Register FCM token on login
    } catch (error: any) {
      console.error("Login failed:",error, error.response?.data || error.message);
      // Ensure state is reset correctly on failure
      setAuthState({
        accessToken: null,
        refreshToken: null,
        restaurantId: null,
        isAuthenticated: false,
        isLoading: false,
        user: null,
      });
      await AsyncStorage.removeItem(AUTH_ACCESS_TOKEN_KEY);
      await AsyncStorage.removeItem(AUTH_REFRESH_TOKEN_KEY);
      await AsyncStorage.removeItem(RESTAURANT_ID_KEY);
      await AsyncStorage.removeItem(AUTH_USER_KEY);
      throw error; // Re-throw for the UI to handle
    }
  };

  const logout = async () => {
    await unregisterDeviceToken(); // Unregister FCM token on logout

    await AsyncStorage.removeItem(AUTH_ACCESS_TOKEN_KEY);
    await AsyncStorage.removeItem(AUTH_REFRESH_TOKEN_KEY);
    await AsyncStorage.removeItem(RESTAURANT_ID_KEY);
    await AsyncStorage.removeItem(AUTH_USER_KEY); // Clear stored user

    setAuthState({
      accessToken: null,
      refreshToken: null,
      restaurantId: null,
      isAuthenticated: false,
      isLoading: false, // Set to false as logout is complete
      user: null,
    });
  };

  const refreshAccessToken = async (): Promise<boolean> => {
    const currentRefreshToken = authState.refreshToken;
    if (!currentRefreshToken) {
      await logout(); // Logout if no refresh token
      return false;
    }

    try {
      const response = await axios.post("https://api.dev.tabla.ma/api/auth/token/refresh", { refresh: currentRefreshToken });
      const { access: newAccessToken, refresh: newRefreshedToken } = response.data; // Assuming 'access' and 'refresh'

      if (!newAccessToken) {
        throw new Error("No new access token received from refresh endpoint");
      }

      await AsyncStorage.setItem(AUTH_ACCESS_TOKEN_KEY, newAccessToken);
      const updatedAuthState: Partial<AuthState> = {
        accessToken: newAccessToken,
        isAuthenticated: true // Should remain true
      };

      if (newRefreshedToken) {
        await AsyncStorage.setItem(AUTH_REFRESH_TOKEN_KEY, newRefreshedToken);
        updatedAuthState.refreshToken = newRefreshedToken;
      }
      
      // Optionally, re-fetch user details or decode token if roles/info might change
      // For now, assume user object remains the same or is handled by a separate profile fetch

      setAuthState(prev => ({
        ...prev,
        ...updatedAuthState,
      }));
      return true;
    } catch (error) {
      console.error("Token refresh failed:", error);
      await logout(); // Call the existing logout function
      return false;
    }
  };

  const updateRestaurantSelection = async (newRestaurantId: string) => {
    if (!authState.user) {
      console.error("Cannot update restaurant selection, user not loaded.");
      return;
    }
    try {
      await AsyncStorage.setItem(RESTAURANT_ID_KEY, newRestaurantId); // Keep this for direct access if needed
      const updatedUser = { ...authState.user, restaurantId: newRestaurantId };
      await AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(updatedUser));

      setAuthState(prev => ({
        ...prev,
        restaurantId: newRestaurantId, // Update direct restaurantId for consistency
        user: updatedUser,
      }));
      api.defaults.headers.common['X-Restaurant-ID'] = newRestaurantId;
    } catch (error) {
      console.error("Failed to update restaurant selection in storage", error);
    }
  };

  useEffect(() => {
    const checkToken = async () => {
      try {
        const [storedAccessToken, storedRefreshToken, storedUserJson, storedRestaurantIdLegacy] = await Promise.all([
          AsyncStorage.getItem(AUTH_ACCESS_TOKEN_KEY),
          AsyncStorage.getItem(AUTH_REFRESH_TOKEN_KEY),
          AsyncStorage.getItem(AUTH_USER_KEY),
          AsyncStorage.getItem(RESTAURANT_ID_KEY) // Legacy or direct restaurant ID
        ]);

        // Set axios headers immediately when tokens are available
        if (storedAccessToken) {
          api.defaults.headers.common['Authorization'] = `Bearer ${storedAccessToken}`;
          console.log('[AuthContext] Set Authorization header from storage:', api.defaults.headers.common['Authorization']);
        }

        if (storedAccessToken && storedUserJson) {
          const storedUser: User = JSON.parse(storedUserJson);
          const restaurantId = storedUser.restaurantId || storedRestaurantIdLegacy || null;
          
          // Set restaurant header immediately
          if (restaurantId) {
            api.defaults.headers.common['X-Restaurant-ID'] = restaurantId;
            console.log('[AuthContext] Set X-Restaurant-ID header from storage:', api.defaults.headers.common['X-Restaurant-ID']);
          }

          setAuthState({
            accessToken: storedAccessToken,
            refreshToken: storedRefreshToken,
            restaurantId: restaurantId,
            isAuthenticated: true,
            isLoading: false,
            user: storedUser,
          });
          // If user is authenticated from storage, ensure their device token is registered
          registerDeviceForNotifications();
        } else {
          // Clear headers if no valid auth data
          delete api.defaults.headers.common['Authorization'];
          delete api.defaults.headers.common['X-Restaurant-ID'];
          console.log('[AuthContext] Cleared headers - no valid auth data in storage');
          
          setAuthState(prev => ({
            ...prev,
            accessToken: null,
            refreshToken: null,
            restaurantId: null,
            isAuthenticated: false,
            isLoading: false,
            user: null,
          }));
        }
      } catch (error) {
        console.error("Failed to load auth data from storage", error);
        // Clear headers on error
        delete api.defaults.headers.common['Authorization'];
        delete api.defaults.headers.common['X-Restaurant-ID'];
        
        setAuthState(prev => ({
          ...prev,
          accessToken: null,
          refreshToken: null,
          restaurantId: null,
          isAuthenticated: false,
          isLoading: false,
          user: null,
        }));
      }
    };
    checkToken(); 
  }, []);

  // Periodic refresh timer
  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval> | null = null;

    if (authState.isAuthenticated && authState.refreshToken) {
      const REFRESH_INTERVAL = 50 * 60 * 1000; // 50 minutes
      intervalId = setInterval(async () => {
        await refreshAccessToken();
      }, REFRESH_INTERVAL);
    } else {
      if (intervalId) {
        clearInterval(intervalId);
      }
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [authState.isAuthenticated, authState.refreshToken]);

  return (
    <AuthContext.Provider value={{ ...authState, login, logout, getTokens, refreshAccessToken, updateRestaurantSelection, registerDeviceForNotifications }}>
      {!authState.isLoading && children}
    </AuthContext.Provider>
  );
};
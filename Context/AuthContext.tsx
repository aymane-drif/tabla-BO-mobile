import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios"; // Main axios for login/logout within context
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from "@/api/axiosInstance"; // Import the configured axios instance

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
  // setAuthState: React.Dispatch<React.SetStateAction<AuthState>>; // Consider if still needed externally
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

  // Effect to update axios instance defaults when authState changes
  useEffect(() => {
    if (authState.accessToken) {
      api.defaults.headers.common['Authorization'] = `Bearer ${authState.accessToken}`;
    } else {
      delete api.defaults.headers.common['Authorization'];
    }
    // Use restaurantId from user object if available, otherwise from authState directly
    const currentRestaurantId = authState.user?.restaurantId || authState.restaurantId;
    if (currentRestaurantId) {
      api.defaults.headers.common['X-Restaurant-ID'] = currentRestaurantId;
    } else {
      delete api.defaults.headers.common['X-Restaurant-ID'];
    }
  }, [authState.accessToken, authState.restaurantId, authState.user]);


  const login = async (credentials: any) => {
    setAuthState(prev => ({ ...prev, isLoading: true }));
    try {
      console.log("Logging in with credentials:", credentials); // Log credentials for debugging
      console.log("defaults:", api.defaults); // Log credentials for debugging
      const response = await api.post("/api/v1/bo/managers/login/", credentials);
      console.log("Login response:", response.data); // Log the entire response for debugging
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
    console.log("Logging out...");
    // Optionally, call a logout endpoint on your API
    // try { await api.post("/api/auth/logout"); } catch (e) { console.error("Logout API call failed", e); }
    
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
      console.log("Refresh token not available.");
      await logout(); // Logout if no refresh token
      return false;
    }

    console.log("Attempting to refresh access token...");
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
      console.log("Access token refreshed successfully.");
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
      console.log("Restaurant selection updated to:", newRestaurantId);
    } catch (error) {
      console.error("Failed to update restaurant selection in storage", error);
    }
  };

  useEffect(() => {
    const checkToken = async () => {
      console.log("AuthContext: Checking token from storage...");
      try {
        const [storedAccessToken, storedRefreshToken, storedUserJson, storedRestaurantIdLegacy] = await Promise.all([
          AsyncStorage.getItem(AUTH_ACCESS_TOKEN_KEY),
          AsyncStorage.getItem(AUTH_REFRESH_TOKEN_KEY),
          AsyncStorage.getItem(AUTH_USER_KEY),
          AsyncStorage.getItem(RESTAURANT_ID_KEY) // Legacy or direct restaurant ID
        ]);

        console.log('AuthContext checkToken - storedAccessToken:', storedAccessToken);
        console.log('AuthContext checkToken - storedUserJson:', storedUserJson);

        if (storedAccessToken && storedUserJson) {
          const storedUser: User = JSON.parse(storedUserJson);
          setAuthState({
            accessToken: storedAccessToken,
            refreshToken: storedRefreshToken,
            restaurantId: storedUser.restaurantId || storedRestaurantIdLegacy || null, // Prioritize user.restaurantId
            isAuthenticated: true,
            isLoading: false,
            user: storedUser,
          });
          console.log("AuthContext: User authenticated from storage.", storedUser);
        } else {
          console.log("AuthContext: No valid session found in storage.");
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
      console.log(`Starting periodic token refresh every ${REFRESH_INTERVAL / (60 * 1000)} minutes.`);
      intervalId = setInterval(async () => {
        console.log("Periodic refresh: Attempting to refresh token...");
        await refreshAccessToken();
      }, REFRESH_INTERVAL);
    } else {
      if (intervalId) {
        console.log("Clearing periodic token refresh timer.");
        clearInterval(intervalId);
      }
    }

    return () => {
      if (intervalId) {
        console.log("Cleaning up periodic token refresh timer.");
        clearInterval(intervalId);
      }
    };
  }, [authState.isAuthenticated, authState.refreshToken]);


  return (
    <AuthContext.Provider value={{ ...authState, login, logout, getTokens, refreshAccessToken, updateRestaurantSelection }}>
      {children}
    </AuthContext.Provider>
  );
};
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router'; // Import router for navigation

// Create an instance of axios
const api = axios.create({
  baseURL: 'https://api.dev.tabla.ma', // Replace with your API's base URL
  withCredentials: true, // This is important for CORS and cookies
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  }
  // You can add other default configurations here
  // timeout: 10000,
});
api.defaults.headers.common['Accept'] = 'application/json'; // Set default Accept header
api.defaults.headers.common['Content-Type'] = 'application/json'; // Set default Content-Type header
// It's generally better to set dynamic headers (like auth tokens)
// via interceptors or by updating defaults from within the AuthContext
// as shown in the AuthContext.tsx example.

// If you need to handle token refresh, you can add an interceptor for that here.
// For example, to retry requests with a new token after a 401 error.
// This is a more advanced setup.

// Example of a request interceptor (less dynamic than setting defaults in AuthContext)
// api.interceptors.request.use(
//   async (config) => {
//     // This is where you would try to get the token if not setting defaults
//     // const token = await AsyncStorage.getItem('authAccessToken');
//     // if (token) {
//     //   config.headers.Authorization = `Bearer ${token}`;
//     // }
//     return config;
//   },
//   (error) => {
//     return Promise.reject(error);
//   }
// );

// Add a response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response, // Simply return the response if it's successful
  async (error) => {
    const originalRequest = error.config;
    if (error.response && (error.response.status === 401 || error.response.status === 411) && !originalRequest._retry) {
      originalRequest._retry = true; // Mark that we've tried to refresh to prevent infinite loops

      console.log('Authentication error, redirecting to login...');
      
      // Clear stored tokens and auth state
      await AsyncStorage.removeItem('authAccessToken');
      await AsyncStorage.removeItem('authRefreshToken');
      await AsyncStorage.removeItem('restaurantId');
      
      // It's ideal to update the AuthContext state here, but that's hard outside a component.
      // Instead, we navigate. The AuthProvider's useEffect should detect no tokens and update state.

      // Redirect to login screen
      // Ensure the path to your login screen is correct
      // router.replace('/login'); 

      // Optionally, you could try to refresh the token here if you have a refresh token mechanism
      // and then retry the original request. For now, we just redirect.
      
      return Promise.reject(error); // Reject the promise to stop the original request flow
    }

    // For other errors, just pass them on
    return Promise.reject(error);
  }
);

export { api };
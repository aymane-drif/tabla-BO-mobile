"use client";

import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Image, useColorScheme } from 'react-native';
import { useAuth } from '@/Context/AuthContext';
import { useRouter, Stack } from 'expo-router';
import { DarkTheme, DefaultTheme } from '@react-navigation/native'; // For theme colors
import { useTheme } from '@/Context/ThemeContext';

const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, isLoading, isAuthenticated, user } = useAuth();
  const router = useRouter();
  const colorScheme = useColorScheme();
  
  const {colors} = useTheme();
  console.log("LoginScreen", { isLoading, isAuthenticated, user });

  useEffect(() => {
    // This navigation logic is primarily handled by _layout.tsx now
    if (isAuthenticated) {
      if (!user?.restaurantId && !user?.is_superuser && !user?.is_staff) {
        router.replace('/select-restaurant');
      } else {
        router.replace('/(tabs)');
      }
    }
  }, [isAuthenticated, user, router]);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password.');
      return;
    }
    try {
      await login({ email, password });
      // Navigation after successful login is handled by the root _layout.tsx
      // based on isAuthenticated and user state.
    } catch (error: any) {
      Alert.alert('Login Failed', error?.message || 'An unexpected error occurred. Please try again.');
    }
  };

  // The loading state during initial auth check is handled by _layout.tsx
  // This loading is specific to the login process itself.
  if (isLoading && !isAuthenticated) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.text }]}>Logging in...</Text>
      </View>
    );
  }
  
  // If already authenticated, _layout.tsx should handle redirection.
  // Returning null here prevents rendering the login form if auth state is already true.
  if (isAuthenticated) {
      return null; 
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />
      {/* You can add your logo here */}
      <Image source={require('../assets/images/LOGO.png')} style={styles.logo} resizeMode="contain" />
      
      <Text style={[styles.title, { color: colors.text }]}>Welcome Back!</Text>
      <Text style={[styles.subtitle, { color: colors.text }]}>Sign in to continue</Text>
      
      <TextInput
        style={[
          styles.input,
          { 
            backgroundColor: colors.card, 
            color: colors.text, 
            borderColor: colors.border 
          }
        ]}
        placeholder="Email"
        placeholderTextColor={colorScheme === 'dark' ? '#888' : '#AAA'}
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        style={[
          styles.input,
          { 
            backgroundColor: colors.card, 
            color: colors.text, 
            borderColor: colors.border 
          }
        ]}
        placeholder="Password"
        placeholderTextColor={colorScheme === 'dark' ? '#888' : '#AAA'}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <TouchableOpacity 
        style={[styles.button, { backgroundColor: colors.primary }]} 
        onPress={handleLogin} 
        disabled={isLoading}
      >
        <Text style={[styles.buttonText, { color: colorScheme === 'dark' ? '#FFFFFF' : '#FFFFFF'}]}>
          {isLoading ? "Logging in..." : "Login"}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center', // Center content horizontally
    padding: 20,
  },
  logo: {
    width: 150,
    height: 150,
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 30,
    textAlign: 'center',
    opacity: 0.7,
  },
  input: {
    width: '100%', // Make input take full width of padding
    height: 50,
    borderWidth: 1,
    marginBottom: 15,
    paddingHorizontal: 15,
    borderRadius: 8,
    fontSize: 16,
  },
  button: {
    width: '100%',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    elevation: 2, // for Android shadow
    shadowColor: '#000', // for iOS shadow
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  }
});

export default LoginScreen;
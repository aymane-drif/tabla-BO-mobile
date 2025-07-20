"use client";

import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  ActivityIndicator, 
  Alert, 
  Image, 
  useColorScheme,
  KeyboardAvoidingView,
  Platform,
  ScrollView, 
  Linking
} from 'react-native';
import { useAuth } from '@/Context/AuthContext';
import { useRouter, Stack } from 'expo-router';
import { DarkTheme, DefaultTheme } from '@react-navigation/native'; // For theme colors
import { useTheme } from '@/Context/ThemeContext';
import LanguageSelector from '@/components/LanguageSelector';
import { useTranslation } from 'react-i18next';
import { getTrackingPermissionsAsync, requestTrackingPermissionsAsync } from 'expo-tracking-transparency';

const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false); // State for password visibility
  const { login, isLoading, isAuthenticated, user } = useAuth();
  const router = useRouter();
  const colorScheme = useColorScheme();
  
  const {colors} = useTheme();
  const { t } = useTranslation();

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
    requestTrackingPermission();
  }, []);

  useEffect(() => {
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
      Alert.alert(t('error'), t('enterEmailAndPassword'));
      return;
    }
    try {
      await login({ email, password });
    } catch (error: any) {
      Alert.alert(t('loginFailed'), t('unexpectedError'));
    }
  };

  const toggleShowPassword = () => {
    setShowPassword(!showPassword);
  };

  // if (isLoading && !isAuthenticated) {
  if (isLoading && !isAuthenticated) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.text }]}>{t('loggingIn')}</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0} 
    >
      <ScrollView
        contentContainerStyle={[styles.scrollContainer, { backgroundColor: colors.background }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.innerContainer}>
          <Stack.Screen options={{ headerShown: false }} />
          <Image source={require('../assets/images/android/res/mipmap-xxxhdpi/ic_launcher_foreground.png')} style={styles.logo} resizeMode="cover" />
          
          <Text style={[styles.title, { color: colors.text }]}>{t('welcomeBack')}</Text>
          <Text style={[styles.subtitle, { color: colors.text }]}>{t('signInToContinue')}</Text>
          
          <TextInput
            style={[
              styles.input,
              { 
                backgroundColor: colors.card, 
                color: colors.text, 
                borderColor: colors.border 
              }
            ]}
            placeholder={t('email')}
            placeholderTextColor={colors.textMuted}            
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <View style={[
            styles.passwordInputContainer,
            { 
              backgroundColor: colors.card, 
              borderColor: colors.border 
            }
          ]}>
            <TextInput
              style={[
                styles.passwordTextInput,
                { color: colors.text }
              ]}
              placeholder={t('password')}
              placeholderTextColor={colors.textMuted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity onPress={toggleShowPassword} style={styles.toggleButton}>
              <Text style={[styles.toggleButtonText, { color: colors.primary }]}>
                {showPassword ? t('hide') : t('show')}
              </Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity 
            style={[styles.button, { backgroundColor: colors.primary }]} 
            onPress={handleLogin} 
            disabled={isLoading}
          >
            <Text style={[styles.buttonText, { color: colorScheme === 'dark' ? '#FFFFFF' : '#FFFFFF'}]}>
              {isLoading ? t('loggingIn') : t('login')}
            </Text>
          </TouchableOpacity>

          {/* <TouchableOpacity 
            style={styles.linkContainer}
            onPress={() => Alert.alert('Forgot Password', 'Forgot password functionality to be implemented.')}
          >
            <Text style={[styles.linkText, { color: colors.primary }]}>Forgot Password?</Text>
          </TouchableOpacity> */}

            <View style={styles.footerLinksContainer}>
              <LanguageSelector/>
            </View>
            <View style={styles.footerLinksContainer}>
            <TouchableOpacity onPress={() => Linking.openURL('https://restaurant.tabla.ma/mentions-legales/')}>
              <Text style={[styles.footerLinkText, { color: colors.textMuted }]}>{t('termsOfService')}</Text>
            </TouchableOpacity>
            <Text style={[styles.footerLinkSeparator, { color: colors.textMuted }]}> | </Text>
            <TouchableOpacity onPress={() => Linking.openURL('https://restaurant.tabla.ma/privacy-policy/')}>
              <Text style={[styles.footerLinkText, { color: colors.textMuted }]}>{t('privacyPolicy')}</Text>
            </TouchableOpacity>
            </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  innerContainer: {
    width: '100%',
    alignItems: 'center',
  },
  container: { 
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center', 
    padding: 20,
  },
  logo: {
    width: 150,
    height: 150,
    marginBottom: 30,
    // scale the logo to fit the screen
    transform: [{ scale: 2 }],
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
    width: '100%',
    height: 50,
    borderWidth: 1,
    marginBottom: 15,
    paddingHorizontal: 15,
    borderRadius: 8,
    fontSize: 16,
  },
  passwordInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 15,
    paddingLeft: 15, // Left padding for the text input content
  },
  passwordTextInput: {
    flex: 1, // Takes up available space before the toggle button
    height: '100%', 
    fontSize: 16,
  },
  toggleButton: {
    paddingHorizontal: 15, // Provides padding around the text and acts as right padding for the container
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  toggleButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  button: {
    width: '100%',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    elevation: 2, 
    shadowColor: '#000', 
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
  },
  linkContainer: {
    marginTop: 15,
    alignItems: 'center',
  },
  linkText: {
    fontSize: 14,
    fontWeight: '600',
  },
  footerLinksContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 30, 
    paddingBottom: 10, 
  },
  footerLinkText: {
    fontSize: 12,
    opacity: 0.8,
  },
  footerLinkSeparator: {
    fontSize: 12,
    marginHorizontal: 5,
    opacity: 0.8,
  }
});

export default LoginScreen;
import { StatusBar } from 'expo-status-bar';
import { Platform, StyleSheet, TouchableOpacity } from 'react-native';

import EditScreenInfo from '@/components/EditScreenInfo';
import { Text, View } from '@/components/Themed';
import { useAuth } from '@/Context/AuthContext'; // Import useAuth
import { useTheme } from '@/Context/ThemeContext'; // Import useTheme for styling

export default function ModalScreen() {
  const { logout } = useAuth(); // Get logout function from AuthContext
  const { colors } = useTheme(); // Get colors for styling

  const handleLogout = async () => {
    await logout();
    // Navigation to login screen should be handled by the root _layout.tsx
    // when isAuthenticated becomes false.
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>Profile</Text>
      <View style={[styles.separator, { backgroundColor: colors.border }]} />
      <EditScreenInfo path="app/Profile.tsx" />

      <TouchableOpacity 
        style={[styles.logoutButton, { backgroundColor: colors.danger }]} 
        onPress={handleLogout}
      >
        <Text style={[styles.logoutButtonText, { color: colors.card }]}>Logout</Text>
      </TouchableOpacity>

      {/* Use a light status bar on iOS to account for the black space above the modal */}
      <StatusBar style={Platform.OS === 'ios' ? 'light' : 'auto'} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  separator: {
    marginVertical: 30,
    height: 1,
    width: '80%',
  },
  logoutButton: {
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20, // Add some margin above the button
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});
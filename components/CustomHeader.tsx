"use client"

import type React from "react"
import { View, Text, StyleSheet, TouchableOpacity, Image, AppState } from "react-native"
import { Feather } from "@expo/vector-icons"
import { Link } from "expo-router"
import { useTheme } from "../Context/ThemeContext"
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useState, useEffect, useCallback } from 'react';
import { api as axiosInstance } from '../api/axiosInstance';
import messaging from '@react-native-firebase/messaging';
import { format, isToday, isTomorrow, isValid, isYesterday, parseISO } from "date-fns" // Added parseISO
import { useSelectedDate } from "@/Context/SelectedDateContext" // Added

// Define NotificationCount interface
interface NotificationCount {
  read: number;
  total: number;
  unread: number;
}

interface CustomHeaderProps {
  onTodayPress?: () => void
  onNotificationPress?: () => void
  onLanguagePress?: () => void
  onProfilePress?: () => void
  userName?: string
}

const CustomHeader: React.FC<CustomHeaderProps> = ({
  onTodayPress,
  onNotificationPress,
  onLanguagePress,
  onProfilePress,
  userName = "TT",
}) => {
  const { colors } = useTheme()
  const {toggleTheme} = useTheme()
    const onDarkModeToggle = () => {
        toggleTheme()
        
    }

  const [notificationCount, setNotificationCount] = useState<NotificationCount>({ read: 0, total: 0, unread: 0 });
  const [selectedDateLabel, setSelectedDateLabel] = useState<string>("Today");
  const { selectedDate, setSelectedDate: setSelectedDateContext } = useSelectedDate(); // Use context

  // Function to get smart date label
  const getDateLabel = (dateString: string): string => {
    try {
      const dateToParse = dateString.includes('T') ? dateString : `${dateString}T00:00:00`; // Ensure it's a full ISO string if only date part
      const currentDate = parseISO(dateToParse);


      if (!isValid(currentDate)) {
        return "Today"; // Fallback to Today if invalid date
      }

      if (isToday(currentDate)) {
        return "Today";
      } else if (isYesterday(currentDate)) {
        return "Yesterday";
      } else if (isTomorrow(currentDate)) {
        return "Tomorrow";
      } else {
        // For other dates, show formatted date (e.g., "Dec 25" or "25/12")
        return format(currentDate, "MMM dd");
      }
    } catch (error) {
      console.error("Error parsing date for label:", error, "Date string:", dateString);
      return "Today"; // Fallback to Today
    }
  };

  // Update date label when selectedDate from context changes
  useEffect(() => {
    if (selectedDate) {
      setSelectedDateLabel(getDateLabel(selectedDate));
    } else {
      setSelectedDateLabel("Today"); // Default if context date is somehow null/undefined
    }
  }, [selectedDate]);


  const fetchGlobalCounts = useCallback(async () => {
    try {
      const countResponse = await axiosInstance.get<NotificationCount>('/api/v1/notifications/count/');
      const countData = countResponse.data || { read: 0, total: 0, unread: 0 };
      setNotificationCount(countData);
    } catch (err) {
      console.error('Failed to fetch global notification counts:', err);
      // Optionally set an error state for counts or use stale data
    }
  }, []);

  const handleTodayPress = useCallback(async () => {
    try {
      const today = new Date();
      // await AsyncStorage.setItem("selectedDate", today.toISOString()); // Removed
      setSelectedDateContext(format(today, "yyyy-MM-dd")); // Update context
      // setSelectedDateLabel("Today"); // Label will update via useEffect
      
      // Call the original onTodayPress if provided
      if (onTodayPress) {
        onTodayPress();
      }
    } catch (error) {
      console.error("Error setting today's date:", error);
      // Still call the original function even if context update fails
      if (onTodayPress) {
        onTodayPress();
      }
    }
  }, [onTodayPress, setSelectedDateContext]);

  useEffect(() => {
    fetchGlobalCounts(); // Initial fetch
    // loadSelectedDate(); // Removed
    // Listener for foreground FCM messages
    const unsubscribe = messaging().onMessage(async remoteMessage => {
      console.log('FCM Message received in foreground (CustomHeader):', remoteMessage);
      // Assuming any new message could affect the count, so refetch.
      fetchGlobalCounts();
    });

    return unsubscribe; // Unsubscribe on component unmount
  }, [fetchGlobalCounts]); // Removed loadSelectedDate dependency

  useFocusEffect(
    useCallback(() => {
      fetchGlobalCounts();
      // loadSelectedDate(); // Removed
      return () => {
        // Optional: any cleanup actions
      };
    }, [fetchGlobalCounts]) // Removed loadSelectedDate dependency
  );

    useEffect(() => {
    const handleAppStateChange = (nextAppState: string) => {
      if (nextAppState === 'active') {
        // App came to foreground, reload the date - No longer needed as context handles reactivity
        // loadSelectedDate(); // Removed
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    return () => {
      subscription?.remove();
    };
  }, []); // Removed loadSelectedDate dependency

  useEffect(() => {
    const unsubscribe = messaging().onMessage(async remoteMessage => {
      console.log('FCM Message received in CustomHeader:',remoteMessage);
      // Refresh notification count when a new message arrives
      fetchGlobalCounts();
    });

    return unsubscribe; // Unsubscribe on unmount
  }, [fetchGlobalCounts]);

  return (
    <View style={[styles.container, { backgroundColor: colors.card }]}>
      {/* Logo */}
      <Image
        source={require("../assets/images/LOGO.png")}
        style={styles.logo}
        resizeMode="contain"
      />


      <TouchableOpacity
        style={[styles.todayButton, { backgroundColor: colors.background, borderColor: colors.border }]}
        onPress={handleTodayPress}
      >
        <Text style={[styles.todayText, { color: colors.text }]}>{selectedDateLabel}</Text>
      </TouchableOpacity>

      {/* Right Side Icons */}
      <View style={styles.rightContainer}>
        {/* DarkMode Toggle */}
         {/* <TouchableOpacity style={styles.iconButton} onPress={onDarkModeToggle}>
          <Feather name="moon" size={20} color={colors.text} />
        </TouchableOpacity> */}

        
        {/* Notification Bell */}
        <Link href="/Notifications" asChild>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={onNotificationPress}
          >
            <Feather name="bell" size={20} color={colors.text} />
            {notificationCount.unread > 0 && (
            <View style={styles.badgeContainer}>
              <Text style={styles.badgeText}>
                {notificationCount.unread > 9 ? '9+' : notificationCount.unread}
              </Text>
            </View>
            )}
          </TouchableOpacity>
        </Link>

        {/* Language Selector
        <TouchableOpacity style={styles.languageButton} onPress={onLanguagePress}>
          <Image
            source={{
              uri: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/83/Flag_of_the_United_Kingdom_%283-5%29.svg/1200px-Flag_of_the_United_Kingdom_%283-5%29.svg.png",
            }}
            style={styles.flagIcon}
          />
        </TouchableOpacity> */}

        {/* Profile Avatar */}
        <Link href="/Profile" asChild>
          <TouchableOpacity style={styles.avatarButton} onPress={onProfilePress}>
            <Feather name="user" size={20} color={colors.text} />
          </TouchableOpacity>
        </Link>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  iconButton: {
    marginLeft: 16,
    marginRight: 16,
    padding: 8,
    position: 'relative', // For badge positioning
  },
  badgeContainer: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: "#FF4B4B",
    borderRadius: 10,
    minWidth: 15,
    height: 15,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    color: "white",
    fontSize: 9,
    fontWeight: 'bold',
  },
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 35, // Add status bar height and some extra padding
    paddingBottom: 10, // Keep original bottom padding
  },
  logo: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  todayButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  todayText: {
    fontWeight: "500",
  },
  rightContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  languageButton: {
    marginLeft: 16,
  },
  flagIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  avatarButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 5,
    backgroundColor: "#8BAD62"
  },
  avatarText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
})

export default CustomHeader

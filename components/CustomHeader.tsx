"use client"

import type React from "react"
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native"
import { Feather } from "@expo/vector-icons"
import { Link } from "expo-router"
import { useTheme } from "../Context/ThemeContext"
import { useNavigation } from '@react-navigation/native';


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
        onPress={onTodayPress}
      >
        <Text style={[styles.todayText, { color: colors.text }]}>Today</Text>
      </TouchableOpacity>

      {/* Right Side Icons */}
      <View style={styles.rightContainer}>
        {/* DarkMode Toggle */}
         <TouchableOpacity style={styles.iconButton} onPress={onDarkModeToggle}>
          <Feather name="moon" size={20} color={colors.text} />
        </TouchableOpacity>
        {/* Notification Bell */}
        <Link href="/Notifications" asChild>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={onNotificationPress}
          >
            <Feather name="bell" size={20} color={colors.text} />
            {/* {unreadCount > 0 && (
          // <View style={styles.badgeContainer}>
          //   <Text style={styles.badgeText}>
          //     {unreadCount > 9 ? '9+' : unreadCount}
          //   </Text>
          // </View>
          )} */}
            <View style={styles.badgeContainer}>
              <Text style={styles.badgeText}>9+</Text>
            </View>
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
    paddingVertical: 10,
    height: 60,
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

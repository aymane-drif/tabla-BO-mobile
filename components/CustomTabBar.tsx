"use client"

import React from "react"
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from "react-native"
import { Feather } from "@expo/vector-icons"
import { useRouter, usePathname } from "expo-router"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { useTheme } from "../Context/ThemeContext"

interface TabItem {
  name: string
  label: string
  icon: keyof typeof Feather.glyphMap
  href: string
}

interface CustomTabBarProps {
  tabs: TabItem[]
}

const { width } = Dimensions.get("window")

const CustomTabBar: React.FC<CustomTabBarProps> = ({ tabs }) => {
  const router = useRouter()
  const pathname = usePathname()
  const { colors, isDarkMode } = useTheme()
  const insets = useSafeAreaInsets()

  const handleTabPress = (href: string) => {
    router.push(href as any)
  }

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          shadowColor: isDarkMode ? "transparent" : "#000",
          paddingBottom: Math.max(insets.bottom, 10), // Ensure minimum padding
          height: 50 + insets.bottom, // Add safe area to height
        },
      ]}
    >
      {tabs.map((tab) => {
        const isActive = pathname === tab.href || (pathname === "/" && tab.href === "/")
        return (
          <TouchableOpacity
            key={tab.name}
            style={styles.tabButton}
            onPress={() => handleTabPress(tab.href)}
            activeOpacity={0.7}
          >
            <View style={styles.tabContent}>
              <View
                style={[
                  styles.iconContainer,
                  isActive && { backgroundColor: colors.primary + "20", borderRadius: 6 },
                ]}
              >
                <Feather
                  name={tab.icon}
                  size={22}
                  color={isActive ? colors.primary : colors.subtext}
                />
              </View>
              {/* <Text
                style={[
                  styles.tabLabel,
                  {
                    color: isActive ? colors.primary : colors.subtext,
                    fontWeight: isActive ? "700" : "400",
                  },
                ]}
              >
                {tab.label}
              </Text> */}
            </View>
          </TouchableOpacity>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    borderTopWidth: 1,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 5,
  },
  tabButton: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 10,
  },
  tabContent: {
    alignItems: "center",
    justifyContent: "center",
    width: width / 5,
    position: "relative",
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 2,
  },
  tabLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  activeIndicator: {
    position: "absolute",
    bottom: -10,
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
})

export default CustomTabBar
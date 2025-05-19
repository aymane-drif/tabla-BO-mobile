"use client"
import { Tabs } from "expo-router"
import { Feather } from "@expo/vector-icons"

import Colors from "@/constants/Colors"
import { useColorScheme } from "@/components/useColorScheme"
import { useClientOnlyValue } from "@/components/useClientOnlyValue"
import CustomHeader from "../../components/CustomHeader"

export default function TabLayout() {
  const colorScheme = useColorScheme()

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? "light"].tint,
        // Disable the static render of the header on web
        // to prevent a hydration error in React Navigation v6.
        headerShown: useClientOnlyValue(false, true),
        // Use our custom header
        header: () => (
          <CustomHeader
            onTodayPress={() => console.log("Today pressed")}
            onNotificationPress={() => console.log("Notification pressed")}
            onLanguagePress={() => console.log("Language pressed")}
          />
        ),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Reservations",
          tabBarIcon: ({ color }) => <Feather name="list" size={20} color={color} />,
        }}
      />
      <Tabs.Screen
        name="modal"
        options={{
          title: "Profile",
          tabBarIcon: ({ color }) => <Feather name="user" size={20} color={color} />,
          href: null, // Hide this tab but keep the screen accessible
        }}
      />
    </Tabs>
  )
}

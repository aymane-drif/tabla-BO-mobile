"use client"
import { useState } from "react"
import { Tabs } from "expo-router"

import Colors from "@/constants/Colors"
import { useColorScheme } from "@/components/useColorScheme"
import { useClientOnlyValue } from "@/components/useClientOnlyValue"
import CustomHeader from "@/components/CustomHeader"
import CustomTabBar from "@/components/CustomTabBar"
import CalendarModal from "@/components/calendar/CalendarModal"
import ReservationProcess from "@/components/reservation/ReservationProcess"
import { SelectedDateProvider, useSelectedDate } from "@/Context/SelectedDateContext"

function TabLayoutContent() {
  const colorScheme = useColorScheme()
  const [showCalendar, setShowCalendar] = useState(false)
  const [showReservationProcess, setShowReservationProcess] = useState(false)
  const { selectedDate, setSelectedDate } = useSelectedDate() // selectedDate is "yyyy-MM-dd" string

  // Define tabs for our custom tab bar
  const tabs = [
    {
      name: "index",
      label: "Reservations",
      icon: "list" as const,
      href: "/",
    },
    // {
    //   name: "tables",
    //   label: "Tables",
    //   icon: "grid" as const,
    //   href: "/tables",
    // },
    // {
    //   name: "add",
    //   label: "Add",
    //   icon: "plus-circle" as const,
    //   href: "/add",
    // },
    // {
    //   name: "calendar",
    //   label: "Calendar",
    //   icon: "calendar" as const,
    //   href: "/calendar",
    // },
    // {
    //   name: "settings",
    //   label: "Settings",
    //   icon: "settings" as const,
    //   href: "/settings",
    // },
  ]

  const handleDateSelect = (date: string) => {
    setSelectedDate(date)
    console.log("Selected date (from context):", date)
  }

  const handleReservationComplete = (data: any) => {
    console.log("Reservation completed with data:", data)
    // Here you would typically save the reservation to your backend
  }

  return (
    <>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: Colors[colorScheme ?? "light"].tint,
          // Disable the static render of the header on web
          // to prevent a hydration error in React Navigation v6.
          headerShown: useClientOnlyValue(false, true),
          // Use our custom header
          header: () => (
            <CustomHeader
              onTodayPress={() => {
                // Log the selectedDate from context just before setShowCalendar
                console.log("[_layout.tsx] onTodayPress: current selectedDate from context:", selectedDate);
                console.log("[_layout.tsx] onTodayPress: showing calendar now.");
                setShowCalendar(true)
              }}
              onNotificationPress={() => console.log("Notification pressed")}
              onLanguagePress={() => console.log("Language pressed")}
            />
          ),
          // Hide the default tab bar since we're using our custom one
          tabBarStyle: { display: "none" },
        }}
        tabBar={(props) => <CustomTabBar tabs={tabs} />}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Reservations",
          }}
        />
        <Tabs.Screen
          name="tables"
          options={{
            title: "Tables",
          }}
        />
        <Tabs.Screen
          name="add"
          options={{
            title: "Add Reservation",
          }}
        />
        <Tabs.Screen
          name="calendar"
          options={{
            title: "Calendar",
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: "Settings",
          }}
        />
        <Tabs.Screen
          name="modal"
          options={{
            title: "Profile",
            href: null, // Hide this tab but keep the screen accessible
          }}
        />
      </Tabs>

      {/* Conditionally render CalendarModal to ensure it mounts fresh with new props */}
      {showCalendar && (
        <CalendarModal
          // Key ensures re-mount if selectedDate changed since last time it was shown.
          // isVisible prop is implicitly true when rendered here.
          key={`calendar-modal-instance-${selectedDate}`}
          isVisible={true} 
          onClose={() => setShowCalendar(false)}
          onSelectDate={handleDateSelect}
          initialDate={selectedDate} 
        />
      )}

      {/* Reservation Process Modal
      {showReservationProcess && (
        <ReservationProcess
          isVisible={showReservationProcess}
          onClose={() => setShowReservationProcess(false)}
          onComplete={handleReservationComplete}
          maxGuests={15}
          minGuests={1}
        />
      )} */}
    </>
  )
}

export default function TabLayout() {
  return (
    <SelectedDateProvider>
      <TabLayoutContent />
    </SelectedDateProvider>
  )
}

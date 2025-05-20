"use client"

import type React from "react"
import { useState, useEffect } from "react"
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  TextInput,
  Dimensions,
  Platform,
} from "react-native"
import { format } from "date-fns"
import { Feather } from "@expo/vector-icons"
import { useTheme } from "../../Context/ThemeContext"
import Calendar from "../Calendar"

// Types
type SelectedData = {
  reserveDate: string
  time: string
  guests: number
}

interface ReservationProcessProps {
  isVisible: boolean
  onClose: () => void
  onComplete: (data: SelectedData) => void
  maxGuests?: number
  minGuests?: number
  initialData?: SelectedData
}

export type AvailableDate = {
  day: number
  isAvailable: boolean
}

// Group time slots by category (lunch, dinner, etc.)
type GroupedTimeSlots = {
  [category: string]: string[]
}

const { width, height } = Dimensions.get("window")

const ReservationProcess: React.FC<ReservationProcessProps> = ({
  isVisible,
  onClose,
  onComplete,
  maxGuests = 15,
  minGuests = 1,
  initialData,
}) => {
  const { colors, isDarkMode } = useTheme()

  // States
  const [activeTab, setActiveTab] = useState<"date" | "guest" | "time" | "confirm">("date")
  const [selectedDate, setSelectedDate] = useState<Date | null>(
    initialData?.reserveDate ? new Date(initialData.reserveDate) : null,
  )
  const [selectedTime, setSelectedTime] = useState<string | null>(initialData?.time || null)
  const [selectedGuests, setSelectedGuests] = useState<number | null>(initialData?.guests || null)
  const [numberGuests, setNumberGuests] = useState<string>(initialData?.guests?.toString() || "")
  const [selectedData, setSelectedData] = useState<SelectedData>({
    reserveDate: initialData?.reserveDate || "",
    time: initialData?.time || "",
    guests: initialData?.guests || 0,
  })
  const [availableDates, setAvailableDates] = useState<AvailableDate[]>([])
  const [availableTimes, setAvailableTimes] = useState<GroupedTimeSlots>({})
  const [loadingDates, setLoadingDates] = useState<boolean>(true)
  const [loadingTimes, setLoadingTimes] = useState<boolean>(false)
  const [currentMonth, setCurrentMonth] = useState<string>(format(new Date(), "yyyy-MM"))

  // Reset active tab when modal opens with initial data
//   useEffect(() => {
//     if (isVisible) {
//       if (initialData?.reserveDate && initialData?.time && initialData?.guests) {
//         setActiveTab("confirm")
//       } else if (initialData?.reserveDate && initialData?.guests) {
//         setActiveTab("time")
//       } else if (initialData?.reserveDate) {
//         setActiveTab("guest")
//       } else {
//         setActiveTab("date")
//       }
//     }
//   }, [isVisible, initialData])

  // Fetch available dates for the current month
  useEffect(() => {
    if (isVisible) {
      fetchAvailableDates()
    }
  }, [currentMonth, isVisible])

  // Fetch available times when date and guests are selected
  useEffect(() => {
    if (selectedDate && selectedGuests) {
      fetchAvailableTimes()
    }
  }, [selectedDate, selectedGuests])

  // Mock API calls
  const fetchAvailableDates = () => {
    setLoadingDates(true)
    // Simulate API call
    setTimeout(() => {
      // Generate random available days
      const mockAvailableDates: AvailableDate[] = []
      const daysInMonth = new Date(
        Number.parseInt(currentMonth.split("-")[0]),
        Number.parseInt(currentMonth.split("-")[1]),
        0,
      ).getDate()

      for (let i = 1; i <= daysInMonth; i++) {
        // Make 70% of days available
        mockAvailableDates.push({
          day: i,
          isAvailable: Math.random() > 0.3,
        })
      }

      setAvailableDates(mockAvailableDates)
      setLoadingDates(false)
    }, 1000)
  }

  const fetchAvailableTimes = () => {
    if (!selectedDate || !selectedGuests) return

    setLoadingTimes(true)
    setAvailableTimes({})

    // Simulate API call
    setTimeout(() => {
      // Generate mock time slots grouped by category
      const mockTimeSlots: GroupedTimeSlots = {
        Lunch: ["11:30", "12:00", "12:30", "13:00", "13:30", "14:00"],
        "Early Dinner": ["17:00", "17:30", "18:00"],
        "Prime Time": ["18:30", "19:00", "19:30", "20:00"],
        "Late Dinner": ["20:30", "21:00", "21:30", "22:00"],
      }

      // Randomly remove some time slots to simulate availability
      Object.keys(mockTimeSlots).forEach((category) => {
        mockTimeSlots[category] = mockTimeSlots[category].filter(() => Math.random() > 0.3)

        // If all slots are removed, delete the category
        if (mockTimeSlots[category].length === 0) {
          delete mockTimeSlots[category]
        }
      })

      setAvailableTimes(mockTimeSlots)
      setLoadingTimes(false)
    }, 1500)
  }

  // Handlers
  const handleDateClick = (day: Date) => {
    setSelectedDate(day)
    const formattedDate = format(day, "yyyy-MM-dd")
    setSelectedData((prev) => ({ ...prev, time: "", reserveDate: formattedDate }))
    setSelectedTime(null)
    setSelectedGuests(null)
    setNumberGuests("")
    setAvailableTimes({})
    setActiveTab("guest")
  }

  const handleGuestClick = (guest: number) => {
    if (loadingTimes) return

    setAvailableTimes({})
    setSelectedGuests(guest)
    setNumberGuests(guest.toString())
    setSelectedData((prevData) => ({ ...prevData, guests: guest }))
    setSelectedTime(null)
    setActiveTab("time")
  }

  const handleManualGuestConfirm = () => {
    const guests = Number.parseInt(numberGuests)
    if (isNaN(guests) || guests < minGuests) return
    handleGuestClick(guests)
  }

  const handleTimeClick = (time: string) => {
    setSelectedTime(time)
    setSelectedData((prevData) => ({ ...prevData, time }))
    setActiveTab("confirm")
  }

  const handleConfirmClick = () => {
    onComplete(selectedData)
    onClose()
  }

  const handleMonthChange = (newMonth: string) => {
    setCurrentMonth(newMonth)
    setAvailableDates([])
  }

  // Render tab content
  const renderDateTab = () => (
    <View style={styles.tabContent}>
      <Text style={[styles.tabTitle, { color: colors.text }]}>
        {selectedDate ? (
          <>
            {format(selectedDate, "dd MMMM yyyy")} <Text style={styles.tabSubtitle}>has been selected</Text>
          </>
        ) : (
          <Text style={styles.tabSubtitle}>Select a date</Text>
        )}
      </Text>
      <Calendar
        forbidden={true}
        value={selectedDate}
        onClick={handleDateClick}
        availableDays={availableDates}
        loading={loadingDates}
        onMonthChange={(month: string) => handleMonthChange(month)}
      />
    </View>
  )

  const renderGuestTab = () => (
    <View style={styles.tabContent}>
      <Text style={[styles.tabTitle, { color: colors.text }]}>
        {selectedGuests ? (
          <>
            {selectedGuests} <Text style={styles.tabSubtitle}>guests have been selected</Text>
          </>
        ) : (
          <Text style={styles.tabSubtitle}>Choose number of guests</Text>
        )}
      </Text>
      <ScrollView contentContainerStyle={styles.guestButtonsContainer}>
        {Array.from({ length: maxGuests }, (_, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.guestButton,
              selectedGuests === index + 1 && { backgroundColor: colors.primary },
              { borderColor: colors.primary },
            ]}
            onPress={() => handleGuestClick(index + 1)}
          >
            <Text style={[styles.guestButtonText, { color: selectedGuests === index + 1 ? "white" : colors.text }]}>
              {index + 1}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <Text style={[styles.orText, { color: colors.text }]}>Or enter number of guests</Text>
      <View style={styles.manualGuestContainer}>
        <TextInput
          style={[styles.guestInput, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
          value={numberGuests}
          onChangeText={setNumberGuests}
          keyboardType="number-pad"
          placeholder="Enter number of guests"
          placeholderTextColor={colors.subtext}
        />
        <TouchableOpacity
          style={[
            styles.confirmGuestButton,
            { backgroundColor: colors.primary },
            (!numberGuests || Number.parseInt(numberGuests) < minGuests || loadingTimes) && { opacity: 0.5 },
          ]}
          onPress={handleManualGuestConfirm}
          disabled={!numberGuests || Number.parseInt(numberGuests) < minGuests || loadingTimes}
        >
          {loadingTimes ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <Text style={styles.confirmGuestButtonText}>Confirm</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  )

  const renderTimeTab = () => (
    <View style={styles.tabContent}>
      <Text style={[styles.tabTitle, { color: colors.text }]}>
        {selectedTime ? (
          <>
            {selectedTime} <Text style={styles.tabSubtitle}>has been selected</Text>
          </>
        ) : (
          <Text style={styles.tabSubtitle}>Available Times</Text>
        )}
      </Text>
      {loadingTimes ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text }]}>Loading available times...</Text>
        </View>
      ) : Object.keys(availableTimes).length === 0 ? (
        <View style={styles.emptyStateContainer}>
          <Feather name="alert-circle" size={48} color={colors.subtext} />
          <Text style={[styles.emptyStateText, { color: colors.subtext }]}>
            No available time slots for this date {selectedDate ? format(selectedDate, "dd MMMM yyyy") : ""} and number
            of guests {selectedGuests || ""}
          </Text>
        </View>
      ) : (
        <ScrollView style={styles.timeSlotScrollView}>
          {Object.entries(availableTimes).map(([category, times]) => (
            <View key={category} style={styles.timeCategory}>
              <Text style={[styles.categoryTitle, { color: colors.primary, borderBottomColor: colors.primary }]}>
                {category}
              </Text>
              <View style={styles.timeButtonsContainer}>
                {times.map((time, index) => {
                  const now = new Date()
                  const isToday = selectedDate && format(selectedDate, "yyyy-MM-dd") === format(now, "yyyy-MM-dd")
                  const [hour, minute] = time.split(":").map(Number)
                  const isPastTime =
                    isToday && (hour < now.getHours() || (hour === now.getHours() && minute < now.getMinutes()))

                  return (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.timeButton,
                        selectedTime === time && { backgroundColor: colors.primary },
                        isPastTime && { backgroundColor: colors.card, opacity: 0.5 },
                        { borderColor: colors.primary },
                      ]}
                      onPress={() => !isPastTime && handleTimeClick(time)}
                      disabled={!!isPastTime}
                    >
                      <Text
                        style={[
                          styles.timeButtonText,
                          { color: selectedTime === time ? "white" : colors.text },
                          isPastTime && { color: colors.subtext },
                        ]}
                      >
                        {time}
                      </Text>
                    </TouchableOpacity>
                  )
                })}
              </View>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  )

  const renderConfirmTab = () => (
    <View style={styles.tabContent}>
      <Text style={[styles.confirmTitle, { color: colors.text }]}>
        <Text style={styles.confirmSubtitle}>Your reservation is set for</Text>{" "}
        {selectedDate && format(selectedDate, "dd MMMM yyyy")} <Text style={styles.confirmSubtitle}>at</Text>{" "}
        {selectedTime} <Text style={styles.confirmSubtitle}>for</Text> {selectedGuests}{" "}
        <Text style={styles.confirmSubtitle}>guests</Text>
      </Text>
      <View style={styles.confirmButtonContainer}>
        <TouchableOpacity
          style={[styles.confirmButton, { backgroundColor: colors.primary }]}
          onPress={handleConfirmClick}
        >
          <Text style={styles.confirmButtonText}>Confirm</Text>
        </TouchableOpacity>
      </View>
    </View>
  )

  return (
    <Modal 
      visible={isVisible} 
      transparent={true} 
      animationType="slide" 
      onRequestClose={onClose}
      statusBarTranslucent={true}
      hardwareAccelerated={true}
    >
      <View style={styles.modalOverlay}>
        <View
          style={[
            styles.modalContainer,
            { backgroundColor: colors.card },
            Platform.OS === "ios" && {
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.25,
              shadowRadius: 3.84,
            },
          ]}
        >
          {/* Header with close button */}
          <View style={styles.header}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>Make a Reservation</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Feather name="x" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          {/* Tab navigation */}
          <View style={styles.tabsContainer}>
            <TouchableOpacity
              style={[styles.tab, activeTab === "date" && styles.activeTab, { borderBottomColor: colors.primary }]}
              onPress={() => setActiveTab("date")}
            >
              <Text style={[styles.tabText, { color: activeTab === "date" ? colors.primary : colors.subtext }]}>
                Date
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.tab,
                activeTab === "guest" && styles.activeTab,
                { borderBottomColor: colors.primary },
                !selectedDate && styles.disabledTab,
              ]}
              onPress={() => selectedDate && setActiveTab("guest")}
              disabled={!selectedDate}
            >
              <Text
                style={[
                  styles.tabText,
                  {
                    color: !selectedDate
                      ? colors.subtext + "80"
                      : activeTab === "guest"
                        ? colors.primary
                        : colors.subtext,
                  },
                ]}
              >
                Guest
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.tab,
                activeTab === "time" && styles.activeTab,
                { borderBottomColor: colors.primary },
                !(selectedDate && selectedGuests) && styles.disabledTab,
              ]}
              onPress={() => selectedDate && selectedGuests && setActiveTab("time")}
              disabled={!(selectedDate && selectedGuests)}
            >
              <Text
                style={[
                  styles.tabText,
                  {
                    color: !(selectedDate && selectedGuests)
                      ? colors.subtext + "80"
                      : activeTab === "time"
                        ? colors.primary
                        : colors.subtext,
                  },
                ]}
              >
                Time
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.tab,
                activeTab === "confirm" && styles.activeTab,
                { borderBottomColor: colors.primary },
                !(selectedDate && selectedGuests && selectedTime) && styles.disabledTab,
              ]}
              onPress={() => selectedDate && selectedGuests && selectedTime && setActiveTab("confirm")}
              disabled={!(selectedDate && selectedGuests && selectedTime)}
            >
              <Text
                style={[
                  styles.tabText,
                  {
                    color: !(selectedDate && selectedGuests && selectedTime)
                      ? colors.subtext + "80"
                      : activeTab === "confirm"
                        ? colors.primary
                        : colors.subtext,
                  },
                ]}
              >
                Confirm
              </Text>
            </TouchableOpacity>
          </View>
          {/* Tab content */}
          <ScrollView style={styles.contentContainer} showsVerticalScrollIndicator={false}>
            {activeTab === "date" && renderDateTab()}
            {activeTab === "guest" && renderGuestTab()}
            {activeTab === "time" && renderTimeTab()}
            {activeTab === "confirm" && renderConfirmTab()}
          </ScrollView>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalContainer: {
    width: width * 0.9,
    maxHeight: height * 0.9,
    borderRadius: 16,
    overflow: "hidden",
    elevation: 5,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(0, 0, 0, 0.1)",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  closeButton: {
    padding: 4,
  },
  tabsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 12,
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  activeTab: {
    borderBottomWidth: 2,
  },
  disabledTab: {
    opacity: 0.5,
  },
  tabText: {
    fontSize: 16,
    fontWeight: "500",
  },
  contentContainer: {
    flex: 1,
  },
  tabContent: {
    padding: 16,
  },
  tabTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
  },
  tabSubtitle: {
    fontWeight: "normal",
  },
  guestButtonsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    paddingVertical: 16,
  },
  guestButton: {
    width: 65,
    height: 65,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
    margin: 5,
  },
  guestButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  orText: {
    textAlign: "center",
    marginVertical: 16,
  },
  manualGuestContainer: {
    flexDirection: "row",
    marginBottom: 16,
  },
  guestInput: {
    flex: 1,
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginRight: 8,
  },
  confirmGuestButton: {
    paddingHorizontal: 16,
    height: 50,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  confirmGuestButtonText: {
    color: "white",
    fontWeight: "600",
  },
  loadingContainer: {
    padding: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  emptyStateContainer: {
    padding: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyStateText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: "center",
  },
  timeSlotScrollView: {
    maxHeight: 400,
  },
  timeCategory: {
    marginBottom: 16,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
    paddingBottom: 4,
    borderBottomWidth: 1,
  },
  timeButtonsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  timeButton: {
    width: 65,
    height: 65,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
    margin: 5,
  },
  timeButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  confirmTitle: {
    fontSize: 18,
    lineHeight: 28,
    textAlign: "center",
    marginBottom: 24,
  },
  confirmSubtitle: {
    fontWeight: "normal",
  },
  confirmButtonContainer: {
    alignItems: "center",
    paddingVertical: 16,
  },
  confirmButton: {
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
  },
  confirmButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
})

export default ReservationProcess

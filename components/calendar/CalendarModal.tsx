"use client"

import type React from "react"

import { useState } from "react"
import { View, Text, Modal, StyleSheet, TouchableOpacity, Dimensions } from "react-native"
import { useTheme } from "../../Context/ThemeContext"
import Calendar from "../Calendar"
import { format, startOfToday } from "date-fns"
import { Feather } from "@expo/vector-icons"

interface CalendarModalProps {
  isVisible: boolean
  onClose: () => void
  onSelectDate?: (date: Date) => void
  initialDate?: Date
}

const { height } = Dimensions.get("window")

const CalendarModal: React.FC<CalendarModalProps> = ({
  isVisible,
  onClose,
  onSelectDate,
  initialDate = startOfToday(),
}) => {
  const { colors } = useTheme()
  const [selectedDate, setSelectedDate] = useState<Date>(initialDate)
  const [isLoading, setIsLoading] = useState(false)

  // Mock available days - in a real app, this would come from an API
  const [availableDays, setAvailableDays] = useState([
    { day: 10, isAvailable: false },
    { day: 15, isAvailable: false },
    { day: 20, isAvailable: false },
  ])

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date)
    if (onSelectDate) {
      onSelectDate(date)
    }
  }

  const handleMonthChange = (month: string) => {
    // Simulate loading data for the new month
    setIsLoading(true)
    setTimeout(() => {
      // Generate random available days for the new month
      const newAvailableDays = Array.from({ length: 5 }, () => ({
        day: Math.floor(Math.random() * 28) + 1,
        isAvailable: false,
      }))
      setAvailableDays(newAvailableDays)
      setIsLoading(false)
    }, 500)
  }

  const handleConfirm = () => {
    if (onSelectDate) {
      onSelectDate(selectedDate)
    }
    onClose()
  }

  return (
    <Modal animationType="slide" transparent={true} visible={isVisible} onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContainer, { backgroundColor: colors.card }]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>Select Date</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Feather name="x" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.calendarContainer}>
            <Calendar
              value={selectedDate}
              onClick={handleDateSelect}
              onMonthChange={handleMonthChange}
              availableDays={availableDays}
              loading={isLoading}
              forbidden={true}
            />
          </View>

          <View style={styles.selectedDateContainer}>
            <View style={[styles.dateDisplay, { backgroundColor: colors.background }]}>
              <Feather name="calendar" size={20} color={colors.primary} style={styles.dateIcon} />
              <Text style={[styles.dateText, { color: colors.text }]}>
                {format(selectedDate, "EEEE, MMMM d, yyyy")}
              </Text>
            </View>
          </View>

          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.cancelButton, { backgroundColor: colors.background, borderColor: colors.border }]}
              onPress={onClose}
            >
              <Text style={{ color: colors.text }}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.confirmButton, { backgroundColor: colors.primary }]}
              onPress={handleConfirm}
            >
              <Text style={styles.confirmButtonText}>Confirm</Text>
            </TouchableOpacity>
          </View>
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
  },
  modalContainer: {
    width: "90%",
    maxHeight: height * 0.8,
    borderRadius: 16,
    overflow: "hidden",
    padding: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
  },
  closeButton: {
    padding: 4,
  },
  calendarContainer: {
    marginBottom: 16,
  },
  selectedDateContainer: {
    marginBottom: 16,
  },
  dateDisplay: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 8,
  },
  dateIcon: {
    marginRight: 8,
  },
  dateText: {
    fontSize: 16,
    fontWeight: "500",
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  cancelButton: {
    flex: 1,
    height: 50,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
    borderWidth: 1,
  },
  confirmButton: {
    flex: 1,
    height: 50,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  confirmButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
})

export default CalendarModal

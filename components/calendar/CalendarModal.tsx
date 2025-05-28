"use client"

import type React from "react"
import { useState, useEffect, useMemo } from "react"
import { View, Text, Modal, StyleSheet, TouchableOpacity, Dimensions } from "react-native"
import { useTheme } from "../../Context/ThemeContext"
import { Calendar as ReactNativeCalendar, DateData } from "react-native-calendars"
import { format, startOfToday, parseISO, getMonth, getYear, getDate, isSameDay } from "date-fns"
import { Feather } from "@expo/vector-icons"

interface CalendarModalProps {
  isVisible: boolean // Will be true when rendered due to parent's conditional rendering
  onClose: () => void
  onSelectDate?: (date: string) => void
  initialDate?: string 
  availableDays?: { day: number; isAvailable: boolean }[]
  loading?: boolean
  forbidden?: boolean
}

const { height } = Dimensions.get("window")

const CalendarModal: React.FC<CalendarModalProps> = ({
  isVisible, // This prop is true when the component is mounted by the parent
  onClose,
  onSelectDate,
  initialDate = format(startOfToday(), "yyyy-MM-dd"), 
  availableDays = [],
  loading = false,
  forbidden = false,
}) => {
  const { colors, isDarkMode } = useTheme()
  
  // These states will be initialized with the fresh initialDate prop on each mount
  const [selectedDateString, setSelectedDateString] = useState<string>(initialDate)
  const [currentDisplayMonth, setCurrentDisplayMonth] = useState<string>(initialDate)

  // This useEffect runs on mount (as isVisible is true) and if initialDate prop were to change
  // while mounted (though re-mounting is the primary mechanism now for prop updates).
  useEffect(() => {
    console.log("[CalendarModal] Component mounted/props updated. Received initialDate prop:", initialDate);
    setSelectedDateString(initialDate);
    setCurrentDisplayMonth(initialDate);
  }, [initialDate]); // Depend on initialDate; isVisible is handled by mount/unmount

  // This mock function simulates fetching/updating availableDays when month changes
  // In a real app, this would call an API and update the `availableDays` prop from parent
  const handleMonthChangeInternal = (dateData: DateData) => {
    setCurrentDisplayMonth(dateData.dateString);
    // Simulate fetching new available days for the new month
    // This part should ideally be handled by the parent component by listening to an onMonthChange callback
    // and then passing updated `availableDays` and `loading` props.
    // For now, we assume parent handles this and updates `availableDays` & `loading` props.
    // Example: props.onInternalMonthChange?.(dateData.dateString);
  };
  
  const markedDates = useMemo(() => {
    const marks: { [key: string]: any } = {};
    const todayStr = format(startOfToday(), "yyyy-MM-dd");

    // Process availableDays for the currentDisplayMonth
    // Ensure currentDisplayMonth is a valid date string before parsing
    let year = getYear(startOfToday());
    let month = getMonth(startOfToday()) + 1;
    try {
        if (currentDisplayMonth && parseISO(currentDisplayMonth)) {
            year = getYear(parseISO(currentDisplayMonth));
            month = getMonth(parseISO(currentDisplayMonth)) + 1; // date-fns month is 0-indexed
        }
    } catch (e) {
        console.error("Error parsing currentDisplayMonth for markedDates:", currentDisplayMonth, e);
        // Fallback to today's year/month or handle error appropriately
    }


    availableDays.forEach(ad => {
      const dayStr = ad.day < 10 ? `0${ad.day}` : String(ad.day);
      const monthStr = month < 10 ? `0${month}` : String(month);
      const dateString = `${year}-${monthStr}-${dayStr}`;
      
      marks[dateString] = {
        disabled: !ad.isAvailable,
        disableTouchEvent: !ad.isAvailable,
        // marked: ad.isAvailable, // Optional: add a dot for available days
        // dotColor: colors.primary,
      };
    });

    // Mark today
    if (!marks[todayStr] || (!marks[todayStr].disabled && !marks[todayStr].selected)) {
      marks[todayStr] = { ...marks[todayStr], marked: true, dotColor: colors.success };
    }
    
    // Mark selected date
    if (selectedDateString) {
      marks[selectedDateString] = {
        ...(marks[selectedDateString] || {}),
        selected: true,
        selectedColor: colors.primary,
        disableTouchEvent: marks[selectedDateString]?.disabled ? true : false, // Ensure disabled state is respected
        marked: true, // Ensure dot or marking for selected
      };
      // If selected is also today, primary color takes precedence
      if (selectedDateString === todayStr) {
        marks[selectedDateString].dotColor = isDarkMode ? colors.text : "#FFFFFF"; // Dot color on selected today
      }
    }
    return marks;
  }, [selectedDateString, currentDisplayMonth, availableDays, colors, isDarkMode]);


  const handleDayPress = (day: DateData) => {
    if (loading) return; // Prevent selection if calendar data is loading

    const dayObj = parseISO(day.dateString);
    if (forbidden && dayObj < startOfToday() && !isSameDay(dayObj, startOfToday())) {
      return; // Prevent selecting past dates if forbidden (unless it's today)
    }

    // Check if the date is marked as disabled from availableDays
    if (markedDates[day.dateString]?.disabled) {
        return;
    }

    setSelectedDateString(day.dateString)
    // No direct call to onSelectDate here, confirmation is via button
  }

  const handleConfirm = () => {
    if (onSelectDate && selectedDateString) {
      onSelectDate(selectedDateString)
    }
    onClose()
  }

  const calendarTheme = {
    backgroundColor: colors.card,
    calendarBackground: colors.card,
    textSectionTitleColor: colors.subtext,
    selectedDayBackgroundColor: colors.primary,
    selectedDayTextColor: isDarkMode ? colors.text : "#ffffff",
    todayTextColor: colors.success, // Use success for today's text color
    dayTextColor: colors.text,
    textDisabledColor: colors.text + '4D',
    dotColor: colors.primary, // Default dot color
    selectedDotColor: isDarkMode ? colors.text : "#ffffff", // Dot color on selected day
    arrowColor: colors.primary,
    disabledArrowColor: colors.subtext + "80",
    monthTextColor: colors.text,
    indicatorColor: colors.primary,
    textDayFontWeight: '400' as const,
    textMonthFontWeight: 'bold' as const,
    textDayHeaderFontWeight: '300' as const,
    textDayFontSize: 15,
    textMonthFontSize: 18,
    textDayHeaderFontSize: 13,
  };

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
            <ReactNativeCalendar
              // Key ensures the internal calendar also re-initializes if the display month needs to change.
              key={`rn-calendar-${currentDisplayMonth}`} 
              current={currentDisplayMonth}
              onDayPress={handleDayPress}
              markedDates={markedDates}
              onMonthChange={handleMonthChangeInternal}
              monthFormat={"MMMM yyyy"}
              theme={calendarTheme}
              minDate={forbidden ? format(startOfToday(), "yyyy-MM-dd") : undefined}
              displayLoadingIndicator={loading}
              hideExtraDays={true}
              style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 8 }}
            />
          </View>

          <View style={styles.selectedDateContainer}>
            <View style={[styles.dateDisplay, { backgroundColor: colors.background }]}>
              <Feather name="calendar" size={20} color={colors.primary} style={styles.dateIcon} />
              <Text style={[styles.dateText, { color: colors.text }]}>
                {selectedDateString ? format(parseISO(selectedDateString), "EEEE, MMMM d, yyyy") : "No date selected"}
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

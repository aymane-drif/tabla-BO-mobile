"use client"

import type React from "react"
import { useState } from "react"
import { View, Text, StyleSheet, TouchableOpacity } from "react-native"
import { format } from "date-fns"
import { Calendar } from "react-native-calendars"
import { useTheme } from "../../Context/ThemeContext"
import { useTranslation } from "react-i18next"

interface IntervalCalendarProps {
  onRangeSelect: (range: { start: Date; end: Date }) => void
  onClose: () => void
  isDarkMode: boolean
}

const IntervalCalendar: React.FC<IntervalCalendarProps> = ({ onRangeSelect, onClose, isDarkMode }) => {
  const [startDate, setStartDate] = useState<Date | null>(null)
  const [endDate, setEndDate] = useState<Date | null>(null)
  const { colors } = useTheme()
  const { t } = useTranslation()

  const handleDayPress = (day: any) => {
    if (!startDate || (startDate && endDate)) {
      // First selection or reset - set start date
      const selectedDate = new Date(day.dateString)
      setStartDate(selectedDate)
      setEndDate(null)
    } else {
      // Second selection - set end date
      const selectedDate = new Date(day.dateString)
      if (selectedDate < startDate) {
        // If selected date is before start date, swap them
        setEndDate(startDate)
        setStartDate(selectedDate)
      } else {
        setEndDate(selectedDate)
      }
    }
  }

  const handleApply = () => {
    if (startDate) {
      onRangeSelect({
        start: startDate,
        end: endDate || startDate,
      })
    }
  }

  // Format dates for the calendar
  const getMarkedDates = () => {
    if (!startDate) return {}

    const markedDates: any = {}

    // Format start date
    const startDateStr = format(startDate, "yyyy-MM-dd")
    markedDates[startDateStr] = {
      startingDay: true,
      color: colors.primary,
      textColor: "white",
    }

    // If we have an end date, mark the range
    if (endDate) {
      const endDateStr = format(endDate, "yyyy-MM-dd")

      // If start and end are the same day
      if (startDateStr === endDateStr) {
        markedDates[startDateStr] = {
          startingDay: true,
          endingDay: true,
          color: colors.primary,
          textColor: "white",
        }
      } else {
        // Mark end date
        markedDates[endDateStr] = {
          endingDay: true,
          color: colors.primary,
          textColor: "white",
        }

        // Mark dates in between
        const currentDate = new Date(startDate)
        currentDate.setDate(currentDate.getDate() + 1)

        while (currentDate < endDate) {
          const dateStr = format(currentDate, "yyyy-MM-dd")
          markedDates[dateStr] = {
            color: colors.primary + "80",
            textColor: "white",
          }
          currentDate.setDate(currentDate.getDate() + 1)
        }
      }
    }

    return markedDates
  }

  return (
    <View style={styles.container}>
      <Calendar
        onDayPress={handleDayPress}
        markingType={"period"}
        markedDates={getMarkedDates()}
        theme={{
          calendarBackground: colors.card,
          textSectionTitleColor: colors.text,
          textSectionTitleDisabledColor: colors.text + "60",
          selectedDayBackgroundColor: colors.primary,
          selectedDayTextColor: "#ffffff",
          todayTextColor: colors.primary,
          dayTextColor: colors.text,
          textDisabledColor: colors.text + "40",
          dotColor: colors.primary,
          selectedDotColor: "#ffffff",
          arrowColor: colors.primary,
          disabledArrowColor: colors.text + "40",
          monthTextColor: colors.text,
          indicatorColor: colors.primary,
          textDayFontWeight: "300",
          textMonthFontWeight: "bold",
          textDayHeaderFontWeight: "300",
          textDayFontSize: 16,
          textMonthFontSize: 16,
          textDayHeaderFontSize: 14,
        }}
      />

      <View style={styles.selectionInfo}>
        <Text style={[styles.selectionTitle, { color: colors.text }]}>{t("selectedRange")}:</Text>
        <Text style={[styles.selectionText, { color: colors.text }]}>
          {startDate
            ? `${format(startDate, "MMM dd, yyyy")}${endDate ? ` - ${format(endDate, "MMM dd, yyyy")}` : ""}`
            : t("noDatesSelected")}
        </Text>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.cancelButton, { borderColor: colors.border }]}
          onPress={onClose}
        >
          <Text style={{ color: colors.text }}>{t('cancel')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.button,
            styles.applyButton,
            {
              backgroundColor: colors.primary,
              opacity: startDate ? 1 : 0.5,
            },
          ]}
          onPress={handleApply}
          disabled={!startDate}
        >
          <Text style={styles.applyButtonText}>{t('apply')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    padding: 8,
  },
  selectionInfo: {
    marginTop: 16,
    marginBottom: 8,
    padding: 8,
  },
  selectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  selectionText: {
    fontSize: 14,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButton: {
    marginRight: 8,
    borderWidth: 1,
  },
  applyButton: {
    marginLeft: 8,
  },
  applyButtonText: {
    color: "white",
    fontWeight: "600",
  },
})

export default IntervalCalendar

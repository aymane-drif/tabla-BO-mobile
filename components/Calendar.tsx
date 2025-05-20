"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from "react-native"
import {
  eachDayOfInterval,
  endOfMonth,
  format,
  getDay,
  isSameMonth,
  isToday,
  parse,
  startOfToday,
  add,
  isSameDay,
} from "date-fns"
import { useTheme } from "../Context/ThemeContext"

interface CalendarProps {
  availableDays?: { day: number; isAvailable: boolean }[]
  value?: Date | null
  loading?: boolean
  forbidden?: boolean
  onClick?: (day: Date) => void
  onMonthChange?: (month: string) => void
}

const { width } = Dimensions.get("window")
const DAY_SIZE = (width - 40) / 7 // 40 is for padding

const Calendar: React.FC<CalendarProps> = ({
  availableDays = [],
  value = null,
  loading = false,
  forbidden = false,
  onClick,
  onMonthChange,
}) => {
  const { colors, isDarkMode } = useTheme()
  const today = startOfToday()

  // Check if a day is available based on the availableDays prop
  function isDayAvailable(day: Date) {
    const dayNumber = Number.parseInt(format(day, "d"), 10)
    const foundDay = availableDays.find((d) => d.day === dayNumber)
    return foundDay ? foundDay.isAvailable : true // Default to true if not specified
  }

  const [selectedDay, setSelectedDay] = useState<Date>(value || today)
  const [currentMonth, setCurrentMonth] = useState(format(value || today, "MMM-yyyy"))
  const firstDayCurrentMonth = parse(currentMonth, "MMM-yyyy", new Date())

  // Update selected day when value prop changes
  useEffect(() => {
    if (value) {
      setSelectedDay(value)
      setCurrentMonth(format(value, "MMM-yyyy"))
    }
  }, [value])

  const days = eachDayOfInterval({
    start: firstDayCurrentMonth,
    end: endOfMonth(firstDayCurrentMonth),
  })

  function previousMonth() {
    const firstDayPrevMonth = add(firstDayCurrentMonth, { months: -1 })
    setCurrentMonth(format(firstDayPrevMonth, "MMM-yyyy"))
    onMonthChange?.(format(firstDayPrevMonth, "yyyy-MM"))
  }

  function nextMonth() {
    const firstDayNextMonth = add(firstDayCurrentMonth, { months: 1 })
    setCurrentMonth(format(firstDayNextMonth, "MMM-yyyy"))
    onMonthChange?.(format(firstDayNextMonth, "yyyy-MM"))
  }

  function selectingDate(day: Date) {
    if (loading) return

    // Only allow selecting available days
    if ((forbidden && day < today) || (availableDays.length > 0 && !isDayAvailable(day))) {
      return
    }

    setSelectedDay(day)
    if (onClick) {
      onClick(day)
    }
  }

  // Get column start position based on day of week
  const getColStart = (day: Date): number => {
    return getDay(day)
  }

  // Skeleton loaders for calendar
  const renderSkeleton = () => {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <View
            style={[
              styles.skeletonTitle,
              {
                backgroundColor: isDarkMode ? colors.card : "#e5e7eb",
              },
            ]}
          />
          <View style={styles.navigationButtons}>
            <TouchableOpacity style={styles.navButton} disabled={true}>
              <Text style={{ color: colors.text }}>{"<"}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.navButton} disabled={true}>
              <Text style={{ color: colors.text }}>{">"}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.calendarContainer}>
          <View style={styles.weekdayHeader}>
            {Array(7)
              .fill(0)
              .map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.skeletonWeekday,
                    {
                      backgroundColor: isDarkMode ? colors.card : "#e5e7eb",
                    },
                  ]}
                />
              ))}
          </View>

          <View style={styles.daysGrid}>
            {Array(35)
              .fill(0)
              .map((_, index) => (
                <View key={index} style={styles.dayCell}>
                  <View
                    style={[
                      styles.skeletonDay,
                      {
                        backgroundColor: isDarkMode ? colors.card : "#e5e7eb",
                      },
                    ]}
                  />
                </View>
              ))}
          </View>
        </View>
      </View>
    )
  }

  // Use either external value or internal selectedDay
  const actualSelectedDay = value || selectedDay

  return (
    <View style={styles.container}>
      {loading ? (
        renderSkeleton()
      ) : (
        <>
          <View style={styles.header}>
            <Text style={[styles.monthTitle, { color: colors.text }]}>{format(firstDayCurrentMonth, "MMMM yyyy")}</Text>
            <View style={styles.navigationButtons}>
              <TouchableOpacity style={styles.navButton} onPress={previousMonth} disabled={loading}>
                <Text style={{ color: colors.text }}>{"<"}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.navButton} onPress={nextMonth} disabled={loading}>
                <Text style={{ color: colors.text }}>{">"}</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.calendarContainer}>
            <View style={styles.weekdayHeader}>
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day, index) => (
                <Text key={index} style={[styles.weekdayText, { color: colors.text }]}>
                  {day}
                </Text>
              ))}
            </View>

            <View style={styles.daysGrid}>
              {/* Empty cells for days before the first day of month */}
              {Array(getColStart(days[0]))
                .fill(null)
                .map((_, index) => (
                  <View key={`empty-${index}`} style={styles.dayCell} />
                ))}

              {/* Actual days of the month */}
              {days.map((day, dayIdx) => {
                const isAvailable = isDayAvailable(day)
                const isSelected = isSameDay(day, actualSelectedDay)
                const isTodayDate = isToday(day)
                const isCurrentMonth = isSameMonth(day, firstDayCurrentMonth)
                const isDisabled = (forbidden && day < today) || !isAvailable || loading

                return (
                  <View key={day.toString()} style={styles.dayCell}>
                    <TouchableOpacity
                      style={[
                        styles.dayButton,
                        isSelected && { backgroundColor: isTodayDate ? colors.success : colors.text },
                        !isSelected && isTodayDate && { borderColor: colors.success, borderWidth: 1 },
                        !isAvailable && { backgroundColor: isDarkMode ? colors.danger + "30" : "#f3f4f6" },
                      ]}
                      onPress={() => selectingDate(day)}
                      disabled={isDisabled}
                    >
                      <Text
                        style={[
                          styles.dayText,
                          isSelected && { color: "#fff" },
                          !isSelected && isTodayDate && { color: colors.success, fontWeight: "700" },
                          !isSelected && !isTodayDate && isCurrentMonth && { color: colors.text },
                          !isSelected && !isTodayDate && !isCurrentMonth && { color: colors.subtext },
                          isDisabled && { opacity: 0.3 },
                        ]}
                      >
                        {format(day, "d")}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )
              })}
            </View>
          </View>
        </>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    width: "100%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  monthTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  skeletonTitle: {
    width: 120,
    height: 24,
    borderRadius: 4,
  },
  navigationButtons: {
    flexDirection: "row",
  },
  navButton: {
    width: 35,
    height: 35,
    borderRadius: 17.5,
    justifyContent: "center",
    alignItems: "center",
  },
  calendarContainer: {
    width: "100%",
  },
  weekdayHeader: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 8,
  },
  weekdayText: {
    fontWeight: "bold",
    width: DAY_SIZE,
    textAlign: "center",
  },
  skeletonWeekday: {
    width: 30,
    height: 30,
    borderRadius: 6,
    marginBottom: 8,
  },
  daysGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  dayCell: {
    width: DAY_SIZE,
    height: DAY_SIZE,
    padding: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  dayButton: {
    width: DAY_SIZE - 8,
    height: DAY_SIZE - 8,
    borderRadius: (DAY_SIZE - 8) / 2,
    justifyContent: "center",
    alignItems: "center",
  },
  dayText: {
    textAlign: "center",
    fontSize: 14,
  },
  skeletonDay: {
    width: DAY_SIZE - 8,
    height: DAY_SIZE - 8,
    borderRadius: (DAY_SIZE - 8) / 2,
  },
})

export default Calendar

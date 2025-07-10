"use client"

import React, { useState, useEffect, useCallback } from "react"
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
  Platform,
  ActivityIndicator,
  TextInput,
  Alert,
} from "react-native"
import { Calendar, DateData } from "react-native-calendars"
import { Feather } from "@expo/vector-icons"
import { format, parseISO, addMonths, subMonths, startOfMonth, isValid, getMonth, getYear, getDate } from "date-fns" // Added more date-fns functions

import { useTheme } from "../../Context/ThemeContext"
import { api } from "../../api/axiosInstance" // Assuming api is your configured axios instance
import { useTranslation } from "react-i18next"

const { width, height } = Dimensions.get("window")

// Skeleton Loader for Time Slots
const TimeSkeletonLoader: React.FC = () => {
  const { colors } = useTheme();
  const skeletonCount = 8; // Number of skeleton items to show
  return (
    <View style={styles.timeButtonsContainer}> 
      {Array.from({ length: skeletonCount }).map((_, index) => (
        <View
          key={`skeleton-${index}`}
          style={[
            styles.timeButton, // Reuse timeButton style for consistent sizing
            { 
              backgroundColor: colors.border + '80', // Use a semi-transparent border color or a dedicated skeleton color
              borderColor: colors.border + '40', 
            }
          ]}
        />
      ))}
    </View>
  );
};

// Types based on web component and potential API responses
interface AvailableDateAPIItem {
  day: number // Day of the month
  isAvailable: boolean
}

interface GroupedTimeSlots {
  [category: string]: string[]
}

interface ReservationProcessProps {
  isVisible: boolean
  onClose: () => void
  onComplete: (data: { reserveDate: string; time: string; guests: number }) => void
  maxGuests?: number
  minGuests?: number
  initialData?: {
    reserveDate?: string // YYYY-MM-DD
    time?: string
    guests?: number
  }
}

const ReservationProcess: React.FC<ReservationProcessProps> = ({
  isVisible,
  onClose,
  onComplete,
  maxGuests = 15,
  minGuests = 1,
  initialData,
}) => {
  const { colors, isDarkMode } = useTheme();
  const { t } = useTranslation();

  const [activeTab, setActiveTab] = useState<"date" | "guest" | "time" | "confirm">("date")
  
  // Use string for selectedDate (YYYY-MM-DD)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [selectedGuests, setSelectedGuests] = useState<number | null>(null)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  
  const [currentCalendarMonth, setCurrentCalendarMonth] = useState<string>(
    initialData?.reserveDate && isValid(parseISO(initialData.reserveDate))
      ? format(parseISO(initialData.reserveDate), "yyyy-MM-dd")
      : format(new Date(), "yyyy-MM-dd")
  )
  
  const [markedDates, setMarkedDates] = useState<{[date: string]: any}>({})
  const [availableTimes, setAvailableTimes] = useState<GroupedTimeSlots>({})
  
  const [loadingDates, setLoadingDates] = useState(false)
  const [loadingTimes, setLoadingTimes] = useState(false)
  const [manualGuestInput, setManualGuestInput] = useState<string>("")

  // Initialize state from initialData
  useEffect(() => {
    if (isVisible) {
      if (initialData) {
        if (initialData.reserveDate && isValid(parseISO(initialData.reserveDate))) {
          const initialDateStr = format(parseISO(initialData.reserveDate), "yyyy-MM-dd");
          setSelectedDate(initialDateStr);
          setCurrentCalendarMonth(initialDateStr);
        } else {
          setSelectedDate(null);
          setCurrentCalendarMonth(format(new Date(), "yyyy-MM-dd"));
          setMarkedDates({}); // Clear if initial date is invalid/missing
        }

        if (initialData.guests) {
          setSelectedGuests(initialData.guests);
          setManualGuestInput(String(initialData.guests));
        } else {
          setSelectedGuests(null);
          setManualGuestInput("");
        }

        if (initialData.time) {
          setSelectedTime(initialData.time);
        } else {
          setSelectedTime(null);
        }
        
        // Determine activeTab based on pre-filled data
        setActiveTab("date");

        // Clear fetched data if prerequisites from initialData are missing
        if (!initialData.reserveDate || !initialData.guests) {
            setAvailableTimes({});
        }
        // If reserveDate was not provided or invalid, markedDates is already cleared above.
        // If it was provided, fetchAvailableDates will handle it.

      } else {
        // Reset to default if no initialData
        setSelectedDate(null);
        setSelectedGuests(null);
        setSelectedTime(null);
        setActiveTab("date");
        setCurrentCalendarMonth(format(new Date(), "yyyy-MM-dd"));
        setMarkedDates({}); 
        setAvailableTimes({}); 
        setManualGuestInput("");
      }
    }
    // fetchAvailableDates is handled by its own useEffect based on currentCalendarMonth and isVisible
  }, [initialData, isVisible]); // Re-run if isVisible changes to reset/re-init

  const fetchAvailableDates = useCallback(async (monthToFetch: string) => {
    setLoadingDates(true)
    // Removed client-side 'today' comparison for disabling dates.
    // The Calendar's minDate prop handles disabling dates before today.
    // API response will now solely determine availability for dates it reports on (including today).

    try {
      // API endpoint expects YYYY-MM format for the month
      const monthYear = format(parseISO(monthToFetch), "yyyy-MM")
      const response = await api.get<AvailableDateAPIItem[]>(
        `/api/v1/bo/availability/work-shifts/${monthYear}/`
      )
      console.log("Fetched available dates for month:", monthYear, response.data)
      const newMarkedDates: {[date: string]: any} = {};
      const parsedMonthDate = parseISO(monthToFetch); // Parse once for efficiency
      const year = getYear(parsedMonthDate);
      const month = getMonth(parsedMonthDate) + 1; // date-fns month is 0-indexed
      
      (response.data || []).forEach(item => {
        const dayStr = item.day < 10 ? `0${item.day}` : String(item.day);
        const monthStr = month < 10 ? `0${month}` : String(month);
        const dateString = `${year}-${monthStr}-${dayStr}`;
        //check dateString is before today
        const dateObj = (new Date(dateString))?.getTime();
        const today = (new Date())?.getTime();




        // Availability is determined by the API.
        // The Calendar's minDate prop will prevent selection of dates strictly before today.
        console.log(`Processing date: ${dateString}, isAvailable: ${item.isAvailable}`);
        if (item.isAvailable && dateObj >= today) { // Only mark available dates that are not in the past
          newMarkedDates[dateString] = {
            marked: false, // Dot visibility is typically handled by selection logic or if specifically needed for all available dates
            disabled: false,
            disableTouchEvent: false,
          }
        } else {
          newMarkedDates[dateString] = {
            disabled: true,
            disableTouchEvent: true,
          }
        }
      })
      setMarkedDates(newMarkedDates)
    } catch (error) {
      console.log("Failed to fetch available dates:", error)
      Alert.alert("Error", t("couldNotLoadDates"));
      setMarkedDates({}) // Clear marked dates on error
    } finally {
      setLoadingDates(false)
    }
  }, [])

  useEffect(() => {
    if (isVisible) { // Fetch dates only when modal becomes visible or month changes
      fetchAvailableDates(currentCalendarMonth)
    }
  }, [currentCalendarMonth, fetchAvailableDates, isVisible])


  const fetchAvailableTimes = useCallback(async () => {
    if (!selectedDate || !selectedGuests) {
      setAvailableTimes({})
      return
    }
    setLoadingTimes(true)
    try {
      const response = await api.get<GroupedTimeSlots>(
        "/api/v1/bo/availability/work-shifts/time-slots/",
        {
          params: {
            date: selectedDate, // YYYY-MM-DD
            number_of_guests: selectedGuests,
          },
        }
      )
      console.log("Fetched available times for date:", selectedDate, response.data)
      setAvailableTimes(response.data || {})
    } catch (error) {
      console.log("Failed to fetch available times:", error)
      Alert.alert("Error", t("couldNotLoadTimes"));
      setAvailableTimes({})
    } finally {
      setLoadingTimes(false)
    }
  }, [selectedDate, selectedGuests])

  useEffect(() => {
    if (selectedDate && selectedGuests && activeTab === 'time') {
      // Clear previous times and show loader before fetching new times
      setAvailableTimes({});
      fetchAvailableTimes();
    } else if (activeTab !== 'time' || !selectedDate || !selectedGuests) {
      // Clear times and loading state if not on time tab or prerequisites are missing
      setAvailableTimes({});
      setLoadingTimes(false);
    }
  }, [selectedDate, selectedGuests, activeTab, fetchAvailableTimes]);

  const handleDayPress = (day: DateData) => {
    if (loadingDates) { // Prevent action if dates are currently loading
      return;
    }
    // Check if the date is not disabled in markedDates
    if (markedDates[day.dateString] && markedDates[day.dateString].disabled) {
      return; // Do nothing if the date is disabled
    }
    setSelectedDate(day.dateString)
    setSelectedTime(null) // Reset time when date changes
    setAvailableTimes({})
    setActiveTab("guest")
  }

  const handleGuestSelection = (guests: number) => {
    setSelectedGuests(guests)
    setManualGuestInput(String(guests))
    setLoadingTimes(true) // Reset loading state for times
    setSelectedTime(null) // Reset time
    setAvailableTimes({}) // Clear available times as they depend on guest count
    if (selectedDate) {
      setActiveTab("time")
    } else {
      setActiveTab("date"); // Should not happen if flow is correct
    }
  }

  const handleManualGuestConfirm = () => {
    const numGuests = parseInt(manualGuestInput, 10);
    if (!isNaN(numGuests) && numGuests >= minGuests) {
      handleGuestSelection(numGuests);
    } else {
      Alert.alert("Invalid Input", t("invalidGuestCount", { minGuests, maxGuests }));
    }
  };

  const handleTimeSelection = (time: string) => {
    setSelectedTime(time)
    setActiveTab("confirm")
  }

  const handleConfirmReservation = () => {
    if (selectedDate && selectedTime && selectedGuests) {
      onComplete({
        reserveDate: selectedDate,
        time: selectedTime,
        guests: selectedGuests,
      })
    } else {
      Alert.alert("Incomplete Information", t("completeAllSteps"));
    }
  }

  const calendarTheme = {
    backgroundColor: colors.card,
    calendarBackground: colors.card,
    textSectionTitleColor: colors.subtext,
    selectedDayBackgroundColor: colors.primary,
    selectedDayTextColor: isDarkMode ? colors.text : "#ffffff",
    todayTextColor: colors.primary,
    dayTextColor: colors.text,
    textDisabledColor: colors.text + '4D', // Adjusted: Use main text color with 30% opacity
    dotColor: colors.primary,
    selectedDotColor: isDarkMode ? colors.text : "#ffffff",
    arrowColor: colors.primary,
    disabledArrowColor: colors.subtext + "80", // This is for month arrows, might need similar review if colors.subtext has alpha
    monthTextColor: colors.text,
    indicatorColor: colors.primary,
    textDayFontWeight: '400' as const, // Use 'as const' for literal type
    textMonthFontWeight: 'bold' as const, // Use 'as const'
    textDayHeaderFontWeight: '300' as const, // Use 'as const'
    textDayFontSize: 15,
    textMonthFontSize: 18,
    textDayHeaderFontSize: 13,
    agendaDayTextColor: colors.primary,
    agendaDayNumColor: colors.primary,
    agendaTodayColor: colors.primary,
    agendaKnobColor: colors.primary,
  }

  const renderDateTab = () => (
    <View style={styles.tabContent}>
      {/* {loadingDates && <ActivityIndicator size="large" color={colors.primary} style={{marginVertical: 20}}/>} */}
      <Calendar
          current={currentCalendarMonth}
          onDayPress={handleDayPress}
          displayLoadingIndicator={loadingDates}
          markedDates={{
            ...markedDates,
            ...(selectedDate && {
              [selectedDate]: {
                ...(markedDates[selectedDate] || {}), // Preserve other properties like 'disabled'
                selected: true,
                selectedColor: colors.primary,
                marked: true, // Ensure selected date has a dot
                dotColor: markedDates[selectedDate]?.disabled ? undefined : (isDarkMode ? colors.text : "#ffffff"), // Dot color for selected
              },
            }),
          }}
          onMonthChange={(date) => {
            setLoadingDates(true);
            setCurrentCalendarMonth(date.dateString); // This will trigger fetchAvailableDates via useEffect
          }}
          monthFormat={"MMMM yyyy"}
          theme={calendarTheme}
          minDate={format(new Date(), "yyyy-MM-dd")} // Optional: prevent past dates
          // firstDay={1} // Monday as first day of week
          hideExtraDays={true}
        />
    </View>
  )

  const renderGuestTab = () => {
    const guestOptions = [1, 2, 3, 4, 5, 6].filter(g => g >= minGuests && g <= maxGuests);
    // Add more if maxGuests is higher, or rely on manual input
    if (maxGuests > 6 && !guestOptions.includes(maxGuests)) {
        // A simple way to add a few more common options up to maxGuests or a limit
        for (let i = 7; i <= Math.min(maxGuests, 10); i++) {
            if (!guestOptions.includes(i)) guestOptions.push(i);
        }
    }


    return (
      <View style={styles.tabContent}>
        <View style={styles.guestButtonsContainer}>
          {guestOptions.map((num) => (
            <TouchableOpacity
              key={num}
              style={[
                styles.guestButton,
                { 
                  backgroundColor: selectedGuests === num ? colors.primary : colors.card,
                  borderColor: selectedGuests === num ? colors.primary : colors.border,
                },
              ]}
              onPress={() => handleGuestSelection(num)}
            >
              <Text style={[styles.guestButtonText, { color: selectedGuests === num ? (isDarkMode ? colors.text : "#FFF") : colors.text }]}>
                {num}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={[styles.orText, { color: colors.subtext }]}>{t("orEnterManually")}</Text>
        <View style={styles.manualGuestContainer}>
          <TextInput
            style={[styles.guestInput, { color: colors.text, borderColor: colors.border, backgroundColor: isDarkMode ? colors.background : '#fff' }]}
            keyboardType="number-pad"
            value={manualGuestInput}
            onChangeText={setManualGuestInput}
            placeholder={t('numberOfGuests')}
            placeholderTextColor={colors.subtext}
          />
          <TouchableOpacity
            style={[styles.confirmGuestButton, { backgroundColor: colors.primary }]}
            onPress={handleManualGuestConfirm}
          >
            <Text style={[styles.confirmGuestButtonText, {color: isDarkMode ? colors.text : "#FFF"}]}>{t("set")}</Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  const renderTimeTab = () => (
    <View style={styles.tabContent}>
      {loadingTimes && <TimeSkeletonLoader />} 
      {!loadingTimes && Object.keys(availableTimes).length === 0 && (
        <View style={styles.emptyStateContainer}>
          <Feather name="clock" size={48} color={colors.subtext} />
          <Text style={[styles.emptyStateText, { color: colors.subtext }]}>
            {t('noTimeSlots')}
          </Text>
        </View>
      )}
      {!loadingTimes && Object.keys(availableTimes).length > 0 && (
        <ScrollView style={styles.timeSlotScrollView}>
          {Object.entries(availableTimes).map(([category, times]) => (
            <View key={category} style={styles.timeCategory}>
              <Text style={[styles.categoryTitle, { color: colors.text, borderBottomColor: colors.border }]}>
                {category.charAt(0).toUpperCase() + category.slice(1)} {/* Capitalize category */}
              </Text>
              <View style={styles.timeButtonsContainer}>
                {times.map((time) => (
                  <TouchableOpacity
                    key={time}
                    style={[
                      styles.timeButton,
                      {
                        backgroundColor: selectedTime === time ? colors.primary : colors.card,
                        borderColor: selectedTime === time ? colors.primary : colors.border,
                      },
                    ]}
                    onPress={() => handleTimeSelection(time)}
                  >
                    <Text style={[styles.timeButtonText, { color: selectedTime === time ? (isDarkMode ? colors.text : "#FFF") : colors.text }]}>
                      {time}
                    </Text>
                  </TouchableOpacity>
                ))}
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
        {t('confirmReservation')}
      </Text>
      {selectedDate && selectedGuests && selectedTime ? (
        <>
          <Text style={[styles.confirmDetail, { color: colors.subtext }]}>
            {t('date')}: <Text style={{ fontWeight: "bold", color: colors.text }}>{format(parseISO(selectedDate), "EEEE, MMMM dd, yyyy")}</Text>
          </Text>
          <Text style={[styles.confirmDetail, { color: colors.subtext }]}>
            {t('guests')}: <Text style={{ fontWeight: "bold", color: colors.text }}>{selectedGuests}</Text>
          </Text>
          <Text style={[styles.confirmDetail, { color: colors.subtext }]}>
            {t('time')}: <Text style={{ fontWeight: "bold", color: colors.text }}>{selectedTime}</Text>
          </Text>
          <View style={styles.confirmButtonContainer}>
            <TouchableOpacity
              style={[styles.confirmButton, { backgroundColor: colors.primary }]}
              onPress={handleConfirmReservation}
            >
              <Text style={[styles.confirmButtonText, {color: isDarkMode ? colors.text : "#FFF"}]}>{t("confirmAndBook")}</Text>
            </TouchableOpacity>
          </View>
        </>
      ) : (
        <Text style={[styles.emptyStateText, { color: colors.subtext }]}>
          {t('pleaseCompletePreviousSteps')}
        </Text>
      )}
    </View>
  )
  
  // Header for the modal
  const renderModalHeader = () => (
    <View style={[styles.header, { borderBottomColor: colors.border }]}>
      <Text style={[styles.headerTitle, { color: colors.text }]}>
        {activeTab === 'date' && t('chooseDate')}
        {activeTab === 'guest' && t('selectGuests')}
        {activeTab === 'time' && t('pickTime')}
        {activeTab === 'confirm' && t('confirmBooking')}
      </Text>
      <TouchableOpacity onPress={onClose} style={styles.closeButton}>
        <Feather name="x" size={24} color={colors.text} />
      </TouchableOpacity>
    </View>
  );

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
          {renderModalHeader()}
          {/* Tabs */}
          <View style={styles.tabsContainer}>
            {/* Date Tab */}
            <TouchableOpacity
              style={[styles.tab, activeTab === "date" && styles.activeTab, { borderBottomColor: colors.primary }]}
              onPress={() => setActiveTab("date")}
            >
              <Text style={[styles.tabText, { color: activeTab === "date" ? colors.primary : colors.subtext }]}>
                {t('date')}
              </Text>
            </TouchableOpacity>

            {/* Guest Tab */}
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
              <Text style={[styles.tabText, { color: !selectedDate ? colors.subtext + "80" : activeTab === "guest" ? colors.primary : colors.subtext }]}>
                {t('guest')}
              </Text>
            </TouchableOpacity>

            {/* Time Tab */}
            <TouchableOpacity
              style={[
                styles.tab,
                activeTab === "time" && styles.activeTab,
                { borderBottomColor: colors.primary },
                !(selectedDate && selectedGuests) && styles.disabledTab,
              ]}
              onPress={() => {if(selectedDate && selectedGuests){
                setLoadingTimes(true)
                setActiveTab("time")
              }}}
              disabled={!(selectedDate && selectedGuests)}
            >
              <Text style={[styles.tabText, { color: !(selectedDate && selectedGuests) ? colors.subtext + "80" : activeTab === "time" ? colors.primary : colors.subtext }]}>
                {t('time')}
              </Text>
            </TouchableOpacity>
            
            {/* Confirm Tab */}
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
              <Text style={[styles.tabText, { color: !(selectedDate && selectedGuests && selectedTime) ? colors.subtext + "80" : activeTab === "confirm" ? colors.primary : colors.subtext }]}>
                {t('confirm')}
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
    justifyContent: "flex-end", // Slide from bottom
    alignItems: "center", // Centered modal horizontally
  },
  modalContainer: {
    width: width, // Full width for bottom sheet style
    flex: 1, // Added: Allow modalContainer to grow and establish height for ScrollView
    maxHeight: height * 0.85, // Max 85% of screen height
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: "hidden",
    elevation: 5,
    // backgroundColor: defined by theme
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    // borderBottomColor: defined by theme
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  closeButton: {
    padding: 8, // Increase touch area
  },
  tabsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 8, // Reduced padding
    borderBottomWidth: StyleSheet.hairlineWidth,
    // borderBottomColor: defined by theme in modalContainer or header
  },
  tab: {
    paddingVertical: 10, // Increased touch area
    paddingHorizontal: 12,
    alignItems: 'center',
    flex: 1, // Distribute space
  },
  activeTab: {
    borderBottomWidth: 2,
    // borderBottomColor: defined by theme (colors.primary)
  },
  disabledTab: {
    opacity: 0.5,
  },
  tabText: {
    fontSize: 15, // Slightly smaller
    fontWeight: "500",
    textAlign: 'center',
  },
  contentContainer: {
    flex: 1, // Ensure content can scroll if it overflows
  },
  tabContent: {
    padding: 16,
  },
  tabTitle: {
    fontSize: 20, // Larger title for sections
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: 'center',
  },
  // Guest Tab Styles
  guestButtonsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    marginBottom: 16,
  },
  guestButton: {
    width: width * 0.2, // Responsive width
    height: width * 0.2, // Responsive height
    maxWidth: 70, // Max size
    maxHeight: 70,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
    margin: 8,
  },
  guestButtonText: {
    fontSize: 18,
    fontWeight: "600",
  },
  orText: {
    textAlign: "center",
    marginVertical: 12,
    fontSize: 14,
  },
  manualGuestContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    paddingHorizontal: 16, // Add some padding
  },
  guestInput: {
    flex: 1,
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginRight: 10,
    fontSize: 16,
  },
  confirmGuestButton: {
    paddingHorizontal: 20,
    height: 50,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  confirmGuestButtonText: {
    // color: "white", // Handled by theme
    fontWeight: "600",
    fontSize: 16,
  },
  // Time Tab Styles
  loadingContainer: { // Generic loading container
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  emptyStateContainer: {
    flex: 1, // Allow it to grow if tabContent has fixed height or also flex
    alignItems: 'center', // Keep content centered horizontally
    justifyContent: 'center', // Added to center content vertically
    padding: 20,
    minHeight: 120, // Added to reduce layout shift, adjust as needed
  },
  emptyStateText: {
    marginTop: 12, // Reduced margin
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
  },
  timeSlotScrollView: {
    maxHeight: height * 0.6, // Limit height of time slots
    flex: 1, // If the content area should expand
  },
  timeCategory: {
    marginBottom: 16,
  },
  categoryTitle: {
    fontSize: 17, // Slightly larger category title
    fontWeight: "600",
    marginBottom: 10,
    paddingBottom: 6,
    borderBottomWidth: 1,
  },
  timeButtonsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center", // Added to center time slot buttons
    paddingVertical: 10, // Assuming some padding might exist or be beneficial
  },
  timeButton: {
    // width: width * 0.25, // Adjust width for 3-4 per row
    minWidth: 75, // Min width for readability
    height: 60, // Slightly shorter
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
    margin: 6, // Adjust margin
    paddingHorizontal: 5, // Padding for text inside
  },
  timeButtonText: {
    fontSize: 15,
    fontWeight: "600",
  },
  // Confirm Tab Styles
  confirmTitle: {
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 24,
  },
  confirmDetail: {
    fontSize: 16,
    marginBottom: 12,
    lineHeight: 24,
  },
  confirmButtonContainer: {
    alignItems: "center",
    marginTop: 24, // Add margin top
    paddingVertical: 16,
  },
  confirmButton: {
    paddingVertical: 14, // Larger button
    paddingHorizontal: 40,
    borderRadius: 8,
    minWidth: width * 0.6, // Responsive width
    alignItems: 'center',
  },
  confirmButtonText: {
    // color: "white", // Handled by theme
    fontSize: 17,
    fontWeight: "600",
  },
});

export default ReservationProcess;

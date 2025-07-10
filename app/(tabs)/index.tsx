"use client"

import { useLocalSearchParams, useRouter } from 'expo-router';
import { api } from '../../api/axiosInstance'; // Assuming api is your configured axios instance
import { Alert } from 'react-native';
import axios from 'axios';
import { useEffect, useState, useCallback } from "react" // Added useCallback
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Modal,
  ScrollView,
  SafeAreaView,
  Alert as RNAlert,
  Button,
} from "react-native"
import { format } from "date-fns"
import { Feather } from "@expo/vector-icons"
import { useTheme } from "../../Context/ThemeContext"
import SearchBar from "../../components/reservation/SearchBar"
import IntervalCalendar from "../../components/reservation/IntervalCalendar"
import ReservationCard from "../../components/reservation/ReservationCard"
import Pagination from "../../components/reservation/Pagination"
import EditReservationModal from "../../components/reservation/EditReservationModal"
import ActionConfirmation from "../../components/reservation/ActionConfirmation"
import ColumnCustomizationModal from "../../components/reservation/ColumnCustomizationModal"
import AddReservationModal from "@/components/reservation/AddReservationModal"
import { ErrorBoundaryProps } from "expo-router"
import { useSelectedDate } from '@/Context/SelectedDateContext';
import messaging from '@react-native-firebase/messaging'; // Import messaging
import { useNotifications } from '@/Context/NotificationContext';
import { useTranslation } from 'react-i18next';

// Types and Interfaces
export interface ReceivedTables {
  floor_name?: string
  id: number
  name: string
}

export interface Reservation {
  id: string
  customer?: string
  email: string
  full_name: string
  date: string
  time: string
  internal_note?: string
  source?: string
  number_of_guests: string
  cancellation_note?: string
  cancellation_reason?: { id: number; name: string }
  tableSet?: number
  phone: string
  tables?: ReceivedTables[]
  status: string
  commenter?: string
  review?: boolean
  allergies?: string
  occasion?: number | { id: number; name: string } | null
  guests?: number
  floor_name?: string
  table_name?: string
  loading?: boolean
  seq_id?: string
  selected?: boolean
  tags?: string[]
  created_at?: string
}

interface DataTypes {
  reserveDate: string
  time: string
  guests: number
}

// Column Configuration Interface
interface ColumnConfig {
  id: string
  labelKey: string
  visible: boolean
  order: number
}

// Hook for managing column configuration
const useColumnConfiguration = () => {
  // Default column configuration
  const defaultColumns: ColumnConfig[] = [
    { id: "client", labelKey: "Client", visible: true, order: 0 },
    { id: "date", labelKey: "Date", visible: true, order: 1 },
    { id: "time", labelKey: "Time", visible: true, order: 2 },
    { id: "guests", labelKey: "Guests", visible: true, order: 3 },
    { id: "tables", labelKey: "Tables", visible: true, order: 4 },
    { id: "internalNote", labelKey: "Internal Note", visible: true, order: 5 },
    { id: "status", labelKey: "Status", visible: true, order: 6 },
    { id: "occasion", labelKey: "Occasion", visible: false, order: 7 },
    { id: "details", labelKey: "Details", visible: false, order: 8 },
    { id: "review", labelKey: "Review", visible: false, order: 9 },
  ]

  const loadColumnsFromStorage = async (): Promise<ColumnConfig[]> => {
    try {
      // In a real app, you would use AsyncStorage here
      // const stored = await AsyncStorage.getItem('reservation_columns');
      // if (stored) {
      //   return JSON.parse(stored);
      // }
      return defaultColumns
    } catch (error) {
      console.error("Error loading column configuration from storage:", error)
      return defaultColumns
    }
  }

  const saveColumnsToStorage = async (columns: ColumnConfig[]) => {
    try {
      // In a real app, you would use AsyncStorage here
      // await AsyncStorage.setItem('reservation_columns', JSON.stringify(columns));
    } catch (error) {
      console.error("Error saving column configuration to storage:", error)
    }
  }

  return {
    defaultColumns,
    loadColumnsFromStorage,
    saveColumnsToStorage,
  }
}

// Helper functions
const statusStyle = (status: string) => {
  switch (status) {
    case "PENDING":
      return { backgroundColor: "#E6F0FF", color: "#0066FF" }
    case "APPROVED":
      return { backgroundColor: "#E6F9F1", color: "#00B368" }
    case "SEATED":
      return { backgroundColor: "#FFF4E6", color: "#FF9500" }
    case "FULFILLED":
      return { backgroundColor: "#F2E6FF", color: "#9966FF" }
    case "NO_SHOW":
      return { backgroundColor: "#FFE6F0", color: "#FF3377" }
    default: // CANCELED
      return { backgroundColor: "#FFE6E6", color: "#FF3333" }
  }
}

// Get status label
const getStatusLabel = (status: string, t: (key: string) => string): string => {
  switch (status) {
    case "APPROVED":
      return t("confirmed")
    case "PENDING":
      return t("pending")
    case "SEATED":
      return t("seated")
    case "FULFILLED":
      return t("fulfilled")
    case "NO_SHOW":
      return t("noShow")
    case "CANCELED":
      return t("cancelled")
    default:
      return status
  }
}

export function ErrorBoundary(props: ErrorBoundaryProps) {
  const { t } = useTranslation();
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>{t('somethingWentWrongWithNotifications')}</Text>
      <Text>{props.error.message}</Text>
      <Button onPress={props.retry} title={t('tryAgain')} />
    </View>
  );
}

// Helper function to check if notification matches current filters
// (This function is defined but its return value is not currently used to gate refreshes)
const checkIfNotificationMatchesFilters = (
  notificationData: { reservation_date?: string; reservation_status?: string; type?: string; [key: string]: any },
  currentFilters: {
    focusedFilter: string;
    selectedDateRange: { start: Date | null; end: Date | null };
    filterDate: boolean;
    contextSelectedDate: string | null; // Assumed to be YYYY-MM-DD
    searchKeyWord: string;
  },
  isNewReservation: boolean // Explicitly pass if the notification is for a new reservation
): boolean => {
  const { reservation_date, reservation_status } = notificationData;
  const { focusedFilter: currentStatusFilter, selectedDateRange, filterDate: isDateFilterActive, contextSelectedDate: currentContextDate, searchKeyWord: currentSearchKeyword } = currentFilters;

  console.log("[FilterCheck] Notification Data:", notificationData);
  console.log("[FilterCheck] Current Filters:", currentFilters);
  console.log("[FilterCheck] Is New Reservation:", isNewReservation);


  // 1. Status Filter
  if (currentStatusFilter && reservation_status !== currentStatusFilter) {
    console.log("[FilterCheck] Failed: Status mismatch");
    return false;
  }

  // 2. Date Filter
  // Only apply date filtering if filterDate is true AND the notification has a date.
  if (isDateFilterActive && reservation_date) {
    const notifDateOnly = reservation_date; // Already YYYY-MM-DD

    if (selectedDateRange.start && selectedDateRange.end) {
      const rangeStartDateOnly = format(selectedDateRange.start, "yyyy-MM-dd");
      const rangeEndDateOnly = format(selectedDateRange.end, "yyyy-MM-dd");
      if (notifDateOnly < rangeStartDateOnly || notifDateOnly > rangeEndDateOnly) {
        console.log("[FilterCheck] Failed: Outside selected date range");
        return false;
      }
    } else if (selectedDateRange.start) { // Single day selected via range picker
      const selectedDayOnly = format(selectedDateRange.start, "yyyy-MM-dd");
      if (notifDateOnly !== selectedDayOnly) {
        console.log("[FilterCheck] Failed: Not the selected day (from range picker)");
        return false;
      }
    } else if (currentContextDate) { // Date from context (e.g., calendar day click)
       if (notifDateOnly !== currentContextDate) {
         console.log("[FilterCheck] Failed: Not the context selected day", {notifDateOnly, currentContextDate});
        return false;
      }
    } else { // Default to today if filterDate is true but no specific date/range selected
      const todayDateOnly = format(new Date(), "yyyy-MM-dd");
      if (notifDateOnly !== todayDateOnly) {
        console.log("[FilterCheck] Failed: Not today (default date filter)");
        return false;
      }
    }
  } else if (isDateFilterActive && !reservation_date) {
    // Date filter is on, but notification has no date. Consider this a mismatch.
    console.log("[FilterCheck] Failed: Date filter active, but notification has no date");
    return false;
  }

  // 3. Search Filter
  // If a search keyword is active, we generally don't auto-refresh for updates,
  // as it's hard to tell if the updated item still matches the search.
  // However, if it's a NEW reservation, it should appear if other filters match,
  // as it wouldn't have been part of the original search.
  if (currentSearchKeyword && !isNewReservation) {
    console.log("[FilterCheck] Skipped: Search filter active and not a new reservation.");
    return false;
  }
  
  console.log("[FilterCheck] Passed all checks.");
  return true;
};


// Main ReservationsScreen Component
const ReservationsScreen = () => {
  const { isDarkMode, colors } = useTheme()
  const router = useRouter();
  const params = useLocalSearchParams<{ reservation_id?: string }>();
  const { selectedDate: contextSelectedDate } = useSelectedDate();
  const styles = getStyles(colors); // Ensure styles are generated with current colors
  const { t } = useTranslation();


  // Column configuration
  const { loadColumnsFromStorage, saveColumnsToStorage } = useColumnConfiguration()
  const [columns, setColumns] = useState<ColumnConfig[]>([])
  const [showColumnCustomization, setShowColumnCustomization] = useState<boolean>(false)

  // States
  const [showProcess, setShowProcess] = useState<boolean>(false)
  const [selectedDateRange, setSelectedDateRange] = useState<{ start: Date | null; end: Date | null }>({
    start: null,
    end: null,
  })
  const [focusedFilter, setFocusedFilter] = useState<string>("")
  const [searchKeyWord, setSearchKeyWord] = useState<string>("")
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [count, setCount] = useState<number>(0)
  const [page, setPage] = useState<number>(1) // Current page number
  const [tables, setTables] = useState<any[]>([])
  const [floors, setFloors] = useState<any[]>([])
  const [selectedClient, setSelectedClient] = useState<Reservation | null>(null)
  const [hasTable, setHasTable] = useState<boolean>(false)
  const [selectingDay, setSelectingDay] = useState<string>("")
  const [focusedDate, setFocusedDate] = useState<boolean>(false)
  // searchResults and searched state might be part of an unused client-side search. FlatList uses filteredReservations.
  const [searchResults, setSearchResults] = useState<Reservation[]>(reservations)
  const [searched, setSearched] = useState<boolean>(false)
  const [showModal, setShowModal] = useState<boolean>(false)
  const [editingClient, setEditingClient] = useState<string | undefined>(undefined)
  const [toBeReviewedRes, setToBeReviewedRes] = useState<string>()
  const [showStatus, setShowStatus] = useState<boolean>(false)
  const [idStatusModification, setIdStatusModification] = useState<string>("")
  const [filteredReservations, setFilteredReservations] = useState<Reservation[]>(reservations)
  const [showAddReservation, setShowAddReservation] = useState<boolean>(false)
  const [showStatusConfirm, setShowStatusConfirm] = useState<boolean>(false)
  const [pendingStatus, setPendingStatus] = useState<string>("")
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false)
  const [reservationToDelete, setReservationToDelete] = useState<string>("")
  // isLoading is deprecated in favor of isLoadingData, isLoadingMore, isRefreshing
  // const [isLoading, setIsLoading] = useState<boolean>(true) 
  const [filterDate, setFilterDate] = useState<boolean>(true)
  const [showFilterModal, setShowFilterModal] = useState<boolean>(false)
  
  const [isLoadingData, setIsLoadingData] = useState<boolean>(true); // For initial load / full page reloads
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false); // For loading more items
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false); // For pull-to-refresh

  const [isLoadingReservationForModal, setIsLoadingReservationForModal] = useState<boolean>(false); 
  const [reservationIdBeingProcessed, setReservationIdBeingProcessed] = useState<string | null>(null); 


  // Reservation progress data
  const [reservationProgressData, setReservationProgressData] = useState<DataTypes>({
    reserveDate: selectedClient?.date || "",
    time: selectedClient?.time || "",
    guests: selectedClient?.guests || 0,
  })

  // Load columns on mount
  useEffect(() => {
    const loadColumns = async () => {
      const loadedColumns = await loadColumnsFromStorage()
      setColumns(loadedColumns)
    }
    loadColumns()
  }, [])

  // Save column preferences when they change
  useEffect(() => {
    saveColumnsToStorage(columns)
  }, [columns, saveColumnsToStorage]) // Added saveColumnsToStorage to dependencies

  
  // API call to fetch reservations
  const fetchReservations = useCallback(async (targetPage: number, showInitialLoader = true) => {
    console.log(`[ReservationsScreen] Fetching reservations for page ${targetPage} with filters:`)
    setIsLoadingData(true);
    if (targetPage > 1) {
      setIsLoadingMore(true);
    } else { // This implies targetPage is 1 and showInitialLoader is false (pull-to-refresh)
      setIsRefreshing(true);
    }

    try {
      const queryParams = new URLSearchParams();
      queryParams.append('page', targetPage.toString());
      queryParams.append('page_size', '10');
      if (focusedFilter) {
        queryParams.append('status', focusedFilter);
      }

      if (selectedDateRange.start) {
        queryParams.append('date__gte', format(selectedDateRange.start, 'yyyy-MM-dd'));
      }
      if (selectedDateRange.end) {
        queryParams.append('date__lte', format(selectedDateRange.end, 'yyyy-MM-dd'));
      } else if (filterDate && !selectedDateRange.start && contextSelectedDate) {
        const dateToUse = format(new Date(contextSelectedDate), 'yyyy-MM-dd');
        queryParams.append('date__gte', dateToUse);
        queryParams.append('date__lte', dateToUse);
      } else if (filterDate && !selectedDateRange.start && !contextSelectedDate) {
        const today = new Date();
        queryParams.append('date__gte', format(today, 'yyyy-MM-dd'));
        queryParams.append('date__lte', format(today, 'yyyy-MM-dd'));
      }

      if (searchKeyWord) {
        queryParams.append('search', searchKeyWord);
      }
      queryParams.append('ordering', '-id'); 
      
      const response = await api.get(`/api/v1/bo/reservations/?${queryParams.toString()}`);
      const newReservations = response.data.results || [];
      const newCount = response.data.count || 0;

      if (targetPage > 1) {
        setReservations(prev => [...prev, ...newReservations]);
        setFilteredReservations(prev => [...prev, ...newReservations]); // Assuming backend filters apply to paginated results
      } else {
        setReservations(newReservations);
        setFilteredReservations(newReservations);
      }
      setCount(newCount);
      setPage(targetPage); // Update current page to the one successfully fetched

    } catch (error) {
      console.error("Error fetching reservations:", error);
      if (targetPage === 1) { // Only reset if initial load or refresh of page 1 fails
        setReservations([]);
        setFilteredReservations([]);
        setCount(0);
      }
      // Optionally, show an alert or toast message to the user
    } finally {
      setIsLoadingData(false);
      setIsLoadingMore(false);
      setIsRefreshing(false);
    }
  }, [
    focusedFilter, 
    selectedDateRange, 
    searchKeyWord, 
    filterDate, 
    contextSelectedDate, 
    setIsLoadingData, 
    setReservations, 
    setFilteredReservations, 
    setCount, 
    setPage, 
    setIsLoadingMore, 
    setIsRefreshing
  ]);
  
  // Fetch reservations on initial load and when primary filters change
  useEffect(() => {
    fetchReservations(1, true); // Always fetch page 1 with initial loader for these changes
  }, [focusedFilter, selectedDateRange, searchKeyWord, filterDate, contextSelectedDate, fetchReservations]); 

  const { onForegroundMessage } = useNotifications();

  // Handle foreground FCM messages
  useEffect(() => {
    const unsubscribe = onForegroundMessage((remoteMessage) => {
      if (isLoadingReservationForModal || isLoadingData || isLoadingMore || isRefreshing) {
        console.log('[ReservationsScreen] Skipping foreground refresh: a loading operation is already in progress.');
        return;
      }

      const notificationData = remoteMessage.data || {};
      fetchReservations(1, false); // Refresh page 1, don't show main loader
    });
    
    return unsubscribe;
  }, [
    onForegroundMessage, 
    isLoadingReservationForModal, 
    isLoadingData, 
    isLoadingMore,
    isRefreshing,
    // focusedFilter, // These are dependencies of fetchReservations, no need to list them here if fetchReservations is stable
    // selectedDateRange, 
    // filterDate,
    // contextSelectedDate,
    // searchKeyWord,
    fetchReservations // fetchReservations callback itself is a dependency
  ]);

  // Effect to handle reservation_id from route params for deep linking
  useEffect(() => {
    const reservationIdFromParam = params.reservation_id;
    // console.log(`[ReservationsScreen] useEffect for reservation_id. Param: ${reservationIdFromParam}, Current Processed ID: ${reservationIdBeingProcessed}, Modal Loading: ${isLoadingReservationForModal}, Modal Shown: ${showModal}`);

    if (reservationIdFromParam) {
      if (reservationIdFromParam !== reservationIdBeingProcessed) {
        // console.log(`[ReservationsScreen] New or re-processing ID: ${reservationIdFromParam}. Initiating fetch.`);
        
        if (showModal && editingClient !== reservationIdFromParam) {
            setShowModal(false);
            setSelectedClient(null);
            setEditingClient(undefined);
        }
        
        const fetchAndShowReservation = async (id: string) => {
          // console.log(`[ReservationsScreen] fetchAndShowReservation: Setting isLoadingReservationForModal = true for ID: ${id}`);
          setIsLoadingReservationForModal(true);
          setReservationIdBeingProcessed(id);

          try {
            const response = await api.get<Reservation>(`/api/v1/bo/reservations/${id}/`);
            const reservationData = response.data;
            if (reservationData) {
              // console.log(`[ReservationsScreen] Successfully fetched reservation ${id}. Preparing to show modal.`);
              setSelectedClient(reservationData);
              setReservationProgressData({
                reserveDate: reservationData.date,
                time: reservationData.time.slice(0, 5), // HH:mm
                guests: parseInt(reservationData.number_of_guests, 10) || 0,
              });
              setEditingClient(reservationData.id);
              
              // console.log(`[ReservationsScreen] Setting isLoadingReservationForModal = false, then setShowModal = true for ${id}`);
              setIsLoadingReservationForModal(false);
              setShowModal(true);
            } else {
              // console.warn(`[ReservationsScreen] Reservation with ID ${id} not found by API.`);
              Alert.alert(t("notFound"), t("reservationNotFound", { id }));
              setIsLoadingReservationForModal(false);
              setReservationIdBeingProcessed(null); 
            }
          } catch (error) {
            // console.error(`[ReservationsScreen] Error fetching reservation ${id}:`, error);
            Alert.alert(t("error"), t("couldNotLoadReservation", { id }));
            setIsLoadingReservationForModal(false);
            setReservationIdBeingProcessed(null);
          }
        };
        
        fetchAndShowReservation(reservationIdFromParam);

      } else {
        // console.log(`[ReservationsScreen] Param ${reservationIdFromParam} is the same as reservationIdBeingProcessed. Modal loading: ${isLoadingReservationForModal}, Modal shown: ${showModal}. No new action unless state is inconsistent.`);
        if (!isLoadingReservationForModal && !showModal && reservationIdBeingProcessed) {
            // console.warn(`[ReservationsScreen] Inconsistent state for ${reservationIdBeingProcessed}. Consider re-initiating fetch or clearing state.`);
        }
      }
    } else {
      if (reservationIdBeingProcessed) {
        // console.log(`[ReservationsScreen] reservation_id param is now undefined. Clearing reservationIdBeingProcessed: ${reservationIdBeingProcessed}`);
        setReservationIdBeingProcessed(null);
        if (showModal && editingClient === reservationIdBeingProcessed) {
            setShowModal(false);
            setSelectedClient(null);
            setEditingClient(undefined);
        }
      }
    }
  }, [params.reservation_id, reservationIdBeingProcessed, router, showModal, editingClient]); // Added showModal and editingClient


  // This useEffect for searchResults and searched state might be part of an unused client-side search feature.
  // FlatList directly uses `filteredReservations`. If this is unused, consider removing.
  useEffect(() => {
    if (!searched) {
      setSearchResults(reservations)
    }
  }, [reservations, searched])

  // Effect to update date range display string
  useEffect(() => {
    if (selectedDateRange.start && selectedDateRange.end) {
      const formattedStart = format(selectedDateRange.start, "dd/MM/yyyy")
      const formattedEnd = format(selectedDateRange.end, "dd/MM/yyyy")
      setSelectingDay(`${formattedStart} - ${formattedEnd}`)
    } else if (selectedDateRange.start) {
      setSelectingDay(format(selectedDateRange.start, "dd/MM/yyyy"))
    } else if (contextSelectedDate && filterDate) { // Initialize selectingDay from context if filterDate is true
        setSelectingDay(format(new Date(contextSelectedDate), "dd/MM/yyyy"));
    }
     else {
      setSelectingDay("")

    }
  }, [selectedDateRange, contextSelectedDate, filterDate])

  // Effect to update reservation progress data when selectedClient changes
  useEffect(() => {
    if (selectedClient) {
      setReservationProgressData({
        reserveDate: selectedClient.date,
        time: selectedClient.time.slice(0, 5),
        guests: Number.parseInt(selectedClient.number_of_guests),
      })
    }
  }, [selectedClient])

  // Handle column preferences update
  const handleSaveColumns = (updatedColumns: ColumnConfig[]) => {
    setColumns(updatedColumns)
  }

  const handleAddReservationSubmit = async (formDataFromModal: Partial<Reservation>) => {
    try {
      // Construct the payload for the API
      const payload: any = { // Use 'any' for flexibility or define a more specific create type
        full_name: formDataFromModal.full_name || "",
        email: formDataFromModal.email || "",
        phone: formDataFromModal.phone || "",
        date: formDataFromModal.date, // Ensure format is yyyy-MM-dd, AddReservationModal should handle this
        time: formDataFromModal.time, // Ensure format is HH:mm or HH:mm:ss
        number_of_guests: formDataFromModal.number_of_guests || "0",
        status: formDataFromModal.status || "PENDING",
        internal_note: formDataFromModal.internal_note || "",
        source: formDataFromModal.source || "MANUAL_ENTRY", // Default or from form
        allergies: formDataFromModal.allergies || "",
        tables: formDataFromModal.tables, // Pass as is, assuming AddReservationModal provides correct format or it's optional
        // Handle occasion: API might expect just an ID or the full object.
        // This example assumes API might take an ID if occasion is an object with an id.
        occasion: typeof formDataFromModal.occasion === 'object' && formDataFromModal.occasion !== null && 'id' in formDataFromModal.occasion
            ? (formDataFromModal.occasion as { id: number }).id
            : typeof formDataFromModal.occasion === 'number'
            ? formDataFromModal.occasion
            : undefined,
        // Optional fields from Reservation that might be part of formDataFromModal
        cancellation_note: formDataFromModal.cancellation_note,
        cancellation_reason: formDataFromModal.cancellation_reason,
        tableSet: formDataFromModal.tableSet,
        customer: formDataFromModal.customer, // Assuming this is a field in the form
        commenter: formDataFromModal.commenter,
        // Fields like id, loading, seq_id, created_at are typically handled by backend
      };

      // Remove undefined fields from payload to keep it clean
      Object.keys(payload).forEach(key => {
        if (payload[key] === undefined) {
          delete payload[key];
        }
      });

      await api.post('/api/v1/bo/reservations/', payload);

      setShowAddReservation(false);
      fetchReservations(1, true); // Refresh list (page 1) and update count


    } catch (error) {
      console.error("Error creating reservation:", error);
      let errorMessage = t("failedToCreateReservation");
      if (axios.isAxiosError(error) && error.response && error.response.data) {
        errorMessage = `${t("failedToCreateReservation")}: ${JSON.stringify(error.response.data)}`;
      }
      Alert.alert(t("error"), errorMessage);
    }
  };

  // Handler functions
  const handleDateClick = (range: { start: Date; end: Date }): void => {
    setSelectedDateRange(range)
    setFocusedDate(false)
    // fetchReservations(1, true) will be triggered by useEffect watching selectedDateRange
  }

  const setDefaultFilter = (): void => {
    setIsLoadingData(true) // Show loader while resetting filters
    setFocusedFilter("")
    // selectingDay is UI state, reset it.
    setSelectingDay("") 
    // Toggle filterDate, which will trigger useEffect for fetchReservations if it's a dependency.
    // Or, if filterDate directly impacts query, ensure fetch is called.
    setFilterDate(prev => !prev) 
    setSelectedDateRange({ start: null, end: null })
    // fetchReservations(1, true) will be triggered by useEffect watching these filter states
  }

  const searchFilter = (text: string): void => {
    const keyword = text.toLowerCase()
    setSearchKeyWord(keyword)
    // fetchReservations(1, true) will be triggered by useEffect watching searchKeyWord
  }

  const EditClient = (id: string): void => {
    setEditingClient(id)
    if (!id) return
    const client = reservations.find((r) => r.id === id)
    if (client) {
      setSelectedClient(client)
      setShowModal(true)
    }
  }

  const upDateHandler = async (updatedReservation: Reservation) => {
    if (!editingClient) {
      Alert.alert(t("error"), t("noReservationSelectedForUpdate"));
      return;
    }
    // Consider a specific loader for this operation if desired, e.g. setIsLoadingData(true)
    // For now, fetchReservations will handle its own loading indicators.
    try {
      const payload = {
        full_name: updatedReservation.full_name,
        email: updatedReservation.email,
        phone: updatedReservation.phone,
        // table_name: updatedReservation.table_name, // If applicable
        source: updatedReservation.source,
        status: updatedReservation.status,
        internal_note: updatedReservation.internal_note,
        occasion: typeof updatedReservation.occasion === 'object' && updatedReservation.occasion !== null 
                    ? (updatedReservation.occasion as { id: number }).id 
                    : updatedReservation.occasion,
        date: reservationProgressData.reserveDate, // From reservationProgressData
        time: `${reservationProgressData.time}:00`, // From reservationProgressData, ensure HH:mm:ss
        tables: updatedReservation.tables?.map(table => table.id), // Array of table IDs
        number_of_guests: reservationProgressData.guests, // From reservationProgressData
        commenter: updatedReservation.commenter,
        allergies: updatedReservation.allergies,
        // Add any other fields that can be updated
      };

      // Remove undefined fields from payload
      Object.keys(payload).forEach(key => {
        if ((payload as any)[key] === undefined) {
          delete (payload as any)[key];
        }
      });

      await api.put(`/api/v1/bo/reservations/${editingClient}/`, payload);
      
      setShowModal(false);
      setEditingClient(undefined);
      // Refresh the current page or page 1. Page 1 is safer to reflect changes broadly.
      fetchReservations(1, false); // Refetch page 1 without main loader
    } catch (error) {
      console.error("Error updating reservation:", error);
      let errorMessage = t("failedToUpdateReservation");
      if (axios.isAxiosError(error) && error.response && error.response.data) {
        const errorData = error.response.data;
        const messages = Object.entries(errorData).map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`);
        errorMessage += `\n${messages.join('\n')}`;
      }
      Alert.alert(t("error"), errorMessage);
    } 
    // finally { setIsLoadingData(false); } // Only if a specific loader was set here
  }

  const showStatusModification = (id: string): void => {
    if (!id) return
    setIdStatusModification(id)
    setShowStatus(!showStatus)
  }

  const statusHandler = (status: string): void => {
    setPendingStatus(status)
    setShowStatusConfirm(true)
    setShowStatus(false)
  }

  const confirmStatusUpdate = (): void => {
    // This is a client-side update example. For server changes, call API then refetch.
    // For a real app, this should be an API call.
    // Example: api.patch(`/api/v1/bo/reservations/${idStatusModification}/`, { status: pendingStatus })
    // .then(() => fetchReservations(page, false)) // Refresh current page or page 1
    // .catch(err => console.error(err));

    setReservations(reservations.map((r) => (r.id === idStatusModification ? { ...r, loading: true } : r)))

    setTimeout(() => {
      setReservations(
        reservations.map((r) => (r.id === idStatusModification ? { ...r, status: pendingStatus, loading: false } : r)),
      )
      setFilteredReservations( // Also update filteredReservations if it's derived or separate
        filteredReservations.map((r) => (r.id === idStatusModification ? { ...r, status: pendingStatus, loading: false } : r)),
      )
      setShowStatusConfirm(false)
      // After successful API call and state update, potentially call:
      // fetchReservations(page, false); // To ensure data consistency if other fields change on backend
    }, 500)
  }

  const sendReview = (id: string): void => {
    // In a real app, this would be an API call.
    Alert.alert(t("reviewLinkSentTitle"), t("reviewLinkSentMessage", { id }))
    setToBeReviewedRes(id)
  }

  const handleDeleteReservation = async (id: string) => {
    try {
      await api.delete(`/api/v1/bo/reservations/${id}/`);
      setShowDeleteConfirm(false);
      // Refresh the list, fetch page 1 to ensure consistency.
      fetchReservations(1, true); 
    } catch (error) {
      console.error(`Error deleting reservation ${id}:`, error);
      let errorMessage = t("failedToDeleteReservation");
      if (axios.isAxiosError(error) && error.response && error.response.data) {
        const errorData = error.response.data;
        if (typeof errorData === 'string') {
          errorMessage = t("failedToDeleteReservationWithError", { error: errorData });
        } else if (errorData.detail) {
          errorMessage = t("failedToDeleteReservationWithError", { error: errorData.detail });
        } else {
          errorMessage = t("failedToDeleteReservationWithError", { error: JSON.stringify(errorData) });
        }
      } else if (error instanceof Error) {
        errorMessage = t("failedToDeleteReservationWithError", { error: error.message });
      }
      Alert.alert(t("error"), errorMessage);
      setShowDeleteConfirm(false);
    }
  };

  const initiateDelete = (id: string): void => {
    if (!id) return
    setReservationToDelete(id)
    setShowDeleteConfirm(true)
  }

  // Filter reservations based on status
  const filterByStatus = (status: string) => {
    setIsLoadingData(true)
    setFocusedFilter(status)
    // fetchReservations(1, true) will be triggered by useEffect watching focusedFilter
    setShowFilterModal(false)
  }

    useEffect(() => {
      // router.replace('/select-restaurant'); // Commented out, potentially for initial setup or redirection logic.
    }
    , []);

  const handleLoadMore = useCallback(() => {
    if (!isLoadingMore && filteredReservations.length < count) {
      fetchReservations(page + 1, false); // Fetch next page, don't show initial loader
    }
  }, [isLoadingMore, filteredReservations.length, count, page, fetchReservations]);

  // Render reservation card
  const renderReservationCard = ({ item }: { item: Reservation }) => (
    <ReservationCard
      reservation={item}
      onEdit={() => EditClient(item.id)}
      onStatusChange={showStatusModification}
      onDelete={() => initiateDelete(item.id)}
      onReview={() => sendReview(item.id)}
      isDarkMode={isDarkMode}
    />
  )

  if (isLoadingReservationForModal) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.text, marginTop: 10 }]}>
          {t('loadingReservationDetails')}
        </Text>
      </SafeAreaView>
    );
  }

  // Show main loader if isLoadingData is true AND there are no reservations yet (first load)
  // Or if specifically desired for all page 1 reloads.
  // Current logic: isLoadingData shows a full screen loader.
  // if (isLoadingData && reservations.length === 0) {
  //   return (
  //     <SafeAreaView style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
  //       <ActivityIndicator size="large" color={colors.primary} />
  //       <Text style={[styles.loadingText, { color: colors.text, marginTop: 10 }]}>
  //         Loading reservations...
  //       </Text>
  //     </SafeAreaView>
  //   );
  // }


  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      {/* Header */}
      {/* <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Reservations</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: colors.primary }]}
            onPress={() => setShowAddReservation(true)}
          >
            <Text style={styles.addButtonText}>Add Reservation</Text>
          </TouchableOpacity>
        </View>
      </View> */}
      {/* Search and Filter Bar */}
      <View style={styles.searchFilterContainer}>
        <View style={styles.searchContainer}>
          <SearchBar onSearch={searchFilter} isDarkMode={isDarkMode} />
        </View>
        <TouchableOpacity
          style={[styles.filterButton, { backgroundColor: colors.card }]}
          onPress={() => setShowFilterModal(true)}
        >
          <Feather name="filter" size={20} color={colors.text} />
        </TouchableOpacity>
      </View>
      <Text style={[styles.filterSectionTitle, { color: colors.text }]}>
        {t('status')}
      </Text>
      <ScrollView 
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ height: 80 }} // Example: enough for buttons + padding
        contentContainerStyle={styles.filterButtonsScrollContainer}
      >
        <View style={styles.filterButtonsContainer}>
          {/* All Button */}
          <TouchableOpacity
            style={[
              styles.filterStatusButton,
              focusedFilter === "" && !selectingDay && !filterDate && styles.activeFilterButton,
              {
                backgroundColor:
                  focusedFilter === "" && !selectingDay && !filterDate
                    ? colors.primary
                    : colors.card,
              },
            ]}
            onPress={setDefaultFilter}
          >
            <Text
              style={{
                color:
                  focusedFilter === "" && !selectingDay && !filterDate ? colors.text : colors.text,
              }}
            >
              {t('all')}
            </Text>
            {focusedFilter === "" && !selectingDay && !filterDate && count > 0 && !isLoadingData && !isRefreshing && (
              <View style={(focusedFilter === "" && !selectingDay && !filterDate) ? styles.badgeContainerActive : styles.badgeContainerInactive}>
                <Text style={(focusedFilter === "" && !selectingDay && !filterDate) ? styles.badgeTextActive : styles.badgeTextInactive}>
                  {count > 99 ? '99+' : count}
                </Text>
              </View>
            )}
          </TouchableOpacity>
          
          {/* Fulfilled Button */}
          <TouchableOpacity
            style={[
              styles.filterStatusButton,
              focusedFilter === "FULFILLED" && styles.activeFilterButton,
              {
                backgroundColor:
                  focusedFilter === "FULFILLED" ? colors.primary : colors.card,
              },
            ]}
            onPress={() => filterByStatus("FULFILLED")}
          >
            <Text
              style={{
                color: focusedFilter === "FULFILLED" ? colors.text : colors.text,
              }}
            >
              {t('fulfilled')}
            </Text>
            {focusedFilter === "FULFILLED" && count > 0 && !isLoadingData && !isRefreshing && (
              <View style={focusedFilter === "FULFILLED" ? styles.badgeContainerActive : styles.badgeContainerInactive}>
                <Text style={focusedFilter === "FULFILLED" ? styles.badgeTextActive : styles.badgeTextInactive}>
                  {count > 99 ? '99+' : count}
                </Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Seated Button */}
          <TouchableOpacity
            style={[
              styles.filterStatusButton,
              focusedFilter === "SEATED" && styles.activeFilterButton,
              {
                backgroundColor:
                  focusedFilter === "SEATED" ? colors.primary : colors.card,
              },
            ]}
            onPress={() => filterByStatus("SEATED")}
          >
            <Text
              style={{
                color: focusedFilter === "SEATED" ? colors.text : colors.text,
              }}
            >
              {t('seated')}
            </Text>
            {focusedFilter === "SEATED" && count > 0 && !isLoadingData && !isRefreshing && (
              <View style={focusedFilter === "SEATED" ? styles.badgeContainerActive : styles.badgeContainerInactive}>
                <Text style={focusedFilter === "SEATED" ? styles.badgeTextActive : styles.badgeTextInactive}>
                  {count > 99 ? '99+' : count}
                </Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Confirmed Button */}
          <TouchableOpacity
            style={[
              styles.filterStatusButton,
              focusedFilter === "APPROVED" && styles.activeFilterButton,
              {
                backgroundColor:
                  focusedFilter === "APPROVED" ? colors.primary : colors.card,
              },
            ]}
            onPress={() => filterByStatus("APPROVED")}
          >
            <Text
              style={{
                color: focusedFilter === "APPROVED" ? colors.text : colors.text,
              }}
            >
              {t('confirmed')}
            </Text>
            {focusedFilter === "APPROVED" && count > 0 && !isLoadingData && !isRefreshing && (
              <View style={focusedFilter === "APPROVED" ? styles.badgeContainerActive : styles.badgeContainerInactive}>
                <Text style={focusedFilter === "APPROVED" ? styles.badgeTextActive : styles.badgeTextInactive}>
                  {count > 99 ? '99+' : count}
                </Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Cancelled Button */}
          <TouchableOpacity
            style={[
              styles.filterStatusButton,
              focusedFilter === "CANCELED" && styles.activeFilterButton,
              {
                backgroundColor:
                  focusedFilter === "CANCELED" ? colors.primary : colors.card,
              },
            ]}
            onPress={() => filterByStatus("CANCELED")}
          >
            <Text
              style={{
                color: focusedFilter === "CANCELED" ? colors.text : colors.text,
              }}
            >
              {t('cancelled')}
            </Text>
            {focusedFilter === "CANCELED" && count > 0 && !isLoadingData && !isRefreshing && (
              <View style={focusedFilter === "CANCELED" ? styles.badgeContainerActive : styles.badgeContainerInactive}>
                <Text style={focusedFilter === "CANCELED" ? styles.badgeTextActive : styles.badgeTextInactive}>
                  {count > 99 ? '99+' : count}
                </Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Pending Button */}
          <TouchableOpacity
            style={[
              styles.filterStatusButton,
              focusedFilter === "PENDING" && styles.activeFilterButton,
              {
                backgroundColor:
                  focusedFilter === "PENDING" ? colors.primary : colors.card,
              },
            ]}
            onPress={() => filterByStatus("PENDING")}
          >
            <Text
              style={{
                color: focusedFilter === "PENDING" ? colors.text : colors.text,
              }}
            >
              {t('pending')}
            </Text>
            {focusedFilter === "PENDING" && count > 0 && !isLoadingData && !isRefreshing && (
              <View style={focusedFilter === "PENDING" ? styles.badgeContainerActive : styles.badgeContainerInactive}>
                <Text style={focusedFilter === "PENDING" ? styles.badgeTextActive : styles.badgeTextInactive}>
                  {count > 99 ? '99+' : count}
                </Text>
              </View>
            )}
          </TouchableOpacity>

          {/* No Show Button */}
          <TouchableOpacity
            style={[
              styles.filterStatusButton,
              focusedFilter === "NO_SHOW" && styles.activeFilterButton,
              {
                backgroundColor:
                  focusedFilter === "NO_SHOW" ? colors.primary : colors.card,
              },
            ]}
            onPress={() => filterByStatus("NO_SHOW")}
          >
            <Text
              style={{
                color: focusedFilter === "NO_SHOW" ? colors.text : colors.text,
              }}
            >
              {t('noShow')}
            </Text>
            {focusedFilter === "NO_SHOW" && count > 0 && !isLoadingData && !isRefreshing && (
              <View style={focusedFilter === "NO_SHOW" ? styles.badgeContainerActive : styles.badgeContainerInactive}>
                <Text style={focusedFilter === "NO_SHOW" ? styles.badgeTextActive : styles.badgeTextInactive}>
                  {count > 99 ? '99+' : count}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
      {/* Active Filters Display */}
      {focusedFilter || selectingDay ? (
        <View style={styles.activeFiltersContainer}>
          <Text style={[styles.activeFiltersTitle, { color: colors.text }]}>
            {t('activeFilters')}:
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={true}
            style={styles.filtersScroll}
          >
            {focusedFilter ? (
              <View
                style={[styles.filterChip, { backgroundColor: colors.card }]}
              >
                <Text style={{ color: colors.text }}>
                  {getStatusLabel(focusedFilter, t)}
                </Text>
                <TouchableOpacity onPress={() => filterByStatus("")}>
                  <Feather name="x" size={16} color={colors.text} />
                </TouchableOpacity>
              </View>
            ) : null}

            {selectingDay ? (
              <View
                style={[styles.filterChip, { backgroundColor: colors.card }]}
              >
                <Text style={{ color: colors.text }}>{selectingDay}</Text>
              </View>
            ) : null}
          </ScrollView>
        </View>
      ) : null}
      {/* Reservations List */}
      {/* If isLoadingData for a reload (not first load), FlatList can show its own header spinner via 'refreshing' prop */}
      {/* The main full-screen loader is handled above for initial empty load */}
      <FlatList
        data={filteredReservations}
        renderItem={renderReservationCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        onRefresh={() => fetchReservations(1, false)} // Fetch page 1, don't show main loader, rely on 'refreshing'
        refreshing={isRefreshing} // Use isRefreshing for pull-to-refresh indicator
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5} // Adjust as needed
        ListFooterComponent={
          isLoadingMore ? (
            <View style={{ paddingVertical: 20 }}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : null
        }
        ListEmptyComponent={
          !isLoadingData && !isRefreshing ? ( // Show empty only if not actively loading initial or refreshing
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: colors.text }]}>
                {t('noReservationsFound')}
              </Text>
            </View>
          ) : null
        }
      />
      {/* Removed total reservations count display from here */}
      {/* Add Reservation Modal */}
      {/* <Modal
        visible={showAddReservation}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowAddReservation(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Add Reservation</Text>
              <TouchableOpacity onPress={() => setShowAddReservation(false)}>
                <Feather name="x" size={24} color={colors.text} />
              </TouchableOpacity>
            </View> */}
      {showAddReservation && <ScrollView style={styles.modalContent}>
        <AddReservationModal
          isVisible={showAddReservation}
          onClose={() => setShowAddReservation(false)}
          onSubmit={handleAddReservationSubmit} // Updated to use the new handler
          isDarkMode={isDarkMode}
        />
      </ScrollView>}
      {/* </View>
        </View>
      </Modal> */}
      {/* Filter Modal */}
      <Modal
        visible={showFilterModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowFilterModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[styles.modalContainer, { backgroundColor: colors.card }]
          }
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {t('filterReservations')}
              </Text>
              <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                <Feather name="x" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent}>
              <Text style={[styles.filterSectionTitle, { color: colors.text }]}>
                {t('date')}
              </Text>
              <TouchableOpacity
                style={[

                  styles.datePickerButton,
                  { backgroundColor: colors.card, borderColor: colors.border },
                ]}
                onPress={() => {
                  setShowFilterModal(false);
                  setFocusedDate(true);
                }}
              >
                <Feather name="calendar" size={20} color={colors.text} />
                <Text
                  style={[styles.datePickerButtonText, { color: colors.text }]
                }
                >
                  {selectingDay || t("selectDateRange")}
                </Text>
              </TouchableOpacity>
            </ScrollView>

            <TouchableOpacity
              style={[styles.resetButton, { backgroundColor: colors.background }]}
              onPress={() => {
                setDefaultFilter();
                setShowFilterModal(false);
              }}
            >
              <Text style={{ color: colors.text }}>{t('resetAllFilters')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      {/* Date Selection Modal */}
      <Modal
        visible={focusedDate}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setFocusedDate(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[

              styles.calendarModalContainer,
              { backgroundColor: colors.card },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {t('selectDateRange')}
              </Text>
              <TouchableOpacity onPress={() => setFocusedDate(false)}>
                <Feather name="x" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            <IntervalCalendar
              onRangeSelect={handleDateClick}
              onClose={() => setFocusedDate(false)}
              isDarkMode={isDarkMode}
            />
          </View>
        </View>
      </Modal>
      {/* Column Customization Modal */}
      {/* <ColumnCustomizationModal
        isVisible={showColumnCustomization}
        onClose={() => setShowColumnCustomization(false)}
        columns={columns}
        onSave={handleSaveColumns}
        isDarkMode={isDarkMode}
      /> */}
      {/* Edit Reservation Modal */}
      {selectedClient && (
        <EditReservationModal
          isVisible={showModal}
          reservation={selectedClient}
          onClose={() => {
            setShowModal(false);
            setEditingClient(undefined);
            setSelectedClient(null);
            if (params.reservation_id) {
              // console.log(`[ReservationsScreen] EditReservationModal onClose: Clearing reservation_id param (${params.reservation_id}) from router.`);
              router.setParams({ reservation_id: undefined });
            } else {
                if(reservationIdBeingProcessed) {
                    // console.log(`[ReservationsScreen] EditReservationModal onClose: Param already undefined, ensuring reservationIdBeingProcessed (${reservationIdBeingProcessed}) is cleared.`);
                    setReservationIdBeingProcessed(null);
                }
            }
          }}
          onSave={upDateHandler}
          reservationProgressData={reservationProgressData}
          setReservationProgressData={setReservationProgressData}
          isDarkMode={isDarkMode}
        />
      )}
      {/* Status Confirmation Modal */}
      <ActionConfirmation
        isVisible={showStatusConfirm}
        title={t("changeReservationStatusTitle")}
        message={t("changeReservationStatusMessage", { status: getStatusLabel(pendingStatus, t) })}
        confirmText={t("confirm")}
        cancelText={t("cancel")}
        onConfirm={confirmStatusUpdate}
        onCancel={() => setShowStatusConfirm(false)}
        isDarkMode={isDarkMode}
      />
      {/* Delete Confirmation Modal */}
      <ActionConfirmation
        isVisible={showDeleteConfirm}
        title={t("deleteReservationTitle")}
        message={t("deleteReservationMessage")}
        confirmText={t("delete")}
        cancelText={t("cancel")}
        onConfirm={() => handleDeleteReservation(reservationToDelete)}
        onCancel={() => setShowDeleteConfirm(false)}
        isDangerous={true}
        isDarkMode={isDarkMode}
      />
      {/* Floating Action Button */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.primary }]}
        onPress={() => setShowAddReservation(true)}
      >
        <Feather name="plus" size={24} color="white" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const getStyles = (colors: ReturnType<typeof useTheme>['colors']) => StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
    paddingBottom:0, // Consider if paddingBottom should be 0 or more for footer space
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
  },
  headerButtons: {
    flexDirection: "row",
  },
  addButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: "white",
    fontWeight: "600",
  },
  searchFilterContainer: {
    flexDirection: "row",
    marginBottom: 7,
  },
  searchContainer: {
    flex: 1,
    marginRight: 8,
  },
  filterButton: {
    width: 48,
    height: 48,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
  },
  activeFiltersContainer: {
    marginBottom: 16,
  },
  activeFiltersTitle: {
    fontSize: 14,
    marginBottom: 8,
  },
  filtersScroll: {
    flexDirection: "row",
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
  },
  listContainer: {
    paddingBottom: 0, // Ensure enough space if there's a tab bar or other elements below
    minHeight: 400, // Ensure it fills the screen if no items
  },
  loadingContainer: { // This style is for the initial full-screen loader
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    textAlign: "center",
  },
  paginationContainer: {
    marginVertical: 6,
    paddingBottom: 10, // Add some padding if it's the last element
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
    maxHeight: "80%",
  },
  calendarModalContainer: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  modalContent: {
    marginBottom: 16,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginTop: 2,
    marginBottom: 3,
  },
  filterButtonsScrollContainer: { 
    paddingVertical: 4, // Adjust padding to center buttons if ScrollView height is fixed
    paddingLeft: 4, 
    paddingRight: 4, 
    // Remove fixed height here if ScrollView has it, or make them consistent
  },
  filterButtonsContainer: {
    flexDirection: "row", 
    // Removed marginBottom: 26 if ScrollView height is managed
    // maxHeight: 80, // This can be removed if ScrollView height dictates overall
  },
  filterStatusButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginHorizontal: 4, // Use marginHorizontal for spacing between buttons
    marginVertical: 4, // Keep vertical margin if buttons were to wrap (though they won't now)
    flexDirection: 'row', 
    alignItems: 'center',   
    justifyContent: 'center',
    height: 40, // Ensure consistent height for all buttons
  },
  activeFilterButton: {
    borderWidth: 0,
  },
  datePickerButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginVertical: 8,
  },
  datePickerButtonText: {
    marginLeft: 8,
  },
  columnsButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginVertical: 8,
  },
  columnsButtonText: {
    marginLeft: 8,
  },
  resetButton: {
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  badgeContainerActive: { 
    backgroundColor: colors.card, 
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 6,
    minWidth: 20, 
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeTextActive: { 
    color: colors.primary, 
    fontSize: 10,
    fontWeight: 'bold',
  },
  badgeContainerInactive: { 
    backgroundColor: colors.primary, 
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 6,
    minWidth: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeTextInactive: { 
    color: colors.text, // Assuming colors.buttonText is white or contrasts with primary
    fontSize: 10,
    fontWeight: 'bold',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 5,
    bottom: 5,
    width: 45,
    height: 45,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8, // Android shadow
    shadowColor: '#000', // iOS shadow
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
})

export default ReservationsScreen

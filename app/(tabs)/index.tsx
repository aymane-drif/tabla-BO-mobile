"use client"

import { useLocalSearchParams, useRouter } from 'expo-router'; // Added useLocalSearchParams
import { api } from '../../api/axiosInstance'; // Assuming api is your configured axios instance
import { Alert } from 'react-native'; // Added Alert
import axios from 'axios'; // Added axios for type checking
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
import { useSelectedDate } from '@/Context/SelectedDateContext'; // Added

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
const getStatusLabel = (status: string): string => {
  switch (status) {
    case "APPROVED":
      return "Confirmed"
    case "PENDING":
      return "Pending"
    case "SEATED":
      return "Seated"
    case "FULFILLED":
      return "Fulfilled"
    case "NO_SHOW":
      return "No Show"
    case "CANCELED":
      return "Cancelled"
    default:
      return status
  }
}

export function ErrorBoundary(props: ErrorBoundaryProps) {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Something went wrong with Notifications.</Text>
      <Text>{props.error.message}</Text>
      <Button onPress={props.retry} title="Try Again" />
    </View>
  );
}

// Main ReservationsScreen Component
const ReservationsScreen = () => {
  const { isDarkMode, colors } = useTheme()
  const router = useRouter(); // For navigation if needed, or clearing params
  const params = useLocalSearchParams<{ reservation_id?: string }>(); // Get route params
  const { selectedDate: contextSelectedDate } = useSelectedDate(); // Added: Get selected date from context


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
  const [page, setPage] = useState<number>(1)
  const [tables, setTables] = useState<any[]>([])
  const [floors, setFloors] = useState<any[]>([])
  const [selectedClient, setSelectedClient] = useState<Reservation | null>(null)
  const [hasTable, setHasTable] = useState<boolean>(false)
  const [selectingDay, setSelectingDay] = useState<string>("")
  const [focusedDate, setFocusedDate] = useState<boolean>(false)
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
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [filterDate, setFilterDate] = useState<boolean>(true)
  const [showFilterModal, setShowFilterModal] = useState<boolean>(false)
  const [isLoadingData, setIsLoadingData] = useState<boolean>(true); // Combined loading state

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
    // const loadSelectedDate = async () => { // Removed AsyncStorage logic
    //   try {
    //     const storedDate = await AsyncStorage.getItem("selectedDate");
    //     if (storedDate && !selectedDateRange.start && !selectedDateRange.end) {
    //       const parsedDate = new Date(storedDate);
    //       setSelectedDateRange({ start: parsedDate, end: parsedDate });
    //       setSelectingDay(format(parsedDate, "dd/MM/yyyy"));
    //     }
    //   } catch (error) {
    //     console.error("Error loading selected date from storage:", error);
    //   }
    // };
    // loadSelectedDate(); // Removed
    loadColumns()
  }, [])

  // Save column preferences when they change
  useEffect(() => {
    saveColumnsToStorage(columns)
  }, [columns])

  
  // API call to fetch reservations
  const fetchReservations = useCallback(async (showLoader = true) => { // Wrapped with useCallback
    if (showLoader) setIsLoadingData(true);
    try {
      // Construct query parameters
      const queryParams = new URLSearchParams();
      queryParams.append('page', page.toString());
      queryParams.append('page_size', '10');
      if (focusedFilter) {
        queryParams.append('status', focusedFilter);
      }

      // Handle date filtering logic
      if (selectedDateRange.start) {
        queryParams.append('date__gte', format(selectedDateRange.start, 'yyyy-MM-dd'));
      }
      if (selectedDateRange.end) {
        queryParams.append('date__lte', format(selectedDateRange.end, 'yyyy-MM-dd'));
      } else if (filterDate && !selectedDateRange.start && contextSelectedDate) { // Use contextSelectedDate
        // If no date range is set but filterDate is true, use context selected date
        const dateToUse = format(new Date(contextSelectedDate), 'yyyy-MM-dd');
        queryParams.append('date__gte', dateToUse);
        queryParams.append('date__lte', dateToUse);
      } else if (filterDate && !selectedDateRange.start && !contextSelectedDate) {
        // Fallback to today if no context date and no range
        const today = new Date();
        queryParams.append('date__gte', format(today, 'yyyy-MM-dd'));
        queryParams.append('date__lte', format(today, 'yyyy-MM-dd'));
      }

      if (searchKeyWord) {
        queryParams.append('search', searchKeyWord);
      }
      queryParams.append('ordering', '-id'); 
      
      const response = await api.get(`/api/v1/bo/reservations/?${queryParams.toString()}`);
      
      setReservations(response.data.results || []);
      setFilteredReservations(response.data.results || []); 
      setCount(response.data.count || 0);

    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.log("Error fetching reservations:", { error, res: error.response });
      } else if (error instanceof Error) {
        console.log("Error fetching reservations:", { error, message: error.message });
      } else {
        console.log("Error fetching reservations:", error);
      }
      setReservations([]);
      setFilteredReservations([]);
      setCount(0);
    } finally {
      if (showLoader) setIsLoadingData(false);
    }
  }, [page, focusedFilter, selectedDateRange, searchKeyWord, filterDate, contextSelectedDate, setIsLoadingData, setReservations, setFilteredReservations, setCount]); // Added dependencies
  
  // Fetch reservations on initial load and when dependencies change
  useEffect(() => {
    fetchReservations();
  }, [fetchReservations]); // Simplified to just fetchReservations

  // Effect to handle reservation_id from route params
  useEffect(() => {
    const reservationIdFromParam = params.reservation_id;
    if (reservationIdFromParam && !showModal) { // Process only if ID exists and modal isn't already open for it
      const fetchAndShowReservation = async (id: string) => {
        setIsLoadingData(true);
        try {
          const response = await api.get<Reservation>(`/api/v1/bo/reservations/${id}/`);
          const reservationData = response.data;
          if (reservationData) {
            setSelectedClient(reservationData);
            setReservationProgressData({
              reserveDate: reservationData.date,
              time: reservationData.time.slice(0, 5), // HH:mm
              guests: parseInt(reservationData.number_of_guests, 10) || 0,
            });
            setEditingClient(reservationData.id); // Keep track of which client is being edited
            setShowModal(true);
            // Optionally clear the param from URL if desired, though not strictly necessary
            // router.setParams({ reservation_id: undefined }); 
          } else {
            Alert.alert("Not Found", `Reservation with ID ${id} not found.`);
          }
        } catch (error) {
          console.error(`Error fetching reservation ${id}:`, error);
          Alert.alert("Error", `Could not load reservation ${id}.`);
        } finally {
          setIsLoadingData(false);
        }
      };
      fetchAndShowReservation(reservationIdFromParam);
    }
  }, [params.reservation_id, showModal]);


  // Save column preferences when they change
  useEffect(() => {
    saveColumnsToStorage(columns)
  }, [columns])

  // Effect to update search results
  useEffect(() => {
    if (!searched) {
      setSearchResults(reservations)
    }
  }, [reservations, searched])

  // Effect to update date range display
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

  // Effect to update reservation progress data when client changes
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
      await fetchReservations(); // Refresh list and update count


    } catch (error) {
      console.error("Error creating reservation:", error);
      let errorMessage = "Failed to create reservation. Please try again.";
      if (axios.isAxiosError(error) && error.response && error.response.data) {
        // You might want to parse error.response.data for a more specific message
        errorMessage = `Failed to create reservation: ${JSON.stringify(error.response.data)}`;
      }
      Alert.alert("Error", errorMessage);
      // Ensure loading state is reset if not handled by fetchReservations' finally block
      // setIsLoading(false); 
    }
  };

  // Handler functions
  const handleDateClick = (range: { start: Date; end: Date }): void => {
    setSelectedDateRange(range)
    setFocusedDate(false)
  }

  const setDefaultFilter = (): void => {
    setFocusedFilter("")
    setSelectingDay("")
    setFilterDate(!filterDate)
    setSelectedDateRange({ start: null, end: null })
  }

  const searchFilter = (text: string): void => {
    const keyword = text.toLowerCase()
    setSearchKeyWord(keyword)
    setPage(1) // Reset to first page when searching
    // fetchReservations will be triggered by the useEffect that watches searchKeyWord
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
      Alert.alert("Error", "No reservation selected for update.");
      return;
    }
    setIsLoadingData(true); // Indicate loading for the update operation
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
      await fetchReservations(true); // Refetch reservations without main loader
    } catch (error) {
      console.error("Error updating reservation:", error);
      let errorMessage = "Failed to update reservation.";
      if (axios.isAxiosError(error) && error.response && error.response.data) {
        // Construct a more detailed error message if possible
        const errorData = error.response.data;
        const messages = Object.entries(errorData).map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`);
        errorMessage += `\n${messages.join('\n')}`;
      }
      Alert.alert("Error", errorMessage);
    } finally {
      setIsLoadingData(false);
    }
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
    setReservations(reservations.map((r) => (r.id === idStatusModification ? { ...r, loading: true } : r)))

    // In a real app, you would call an API here
    setTimeout(() => {
      setReservations(
        reservations.map((r) => (r.id === idStatusModification ? { ...r, status: pendingStatus, loading: false } : r)),
      )
      setFilteredReservations(
        reservations.map((r) => (r.id === idStatusModification ? { ...r, status: pendingStatus, loading: false } : r)),
      )
      setShowStatusConfirm(false)
    }, 500)
  }

  const sendReview = (id: string): void => {
    // In a real app, you would call an API here
    Alert.alert("Review Link Sent", `A review link has been sent to the customer with reservation #${id}`)
    setToBeReviewedRes(id)
  }

  const handleDeleteReservation = async (id: string) => {

    // Consider setting a specific loading state for the item being deleted if desired,
    // or rely on the general loader from fetchReservations.
    // For this example, we'll show a general loading state via fetchReservations.

    try {
      await api.delete(`/api/v1/bo/reservations/${id}/`);
      
      setShowDeleteConfirm(false); // Close the confirmation modal first
      
      // Refresh the list of reservations. 
      // fetchReservations(true) will show a loader and update the list.
      await fetchReservations(true); 

    } catch (error) {
      console.error(`Error deleting reservation ${id}:`, error);
      let errorMessage = "Failed to delete reservation. Please try again.";
      if (axios.isAxiosError(error) && error.response && error.response.data) {
        // Attempt to provide a more specific error message from the API response
        const errorData = error.response.data;
        if (typeof errorData === 'string') {
          errorMessage = `Failed to delete reservation: ${errorData}`;
        } else if (errorData.detail) {
          errorMessage = `Failed to delete reservation: ${errorData.detail}`;
        } else {
          errorMessage = `Failed to delete reservation: ${JSON.stringify(errorData)}`;
        }
      } else if (error instanceof Error) {
        errorMessage = `Failed to delete reservation: ${error.message}`;
      }
      Alert.alert("Error", errorMessage);
      setShowDeleteConfirm(false); // Ensure modal is closed on error as well
    }
  };

  const initiateDelete = (id: string): void => {
    if (!id) return
    setReservationToDelete(id)
    setShowDeleteConfirm(true)
  }

  // Filter reservations based on status
  const filterByStatus = (status: string) => {
    setFocusedFilter(status)
    setPage(1) // Reset to first page when filtering
    if (status) {
      const filtered = reservations.filter((r) => r.status === status)
      setFilteredReservations(filtered)
    } else {
      setFilteredReservations(reservations)
    }
    setShowFilterModal(false)
  }

    useEffect(() => {
      // router.replace('/select-restaurant'); 
    }
    , []);
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

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Reservations</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: colors.primary }]}
            onPress={() => setShowAddReservation(true)}
          >
            <Text style={styles.addButtonText}>Add Reservation</Text>
          </TouchableOpacity>
        </View>
      </View>
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
        Status
      </Text>
      <View style={styles.filterButtonsContainer}>
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
              color: focusedFilter === "FULFILLED" ? "#fff" : colors.text,
            }}
          >
            Fulfilled
          </Text>
        </TouchableOpacity>

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
              color: focusedFilter === "SEATED" ? "#fff" : colors.text,
            }}
          >
            Seated
          </Text>
        </TouchableOpacity>

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
              color: focusedFilter === "APPROVED" ? "#fff" : colors.text,
            }}
          >
            Confirmed
          </Text>
        </TouchableOpacity>

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
              color: focusedFilter === "CANCELED" ? "#fff" : colors.text,
            }}
          >
            Cancelled
          </Text>
        </TouchableOpacity>

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
              color: focusedFilter === "PENDING" ? "#fff" : colors.text,
            }}
          >
            Pending
          </Text>
        </TouchableOpacity>

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
              color: focusedFilter === "NO_SHOW" ? "#fff" : colors.text,
            }}
          >
            No Show
          </Text>
        </TouchableOpacity>

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
                focusedFilter === "" && !selectingDay && !filterDate ? "#fff" : colors.text,
            }}
          >
            All
          </Text>
        </TouchableOpacity>
      </View>
      {/* Active Filters Display */}
      {focusedFilter || selectingDay ? (
        <View style={styles.activeFiltersContainer}>
          <Text style={[styles.activeFiltersTitle, { color: colors.text }]}>
            Active Filters:
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.filtersScroll}
          >
            {focusedFilter ? (
              <View
                style={[styles.filterChip, { backgroundColor: colors.card }]}
              >
                <Text style={{ color: colors.text }}>
                  {getStatusLabel(focusedFilter)}
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
                <TouchableOpacity
                  onPress={() => {
                    setSelectingDay("");
                    setSelectedDateRange({ start: null, end: null });
                  }}
                >
                  <Feather name="x" size={16} color={colors.text} />
                </TouchableOpacity>
              </View>
            ) : null}
          </ScrollView>
        </View>
      ) : null}
      {/* Reservations List */}
      {isLoadingData ? ( // Show main loader only if no data yet
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          {/* <Text style={[styles.loadingText, { color: colors.text }]}>Loading reservations...</Text> */}
        </View>
      ) : (
        <FlatList
          data={filteredReservations}
          renderItem={renderReservationCard}
          onRefresh={() => fetchReservations()} // Fetch without main loader
          refreshing={isLoadingData} // Use isLoadingData for refresh state
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: colors.text }]}>
                No reservations found.
              </Text>
            </View>
          }
        />
      )}
      {/* Pagination */}
      {(count > 10 && !isLoadingData) && (
        <View style={styles.paginationContainer}>
          <Pagination
            setPage={setPage}
            currentPage={page}
            totalItems={count}
            itemsPerPage={10}
            isDarkMode={isDarkMode}
          />
        </View>
      )}
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
            style={[styles.modalContainer, { backgroundColor: colors.card }]}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Filter Reservations
              </Text>
              <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                <Feather name="x" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent}>
              <Text style={[styles.filterSectionTitle, { color: colors.text }]}>
                Date
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
                  style={[styles.datePickerButtonText, { color: colors.text }]}
                >
                  {selectingDay || "Select Date Range"}
                </Text>
              </TouchableOpacity>
            </ScrollView>

            <TouchableOpacity
              style={[
                styles.resetButton,
                { backgroundColor: colors.background },
              ]}
              onPress={() => {
                setDefaultFilter();
                setShowFilterModal(false);
              }}
            >
              <Text style={{ color: colors.text }}>Reset All Filters</Text>
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
                Select Date Range
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
            // Clear reservation_id from route params
            if (params.reservation_id) {
              router.setParams({ reservation_id: undefined });
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
        title="Change Reservation Status"
        message={`Are you sure you want to change the status to ${getStatusLabel(
          pendingStatus
        )}?`}
        confirmText="Confirm"
        cancelText="Cancel"
        onConfirm={confirmStatusUpdate}
        onCancel={() => setShowStatusConfirm(false)}
        isDarkMode={isDarkMode}
      />
      {/* Delete Confirmation Modal */}
      <ActionConfirmation
        isVisible={showDeleteConfirm}
        title="Delete Reservation"
        message="Are you sure you want to delete this reservation? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={() => handleDeleteReservation(reservationToDelete)}
        onCancel={() => setShowDeleteConfirm(false)}
        isDangerous={true}
        isDarkMode={isDarkMode}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
    paddingBottom:0,
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
    paddingBottom: 0,
  },
  loadingContainer: {
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
    marginVertical: 16,
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
  filterButtonsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 8,
  },
  filterStatusButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    margin: 4,
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
})

export default ReservationsScreen

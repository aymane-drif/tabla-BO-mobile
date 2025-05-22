"use client"

import { useEffect, useState } from "react"
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
  Alert,
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
import { ErrorBoundaryProps, useRouter } from "expo-router"

// Types and Interfaces
export interface ReceivedTables {
  floor_name?: string
  id: number
  name: string
}

export interface Reservation {
  id: string
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
  const router = useRouter();

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
  }, [columns])

  

  // You can call fetchReservations() in a useEffect if you want to load from API instead of mock data

  // Mock data loading
  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      const mockReservations: Reservation[] = [
        {
          id: "1",
          full_name: "John Smith",
          email: "john.smith@example.com",
          phone: "+1 555-123-4567",
          date: "2025-05-20",
          time: "19:00:00",
          number_of_guests: "4",
          status: "APPROVED",
          internal_note: "Birthday celebration",
          tables: [{ id: 1, name: "Table 5" }],
          seq_id: "1001",
          tags: ["VIP", "Regular"],
        },
        {
          id: "2",
          full_name: "Emma Johnson",
          email: "emma.j@example.com",
          phone: "+1 555-987-6543",
          date: "2025-05-20",
          time: "20:30:00",
          number_of_guests: "2",
          status: "PENDING",
          seq_id: "1002",
        },
        {
          id: "3",
          full_name: "Michael Brown",
          email: "michael.b@example.com",
          phone: "+1 555-456-7890",
          date: "2025-05-21",
          time: "18:00:00",
          number_of_guests: "6",
          status: "SEATED",
          tables: [{ id: 2, name: "Table 10" }],
          seq_id: "1003",
          commenter: "Prefers window seating",
        },
        {
          id: "4",
          full_name: "Sarah Wilson",
          email: "sarah.w@example.com",
          phone: "+1 555-789-0123",
          date: "2025-05-21",
          time: "19:30:00",
          number_of_guests: "3",
          status: "FULFILLED",
          seq_id: "1004",
        },
        {
          id: "5",
          full_name: "David Lee",
          email: "david.l@example.com",
          phone: "+1 555-234-5678",
          date: "2025-05-22",
          time: "20:00:00",
          number_of_guests: "5",
          status: "CANCELED",
          cancellation_note: "Family emergency",
          seq_id: "1005",
        },
        {
          id: "6",
          full_name: "David Lee",
          email: "david.l@example.com",
          phone: "+1 555-234-5678",
          date: "2025-05-22",
          time: "20:00:00",
          number_of_guests: "5",
          status: "NO_SHOW",
          cancellation_note: "Family emergency",
          seq_id: "1005",
        },
        {
          id: "7",
          full_name: "Sophia Martinez",
          email: "acsn@afns.com",
          phone: "+1 555-321-0987",
          date: "2025-05-22",
          time: "21:00:00",
          number_of_guests: "8",
          status: "APPROVED",
          tables: [{ id: 3, name: "Table 15" }],
          seq_id: "1006",
          tags: ["VIP"],
        },
        {
          id: "8",
          full_name: "James Taylor",
          email: "acsn@afns.com",
          phone: "+1 555-654-3210",
          date: "2025-05-23",
          time: "18:30:00",
          number_of_guests: "2",
          status: "PENDING",
          tables: [{ id: 4, name: "Table 20" }],
          seq_id: "1007",
          tags: ["Regular"],
        },
      ]

      setReservations(mockReservations)
      setFilteredReservations(mockReservations)
      setCount(mockReservations.length)
      setIsLoading(false)
    }, 1500)
  }, [])

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
    } else {
      setSelectingDay("")
    }
  }, [selectedDateRange])

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

    // Filter reservations based on keyword
    if (keyword) {
      const filtered = reservations.filter(
        (reservation) =>
          reservation.full_name.toLowerCase().includes(keyword) ||
          reservation.email.toLowerCase().includes(keyword) ||
          reservation.phone.includes(keyword) ||
          (reservation.seq_id && reservation.seq_id.includes(keyword)),
      )
      setFilteredReservations(filtered)
      setSearched(true)
    } else {
      setFilteredReservations(reservations)
      setSearched(false)
    }
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

  const upDateHandler = (updatedReservation: Reservation): void => {
    // Normalize occasion to match expected type: { id: number; name: string } | undefined
    let normalizedOccasion: { id: number; name: string } | undefined = undefined
    if (updatedReservation.occasion && typeof updatedReservation.occasion === "object" && "id" in updatedReservation.occasion && "name" in updatedReservation.occasion) {
      normalizedOccasion = updatedReservation.occasion as { id: number; name: string }
    }

    const updatedReservations = reservations.map((r) =>
      r.id === editingClient
        ? {
            ...r,
            full_name: updatedReservation.full_name,
            email: updatedReservation.email,
            phone: updatedReservation.phone,
            table_name: updatedReservation.table_name,
            source: updatedReservation.source,
            status: updatedReservation.status,
            internal_note: updatedReservation.internal_note,
            occasion: normalizedOccasion,
            date: reservationProgressData.reserveDate,
            time: `${reservationProgressData.time}:00`,
            tables: updatedReservation.tables,
            number_of_guests: String(reservationProgressData.guests),
            commenter: updatedReservation.commenter,
          }
        : r,
    )

    setReservations(updatedReservations)
    setFilteredReservations(updatedReservations)
    setShowModal(false)
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

  const handleDeleteReservation = (id: string) => {
    // In a real app, you would call an API here
    const updatedReservations = reservations.filter((r) => r.id !== id)
    setReservations(updatedReservations)
    setFilteredReservations(updatedReservations)
    setShowDeleteConfirm(false)
  }

  const initiateDelete = (id: string): void => {
    if (!id) return
    setReservationToDelete(id)
    setShowDeleteConfirm(true)
  }

  // Filter reservations based on status
  const filterByStatus = (status: string) => {
    setFocusedFilter(status)
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
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
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
      <Text style={[styles.filterSectionTitle, { color: colors.text }]}>Status</Text>
      <View style={styles.filterButtonsContainer}>
        <TouchableOpacity
          style={[
            styles.filterStatusButton,
            focusedFilter === "FULFILLED" && styles.activeFilterButton,
            { backgroundColor: focusedFilter === "FULFILLED" ? colors.primary : colors.card },
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
            { backgroundColor: focusedFilter === "SEATED" ? colors.primary : colors.card },
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
            { backgroundColor: focusedFilter === "APPROVED" ? colors.primary : colors.card },
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
            { backgroundColor: focusedFilter === "CANCELED" ? colors.primary : colors.card },
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
            { backgroundColor: focusedFilter === "PENDING" ? colors.primary : colors.card },
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
            { backgroundColor: focusedFilter === "NO_SHOW" ? colors.primary : colors.card },
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
            focusedFilter === "" && !selectingDay && styles.activeFilterButton,
            { backgroundColor: focusedFilter === "" && !selectingDay ? colors.primary : colors.card },
          ]}
          onPress={setDefaultFilter}
        >
          <Text
            style={{
              color: focusedFilter === "" && !selectingDay ? "#fff" : colors.text,
            }}
          >
            All
          </Text>
        </TouchableOpacity>
      </View>

      {/* Active Filters Display */}
      {focusedFilter || selectingDay ? (
        <View style={styles.activeFiltersContainer}>
          <Text style={[styles.activeFiltersTitle, { color: colors.text }]}>Active Filters:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersScroll}>
            {focusedFilter ? (
              <View style={[styles.filterChip, { backgroundColor: colors.card }]}>
                <Text style={{ color: colors.text }}>{getStatusLabel(focusedFilter)}</Text>
                <TouchableOpacity onPress={() => filterByStatus("")}>
                  <Feather name="x" size={16} color={colors.text} />
                </TouchableOpacity>
              </View>
            ) : null}

            {selectingDay ? (
              <View style={[styles.filterChip, { backgroundColor: colors.card }]}>
                <Text style={{ color: colors.text }}>{selectingDay}</Text>
                <TouchableOpacity
                  onPress={() => {
                    setSelectingDay("")
                    setSelectedDateRange({ start: null, end: null })
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
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text }]}>Loading reservations...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredReservations}
          renderItem={renderReservationCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: colors.text }]}>No reservations found</Text>
            </View>
          }
        />
      )}

      {/* Pagination */}
      {count > 10 && (
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

            <ScrollView style={styles.modalContent}>
              <AddReservationModal
                isVisible={showAddReservation}
                onClose={() => setShowAddReservation(false)}
                onSubmit={(newReservation) => {
                  // Add the new reservation to the list
                  // Ensure all required fields are present and not undefined
                  const reservationToAdd: Reservation = {
                    ...newReservation,
                    email: newReservation.email ?? "",
                    full_name: newReservation.full_name ?? "",
                    phone: newReservation.phone ?? "",
                    date: newReservation.date ?? "",
                    time: newReservation.time ?? "",
                    number_of_guests: newReservation.number_of_guests ?? "",
                    status: newReservation.status ?? "PENDING",
                    id: newReservation.id ?? `${Date.now()}`,
                    // Ensure occasion is either undefined or an object of the correct shape
                    occasion:
                      newReservation.occasion && typeof newReservation.occasion === "object"
                        ? newReservation.occasion
                        : undefined,
                  }
                  setReservations((prev) => [
                    ...prev,
                    reservationToAdd,
                  ])
                  setFilteredReservations((prev) => [
                    ...prev,
                    reservationToAdd,
                  ])
                  setShowAddReservation(false)
                }}
                isDarkMode={isDarkMode}
              />
            </ScrollView>
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
          <View style={[styles.modalContainer, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Filter Reservations</Text>
              <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                <Feather name="x" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent}>
              

              <Text style={[styles.filterSectionTitle, { color: colors.text }]}>Date</Text>
              <TouchableOpacity
                style={[styles.datePickerButton, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => {
                  setShowFilterModal(false)
                  setFocusedDate(true)
                }}
              >
                <Feather name="calendar" size={20} color={colors.text} />
                <Text style={[styles.datePickerButtonText, { color: colors.text }]}>
                  {selectingDay || "Select Date Range"}
                </Text>
              </TouchableOpacity>

              <Text style={[styles.filterSectionTitle, { color: colors.text }]}>Columns</Text>
              <TouchableOpacity
                style={[styles.columnsButton, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => {
                  setShowFilterModal(false)
                  setShowColumnCustomization(true)
                }}
              >
                <Feather name="edit" size={20} color={colors.text} />
                <Text style={[styles.columnsButtonText, { color: colors.text }]}>Customize Columns</Text>
              </TouchableOpacity>
            </ScrollView>

            <TouchableOpacity
              style={[styles.resetButton, { backgroundColor: colors.background }]}
              onPress={() => {
                setDefaultFilter()
                setShowFilterModal(false)
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
          <View style={[styles.calendarModalContainer, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Select Date Range</Text>
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
      <ColumnCustomizationModal
        isVisible={showColumnCustomization}
        onClose={() => setShowColumnCustomization(false)}
        columns={columns}
        onSave={handleSaveColumns}
        isDarkMode={isDarkMode}
      />

      {/* Edit Reservation Modal */}
      {selectedClient && (
        <EditReservationModal
          isVisible={showModal}
          reservation={selectedClient}
          onClose={() => setShowModal(false)}
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
        message={`Are you sure you want to change the status to ${getStatusLabel(pendingStatus)}?`}
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
  )
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
    marginTop: 16,
    marginBottom: 24,
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

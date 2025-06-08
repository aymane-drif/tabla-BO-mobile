"use client"

import { useState, useEffect } from "react"
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
} from "react-native"
import { Feather } from "@expo/vector-icons"
import { useTheme } from "../../Context/ThemeContext"
import { api } from "../../api/axiosInstance"
import { ReservationSource, ReservationStatus } from "../../types/Reservation"
import { Occasion } from "../../types/Reservation"

// Import the ReservationProcess component
import ReservationProcess from "./ReservationProcess"

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
  occasion?: { id: number; name: string } | number | null
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

interface EditReservationModalProps {
  isVisible: boolean
  reservation: Reservation
  onClose: () => void
  onSave: (reservation: Reservation) => void
  reservationProgressData: DataTypes
  setReservationProgressData: (data: DataTypes) => void
  isDarkMode: boolean
}

// Status types


// Assuming TableType is defined somewhere, or define it here based on web component
interface TableType {
  id: number
  name: string
  floor_name?: string
  // Add other properties if needed
}

const EditReservationModal = ({
  isVisible,
  reservation,
  onClose,
  onSave,
  reservationProgressData,
  setReservationProgressData,
  isDarkMode,
}: EditReservationModalProps) => {
  const { colors } = useTheme()

  // States
  const [selectedClient, setSelectedClient] = useState<Reservation | null>(null)
  const [selectedOccasion, setSelectedOccasion] = useState<number | null>(null)
  const [availableTables, setAvailableTables] = useState<TableType[]>([])
  const [selectedTables, setSelectedTables] = useState<number[]>([])
  const [hasTable, setHasTable] = useState<boolean>(false)
  const [showConfirmPopup, setShowConfirmPopup] = useState<boolean>(false)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [showTableSelection, setShowTableSelection] = useState<boolean>(false)
  const [showOccasionSelection, setShowOccasionSelection] = useState<boolean>(false)
  const [showSourceSelection, setShowSourceSelection] = useState<boolean>(false)
  const [showStatusSelection, setShowStatusSelection] = useState<boolean>(false)
  const [occasions, setOccasions] = useState<Occasion[]>([])
  const [loadingTables, setLoadingTables] = useState(false)
  const [loadingOccasions, setLoadingOccasions] = useState(false)

  // Replace the showDateTimePicker state with showReservationProcess
  const [showReservationProcess, setShowReservationProcess] = useState<boolean>(false)

  // Initialize states when modal opens
  useEffect(() => {
    if (isVisible && reservation) {
      setSelectedClient(reservation)
      setSelectedOccasion(
        typeof reservation.occasion === "object"
          ? reservation.occasion?.id ?? null
          : reservation.occasion ?? null
      )
      setSelectedTables(reservation.tables?.map((t) => t.id) || [])
      setHasTable(!!(reservation.tables && reservation.tables.length > 0))

      // Mock available tables
      const mockTables: ReceivedTables[] = [
        { id: 1, name: "Table 1", floor_name: "Main Floor" },
        { id: 2, name: "Table 2", floor_name: "Main Floor" },
        { id: 3, name: "Table 3", floor_name: "Main Floor" },
        { id: 4, name: "Table 4", floor_name: "Patio" },
        { id: 5, name: "Table 5", floor_name: "Patio" },
        { id: 6, name: "Table 6", floor_name: "Upstairs" },
        { id: 7, name: "Table 7", floor_name: "Upstairs" },
        { id: 8, name: "Table 8", floor_name: "Bar Area" },
      ]

      // Add existing tables to available tables
      const existingTables = reservation.tables || []
      const combinedTables = [...mockTables]

      // Add existing tables if they're not already in the list
      existingTables.forEach((table) => {
        if (!combinedTables.some((t) => t.id === table.id)) {
          combinedTables.push(table)
        }
      })

      setAvailableTables(combinedTables)
    }
  }, [isVisible, reservation])

  // Fetch Occasions
  useEffect(() => {
    if (isVisible) {
      const fetchOccasions = async () => {
        setLoadingOccasions(true)
        try {
          const response = await api.get("/api/v1/bo/occasions/")
          setOccasions(response.data || [])
        } catch (error) {
          console.error("Failed to fetch occasions:", error)
        } finally {
          setLoadingOccasions(false)
        }
      }
      fetchOccasions()
    }
  }, [isVisible])

  // Fetch Available Tables
  useEffect(() => {
    if (
      isVisible &&
      reservation &&
      reservationProgressData.reserveDate &&
      reservationProgressData.time &&
      reservationProgressData.guests > 0
    ) {
      const fetchTables = async () => {
        setLoadingTables(true)
        try {
          const params = {
            date: reservationProgressData.reserveDate,
            number_of_guests: reservationProgressData.guests,
            time: `${reservationProgressData.time}:00`, // Assuming API expects seconds
          }
          const response = await api.get<TableType[]>("/api/v1/bo/tables/available_tables/", { params })
          let currentTables: TableType[] = []
          setAvailableTables([...(response.data || []), ...currentTables].filter((v, i, a) => a.findIndex((t) => t.id === v.id) === i)) // Remove duplicates
        } catch (error) {
          console.error("Failed to fetch available tables:", error)
        } finally {
          setLoadingTables(false)
        }
      }
      fetchTables()
    }
  }, [isVisible, reservation, reservationProgressData])

  // Handle save
  const handleSave = () => {
    setShowConfirmPopup(true)
  }

  // Confirm update
  const confirmUpdate = () => {
    if (selectedClient) {
      setIsLoading(true)

      // Simulate API call
      setTimeout(() => {
        onSave(selectedClient)
        setShowConfirmPopup(false)
        setIsLoading(false)
      }, 500)
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

  // Get status color
  const getStatusColor = (status: string): string => {
    switch (status) {
      case "APPROVED":
        return colors.success
      case "PENDING":
        return colors.primary
      case "SEATED":
        return colors.warning
      case "FULFILLED":
        return colors.purple
      case "NO_SHOW":
        return colors.blush
      case "CANCELED":
        return colors.danger
      default:
        return colors.text
    }
  }

  // Replace the showDateTimePickerModal function
  const showReservationProcessModal = () => {
    console.log("Opening reservation process modal") // Add logging
    setShowReservationProcess(true)
  }

  // Render read-only view
  const renderReadOnlyView = () => (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>{selectedClient?.full_name}</Text>
        <TouchableOpacity onPress={onClose}>
          <Feather name="x" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      {/* Tags */}
      {selectedClient?.tags?.length && 
        <>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Tags</Text>
          <View style={styles.tagsContainer}>
            {selectedClient?.tags?.map((tag, index) => (
              <View key={index} style={[styles.tag, { backgroundColor: colors.success + "20" }]}>
                <Text style={[styles.tagText, { color: colors.success }]}>{tag}</Text>
              </View>
            ))}
          </View>
        </>
      }

      {/* Client preferences */}
      <Text style={[styles.cardTitle, { color: colors.text }]}>{selectedClient?.full_name}'s preferences</Text>
      <View style={[styles.preferencesCard, { backgroundColor: colors.card }]}>

        <View style={styles.preferenceItem}>
          <Text style={[styles.preferenceLabel, { color: colors.subtext }]}>Allergies</Text>
          <Text style={[styles.preferenceValue, { color: colors.text }]}>{selectedClient?.allergies || "None"}</Text>
        </View>

        <View style={styles.preferenceItem}>
          <Text style={[styles.preferenceLabel, { color: colors.subtext }]}>Occasion</Text>
          <Text style={[styles.preferenceValue, { color: colors.text }]}>
            {typeof selectedClient?.occasion === "object" ? selectedClient?.occasion?.name : "None"}
          </Text>
        </View>

        <View style={styles.preferenceItem}>
          <Text style={[styles.preferenceLabel, { color: colors.subtext }]}>Comment</Text>
          <Text style={[styles.preferenceValue, { color: colors.text }]}>{selectedClient?.commenter || "None"}</Text>
        </View>
      </View>

      {/* Cancellation info if applicable */}
      {selectedClient?.status === "CANCELED" && (
        <View style={[styles.cancellationCard, { backgroundColor: colors.danger + "10" }]}>
          <View style={styles.cancellationHeader}>
            <Feather name="x-circle" size={18} color={colors.danger} style={styles.cancellationIcon} />
            <Text style={[styles.cancellationTitle, { color: colors.danger }]}>Cancelled</Text>
          </View>

          {selectedClient?.cancellation_note && (
            <Text style={[styles.cancellationNote, { color: colors.danger + "CC" }]}>
              {selectedClient.cancellation_note}
            </Text>
          )}

          {selectedClient?.cancellation_reason && (
            <Text style={[styles.cancellationNote, { color: colors.danger + "CC" }]}>
              {selectedClient.cancellation_reason.name}
            </Text>
          )}
        </View>
      )}

      {/* Reservation details */}
      <View style={styles.detailsContainer}>
        <View style={styles.detailItem}>
          <Text style={[styles.detailLabel, { color: colors.text }]}>Made By</Text>
          <View style={[styles.detailValue, { backgroundColor: colors.card }]}>
            <Text style={{ color: colors.text }}>{selectedClient?.source || "N/A"}</Text>
          </View>
        </View>

        <View style={styles.detailItem}>
          <Text style={[styles.detailLabel, { color: colors.text }]}>Internal Note</Text>
          <View style={[styles.detailValue, { backgroundColor: colors.card }]}>
            <Text style={{ color: colors.text }}>{selectedClient?.internal_note || "No internal notes"}</Text>
          </View>
        </View>

        <View style={styles.detailItem}>
          <Text style={[styles.detailLabel, { color: colors.text }]}>Status</Text>
          <View style={[styles.detailValue, { backgroundColor: colors.card }]}>
            <Text style={{ color: colors.text }}>{getStatusLabel(selectedClient?.status || "")}</Text>
          </View>
        </View>

        <View style={styles.detailItem}>
          <Text style={[styles.detailLabel, { color: colors.text }]}>Occasion</Text>
          <View style={[styles.detailValue, { backgroundColor: colors.card }]}>
            <Text style={{ color: colors.text }}>
              {typeof selectedClient?.occasion === "object" ? selectedClient?.occasion?.name : "No occasion"}
            </Text>
          </View>
        </View>

        <View style={styles.detailItem}>
          <Text style={[styles.detailLabel, { color: colors.text }]}>Tables</Text>
          <View style={[styles.detailValue, { backgroundColor: colors.card }]}>
            <Text style={{ color: colors.text }}>
              {selectedClient?.tables?.map((t) => t.name).join(", ") || "No tables assigned"}
            </Text>
          </View>
        </View>
      </View>

      {/* Reservation date/time/guests */}
      <View style={[styles.dateTimeCard, { backgroundColor: colors.card }]}>
        <View style={styles.dateTimeItem}>
          <Feather name="calendar" size={16} color={colors.text} style={styles.dateTimeIcon} />
          <Text style={[styles.dateTimeText, { color: colors.text }]}>
            {reservationProgressData.reserveDate || "No date"}
          </Text>
        </View>

        <View style={styles.dateTimeItem}>
          <Feather name="clock" size={16} color={colors.text} style={styles.dateTimeIcon} />
          <Text style={[styles.dateTimeText, { color: colors.text }]}>{reservationProgressData.time || "No time"}</Text>
        </View>

        <View style={styles.dateTimeItem}>
          <Feather name="users" size={16} color={colors.text} style={styles.dateTimeIcon} />
          <Text style={[styles.dateTimeText, { color: colors.text }]}>
            {reservationProgressData.guests || 0} guests
          </Text>
        </View>
      </View>

      {/* Close button */}
      <TouchableOpacity style={[styles.closeButton, { backgroundColor: colors.primary }]} onPress={onClose}>
        <Text style={styles.closeButtonText}>Close</Text>
      </TouchableOpacity>
    </ScrollView>
  )

  // Render editable view
  const renderEditableView = () => (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
      keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
    >
      <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Edit Reservation</Text>
          <TouchableOpacity onPress={onClose}>
            <Feather name="x" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        <Text style={[styles.reservationId, { color: colors.subtext }]}>
          Reservation ID: {selectedClient?.seq_id || selectedClient?.id}
        </Text>

        {/* Tags */}
        {selectedClient?.tags?.length && <> 
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Tags</Text>
        <View style={styles.tagsContainer}>
          {selectedClient?.tags?.map((tag, index) => (
            <View key={index} style={[styles.tag, { backgroundColor: colors.success + "20" }]}>
              <Text style={[styles.tagText, { color: colors.success }]}>{tag}</Text>
            </View>
          ))}
        </View>
        </>
        }

        <Text style={[styles.cardTitle, { color: colors.text }]}>{selectedClient?.full_name}'s preferences</Text>
        {/* Client preferences */}
        <View style={[styles.preferencesCard, { backgroundColor: colors.card }]}>

          {/* Cancellation info if applicable */}
          {selectedClient?.status === "CANCELED" && (
            <View style={[styles.cancellationCard, { backgroundColor: colors.danger + "10" }]}>
              <View style={styles.cancellationHeader}>
                <Feather name="x-circle" size={18} color={colors.danger} style={styles.cancellationIcon} />
                <Text style={[styles.cancellationTitle, { color: colors.danger }]}>Cancelled</Text>
              </View>

              {selectedClient?.cancellation_note && (
                <Text style={[styles.cancellationNote, { color: colors.danger + "CC" }]}>
                  {selectedClient.cancellation_note}
                </Text>
              )}

              {selectedClient?.cancellation_reason && (
                <Text style={[styles.cancellationNote, { color: colors.danger + "CC" }]}>
                  {selectedClient.cancellation_reason.name}
                </Text>
              )}
            </View>
          )}

          <View style={styles.preferenceItem}>
            <Text style={[styles.preferenceLabel, { color: colors.subtext }]}>Allergies</Text>
            <Text style={[styles.preferenceValue, { color: colors.text }]}>{selectedClient?.allergies || "None"}</Text>
          </View>

          <View style={styles.preferenceItem}>
            <Text style={[styles.preferenceLabel, { color: colors.subtext }]}>Occasion</Text>
            <Text style={[styles.preferenceValue, { color: colors.text }]}>
              {typeof selectedClient?.occasion === "object" ? selectedClient?.occasion?.name : "None"}
            </Text>
          </View>

          <View style={styles.preferenceItem}>
            <Text style={[styles.preferenceLabel, { color: colors.subtext }]}>Comment</Text>
            <Text style={[styles.preferenceValue, { color: colors.text }]}>{selectedClient?.commenter || "None"}</Text>
          </View>
        </View>

        {/* Editable fields */}
        <View style={styles.formContainer}>
          {/* Source selection */}
          <View style={styles.formItem}>
            <Text style={[styles.formLabel, { color: colors.text }]}>Made By</Text>
            <TouchableOpacity
              style={[styles.selectButton, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => setShowSourceSelection(true)}
            >
              <Text style={{ color: colors.text }}>{selectedClient?.source || "Select source"}</Text>
              <Feather name="chevron-down" size={20} color={colors.text} />
            </TouchableOpacity>
          </View>

          {/* Internal note */}
          <View style={styles.formItem}>
            <Text style={[styles.formLabel, { color: colors.text }]}>Internal Note</Text>
            <TextInput
              value={selectedClient?.internal_note || ""}
              onChangeText={(text) => selectedClient && setSelectedClient({ ...selectedClient, internal_note: text })}
              style={[
                styles.textArea,
                {
                  backgroundColor: colors.card,
                  color: colors.text,
                  borderColor: colors.border,
                },
              ]}
              multiline
              numberOfLines={3}
              placeholder="Add internal notes here"
              placeholderTextColor={colors.subtext}
            />
          </View>

          {/* Status selection */}
          <View style={styles.formItem}>
            <Text style={[styles.formLabel, { color: colors.text }]}>Status</Text>
            <TouchableOpacity
              style={[styles.selectButton, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => setShowStatusSelection(true)}
            >
              <View style={styles.statusContainer}>
                <View
                  style={[styles.statusIndicator, { backgroundColor: getStatusColor(selectedClient?.status || "") }]}
                />
                <Text style={{ color: colors.text }}>{getStatusLabel(selectedClient?.status || "")}</Text>
              </View>
              <Feather name="chevron-down" size={20} color={colors.text} />
            </TouchableOpacity>
          </View>

          {/* Occasion selection */}
          <View style={styles.formItem}>
            <Text style={[styles.formLabel, { color: colors.text }]}>Occasion</Text>
            <TouchableOpacity
              style={[styles.selectButton, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => setShowOccasionSelection(true)}
            >
              <Text style={{ color: colors.text }}>
                {typeof selectedClient?.occasion === "object" && selectedClient?.occasion
                  ? selectedClient.occasion.name
                  : "Select occasion"}
              </Text>
              <Feather name="chevron-down" size={20} color={colors.text} />
            </TouchableOpacity>
          </View>

          {/* Table selection - only for APPROVED or SEATED status */}
          {(selectedClient?.status === "APPROVED" || selectedClient?.status === "SEATED") && (
            <View style={styles.formItem}>
              <Text style={[styles.formLabel, { color: colors.text }]}>Tables</Text>
              <TouchableOpacity
                style={[styles.selectButton, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => setShowTableSelection(true)}
              >
                <Text style={{ color: colors.text }}>
                  {selectedClient?.tables && selectedClient.tables.length > 0
                    ? selectedClient.tables.map((t) => t.name).join(", ")
                    : "Select tables"}
                </Text>
                <Feather name="chevron-down" size={20} color={colors.text} />
              </TouchableOpacity>
            </View>
          )}

          {/* Date/Time/Guests selection */}
          {/* Update the dateTimeButton TouchableOpacity onClick handler */}
          <TouchableOpacity
            style={[styles.dateTimeButton, { backgroundColor: colors.card }]}
            onPress={showReservationProcessModal}
          >
            <View style={styles.dateTimeItem}>
              <Feather name="calendar" size={16} color={colors.text} style={styles.dateTimeIcon} />
              <Text style={[styles.dateTimeText, { color: colors.text }]}>
                {reservationProgressData.reserveDate || "Date"}
              </Text>
            </View>

            <View style={styles.dateTimeItem}>
              <Feather name="clock" size={16} color={colors.text} style={styles.dateTimeIcon} />
              <Text style={[styles.dateTimeText, { color: colors.text }]}>
                {reservationProgressData.time || "Time"}
              </Text>
            </View>

            <View style={styles.dateTimeItem}>
              <Feather name="users" size={16} color={colors.text} style={styles.dateTimeIcon} />
              <Text style={[styles.dateTimeText, { color: colors.text }]}>
                {reservationProgressData.guests || 0} guests
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Action buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.cancelButton, { backgroundColor: colors.background, borderColor: colors.border }]}
            onPress={onClose}
          >
            <Text style={{ color: colors.text }}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.saveButton, { backgroundColor: colors.primary }]} onPress={handleSave}>
            <Text style={styles.saveButtonText}>Save</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )

  // Source selection modal
  const renderSourceSelectionModal = () => (
    <Modal visible={showSourceSelection} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContainer, { backgroundColor: colors.card }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Select Source</Text>
            <TouchableOpacity onPress={() => setShowSourceSelection(false)}>
              <Feather name="x" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {["MARKETPLACE", "WIDGET", "WEBSITE", "BACK_OFFICE", "WALK_IN"].map((source) => (
              <TouchableOpacity
                key={source}
                style={[
                  styles.modalOption,
                  selectedClient?.source === source && {
                    backgroundColor: colors.primary + "20",
                    borderColor: colors.primary,
                  },
                ]}
                onPress={() => {
                  if (selectedClient) {
                    setSelectedClient({ ...selectedClient, source: source as ReservationSource })
                    setShowSourceSelection(false)
                  }
                }}
              >
                <Text
                  style={{
                    color: selectedClient?.source === source ? colors.primary : colors.text,
                    fontWeight: selectedClient?.source === source ? "600" : "normal",
                  }}
                >
                  {source.replace(/_/g, " ")}
                </Text>
                {selectedClient?.source === source && <Feather name="check" size={20} color={colors.primary} />}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  )

  // Status selection modal
  const renderStatusSelectionModal = () => (
    <Modal visible={showStatusSelection} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContainer, { backgroundColor: colors.card }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Select Status</Text>
            <TouchableOpacity onPress={() => setShowStatusSelection(false)}>
              <Feather name="x" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {["PENDING", "APPROVED", "SEATED", "FULFILLED", "NO_SHOW", "CANCELED"].map((status) => (
              <TouchableOpacity
                key={status}
                style={[
                  styles.modalOption,
                  selectedClient?.status === status && {
                    backgroundColor: getStatusColor(status) + "20",
                    borderColor: getStatusColor(status),
                  },
                ]}
                onPress={() => {
                  if (selectedClient) {
                    setSelectedClient({ ...selectedClient, status: status as ReservationStatus })
                    setShowStatusSelection(false)
                  }
                }}
              >
                <View style={styles.statusContainer}>
                  <View style={[styles.statusIndicator, { backgroundColor: getStatusColor(status) }]} />
                  <Text
                    style={{
                      color: selectedClient?.status === status ? getStatusColor(status) : colors.text,
                      fontWeight: selectedClient?.status === status ? "600" : "normal",
                    }}
                  >
                    {getStatusLabel(status)}
                  </Text>
                </View>
                {selectedClient?.status === status && <Feather name="check" size={20} color={getStatusColor(status)} />}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  )

  // Occasion selection modal
  const renderOccasionSelectionModal = () => (
    <Modal visible={showOccasionSelection} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContainer, { backgroundColor: colors.card }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Select Occasion</Text>
            <TouchableOpacity onPress={() => setShowOccasionSelection(false)}>
              <Feather name="x" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <TouchableOpacity
              style={[
                styles.modalOption,
                selectedOccasion === null && {
                  backgroundColor: colors.primary + "20",
                  borderColor: colors.primary,
                },
              ]}
              onPress={() => {
                if (selectedClient) {
                  setSelectedOccasion(null)
                  setSelectedClient({ ...selectedClient, occasion: null })
                  setShowOccasionSelection(false)
                }
              }}
            >
              <Text
                style={{
                  color: selectedOccasion === null ? colors.primary : colors.text,
                  fontWeight: selectedOccasion === null ? "600" : "normal",
                }}
              >
                No Occasion
              </Text>
              {selectedOccasion === null && <Feather name="check" size={20} color={colors.primary} />}
            </TouchableOpacity>

            {occasions.map((occasion) => (
              <TouchableOpacity
                key={occasion.id}
                style={[
                  styles.modalOption,
                  selectedOccasion === occasion.id && {
                    backgroundColor: colors.primary + "20",
                    borderColor: colors.primary,
                  },
                ]}
                onPress={() => {
                  if (selectedClient) {
                    setSelectedOccasion(occasion.id)
                    setSelectedClient({ ...selectedClient, occasion: occasion })
                    setShowOccasionSelection(false)
                  }
                }}
              >
                <Text
                  style={{
                    color: selectedOccasion === occasion.id ? colors.primary : colors.text,
                    fontWeight: selectedOccasion === occasion.id ? "600" : "normal",
                  }}
                >
                  {occasion.name}
                </Text>
                {selectedOccasion === occasion.id && <Feather name="check" size={20} color={colors.primary} />}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  )

  // Table selection modal
  const renderTableSelectionModal = () => (
    <Modal visible={showTableSelection} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContainer, { backgroundColor: colors.card }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Select Tables</Text>
            <TouchableOpacity onPress={() => setShowTableSelection(false)}>
              <Feather name="x" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {availableTables.map((table) => (
              <TouchableOpacity
                key={table.id}
                style={[
                  styles.modalOption,
                  selectedTables.includes(table.id) && {
                    backgroundColor: colors.primary + "20",
                    borderColor: colors.primary,
                  },
                ]}
                onPress={() => {
                  if (selectedClient) {
                    let newSelectedTables: number[]

                    if (selectedTables.includes(table.id)) {
                      // Remove table if already selected
                      newSelectedTables = selectedTables.filter((id) => id !== table.id)
                    } else {
                      // Add table if not selected
                      newSelectedTables = [...selectedTables, table.id]
                    }

                    setSelectedTables(newSelectedTables)
                    setHasTable(newSelectedTables.length > 0)

                    // Update selected client with new tables
                    const newTables = availableTables.filter((t) => newSelectedTables.includes(t.id))
                    setSelectedClient({ ...selectedClient, tables: newTables })
                  }
                }}
              >
                <Text
                  style={{
                    color: selectedTables.includes(table.id) ? colors.primary : colors.text,
                    fontWeight: selectedTables.includes(table.id) ? "600" : "normal",
                  }}
                >
                  {table.name} {table.floor_name ? `(${table.floor_name})` : ""}
                </Text>
                {selectedTables.includes(table.id) && <Feather name="check" size={20} color={colors.primary} />}
              </TouchableOpacity>
            ))}
          </ScrollView>

          <TouchableOpacity
            style={[styles.confirmButton, { backgroundColor: colors.primary }]}
            onPress={() => setShowTableSelection(false)}
          >
            <Text style={styles.confirmButtonText}>Confirm Selection</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  )

  // Add a new function to render the ReservationProcess
  const renderReservationProcess = () => {
    // Only render the component when it's needed
    if (!showReservationProcess) return null

    return (
      <ReservationProcess
        isVisible={showReservationProcess}
        onClose={() => setShowReservationProcess(false)}
        initialData={{
          reserveDate: reservationProgressData.reserveDate,
          time: reservationProgressData.time,
          guests: reservationProgressData.guests,
        }}
        onComplete={(selectedData) => {
          setReservationProgressData({
            reserveDate: selectedData.reserveDate,
            time: selectedData.time,
            guests: selectedData.guests,
          })
          setShowReservationProcess(false)
        }}
      />
    )
  }

  // Confirmation popup
  const renderConfirmationPopup = () => (
    <Modal visible={showConfirmPopup} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={[styles.confirmationContainer, { backgroundColor: colors.card }]}>
          <Text style={[styles.confirmationTitle, { color: colors.text }]}>Confirm Update</Text>
          <Text style={[styles.confirmationMessage, { color: colors.subtext }]}>
            Are you sure you want to update this reservation?
          </Text>

          {/* Reservation summary card */}
          <View style={[styles.summaryCard, { backgroundColor: colors.background }]}>
            {/* Reservation ID and Name */}
            <View style={styles.summaryHeader}>
              <View style={styles.summaryNameContainer}>
                <Feather name="user" size={16} color={colors.text} style={styles.summaryIcon} />
                <Text style={[styles.summaryName, { color: colors.text }]}>{selectedClient?.full_name}</Text>
              </View>
              <Text style={[styles.summaryId, { color: colors.subtext, backgroundColor: colors.card }]}>
                #{selectedClient?.seq_id || selectedClient?.id}
              </Text>
            </View>

            {/* Date, Time, and Guests */}
            <View style={styles.summaryDetails}>
              <View style={styles.summaryDetailItem}>
                <Feather name="calendar" size={14} color={colors.text} style={styles.summaryDetailIcon} />
                <Text style={[styles.summaryDetailText, { color: colors.text }]}>
                  {reservationProgressData.reserveDate}
                </Text>
              </View>

              <View style={styles.summaryDetailItem}>
                <Feather name="clock" size={14} color={colors.text} style={styles.summaryDetailIcon} />
                <Text style={[styles.summaryDetailText, { color: colors.text }]}>{reservationProgressData.time}</Text>
              </View>

              <View style={styles.summaryDetailItem}>
                <Feather name="users" size={14} color={colors.text} style={styles.summaryDetailIcon} />
                <Text style={[styles.summaryDetailText, { color: colors.text }]}>{reservationProgressData.guests}</Text>
              </View>
            </View>

            {/* Tables */}
            {selectedClient?.tables && selectedClient.tables.length > 0 && (
              <View style={styles.summaryTables}>
                <Text style={[styles.summaryTablesLabel, { color: colors.subtext }]}>Tables: </Text>
                <Text style={[styles.summaryTablesValue, { color: colors.text }]}>
                  {selectedClient.tables.map((t) => t.name).join(", ")}
                </Text>
              </View>
            )}

            {/* Status */}
            <View style={styles.summaryStatus}>
              <Text style={[styles.summaryStatusLabel, { color: colors.subtext }]}>Status: </Text>
              <Text style={[styles.summaryStatusValue, { color: getStatusColor(selectedClient?.status || "") }]}>
                {getStatusLabel(selectedClient?.status || "")}
              </Text>
            </View>
          </View>

          <View style={styles.confirmationButtons}>
            <TouchableOpacity
              style={[styles.cancelConfirmButton, { backgroundColor: colors.background }]}
              onPress={() => setShowConfirmPopup(false)}
            >
              <Text style={{ color: colors.text }}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.confirmConfirmButton, { backgroundColor: colors.primary }]}
              onPress={confirmUpdate}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.confirmConfirmButtonText}>Confirm</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  )

  return (
    <Modal visible={isVisible} animationType="slide">
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        {/* Main content - either read-only or editable view */}
        {renderEditableView()}

        {/* Modals */}
        {renderSourceSelectionModal()}
        {renderStatusSelectionModal()}
        {renderOccasionSelectionModal()}
        {renderTableSelectionModal()}
        {/* Replace the renderDateTimePickerModal() call at the bottom of the component with renderReservationProcess() */}
        {renderReservationProcess()}
        {renderConfirmationPopup()}
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20, // Increased margin
  },
  title: {
    fontSize: 26, // Increased font size
    fontWeight: "bold",
  },
  reservationId: {
    fontSize: 14,
    marginBottom: 20, // Increased margin
    marginTop: -8, // Adjust if needed to bring closer to header or further from next element
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 16,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    fontSize: 12,
    fontWeight: "500",
  },
  preferencesCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 20, // Increased margin
  },
  cardTitle: {
    fontSize: 18, // Increased font size
    fontWeight: "bold", // Ensured bold
    marginBottom: 16, // Increased margin
  },
  preferenceItem: {
    marginBottom: 12,
  },
  preferenceLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  preferenceValue: {
    fontSize: 14,
    fontWeight: "500",
  },
  cancellationCard: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  cancellationHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  cancellationIcon: {
    marginRight: 8,
  },
  cancellationTitle: {
    fontSize: 14,
    fontWeight: "600",
  },
  cancellationNote: {
    fontSize: 12,
  },
  detailsContainer: {
    marginBottom: 16,
  },
  detailItem: {
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 4,
  },
  detailValue: {
    padding: 12,
    borderRadius: 8,
  },
  dateTimeCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  dateTimeItem: {
    alignItems: "center",
  },
  dateTimeIcon: {
    marginBottom: 4,
  },
  dateTimeText: {
    fontSize: 14,
  },
  closeButton: {
    height: 50,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  closeButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  formContainer: {
    marginBottom: 24,
  },
  formItem: {
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 8,
  },
  selectButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    height: 48,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    minHeight: 100,
    textAlignVertical: "top",
  },
  dateTimeButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: 8,
    marginTop: 8,
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
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
  saveButton: {
    flex: 1,
    height: 50,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
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
  modalOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "transparent",
  },
  confirmButton: {
    height: 50,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  confirmButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  pickerSection: {
    marginBottom: 16,
  },
  pickerLabel: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  pickerButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    borderRadius: 8,
  },
  guestPicker: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 8,
  },
  guestButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  guestCount: {
    fontSize: 20,
    fontWeight: "bold",
    marginHorizontal: 24,
  },
  confirmationContainer: {
    margin: 20,
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  confirmationTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 12,
  },
  confirmationMessage: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 20,
  },
  summaryCard: {
    width: "100%",
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  summaryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  summaryNameContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  summaryIcon: {
    marginRight: 8,
  },
  summaryName: {
    fontSize: 16,
    fontWeight: "600",
  },
  summaryId: {
    fontSize: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  summaryDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  summaryDetailItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  summaryDetailIcon: {
    marginRight: 4,
  },
  summaryDetailText: {
    fontSize: 14,
  },
  summaryTables: {
    flexDirection: "row",
    marginBottom: 8,
  },
  summaryTablesLabel: {
    fontSize: 14,
  },
  summaryTablesValue: {
    fontSize: 14,
  },
  summaryStatus: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  summaryStatusLabel: {
    fontSize: 14,
  },
  summaryStatusValue: {
    fontSize: 14,
    fontWeight: "600",
  },
  confirmationButtons: {
    flexDirection: "row",
    width: "100%",
    justifyContent: "space-between",
  },
  cancelConfirmButton: {
    flex: 1,
    height: 50,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  confirmConfirmButton: {
    flex: 1,
    height: 50,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  confirmConfirmButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
})

export default EditReservationModal

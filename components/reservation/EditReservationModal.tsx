"use client"

import type React from "react"
import { useState } from "react"
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native"
import { Feather } from "@expo/vector-icons"
import { useTheme } from "../../Context/ThemeContext"
import type { Reservation } from "../../app/(tabs)"

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

const EditReservationModal: React.FC<EditReservationModalProps> = ({
  isVisible,
  reservation,
  onClose,
  onSave,
  reservationProgressData,
  setReservationProgressData,
  isDarkMode,
}) => {
  const { colors } = useTheme()
  const [editedReservation, setEditedReservation] = useState<Reservation>({ ...reservation })

  const handleInputChange = (field: keyof Reservation, value: string) => {
    setEditedReservation((prev: Reservation) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleGuestsChange = (value: string) => {
    const numValue = Number.parseInt(value)
    if (!isNaN(numValue) && numValue > 0) {
      setReservationProgressData({
        ...reservationProgressData,
        guests: numValue,
      })
    }
  }

  const handleDateChange = (value: string) => {
    // Simple validation for YYYY-MM-DD format
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      setReservationProgressData({
        ...reservationProgressData,
        reserveDate: value,
      })
    }
  }

  const handleTimeChange = (value: string) => {
    // Simple validation for HH:MM format
    if (/^\d{2}:\d{2}$/.test(value)) {
      setReservationProgressData({
        ...reservationProgressData,
        time: value,
      })
    }
  }

  const handleSave = () => {
    onSave(editedReservation)
  }

  // Get status style
  const getStatusStyle = (status: string) => {
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

  const statusStyle = getStatusStyle(editedReservation.status)

  return (
    <Modal visible={isVisible} transparent={true} animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.keyboardAvoidingView}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.title, { color: colors.text }]}>Edit Reservation</Text>
              <TouchableOpacity onPress={onClose}>
                <Feather name="x" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent}>
              {/* Status Badge */}
              <View style={styles.statusContainer}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Status:</Text>
                <View style={[styles.statusBadge, { backgroundColor: statusStyle.backgroundColor }]}>
                  <Text style={[styles.statusText, { color: statusStyle.color }]}>
                    {getStatusLabel(editedReservation.status)}
                  </Text>
                </View>
              </View>

              {/* Customer Information */}
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Customer Information</Text>

                <View style={styles.inputGroup}>
                  <View style={styles.inputLabel}>
                    <Feather name="user" size={16} color={colors.text} />
                    <Text style={[styles.labelText, { color: colors.text }]}>Full Name</Text>
                  </View>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: colors.background,
                        color: colors.text,
                        borderColor: colors.border,
                      },
                    ]}
                    value={editedReservation.full_name}
                    onChangeText={(text) => handleInputChange("full_name", text)}
                    placeholder="Full Name"
                    placeholderTextColor={colors.text + "60"}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <View style={styles.inputLabel}>
                    <Feather name="mail" size={16} color={colors.text} />
                    <Text style={[styles.labelText, { color: colors.text }]}>Email</Text>
                  </View>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: colors.background,
                        color: colors.text,
                        borderColor: colors.border,
                      },
                    ]}
                    value={editedReservation.email}
                    onChangeText={(text) => handleInputChange("email", text)}
                    placeholder="Email"
                    placeholderTextColor={colors.text + "60"}
                    keyboardType="email-address"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <View style={styles.inputLabel}>
                    <Feather name="phone" size={16} color={colors.text} />
                    <Text style={[styles.labelText, { color: colors.text }]}>Phone</Text>
                  </View>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: colors.background,
                        color: colors.text,
                        borderColor: colors.border,
                      },
                    ]}
                    value={editedReservation.phone}
                    onChangeText={(text) => handleInputChange("phone", text)}
                    placeholder="Phone"
                    placeholderTextColor={colors.text + "60"}
                    keyboardType="phone-pad"
                  />
                </View>
              </View>

              {/* Reservation Details */}
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Reservation Details</Text>

                <View style={styles.inputGroup}>
                  <View style={styles.inputLabel}>
                    <Feather name="calendar" size={16} color={colors.text} />
                    <Text style={[styles.labelText, { color: colors.text }]}>Date</Text>
                  </View>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: colors.background,
                        color: colors.text,
                        borderColor: colors.border,
                      },
                    ]}
                    value={reservationProgressData.reserveDate}
                    onChangeText={handleDateChange}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={colors.text + "60"}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <View style={styles.inputLabel}>
                    <Feather name="clock" size={16} color={colors.text} />
                    <Text style={[styles.labelText, { color: colors.text }]}>Time</Text>
                  </View>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: colors.background,
                        color: colors.text,
                        borderColor: colors.border,
                      },
                    ]}
                    value={reservationProgressData.time}
                    onChangeText={handleTimeChange}
                    placeholder="HH:MM"
                    placeholderTextColor={colors.text + "60"}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <View style={styles.inputLabel}>
                    <Feather name="users" size={16} color={colors.text} />
                    <Text style={[styles.labelText, { color: colors.text }]}>Guests</Text>
                  </View>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: colors.background,
                        color: colors.text,
                        borderColor: colors.border,
                      },
                    ]}
                    value={reservationProgressData.guests.toString()}
                    onChangeText={handleGuestsChange}
                    placeholder="Number of guests"
                    placeholderTextColor={colors.text + "60"}
                    keyboardType="number-pad"
                  />
                </View>

                {/* Tables */}
                {editedReservation.tables && editedReservation.tables.length > 0 && (
                  <View style={styles.inputGroup}>
                    <View style={styles.inputLabel}>
                      <Feather name="tag" size={16} color={colors.text} />
                      <Text style={[styles.labelText, { color: colors.text }]}>Tables</Text>
                    </View>
                    <View
                      style={[
                        styles.tablesContainer,
                        {
                          backgroundColor: colors.background,
                          borderColor: colors.border,
                        },
                      ]}
                    >
                      {editedReservation.tables.map((table: { name: string }, index: number) => (
                        <View key={index} style={styles.tableChip}>
                          <Text style={{ color: colors.primary }}>{table.name}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {/* Internal Note */}
                <View style={styles.inputGroup}>
                  <View style={styles.inputLabel}>
                    <Feather name="message-square" size={16} color={colors.text} />
                    <Text style={[styles.labelText, { color: colors.text }]}>Internal Note</Text>
                  </View>
                  <TextInput
                    style={[
                      styles.input,
                      styles.textArea,
                      {
                        backgroundColor: colors.background,
                        color: colors.text,
                        borderColor: colors.border,
                      },
                    ]}
                    value={editedReservation.internal_note}
                    onChangeText={(text) => handleInputChange("internal_note", text)}
                    placeholder="Add internal notes here..."
                    placeholderTextColor={colors.text + "60"}
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                  />
                </View>
              </View>
            </ScrollView>

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton, { borderColor: colors.border }]}
                onPress={onClose}
              >
                <Text style={{ color: colors.text }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.saveButton, { backgroundColor: colors.primary }]}
                onPress={handleSave}
              >
                <Text style={styles.saveButtonText}>Save Changes</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  )
}

const styles = StyleSheet.create({
  keyboardAvoidingView: {
    flex: 1,
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
    maxHeight: "90%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
  },
  modalContent: {
    flex: 1,
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
    marginLeft: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "500",
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  labelText: {
    marginLeft: 8,
    fontSize: 14,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  textArea: {
    minHeight: 100,
    paddingTop: 12,
  },
  tablesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    borderWidth: 1,
    borderRadius: 8,
    padding: 8,
  },
  tableChip: {
    backgroundColor: "#E6F9F1",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 8,
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
  saveButton: {
    marginLeft: 8,
  },
  saveButtonText: {
    color: "white",
    fontWeight: "600",
  },
})

export default EditReservationModal

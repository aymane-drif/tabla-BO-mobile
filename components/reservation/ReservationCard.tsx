"use client"

import type React from "react"
import { View, Text, StyleSheet, TouchableOpacity } from "react-native"
import { Feather } from "@expo/vector-icons"
import { useTheme } from "../../Context/ThemeContext"
import type { Reservation } from "../../app/(tabs)/ReservationsScreen"

interface ReservationCardProps {
  reservation: Reservation
  onEdit: () => void
  onStatusChange: (id: string) => void
  onDelete: () => void
  onReview: () => void
  isDarkMode: boolean
}

const ReservationCard: React.FC<ReservationCardProps> = ({
  reservation,
  onEdit,
  onStatusChange,
  onDelete,
  onReview,
  isDarkMode,
}) => {
  const { colors } = useTheme()

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

  const statusStyle = getStatusStyle(reservation.status)

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
        },
      ]}
    >
      {/* Header with name and status */}
      <View style={styles.header}>
        <View style={styles.nameContainer}>
          <Feather name="user" size={16} color={colors.text} style={styles.icon} />
          <Text style={[styles.name, { color: colors.text }]}>{reservation.full_name}</Text>
        </View>
        <TouchableOpacity
          style={[styles.statusBadge, { backgroundColor: statusStyle.backgroundColor }]}
          onPress={() => onStatusChange(reservation.id)}
        >
          <Text style={[styles.statusText, { color: statusStyle.color }]}>{getStatusLabel(reservation.status)}</Text>
        </TouchableOpacity>
      </View>

      {/* Reservation details */}
      <View style={styles.detailsContainer}>
        <View style={styles.detailRow}>
          <View style={styles.detailItem}>
            <Feather name="calendar" size={16} color={colors.text} style={styles.icon} />
            <Text style={[styles.detailText, { color: colors.text }]}>{reservation.date}</Text>
          </View>
          <View style={styles.detailItem}>
            <Feather name="clock" size={16} color={colors.text} style={styles.icon} />
            <Text style={[styles.detailText, { color: colors.text }]}>{reservation.time.slice(0, 5)}</Text>
          </View>
          <View style={styles.detailItem}>
            <Feather name="users" size={16} color={colors.text} style={styles.icon} />
            <Text style={[styles.detailText, { color: colors.text }]}>{reservation.number_of_guests}</Text>
          </View>
        </View>

        {/* Contact info */}
        {(reservation.email || reservation.phone) && (
          <View style={styles.contactContainer}>
            {reservation.email && (
              <View style={styles.contactItem}>
                <Feather name="mail" size={14} color={colors.text + "80"} style={styles.icon} />
                <Text style={[styles.contactText, { color: colors.text + "80" }]}>{reservation.email}</Text>
              </View>
            )}
            {reservation.phone && (
              <View style={styles.contactItem}>
                <Feather name="phone" size={14} color={colors.text + "80"} style={styles.icon} />
                <Text style={[styles.contactText, { color: colors.text + "80" }]}>{reservation.phone}</Text>
              </View>
            )}
          </View>
        )}

        {/* Tables */}
        {reservation.tables && reservation.tables.length > 0 && (
          <View style={styles.tablesContainer}>
            <Text style={[styles.tablesLabel, { color: colors.text + "80" }]}>Tables:</Text>
            <Text style={[styles.tablesText, { color: colors.text }]}>
              {reservation.tables.map((table) => table.name).join(", ")}
            </Text>
          </View>
        )}

        {/* Internal note */}
        {reservation.internal_note && (
          <View style={styles.noteContainer}>
            <Feather name="message-square" size={14} color={colors.text + "80"} style={styles.icon} />
            <Text style={[styles.noteText, { color: colors.text + "80" }]}>{reservation.internal_note}</Text>
          </View>
        )}

        {/* Tags */}
        {reservation.tags && reservation.tags.length > 0 && (
          <View style={styles.tagsContainer}>
            <Feather name="tag" size={14} color={colors.text + "80"} style={styles.icon} />
            <View style={styles.tagsList}>
              {reservation.tags.map((tag, index) => (
                <View key={index} style={[styles.tagChip, { backgroundColor: "#E6F9F1" }]}>
                  <Text style={{ color: "#00B368" }}>{tag}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Reservation ID */}
        {reservation.seq_id && (
          <Text style={[styles.reservationId, { color: colors.text + "60" }]}>#{reservation.seq_id}</Text>
        )}
      </View>

      {/* Actions */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.background }]} onPress={onEdit}>
          <Feather name="edit" size={18} color={colors.text} />
        </TouchableOpacity>

        {reservation.status === "SEATED" && (
          <TouchableOpacity style={[styles.actionButton, { backgroundColor: "#E6F9F1" }]} onPress={onReview}>
            <Feather name="send" size={18} color="#00B368" />
          </TouchableOpacity>
        )}

        <TouchableOpacity style={[styles.actionButton, { backgroundColor: "#FFE6E6" }]} onPress={onDelete}>
          <Feather name="trash-2" size={18} color="#FF3333" />
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    marginBottom: 16,
    padding: 16,
    borderWidth: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  nameContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  name: {
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "500",
  },
  detailsContainer: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: "row",
    marginBottom: 8,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 16,
  },
  detailText: {
    fontSize: 14,
    marginLeft: 6,
  },
  contactContainer: {
    marginBottom: 8,
  },
  contactItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  contactText: {
    fontSize: 13,
    marginLeft: 6,
  },
  tablesContainer: {
    flexDirection: "row",
    marginBottom: 8,
  },
  tablesLabel: {
    fontSize: 13,
    marginRight: 4,
  },
  tablesText: {
    fontSize: 13,
    fontWeight: "500",
  },
  noteContainer: {
    flexDirection: "row",
    marginBottom: 8,
  },
  noteText: {
    fontSize: 13,
    marginLeft: 6,
    flex: 1,
  },
  tagsContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  tagsList: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginLeft: 6,
  },
  tagChip: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginRight: 4,
    marginBottom: 4,
  },
  reservationId: {
    fontSize: 12,
  },
  actionsContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  icon: {
    marginRight: 4,
  },
})

export default ReservationCard

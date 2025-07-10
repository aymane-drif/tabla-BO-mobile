"use client"

import type React from "react"
import { View, Text, StyleSheet, TouchableOpacity } from "react-native"
import { Feather } from "@expo/vector-icons"
import { useTheme } from "../../Context/ThemeContext"
import type { Reservation } from "../../app/(tabs)"
import { useTranslation } from "react-i18next"

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
  const { colors } = useTheme();
  const { t } = useTranslation();

  // Get status style
  const getStatusStyle = (status: string) => {
    switch (status) {
      case "PENDING":
        return { backgroundColor: "#3F72AF1A", color: "#3F72AF" }
      case "APPROVED":
        return { backgroundColor: "#88AB611A", color: "#88AB61" }
      case "SEATED":
        return { backgroundColor: "#F093001A", color: "#F09300" }
      case "FULFILLED":
        return { backgroundColor: "#7b2cbf1A", color: "#7b2cbf" }
      case "NO_SHOW":
        return { backgroundColor: "#b75d691A", color: "#b75d69" }
      default: // CANCELED
        return { backgroundColor: "#FF4B4B1A", color: "#FF4B4B" }
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
          <Text style={[styles.statusText, { color: statusStyle.color }]}>{getStatusLabel(reservation.status, t)}</Text>
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
          {/* Reservation ID */}
          {/* <View style={styles.detailItem}>
            {reservation.seq_id && (
              <Text style={[styles.reservationId, { color: colors.text + "60" }]}>#{reservation.seq_id}</Text>
            )}
          </View> */}
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
            <Text style={[styles.tablesLabel, { color: colors.text + "80" }]}>{t('tables')}:</Text>
            <Text style={[styles.tablesText, { color: colors.text, flexWrap: "wrap"}]}>
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
                <View key={index} style={[styles.tagChip, { backgroundColor: "#88AB611A" }]}>
                  <Text style={{ color: "#88AB61", fontSize: 12, fontWeight: 'bold' }}>{tag}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </View>

      {/* Actions */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.background }]} onPress={onEdit}>
          <Feather name="edit" size={18} color={colors.text} />
        </TouchableOpacity>

        {reservation.status === "SEATED" && (
          <TouchableOpacity style={[styles.actionButton, { backgroundColor: "#88AB611A" }]} onPress={onReview}>
            <Feather name="send" size={18} color="#88AB61" />
          </TouchableOpacity>
        )}

        <TouchableOpacity style={[styles.actionButton, { backgroundColor: "#FF4B4B1A" }]} onPress={onDelete}>
          <Feather name="trash-2" size={18} color="#FF4B4B" />
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    marginBottom: 8,
    padding: 10,
    borderWidth: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  nameContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  name: {
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 6,
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
    // marginBottom: ,
  },
  detailRow: {
    flexDirection: "row",
    marginBottom: 6,
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
    
  },
  contactItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  contactText: {
    fontSize: 13,
    marginLeft: 6,
  },
  tablesContainer: {
    flexDirection: "row",
    marginBottom: 6,
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
    marginBottom: 6,
  },
  noteText: {
    fontSize: 13,
    marginLeft: 6,
    marginTop: -4,
    flex: 1,
  },
  tagsContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    flexWrap: "wrap",
    marginTop: 4,
    marginBottom: 6,
  },
  tagsList: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginLeft: 6,
  },
  tagChip: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 12,
    marginRight: 4,
    marginTop: -2,
  },
  reservationId: {
    fontSize: 12,
  },
  actionsContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
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

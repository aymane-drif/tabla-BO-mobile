"use client"

import type React from "react"
import { View, Text, StyleSheet, Modal, TouchableOpacity } from "react-native"
import { Feather } from "@expo/vector-icons"
import { useTheme } from "../../Context/ThemeContext"

interface ActionConfirmationProps {
  isVisible: boolean
  title: string
  message: string
  confirmText: string
  cancelText: string
  onConfirm: () => void
  onCancel: () => void
  isDangerous?: boolean
  isDarkMode: boolean
}

const ActionConfirmation: React.FC<ActionConfirmationProps> = ({
  isVisible,
  title,
  message,
  confirmText,
  cancelText,
  onConfirm,
  onCancel,
  isDangerous = false,
  isDarkMode,
}) => {
  const { colors } = useTheme()

  return (
    <Modal visible={isVisible} transparent={true} animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContainer, { backgroundColor: colors.card }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
            <TouchableOpacity onPress={onCancel}>
              <Feather name="x" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          {isDangerous && (
            <View style={styles.warningContainer}>
              <Feather name="alert-triangle" size={24} color="#FF3333" />
            </View>
          )}

          <Text style={[styles.message, { color: colors.text }]}>{message}</Text>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton, { borderColor: colors.border }]}
              onPress={onCancel}
            >
              <Text style={{ color: colors.text }}>{cancelText}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.button,
                styles.confirmButton,
                { backgroundColor: isDangerous ? "#FF3333" : colors.primary },
              ]}
              onPress={onConfirm}
            >
              <Text style={styles.confirmButtonText}>{confirmText}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  modalContainer: {
    width: "100%",
    maxWidth: 400,
    borderRadius: 12,
    padding: 16,
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
  warningContainer: {
    alignItems: "center",
    marginBottom: 16,
  },
  message: {
    fontSize: 16,
    marginBottom: 24,
    lineHeight: 22,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
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
  confirmButton: {
    marginLeft: 8,
  },
  confirmButtonText: {
    color: "white",
    fontWeight: "600",
  },
})

export default ActionConfirmation

"use client"

import { StatusBar } from "expo-status-bar"
import { Platform, StyleSheet, TouchableOpacity, Modal, TextInput, Alert } from "react-native"
import { useState } from "react"
import { useRouter } from "expo-router"
import { Feather } from "@expo/vector-icons"
import { api } from "../api/axiosInstance"

import { Text, View } from "@/components/Themed"
import { useAuth } from "@/Context/AuthContext"
import { useTheme } from "@/Context/ThemeContext"

// Change Password Component
function ChangePasswordModal({
  visible,
  onClose,
  colors,
}: {
  visible: boolean
  onClose: () => void
  colors: any
}) {
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)

  // Password visibility states
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert("Error", "Please fill in all fields")
      return
    }

    if (newPassword !== confirmPassword) {
      Alert.alert("Error", "New passwords do not match")
      return
    }

    if (newPassword.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters long")
      return
    }

    setLoading(true)
    try {
      const response = await api.post("/api/v1/auth/password/change/", {
        old_password: currentPassword,
        new_password1: newPassword,
        new_password2: confirmPassword,
      })

      if (response.status === 200 || response.status === 201) {
        setCurrentPassword("")
        setNewPassword("")
        setConfirmPassword("")
        onClose()
      }
    } catch (error: any) {
      console.error("Password change error:", error)

      // Handle axios error responses
      if (error.response?.data) {
        const errorData = error.response.data
        const errorMessage =
          errorData.detail ||
          errorData.old_password?.[0] ||
          errorData.new_password1?.[0] ||
          errorData.new_password2?.[0] ||
          errorData.non_field_errors?.[0] ||
          "Failed to change password"
        Alert.alert("Error", errorMessage)
      } else if (error.request) {
        // Network error
        Alert.alert("Error", "Network error. Please check your connection and try again.")
      } else {
        // Other error
        Alert.alert("Error", "An unexpected error occurred. Please try again.")
      }
    } finally {
      setLoading(false)
    }
  }

  const resetModal = () => {
    setCurrentPassword("")
    setNewPassword("")
    setConfirmPassword("")
    setShowCurrentPassword(false)
    setShowNewPassword(false)
    setShowConfirmPassword(false)
    onClose()
  }

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
          <Text style={[styles.modalTitle, { color: colors.text }]}>Change Password</Text>

          {/* Current Password Input */}
          <View style={styles.inputContainer}>
            <TextInput
              style={[
                styles.input,
                styles.inputWithIcon,
                { backgroundColor: colors.background, color: colors.text, borderColor: colors.border },
              ]}
              placeholder="Current Password"
              placeholderTextColor={colors.subtext}
              secureTextEntry={!showCurrentPassword}
              value={currentPassword}
              onChangeText={setCurrentPassword}
              editable={!loading}
            />
            <TouchableOpacity style={styles.eyeIcon} onPress={() => setShowCurrentPassword(!showCurrentPassword)}>
              <Feather name={showCurrentPassword ? "eye-off" : "eye"} size={20} color={colors.subtext} />
            </TouchableOpacity>
          </View>

          {/* New Password Input */}
          <View style={styles.inputContainer}>
            <TextInput
              style={[
                styles.input,
                styles.inputWithIcon,
                { backgroundColor: colors.background, color: colors.text, borderColor: colors.border },
              ]}
              placeholder="New Password"
              placeholderTextColor={colors.subtext}
              secureTextEntry={!showNewPassword}
              value={newPassword}
              onChangeText={setNewPassword}
              editable={!loading}
            />
            <TouchableOpacity style={styles.eyeIcon} onPress={() => setShowNewPassword(!showNewPassword)}>
              <Feather name={showNewPassword ? "eye-off" : "eye"} size={20} color={colors.subtext} />
            </TouchableOpacity>
          </View>

          {/* Confirm Password Input */}
          <View style={styles.inputContainer}>
            <TextInput
              style={[
                styles.input,
                styles.inputWithIcon,
                { backgroundColor: colors.background, color: colors.text, borderColor: colors.border },
              ]}
              placeholder="Confirm New Password"
              placeholderTextColor={colors.subtext}
              secureTextEntry={!showConfirmPassword}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              editable={!loading}
            />
            <TouchableOpacity style={styles.eyeIcon} onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
              <Feather name={showConfirmPassword ? "eye-off" : "eye"} size={20} color={colors.subtext} />
            </TouchableOpacity>
          </View>

          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[
                styles.modalButton,
                styles.cancelButton,
                { backgroundColor: colors.border, opacity: loading ? 0.6 : 1 },
              ]}
              onPress={resetModal}
              disabled={loading}
            >
              <Text style={[styles.modalButtonText, { color: colors.text }]}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.modalButton,
                styles.confirmButton,
                { backgroundColor: colors.success, opacity: loading ? 0.6 : 1 },
              ]}
              onPress={handleChangePassword}
              disabled={loading}
            >
              {loading ? (
                <View style={styles.loadingContainer}>
                  <Text style={[styles.modalButtonText, { color: colors.white }]}>Changing...</Text>
                </View>
              ) : (
                <Text style={[styles.modalButtonText, { color: colors.white }]}>Change Password</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  )
}

export default function ModalScreen() {
  const { logout } = useAuth()
  const { colors } = useTheme()
  const router = useRouter()
  const [showPasswordModal, setShowPasswordModal] = useState(false)

  const handleLogout = async () => {
    await logout()
  }

  const handleChangeRestaurant = () => {
    router.push("/select-restaurant")
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>Profile</Text>
      <View style={[styles.separator, { backgroundColor: colors.border }]} />

      {/* Profile Actions */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.primary }]}
          onPress={() => setShowPasswordModal(true)}
        >
          <Feather name="lock" size={20} color={colors.white} />
          <Text style={[styles.actionButtonText, { color: colors.white }]}>Change Password</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.primary }]}
          onPress={handleChangeRestaurant}
        >
          <Feather name="home" size={20} color={colors.white} />
          <Text style={[styles.actionButtonText, { color: colors.white }]}>Change Restaurant</Text>
        </TouchableOpacity>
      </View>

      {/* Logout Button */}
      <TouchableOpacity style={[styles.logoutButton, { backgroundColor: colors.danger }]} onPress={handleLogout}>
        <Feather name="log-out" size={20} color={colors.white} />
        <Text style={[styles.logoutButtonText, { color: colors.white }]}>Logout</Text>
      </TouchableOpacity>

      {/* Change Password Modal */}
      <ChangePasswordModal visible={showPasswordModal} onClose={() => setShowPasswordModal(false)} colors={colors} />

      <StatusBar style={Platform.OS === "ios" ? "light" : "auto"} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
  },
  separator: {
    marginVertical: 30,
    height: 1,
    width: "80%",
  },
  actionsContainer: {
    backgroundColor: "transparent",
    flexDirection: "row",
    width: "100%",
    marginBottom: 40,
    gap: 12,
    paddingHorizontal: 10,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    gap: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
    flexShrink: 1,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    marginTop: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: "bold",
  },
  // Modal Styles for Change Password
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    width: "100%",
    maxWidth: 400,
    borderRadius: 12,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  inputContainer: {
    position: "relative",
    marginBottom: 15,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  inputWithIcon: {
    paddingRight: 50,
  },
  eyeIcon: {
    position: "absolute",
    right: 15,
    top: "50%",
    transform: [{ translateY: -10 }],
    padding: 5,
  },
  modalButtons: {
    flexDirection: "row",
    backgroundColor: "transparent",
    justifyContent: "space-between",
    marginTop: 20,
    gap: 10,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  cancelButton: {
    // Additional styles for cancel button if needed
  },
  confirmButton: {
    // Additional styles for confirm button if needed
  },
  modalButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
})

"use client"

import { StatusBar } from "expo-status-bar"
import { Platform, StyleSheet, TouchableOpacity, Modal, TextInput, Alert, ActivityIndicator } from "react-native"
import { useState } from "react"
import { useRouter } from "expo-router"
import { Feather } from "@expo/vector-icons"
import { api } from "../api/axiosInstance"
import { useTranslation } from "react-i18next"

import { Text, View } from "@/components/Themed"
import { useAuth } from "@/Context/AuthContext"
import { useTheme } from "@/Context/ThemeContext"
import LanguageSelector from "@/components/LanguageSelector"

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
  const { t } = useTranslation()
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
      Alert.alert(t("error"), t("pleaseFillAllFields"))
      return
    }

    if (newPassword !== confirmPassword) {
      Alert.alert(t("error"), t("newPasswordsDoNotMatch"))
      return
    }

    if (newPassword.length < 6) {
      Alert.alert(t("error"), t("passwordTooShort"))
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
          t("failedToChangePassword")
        Alert.alert(t("error"), errorMessage)
      } else if (error.request) {
        // Network error
        Alert.alert(t("error"), t("networkError"))
      } else {
        // Other error
        Alert.alert(t("error"), t("unexpectedError"))
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
          <Text style={[styles.modalTitle, { color: colors.text }]}>{t("changePassword")}</Text>

          {/* Current Password Input */}
          <View style={styles.inputContainer}>
            <TextInput
              style={[
                styles.input,
                styles.inputWithIcon,
                { backgroundColor: colors.background, color: colors.text, borderColor: colors.border },
              ]}
              placeholder={t("currentPassword")}
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
              placeholder={t("newPassword")}
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
              placeholder={t("confirmNewPassword")}
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
              <Text style={[styles.modalButtonText, { color: colors.text }]}>{t("cancel")}</Text>
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
                  <Text style={[styles.modalButtonText, { color: colors.white }]}>{t("changing")}</Text>
                </View>
              ) : (
                <Text style={[styles.modalButtonText, { color: colors.white }]}>{t("changePassword")}</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  )
}

export default function ModalScreen() {
  const { logout, isLoading } = useAuth()
  const { colors } = useTheme()
  const { t } = useTranslation()
  const router = useRouter()
  const [showPasswordModal, setShowPasswordModal] = useState(false)

  const handleLogout = async () => {
    console.log("Logging out...")
    await logout()
  }

  const handleChangeRestaurant = () => {
    router.push("/select-restaurant")
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Profile Actions List */}
      <View style={[styles.actionsListContainer, { backgroundColor: colors.card }]}>
        <TouchableOpacity
          style={[styles.actionListItem, { borderBottomColor: colors.border }]}
          onPress={() => setShowPasswordModal(true)}
        >
          <View style={[styles.actionIconContainer, { backgroundColor: colors.primary + '20' }]}>
            <Feather name="lock" size={20} color={colors.primary} />
          </View>
          <Text style={[styles.actionListItemText, { color: colors.text }]}>{t("changePassword")}</Text>
          <Feather name="chevron-right" size={20} color={colors.subtext} />
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.actionListItem}
          onPress={handleChangeRestaurant}
        >
          <View style={[styles.actionIconContainer, { backgroundColor: colors.primary + '20' }]}>
            <Feather name="home" size={20} color={colors.primary} />
          </View>
          <Text style={[styles.actionListItemText, { color: colors.text }]}>{t("changeRestaurant")}</Text>
          <Feather name="chevron-right" size={20} color={colors.subtext} />
        </TouchableOpacity>
      </View>

      {/* Language Selection */}
      <View style={[styles.actionsListContainer, { backgroundColor: colors.card, marginTop: 20 }]}>
        <LanguageSelector/>
      </View>

      {/* Logout Button - Fixed at bottom */}
      <View style={styles.footerContainer}>
        <TouchableOpacity 
          style={[styles.logoutButton, { backgroundColor: colors.danger + '15' }]} 
          onPress={handleLogout}
        >
          {
            isLoading? <ActivityIndicator color={colors.danger} /> :
            <>
            <Feather name="log-out" size={20} color={colors.danger} />
            <Text style={[styles.logoutButtonText, { color: colors.danger }]}>{t("logout")}</Text>
            </>
          }
        </TouchableOpacity>
      </View>

      {/* Change Password Modal */}
      <ChangePasswordModal visible={showPasswordModal} onClose={() => setShowPasswordModal(false)} colors={colors} />

      <StatusBar style={Platform.OS === "ios" ? "light" : "auto"} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 0,
  },
  header: {
    width: '100%',
    paddingVertical: 20,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
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
  actionsListContainer: {
    borderRadius: 10,
    overflow: 'hidden',
    marginHorizontal: 20,
    width: 'auto',
  },
  actionListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  actionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  actionListItemText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
  footerContainer: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 10,
    gap: 10,
    width: '80%',
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: "600",
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

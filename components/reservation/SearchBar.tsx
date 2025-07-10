"use client"

import type React from "react"
import { useState } from "react"
import { View, TextInput, StyleSheet, TouchableOpacity } from "react-native"
import { Feather } from "@expo/vector-icons"
import { useTheme } from "../../Context/ThemeContext"
import { useTranslation } from "react-i18next"

interface SearchBarProps {
  onSearch: (text: string) => void
  isDarkMode: boolean
}

const SearchBar: React.FC<SearchBarProps> = ({ onSearch, isDarkMode }) => {
  const [searchText, setSearchText] = useState("")
  const { colors } = useTheme()
  const { t } = useTranslation()

  const handleClear = () => {
    setSearchText("")
    onSearch("")
  }

  const handleChangeText = (text: string) => {
    setSearchText(text)
    onSearch(text)
  }

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
      <Feather name="search" size={20} color={colors.text} style={styles.icon} />
      <TextInput
        style={[styles.input, { color: colors.text }]}
        placeholder={t("searchReservations")}
        placeholderTextColor={colors.text + "80"}
        value={searchText}
        onChangeText={handleChangeText}
      />
      {searchText.length > 0 && (
        <TouchableOpacity onPress={handleClear} style={styles.clearButton}>
          <Feather name="x" size={18} color={colors.text} />
        </TouchableOpacity>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 48,
  },
  icon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    height: "100%",
    fontSize: 16,
  },
  clearButton: {
    padding: 4,
  },
})

export default SearchBar

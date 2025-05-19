"use client"

import type React from "react"
import { View, Text, TouchableOpacity, StyleSheet } from "react-native"
import { Feather } from "@expo/vector-icons"
import { useTheme } from "../../Context/ThemeContext"

interface PaginationProps {
  setPage: (page: number) => void
  currentPage: number
  totalItems: number
  itemsPerPage: number
  isDarkMode: boolean
}

const Pagination: React.FC<PaginationProps> = ({ setPage, currentPage, totalItems, itemsPerPage, isDarkMode }) => {
  const { colors } = useTheme()

  const totalPages = Math.ceil(totalItems / itemsPerPage)

  const handlePrevious = () => {
    if (currentPage > 1) {
      setPage(currentPage - 1)
    }
  }

  const handleNext = () => {
    if (currentPage < totalPages) {
      setPage(currentPage + 1)
    }
  }

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages = []
    const maxPagesToShow = 5

    if (totalPages <= maxPagesToShow) {
      // Show all pages if there are few
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      // Always show first page
      pages.push(1)

      // Calculate start and end of page range
      let start = Math.max(2, currentPage - 1)
      let end = Math.min(totalPages - 1, currentPage + 1)

      // Adjust if at the beginning
      if (currentPage <= 2) {
        end = 4
      }

      // Adjust if at the end
      if (currentPage >= totalPages - 1) {
        start = totalPages - 3
      }

      // Add ellipsis if needed
      if (start > 2) {
        pages.push("...")
      }

      // Add middle pages
      for (let i = start; i <= end; i++) {
        pages.push(i)
      }

      // Add ellipsis if needed
      if (end < totalPages - 1) {
        pages.push("...")
      }

      // Always show last page
      pages.push(totalPages)
    }

    return pages
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPress={handlePrevious}
        disabled={currentPage === 1}
        style={[
          styles.arrowButton,
          {
            backgroundColor: colors.card,
            opacity: currentPage === 1 ? 0.5 : 1,
          },
        ]}
      >
        <Feather name="chevron-left" size={20} color={colors.text} />
      </TouchableOpacity>

      <View style={styles.pagesContainer}>
        {getPageNumbers().map((page, index) => (
          <TouchableOpacity
            key={index}
            onPress={() => (typeof page === "number" ? setPage(page) : null)}
            disabled={typeof page !== "number"}
            style={[
              styles.pageButton,
              {
                backgroundColor: currentPage === page ? colors.primary : colors.card,
              },
            ]}
          >
            <Text
              style={{
                color: currentPage === page ? "#fff" : colors.text,
                fontWeight: currentPage === page ? "600" : "normal",
              }}
            >
              {page}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        onPress={handleNext}
        disabled={currentPage === totalPages}
        style={[
          styles.arrowButton,
          {
            backgroundColor: colors.card,
            opacity: currentPage === totalPages ? 0.5 : 1,
          },
        ]}
      >
        <Feather name="chevron-right" size={20} color={colors.text} />
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  arrowButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  pagesContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 8,
  },
  pageButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 4,
  },
})

export default Pagination

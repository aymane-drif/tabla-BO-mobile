"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { View, Text, StyleSheet, Modal, TouchableOpacity, Switch } from "react-native"
import { Feather } from "@expo/vector-icons"
import { useTheme } from "../../Context/ThemeContext"
import DraggableFlatList, { type RenderItemParams, ScaleDecorator } from "react-native-draggable-flatlist"

interface ColumnConfig {
  id: string
  labelKey: string
  visible: boolean
  order: number
}

interface ColumnCustomizationModalProps {
  isVisible: boolean
  onClose: () => void
  columns: ColumnConfig[]
  onSave: (columns: ColumnConfig[]) => void
  isDarkMode: boolean
}

const ColumnCustomizationModal: React.FC<ColumnCustomizationModalProps> = ({
  isVisible,
  onClose,
  columns,
  onSave,
  isDarkMode,
}) => {
  const { colors } = useTheme()
  const [localColumns, setLocalColumns] = useState<ColumnConfig[]>([...columns])

  useEffect(() => {
    setLocalColumns([...columns])
  }, [columns])

  const toggleVisibility = (id: string) => {
    setLocalColumns((prev) => prev.map((col) => (col.id === id ? { ...col, visible: !col.visible } : col)))
  }

  const handleSave = () => {
    onSave(localColumns)
    onClose()
  }

  const renderItem = ({ item, drag, isActive }: RenderItemParams<ColumnConfig>) => {
    return (
      <ScaleDecorator>
        <TouchableOpacity
          onLongPress={drag}
          disabled={isActive}
          style={[
            styles.columnItem,
            {
              backgroundColor: isActive ? colors.background : colors.card,
              borderBottomColor: colors.border,
              opacity: isActive ? 0.7 : 1,
            },
          ]}
        >
          <View style={styles.columnItemLeft}>
            <TouchableOpacity onLongPress={drag}>
              <Feather name="menu" size={16} color={colors.text + "80"} style={styles.dragHandle} />
            </TouchableOpacity>
            <Switch
              value={item.visible}
              onValueChange={() => toggleVisibility(item.id)}
              trackColor={{ false: colors.border, true: colors.primary + "80" }}
              thumbColor={item.visible ? colors.primary : colors.text + "40"}
            />
            <Text style={[styles.columnLabel, { color: colors.text }]}>{item.labelKey}</Text>
          </View>
          <TouchableOpacity onPress={() => toggleVisibility(item.id)} style={styles.visibilityButton}>
            <Feather name={item.visible ? "eye" : "eye-off"} size={16} color={colors.text} />
          </TouchableOpacity>
        </TouchableOpacity>
      </ScaleDecorator>
    )
  }

  return (
    <Modal visible={isVisible} transparent={true} animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContainer, { backgroundColor: colors.card }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.title, { color: colors.text }]}>Customize Columns</Text>
            <TouchableOpacity onPress={onClose}>
              <Feather name="x" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.instructionsContainer}>
            <Text style={[styles.instructions, { color: colors.text + "80" }]}>
              Drag to reorder columns. Toggle switches to show or hide columns.
            </Text>
          </View>

          <View style={styles.listContainer}>
            <DraggableFlatList
              data={localColumns.sort((a, b) => a.order - b.order)}
              onDragEnd={({ data }) => {
                // Update order property
                const newData = data.map((item, index) => ({
                  ...item,
                  order: index,
                }))
                setLocalColumns(newData)
              }}
              keyExtractor={(item) => item.id}
              renderItem={renderItem}
            />
          </View>

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
              <Text style={styles.saveButtonText}>Save</Text>
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
  title: {
    fontSize: 18,
    fontWeight: "bold",
  },
  instructionsContainer: {
    marginBottom: 16,
  },
  instructions: {
    fontSize: 14,
  },
  listContainer: {
    flex: 1,
    maxHeight: 400,
  },
  columnItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
  },
  columnItemLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  dragHandle: {
    marginRight: 12,
  },
  columnLabel: {
    fontSize: 16,
    marginLeft: 12,
  },
  visibilityButton: {
    padding: 8,
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

export default ColumnCustomizationModal

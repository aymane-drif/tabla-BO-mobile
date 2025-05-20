"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import { useColorScheme } from "react-native"
import { blue } from "react-native-reanimated/lib/typescript/Colors"

// Define theme colors based on the Tailwind config but with React Native-friendly structure
const lightTheme = {
  primary: "#88AB61", // greentheme
  secondary: "#3F72AF", // bluetheme
  background: "#f6f6f6", // whitetheme
  card: "#fff", // softgreytheme
  text: "#1A1A1A", // blacktheme
  subtext: "#1E1E1E80", // subblack
  border: "#E1E1E1",
  notification: "#FF4B4B", // redtheme
  success: "#88AB61", // greentheme
  warning: "#FFA500", // orangetheme
  danger: "#FF4B4B", // redtheme
  info: "#3F72AF", // bluetheme
  blue: "#3F72AF", // bluetheme
  purple: "#7b2cbf", // purpletheme
  blush: "#b75d69", // blushtheme
  yellow: "#F09300", // yellowtheme
  brown: "#9c6644", // browntheme
}

const darkTheme = {
  primary: "#88AB61", // greentheme
  secondary: "#3F72AF", // bluetheme
  background: "#031911", // bgdarktheme
  card: "#05291c", // darkthemeitems
  text: "#f5f4f2", // textdarktheme
  subtext: "#ffffff77", // softwhitetheme
  border: "#042117", // bgdarktheme2
  notification: "#FF4B4B", // redtheme
  success: "#88AB61", // greentheme
  warning: "#FFA500", // orangetheme
  danger: "#FF4B4B", // redtheme
  info: "#3F72AF", // bluetheme
  blue: "#3F72AF", // bluetheme
  purple: "#7b2cbf", // purpletheme
  blush: "#b75d69", // blushtheme
  yellow: "#F09300", // yellowtheme
  brown: "#9c6644", // browntheme
}

// Create context
interface ThemeContextType {
  isDarkMode: boolean
  toggleTheme: () => void
  colors: typeof lightTheme
}

const ThemeContext = createContext<ThemeContextType>({
  isDarkMode: true,
  toggleTheme: () => {},
  colors: darkTheme // Default to dark theme,
})

// Theme provider component
export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const colorScheme = useColorScheme()
  const [isDarkMode, setIsDarkMode] = useState(colorScheme === "dark")

  // Update theme when system preference changes
  useEffect(() => {
    setIsDarkMode(colorScheme === "dark")
  }, [colorScheme])

  const toggleTheme = () => {
    colorScheme === "dark" ? setIsDarkMode(false) :
    colorScheme === "light" ? setIsDarkMode(true) :
    setIsDarkMode(!isDarkMode)
  }

  const colors = isDarkMode ? darkTheme : lightTheme

  return <ThemeContext.Provider value={{ isDarkMode, toggleTheme, colors }}>{children}</ThemeContext.Provider>
}

// Custom hook to use the theme
export const useTheme = () => useContext(ThemeContext)

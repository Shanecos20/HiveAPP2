import React, { createContext, useState, useContext, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import theme from '../utils/theme';

// Create a default theme context value that's guaranteed to have all required properties
const defaultThemeContextValue = {
  theme: {
    ...theme,
    colors: theme.colors,
    spacing: theme.spacing,
    layout: theme.layout,
    typography: theme.typography
  },
  isDarkMode: false,
  setDarkMode: () => {}, // No-op function as a placeholder
};

// Create context with default values to ensure it's never undefined
export const ThemeContext = createContext(defaultThemeContextValue);

// Theme storage key
const THEME_STORAGE_KEY = '@hiveapp:theme_preference';

// Safety function to ensure theme is never malformed
const createSafeTheme = (isDark = false) => {
  return {
    ...theme,
    colors: isDark ? theme.dark.colors : theme.light.colors,
    spacing: theme.spacing || { tiny: 4, small: 8, medium: 16, large: 24, xlarge: 32 },
    layout: theme.layout || { borderRadiusSmall: 4, borderRadiusMedium: 8, borderRadiusLarge: 12 },
    typography: theme.typography || { 
      bodySmall: 12, bodyMedium: 14, bodyLarge: 16,
      headingSmall: 18, headingMedium: 22, headingLarge: 26
    }
  };
};

// Theme provider component with enhanced safety
export const ThemeProvider = ({ children }) => {
  const colorScheme = useColorScheme();
  const dispatch = useDispatch();
  
  // Try to get app settings, with fallback to prevent errors
  const authState = useSelector(state => state?.auth) || {};
  const appSettings = authState.appSettings || { darkMode: false };
  
  const [isDarkMode, setIsDarkMode] = useState(appSettings.darkMode || false);
  
  // Initialize theme with all properties
  const [currentTheme, setCurrentTheme] = useState(createSafeTheme(appSettings.darkMode));
  
  // Load saved theme preference from AsyncStorage on initial load
  useEffect(() => {
    const loadSavedThemePreference = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (savedTheme !== null) {
          const themeData = JSON.parse(savedTheme);
          setIsDarkMode(themeData.isDarkMode);
          setCurrentTheme(createSafeTheme(themeData.isDarkMode));
          
          // Also update Redux if auth reducer has settings
          if (dispatch && authState.updateSettings) {
            dispatch(authState.updateSettings({ darkMode: themeData.isDarkMode }));
          }
        }
      } catch (error) {
        console.error('Error loading theme preference:', error);
      }
    };
    
    loadSavedThemePreference();
  }, []);
  
  // Function to directly set dark mode (useful for testing)
  const setDarkMode = async (value) => {
    try {
      setIsDarkMode(value);
      setCurrentTheme(createSafeTheme(value));
      
      // Save to AsyncStorage
      await AsyncStorage.setItem(THEME_STORAGE_KEY, JSON.stringify({ isDarkMode: value }));
      
      // Also update Redux if auth reducer has settings
      if (dispatch && authState.updateSettings) {
        dispatch(authState.updateSettings({ darkMode: value }));
      }
    } catch (error) {
      console.error('Error saving theme preference:', error);
    }
  };
  
  // Update the theme when dark mode setting changes in Redux
  useEffect(() => {
    if (appSettings?.darkMode !== isDarkMode) {
      setIsDarkMode(appSettings.darkMode);
      setCurrentTheme(createSafeTheme(appSettings.darkMode));
    }
  }, [appSettings?.darkMode]);
  
  // Provide the theme context with both theme data and the setter function
  return (
    <ThemeContext.Provider value={{ 
      theme: currentTheme, 
      isDarkMode,
      setDarkMode 
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

// Hook to use the theme with enhanced safety
export const useTheme = () => {
  const context = useContext(ThemeContext);
  
  // If context is somehow undefined or missing properties, return the default theme
  if (!context || !context.theme || !context.theme.colors) {
    console.warn('useTheme was used outside of ThemeProvider or context is invalid');
    return defaultThemeContextValue;
  }
  
  return context;
}; 
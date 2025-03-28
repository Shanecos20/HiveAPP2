/**
 * Theme configuration for the HiveApp
 * Contains colors, typography, and spacing values
 */

// Define standard spacing and layout values
const spacing = {
  tiny: 4,
  small: 8,
  medium: 16,
  large: 24,
  xlarge: 32,
};

const layout = {
  borderRadiusSmall: 4,
  borderRadiusMedium: 8,
  borderRadiusLarge: 12,
};

const typography = {
  bodySmall: 12,
  bodyMedium: 14,
  bodyLarge: 16,
  headingSmall: 18,
  headingMedium: 22,
  headingLarge: 26,
  lineHeightRegular: 22,
};

// Define shadows for elevation
const shadows = {
  small: {
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  medium: {
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.23,
    shadowRadius: 2.62,
  },
  large: {
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
  },
};

// Define light theme colors - more modern, sleek palette
const lightColors = {
  primary: '#F9A826', // Warmer amber for honey theme
  primaryLight: '#FFF5E1',
  primaryDark: '#E08600',
  secondary: '#3B8132', // Rich green
  secondaryLight: '#E8F5E9',
  secondaryDark: '#2A6023',
  background: '#FAFAFA', // Lighter background
  card: '#FFFFFF',
  text: '#1D1D1D', // Deeper black for text
  textSecondary: '#606060', // More muted secondary text
  border: '#E0E0E0',
  white: '#FFFFFF',
  black: '#1D1D1D',
  error: '#E53935', // Slightly muted red
  success: '#2E7D32', // Richer green
  info: '#1976D2', // Deeper blue
  warning: '#F57C00', // Warmer orange
  grey: '#9E9E9E',
  lightGrey: '#F5F5F5',
  darkGrey: '#606060',
  
  // Additional colors for UI elements
  surface: '#FFFFFF',
  cardHeader: '#F8F8F8',
  divider: '#EEEEEE',
  overlay: 'rgba(0, 0, 0, 0.5)',
  statusBar: '#F9A826',
  notification: '#FFFFFF',
};

// Define dark theme colors - deeper, more contrasty dark mode
const darkColors = {
  primary: '#F9A826', // Keep same primary color
  primaryLight: '#3D3223', // Darker tint of primary
  primaryDark: '#FFB84D',
  secondary: '#4CAF50',
  secondaryLight: '#1E3B1E',
  secondaryDark: '#66BB6A',
  background: '#121212', // True Material dark
  card: '#1E1E1E', // Slightly lighter than background
  text: '#FFFFFF',
  textSecondary: '#B0BEC5', // Blue-grey for secondary text
  border: '#333333',
  white: '#FFFFFF',
  black: '#1D1D1D',
  error: '#EF5350', // Lighter in dark mode
  success: '#66BB6A',
  info: '#42A5F5',
  warning: '#FFA726',
  grey: '#9E9E9E',
  lightGrey: '#2A2A2A', // Darker light grey for dark mode
  darkGrey: '#B0BEC5', // Lighter dark grey for dark mode
  
  // Additional colors for UI elements
  surface: '#1E1E1E',
  cardHeader: '#252525',
  divider: '#333333',
  overlay: 'rgba(0, 0, 0, 0.7)',
  statusBar: '#121212',
  notification: '#252525',
};

// Create theme object with both light and dark modes
// Make sure all properties are accessible at the top level
const theme = {
  // Add spacing, layout, and typography at the top level for direct access
  spacing,
  layout,
  typography,
  shadows,
  
  // Add colors at the top level (default to light theme)
  colors: lightColors,
  
  // Store both light and dark theme objects for reference
  dark: {
    colors: darkColors,
    spacing,
    layout,
    typography,
    shadows,
  },
  light: {
    colors: lightColors,
    spacing,
    layout,
    typography,
    shadows,
  }
};

export default theme; 
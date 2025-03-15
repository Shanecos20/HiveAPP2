/**
 * Theme configuration for the HiveApp
 * Contains colors, typography, and spacing values
 */

export const colors = {
  // Primary colors
  primary: '#FFC107', // Amber (honey color)
  primaryDark: '#FFA000',
  primaryLight: '#FFECB3',
  
  // Secondary colors
  secondary: '#795548', // Brown (wood/hive color)
  secondaryDark: '#5D4037',
  secondaryLight: '#D7CCC8',
  
  // Status colors
  success: '#4CAF50', // Green
  warning: '#FF9800', // Orange
  error: '#F44336', // Red
  info: '#2196F3', // Blue
  
  // Neutral colors
  white: '#FFFFFF',
  lightGrey: '#F5F5F5',
  grey: '#9E9E9E',
  darkGrey: '#616161',
  black: '#212121',
  
  // Background
  background: '#FFFDF5', // Slight cream color
  card: '#FFFFFF',
  
  // Transparent colors
  transparentPrimary: 'rgba(255, 193, 7, 0.8)',
  transparentBlack: 'rgba(0, 0, 0, 0.5)',
  transparentWhite: 'rgba(255, 255, 255, 0.8)',
};

export const typography = {
  // Font sizes
  headingLarge: 24,
  headingMedium: 20,
  headingSmall: 18,
  bodyLarge: 16,
  bodyMedium: 14,
  bodySmall: 12,
  
  // Font families - Using system fonts for simplicity
  // You can replace these with custom fonts if needed
  fontRegular: 'System',
  fontBold: 'System',
  
  // Line heights
  lineHeightTight: 1.2,
  lineHeightRegular: 1.5,
  lineHeightLoose: 1.8,
};

export const spacing = {
  // Spacing values in pixels
  tiny: 4,
  small: 8,
  medium: 16,
  large: 24,
  xlarge: 32,
  xxlarge: 48,
};

export const layout = {
  // Border radius
  borderRadiusSmall: 4,
  borderRadiusMedium: 8,
  borderRadiusLarge: 16,
  
  // Shadow - for iOS
  shadowProps: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  
  // Elevation - for Android
  elevationSmall: 2,
  elevationMedium: 4,
  elevationLarge: 8,
};

export const theme = {
  colors,
  typography,
  spacing,
  layout,
};

export default theme; 
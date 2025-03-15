import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import theme from '../../utils/theme';
import { useTheme } from '../../contexts/ThemeContext';

// Fallback values in case theme is undefined
const fallbackTheme = {
  colors: {
    card: '#FFFFFF',
    border: '#E0E0E0',
    text: '#1D1D1D',
    black: '#000000',
    divider: '#EEEEEE'
  },
  layout: {
    borderRadiusMedium: 8
  },
  spacing: {
    medium: 16,
    small: 8
  },
  typography: {
    headingSmall: 18
  }
};

const Card = ({ 
  title, 
  children, 
  onPress, 
  style,
  titleRight,
  noPadding = false,
  variant = 'default' // default, outlined, elevated
}) => {
  // Get theme with fallback
  const { theme: currentTheme, isDarkMode } = useTheme();
  
  // Ensure currentTheme and its properties are defined with fallbacks
  const safeTheme = {
    colors: currentTheme?.colors || fallbackTheme.colors,
    layout: currentTheme?.layout || fallbackTheme.layout,
    spacing: currentTheme?.spacing || fallbackTheme.spacing,
    typography: currentTheme?.typography || fallbackTheme.typography
  };

  // Combine the base style with any additional styles passed as props
  const cardStyle = [
    {
      backgroundColor: safeTheme.colors.card,
      borderRadius: safeTheme.layout.borderRadiusMedium,
      marginBottom: safeTheme.spacing.medium,
      overflow: 'hidden',
    },
    noPadding ? null : { padding: safeTheme.spacing.medium },
    variant === 'outlined' ? { 
      borderWidth: 1,
      borderColor: safeTheme.colors.border
    } : null,
    variant === 'elevated' ? { 
      shadowColor: safeTheme.colors.black,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDarkMode ? 0.3 : 0.1,
      shadowRadius: 4,
      elevation: 2,
    } : null,
    style
  ];

  const titleTextStyle = {
    fontSize: safeTheme.typography.headingSmall,
    fontWeight: 'bold',
    color: safeTheme.colors.text,
    marginBottom: safeTheme.spacing.small,
  };

  const titleContainerStyle = {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: safeTheme.spacing.small,
    paddingBottom: safeTheme.spacing.small,
    borderBottomWidth: variant !== 'default' ? 0 : 1,
    borderBottomColor: safeTheme.colors.divider,
  };

  // If onPress is provided, make the card touchable
  if (onPress) {
    return (
      <TouchableOpacity style={cardStyle} onPress={onPress} activeOpacity={0.7}>
        {title && (
          <View style={titleContainerStyle}>
            <Text style={titleTextStyle}>{title}</Text>
            {titleRight && <View>{titleRight}</View>}
          </View>
        )}
        <View>{children}</View>
      </TouchableOpacity>
    );
  }

  // Otherwise, render a regular View
  return (
    <View style={cardStyle}>
      {title && (
        <View style={titleContainerStyle}>
          <Text style={titleTextStyle}>{title}</Text>
          {titleRight && <View>{titleRight}</View>}
        </View>
      )}
      <View>{children}</View>
    </View>
  );
};

export default Card; 
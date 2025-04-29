import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';

const Button = ({
  title,
  onPress,
  disabled = false,
  loading = false,
  variant = 'primary',
  size = 'medium',
  icon = null,
  style = {},
  textStyle = {},
  children,
}) => {
  const { theme: currentTheme } = useTheme();

  // Button styles based on variant
  const buttonVariants = {
    primary: {
      backgroundColor: 'rgba(255, 249, 219, 0.85)', // Light yellow opaque background
      borderColor: '#F9A826', // Orangey outline
      textColor: '#F9A826',
      loadingColor: '#F9A826',
    },
    secondary: {
      backgroundColor: 'rgba(220, 242, 220, 0.95)', // Vibrant light green background
      borderColor: '#4CAF50', // Lighter green outline
      textColor: '#4CAF50', // Lighter green text
      loadingColor: '#4CAF50',
    },
  };

  // Use the specified variant or default to primary
  const currentVariant = buttonVariants[variant] || buttonVariants.primary;

  // Default button styles with selected variant colors
  const baseButtonStyle = {
    backgroundColor: currentVariant.backgroundColor,
    borderWidth: 1.5,
    borderColor: currentVariant.borderColor,
    borderRadius: 24, // Increased border radius for more rounded buttons
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  };

  // Size variants
  const sizeStyles = {
    small: {
      paddingVertical: currentTheme.spacing.small,
      paddingHorizontal: currentTheme.spacing.medium,
    },
    medium: {
      paddingVertical: currentTheme.spacing.medium,
      paddingHorizontal: currentTheme.spacing.large,
    },
    large: {
      paddingVertical: currentTheme.spacing.medium + 2,
      paddingHorizontal: currentTheme.spacing.large + 4,
    },
  };

  // Generate button style based on props
  const buttonStyle = [
    baseButtonStyle,
    sizeStyles[size] || sizeStyles.medium,
    disabled && styles.disabledButton,
    style,
  ];

  // Text style based on variant
  const baseTextStyle = {
    color: currentVariant.textColor,
    fontWeight: 'bold',
    fontSize: size === 'small' 
      ? currentTheme.typography.bodySmall 
      : size === 'large' 
        ? currentTheme.typography.bodyLarge 
        : currentTheme.typography.bodyMedium,
  };

  return (
    <TouchableOpacity
      style={buttonStyle}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator size="small" color={currentVariant.loadingColor} />
      ) : (
        <>
          {icon && <>{icon}</>}
          {title && (
            <Text style={[baseTextStyle, icon && { marginLeft: currentTheme.spacing.small }, textStyle]}>
              {title}
            </Text>
          )}
          {children}
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  disabledButton: {
    opacity: 0.6,
  },
});

export default Button; 
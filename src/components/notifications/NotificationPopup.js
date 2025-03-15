import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { useDispatch } from 'react-redux';
import { hideNotificationPopup } from '../../redux/notificationSlice';
import { getSeverityColor, formatDateTime } from '../../utils/helpers';
import theme from '../../utils/theme';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';

// Fallback values in case theme is undefined
const fallbackTheme = {
  colors: {
    notification: '#FFFFFF',
    black: '#000000',
    text: '#1D1D1D',
    textSecondary: '#606060',
    grey: '#9E9E9E',
  },
  layout: {
    borderRadiusMedium: 8
  },
  spacing: {
    medium: 16,
    tiny: 4,
    small: 8,
    xlarge: 32
  },
  typography: {
    bodyLarge: 16,
    bodyMedium: 14,
    bodySmall: 12
  }
};

const NotificationPopup = ({ notification }) => {
  const dispatch = useDispatch();
  const { theme: currentTheme, isDarkMode } = useTheme();
  
  // Ensure currentTheme and its properties are defined with fallbacks
  const safeTheme = {
    colors: currentTheme?.colors || fallbackTheme.colors,
    layout: currentTheme?.layout || fallbackTheme.layout,
    spacing: currentTheme?.spacing || fallbackTheme.spacing,
    typography: currentTheme?.typography || fallbackTheme.typography
  };
  
  const slideAnim = useRef(new Animated.Value(-100)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    // Slide in animation
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
    
    // Automatically dismiss after 5 seconds
    const timer = setTimeout(() => {
      dismissNotification();
    }, 5000);
    
    return () => clearTimeout(timer);
  }, [notification]);
  
  const dismissNotification = () => {
    // Slide out animation
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      dispatch(hideNotificationPopup());
    });
  };
  
  if (!notification) return null;
  
  const severityColor = getSeverityColor(notification.severity);
  
  return (
    <Animated.View 
      style={[
        {
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          backgroundColor: safeTheme.colors.notification,
          borderRadius: safeTheme.layout.borderRadiusMedium,
          marginHorizontal: safeTheme.spacing.medium,
          marginTop: safeTheme.spacing.xlarge * 2, // Extra space for status bar
          flexDirection: 'row',
          borderLeftWidth: 4,
          overflow: 'hidden',
          shadowColor: safeTheme.colors.black,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: isDarkMode ? 0.4 : 0.1,
          shadowRadius: 6,
          elevation: 4,
          zIndex: 1000,
        },
        { 
          transform: [{ translateY: slideAnim }],
          opacity: opacityAnim,
          borderLeftColor: severityColor,
        }
      ]}
    >
      <View style={{
        padding: safeTheme.spacing.medium,
        justifyContent: 'center',
        alignItems: 'center',
      }}>
        <View style={{
          borderRadius: 50,
          padding: safeTheme.spacing.small,
          backgroundColor: severityColor,
        }}>
          <Ionicons 
            name={
              notification.severity === 'high' 
                ? 'warning' 
                : notification.severity === 'medium' 
                ? 'alert-circle' 
                : 'information-circle'
            } 
            size={24} 
            color="white" 
          />
        </View>
      </View>
      
      <View style={{
        flex: 1,
        padding: safeTheme.spacing.medium,
        paddingLeft: 0,
      }}>
        <Text style={{
          fontSize: safeTheme.typography.bodyLarge,
          fontWeight: 'bold',
          color: safeTheme.colors.text,
          marginBottom: safeTheme.spacing.tiny,
        }}>{notification.title}</Text>
        <Text style={{
          fontSize: safeTheme.typography.bodyMedium,
          color: safeTheme.colors.textSecondary,
          marginBottom: safeTheme.spacing.tiny,
        }}>{notification.message}</Text>
        <Text style={{
          fontSize: safeTheme.typography.bodySmall,
          color: safeTheme.colors.grey,
        }}>{formatDateTime(notification.timestamp)}</Text>
      </View>
      
      <TouchableOpacity 
        style={{
          padding: safeTheme.spacing.medium,
          justifyContent: 'center',
          alignItems: 'center',
        }} 
        onPress={dismissNotification}
      >
        <Ionicons name="close" size={20} color={safeTheme.colors.grey} />
      </TouchableOpacity>
    </Animated.View>
  );
};

export default NotificationPopup; 
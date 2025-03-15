import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { useDispatch } from 'react-redux';
import { hideNotificationPopup } from '../../redux/notificationSlice';
import { getSeverityColor, formatDateTime } from '../../utils/helpers';
import theme from '../../utils/theme';
import { Ionicons } from '@expo/vector-icons';

const NotificationPopup = ({ notification }) => {
  const dispatch = useDispatch();
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
        styles.container, 
        { 
          transform: [{ translateY: slideAnim }],
          opacity: opacityAnim,
          borderLeftColor: severityColor,
        }
      ]}
    >
      <View style={styles.iconContainer}>
        <View style={[styles.iconBackground, { backgroundColor: severityColor }]}>
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
      
      <View style={styles.contentContainer}>
        <Text style={styles.title}>{notification.title}</Text>
        <Text style={styles.message}>{notification.message}</Text>
        <Text style={styles.timestamp}>{formatDateTime(notification.timestamp)}</Text>
      </View>
      
      <TouchableOpacity style={styles.closeButton} onPress={dismissNotification}>
        <Ionicons name="close" size={20} color={theme.colors.grey} />
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: theme.colors.white,
    borderRadius: theme.layout.borderRadiusMedium,
    marginHorizontal: theme.spacing.medium,
    marginTop: theme.spacing.xlarge * 2, // Extra space for status bar
    flexDirection: 'row',
    borderLeftWidth: 4,
    overflow: 'hidden',
    ...theme.layout.shadowProps,
    elevation: theme.layout.elevationMedium,
    zIndex: 1000,
  },
  iconContainer: {
    padding: theme.spacing.medium,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconBackground: {
    borderRadius: 50,
    padding: theme.spacing.small,
  },
  contentContainer: {
    flex: 1,
    padding: theme.spacing.medium,
    paddingLeft: 0,
  },
  title: {
    fontSize: theme.typography.bodyLarge,
    fontWeight: 'bold',
    color: theme.colors.black,
    marginBottom: theme.spacing.tiny,
  },
  message: {
    fontSize: theme.typography.bodyMedium,
    color: theme.colors.darkGrey,
    marginBottom: theme.spacing.tiny,
  },
  timestamp: {
    fontSize: theme.typography.bodySmall,
    color: theme.colors.grey,
  },
  closeButton: {
    padding: theme.spacing.medium,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default NotificationPopup; 
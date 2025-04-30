import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { markAsRead, markAllAsRead, dismissNotification, dismissAllNotifications } from '../redux/notificationSlice';
import { formatDateTime, getSeverityColor } from '../utils/helpers';
import theme from '../utils/theme';
import { Ionicons } from '@expo/vector-icons';
import Card from '../components/common/Card';
import { useTheme } from '../contexts/ThemeContext';

const NotificationsScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { notifications } = useSelector(state => state.notifications);
  const { theme: currentTheme, isDarkMode } = useTheme();
  
  const handleMarkAsRead = (id) => {
    dispatch(markAsRead(id));
  };
  
  const handleDismiss = (id) => {
    dispatch(dismissNotification(id));
  };
  
  const handleMarkAllAsRead = () => {
    dispatch(markAllAsRead());
  };
  
  const handleClearAll = () => {
    dispatch(dismissAllNotifications());
  };
  
  const handleNotificationPress = (notification) => {
    // Mark as read when pressed
    if (!notification.read) {
      dispatch(markAsRead(notification.id));
    }
    
    // Navigate to the appropriate screen based on notification type
    if (notification.hiveId) {
      navigation.navigate('HiveDetail', { hiveId: notification.hiveId });
    }
  };
  
  const renderNotificationItem = ({ item }) => {
    const severityColor = getSeverityColor(item.severity);
    
    return (
      <TouchableOpacity 
        style={[
          styles.notificationItem,
          !item.read && styles.unreadNotification,
          { backgroundColor: !item.read 
            ? currentTheme?.colors?.primaryLight || theme.colors.primaryLight 
            : currentTheme?.colors?.card || theme.colors.white }
        ]}
        onPress={() => handleNotificationPress(item)}
      >
        <View style={[styles.severityIndicator, { backgroundColor: severityColor }]} />
        
        <View style={styles.notificationContent}>
          <View style={styles.notificationHeader}>
            <Text style={[
              styles.notificationTitle,
              { color: currentTheme?.colors?.text || theme.colors.black }
            ]}>
              {item.title}
            </Text>
            <Text style={[
              styles.notificationTime,
              { color: currentTheme?.colors?.textSecondary || theme.colors.grey }
            ]}>
              {formatDateTime(item.timestamp)}
            </Text>
          </View>
          
          <Text style={[
            styles.notificationMessage,
            { color: currentTheme?.colors?.textSecondary || theme.colors.darkGrey }
          ]}>
            {item.message}
          </Text>
          
          <View style={styles.notificationActions}>
            {!item.read && (
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => handleMarkAsRead(item.id)}
              >
                <Text style={[
                  styles.actionButtonText,
                  { color: currentTheme?.colors?.primary || theme.colors.primary }
                ]}>
                  Mark as Read
                </Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => handleDismiss(item.id)}
            >
              <Text style={[
                styles.actionButtonText,
                { color: currentTheme?.colors?.error || theme.colors.error }
              ]}>
                Dismiss
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };
  
  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <Ionicons 
        name="notifications-off" 
        size={64} 
        color={currentTheme?.colors?.textSecondary || theme.colors.grey} 
      />
      <Text style={[
        styles.emptyText,
        { color: currentTheme?.colors?.text || theme.colors.black }
      ]}>
        No notifications yet
      </Text>
      <Text style={[
        styles.emptySubtext,
        { color: currentTheme?.colors?.textSecondary || theme.colors.darkGrey }
      ]}>
        When you receive notifications about your hives, they will appear here.
      </Text>
    </View>
  );
  
  return (
    <View style={[
      styles.container,
      { backgroundColor: currentTheme?.colors?.background || theme.colors.background }
    ]}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons 
            name="arrow-back" 
            size={24} 
            color={currentTheme?.colors?.text || theme.colors.black} 
          />
        </TouchableOpacity>
        <Text style={[
          styles.headerTitle,
          { color: currentTheme?.colors?.text || theme.colors.black }
        ]}>
          Notifications
        </Text>
        
        {notifications.length > 0 && (
          <View style={styles.headerButtons}>
            <TouchableOpacity 
              style={styles.markAllButton}
              onPress={handleMarkAllAsRead}
            >
              <Text style={[
                styles.markAllText,
                { color: currentTheme?.colors?.primary || theme.colors.primary }
              ]}>
                Mark All as Read
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.clearAllButton}
              onPress={handleClearAll}
            >
              <Text style={[
                styles.clearAllText,
                { color: currentTheme?.colors?.error || theme.colors.error }
              ]}>
                Clear All
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
      
      <FlatList
        data={notifications}
        renderItem={renderNotificationItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={renderEmptyList}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: theme.spacing.medium,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.medium,
    paddingTop: theme.spacing.medium,
  },
  backButton: {
    marginRight: theme.spacing.medium,
  },
  headerTitle: {
    fontSize: theme.typography.headingMedium,
    fontWeight: 'bold',
    color: theme.colors.black,
    flex: 1,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  markAllButton: {
    marginRight: theme.spacing.medium,
    padding: theme.spacing.small,
  },
  clearAllButton: {
    padding: theme.spacing.small,
  },
  markAllText: {
    fontSize: theme.typography.bodySmall,
    color: theme.colors.primary,
    fontWeight: 'bold',
  },
  clearAllText: {
    fontSize: theme.typography.bodySmall,
    color: theme.colors.error,
    fontWeight: 'bold',
  },
  listContainer: {
    flexGrow: 1,
  },
  notificationItem: {
    flexDirection: 'row',
    backgroundColor: theme.colors.white,
    borderRadius: theme.layout.borderRadiusMedium,
    marginBottom: theme.spacing.medium,
    overflow: 'hidden',
    ...theme.layout.shadowProps,
    elevation: theme.layout.elevationSmall,
  },
  unreadNotification: {
    backgroundColor: theme.colors.primaryLight,
  },
  severityIndicator: {
    width: 4,
    height: '100%',
  },
  notificationContent: {
    flex: 1,
    padding: theme.spacing.medium,
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.small,
  },
  notificationTitle: {
    fontSize: theme.typography.bodyLarge,
    fontWeight: 'bold',
    color: theme.colors.black,
    flex: 1,
  },
  notificationTime: {
    fontSize: theme.typography.bodySmall,
    color: theme.colors.grey,
  },
  notificationMessage: {
    fontSize: theme.typography.bodyMedium,
    color: theme.colors.darkGrey,
    marginBottom: theme.spacing.medium,
  },
  notificationActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: theme.spacing.medium,
  },
  actionButtonText: {
    fontSize: theme.typography.bodySmall,
    color: theme.colors.darkGrey,
    marginLeft: theme.spacing.tiny,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xlarge,
  },
  emptyText: {
    fontSize: theme.typography.headingSmall,
    color: theme.colors.darkGrey,
    marginTop: theme.spacing.medium,
  },
  emptySubtext: {
    fontSize: theme.typography.bodyMedium,
    color: theme.colors.grey,
    textAlign: 'center',
    marginTop: theme.spacing.small,
  },
});

export default NotificationsScreen; 
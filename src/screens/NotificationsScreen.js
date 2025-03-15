import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { markAsRead, markAllAsRead, dismissNotification } from '../redux/notificationSlice';
import { formatDateTime, getSeverityColor } from '../utils/helpers';
import theme from '../utils/theme';
import { Ionicons } from '@expo/vector-icons';
import Card from '../components/common/Card';

const NotificationsScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { notifications } = useSelector(state => state.notifications);
  
  const handleMarkAsRead = (id) => {
    dispatch(markAsRead(id));
  };
  
  const handleDismiss = (id) => {
    dispatch(dismissNotification(id));
  };
  
  const handleMarkAllAsRead = () => {
    dispatch(markAllAsRead());
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
          !item.read && styles.unreadNotification
        ]}
        onPress={() => handleNotificationPress(item)}
      >
        <View style={[styles.severityIndicator, { backgroundColor: severityColor }]} />
        
        <View style={styles.notificationContent}>
          <View style={styles.notificationHeader}>
            <Text style={styles.notificationTitle}>{item.title}</Text>
            <Text style={styles.notificationTime}>{formatDateTime(item.timestamp)}</Text>
          </View>
          
          <Text style={styles.notificationMessage}>{item.message}</Text>
          
          <View style={styles.notificationActions}>
            {!item.read && (
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => handleMarkAsRead(item.id)}
              >
                <Ionicons name="checkmark-circle" size={16} color={theme.colors.primary} />
                <Text style={styles.actionText}>Mark as Read</Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => handleDismiss(item.id)}
            >
              <Ionicons name="close-circle" size={16} color={theme.colors.grey} />
              <Text style={styles.actionText}>Dismiss</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };
  
  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="notifications-off" size={64} color={theme.colors.grey} />
      <Text style={styles.emptyText}>No notifications yet</Text>
      <Text style={styles.emptySubtext}>
        When you receive notifications about your hives, they will appear here.
      </Text>
    </View>
  );
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={theme.colors.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        
        {notifications.length > 0 && (
          <TouchableOpacity 
            style={styles.markAllButton}
            onPress={handleMarkAllAsRead}
          >
            <Text style={styles.markAllText}>Mark All as Read</Text>
          </TouchableOpacity>
        )}
      </View>
      
      <FlatList
        data={notifications}
        renderItem={renderNotificationItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={renderEmptyList}
      />
      
      <Card title="Test Notifications" style={styles.testCard}>
        <Text style={styles.testCardText}>
          Use the Settings screen to trigger test notifications for different events.
        </Text>
      </Card>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
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
  markAllButton: {
    padding: theme.spacing.small,
  },
  markAllText: {
    fontSize: theme.typography.bodySmall,
    color: theme.colors.primary,
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
  actionText: {
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
  testCard: {
    marginTop: 'auto',
  },
  testCardText: {
    fontSize: theme.typography.bodyMedium,
    color: theme.colors.darkGrey,
  },
});

export default NotificationsScreen; 
import { createSlice } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage key for thresholds
const THRESHOLDS_STORAGE_KEY = '@hiveapp:thresholds';

const initialState = {
  notifications: [],
  thresholds: {
    temperature: {
      min: 32,
      max: 38,
    },
    humidity: {
      min: 50,
      max: 80,
    },
    varroa: {
      max: 1.0,
    },
  },
  showNotificationPopup: false,
  latestNotification: null,
  lastEventTimestamp: 0, // Track the timestamp of the last processed event
};

// Function to save thresholds to AsyncStorage
const saveThresholds = async (thresholds) => {
  try {
    await AsyncStorage.setItem(THRESHOLDS_STORAGE_KEY, JSON.stringify(thresholds));
  } catch (error) {
    console.error('Error saving thresholds to AsyncStorage:', error);
  }
};

// Function to load thresholds from AsyncStorage
export const loadSavedThresholds = () => async (dispatch) => {
  try {
    const savedThresholds = await AsyncStorage.getItem(THRESHOLDS_STORAGE_KEY);
    if (savedThresholds) {
      const thresholds = JSON.parse(savedThresholds);
      Object.keys(thresholds).forEach(sensorType => {
        if (thresholds[sensorType].min !== undefined) {
          dispatch(updateThresholds({
            sensorType,
            min: thresholds[sensorType].min,
          }));
        }
        if (thresholds[sensorType].max !== undefined) {
          dispatch(updateThresholds({
            sensorType,
            max: thresholds[sensorType].max,
          }));
        }
      });
    }
  } catch (error) {
    console.error('Error loading thresholds from AsyncStorage:', error);
  }
};

const notificationSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    addNotification: (state, action) => {
      const notification = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString(),
        read: false,
        ...action.payload,
      };
      
      // Add to the list
      state.notifications.unshift(notification);
      
      // Show popup
      state.showNotificationPopup = true;
      state.latestNotification = notification;
      
      // Keep only the last 50 notifications
      if (state.notifications.length > 50) {
        state.notifications = state.notifications.slice(0, 50);
      }
    },
    
    markAsRead: (state, action) => {
      const notification = state.notifications.find(n => n.id === action.payload);
      if (notification) {
        notification.read = true;
      }
    },
    
    markAllAsRead: (state) => {
      state.notifications.forEach(notification => {
        notification.read = true;
      });
    },
    
    dismissNotification: (state, action) => {
      if (action.payload) {
        state.notifications = state.notifications.filter(n => n.id !== action.payload);
      } else if (state.latestNotification) {
        state.notifications = state.notifications.filter(n => n.id !== state.latestNotification.id);
      }
      state.showNotificationPopup = false;
      state.latestNotification = null;
    },
    
    dismissAllNotifications: (state) => {
      state.notifications = [];
      state.showNotificationPopup = false;
      state.latestNotification = null;
    },
    
    hideNotificationPopup: (state) => {
      state.showNotificationPopup = false;
    },
    
    updateThresholds: (state, action) => {
      const { sensorType, min, max } = action.payload;
      if (state.thresholds[sensorType]) {
        if (min !== undefined) state.thresholds[sensorType].min = min;
        if (max !== undefined) state.thresholds[sensorType].max = max;
        
        // Save updated thresholds to AsyncStorage
        saveThresholds(state.thresholds);
      }
    },
    
    processFirebaseEvent: (state, action) => {
      const { event } = action.payload;
      const { type, hiveName, hiveId, timestamp } = event;
      
      // Generate a unique ID based on hiveId, type and timestamp to avoid duplicates
      const eventId = `${hiveId}-${type}-${timestamp}`;
      
      // Check if we already have this notification (based on eventId)
      const isDuplicate = state.notifications.some(n => 
        n.eventId === eventId || 
        (n.hiveId === hiveId && n.type === type && n.eventTimestamp === timestamp)
      );
      
      if (isDuplicate) {
        console.log('Skipping duplicate notification:', eventId);
        return;
      }
      
      // Always update the last processed timestamp if newer
      if (timestamp && (!state.lastEventTimestamp || timestamp > state.lastEventTimestamp)) {
        state.lastEventTimestamp = timestamp;
      }
      
      // Create a notification from the event
      let title, message, severity;
      
      switch (type) {
        case 'swarm':
          title = 'Swarming Alert!';
          message = `Potential swarming detected in ${hiveName}. Sudden weight drop observed.`;
          severity = 'high';
          break;
        case 'varroa_outbreak':
        case 'varroa':
          title = 'Varroa Mite Outbreak!';
          message = `Alert: Varroa mite infestation detected in ${hiveName}. Treatment recommended immediately.`;
          severity = 'high';
          break;
        case 'temperature_spike':
        case 'temperature':
          title = 'Temperature Spike Alert';
          message = `Sudden temperature spike detected in ${hiveName}. Check hive conditions.`;
          severity = 'medium';
          break;
        case 'humidity':
          title = 'Humidity Alert';
          message = `Humidity levels in ${hiveName} are outside the optimal range.`;
          severity = 'medium';
          break;
        case 'honey_harvest':
          title = 'Honey Harvest Ready';
          message = `Honey supers in ${hiveName} are ready for harvest.`;
          severity = 'low';
          break;
        case 'treatment':
          title = 'Treatment Reminder';
          message = `Scheduled treatment time for ${hiveName}. Administer necessary treatments.`;
          severity = 'medium';
          break;
        case 'feeding':
          title = 'Feeding Alert';
          message = `${hiveName} requires feeding soon. Ensure adequate food supply.`;
          severity = 'low';
          break;
        default:
          title = 'Hive Alert';
          message = `There is a potential issue with ${hiveName}.`;
          severity = 'low';
      }
      
      const notification = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        eventId, // Store the event ID for duplicate checking
        title,
        message,
        severity,
        timestamp: new Date().toISOString(),
        hiveId,
        type,
        read: false,
        eventTimestamp: timestamp // Store the original event timestamp for reference
      };
      
      // Always add to notification list
      state.notifications.unshift(notification);
      
      // Show notification popup
      state.showNotificationPopup = true;
      state.latestNotification = notification;
      
      // Keep only the last 50 notifications
      if (state.notifications.length > 50) {
        state.notifications = state.notifications.slice(0, 50);
      }
    },
    
    triggerTestNotification: (state, action) => {
      const { type, hiveName } = action.payload;
      let title, message, severity;
      
      switch (type) {
        case 'swarm':
          title = 'Swarming Alert!';
          message = `Potential swarming detected in ${hiveName}. Sudden weight drop observed.`;
          severity = 'high';
          break;
        case 'varroa_outbreak':
        case 'varroa':
          title = 'Varroa Mite Outbreak!';
          message = `Alert: Varroa mite infestation detected in ${hiveName}. Treatment recommended immediately.`;
          severity = 'high';
          break;
        case 'temperature_spike':
        case 'temperature':
          title = 'Temperature Spike Alert';
          message = `Sudden temperature spike detected in ${hiveName}. Check hive conditions.`;
          severity = 'medium';
          break;
        case 'humidity':
          title = 'Humidity Alert';
          message = `Humidity levels in ${hiveName} are outside the optimal range.`;
          severity = 'medium';
          break;
        case 'honey_harvest':
          title = 'Honey Harvest Ready';
          message = `Honey supers in ${hiveName} are ready for harvest.`;
          severity = 'low';
          break;
        case 'treatment':
          title = 'Treatment Reminder';
          message = `Scheduled treatment time for ${hiveName}. Administer necessary treatments.`;
          severity = 'medium';
          break;
        case 'feeding':
          title = 'Feeding Alert';
          message = `${hiveName} requires feeding soon. Ensure adequate food supply.`;
          severity = 'low';
          break;
        default:
          title = 'Hive Alert';
          message = `There is a potential issue with ${hiveName}.`;
          severity = 'low';
      }
      
      const notification = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        title,
        message,
        severity,
        timestamp: new Date().toISOString(),
        hiveId: action.payload.hiveId,
        type,
        read: false,
      };
      
      // Always add to notification list
      state.notifications.unshift(notification);
      
      // Show notification popup
      state.showNotificationPopup = true;
      state.latestNotification = notification;
    },
  },
});

export const { 
  addNotification, 
  markAsRead,
  markAllAsRead,
  dismissNotification,
  dismissAllNotifications,
  hideNotificationPopup,
  updateThresholds,
  triggerTestNotification,
  processFirebaseEvent
} = notificationSlice.actions;

export default notificationSlice.reducer; 
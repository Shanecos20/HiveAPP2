import { createSlice } from '@reduxjs/toolkit';

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
};

const notificationSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    addNotification: (state, action) => {
      const notification = {
        id: Date.now().toString(),
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
        case 'varroa':
          title = 'Varroa Mite Alert';
          message = `High varroa mite levels detected in ${hiveName}. Treatment recommended.`;
          severity = 'high';
          break;
        case 'temperature':
          title = 'Temperature Warning';
          message = `Abnormal temperature in ${hiveName}. Current readings outside optimal range.`;
          severity = 'medium';
          break;
        case 'humidity':
          title = 'Humidity Alert';
          message = `Humidity levels in ${hiveName} are outside the optimal range.`;
          severity = 'medium';
          break;
        default:
          title = 'Hive Alert';
          message = `There is a potential issue with ${hiveName}.`;
          severity = 'low';
      }
      
      const notification = {
        id: Date.now().toString(),
        title,
        message,
        severity,
        timestamp: new Date().toISOString(),
        hiveId: action.payload.hiveId,
        type,
        read: false,
      };
      
      state.notifications.unshift(notification);
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
  triggerTestNotification
} = notificationSlice.actions;

export default notificationSlice.reducer; 
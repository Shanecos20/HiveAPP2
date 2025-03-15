import { configureStore } from '@reduxjs/toolkit';
import hiveReducer from './hiveSlice';
import notificationReducer from './notificationSlice';
import authReducer from './authSlice';

export const store = configureStore({
  reducer: {
    hives: hiveReducer,
    notifications: notificationReducer,
    auth: authReducer,
  },
}); 
import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { combineReducers } from 'redux';
import hiveReducer from './hiveSlice';
import notificationReducer from './notificationSlice';
import authReducer from './authSlice';

// Configuration for redux-persist
const persistConfig = {
  key: 'root',
  storage: AsyncStorage,
  // Add any reducers you want to blacklist (not be persisted)
  // blacklist: ['someReducer']
};

const rootReducer = combineReducers({
  hives: hiveReducer,
  notifications: notificationReducer,
  auth: authReducer,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types to avoid serialization warnings
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE', 'persist/REGISTER'],
      },
    }),
});

export const persistor = persistStore(store); 
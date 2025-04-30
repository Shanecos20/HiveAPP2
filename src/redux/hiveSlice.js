import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import databaseService from '../services/databaseService';
import { triggerTestNotification } from './notificationSlice';

// Initial state with empty hives array
const initialState = {
  hives: [],
  selectedHiveId: null,
  loading: false,
  error: null,
  lastSynced: null
};

// Async thunk to load hives from *local* storage
export const fetchHives = createAsyncThunk(
  'hives/fetchHives',
  async (_, { rejectWithValue }) => {
    try {
      if (!databaseService.isInitialized) {
        await databaseService.initialize();
      }
      const hives = await databaseService.getHives(); // Now fetches only local
      return hives;
    } catch (error) {
      return rejectWithValue('Failed to fetch local hives: ' + error.message);
    }
  }
);

// Async thunk to save a hive (add or edit)
export const saveHive = createAsyncThunk(
  'hives/saveHive',
  async ({ hiveData, isAddMode }, { rejectWithValue }) => {
    try {
      // Use the updated database service method
      const savedHive = await databaseService.updateHive(hiveData, isAddMode);
      return { savedHive, isAddMode }; // Return hive and mode for reducer
    } catch (error) {
      // Pass the specific error message from the service
      return rejectWithValue(error.message || 'Error saving hive');
    }
  }
);

// NEW Async thunk to sync sensor data for all hives from Firebase
export const syncAllHivesData = createAsyncThunk(
  'hives/syncAllHivesData',
  async (_, { getState, rejectWithValue, dispatch }) => {
    const { hives } = getState().hives;
    const { appSettings } = getState().auth;
    const { thresholds } = getState().notifications;
    
    // Skip sync if dataSync setting is disabled
    if (!appSettings.dataSync) {
      return [];
    }
    
    if (!hives || hives.length === 0) {
      return []; // No hives to sync
    }

    try {
      const updatedHivesData = [];
      for (const hive of hives) {
        const firebaseData = await databaseService.fetchFirebaseHiveData(hive.id);
        if (firebaseData && firebaseData.sensors) {
           // Update local storage (databaseService handles this now)
           await databaseService.updateLocalHiveSensors(hive.id, firebaseData.sensors);
           updatedHivesData.push({ hiveId: hive.id, sensors: firebaseData.sensors });
           
           // Check sensor data against thresholds and notify if needed
           checkThresholdsAndNotify(firebaseData.sensors, hive, thresholds, appSettings, dispatch);
        } else {
          // Optionally handle hives that weren't found in Firebase (e.g., log a warning)
          console.warn(`Could not sync data for hive ${hive.id}. Not found in Firebase or fetch error.`);
        }
      }
      return updatedHivesData; // Return array of { hiveId, sensors } for hives that were updated
    } catch (error) {
      return rejectWithValue('Error syncing hive data from Firebase: ' + error.message);
    }
  }
);

// Helper function to check sensor data against thresholds and notify if needed
function checkThresholdsAndNotify(sensors, hive, thresholds, appSettings, dispatch) {
  // Skip notification checks if push notifications are disabled
  if (!appSettings.pushNotifications) {
    return;
  }
  
  const { temperature, humidity, varroa } = sensors;
  
  // Check temperature threshold
  if (temperature > thresholds.temperature.max) {
    dispatch(triggerTestNotification({
      type: 'temperature',
      hiveName: hive.name,
      hiveId: hive.id,
    }));
  }
  else if (temperature < thresholds.temperature.min) {
    dispatch(triggerTestNotification({
      type: 'temperature',
      hiveName: hive.name,
      hiveId: hive.id,
    }));
  }
  
  // Check humidity threshold
  if (humidity > thresholds.humidity.max || humidity < thresholds.humidity.min) {
    dispatch(triggerTestNotification({
      type: 'humidity',
      hiveName: hive.name,
      hiveId: hive.id,
    }));
  }
  
  // Check varroa threshold
  if (varroa > thresholds.varroa.max) {
    dispatch(triggerTestNotification({
      type: 'varroa',
      hiveName: hive.name,
      hiveId: hive.id,
    }));
  }
}

// Async thunk to delete a hive
export const deleteHive = createAsyncThunk(
  'hives/deleteHive',
  async (hiveId, { rejectWithValue }) => {
    try {
      const success = await databaseService.deleteHive(hiveId);
      if (success) {
        return hiveId;
      } else {
        return rejectWithValue('Failed to delete hive locally');
      }
    } catch (error) {
      return rejectWithValue('Error deleting hive: ' + error.message);
    }
  }
);

// Create the hive slice
const hiveSlice = createSlice({
  name: 'hives',
  initialState,
  reducers: {
    selectHive: (state, action) => {
      state.selectedHiveId = action.payload;
    },
    resetHives: (state) => {
      // Keep initialState structure
      Object.assign(state, initialState);
    },
    simulateHiveEvent: (state, action) => {
      const { hiveId, eventType } = action.payload;
      const hiveIndex = state.hives.findIndex(h => h.id === hiveId);
      
      if (hiveIndex !== -1) {
        const hive = state.hives[hiveIndex];
        
        // Simulate sensor data change based on event type
        switch (eventType) {
          case 'temperature':
            // Simulate temperature spike
            hive.sensors.temperature = Math.min(42, hive.sensors.temperature + 5);
            break;
          case 'humidity':
            // Simulate humidity issue (too high)
            hive.sensors.humidity = Math.min(95, hive.sensors.humidity + 15);
            break;
          case 'varroa':
            // Simulate varroa outbreak
            hive.sensors.varroa = Math.min(5, hive.sensors.varroa + 2);
            break;
          case 'swarm':
            // Simulate swarm (weight drop)
            hive.sensors.weight = Math.max(5, hive.sensors.weight * 0.6);
            break;
        }
        
        // Update hive status based on new sensor data
        hive.status = determineHiveStatus(hive);
        
        // Update lastUpdated timestamp
        hive.lastUpdated = new Date().toISOString();
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchHives (Local)
      .addCase(fetchHives.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchHives.fulfilled, (state, action) => {
        state.hives = action.payload;
        state.loading = false;
        if (state.hives.length > 0 && (!state.selectedHiveId || !state.hives.find(h => h.id === state.selectedHiveId))) {
          state.selectedHiveId = state.hives[0].id; // Select first if current selection invalid
        }
      })
      .addCase(fetchHives.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // saveHive (Add/Edit)
      .addCase(saveHive.pending, (state) => {
        state.loading = true; 
        state.error = null;
      })
      .addCase(saveHive.fulfilled, (state, action) => {
        const { savedHive, isAddMode } = action.payload;
        if (isAddMode) {
          state.hives.push(savedHive);
          // If this is the first hive added, select it
          if (state.hives.length === 1) {
              state.selectedHiveId = savedHive.id;
          }
        } else {
          const index = state.hives.findIndex(h => h.id === savedHive.id);
          if (index !== -1) {
            state.hives[index] = savedHive;
          }
        }
        state.loading = false;
        state.error = null;
      })
      .addCase(saveHive.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload; // Error message from service
      })
      
      // deleteHive
      .addCase(deleteHive.pending, (state, action) => {
         // Optional: Indicate loading specific to the hive being deleted
      })
      .addCase(deleteHive.fulfilled, (state, action) => {
        const hiveId = action.payload;
        state.hives = state.hives.filter(hive => hive.id !== hiveId);
        if (state.selectedHiveId === hiveId) {
          state.selectedHiveId = state.hives.length > 0 ? state.hives[0].id : null;
        }
        state.error = null;
      })
      .addCase(deleteHive.rejected, (state, action) => {
        state.error = action.payload;
      })

      // syncAllHivesData
      .addCase(syncAllHivesData.pending, (state) => {
        // Optional: set a syncing flag, state.syncing = true;
      })
      .addCase(syncAllHivesData.fulfilled, (state, action) => {
        const updates = action.payload; // Array of { hiveId, sensors }
        updates.forEach(update => {
            const index = state.hives.findIndex(h => h.id === update.hiveId);
            if (index !== -1) {
                const hive = state.hives[index];
                hive.sensors = update.sensors; // Update sensors
                hive.lastUpdated = update.sensors.timestamp
                    ? new Date(update.sensors.timestamp).toISOString()
                    : new Date().toISOString();
                hive.status = databaseService.determineHiveStatus(update.sensors); // Use service method

                // Update history
                Object.keys(update.sensors).forEach(key => {
                    if (key !== 'timestamp' && hive.history && hive.history[key] !== undefined) {
                       if (!Array.isArray(hive.history[key])) { // Ensure history array exists
                         hive.history[key] = [];
                       }
                       hive.history[key].push(update.sensors[key]);
                       if (hive.history[key].length > 30) {
                           hive.history[key].shift();
                       }
                    } else if (key !== 'timestamp' && hive.history && hive.history[key] === undefined) {
                       // Initialize history if sensor exists but history doesn't
                       hive.history[key] = [update.sensors[key]];
                    }
                });
            }
        });
        state.lastSynced = new Date().toISOString();
        // Optional: state.syncing = false;
        state.error = null; // Clear previous sync errors
      })
      .addCase(syncAllHivesData.rejected, (state, action) => {
        state.error = action.payload; // Store sync error
        // Optional: state.syncing = false;
      });
  }
});

// Helper function to determine hive status based on sensor values
function determineHiveStatus(hive) {
  const { temperature, humidity, varroa } = hive.sensors;
  
  // Critical conditions (any of these makes the hive critical)
  if (temperature > 40 || temperature < 30 || varroa > 3 || humidity > 90 || humidity < 40) {
    return 'critical';
  }
  
  // Warning conditions
  if (temperature > 38 || temperature < 32 || varroa > 1 || humidity > 80 || humidity < 50) {
    return 'warning';
  }
  
  // Otherwise healthy
  return 'healthy';
}

export const { 
  selectHive, 
  resetHives,
  simulateHiveEvent
} = hiveSlice.actions;

export default hiveSlice.reducer; 
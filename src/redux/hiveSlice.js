import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import databaseService from '../services/databaseService';

// Initial state with empty hives array
const initialState = {
  hives: [],
  selectedHiveId: null,
  loading: false,
  error: null,
  lastSynced: null
};

// Async thunk to load hives from the database
export const fetchHives = createAsyncThunk(
  'hives/fetchHives',
  async (_, { rejectWithValue }) => {
    try {
      // Initialize the database service if needed
      if (!databaseService.isInitialized) {
        await databaseService.initialize();
      }
      const hives = await databaseService.getHives();
      return hives;
    } catch (error) {
      return rejectWithValue('Failed to fetch hives: ' + error.message);
    }
  }
);

// Async thunk to save a hive to the database
export const saveHive = createAsyncThunk(
  'hives/saveHive',
  async (hive, { rejectWithValue }) => {
    try {
      const success = await databaseService.updateHive(hive);
      if (success) {
        return hive;
      } else {
        return rejectWithValue('Failed to save hive');
      }
    } catch (error) {
      return rejectWithValue('Error saving hive: ' + error.message);
    }
  }
);

// Async thunk to delete a hive from the database
export const deleteHive = createAsyncThunk(
  'hives/deleteHive',
  async (hiveId, { rejectWithValue }) => {
    try {
      const success = await databaseService.deleteHive(hiveId);
      if (success) {
        return hiveId;
      } else {
        return rejectWithValue('Failed to delete hive');
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
    updateHiveSensor: (state, action) => {
      const { hiveId, sensorType, value } = action.payload;
      const hive = state.hives.find(h => h.id === hiveId);
      
      if (hive) {
        // Update current value
        hive.sensors[sensorType] = value;
        
        // Update history (add to end and keep last 30 readings)
        if (!hive.history[sensorType]) {
          hive.history[sensorType] = [];
        }
        hive.history[sensorType].push(value);
        if (hive.history[sensorType].length > 30) {
          hive.history[sensorType].shift();
        }
        
        // Update last updated timestamp
        hive.lastUpdated = new Date().toISOString();
        
        // Update hive status based on sensor values
        hive.status = determineHiveStatus(hive);
        
        // Save changes to the database (handled in middleware)
        state.needsSyncing = true;
      }
    },
    selectHive: (state, action) => {
      state.selectedHiveId = action.payload;
    },
    simulateHiveEvent: (state, action) => {
      const { hiveId, eventType } = action.payload;
      const hive = state.hives.find(h => h.id === hiveId);
      
      if (hive) {
        switch (eventType) {
          case 'swarm':
            // Simulate a sudden drop in weight
            hive.sensors.weight -= 15;
            hive.history.weight.push(hive.sensors.weight);
            if (hive.history.weight.length > 30) hive.history.weight.shift();
            break;
          case 'varroa_outbreak':
            // Simulate a spike in varroa count
            hive.sensors.varroa += 3.5;
            hive.history.varroa.push(hive.sensors.varroa);
            if (hive.history.varroa.length > 30) hive.history.varroa.shift();
            break;
          case 'temperature_spike':
            // Simulate a temperature increase
            hive.sensors.temperature += 5;
            hive.history.temperature.push(hive.sensors.temperature);
            if (hive.history.temperature.length > 30) hive.history.temperature.shift();
            break;
          default:
            break;
        }
        
        // Update status and last updated time
        hive.status = determineHiveStatus(hive);
        hive.lastUpdated = new Date().toISOString();
        
        // Mark for syncing
        state.needsSyncing = true;
      }
    },
    updateHive: (state, action) => {
      const { id, name, location, notes } = action.payload;
      const hiveIndex = state.hives.findIndex(hive => hive.id === id);
      
      if (hiveIndex !== -1) {
        state.hives[hiveIndex].name = name;
        state.hives[hiveIndex].location = location;
        state.hives[hiveIndex].notes = notes;
        state.hives[hiveIndex].lastUpdated = new Date().toISOString();
        
        // Mark for syncing
        state.needsSyncing = true;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Handle fetchHives
      .addCase(fetchHives.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchHives.fulfilled, (state, action) => {
        state.hives = action.payload;
        state.loading = false;
        state.error = null;
        state.lastSynced = new Date().toISOString();
        
        // If we have hives and none selected, select the first one
        if (state.hives.length > 0 && !state.selectedHiveId) {
          state.selectedHiveId = state.hives[0].id;
        }
      })
      .addCase(fetchHives.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch hives';
      })
      
      // Handle saveHive
      .addCase(saveHive.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(saveHive.fulfilled, (state, action) => {
        const updatedHive = action.payload;
        const index = state.hives.findIndex(h => h.id === updatedHive.id);
        
        if (index !== -1) {
          state.hives[index] = updatedHive;
        } else {
          state.hives.push(updatedHive);
        }
        
        state.loading = false;
        state.lastSynced = new Date().toISOString();
        state.needsSyncing = false;
      })
      .addCase(saveHive.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to save hive';
      })
      
      // Handle deleteHive
      .addCase(deleteHive.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteHive.fulfilled, (state, action) => {
        const hiveId = action.payload;
        state.hives = state.hives.filter(hive => hive.id !== hiveId);
        
        // If the removed hive was selected, select the first available hive
        if (state.selectedHiveId === hiveId && state.hives.length > 0) {
          state.selectedHiveId = state.hives[0].id;
        } else if (state.hives.length === 0) {
          state.selectedHiveId = null;
        }
        
        state.loading = false;
        state.lastSynced = new Date().toISOString();
      })
      .addCase(deleteHive.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to delete hive';
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
  updateHiveSensor, 
  selectHive, 
  simulateHiveEvent,
  updateHive
} = hiveSlice.actions;

export default hiveSlice.reducer; 
import { createSlice } from '@reduxjs/toolkit';

// Mock data for simulated hives
const initialHives = [
  {
    id: '1',
    name: 'Hive Alpha',
    location: 'North Field',
    sensors: {
      temperature: 35.2,
      humidity: 65,
      varroa: 0.5,
      weight: 72.3,
    },
    status: 'healthy', // healthy, warning, critical
    lastUpdated: new Date().toISOString(),
    history: {
      temperature: [34, 35, 34.5, 35.2],
      humidity: [67, 65, 66, 65],
      varroa: [0.3, 0.4, 0.45, 0.5],
      weight: [70.5, 71.0, 71.8, 72.3],
    },
  },
  {
    id: '2',
    name: 'Hive Beta',
    location: 'South Garden',
    sensors: {
      temperature: 33.8,
      humidity: 72,
      varroa: 1.2,
      weight: 68.5,
    },
    status: 'warning', // higher varroa levels
    lastUpdated: new Date().toISOString(),
    history: {
      temperature: [33, 33.5, 33.7, 33.8],
      humidity: [70, 71, 71.5, 72],
      varroa: [0.8, 0.9, 1.1, 1.2],
      weight: [67.0, 67.5, 68.0, 68.5],
    },
  },
];

const hiveSlice = createSlice({
  name: 'hives',
  initialState: {
    hives: initialHives,
    selectedHiveId: '1',
  },
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
      }
    },
    selectHive: (state, action) => {
      state.selectedHiveId = action.payload;
    },
    addHive: (state, action) => {
      state.hives.push({
        id: Date.now().toString(),
        name: action.payload.name,
        location: action.payload.location,
        sensors: {
          temperature: 0,
          humidity: 0,
          varroa: 0,
          weight: 0,
        },
        status: 'unknown',
        lastUpdated: new Date().toISOString(),
        history: {
          temperature: [],
          humidity: [],
          varroa: [],
          weight: [],
        },
      });
    },
    removeHive: (state, action) => {
      state.hives = state.hives.filter(hive => hive.id !== action.payload);
      // If the selected hive is removed, select the first one
      if (state.selectedHiveId === action.payload && state.hives.length > 0) {
        state.selectedHiveId = state.hives[0].id;
      }
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
      }
    },
  },
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
  addHive,
  removeHive,
  simulateHiveEvent
} = hiveSlice.actions;

export default hiveSlice.reducer; 
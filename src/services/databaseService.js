import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, onChildAdded, query, limitToLast, orderByKey, orderByChild, startAt } from 'firebase/database';

// Firebase database URL (same as the one used in Unity simulator)
const FIREBASE_DATABASE_URL = 'https://hive-f7c39-default-rtdb.europe-west1.firebasedatabase.app';

// Initialize Firebase App and Realtime Database for events
const firebaseConfig = {
  databaseURL: FIREBASE_DATABASE_URL,
};
const firebaseApp = initializeApp(firebaseConfig);
const realtimeDb = getDatabase(firebaseApp);

// API base URL - change to your actual deployed server URL
const API_BASE_URL = 'https://hiveapp2.onrender.com/api';

// Token storage key
const TOKEN_STORAGE_KEY = '@hiveapp:auth_token';

// Database service for MongoDB integration
class DatabaseService {
  constructor() {
    this.isInitialized = false;
    this.currentUser = null;
    this.token = null;
    this.firebaseEnabled = true; // Enable Firebase integration by default
  }

  // Set auth token for API requests
  setAuthToken(token) {
    this.token = token;
    // Set default auth header for axios
    axios.defaults.headers.common['x-auth-token'] = token;
  }

  // Remove auth token
  removeAuthToken() {
    this.token = null;
    delete axios.defaults.headers.common['x-auth-token'];
  }

  // Get axios config with auth header
  getConfig() {
    return {
      headers: {
        'x-auth-token': this.token
      }
    };
  }

  // Initialize the database service
  async initialize() {
    try {
      this.isInitialized = true;
      
      // Try to get token from AsyncStorage
      try {
        const token = await AsyncStorage.getItem(TOKEN_STORAGE_KEY);
        if (token) {
          this.setAuthToken(token);
          
          // Validate token by getting user profile
          try {
            const userResponse = await axios.get(`${API_BASE_URL}/users/me`, this.getConfig());
            this.currentUser = userResponse.data;
          } catch (error) {
            // Token invalid or expired
            this.removeAuthToken();
            await AsyncStorage.removeItem(TOKEN_STORAGE_KEY);
          }
        }
      } catch (storageError) {
        console.error('Error accessing AsyncStorage:', storageError);
      }
      
      return true;
    } catch (error) {
      console.error('Error initializing database service:', error);
      this.isInitialized = true; // Still mark as initialized to avoid repeat attempts
      return false;
    }
  }

  // USER OPERATIONS
  
  // Get all users
  async getUsers() {
    // This should be an admin-only function, not implemented in client
    throw new Error('Getting all users is not supported in the client');
  }
  
  // Login user
  async loginUser(email, password) {
    try {
      const response = await axios.post(`${API_BASE_URL}/users/login`, { email, password });
      
      if (response.data && response.data.token) {
        // Save token to AsyncStorage
        await AsyncStorage.setItem(TOKEN_STORAGE_KEY, response.data.token);
        this.setAuthToken(response.data.token);
        
        // Get user profile
        const userResponse = await axios.get(`${API_BASE_URL}/users/me`, this.getConfig());
        this.currentUser = userResponse.data;
        
        return this.currentUser;
      }
      
      return null;
    } catch (error) {
      console.error('Error logging in user:', error);
      return null;
    }
  }
  
  // Register new user
  async registerUser(userData) {
    try {
      const response = await axios.post(`${API_BASE_URL}/users/register`, userData);
      
      if (response.data && response.data.token) {
        // Save token to AsyncStorage
        await AsyncStorage.setItem(TOKEN_STORAGE_KEY, response.data.token);
        this.setAuthToken(response.data.token);
        
        // Get user profile
        const userResponse = await axios.get(`${API_BASE_URL}/users/me`, this.getConfig());
        this.currentUser = userResponse.data;
        
        return this.currentUser;
      }
      
      return null;
    } catch (error) {
      console.error('Error registering user:', error);
      throw new Error(error.response?.data?.msg || 'Registration failed');
    }
  }

  // Logout user
  async logoutUser() {
    try {
      this.currentUser = null;
      this.removeAuthToken();
      await AsyncStorage.removeItem(TOKEN_STORAGE_KEY);
      return true;
    } catch (error) {
      console.error('Error logging out user:', error);
      return false;
    }
  }

  // Get current user
  getCurrentUser() {
    return this.currentUser;
  }

  // HIVE OPERATIONS
  
  // Get all hives for current user
  async getHives() {
    try {
      const response = await axios.get(`${API_BASE_URL}/hives`, this.getConfig());
      return response.data;
    } catch (error) {
      console.error('Error getting hives:', error);
      return [];
    }
  }

  // Add or Update Hive (Handles both modes)
  async updateHive(hiveData, isAddMode = false) {
    try {
      // On add mode, we need to fetch Firebase data to verify the hive exists
      if (isAddMode) {
        try {
          // First verify this hive exists in Firebase
          const firebaseData = await this.fetchFirebaseHiveData(hiveData.id);
          
          if (!firebaseData) {
            throw new Error(`Hive ID ${hiveData.id} not found in the simulator database (Firebase). Please check the ID or QR code.`);
          }
          
          console.log(`Firebase data found for hive ${hiveData.id}:`, firebaseData);
          
          // Check if this hive exists for the user first to avoid duplicate creation
          try {
            const existingHives = await this.getHives();
            const duplicateHive = existingHives.find(h => h.id === hiveData.id);
            
            if (duplicateHive) {
              console.warn(`Hive ID ${hiveData.id} already exists in user's collection.`);
              return duplicateHive; // Just return the existing hive
            }
          } catch (checkError) {
            console.warn(`Error checking for existing hive: ${checkError.message}`);
            // Continue with creation attempt
          }
          
          // Make sure hiveData has all required fields for creating a new hive
          const completeHiveData = {
            id: hiveData.id,
            name: hiveData.name || `Hive ${hiveData.id}`,
            location: hiveData.location || 'Unknown location',
            notes: hiveData.notes || '',
            // Optionally include sensors directly from Firebase
            sensors: firebaseData.sensors
          };
          
          // Create the hive via POST with retries
          let retries = 3; // Increased from 2 to 3
          let lastError = null;
          
          while (retries >= 0) {
            try {
              console.log(`Attempting to create hive in backend (attempt ${4-retries}/4):`, completeHiveData);
              const response = await axios.post(`${API_BASE_URL}/hives`, completeHiveData, this.getConfig());
              console.log(`Hive created successfully:`, response.data);
              return response.data;
            } catch (postError) {
              lastError = postError;
              const statusCode = postError.response?.status;
              
              // If we get a 400 error with a duplicate message, the hive might already exist
              if (statusCode === 400 && postError.response?.data?.msg?.includes('already exists')) {
                console.log('Hive already exists, trying to fetch it instead');
                try {
                  // Try to get the existing hive
                  const hives = await this.getHives();
                  const existingHive = hives.find(h => h.id === hiveData.id);
                  if (existingHive) {
                    return existingHive;
                  }
                } catch (fetchError) {
                  console.error('Failed to fetch existing hive:', fetchError);
                }
              }
              
              // No need to retry for client errors except 500 server errors
              if (statusCode && statusCode !== 500 && statusCode < 500) {
                console.error(`Client error (${statusCode}), not retrying:`, postError.response?.data);
                break;
              }
              
              if (retries > 0) {
                console.log(`Retrying hive creation (${retries} attempts left)...`);
                // Increase wait time between retries
                await new Promise(resolve => setTimeout(resolve, 2000 * (4-retries))); // Progressive backoff
              }
              retries--;
            }
          }
          
          // If we get here, all retries failed
          console.error('All hive creation attempts failed:', lastError?.response?.data || lastError);
          throw lastError;
        } catch (error) {
          console.error('Error verifying hive on Firebase:', error);
          throw error;
        }
      } else {
        // Update existing hive via PUT
        const response = await axios.put(`${API_BASE_URL}/hives/${hiveData.id}`, hiveData, this.getConfig());
        return response.data;
      }
    } catch (error) {
      console.error('Error updating hive:', error);
      throw error;
    }
  }

  // Fetch a specific hive's sensor data from Firebase
  async fetchFirebaseHiveData(hiveId) {
    if (!this.firebaseEnabled) {
      console.log('Firebase integration is disabled');
      return null;
    }
    
    try {
      // Add cache-busting parameter to avoid cached responses
      const timestamp = Date.now();
      const url = `${FIREBASE_DATABASE_URL}/hives/${hiveId}/sensors.json?_cb=${timestamp}`;
      console.log(`Fetching Firebase data from: ${url}`);
      
      const response = await axios.get(url);
      
      if (response.data) {
        console.log(`Firebase data received for hive ${hiveId}:`, response.data);
        return {
          id: hiveId,
          sensors: response.data
        };
      } else {
        console.log(`No sensor data found in Firebase for hive ID: ${hiveId}`);
        return null; // Indicate hive not found or no sensor data
      }
    } catch (error) {
      if (error.response) {
        if (error.response.status === 404) {
          console.log(`Firebase path not found for hive ID: ${hiveId}`);
          return null;
        }
        console.error(`Error fetching data for hive ${hiveId} from Firebase (${error.response.status}):`, error.message);
      } else if (error.request) {
        console.error(`Error fetching data for hive ${hiveId} from Firebase (no response):`, error.message);
      } else {
        console.error(`Error fetching data for hive ${hiveId} from Firebase:`, error.message);
      }
      throw error;
    }
  }

  // Update sensor data for a hive
  async updateHiveSensors(hiveId) {
    try {
      const response = await axios.put(`${API_BASE_URL}/hives/${hiveId}/sensors`, {}, this.getConfig());
      return response.data;
    } catch (error) {
      console.error('Error updating hive sensors:', error);
      throw error;
    }
  }

  // Update local hive sensor data from Firebase
  async updateLocalHiveSensors(hiveId) {
    try {
      // Fetch the latest data from Firebase
      const firebaseData = await this.fetchFirebaseHiveData(hiveId);
      
      if (!firebaseData || !firebaseData.sensors) {
        console.warn(`No sensor data found in Firebase for hive ID: ${hiveId}`);
        return null;
      }
      
      // Update the hive with the latest sensor data in our backend
      try {
        const updatedHive = await axios.put(
          `${API_BASE_URL}/hives/${hiveId}/sensors`, 
          { sensors: firebaseData.sensors }, 
          this.getConfig()
        );
        return updatedHive.data;
      } catch (apiError) {
        console.error(`Error updating hive ${hiveId} with new sensor data:`, apiError);
        // Even if API update fails, still return Firebase data
        return firebaseData;
      }
    } catch (error) {
      console.error(`Error in updateLocalHiveSensors for hive ${hiveId}:`, error);
      throw error;
    }
  }

  // Delete a hive
  async deleteHive(hiveId) {
    try {
      await axios.delete(`${API_BASE_URL}/hives/${hiveId}`, this.getConfig());
      return true;
    } catch (error) {
      console.error('Error deleting hive:', error);
      return false;
    }
  }

  // Determine hive status based on sensors
  determineHiveStatus(sensors) {
    if (!sensors) return 'offline';
    
    const { temperature, humidity, varroa } = sensors;
    
    if (temperature > 40 || temperature < 5 || humidity > 90 || humidity < 20 || varroa > 5) {
      return 'critical';
    } else if (temperature > 35 || temperature < 10 || humidity > 80 || humidity < 30 || varroa > 3) {
      return 'warning';
    } else {
      return 'healthy';
    }
  }

  // SETTINGS OPERATIONS
  
  // Get user settings
  async getUserSettings() {
    try {
      const response = await axios.get(`${API_BASE_URL}/settings`, this.getConfig());
      return response.data;
    } catch (error) {
      console.error('Error getting user settings:', error);
      return null;
    }
  }
  
  // Save user settings
  async saveUserSettings(settings) {
    try {
      const response = await axios.put(`${API_BASE_URL}/settings`, settings, this.getConfig());
      return response.data;
    } catch (error) {
      console.error('Error saving user settings:', error);
      return false;
    }
  }
  
  // DEVICE OPERATIONS
  
  // Get IoT devices
  async getIoTDevices() {
    try {
      const response = await axios.get(`${API_BASE_URL}/devices`, this.getConfig());
      return response.data;
    } catch (error) {
      console.error('Error getting IoT devices:', error);
      return [];
    }
  }
  
  // Save IoT devices
  async saveIoTDevices(devices) {
    console.warn('This operation is not supported. Use addDevice, updateDevice or deleteDevice instead.');
    return false;
  }
  
  // Add or update IoT device
  async updateIoTDevice(device) {
    try {
      if (device._id) {
        // Update existing device
        const response = await axios.put(`${API_BASE_URL}/devices/${device.id}`, device, this.getConfig());
        return response.data;
      } else {
        // Add new device
        const response = await axios.post(`${API_BASE_URL}/devices`, device, this.getConfig());
        return response.data;
      }
    } catch (error) {
      console.error('Error updating IoT device:', error);
      return null;
    }
  }
  
  // Delete IoT device
  async deleteIoTDevice(deviceId) {
    try {
      await axios.delete(`${API_BASE_URL}/devices/${deviceId}`, this.getConfig());
      return true;
    } catch (error) {
      console.error('Error deleting IoT device:', error);
      return false;
    }
  }
  
  // Associate a device with a hive
  async associateDeviceWithHive(deviceId, hiveId) {
    try {
      const response = await axios.put(
        `${API_BASE_URL}/devices/${deviceId}/associate/${hiveId}`, 
        {}, 
        this.getConfig()
      );
      return response.data;
    } catch (error) {
      console.error('Error associating device with hive:', error);
      return null;
    }
  }

  // DATA OPERATIONS
  
  // Clear all data (for testing/development)
  async clearAllData() {
    console.warn('clearAllData is not supported with the MongoDB backend');
    return false;
  }
  
  // Export data (for backup)
  async exportData() {
    try {
      // This would require a special endpoint on the server
      console.warn('exportData is not implemented yet');
      return null;
    } catch (error) {
      console.error('Error exporting data:', error);
      return null;
    }
  }
  
  // Import data (from backup)
  async importData(jsonData) {
    try {
      // This would require a special endpoint on the server
      console.warn('importData is not implemented yet');
      return false;
    } catch (error) {
      console.error('Error importing data:', error);
      return false;
    }
  }
  
  // Subscribe to Firebase events
  subscribeToEvents(callback, lastKnownTimestamp = 0) {
    if (!this.firebaseEnabled) {
      console.log('Firebase events disabled');
      return () => {};
    }
    
    try {
      const eventsRef = ref(realtimeDb, 'events');
      console.log(`[databaseService] Attempting to attach Firebase listener to /events, starting after timestamp: ${lastKnownTimestamp}`);
      
      // Query to get events ordered by timestamp, starting after the last known one
      // Firebase timestamps are often numbers (milliseconds since epoch)
      const eventsQuery = query(
        eventsRef,
        orderByChild('timestamp'), // Order by the timestamp field
        startAt(lastKnownTimestamp + 1) // Start at the next millisecond
      );
      
      // Create a set to track processed event keys for this session
      const processedEventKeys = new Set();
      
      // Set up event listener for newly added children matching the query
      const unsubscribe = onChildAdded(eventsQuery, (snapshot) => {
        const eventKey = snapshot.key;
        
        // Secondary check: Skip if we've already processed this key in this session
        if (processedEventKeys.has(eventKey)) {
          return;
        }
        processedEventKeys.add(eventKey);
        
        const event = snapshot.val();
        if (event) {
          // Ensure timestamp exists (redundant with query, but safe)
          const eventTimestamp = event.timestamp || Date.now();
          
          // Defensive check: ensure event is actually newer (Firebase queries can sometimes be approximate)
          if (eventTimestamp <= lastKnownTimestamp) {
             console.warn(`[databaseService] Received event ${eventKey} with timestamp ${eventTimestamp} which is not newer than ${lastKnownTimestamp}. Skipping.`);
             return;
          }

          console.log('[databaseService] New Firebase event detected:', eventKey, event);
          
          // Pass the event to the callback
          if (typeof callback === 'function') {
            callback({
              ...event,
              timestamp: eventTimestamp, // Ensure we use the determined timestamp
              key: eventKey
            });
          }
        }
      }, (error) => {
        console.error('[databaseService] Firebase listener error:', error);
      });
      
      console.log('[databaseService] Firebase listener attached successfully.');
      
      return unsubscribe; // Return function to unsubscribe
    } catch (error) {
      console.error('[databaseService] Error subscribing to Firebase events:', error);
      return () => {}; // Return empty function as fallback
    }
  }
}

const databaseService = new DatabaseService();
export default databaseService;
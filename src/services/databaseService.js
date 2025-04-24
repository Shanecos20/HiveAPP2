import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import axios from 'axios';
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, onChildAdded } from 'firebase/database';

// Firebase database URL (same as the one used in Unity simulator)
const FIREBASE_DATABASE_URL = 'https://hive-f7c39-default-rtdb.europe-west1.firebasedatabase.app';

// Initialize Firebase App and Realtime Database for events
const firebaseConfig = {
  databaseURL: FIREBASE_DATABASE_URL,
};
const firebaseApp = initializeApp(firebaseConfig);
const realtimeDb = getDatabase(firebaseApp);

// Storage keys
const STORAGE_KEYS = {
  HIVES: '@hiveapp:hives',
  USER_SETTINGS: '@hiveapp:user_settings',
  NOTIFICATIONS: '@hiveapp:notifications',
  IOT_DEVICES: '@hiveapp:iot_devices',
  USERS: '@hiveapp:users',
  CURRENT_USER: '@hiveapp:current_user'
};

// Database service for local storage and future remote database integration
class DatabaseService {
  constructor() {
    this.isInitialized = false;
    this.remoteAvailable = false;
    this.remoteUrl = '';
    this.currentUser = null;
    this.firebaseEnabled = true; // Enable Firebase integration by default
  }

  // Initialize the database service
  async initialize() {
    try {
      // Check if we have remote database configuration saved
      const remoteConfig = await AsyncStorage.getItem('@hiveapp:remote_config');
      if (remoteConfig) {
        const config = JSON.parse(remoteConfig);
        this.remoteUrl = config.url;
        // We could test connection here
        this.remoteAvailable = !!config.enabled;
      }
      
      // Try to load the current user
      const currentUserJson = await AsyncStorage.getItem(STORAGE_KEYS.CURRENT_USER);
      if (currentUserJson) {
        this.currentUser = JSON.parse(currentUserJson);
      }
      
      // Migrate old hives data if needed
      await this.migrateHivesData();
      
      this.isInitialized = true;
      console.log(`Database service initialized. Remote DB ${this.remoteAvailable ? 'available' : 'not configured'}`);
      return true;
    } catch (error) {
      console.error('Error initializing database service:', error);
      this.isInitialized = true; // Still mark as initialized to avoid repeat attempts
      return false;
    }
  }

  // Migrate old hives data to new user-specific format
  async migrateHivesData() {
    try {
      // Only proceed if we have a current user
      if (!this.currentUser) {
        return;
      }
      
      const rawHives = await AsyncStorage.getItem(STORAGE_KEYS.HIVES);
      
      // If no data exists, we're done
      if (!rawHives) {
        return;
      }
      
      let hivesData = JSON.parse(rawHives);
      
      // Check if it's in the old format (an array instead of an object)
      if (Array.isArray(hivesData)) {
        console.log('Migrating hives data to user-specific format');
        
        // Create new format
        const newHivesData = {};
        newHivesData[this.currentUser.id] = hivesData.map(hive => ({
          ...hive,
          userId: this.currentUser.id // Add user ID to each hive
        }));
        
        // Save in new format
        await AsyncStorage.setItem(STORAGE_KEYS.HIVES, JSON.stringify(newHivesData));
        console.log('Hives data migration completed');
      }
    } catch (error) {
      console.error('Error migrating hives data:', error);
    }
  }

  // Configure remote database connection
  async configureRemoteDatabase(url, enabled = false) {
    try {
      const config = {
        url,
        enabled,
        lastUpdated: new Date().toISOString()
      };
      
      await AsyncStorage.setItem('@hiveapp:remote_config', JSON.stringify(config));
      this.remoteUrl = url;
      this.remoteAvailable = enabled;
      
      return true;
    } catch (error) {
      console.error('Error configuring remote database:', error);
      return false;
    }
  }

  // USER OPERATIONS
  
  // Get all users
  async getUsers() {
    try {
      const users = await AsyncStorage.getItem(STORAGE_KEYS.USERS);
      return users ? JSON.parse(users) : [];
    } catch (error) {
      console.error('Error getting users:', error);
      return [];
    }
  }
  
  // Save all users
  async saveUsers(users) {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
      return true;
    } catch (error) {
      console.error('Error saving users:', error);
      return false;
    }
  }
  
  // Add or update a user
  async updateUser(user) {
    try {
      const users = await this.getUsers();
      const index = users.findIndex(u => u.id === user.id);
      
      if (index !== -1) {
        // Update existing user
        users[index] = { ...users[index], ...user };
      } else {
        // Add new user
        users.push({
          ...user,
          id: user.id || Date.now().toString()
        });
      }
      
      return await this.saveUsers(users);
    } catch (error) {
      console.error('Error updating user:', error);
      return false;
    }
  }
  
  // Login user
  async loginUser(email, password) {
    try {
      const users = await this.getUsers();
      const user = users.find(u => u.email === email && u.password === password);
      
      if (user) {
        // Save current user to AsyncStorage
        const userWithoutPassword = { ...user };
        delete userWithoutPassword.password;
        
        await AsyncStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(userWithoutPassword));
        this.currentUser = userWithoutPassword;
        
        return userWithoutPassword;
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
      const users = await this.getUsers();
      
      // Check if email already exists
      const existingUser = users.find(u => u.email === userData.email);
      if (existingUser) {
        return { success: false, message: 'Email already registered' };
      }
      
      // Create new user with ID and timestamps
      const newUser = {
        ...userData,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      // Add to users array
      users.push(newUser);
      await this.saveUsers(users);
      
      // Save as current user (without password)
      const userWithoutPassword = { ...newUser };
      delete userWithoutPassword.password;
      
      await AsyncStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(userWithoutPassword));
      this.currentUser = userWithoutPassword;
      
      return { success: true, user: userWithoutPassword };
    } catch (error) {
      console.error('Error registering user:', error);
      return { success: false, message: 'Registration failed' };
    }
  }
  
  // Logout user
  async logoutUser() {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
      this.currentUser = null;
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
  
  // Get all hives *from local storage* for the current user
  async getHives() {
    return this.getLocalHives(); // Simplified: Always return local hives
  }

  // Get hives from local storage (Internal helper)
  async getLocalHives() {
    try {
      if (!this.currentUser) {
        return [];
      }
      
      const rawHives = await AsyncStorage.getItem(STORAGE_KEYS.HIVES);
      if (!rawHives) {
        return [];
      }
      
      let hivesData = JSON.parse(rawHives);
      
      // Handle potential old format
      if (Array.isArray(hivesData)) {
        console.log('Applying migration logic within getLocalHives');
        const migratedData = { [this.currentUser.id]: hivesData.map(hive => ({ ...hive, userId: this.currentUser.id })) };
        await AsyncStorage.setItem(STORAGE_KEYS.HIVES, JSON.stringify(migratedData));
        return migratedData[this.currentUser.id] || [];
      } else if (typeof hivesData === 'object' && hivesData !== null) {
        // New format
        return hivesData[this.currentUser.id] || [];
      } else {
        // Invalid data format
        console.warn('Invalid hives data format found in AsyncStorage.');
        return [];
      }
    } catch (error) {
      console.error('Error getting local hives:', error);
      return [];
    }
  }
  
  // Save hives to local storage (Internal helper)
  async saveLocalHives(userHives) {
    try {
      if (!this.currentUser) {
        return false;
      }
      
      const rawHives = await AsyncStorage.getItem(STORAGE_KEYS.HIVES);
      let hivesData = rawHives ? JSON.parse(rawHives) : {};
      
      // Ensure object format
      if (Array.isArray(hivesData)) {
         hivesData = { [this.currentUser.id]: [] }; // Initialize if old format found
      }
      if (typeof hivesData !== 'object' || hivesData === null) {
          hivesData = {}; // Initialize if invalid format
      }
      
      hivesData[this.currentUser.id] = userHives;
      await AsyncStorage.setItem(STORAGE_KEYS.HIVES, JSON.stringify(hivesData));
      return true;
    } catch (error) {
      console.error('Error saving local hives:', error);
      return false;
    }
  }
  
  // Fetch *specific* hive sensor data from Firebase
  async fetchFirebaseHiveData(hiveId) {
    if (!this.firebaseEnabled) {
      console.log('Firebase fetching is disabled.');
      return null;
    }
    try {
      const response = await axios.get(`${FIREBASE_DATABASE_URL}/hives/${hiveId}/sensors.json`);
      if (response.data) {
        // Return just the sensor data object
        return {
          id: hiveId,
          sensors: response.data
        };
      } else {
        console.log(`No sensor data found in Firebase for hive ID: ${hiveId}`);
        return null; // Indicate hive not found or no sensor data
      }
    } catch (error) {
      // Handle 404 specifically? Axios might throw for 404
      if (error.response && error.response.status === 404) {
         console.log(`Firebase path not found for hive ID: ${hiveId}`);
         return null; 
      } 
      console.error(`Error fetching data for hive ${hiveId} from Firebase:`, error);
      // Don't re-throw, return null to indicate failure
      return null;
    }
  }
  
  // Add or Update Hive (Handles both modes)
  async updateHive(hiveData, isAddMode = false) {
    try {
      if (!this.currentUser) {
        throw new Error("No user logged in.");
      }
      
      const localHives = await this.getLocalHives();
      
      if (isAddMode) {
        // === ADD MODE ===
        // 1. Check if hive ID already exists locally
        const alreadyExistsLocally = localHives.some(h => h.id === hiveData.id);
        if (alreadyExistsLocally) {
          throw new Error(`Hive with ID ${hiveData.id} already exists locally.`);
        }
        
        // 2. Verify hive exists in Firebase and get initial sensor data
        const firebaseData = await this.fetchFirebaseHiveData(hiveData.id);
        if (!firebaseData || !firebaseData.sensors) {
          throw new Error(`Hive ID ${hiveData.id} not found in the simulator database (Firebase). Please check the ID or QR code.`);
        }
        
        // 3. Create the full new hive object
        const newHive = {
          ...hiveData, // Includes id, name, location, notes from input
          userId: this.currentUser.id,
          sensors: firebaseData.sensors, // Initial sensor data
          history: {
            temperature: [firebaseData.sensors.temperature].filter(v => v !== undefined),
            humidity: [firebaseData.sensors.humidity].filter(v => v !== undefined),
            varroa: [firebaseData.sensors.varroa].filter(v => v !== undefined),
            weight: [firebaseData.sensors.weight].filter(v => v !== undefined),
            sound: [firebaseData.sensors.sound].filter(v => v !== undefined),
            camera: [firebaseData.sensors.camera].filter(v => v !== undefined),
          },
          createdAt: new Date().toISOString(),
          lastUpdated: firebaseData.sensors.timestamp
             ? new Date(firebaseData.sensors.timestamp).toISOString()
             : new Date().toISOString(),
          status: this.determineHiveStatus(firebaseData.sensors),
        };
        
        localHives.push(newHive);
        await this.saveLocalHives(localHives);
        return newHive; // Return the newly created hive

      } else {
        // === EDIT MODE ===
        const index = localHives.findIndex(h => h.id === hiveData.id);
        if (index !== -1) {
          // Only update fields that can be edited (name, location, notes)
          localHives[index] = {
            ...localHives[index], // Keep existing sensors, history, status etc.
            name: hiveData.name,
            location: hiveData.location,
            notes: hiveData.notes,
            lastUpdated: new Date().toISOString(), // Update timestamp on edit
          };
          await this.saveLocalHives(localHives);
          return localHives[index]; // Return the updated hive
        } else {
          throw new Error("Hive not found for editing.");
        }
      }
    } catch (error) {
      console.error('Error in updateHive:', error);
      throw error; // Re-throw the error to be caught by the thunk
    }
  }
  
  // Method to update a local hive's sensor data and history from Firebase data
  async updateLocalHiveSensors(hiveId, firebaseSensorData) {
     if (!this.currentUser || !firebaseSensorData) {
         return false;
     }
     try {
         const localHives = await this.getLocalHives();
         const index = localHives.findIndex(h => h.id === hiveId);

         if (index !== -1) {
             const hive = localHives[index];
             hive.sensors = firebaseSensorData; // Update sensors
             hive.lastUpdated = firebaseSensorData.timestamp
                 ? new Date(firebaseSensorData.timestamp).toISOString()
                 : new Date().toISOString();
             hive.status = this.determineHiveStatus(firebaseSensorData);

             // Update history for all sensor keys (including new ones)
             Object.keys(firebaseSensorData).forEach(key => {
                 if (key === 'timestamp') return;
                 // Ensure history array exists
                 if (!Array.isArray(hive.history[key])) {
                     hive.history[key] = [];
                 }
                 hive.history[key].push(firebaseSensorData[key]);
                 if (hive.history[key].length > 30) { // Keep last 30 readings
                     hive.history[key].shift();
                 }
             });

             await this.saveLocalHives(localHives);
             return true;
         }
         return false;
     } catch (error) {
         console.error(`Error updating local sensors for hive ${hiveId}:`, error);
         return false;
     }
  }

  // Determine Hive Status (moved from hiveSlice)
  determineHiveStatus(sensors) {
    const { temperature, humidity, varroa } = sensors || {};
    
    if (temperature === undefined || humidity === undefined || varroa === undefined) {
      return 'unknown';
    }
    
    if (temperature > 40 || temperature < 30 || varroa > 3 || humidity > 90 || humidity < 40) {
      return 'critical';
    }
    if (temperature > 38 || temperature < 32 || varroa > 1 || humidity > 80 || humidity < 50) {
      return 'warning';
    }
    return 'healthy';
  }

  // Delete Hive (remains the same, operates on local data)
  async deleteHive(hiveId) {
     try {
       if (!this.currentUser) {
         return false;
       }
       const localHives = await this.getLocalHives();
       const filteredHives = localHives.filter(hive => hive.id !== hiveId);
       return await this.saveLocalHives(filteredHives);
     } catch (error) {
       console.error('Error deleting hive:', error);
       return false;
     }
   }
  
  // USER SETTINGS OPERATIONS
  
  // Get user settings
  async getUserSettings() {
    try {
      const settings = await AsyncStorage.getItem(STORAGE_KEYS.USER_SETTINGS);
      return settings ? JSON.parse(settings) : { 
        darkMode: false,
        notificationsEnabled: true,
        autoSync: Platform.OS === 'ios' ? false : true  // Default to off for iOS due to background restrictions
      };
    } catch (error) {
      console.error('Error getting user settings:', error);
      return { darkMode: false, notificationsEnabled: true, autoSync: false };
    }
  }
  
  // Save user settings
  async saveUserSettings(settings) {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.USER_SETTINGS, JSON.stringify(settings));
      return true;
    } catch (error) {
      console.error('Error saving user settings:', error);
      return false;
    }
  }
  
  // IOT DEVICE OPERATIONS
  
  // Get all IoT devices
  async getIoTDevices() {
    try {
      const devices = await AsyncStorage.getItem(STORAGE_KEYS.IOT_DEVICES);
      return devices ? JSON.parse(devices) : [];
    } catch (error) {
      console.error('Error getting IoT devices:', error);
      return [];
    }
  }
  
  // Save all IoT devices
  async saveIoTDevices(devices) {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.IOT_DEVICES, JSON.stringify(devices));
      return true;
    } catch (error) {
      console.error('Error saving IoT devices:', error);
      return false;
    }
  }
  
  // Add or update IoT device
  async updateIoTDevice(device) {
    try {
      const devices = await this.getIoTDevices();
      const index = devices.findIndex(d => d.id === device.id);
      
      if (index !== -1) {
        devices[index] = { ...devices[index], ...device };
      } else {
        devices.push({
          ...device,
          id: device.id || Date.now().toString()
        });
      }
      
      return await this.saveIoTDevices(devices);
    } catch (error) {
      console.error('Error updating IoT device:', error);
      return false;
    }
  }
  
  // Associate IoT device with a hive
  async associateDeviceWithHive(deviceId, hiveId) {
    try {
      // Update the device
      const devices = await this.getIoTDevices();
      const deviceIndex = devices.findIndex(d => d.id === deviceId);
      
      if (deviceIndex !== -1) {
        devices[deviceIndex].hiveId = hiveId;
        await this.saveIoTDevices(devices);
      }
      
      // Update the hive
      const hives = await this.getHives();
      const hiveIndex = hives.findIndex(h => h.id === hiveId);
      
      if (hiveIndex !== -1) {
        if (!hives[hiveIndex].devices) {
          hives[hiveIndex].devices = [];
        }
        
        if (!hives[hiveIndex].devices.includes(deviceId)) {
          hives[hiveIndex].devices.push(deviceId);
          await this.saveHives(hives);
        }
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error associating device with hive:', error);
      return false;
    }
  }
  
  // UTILITY METHODS
  
  // Clear all data (for testing or logout)
  async clearAllData() {
    try {
      const keys = Object.values(STORAGE_KEYS);
      await AsyncStorage.multiRemove(keys);
      return true;
    } catch (error) {
      console.error('Error clearing all data:', error);
      return false;
    }
  }
  
  // Export all data as JSON
  async exportData() {
    try {
      const exportedData = {};
      
      for (const key of Object.values(STORAGE_KEYS)) {
        const data = await AsyncStorage.getItem(key);
        if (data) {
          exportedData[key] = JSON.parse(data);
        }
      }
      
      return JSON.stringify(exportedData);
    } catch (error) {
      console.error('Error exporting data:', error);
      return null;
    }
  }
  
  // Import data from JSON
  async importData(jsonData) {
    try {
      const data = JSON.parse(jsonData);
      
      for (const [key, value] of Object.entries(data)) {
        await AsyncStorage.setItem(key, JSON.stringify(value));
      }
      
      return true;
    } catch (error) {
      console.error('Error importing data:', error);
      return false;
    }
  }

  // Subscribe to realtime 'events' node for new event entries
  subscribeToEvents(callback) {
    if (!this.firebaseEnabled) {
      console.warn('Firebase events subscription is disabled.');
      return;
    }
    try {
      const eventsRef = ref(realtimeDb, 'events');
      onChildAdded(eventsRef, snapshot => {
        const eventData = snapshot.val();
        const eventId = snapshot.key;
        callback({ id: eventId, ...eventData });
      });
      console.log('Subscribed to Firebase events node.');
    } catch (error) {
      console.error('Error subscribing to Firebase events:', error);
    }
  }
}

// Export a singleton instance
const databaseService = new DatabaseService();
export default databaseService; 
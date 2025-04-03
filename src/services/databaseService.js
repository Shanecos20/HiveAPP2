import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

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
  
  // Get all hives from the database
  async getHives() {
    try {
      // If no user is logged in, return empty array
      if (!this.currentUser) {
        return [];
      }
      
      // Get all hives
      const allHives = await AsyncStorage.getItem(STORAGE_KEYS.HIVES);
      const hives = allHives ? JSON.parse(allHives) : {};
      
      // Return only hives for the current user (or empty array if none exist)
      return hives[this.currentUser.id] || [];
    } catch (error) {
      console.error('Error getting hives:', error);
      return [];
    }
  }
  
  // Save all hives to the database
  async saveHives(userHives) {
    try {
      // If no user is logged in, don't save anything
      if (!this.currentUser) {
        return false;
      }
      
      // Get all hives first
      const allHives = await AsyncStorage.getItem(STORAGE_KEYS.HIVES);
      const hives = allHives ? JSON.parse(allHives) : {};
      
      // Update only the current user's hives
      hives[this.currentUser.id] = userHives;
      
      // Save back to AsyncStorage
      await AsyncStorage.setItem(STORAGE_KEYS.HIVES, JSON.stringify(hives));
      
      // In future, we could sync with remote database here
      if (this.remoteAvailable) {
        // this.syncHivesToRemote(hives);
        console.log('Remote sync would happen here');
      }
      
      return true;
    } catch (error) {
      console.error('Error saving hives:', error);
      return false;
    }
  }
  
  // Update a single hive
  async updateHive(hive) {
    try {
      // If no user is logged in, don't update anything
      if (!this.currentUser) {
        return false;
      }
      
      const hives = await this.getHives();
      const index = hives.findIndex(h => h.id === hive.id);
      
      if (index !== -1) {
        hives[index] = { ...hives[index], ...hive, lastUpdated: new Date().toISOString() };
      } else {
        // New hive, add it
        hives.push({
          ...hive,
          id: hive.id || Date.now().toString(),
          lastUpdated: new Date().toISOString(),
          userId: this.currentUser.id // Add user ID to the hive
        });
      }
      
      return await this.saveHives(hives);
    } catch (error) {
      console.error('Error updating hive:', error);
      return false;
    }
  }
  
  // Delete a hive
  async deleteHive(hiveId) {
    try {
      // If no user is logged in, don't delete anything
      if (!this.currentUser) {
        return false;
      }
      
      const hives = await this.getHives();
      const filteredHives = hives.filter(hive => hive.id !== hiveId);
      
      return await this.saveHives(filteredHives);
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
}

// Export a singleton instance
const databaseService = new DatabaseService();
export default databaseService; 
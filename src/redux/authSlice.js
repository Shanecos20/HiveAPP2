import { createSlice } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import databaseService from '../services/databaseService';
import { resetHives, fetchHives } from './hiveSlice';

// Storage key for users
const USERS_STORAGE_KEY = '@hiveapp:users';

const initialState = {
  isAuthenticated: false,
  user: null,
  error: null,
  userType: null, // 'hobbyist' or 'commercial'
  isLoading: false, // For simulating loading states during authentication
  appSettings: {
    darkMode: false,
    pushNotifications: true,
    dataSync: true,
  }
};

// Simulated user data for demo purposes - these will still work alongside registered users
const mockUsers = [
  {
    id: '1',
    email: 'hobbyist@example.com',
    password: 'password',
    name: 'Hobby Beekeeper',
    userType: 'hobbyist',
  },
  {
    id: '2',
    email: 'commercial@example.com',
    password: 'password',
    name: 'Commercial Beekeeper',
    userType: 'commercial',
  },
];

// Function to load users from AsyncStorage
const loadUsers = async () => {
  try {
    const storedUsers = await AsyncStorage.getItem(USERS_STORAGE_KEY);
    return storedUsers ? JSON.parse(storedUsers) : [];
  } catch (error) {
    console.error('Error loading users from AsyncStorage:', error);
    return [];
  }
};

// Function to save users to AsyncStorage
const saveUsers = async (users) => {
  try {
    await AsyncStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    return true;
  } catch (error) {
    console.error('Error saving users to AsyncStorage:', error);
    return false;
  }
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginStart: (state) => {
      state.isLoading = true;
      state.error = null;
    },
    loginSuccess: (state, action) => {
      state.isAuthenticated = true;
      state.user = {
        id: action.payload.id,
        email: action.payload.email,
        name: action.payload.name,
      };
      state.userType = action.payload.userType;
      state.isLoading = false;
      state.error = null;
    },
    loginFailure: (state, action) => {
      state.isAuthenticated = false;
      state.user = null;
      state.isLoading = false;
      state.error = action.payload;
    },
    logout: (state) => {
      state.isAuthenticated = false;
      state.user = null;
      state.userType = null;
      state.error = null;
    },
    clearError: (state) => {
      state.error = null;
    },
    registerStart: (state) => {
      state.isLoading = true;
      state.error = null;
    },
    registerSuccess: (state, action) => {
      state.isAuthenticated = true;
      state.user = {
        id: action.payload.id,
        email: action.payload.email,
        name: action.payload.name,
      };
      state.userType = action.payload.userType;
      state.isLoading = false;
      state.error = null;
    },
    registerFailure: (state, action) => {
      state.isLoading = false;
      state.error = action.payload;
    },
    setUserType: (state, action) => {
      state.userType = action.payload;
    },
    loginDemo: (state, action) => {
      state.isAuthenticated = true;
      state.isLoading = false;
      state.user = action.payload;
      state.error = null;
    },
    updateAppSettings: (state, action) => {
      state.appSettings = {
        ...state.appSettings,
        ...action.payload,
      };
    },
    // New action to restore session from AsyncStorage
    restoreSession: (state, action) => {
      if (action.payload) {
        state.isAuthenticated = true;
        state.user = action.payload;
        state.userType = action.payload.userType;
      }
    },
  },
});

// Thunk to check for existing session on app start
export const checkAuthState = () => async (dispatch) => {
  try {
    // Check if we have a user already logged in
    const currentUser = databaseService.getCurrentUser();
    
    if (currentUser) {
      dispatch(restoreSession(currentUser));
      
      // Also fetch the user's hives when restoring session
      dispatch(fetchHives());
      
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error checking auth state:', error);
    return false;
  }
};

// Thunk for login
export const login = (email, password) => async (dispatch) => {
  dispatch(loginStart());
  
  // Simulate API request delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // First check mock users
  const mockUser = mockUsers.find(u => u.email === email && u.password === password);
  
  if (mockUser) {
    // For mock users, persist the user in AsyncStorage for session restoration
    const userWithoutPassword = { 
      id: mockUser.id,
      email: mockUser.email,
      name: mockUser.name,
      userType: mockUser.userType 
    };
    
    await AsyncStorage.setItem('@hiveapp:current_user', JSON.stringify(userWithoutPassword));
    
    dispatch(loginSuccess(userWithoutPassword));
    
    // Load the user's hives after successful login
    dispatch(fetchHives());
    
    return true;
  }
  
  // Then check registered users
  try {
    const user = await databaseService.loginUser(email, password);
    
    if (user) {
      dispatch(loginSuccess(user));
      
      // Load the user's hives after successful login
      dispatch(fetchHives());
      
      return true;
    } else {
      dispatch(loginFailure('Invalid email or password'));
      return false;
    }
  } catch (error) {
    console.error('Error during login:', error);
    dispatch(loginFailure('An error occurred during login'));
    return false;
  }
};

// Thunk for registration
export const register = (email, password, name, userType) => async (dispatch) => {
  dispatch(registerStart());
  
  // Simulate API request delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  try {
    // Check if user already exists in mock users
    const userExistsInMock = mockUsers.some(u => u.email === email);
    
    if (userExistsInMock) {
      dispatch(registerFailure('User with this email already exists'));
      return false;
    }
    
    // Register using database service
    const result = await databaseService.registerUser({
      email,
      password, // In a real app, this should be hashed
      name,
      userType,
    });
    
    if (result.success) {
      dispatch(registerSuccess(result.user));
      
      // Initialize empty hives list for the new user
      dispatch(fetchHives());
      
      return true;
    } else {
      dispatch(registerFailure(result.message || 'Registration failed'));
      return false;
    }
  } catch (error) {
    console.error('Error during registration:', error);
    dispatch(registerFailure('An error occurred during registration'));
    return false;
  }
};

// Thunk for logout
export const logoutUser = () => async (dispatch) => {
  try {
    await databaseService.logoutUser();
    
    // Clear user authentication state
    dispatch(logout());
    
    // Reset hives state to clear the current user's hives
    dispatch(resetHives());
    
    return true;
  } catch (error) {
    console.error('Error during logout:', error);
    return false;
  }
};

export const { 
  loginStart, 
  loginSuccess, 
  loginFailure, 
  logout, 
  clearError,
  registerStart,
  registerSuccess,
  registerFailure,
  setUserType,
  loginDemo,
  updateAppSettings,
  restoreSession
} = authSlice.actions;

export default authSlice.reducer; 
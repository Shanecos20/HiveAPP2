import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  isAuthenticated: false,
  user: null,
  error: null,
  userType: null, // 'hobbyist' or 'commercial'
  isLoading: false, // For simulating loading states during authentication
};

// Simulated user data for demo purposes
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
  },
});

// Thunk for simulated login
export const login = (email, password) => async (dispatch) => {
  dispatch(loginStart());
  
  // Simulate API request delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  const user = mockUsers.find(u => u.email === email && u.password === password);
  
  if (user) {
    dispatch(loginSuccess({
      id: user.id,
      email: user.email,
      name: user.name,
      userType: user.userType,
    }));
    return true;
  } else {
    dispatch(loginFailure('Invalid email or password'));
    return false;
  }
};

// Thunk for simulated registration
export const register = (email, password, name, userType) => async (dispatch) => {
  dispatch(registerStart());
  
  // Simulate API request delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Check if user already exists
  const userExists = mockUsers.some(u => u.email === email);
  
  if (userExists) {
    dispatch(registerFailure('User with this email already exists'));
    return false;
  } else {
    // In a real app, we would make an API call to register the user
    // For demo purposes, we'll just simulate a successful registration
    const newUser = {
      id: Date.now().toString(),
      email,
      name,
      userType,
    };
    
    dispatch(registerSuccess(newUser));
    return true;
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
  setUserType
} = authSlice.actions;

export default authSlice.reducer; 
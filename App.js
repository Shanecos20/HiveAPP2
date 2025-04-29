import React, { useEffect, useState, useRef } from 'react';
import { StatusBar as RNStatusBar } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Provider, useDispatch } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from './src/redux/store';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaProvider, SafeAreaView, initialWindowMetrics } from 'react-native-safe-area-context';
import { ThemeProvider, useTheme } from './src/contexts/ThemeContext';
import { useSelector } from 'react-redux';

// Import screens
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import HiveDetailScreen from './src/screens/HiveDetailScreen';
import NotificationsScreen from './src/screens/NotificationsScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import InsightsScreen from './src/screens/InsightsScreen';
import EditHiveScreen from './src/screens/EditHiveScreen';
import HiveSensorsScreen from './src/screens/HiveSensorsScreen';

// Import components
import NotificationPopup from './src/components/notifications/NotificationPopup';
import CustomTabBar from './src/components/navigation/CustomTabBar';

// Import services and actions
import databaseService from './src/services/databaseService';
import { fetchHives } from './src/redux/hiveSlice';
import { checkAuthState } from './src/redux/authSlice';
import { triggerTestNotification, processFirebaseEvent } from './src/redux/notificationSlice';

// Import theme
import theme from './src/utils/theme';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// App initialization component
const AppInitializer = ({ children }) => {
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector(state => state.auth);
  const { hives } = useSelector(state => state.hives);
  const { lastEventTimestamp } = useSelector(state => state.notifications);
  const [unsubscribeEvents, setUnsubscribeEvents] = useState(null);
  const lastProcessedTimestampRef = useRef(lastEventTimestamp);
  const hasHives = hives && hives.length > 0; // Check if there are hives
  
  // Keep reference of lastEventTimestamp up to date without triggering effect
  useEffect(() => {
    lastProcessedTimestampRef.current = lastEventTimestamp;
  }, [lastEventTimestamp]);
  
  // Subscribe to Firebase realtime 'events' node to dispatch notifications
  // But only when authenticated AND there's at least one hive
  useEffect(() => {
    console.log(`[AppInitializer] Subscription effect running. Auth: ${isAuthenticated}, HasHives: ${hasHives}`);
    // Clean up previous subscription if it exists
    if (unsubscribeEvents) {
      console.log('[AppInitializer] Cleaning up previous Firebase listener.');
      unsubscribeEvents();
      setUnsubscribeEvents(null);
    }
    
    // Only subscribe if user is authenticated and has at least one hive
    if (isAuthenticated && hasHives) { // Use hasHives here
      // Retrieve the most recent timestamp we know we've processed
      const currentLastTimestamp = lastProcessedTimestampRef.current || 0;
      console.log(`[AppInitializer] Setting up Firebase event subscription, starting after: ${currentLastTimestamp}`);
      
      // Pass the timestamp to the subscription service
      const unsubscribe = databaseService.subscribeToEvents((event) => {
        // Extract data from the event
        const { hiveId, eventType, type: payloadType, timestamp, key: eventKey } = event; // Include eventKey
        
        // Use the eventType from Firebase or fallback to type
        const type = eventType || payloadType;
        const state = store.getState(); // Be cautious getting state here, might be stale
        const currentHives = state.hives.hives; // Get current hives from state
        
        // Only process notifications for hives that belong to the user
        const hive = currentHives.find(h => h.id === hiveId);
        if (hive) {
          const hiveName = hive.name || hiveId;
          console.log(`[AppInitializer] Processing Firebase event: ${eventKey} for hive: ${hiveName}, type: ${type}`);
          
          // Process the event through Redux
          dispatch(processFirebaseEvent({ 
            event: { type, hiveName, hiveId, timestamp, key: eventKey } // Timestamp is already validated
          }));
        } else {
          console.log(`[AppInitializer] Ignoring event ${eventKey} for unknown or non-user hive: ${hiveId}`);
        }
      }, currentLastTimestamp); // Pass the timestamp here
      
      setUnsubscribeEvents(() => unsubscribe); // Use functional update for state
    } else {
      console.log('[AppInitializer] Conditions not met for subscription (Auth/Hives).');
    }
    
    // Cleanup on effect re-run or unmount
    return () => {
      if (unsubscribeEvents) {
        console.log('[AppInitializer] Running cleanup for Firebase listener.');
        unsubscribeEvents();
      }
    };
  // Depend on isAuthenticated and whether hives exist (hasHives)
  }, [dispatch, isAuthenticated, hasHives]);
  
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Initialize database service
        await databaseService.initialize();
        
        // Check if we have an active user session
        await dispatch(checkAuthState());
        
        // Load hives data from persistent storage
        dispatch(fetchHives());
        
        console.log('App initialized successfully');
      } catch (error) {
        console.error('Failed to initialize app:', error);
      }
    };
    
    initializeApp();
  }, [dispatch]);
  
  return children;
};

// Notification wrapper component with theme support
const NotificationWrapper = ({ children }) => {
  const { showNotificationPopup, latestNotification } = useSelector(state => state.notifications);
  const { theme: currentTheme, isDarkMode } = useTheme();
  
  return (
    <SafeAreaView 
      style={{ 
        flex: 1, 
        backgroundColor: currentTheme?.colors?.background || theme.colors.background,
        paddingTop: 30, // Explicitly set no padding to avoid pushing content down
      }}
      edges={['right', 'left']} // Exclude bottom so we handle it in the custom tab bar
    >
      <View style={{ 
        flex: 1,
        backgroundColor: currentTheme?.colors?.background || theme.colors.background, 
      }}>
        {children}
        {showNotificationPopup && <NotificationPopup notification={latestNotification} />}
      </View>
    </SafeAreaView>
  );
};

// Theme-aware StatusBar component
const ThemedStatusBar = () => {
  const { isDarkMode, theme: currentTheme } = useTheme();
  const statusBarBgColor = currentTheme?.colors?.statusBar || theme.colors.statusBar;
  
  // Immediately set the native status bar color to avoid black flash
  useEffect(() => {
    // Set the native status bar immediately
    RNStatusBar.setBarStyle(isDarkMode ? 'light-content' : 'dark-content', true);
    RNStatusBar.setBackgroundColor(statusBarBgColor, true);
  }, [isDarkMode, statusBarBgColor]);
  
  // Use StatusBar from expo-status-bar for further customization
  return (
    <StatusBar 
      style={isDarkMode ? 'light' : 'dark'} 
      backgroundColor={statusBarBgColor}
      translucent={true}
      animated={true}
    />
  );
}

// Main tab navigator with theme
const MainTabNavigator = () => {
  const { theme: currentTheme, isDarkMode } = useTheme();
  
  return (
    <Tab.Navigator
      tabBar={props => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
      sceneContainerStyle={{
        backgroundColor: currentTheme?.colors?.background || theme.colors.background,
      }}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Insights" component={InsightsScreen} />
      <Tab.Screen name="Notifications" component={NotificationsScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
};

// Main app component with navigation
const AppNavigator = () => {
  const { isAuthenticated } = useSelector(state => state.auth || { isAuthenticated: false });
  const { isDarkMode, theme: currentTheme } = useTheme();
  
  const navigationTheme = {
    dark: isDarkMode,
    colors: {
      primary: currentTheme?.colors?.primary || theme.colors.primary,
      background: isDarkMode 
        ? (currentTheme?.colors?.background || theme.dark.colors.background) 
        : (currentTheme?.colors?.background || theme.light.colors.background),
      card: isDarkMode 
        ? (currentTheme?.colors?.card || theme.dark.colors.card) 
        : (currentTheme?.colors?.card || theme.light.colors.card),
      text: isDarkMode 
        ? (currentTheme?.colors?.text || theme.dark.colors.text) 
        : (currentTheme?.colors?.text || theme.light.colors.text),
      border: isDarkMode 
        ? (currentTheme?.colors?.border || theme.dark.colors.border) 
        : (currentTheme?.colors?.border || theme.light.colors.border),
      notification: isDarkMode 
        ? (currentTheme?.colors?.notification || theme.dark.colors.notification) 
        : (currentTheme?.colors?.notification || theme.light.colors.notification),
    },
  };
  
  return (
    <NavigationContainer theme={navigationTheme}>
      <Stack.Navigator 
        screenOptions={{ 
          headerShown: false,
          cardStyle: { backgroundColor: navigationTheme.colors.background }
        }}
      >
        {!isAuthenticated ? (
          // Auth screens
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        ) : (
          // App screens
          <>
            <Stack.Screen name="Main" component={MainTabNavigator} />
            <Stack.Screen name="HiveDetail" component={HiveDetailScreen} />
            <Stack.Screen name="EditHive" component={EditHiveScreen} />
            <Stack.Screen name="AddHive" component={EditHiveScreen} />
            <Stack.Screen name="Insights" component={InsightsScreen} />
            <Stack.Screen name="HiveSensors" component={HiveSensorsScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

// Root component with Redux provider
export default function App() {
  // Custom insets with extra padding for Dynamic Island and bottom navigation
  const customSafeAreaInsets = {
    top: 0, // Remove all top spacing
    left: 0,
    right: 0,
  };

  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <ThemeProvider>
          <SafeAreaProvider initialMetrics={{
            ...initialWindowMetrics,
            insets: {
              ...initialWindowMetrics?.insets,
              ...customSafeAreaInsets
            }
          }}>
            <ThemedStatusBar />
            <AppInitializer>
              <NotificationWrapper>
                <AppNavigator />
              </NotificationWrapper>
            </AppInitializer>
          </SafeAreaProvider>
        </ThemeProvider>
      </PersistGate>
    </Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
});

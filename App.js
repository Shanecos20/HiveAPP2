import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Provider } from 'react-redux';
import { store } from './src/redux/store';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider, useTheme } from './src/contexts/ThemeContext';
import { useSelector } from 'react-redux';

// Import screens
import LoginScreen from './src/screens/LoginScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import HiveDetailScreen from './src/screens/HiveDetailScreen';
import NotificationsScreen from './src/screens/NotificationsScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import InsightsScreen from './src/screens/InsightsScreen';
import EditHiveScreen from './src/screens/EditHiveScreen';

// Import components
import NotificationPopup from './src/components/notifications/NotificationPopup';
import CustomTabBar from './src/components/navigation/CustomTabBar';

// Import theme
import theme from './src/utils/theme';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Notification wrapper component with theme support
const NotificationWrapper = ({ children }) => {
  const { showNotificationPopup, latestNotification } = useSelector(state => state.notifications);
  const { theme: currentTheme, isDarkMode } = useTheme();
  
  return (
    <View style={{ flex: 1, backgroundColor: currentTheme?.colors?.background || theme.colors.background }}>
      {children}
      {showNotificationPopup && <NotificationPopup notification={latestNotification} />}
    </View>
  );
};

// Theme-aware StatusBar component
const ThemedStatusBar = () => {
  const { isDarkMode, theme: currentTheme } = useTheme();
  const statusBarBgColor = currentTheme?.colors?.statusBar || theme.colors.statusBar;
  return <StatusBar style={isDarkMode ? 'light' : 'dark'} backgroundColor={statusBarBgColor} />;
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
          <Stack.Screen name="Login" component={LoginScreen} />
        ) : (
          // App screens
          <>
            <Stack.Screen name="Main" component={MainTabNavigator} />
            <Stack.Screen name="HiveDetail" component={HiveDetailScreen} />
            <Stack.Screen name="EditHive" component={EditHiveScreen} />
            <Stack.Screen name="Insights" component={InsightsScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

// Root component with Redux provider
export default function App() {
  return (
    <Provider store={store}>
      <ThemeProvider>
        <SafeAreaProvider>
          <ThemedStatusBar />
          <NotificationWrapper>
            <AppNavigator />
          </NotificationWrapper>
        </SafeAreaProvider>
      </ThemeProvider>
    </Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
});

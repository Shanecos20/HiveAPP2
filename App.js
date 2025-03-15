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

// Import screens
import LoginScreen from './src/screens/LoginScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import HiveDetailScreen from './src/screens/HiveDetailScreen';
import NotificationsScreen from './src/screens/NotificationsScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import InsightsScreen from './src/screens/InsightsScreen';

// Import components
import NotificationPopup from './src/components/notifications/NotificationPopup';

// Import theme
import theme from './src/utils/theme';
import { useSelector } from 'react-redux';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Main tab navigator
const MainTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Dashboard') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Insights') {
            iconName = focused ? 'bulb' : 'bulb-outline';
          } else if (route.name === 'Notifications') {
            iconName = focused ? 'notifications' : 'notifications-outline';
          } else if (route.name === 'Settings') {
            iconName = focused ? 'settings' : 'settings-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.grey,
        headerShown: false,
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Insights" component={InsightsScreen} />
      <Tab.Screen name="Notifications" component={NotificationsScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
};

// Notification wrapper component
const NotificationWrapper = ({ children }) => {
  const { showNotificationPopup, latestNotification } = useSelector(state => state.notifications);
  
  return (
    <View style={{ flex: 1 }}>
      {children}
      {showNotificationPopup && <NotificationPopup notification={latestNotification} />}
    </View>
  );
};

// Main app component with navigation
const AppNavigator = () => {
  const { isAuthenticated } = useSelector(state => state.auth);
  
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          // Auth screens
          <Stack.Screen name="Login" component={LoginScreen} />
        ) : (
          // App screens
          <>
            <Stack.Screen name="Main" component={MainTabNavigator} />
            <Stack.Screen name="HiveDetail" component={HiveDetailScreen} />
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
      <SafeAreaProvider>
        <StatusBar style="auto" />
        <NotificationWrapper>
          <AppNavigator />
        </NotificationWrapper>
      </SafeAreaProvider>
    </Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
});

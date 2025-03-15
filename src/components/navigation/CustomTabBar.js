import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import theme from '../../utils/theme';

/**
 * Custom tab bar component that doesn't rely on React Navigation's theme system
 * Directly uses our ThemeContext to ensure consistent styling
 */
const CustomTabBar = ({ state, descriptors, navigation }) => {
  const { theme: currentTheme, isDarkMode } = useTheme();
  
  // Fallback to default theme if currentTheme is undefined
  const safeColors = currentTheme?.colors || theme.colors;
  
  return (
    <View style={[
      styles.container,
      { 
        backgroundColor: safeColors.card,
        borderTopColor: safeColors.border,
        borderTopWidth: 1 
      }
    ]}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const label = options.tabBarLabel || options.title || route.name;
        const isFocused = state.index === index;
        
        const color = isFocused ? safeColors.primary : safeColors.grey;
        
        // Determine icon based on route name
        let iconName;
        if (route.name === 'Dashboard') {
          iconName = isFocused ? 'home' : 'home-outline';
        } else if (route.name === 'Insights') {
          iconName = isFocused ? 'bulb' : 'bulb-outline';
        } else if (route.name === 'Notifications') {
          iconName = isFocused ? 'notifications' : 'notifications-outline';
        } else if (route.name === 'Settings') {
          iconName = isFocused ? 'settings' : 'settings-outline';
        }
        
        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          
          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };
        
        const onLongPress = () => {
          navigation.emit({
            type: 'tabLongPress',
            target: route.key,
          });
        };
        
        return (
          <TouchableOpacity
            key={index}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel}
            testID={options.tabBarTestID}
            onPress={onPress}
            onLongPress={onLongPress}
            style={styles.tabButton}
          >
            <Ionicons name={iconName} size={24} color={color} />
            <Text style={[styles.label, { color }]}>
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    height: 60,
    paddingBottom: 5, // Add some padding at the bottom for iPhone home indicator
  },
  tabButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 8,
  },
  label: {
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
    textAlign: 'center',
  },
});

export default CustomTabBar; 
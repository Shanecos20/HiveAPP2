import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import theme from '../../utils/theme';

/**
 * ScreenContainer - A consistent container for all screens
 * Handles proper spacing for device UI elements like the iPhone Dynamic Island
 */
const ScreenContainer = ({ 
  children, 
  style, 
  scrollable = true,
  bottomInset = true,
  topInset = true,
}) => {
  const { theme: currentTheme } = useTheme();
  const insets = useSafeAreaInsets();
  
  // Calculate safe paddings - no top padding to push content up
  const paddingTop = 0; // No top padding at all
  
  // Add padding to account for the tab bar height (60px) plus safe area
  const tabBarHeight = 60 + Math.max(insets.bottom, 10);
  const paddingBottom = bottomInset ? tabBarHeight : 0;
  
  const containerStyle = [
    styles.container,
    {
      backgroundColor: currentTheme?.colors?.background || theme.colors.background,
      paddingTop,
      paddingBottom: scrollable ? 0 : 0, // ScrollView handles padding in contentContainerStyle
    },
    style,
  ];
  
  if (scrollable) {
    return (
      <ScrollView 
        style={containerStyle}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: paddingBottom }
        ]}
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
    );
  }
  
  return (
    <View style={[containerStyle, { paddingBottom: paddingBottom }]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: theme.spacing.medium,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: theme.spacing.medium,
  },
});

export default ScreenContainer; 
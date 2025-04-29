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
  const paddingBottom = bottomInset ? Math.max(insets.bottom, 8) : 0;
  
  const containerStyle = [
    styles.container,
    {
      backgroundColor: currentTheme?.colors?.background || theme.colors.background,
      paddingTop,
      paddingBottom: scrollable ? paddingBottom : 0, // Only add bottom padding if scrollable
    },
    style,
  ];
  
  if (scrollable) {
    return (
      <ScrollView 
        style={containerStyle}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
    );
  }
  
  return (
    <View style={containerStyle}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: theme.spacing.medium,
    marginTop: -10, // Negative margin to push content up even more
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: theme.spacing.medium,
  },
});

export default ScreenContainer; 
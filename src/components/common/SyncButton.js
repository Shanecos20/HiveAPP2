import React from 'react';
import { TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import theme from '../../utils/theme';

const SyncButton = ({ onPress, isSyncing, size = 22, style }) => {
  const { theme: currentTheme, isDarkMode } = useTheme();
  
  return (
    <TouchableOpacity 
      style={[
        styles.syncButton, 
        isSyncing && styles.syncButtonActive,
        style
      ]}
      onPress={onPress}
      disabled={isSyncing}
    >
      {isSyncing ? (
        <ActivityIndicator size="small" color={theme.colors.white} />
      ) : (
        <Ionicons 
          name="refresh" 
          size={size} 
          color={currentTheme?.colors?.primary || theme.colors.primary} 
        />
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  syncButton: {
    padding: theme.spacing.small,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  syncButtonActive: {
    backgroundColor: theme.colors.primary,
  },
});

export default SyncButton; 
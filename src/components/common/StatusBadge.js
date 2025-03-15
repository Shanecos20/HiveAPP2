import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { getStatusColor } from '../../utils/helpers';
import theme from '../../utils/theme';

const StatusBadge = ({ status, size = 'medium' }) => {
  const color = getStatusColor(status);
  
  // Determine size dimensions
  const badgeSize = size === 'small' ? 8 : size === 'medium' ? 12 : 16;
  const textSize = size === 'small' ? 10 : size === 'medium' ? 12 : 14;
  
  // Determine if text should be shown
  const showText = size !== 'small';
  
  return (
    <View style={styles.container}>
      <View style={[styles.badge, { backgroundColor: color, width: badgeSize, height: badgeSize }]} />
      {showText && (
        <Text style={[styles.statusText, { fontSize: textSize, color: theme.colors.darkGrey }]}>
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badge: {
    borderRadius: 50, // Makes it circular
    marginRight: theme.spacing.small,
  },
  statusText: {
    fontWeight: '600',
  },
});

export default StatusBadge; 
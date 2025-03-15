import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import theme from '../../utils/theme';

const Card = ({ 
  title, 
  children, 
  onPress, 
  style,
  titleRight,
  noPadding = false,
  variant = 'default' // default, outlined, elevated
}) => {
  // Combine the base style with any additional styles passed as props
  const cardStyle = [
    styles.card,
    noPadding ? null : styles.padding,
    variant === 'outlined' ? styles.outlined : null,
    variant === 'elevated' ? styles.elevated : null,
    style
  ];

  // If onPress is provided, make the card touchable
  if (onPress) {
    return (
      <TouchableOpacity style={cardStyle} onPress={onPress} activeOpacity={0.7}>
        {title && (
          <View style={styles.titleContainer}>
            <Text style={styles.title}>{title}</Text>
            {titleRight && <View>{titleRight}</View>}
          </View>
        )}
        <View>{children}</View>
      </TouchableOpacity>
    );
  }

  // Otherwise, render a regular View
  return (
    <View style={cardStyle}>
      {title && (
        <View style={styles.titleContainer}>
          <Text style={styles.title}>{title}</Text>
          {titleRight && <View>{titleRight}</View>}
        </View>
      )}
      <View>{children}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.layout.borderRadiusMedium,
    marginBottom: theme.spacing.medium,
    overflow: 'hidden',
  },
  padding: {
    padding: theme.spacing.medium,
  },
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.small,
  },
  title: {
    fontSize: theme.typography.headingSmall,
    fontWeight: 'bold',
    color: theme.colors.darkGrey,
  },
  outlined: {
    borderWidth: 1,
    borderColor: theme.colors.lightGrey,
  },
  elevated: {
    ...theme.layout.shadowProps,
    elevation: theme.layout.elevationSmall,
  },
});

export default Card; 
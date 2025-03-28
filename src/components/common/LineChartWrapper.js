import React from 'react';
import { Platform, View } from 'react-native';
import { LineChart } from 'react-native-chart-kit';

/**
 * LineChartWrapper - A wrapper around LineChart that handles platform-specific issues
 * - On web: Silences responder warnings and adds proper dimensions
 * - On native: Passes through normally
 */
const LineChartWrapper = (props) => {
  // Create a safe copy of the data to prevent mutations
  const safeData = {
    ...props.data,
    datasets: props.data.datasets.map(dataset => ({
      ...dataset,
      data: [...dataset.data]
    }))
  };

  // Web-specific props to silence the responder warnings
  const webProps = Platform.OS === 'web' ? {
    // Style override to make chart work better on web
    style: {
      ...(props.style || {}),
      borderRadius: 8,
      overflow: 'hidden',
    },
    // Additional web-specific props
    onStartShouldSetResponder: undefined,
    onResponderTerminationRequest: undefined,
    onResponderGrant: undefined,
    onResponderMove: undefined,
    onResponderRelease: undefined,
    onResponderTerminate: undefined,
  } : {};

  return (
    <View style={{ 
      borderRadius: 8, 
      overflow: 'hidden',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <LineChart
        {...props}
        data={safeData}
        {...webProps}
      />
    </View>
  );
};

export default LineChartWrapper; 
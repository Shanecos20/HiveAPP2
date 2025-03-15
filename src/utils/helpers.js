/**
 * Formats a timestamp into a readable date and time
 * @param {string} timestamp - ISO timestamp string
 * @returns {string} Formatted date and time
 */
export const formatDateTime = (timestamp) => {
  const date = new Date(timestamp);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Formats a timestamp into a readable date
 * @param {string} timestamp - ISO timestamp string
 * @returns {string} Formatted date
 */
export const formatDate = (timestamp) => {
  const date = new Date(timestamp);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

/**
 * Gets the appropriate color for a hive status
 * @param {string} status - Status of the hive (healthy, warning, critical)
 * @returns {string} Color hex code
 */
export const getStatusColor = (status) => {
  switch (status) {
    case 'healthy':
      return '#4CAF50'; // Green
    case 'warning':
      return '#FF9800'; // Orange
    case 'critical':
      return '#F44336'; // Red
    default:
      return '#9E9E9E'; // Grey
  }
};

/**
 * Gets the appropriate color for a notification severity
 * @param {string} severity - Severity of the notification (high, medium, low)
 * @returns {string} Color hex code
 */
export const getSeverityColor = (severity) => {
  switch (severity) {
    case 'high':
      return '#F44336'; // Red
    case 'medium':
      return '#FF9800'; // Orange
    case 'low':
      return '#2196F3'; // Blue
    default:
      return '#9E9E9E'; // Grey
  }
};

/**
 * Gets a recommendation based on hive sensor data
 * @param {Object} hiveSensors - Object containing sensor data
 * @returns {string} Recommendation text
 */
export const getRecommendation = (hiveSensors) => {
  const { temperature, humidity, varroa } = hiveSensors;
  
  if (varroa > 3) {
    return 'Urgent: Varroa levels critically high. Immediate treatment required.';
  } else if (varroa > 1) {
    return 'Warning: Varroa levels elevated. Consider treatment options.';
  }
  
  if (temperature > 40) {
    return 'Critical: Hive temperature too high. Provide shade and ventilation.';
  } else if (temperature < 30) {
    return 'Critical: Hive temperature too low. Check insulation.';
  } else if (temperature > 38) {
    return 'Warning: Hive temperature elevated. Monitor closely.';
  } else if (temperature < 32) {
    return 'Warning: Hive temperature low. Consider additional insulation.';
  }
  
  if (humidity > 90) {
    return 'Critical: Humidity too high. Improve ventilation.';
  } else if (humidity < 40) {
    return 'Critical: Humidity too low. Consider water source nearby.';
  } else if (humidity > 80) {
    return 'Warning: Humidity elevated. Monitor for mold.';
  } else if (humidity < 50) {
    return 'Warning: Humidity low. Ensure water source is available.';
  }
  
  return 'All parameters within normal range. Continue regular monitoring.';
};

/**
 * Simulates gradual sensor changes for a more realistic data simulation
 * @param {number} currentValue - Current sensor value
 * @param {number} min - Minimum random change
 * @param {number} max - Maximum random change
 * @returns {number} New sensor value
 */
export const simulateSensorChange = (currentValue, min = -0.5, max = 0.5) => {
  const change = Math.random() * (max - min) + min;
  return parseFloat((currentValue + change).toFixed(1));
};

/**
 * Generates chart configuration for React Native Chart Kit
 * @param {Array} data - Array of data points
 * @param {string} label - Label for the dataset
 * @param {string} color - Color for the chart
 * @returns {Object} Chart configuration
 */
export const generateChartConfig = (data, label, color) => {
  return {
    backgroundColor: color,
    backgroundGradientFrom: color,
    backgroundGradientTo: color,
    decimalPlaces: 1,
    color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
    style: {
      borderRadius: 16
    },
    propsForDots: {
      r: '6',
      strokeWidth: '2',
      stroke: '#ffa726'
    }
  };
}; 
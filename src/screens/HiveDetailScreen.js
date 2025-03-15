import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useSelector } from 'react-redux';
import { LineChart } from 'react-native-chart-kit';
import LineChartWrapper from '../components/common/LineChartWrapper';
import { Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Card from '../components/common/Card';
import StatusBadge from '../components/common/StatusBadge';
import theme from '../utils/theme';
import { formatDateTime, getRecommendation } from '../utils/helpers';
import { useTheme } from '../contexts/ThemeContext';

const HiveDetailScreen = ({ route, navigation }) => {
  const { hiveId } = route.params;
  const { theme: currentTheme, isDarkMode } = useTheme();
  const hive = useSelector(state => 
    state.hives.hives.find(h => h.id === hiveId)
  );
  
  if (!hive) {
    return (
      <View style={[
        styles.container,
        { backgroundColor: currentTheme?.colors?.background || theme.colors.background }
      ]}>
        <Text style={{ color: currentTheme?.colors?.text || theme.colors.text }}>Hive not found</Text>
      </View>
    );
  }
  
  const screenWidth = Dimensions.get('window').width - theme.spacing.medium * 2;
  
  // Prepare chart data for all sensors
  const temperatureData = {
    labels: ['', '', '', '', '', ''],
    datasets: [
      {
        data: hive.history.temperature.slice(-6),
        color: () => theme.colors.error,
        strokeWidth: 2,
      },
    ],
  };
  
  const humidityData = {
    labels: ['', '', '', '', '', ''],
    datasets: [
      {
        data: hive.history.humidity.slice(-6),
        color: () => theme.colors.info,
        strokeWidth: 2,
      },
    ],
  };
  
  const varroaData = {
    labels: ['', '', '', '', '', ''],
    datasets: [
      {
        data: hive.history.varroa.slice(-6),
        color: () => theme.colors.warning,
        strokeWidth: 2,
      },
    ],
  };
  
  const weightData = {
    labels: ['', '', '', '', '', ''],
    datasets: [
      {
        data: hive.history.weight.slice(-6),
        color: () => theme.colors.success,
        strokeWidth: 2,
      },
    ],
  };
  
  // Dynamic chart config based on current theme
  const chartConfig = {
    backgroundGradientFrom: isDarkMode ? currentTheme?.colors?.card || theme.colors.darkGrey : theme.colors.white,
    backgroundGradientTo: isDarkMode ? currentTheme?.colors?.card || theme.colors.darkGrey : theme.colors.white,
    decimalPlaces: 1,
    color: (opacity = 1) => isDarkMode 
      ? `rgba(255, 255, 255, ${opacity})` 
      : `rgba(0, 0, 0, ${opacity})`,
    labelColor: (opacity = 1) => isDarkMode 
      ? `rgba(255, 255, 255, ${opacity})` 
      : `rgba(0, 0, 0, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '4',
      strokeWidth: '1',
      stroke: currentTheme?.colors?.primary || theme.colors.primary,
    },
  };

  // Get recommendations for each sensor
  const temperatureRecommendation = getRecommendation('temperature', hive.sensors.temperature);
  const humidityRecommendation = getRecommendation('humidity', hive.sensors.humidity);
  const varroaRecommendation = getRecommendation('varroa', hive.sensors.varroa);
  const weightRecommendation = getRecommendation('weight', hive.sensors.weight);
  
  return (
    <ScrollView 
      style={[
        styles.container,
        { backgroundColor: currentTheme?.colors?.background || theme.colors.background }
      ]}
    >
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons 
            name="arrow-back" 
            size={24} 
            color={currentTheme?.colors?.text || theme.colors.black} 
          />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={[
            styles.headerTitle,
            { color: currentTheme?.colors?.text || theme.colors.black }
          ]}>
            {hive.name}
          </Text>
          <StatusBadge status={hive.status} />
        </View>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => navigation.navigate('EditHive', { hiveId: hive.id })}
        >
          <Ionicons 
            name="create-outline" 
            size={24} 
            color={currentTheme?.colors?.primary || theme.colors.primary} 
          />
        </TouchableOpacity>
      </View>
      
      <View style={styles.infoContainer}>
        <Text style={[
          styles.location,
          { color: currentTheme?.colors?.textSecondary || theme.colors.grey }
        ]}>
          <Ionicons 
            name="location" 
            size={16} 
            color={currentTheme?.colors?.textSecondary || theme.colors.grey} 
          />
          {' '}{hive.location}
        </Text>
        <Text style={[
          styles.lastUpdated,
          { color: currentTheme?.colors?.textSecondary || theme.colors.grey }
        ]}>
          Last updated: {formatDateTime(hive.lastUpdated)}
        </Text>
      </View>
      
      {/* Temperature Chart */}
      <Card title="Temperature">
        <View style={styles.sensorHeader}>
          <View style={styles.currentValue}>
            <Text style={[
              styles.currentValueText,
              { color: currentTheme?.colors?.text || theme.colors.black }
            ]}>
              Current: {hive.sensors.temperature}°C
            </Text>
          </View>
          
          <View style={[
            styles.recommendation,
            { backgroundColor: isDarkMode ? currentTheme?.colors?.card || theme.colors.darkGrey : theme.colors.lightGrey }
          ]}>
            <Text style={[
              styles.recommendationText,
              { color: currentTheme?.colors?.textSecondary || theme.colors.darkGrey }
            ]}>
              {temperatureRecommendation}
            </Text>
          </View>
        </View>
        
        <LineChartWrapper
          data={temperatureData}
          width={screenWidth}
          height={220}
          chartConfig={chartConfig}
          bezier
          withDots={true}
          style={styles.chart}
        />
      </Card>
      
      {/* Humidity Chart */}
      <Card title="Humidity">
        <View style={styles.sensorHeader}>
          <View style={styles.currentValue}>
            <Text style={[
              styles.currentValueText,
              { color: currentTheme?.colors?.text || theme.colors.black }
            ]}>
              Current: {hive.sensors.humidity}%
            </Text>
          </View>
          
          <View style={[
            styles.recommendation,
            { backgroundColor: isDarkMode ? currentTheme?.colors?.card || theme.colors.darkGrey : theme.colors.lightGrey }
          ]}>
            <Text style={[
              styles.recommendationText,
              { color: currentTheme?.colors?.textSecondary || theme.colors.darkGrey }
            ]}>
              {humidityRecommendation}
            </Text>
          </View>
        </View>
        
        <LineChartWrapper
          data={humidityData}
          width={screenWidth}
          height={220}
          chartConfig={chartConfig}
          bezier
          withDots={true}
          style={styles.chart}
        />
      </Card>
      
      {/* Varroa Chart */}
      <Card title="Varroa Mite Index">
        <View style={styles.sensorHeader}>
          <View style={styles.currentValue}>
            <Text style={[
              styles.currentValueText,
              { color: currentTheme?.colors?.text || theme.colors.black }
            ]}>
              Current: {hive.sensors.varroa}
            </Text>
          </View>
          
          <View style={[
            styles.recommendation,
            { backgroundColor: isDarkMode ? currentTheme?.colors?.card || theme.colors.darkGrey : theme.colors.lightGrey }
          ]}>
            <Text style={[
              styles.recommendationText,
              { color: currentTheme?.colors?.textSecondary || theme.colors.darkGrey }
            ]}>
              {varroaRecommendation}
            </Text>
          </View>
        </View>
        
        <LineChartWrapper
          data={varroaData}
          width={screenWidth}
          height={220}
          chartConfig={chartConfig}
          bezier
          withDots={true}
          style={styles.chart}
        />
      </Card>
      
      {/* Weight Chart */}
      <Card title="Weight">
        <View style={styles.sensorHeader}>
          <View style={styles.currentValue}>
            <Text style={[
              styles.currentValueText,
              { color: currentTheme?.colors?.text || theme.colors.black }
            ]}>
              Current: {hive.sensors.weight} kg
            </Text>
          </View>
          
          <View style={[
            styles.recommendation,
            { backgroundColor: isDarkMode ? currentTheme?.colors?.card || theme.colors.darkGrey : theme.colors.lightGrey }
          ]}>
            <Text style={[
              styles.recommendationText,
              { color: currentTheme?.colors?.textSecondary || theme.colors.darkGrey }
            ]}>
              {weightRecommendation}
            </Text>
          </View>
        </View>
        
        <LineChartWrapper
          data={weightData}
          width={screenWidth}
          height={220}
          chartConfig={chartConfig}
          bezier
          withDots={true}
          style={styles.chart}
        />
      </Card>
      
      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={[
            styles.actionButtonLarge,
            { backgroundColor: isDarkMode ? currentTheme?.colors?.card || theme.colors.darkGrey : theme.colors.white }
          ]}
          onPress={() => navigation.navigate('Insights', { hiveId: hive.id })}
        >
          <Ionicons 
            name="bulb" 
            size={24} 
            color={currentTheme?.colors?.primary || theme.colors.primary} 
          />
          <Text style={[
            styles.actionButtonText,
            { color: currentTheme?.colors?.text || theme.colors.black }
          ]}>
            View AI Insights
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[
            styles.actionButtonLarge,
            { backgroundColor: isDarkMode ? currentTheme?.colors?.card || theme.colors.darkGrey : theme.colors.white }
          ]}
          onPress={() => navigation.navigate('EditHive', { hiveId: hive.id })}
        >
          <Ionicons 
            name="create" 
            size={24} 
            color={currentTheme?.colors?.primary || theme.colors.primary} 
          />
          <Text style={[
            styles.actionButtonText,
            { color: currentTheme?.colors?.text || theme.colors.black }
          ]}>
            Edit Hive
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: theme.spacing.medium,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.medium,
    paddingTop: theme.spacing.medium,
  },
  backButton: {
    padding: theme.spacing.small,
    marginRight: theme.spacing.small,
  },
  headerTitleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: theme.typography.headingMedium,
    fontWeight: 'bold',
    marginRight: theme.spacing.small,
  },
  actionButton: {
    padding: theme.spacing.small,
  },
  infoContainer: {
    marginBottom: theme.spacing.medium,
  },
  location: {
    fontSize: theme.typography.bodyMedium,
    marginBottom: theme.spacing.tiny,
  },
  lastUpdated: {
    fontSize: theme.typography.bodySmall,
  },
  chart: {
    marginVertical: theme.spacing.medium,
    borderRadius: theme.layout.borderRadiusSmall,
  },
  sensorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.small,
  },
  currentValue: {
    flex: 1,
  },
  currentValueText: {
    fontSize: theme.typography.bodyLarge,
    fontWeight: 'bold',
  },
  recommendation: {
    flex: 2,
    backgroundColor: theme.colors.lightGrey,
    padding: theme.spacing.small,
    borderRadius: theme.layout.borderRadiusSmall,
  },
  recommendationText: {
    fontSize: theme.typography.bodySmall,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: theme.spacing.medium,
    marginBottom: theme.spacing.large,
  },
  actionButtonLarge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.medium,
    backgroundColor: theme.colors.white,
    borderRadius: theme.layout.borderRadiusMedium,
    flex: 0.48,
    ...theme.layout.shadowProps,
  },
  actionButtonText: {
    fontSize: theme.typography.bodyMedium,
    marginLeft: theme.spacing.small,
    fontWeight: 'bold',
  },
});

export default HiveDetailScreen; 
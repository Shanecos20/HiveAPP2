import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useSelector } from 'react-redux';
import { LineChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Card from '../components/common/Card';
import StatusBadge from '../components/common/StatusBadge';
import theme from '../utils/theme';
import { formatDateTime, getRecommendation } from '../utils/helpers';

const HiveDetailScreen = ({ route, navigation }) => {
  const { hiveId } = route.params;
  const hive = useSelector(state => 
    state.hives.hives.find(h => h.id === hiveId)
  );
  
  if (!hive) {
    return (
      <View style={styles.container}>
        <Text>Hive not found</Text>
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
  
  const chartConfig = {
    backgroundGradientFrom: theme.colors.white,
    backgroundGradientTo: theme.colors.white,
    decimalPlaces: 1,
    color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '4',
      strokeWidth: '1',
      stroke: theme.colors.primary,
    },
  };
  
  // Get AI recommendation based on sensor data
  const recommendation = getRecommendation(hive.sensors);
  
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={theme.colors.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{hive.name}</Text>
        <StatusBadge status={hive.status} />
      </View>
      
      <View style={styles.infoContainer}>
        <View style={styles.infoItem}>
          <Ionicons name="location" size={16} color={theme.colors.grey} />
          <Text style={styles.infoText}>{hive.location}</Text>
        </View>
        <View style={styles.infoItem}>
          <Ionicons name="time" size={16} color={theme.colors.grey} />
          <Text style={styles.infoText}>Last updated: {formatDateTime(hive.lastUpdated)}</Text>
        </View>
      </View>
      
      {/* AI Recommendation */}
      <Card 
        title="AI Recommendation" 
        variant="elevated"
        style={[
          styles.recommendationCard,
          { 
            borderLeftColor: hive.status === 'critical' 
              ? theme.colors.error 
              : hive.status === 'warning' 
              ? theme.colors.warning 
              : theme.colors.success 
          }
        ]}
      >
        <View style={styles.recommendationContent}>
          <Ionicons 
            name={
              hive.status === 'critical' 
                ? 'warning' 
                : hive.status === 'warning' 
                ? 'alert-circle' 
                : 'checkmark-circle'
            } 
            size={24} 
            color={
              hive.status === 'critical' 
                ? theme.colors.error 
                : hive.status === 'warning' 
                ? theme.colors.warning 
                : theme.colors.success
            } 
          />
          <Text style={styles.recommendationText}>{recommendation}</Text>
        </View>
      </Card>
      
      {/* Current Readings */}
      <Card title="Current Readings">
        <View style={styles.readingsContainer}>
          <View style={styles.readingItem}>
            <View style={styles.readingHeader}>
              <Ionicons name="thermometer" size={20} color={theme.colors.error} />
              <Text style={styles.readingLabel}>Temperature</Text>
            </View>
            <Text style={styles.readingValue}>{hive.sensors.temperature}°C</Text>
          </View>
          
          <View style={styles.readingItem}>
            <View style={styles.readingHeader}>
              <Ionicons name="water" size={20} color={theme.colors.info} />
              <Text style={styles.readingLabel}>Humidity</Text>
            </View>
            <Text style={styles.readingValue}>{hive.sensors.humidity}%</Text>
          </View>
          
          <View style={styles.readingItem}>
            <View style={styles.readingHeader}>
              <Ionicons name="bug" size={20} color={theme.colors.warning} />
              <Text style={styles.readingLabel}>Varroa Index</Text>
            </View>
            <Text style={styles.readingValue}>{hive.sensors.varroa}</Text>
          </View>
          
          <View style={styles.readingItem}>
            <View style={styles.readingHeader}>
              <Ionicons name="scale" size={20} color={theme.colors.success} />
              <Text style={styles.readingLabel}>Weight</Text>
            </View>
            <Text style={styles.readingValue}>{hive.sensors.weight} kg</Text>
          </View>
        </View>
      </Card>
      
      {/* Detailed Charts */}
      <Card title="Temperature History">
        <LineChart
          data={temperatureData}
          width={screenWidth - theme.spacing.medium * 2}
          height={180}
          chartConfig={chartConfig}
          bezier
          style={styles.chart}
        />
      </Card>
      
      <Card title="Humidity History">
        <LineChart
          data={humidityData}
          width={screenWidth - theme.spacing.medium * 2}
          height={180}
          chartConfig={chartConfig}
          bezier
          style={styles.chart}
        />
      </Card>
      
      <Card title="Varroa Mite Index History">
        <LineChart
          data={varroaData}
          width={screenWidth - theme.spacing.medium * 2}
          height={180}
          chartConfig={chartConfig}
          bezier
          style={styles.chart}
        />
      </Card>
      
      <Card title="Weight History">
        <LineChart
          data={weightData}
          width={screenWidth - theme.spacing.medium * 2}
          height={180}
          chartConfig={chartConfig}
          bezier
          style={styles.chart}
        />
      </Card>
      
      {/* Actions */}
      <Card title="Actions">
        <View style={styles.actionsContainer}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => navigation.navigate('Insights', { hiveId: hive.id })}
          >
            <Ionicons name="bulb" size={24} color={theme.colors.white} />
            <Text style={styles.actionButtonText}>View AI Insights</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: theme.colors.secondary }]}
            onPress={() => navigation.navigate('EditHive', { hiveId: hive.id })}
          >
            <Ionicons name="create" size={24} color={theme.colors.white} />
            <Text style={styles.actionButtonText}>Edit Hive</Text>
          </TouchableOpacity>
        </View>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: theme.spacing.medium,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.medium,
    paddingTop: theme.spacing.medium,
  },
  backButton: {
    marginRight: theme.spacing.medium,
  },
  headerTitle: {
    fontSize: theme.typography.headingMedium,
    fontWeight: 'bold',
    color: theme.colors.black,
    flex: 1,
  },
  infoContainer: {
    marginBottom: theme.spacing.medium,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.small,
  },
  infoText: {
    fontSize: theme.typography.bodyMedium,
    color: theme.colors.darkGrey,
    marginLeft: theme.spacing.small,
  },
  recommendationCard: {
    borderLeftWidth: 4,
  },
  recommendationContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  recommendationText: {
    fontSize: theme.typography.bodyMedium,
    color: theme.colors.darkGrey,
    marginLeft: theme.spacing.medium,
    flex: 1,
  },
  readingsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  readingItem: {
    width: '48%',
    backgroundColor: theme.colors.lightGrey,
    borderRadius: theme.layout.borderRadiusSmall,
    padding: theme.spacing.medium,
    marginBottom: theme.spacing.medium,
  },
  readingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.small,
  },
  readingLabel: {
    fontSize: theme.typography.bodyMedium,
    color: theme.colors.darkGrey,
    marginLeft: theme.spacing.small,
  },
  readingValue: {
    fontSize: theme.typography.headingMedium,
    fontWeight: 'bold',
    color: theme.colors.black,
  },
  chart: {
    marginVertical: theme.spacing.small,
    borderRadius: theme.layout.borderRadiusSmall,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    borderRadius: theme.layout.borderRadiusMedium,
    padding: theme.spacing.medium,
    flex: 1,
    marginHorizontal: theme.spacing.tiny,
  },
  actionButtonText: {
    fontSize: theme.typography.bodyMedium,
    fontWeight: 'bold',
    color: theme.colors.white,
    marginLeft: theme.spacing.small,
  },
});

export default HiveDetailScreen; 
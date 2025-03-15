import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { selectHive, updateHiveSensor } from '../redux/hiveSlice';
import { formatDateTime, getStatusColor, simulateSensorChange } from '../utils/helpers';
import theme from '../utils/theme';
import Card from '../components/common/Card';
import StatusBadge from '../components/common/StatusBadge';
import { Ionicons } from '@expo/vector-icons';
import { LineChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';

const DashboardScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { hives, selectedHiveId } = useSelector(state => state.hives);
  const { userType } = useSelector(state => state.auth);
  
  // Find the selected hive
  const selectedHive = hives.find(h => h.id === selectedHiveId) || hives[0];
  
  // Simulate sensor updates every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (selectedHive) {
        // Update temperature
        dispatch(updateHiveSensor({
          hiveId: selectedHive.id,
          sensorType: 'temperature',
          value: simulateSensorChange(selectedHive.sensors.temperature, -0.3, 0.3),
        }));
        
        // Update humidity
        dispatch(updateHiveSensor({
          hiveId: selectedHive.id,
          sensorType: 'humidity',
          value: simulateSensorChange(selectedHive.sensors.humidity, -0.5, 0.5),
        }));
        
        // Update varroa (less frequent changes)
        if (Math.random() > 0.7) {
          dispatch(updateHiveSensor({
            hiveId: selectedHive.id,
            sensorType: 'varroa',
            value: simulateSensorChange(selectedHive.sensors.varroa, -0.05, 0.1),
          }));
        }
        
        // Update weight (slow changes)
        dispatch(updateHiveSensor({
          hiveId: selectedHive.id,
          sensorType: 'weight',
          value: simulateSensorChange(selectedHive.sensors.weight, -0.1, 0.2),
        }));
      }
    }, 10000);
    
    return () => clearInterval(interval);
  }, [selectedHive, dispatch]);
  
  const handleHiveSelect = (hiveId) => {
    dispatch(selectHive(hiveId));
  };
  
  const handleHiveDetails = () => {
    navigation.navigate('HiveDetail', { hiveId: selectedHive.id });
  };
  
  const screenWidth = Dimensions.get('window').width - theme.spacing.medium * 2;
  
  // Prepare chart data
  const temperatureData = {
    labels: ['', '', '', ''],
    datasets: [
      {
        data: selectedHive.history.temperature.slice(-4),
        color: () => theme.colors.error,
        strokeWidth: 2,
      },
    ],
  };
  
  const humidityData = {
    labels: ['', '', '', ''],
    datasets: [
      {
        data: selectedHive.history.humidity.slice(-4),
        color: () => theme.colors.info,
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
  
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Hive Dashboard</Text>
        <TouchableOpacity 
          style={styles.notificationButton}
          onPress={() => navigation.navigate('Notifications')}
        >
          <Ionicons name="notifications" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>
      
      {/* Hive Selector */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.hiveSelector}
      >
        {hives.map(hive => (
          <TouchableOpacity
            key={hive.id}
            style={[
              styles.hiveSelectorItem,
              selectedHive.id === hive.id && styles.hiveSelectorItemActive
            ]}
            onPress={() => handleHiveSelect(hive.id)}
          >
            <Text 
              style={[
                styles.hiveSelectorText,
                selectedHive.id === hive.id && styles.hiveSelectorTextActive
              ]}
            >
              {hive.name}
            </Text>
            <StatusBadge status={hive.status} size="small" />
          </TouchableOpacity>
        ))}
        
        {userType === 'commercial' && (
          <TouchableOpacity
            style={styles.addHiveButton}
            onPress={() => navigation.navigate('AddHive')}
          >
            <Ionicons name="add" size={20} color={theme.colors.primary} />
            <Text style={styles.addHiveText}>Add Hive</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
      
      {/* Selected Hive Overview */}
      <Card 
        title={selectedHive.name}
        titleRight={<StatusBadge status={selectedHive.status} />}
        variant="elevated"
        onPress={handleHiveDetails}
      >
        <View style={styles.hiveInfo}>
          <Text style={styles.hiveLocation}>
            <Ionicons name="location" size={16} color={theme.colors.grey} />
            {' '}{selectedHive.location}
          </Text>
          <Text style={styles.hiveUpdated}>
            Last updated: {formatDateTime(selectedHive.lastUpdated)}
          </Text>
        </View>
        
        <View style={styles.sensorGrid}>
          <View style={styles.sensorItem}>
            <Ionicons name="thermometer" size={24} color={theme.colors.error} />
            <Text style={styles.sensorValue}>{selectedHive.sensors.temperature}°C</Text>
            <Text style={styles.sensorLabel}>Temperature</Text>
          </View>
          
          <View style={styles.sensorItem}>
            <Ionicons name="water" size={24} color={theme.colors.info} />
            <Text style={styles.sensorValue}>{selectedHive.sensors.humidity}%</Text>
            <Text style={styles.sensorLabel}>Humidity</Text>
          </View>
          
          <View style={styles.sensorItem}>
            <Ionicons name="bug" size={24} color={theme.colors.warning} />
            <Text style={styles.sensorValue}>{selectedHive.sensors.varroa}</Text>
            <Text style={styles.sensorLabel}>Varroa Index</Text>
          </View>
          
          <View style={styles.sensorItem}>
            <Ionicons name="scale" size={24} color={theme.colors.success} />
            <Text style={styles.sensorValue}>{selectedHive.sensors.weight} kg</Text>
            <Text style={styles.sensorLabel}>Weight</Text>
          </View>
        </View>
      </Card>
      
      {/* Quick Charts */}
      <View style={styles.chartsContainer}>
        <Card title="Temperature Trend" variant="outlined" style={styles.chartCard}>
          <LineChart
            data={temperatureData}
            width={screenWidth / 2 - theme.spacing.medium * 2}
            height={120}
            chartConfig={chartConfig}
            bezier
            withDots={true}
            withInnerLines={false}
            withOuterLines={false}
            withVerticalLines={false}
            withHorizontalLines={true}
            style={styles.chart}
          />
        </Card>
        
        <Card title="Humidity Trend" variant="outlined" style={styles.chartCard}>
          <LineChart
            data={humidityData}
            width={screenWidth / 2 - theme.spacing.medium * 2}
            height={120}
            chartConfig={chartConfig}
            bezier
            withDots={true}
            withInnerLines={false}
            withOuterLines={false}
            withVerticalLines={false}
            withHorizontalLines={true}
            style={styles.chart}
          />
        </Card>
      </View>
      
      {/* Quick Actions */}
      <Card title="Quick Actions">
        <View style={styles.actionsContainer}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => navigation.navigate('HiveDetail', { hiveId: selectedHive.id })}
          >
            <Ionicons name="analytics" size={24} color={theme.colors.primary} />
            <Text style={styles.actionText}>View Details</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => navigation.navigate('Insights')}
          >
            <Ionicons name="bulb" size={24} color={theme.colors.primary} />
            <Text style={styles.actionText}>AI Insights</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => navigation.navigate('Settings')}
          >
            <Ionicons name="settings" size={24} color={theme.colors.primary} />
            <Text style={styles.actionText}>Settings</Text>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.medium,
    paddingTop: theme.spacing.medium,
  },
  headerTitle: {
    fontSize: theme.typography.headingLarge,
    fontWeight: 'bold',
    color: theme.colors.black,
  },
  notificationButton: {
    padding: theme.spacing.small,
  },
  hiveSelector: {
    flexDirection: 'row',
    marginBottom: theme.spacing.medium,
  },
  hiveSelectorItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.medium,
    paddingVertical: theme.spacing.small,
    marginRight: theme.spacing.small,
    borderRadius: theme.layout.borderRadiusMedium,
    backgroundColor: theme.colors.white,
    borderWidth: 1,
    borderColor: theme.colors.lightGrey,
  },
  hiveSelectorItemActive: {
    backgroundColor: theme.colors.primaryLight,
    borderColor: theme.colors.primary,
  },
  hiveSelectorText: {
    fontSize: theme.typography.bodyMedium,
    color: theme.colors.darkGrey,
    marginRight: theme.spacing.small,
  },
  hiveSelectorTextActive: {
    color: theme.colors.primaryDark,
    fontWeight: 'bold',
  },
  addHiveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.medium,
    paddingVertical: theme.spacing.small,
    marginRight: theme.spacing.small,
    borderRadius: theme.layout.borderRadiusMedium,
    backgroundColor: theme.colors.white,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: theme.colors.primary,
  },
  addHiveText: {
    fontSize: theme.typography.bodyMedium,
    color: theme.colors.primary,
    marginLeft: theme.spacing.tiny,
  },
  hiveInfo: {
    marginBottom: theme.spacing.medium,
  },
  hiveLocation: {
    fontSize: theme.typography.bodyMedium,
    color: theme.colors.darkGrey,
    marginBottom: theme.spacing.tiny,
  },
  hiveUpdated: {
    fontSize: theme.typography.bodySmall,
    color: theme.colors.grey,
  },
  sensorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.small,
  },
  sensorItem: {
    width: '48%',
    backgroundColor: theme.colors.lightGrey,
    borderRadius: theme.layout.borderRadiusSmall,
    padding: theme.spacing.medium,
    marginBottom: theme.spacing.small,
    alignItems: 'center',
  },
  sensorValue: {
    fontSize: theme.typography.headingMedium,
    fontWeight: 'bold',
    color: theme.colors.black,
    marginVertical: theme.spacing.small,
  },
  sensorLabel: {
    fontSize: theme.typography.bodySmall,
    color: theme.colors.grey,
  },
  chartsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  chartCard: {
    width: '48%',
  },
  chart: {
    borderRadius: theme.layout.borderRadiusSmall,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    alignItems: 'center',
    padding: theme.spacing.medium,
    backgroundColor: theme.colors.lightGrey,
    borderRadius: theme.layout.borderRadiusSmall,
    flex: 1,
    marginHorizontal: theme.spacing.tiny,
  },
  actionText: {
    fontSize: theme.typography.bodySmall,
    color: theme.colors.darkGrey,
    marginTop: theme.spacing.small,
  },
});

export default DashboardScreen; 
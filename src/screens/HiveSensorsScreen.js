import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import theme from '../utils/theme';
import Card from '../components/common/Card';
import StatusBadge from '../components/common/StatusBadge';
import { formatDateTime } from '../utils/helpers';

const HiveSensorsScreen = ({ route, navigation }) => {
  const { hiveId } = route.params || {};
  const { theme: currentTheme, isDarkMode } = useTheme();
  const hive = useSelector(state => 
    state.hives.hives.find(h => h.id === hiveId)
  );
  
  const [isConnecting, setIsConnecting] = useState(false);
  
  // List of available sensors that could be in a hive
  const sensors = [
    { 
      id: 'temperature', 
      name: 'Temperature Sensor', 
      icon: 'thermometer',
      color: theme.colors.error,
      value: hive?.sensors?.temperature,
      unit: '°C',
      isActive: true,
      description: 'Monitors internal hive temperature in real-time'
    },
    { 
      id: 'humidity', 
      name: 'Humidity Sensor', 
      icon: 'water',
      color: theme.colors.info,
      value: hive?.sensors?.humidity,
      unit: '%',
      isActive: true,
      description: 'Tracks humidity levels inside the hive'
    },
    { 
      id: 'weight', 
      name: 'Weight Sensor', 
      icon: 'scale',
      color: theme.colors.success,
      value: hive?.sensors?.weight,
      unit: 'kg',
      isActive: true,
      description: 'Measures the total weight of the hive'
    },
    { 
      id: 'varroa', 
      name: 'Varroa Monitor', 
      icon: 'bug',
      color: theme.colors.warning,
      value: hive?.sensors?.varroa,
      unit: '',
      isActive: true,
      description: 'Detects varroa mite infestation levels'
    },
    { 
      id: 'sound', 
      name: 'Sound Analysis', 
      icon: 'mic',
      color: theme.colors.secondary,
      isActive: false,
      description: 'Acoustic monitoring for swarm prediction (not connected)'
    },
    { 
      id: 'camera', 
      name: 'Entrance Monitor', 
      icon: 'videocam',
      color: theme.colors.darkGrey,
      isActive: false,
      description: 'Visual bee traffic monitoring (not connected)'
    }
  ];
  
  if (!hive) {
    return (
      <View style={[styles.container, { backgroundColor: currentTheme?.colors?.background || theme.colors.background }]}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={currentTheme?.colors?.text || theme.colors.black} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: currentTheme?.colors?.text || theme.colors.black }]}>
            Hive Sensors
          </Text>
        </View>
        <Text style={{ color: currentTheme?.colors?.text || theme.colors.text, textAlign: 'center' }}>
          Hive not found
        </Text>
      </View>
    );
  }
  
  const handleConnect = (sensorId) => {
    setIsConnecting(true);
    
    // Simulate connecting to a sensor
    setTimeout(() => {
      setIsConnecting(false);
      // In a real app, you would update the Redux state here
      // to mark the sensor as connected
    }, 2000);
  };
  
  return (
    <View style={[styles.container, { backgroundColor: currentTheme?.colors?.background || theme.colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={currentTheme?.colors?.text || theme.colors.black} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: currentTheme?.colors?.text || theme.colors.black }]}>
          {hive.name} Sensors
        </Text>
      </View>
      
      <ScrollView>
        <Card
          variant="elevated"
          style={styles.infoCard}
        >
          <Text style={[styles.cardTitle, { color: currentTheme?.colors?.text || theme.colors.black }]}>
            Hive Information
          </Text>
          
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: currentTheme?.colors?.textSecondary || theme.colors.darkGrey }]}>
              Hive ID:
            </Text>
            <Text style={[styles.infoValue, { color: currentTheme?.colors?.text || theme.colors.black }]}>
              {hive.id}
            </Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: currentTheme?.colors?.textSecondary || theme.colors.darkGrey }]}>
              Location:
            </Text>
            <Text style={[styles.infoValue, { color: currentTheme?.colors?.text || theme.colors.black }]}>
              {hive.location}
            </Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: currentTheme?.colors?.textSecondary || theme.colors.darkGrey }]}>
              Status:
            </Text>
            <StatusBadge status={hive.status} />
          </View>
          
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: currentTheme?.colors?.textSecondary || theme.colors.darkGrey }]}>
              Last Updated:
            </Text>
            <Text style={[styles.infoValue, { color: currentTheme?.colors?.text || theme.colors.black }]}>
              {formatDateTime(hive.lastUpdated)}
            </Text>
          </View>
        </Card>
        
        <Text style={[styles.sectionTitle, { color: currentTheme?.colors?.text || theme.colors.black }]}>
          Connected Sensors
        </Text>
        
        <View style={styles.sensorsGrid}>
          {sensors.map((sensor) => (
            <Card 
              key={sensor.id}
              variant="elevated"
              style={[
                styles.sensorCard,
                { backgroundColor: currentTheme?.colors?.card || theme.colors.white }
              ]}
            >
              <View style={styles.sensorHeader}>
                <View style={[styles.sensorIconContainer, { backgroundColor: sensor.color + '20' }]}>
                  <Ionicons name={sensor.icon} size={24} color={sensor.color} />
                </View>
                <View style={styles.sensorStatus}>
                  <View style={[
                    styles.statusIndicator, 
                    { backgroundColor: sensor.isActive ? theme.colors.success : theme.colors.grey }
                  ]} />
                  <Text style={[
                    styles.statusText, 
                    { color: currentTheme?.colors?.textSecondary || theme.colors.darkGrey }
                  ]}>
                    {sensor.isActive ? 'Connected' : 'Disconnected'}
                  </Text>
                </View>
              </View>
              
              <Text style={[styles.sensorName, { color: currentTheme?.colors?.text || theme.colors.black }]}>
                {sensor.name}
              </Text>
              
              <Text style={[styles.sensorDescription, { color: currentTheme?.colors?.textSecondary || theme.colors.darkGrey }]}>
                {sensor.description}
              </Text>
              
              {sensor.isActive && sensor.value !== undefined ? (
                <View style={styles.sensorValue}>
                  <Text style={[
                    styles.valueText, 
                    { color: currentTheme?.colors?.text || theme.colors.black }
                  ]}>
                    {sensor.value}{sensor.unit}
                  </Text>
                </View>
              ) : (
                <TouchableOpacity 
                  style={[
                    styles.connectButton,
                    { backgroundColor: isConnecting ? theme.colors.grey : theme.colors.primary }
                  ]}
                  onPress={() => handleConnect(sensor.id)}
                  disabled={isConnecting}
                >
                  {isConnecting ? (
                    <ActivityIndicator size="small" color={theme.colors.white} />
                  ) : (
                    <Text style={styles.connectButtonText}>
                      {sensor.isActive ? 'Refresh' : 'Connect'}
                    </Text>
                  )}
                </TouchableOpacity>
              )}
            </Card>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.medium,
    paddingTop: theme.spacing.large,
    paddingBottom: theme.spacing.small,
  },
  backButton: {
    padding: theme.spacing.small,
    marginRight: theme.spacing.small,
  },
  headerTitle: {
    fontSize: theme.typography.headingMedium,
    fontWeight: 'bold',
  },
  infoCard: {
    margin: theme.spacing.medium,
  },
  cardTitle: {
    fontSize: theme.typography.headingSmall,
    fontWeight: 'bold',
    marginBottom: theme.spacing.medium,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.small,
  },
  infoLabel: {
    fontSize: theme.typography.bodyMedium,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: theme.typography.bodyMedium,
  },
  sectionTitle: {
    fontSize: theme.typography.headingSmall,
    fontWeight: 'bold',
    marginHorizontal: theme.spacing.medium,
    marginTop: theme.spacing.medium,
    marginBottom: theme.spacing.small,
  },
  sensorsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: theme.spacing.small,
  },
  sensorCard: {
    width: '46%',
    margin: '2%',
    padding: theme.spacing.medium,
  },
  sensorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.small,
  },
  sensorIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sensorStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: theme.spacing.tiny,
  },
  statusText: {
    fontSize: theme.typography.bodyTiny,
  },
  sensorName: {
    fontSize: theme.typography.bodyLarge,
    fontWeight: 'bold',
    marginBottom: theme.spacing.tiny,
  },
  sensorDescription: {
    fontSize: theme.typography.bodySmall,
    marginBottom: theme.spacing.medium,
  },
  sensorValue: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: theme.spacing.small,
  },
  valueText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  connectButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.layout.borderRadiusSmall,
    paddingVertical: theme.spacing.small,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: theme.spacing.small,
  },
  connectButtonText: {
    color: theme.colors.white,
    fontWeight: 'bold',
    fontSize: theme.typography.bodyMedium,
  },
});

export default HiveSensorsScreen; 
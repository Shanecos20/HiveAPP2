import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { selectHive, updateHiveSensor, saveHive, fetchHives, syncAllHivesData } from '../redux/hiveSlice';
import { formatDateTime, getStatusColor, simulateSensorChange } from '../utils/helpers';
import theme from '../utils/theme';
import Card from '../components/common/Card';
import StatusBadge from '../components/common/StatusBadge';
import SyncButton from '../components/common/SyncButton';
import { Ionicons } from '@expo/vector-icons';
import { LineChart } from 'react-native-chart-kit';
import LineChartWrapper from '../components/common/LineChartWrapper';
import { Dimensions } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

const DashboardScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { hives, selectedHiveId, loading, error, lastSynced } = useSelector(state => state.hives);
  const { userType } = useSelector(state => state.auth);
  const { theme: currentTheme, isDarkMode } = useTheme();
  
  // Track syncing state for UI feedback
  const [isSyncing, setIsSyncing] = useState(false);
  
  // Find the selected hive
  const selectedHive = hives.find(h => h.id === selectedHiveId) || hives[0];
  
  // Fetch data from Firebase every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (hives && hives.length > 0) {
        syncDataFromFirebase();
      }
    }, 30000); // 30 seconds
    
    return () => clearInterval(interval);
  }, [hives, dispatch]);
  
  // Function to manually sync data from Firebase
  const syncDataFromFirebase = async () => {
    if (hives.length === 0) return;
    
    setIsSyncing(true);
    try {
      await dispatch(syncAllHivesData()).unwrap();
    } catch (error) {
      console.error('Error syncing data:', error);
    } finally {
      setIsSyncing(false);
    }
  };
  
  const handleHiveSelect = (hiveId) => {
    dispatch(selectHive(hiveId));
  };
  
  const handleHiveDetails = () => {
    if (selectedHive) {
      navigation.navigate('HiveDetail', { hiveId: selectedHive.id });
    }
  };
  
  const screenWidth = Dimensions.get('window').width - theme.spacing.medium * 2;
  
  // Render loading state
  if (loading && hives.length === 0) {
    return (
      <View style={[
        styles.container, 
        styles.centerContent,
        { backgroundColor: currentTheme?.colors?.background || theme.colors.background }
      ]}>
        <ActivityIndicator size="large" color={currentTheme?.colors?.primary || theme.colors.primary} />
        <Text style={[
          styles.loadingText,
          { color: currentTheme?.colors?.text || theme.colors.text }
        ]}>
          Loading hives...
        </Text>
      </View>
    );
  }
  
  // Render error state
  if (error && hives.length === 0) {
    return (
      <View style={[
        styles.container, 
        styles.centerContent,
        { backgroundColor: currentTheme?.colors?.background || theme.colors.background }
      ]}>
        <Ionicons 
          name="alert-circle" 
          size={48} 
          color={currentTheme?.colors?.error || theme.colors.error} 
        />
        <Text style={[
          styles.errorText,
          { color: currentTheme?.colors?.error || theme.colors.error }
        ]}>
          {error}
        </Text>
        <TouchableOpacity 
          style={[
            styles.retryButton,
            { backgroundColor: currentTheme?.colors?.primary || theme.colors.primary }
          ]}
          onPress={() => navigation.navigate('AddHive')}
        >
          <Text style={styles.retryButtonText}>Add Your First Hive</Text>
        </TouchableOpacity>
      </View>
    );
  }
  
  // Render empty state
  if (hives.length === 0) {
    return (
      <View style={[
        styles.container, 
        styles.centerContent,
        { backgroundColor: currentTheme?.colors?.background || theme.colors.background }
      ]}>
        <Ionicons 
          name="cube-outline" 
          size={64} 
          color={currentTheme?.colors?.textSecondary || theme.colors.grey} 
        />
        <Text style={[
          styles.emptyTitle,
          { color: currentTheme?.colors?.text || theme.colors.text }
        ]}>
          No Hives Yet
        </Text>
        <Text style={[
          styles.emptyDescription,
          { color: currentTheme?.colors?.textSecondary || theme.colors.darkGrey }
        ]}>
          Add your first hive to get started with monitoring
        </Text>
        <TouchableOpacity 
          style={[
            styles.addButton,
            { backgroundColor: currentTheme?.colors?.primary || theme.colors.primary }
          ]}
          onPress={() => navigation.navigate('AddHive')}
        >
          <Ionicons name="add" size={20} color={theme.colors.white} />
          <Text style={styles.addButtonText}>Add Your First Hive</Text>
        </TouchableOpacity>
      </View>
    );
  }
  
  // Prepare chart data - handle cases where history might be missing
  const temperatureData = {
    labels: ['', '', '', '', '', ''],
    datasets: [
      {
        data: selectedHive?.history?.temperature?.slice(-6) || [0, 0, 0, 0, 0, 0],
        color: () => theme.colors.error,
        strokeWidth: 2,
      },
    ],
  };
  
  const humidityData = {
    labels: ['', '', '', '', '', ''],
    datasets: [
      {
        data: selectedHive?.history?.humidity?.slice(-6) || [0, 0, 0, 0, 0, 0],
        color: () => theme.colors.info,
        strokeWidth: 2,
      },
    ],
  };
  
  // Dynamic chart config based on current theme
  const chartConfig = {
    backgroundGradientFrom: isDarkMode ? currentTheme?.colors?.card || theme.dark.colors.card : theme.colors.white,
    backgroundGradientTo: isDarkMode ? currentTheme?.colors?.card || theme.dark.colors.card : theme.colors.white,
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
      r: '5',
      strokeWidth: '2',
      stroke: isDarkMode ? "#fff" : currentTheme?.colors?.primary || theme.colors.primary,
    },
  };
  
  return (
    <ScrollView 
      style={[
        styles.container, 
        { backgroundColor: currentTheme?.colors?.background || theme.colors.background }
      ]}
    >
      <View style={styles.header}>
        <Text style={[
          styles.headerTitle, 
          { color: currentTheme?.colors?.text || theme.colors.text }
        ]}>
          Hive Dashboard
        </Text>
        
        <View style={styles.headerButtons}>
          {/* Use the SyncButton component */}
          <SyncButton 
            onPress={syncDataFromFirebase}
            isSyncing={isSyncing}
          />
          
          <TouchableOpacity 
            style={styles.notificationButton}
            onPress={() => navigation.navigate('Notifications')}
          >
            <Ionicons 
              name="notifications" 
              size={24} 
              color={currentTheme?.colors?.primary || theme.colors.primary} 
            />
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Last synced indicator */}
      {lastSynced && (
        <Text style={[styles.lastSyncedText, { 
          color: currentTheme?.colors?.textSecondary || theme.colors.darkGrey,
          textAlign: 'center'
        }]}>
          Last synced: {formatDateTime(lastSynced)}
        </Text>
      )}
      
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
              selectedHive?.id === hive.id && styles.hiveSelectorItemActive,
              { 
                backgroundColor: isDarkMode 
                  ? currentTheme?.colors?.card || theme.colors.darkGrey 
                  : theme.colors.white,
                borderColor: isDarkMode
                  ? currentTheme?.colors?.border || theme.colors.grey
                  : theme.colors.lightGrey
              }
            ]}
            onPress={() => handleHiveSelect(hive.id)}
          >
            <Text 
              style={[
                styles.hiveSelectorText,
                selectedHive?.id === hive.id && styles.hiveSelectorTextActive,
                { 
                  color: isDarkMode 
                    ? currentTheme?.colors?.textSecondary || theme.colors.lightGrey 
                    : theme.colors.darkGrey 
                }
              ]}
            >
              {hive.name}
            </Text>
            <StatusBadge status={hive.status} size="small" />
          </TouchableOpacity>
        ))}
        
        {/* Make Add Hive button available for all users */}
        <TouchableOpacity
          style={[
            styles.addHiveButton,
            {
              backgroundColor: isDarkMode 
                ? currentTheme?.colors?.card || theme.colors.darkGrey 
                : theme.colors.white,
            }
          ]}
          onPress={() => navigation.navigate('AddHive')}
        >
          <Ionicons name="add" size={20} color={currentTheme?.colors?.primary || theme.colors.primary} />
          <Text style={[
            styles.addHiveText,
            { color: currentTheme?.colors?.primary || theme.colors.primary }
          ]}>Add Hive</Text>
        </TouchableOpacity>
      </ScrollView>
      
      {/* Selected Hive Overview */}
      {selectedHive && (
        <Card 
          title={selectedHive.name}
          titleRight={<StatusBadge status={selectedHive.status} />}
          variant="elevated"
          onPress={handleHiveDetails}
        >
          <View style={styles.hiveInfo}>
            <Text style={[
              styles.hiveLocation,
              { color: currentTheme?.colors?.textSecondary || theme.colors.darkGrey }
            ]}>
              <Ionicons 
                name="location" 
                size={16} 
                color={currentTheme?.colors?.textSecondary || theme.colors.grey} 
              />
              {' '}{selectedHive.location}
            </Text>
            <Text style={[
              styles.hiveUpdated,
              { color: currentTheme?.colors?.textSecondary || theme.colors.grey }
            ]}>
              Last updated: {formatDateTime(selectedHive.lastUpdated)}
            </Text>
          </View>
          
          <View style={styles.sensorGrid}>
            <View style={[
              styles.sensorItem,
              { 
                backgroundColor: isDarkMode 
                  ? currentTheme?.colors?.card || theme.colors.darkGrey 
                  : theme.colors.lightGrey 
              }
            ]}>
              <Ionicons name="thermometer" size={24} color={theme.colors.error} />
              <Text style={[
                styles.sensorValue,
                { color: currentTheme?.colors?.text || theme.colors.black }
              ]}>{selectedHive.sensors.temperature}°C</Text>
              <Text style={[
                styles.sensorLabel,
                { color: currentTheme?.colors?.textSecondary || theme.colors.grey }
              ]}>Temperature</Text>
            </View>
            
            <View style={[
              styles.sensorItem,
              { 
                backgroundColor: isDarkMode 
                  ? currentTheme?.colors?.card || theme.colors.darkGrey 
                  : theme.colors.lightGrey 
              }
            ]}>
              <Ionicons name="water" size={24} color={theme.colors.info} />
              <Text style={[
                styles.sensorValue,
                { color: currentTheme?.colors?.text || theme.colors.black }
              ]}>{selectedHive.sensors.humidity}%</Text>
              <Text style={[
                styles.sensorLabel,
                { color: currentTheme?.colors?.textSecondary || theme.colors.grey }
              ]}>Humidity</Text>
            </View>
            
            <View style={[
              styles.sensorItem,
              { 
                backgroundColor: isDarkMode 
                  ? currentTheme?.colors?.card || theme.colors.darkGrey 
                  : theme.colors.lightGrey 
              }
            ]}>
              <Ionicons name="bug" size={24} color={theme.colors.warning} />
              <Text style={[
                styles.sensorValue,
                { color: currentTheme?.colors?.text || theme.colors.black }
              ]}>{selectedHive.sensors.varroa}</Text>
              <Text style={[
                styles.sensorLabel,
                { color: currentTheme?.colors?.textSecondary || theme.colors.grey }
              ]}>Varroa Index</Text>
            </View>
            
            <View style={[
              styles.sensorItem,
              { 
                backgroundColor: isDarkMode 
                  ? currentTheme?.colors?.card || theme.colors.darkGrey 
                  : theme.colors.lightGrey 
              }
            ]}>
              <Ionicons name="scale" size={24} color={theme.colors.success} />
              <Text style={[
                styles.sensorValue,
                { color: currentTheme?.colors?.text || theme.colors.black }
              ]}>{selectedHive.sensors.weight} kg</Text>
              <Text style={[
                styles.sensorLabel,
                { color: currentTheme?.colors?.textSecondary || theme.colors.grey }
              ]}>Weight</Text>
            </View>
          </View>
          
          <View style={styles.actionsRow}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={handleHiveDetails}
            >
              <Ionicons 
                name="stats-chart" 
                size={20} 
                color={currentTheme?.colors?.primary || theme.colors.primary} 
              />
              <Text style={[
                styles.actionButtonText,
                { color: currentTheme?.colors?.primary || theme.colors.primary }
              ]}>
                Details
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => navigation.navigate('EditHive', { hiveId: selectedHive.id })}
            >
              <Ionicons 
                name="create" 
                size={20} 
                color={currentTheme?.colors?.primary || theme.colors.primary} 
              />
              <Text style={[
                styles.actionButtonText,
                { color: currentTheme?.colors?.primary || theme.colors.primary }
              ]}>
                Edit
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => navigation.navigate('Insights', { hiveId: selectedHive.id })}
            >
              <Ionicons 
                name="bulb" 
                size={20} 
                color={currentTheme?.colors?.primary || theme.colors.primary} 
              />
              <Text style={[
                styles.actionButtonText,
                { color: currentTheme?.colors?.primary || theme.colors.primary }
              ]}>
                Insights
              </Text>
            </TouchableOpacity>
          </View>
        </Card>
      )}

      {/* Charts Section - Only show if we have a selected hive */}
      {selectedHive && (
        <>
          <View style={styles.chartsHeader}>
            <Text style={[
              styles.chartsTitle,
              { color: currentTheme?.colors?.text || theme.colors.text }
            ]}>
              Sensor Trends
            </Text>
          </View>
          
          <View style={styles.chartsContainer}>
            <View style={[
              styles.chartCard, 
              { 
                height: 225,
                backgroundColor: isDarkMode ? currentTheme?.colors?.card || theme.dark.colors.card : theme.colors.white,
              }
            ]}>
              <Text style={[
                styles.chartTitle,
                { color: currentTheme?.colors?.text || theme.colors.text }
              ]}>
                Temperature (°C)
              </Text>
              <LineChartWrapper 
                data={temperatureData}
                width={screenWidth - theme.spacing.medium * 2}
                height={160}
                chartConfig={chartConfig}
                bezier
                withInnerLines={false}
                withOuterLines={false}
                withDots={true}
                withShadow={false}
                style={styles.chart}
              />
            </View>
            
            <View style={[
              styles.chartCard, 
              { 
                height: 225,
                backgroundColor: isDarkMode ? currentTheme?.colors?.card || theme.dark.colors.card : theme.colors.white,
              }
            ]}>
              <Text style={[
                styles.chartTitle,
                { color: currentTheme?.colors?.text || theme.colors.text }
              ]}>
                Humidity (%)
              </Text>
              <LineChartWrapper 
                data={humidityData}
                width={screenWidth - theme.spacing.medium * 2}
                height={160}
                chartConfig={chartConfig}
                bezier
                withInnerLines={false}
                withOuterLines={false}
                withDots={true}
                withShadow={false}
                style={styles.chart}
              />
            </View>
          </View>
        </>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.medium,
  },
  loadingText: {
    fontSize: theme.typography.bodyLarge,
    marginTop: theme.spacing.medium,
    color: theme.colors.text,
  },
  errorText: {
    fontSize: theme.typography.bodyLarge,
    color: theme.colors.error,
    marginTop: theme.spacing.medium,
    textAlign: 'center',
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.medium,
    paddingHorizontal: theme.spacing.large,
    borderRadius: theme.layout.borderRadiusMedium,
    marginTop: theme.spacing.large,
  },
  retryButtonText: {
    color: theme.colors.white,
    fontWeight: 'bold',
    fontSize: theme.typography.bodyMedium,
  },
  emptyTitle: {
    fontSize: theme.typography.headingMedium,
    fontWeight: 'bold',
    marginTop: theme.spacing.medium,
    color: theme.colors.text,
  },
  emptyDescription: {
    fontSize: theme.typography.bodyMedium,
    textAlign: 'center',
    marginTop: theme.spacing.small,
    marginBottom: theme.spacing.large,
    color: theme.colors.darkGrey,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.medium,
    paddingHorizontal: theme.spacing.large,
    borderRadius: theme.layout.borderRadiusMedium,
  },
  addButtonText: {
    color: theme.colors.white,
    fontWeight: 'bold',
    fontSize: theme.typography.bodyMedium,
    marginLeft: theme.spacing.small,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.medium,
    paddingTop: theme.spacing.large,
    paddingBottom: theme.spacing.medium,
  },
  headerTitle: {
    fontSize: theme.typography.headingMedium,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  notificationButton: {
    padding: theme.spacing.small,
  },
  hiveSelector: {
    paddingHorizontal: theme.spacing.medium,
    marginBottom: theme.spacing.medium,
  },
  hiveSelectorItem: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.layout.borderRadiusMedium,
    paddingHorizontal: theme.spacing.medium,
    paddingVertical: theme.spacing.medium / 2,
    marginRight: theme.spacing.medium,
    borderWidth: 1,
    borderColor: theme.colors.lightGrey,
    flexDirection: 'row',
    alignItems: 'center',
  },
  hiveSelectorItemActive: {
    borderColor: theme.colors.primary,
  },
  hiveSelectorText: {
    fontSize: theme.typography.bodyMedium,
    color: theme.colors.darkGrey,
    marginRight: theme.spacing.small,
  },
  hiveSelectorTextActive: {
    color: theme.colors.primary,
    fontWeight: 'bold',
  },
  addHiveButton: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.layout.borderRadiusMedium,
    paddingHorizontal: theme.spacing.medium,
    paddingVertical: theme.spacing.medium / 2,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    borderStyle: 'dashed',
    flexDirection: 'row',
    alignItems: 'center',
  },
  addHiveText: {
    fontSize: theme.typography.bodyMedium,
    color: theme.colors.primary,
    marginLeft: theme.spacing.tiny,
  },
  hiveInfo: {
    marginVertical: theme.spacing.medium,
  },
  hiveLocation: {
    fontSize: theme.typography.bodyMedium,
    color: theme.colors.darkGrey,
    marginBottom: theme.spacing.small,
  },
  hiveUpdated: {
    fontSize: theme.typography.bodySmall,
    color: theme.colors.grey,
  },
  sensorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.medium,
  },
  sensorItem: {
    width: '48%',
    borderRadius: theme.layout.borderRadiusMedium,
    padding: theme.spacing.medium,
    alignItems: 'center',
    marginBottom: theme.spacing.medium,
    backgroundColor: theme.colors.lightGrey,
  },
  sensorValue: {
    fontSize: theme.typography.headingSmall,
    fontWeight: 'bold',
    color: theme.colors.black,
    marginTop: theme.spacing.small,
  },
  sensorLabel: {
    fontSize: theme.typography.bodySmall,
    color: theme.colors.grey,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: theme.spacing.medium,
    borderTopWidth: 1,
    borderTopColor: theme.colors.lightGrey,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButtonText: {
    marginLeft: theme.spacing.small,
    fontSize: theme.typography.bodyMedium,
    color: theme.colors.primary,
  },
  chartsHeader: {
    paddingHorizontal: theme.spacing.medium,
    marginTop: theme.spacing.large,
    marginBottom: theme.spacing.medium,
  },
  chartsTitle: {
    fontSize: theme.typography.headingSmall,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  chartsContainer: {
    paddingHorizontal: theme.spacing.medium,
    marginBottom: theme.spacing.large,
  },
  chartCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.layout.borderRadiusMedium,
    padding: theme.spacing.medium,
    marginBottom: theme.spacing.medium,
    ...theme.shadows.medium,
  },
  chartTitle: {
    fontSize: theme.typography.bodyMedium,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.medium,
  },
  chart: {
    borderRadius: theme.layout.borderRadiusMedium,
    overflow: 'hidden',
  },
  lastSyncedText: {
    fontSize: theme.typography.bodyTiny,
    marginBottom: theme.spacing.small,
    marginTop: -theme.spacing.small,
  },
});

export default DashboardScreen; 
import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Image, TouchableWithoutFeedback } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { LineChart } from 'react-native-chart-kit';
import LineChartWrapper from '../components/common/LineChartWrapper';
import { Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Card from '../components/common/Card';
import StatusBadge from '../components/common/StatusBadge';
import SyncButton from '../components/common/SyncButton';
import theme from '../utils/theme';
import { formatDateTime, getRecommendation } from '../utils/helpers';
import { useTheme } from '../contexts/ThemeContext';
import { deleteHive, syncAllHivesData } from '../redux/hiveSlice';
import { WebView } from 'react-native-webview';
import Button from '../components/common/Button';

const HiveDetailScreen = ({ route, navigation }) => {
  const { hiveId } = route.params;
  const { theme: currentTheme, isDarkMode } = useTheme();
  const dispatch = useDispatch();
  const hive = useSelector(state => 
    state.hives.hives.find(h => h.id === hiveId)
  );
  
  // Track syncing state
  const [isSyncing, setIsSyncing] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);
  
  // Extract YouTube video ID and thumbnail URL
  const videoId = 'qZW5eYd0Yw8';
  const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
  
  // Build HTML wrapper to hide YouTube chrome before iframe loads
  const videoHTML = useMemo(() => `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="initial-scale=1.0, maximum-scale=1.0">
      <style>
        body,html { margin:0; padding:0; background:transparent; }
        .video-container { position:absolute; top:0; left:0; width:100%; height:100%; }
        .video-container iframe { position:absolute; top:0; left:0; width:100%; height:100%; border:none; }
      </style>
    </head>
    <body>
      <div class="video-container">
        <iframe src="https://www.youtube-nocookie.com/embed/qZW5eYd0Yw8?autoplay=1&mute=1&controls=0&rel=0&modestbranding=1&playsinline=1&disablekb=1&fs=0&iv_load_policy=3"
          allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen>
        </iframe>
      </div>
    </body>
    </html>
  `, []);
  
  // Sync data from Firebase
  const syncData = async () => {
    setIsSyncing(true);
    try {
      await dispatch(syncAllHivesData()).unwrap();
    } catch (error) {
      console.error('Error syncing data:', error);
    } finally {
      setIsSyncing(false);
    }
  };
  
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
  
  const soundData = {
    labels: ['', '', '', '', '', ''],
    datasets: [
      {
        data: hive.history.sound?.slice(-6) || [],
        color: () => theme.colors.secondary,
        strokeWidth: 2,
      },
    ],
  };
  
  // Dynamic chart config based on current theme
  const chartConfig = {
    backgroundGradientFrom: isDarkMode ? currentTheme?.colors?.card || theme.dark.colors.card : theme.colors.white,
    backgroundGradientTo: isDarkMode ? currentTheme?.colors?.card || theme.dark.colors.card : theme.colors.white,
    decimalPlaces: 2,
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

  // Get recommendations for each sensor
  const temperatureRecommendation = getRecommendation('temperature', hive.sensors.temperature);
  const humidityRecommendation = getRecommendation('humidity', hive.sensors.humidity);
  const varroaRecommendation = getRecommendation('varroa', hive.sensors.varroa);
  const weightRecommendation = getRecommendation('weight', hive.sensors.weight);
  
  // Handle delete hive
  const handleDeleteHive = () => {
    Alert.alert(
      "Delete Hive",
      `Are you sure you want to delete "${hive.name}"? This action cannot be undone.`,
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Delete",
          onPress: async () => {
            try {
              await dispatch(deleteHive(hive.id));
              navigation.goBack();
            } catch (error) {
              Alert.alert("Error", "Failed to delete hive. Please try again.");
            }
          },
          style: "destructive"
        }
      ]
    );
  };
  
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
        <View style={styles.headerActions}>
          <SyncButton
            onPress={syncData}
            isSyncing={isSyncing}
            style={styles.syncButton}
          />
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
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={handleDeleteHive}
          >
            <Ionicons 
              name="trash-outline" 
              size={24} 
              color={currentTheme?.colors?.error || theme.colors.error} 
            />
          </TouchableOpacity>
        </View>
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
      <Card 
        title="Temperature"
        style={{ 
          backgroundColor: isDarkMode ? currentTheme?.colors?.card || theme.dark.colors.card : theme.colors.white 
        }}
      >
        <View style={styles.sensorHeader}>
          <View style={styles.currentValue}>
            <Text style={[
              styles.currentValueText,
              { color: currentTheme?.colors?.text || theme.colors.black }
            ]}>
              Current: {hive.sensors.temperature.toFixed(2)}°C
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
      <Card 
        title="Humidity"
        style={{ 
          backgroundColor: isDarkMode ? currentTheme?.colors?.card || theme.dark.colors.card : theme.colors.white 
        }}
      >
        <View style={styles.sensorHeader}>
          <View style={styles.currentValue}>
            <Text style={[
              styles.currentValueText,
              { color: currentTheme?.colors?.text || theme.colors.black }
            ]}>
              Current: {hive.sensors.humidity.toFixed(2)}%
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
      <Card 
        title="Varroa Mite Index"
        style={{ 
          backgroundColor: isDarkMode ? currentTheme?.colors?.card || theme.dark.colors.card : theme.colors.white 
        }}
      >
        <View style={styles.sensorHeader}>
          <View style={styles.currentValue}>
            <Text style={[
              styles.currentValueText,
              { color: currentTheme?.colors?.text || theme.colors.black }
            ]}>
              Current: {hive.sensors.varroa.toFixed(2)}
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
      <Card 
        title="Weight"
        style={{ 
          backgroundColor: isDarkMode ? currentTheme?.colors?.card || theme.dark.colors.card : theme.colors.white 
        }}
      >
        <View style={styles.sensorHeader}>
          <View style={styles.currentValue}>
            <Text style={[
              styles.currentValueText,
              { color: currentTheme?.colors?.text || theme.colors.black }
            ]}>
              Current: {hive.sensors.weight.toFixed(2)} kg
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
      
      {/* Sound Level Chart */}
      {hive.history.sound && (
        <Card title="Sound Level (dB)"
              style={{ backgroundColor: isDarkMode ? currentTheme?.colors?.card || theme.dark.colors.card : theme.colors.white }}>
          <View style={styles.sensorHeader}>
            <View style={styles.currentValue}>
              <Text style={[styles.currentValueText, { color: currentTheme?.colors?.text || theme.colors.black }]}>
                Current: {hive.sensors.sound.toFixed(2)} dB
              </Text>
            </View>
          </View>
          <LineChartWrapper
            data={soundData}
            width={screenWidth}
            height={220}
            chartConfig={chartConfig}
            bezier
            withDots
            style={styles.chart}
          />
        </Card>
      )}
      
      {/* Camera Entrance Monitor Video */}
      {hive.sensors.camera != null && (
        <Card title="Entrance Monitor" style={{ backgroundColor: theme.colors.white }}>
          <View style={styles.videoContainer}>
            {/* Static thumbnail to prevent UI flicker */}
            <Image
              source={{ uri: thumbnailUrl }}
              style={styles.thumbnail}
              resizeMode="cover"
            />
            <WebView
              pointerEvents="none"
              originWhitelist={["*"]}
              source={{ html: videoHTML }}
              style={[styles.webview, { opacity: videoLoaded ? 1 : 0 }]}
              onLoadStart={() => setVideoLoaded(false)}
              onLoadEnd={() => setTimeout(() => setVideoLoaded(true), 3000)}
              javaScriptEnabled={true}
              domStorageEnabled={true}
              allowsInlineMediaPlayback={true}
              mediaPlaybackRequiresUserAction={false}
            />
            {!videoLoaded && (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator size="large" color={currentTheme?.colors?.primary || theme.colors.primary} />
              </View>
            )}
          </View>
        </Card>
      )}
      
      {/* Notes Section */}
      <Card 
        title="Notes"
        style={{ 
          backgroundColor: isDarkMode ? currentTheme?.colors?.card || theme.dark.colors.card : theme.colors.white 
        }}
      >
        <Text style={[
          styles.notesText,
          { color: currentTheme?.colors?.text || theme.colors.black }
        ]}>
          {hive.notes || 'No notes added yet.'}
        </Text>
      </Card>
      
      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <Button 
          title="View AI Insights"
          onPress={() => navigation.navigate('Insights', { hiveId: hive.id })}
          variant="primary"
          icon={<Ionicons name="bulb" size={20} color="#F9A826" />}
          style={styles.actionButtonStyle}
        />
        
        <Button 
          title="Edit Hive"
          onPress={() => navigation.navigate('EditHive', { hiveId: hive.id })}
          variant="primary"
          icon={<Ionicons name="create" size={20} color="#F9A826" />}
          style={styles.actionButtonStyle}
        />
      </View>
      
      {/* Bottom action buttons */}
      <View style={styles.actionButtonsContainer}>
        <Button
          title="Delete Hive"
          onPress={handleDeleteHive}
          variant="primary"
          icon={<Ionicons name="trash-outline" size={20} color="#F9A826" />}
          style={styles.deleteButtonStyle}
        />
        
        <Button 
          title="Sensors"
          onPress={() => navigation.navigate('HiveSensors', { hiveId })}
          variant="primary"
          icon={<Ionicons name="hardware-chip" size={20} color="#F9A826" />}
          style={styles.sensorsButtonStyle}
        />
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
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
  actionButtonStyle: {
    flex: 0.48,
    marginHorizontal: theme.spacing.tiny,
  },
  notesText: {
    fontSize: theme.typography.bodyMedium,
  },
  videoContainer: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: 'transparent',
    alignSelf: 'center',
    overflow: 'hidden',
  },
  thumbnail: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  syncButton: {
    marginRight: theme.spacing.tiny,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: theme.spacing.medium,
    marginBottom: theme.spacing.large,
    paddingHorizontal: theme.spacing.small,
  },
  deleteButtonStyle: {
    flex: 1,
    marginRight: theme.spacing.medium,
  },
  sensorsButtonStyle: {
    flex: 1,
  },
});

export default HiveDetailScreen; 
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import Card from '../components/common/Card';
import StatusBadge from '../components/common/StatusBadge';
import theme from '../utils/theme';
import { formatDateTime, getRecommendation } from '../utils/helpers';

const InsightsScreen = ({ navigation, route }) => {
  const { hives } = useSelector(state => state.hives);
  const { notifications } = useSelector(state => state.notifications);
  
  // If a hiveId is passed in the route params, use that, otherwise use the first hive
  const initialHiveId = route.params?.hiveId || (hives.length > 0 ? hives[0].id : null);
  const [selectedHiveId, setSelectedHiveId] = useState(initialHiveId);
  const [loading, setLoading] = useState(true);
  const [insights, setInsights] = useState([]);
  
  const selectedHive = hives.find(h => h.id === selectedHiveId);
  
  // Generate insights based on hive data and notifications
  useEffect(() => {
    if (selectedHive) {
      // Simulate loading time for AI analysis
      setLoading(true);
      
      const timer = setTimeout(() => {
        generateInsights();
        setLoading(false);
      }, 1500);
      
      return () => clearTimeout(timer);
    }
  }, [selectedHiveId]);
  
  const generateInsights = () => {
    const newInsights = [];
    
    // Get basic recommendation based on sensor data
    const basicRecommendation = getRecommendation(selectedHive.sensors);
    newInsights.push({
      id: 'basic',
      title: 'Current Status Analysis',
      message: basicRecommendation,
      type: selectedHive.status,
      icon: 'analytics',
    });
    
    // Add temperature-specific insights
    const { temperature } = selectedHive.sensors;
    if (temperature > 38) {
      newInsights.push({
        id: 'temp-high',
        title: 'Temperature Management',
        message: 'High temperature detected. Consider providing shade or improving ventilation to prevent overheating. Bees may be bearding at the entrance to cool the hive.',
        type: 'warning',
        icon: 'thermometer',
      });
    } else if (temperature < 32) {
      newInsights.push({
        id: 'temp-low',
        title: 'Temperature Management',
        message: 'Low temperature detected. Consider adding insulation or reducing ventilation to help the bees maintain optimal cluster temperature.',
        type: 'warning',
        icon: 'thermometer',
      });
    }
    
    // Add humidity-specific insights
    const { humidity } = selectedHive.sensors;
    if (humidity > 80) {
      newInsights.push({
        id: 'humidity-high',
        title: 'Humidity Management',
        message: 'High humidity detected. This may lead to mold growth or difficulty curing honey. Improve ventilation to reduce moisture levels.',
        type: 'warning',
        icon: 'water',
      });
    } else if (humidity < 50) {
      newInsights.push({
        id: 'humidity-low',
        title: 'Humidity Management',
        message: 'Low humidity detected. Ensure bees have access to water sources, especially during hot weather.',
        type: 'warning',
        icon: 'water',
      });
    }
    
    // Add varroa-specific insights
    const { varroa } = selectedHive.sensors;
    if (varroa > 1) {
      newInsights.push({
        id: 'varroa',
        title: 'Varroa Management',
        message: `Elevated varroa levels detected (${varroa}). Consider implementing a treatment plan soon. Monitor for signs of deformed wing virus or other varroa-related diseases.`,
        type: varroa > 3 ? 'critical' : 'warning',
        icon: 'bug',
      });
    }
    
    // Add weight-specific insights
    const { weight } = selectedHive.sensors;
    const weightHistory = selectedHive.history.weight;
    if (weightHistory.length > 5) {
      const recentAvg = weightHistory.slice(-3).reduce((sum, val) => sum + val, 0) / 3;
      const previousAvg = weightHistory.slice(-6, -3).reduce((sum, val) => sum + val, 0) / 3;
      
      if (recentAvg - previousAvg > 3) {
        newInsights.push({
          id: 'weight-increase',
          title: 'Honey Production',
          message: 'Significant weight increase detected. The colony appears to be in a strong nectar flow. Consider adding supers if needed.',
          type: 'healthy',
          icon: 'trending-up',
        });
      } else if (previousAvg - recentAvg > 3) {
        newInsights.push({
          id: 'weight-decrease',
          title: 'Weight Decrease Alert',
          message: 'Significant weight decrease detected. This could indicate swarming, robbing, or resource consumption. Inspect the hive for population changes.',
          type: 'warning',
          icon: 'trending-down',
        });
      }
    }
    
    // Add seasonal recommendations based on current month
    const currentMonth = new Date().getMonth();
    let seasonalInsight = {
      id: 'seasonal',
      title: 'Seasonal Recommendations',
      type: 'healthy',
      icon: 'calendar',
    };
    
    // Spring (March-May)
    if (currentMonth >= 2 && currentMonth <= 4) {
      seasonalInsight.message = 'Spring management: Monitor for swarm cells, ensure adequate space for colony growth, and consider adding supers as nectar flow begins.';
    } 
    // Summer (June-August)
    else if (currentMonth >= 5 && currentMonth <= 7) {
      seasonalInsight.message = 'Summer management: Monitor for nectar flow end, check for adequate ventilation during hot weather, and begin varroa monitoring and treatment planning.';
    } 
    // Fall (September-November)
    else if (currentMonth >= 8 && currentMonth <= 10) {
      seasonalInsight.message = 'Fall management: Assess honey stores for winter, complete varroa treatments, and begin reducing entrances to prevent robbing.';
    } 
    // Winter (December-February)
    else {
      seasonalInsight.message = 'Winter management: Minimize hive disturbance, ensure adequate ventilation to prevent condensation, and monitor food stores.';
    }
    
    newInsights.push(seasonalInsight);
    
    // Add recent notification-based insights
    const hiveNotifications = notifications
      .filter(n => n.hiveId === selectedHiveId)
      .slice(0, 3);
    
    if (hiveNotifications.length > 0) {
      newInsights.push({
        id: 'notifications',
        title: 'Recent Events Analysis',
        message: `There have been ${hiveNotifications.length} recent alerts for this hive. Review the notifications section for details and take appropriate action.`,
        type: hiveNotifications[0].severity === 'high' ? 'warning' : 'healthy',
        icon: 'notifications',
      });
    }
    
    setInsights(newInsights);
  };
  
  const getInsightColor = (type) => {
    switch (type) {
      case 'critical':
        return theme.colors.error;
      case 'warning':
        return theme.colors.warning;
      case 'healthy':
      default:
        return theme.colors.success;
    }
  };
  
  if (!selectedHive) {
    return (
      <View style={styles.container}>
        <Text>No hives available</Text>
      </View>
    );
  }
  
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={theme.colors.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>AI Insights</Text>
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
              selectedHiveId === hive.id && styles.hiveSelectorItemActive
            ]}
            onPress={() => setSelectedHiveId(hive.id)}
          >
            <Text 
              style={[
                styles.hiveSelectorText,
                selectedHiveId === hive.id && styles.hiveSelectorTextActive
              ]}
            >
              {hive.name}
            </Text>
            <StatusBadge status={hive.status} size="small" />
          </TouchableOpacity>
        ))}
      </ScrollView>
      
      {/* Hive Overview */}
      <Card 
        title={selectedHive.name}
        titleRight={<StatusBadge status={selectedHive.status} />}
        variant="elevated"
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
        
        <View style={styles.sensorSummary}>
          <View style={styles.sensorItem}>
            <Ionicons name="thermometer" size={16} color={theme.colors.error} />
            <Text style={styles.sensorValue}>{selectedHive.sensors.temperature}°C</Text>
          </View>
          
          <View style={styles.sensorItem}>
            <Ionicons name="water" size={16} color={theme.colors.info} />
            <Text style={styles.sensorValue}>{selectedHive.sensors.humidity}%</Text>
          </View>
          
          <View style={styles.sensorItem}>
            <Ionicons name="bug" size={16} color={theme.colors.warning} />
            <Text style={styles.sensorValue}>{selectedHive.sensors.varroa}</Text>
          </View>
          
          <View style={styles.sensorItem}>
            <Ionicons name="scale" size={16} color={theme.colors.success} />
            <Text style={styles.sensorValue}>{selectedHive.sensors.weight} kg</Text>
          </View>
        </View>
      </Card>
      
      {/* AI Insights */}
      <View style={styles.insightsHeader}>
        <Text style={styles.insightsTitle}>AI Analysis & Recommendations</Text>
        {loading && <ActivityIndicator color={theme.colors.primary} />}
      </View>
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Analyzing hive data...</Text>
        </View>
      ) : (
        insights.map(insight => (
          <Card key={insight.id} style={styles.insightCard}>
            <View style={styles.insightHeader}>
              <View style={[styles.insightIcon, { backgroundColor: getInsightColor(insight.type) }]}>
                <Ionicons name={insight.icon} size={24} color={theme.colors.white} />
              </View>
              <Text style={styles.insightTitle}>{insight.title}</Text>
            </View>
            <Text style={styles.insightMessage}>{insight.message}</Text>
          </Card>
        ))
      )}
      
      {/* Action Buttons */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => navigation.navigate('HiveDetail', { hiveId: selectedHiveId })}
        >
          <Ionicons name="analytics" size={20} color={theme.colors.white} />
          <Text style={styles.actionButtonText}>View Detailed Data</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionButton, { backgroundColor: theme.colors.secondary }]}
          onPress={() => navigation.navigate('Settings')}
        >
          <Ionicons name="options" size={20} color={theme.colors.white} />
          <Text style={styles.actionButtonText}>Adjust Thresholds</Text>
        </TouchableOpacity>
      </View>
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
  hiveInfo: {
    marginBottom: theme.spacing.small,
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
  sensorSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.lightGrey,
    borderRadius: theme.layout.borderRadiusSmall,
    padding: theme.spacing.small,
  },
  sensorItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sensorValue: {
    fontSize: theme.typography.bodyMedium,
    fontWeight: 'bold',
    color: theme.colors.darkGrey,
    marginLeft: theme.spacing.tiny,
  },
  insightsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: theme.spacing.medium,
    marginBottom: theme.spacing.small,
  },
  insightsTitle: {
    fontSize: theme.typography.headingSmall,
    fontWeight: 'bold',
    color: theme.colors.black,
  },
  loadingContainer: {
    padding: theme.spacing.xlarge,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: theme.typography.bodyMedium,
    color: theme.colors.grey,
    marginTop: theme.spacing.medium,
  },
  insightCard: {
    marginBottom: theme.spacing.medium,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.small,
  },
  insightIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.medium,
  },
  insightTitle: {
    fontSize: theme.typography.bodyLarge,
    fontWeight: 'bold',
    color: theme.colors.black,
  },
  insightMessage: {
    fontSize: theme.typography.bodyMedium,
    color: theme.colors.darkGrey,
    lineHeight: theme.typography.lineHeightRegular,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: theme.spacing.medium,
    marginBottom: theme.spacing.large,
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

export default InsightsScreen; 
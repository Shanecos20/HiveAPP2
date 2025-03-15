import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import Card from '../components/common/Card';
import StatusBadge from '../components/common/StatusBadge';
import theme from '../utils/theme';
import { formatDateTime, getRecommendation } from '../utils/helpers';
import { getAiInsights } from '../services/aiService';
import { useTheme } from '../contexts/ThemeContext';

const InsightsScreen = ({ navigation, route }) => {
  const { hives } = useSelector(state => state.hives);
  const { notifications } = useSelector(state => state.notifications);
  const { theme: currentTheme } = useTheme();
  
  // If a hiveId is passed in the route params, use that, otherwise use the first hive
  const initialHiveId = route.params?.hiveId || (hives.length > 0 ? hives[0].id : null);
  const [selectedHiveId, setSelectedHiveId] = useState(initialHiveId);
  const [loading, setLoading] = useState(true);
  const [insights, setInsights] = useState([]);
  const [eventType, setEventType] = useState(route.params?.eventType || null);
  
  const selectedHive = hives.find(h => h.id === selectedHiveId);
  
  // Generate insights based on hive data and notifications
  useEffect(() => {
    if (selectedHive) {
      fetchAiInsights();
    }
  }, [selectedHiveId, eventType]);

  const fetchAiInsights = async () => {
    setLoading(true);
    try {
      const aiInsights = await getAiInsights(selectedHive, eventType);
      setInsights(aiInsights);
    } catch (error) {
      console.error('Error fetching AI insights:', error);
      setInsights([{
        id: 'error',
        title: 'Error Generating Insights',
        message: 'Unable to generate AI insights at this time. Please try again later.',
        type: 'warning',
        icon: 'alert-circle',
      }]);
    } finally {
      setLoading(false);
      // Reset eventType after generating insights
      if (eventType) {
        setEventType(null);
      }
    }
  };
  
  const getInsightColor = (type) => {
    switch (type) {
      case 'critical':
        return currentTheme.colors.error;
      case 'warning':
        return currentTheme.colors.warning;
      case 'healthy':
      default:
        return currentTheme.colors.success;
    }
  };
  
  if (!selectedHive) {
    return (
      <View style={[styles.container, { backgroundColor: currentTheme.colors.background }]}>
        <Text style={{ color: currentTheme.colors.text }}>No hives available</Text>
      </View>
    );
  }
  
  return (
    <ScrollView style={[styles.container, { backgroundColor: currentTheme.colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={currentTheme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: currentTheme.colors.text }]}>AI Insights</Text>
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
              { 
                backgroundColor: currentTheme.colors.card,
                borderColor: currentTheme.colors.border
              },
              selectedHiveId === hive.id && {
                backgroundColor: currentTheme.colors.primaryLight,
                borderColor: currentTheme.colors.primary
              }
            ]}
            onPress={() => setSelectedHiveId(hive.id)}
          >
            <Text 
              style={[
                styles.hiveSelectorText,
                { color: currentTheme.colors.textSecondary },
                selectedHiveId === hive.id && { 
                  color: currentTheme.colors.primary,
                  fontWeight: 'bold' 
                }
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
          <Text style={[styles.hiveLocation, { color: currentTheme.colors.textSecondary }]}>
            <Ionicons name="location" size={16} color={currentTheme.colors.grey} />
            {' '}{selectedHive.location}
          </Text>
          <Text style={[styles.hiveUpdated, { color: currentTheme.colors.grey }]}>
            Last updated: {formatDateTime(selectedHive.lastUpdated)}
          </Text>
        </View>
        
        <View style={[styles.sensorSummary, { backgroundColor: currentTheme.colors.lightGrey }]}>
          <View style={styles.sensorItem}>
            <Ionicons name="thermometer" size={16} color={currentTheme.colors.error} />
            <Text style={[styles.sensorValue, { color: currentTheme.colors.text }]}>{selectedHive.sensors.temperature}°C</Text>
          </View>
          
          <View style={styles.sensorItem}>
            <Ionicons name="water" size={16} color={currentTheme.colors.info} />
            <Text style={[styles.sensorValue, { color: currentTheme.colors.text }]}>{selectedHive.sensors.humidity}%</Text>
          </View>
          
          <View style={styles.sensorItem}>
            <Ionicons name="bug" size={16} color={currentTheme.colors.warning} />
            <Text style={[styles.sensorValue, { color: currentTheme.colors.text }]}>{selectedHive.sensors.varroa}</Text>
          </View>
          
          <View style={styles.sensorItem}>
            <Ionicons name="scale" size={16} color={currentTheme.colors.success} />
            <Text style={[styles.sensorValue, { color: currentTheme.colors.text }]}>{selectedHive.sensors.weight} kg</Text>
          </View>
        </View>
      </Card>
      
      {/* AI Insights */}
      <View style={styles.insightsHeader}>
        <Text style={[styles.insightsTitle, { color: currentTheme.colors.text }]}>AI Analysis & Recommendations</Text>
        {loading && <ActivityIndicator color={currentTheme.colors.primary} />}
      </View>
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: currentTheme.colors.grey }]}>Analyzing hive data...</Text>
        </View>
      ) : (
        insights.map(insight => (
          <Card key={insight.id} style={styles.insightCard}>
            <View style={styles.insightHeader}>
              <View style={[styles.insightIcon, { backgroundColor: getInsightColor(insight.type) }]}>
                <Ionicons name={insight.icon} size={24} color={currentTheme.colors.white} />
              </View>
              <Text style={[styles.insightTitle, { color: currentTheme.colors.text }]} numberOfLines={2}>{insight.title}</Text>
            </View>
            <View style={styles.insightContent}>
              <Text style={[styles.insightMessage, { color: currentTheme.colors.textSecondary }]}>{insight.message}</Text>
            </View>
          </Card>
        ))
      )}
      
      {/* Action Buttons */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity 
          style={[styles.actionButton, { backgroundColor: currentTheme.colors.primary }]}
          onPress={() => navigation.navigate('HiveDetail', { hiveId: selectedHiveId })}
        >
          <Ionicons name="analytics" size={20} color={currentTheme.colors.white} />
          <Text style={[styles.actionButtonText, { color: currentTheme.colors.white }]}>View Detailed Data</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionButton, { backgroundColor: currentTheme.colors.secondary }]}
          onPress={() => {
            setLoading(true);
            fetchAiInsights();
          }}
        >
          <Ionicons name="refresh" size={20} color={currentTheme.colors.white} />
          <Text style={[styles.actionButtonText, { color: currentTheme.colors.white }]}>Refresh Analysis</Text>
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
    paddingVertical: theme.spacing.medium,
    paddingHorizontal: theme.spacing.medium,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.medium,
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
    flexShrink: 1,
    width: '85%',
  },
  insightContent: {
    marginLeft: 0,
  },
  insightMessage: {
    fontSize: theme.typography.bodyMedium,
    color: theme.colors.darkGrey,
    lineHeight: theme.typography.lineHeightRegular,
    paddingLeft: 54,
    marginTop: theme.spacing.small,
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
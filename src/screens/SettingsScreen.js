import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, TextInput } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { updateThresholds, triggerTestNotification } from '../redux/notificationSlice';
import { simulateHiveEvent } from '../redux/hiveSlice';
import { logout } from '../redux/authSlice';
import theme from '../utils/theme';
import { Ionicons } from '@expo/vector-icons';
import Card from '../components/common/Card';

const SettingsScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { hives, selectedHiveId } = useSelector(state => state.hives);
  const { thresholds } = useSelector(state => state.notifications);
  const { user, userType } = useSelector(state => state.auth);
  
  // Local state for threshold inputs
  const [tempMin, setTempMin] = useState(thresholds.temperature.min.toString());
  const [tempMax, setTempMax] = useState(thresholds.temperature.max.toString());
  const [humidityMin, setHumidityMin] = useState(thresholds.humidity.min.toString());
  const [humidityMax, setHumidityMax] = useState(thresholds.humidity.max.toString());
  const [varroaMax, setVarroaMax] = useState(thresholds.varroa.max.toString());
  
  // Selected hive for testing
  const [testHiveId, setTestHiveId] = useState(selectedHiveId);
  const selectedHive = hives.find(h => h.id === testHiveId);
  
  const handleUpdateThresholds = () => {
    // Update temperature thresholds
    dispatch(updateThresholds({
      sensorType: 'temperature',
      min: parseFloat(tempMin),
      max: parseFloat(tempMax),
    }));
    
    // Update humidity thresholds
    dispatch(updateThresholds({
      sensorType: 'humidity',
      min: parseFloat(humidityMin),
      max: parseFloat(humidityMax),
    }));
    
    // Update varroa threshold
    dispatch(updateThresholds({
      sensorType: 'varroa',
      max: parseFloat(varroaMax),
    }));
  };
  
  const handleTestNotification = (type) => {
    // Trigger a test notification
    dispatch(triggerTestNotification({
      type,
      hiveName: selectedHive.name,
      hiveId: selectedHive.id,
    }));
    
    // Also simulate the event in the hive data
    dispatch(simulateHiveEvent({
      hiveId: selectedHive.id,
      eventType: type,
    }));
  };
  
  const handleLogout = () => {
    dispatch(logout());
    navigation.reset({
      index: 0,
      routes: [{ name: 'Login' }],
    });
  };
  
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={theme.colors.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>
      
      {/* User Profile */}
      <Card title="User Profile" variant="elevated">
        <View style={styles.profileContainer}>
          <View style={styles.profileIcon}>
            <Ionicons name="person" size={40} color={theme.colors.white} />
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{user?.name || 'User'}</Text>
            <Text style={styles.profileEmail}>{user?.email || 'user@example.com'}</Text>
            <View style={styles.userTypeContainer}>
              <Text style={styles.userTypeLabel}>
                {userType === 'commercial' ? 'Commercial Beekeeper' : 'Hobby Beekeeper'}
              </Text>
            </View>
          </View>
        </View>
      </Card>
      
      {/* Notification Thresholds */}
      <Card title="Notification Thresholds">
        <View style={styles.thresholdContainer}>
          <Text style={styles.thresholdTitle}>Temperature (°C)</Text>
          <View style={styles.thresholdInputs}>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Min</Text>
              <TextInput
                style={styles.input}
                value={tempMin}
                onChangeText={setTempMin}
                keyboardType="numeric"
              />
            </View>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Max</Text>
              <TextInput
                style={styles.input}
                value={tempMax}
                onChangeText={setTempMax}
                keyboardType="numeric"
              />
            </View>
          </View>
        </View>
        
        <View style={styles.thresholdContainer}>
          <Text style={styles.thresholdTitle}>Humidity (%)</Text>
          <View style={styles.thresholdInputs}>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Min</Text>
              <TextInput
                style={styles.input}
                value={humidityMin}
                onChangeText={setHumidityMin}
                keyboardType="numeric"
              />
            </View>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Max</Text>
              <TextInput
                style={styles.input}
                value={humidityMax}
                onChangeText={setHumidityMax}
                keyboardType="numeric"
              />
            </View>
          </View>
        </View>
        
        <View style={styles.thresholdContainer}>
          <Text style={styles.thresholdTitle}>Varroa Mite Index</Text>
          <View style={styles.thresholdInputs}>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Max</Text>
              <TextInput
                style={styles.input}
                value={varroaMax}
                onChangeText={setVarroaMax}
                keyboardType="numeric"
              />
            </View>
          </View>
        </View>
        
        <TouchableOpacity 
          style={styles.updateButton}
          onPress={handleUpdateThresholds}
        >
          <Text style={styles.updateButtonText}>Update Thresholds</Text>
        </TouchableOpacity>
      </Card>
      
      {/* Test Notifications */}
      <Card title="Test Notifications">
        <View style={styles.testHiveSelector}>
          <Text style={styles.testHiveLabel}>Select Hive for Testing:</Text>
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
                  testHiveId === hive.id && styles.hiveSelectorItemActive
                ]}
                onPress={() => setTestHiveId(hive.id)}
              >
                <Text 
                  style={[
                    styles.hiveSelectorText,
                    testHiveId === hive.id && styles.hiveSelectorTextActive
                  ]}
                >
                  {hive.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
        
        <View style={styles.testButtonsContainer}>
          <TouchableOpacity 
            style={[styles.testButton, { backgroundColor: theme.colors.error }]}
            onPress={() => handleTestNotification('swarm')}
          >
            <Ionicons name="warning" size={24} color={theme.colors.white} />
            <Text style={styles.testButtonText}>Simulate Swarm</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.testButton, { backgroundColor: theme.colors.warning }]}
            onPress={() => handleTestNotification('varroa')}
          >
            <Ionicons name="bug" size={24} color={theme.colors.white} />
            <Text style={styles.testButtonText}>Simulate Varroa Outbreak</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.testButton, { backgroundColor: theme.colors.info }]}
            onPress={() => handleTestNotification('temperature')}
          >
            <Ionicons name="thermometer" size={24} color={theme.colors.white} />
            <Text style={styles.testButtonText}>Simulate Temperature Spike</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.testButton, { backgroundColor: theme.colors.primary }]}
            onPress={() => handleTestNotification('humidity')}
          >
            <Ionicons name="water" size={24} color={theme.colors.white} />
            <Text style={styles.testButtonText}>Simulate Humidity Alert</Text>
          </TouchableOpacity>
        </View>
      </Card>
      
      {/* App Settings */}
      <Card title="App Settings">
        <View style={styles.settingItem}>
          <View style={styles.settingTextContainer}>
            <Text style={styles.settingTitle}>Dark Mode</Text>
            <Text style={styles.settingDescription}>Enable dark theme</Text>
          </View>
          <Switch 
            trackColor={{ false: theme.colors.grey, true: theme.colors.primaryLight }}
            thumbColor={theme.colors.primary}
            value={false}
          />
        </View>
        
        <View style={styles.settingItem}>
          <View style={styles.settingTextContainer}>
            <Text style={styles.settingTitle}>Push Notifications</Text>
            <Text style={styles.settingDescription}>Enable push notifications</Text>
          </View>
          <Switch 
            trackColor={{ false: theme.colors.grey, true: theme.colors.primaryLight }}
            thumbColor={theme.colors.primary}
            value={true}
          />
        </View>
        
        <View style={styles.settingItem}>
          <View style={styles.settingTextContainer}>
            <Text style={styles.settingTitle}>Data Sync</Text>
            <Text style={styles.settingDescription}>Sync data in background</Text>
          </View>
          <Switch 
            trackColor={{ false: theme.colors.grey, true: theme.colors.primaryLight }}
            thumbColor={theme.colors.primary}
            value={true}
          />
        </View>
      </Card>
      
      {/* Logout Button */}
      <TouchableOpacity 
        style={styles.logoutButton}
        onPress={handleLogout}
      >
        <Ionicons name="log-out" size={20} color={theme.colors.white} />
        <Text style={styles.logoutButtonText}>Logout</Text>
      </TouchableOpacity>
      
      <View style={styles.versionContainer}>
        <Text style={styles.versionText}>HiveApp v1.0.0</Text>
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
  profileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.medium,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: theme.typography.headingSmall,
    fontWeight: 'bold',
    color: theme.colors.black,
    marginBottom: theme.spacing.tiny,
  },
  profileEmail: {
    fontSize: theme.typography.bodyMedium,
    color: theme.colors.darkGrey,
    marginBottom: theme.spacing.small,
  },
  userTypeContainer: {
    backgroundColor: theme.colors.primaryLight,
    paddingHorizontal: theme.spacing.small,
    paddingVertical: theme.spacing.tiny,
    borderRadius: theme.layout.borderRadiusSmall,
    alignSelf: 'flex-start',
  },
  userTypeLabel: {
    fontSize: theme.typography.bodySmall,
    color: theme.colors.primaryDark,
    fontWeight: 'bold',
  },
  thresholdContainer: {
    marginBottom: theme.spacing.medium,
  },
  thresholdTitle: {
    fontSize: theme.typography.bodyLarge,
    fontWeight: 'bold',
    color: theme.colors.darkGrey,
    marginBottom: theme.spacing.small,
  },
  thresholdInputs: {
    flexDirection: 'row',
  },
  inputContainer: {
    flex: 1,
    marginRight: theme.spacing.medium,
  },
  inputLabel: {
    fontSize: theme.typography.bodySmall,
    color: theme.colors.grey,
    marginBottom: theme.spacing.tiny,
  },
  input: {
    backgroundColor: theme.colors.white,
    borderWidth: 1,
    borderColor: theme.colors.lightGrey,
    borderRadius: theme.layout.borderRadiusSmall,
    padding: theme.spacing.small,
    fontSize: theme.typography.bodyMedium,
  },
  updateButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.layout.borderRadiusMedium,
    padding: theme.spacing.medium,
    alignItems: 'center',
    marginTop: theme.spacing.small,
  },
  updateButtonText: {
    fontSize: theme.typography.bodyMedium,
    fontWeight: 'bold',
    color: theme.colors.white,
  },
  testHiveSelector: {
    marginBottom: theme.spacing.medium,
  },
  testHiveLabel: {
    fontSize: theme.typography.bodyMedium,
    color: theme.colors.darkGrey,
    marginBottom: theme.spacing.small,
  },
  hiveSelector: {
    flexDirection: 'row',
  },
  hiveSelectorItem: {
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
  },
  hiveSelectorTextActive: {
    color: theme.colors.primaryDark,
    fontWeight: 'bold',
  },
  testButtonsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  testButton: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.medium,
    borderRadius: theme.layout.borderRadiusMedium,
    marginBottom: theme.spacing.medium,
  },
  testButtonText: {
    fontSize: theme.typography.bodyMedium,
    fontWeight: 'bold',
    color: theme.colors.white,
    marginLeft: theme.spacing.small,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.medium,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.lightGrey,
  },
  settingTextContainer: {
    flex: 1,
  },
  settingTitle: {
    fontSize: theme.typography.bodyLarge,
    color: theme.colors.black,
    marginBottom: theme.spacing.tiny,
  },
  settingDescription: {
    fontSize: theme.typography.bodySmall,
    color: theme.colors.grey,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.error,
    borderRadius: theme.layout.borderRadiusMedium,
    padding: theme.spacing.medium,
    marginTop: theme.spacing.large,
  },
  logoutButtonText: {
    fontSize: theme.typography.bodyMedium,
    fontWeight: 'bold',
    color: theme.colors.white,
    marginLeft: theme.spacing.small,
  },
  versionContainer: {
    alignItems: 'center',
    marginTop: theme.spacing.large,
    marginBottom: theme.spacing.medium,
  },
  versionText: {
    fontSize: theme.typography.bodySmall,
    color: theme.colors.grey,
  },
});

export default SettingsScreen; 
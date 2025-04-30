import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, TextInput, Alert } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { updateThresholds, triggerTestNotification, loadSavedThresholds } from '../redux/notificationSlice';
import { simulateHiveEvent } from '../redux/hiveSlice';
import { logout, logoutUser, updateAppSettings, loadSavedAppSettings } from '../redux/authSlice';
import theme from '../utils/theme';
import { Ionicons } from '@expo/vector-icons';
import Card from '../components/common/Card';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../contexts/ThemeContext';
import Button from '../components/common/Button';

const SettingsScreen = () => {
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const { theme: currentTheme, isDarkMode } = useTheme();
  
  const { hives, selectedHiveId } = useSelector(state => state.hives);
  const { thresholds } = useSelector(state => state.notifications);
  const { user, userType, appSettings } = useSelector(state => state.auth);
  
  // Local state for threshold inputs
  const [tempMin, setTempMin] = useState(thresholds.temperature.min.toString());
  const [tempMax, setTempMax] = useState(thresholds.temperature.max.toString());
  const [humidityMin, setHumidityMin] = useState(thresholds.humidity.min.toString());
  const [humidityMax, setHumidityMax] = useState(thresholds.humidity.max.toString());
  const [varroaMax, setVarroaMax] = useState(thresholds.varroa.max.toString());
  
  // Selected hive for testing
  const [testHiveId, setTestHiveId] = useState(selectedHiveId);
  const selectedHive = hives.find(h => h.id === testHiveId);
  
  // Load saved thresholds and app settings on mount
  useEffect(() => {
    dispatch(loadSavedThresholds());
    dispatch(loadSavedAppSettings());
  }, [dispatch]);

  // Update local state when thresholds change in Redux
  useEffect(() => {
    setTempMin(thresholds.temperature.min.toString());
    setTempMax(thresholds.temperature.max.toString());
    setHumidityMin(thresholds.humidity.min.toString());
    setHumidityMax(thresholds.humidity.max.toString());
    setVarroaMax(thresholds.varroa.max.toString());
  }, [thresholds]);
  
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

    // Show success alert
    Alert.alert("Success", "Notification thresholds updated successfully");
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
    
    // Navigate to Insights screen with the event type
    navigation.navigate('Insights', { 
      hiveId: selectedHive.id,
      eventType: type 
    });
  };
  
  const handleLogout = () => {
    dispatch(logoutUser());
    navigation.reset({
      index: 0,
      routes: [{ name: 'Login' }],
    });
  };
  
  // Function to handle toggling app settings
  const handleToggleSetting = (setting, value) => {
    dispatch(updateAppSettings({ [setting]: value }));
    
    // Show appropriate feedback based on the setting and its new value
    switch(setting) {
      case 'darkMode':
        // Dark mode already gives visual feedback by changing theme
        break;
      case 'pushNotifications':
        Alert.alert(
          value ? "Notifications Enabled" : "Notifications Disabled", 
          value ? "You will now receive alerts when hive sensors exceed thresholds." 
                : "You will no longer receive alerts for hive sensor readings."
        );
        break;
      case 'dataSync':
        Alert.alert(
          value ? "Auto Sync Enabled" : "Auto Sync Disabled",
          value ? "Hive data will automatically sync every 30 seconds." 
                : "Hive data will only update when you manually refresh."
        );
        break;
      default:
        Alert.alert("Setting Updated", `${setting} setting has been ${value ? 'enabled' : 'disabled'}.`);
    }
  };
  
  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: currentTheme.colors.background }]}
      contentContainerStyle={{ paddingBottom: 20 }}
    >
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={currentTheme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: currentTheme.colors.text }]}>Settings</Text>
      </View>
      
      {/* User Profile */}
      <Card title="User Profile" variant="elevated">
        <View style={styles.profileContainer}>
          <View style={[styles.profileIcon, { backgroundColor: currentTheme.colors.primary }]}>
            <Ionicons name="person" size={40} color={currentTheme.colors.white} />
          </View>
          <View style={styles.profileInfo}>
            <Text style={[styles.profileName, { color: currentTheme.colors.text }]}>{user?.name || 'User'}</Text>
            <Text style={[styles.profileEmail, { color: currentTheme.colors.textSecondary }]}>{user?.email || 'user@example.com'}</Text>
            <View style={[styles.userTypeContainer, { backgroundColor: currentTheme.colors.primaryLight }]}>
              <Text style={[styles.userTypeLabel, { color: isDarkMode ? currentTheme.colors.white : currentTheme.colors.primaryDark }]}>
                {userType === 'commercial' ? 'Commercial Beekeeper' : 'Hobby Beekeeper'}
              </Text>
            </View>
          </View>
        </View>
      </Card>
      
      {/* Notification Thresholds */}
      <Card title="Notification Thresholds">
        <View style={styles.thresholdContainer}>
          <Text style={[styles.thresholdTitle, { color: currentTheme.colors.text }]}>Temperature (°C)</Text>
          <View style={styles.thresholdInputs}>
            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: currentTheme.colors.textSecondary }]}>Min</Text>
              <TextInput
                style={[styles.input, { 
                  backgroundColor: currentTheme.colors.surface,
                  borderColor: currentTheme.colors.border,
                  color: currentTheme.colors.text
                }]}
                value={tempMin}
                onChangeText={setTempMin}
                keyboardType="numeric"
              />
            </View>
            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: currentTheme.colors.textSecondary }]}>Max</Text>
              <TextInput
                style={[styles.input, { 
                  backgroundColor: currentTheme.colors.surface,
                  borderColor: currentTheme.colors.border,
                  color: currentTheme.colors.text
                }]}
                value={tempMax}
                onChangeText={setTempMax}
                keyboardType="numeric"
              />
            </View>
          </View>
        </View>
        
        <View style={styles.thresholdContainer}>
          <Text style={[styles.thresholdTitle, { color: currentTheme.colors.text }]}>Humidity (%)</Text>
          <View style={styles.thresholdInputs}>
            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: currentTheme.colors.textSecondary }]}>Min</Text>
              <TextInput
                style={[styles.input, { 
                  backgroundColor: currentTheme.colors.surface,
                  borderColor: currentTheme.colors.border,
                  color: currentTheme.colors.text
                }]}
                value={humidityMin}
                onChangeText={setHumidityMin}
                keyboardType="numeric"
              />
            </View>
            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: currentTheme.colors.textSecondary }]}>Max</Text>
              <TextInput
                style={[styles.input, { 
                  backgroundColor: currentTheme.colors.surface,
                  borderColor: currentTheme.colors.border,
                  color: currentTheme.colors.text
                }]}
                value={humidityMax}
                onChangeText={setHumidityMax}
                keyboardType="numeric"
              />
            </View>
          </View>
        </View>
        
        <View style={styles.thresholdContainer}>
          <Text style={[styles.thresholdTitle, { color: currentTheme.colors.text }]}>Varroa Mite Index</Text>
          <View style={styles.thresholdInputs}>
            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: currentTheme.colors.textSecondary }]}>Max</Text>
              <TextInput
                style={[styles.input, { 
                  backgroundColor: currentTheme.colors.surface,
                  borderColor: currentTheme.colors.border,
                  color: currentTheme.colors.text
                }]}
                value={varroaMax}
                onChangeText={setVarroaMax}
                keyboardType="numeric"
              />
            </View>
          </View>
        </View>
        
        <Button 
          title="Update Thresholds"
          onPress={handleUpdateThresholds}
          variant="primary"
        />
      </Card>
      
      {/* Test Notifications */}
      <Card title="Test Notifications">
        <View style={styles.testHiveSelector}>
          <Text style={[styles.testHiveLabel, { color: currentTheme.colors.textSecondary }]}>Select Hive for Testing:</Text>
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
                    backgroundColor: currentTheme.colors.surface,
                    borderColor: currentTheme.colors.border
                  },
                  testHiveId === hive.id && { 
                    backgroundColor: currentTheme.colors.primaryLight,
                    borderColor: currentTheme.colors.primary
                  }
                ]}
                onPress={() => setTestHiveId(hive.id)}
              >
                <Text 
                  style={[
                    styles.hiveSelectorText,
                    { color: currentTheme.colors.textSecondary },
                    testHiveId === hive.id && { 
                      color: isDarkMode ? currentTheme.colors.white : currentTheme.colors.primary,
                      fontWeight: 'bold'
                    }
                  ]}
                >
                  {hive.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
        
        <View style={styles.testButtonsContainer}>
          <Button 
            title="Simulate Swarm"
            onPress={() => handleTestNotification('swarm')}
            variant="primary"
            icon={<Ionicons name="warning" size={20} color="#F9A826" />}
            style={styles.testButtonStyle}
          />
          
          <Button 
            title="Simulate Varroa Outbreak"
            onPress={() => handleTestNotification('varroa')}
            variant="primary"
            icon={<Ionicons name="bug" size={20} color="#F9A826" />}
            style={styles.testButtonStyle}
          />
          
          <Button 
            title="Simulate Temperature Spike"
            onPress={() => handleTestNotification('temperature')}
            variant="primary"
            icon={<Ionicons name="thermometer" size={20} color="#F9A826" />}
            style={styles.testButtonStyle}
          />
          
          <Button 
            title="Simulate Humidity Alert"
            onPress={() => handleTestNotification('humidity')}
            variant="primary"
            icon={<Ionicons name="water" size={20} color="#F9A826" />}
            style={styles.testButtonStyle}
          />
        </View>
      </Card>
      
      {/* App Settings */}
      <Card title="App Settings">
        <View style={[styles.settingItem, { borderBottomColor: currentTheme.colors.divider }]}>
          <View style={styles.settingTextContainer}>
            <Text style={[styles.settingTitle, { color: currentTheme.colors.text }]}>Dark Mode</Text>
            <Text style={[styles.settingDescription, { color: currentTheme.colors.textSecondary }]}>Enable dark theme</Text>
          </View>
          <Switch 
            trackColor={{ false: currentTheme.colors.grey, true: currentTheme.colors.primaryLight }}
            thumbColor={currentTheme.colors.primary}
            value={appSettings.darkMode}
            onValueChange={(value) => handleToggleSetting('darkMode', value)}
          />
        </View>
        
        <View style={[styles.settingItem, { borderBottomColor: currentTheme.colors.divider }]}>
          <View style={styles.settingTextContainer}>
            <Text style={[styles.settingTitle, { color: currentTheme.colors.text }]}>Push Notifications</Text>
            <Text style={[styles.settingDescription, { color: currentTheme.colors.textSecondary }]}>Enable push notifications</Text>
          </View>
          <Switch 
            trackColor={{ false: currentTheme.colors.grey, true: currentTheme.colors.primaryLight }}
            thumbColor={currentTheme.colors.primary}
            value={appSettings.pushNotifications}
            onValueChange={(value) => handleToggleSetting('pushNotifications', value)}
          />
        </View>
        
        <View style={[styles.settingItem, { borderBottomColor: currentTheme.colors.divider }]}>
          <View style={styles.settingTextContainer}>
            <Text style={[styles.settingTitle, { color: currentTheme.colors.text }]}>Data Sync</Text>
            <Text style={[styles.settingDescription, { color: currentTheme.colors.textSecondary }]}>Sync data in background</Text>
          </View>
          <Switch 
            trackColor={{ false: currentTheme.colors.grey, true: currentTheme.colors.primaryLight }}
            thumbColor={currentTheme.colors.primary}
            value={appSettings.dataSync}
            onValueChange={(value) => handleToggleSetting('dataSync', value)}
          />
        </View>
      </Card>
      
      {/* Logout Button */}
      <Button 
        title="Logout"
        onPress={handleLogout}
        variant="primary"
        icon={<Ionicons name="log-out" size={20} color="#F9A826" />}
      />
      
      <View style={styles.versionContainer}>
        <Text style={[styles.versionText, { color: currentTheme.colors.grey }]}>HiveApp v1.0.0</Text>
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
    marginRight: theme.spacing.medium,
  },
  headerTitle: {
    fontSize: theme.typography.headingMedium,
    fontWeight: 'bold',
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
    marginBottom: theme.spacing.tiny,
  },
  profileEmail: {
    fontSize: theme.typography.bodyMedium,
    marginBottom: theme.spacing.small,
  },
  userTypeContainer: {
    paddingHorizontal: theme.spacing.small,
    paddingVertical: theme.spacing.tiny,
    borderRadius: theme.layout.borderRadiusSmall,
    alignSelf: 'flex-start',
  },
  userTypeLabel: {
    fontSize: theme.typography.bodySmall,
    fontWeight: 'bold',
  },
  thresholdContainer: {
    marginBottom: theme.spacing.medium,
  },
  thresholdTitle: {
    fontSize: theme.typography.bodyLarge,
    fontWeight: 'bold',
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
    marginBottom: theme.spacing.tiny,
  },
  input: {
    borderWidth: 1,
    borderRadius: theme.layout.borderRadiusSmall,
    padding: theme.spacing.small,
    fontSize: theme.typography.bodyMedium,
  },
  testHiveSelector: {
    marginBottom: theme.spacing.medium,
  },
  testHiveLabel: {
    fontSize: theme.typography.bodyMedium,
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
    borderWidth: 1,
  },
  hiveSelectorText: {
    fontSize: theme.typography.bodyMedium,
  },
  testButtonsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  testButtonStyle: {
    width: '48%',
    marginBottom: theme.spacing.medium,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.medium,
    borderBottomWidth: 1,
  },
  settingTextContainer: {
    flex: 1,
  },
  settingTitle: {
    fontSize: theme.typography.bodyLarge,
    marginBottom: theme.spacing.tiny,
  },
  settingDescription: {
    fontSize: theme.typography.bodySmall,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
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
    marginBottom: 100,
  },
  versionText: {
    fontSize: theme.typography.bodySmall,
  },
});

export default SettingsScreen; 
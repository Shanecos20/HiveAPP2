import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import theme from '../utils/theme';
import { saveHive } from '../redux/hiveSlice';

// Generate sample history data for new hives
const generateSensorHistory = (baseValue, count = 6, variance = 5) => {
  const history = [];
  for (let i = 0; i < count; i++) {
    // Add some randomness to create a more realistic chart
    const randomVariance = (Math.random() - 0.5) * variance;
    history.push(Math.max(0, baseValue + randomVariance));
  }
  return history;
};

const EditHiveScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const dispatch = useDispatch();
  const { hiveId } = route.params || {};
  const { theme: currentTheme, isDarkMode } = useTheme();
  
  // Determine if we're adding a new hive or editing an existing one
  const isAddMode = !hiveId;
  
  const hive = useSelector(state => 
    hiveId ? state.hives.hives.find(h => h.id === hiveId) : null
  );
  
  const loading = useSelector(state => state.hives.loading);
  const error = useSelector(state => state.hives.error);
  
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  
  useEffect(() => {
    if (hive) {
      setName(hive.name);
      setLocation(hive.location);
      setNotes(hive.notes || '');
    }
  }, [hive]);
  
  const handleSave = async () => {
    if (!name.trim() || !location.trim()) {
      Alert.alert('Validation Error', 'Name and location are required.');
      return;
    }
    
    setIsSaving(true);
    
    try {
      // Create updated or new hive object
      const timestamp = new Date().toISOString();
      const hiveData = isAddMode
        ? {
            id: 'hive_' + Date.now(), // Generate a unique ID
            name: name.trim(),
            location: location.trim(),
            notes: notes.trim(),
            createdAt: timestamp,
            lastUpdated: timestamp,
            sensors: {
              temperature: 32,
              humidity: 45,
              varroa: 2,
              weight: 15
            },
            history: {
              temperature: generateSensorHistory(32),
              humidity: generateSensorHistory(45),
              varroa: generateSensorHistory(2, 6, 1),
              weight: generateSensorHistory(15, 6, 2)
            },
            status: 'healthy'
          }
        : {
            ...hive,
            id: hiveId,
            name: name.trim(),
            location: location.trim(),
            notes: notes.trim(),
            lastUpdated: timestamp
          };
      
      // Dispatch the async thunk
      const resultAction = await dispatch(saveHive(hiveData));
      
      if (saveHive.fulfilled.match(resultAction)) {
        Alert.alert('Success', isAddMode ? 'Hive added successfully!' : 'Hive updated successfully!', [
          { 
            text: 'OK', 
            onPress: () => {
              // Navigate to Main (Dashboard) after adding/editing a hive
              navigation.navigate('Main');
            }
          }
        ]);
      } else {
        // Handle error from the thunk
        const errorMessage = resultAction.error?.message || 'Failed to save hive';
        Alert.alert('Error', errorMessage);
      }
    } catch (err) {
      Alert.alert('Error', 'An unexpected error occurred while saving the hive.');
      console.error('Save hive error:', err);
    } finally {
      setIsSaving(false);
    }
  };
  
  if (!isAddMode && !hive) {
    return (
      <View style={[styles.errorContainer, {
        backgroundColor: isDarkMode ? currentTheme.colors.background : theme.colors.background
      }]}>
        <Text style={[styles.errorText, {
          color: isDarkMode ? currentTheme.colors.error : theme.colors.error
        }]}>Hive not found</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={[styles.backLink, {
            color: isDarkMode ? currentTheme.colors.primary : theme.colors.primary
          }]}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }
  
  return (
    <ScrollView style={[styles.container, {
      backgroundColor: isDarkMode ? currentTheme.colors.background : theme.colors.background
    }]}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={isDarkMode ? currentTheme.colors.text : theme.colors.black} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, {
          color: isDarkMode ? currentTheme.colors.text : theme.colors.black
        }]}>{isAddMode ? 'Add New Hive' : 'Edit Hive'}</Text>
      </View>
      
      <View style={styles.form}>
        {error && (
          <View style={styles.errorMessage}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}
        
        <View style={styles.formGroup}>
          <Text style={[styles.label, {
            color: isDarkMode ? currentTheme.colors.text : theme.colors.darkGrey
          }]}>Hive Name</Text>
          <TextInput
            style={[styles.input, {
              backgroundColor: isDarkMode ? currentTheme.colors.card : theme.colors.white,
              color: isDarkMode ? currentTheme.colors.text : theme.colors.black,
              borderColor: isDarkMode ? currentTheme.colors.border : theme.colors.lightGrey
            }]}
            value={name}
            onChangeText={setName}
            placeholder="Enter hive name"
            placeholderTextColor={isDarkMode ? currentTheme.colors.textSecondary : theme.colors.grey}
          />
        </View>
        
        <View style={styles.formGroup}>
          <Text style={[styles.label, {
            color: isDarkMode ? currentTheme.colors.text : theme.colors.darkGrey
          }]}>Location</Text>
          <TextInput
            style={[styles.input, {
              backgroundColor: isDarkMode ? currentTheme.colors.card : theme.colors.white,
              color: isDarkMode ? currentTheme.colors.text : theme.colors.black,
              borderColor: isDarkMode ? currentTheme.colors.border : theme.colors.lightGrey
            }]}
            value={location}
            onChangeText={setLocation}
            placeholder="Enter hive location"
            placeholderTextColor={isDarkMode ? currentTheme.colors.textSecondary : theme.colors.grey}
          />
        </View>
        
        <View style={styles.formGroup}>
          <Text style={[styles.label, {
            color: isDarkMode ? currentTheme.colors.text : theme.colors.darkGrey
          }]}>Notes</Text>
          <TextInput
            style={[styles.input, styles.textArea, {
              backgroundColor: isDarkMode ? currentTheme.colors.card : theme.colors.white,
              color: isDarkMode ? currentTheme.colors.text : theme.colors.black,
              borderColor: isDarkMode ? currentTheme.colors.border : theme.colors.lightGrey
            }]}
            value={notes}
            onChangeText={setNotes}
            placeholder="Enter notes about this hive"
            placeholderTextColor={isDarkMode ? currentTheme.colors.textSecondary : theme.colors.grey}
            multiline
            numberOfLines={4}
          />
        </View>
        
        {!isAddMode && (
          <View style={[styles.sensorContainer, {
            borderColor: isDarkMode ? currentTheme.colors.border : theme.colors.lightGrey
          }]}>
            <Text style={[styles.sectionTitle, {
              color: isDarkMode ? currentTheme.colors.text : theme.colors.black
            }]}>Current Sensor Readings</Text>
            
            <View style={[styles.sensorGrid, {
              backgroundColor: isDarkMode ? currentTheme.colors.card : theme.colors.white,
              borderColor: isDarkMode ? currentTheme.colors.border : theme.colors.lightGrey
            }]}>
              <View style={styles.sensorItem}>
                <Ionicons name="thermometer" size={24} color={theme.colors.error} />
                <Text style={[styles.sensorValue, {
                  color: isDarkMode ? currentTheme.colors.text : theme.colors.black
                }]}>{hive.sensors.temperature}°C</Text>
                <Text style={[styles.sensorLabel, {
                  color: isDarkMode ? currentTheme.colors.textSecondary : theme.colors.grey
                }]}>Temperature</Text>
              </View>
              
              <View style={styles.sensorItem}>
                <Ionicons name="water" size={24} color={theme.colors.info} />
                <Text style={[styles.sensorValue, {
                  color: isDarkMode ? currentTheme.colors.text : theme.colors.black
                }]}>{hive.sensors.humidity}%</Text>
                <Text style={[styles.sensorLabel, {
                  color: isDarkMode ? currentTheme.colors.textSecondary : theme.colors.grey
                }]}>Humidity</Text>
              </View>
              
              <View style={styles.sensorItem}>
                <Ionicons name="bug" size={24} color={theme.colors.warning} />
                <Text style={[styles.sensorValue, {
                  color: isDarkMode ? currentTheme.colors.text : theme.colors.black
                }]}>{hive.sensors.varroa}</Text>
                <Text style={[styles.sensorLabel, {
                  color: isDarkMode ? currentTheme.colors.textSecondary : theme.colors.grey
                }]}>Varroa Index</Text>
              </View>
              
              <View style={styles.sensorItem}>
                <Ionicons name="scale" size={24} color={theme.colors.success} />
                <Text style={[styles.sensorValue, {
                  color: isDarkMode ? currentTheme.colors.text : theme.colors.black
                }]}>{hive.sensors.weight} kg</Text>
                <Text style={[styles.sensorLabel, {
                  color: isDarkMode ? currentTheme.colors.textSecondary : theme.colors.grey
                }]}>Weight</Text>
              </View>
            </View>
          </View>
        )}
        
        <TouchableOpacity 
          style={[styles.saveButton, {
            backgroundColor: isSaving ? theme.colors.grey : theme.colors.primary,
          }]}
          onPress={handleSave}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator color={theme.colors.white} />
          ) : (
            <Text style={styles.saveButtonText}>{isAddMode ? 'Add Hive' : 'Save Changes'}</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.large,
  },
  errorText: {
    fontSize: theme.typography.headingMedium,
    color: theme.colors.error,
    marginBottom: theme.spacing.medium,
  },
  backLink: {
    fontSize: theme.typography.bodyMedium,
    color: theme.colors.primary,
    textDecorationLine: 'underline',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.medium,
    paddingTop: theme.spacing.large,
    paddingBottom: theme.spacing.medium,
  },
  backButton: {
    marginRight: theme.spacing.medium,
  },
  headerTitle: {
    fontSize: theme.typography.headingMedium,
    fontWeight: 'bold',
    color: theme.colors.black,
  },
  form: {
    padding: theme.spacing.medium,
  },
  formGroup: {
    marginBottom: theme.spacing.medium,
  },
  label: {
    fontSize: theme.typography.bodyMedium,
    fontWeight: 'bold',
    color: theme.colors.darkGrey,
    marginBottom: theme.spacing.small,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.lightGrey,
    borderRadius: theme.layout.borderRadiusMedium,
    padding: theme.spacing.medium,
    fontSize: theme.typography.bodyMedium,
    backgroundColor: theme.colors.white,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  sectionTitle: {
    fontSize: theme.typography.bodyLarge,
    fontWeight: 'bold',
    color: theme.colors.black,
    marginBottom: theme.spacing.medium,
  },
  sensorContainer: {
    marginVertical: theme.spacing.medium,
  },
  sensorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: theme.colors.lightGrey,
    borderRadius: theme.layout.borderRadiusMedium,
    padding: theme.spacing.medium,
    backgroundColor: theme.colors.white,
  },
  sensorItem: {
    width: '45%',
    alignItems: 'center',
    marginBottom: theme.spacing.medium,
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
  saveButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.layout.borderRadiusMedium,
    padding: theme.spacing.medium,
    alignItems: 'center',
    marginTop: theme.spacing.large,
    height: 50,
    justifyContent: 'center',
  },
  saveButtonText: {
    fontSize: theme.typography.bodyLarge,
    fontWeight: 'bold',
    color: theme.colors.white,
  },
  errorMessage: {
    backgroundColor: theme.colors.errorLight,
    padding: theme.spacing.medium,
    borderRadius: theme.layout.borderRadiusMedium,
    marginBottom: theme.spacing.medium,
  },
});

export default EditHiveScreen; 
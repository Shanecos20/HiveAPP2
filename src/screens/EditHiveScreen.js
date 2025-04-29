import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import theme from '../utils/theme';
import { saveHive } from '../redux/hiveSlice';
import QRCodeScanner from '../components/QRCodeScanner';
import Button from '../components/common/Button';

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
  
  // For QR scanning and manual hive ID (Add mode only)
  const [manualHiveId, setManualHiveId] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  
  // For error tracking during scans
  const [scanError, setScanError] = useState(null);
  
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
    
    if (isAddMode && !scanResult && !manualHiveId.trim()) {
      Alert.alert('Validation Error', 'Please scan a QR code or enter a hive ID.');
      return;
    }
    
    setIsSaving(true);
    setScanError(null);
    
    try {
      // Create the hive data object
      const hiveData = {
        id: isAddMode ? (scanResult || manualHiveId.trim()) : hiveId,
        name: name.trim(),
        location: location.trim(),
        notes: notes.trim(),
      };
      
      // Dispatch with the new parameters (hiveData and isAddMode flag)
      const resultAction = await dispatch(saveHive({ hiveData, isAddMode }));
      
      if (saveHive.fulfilled.match(resultAction)) {
        Alert.alert(
          'Success', 
          isAddMode ? 'Hive connected successfully!' : 'Hive updated successfully!', 
          [{ text: 'OK', onPress: () => navigation.navigate('Main') }]
        );
      }
    } catch (err) {
      setScanError(err.message || 'An unexpected error occurred.');
      Alert.alert('Error', err.message || 'An unexpected error occurred.');
    } finally {
      setIsSaving(false);
    }
  };
  
  // Handle QR code scanning result
  const handleScanComplete = (data) => {
    setScanResult(data);
    setIsScanning(false);
    // Display success message
    Alert.alert('Success', `QR code scanned successfully. Hive ID: ${data}`);
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
      {isScanning && (
        <QRCodeScanner 
          onScan={handleScanComplete}
          onClose={() => setIsScanning(false)}
        />
      )}
      
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={isDarkMode ? currentTheme.colors.text : theme.colors.black} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, {
          color: isDarkMode ? currentTheme.colors.text : theme.colors.black
        }]}>{isAddMode ? 'Connect to Hive' : 'Edit Hive'}</Text>
      </View>
      
      <View style={styles.form}>
        {(error || scanError) && (
          <View style={styles.errorMessage}>
            <Text style={styles.errorText}>{error || scanError}</Text>
          </View>
        )}
        
        {isAddMode && (
          <View style={styles.formGroup}>
            <Text style={[styles.label, {
              color: isDarkMode ? currentTheme.colors.text : theme.colors.darkGrey
            }]}>Hive ID</Text>
            
            <View style={styles.hiveIdContainer}>
              <TextInput
                style={[styles.input, styles.hiveIdInput, {
                  backgroundColor: isDarkMode ? currentTheme.colors.card : theme.colors.white,
                  color: isDarkMode ? currentTheme.colors.text : theme.colors.black,
                  borderColor: isDarkMode ? currentTheme.colors.border : theme.colors.lightGrey
                }]}
                value={scanResult || manualHiveId}
                onChangeText={setManualHiveId}
                placeholder="Enter hive ID or scan QR code"
                placeholderTextColor={isDarkMode ? currentTheme.colors.textSecondary : theme.colors.grey}
                editable={!scanResult} // Disable editing if QR is scanned
              />
              <TouchableOpacity
                style={[styles.scanButton, {
                  backgroundColor: isDarkMode ? currentTheme.colors.primary : theme.colors.primary
                }]}
                onPress={() => setIsScanning(true)}
              >
                <Ionicons name="qr-code" size={24} color={theme.colors.white} />
              </TouchableOpacity>
            </View>
            
            {scanResult && (
              <TouchableOpacity 
                style={styles.clearScanButton}
                onPress={() => {
                  setScanResult(null);
                  setManualHiveId('');
                }}
              >
                <Text style={[styles.clearScanText, {
                  color: isDarkMode ? currentTheme.colors.primary : theme.colors.primary
                }]}>Clear scanned code</Text>
              </TouchableOpacity>
            )}
            
            <Text style={[styles.helperText, {
              color: isDarkMode ? currentTheme.colors.textSecondary : theme.colors.darkGrey
            }]}>
              Scan the QR code on your physical hive or enter the hive ID
            </Text>
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
        
        {!isAddMode && hive?.sensors && (
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
        
        <Button 
          title={isAddMode ? 'Connect Hive' : 'Save Changes'}
          onPress={handleSave}
          disabled={isSaving}
          loading={isSaving}
          variant="primary"
        />
        
        {isAddMode && (
          <View style={styles.simulationNote}>
            <Ionicons name="information-circle" size={20} color={theme.colors.info} />
            <Text style={[styles.noteText, {
              color: isDarkMode ? currentTheme.colors.textSecondary : theme.colors.darkGrey
            }]}>
              Your hive data is now streamed from the Unity Hive Simulator. Use the QR code or Hive ID from the simulator.
            </Text>
          </View>
        )}
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
  errorMessage: {
    backgroundColor: theme.colors.errorLight,
    padding: theme.spacing.medium,
    borderRadius: theme.layout.borderRadiusMedium,
    marginBottom: theme.spacing.medium,
  },
  // QR Code Scanner and Hive ID input styles
  hiveIdContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  hiveIdInput: {
    flex: 1,
    marginRight: theme.spacing.small,
  },
  scanButton: {
    width: 50,
    height: 50,
    borderRadius: theme.layout.borderRadiusSmall,
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearScanButton: {
    marginTop: theme.spacing.small,
    alignSelf: 'flex-start',
  },
  clearScanText: {
    fontSize: theme.typography.bodySmall,
    color: theme.colors.primary,
  },
  helperText: {
    fontSize: theme.typography.bodySmall,
    color: theme.colors.darkGrey,
    marginTop: theme.spacing.tiny,
  },
  simulationNote: {
    flexDirection: 'row',
    backgroundColor: theme.colors.info + '20', // 20% opacity
    padding: theme.spacing.medium,
    borderRadius: theme.layout.borderRadiusSmall,
    marginTop: theme.spacing.large,
    alignItems: 'flex-start',
  },
  noteText: {
    fontSize: theme.typography.bodySmall,
    color: theme.colors.darkGrey,
    marginLeft: theme.spacing.small,
    flex: 1,
  },
});

export default EditHiveScreen; 
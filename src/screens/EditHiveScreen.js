import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import theme from '../utils/theme';
import { updateHive } from '../redux/hiveSlice';

const EditHiveScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const dispatch = useDispatch();
  const { hiveId } = route.params || {};
  
  const hive = useSelector(state => 
    state.hives.hives.find(h => h.id === hiveId)
  );
  
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  
  useEffect(() => {
    if (hive) {
      setName(hive.name);
      setLocation(hive.location);
      setNotes(hive.notes || '');
    }
  }, [hive]);
  
  const handleSave = () => {
    if (!name.trim() || !location.trim()) {
      Alert.alert('Validation Error', 'Name and location are required.');
      return;
    }
    
    dispatch(updateHive({
      id: hiveId,
      name: name.trim(),
      location: location.trim(),
      notes: notes.trim(),
    }));
    
    Alert.alert('Success', 'Hive updated successfully!', [
      { text: 'OK', onPress: () => navigation.goBack() }
    ]);
  };
  
  if (!hive) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Hive not found</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backLink}>Go Back</Text>
        </TouchableOpacity>
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
        <Text style={styles.headerTitle}>Edit Hive</Text>
      </View>
      
      <View style={styles.form}>
        <View style={styles.formGroup}>
          <Text style={styles.label}>Hive Name</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Enter hive name"
          />
        </View>
        
        <View style={styles.formGroup}>
          <Text style={styles.label}>Location</Text>
          <TextInput
            style={styles.input}
            value={location}
            onChangeText={setLocation}
            placeholder="Enter hive location"
          />
        </View>
        
        <View style={styles.formGroup}>
          <Text style={styles.label}>Notes</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={notes}
            onChangeText={setNotes}
            placeholder="Enter notes about this hive"
            multiline
            numberOfLines={4}
          />
        </View>
        
        <View style={styles.sensorContainer}>
          <Text style={styles.sectionTitle}>Current Sensor Readings</Text>
          
          <View style={styles.sensorGrid}>
            <View style={styles.sensorItem}>
              <Ionicons name="thermometer" size={24} color={theme.colors.error} />
              <Text style={styles.sensorValue}>{hive.sensors.temperature}°C</Text>
              <Text style={styles.sensorLabel}>Temperature</Text>
            </View>
            
            <View style={styles.sensorItem}>
              <Ionicons name="water" size={24} color={theme.colors.info} />
              <Text style={styles.sensorValue}>{hive.sensors.humidity}%</Text>
              <Text style={styles.sensorLabel}>Humidity</Text>
            </View>
            
            <View style={styles.sensorItem}>
              <Ionicons name="bug" size={24} color={theme.colors.warning} />
              <Text style={styles.sensorValue}>{hive.sensors.varroa}</Text>
              <Text style={styles.sensorLabel}>Varroa Index</Text>
            </View>
            
            <View style={styles.sensorItem}>
              <Ionicons name="scale" size={24} color={theme.colors.success} />
              <Text style={styles.sensorValue}>{hive.sensors.weight} kg</Text>
              <Text style={styles.sensorLabel}>Weight</Text>
            </View>
          </View>
        </View>
        
        <TouchableOpacity 
          style={styles.saveButton}
          onPress={handleSave}
        >
          <Text style={styles.saveButtonText}>Save Changes</Text>
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
  },
  saveButtonText: {
    fontSize: theme.typography.bodyLarge,
    fontWeight: 'bold',
    color: theme.colors.white,
  },
});

export default EditHiveScreen; 
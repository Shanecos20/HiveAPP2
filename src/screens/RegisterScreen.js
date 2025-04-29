import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  KeyboardAvoidingView, 
  Platform,
  ActivityIndicator,
  Alert,
  ScrollView
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { register } from '../redux/authSlice';
import theme from '../utils/theme';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../components/common';

const RegisterScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { isLoading, error } = useSelector(state => state.auth);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [userType, setUserType] = useState('hobbyist'); // Default to hobbyist
  const [showPassword, setShowPassword] = useState(false);
  
  const handleRegister = async () => {
    // Basic validation
    if (!email || !password || !name) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }
    
    const success = await dispatch(register(email, password, name, userType));
    
    if (success) {
      navigation.reset({
        index: 0,
        routes: [{ name: 'Main' }],
      });
    }
  };
  
  const handleGoToLogin = () => {
    navigation.navigate('Login');
  };
  
  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.headerContainer}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={handleGoToLogin}
          >
            <Ionicons name="arrow-back" size={24} color={theme.colors.primary} />
          </TouchableOpacity>
          <Text style={styles.headerText}>Create Account</Text>
        </View>
        
        <View style={styles.formContainer}>
          <View style={styles.inputContainer}>
            <Ionicons name="person" size={20} color={theme.colors.grey} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Full Name"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
            />
          </View>
          
          <View style={styles.inputContainer}>
            <Ionicons name="mail" size={20} color={theme.colors.grey} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
          
          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed" size={20} color={theme.colors.grey} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity 
              style={styles.passwordToggle}
              onPress={() => setShowPassword(!showPassword)}
            >
              <Ionicons 
                name={showPassword ? 'eye-off' : 'eye'} 
                size={20} 
                color={theme.colors.grey} 
              />
            </TouchableOpacity>
          </View>
          
          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed" size={20} color={theme.colors.grey} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Confirm Password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showPassword}
            />
          </View>
          
          <Text style={styles.sectionTitle}>I am a:</Text>
          
          <View style={styles.userTypeContainer}>
            <Button
              title="Hobby Beekeeper"
              onPress={() => setUserType('hobbyist')}
              icon={<Ionicons name="person" size={24} color={userType === 'hobbyist' ? "#FFFFFF" : "#F9A826"} />}
              style={[
                styles.userTypeButtonStyle,
                userType === 'hobbyist' && styles.selectedPrimaryType
              ]}
              textStyle={userType === 'hobbyist' ? styles.selectedButtonText : {}}
            />
            
            <Button
              title="Commercial"
              onPress={() => setUserType('commercial')}
              variant="secondary"
              icon={<Ionicons name="business" size={24} color={userType === 'commercial' ? "#FFFFFF" : "#4CAF50"} />}
              style={[
                styles.userTypeButtonStyle,
                { backgroundColor: 'rgba(220, 242, 220, 0.95)' },
                userType === 'commercial' && styles.selectedSecondaryType
              ]}
              textStyle={userType === 'commercial' ? styles.selectedButtonText : {}}
            />
          </View>
          
          {error && (
            <Text style={styles.errorText}>{error}</Text>
          )}
          
          <Button
            title="Create Account"
            onPress={handleRegister}
            loading={isLoading}
            disabled={isLoading}
            style={styles.buttonMargin}
            variant="secondary"
          />
          
          <TouchableOpacity 
            style={styles.loginLink}
            onPress={handleGoToLogin}
          >
            <Text style={styles.loginLinkText}>
              Already have an account? <Text style={styles.loginLinkTextBold}>Sign in</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    padding: theme.spacing.medium,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.spacing.large,
    marginBottom: theme.spacing.xlarge,
  },
  backButton: {
    padding: theme.spacing.small,
  },
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginLeft: theme.spacing.medium,
  },
  formContainer: {
    width: '100%',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    borderRadius: theme.layout.borderRadiusMedium,
    marginBottom: theme.spacing.medium,
    borderWidth: 1,
    borderColor: theme.colors.lightGrey,
  },
  inputIcon: {
    padding: theme.spacing.medium,
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: theme.typography.bodyMedium,
  },
  passwordToggle: {
    padding: theme.spacing.medium,
  },
  sectionTitle: {
    fontSize: theme.typography.bodyLarge,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginTop: theme.spacing.medium,
    marginBottom: theme.spacing.medium,
  },
  userTypeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.large,
  },
  userTypeButtonStyle: {
    width: '48%',
  },
  selectedPrimaryType: {
    backgroundColor: '#F9A826',
    borderColor: '#E08600',
  },
  selectedSecondaryType: {
    backgroundColor: '#4CAF50',
    borderColor: '#388E3C',
  },
  selectedButtonText: {
    color: '#FFFFFF',
  },
  errorText: {
    color: theme.colors.error,
    marginBottom: theme.spacing.medium,
    fontSize: theme.typography.bodySmall,
  },
  buttonMargin: {
    marginVertical: theme.spacing.medium,
  },
  loginLink: {
    alignItems: 'center',
    marginTop: theme.spacing.medium,
  },
  loginLinkText: {
    fontSize: theme.typography.bodyMedium,
    color: theme.colors.grey,
  },
  loginLinkTextBold: {
    fontWeight: 'bold',
    color: '#4CAF50',
  },
});

export default RegisterScreen; 
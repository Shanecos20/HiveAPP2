import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  Image, 
  KeyboardAvoidingView, 
  Platform,
  ActivityIndicator,
  Alert
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { login } from '../redux/authSlice';
import theme from '../utils/theme';
import { Ionicons } from '@expo/vector-icons';

const LoginScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { isLoading, error } = useSelector(state => state.auth);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }
    
    const success = await dispatch(login(email, password));
    
    if (success) {
      navigation.reset({
        index: 0,
        routes: [{ name: 'Main' }],
      });
    }
  };
  
  const handleRegister = () => {
    navigation.navigate('Register');
  };
  
  const handleDemoLogin = async (userType) => {
    let demoEmail = userType === 'hobbyist' ? 'hobbyist@example.com' : 'commercial@example.com';
    let demoPassword = 'password';
    
    const success = await dispatch(login(demoEmail, demoPassword));
    
    if (success) {
      navigation.reset({
        index: 0,
        routes: [{ name: 'Main' }],
      });
    }
  };
  
  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.logoContainer}>
        <Image 
          source={require('../../assets/icon.png')} 
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.appName}>HiveApp</Text>
        <Text style={styles.tagline}>Smart Beekeeping Management</Text>
      </View>
      
      <View style={styles.formContainer}>
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
        
        {error && (
          <Text style={styles.errorText}>{error}</Text>
        )}
        
        <TouchableOpacity 
          style={styles.loginButton}
          onPress={handleLogin}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color={theme.colors.white} />
          ) : (
            <Text style={styles.loginButtonText}>Login</Text>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.registerButton}
          onPress={handleRegister}
          disabled={isLoading}
        >
          <Text style={styles.registerButtonText}>Create Account</Text>
        </TouchableOpacity>
        
        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or try demo</Text>
          <View style={styles.dividerLine} />
        </View>
        
        <View style={styles.demoContainer}>
          <TouchableOpacity 
            style={[styles.demoButton, { backgroundColor: theme.colors.primaryLight }]}
            onPress={() => handleDemoLogin('hobbyist')}
            disabled={isLoading}
          >
            <Ionicons name="person" size={20} color={theme.colors.primary} />
            <Text style={[styles.demoButtonText, { color: theme.colors.primary }]}>
              Hobby Beekeeper
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.demoButton, { backgroundColor: theme.colors.secondaryLight }]}
            onPress={() => handleDemoLogin('commercial')}
            disabled={isLoading}
          >
            <Ionicons name="business" size={20} color={theme.colors.secondary} />
            <Text style={[styles.demoButtonText, { color: theme.colors.secondary }]}>
              Commercial
            </Text>
          </TouchableOpacity>
        </View>
      </View>
      
      <View style={styles.footer}>
        <Text style={styles.footerText}>© 2023 HiveApp. All rights reserved.</Text>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: theme.spacing.medium,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: theme.spacing.xlarge * 2,
    marginBottom: theme.spacing.xlarge,
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: theme.spacing.medium,
  },
  appName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: theme.spacing.small,
  },
  tagline: {
    fontSize: theme.typography.bodyMedium,
    color: theme.colors.darkGrey,
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
  errorText: {
    color: theme.colors.error,
    marginBottom: theme.spacing.medium,
    fontSize: theme.typography.bodySmall,
  },
  loginButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.layout.borderRadiusMedium,
    padding: theme.spacing.medium,
    alignItems: 'center',
    marginBottom: theme.spacing.medium,
  },
  loginButtonText: {
    color: theme.colors.white,
    fontSize: theme.typography.bodyLarge,
    fontWeight: 'bold',
  },
  registerButton: {
    backgroundColor: 'transparent',
    borderRadius: theme.layout.borderRadiusMedium,
    padding: theme.spacing.medium,
    alignItems: 'center',
    marginBottom: theme.spacing.medium,
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  registerButtonText: {
    color: theme.colors.primary,
    fontSize: theme.typography.bodyLarge,
    fontWeight: 'bold',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: theme.spacing.medium,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: theme.colors.lightGrey,
  },
  dividerText: {
    color: theme.colors.grey,
    paddingHorizontal: theme.spacing.medium,
    fontSize: theme.typography.bodySmall,
  },
  demoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  demoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.medium,
    borderRadius: theme.layout.borderRadiusMedium,
    width: '48%',
  },
  demoButtonText: {
    fontSize: theme.typography.bodyMedium,
    fontWeight: 'bold',
    marginLeft: theme.spacing.small,
  },
  footer: {
    marginTop: 'auto',
    alignItems: 'center',
    padding: theme.spacing.medium,
  },
  footerText: {
    fontSize: theme.typography.bodySmall,
    color: theme.colors.grey,
  },
});

export default LoginScreen; 
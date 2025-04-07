import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, Text, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { useAuth } from '../AuthContext';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const { signIn, signUp } = useAuth();

  // Form validation
  const validateForm = () => {
    setErrorMessage('');
    
    if (!email.trim()) {
      setErrorMessage('Email is required');
      return false;
    }
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setErrorMessage('Please enter a valid email address');
      return false;
    }
    
    if (!password.trim()) {
      setErrorMessage('Password is required');
      return false;
    }
    
    if (isSignUp && password.length < 8) {
      setErrorMessage('Password must be at least 8 characters');
      return false;
    }
    
    return true;
  };

  const handleAuth = async () => {
    if (!validateForm()) return;
    
    try {
      setIsLoading(true);
      setErrorMessage('');
      
      if (isSignUp) {
        await signUp(email, password);
      } else {
        await signIn(email, password);
      }
    } catch (error) {
      if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage('An unknown error occurred');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const switchMode = () => {
    setIsSignUp(!isSignUp);
    setErrorMessage('');
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.logoContainer}>
          <Text style={styles.logo}>Etherworks</Text>
          <Text style={styles.tagline}>Your gateway to the digital realm</Text>
        </View>

        <View style={styles.formContainer}>
          <Text style={styles.title}>{isSignUp ? 'Create Account' : 'Welcome Back'}</Text>
          
          <TextInput
            style={styles.input}
            placeholder="Email"
            value={email}
            placeholderTextColor="gray"
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
          />
          
          <TextInput
            style={styles.input}
            placeholder="Password"
            value={password}
            placeholderTextColor="gray"
            onChangeText={setPassword}
            secureTextEntry
            autoComplete={isSignUp ? "password-new" : "password"}
          />

          {errorMessage ? (
            <Text style={styles.errorText}>{errorMessage}</Text>
          ) : null}

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleAuth}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.buttonText}>{isSignUp ? "Create Account" : "Sign In"}</Text>
            )}
          </TouchableOpacity>
          
          <View style={styles.switchContainer}>
            <Text style={styles.switchText}>
              {isSignUp ? "Already have an account?" : "Don't have an account?"}
            </Text>
            <TouchableOpacity onPress={switchMode}>
              <Text style={styles.switchButton}>{isSignUp ? "Sign In" : "Sign Up"}</Text>
            </TouchableOpacity>
          </View>
          
          {!isSignUp && (
            <TouchableOpacity style={styles.forgotPassword}>
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#f8f9fa',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#3a86ff',
  },
  tagline: {
    color: '#6c757d',
    fontSize: 14,
    marginTop: 6,
  },
  formContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#212529',
  },
  input: {
    height: 50,
    borderColor: '#ced4da',
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 16,
    paddingHorizontal: 12,
    fontSize: 16,
    backgroundColor: '#f8f9fa',
  },
  errorText: {
    color: '#dc3545',
    marginBottom: 16,
    textAlign: 'center',
  },
  primaryButton: {
    backgroundColor: '#3a86ff',
    borderRadius: 8,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
    alignItems: 'center',
  },
  switchText: {
    color: '#6c757d',
    marginRight: 5,
  },
  switchButton: {
    color: '#3a86ff',
    fontWeight: 'bold',
  },
  forgotPassword: {
    alignItems: 'center',
    marginTop: 16,
  },
  forgotPasswordText: {
    color: '#3a86ff',
  },
});
import React, { useState, useEffect } from 'react';
import { 
  View, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Text, 
  ScrollView, 
  ActivityIndicator, 
  KeyboardAvoidingView, 
  Platform,
  Animated,
  Dimensions,
  StatusBar,
  Image
} from 'react-native';
import { useAuth } from '../AuthContext';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Web3 theme colors
const COLORS = {
  background: '#2E1A47', // deep indigo
  primary: '#8A2BE2',    // electric purple
  secondary: '#87CEEB',  // sky blue
  text: '#FFFFFF',       // white
  textSecondary: '#B0C4DE', // light slate
  cardBackground: '#3C2157',
  inputBackground: '#251539',
  border: '#4A2963',
  error: '#FF5252',
  success: '#4CAF50'
};

const { width, height } = Dimensions.get('window');

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { signIn, signUp } = useAuth();
  const insets = useSafeAreaInsets();

  // Animation values
  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(50))[0];
  
  useEffect(() => {
    // Start animations when component mounts
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

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
        // Customize error messages for better user experience
        if (error.message.includes('auth/user-not-found') || error.message.includes('auth/wrong-password')) {
          setErrorMessage('Invalid email or password');
        } else if (error.message.includes('auth/email-already-in-use')) {
          setErrorMessage('This email is already registered');
        } else if (error.message.includes('auth/network-request-failed')) {
          setErrorMessage('Network error. Please check your connection');
        } else {
          setErrorMessage(error.message);
        }
      } else {
        setErrorMessage('An unknown error occurred');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const switchMode = () => {
    // Reset fields when switching modes
    setIsSignUp(!isSignUp);
    setErrorMessage('');
    setPassword('');
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
      
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View 
            style={[
              styles.contentContainer, 
              { 
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }] 
              }
            ]}
          >
            <View style={styles.logoContainer}>
              <LinearGradient
                colors={[COLORS.primary, COLORS.secondary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.logoGradient}
              >
                <Feather name="box" size={48} color={COLORS.text} />
              </LinearGradient>
              <Text style={styles.logo}>Etherworks</Text>
              <Text style={styles.tagline}>Your gateway to the digital realm</Text>
            </View>

            <View style={styles.formContainer}>
              <Text style={styles.title}>{isSignUp ? 'Create Account' : 'Welcome Back'}</Text>
              
              <View style={styles.inputContainer}>
                <Feather name="mail" size={20} color={COLORS.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Email"
                  value={email}
                  placeholderTextColor={COLORS.textSecondary}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  autoComplete="email"
                  selectionColor={COLORS.secondary}
                />
              </View>
              
              <View style={styles.inputContainer}>
                <Feather name="lock" size={20} color={COLORS.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Password"
                  value={password}
                  placeholderTextColor={COLORS.textSecondary}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoComplete={isSignUp ? "password-new" : "password"}
                  selectionColor={COLORS.secondary}
                />
                <TouchableOpacity 
                  style={styles.passwordToggle} 
                  onPress={togglePasswordVisibility}
                >
                  <Feather 
                    name={showPassword ? "eye-off" : "eye"} 
                    size={20} 
                    color={COLORS.textSecondary} 
                  />
                </TouchableOpacity>
              </View>

              {errorMessage ? (
                <View style={styles.errorContainer}>
                  <Feather name="alert-circle" size={16} color={COLORS.error} />
                  <Text style={styles.errorText}>{errorMessage}</Text>
                </View>
              ) : null}

              <TouchableOpacity
                style={styles.primaryButton}
                onPress={handleAuth}
                disabled={isLoading}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={[COLORS.primary, '#6F42C1']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.buttonGradient}
                >
                  {isLoading ? (
                    <ActivityIndicator color={COLORS.text} size="small" />
                  ) : (
                    <>
                      <Feather 
                        name={isSignUp ? "user-plus" : "log-in"} 
                        size={18} 
                        color={COLORS.text} 
                        style={styles.buttonIcon} 
                      />
                      <Text style={styles.buttonText}>
                        {isSignUp ? "Create Account" : "Sign In"}
                      </Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
              
              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>or</Text>
                <View style={styles.dividerLine} />
              </View>
              
              <View style={styles.switchContainer}>
                <Text style={styles.switchText}>
                  {isSignUp ? "Already have an account?" : "Don't have an account?"}
                </Text>
                <TouchableOpacity onPress={switchMode}>
                  <Text style={styles.switchButton}>
                    {isSignUp ? "Sign In" : "Sign Up"}
                  </Text>
                </TouchableOpacity>
              </View>
              
              {!isSignUp && (
                <TouchableOpacity style={styles.forgotPassword}>
                  <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                </TouchableOpacity>
              )}
            </View>
            
            {/* Terms and privacy policy */}
            <Text style={styles.termsText}>
              By continuing, you agree to our{' '}
              <Text style={styles.termsLink}>Terms of Service</Text> and{' '}
              <Text style={styles.termsLink}>Privacy Policy</Text>
            </Text>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
      
      {/* Animated background elements */}
      <View style={styles.bgElementsContainer}>
        <View style={[styles.bgElement, styles.bgElement1]} />
        <View style={[styles.bgElement, styles.bgElement2]} />
        <View style={[styles.bgElement, styles.bgElement3]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  contentContainer: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
    paddingVertical: 40,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logoGradient: {
    width: 80,
    height: 80,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  logo: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8,
  },
  tagline: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  formContainer: {
    backgroundColor: COLORS.cardBackground,
    borderRadius:.016 * width,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 10,
    borderWidth: 1,
    borderColor: 'rgba(138, 43, 226, 0.3)',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
    color: COLORS.text,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.inputBackground,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    height: 56,
  },
  inputIcon: {
    paddingHorizontal: 16,
  },
  input: {
    flex: 1,
    height: '100%',
    color: COLORS.text,
    fontSize: 16,
  },
  passwordToggle: {
    padding: 16,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 82, 82, 0.1)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: COLORS.error,
    marginLeft: 8,
    fontSize: 14,
    flex: 1,
  },
  primaryButton: {
    borderRadius: 12,
    height: 56,
    marginTop: 8,
    overflow: 'hidden',
  },
  buttonGradient: {
    flexDirection: 'row',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: 'bold',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(138, 43, 226, 0.3)',
  },
  dividerText: {
    color: COLORS.textSecondary,
    paddingHorizontal: 16,
    fontSize: 14,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  switchText: {
    color: COLORS.textSecondary,
    marginRight: 8,
    fontSize: 14,
  },
  switchButton: {
    color: COLORS.secondary,
    fontWeight: 'bold',
    fontSize: 14,
  },
  forgotPassword: {
    alignItems: 'center',
    marginTop: 16,
  },
  forgotPasswordText: {
    color: COLORS.secondary,
    fontSize: 14,
  },
  termsText: {
    textAlign: 'center',
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 24,
    paddingHorizontal: 16,
  },
  termsLink: {
    color: COLORS.secondary,
  },
  bgElementsContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: -1,
    overflow: 'hidden',
  },
  bgElement: {
    position: 'absolute',
    borderRadius: 100,
    opacity: 0.15,
  },
  bgElement1: {
    width: 300,
    height: 300,
    backgroundColor: COLORS.primary,
    top: -100,
    right: -100,
  },
  bgElement2: {
    width: 200,
    height: 200,
    backgroundColor: COLORS.secondary,
    bottom: 100,
    left: -70,
  },
  bgElement3: {
    width: 250,
    height: 250,
    backgroundColor: COLORS.primary,
    bottom: -100,
    right: -50,
  },
});
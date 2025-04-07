import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  Dimensions
} from 'react-native';
import { useAuth } from '../AuthContext';
import { Ionicons } from '@expo/vector-icons';

const interests = [
  { id: 'dev', name: 'Development', icon: 'code-slash' },
  { id: 'design', name: 'Design', icon: 'color-palette' },
  { id: 'content', name: 'Content Creation', icon: 'create' },
  { id: 'marketing', name: 'Marketing', icon: 'megaphone' },
  { id: 'data', name: 'Data Analysis', icon: 'analytics' },
  { id: 'ai', name: 'AI & ML', icon: 'hardware-chip' },
  { id: 'crypto', name: 'Crypto', icon: 'wallet' }
];

export default function OnboardingScreen({ navigation }: any) {
  const { updateProfile } = useAuth();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [address, setAddress] = useState('');
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  const avatarUrl = useMemo(() => {
    if (firstName.trim() || lastName.trim()) {
      return `https://ui-avatars.com/api/?name=${encodeURIComponent(firstName)}+${encodeURIComponent(lastName)}&background=random&size=200`;
    }
    return 'https://ui-avatars.com/api/?background=random&size=200';
  }, [firstName, lastName]);

  const toggleInterest = (interest: string) => {
    setSelectedInterests(prev => 
      prev.includes(interest) 
        ? prev.filter(i => i !== interest) 
        : [...prev, interest]
    );

    // Clear error when user selects an interest
    if (errors.interests) {
      setErrors(prev => ({ ...prev, interests: '' }));
    }
  };

  const validateField = (field: string, value: string | string[]) => {
    if (field === 'firstName' && !value) {
      return 'First name is required';
    }
    if (field === 'lastName' && !value) {
      return 'Last name is required';
    }
    if (field === 'address') {
      if (!value) return 'Wallet address is required';
      // Enhanced Ethereum address validation
      if (!/^0x[a-fA-F0-9]{40}$/.test(value as string)) {
        return 'Please enter a valid Ethereum address (0x...)';
      }
    }
    if (field === 'interests' && (value as string[]).length === 0) {
      return 'Please select at least one interest';
    }
    return '';
  };

  const validateCurrentStep = () => {
    let isValid = true;
    const newErrors = {...errors};

    if (currentStep === 1) {
      const firstNameError = validateField('firstName', firstName);
      const lastNameError = validateField('lastName', lastName);
      
      if (firstNameError) {
        newErrors.firstName = firstNameError;
        isValid = false;
      } else {
        delete newErrors.firstName;
      }
      
      if (lastNameError) {
        newErrors.lastName = lastNameError;
        isValid = false;
      } else {
        delete newErrors.lastName;
      }
    }
    
    if (currentStep === 2) {
      const addressError = validateField('address', address);
      
      if (addressError) {
        newErrors.address = addressError;
        isValid = false;
      } else {
        delete newErrors.address;
      }
    }
    
    if (currentStep === 3) {
      const interestsError = validateField('interests', selectedInterests);
      
      if (interestsError) {
        newErrors.interests = interestsError;
        isValid = false;
      } else {
        delete newErrors.interests;
      }
    }
    
    setErrors(newErrors);
    return isValid;
  };

  const handleNextStep = () => {
    if (validateCurrentStep()) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrevStep = () => {
    setCurrentStep(prev => Math.max(1, prev - 1));
  };

  const handleComplete = async () => {
    if (!validateCurrentStep()) return;

    setIsLoading(true);
    try {
      await updateProfile({
        firstName,
        lastName,
        address,
        interests: selectedInterests,
        onboardingCompleted: true,
        avatarUrl
      });
      navigation.navigate('Home');
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderProgressBar = () => {
    return (
      <View style={styles.progressContainer}>
        {[1, 2, 3].map((step) => (
          <View key={step} style={styles.progressStepContainer}>
            <View 
              style={[
                styles.progressStep,
                currentStep >= step ? styles.progressStepActive : {}
              ]}
            >
              {currentStep > step ? (
                <Ionicons name="checkmark" size={16} color="#FFFFFF" />
              ) : (
                <Text style={currentStep >= step ? styles.progressStepTextActive : styles.progressStepText}>
                  {step}
                </Text>
              )}
            </View>
            {step < 3 && (
              <View style={[
                styles.progressLine,
                currentStep > step ? styles.progressLineActive : {}
              ]} />
            )}
          </View>
        ))}
      </View>
    );
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <>
            <View style={styles.stepHeader}>
              <Text style={styles.stepTitle}>Personal Information</Text>
              <Text style={styles.stepDescription}>Tell us who you are</Text>
            </View>
            
            <View style={styles.avatarContainer}>
              <Image 
                source={{ uri: avatarUrl }}
                style={styles.avatar}
              />
              <Text style={styles.avatarHint}>Profile preview</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>First Name</Text>
              <TextInput
                style={[styles.input, errors.firstName ? styles.inputError : null]}
                placeholder="John"
                value={firstName}
                placeholderTextColor="gray"
                onChangeText={(text) => {
                  setFirstName(text);
                  if (errors.firstName) setErrors({...errors, firstName: ''});
                }}
                autoCapitalize="words"
                returnKeyType="next"
              />
              {errors.firstName ? <Text style={styles.errorText}>{errors.firstName}</Text> : null}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Last Name</Text>
              <TextInput
                style={[styles.input, errors.lastName ? styles.inputError : null]}
                placeholder="Doe"
                value={lastName}
                placeholderTextColor="gray"
                onChangeText={(text) => {
                  setLastName(text);
                  if (errors.lastName) setErrors({...errors, lastName: ''});
                }}
                autoCapitalize="words"
                returnKeyType="done"
              />
              {errors.lastName ? <Text style={styles.errorText}>{errors.lastName}</Text> : null}
            </View>
          </>
        );
      
      case 2:
        return (
          <>
            <View style={styles.stepHeader}>
              <Text style={styles.stepTitle}>Connect Your Wallet</Text>
              <Text style={styles.stepDescription}>Enter your Ethereum wallet address</Text>
            </View>
            
            <View style={styles.walletIconContainer}>
              <Ionicons name="wallet-outline" size={64} color="#007AFF" />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Wallet Address</Text>
              <View style={styles.addressInputContainer}>
                <TextInput
                  style={[
                    styles.input, 
                    styles.addressInput,
                    errors.address ? styles.inputError : null
                  ]}
                  placeholder="0x..."
                  value={address}
                  placeholderTextColor="gray"
                  onChangeText={(text) => {
                    setAddress(text);
                    if (errors.address) setErrors({...errors, address: ''});
                  }}
                  autoCapitalize="none"
                  returnKeyType="done"
                />
                <TouchableOpacity style={styles.pasteButton} onPress={() => Alert.alert('Info', 'Paste functionality would be implemented here')}>
                  <Ionicons name="clipboard-outline" size={20} color="#007AFF" />
                </TouchableOpacity>
              </View>
              {errors.address ? <Text style={styles.errorText}>{errors.address}</Text> : null}
              
              <Text style={styles.addressHint}>
                This address will be used for transactions on the Etherworks platform
              </Text>
            </View>
          </>
        );
      
      case 3:
        return (
          <>
            <View style={styles.stepHeader}>
              <Text style={styles.stepTitle}>Your Interests</Text>
              <Text style={styles.stepDescription}>
                Select topics that interest you to personalize your experience
              </Text>
            </View>

            <View style={styles.interestsContainer}>
              {errors.interests ? <Text style={styles.errorText}>{errors.interests}</Text> : null}
              
              <View style={styles.interestGrid}>
                {interests.map(interest => (
                  <TouchableOpacity
                    key={interest.id}
                    style={[
                      styles.interestButton,
                      selectedInterests.includes(interest.name) && styles.selectedInterest
                    ]}
                    onPress={() => toggleInterest(interest.name)}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={interest.icon}
                      size={24}
                      color={selectedInterests.includes(interest.name) ? '#FFFFFF' : '#666666'}
                    />
                    <Text
                      style={[
                        styles.interestText,
                        selectedInterests.includes(interest.name) && styles.selectedInterestText
                      ]}
                    >
                      {interest.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              
              <Text style={styles.interestsHint}>
                You can always change these later in your profile settings
              </Text>
            </View>
          </>
        );
      default:
        return null;
    }
  };

  const renderNavButtons = () => {
    const isLastStep = currentStep === 3;
    
    return (
      <View style={styles.navButtonsContainer}>
        {currentStep > 1 && (
          <TouchableOpacity
            style={styles.backButton}
            onPress={handlePrevStep}
            disabled={isLoading}
          >
            <Ionicons name="arrow-back" size={20} color="#007AFF" />
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity
          style={[
            styles.nextButton,
            isLastStep ? styles.completeButton : {},
            currentStep === 1 && styles.fullWidthButton
          ]}
          onPress={isLastStep ? handleComplete : handleNextStep}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Text style={styles.nextButtonText}>
                {isLastStep ? 'Complete Profile' : 'Continue'}
              </Text>
              {!isLastStep && <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />}
            </>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Etherworks</Text>
          {renderProgressBar()}
        </View>
        
        <ScrollView 
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {renderStepContent()}
        </ScrollView>
        
        {renderNavButtons()}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  keyboardAvoid: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 20,
    textAlign: 'center',
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  progressStepContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  progressStep: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  progressStepActive: {
    backgroundColor: '#007AFF',
  },
  progressStepText: {
    color: '#666666',
    fontWeight: '500',
  },
  progressStepTextActive: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  progressLine: {
    flex: 1,
    height: 3,
    backgroundColor: '#F0F0F0',
    marginHorizontal: 5,
  },
  progressLineActive: {
    backgroundColor: '#007AFF',
  },
  container: {
    flexGrow: 1,
    padding: 20,
  },
  stepHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 8,
  },
  stepDescription: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
  },
  avatarContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: '#007AFF',
  },
  avatarHint: {
    marginTop: 8,
    fontSize: 14,
    color: '#666666',
  },
  walletIconContainer: {
    alignItems: 'center',
    marginVertical: 20,
    backgroundColor: '#F0F8FF',
    padding: 20,
    borderRadius: 60,
    alignSelf: 'center',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333333',
  },
  input: {
    height: 50,
    borderColor: '#DDDDDD',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    backgroundColor: '#F9F9F9',
  },
  addressInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addressInput: {
    flex: 1,
  },
  pasteButton: {
    position: 'absolute',
    right: 10,
    padding: 5,
  },
  addressHint: {
    marginTop: 8,
    fontSize: 14,
    color: '#666666',
    fontStyle: 'italic',
  },
  inputError: {
    borderColor: '#FF3B30',
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 12,
    marginTop: 4,
  },
  interestsContainer: {
    marginVertical: 16,
  },
  interestGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
    justifyContent: 'center',
  },
  interestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 25,
    margin: 6,
    minWidth: width / 2 - 40,
    justifyContent: 'center',
  },
  selectedInterest: {
    backgroundColor: '#007AFF',
  },
  interestText: {
    fontSize: 14,
    marginLeft: 8,
    color: '#666666',
  },
  selectedInterestText: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  interestsHint: {
    marginTop: 16,
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  navButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
  },
  backButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 5,
  },
  nextButton: {
    backgroundColor: '#007AFF',
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    flexDirection: 'row',
    flex: 1,
    marginLeft: 10,
  },
  fullWidthButton: {
    marginLeft: 0,
  },
  completeButton: {
    backgroundColor: '#34C759',
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 5,
  }
});
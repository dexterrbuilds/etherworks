import React, { useState, useEffect } from 'react';
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
  SafeAreaView
} from 'react-native';
import { useAuth } from '../AuthContext';
import { Ionicons } from '@expo/vector-icons'; // Assuming you're using Expo

const interests = [
  { id: 'dev', name: 'Development', icon: 'code-slash' },
  { id: 'design', name: 'Design', icon: 'color-palette' },
  { id: 'content', name: 'Content Creation', icon: 'create' },
  { id: 'marketing', name: 'Marketing', icon: 'megaphone' },
  { id: 'data', name: 'Data Analysis', icon: 'analytics' }
];

export default function OnboardingScreen({ navigation }: any) {
  const { updateProfile } = useAuth();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [address, setAddress] = useState('');
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [avatarUrl, setAvatarUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  useEffect(() => {
    // Update avatar URL when names change
    if (firstName.trim() || lastName.trim()) {
      setAvatarUrl(`https://ui-avatars.com/api/?name=${firstName}+${lastName}&background=random&size=200`);
    }
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
      return 'Please enter your first name';
    }
    if (field === 'lastName' && !value) {
      return 'Please enter your last name';
    }
    if (field === 'address') {
      if (!value) return 'Please enter your wallet address';
      // Simple Ethereum address validation (should be 42 chars including 0x prefix)
      if (!/^0x[a-fA-F0-9]{40}$/.test(value as string)) {
        return 'Please enter a valid wallet address (0x...)';
      }
    }
    if (field === 'interests' && (value as string[]).length === 0) {
      return 'Please select at least one interest';
    }
    return '';
  };

  const validateForm = () => {
    const newErrors = {
      firstName: validateField('firstName', firstName),
      lastName: validateField('lastName', lastName),
      address: validateField('address', address),
      interests: validateField('interests', selectedInterests)
    };

    setErrors(newErrors);
    return !Object.values(newErrors).some(error => error);
  };

  const handleComplete = async () => {
    if (!validateForm()) return;

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
      navigation.replace('Home');
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
      >
        <ScrollView 
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={styles.title}>Complete Your Profile</Text>
            <Text style={styles.subtitle}>Tell us a bit about yourself</Text>
          </View>

          <View style={styles.avatarContainer}>
            <Image 
              source={{ uri: avatarUrl || 'https://ui-avatars.com/api/?background=random&size=200' }}
              style={styles.avatar}
            />
          </View>

          <View style={styles.formContainer}>
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
              />
              {errors.lastName ? <Text style={styles.errorText}>{errors.lastName}</Text> : null}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Wallet Address</Text>
              <TextInput
                style={[styles.input, errors.address ? styles.inputError : null]}
                placeholder="0x..."
                value={address}
                placeholderTextColor="gray"
                onChangeText={(text) => {
                  setAddress(text);
                  if (errors.address) setErrors({...errors, address: ''});
                }}
                autoCapitalize="none"
              />
              {errors.address ? <Text style={styles.errorText}>{errors.address}</Text> : null}
            </View>

            <View style={styles.interestsContainer}>
              <Text style={styles.label}>Select Your Interests</Text>
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
            </View>

            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleComplete}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.submitButtonText}>Complete Profile</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  keyboardAvoid: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
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
  formContainer: {
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 16,
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
    marginHorizontal: -5,
  },
  interestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 25,
    margin: 5,
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
  submitButton: {
    backgroundColor: '#007AFF',
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
});
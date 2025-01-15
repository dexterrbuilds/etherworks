import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, ScrollView, Image, Alert } from 'react-native';
import { useAuth } from '../AuthContext';

const interests = ['Development', 'Design', 'Content Creation', 'Marketing', 'Data Analysis'];

export default function OnboardingScreen({ navigation }: any) {
  const { updateProfile } = useAuth();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [address, setAddress] = useState('');
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);

  const toggleInterest = (interest: string) => {
    setSelectedInterests(prev => 
      prev.includes(interest) 
        ? prev.filter(i => i !== interest) 
        : [...prev, interest]
    );
  };

  const validateForm = () => {
    if (!firstName.trim()) {
      Alert.alert('Error', 'Please enter your first name');
      return false;
    }
    if (!lastName.trim()) {
      Alert.alert('Error', 'Please enter your last name');
      return false;
    }
    if (!address.trim()) {
      Alert.alert('Error', 'Please enter your wallet address');
      return false;
    }
    if (selectedInterests.length === 0) {
      Alert.alert('Error', 'Please select at least one interest');
      return false;
    }
    return true;
  };

  const handleComplete = async () => {
    if (!validateForm()) return;

    try {
      await updateProfile({
        firstName,
        lastName,
        address,
        interests: selectedInterests,
        onboardingCompleted: true,
        avatarUrl: `https://ui-avatars.com/api/?name=${firstName}+${lastName}&background=random`
      });
      navigation.replace('Home');
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Complete Your Profile</Text>
      <TextInput
        style={styles.input}
        placeholder="First Name"
        value={firstName}
        placeholderTextColor={"grey"}
        onChangeText={setFirstName}
      />
      <TextInput
        style={styles.input}
        placeholder="Last Name"
        value={lastName}
        placeholderTextColor={"grey"}
        onChangeText={setLastName}
      />
      <TextInput
        style={styles.input}
        placeholder="Wallet Address for Payouts"
        value={address}
        placeholderTextColor={"grey"}
        onChangeText={setAddress}
      />
      <Text style={styles.subtitle}>Select Your Interests:</Text>
      {interests.map(interest => (
        <Button
          key={interest}
          title={interest}
          onPress={() => toggleInterest(interest)}
          color={selectedInterests.includes(interest) ? '#007AFF' : '#A9A9A9'}
        />
      ))}
      <Image 
        source={{ uri: `https://ui-avatars.com/api/?name=${firstName}+${lastName}&background=random` }}
        style={styles.avatar}
      />
      <Button title="Complete Profile" onPress={handleComplete} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 12,
    paddingLeft: 8,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignSelf: 'center',
    marginTop: 16,
    marginBottom: 16,
  },
});


import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Image, 
  TouchableOpacity, 
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  Alert
} from 'react-native';
import { useAuth } from '../AuthContext';
import { Ionicons } from '@expo/vector-icons';

interface Profile {
  firstName?: string;
  lastName?: string;
  email?: string;
  address?: string;
  avatarUrl?: string;
  interests: string[];
}

export default function ProfileScreen() {
  const { profile, signOut, updateProfile } = useAuth() as { 
    profile: Profile; 
    signOut: () => void;
    updateProfile?: (updates: Partial<Profile>) => Promise<void>;
  };
  
  const [isLoading, setIsLoading] = useState(false);
  
  // Handle sign out with confirmation
  const handleSignOut = () => {
    Alert.alert(
      "Log Out",
      "Are you sure you want to log out?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Log Out", 
          style: "destructive",
          onPress: () => {
            setIsLoading(true);
            // Simulate network delay for sign out process
            setTimeout(() => {
              signOut();
              setIsLoading(false);
            }, 500);
          }
        }
      ]
    );
  };

  // Format wallet address for display
  const formatWalletAddress = (address?: string) => {
    if (!address) return "No wallet connected";
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  // Navigate to edit profile screen
  const handleEditProfile = () => {
    // This would navigate to an edit profile screen
    Alert.alert("Edit Profile", "This would open the edit profile screen");
  };

  // Handle errors for avatar loading
  const handleAvatarError = () => {
    console.log("Failed to load avatar image");
  };

  if (!profile) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#001b2a" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        <View style={styles.header}>
          <View style={styles.headerTopRow}>
            <TouchableOpacity 
              style={styles.editButton} 
              onPress={handleEditProfile}
            >
              <Ionicons name="pencil" size={18} color="#fff" />
              <Text style={styles.editButtonText}>Edit</Text>
            </TouchableOpacity>
          </View>
          
          <Image
            source={{ 
              uri: profile.avatarUrl || 'https://via.placeholder.com/100' 
            }}
            style={styles.avatar}
            onError={handleAvatarError}
          />
          
          <Text style={styles.name}>
            {profile.firstName || ''} {profile.lastName || ''}
          </Text>
          
          <Text style={styles.email}>{profile.email || 'No email provided'}</Text>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Wallet Address</Text>
            <TouchableOpacity>
              <Ionicons name="copy-outline" size={20} color="#001b2a" />
            </TouchableOpacity>
          </View>
          <Text style={styles.sectionContent}>
            {formatWalletAddress(profile.address)}
          </Text>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Interests</Text>
            {profile.interests?.length > 0 && (
              <TouchableOpacity>
                <Ionicons name="add-circle-outline" size={20} color="#001b2a" />
              </TouchableOpacity>
            )}
          </View>
          
          {profile.interests?.length > 0 ? (
            <View style={styles.interestsContainer}>
              {profile.interests.map((interest: string, index: number) => (
                <View key={index} style={styles.interestTag}>
                  <Text style={styles.interestText}>{interest}</Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.emptyStateText}>No interests added yet</Text>
          )}
        </View>

        <TouchableOpacity 
          style={styles.logoutButton} 
          onPress={handleSignOut}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Ionicons name="log-out-outline" size={24} color="#fff" />
              <Text style={styles.logoutText}>Log Out</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#8caba9',
  },
  container: {
    flex: 1,
    backgroundColor: '#8caba9',
  },
  contentContainer: {
    paddingBottom: 30,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#8caba9',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#001b2a',
  },
  header: {
    alignItems: 'center',
    padding: 20,
  },
  headerTopRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 10,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#001b2a',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  editButtonText: {
    color: '#fff',
    marginLeft: 5,
    fontWeight: '500',
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: '#fff',
    marginVertical: 16,
    backgroundColor: '#ccc',
  },
  name: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#001b2a',
  },
  email: {
    fontSize: 16,
    color: '#333',
  },
  section: {
    backgroundColor: '#fff',
    padding: 20,
    marginTop: 20,
    marginHorizontal: '5%',
    borderRadius: 12,
    width: '90%',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#001b2a',
  },
  sectionContent: {
    fontSize: 16,
    color: '#555',
  },
  interestsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  interestTag: {
    backgroundColor: '#001b2a',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    margin: 5,
  },
  interestText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  emptyStateText: {
    color: '#888',
    fontStyle: 'italic',
    textAlign: 'center',
    marginVertical: 10,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#780000',
    padding: 16,
    margin: 20,
    borderRadius: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  logoutText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  },
});
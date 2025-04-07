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
  Alert,
  Animated,
  Clipboard
} from 'react-native';
import { useAuth } from '../AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

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
  const [copyAnimation] = useState(new Animated.Value(0));
  const [copiedAddress, setCopiedAddress] = useState(false);
  
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

  // Copy wallet address
  const copyWalletAddress = () => {
    if (profile.address) {
      Clipboard.setString(profile.address);
      setCopiedAddress(true);
      
      // Trigger animation
      Animated.sequence([
        Animated.timing(copyAnimation, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true
        }),
        Animated.delay(1500),
        Animated.timing(copyAnimation, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true
        })
      ]).start(() => setCopiedAddress(false));
    }
  };

  if (!profile) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <LinearGradient
          colors={['#2E1A47', '#3A1A5F']}
          style={StyleSheet.absoluteFill}
        />
        <ActivityIndicator size="large" color="#8A2BE2" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient
        colors={['#2E1A47', '#3A1A5F']}
        style={StyleSheet.absoluteFill}
      />
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        <LinearGradient 
          colors={['#3A1A5F', '#2E1A47']} 
          style={styles.headerGradient}
        >
          <View style={styles.header}>
            <View style={styles.headerTopRow}>
              <TouchableOpacity 
                style={styles.editButton} 
                onPress={handleEditProfile}
              >
                <Ionicons name="pencil-outline" size={18} color="#FFFFFF" />
                <Text style={styles.editButtonText}>Edit</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.avatarContainer}>
              <Image
                source={{ 
                  uri: profile.avatarUrl || 'https://via.placeholder.com/100' 
                }}
                style={styles.avatar}
                onError={handleAvatarError}
              />
              <LinearGradient
                colors={['#8A2BE2', '#5A55DE']}
                style={styles.avatarRing}
              />
            </View>
            
            <Text style={styles.name}>
              {profile.firstName || ''} {profile.lastName || ''}
            </Text>
            
            <Text style={styles.email}>{profile.email || 'No email provided'}</Text>
          </View>
        </LinearGradient>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Wallet Address</Text>
            <TouchableOpacity onPress={copyWalletAddress} style={styles.copyButton}>
              <Ionicons 
                name={copiedAddress ? "checkmark-outline" : "copy-outline"} 
                size={20} 
                color={copiedAddress ? "#87CEEB" : "#FFFFFF"} 
              />
              <Animated.View 
                style={{
                  opacity: copyAnimation,
                  transform: [{ 
                    translateY: copyAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, -20]
                    })
                  }]
                }}
              >
                <Text style={styles.copiedText}>Copied!</Text>
              </Animated.View>
            </TouchableOpacity>
          </View>
          <Text style={styles.walletAddress}>
            {formatWalletAddress(profile.address)}
          </Text>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Interests</Text>
            {profile.interests?.length > 0 && (
              <TouchableOpacity>
                <Ionicons name="add-circle-outline" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            )}
          </View>
          
          {profile.interests?.length > 0 ? (
            <View style={styles.interestsContainer}>
              {profile.interests.map((interest: string, index: number) => (
                <LinearGradient
                  key={index}
                  colors={['#8A2BE2', '#6A1FD0']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.interestTag}
                >
                  <Text style={styles.interestText}>{interest}</Text>
                </LinearGradient>
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
          <LinearGradient
            colors={['#8A2BE2', '#6515A3']}
            style={[StyleSheet.absoluteFill, { borderRadius: 12 }]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
          {isLoading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="log-out-outline" size={24} color="#FFFFFF" />
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
    backgroundColor: '#2E1A47',
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 30,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#B0C4DE',
  },
  headerGradient: {
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    overflow: 'hidden',
  },
  header: {
    alignItems: 'center',
    padding: 20,
    paddingBottom: 30,
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
    backgroundColor: 'rgba(138, 43, 226, 0.4)',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#8A2BE2',
  },
  editButtonText: {
    color: '#FFFFFF',
    marginLeft: 5,
    fontWeight: '600',
  },
  avatarContainer: {
    marginVertical: 16,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    width: 130,
    height: 130,
  },
  avatarRing: {
    position: 'absolute',
    width: 130,
    height: 130,
    borderRadius: 65,
    opacity: 0.8,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    backgroundColor: '#2E1A47',
    zIndex: 1,
  },
  name: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#FFFFFF',
    textShadowColor: 'rgba(138, 43, 226, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 5,
  },
  email: {
    fontSize: 16,
    color: '#B0C4DE',
  },
  section: {
    backgroundColor: 'rgba(46, 26, 71, 0.7)',
    padding: 20,
    marginTop: 20,
    marginHorizontal: '5%',
    borderRadius: 16,
    width: '90%',
    borderWidth: 1,
    borderColor: 'rgba(138, 43, 226, 0.3)',
    shadowColor: '#8A2BE2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#87CEEB',
  },
  walletAddress: {
    fontSize: 16,
    color: '#FFFFFF',
    fontFamily: 'monospace',
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  copiedText: {
    color: '#87CEEB',
    fontSize: 12,
    position: 'absolute',
    right: 0,
    top: -20,
  },
  interestsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  interestTag: {
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    margin: 5,
  },
  interestText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  emptyStateText: {
    color: '#B0C4DE',
    fontStyle: 'italic',
    textAlign: 'center',
    marginVertical: 10,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    margin: 20,
    borderRadius: 12,
    shadowColor: '#8A2BE2',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 5,
    overflow: 'hidden'
  },
  logoutText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  },
});
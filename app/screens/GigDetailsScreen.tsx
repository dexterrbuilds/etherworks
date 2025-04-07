import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Alert,
  Pressable
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute } from '@react-navigation/native';
import { db } from '../../firebaseConfig';
import { doc, getDoc, updateDoc, collection, addDoc, Timestamp } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as DocumentPicker from 'expo-document-picker';

// Web3 theme colors
const COLORS = {
  background: '#2E1A47',
  primary: '#8A2BE2',
  secondary: '#87CEEB',
  primaryLight: '#9D4EDD',
  accent: '#6F42C1',
  text: '#FFFFFF',
  textSecondary: '#B0C4DE',
  cardBackground: '#3C2157',
  inputBackground: '#251539',
  border: '#4A2963',
  error: '#FF5252',
  success: '#4CAF50',
  warning: '#FFC107',
  overlay: 'rgba(20, 10, 30, 0.85)'
};

export default function GigDetailsScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { gigId } = route.params;
  const insets = useSafeAreaInsets();
  
  // State
  const [gig, setGig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showThankYouModal, setShowThankYouModal] = useState(false);
  
  // Submission form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [availableDate, setAvailableDate] = useState('');
  const [errors, setErrors] = useState({});
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(100)).current;
  
  // Load gig data and check if it's a favorite
  useEffect(() => {
    const fetchGigDetails = async () => {
      setLoading(true);
      try {
        // Get gig from Firestore
        const gigDoc = await getDoc(doc(db, 'gigs', gigId));
        
        if (gigDoc.exists()) {
          setGig({ id: gigDoc.id, ...gigDoc.data() });
          
          // Check if this gig is in favorites
          const storedFavorites = await AsyncStorage.getItem('favoriteGigs');
          if (storedFavorites) {
            const favorites = JSON.parse(storedFavorites);
            setIsFavorite(favorites[gigId] === true);
          }
          
          // Start animations after data is loaded
          Animated.parallel([
            Animated.timing(fadeAnim, {
              toValue: 1,
              duration: 500,
              useNativeDriver: true
            }),
            Animated.timing(slideAnim, {
              toValue: 0,
              duration: 500,
              useNativeDriver: true
            })
          ]).start();
        } else {
          setError('Gig not found');
        }
      } catch (err) {
        console.error('Error fetching gig details:', err);
        setError('Failed to load gig details');
      } finally {
        setLoading(false);
      }
    };
    
    fetchGigDetails();
  }, [gigId, fadeAnim, slideAnim]);
  
  // Toggle favorite status
  const toggleFavorite = async () => {
    try {
      const storedFavorites = await AsyncStorage.getItem('favoriteGigs');
      const favorites = storedFavorites ? JSON.parse(storedFavorites) : {};
      
      const updatedFavorites = { ...favorites };
      
      if (isFavorite) {
        delete updatedFavorites[gigId];
      } else {
        updatedFavorites[gigId] = true;
      }
      
      await AsyncStorage.setItem('favoriteGigs', JSON.stringify(updatedFavorites));
      setIsFavorite(!isFavorite);
    } catch (error) {
      console.error('Error updating favorites:', error);
    }
  };
  
  // Pick document for attachment
  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        copyToCacheDirectory: true
      });
      
      if (result.type === 'success') {
        // Limit to 3 attachments
        if (attachments.length >= 3) {
          Alert.alert("Limit Reached", "You can only attach up to 3 files");
          return;
        }
        
        setAttachments([...attachments, {
          name: result.name,
          uri: result.uri,
          type: result.mimeType,
          size: result.size
        }]);
      }
    } catch (err) {
      console.error('Error picking document:', err);
    }
  };
  
  // Remove attachment
  const removeAttachment = (index) => {
    const newAttachments = [...attachments];
    newAttachments.splice(index, 1);
    setAttachments(newAttachments);
  };
  
  // Validate form
  const validateForm = () => {
    const newErrors = {};
    
    if (!name.trim()) newErrors.name = 'Name is required';
    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^\S+@\S+\.\S+$/.test(email)) {
      newErrors.email = 'Invalid email format';
    }
    
    if (!message.trim()) newErrors.message = 'Message is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Submit application
  const submitApplication = async () => {
    if (!validateForm()) return;
    
    setSubmitting(true);
    try {
      // Create application document in Firestore
      await addDoc(collection(db, 'applications'), {
        gigId,
        gigTitle: gig.title,
        applicantName: name,
        applicantEmail: email,
        applicantPhone: phone,
        message,
        availableDate,
        hasAttachments: attachments.length > 0,
        attachmentCount: attachments.length,
        attachmentNames: attachments.map(a => a.name),
        status: 'Pending',
        submittedAt: Timestamp.now(),
      });
      
      // Update gig status if needed
      if (gig.status === 'Open') {
        await updateDoc(doc(db, 'gigs', gigId), {
          status: 'In Review'
        });
      }
      
      // Reset form
      setName('');
      setEmail('');
      setPhone('');
      setMessage('');
      setAvailableDate('');
      setAttachments([]);
      
      // Close submit modal and show thank you modal
      setShowSubmitModal(false);
      setShowThankYouModal(true);
      
      // Auto close thank you modal after 3 seconds
      setTimeout(() => {
        setShowThankYouModal(false);
      }, 3000);
      
    } catch (error) {
      console.error('Error submitting application:', error);
      Alert.alert(
        "Submission Failed",
        "There was an error submitting your application. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };
  
  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading gig details...</Text>
        </View>
      </View>
    );
  }
  
  if (error || !gig) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.errorContainer}>
          <Feather name="alert-circle" size={48} color={COLORS.error} />
          <Text style={styles.errorText}>{error || 'Failed to load gig'}</Text>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }
  
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Header with image */}
        <View style={styles.header}>
          {gig.imageBase64 ? (
            <Image 
              source={{ uri: gig.imageBase64 }} 
              style={styles.headerImage} 
              resizeMode="cover"
            />
          ) : (
            <LinearGradient
              colors={[COLORS.primary, COLORS.background]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.headerGradient}
            >
              <Feather name="briefcase" size={48} color="rgba(255,255,255,0.2)" />
            </LinearGradient>
          )}
          
          <LinearGradient
            colors={['transparent', COLORS.background]}
            style={styles.headerGradientOverlay}
          />
          
          <View style={styles.headerControls}>
            <TouchableOpacity 
              style={styles.backIconButton}
              onPress={() => navigation.goBack()}
            >
              <Feather name="arrow-left" size={24} color={COLORS.text} />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.favoriteIconButton, isFavorite && styles.favoriteIconButtonActive]}
              onPress={toggleFavorite}
            >
              <Feather 
                name={isFavorite ? "heart" : "heart"} 
                size={24} 
                color={isFavorite ? COLORS.text : "rgba(255,255,255,0.7)"} 
              />
            </TouchableOpacity>
          </View>
        </View>
        
        <Animated.View 
          style={[
            styles.contentContainer, 
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
          ]}
        >
          {/* Title Section */}
          <View style={styles.titleSection}>
            <View style={styles.titleRow}>
              <Text style={styles.gigTitle}>{gig.title}</Text>
              
              <View style={styles.payoutContainer}>
                <Text style={styles.payoutLabel}>Reward</Text>
                <Text style={styles.payoutAmount}>${gig.payout}</Text>
              </View>
            </View>
            
            <View style={styles.projectRow}>
              <Feather name="briefcase" size={16} color={COLORS.textSecondary} />
              <Text style={styles.projectName}>{gig.projectName || "Unnamed Project"}</Text>
            </View>
            
            <View style={styles.statusRow}>
              <View style={styles.badgeContainer}>
                <View style={[styles.statusBadge, styles[`status_${gig.status.toLowerCase().replace(' ', '_')}`]]}>
                  <View style={styles.statusDot} />
                  <Text style={styles.statusText}>{gig.status}</Text>
                </View>
                
                {gig.location && (
                  <View style={styles.locationBadge}>
                    <Feather name="map-pin" size={12} color={COLORS.textSecondary} />
                    <Text style={styles.locationText}>{gig.location}</Text>
                  </View>
                )}
                
                {gig.duration && (
                  <View style={styles.durationBadge}>
                    <Feather name="clock" size={12} color={COLORS.textSecondary} />
                    <Text style={styles.durationText}>{gig.duration}</Text>
                  </View>
                )}
              </View>
            </View>
          </View>
          
          {/* Description Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.descriptionText}>{gig.description}</Text>
          </View>
          
          {/* Skills Section */}
          {gig.skills && gig.skills.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Required Skills</Text>
              <View style={styles.skillsContainer}>
                {gig.skills.map((skill, index) => (
                  <View key={index} style={styles.skillBadge}>
                    <Text style={styles.skillText}>{skill}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
          
          {/* Details Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Gig Details</Text>
            
            <View style={styles.detailsRow}>
              <View style={styles.detailItem}>
                <Feather name="calendar" size={18} color={COLORS.secondary} />
                <View style={styles.detailTextContainer}>
                  <Text style={styles.detailLabel}>Posted</Text>
                  <Text style={styles.detailValue}>
                    {gig.createdAt ? new Date(gig.createdAt).toLocaleDateString() : 'Unknown'}
                  </Text>
                </View>
              </View>
              
              <View style={styles.detailItem}>
                <Feather name="dollar-sign" size={18} color={COLORS.secondary} />
                <View style={styles.detailTextContainer}>
                  <Text style={styles.detailLabel}>Payout</Text>
                  <Text style={styles.detailValue}>${gig.payout}</Text>
                </View>
              </View>
            </View>
            
            <View style={styles.detailsRow}>
              <View style={styles.detailItem}>
                <Feather name="clock" size={18} color={COLORS.secondary} />
                <View style={styles.detailTextContainer}>
                  <Text style={styles.detailLabel}>Estimated Time</Text>
                  <Text style={styles.detailValue}>{gig.duration || 'Not specified'}</Text>
                </View>
              </View>
              
              <View style={styles.detailItem}>
                <Feather name="map-pin" size={18} color={COLORS.secondary} />
                <View style={styles.detailTextContainer}>
                  <Text style={styles.detailLabel}>Location</Text>
                  <Text style={styles.detailValue}>{gig.location || 'Remote'}</Text>
                </View>
              </View>
            </View>
          </View>
          
          {/* Apply button (only if status is Open) */}
          {gig.status === 'Open' && (
            <TouchableOpacity 
              style={styles.applyButton}
              onPress={() => setShowSubmitModal(true)}
            >
              <Feather name="send" size={20} color={COLORS.text} style={styles.applyButtonIcon} />
              <Text style={styles.applyButtonText}>Submit Application</Text>
            </TouchableOpacity>
          )}
          
          {/* Status message if not Open */}
          {gig.status !== 'Open' && (
            <View style={styles.statusMessageContainer}>
              <Feather 
                name={gig.status === 'Completed' ? "check-circle" : "clock"} 
                size={24} 
                color={gig.status === 'Completed' ? COLORS.success : COLORS.warning} 
              />
              <Text style={styles.statusMessage}>
                {gig.status === 'Completed' 
                  ? "This gig has been completed" 
                  : "This gig is currently under review"}
              </Text>
            </View>
          )}
        </Animated.View>
      </ScrollView>
      
      {/* Submission Modal */}
      <Modal
        visible={showSubmitModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowSubmitModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalContainer}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Submit Application</Text>
              <TouchableOpacity onPress={() => setShowSubmitModal(false)}>
                <Feather name="x" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalBody}>
              <Text style={styles.gigReference}>
                For: <Text style={styles.gigReferenceTitle}>{gig.title}</Text>
              </Text>
              
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Your Name *</Text>
                <TextInput
                  style={[styles.formInput, errors.name && styles.inputError]}
                  placeholder="Enter your full name"
                  placeholderTextColor="rgba(176, 196, 222, 0.5)"
                  value={name}
                  onChangeText={setName}
                />
                {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
              </View>
              
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Email Address *</Text>
                <TextInput
                  style={[styles.formInput, errors.email && styles.inputError]}
                  placeholder="your@email.com"
                  placeholderTextColor="rgba(176, 196, 222, 0.5)"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
              </View>
              
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Phone Number (Optional)</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="Your phone number"
                  placeholderTextColor="rgba(176, 196, 222, 0.5)"
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                />
              </View>
              
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>When can you start? (Optional)</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="e.g., Immediately, Next week"
                  placeholderTextColor="rgba(176, 196, 222, 0.5)"
                  value={availableDate}
                  onChangeText={setAvailableDate}
                />
              </View>
              
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Cover Message *</Text>
                <TextInput
                  style={[styles.formTextarea, errors.message && styles.inputError]}
                  placeholder="Introduce yourself and explain why you're a good fit for this gig"
                  placeholderTextColor="rgba(176, 196, 222, 0.5)"
                  value={message}
                  onChangeText={setMessage}
                  multiline
                  numberOfLines={5}
                  textAlignVertical="top"
                />
                {errors.message && <Text style={styles.errorText}>{errors.message}</Text>}
              </View>
              
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Attachments (Optional)</Text>
                <Text style={styles.attachmentHelper}>
                  Attach your resume or portfolio (max 3 files)
                </Text>
                
                <TouchableOpacity 
                  style={styles.attachmentButton}
                  onPress={pickDocument}
                >
                  <Feather name="paperclip" size={20} color={COLORS.primary} />
                  <Text style={styles.attachmentButtonText}>Add Attachment</Text>
                </TouchableOpacity>
                
                {attachments.length > 0 && (
                  <View style={styles.attachmentsList}>
                    {attachments.map((attachment, index) => (
                      <View key={index} style={styles.attachmentItem}>
                        <View style={styles.attachmentItemLeft}>
                          <Feather name="file" size={16} color={COLORS.textSecondary} />
                          <Text style={styles.attachmentName} numberOfLines={1} ellipsizeMode="middle">
                            {attachment.name}
                          </Text>
                        </View>
                        <TouchableOpacity onPress={() => removeAttachment(index)}>
                          <Feather name="x" size={18} color={COLORS.textSecondary} />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            </ScrollView>
            
            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => setShowSubmitModal(false)}
                disabled={submitting}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.submitButton}
                onPress={submitApplication}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color={COLORS.text} />
                ) : (
                  <Text style={styles.submitButtonText}>Submit Application</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
      
      {/* Thank You Modal */}
      <Modal
        visible={showThankYouModal}
        transparent
        animationType="fade"
      >
        <View style={styles.thankYouModalContainer}>
          <View style={styles.thankYouModalContent}>
            <View style={styles.thankYouIconContainer}>
              <Feather name="check-circle" size={48} color={COLORS.success} />
            </View>
            <Text style={styles.thankYouTitle}>Application Submitted!</Text>
            <Text style={styles.thankYouText}>
              Your application has been submitted successfully. We'll review it and get back to you soon.
            </Text>
            <TouchableOpacity 
              style={styles.thankYouButton}
              onPress={() => setShowThankYouModal(false)}
            >
              <Text style={styles.thankYouButtonText}>Great, Thanks!</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: COLORS.textSecondary,
    marginTop: 12,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 14,
    marginTop: 4,
  },
  backButton: {
    marginTop: 20,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '500',
  },
  header: {
    position: 'relative',
    height: 250,
  },
  headerImage: {
    width: '100%',
    height: '100%',
  },
  headerGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerGradientOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
  },
  headerControls: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  backIconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  favoriteIconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  favoriteIconButtonActive: {
    backgroundColor: COLORS.primary,
  },
  contentContainer: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -24,
    paddingTop: 16,
    paddingBottom: 40,
  },
  titleSection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  gigTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    flex: 1,
    marginRight: 12,
  },
  payoutContainer: {
    backgroundColor: 'rgba(138, 43, 226, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    alignItems: 'center',
  },
  payoutLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  payoutAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  projectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  projectName: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginLeft: 8,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  badgeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(138, 43, 226, 0.15)',
    marginRight: 8,
    marginBottom: 8,
  },
  status_open: {
    backgroundColor: 'rgba(138, 43, 226, 0.15)',
  },
  status_in_review: {
    backgroundColor: 'rgba(135, 206, 235, 0.15)',
  },
  status_completed: {
    backgroundColor: 'rgba(76, 175, 80, 0.15)',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
    marginRight: 6,
  },
  statusText: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '500',
  },
  locationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(176, 196, 222, 0.1)',
    marginRight: 8,
    marginBottom: 8,
  },
  locationText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginLeft: 6,
  },
  durationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(176, 196, 222, 0.1)',
    marginRight: 8,
    marginBottom: 8,
  },
  durationText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginLeft: 6,
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(138, 43, 226, 0.15)',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 12,
  },
  descriptionText: {
    fontSize: 16,
    lineHeight: 24,
    color: COLORS.textSecondary,
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  skillBadge: {
    backgroundColor: 'rgba(135, 206, 235, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(135, 206, 235, 0.3)',
  },
  skillText: {
    color: COLORS.secondary,
    fontSize: 14,
    fontWeight: '500',
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  detailItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  detailTextContainer: {
    marginLeft: 8,
  },
  detailLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 16,
    color: COLORS.text,
    fontWeight: '500',
  },
  applyButton: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 20,
    marginTop: 24,
    marginBottom: 20,
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  applyButtonIcon: {
    marginRight: 8,
  },
  applyButtonText: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: 'bold',
  },
  statusMessageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(138, 43, 226, 0.1)',
    marginHorizontal: 20,
    marginTop: 24,
    marginBottom: 20,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(138, 43, 226, 0.3)',
  },
  statusMessage: {
    color: COLORS.text,
    fontSize: 16,
    marginLeft: 10,
  },
  
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.cardBackground,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(138, 43, 226, 0.2)',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  modalBody: {
    padding: 20,
  },
  gigReference: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginBottom: 16,
  },
  gigReferenceTitle: {
    color: COLORS.primary,
    fontWeight: '500',
  },
  formGroup: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.text,
    marginBottom: 8,
  },
  formInput: {
    backgroundColor: COLORS.inputBackground,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: COLORS.text,
  },
  formTextarea: {
    backgroundColor: COLORS.inputBackground,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: COLORS.text,
    height: 120,
    textAlignVertical: 'top',
  },
  inputError: {
    borderColor: COLORS.error,
  },
  attachmentHelper: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 12,
  },
  attachmentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(138, 43, 226, 0.1)',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(138, 43, 226, 0.3)',
    borderStyle: 'dashed',
  },
  attachmentButtonText: {
    color: COLORS.primary,
    fontSize: 16,
    marginLeft: 8,
  },
  attachmentsList: {
    marginTop: 12,
  },
  attachmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.inputBackground,
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  attachmentItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  attachmentName: {
    marginLeft: 8,
    color: COLORS.textSecondary,
    fontSize: 14,
    flex: 1,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(138, 43, 226, 0.2)',
  },
  cancelButton: {
    flex: 1,
    padding: 15,
    backgroundColor: 'rgba(138, 43, 226, 0.1)',
    borderRadius: 8,
    marginRight: 10,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: COLORS.textSecondary,
    fontSize: 16,
    fontWeight: '500',
  },
  submitButton: {
    flex: 2,
    padding: 15,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: 'bold',
  },
  
  // Thank You Modal
  thankYouModalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  thankYouModalContent: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 16,
    padding: 24,
    width: '85%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.success,
  },
  thankYouIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(76, 175, 80, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  thankYouTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 12,
  },
  thankYouText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  thankYouButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  thankYouButtonText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: 'bold',
  },
});
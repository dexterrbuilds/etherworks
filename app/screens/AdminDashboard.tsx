import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView, 
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Image,
  Animated
} from 'react-native';
import { db } from '../../firebaseConfig';
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc, query, orderBy, where } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';

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

const CATEGORIES = [
  'Design', 'Development', 'Writing', 'Marketing', 
  'Customer Support', 'Research', 'Data Entry', 'Other'
];

export default function AdminDashboard() {
  // Form states
  const [title, setTitle] = useState('');
  const [projectName, setProjectName] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [payout, setPayout] = useState('');
  const [duration, setDuration] = useState('');
  const [skills, setSkills] = useState('');
  const [location, setLocation] = useState('Remote');
  const [image, setImage] = useState(null);
  const [imageBase64, setImageBase64] = useState('');
  const [processingImage, setProcessingImage] = useState(false);
  
  const [isLoading, setIsLoading] = useState(false);
  const [existingGigs, setExistingGigs] = useState([]);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingGig, setEditingGig] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [imagePreviewVisible, setImagePreviewVisible] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState('');
  
  // Animation values
  const [fadeAnim] = useState(new Animated.Value(0));
  
  // Fade in animation
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);
  
  // Fetch existing gigs
  useEffect(() => {
    fetchGigs();
    requestMediaLibraryPermissions();
  }, [filterCategory]);

  const requestMediaLibraryPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Sorry, we need camera roll permissions to upload images!');
    }
  };

  const fetchGigs = async () => {
    setIsLoading(true);
    try {
      let gigQuery = collection(db, 'gigs');
      
      if (filterCategory !== 'All') {
        gigQuery = query(gigQuery, where('category', '==', filterCategory));
      }
      
      gigQuery = query(gigQuery, orderBy('title'));
      
      const querySnapshot = await getDocs(gigQuery);
      const gigs = [];
      querySnapshot.forEach((doc) => {
        gigs.push({ id: doc.id, ...doc.data() });
      });
      
      setExistingGigs(gigs);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch gigs: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const selectImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.5, // Reduced quality for smaller file size
        base64: true, // Request base64 data
      });
      
      if (!result.canceled && result.assets[0]) {
        // Store the image object and its base64 data
        setImage(result.assets[0]);
        setImageBase64(`data:image/jpeg;base64,${result.assets[0].base64}`);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to select image: ' + error.message);
    }
  };

  const validateForm = () => {
    if (!title.trim()) return 'Title is required';
    if (!projectName.trim()) return 'Project name is required';
    if (!category) return 'Please select a category';
    if (!description.trim()) return 'Description is required';
    if (!payout.trim() || isNaN(Number(payout))) return 'Valid payout amount is required';
    if (!duration.trim()) return 'Estimated duration is required';
    return null;
  };

  const resetForm = () => {
    setTitle('');
    setProjectName('');
    setCategory('');
    setDescription('');
    setPayout('');
    setDuration('');
    setSkills('');
    setLocation('Remote');
    setImage(null);
    setImageBase64('');
    setEditingGig(null);
  };

  const createGig = async () => {
    const validationError = validateForm();
    if (validationError) {
      Alert.alert('Validation Error', validationError);
      return;
    }

    setIsLoading(true);
    try {
      const skillsArray = skills.split(',').map(skill => skill.trim()).filter(Boolean);
      
      await addDoc(collection(db, 'gigs'), {
        title,
        projectName,
        category,
        description,
        payout: Number(payout),
        duration,
        skills: skillsArray,
        location,
        imageBase64: imageBase64 || '', // Store the base64 string directly
        createdAt: new Date().toISOString(),
        status: 'Open'
      });
      
      Alert.alert('Success', 'Gig created successfully!');
      resetForm();
      fetchGigs();
      setIsFormVisible(false);
    } catch (error) {
      Alert.alert('Error', 'Error creating gig: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const updateGig = async () => {
    if (!editingGig) return;
    
    const validationError = validateForm();
    if (validationError) {
      Alert.alert('Validation Error', validationError);
      return;
    }

    setIsLoading(true);
    try {
      const skillsArray = skills.split(',').map(skill => skill.trim()).filter(Boolean);
      
      const updateData = {
        title,
        projectName,
        category,
        description,
        payout: Number(payout),
        duration,
        skills: skillsArray,
        location,
        updatedAt: new Date().toISOString()
      };
      
      // Only update the image if a new one was selected
      if (image && imageBase64) {
        updateData.imageBase64 = imageBase64;
      }
      
      await updateDoc(doc(db, 'gigs', editingGig.id), updateData);
      
      Alert.alert('Success', 'Gig updated successfully!');
      resetForm();
      fetchGigs();
      setIsFormVisible(false);
    } catch (error) {
      Alert.alert('Error', 'Error updating gig: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteGig = async (gigId) => {
    Alert.alert(
      'Confirm Deletion',
      'Are you sure you want to delete this gig?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setIsLoading(true);
            try {
              // Delete the document
              await deleteDoc(doc(db, 'gigs', gigId));
              
              Alert.alert('Success', 'Gig deleted successfully!');
              fetchGigs();
            } catch (error) {
              Alert.alert('Error', 'Error deleting gig: ' + error.message);
            } finally {
              setIsLoading(false);
            }
          }
        }
      ]
    );
  };

  const editGig = (gig) => {
    setEditingGig(gig);
    setTitle(gig.title);
    setProjectName(gig.projectName || '');
    setCategory(gig.category);
    setDescription(gig.description);
    setPayout(gig.payout.toString());
    setDuration(gig.duration || '');
    setSkills(gig.skills ? gig.skills.join(', ') : '');
    setLocation(gig.location || 'Remote');
    
    // Handle image data
    if (gig.imageBase64) {
      setImageBase64(gig.imageBase64);
      // Create a dummy image object to show preview
      setImage({ uri: gig.imageBase64 });
    } else {
      setImage(null);
      setImageBase64('');
    }
    
    setIsFormVisible(true);
  };

  const duplicateGig = (gig) => {
    setTitle(gig.title + ' (Copy)');
    setProjectName(gig.projectName ? gig.projectName + ' (Copy)' : '');
    setCategory(gig.category);
    setDescription(gig.description);
    setPayout(gig.payout.toString());
    setDuration(gig.duration || '');
    setSkills(gig.skills ? gig.skills.join(', ') : '');
    setLocation(gig.location || 'Remote');
    
    // Handle image data
    if (gig.imageBase64) {
      setImageBase64(gig.imageBase64);
      // Create a dummy image object to show preview
      setImage({ uri: gig.imageBase64 });
    } else {
      setImage(null);
      setImageBase64('');
    }
    
    setEditingGig(null);
    setIsFormVisible(true);
  };

  const showImagePreview = (url) => {
    setPreviewImageUrl(url);
    setImagePreviewVisible(true);
  };

  const filteredGigs = existingGigs.filter(gig => 
    gig.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (gig.projectName && gig.projectName.toLowerCase().includes(searchQuery.toLowerCase())) ||
    gig.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <LinearGradient
        colors={[COLORS.background, '#261338']}
        style={styles.headerGradient}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Gig Management</Text>
          {!isFormVisible && (
            <TouchableOpacity 
              style={styles.addButton} 
              onPress={() => {
                resetForm();
                setIsFormVisible(true);
              }}
            >
              <Ionicons name="add-circle" size={24} color={COLORS.text} />
              <Text style={styles.buttonText}>New Gig</Text>
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>

      {!isFormVisible ? (
        <Animated.View 
          style={[styles.listContainer, { opacity: fadeAnim }]}
        >
          <View style={styles.filterContainer}>
            <View style={styles.searchInputContainer}>
              <Ionicons name="search" size={20} color={COLORS.textSecondary} style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search gigs..."
                placeholderTextColor={COLORS.textSecondary}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>
            <TouchableOpacity 
              style={styles.filterButton}
              onPress={() => setShowCategoryModal(true)}
            >
              <Text style={styles.filterButtonText}>
                {filterCategory === 'All' ? 'All Categories' : filterCategory} 
              </Text>
              <Ionicons name="chevron-down" size={16} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          {isLoading ? (
            <ActivityIndicator size="large" color={COLORS.secondary} style={styles.loader} />
          ) : filteredGigs.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="document-outline" size={48} color={COLORS.textSecondary} />
              <Text style={styles.emptyStateText}>No gigs found</Text>
            </View>
          ) : (
            <ScrollView style={styles.gigList}>
              {filteredGigs.map((gig) => {
                if (!gig) return null; // Skip undefined gigs

                return (
                  <View key={gig.id} style={styles.gigCard}>
                    {gig.imageBase64 ? (
                      <TouchableOpacity onPress={() => showImagePreview(gig.imageBase64)}>
                        <Image 
                          source={{ uri: gig.imageBase64 }} 
                          style={styles.gigImage} 
                          resizeMode="cover"
                        />
                        <LinearGradient
                          colors={['transparent', 'rgba(46, 26, 71, 0.8)']}
                          style={styles.imageGradient}
                        />
                      </TouchableOpacity>
                    ) : (
                      <LinearGradient
                        colors={[COLORS.primary, COLORS.background]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.noImageGradient}
                      >
                        <Ionicons name="image-outline" size={40} color="rgba(255,255,255,0.2)" />
                      </LinearGradient>
                    )}
                    
                    <View style={styles.gigHeader}>
                      <View style={styles.titleContainer}>
                        <Text style={styles.gigTitle}>{gig.title || 'Untitled'}</Text>
                        {gig.projectName && (
                          <Text style={styles.projectName}>Project: {gig.projectName}</Text>
                        )}
                      </View>
                      <View style={styles.categoryBadge}>
                        <Text style={styles.categoryText}>{gig.category || 'Uncategorized'}</Text>
                      </View>
                    </View>
                    
                    <Text style={styles.gigDescription} numberOfLines={2}>
                      {gig.description || 'No description available'}
                    </Text>
                    
                    <View style={styles.gigMetadata}>
                      <View style={styles.metadataItem}>
                        <Ionicons name="cash-outline" size={16} color={COLORS.secondary} />
                        <Text style={styles.metadataText}>${gig.payout || '0'}</Text>
                      </View>
                      
                      {gig.duration && (
                        <View style={styles.metadataItem}>
                          <Ionicons name="time-outline" size={16} color={COLORS.secondary} />
                          <Text style={styles.metadataText}>{gig.duration}</Text>
                        </View>
                      )}
                      
                      <View style={styles.metadataItem}>
                        <Ionicons name="location-outline" size={16} color={COLORS.secondary} />
                        <Text style={styles.metadataText}>{gig.location || 'Remote'}</Text>
                      </View>
                    </View>
                    
                    <View style={styles.skillsContainer}>
                      {gig.skills && gig.skills.map((skill, index) => (
                        <View key={index} style={styles.skillBadge}>
                          <Text style={styles.skillText}>{skill}</Text>
                        </View>
                      ))}
                    </View>
                    
                    <View style={styles.actionButtons}>
                      <TouchableOpacity 
                        style={[styles.actionButton, styles.editButton]} 
                        onPress={() => editGig(gig)}
                      >
                        <Ionicons name="create-outline" size={16} color={COLORS.text} />
                        <Text style={styles.actionButtonText}>Edit</Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity 
                        style={[styles.actionButton, styles.duplicateButton]} 
                        onPress={() => duplicateGig(gig)}
                      >
                        <Ionicons name="copy-outline" size={16} color={COLORS.text} />
                        <Text style={styles.actionButtonText}>Duplicate</Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity 
                        style={[styles.actionButton, styles.deleteButton]} 
                        onPress={() => deleteGig(gig.id)}
                      >
                        <Ionicons name="trash-outline" size={16} color={COLORS.text} />
                        <Text style={styles.actionButtonText}>Delete</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </ScrollView>
          )}
        </Animated.View>
      ) : (
        <ScrollView style={styles.formContainer}>
          <LinearGradient 
            colors={[COLORS.cardBackground, COLORS.background]} 
            style={styles.formCard}
          >
            <Text style={styles.formTitle}>
              {editingGig ? 'Edit Gig' : 'Create New Gig'}
            </Text>
            
            <Text style={styles.inputLabel}>Title</Text>
            <TextInput
              style={styles.input}
              placeholder="Gig title"
              placeholderTextColor="rgba(176, 196, 222, 0.5)"
              value={title}
              onChangeText={setTitle}
              maxLength={100}
            />
            
            <Text style={styles.inputLabel}>Project Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Project name"
              placeholderTextColor="rgba(176, 196, 222, 0.5)"
              value={projectName}
              onChangeText={setProjectName}
              maxLength={100}
            />
            
            <Text style={styles.inputLabel}>Category</Text>
            <TouchableOpacity 
              style={styles.pickerButton}
              onPress={() => setShowCategoryModal(true)}
            >
              <Text style={category ? styles.pickerText : styles.pickerPlaceholder}>
                {category || 'Select a category'}
              </Text>
              <Ionicons name="chevron-down" size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
            
            <Text style={styles.inputLabel}>Project Image</Text>
            <View style={styles.imageUploadContainer}>
              {(imageBase64 || (image && image.uri)) ? (
                <View style={styles.imagePreviewContainer}>
                  <Image 
                    source={{ uri: image ? image.uri : imageBase64 }} 
                    style={styles.imagePreview} 
                    resizeMode="cover"
                  />
                  <TouchableOpacity 
                    style={styles.removeImageButton}
                    onPress={() => {
                      setImage(null);
                      setImageBase64('');
                    }}
                  >
                    <Ionicons name="close-circle" size={24} color={COLORS.error} />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity 
                  style={styles.imageUploadButton} 
                  onPress={selectImage}
                  disabled={processingImage}
                >
                  {processingImage ? (
                    <ActivityIndicator size="small" color={COLORS.primary} />
                  ) : (
                    <>
                      <Ionicons name="image-outline" size={24} color={COLORS.primary} />
                      <Text style={styles.imageUploadText}>Select Image</Text>
                    </>
                  )}
                </TouchableOpacity>
              )}
            </View>
            
            <Text style={styles.inputLabel}>Description</Text>
            <TextInput
              style={styles.textArea}
              placeholder="Detailed description of the gig"
              placeholderTextColor="rgba(176, 196, 222, 0.5)"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={5}
              textAlignVertical="top"
            />
            
            <Text style={styles.inputLabel}>Payout ($)</Text>
            <TextInput
              style={styles.input}
              placeholder="Payout amount"
              placeholderTextColor="rgba(176, 196, 222, 0.5)"
              value={payout}
              onChangeText={setPayout}
              keyboardType="numeric"
            />
            
            <Text style={styles.inputLabel}>Estimated Duration</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., 2-3 days, 1 week"
              placeholderTextColor="rgba(176, 196, 222, 0.5)"
              value={duration}
              onChangeText={setDuration}
            />
            
            <Text style={styles.inputLabel}>Required Skills (comma separated)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., JavaScript, Design, Writing"
              placeholderTextColor="rgba(176, 196, 222, 0.5)"
              value={skills}
              onChangeText={setSkills}
            />
            
            <View style={styles.formButtons}>
              <TouchableOpacity 
                style={styles.cancelButton} 
                onPress={() => {
                  resetForm();
                  setIsFormVisible(false);
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.submitButton} 
                onPress={editingGig ? updateGig : createGig}
                disabled={isLoading || processingImage}
              >
                {isLoading || processingImage ? (
                  <ActivityIndicator size="small" color={COLORS.text} />
                ) : (
                  <Text style={styles.submitButtonText}>
                    {editingGig ? 'Update Gig' : 'Create Gig'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </ScrollView>
      )}

      {/* Category Selection Modal */}
      <Modal
        visible={showCategoryModal}
        transparent
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <Animated.View 
            style={[styles.modalContent, { opacity: fadeAnim }]}
            // Removed invalid 'entering' property
          >
            <Text style={styles.modalTitle}>Select Category</Text>
            
            <ScrollView style={styles.modalList}>
              {!isFormVisible && (
                <TouchableOpacity 
                  style={styles.modalItem}
                  onPress={() => {
                    setFilterCategory('All');
                    setShowCategoryModal(false);
                  }}
                >
                  <Text style={styles.modalItemText}>All Categories</Text>
                </TouchableOpacity>
              )}
              
              {CATEGORIES.map((cat) => (
                <TouchableOpacity 
                  key={cat}
                  style={styles.modalItem}
                  onPress={() => {
                    if (isFormVisible) {
                      setCategory(cat);
                    } else {
                      setFilterCategory(cat);
                    }
                    setShowCategoryModal(false);
                  }}
                >
                  <Text style={styles.modalItemText}>{cat}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            
            <TouchableOpacity 
              style={styles.modalCloseButton}
              onPress={() => setShowCategoryModal(false)}
            >
              <Text style={styles.modalCloseText}>Close</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>

      {/* Image Preview Modal */}
      <Modal
        visible={imagePreviewVisible}
        transparent
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.imagePreviewModal}>
            <Image 
              source={{ uri: previewImageUrl }}
              style={styles.fullScreenImage}
              resizeMode="contain"
            />
            <TouchableOpacity 
              style={styles.closePreviewButton}
              onPress={() => setImagePreviewVisible(false)}
            >
              <Ionicons name="close-circle" size={40} color={COLORS.text} />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  headerGradient: {
    elevation: 4,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    elevation: 3,
  },
  buttonText: {
    color: COLORS.text,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  listContainer: {
    flex: 1,
  },
  formContainer: {
    flex: 1,
    padding: 16,
  },
  formCard: {
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
  },
  filterContainer: {
    flexDirection: 'row',
    padding: 16,
    paddingBottom: 8,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.inputBackground,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: 8,
    paddingHorizontal: 10,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    color: COLORS.text,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    backgroundColor: COLORS.inputBackground,
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    minWidth: 130,
  },
  filterButtonText: {
    color: COLORS.textSecondary,
    marginRight: 4,
  },
  gigList: {
    padding: 16,
    paddingTop: 8,
  },
  gigCard: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 12,
    marginBottom: 16,
    elevation: 4,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(138, 43, 226, 0.3)',
  },
  gigImage: {
    width: '100%',
    height: 160,
    backgroundColor: COLORS.inputBackground,
  },
  imageGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
  },
  noImageGradient: {
    width: '100%',
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gigHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
    padding: 16,
    paddingBottom: 0,
  },
  titleContainer: {
    flex: 1,
  },
  gigTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  projectName: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  categoryBadge: {
    backgroundColor: 'rgba(138, 43, 226, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(138, 43, 226, 0.5)',
    marginLeft: 8,
  },
  categoryText: {
    color: COLORS.secondary,
    fontSize: 12,
    fontWeight: '500',
  },
  gigDescription: {
    color: COLORS.textSecondary,
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  skillBadge: {
    backgroundColor: 'rgba(135, 206, 235, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(135, 206, 235, 0.3)',
  },
  skillText: {
    color: COLORS.secondary,
    fontSize: 12,
  },
  gigMetadata: {
    flexDirection: 'row',
    marginBottom: 12,
    flexWrap: 'wrap',
    paddingHorizontal: 16,
  },
  metadataItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    marginBottom: 4,
  },
  metadataText: {
    marginLeft: 4,
    color: COLORS.textSecondary,
    fontSize: 13,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 16,
    paddingTop: 0,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginLeft: 8,
  },
  editButton: {
    backgroundColor: COLORS.primary,
  },
  duplicateButton: {
    backgroundColor: COLORS.accent,
  },
  deleteButton: {
    backgroundColor: COLORS.error,
  },
  actionButtonText: {
    color: COLORS.text,
    marginLeft: 4,
    fontSize: 12,
    fontWeight: '500',
  },
  formTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    color: COLORS.text,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
    color: COLORS.textSecondary,
  },
  input: {
    backgroundColor: COLORS.inputBackground,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 12,
    marginBottom: 16,
    color: COLORS.text,
  },
  pickerButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.inputBackground,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 12,
    marginBottom: 16,
  },
  pickerText: {
    color: COLORS.text,
  },
  pickerPlaceholder: {
    color: 'rgba(176, 196, 222, 0.5)',
  },
  imageUploadContainer: {
    marginBottom: 16,
  },
  imageUploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.inputBackground,
    borderRadius: 12,
    padding: 30,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
  },
  imageUploadText: {
    marginLeft: 8,
    color: COLORS.primary,
  },
  imagePreviewContainer: {
    position: 'relative',
    marginBottom: 8,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  imagePreview: {
    width: '100%',
    height: 200,
    backgroundColor: COLORS.inputBackground,
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(20, 10, 30, 0.7)',
    borderRadius: 12,
    padding: 4,
  },
  textArea: {
    backgroundColor: COLORS.inputBackground,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 12,
    marginBottom: 16,
    minHeight: 100,
    color: COLORS.text,
    textAlignVertical: 'top',
  },
  formButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    marginBottom: 16,
  },
  cancelButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    marginRight: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  cancelButtonText: {
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  submitButton: {
    flex: 2,
    backgroundColor: COLORS.primary,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    elevation: 3,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
  },
  submitButtonText: {
    color: COLORS.text,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    backgroundColor: COLORS.cardBackground,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    color: COLORS.text,
  },
  modalList: {
    maxHeight: 300,
  },
  modalItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalItemText: {
    fontSize: 16,
    color: COLORS.text,
  },
  modalCloseButton: {
    padding: 16,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: 'rgba(138, 43, 226, 0.1)',
  },
  modalCloseText: {
    color: COLORS.secondary,
    fontWeight: 'bold',
  },
  loader: {
    marginTop: 20,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyStateText: {
    marginTop: 8,
    color: COLORS.textSecondary,
    fontSize: 16,
  },
  imagePreviewModal: {
    width: '90%',
    height: '70%',
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenImage: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  closePreviewButton: {
    position: 'absolute',
    top: -20,
    right: -20,
    backgroundColor: 'rgba(20, 10, 30, 0.5)',
    borderRadius: 24,
  },
  closePreviewText: {
    color: COLORS.text,
  },
});
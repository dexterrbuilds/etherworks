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
  Image
} from 'react-native';
import { db, storage } from '../../firebaseConfig';
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc, query, orderBy, where } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

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
  const [imageUrl, setImageUrl] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  
  
  const [isLoading, setIsLoading] = useState(false);
  const [existingGigs, setExistingGigs] = useState([]);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingGig, setEditingGig] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [imagePreviewVisible, setImagePreviewVisible] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState('');
  
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
        quality: 0.8,
      });
      
      if (!result.canceled && result.assets[0]) {
        setImage(result.assets[0]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to select image: ' + error.message);
    }
  };

  const uploadImage = async () => {
    if (!image) return null;
    
    setUploadingImage(true);
    try {
      // Convert URI to blob
      const response = await fetch(image.uri);
      const blob = await response.blob();
      
      // Generate a unique filename
      const filename = `gig_images/${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
      const storageRef = ref(storage, filename);
      
      // Upload to Firebase Storage
      await uploadBytes(storageRef, blob);
      
      // Get download URL
      const downloadUrl = await getDownloadURL(storageRef);
      setImageUrl(downloadUrl);
      
      return { url: downloadUrl, path: filename };
    } catch (error) {
      Alert.alert('Upload Error', 'Failed to upload image: ' + error.message);
      return null;
    } finally {
      setUploadingImage(false);
    }
  };

  const deleteImage = async (imagePath) => {
    if (!imagePath) return;
    
    try {
      const storageRef = ref(storage, imagePath);
      await deleteObject(storageRef);
    } catch (error) {
      console.log('Error deleting image:', error);
      // Continue without throwing an error as this is not critical
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
    setImageUrl('');
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
      
      // Upload image if selected
      let imageData = null;
      if (image) {
        imageData = await uploadImage();
        if (!imageData) {
          setIsLoading(false);
          return;
        }
      }
      
      await addDoc(collection(db, 'gigs'), {
        title,
        projectName,
        category,
        description,
        payout: Number(payout),
        duration,
        skills: skillsArray,
        location,
        imageUrl: imageData ? imageData.url : '',
        imagePath: imageData ? imageData.path : '',
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
      
      // Handle image update
      let imageData = null;
      if (image) {
        // Upload new image
        imageData = await uploadImage();
        if (!imageData && image) {
          setIsLoading(false);
          return;
        }
        
        // Delete old image if exists and a new one was uploaded
        if (imageData && editingGig.imagePath) {
          await deleteImage(editingGig.imagePath);
        }
      }
      
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
      
      // Only update image fields if a new image was uploaded
      if (imageData) {
        updateData.imageUrl = imageData.url;
        updateData.imagePath = imageData.path;
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
    const gigToDelete = existingGigs.find(g => g.id === gigId);
    
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
              
              // Delete the image if exists
              if (gigToDelete && gigToDelete.imagePath) {
                await deleteImage(gigToDelete.imagePath);
              }
              
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
    setImageUrl(gig.imageUrl || '');
    setImage(null); // Reset image selection
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
    setImageUrl(gig.imageUrl || '');
    setImage(null); // Reset image selection
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
            <Ionicons name="add-circle" size={24} color="#fff" />
            <Text style={styles.buttonText}>New Gig</Text>
          </TouchableOpacity>
        )}
      </View>

      {!isFormVisible ? (
        <View style={styles.listContainer}>
          <View style={styles.filterContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search gigs..."
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            <TouchableOpacity 
              style={styles.filterButton}
              onPress={() => setShowCategoryModal(true)}
            >
              <Text style={styles.filterButtonText}>
                {filterCategory === 'All' ? 'All Categories' : filterCategory} ▼
              </Text>
            </TouchableOpacity>
          </View>

          {isLoading ? (
            <ActivityIndicator size="large" color="#007BFF" style={styles.loader} />
          ) : filteredGigs.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="document-outline" size={48} color="#ccc" />
              <Text style={styles.emptyStateText}>No gigs found</Text>
            </View>
          ) : (
            <ScrollView style={styles.gigList}>
              {filteredGigs.map((gig) => (
                <View key={gig.id} style={styles.gigCard}>
                  {gig.imageUrl ? (
                    <TouchableOpacity onPress={() => showImagePreview(gig.imageUrl)}>
                      <Image 
                        source={{ uri: gig.imageUrl }} 
                        style={styles.gigImage} 
                        resizeMode="cover"
                      />
                    </TouchableOpacity>
                  ) : null}
                  
                  <View style={styles.gigHeader}>
                    <View style={styles.titleContainer}>
                      <Text style={styles.gigTitle}>{gig.title}</Text>
                      {gig.projectName && (
                        <Text style={styles.projectName}>Project: {gig.projectName}</Text>
                      )}
                    </View>
                    <View style={styles.categoryBadge}>
                      <Text style={styles.categoryText}>{gig.category}</Text>
                    </View>
                  </View>
                  
                  <Text style={styles.gigDescription} numberOfLines={2}>
                    {gig.description}
                  </Text>
                  
                  <View style={styles.gigMetadata}>
                    <View style={styles.metadataItem}>
                      <Ionicons name="cash-outline" size={16} color="#555" />
                      <Text style={styles.metadataText}>${gig.payout}</Text>
                    </View>
                    
                    {gig.duration && (
                      <View style={styles.metadataItem}>
                        <Ionicons name="time-outline" size={16} color="#555" />
                        <Text style={styles.metadataText}>{gig.duration}</Text>
                      </View>
                    )}
                    
                    <View style={styles.metadataItem}>
                      <Ionicons name="location-outline" size={16} color="#555" />
                      <Text style={styles.metadataText}>{gig.location || 'Remote'}</Text>
                    </View>
                  </View>
                  
                  <View style={styles.actionButtons}>
                    <TouchableOpacity 
                      style={[styles.actionButton, styles.editButton]} 
                      onPress={() => editGig(gig)}
                    >
                      <Ionicons name="create-outline" size={16} color="#fff" />
                      <Text style={styles.actionButtonText}>Edit</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={[styles.actionButton, styles.duplicateButton]} 
                      onPress={() => duplicateGig(gig)}
                    >
                      <Ionicons name="copy-outline" size={16} color="#fff" />
                      <Text style={styles.actionButtonText}>Duplicate</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={[styles.actionButton, styles.deleteButton]} 
                      onPress={() => deleteGig(gig.id)}
                    >
                      <Ionicons name="trash-outline" size={16} color="#fff" />
                      <Text style={styles.actionButtonText}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </ScrollView>
          )}
        </View>
      ) : (
        <ScrollView style={styles.formContainer}>
          <Text style={styles.formTitle}>
            {editingGig ? 'Edit Gig' : 'Create New Gig'}
          </Text>
          
          <Text style={styles.inputLabel}>Title</Text>
          <TextInput
            style={styles.input}
            placeholder="Gig title"
            value={title}
            onChangeText={setTitle}
            maxLength={100}
          />
          
          <Text style={styles.inputLabel}>Project Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Project name"
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
            <Ionicons name="chevron-down" size={20} color="#555" />
          </TouchableOpacity>
          
          <Text style={styles.inputLabel}>Project Image</Text>
          <View style={styles.imageUploadContainer}>
            {(imageUrl || (image && image.uri)) ? (
              <View style={styles.imagePreviewContainer}>
                <Image 
                  source={{ uri: image ? image.uri : imageUrl }} 
                  style={styles.imagePreview} 
                  resizeMode="cover"
                />
                <TouchableOpacity 
                  style={styles.removeImageButton}
                  onPress={() => {
                    setImage(null);
                    if (editingGig && !image) {
                      setImageUrl('');
                    }
                  }}
                >
                  <Ionicons name="close-circle" size={24} color="#e74c3c" />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity 
                style={styles.imageUploadButton} 
                onPress={selectImage}
              >
                <Ionicons name="image-outline" size={24} color="#3498db" />
                <Text style={styles.imageUploadText}>Select Image</Text>
              </TouchableOpacity>
            )}
          </View>
          
          <Text style={styles.inputLabel}>Description</Text>
          <TextInput
            style={styles.textArea}
            placeholder="Detailed description of the gig"
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
            value={payout}
            onChangeText={setPayout}
            keyboardType="numeric"
          />
          
          <Text style={styles.inputLabel}>Estimated Duration</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., 2-3 days, 1 week"
            value={duration}
            onChangeText={setDuration}
          />
          
          <Text style={styles.inputLabel}>Required Skills (comma separated)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., JavaScript, Design, Writing"
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
              disabled={isLoading || uploadingImage}
            >
              {isLoading || uploadingImage ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.submitButtonText}>
                  {editingGig ? 'Update Gig' : 'Create Gig'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}

      {/* Category Selection Modal */}
      <Modal
        visible={showCategoryModal}
        transparent
        animationType="slide"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
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
          </View>
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
              <Ionicons name="close-circle" size={40} color="#fff" />
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
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#3498db',
    elevation: 4,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2980b9',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 4,
  },
  buttonText: {
    color: '#fff',
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
  filterContainer: {
    flexDirection: 'row',
    padding: 16,
    paddingBottom: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    backgroundColor: '#fff',
    borderRadius: 4,
    paddingHorizontal: 12,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  filterButton: {
    justifyContent: 'center',
    paddingHorizontal: 12,
    backgroundColor: '#fff',
    height: 40,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  filterButtonText: {
    color: '#555',
  },
  gigList: {
    padding: 16,
    paddingTop: 8,
  },
  gigCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 16,
    elevation: 2,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    overflow: 'hidden',
  },
  gigImage: {
    width: '100%',
    height: 160,
    backgroundColor: '#f0f0f0',
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
  },
  projectName: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  categoryBadge: {
    backgroundColor: '#e8f4fd',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginLeft: 8,
  },
  categoryText: {
    color: '#3498db',
    fontSize: 12,
    fontWeight: '500',
  },
  gigDescription: {
    color: '#555',
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  gigMetadata: {
    flexDirection: 'row',
    marginBottom: 16,
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
    color: '#555',
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
    paddingVertical: 6,
    borderRadius: 4,
    marginLeft: 8,
  },
  editButton: {
    backgroundColor: '#3498db',
  },
  duplicateButton: {
    backgroundColor: '#9b59b6',
  },
  deleteButton: {
    backgroundColor: '#e74c3c',
  },
  actionButtonText: {
    color: '#fff',
    marginLeft: 4,
    fontSize: 12,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
    color: '#555',
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 10,
    marginBottom: 16,
  },
  pickerButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 10,
    marginBottom: 16,
  },
  pickerText: {
    color: '#333',
  },
  pickerPlaceholder: {
    color: '#aaa',
  },
  imageUploadContainer: {
    marginBottom: 16,
  },
  imageUploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 8
  },
  textArea: {
    backgroundColor: '#fff',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 10,
    marginBottom: 16,
    minHeight: 100,
  },
  radioGroup: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  radio: {
    height: 20,
    width: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#3498db',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    height: 10,
    width: 10,
    borderRadius: 5,
    backgroundColor: '#3498db',
  },
  radioLabel: {
    marginLeft: 8,
  },
  formButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    marginBottom: 24,
  },
  cancelButton: {
    flex: 1,
    padding: 12,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
    marginRight: 8,
  },
  cancelButtonText: {
    color: '#555',
  },
  submitButton: {
    flex: 2,
    backgroundColor: '#3498db',
    padding: 12,
    borderRadius: 4,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    backgroundColor: '#fff',
    borderRadius: 8,
    overflow: 'hidden',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalList: {
    maxHeight: 300,
  },
  modalItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalItemText: {
    fontSize: 16,
  },
  modalCloseButton: {
    padding: 16,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    backgroundColor: '#f9f9f9',
  },
  modalCloseText: {
    color: '#3498db',
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
    color: '#999',
    fontSize: 16,
  },
});
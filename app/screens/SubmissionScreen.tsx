import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet } from 'react-native';
import { db, storage } from '../../firebaseConfig';
import { collection, addDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import * as DocumentPicker from 'expo-document-picker';

const SubmissionScreen = ({ route, navigation }) => {
  const { gigId } = route.params;
  const [description, setDescription] = useState('');
  const [file, setFile] = useState(null);

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({});
      if (result.type === 'success') {
        setFile(result);
      }
    } catch (err) {
      console.log(err);
    }
  };

  const handleSubmit = async () => {
    try {
      let fileUrl = '';
      if (file) {
        const response = await fetch(file.uri);
        const blob = await response.blob();
        const fileRef = ref(storage, `submissions/${Date.now()}_${file.name}`);
        await uploadBytes(fileRef, blob);
        fileUrl = await getDownloadURL(fileRef);
      }

      await addDoc(collection(db, 'submissions'), {
        gigId,
        description,
        fileUrl,
        userId: auth.currentUser.uid,
        createdAt: new Date(),
        status: 'pending',
      });

      navigation.goBack();
    } catch (error) {
      console.error('Error submitting:', error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Submit Your Work</Text>
      <TextInput
        style={styles.input}
        placeholder="Description"
        value={description}
        onChangeText={setDescription}
        multiline
      />
      <Button title="Pick a file" onPress={pickDocument} />
      {file && <Text>{file.name}</Text>}
      <Button title="Submit" onPress={handleSubmit} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  input: {
    height: 100,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 16,
    padding: 8,
  },
});

export default SubmissionScreen;


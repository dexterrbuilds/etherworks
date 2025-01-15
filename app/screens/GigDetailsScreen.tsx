import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Button } from 'react-native';
import { db } from '../../firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';

export default function GigDetailsScreen({ route }) {
  const { gigId } = route.params;
  const [gig, setGig] = useState(null);

  useEffect(() => {
    fetchGigDetails();
  }, []);

  const fetchGigDetails = async () => {
    const docRef = doc(db, 'gigs', gigId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      setGig({ id: docSnap.id, ...docSnap.data() });
    }
  };

  if (!gig) {
    return <Text>Loading...</Text>;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{gig.title}</Text>
      <Text style={styles.category}>{gig.category}</Text>
      <Text style={styles.description}>{gig.description}</Text>
      <Text style={styles.payout}>Payout: ${gig.payout}</Text>
      <Button title="Apply" onPress={() => alert('Application submitted!')} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  category: {
    fontSize: 18,
    color: 'gray',
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    marginBottom: 16,
  },
  payout: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
});


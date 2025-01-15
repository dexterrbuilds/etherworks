import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { useAuth } from '../AuthContext';
import { db } from '../../firebaseConfig';
import { collection, query, where, getDocs } from 'firebase/firestore';

const DashboardScreen = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalSubmissions: 0,
    completedGigs: 0,
    totalEarned: 0,
  });
  const [activeSubmissions, setActiveSubmissions] = useState([]);

  useEffect(() => {
    fetchStats();
    fetchActiveSubmissions();
  }, []);

  const fetchStats = async () => {
    const submissionsQuery = query(collection(db, 'submissions'), where('userId', '==', user.uid));
    const querySnapshot = await getDocs(submissionsQuery);
    const submissions = querySnapshot.docs.map(doc => doc.data());

    const totalSubmissions = submissions.length;
    const completedGigs = submissions.filter(sub => sub.status === 'completed').length;
    const totalEarned = submissions
      .filter(sub => sub.status === 'completed')
      .reduce((total, sub) => total + sub.payout, 0);

    setStats({ totalSubmissions, completedGigs, totalEarned });
  };

  const fetchActiveSubmissions = async () => {
    const activeQuery = query(
      collection(db, 'submissions'),
      where('userId', '==', user.uid),
      where('status', 'in', ['pending', 'in_review'])
    );
    const querySnapshot = await getDocs(activeQuery);
    const active = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setActiveSubmissions(active);
  };

  const renderActiveSubmission = ({ item }) => (
    <View style={styles.submissionItem}>
      <Text>{item.description}</Text>
      <Text>Status: {item.status}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Dashboard</Text>
      <View style={styles.statsContainer}>
        <Text>Total Submissions: {stats.totalSubmissions}</Text>
        <Text>Completed Gigs: {stats.completedGigs}</Text>
        <Text>Total Earned: ${stats.totalEarned.toFixed(2)}</Text>
      </View>
      <Text style={styles.subtitle}>Active Submissions</Text>
      <FlatList
        data={activeSubmissions}
        renderItem={renderActiveSubmission}
        keyExtractor={item => item.id}
      />
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
  subtitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  statsContainer: {
    backgroundColor: '#f0f0f0',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  submissionItem: {
    backgroundColor: '#f0f0f0',
    padding: 16,
    marginBottom: 8,
    borderRadius: 8,
  },
});

export default DashboardScreen;


import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { dummyGigs } from '../data/gigs';
import type { Gig } from '../types/gig';

type TabType = 'open' | 'in_review' | 'completed';
type CategoryType = 'all' | 'Content Creation' | 'Design' | 'Development';

export default function HomeScreen() {
  const [activeTab, setActiveTab] = useState<TabType>('open');
  const [activeCategory, setActiveCategory] = useState<CategoryType>('all');
  const navigation = useNavigation<any>();

  const filteredGigs = dummyGigs.filter(gig => {
    const statusMatch = gig.status === activeTab;
    const categoryMatch = activeCategory === 'all' || gig.category === activeCategory;
    return statusMatch && categoryMatch;
  });

  const renderTab = (tab: TabType, label: string) => (
    <TouchableOpacity
      onPress={() => setActiveTab(tab)}
      style={[
        styles.tab,
        activeTab === tab && styles.activeTab
      ]}
    >
      <Text style={[
        styles.tabText,
        activeTab === tab && styles.activeTabText
      ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  const renderCategoryFilter = (category: CategoryType, label: string) => (
    <TouchableOpacity
      onPress={() => setActiveCategory(category)}
      style={[
        styles.categoryFilter,
        activeCategory === category && styles.activeCategoryFilter
      ]}
    >
      <Text style={[
        styles.categoryFilterText,
        activeCategory === category && styles.activeCategoryFilterText
      ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  const renderGigCard = (gig: Gig) => (
    <TouchableOpacity
      key={gig.id}
      style={styles.gigCard}
      onPress={() => navigation.navigate('GigDetails', { gigId: gig.id })}
    >
      <View style={styles.gigHeader}>
        <Text style={styles.gigTitle}>{gig.title}</Text>
        <Text style={styles.gigPayout}>${gig.payout}</Text>
      </View>
      <Text style={styles.gigDescription}>{gig.description}</Text>
      <View style={styles.skillsContainer}>
        {gig.skills.map((skill, index) => (
          <View key={index} style={styles.skillTag}>
            <Text style={styles.skillText}>{skill}</Text>
          </View>
        ))}
      </View>
      <View style={styles.gigFooter}>
        <Text style={styles.deadline}>Deadline: {gig.deadline}</Text>
        <View style={[styles.statusIndicator, styles[`status_${gig.status}`]]} />
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsContainer} contentContainerStyle={styles.tabsCont}>
        {renderTab('open', 'Open Gigs')}
        {renderTab('in_review', 'In Review')}
        {renderTab('completed', 'Completed')}
      </ScrollView>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesContainer} contentContainerStyle={styles.categoriesCont}>
        {renderCategoryFilter('all', 'All Opportunities')}
        {renderCategoryFilter('Content Creation', 'Content Creation')}
        {renderCategoryFilter('Design', 'Design')}
        {renderCategoryFilter('Development', 'Development')}
      </ScrollView>

      <ScrollView style={styles.gigsContainer}>
        {filteredGigs.map(renderGigCard)}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ECEDEE',
  },
  tabsContainer: {
    backgroundColor: '#001B2A',
    paddingVertical: 12,
    paddingHorizontal: 16,
    height: 70,
    flexShrink: 0,
  },
  tabsCont: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  tab: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    height: 48,
    justifyContent: 'center',
    marginRight: 12,
    borderRadius: 20,
    backgroundColor: 'transparent',
  },
  activeTab: {
    backgroundColor: '#780000',
  },
  tabText: {
    color: '#8CABA9',
    fontSize: 16,
    fontFamily: 'Satoshi-Medium',
  },
  activeTabText: {
    color: '#ECEDEE',
  },
  categoriesContainer: {
    backgroundColor: '#ECEDEE',
    paddingVertical: 12,
    paddingHorizontal: 16,
    height: 70,
  },
  categoriesCont: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryFilter: {
    height: 32,
    paddingHorizontal: 16,
    paddingVertical: 6,
    marginRight: 8,
    borderRadius: 16,
    backgroundColor: '#8CABA9',
  },
  activeCategoryFilter: {
    backgroundColor: '#9E1F19',
    height: 32,
  },
  categoryFilterText: {
    color: '#001B2A',
    fontSize: 14,
    fontFamily: 'Satoshi-Medium',
  },
  activeCategoryFilterText: {
    color: '#ECEDEE',
  },
  gigsContainer: {
    padding: 16,
  },
  gigCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#001B2A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  gigHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  gigTitle: {
    fontSize: 18,
    fontFamily: 'Satoshi-Bold',
    color: '#001B2A',
    flex: 1,
    marginRight: 8,
  },
  gigPayout: {
    fontSize: 18,
    fontFamily: 'Satoshi-Bold',
    color: '#780000',
  },
  gigDescription: {
    fontSize: 14,
    fontFamily: 'Satoshi-Regular',
    color: '#001B2A',
    marginBottom: 12,
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  skillTag: {
    backgroundColor: '#8CABA9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 8,
  },
  skillText: {
    color: '#001B2A',
    fontSize: 12,
    fontFamily: 'Satoshi-Medium',
  },
  gigFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  deadline: {
    fontSize: 12,
    fontFamily: 'Satoshi-Regular',
    color: '#8CABA9',
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  status_open: {
    backgroundColor: '#780000',
  },
  status_in_review: {
    backgroundColor: '#9E1F19',
  },
  status_completed: {
    backgroundColor: '#8CABA9',
  },
});


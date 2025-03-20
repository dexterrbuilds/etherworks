import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, FlatList } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { dummyGigs } from '../data/gigs';
import type { Gig } from '../types/gig';
import { Feather } from '@expo/vector-icons'; // Assuming you're using Expo

type TabType = 'open' | 'in_review' | 'completed';
type CategoryType = 'all' | 'Content Creation' | 'Design' | 'Development';

// Define tab data for easier management
const TABS: Array<{id: TabType; label: string}> = [
  { id: 'open', label: 'Open Gigs' },
  { id: 'in_review', label: 'In Review' },
  { id: 'completed', label: 'Completed' }
];

// Define category data
const CATEGORIES: Array<{id: CategoryType; label: string}> = [
  { id: 'all', label: 'All Opportunities' },
  { id: 'Content Creation', label: 'Content Creation' },
  { id: 'Design', label: 'Design' },
  { id: 'Development', label: 'Development' }
];

export default function HomeScreen() {
  const [activeTab, setActiveTab] = useState<TabType>('open');
  const [activeCategory, setActiveCategory] = useState<CategoryType>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const navigation = useNavigation<any>();

  // Use useMemo to prevent unnecessary recalculations on each render
  const filteredGigs = useMemo(() => {
    return dummyGigs.filter(gig => {
      const statusMatch = gig.status === activeTab;
      const categoryMatch = activeCategory === 'all' || gig.category === activeCategory;
      return statusMatch && categoryMatch;
    });
  }, [activeTab, activeCategory]);

  // Simulate a refresh
  const handleRefresh = () => {
    setIsRefreshing(true);
    // In a real app, you would fetch new data here
    setTimeout(() => setIsRefreshing(false), 1500);
  };

  const renderTab = ({ id, label }: {id: TabType; label: string}) => (
    <TouchableOpacity
      key={id}
      onPress={() => setActiveTab(id)}
      style={[
        styles.tab,
        activeTab === id && styles.activeTab
      ]}
      accessibilityRole="tab"
      accessibilityState={{ selected: activeTab === id }}
    >
      <Text style={[
        styles.tabText,
        activeTab === id && styles.activeTabText
      ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  const renderCategoryFilter = ({ id, label }: {id: CategoryType; label: string}) => (
    <TouchableOpacity
      key={id}
      onPress={() => setActiveCategory(id)}
      style={[
        styles.categoryFilter,
        activeCategory === id && styles.activeCategoryFilter
      ]}
      accessibilityRole="button"
      accessibilityState={{ selected: activeCategory === id }}
    >
      <Text style={[
        styles.categoryFilterText,
        activeCategory === id && styles.activeCategoryFilterText
      ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  const renderGigCard = ({ item }: { item: Gig }) => (
    <TouchableOpacity
      style={styles.gigCard}
      onPress={() => navigation.navigate('GigDetails', { gigId: item.id })}
      accessibilityRole="button"
      accessibilityLabel={`${item.title} gig, payout $${item.payout}`}
    >
      <View style={styles.gigHeader}>
        <Text style={styles.gigTitle} numberOfLines={1} ellipsizeMode="tail">{item.title}</Text>
        <Text style={styles.gigPayout}>${item.payout}</Text>
      </View>
      <Text style={styles.gigDescription} numberOfLines={2} ellipsizeMode="tail">{item.description}</Text>
      
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.skillsScrollView}>
        <View style={styles.skillsContainer}>
          {item.skills.map((skill, index) => (
            <View key={index} style={styles.skillTag}>
              <Text style={styles.skillText}>{skill}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
      
      <View style={styles.gigFooter}>
        <View style={styles.deadlineContainer}>
          <Feather name="clock" size={12} color="#8CABA9" style={styles.deadlineIcon} />
          <Text style={styles.deadline}>Deadline: {item.deadline}</Text>
        </View>
        <View style={styles.statusContainer}>
          <View style={[styles.statusIndicator, styles[`status_${item.status}`]]} />
          <Text style={styles.statusText}>
            {item.status === 'open' ? 'Open' : item.status === 'in_review' ? 'In Review' : 'Completed'}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Feather name="search" size={40} color="#8CABA9" />
      <Text style={styles.emptyStateTitle}>No gigs found</Text>
      <Text style={styles.emptyStateText}>
        There are no {activeCategory !== 'all' ? activeCategory + ' ' : ''}gigs 
        {activeTab === 'open' ? ' available' : activeTab === 'in_review' ? ' in review' : ' completed'} at the moment.
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Tabs section */}
      <View style={styles.tabsBackground}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          style={styles.tabsContainer} 
          contentContainerStyle={styles.tabsContent}
        >
          {TABS.map(renderTab)}
        </ScrollView>
      </View>

      {/* Categories section */}
      <View style={styles.categoriesBackground}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          style={styles.categoriesContainer} 
          contentContainerStyle={styles.categoriesContent}
        >
          {CATEGORIES.map(renderCategoryFilter)}
        </ScrollView>
      </View>

      {/* Gigs list */}
      <FlatList
        data={filteredGigs}
        renderItem={renderGigCard}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.gigsContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmptyState}
        onRefresh={handleRefresh}
        refreshing={isRefreshing}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ECEDEE',
  },
  tabsBackground: {
    backgroundColor: '#001B2A',
    paddingVertical: 12,
  },
  tabsContainer: {
    height: 48,
  },
  tabsContent: {
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  tab: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    height: 48,
    justifyContent: 'center',
    marginRight: 12,
    borderRadius: 24,
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
  categoriesBackground: {
    backgroundColor: '#ECEDEE',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  categoriesContainer: {
    height: 32,
  },
  categoriesContent: {
    paddingHorizontal: 16,
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
    flexGrow: 1,
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
    lineHeight: 20,
  },
  skillsScrollView: {
    marginBottom: 12,
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
  },
  skillTag: {
    backgroundColor: '#8CABA9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
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
  deadlineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deadlineIcon: {
    marginRight: 4,
  },
  deadline: {
    fontSize: 12,
    fontFamily: 'Satoshi-Regular',
    color: '#8CABA9',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 4,
  },
  statusText: {
    fontSize: 12,
    fontFamily: 'Satoshi-Medium',
    color: '#001B2A',
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
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontFamily: 'Satoshi-Bold',
    color: '#001B2A',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    fontFamily: 'Satoshi-Regular',
    color: '#8CABA9',
    textAlign: 'center',
    lineHeight: 20,
  },
});
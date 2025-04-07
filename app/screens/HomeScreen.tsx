import React, { useState, useMemo, useCallback } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  StyleSheet, 
  FlatList,
  RefreshControl,
  StatusBar,
  TextInput,
  Image
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { dummyGigs } from '../data/gigs';
import type { Gig } from '../types/gig';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type TabType = 'open' | 'in_review' | 'completed';
type CategoryType = 'all' | 'Content Creation' | 'Design' | 'Development';

// Define tab data for easier management
const TABS: Array<{id: TabType; label: string; icon: string}> = [
  { id: 'open', label: 'Open Gigs', icon: 'calendar' },
  { id: 'in_review', label: 'In Review', icon: 'clock' },
  { id: 'completed', label: 'Completed', icon: 'check-circle' }
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
  const [searchTerm, setSearchTerm] = useState('');
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();

  // Use useMemo to prevent unnecessary recalculations on each render
  const filteredGigs = useMemo(() => {
    return dummyGigs.filter(gig => {
      const statusMatch = gig.status === activeTab;
      const categoryMatch = activeCategory === 'all' || gig.category === activeCategory;
      const searchMatch = searchTerm === '' || 
        gig.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        gig.description.toLowerCase().includes(searchTerm.toLowerCase());
      
      return statusMatch && categoryMatch && searchMatch;
    });
  }, [activeTab, activeCategory, searchTerm]);

  // Simulate a refresh - improved with useCallback
  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    // In a real app, you would fetch new data here
    setTimeout(() => setIsRefreshing(false), 1500);
  }, []);

  const handleTabPress = useCallback((id: TabType) => {
    setActiveTab(id);
  }, []);

  const handleCategoryPress = useCallback((id: CategoryType) => {
    setActiveCategory(id);
  }, []);

  const navigateToGigDetails = useCallback((gigId: number) => {
    navigation.navigate('GigDetails', { gigId });
  }, [navigation]);

  const navigateToProfile = useCallback(() => {
    navigation.navigate('Profile');
  }, [navigation]);

  const renderTab = useCallback(({ id, label, icon }: {id: TabType; label: string; icon: string}) => (
    <TouchableOpacity
      key={id}
      onPress={() => handleTabPress(id)}
      style={[
        styles.tab,
        activeTab === id && styles.activeTab
      ]}
      accessibilityRole="tab"
      accessibilityState={{ selected: activeTab === id }}
      accessible={true}
      accessibilityLabel={`${label} tab`}
    >
      <Feather name={icon as any} size={16} color={activeTab === id ? '#ECEDEE' : '#8CABA9'} style={styles.tabIcon} />
      <Text style={[
        styles.tabText,
        activeTab === id && styles.activeTabText
      ]}>
        {label}
      </Text>
    </TouchableOpacity>
  ), [activeTab, handleTabPress]);

  const renderCategoryFilter = useCallback(({ id, label }: {id: CategoryType; label: string}) => (
    <TouchableOpacity
      key={id}
      onPress={() => handleCategoryPress(id)}
      style={[
        styles.categoryFilter,
        activeCategory === id && styles.activeCategoryFilter
      ]}
      accessibilityRole="button"
      accessibilityState={{ selected: activeCategory === id }}
      accessible={true}
      accessibilityLabel={`${label} category filter`}
    >
      <Text style={[
        styles.categoryFilterText,
        activeCategory === id && styles.activeCategoryFilterText
      ]}>
        {label}
      </Text>
    </TouchableOpacity>
  ), [activeCategory, handleCategoryPress]);

  const renderGigCard = useCallback(({ item }: { item: Gig }) => {
    const deadlineDate = new Date(item.deadline);
    const today = new Date();
    const isUrgent = deadlineDate <= today || 
      (deadlineDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24) <= 2;
    
    return (
      <TouchableOpacity
        style={[styles.gigCard, isUrgent && styles.urgentGigCard]}
        onPress={() => navigateToGigDetails(Number(item.id))}
        accessibilityRole="button"
        accessibilityLabel={`${item.title} gig, payout $${item.payout}, deadline ${item.deadline}`}
        accessible={true}
        activeOpacity={0.7}
      >
        <View style={styles.gigCardInner}>
          <View style={styles.gigHeader}>
            <View style={styles.gigTitleContainer}>
              <Text style={styles.gigTitle} numberOfLines={1} ellipsizeMode="tail">
                {item.title}
              </Text>
              <View style={styles.clientInfoContainer}>
                <Feather name="user" size={12} color="#B0C4DE" />
                <Text style={styles.clientInfo}>{item.client || "Anonymous Client"}</Text>
              </View>
            </View>
            <View style={styles.payoutContainer}>
              <Text style={styles.payoutLabel}>Reward</Text>
              <Text style={styles.gigPayout}>${item.payout}</Text>
            </View>
          </View>
          
          <Text style={styles.gigDescription} numberOfLines={2} ellipsizeMode="tail">
            {item.description}
          </Text>
          
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            style={styles.skillsScrollView}
            contentContainerStyle={styles.skillsContentContainer}
          >
            {item.skills.map((skill, index) => (
              <View key={index} style={styles.skillTag}>
                <Text style={styles.skillText}>{skill}</Text>
              </View>
            ))}
          </ScrollView>
          
          <View style={styles.gigFooter}>
            <View style={styles.deadlineContainer}>
              <Feather 
                name="clock" 
                size={14} 
                color={isUrgent ? "#87CEEB" : "#B0C4DE"} 
                style={styles.deadlineIcon} 
              />
              <Text style={[
                styles.deadline, 
                isUrgent && styles.urgentDeadline
              ]}>
                Due: {formatDate(item.deadline)}
              </Text>
            </View>
            <View style={styles.statusSection}>
              <View style={styles.statusContainer}>
                <View style={[styles.statusIndicator, styles[`status_${item.status}`]]} />
                <Text style={styles.statusText}>
                  {item.status === 'open' ? 'Open' : item.status === 'in_review' ? 'In Review' : 'Completed'}
                </Text>
              </View>
              {isUrgent && (
                <View style={styles.urgentBadge}>
                  <Feather name="alert-circle" size={10} color="#87CEEB" style={styles.urgentIcon} />
                  <Text style={styles.urgentBadgeText}>Urgent</Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  }, [navigateToGigDetails]);

  const renderEmptyState = useCallback(() => (
    <View style={styles.emptyState}>
      <Feather name="search" size={40} color="#8CABA9" />
      <Text style={styles.emptyStateTitle}>No gigs found</Text>
      <Text style={styles.emptyStateText}>
        There are no {activeCategory !== 'all' ? activeCategory + ' ' : ''}gigs
        {activeTab === 'open' ? ' available' : activeTab === 'in_review' ? ' in review' : ' completed'} at the moment.
      </Text>
      <TouchableOpacity 
        style={styles.refreshButton}
        onPress={handleRefresh}
        accessibilityRole="button"
        accessibilityLabel="Refresh gig list"
      >
        <Text style={styles.refreshButtonText}>Refresh</Text>
      </TouchableOpacity>
    </View>
  ), [activeCategory, activeTab, handleRefresh]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    }
    
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    }
    
    // For dates within the next 6 days, show day name
    const withinWeek = (date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24) < 7;
    if (withinWeek) {
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    }
    
    // Otherwise show formatted date
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <View style={[
      styles.container,
      { paddingTop: insets.top }
    ]}>
      <StatusBar barStyle="light-content" backgroundColor="#001B2A" />
      
      {/* Improved search bar */}
      <View style={styles.searchBarContainer}>
        <Feather name="search" size={16} color="#8CABA9" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search gigs..."
          placeholderTextColor="#8CABA9"
          value={searchTerm}
          onChangeText={setSearchTerm}
        />
        {searchTerm ? (
          <TouchableOpacity onPress={() => setSearchTerm('')}>
            <Feather name="x" size={16} color="#8CABA9" />
          </TouchableOpacity>
        ) : null}
      </View>
      
      {/* Tabs section */}
      <View style={styles.tabsBackground}>
        <View style={styles.tabsContainer}>
          {TABS.map(renderTab)}
        </View>
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
      {filteredGigs.length > 0 ? (
        <FlatList
          data={filteredGigs}
          renderItem={renderGigCard}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.gigsContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              colors={['#780000']}
              tintColor="#780000"
            />
          }
        />
      ) : renderEmptyState()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2E1A47', // Dark indigo background
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3D2959', // Slightly lighter than background
    marginHorizontal: 16,
    marginVertical: 10,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(138, 43, 226, 0.3)', // Subtle purple border
  },
  searchIcon: {
    marginRight: 8,
    color: '#B0C4DE', // Light slate
  },
  searchInput: {
    flex: 1,
    color: '#FFFFFF', // White text
    fontSize: 14,
    fontFamily: 'Satoshi-Regular',
    padding: 0,
    height: 20,
  },
  tabsBackground: {
    backgroundColor: '#2E1A47', // Dark indigo
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(138, 43, 226, 0.2)', // Subtle purple border
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    justifyContent: 'space-between',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(138, 43, 226, 0.2)', // Transparent purple
    marginHorizontal: 4,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  activeTab: {
    backgroundColor: '#8A2BE2', // Electric purple
  },
  tabIcon: {
    marginRight: 6,
  },
  tabText: {
    color: '#B0C4DE', // Light slate
    fontSize: 14,
    fontFamily: 'Satoshi-Medium',
  },
  activeTabText: {
    color: '#FFFFFF', // White
  },
  categoriesBackground: {
    backgroundColor: '#2E1A47', // Dark indigo
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(138, 43, 226, 0.2)', // Subtle purple border
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
    backgroundColor: 'rgba(138, 43, 226, 0.2)', // Transparent purple
    borderWidth: 1,
    borderColor: 'rgba(138, 43, 226, 0.5)', // Subtle purple border
  },
  activeCategoryFilter: {
    backgroundColor: '#8A2BE2', // Electric purple
    borderColor: '#8A2BE2',
  },
  categoryFilterText: {
    color: '#B0C4DE', // Light slate
    fontSize: 14,
    fontFamily: 'Satoshi-Medium',
  },
  activeCategoryFilterText: {
    color: '#FFFFFF', // White
  },
  gigsContainer: {
    padding: 16,
    flexGrow: 1,
  },
  gigCard: {
    backgroundColor: '#3D2959', // Slightly lighter than background
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  gigCardInner: {
    padding: 16,
    borderRadius: 16,
    position: 'relative',
    borderLeftWidth: 0,
    borderLeftColor: 'transparent',
  },
  urgentGigCard: {
    borderWidth: 1,
    borderColor: '#87CEEB', // Sky blue
  },
  urgentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(135, 206, 235, 0.2)', // Transparent sky blue
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#87CEEB', // Sky blue
    marginLeft: 8,
  },
  urgentIcon: {
    marginRight: 4,
  },
  urgentBadgeText: {
    color: '#87CEEB', // Sky blue
    fontSize: 10,
    fontFamily: 'Satoshi-Bold',
  },
  gigHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  gigTitleContainer: {
    flex: 1,
    marginRight: 12,
  },
  gigTitle: {
    fontSize: 18,
    fontFamily: 'Satoshi-Bold',
    color: '#FFFFFF', // White
    flex: 1,
    marginBottom: 6,
  },
  payoutContainer: {
    alignItems: 'flex-end',
    backgroundColor: 'rgba(138, 43, 226, 0.15)', // Very subtle purple
    borderRadius: 8,
    padding: 8,
  },
  payoutLabel: {
    fontSize: 10,
    fontFamily: 'Satoshi-Medium',
    color: '#B0C4DE', // Light slate
    marginBottom: 2,
  },
  gigPayout: {
    fontSize: 18,
    fontFamily: 'Satoshi-Bold',
    color: '#8A2BE2', // Electric purple
  },
  gigDescription: {
    fontSize: 14,
    fontFamily: 'Satoshi-Regular',
    color: '#B0C4DE', // Light slate
    marginBottom: 14,
    lineHeight: 20,
  },
  clientInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  clientInfo: {
    fontSize: 12,
    fontFamily: 'Satoshi-Medium',
    color: '#B0C4DE', // Light slate
    marginLeft: 4,
  },
  skillsScrollView: {
    marginBottom: 14,
  },
  skillsContentContainer: {
    paddingVertical: 4,
  },
  skillTag: {
    backgroundColor: 'rgba(135, 206, 235, 0.15)', // Transparent sky blue
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'rgba(135, 206, 235, 0.3)', // Subtle sky blue border
  },
  skillText: {
    color: '#87CEEB', // Sky blue
    fontSize: 12,
    fontFamily: 'Satoshi-Medium',
  },
  gigFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(138, 43, 226, 0.2)', // Subtle purple border
  },
  deadlineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deadlineIcon: {
    marginRight: 6,
  },
  deadline: {
    fontSize: 13,
    fontFamily: 'Satoshi-Regular',
    color: '#B0C4DE', // Light slate
  },
  urgentDeadline: {
    color: '#87CEEB', // Sky blue
    fontFamily: 'Satoshi-Bold',
  },
  statusSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(138, 43, 226, 0.15)', // Very subtle purple
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontFamily: 'Satoshi-Medium',
    color: '#FFFFFF', // White
  },
  status_open: {
    backgroundColor: '#8A2BE2', // Electric purple
  },
  status_in_review: {
    backgroundColor: '#87CEEB', // Sky blue
  },
  status_completed: {
    backgroundColor: '#B0C4DE', // Light slate
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    flex: 1,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontFamily: 'Satoshi-Bold',
    color: '#FFFFFF', // White
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    fontFamily: 'Satoshi-Regular',
    color: '#B0C4DE', // Light slate
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  refreshButton: {
    backgroundColor: '#8A2BE2', // Electric purple
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  refreshButtonText: {
    color: '#FFFFFF', // White
    fontSize: 16,
    fontFamily: 'Satoshi-Medium',
  },
});
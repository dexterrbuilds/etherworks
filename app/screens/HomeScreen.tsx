import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
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
  Image,
  ActivityIndicator,
  Animated,
  Modal,
  Dimensions,
  Switch,
  Pressable
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { db } from '../../firebaseConfig';
import { collection, getDocs, query, orderBy, where, limit } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

type TabType = 'Open' | 'In Review' | 'Completed';
type CategoryType = 'all' | 'Content Creation' | 'Design' | 'Development' | 'Marketing' | 'Customer Support' | 'Research' | 'Data Entry' | 'Other';
type SortType = 'newest' | 'highest_paid' | 'deadline';

// Map from internal status to display status
const STATUS_MAP = {
  'Open': 'Open',
  'In Review': 'In Review',
  'Completed': 'Completed'
};

// Define tab data for easier management
const TABS: Array<{id: TabType; label: string; icon: string}> = [
  { id: 'Open', label: 'Open Gigs', icon: 'calendar' },
  { id: 'In Review', label: 'In Review', icon: 'clock' },
  { id: 'Completed', label: 'Completed', icon: 'check-circle' }
];

// Define category data based on the categories in AdminDashboard
const CATEGORIES: Array<{id: CategoryType; label: string}> = [
  { id: 'all', label: 'All Opportunities' },
  { id: 'Design', label: 'Design' },
  { id: 'Development', label: 'Development' },
  { id: 'Writing', label: 'Writing' },
  { id: 'Marketing', label: 'Marketing' },
  { id: 'Customer Support', label: 'Customer Support' },
  { id: 'Research', label: 'Research' },
  { id: 'Data Entry', label: 'Data Entry' },
  { id: 'Other', label: 'Other' }
];

// Define sort options
const SORT_OPTIONS: Array<{id: SortType; label: string; icon: string}> = [
  { id: 'newest', label: 'Newest First', icon: 'clock' },
  { id: 'highest_paid', label: 'Highest Paid', icon: 'dollar-sign' },
  { id: 'deadline', label: 'Soonest Deadline', icon: 'alert-circle' }
];

export default function HomeScreen() {
  const [activeTab, setActiveTab] = useState<TabType>('Open');
  const [activeCategory, setActiveCategory] = useState<CategoryType>('all');
  const [activeSortOption, setActiveSortOption] = useState<SortType>('newest');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [gigs, setGigs] = useState([]);
  const [favoriteGigs, setFavoriteGigs] = useState({});
  const [recommendedGigs, setRecommendedGigs] = useState([]);
  const [featuredGigs, setFeaturedGigs] = useState([]);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [payoutRange, setPayoutRange] = useState([0, 5000]);
  const [maxDuration, setMaxDuration] = useState('');
  const [remoteOnly, setRemoteOnly] = useState(false);
  const [filterPanelVisible, setFilterPanelVisible] = useState(false);
  
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  
  // Animation values
  const filterPanelHeight = useRef(new Animated.Value(0)).current;
  
  // Load favorites from storage on component mount
  useEffect(() => {
    const loadFavorites = async () => {
      try {
        const storedFavorites = await AsyncStorage.getItem('favoriteGigs');
        if (storedFavorites) {
          setFavoriteGigs(JSON.parse(storedFavorites));
        }
      } catch (error) {
        console.error('Error loading favorites:', error);
      }
    };
    
    loadFavorites();
  }, []);
  
  // Fetch gigs from Firestore
  const fetchGigs = useCallback(async () => {
    setIsLoading(true);
    try {
      let gigsQuery = collection(db, 'gigs');
      
      // We're retrieving all gigs and will filter them in-memory
      // for better user experience when switching tabs/categories
      gigsQuery = query(gigsQuery, orderBy('createdAt', 'desc'));
      
      const querySnapshot = await getDocs(gigsQuery);
      const gigsData = [];
      
      querySnapshot.forEach((doc) => {
        gigsData.push({ 
          id: doc.id, 
          ...doc.data(),
          // Set a default status if none exists
          status: doc.data().status || 'Open'
        });
      });
      
      // Prepare featured and recommended gigs
      const featured = gigsData
        .filter(gig => gig.status === 'Open')
        .sort(() => 0.5 - Math.random())
        .slice(0, 5);
      
      setFeaturedGigs(featured);
      
      // Simple recommendation algorithm based on highest paying gigs
      const recommended = gigsData
        .filter(gig => gig.status === 'Open')
        .sort((a, b) => b.payout - a.payout)
        .slice(0, 5);
      
      setRecommendedGigs(recommended);
      setGigs(gigsData);
    } catch (error) {
      console.error('Error fetching gigs:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchGigs();
  }, [fetchGigs]);
  
  // Toggle favorite status
  const toggleFavorite = useCallback(async (gigId) => {
    try {
      const updatedFavorites = { ...favoriteGigs };
      
      if (updatedFavorites[gigId]) {
        delete updatedFavorites[gigId];
      } else {
        updatedFavorites[gigId] = true;
      }
      
      setFavoriteGigs(updatedFavorites);
      await AsyncStorage.setItem('favoriteGigs', JSON.stringify(updatedFavorites));
    } catch (error) {
      console.error('Error updating favorites:', error);
    }
  }, [favoriteGigs]);
  
  // Toggle filter panel
  const toggleFilterPanel = useCallback(() => {
    const toValue = filterPanelVisible ? 0 : 180;
    
    Animated.timing(filterPanelHeight, {
      toValue,
      duration: 300,
      useNativeDriver: false,
    }).start();
    
    setFilterPanelVisible(!filterPanelVisible);
  }, [filterPanelVisible, filterPanelHeight]);

  // Apply filter and sorting logic to gigs
  const filteredAndSortedGigs = useMemo(() => {
    // Start with basic filters (tab, category, search)
    let filtered = gigs.filter(gig => {
      const statusMatch = gig.status === activeTab;
      const categoryMatch = activeCategory === 'all' || gig.category === activeCategory;
      const searchMatch = searchTerm === '' || 
        gig.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        gig.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (gig.skills && gig.skills.some(skill => 
          skill.toLowerCase().includes(searchTerm.toLowerCase())
        ));
      
      // Apply advanced filters
      const payoutMatch = gig.payout >= payoutRange[0] && gig.payout <= payoutRange[1];
      const durationMatch = !maxDuration || !gig.duration || 
        (gig.duration.toLowerCase().includes('day') && parseInt(gig.duration) <= parseInt(maxDuration)) ||
        (gig.duration.toLowerCase().includes('week') && parseInt(gig.duration) * 7 <= parseInt(maxDuration)) ||
        (gig.duration.toLowerCase().includes('hour') && parseInt(gig.duration) / 24 <= parseInt(maxDuration));
      const locationMatch = !remoteOnly || (gig.location && gig.location.toLowerCase() === 'remote');
      
      return statusMatch && categoryMatch && searchMatch && payoutMatch && durationMatch && locationMatch;
    });
    
    // Apply sorting
    return filtered.sort((a, b) => {
      if (activeSortOption === 'newest') {
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      } else if (activeSortOption === 'highest_paid') {
        return b.payout - a.payout;
      } else if (activeSortOption === 'deadline') {
        const aDeadline = a.deadline ? new Date(a.deadline).getTime() : Infinity;
        const bDeadline = b.deadline ? new Date(b.deadline).getTime() : Infinity;
        return aDeadline - bDeadline;
      }
      return 0;
    });
  }, [gigs, activeTab, activeCategory, searchTerm, payoutRange, maxDuration, remoteOnly, activeSortOption]);
  
  // Filtered list of only favorite gigs
  const favoriteGigsList = useMemo(() => {
    return filteredAndSortedGigs.filter(gig => favoriteGigs[gig.id]);
  }, [filteredAndSortedGigs, favoriteGigs]);

  // Handle refresh - now actually refetches data
  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    fetchGigs();
  }, [fetchGigs]);

  const handleTabPress = useCallback((id: TabType) => {
    setActiveTab(id);
  }, []);

  const handleCategoryPress = useCallback((id: CategoryType) => {
    setActiveCategory(id);
  }, []);
  
  const handleSortOptionPress = useCallback((id: SortType) => {
    setActiveSortOption(id);
  }, []);

  const navigateToGigDetails = useCallback((gigId: string) => {
    navigation.navigate('GigDetails', { gigId });
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
      <Feather name={icon as any} size={16} color={activeTab === id ? '#FFFFFF' : '#B0C4DE'} style={styles.tabIcon} />
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
  
  const renderSortOption = useCallback(({ id, label, icon }: {id: SortType; label: string; icon: string}) => (
    <TouchableOpacity
      key={id}
      onPress={() => handleSortOptionPress(id)}
      style={[
        styles.sortOption,
        activeSortOption === id && styles.activeSortOption
      ]}
      accessibilityRole="button"
      accessibilityState={{ selected: activeSortOption === id }}
      accessible={true}
      accessibilityLabel={`Sort by ${label}`}
    >
      <Feather name={icon as any} size={14} color={activeSortOption === id ? '#FFFFFF' : '#B0C4DE'} style={styles.sortOptionIcon} />
      <Text style={[
        styles.sortOptionText,
        activeSortOption === id && styles.activeSortOptionText
      ]}>
        {label}
      </Text>
    </TouchableOpacity>
  ), [activeSortOption, handleSortOptionPress]);

  const renderGigCard = useCallback(({ item, isFeatured = false }) => {
    // Check if there's a deadline, otherwise use a default date (7 days from creation)
    const createdDate = item.createdAt ? new Date(item.createdAt) : new Date();
    const defaultDeadline = new Date(createdDate);
    defaultDeadline.setDate(defaultDeadline.getDate() + 7);
    
    const deadlineDate = item.deadline ? new Date(item.deadline) : defaultDeadline;
    const today = new Date();
    const isUrgent = deadlineDate <= today || 
      (deadlineDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24) <= 2;
    
    const isFavorite = favoriteGigs[item.id] === true;
    
    return (
      <TouchableOpacity
        style={[
          styles.gigCard, 
          isUrgent && styles.urgentGigCard,
          isFeatured && styles.featuredGigCard
        ]}
        onPress={() => navigateToGigDetails(item.id)}
        accessibilityRole="button"
        accessibilityLabel={`${item.title} gig, payout $${item.payout}`}
        accessible={true}
        activeOpacity={0.7}
      >
        {isFeatured && (
          <View style={styles.featuredBadge}>
            <Feather name="star" size={12} color="#FFFFFF" style={styles.featuredIcon} />
            <Text style={styles.featuredBadgeText}>Featured</Text>
          </View>
        )}
        
        <TouchableOpacity 
          style={[styles.favoriteButton, isFavorite && styles.favoriteButtonActive]}
          onPress={() => toggleFavorite(item.id)}
          hitSlop={{ top: 20, right: 20, bottom: 20, left: 20 }}
        >
          <Feather 
            name={isFavorite ? "heart" : "heart"} 
            size={16} 
            color={isFavorite ? "#FFFFFF" : "rgba(255,255,255,0.5)"} 
            style={{ opacity: isFavorite ? 1 : 0.7 }}
          />
        </TouchableOpacity>
        
        <View style={styles.gigCardInner}>
          {item.imageBase64 ? (
            <View style={styles.imageContainer}>
              <Image 
                source={{ uri: item.imageBase64 }} 
                style={styles.gigImage} 
                resizeMode="cover"
              />
              <LinearGradient
                colors={['transparent', 'rgba(46, 26, 71, 0.95)']}
                style={styles.imageGradient}
              />
            </View>
          ) : (
            <LinearGradient
              colors={['#8A2BE2', '#2E1A47']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.noImageGradient}
            >
              <Feather name="briefcase" size={32} color="rgba(255,255,255,0.2)" />
            </LinearGradient>
          )}
          
          <View style={styles.gigHeader}>
            <View style={styles.gigTitleContainer}>
              <Text style={styles.gigTitle} numberOfLines={1} ellipsizeMode="tail">
                {item.title}
              </Text>
              <View style={styles.clientInfoContainer}>
                <Feather name="briefcase" size={12} color="#B0C4DE" />
                <Text style={styles.clientInfo}>{item.projectName || "Unnamed Project"}</Text>
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
          
          {item.skills && item.skills.length > 0 && (
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
          )}
          
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
                Est. Time: {item.duration || "Not specified"}
              </Text>
            </View>
            <View style={styles.statusSection}>
              <View style={styles.statusContainer}>
                <View style={[styles.statusIndicator, styles[`status_${item.status.toLowerCase().replace(' ', '_')}`]]} />
                <Text style={styles.statusText}>
                  {STATUS_MAP[item.status] || item.status}
                </Text>
              </View>
              {item.location && (
                <View style={styles.locationBadge}>
                  <Feather name="map-pin" size={10} color="#B0C4DE" style={styles.locationIcon} />
                  <Text style={styles.locationText}>{item.location}</Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  }, [navigateToGigDetails, favoriteGigs, toggleFavorite]);
  
  const renderHorizontalGigCard = useCallback(({ item, type }) => {
    const isFavorite = favoriteGigs[item.id] === true;
    const label = type === 'recommended' ? 'Recommended' : 'Featured';
    
    return (
      <TouchableOpacity
        style={styles.horizontalGigCard}
        onPress={() => navigateToGigDetails(item.id)}
        activeOpacity={0.7}
      >
        <TouchableOpacity 
          style={[styles.horizontalFavoriteButton, isFavorite && styles.favoriteButtonActive]}
          onPress={() => toggleFavorite(item.id)}
          hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
        >
          <Feather 
            name={isFavorite ? "heart" : "heart"} 
            size={14} 
            color={isFavorite ? "#FFFFFF" : "rgba(255,255,255,0.5)"} 
          />
        </TouchableOpacity>
        
        {type === 'recommended' ? (
          <View style={styles.recommendedBadge}>
            <Feather name="zap" size={10} color="#FFFFFF" />
            <Text style={styles.recommendedBadgeText}>For You</Text>
          </View>
        ) : (
          <View style={styles.featuredSmallBadge}>
            <Feather name="star" size={10} color="#FFFFFF" />
            <Text style={styles.featuredSmallBadgeText}>Featured</Text>
          </View>
        )}
        
        {item.imageBase64 ? (
          <Image 
            source={{ uri: item.imageBase64 }} 
            style={styles.horizontalGigImage} 
            resizeMode="cover"
          />
        ) : (
          <LinearGradient
            colors={['#8A2BE2', '#2E1A47']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.horizontalNoImageGradient}
          >
            <Feather name="briefcase" size={24} color="rgba(255,255,255,0.2)" />
          </LinearGradient>
        )}
        
        <View style={styles.horizontalGigInfo}>
          <Text style={styles.horizontalGigTitle} numberOfLines={1}>
            {item.title}
          </Text>
          
          <View style={styles.horizontalGigMeta}>
            <Text style={styles.horizontalGigCategory}>
              {item.category || 'General'}
            </Text>
            <Text style={styles.horizontalGigPayout}>
              ${item.payout}
            </Text>
          </View>
          
          {item.skills && item.skills.length > 0 && (
            <View style={styles.horizontalSkillsContainer}>
              <Text style={styles.horizontalSkillsLabel}>Skills: </Text>
              <Text style={styles.horizontalSkillsList} numberOfLines={1}>
                {item.skills.slice(0, 3).join(', ')}
                {item.skills.length > 3 ? '...' : ''}
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  }, [navigateToGigDetails, favoriteGigs, toggleFavorite]);

  const renderEmptyState = useCallback(() => (
    <View style={styles.emptyState}>
      <Feather name="search" size={40} color="#8CABA9" />
      <Text style={styles.emptyStateTitle}>No gigs found</Text>
      <Text style={styles.emptyStateText}>
        There are no {activeCategory !== 'all' ? activeCategory + ' ' : ''}gigs
        {activeTab === 'Open' ? ' available' : activeTab === 'In Review' ? ' in review' : ' completed'} matching your filters.
      </Text>
      <TouchableOpacity 
        style={styles.refreshButton}
        onPress={() => {
          // Reset filters
          setPayoutRange([0, 5000]);
          setMaxDuration('');
          setRemoteOnly(false);
          handleRefresh();
        }}
        accessibilityRole="button"
        accessibilityLabel="Reset filters and refresh"
      >
        <Text style={styles.refreshButtonText}>Reset Filters & Refresh</Text>
      </TouchableOpacity>
    </View>
  ), [activeCategory, activeTab, handleRefresh]);

  const renderLoading = useCallback(() => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#8A2BE2" />
      <Text style={styles.loadingText}>Loading gigs...</Text>
    </View>
  ), []);
  
  const renderHorizontalSection = useCallback((title, data, type) => {
    if (!data || data.length === 0) return null;
    
    return (
      <View style={styles.horizontalSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{title}</Text>
          {data.length > 0 && (
            <TouchableOpacity 
              onPress={() => {
                // If recommended, it would sort by highest paid
                // If featured, it would keep normal sorting
                if (type === 'recommended') {
                  setActiveSortOption('highest_paid');
                }
              }}
            >
              <Text style={styles.sectionViewAll}>View All</Text>
            </TouchableOpacity>
          )}
        </View>
        
        <FlatList
          horizontal
          data={data}
          renderItem={({ item }) => renderHorizontalGigCard({ item, type })}
          keyExtractor={item => item.id}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalListContent}
          ItemSeparatorComponent={() => <View style={{ width: 12 }} />}
        />
      </View>
    );
  }, [renderHorizontalGigCard]);

  return (
    <View style={[
      styles.container,
      { paddingTop: insets.top }
    ]}>
      <StatusBar barStyle="light-content" backgroundColor="#2E1A47" />
      
      {/* Search bar and filter button */}
      <View style={styles.searchBarContainer}>
        <Feather name="search" size={16} color="#B0C4DE" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search gigs..."
          placeholderTextColor="#8CABA9"
          value={searchTerm}
          onChangeText={setSearchTerm}
        />
        {searchTerm ? (
          <TouchableOpacity onPress={() => setSearchTerm('')}>
            <Feather name="x" size={16} color="#B0C4DE" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity 
            style={styles.filterButton}
            onPress={toggleFilterPanel}
          >
            <Feather 
              name="sliders" 
              size={16} 
              color="#B0C4DE" 
              style={{ transform: [{ rotate: '90deg' }] }}
            />
          </TouchableOpacity>
        )}
      </View>
      
      {/* Animated filter panel */}
      <Animated.View style={[styles.filterPanel, { height: filterPanelHeight }]}>
        <View style={styles.filterPanelContent}>
          <Text style={styles.filterPanelTitle}>Sort By</Text>
          <View style={styles.sortOptionsContainer}>
            {SORT_OPTIONS.map(renderSortOption)}
          </View>
          
          <View style={styles.filterPanelRow}>
            <Text style={styles.filterOptionLabel}>Remote Only</Text>
            <Switch
              value={remoteOnly}
              onValueChange={setRemoteOnly}
              trackColor={{ false: '#3D2959', true: '#8A2BE2' }}
              thumbColor={remoteOnly ? '#FFFFFF' : '#B0C4DE'}
            />
          </View>
          
          <View style={styles.filterPanelRow}>
            <Text style={styles.filterOptionLabel}>Max Payout Range: ${payoutRange[1]}</Text>
            <TouchableOpacity
              style={styles.resetButton}
              onPress={() => {
                setPayoutRange([0, 5000]);
                setMaxDuration('');
                setRemoteOnly(false);
              }}
            >
              <Text style={styles.resetButtonText}>Reset Filters</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>
      
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
      
      {/* Main content */}
      {isLoading && !isRefreshing ? (
        renderLoading()
      ) : (
        <FlatList
          data={filteredAndSortedGigs}
          renderItem={renderGigCard}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.gigsContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={renderEmptyState}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              colors={['#8A2BE2']}
              tintColor="#8A2BE2"
            />
          }
          ListHeaderComponent={() => (
            <>
              {/* Favorites section */}
              {favoriteGigsList.length > 0 && (
                <View style={styles.favoritesHeader}>
                  <View style={styles.favoritesHeaderLeft}>
                    <Feather name="heart" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                    <Text style={styles.favoritesHeaderTitle}>Your Saved Gigs</Text>
                  </View>
                  <Text style={styles.favoritesCount}>{favoriteGigsList.length} saved</Text>
                </View>
              )}
              
              {/* Recommended Gigs section (horizontal scroll) */}
              {activeTab === 'Open' && recommendedGigs.length > 0 && (
                renderHorizontalSection('Recommended For You', recommendedGigs, 'recommended')
              )}
              
              {/* Featured Gigs section (horizontal scroll) */}
              {activeTab === 'Open' && featuredGigs.length > 0 && (
                renderHorizontalSection('Featured Opportunities', featuredGigs, 'featured')
              )}
              
              {/* All gigs section */}
              {(recommendedGigs.length > 0 || featuredGigs.length > 0 || favoriteGigsList.length > 0) && (
                <View style={styles.allGigsHeader}>
                  <Text style={styles.allGigsTitle}>All Opportunities</Text>
                </View>
              )}
            </>
          )}
        />
      )}
      
      {/* Advanced Filter Modal */}
      <Modal
        visible={showFilterModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowFilterModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Advanced Filters</Text>
              <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                <Feather name="x" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalBody}>
              {/* Payout Range Filter */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Payout Range</Text>
                <View style={styles.rangeContainer}>
                  <Text style={styles.rangeText}>${payoutRange[0]}</Text>
                  <Text style={styles.rangeText}>${payoutRange[1]}</Text>
                </View>
                {/* Here would be a slider component */}
                <View style={styles.dummySlider}>
                  <View style={styles.dummySliderTrack}>
                    <View style={styles.dummySliderFill} />
                  </View>
                  <View style={styles.dummySliderThumb} />
                </View>
              </View>
              
              {/* Duration Filter */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Maximum Duration</Text>
                <TextInput
                  style={styles.filterInput}
                  placeholder="Max days (e.g. 7)"
                  placeholderTextColor="#8CABA9"
                  value={maxDuration}
                  onChangeText={setMaxDuration}
                  keyboardType="numeric"
                />
              </View>
              
              {/* Location Filter */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Location</Text>
                <View style={styles.switchRow}>
                  <Text style={styles.switchLabel}>Remote Only</Text>
                  <Switch
                    value={remoteOnly}
                    onValueChange={setRemoteOnly}
                    trackColor={{ false: '#3D2959', true: '#8A2BE2' }}
                    thumbColor={remoteOnly ? '#FFFFFF' : '#B0C4DE'}
                  />
                </View>
              </View>
            </ScrollView>
            
            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={styles.resetFiltersButton}
                onPress={() => {
                  setPayoutRange([0, 5000]);
                  setMaxDuration('');
                  setRemoteOnly(false);
                }}
              >
                <Text style={styles.resetFiltersText}>Reset</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.applyFiltersButton}
                onPress={() => setShowFilterModal(false)}
              >
                <Text style={styles.applyFiltersText}>Apply Filters</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    padding: 0,
    height: 20,
  },
  filterButton: {
    padding: 4,
  },
  filterPanel: {
    backgroundColor: '#3D2959',
    overflow: 'hidden',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(138, 43, 226, 0.3)', // Subtle purple border
  },
  filterPanelContent: {
    padding: 16,
  },
  filterPanelTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  sortOptionsContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  sortOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(138, 43, 226, 0.2)', // Transparent purple
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'rgba(138, 43, 226, 0.5)', // Subtle purple border
  },
  activeSortOption: {
    backgroundColor: '#8A2BE2', // Electric purple
    borderColor: '#8A2BE2',
  },
  sortOptionIcon: {
    marginRight: 6,
  },
  sortOptionText: {
    color: '#B0C4DE', // Light slate
    fontSize: 13,
  },
  activeSortOptionText: {
    color: '#FFFFFF', // White
    fontWeight: '600',
  },
  filterPanelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 8,
  },
  filterOptionLabel: {
    color: '#B0C4DE',
    fontSize: 14,
  },
  resetButton: {
    backgroundColor: 'rgba(138, 43, 226, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  resetButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
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
    fontWeight: '500',
  },
  activeTabText: {
    color: '#FFFFFF', // White
    fontWeight: '600',
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
    fontWeight: '500',
  },
  activeCategoryFilterText: {
    color: '#FFFFFF', // White
    fontWeight: '600',
  },
  gigsContainer: {
    padding: 16,
    flexGrow: 1,
  },
  // Favorites section
  favoritesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  favoritesHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  favoritesHeaderTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  favoritesCount: {
    color: '#87CEEB', // Sky blue
    fontSize: 14,
  },
  // Horizontal sections
  horizontalSection: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  sectionViewAll: {
    color: '#87CEEB',
    fontSize: 14,
  },
  horizontalListContent: {
    paddingBottom: 8,
  },
  horizontalGigCard: {
    width: 220,
    backgroundColor: '#3D2959',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(138, 43, 226, 0.3)',
  },
  horizontalGigImage: {
    width: '100%',
    height: 110,
    backgroundColor: '#2E1A47',
  },
  horizontalNoImageGradient: {
    width: '100%',
    height: 110,
    alignItems: 'center',
    justifyContent: 'center',
  },
  horizontalGigInfo: {
    padding: 10,
  },
  horizontalGigTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  horizontalGigMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  horizontalGigCategory: {
    color: '#B0C4DE',
    fontSize: 12,
  },
  horizontalGigPayout: {
    color: '#8A2BE2',
    fontSize: 14,
    fontWeight: 'bold',
  },
  horizontalSkillsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  horizontalSkillsLabel: {
    color: '#B0C4DE',
    fontSize: 12,
  },
  horizontalSkillsList: {
    color: '#87CEEB',
    fontSize: 12,
    flex: 1,
  },
  horizontalFavoriteButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 1,
    backgroundColor: 'rgba(46, 26, 71, 0.6)',
    padding: 6,
    borderRadius: 12,
  },
  recommendedBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    zIndex: 1,
    backgroundColor: '#6F42C1',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  recommendedBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  featuredSmallBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    zIndex: 1,
    backgroundColor: '#8A2BE2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  featuredSmallBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  // All gigs section header
  allGigsHeader: {
    marginTop: 8,
    marginBottom: 12,
  },
  allGigsTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // Main gig cards
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
    borderWidth: 1,
    borderColor: 'rgba(138, 43, 226, 0.3)',
  },
  imageContainer: {
    position: 'relative',
  },
  gigImage: {
    width: '100%',
    height: 160,
    backgroundColor: '#2E1A47',
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  gigCardInner: {
    padding: 16,
    borderRadius: 16,
    position: 'relative',
  },
  urgentGigCard: {
    borderColor: '#87CEEB', // Sky blue
  },
  featuredGigCard: {
    borderColor: '#8A2BE2', // Electric purple
    borderWidth: 2,
  },
  favoriteButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 10,
    backgroundColor: 'rgba(46, 26, 71, 0.6)',
    padding: 8,
    borderRadius: 16,
  },
  favoriteButtonActive: {
    backgroundColor: '#8A2BE2',
  },
  featuredBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    zIndex: 10,
    backgroundColor: '#8A2BE2',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  featuredIcon: {
    marginRight: 4,
  },
  featuredBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
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
    fontWeight: 'bold',
  },
  locationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(176, 196, 222, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    marginLeft: 8,
  },
  locationIcon: {
    marginRight: 4,
  },
  locationText: {
    color: '#B0C4DE',
    fontSize: 10,
    fontWeight: '500',
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
    fontWeight: 'bold',
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
    fontWeight: '500',
    color: '#B0C4DE', // Light slate
    marginBottom: 2,
  },
  gigPayout: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#8A2BE2', // Electric purple
  },
  gigDescription: {
    fontSize: 14,
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
    fontWeight: '500',
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
    fontWeight: '500',
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
    color: '#B0C4DE', // Light slate
  },
  urgentDeadline: {
    color: '#87CEEB', // Sky blue
    fontWeight: 'bold',
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
    fontWeight: '500',
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
    fontWeight: 'bold',
    color: '#FFFFFF', // White
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
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
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#B0C4DE',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    backgroundColor: '#3D2959',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#8A2BE2',
    overflow: 'hidden',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(138, 43, 226, 0.3)',
  },
  modalTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalBody: {
    padding: 16,
    maxHeight: 400,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(138, 43, 226, 0.3)',
    backgroundColor: 'rgba(138, 43, 226, 0.1)',
  },
  filterSection: {
    marginBottom: 20,
  },
  filterSectionTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 10,
  },
  filterInput: {
    backgroundColor: '#2E1A47',
    borderWidth: 1,
    borderColor: 'rgba(138, 43, 226, 0.5)',
    borderRadius: 8,
    color: '#FFFFFF',
    padding: 10,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  switchLabel: {
    color: '#B0C4DE',
    fontSize: 16,
  },
  rangeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  rangeText: {
    color: '#B0C4DE',
    fontSize: 14,
  },
  dummySlider: {
    height: 30,
    position: 'relative',
  },
  dummySliderTrack: {
    height: 4,
    backgroundColor: 'rgba(176, 196, 222, 0.3)',
    borderRadius: 2,
    marginTop: 13,
  },
  dummySliderFill: {
    position: 'absolute',
    left: 0,
    width: '60%',
    height: 4,
    backgroundColor: '#8A2BE2',
    borderRadius: 2,
  },
  dummySliderThumb: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    top: 5,
    left: '60%',
    marginLeft: -10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 2,
  },
  resetFiltersButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#B0C4DE',
  },
  resetFiltersText: {
    color: '#B0C4DE',
    fontSize: 16,
    fontWeight: '500',
  },
  applyFiltersButton: {
    backgroundColor: '#8A2BE2',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  applyFiltersText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
});
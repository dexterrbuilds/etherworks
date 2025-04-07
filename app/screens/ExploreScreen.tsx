import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';

// Define app theme colors (matching navigation theme)
const COLORS = {
  background: '#2E1A47', // deep indigo
  backgroundLight: '#3F2A58', // slightly lighter indigo for cards
  primary: '#8A2BE2', // electric purple
  secondary: '#87CEEB', // sky blue
  text: '#FFFFFF', // white
  textSecondary: '#B0C4DE', // light slate
  gradient: ['#4B0082', '#2E1A47'] as [string, string], // gradient for cards
  cardBorder: 'rgba(138, 43, 226, 0.3)', // subtle purple border
};

// Mock categories for the filter tabs
const CATEGORIES = [
  { id: 'all', name: 'All Gigs' },
  { id: 'defi', name: 'DeFi' },
  { id: 'nft', name: 'NFT' },
  { id: 'dao', name: 'DAO' },
  { id: 'web3', name: 'Web3' },
  { id: 'blockchain', name: 'Blockchain' },
];

// Mock gig data
const MOCK_GIGS = [
  {
    id: '1',
    title: 'Smart Contract Security Audit',
    description: 'Review our DeFi protocol for vulnerabilities and security issues',
    category: 'defi',
    budget: '2.5 ETH',
    timeframe: '2 weeks',
    skills: ['Solidity', 'Security', 'Auditing'],
    createdAt: '2025-03-28T14:30:00Z',
    client: {
      name: 'DeFi Protocol DAO',
      rating: 4.8,
      avatar: 'https://ui-avatars.com/api/?name=DP&background=8A2BE2&color=fff',
    },
    applicants: 5,
    featured: true,
  },
  {
    id: '2',
    title: 'NFT Collection Art Design',
    description: 'Create 10k generative art pieces for our upcoming NFT collection',
    category: 'nft',
    budget: '8 ETH',
    timeframe: '4 weeks',
    skills: ['Generative Art', 'Python', 'Design'],
    createdAt: '2025-04-01T09:15:00Z',
    client: {
      name: 'CryptoArt Labs',
      rating: 4.5,
      avatar: 'https://ui-avatars.com/api/?name=CA&background=8A2BE2&color=fff',
    },
    applicants: 12,
    featured: true,
  },
  {
    id: '3',
    title: 'DAO Voting Mechanism',
    description: 'Develop a weighted voting system for our community DAO',
    category: 'dao',
    budget: '3.2 ETH',
    timeframe: '3 weeks',
    skills: ['Solidity', 'React', 'Governance'],
    createdAt: '2025-04-02T16:45:00Z',
    client: {
      name: 'GovStack',
      rating: 4.9,
      avatar: 'https://ui-avatars.com/api/?name=GS&background=8A2BE2&color=fff',
    },
    applicants: 8,
    featured: false,
  },
  {
    id: '4',
    title: 'Web3 Authentication Integration',
    description: 'Integrate wallet connect and social login for our dApp',
    category: 'web3',
    budget: '1.8 ETH',
    timeframe: '10 days',
    skills: ['TypeScript', 'Web3.js', 'React Native'],
    createdAt: '2025-04-03T11:20:00Z',
    client: {
      name: 'ConnectX',
      rating: 4.6,
      avatar: 'https://ui-avatars.com/api/?name=CX&background=8A2BE2&color=fff',
    },
    applicants: 4,
    featured: false,
  },
  {
    id: '5',
    title: 'Blockchain Analytics Dashboard',
    description: 'Build a custom dashboard to track on-chain metrics for our token',
    category: 'blockchain',
    budget: '4 ETH',
    timeframe: '3 weeks',
    skills: ['Data Visualization', 'API Integration', 'Dashboard Design'],
    createdAt: '2025-04-05T13:55:00Z',
    client: {
      name: 'TokenMetrics',
      rating: 4.7,
      avatar: 'https://ui-avatars.com/api/?name=TM&background=8A2BE2&color=fff',
    },
    applicants: 6,
    featured: true,
  },
];

const ExploreScreen = () => {
  const navigation = useNavigation();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(false);
  const [gigs, setGigs] = useState(MOCK_GIGS);
  const [filteredGigs, setFilteredGigs] = useState(MOCK_GIGS);

  // Filter gigs based on search query and selected category
  useEffect(() => {
    setLoading(true);
    
    // Simulate network request
    setTimeout(() => {
      let filtered = [...gigs];
      
      // Apply category filter
      if (selectedCategory !== 'all') {
        filtered = filtered.filter(gig => gig.category === selectedCategory);
      }
      
      // Apply search query filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        filtered = filtered.filter(
          gig => 
            gig.title.toLowerCase().includes(query) || 
            gig.description.toLowerCase().includes(query) ||
            gig.skills.some(skill => skill.toLowerCase().includes(query))
        );
      }
      
      setFilteredGigs(filtered);
      setLoading(false);
    }, 500);
  }, [searchQuery, selectedCategory]);

  // Render a gig card
  interface Gig {
    id: string;
    title: string;
    description: string;
    category: string;
    budget: string;
    timeframe: string;
    skills: string[];
    createdAt: string;
    client: {
      name: string;
      rating: number;
      avatar: string;
    };
    applicants: number;
    featured: boolean;
  }

  const renderGigCard = ({ item }: { item: Gig }) => {
    const createdDate = new Date(item.createdAt);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - createdDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const timeAgo = diffDays <= 1 ? 'Today' : `${diffDays} days ago`;

    return (
      <TouchableOpacity 
        style={styles.gigCardContainer}
        onPress={() => navigation.navigate('GigDetails', { gigId: item.id })}
      >
        <LinearGradient
          colors={COLORS.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.gigCard, item.featured && styles.featuredCard]}
        >
          {item.featured && (
            <View style={styles.featuredBadge}>
              <Text style={styles.featuredBadgeText}>Featured</Text>
            </View>
          )}
          
          <View style={styles.gigHeader}>
            <View style={styles.clientInfo}>
              <Image source={{ uri: item.client.avatar }} style={styles.clientAvatar} />
              <View>
                <Text style={styles.clientName}>{item.client.name}</Text>
                <View style={styles.ratingContainer}>
                  <Ionicons name="star" size={12} color="#FFD700" />
                  <Text style={styles.ratingText}>{item.client.rating}</Text>
                </View>
              </View>
            </View>
            <Text style={styles.timeAgo}>{timeAgo}</Text>
          </View>
          
          <Text style={styles.gigTitle}>{item.title}</Text>
          <Text style={styles.gigDescription} numberOfLines={2}>{item.description}</Text>
          
          <View style={styles.skillsContainer}>
            {item.skills.map((skill, index) => (
              <View key={index} style={styles.skillBadge}>
                <Text style={styles.skillText}>{skill}</Text>
              </View>
            ))}
          </View>
          
          <View style={styles.gigFooter}>
            <View style={styles.footerItem}>
              <Ionicons name="cash-outline" size={16} color={COLORS.secondary} />
              <Text style={styles.footerText}>{item.budget}</Text>
            </View>
            <View style={styles.footerItem}>
              <Ionicons name="time-outline" size={16} color={COLORS.secondary} />
              <Text style={styles.footerText}>{item.timeframe}</Text>
            </View>
            <View style={styles.footerItem}>
              <Ionicons name="people-outline" size={16} color={COLORS.secondary} />
              <Text style={styles.footerText}>{item.applicants} applied</Text>
            </View>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  // Render category tabs
  const renderCategoryTab = ({ item }: any) => (
    <TouchableOpacity
      style={[
        styles.categoryTab,
        selectedCategory === item.id && styles.selectedCategoryTab
      ]}
      onPress={() => setSelectedCategory(item.id)}
    >
      <Text 
        style={[
          styles.categoryText,
          selectedCategory === item.id && styles.selectedCategoryText
        ]}
      >
        {item.name}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={COLORS.textSecondary} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search gigs, skills, or clients..."
          placeholderTextColor={COLORS.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color={COLORS.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Category Filters */}
      <FlatList
        data={CATEGORIES}
        renderItem={renderCategoryTab}
        keyExtractor={item => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoriesContainer}
      />

      {/* Gig Results */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Finding opportunities...</Text>
        </View>
      ) : filteredGigs.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="search-circle-outline" size={60} color={COLORS.primary} />
          <Text style={styles.emptyTitle}>No matches found</Text>
          <Text style={styles.emptyText}>Try adjusting your search or filters</Text>
        </View>
      ) : (
        <FlatList
          data={filteredGigs}
          renderItem={renderGigCard}
          keyExtractor={item => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.gigsListContainer}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop: 16,
    paddingHorizontal: 12,
    height: 48,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 48,
    color: COLORS.text,
    fontSize: 16,
  },
  categoriesContainer: {
    marginTop: 16,
    paddingHorizontal: 12,
  },
  categoryTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 4,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  selectedCategoryTab: {
    backgroundColor: COLORS.primary,
  },
  categoryText: {
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  selectedCategoryText: {
    color: COLORS.text,
    fontWeight: '600',
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  emptyTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  emptyText: {
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 8,
  },
  gigsListContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  gigCardContainer: {
    marginTop: 16,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  gigCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  featuredCard: {
    borderColor: COLORS.primary,
    borderWidth: 1,
  },
  featuredBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  featuredBadgeText: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: '600',
  },
  gigHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  clientInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  clientAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 8,
    borderWidth: 1,
    borderColor: COLORS.secondary,
  },
  clientName: {
    color: COLORS.text,
    fontWeight: '500',
    fontSize: 14,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  ratingText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginLeft: 4,
  },
  timeAgo: {
    color: COLORS.textSecondary,
    fontSize: 12,
  },
  gigTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  gigDescription: {
    color: COLORS.textSecondary,
    fontSize: 14,
    marginBottom: 12,
    lineHeight: 20,
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  skillBadge: {
    backgroundColor: 'rgba(135, 206, 235, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 6,
    marginBottom: 6,
  },
  skillText: {
    color: COLORS.secondary,
    fontSize: 12,
    fontWeight: '500',
  },
  gigFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    paddingTop: 12,
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    marginLeft: 4,
  },
});

export default ExploreScreen;
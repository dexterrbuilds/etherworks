import React, { useState, useEffect } from 'react';
import { NavigationContainer, NavigationIndependentTree, DefaultTheme } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { AuthProvider, useAuth } from '../AuthContext';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import HomeScreen from '../screens/HomeScreen';
import GigDetailsScreen from '../screens/GigDetailsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import AdminDashboard from '../screens/AdminDashboard';
import NotificationsScreen from '../screens/NotificationsScreen';
import ExploreScreen from '../screens/ExploreScreen';
import { Ionicons } from '@expo/vector-icons';
import { TouchableOpacity, Image, ActivityIndicator, View, Text, StyleSheet } from 'react-native';
import { loadFonts } from '../utils/loadFonts';
import { LinearGradient } from 'expo-linear-gradient';

// Define app theme colors
const COLORS = {
  background: '#2E1A47',  // deep indigo
  primary: '#8A2BE2',     // electric purple
  secondary: '#87CEEB',   // sky blue
  text: '#FFFFFF',        // white
  textSecondary: '#B0C4DE', // light slate
  gradient: ['#2E1A47', '#4B0082'] as const, // gradient for headers
};

// Custom navigation theme
const AppTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: COLORS.background,
    primary: COLORS.primary,
    card: COLORS.background,
    text: COLORS.text,
    border: 'transparent',
  },
};

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();
const MainStack = createStackNavigator();

// Custom header component with gradient
const CustomHeader = ({ title, navigation, hasBack = false } : any) => (
  <LinearGradient
    colors={COLORS.gradient}
    start={{ x: 0, y: 0 }}
    end={{ x: 1, y: 0 }}
    style={styles.headerGradient}
  >
    <View style={styles.headerContainer}>
      {hasBack ? (
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerLeft}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
      ) : (
        <TouchableOpacity onPress={() => {/* Open menu */}} style={styles.headerLeft}>
          <Ionicons name="menu" size={24} color={COLORS.text} />
        </TouchableOpacity>
      )}
      
      <Text style={styles.headerTitle}>{title}</Text>
      
      <TouchableOpacity onPress={() => navigation.navigate('Profile')} style={styles.headerRight}>
        <View style={styles.avatarContainer}>
          <Image
            source={{ uri: useAuth().profile?.avatarUrl || 'https://ui-avatars.com/api/?name=User&background=8A2BE2&color=fff' }}
            style={styles.avatar}
          />
        </View>
      </TouchableOpacity>
    </View>
  </LinearGradient>
);

// Custom tab bar item with animation
const TabBarIcon = ({ focused, name, color }: any) => {
  return (
    <View style={focused ? styles.focusedTab : null}>
      <Ionicons 
        name={name}
        size={22} 
        color={focused ? COLORS.secondary : COLORS.textSecondary} 
      />
    </View>
  );
};

const MainStackNavigator = () => {
  return (
    <MainStack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: COLORS.background },
      }}
    >
      <MainStack.Screen name="MainTabs" component={MainTabs} />
      <MainStack.Screen 
        name="GigDetails" 
        component={GigDetailsScreen}
        options={({ navigation }) => ({
          headerShown: true,
          header: (props) => (
            <CustomHeader 
              title="Gig Details" 
              navigation={navigation}
              hasBack={true}
            />
          ),
        })}
      />
      <MainStack.Screen 
        name="Profile" 
        component={ProfileScreen} 
        options={({ navigation }) => ({
          headerShown: true,
          header: (props) => (
            <CustomHeader 
              title="Profile" 
              navigation={navigation}
              hasBack={true}
            />
          ),
        })}
      />
    </MainStack.Navigator>
  );
};

const MainTabs = () => {
  const { profile } = useAuth();
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: COLORS.secondary,
        tabBarInactiveTintColor: COLORS.textSecondary,
        tabBarShowLabel: true,
        tabBarLabelStyle: styles.tabLabel,
        headerShown: false,
      }}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen} 
        options={({ navigation }) => ({
          tabBarIcon: ({ focused, color }) => (
            <TabBarIcon focused={focused} name={focused ? 'home' : 'home-outline'} color={color} />
          ),
          headerShown: true,
          header: (props) => (
            <CustomHeader title="Etherworks" navigation={navigation} />
          ),
        })}
      />
      
      <Tab.Screen 
        name="Explore" 
        component={ExploreScreen} 
        options={({ navigation }) => ({
          tabBarIcon: ({ focused, color }) => (
            <TabBarIcon focused={focused} name={focused ? 'compass' : 'compass-outline'} color={color} />
          ),
          headerShown: true,
          header: (props) => (
            <CustomHeader title="Explore Gigs" navigation={navigation} />
          ),
        })}
      />
      
      <Tab.Screen 
        name="Notifications" 
        component={NotificationsScreen} 
        options={({ navigation }) => ({
          tabBarIcon: ({ focused, color }) => (
            <TabBarIcon focused={focused} name={focused ? 'notifications' : 'notifications-outline'} color={color} />
          ),
          tabBarBadge: 3,
          tabBarBadgeStyle: styles.tabBadge,
          headerShown: true,
          header: (props) => (
            <CustomHeader title="Notifications" navigation={navigation} />
          ),
        })}
      />
      
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen} 
        options={({ navigation }) => ({
          tabBarIcon: ({ focused, color }) => (
            <TabBarIcon focused={focused} name={focused ? 'person' : 'person-outline'} color={color} />
          ),
          headerShown: true,
          header: (props) => (
            <CustomHeader title="My Profile" navigation={navigation} />
          ),
        })}
      />
      
      {profile?.isAdmin && (
        <Tab.Screen 
          name="Admin" 
          component={AdminDashboard} 
          options={({ navigation }) => ({
            tabBarIcon: ({ focused, color }) => (
              <TabBarIcon focused={focused} name={focused ? 'settings' : 'settings-outline'} color={color} />
            ),
            headerShown: true,
            header: (props) => (
              <CustomHeader title="Admin Dashboard" navigation={navigation} />
            ),
          })}
        />
      )}
    </Tab.Navigator>
  );
};

type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  Onboarding: undefined;
  Main: undefined;
  GigDetails: { gigId: string };
  AdminDashboard: undefined;
  Profile: undefined;
  Notifications: undefined;
  Explore: undefined;
};

const AppNavigator = () => {
  const { user, profile } = useAuth();

  return (
    <NavigationIndependentTree>
      <NavigationContainer theme={AppTheme}>
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
            cardStyle: { backgroundColor: COLORS.background },
          }}
        >
          {user ? (
            profile && profile.onboardingCompleted ? (
              <>
                <Stack.Screen 
                  name="Main" 
                  component={MainStackNavigator}
                />
                {profile.isAdmin && (
                  <Stack.Screen 
                    name="AdminDashboard" 
                    component={AdminDashboard}
                    options={({ navigation }) => ({
                      headerShown: true,
                      header: (props) => (
                        <CustomHeader title="Admin Dashboard" navigation={navigation} hasBack={true} />
                      ),
                    })}
                  />
                )}
              </>
            ) : (
              <Stack.Screen name="Onboarding" component={OnboardingScreen} />
            )
          ) : (
            <>
              <Stack.Screen name="Login" component={LoginScreen} />
              <Stack.Screen 
                name="Register" 
                component={RegisterScreen}
                options={({ navigation }) => ({
                  headerShown: true,
                  header: (props) => (
                    <CustomHeader title="Create Account" navigation={navigation} hasBack={true} />
                  ),
                })}
              />
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </NavigationIndependentTree>
  );
};

export default function App() {
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        await loadFonts();
        setFontsLoaded(true);
      } catch (e) {
        console.warn(e);
      }
    }
    prepare();
  }, []);

  if (!fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <LinearGradient
          colors={[COLORS.background, COLORS.primary]}
          style={styles.loadingGradient}
        >
          <ActivityIndicator size="large" color={COLORS.secondary} />
          <Text style={styles.loadingText}>Loading Etherworks</Text>
        </LinearGradient>
      </View>
    );
  }

  return (
    <AuthProvider>
      <AppNavigator />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
  },
  loadingGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: COLORS.text,
    marginTop: 12,
    fontSize: 16,
    fontWeight: '500',
  },
  headerGradient: {
    height: 90,
    paddingTop: 40,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
  },
  headerLeft: {
    width: 40,
  },
  headerTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '600',
  },
  headerRight: {
    width: 40,
    alignItems: 'flex-end',
  },
  avatarContainer: {
    borderWidth: 2,
    borderColor: COLORS.secondary,
    borderRadius: 18,
    padding: 2,
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  tabBar: {
    backgroundColor: '#25143A', // slightly lighter than background for contrast
    borderTopWidth: 0,
    elevation: 8,
    height: 60,
    paddingBottom: 8,
    paddingTop: 8,
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  focusedTab: {
    backgroundColor: 'rgba(138, 43, 226, 0.2)',
    borderRadius: 12,
    padding: 6,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBadge: {
    backgroundColor: COLORS.primary,
    color: COLORS.text,
    fontSize: 10,
  },
});
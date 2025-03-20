import React, { useState, useEffect } from 'react';
import { NavigationContainer, NavigationIndependentTree } from '@react-navigation/native';
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
import { Ionicons } from '@expo/vector-icons';
import { TouchableOpacity, Image, ActivityIndicator, View } from 'react-native';
import { loadFonts } from '../utils/loadFonts';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const MainStack = createStackNavigator();

const MainStackNavigator = () => {
  const { profile } = useAuth();

  const HeaderRight = ({ navigation }: any) => (
    <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
      <Image
        source={{ uri: profile?.avatarUrl || 'https://ui-avatars.com/api/?name=User' }}
        style={{ width: 30, height: 30, borderRadius: 15, marginRight: 10,   alignSelf: 'center' }}
      />
    </TouchableOpacity>
  );

  const HeaderLeft = () => (
    <TouchableOpacity onPress={() => {/* Open menu */}}>
      <Ionicons name="menu" size={24} color="black" style={{ marginLeft: 10 }} />
    </TouchableOpacity>
  );

  return (
    <MainStack.Navigator>
      <MainStack.Screen 
        name="MainTabs" 
        component={MainTabs}
        options={({ navigation }) => ({
          headerLeft: () => <HeaderLeft />,
          headerRight: () => <HeaderRight navigation={navigation} />,
          headerTitle: 'Sei earn',
        })}
      />
      <MainStack.Screen name="GigDetails" component={GigDetailsScreen} />
      <MainStack.Screen name="Profile" component={ProfileScreen} />
    </MainStack.Navigator>
  );
};

const MainTabs = () => {
  const { profile } = useAuth();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          } else if (route.name === 'Admin') {
            iconName = focused ? 'settings' : 'settings-outline';
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ headerShown: false }} />
      {profile.isAdmin && (
        <Tab.Screen name="Admin" component={AdminDashboard} options={{ headerShown: false }} />
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
};

const AppNavigator = () => {
  const { user, profile } = useAuth();

  return (
    <NavigationIndependentTree>
    <NavigationContainer>
      <Stack.Navigator>
        {user ? (
          profile && profile.onboardingCompleted ? (
            <>
              <Stack.Screen 
                name="Main" 
                component={MainStackNavigator}
                options={{ headerShown: false }}
              />
              {profile.isAdmin && (
                <Stack.Screen name="AdminDashboard" component={AdminDashboard} />
              )}
            </>
          ) : (
            <Stack.Screen name="Onboarding" component={OnboardingScreen} options={{ headerShown: false }} />
          )
        ) : (
          <>
            <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Register" component={RegisterScreen} />
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
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#780000" />
      </View>
    );
  }

  return (
    <AuthProvider>
      <AppNavigator />
    </AuthProvider>
  );
}


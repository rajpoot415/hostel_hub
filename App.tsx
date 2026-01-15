import 'react-native-url-polyfill/auto';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { LayoutDashboard, Users, DoorOpen, User } from 'lucide-react-native';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginScreen from './app/login';
import SignupScreen from './app/signup';
import DashboardScreen from './app/(tabs)/index';
import ResidentsScreen from './app/(tabs)/residents';
import RoomsScreen from './app/(tabs)/rooms';
import ProfileScreen from './app/(tabs)/profile';
import AddResidentScreen from './app/resident/add';
import ResidentProfileScreen from './app/resident/[id]';
import AddRoomScreen from './app/room/add';
import EditProfileScreen from './app/profile/edit';
import CollectRentScreen from './app/rent/collect';
import type { RootStackParamList } from './types/navigation';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator();

function TabNavigator() {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  if (!session) {
    return null; // Will be handled by AuthStack
  }

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: '#2563eb',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: '600',
        },
        tabBarActiveTintColor: '#2563eb',
        tabBarInactiveTintColor: '#94a3b8',
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: '#e2e8f0',
        },
      }}>
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          tabBarIcon: ({ size, color }) => (
            <LayoutDashboard size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Residents"
        component={ResidentsScreen}
        options={{
          tabBarIcon: ({ size, color }) => <Users size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="Rooms"
        component={RoomsScreen}
        options={{
          tabBarIcon: ({ size, color }) => (
            <DoorOpen size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ size, color }) => <User size={size} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
}

function RootNavigator() {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <Stack.Navigator
      screenOptions={{ headerShown: false }}
      initialRouteName={session ? 'Main' : 'Login'}>
      {!session ? (
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen
            name="Signup"
            component={SignupScreen}
            options={{
              headerShown: true,
              title: 'Create Account',
              headerStyle: { backgroundColor: '#2563eb' },
              headerTintColor: '#fff',
            }}
          />
        </>
      ) : (
        <>
          <Stack.Screen name="Main" component={TabNavigator} />
          <Stack.Screen
            name="AddResident"
            component={AddResidentScreen}
            options={{
              headerShown: true,
              title: 'Add Resident',
              headerStyle: { backgroundColor: '#2563eb' },
              headerTintColor: '#fff',
            }}
          />
          <Stack.Screen
            name="ResidentProfile"
            component={ResidentProfileScreen}
            options={{
              headerShown: true,
              title: 'Resident Details',
              headerStyle: { backgroundColor: '#2563eb' },
              headerTintColor: '#fff',
            }}
          />
          <Stack.Screen
            name="AddRoom"
            component={AddRoomScreen}
            options={{
              headerShown: true,
              title: 'Add Room',
              headerStyle: { backgroundColor: '#2563eb' },
              headerTintColor: '#fff',
            }}
          />
          <Stack.Screen
            name="EditProfile"
            component={EditProfileScreen}
            options={{
              headerShown: true,
              title: 'Edit Profile',
              headerStyle: { backgroundColor: '#2563eb' },
              headerTintColor: '#fff',
            }}
          />
          <Stack.Screen
            name="CollectRent"
            component={CollectRentScreen}
            options={{
              headerShown: true,
              title: 'Collect Rent',
              headerStyle: { backgroundColor: '#16a34a' },
              headerTintColor: '#fff',
            }}
          />
        </>
      )}
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <RootNavigator />
        <StatusBar style="auto" />
      </NavigationContainer>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});


import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '@/contexts/AuthContext';
import type { RootStackParamList } from '@/types/navigation';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
import {
  User,
  Settings,
  Bell,
  Lock,
  HelpCircle,
  LogOut,
  ChevronRight,
} from 'lucide-react-native';

export default function ProfileScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { signOut, user, profile } = useAuth();

  const handleLogout = async () => {
    await signOut();
    navigation.replace('Login');
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.profileHeader}>
        <View style={styles.avatarLarge}>
          <User size={48} color="#fff" />
        </View>
        <Text style={styles.userName}>{profile?.name || user?.email?.split('@')[0] || 'User'}</Text>
        <Text style={styles.userEmail}>{user?.email || 'No email'}</Text>
        {profile?.role && (
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>{profile.role.toUpperCase()}</Text>
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate('EditProfile')}>
          <View style={styles.menuItemLeft}>
            <View style={[styles.menuIcon, { backgroundColor: '#dbeafe' }]}>
              <Settings size={20} color="#2563eb" />
            </View>
            <Text style={styles.menuItemText}>Edit Profile</Text>
          </View>
          <ChevronRight size={20} color="#94a3b8" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <View style={styles.menuItemLeft}>
            <View style={[styles.menuIcon, { backgroundColor: '#fef3c7' }]}>
              <Bell size={20} color="#ca8a04" />
            </View>
            <Text style={styles.menuItemText}>Notifications</Text>
          </View>
          <ChevronRight size={20} color="#94a3b8" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <View style={styles.menuItemLeft}>
            <View style={[styles.menuIcon, { backgroundColor: '#f3e8ff' }]}>
              <Lock size={20} color="#9333ea" />
            </View>
            <Text style={styles.menuItemText}>Privacy & Security</Text>
          </View>
          <ChevronRight size={20} color="#94a3b8" />
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Support</Text>
        <TouchableOpacity style={styles.menuItem}>
          <View style={styles.menuItemLeft}>
            <View style={[styles.menuIcon, { backgroundColor: '#dcfce7' }]}>
              <HelpCircle size={20} color="#16a34a" />
            </View>
            <Text style={styles.menuItemText}>Help Center</Text>
          </View>
          <ChevronRight size={20} color="#94a3b8" />
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <LogOut size={20} color="#dc2626" />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>

      <Text style={styles.version}>Version 1.0.0</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  profileHeader: {
    backgroundColor: '#fff',
    alignItems: 'center',
    padding: 32,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  avatarLarge: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
  },
  roleBadge: {
    marginTop: 8,
    backgroundColor: '#2563eb',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  roleText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
    textTransform: 'uppercase',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  menuItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuItemText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#fff',
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fee2e2',
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#dc2626',
  },
  version: {
    textAlign: 'center',
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 24,
    marginBottom: 32,
  },
});

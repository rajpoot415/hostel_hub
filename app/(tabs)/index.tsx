import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/types/navigation';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
import {
  Users,
  Bed,
  IndianRupee,
  UserPlus,
  Wallet,
  Calendar,
} from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { formatCurrency, formatShortDate, logError } from '@/lib/utils';
import type { RentWithResident, ResidentQueryResult } from '@/lib/types';

interface DashboardStats {
  totalResidents: number;
  availableSeats: number;
  rentCollected: number;
  totalRentExpected: number;
}

interface UpcomingRent {
  id: string;
  name: string;
  room: string;
  dueDate: string;
  amount: number;
}

interface RecentAdmission {
  id: string;
  name: string;
  room: string;
  date: string;
}

export default function DashboardScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<DashboardStats>({
    totalResidents: 0,
    availableSeats: 0,
    rentCollected: 0,
    totalRentExpected: 0,
  });
  const [upcomingRent, setUpcomingRent] = useState<UpcomingRent[]>([]);
  const [recentAdmissions, setRecentAdmissions] = useState<RecentAdmission[]>([]);

  const fetchDashboardData = async () => {
    if (!user) return;

    try {
      // Fetch total active residents
      const { count: residentsCount } = await supabase
        .from('residents')
        .select('*', { count: 'exact', head: true })
        .eq('hostel_id', user.id)
        .eq('status', 'active');

      // Fetch rooms to calculate available seats
      const { data: rooms } = await supabase
        .from('rooms')
        .select('capacity, occupied_seats')
        .eq('hostel_id', user.id);

      const availableSeats = rooms?.reduce((sum, room) => {
        return sum + (room.capacity - room.occupied_seats);
      }, 0) || 0;

      // Fetch rent collected (sum of paid_amount for all rents in this hostel)
      // RLS will automatically filter to only show rents for this hostel's residents
      const { data: rents } = await supabase
        .from('rents')
        .select('paid_amount, amount');

      const rentCollected = rents?.reduce((sum, rent) => {
        return sum + Number(rent.paid_amount || 0);
      }, 0) || 0;

      const totalRentExpected = rents?.reduce((sum, rent) => {
        return sum + Number(rent.amount || 0);
      }, 0) || 0;

      // Fetch upcoming rent due (next 7 days)
      const today = new Date();
      const nextWeek = new Date();
      nextWeek.setDate(today.getDate() + 7);

      const { data: upcomingRents } = await supabase
        .from('rents')
        .select(`
          id,
          due_date,
          amount,
          resident_id,
          residents!inner (
            id,
            name,
            room_id,
            rooms (
              room_number
            )
          )
        `)
        .in('status', ['due', 'partial'])
        .gte('due_date', today.toISOString().split('T')[0])
        .lte('due_date', nextWeek.toISOString().split('T')[0])
        .order('due_date', { ascending: true })
        .limit(5);

      const formattedUpcomingRent: UpcomingRent[] = (upcomingRents || []).map(
        (rent: RentWithResident) => ({
          id: rent.residents.id,
          name: rent.residents.name,
          room: rent.residents.rooms?.room_number || 'N/A',
          dueDate: formatShortDate(rent.due_date),
          amount: Number(rent.amount),
        })
      );

      // Fetch recent admissions (last 5)
      const { data: recentResidents } = await supabase
        .from('residents')
        .select(`
          id,
          name,
          admission_date,
          rooms (
            room_number
          )
        `)
        .eq('hostel_id', user.id)
        .eq('status', 'active')
        .order('admission_date', { ascending: false })
        .limit(5);

      const formattedRecentAdmissions: RecentAdmission[] = (
        recentResidents || []
      ).map((resident: ResidentQueryResult) => ({
        id: resident.id,
        name: resident.name,
        room: resident.rooms?.room_number || 'N/A',
        date: formatShortDate(resident.admission_date),
      }));

      setStats({
        totalResidents: residentsCount || 0,
        availableSeats,
        rentCollected,
        totalRentExpected,
      });
      setUpcomingRent(formattedUpcomingRent);
      setRecentAdmissions(formattedRecentAdmissions);
    } catch (error) {
      logError('Dashboard.fetchDashboardData', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };


  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  // Auto-refresh when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (user) {
        fetchDashboardData();
      }
    }, [user]),
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  const rentProgress = stats.totalRentExpected > 0 
    ? (stats.rentCollected / stats.totalRentExpected) * 100 
    : 0;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }>
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <View style={[styles.iconCircle, { backgroundColor: '#dbeafe' }]}>
            <Users size={24} color="#2563eb" />
          </View>
          <Text style={styles.statValue}>{stats.totalResidents}</Text>
          <Text style={styles.statLabel}>Total Residents</Text>
        </View>

        <View style={styles.statCard}>
          <View style={[styles.iconCircle, { backgroundColor: '#dcfce7' }]}>
            <Bed size={24} color="#16a34a" />
          </View>
          <Text style={styles.statValue}>{stats.availableSeats}</Text>
          <Text style={styles.statLabel}>Available Seats</Text>
        </View>

        <View style={[styles.statCard, styles.wideCard]}>
          <View style={[styles.iconCircle, { backgroundColor: '#fef3c7' }]}>
            <IndianRupee size={24} color="#ca8a04" />
          </View>
          <Text style={styles.statValue}>
            {formatCurrency(stats.rentCollected)}
          </Text>
          <Text style={styles.statLabel}>Rent Collected</Text>
          {stats.totalRentExpected > 0 && (
            <>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progress,
                    { width: `${Math.min(rentProgress, 100)}%` },
                  ]}
                />
              </View>
              <Text style={styles.progressText}>
                {formatCurrency(stats.rentCollected)} /{' '}
                {formatCurrency(stats.totalRentExpected)}
              </Text>
            </>
          )}
        </View>
      </View>

      <View style={styles.quickActions}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#2563eb' }]}
            onPress={() => navigation.navigate('AddResident')}>
            <UserPlus size={24} color="#fff" />
            <Text style={styles.actionButtonText}>Add Resident</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#16a34a' }]}
            onPress={() => navigation.navigate('CollectRent')}>
            <Wallet size={24} color="#fff" />
            <Text style={styles.actionButtonText}>Collect Rent</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Upcoming Rent Due</Text>
        {upcomingRent.length > 0 ? (
          upcomingRent.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.listItem}
              onPress={() => navigation.navigate('ResidentProfile', { id: item.id })}>
              <View style={styles.listItemLeft}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {item.name.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View>
                  <Text style={styles.listItemName}>{item.name}</Text>
                  <Text style={styles.listItemSubtext}>Room {item.room}</Text>
                </View>
              </View>
              <View style={styles.listItemRight}>
                <Text style={styles.amountText}>
                  {formatCurrency(item.amount)}
                </Text>
                <View style={styles.dueBadge}>
                  <Calendar size={12} color="#dc2626" />
                  <Text style={styles.dueText}>{item.dueDate}</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No upcoming rent due</Text>
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Admissions</Text>
        {recentAdmissions.length > 0 ? (
          recentAdmissions.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.listItem}
              onPress={() => navigation.navigate('ResidentProfile', { id: item.id })}>
              <View style={styles.listItemLeft}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {item.name.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View>
                  <Text style={styles.listItemName}>{item.name}</Text>
                  <Text style={styles.listItemSubtext}>Room {item.room}</Text>
                </View>
              </View>
              <Text style={styles.dateText}>{item.date}</Text>
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No recent admissions</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 12,
  },
  statCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    flex: 1,
    minWidth: '35%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  wideCard: {
    width: '100%',
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#64748b',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#f1f5f9',
    borderRadius: 4,
    marginTop: 12,
    overflow: 'hidden',
  },
  progress: {
    height: '100%',
    backgroundColor: '#ca8a04',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
  },
  quickActions: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 12,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    padding: 16,
  },
  listItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  listItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  listItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  listItemSubtext: {
    fontSize: 14,
    color: '#64748b',
  },
  listItemRight: {
    alignItems: 'flex-end',
  },
  amountText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  dueBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#fee2e2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  dueText: {
    fontSize: 12,
    color: '#dc2626',
    fontWeight: '600',
  },
  dateText: {
    fontSize: 14,
    color: '#64748b',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  emptyState: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 14,
    color: '#64748b',
  },
});

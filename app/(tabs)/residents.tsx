import { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Search, Plus } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { logError } from '@/lib/utils';
import type { ResidentQueryResult } from '@/lib/types';

interface Resident {
  id: string;
  name: string;
  room: string;
  status: 'Active' | 'Rent Due' | 'New';
  statusColor: string;
  hasRentDue: boolean;
  admissionDate: string;
}

export default function ResidentsScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [residents, setResidents] = useState<Resident[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();
  const { user } = useAuth();

  const filters = ['All', 'Rent Due', 'New'];

  const fetchResidents = async () => {
    if (!user) return;

    try {
      // Fetch all active residents with their rooms
      const { data: residentsData, error: residentsError } = await supabase
        .from('residents')
        .select(`
          id,
          name,
          admission_date,
          room_id,
          rooms (
            room_number
          )
        `)
        .eq('hostel_id', user.id)
        .eq('status', 'active')
        .order('name', { ascending: true });

      if (residentsError) throw residentsError;

      // Fetch rent status for each resident
      // RLS will automatically filter to only show rents for residents in this hostel
      const { data: rentsData, error: rentsError } = await supabase
        .from('rents')
        .select('resident_id, status')
        .in('status', ['due', 'partial']);

      if (rentsError) throw rentsError;

      // Create a map of residents with rent due
      const rentDueMap = new Set(
        (rentsData || []).map((rent) => rent.resident_id)
      );

      // Calculate date 30 days ago for "New" filter
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // Transform residents data
      const transformedResidents: Resident[] = (residentsData || []).map(
        (resident: ResidentQueryResult) => {
          const hasRentDue = rentDueMap.has(resident.id);
          const admissionDate = new Date(resident.admission_date);
          const isNew = admissionDate >= thirtyDaysAgo;

          let status: 'Active' | 'Rent Due' | 'New' = 'Active';
          let statusColor = '#16a34a';

          if (hasRentDue) {
            status = 'Rent Due';
            statusColor = '#dc2626';
          } else if (isNew) {
            status = 'New';
            statusColor = '#2563eb';
          }

          return {
            id: resident.id,
            name: resident.name,
            room: resident.rooms?.room_number || 'N/A',
            status,
            statusColor,
            hasRentDue,
            admissionDate: resident.admission_date,
          };
        }
      );

      setResidents(transformedResidents);
    } catch (error) {
      logError('Residents.fetchResidents', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchResidents();
  }, [user]);

  const filteredResidents = useMemo(() => {
    let filtered = residents;

    // Apply filter
    if (activeFilter === 'Rent Due') {
      filtered = filtered.filter((r) => r.hasRentDue);
    } else if (activeFilter === 'New') {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      filtered = filtered.filter((r) => {
        const admissionDate = new Date(r.admissionDate);
        return admissionDate >= thirtyDaysAgo;
      });
    }

    // Apply search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(
        (resident) =>
          resident.name.toLowerCase().includes(query) ||
          resident.room.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [residents, activeFilter, searchQuery]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchResidents();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <Search size={20} color="#64748b" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name or room..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
          />
        </View>
      </View>

      <View style={styles.filterContainer}>
        {filters.map((filter) => (
          <TouchableOpacity
            key={filter}
            style={[
              styles.filterButton,
              activeFilter === filter && styles.filterButtonActive,
            ]}
            onPress={() => setActiveFilter(filter)}>
            <Text
              style={[
                styles.filterText,
                activeFilter === filter && styles.filterTextActive,
              ]}>
              {filter}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        style={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }>
        {filteredResidents.length > 0 ? (
          filteredResidents.map((resident) => (
            <TouchableOpacity
              key={resident.id}
              style={styles.residentCard}
              onPress={() => router.push(`/resident/${resident.id}`)}>
              <View style={styles.residentLeft}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {resident.name.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View>
                  <Text style={styles.residentName}>{resident.name}</Text>
                  <Text style={styles.roomText}>Room {resident.room}</Text>
                </View>
              </View>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: `${resident.statusColor}15` },
                ]}>
                <Text
                  style={[styles.statusText, { color: resident.statusColor }]}>
                  {resident.status}
                </Text>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              {searchQuery.trim()
                ? 'No residents found matching your search'
                : activeFilter === 'Rent Due'
                  ? 'No residents with rent due'
                  : activeFilter === 'New'
                    ? 'No new residents in the last 30 days'
                    : 'No residents found'}
            </Text>
          </View>
        )}
      </ScrollView>

      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/resident/add')}>
        <Plus size={24} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  searchContainer: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1e293b',
  },
  filterContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  filterButtonActive: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  filterText: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '600',
  },
  filterTextActive: {
    color: '#fff',
  },
  listContainer: {
    flex: 1,
    padding: 16,
  },
  residentCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  residentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  residentName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  roomText: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  emptyState: {
    padding: 32,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});

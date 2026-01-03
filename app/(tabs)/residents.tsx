import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Search, Plus, User } from 'lucide-react-native';

const mockResidents = [
  {
    id: 1,
    name: 'Rahul Sharma',
    room: '101',
    status: 'Rent Due',
    statusColor: '#dc2626',
  },
  {
    id: 2,
    name: 'Priya Patel',
    room: '203',
    status: 'Active',
    statusColor: '#16a34a',
  },
  {
    id: 3,
    name: 'Amit Kumar',
    room: '305',
    status: 'Rent Due',
    statusColor: '#dc2626',
  },
  {
    id: 4,
    name: 'Sneha Reddy',
    room: '102',
    status: 'Active',
    statusColor: '#16a34a',
  },
  {
    id: 5,
    name: 'Vijay Singh',
    room: '204',
    status: 'Rent Due',
    statusColor: '#dc2626',
  },
  {
    id: 6,
    name: 'Anjali Verma',
    room: '401',
    status: 'New',
    statusColor: '#2563eb',
  },
  {
    id: 7,
    name: 'Karan Mehta',
    room: '302',
    status: 'New',
    statusColor: '#2563eb',
  },
  {
    id: 8,
    name: 'Riya Joshi',
    room: '205',
    status: 'Active',
    statusColor: '#16a34a',
  },
  {
    id: 9,
    name: 'Suresh Gupta',
    room: '403',
    status: 'Active',
    statusColor: '#16a34a',
  },
  {
    id: 10,
    name: 'Pooja Desai',
    room: '301',
    status: 'Rent Due',
    statusColor: '#dc2626',
  },
];

export default function ResidentsScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const router = useRouter();

  const filters = ['All', 'Rent Due', 'New'];

  const filteredResidents = mockResidents.filter((resident) => {
    const matchesSearch =
      resident.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      resident.room.includes(searchQuery);
    const matchesFilter =
      activeFilter === 'All' || resident.status === activeFilter;
    return matchesSearch && matchesFilter;
  });

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

      <ScrollView style={styles.listContainer}>
        {filteredResidents.map((resident) => (
          <TouchableOpacity
            key={resident.id}
            style={styles.residentCard}
            onPress={() => router.push(`/resident/${resident.id}`)}>
            <View style={styles.residentLeft}>
              <View style={styles.avatar}>
                <User size={24} color="#fff" />
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
              <Text style={[styles.statusText, { color: resident.statusColor }]}>
                {resident.status}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
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
});

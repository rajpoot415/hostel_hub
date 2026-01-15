import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { DoorOpen, Users, Plus } from 'lucide-react-native';
import type { RootStackParamList } from '@/types/navigation';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { logError } from '@/lib/utils';

interface Room {
  id: string;
  room_number: string;
  capacity: number;
  occupied_seats: number;
  floor: number;
  vacant: number;
}

const groupByFloor = (rooms: Room[]) => {
  return rooms.reduce(
    (acc, room) => {
      if (!acc[room.floor]) {
        acc[room.floor] = [];
      }
      acc[room.floor].push(room);
      return acc;
    },
    {} as Record<number, Room[]>
  );
};

const getFloorFromRoomNumber = (roomNumber: string): number => {
  // Extract first digit(s) from room number (e.g., "101" -> 1, "201" -> 2)
  const match = roomNumber.match(/^(\d+)/);
  if (match) {
    const firstDigit = parseInt(match[1][0]);
    return firstDigit;
  }
  return 0;
};

export default function RoomsScreen() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { user } = useAuth();
  const navigation = useNavigation<NavigationProp>();

  const fetchRooms = async () => {
    if (!user) return;

    try {
      const { data: roomsData, error } = await supabase
        .from('rooms')
        .select('id, room_number, capacity, occupied_seats, floor, branch')
        .eq('hostel_id', user.id)
        .order('floor', { ascending: true })
        .order('branch', { ascending: true, nullsFirst: false })
        .order('room_number', { ascending: true });

      if (error) throw error;

      const roomsWithFloor: Room[] = (roomsData || []).map((room) => ({
        id: room.id,
        room_number: room.room_number,
        capacity: room.capacity,
        occupied_seats: room.occupied_seats,
        floor: room.floor || getFloorFromRoomNumber(room.room_number),
        vacant: room.capacity - room.occupied_seats,
      }));

      setRooms(roomsWithFloor);
    } catch (error) {
      logError('Rooms.fetchRooms', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, [user]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchRooms();
  };

  const roomsByFloor = groupByFloor(rooms);
  const totalRooms = rooms.length;
  const totalCapacity = rooms.reduce((sum, room) => sum + room.capacity, 0);
  const totalOccupied = rooms.reduce(
    (sum, room) => sum + room.occupied_seats,
    0
  );
  const totalVacant = totalCapacity - totalOccupied;

  const getCardStyle = (occupied: number, capacity: number) => {
    const vacant = capacity - occupied;
    // Green: has vacant seats
    if (vacant > 0) {
      return {
        backgroundColor: '#dcfce7',
        borderColor: '#16a34a',
      };
    }
    // Red: full (no vacant seats)
    return {
      backgroundColor: '#fee2e2',
      borderColor: '#dc2626',
    };
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
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }>
      <View style={styles.summaryContainer}>
        <View style={styles.summaryCard}>
          <View style={[styles.iconCircle, { backgroundColor: '#dbeafe' }]}>
            <DoorOpen size={24} color="#2563eb" />
          </View>
          <Text style={styles.summaryValue}>{totalRooms}</Text>
          <Text style={styles.summaryLabel}>Total Rooms</Text>
        </View>

        <View style={styles.summaryCard}>
          <View style={[styles.iconCircle, { backgroundColor: '#dcfce7' }]}>
            <Users size={24} color="#16a34a" />
          </View>
          <Text style={styles.summaryValue}>{totalVacant}</Text>
          <Text style={styles.summaryLabel}>Vacant Seats</Text>
        </View>

        <View style={styles.summaryCard}>
          <View style={[styles.iconCircle, { backgroundColor: '#f3e8ff' }]}>
            <Users size={24} color="#9333ea" />
          </View>
          <Text style={styles.summaryValue}>
            {totalOccupied}/{totalCapacity}
          </Text>
          <Text style={styles.summaryLabel}>Occupancy</Text>
        </View>
      </View>

      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#16a34a' }]} />
          <Text style={styles.legendText}>Vacant</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#dc2626' }]} />
          <Text style={styles.legendText}>Full</Text>
        </View>
      </View>

      {Object.keys(roomsByFloor).length > 0 ? (
        Object.entries(roomsByFloor)
          .sort(([a], [b]) => Number(a) - Number(b))
          .map(([floor, floorRooms]) => (
            <View key={floor} style={styles.floorSection}>
              <Text style={styles.floorTitle}>Floor {floor}</Text>
              <View style={styles.roomGrid}>
                {floorRooms.map((room) => {
                  const vacant = room.vacant;
                  const cardStyle = getCardStyle(
                    room.occupied_seats,
                    room.capacity
                  );
                  return (
                    <View
                      key={room.id}
                      style={[
                        styles.roomCard,
                        {
                          backgroundColor: cardStyle.backgroundColor,
                          borderColor: cardStyle.borderColor,
                        },
                      ]}>
                      <View style={styles.roomHeader}>
                        <DoorOpen size={20} color={cardStyle.borderColor} />
                        <Text style={styles.roomNumber}>
                          {room.room_number}
                        </Text>
                      </View>
                      <Text style={styles.capacityText}>
                        {room.occupied_seats}/{room.capacity}
                      </Text>
                      <Text style={styles.capacityLabel}>
                        {vacant} seat{vacant !== 1 ? 's' : ''} vacant
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>
          ))
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>No rooms found</Text>
        </View>
      )}
      </ScrollView>

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('AddRoom')}>
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
  scrollView: {
    flex: 1,
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
  summaryContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    paddingVertical: 12,
    backgroundColor: '#fff',
    marginHorizontal: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: 12,
    color: '#64748b',
  },
  floorSection: {
    padding: 16,
  },
  floorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 12,
  },
  roomGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  roomCard: {
    width: '47%',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
  },
  roomHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  roomNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
  },
  capacityText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 4,
  },
  capacityLabel: {
    fontSize: 12,
    color: '#64748b',
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
  },
});

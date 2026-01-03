import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { DoorOpen, Users } from 'lucide-react-native';

const mockRooms = [
  { id: 1, number: '101', capacity: 4, occupied: 4, floor: 1 },
  { id: 2, number: '102', capacity: 4, occupied: 3, floor: 1 },
  { id: 3, number: '103', capacity: 2, occupied: 0, floor: 1 },
  { id: 4, number: '104', capacity: 4, occupied: 4, floor: 1 },
  { id: 5, number: '201', capacity: 4, occupied: 2, floor: 2 },
  { id: 6, number: '202', capacity: 2, occupied: 2, floor: 2 },
  { id: 7, number: '203', capacity: 4, occupied: 3, floor: 2 },
  { id: 8, number: '204', capacity: 4, occupied: 4, floor: 2 },
  { id: 9, number: '205', capacity: 2, occupied: 1, floor: 2 },
  { id: 10, number: '301', capacity: 4, occupied: 4, floor: 3 },
  { id: 11, number: '302', capacity: 4, occupied: 3, floor: 3 },
  { id: 12, number: '303', capacity: 2, occupied: 0, floor: 3 },
  { id: 13, number: '304', capacity: 4, occupied: 4, floor: 3 },
  { id: 14, number: '305', capacity: 4, occupied: 4, floor: 3 },
  { id: 15, number: '401', capacity: 4, occupied: 1, floor: 4 },
  { id: 16, number: '402', capacity: 2, occupied: 2, floor: 4 },
  { id: 17, number: '403', capacity: 4, occupied: 4, floor: 4 },
  { id: 18, number: '404', capacity: 4, occupied: 2, floor: 4 },
];

const groupByFloor = (rooms: typeof mockRooms) => {
  return rooms.reduce(
    (acc, room) => {
      if (!acc[room.floor]) {
        acc[room.floor] = [];
      }
      acc[room.floor].push(room);
      return acc;
    },
    {} as Record<number, typeof mockRooms>
  );
};

export default function RoomsScreen() {
  const roomsByFloor = groupByFloor(mockRooms);
  const totalRooms = mockRooms.length;
  const totalCapacity = mockRooms.reduce((sum, room) => sum + room.capacity, 0);
  const totalOccupied = mockRooms.reduce(
    (sum, room) => sum + room.occupied,
    0
  );
  const totalVacant = totalCapacity - totalOccupied;

  const getCardStyle = (occupied: number, capacity: number) => {
    const percentage = (occupied / capacity) * 100;
    if (percentage === 100) {
      return {
        backgroundColor: '#fee2e2',
        borderColor: '#dc2626',
      };
    } else if (percentage > 0) {
      return {
        backgroundColor: '#fef3c7',
        borderColor: '#ca8a04',
      };
    }
    return {
      backgroundColor: '#dcfce7',
      borderColor: '#16a34a',
    };
  };

  return (
    <ScrollView style={styles.container}>
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
          <View style={[styles.legendDot, { backgroundColor: '#ca8a04' }]} />
          <Text style={styles.legendText}>Partial</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#dc2626' }]} />
          <Text style={styles.legendText}>Full</Text>
        </View>
      </View>

      {Object.entries(roomsByFloor)
        .sort(([a], [b]) => Number(a) - Number(b))
        .map(([floor, rooms]) => (
          <View key={floor} style={styles.floorSection}>
            <Text style={styles.floorTitle}>Floor {floor}</Text>
            <View style={styles.roomGrid}>
              {rooms.map((room) => {
                const vacant = room.capacity - room.occupied;
                const cardStyle = getCardStyle(room.occupied, room.capacity);
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
                      <Text style={styles.roomNumber}>{room.number}</Text>
                    </View>
                    <Text style={styles.capacityText}>
                      {room.occupied}/{room.capacity}
                    </Text>
                    <Text style={styles.capacityLabel}>
                      {vacant} seat{vacant !== 1 ? 's' : ''} vacant
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
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
});

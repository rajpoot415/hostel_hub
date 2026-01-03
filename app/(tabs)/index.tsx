import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Users,
  Bed,
  IndianRupee,
  UserPlus,
  Wallet,
  Calendar,
} from 'lucide-react-native';

const mockUpcomingRent = [
  {
    id: 1,
    name: 'Rahul Sharma',
    room: '101',
    dueDate: 'Jan 5',
    amount: 8000,
  },
  {
    id: 2,
    name: 'Priya Patel',
    room: '203',
    dueDate: 'Jan 6',
    amount: 7500,
  },
  {
    id: 3,
    name: 'Amit Kumar',
    room: '305',
    dueDate: 'Jan 7',
    amount: 8500,
  },
  { id: 4, name: 'Sneha Reddy', room: '102', dueDate: 'Jan 8', amount: 7000 },
  { id: 5, name: 'Vijay Singh', room: '204', dueDate: 'Jan 9', amount: 8000 },
];

const mockRecentAdmissions = [
  { id: 1, name: 'Anjali Verma', room: '401', date: 'Jan 2' },
  { id: 2, name: 'Karan Mehta', room: '302', date: 'Jan 1' },
  { id: 3, name: 'Riya Joshi', room: '205', date: 'Dec 30' },
];

export default function DashboardScreen() {
  const router = useRouter();

  return (
    <ScrollView style={styles.container}>
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <View style={[styles.iconCircle, { backgroundColor: '#dbeafe' }]}>
            <Users size={24} color="#2563eb" />
          </View>
          <Text style={styles.statValue}>120</Text>
          <Text style={styles.statLabel}>Total Residents</Text>
        </View>

        <View style={styles.statCard}>
          <View style={[styles.iconCircle, { backgroundColor: '#dcfce7' }]}>
            <Bed size={24} color="#16a34a" />
          </View>
          <Text style={styles.statValue}>15</Text>
          <Text style={styles.statLabel}>Available Seats</Text>
        </View>

        <View style={[styles.statCard, styles.wideCard]}>
          <View style={[styles.iconCircle, { backgroundColor: '#fef3c7' }]}>
            <IndianRupee size={24} color="#ca8a04" />
          </View>
          <Text style={styles.statValue}>₹85,000</Text>
          <Text style={styles.statLabel}>Rent Collected</Text>
          <View style={styles.progressBar}>
            <View style={[styles.progress, { width: '85%' }]} />
          </View>
          <Text style={styles.progressText}>₹85,000 / ₹1,00,000</Text>
        </View>
      </View>

      <View style={styles.quickActions}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#2563eb' }]}
            onPress={() => router.push('/resident/add')}>
            <UserPlus size={24} color="#fff" />
            <Text style={styles.actionButtonText}>Add Resident</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#16a34a' }]}>
            <Wallet size={24} color="#fff" />
            <Text style={styles.actionButtonText}>Collect Rent</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Upcoming Rent Due</Text>
        {mockUpcomingRent.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.listItem}
            onPress={() => router.push(`/resident/${item.id}`)}>
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
              <Text style={styles.amountText}>₹{item.amount}</Text>
              <View style={styles.dueBadge}>
                <Calendar size={12} color="#dc2626" />
                <Text style={styles.dueText}>{item.dueDate}</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Admissions</Text>
        {mockRecentAdmissions.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.listItem}
            onPress={() => router.push(`/resident/${item.id}`)}>
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
        ))}
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
});

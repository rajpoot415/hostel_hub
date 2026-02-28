import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/types/navigation';
import { Calendar, DoorOpen, User, Clock, X } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { logError, formatDate } from '@/lib/utils';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface Notice {
  id: string;
  resident_id: string;
  resident_name: string;
  room_number: string;
  notice_date: string;
  leaving_date: string;
  seat_available_date: string;
  days_until_available: number;
  status: string;
  notes: string | null;
}

export default function NoticesScreen() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'active' | 'all'>('active');
  const [cancellingNoticeId, setCancellingNoticeId] = useState<string | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedNotice, setSelectedNotice] = useState<Notice | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const navigation = useNavigation<NavigationProp>();
  const { user } = useAuth();

  const fetchNotices = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Fetch active notices with resident and room details
      const { data: noticesData, error: noticesError } = await supabase
        .from('notices')
        .select(`
          id,
          resident_id,
          notice_date,
          leaving_date,
          status,
          notes,
          residents!inner (
            id,
            name,
            hostel_id,
            room_id,
            rooms (
              room_number
            )
          )
        `)
        .eq('residents.hostel_id', user.id)
        .order('leaving_date', { ascending: true });

      if (noticesError) throw noticesError;

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Transform notices data
      const transformedNotices: Notice[] = (noticesData || []).map((notice: any) => {
        const leavingDate = new Date(notice.leaving_date);
        leavingDate.setHours(0, 0, 0, 0);

        // Seat will be available on the leaving date
        const seatAvailableDate = leavingDate;
        
        // Calculate days until seat is available
        const diffTime = seatAvailableDate.getTime() - today.getTime();
        const daysUntilAvailable = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        // Handle room_number (can be array or object)
        const roomNumber = notice.residents.rooms
          ? (Array.isArray(notice.residents.rooms)
              ? notice.residents.rooms[0]?.room_number
              : notice.residents.rooms?.room_number)
          : 'N/A';

        return {
          id: notice.id,
          resident_id: notice.resident_id,
          resident_name: notice.residents.name,
          room_number: roomNumber || 'N/A',
          notice_date: notice.notice_date,
          leaving_date: notice.leaving_date,
          seat_available_date: seatAvailableDate.toISOString().split('T')[0],
          days_until_available: daysUntilAvailable,
          status: notice.status,
          notes: notice.notes,
        };
      });

      setNotices(transformedNotices);
    } catch (error) {
      logError('Notices.fetchNotices', error);
      Alert.alert('Error', 'Failed to load notices');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchNotices();
  }, [user]);

  // Auto-refresh when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (user) {
        fetchNotices();
      }
    }, [user]),
  );

  const filteredNotices = useMemo(() => {
    if (filter === 'active') {
      return notices.filter((notice) => notice.status === 'active');
    }
    return notices;
  }, [notices, filter]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchNotices();
  };

  const getDaysUntilAvailableText = (days: number): string => {
    if (days < 0) {
      return 'Available now';
    } else if (days === 0) {
      return 'Available today';
    } else if (days === 1) {
      return 'Available tomorrow';
    } else {
      return `Available in ${days} days`;
    }
  };

  const getDaysUntilAvailableColor = (days: number): string => {
    if (days < 0) {
      return '#16a34a'; // Green - available now
    } else if (days <= 7) {
      return '#dc2626'; // Red - soon
    } else if (days <= 30) {
      return '#ca8a04'; // Yellow - within month
    } else {
      return '#64748b'; // Gray - later
    }
  };

  const handleCancelNotice = (notice: Notice) => {
    setSelectedNotice(notice);
    setCancelReason('');
    setShowCancelModal(true);
  };

  const confirmCancelNotice = async () => {
    if (!selectedNotice) return;

    const noticeId = selectedNotice.id;
    setCancellingNoticeId(noticeId);
    setShowCancelModal(false);

    try {
      // Update notice status to 'processed' (which effectively cancels it)
      const existingNotes = selectedNotice.notes || '';
      const cancelledNote = cancelReason.trim()
        ? `[Cancelled] Reason: ${cancelReason.trim()}\n${existingNotes}`
        : `[Cancelled] ${existingNotes}`;

      const { error } = await supabase
        .from('notices')
        .update({
          status: 'processed',
          notes: cancelledNote.trim() || null,
        })
        .eq('id', noticeId);

      if (error) throw error;

      Alert.alert(
        'Notice Cancelled',
        'The notice has been cancelled successfully. It will no longer appear in active notices.',
        [{ text: 'OK' }],
      );

      // Auto-refresh data
      await fetchNotices();
    } catch (error) {
      logError('Notices.handleCancelNotice', error);
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Failed to cancel notice',
      );
    } finally {
      setCancellingNoticeId(null);
      setSelectedNotice(null);
      setCancelReason('');
    }
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
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'active' && styles.filterButtonActive]}
          onPress={() => setFilter('active')}>
          <Text
            style={[
              styles.filterText,
              filter === 'active' && styles.filterTextActive,
            ]}>
            Active
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'all' && styles.filterButtonActive]}
          onPress={() => setFilter('all')}>
          <Text
            style={[
              styles.filterText,
              filter === 'all' && styles.filterTextActive,
            ]}>
            All
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }>
        {filteredNotices.length > 0 ? (
          filteredNotices.map((notice) => (
            <View key={notice.id} style={styles.noticeCard}>
              <TouchableOpacity
                onPress={() =>
                  navigation.navigate('ResidentProfile', { id: notice.resident_id })
                }>
                <View style={styles.noticeHeader}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                      {notice.resident_name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.noticeHeaderText}>
                    <Text style={styles.residentName}>{notice.resident_name}</Text>
                    <View style={styles.roomRow}>
                      <DoorOpen size={14} color="#64748b" />
                      <Text style={styles.roomText}>Room {notice.room_number}</Text>
                    </View>
                  </View>
                  {notice.status === 'active' && (
                    <TouchableOpacity
                      style={styles.cancelButton}
                      onPress={() => handleCancelNotice(notice)}
                      disabled={cancellingNoticeId === notice.id}>
                      {cancellingNoticeId === notice.id ? (
                        <ActivityIndicator size="small" color="#dc2626" />
                      ) : (
                        <X size={20} color="#dc2626" />
                      )}
                    </TouchableOpacity>
                  )}
                </View>
              </TouchableOpacity>

              <View style={styles.noticeDetails}>
                <View style={styles.detailRow}>
                  <View style={styles.detailItem}>
                    <Calendar size={16} color="#2563eb" />
                    <View style={styles.detailTextContainer}>
                      <Text style={styles.detailLabel}>Notice Date</Text>
                      <Text style={styles.detailValue}>
                        {formatDate(notice.notice_date)}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.detailItem}>
                    <Clock size={16} color="#dc2626" />
                    <View style={styles.detailTextContainer}>
                      <Text style={styles.detailLabel}>Leaving Date</Text>
                      <Text style={styles.detailValue}>
                        {formatDate(notice.leaving_date)}
                      </Text>
                    </View>
                  </View>
                </View>

                <View
                  style={[
                    styles.availabilityBadge,
                    {
                      backgroundColor: `${getDaysUntilAvailableColor(
                        notice.days_until_available,
                      )}15`,
                    },
                  ]}>
                  <Text
                    style={[
                      styles.availabilityText,
                      {
                        color: getDaysUntilAvailableColor(
                          notice.days_until_available,
                        ),
                      },
                    ]}>
                    {getDaysUntilAvailableText(notice.days_until_available)}
                  </Text>
                  <Text style={styles.availabilitySubtext}>
                    Seat available: {formatDate(notice.seat_available_date)}
                  </Text>
                </View>

                {notice.notes && (
                  <View style={styles.notesContainer}>
                    <Text style={styles.notesLabel}>Notes:</Text>
                    <Text style={styles.notesText}>{notice.notes}</Text>
                  </View>
                )}
              </View>
            </View>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              {filter === 'active'
                ? 'No active notices found'
                : 'No notices found'}
            </Text>
            <Text style={styles.emptyStateSubtext}>
              When residents give notice to leave, their details will appear here with seat availability dates.
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Cancel Notice Modal */}
      <Modal
        visible={showCancelModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCancelModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Cancel Notice</Text>
            {selectedNotice && (
              <>
                <Text style={styles.modalText}>
                  Are you sure you want to cancel the notice for{' '}
                  <Text style={styles.modalBold}>{selectedNotice.resident_name}</Text>?
                </Text>
                <View style={styles.modalInfoBox}>
                  <Text style={styles.modalInfoText}>
                    <Text style={styles.modalInfoLabel}>Leaving Date:</Text>{' '}
                    {formatDate(selectedNotice.leaving_date)}
                  </Text>
                  <Text style={styles.modalInfoText}>
                    <Text style={styles.modalInfoLabel}>Seat Available:</Text>{' '}
                    {formatDate(selectedNotice.seat_available_date)}
                  </Text>
                </View>
                <Text style={styles.modalSubtext}>
                  After cancellation, this notice will be marked as processed and removed from
                  active notices.
                </Text>

                <Text style={styles.modalLabel}>Cancellation Reason (Optional)</Text>
                <TextInput
                  style={styles.modalInput}
                  value={cancelReason}
                  onChangeText={setCancelReason}
                  placeholder="Enter reason for cancellation..."
                  placeholderTextColor="#94a3b8"
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />

                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.modalButtonCancel]}
                    onPress={() => {
                      setShowCancelModal(false);
                      setCancelReason('');
                      setSelectedNotice(null);
                    }}>
                    <Text style={styles.modalButtonCancelText}>Keep Notice</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.modalButtonDanger]}
                    onPress={confirmCancelNotice}
                    disabled={cancellingNoticeId === selectedNotice.id}>
                    {cancellingNoticeId === selectedNotice.id ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.modalButtonDangerText}>Cancel Notice</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
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
  noticeCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  noticeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  noticeHeaderText: {
    flex: 1,
  },
  residentName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  roomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  roomText: {
    fontSize: 14,
    color: '#64748b',
  },
  noticeDetails: {
    gap: 12,
  },
  detailRow: {
    flexDirection: 'row',
    gap: 16,
  },
  detailItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailTextContainer: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
  },
  availabilityBadge: {
    padding: 12,
    borderRadius: 8,
    marginTop: 4,
  },
  availabilityText: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  availabilitySubtext: {
    fontSize: 12,
    color: '#64748b',
  },
  notesContainer: {
    marginTop: 4,
    padding: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
  },
  notesLabel: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 4,
    fontWeight: '600',
  },
  notesText: {
    fontSize: 14,
    color: '#1e293b',
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
    fontSize: 16,
    color: '#1e293b',
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 20,
  },
  cancelButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#fee2e2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalText: {
    fontSize: 16,
    color: '#1e293b',
    marginBottom: 16,
    lineHeight: 24,
  },
  modalBold: {
    fontWeight: '700',
  },
  modalInfoBox: {
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  modalInfoText: {
    fontSize: 14,
    color: '#1e293b',
    marginBottom: 4,
  },
  modalInfoLabel: {
    fontWeight: '600',
    color: '#64748b',
  },
  modalSubtext: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 20,
    lineHeight: 20,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 8,
  },
  modalInput: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#1e293b',
    minHeight: 80,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonCancel: {
    backgroundColor: '#f1f5f9',
  },
  modalButtonDanger: {
    backgroundColor: '#dc2626',
  },
  modalButtonCancelText: {
    color: '#64748b',
    fontSize: 16,
    fontWeight: '600',
  },
  modalButtonDangerText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});


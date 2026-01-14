import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
  Linking,
} from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import {
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  DoorOpen,
  AlertCircle,
  IndianRupee,
  FileText,
  ArrowLeft,
} from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { formatCurrency, formatDate, formatMonthYear, logError } from '@/lib/utils';

interface Resident {
  id: string;
  name: string;
  phone: string | null;
  photo_url: string | null;
  room_number: string | null;
  admission_date: string;
  emergency_contact: string;
  address?: string;
}

interface CurrentRent {
  id: string;
  amount: number;
  paid_amount: number;
  due_date: string;
  status: string;
}

interface RentHistory {
  id: string;
  amount: number;
  paid_amount: number;
  due_date: string;
  status: string;
  created_at: string;
}

interface Document {
  id: string;
  file_url: string;
  file_type: string;
  created_at: string;
}

export default function ResidentProfileScreen() {
  const [activeTab, setActiveTab] = useState('details');
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [resident, setResident] = useState<Resident | null>(null);
  const [currentRent, setCurrentRent] = useState<CurrentRent | null>(null);
  const [rentHistory, setRentHistory] = useState<RentHistory[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user } = useAuth();

  const residentId = params.id as string;

  useEffect(() => {
    if (residentId) {
      fetchResidentData();
    }
  }, [residentId]);

  const fetchResidentData = async () => {
    if (!residentId || !user) return;

    try {
      setLoading(true);

      // Fetch resident details
      const { data: residentData, error: residentError } = await supabase
        .from('residents')
        .select(`
          id,
          name,
          phone,
          photo_url,
          admission_date,
          emergency_contact,
          room_id,
          rooms (
            room_number
          )
        `)
        .eq('id', residentId)
        .eq('hostel_id', user.id)
        .single();

      if (residentError) throw residentError;

      const formattedResident: Resident = {
        id: residentData.id,
        name: residentData.name,
        phone: residentData.phone,
        photo_url: residentData.photo_url,
        room_number: residentData.rooms?.room_number || null,
        admission_date: residentData.admission_date,
        emergency_contact: residentData.emergency_contact,
      };

      setResident(formattedResident);

      // Fetch current rent (most recent unpaid or partial)
      const { data: currentRentData, error: rentError } = await supabase
        .from('rents')
        .select('*')
        .eq('resident_id', residentId)
        .in('status', ['due', 'partial'])
        .order('due_date', { ascending: true })
        .limit(1)
        .single();

      if (rentError && rentError.code !== 'PGRST116') {
        // PGRST116 is "no rows returned" which is fine
        logError('ResidentProfile.fetchCurrentRent', rentError);
      } else if (currentRentData) {
        setCurrentRent(currentRentData);
      }

      // Fetch rent history (all rents, ordered by date desc)
      const { data: historyData, error: historyError } = await supabase
        .from('rents')
        .select('*')
        .eq('resident_id', residentId)
        .order('created_at', { ascending: false })
        .limit(12);

      if (historyError) throw historyError;
      setRentHistory(historyData || []);

      // Fetch documents
      const { data: docsData, error: docsError } = await supabase
        .from('documents')
        .select('*')
        .eq('resident_id', residentId)
        .order('created_at', { ascending: false });

      if (docsError) throw docsError;
      setDocuments(docsData || []);
    } catch (error: unknown) {
      logError('ResidentProfile.fetchResidentData', error);
      Alert.alert('Error', 'Failed to load resident data');
    } finally {
      setLoading(false);
    }
  };

  const handlePayRent = async () => {
    if (!currentRent) return;

    Alert.alert(
      'Confirm Payment',
      `Mark rent of ₹${currentRent.amount} as paid?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            setPaying(true);
            try {
              const { error } = await supabase
                .from('rents')
                .update({
                  paid_amount: currentRent.amount,
                  status: 'paid',
                })
                .eq('id', currentRent.id);

              if (error) throw error;

              Alert.alert('Success', 'Rent marked as paid!', [
                {
                  text: 'OK',
                  onPress: () => {
                    fetchResidentData();
                  },
                },
              ]);
            } catch (error: unknown) {
              logError('ResidentProfile.handlePayRent', error);
              Alert.alert(
                'Error',
                error instanceof Error
                  ? error.message
                  : 'Failed to mark rent as paid'
              );
            } finally {
              setPaying(false);
            }
          },
        },
      ]
    );
  };


  const openDocument = (url: string) => {
    Linking.openURL(url).catch((err) => {
      logError('ResidentProfile.openDocument', err);
      Alert.alert('Error', 'Failed to open document');
    });
  };

  const getDocumentName = (fileType: string) => {
    const typeMap: Record<string, string> = {
      aadhar: 'Aadhar Card',
      id_proof: 'ID Proof',
      photo: 'Photo',
    };
    return typeMap[fileType] || fileType;
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: 'Resident Profile',
          headerStyle: { backgroundColor: '#2563eb' },
          headerTintColor: '#fff',
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()}>
              <ArrowLeft size={24} color="#fff" />
            </TouchableOpacity>
          ),
        }}
      />
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563eb" />
        </View>
      ) : resident ? (
        <ScrollView style={styles.container}>
          <View style={styles.header}>
            {resident.photo_url ? (
              <Image
                source={{ uri: resident.photo_url }}
                style={styles.avatarImage}
              />
            ) : (
              <View style={styles.avatarLarge}>
                <Text style={styles.avatarText}>
                  {resident.name.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
            <Text style={styles.residentName}>{resident.name}</Text>
            <View style={styles.contactRow}>
              {resident.phone && (
                <View style={styles.contactItem}>
                  <Phone size={16} color="#64748b" />
                  <Text style={styles.contactText}>{resident.phone}</Text>
                </View>
              )}
            </View>
          </View>

        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'details' && styles.tabActive]}
            onPress={() => setActiveTab('details')}>
            <Text
              style={[
                styles.tabText,
                activeTab === 'details' && styles.tabTextActive,
              ]}>
              Details
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'rent' && styles.tabActive]}
            onPress={() => setActiveTab('rent')}>
            <Text
              style={[
                styles.tabText,
                activeTab === 'rent' && styles.tabTextActive,
              ]}>
              Rent
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'documents' && styles.tabActive]}
            onPress={() => setActiveTab('documents')}>
            <Text
              style={[
                styles.tabText,
                activeTab === 'documents' && styles.tabTextActive,
              ]}>
              Documents
            </Text>
          </TouchableOpacity>
        </View>

          {activeTab === 'details' && (
            <View style={styles.content}>
              <View style={styles.infoCard}>
                <View style={styles.infoRow}>
                  <View style={styles.infoIcon}>
                    <Calendar size={20} color="#2563eb" />
                  </View>
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Admission Date</Text>
                    <Text style={styles.infoValue}>
                      {formatDate(resident.admission_date)}
                    </Text>
                  </View>
                </View>

                {resident.room_number && (
                  <View style={styles.infoRow}>
                    <View style={styles.infoIcon}>
                      <DoorOpen size={20} color="#2563eb" />
                    </View>
                    <View style={styles.infoContent}>
                      <Text style={styles.infoLabel}>Room Number</Text>
                      <Text style={styles.infoValue}>
                        {resident.room_number}
                      </Text>
                    </View>
                  </View>
                )}

                <View style={styles.infoRow}>
                  <View style={styles.infoIcon}>
                    <AlertCircle size={20} color="#2563eb" />
                  </View>
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Emergency Contact</Text>
                    <Text style={styles.infoValue}>
                      {resident.emergency_contact}
                    </Text>
                  </View>
                </View>

                {resident.address && (
                  <View style={styles.infoRow}>
                    <View style={styles.infoIcon}>
                      <MapPin size={20} color="#2563eb" />
                    </View>
                    <View style={styles.infoContent}>
                      <Text style={styles.infoLabel}>Address</Text>
                      <Text style={styles.infoValue}>{resident.address}</Text>
                    </View>
                  </View>
                )}
              </View>
            </View>
          )}

          {activeTab === 'rent' && (
            <View style={styles.content}>
              {currentRent ? (
                <View style={styles.rentCard}>
                  <Text style={styles.rentTitle}>Current Rent</Text>
                  <Text style={styles.rentAmount}>
                    {formatCurrency(currentRent.amount)}
                  </Text>
                  <View style={styles.rentDue}>
                    <Text style={styles.rentDueLabel}>Due Date:</Text>
                    <Text style={styles.rentDueValue}>
                      {formatDate(currentRent.due_date)}
                    </Text>
                  </View>
                  {currentRent.status !== 'paid' && (
                    <TouchableOpacity
                      style={[styles.payButton, paying && styles.payButtonDisabled]}
                      onPress={handlePayRent}
                      disabled={paying}>
                      {paying ? (
                        <ActivityIndicator color="#fff" />
                      ) : (
                        <>
                          <IndianRupee size={20} color="#fff" />
                          <Text style={styles.payButtonText}>Pay Now</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  )}
                  {currentRent.status === 'paid' && (
                    <View style={styles.paidIndicator}>
                      <Text style={styles.paidIndicatorText}>Paid</Text>
                    </View>
                  )}
                </View>
              ) : (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateText}>No pending rent</Text>
                </View>
              )}

              <Text style={styles.sectionTitle}>Rent History</Text>
              {rentHistory.length > 0 ? (
                rentHistory.map((record) => (
                  <View key={record.id} style={styles.historyCard}>
                    <View>
                      <Text style={styles.historyMonth}>
                        {formatMonthYear(record.due_date)}
                      </Text>
                      <Text style={styles.historyDate}>
                        {formatDate(record.created_at)}
                      </Text>
                    </View>
                    <View style={styles.historyRight}>
                      <Text style={styles.historyAmount}>
                        {formatCurrency(record.amount)}
                      </Text>
                      <View
                        style={[
                          styles.paidBadge,
                          record.status === 'paid' && styles.paidBadgeSuccess,
                          record.status === 'partial' && styles.paidBadgePartial,
                        ]}>
                        <Text
                          style={[
                            styles.paidText,
                            record.status === 'paid' && styles.paidTextSuccess,
                            record.status === 'partial' && styles.paidTextPartial,
                          ]}>
                          {record.status === 'paid'
                            ? 'Paid'
                            : record.status === 'partial'
                              ? 'Partial'
                              : 'Due'}
                        </Text>
                      </View>
                    </View>
                  </View>
                ))
              ) : (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateText}>No rent history</Text>
                </View>
              )}
            </View>
          )}

          {activeTab === 'documents' && (
            <View style={styles.content}>
              {documents.length > 0 ? (
                documents.map((doc) => (
                  <View key={doc.id} style={styles.documentCard}>
                    <View style={styles.documentLeft}>
                      <View style={[styles.documentIcon, { backgroundColor: '#dcfce7' }]}>
                        <FileText size={20} color="#16a34a" />
                      </View>
                      <View>
                        <Text style={styles.documentName}>
                          {getDocumentName(doc.file_type)}
                        </Text>
                        <Text style={[styles.documentStatus, { color: '#16a34a' }]}>
                          Uploaded {formatDate(doc.created_at)}
                        </Text>
                      </View>
                    </View>
                    <TouchableOpacity onPress={() => openDocument(doc.file_url)}>
                      <Text style={styles.viewButton}>View</Text>
                    </TouchableOpacity>
                  </View>
                ))
              ) : (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateText}>No documents uploaded</Text>
                </View>
              )}
            </View>
          )}
        </ScrollView>
      ) : (
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>Resident not found</Text>
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    backgroundColor: '#fff',
    padding: 24,
    alignItems: 'center',
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
  residentName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 12,
  },
  contactRow: {
    gap: 16,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  contactText: {
    fontSize: 14,
    color: '#64748b',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#2563eb',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
  tabTextActive: {
    color: '#2563eb',
  },
  content: {
    padding: 16,
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    gap: 16,
  },
  infoRow: {
    flexDirection: 'row',
    gap: 12,
  },
  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#dbeafe',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  rentCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
  },
  rentTitle: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 8,
  },
  rentAmount: {
    fontSize: 40,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 12,
  },
  rentDue: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 24,
  },
  rentDueLabel: {
    fontSize: 14,
    color: '#64748b',
  },
  rentDueValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#dc2626',
  },
  payButton: {
    backgroundColor: '#2563eb',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  payButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 12,
  },
  historyCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  historyMonth: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  historyDate: {
    fontSize: 12,
    color: '#64748b',
  },
  historyRight: {
    alignItems: 'flex-end',
  },
  historyAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  paidBadge: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  paidText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#16a34a',
  },
  documentCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  documentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  documentIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  documentName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  documentStatus: {
    fontSize: 12,
  },
  viewButton: {
    color: '#2563eb',
    fontSize: 14,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  avatarImage: {
    width: 96,
    height: 96,
    borderRadius: 48,
    marginBottom: 16,
  },
  avatarText: {
    color: '#fff',
    fontSize: 36,
    fontWeight: '700',
  },
  payButtonDisabled: {
    opacity: 0.6,
  },
  paidIndicator: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  paidIndicatorText: {
    color: '#16a34a',
    fontSize: 14,
    fontWeight: '600',
  },
  paidBadgeSuccess: {
    backgroundColor: '#dcfce7',
  },
  paidBadgePartial: {
    backgroundColor: '#fef3c7',
  },
  paidTextSuccess: {
    color: '#16a34a',
  },
  paidTextPartial: {
    color: '#ca8a04',
  },
  emptyState: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#64748b',
  },
  errorText: {
    fontSize: 16,
    color: '#dc2626',
  },
});

import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Wallet, AlertCircle, IndianRupee } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { logError, formatCurrency } from '@/lib/utils';
import type { RootStackParamList } from '@/types/navigation';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface Resident {
  id: string;
  name: string;
  room_number: string;
}

interface Rent {
  id: string;
  amount: number;
  paid_amount: number;
  due_date: string;
  status: string;
}

export default function CollectRentScreen() {
  const [residents, setResidents] = useState<Resident[]>([]);
  const [selectedResidentId, setSelectedResidentId] = useState('');
  const [rent, setRent] = useState<Rent | null>(null);
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingResidents, setLoadingResidents] = useState(true);
  const [error, setError] = useState('');
  const navigation = useNavigation<NavigationProp>();
  const { user } = useAuth();

  useEffect(() => {
    fetchResidents();
  }, [user]);

  useEffect(() => {
    if (selectedResidentId) {
      fetchRent();
    }
  }, [selectedResidentId]);

  const fetchResidents = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('residents')
        .select(`
          id,
          name,
          rooms (
            room_number
          )
        `)
        .eq('hostel_id', user.id)
        .eq('status', 'active')
        .order('name', { ascending: true });

      if (error) throw error;

      const formattedResidents: Resident[] = (data || []).map((r: any) => ({
        id: r.id,
        name: r.name,
        room_number: r.rooms?.room_number || 'N/A',
      }));

      setResidents(formattedResidents);
    } catch (error) {
      logError('CollectRent.fetchResidents', error);
      Alert.alert('Error', 'Failed to load residents');
    } finally {
      setLoadingResidents(false);
    }
  };

  const fetchRent = async () => {
    if (!selectedResidentId) return;

    try {
      const { data, error } = await supabase
        .from('rents')
        .select('*')
        .eq('resident_id', selectedResidentId)
        .in('status', ['due', 'partial'])
        .order('due_date', { ascending: true })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setRent(data);
        const remaining = data.amount - data.paid_amount;
        setAmount(remaining.toString());
      } else {
        setRent(null);
        setAmount('');
      }
    } catch (error) {
      logError('CollectRent.fetchRent', error);
    }
  };

  const handleSubmit = async () => {
    if (!selectedResidentId) {
      setError('Please select a resident');
      return;
    }

    if (!amount.trim() || isNaN(Number(amount)) || Number(amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    if (!rent) {
      setError('No pending rent found for this resident');
      return;
    }

    const paymentAmount = Number(amount);
    const newPaidAmount = rent.paid_amount + paymentAmount;
    const totalAmount = rent.amount;

    if (newPaidAmount > totalAmount) {
      setError(`Amount cannot exceed total rent of ${formatCurrency(totalAmount)}`);
      return;
    }

    setError('');
    setLoading(true);

    try {
      let newStatus = 'partial';
      if (newPaidAmount >= totalAmount) {
        newStatus = 'paid';
      }

      const { error: updateError } = await supabase
        .from('rents')
        .update({
          paid_amount: newPaidAmount,
          status: newStatus,
        })
        .eq('id', rent.id);

      if (updateError) throw updateError;

      Alert.alert(
        'Success',
        `Rent of ${formatCurrency(paymentAmount)} collected successfully!`,
        [
          {
            text: 'OK',
            onPress: () => {
              navigation.goBack();
            },
          },
        ]
      );
    } catch (err: unknown) {
      logError('CollectRent.handleSubmit', err);
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to collect rent. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const selectedResident = residents.find((r) => r.id === selectedResidentId);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}>
      <ScrollView
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.iconCircle}>
            <Wallet size={32} color="#fff" />
          </View>
          <Text style={styles.headerTitle}>Collect Rent</Text>
          <Text style={styles.headerSubtitle}>
            Record rent payment from residents
          </Text>
        </View>

        <View style={styles.formContainer}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Select Resident <Text style={styles.required}>*</Text>
            </Text>
            {loadingResidents ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#2563eb" />
                <Text style={styles.loadingText}>Loading residents...</Text>
              </View>
            ) : (
              <ScrollView style={styles.residentList} nestedScrollEnabled>
                {residents.map((resident) => (
                  <TouchableOpacity
                    key={resident.id}
                    style={[
                      styles.residentOption,
                      selectedResidentId === resident.id &&
                        styles.residentOptionSelected,
                    ]}
                    onPress={() => setSelectedResidentId(resident.id)}>
                    <View>
                      <Text
                        style={[
                          styles.residentName,
                          selectedResidentId === resident.id &&
                            styles.residentNameSelected,
                        ]}>
                        {resident.name}
                      </Text>
                      <Text style={styles.residentRoom}>
                        Room {resident.room_number}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>

          {rent && selectedResident && (
            <View style={styles.rentInfo}>
              <Text style={styles.rentInfoTitle}>Pending Rent Details</Text>
              <View style={styles.rentInfoRow}>
                <Text style={styles.rentInfoLabel}>Total Rent:</Text>
                <Text style={styles.rentInfoValue}>
                  {formatCurrency(rent.amount)}
                </Text>
              </View>
              <View style={styles.rentInfoRow}>
                <Text style={styles.rentInfoLabel}>Already Paid:</Text>
                <Text style={styles.rentInfoValue}>
                  {formatCurrency(rent.paid_amount)}
                </Text>
              </View>
              <View style={styles.rentInfoRow}>
                <Text style={styles.rentInfoLabel}>Remaining:</Text>
                <Text style={[styles.rentInfoValue, styles.remainingAmount]}>
                  {formatCurrency(rent.amount - rent.paid_amount)}
                </Text>
              </View>
              <View style={styles.rentInfoRow}>
                <Text style={styles.rentInfoLabel}>Due Date:</Text>
                <Text style={styles.rentInfoValue}>
                  {new Date(rent.due_date).toLocaleDateString()}
                </Text>
              </View>
            </View>
          )}

          {rent && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Payment Amount <Text style={styles.required}>*</Text>
              </Text>
              <View style={styles.amountInputContainer}>
                <IndianRupee size={20} color="#64748b" />
                <TextInput
                  style={styles.amountInput}
                  placeholder="Enter amount"
                  value={amount}
                  onChangeText={(text) => {
                    setAmount(text.replace(/[^0-9.]/g, ''));
                    setError('');
                  }}
                  keyboardType="decimal-pad"
                  editable={!loading}
                />
              </View>
              <Text style={styles.hint}>
                Maximum: {formatCurrency(rent.amount - rent.paid_amount)}
              </Text>
            </View>
          )}

          {!rent && selectedResidentId && (
            <View style={styles.noRentContainer}>
              <Text style={styles.noRentText}>
                No pending rent found for this resident
              </Text>
            </View>
          )}

          {error ? (
            <View style={styles.errorContainer}>
              <AlertCircle size={16} color="#dc2626" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <TouchableOpacity
            style={[
              styles.submitButton,
              (loading || !rent || !selectedResidentId) &&
                styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={loading || !rent || !selectedResidentId}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>Collect Rent</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => navigation.goBack()}
            disabled={loading}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  contentContainer: {
    padding: 24,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#16a34a',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
  },
  formContainer: {
    width: '100%',
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 8,
  },
  required: {
    color: '#dc2626',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 16,
  },
  loadingText: {
    color: '#64748b',
    fontSize: 14,
  },
  residentList: {
    maxHeight: 200,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  residentOption: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  residentOptionSelected: {
    backgroundColor: '#dbeafe',
  },
  residentName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  residentNameSelected: {
    color: '#2563eb',
  },
  residentRoom: {
    fontSize: 14,
    color: '#64748b',
  },
  rentInfo: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  rentInfoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 12,
  },
  rentInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  rentInfoLabel: {
    fontSize: 14,
    color: '#64748b',
  },
  rentInfoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
  },
  remainingAmount: {
    color: '#dc2626',
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
    gap: 8,
  },
  amountInput: {
    flex: 1,
    padding: 12,
    fontSize: 16,
    color: '#1e293b',
  },
  hint: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
  },
  noRentContainer: {
    backgroundColor: '#fef3c7',
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
  },
  noRentText: {
    color: '#ca8a04',
    fontSize: 14,
    textAlign: 'center',
  },
  submitButton: {
    backgroundColor: '#16a34a',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  cancelButton: {
    marginTop: 12,
    padding: 16,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#64748b',
    fontSize: 16,
    fontWeight: '600',
  },
  inputError: {
    borderColor: '#dc2626',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fee2e2',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: '#dc2626',
    fontSize: 14,
    flex: 1,
  },
});


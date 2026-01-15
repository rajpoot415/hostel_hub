import { useState } from 'react';
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
import { DoorOpen, AlertCircle } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { logError } from '@/lib/utils';
import type { RootStackParamList } from '@/types/navigation';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function AddRoomScreen() {
  const [floor, setFloor] = useState('');
  const [branch, setBranch] = useState('');
  const [roomNumber, setRoomNumber] = useState('');
  const [capacity, setCapacity] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigation = useNavigation<NavigationProp>();
  const { user } = useAuth();

  const handleSubmit = async () => {
    // Validation
    if (!floor.trim() || isNaN(Number(floor)) || Number(floor) <= 0) {
      setError('Please enter a valid floor number');
      return;
    }
    if (!roomNumber.trim()) {
      setError('Please enter room number');
      return;
    }
    if (!capacity.trim() || isNaN(Number(capacity)) || Number(capacity) <= 0) {
      setError('Please enter a valid capacity (greater than 0)');
      return;
    }

    if (!user) {
      Alert.alert('Error', 'User not authenticated');
      return;
    }

    setError('');
    setLoading(true);

    try {
      // Check if room number already exists for this hostel (with same floor and branch)
      const { data: existingRooms, error: checkError } = await supabase
        .from('rooms')
        .select('id, room_number, floor, branch')
        .eq('hostel_id', user.id)
        .eq('room_number', roomNumber.trim())
        .eq('floor', Number(floor))
        .eq('branch', branch.trim() || null);

      if (existingRooms && existingRooms.length > 0) {
        const existing = existingRooms[0];
        const existingDisplay = branch.trim()
          ? `${branch.trim()}-Floor ${existing.floor}-Room ${existing.room_number}`
          : `Floor ${existing.floor}-Room ${existing.room_number}`;
        setError(`Room already exists: ${existingDisplay}`);
        setLoading(false);
        return;
      }

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }

      // Insert new room with separate fields
      const { error: insertError } = await supabase.from('rooms').insert({
        hostel_id: user.id,
        room_number: roomNumber.trim(),
        floor: Number(floor),
        branch: branch.trim() || null,
        capacity: Number(capacity),
        occupied_seats: 0,
      });

      if (insertError) throw insertError;

      Alert.alert('Success', 'Room added successfully!', [
        {
          text: 'OK',
          onPress: () => {
            navigation.goBack();
          },
        },
      ]);
    } catch (err: unknown) {
      logError('AddRoom.handleSubmit', err);
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to add room. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

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
            <DoorOpen size={32} color="#fff" />
          </View>
          <Text style={styles.headerTitle}>Add New Room</Text>
          <Text style={styles.headerSubtitle}>
            Create a new room in your hostel
          </Text>
        </View>

        <View style={styles.formContainer}>
          <View style={styles.row}>
            <View style={[styles.inputGroup, styles.flex1]}>
              <Text style={styles.label}>
                Floor <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[styles.input, error && error.includes('floor') && styles.inputError]}
                placeholder="e.g., 1, 2, 3"
                value={floor}
                onChangeText={(text) => {
                  setFloor(text.replace(/[^0-9]/g, ''));
                  setError('');
                }}
                keyboardType="number-pad"
                editable={!loading}
              />
              <Text style={styles.hint}>Floor number</Text>
            </View>

            <View style={[styles.inputGroup, styles.flex1]}>
              <Text style={styles.label}>Branch (Optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., A, B, C"
                value={branch}
                onChangeText={(text) => {
                  setBranch(text.toUpperCase().replace(/[^A-Z]/g, ''));
                  setError('');
                }}
                autoCapitalize="characters"
                maxLength={2}
                editable={!loading}
              />
              <Text style={styles.hint}>Branch/Wing</Text>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Room Number <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={[styles.input, error && error.includes('number') && styles.inputError]}
              placeholder="e.g., 01, 02, 10"
              value={roomNumber}
              onChangeText={(text) => {
                setRoomNumber(text.replace(/[^0-9]/g, ''));
                setError('');
              }}
              keyboardType="number-pad"
              editable={!loading}
            />
            <Text style={styles.hint}>
              Room number (e.g., 01, 02, 10, 15)
            </Text>
            {floor && roomNumber && (
              <Text style={styles.previewText}>
                Room: {branch ? `${branch} - ` : ''}Floor {floor} - Room {roomNumber}
              </Text>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Capacity <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={[styles.input, error && error.includes('capacity') && styles.inputError]}
              placeholder="e.g., 2, 3, 4"
              value={capacity}
              onChangeText={(text) => {
                setCapacity(text.replace(/[^0-9]/g, ''));
                setError('');
              }}
              keyboardType="number-pad"
              editable={!loading}
            />
            <Text style={styles.hint}>
              Maximum number of residents this room can accommodate
            </Text>
          </View>

          {error ? (
            <View style={styles.errorContainer}>
              <AlertCircle size={16} color="#dc2626" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>Add Room</Text>
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
    backgroundColor: '#2563eb',
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
  input: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
    color: '#1e293b',
  },
  hint: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
  },
  submitButton: {
    backgroundColor: '#2563eb',
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
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  flex1: {
    flex: 1,
  },
  previewText: {
    fontSize: 12,
    color: '#2563eb',
    fontWeight: '600',
    marginTop: 4,
  },
});


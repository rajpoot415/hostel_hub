import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { ArrowLeft, Upload } from 'lucide-react-native';

const availableRooms = [
  { value: '103', label: 'Room 103 (2/2 vacant)' },
  { value: '205', label: 'Room 205 (1/2 vacant)' },
  { value: '303', label: 'Room 303 (2/2 vacant)' },
  { value: '401', label: 'Room 401 (3/4 vacant)' },
  { value: '404', label: 'Room 404 (2/4 vacant)' },
];

export default function AddResidentScreen() {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    emergencyContact: '',
    emergencyPhone: '',
    room: '',
    rentAmount: '',
    dueDate: '',
  });

  const [showRoomPicker, setShowRoomPicker] = useState(false);

  const router = useRouter();

  const handleSubmit = () => {
    router.back();
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: 'Add New Resident',
          headerStyle: { backgroundColor: '#2563eb' },
          headerTintColor: '#fff',
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()}>
              <ArrowLeft size={24} color="#fff" />
            </TouchableOpacity>
          ),
        }}
      />
      <ScrollView style={styles.container}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Details</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Full Name <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Enter full name"
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, styles.flex1]}>
              <Text style={styles.label}>
                Phone Number <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={styles.input}
                placeholder="+91 98765 43210"
                keyboardType="phone-pad"
                value={formData.phone}
                onChangeText={(text) =>
                  setFormData({ ...formData, phone: text })
                }
              />
            </View>

            <View style={[styles.inputGroup, styles.flex1]}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="email@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
                value={formData.email}
                onChangeText={(text) =>
                  setFormData({ ...formData, email: text })
                }
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Address</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Enter full address"
              multiline
              numberOfLines={3}
              value={formData.address}
              onChangeText={(text) =>
                setFormData({ ...formData, address: text })
              }
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Emergency Contact Name <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Enter contact name"
              value={formData.emergencyContact}
              onChangeText={(text) =>
                setFormData({ ...formData, emergencyContact: text })
              }
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Emergency Contact Phone <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              placeholder="+91 98765 00000"
              keyboardType="phone-pad"
              value={formData.emergencyPhone}
              onChangeText={(text) =>
                setFormData({ ...formData, emergencyPhone: text })
              }
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Room Selection</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Select Room <Text style={styles.required}>*</Text>
            </Text>
            <TouchableOpacity
              style={styles.pickerButton}
              onPress={() => setShowRoomPicker(!showRoomPicker)}>
              <Text
                style={[
                  styles.pickerText,
                  !formData.room && styles.pickerPlaceholder,
                ]}>
                {formData.room
                  ? availableRooms.find((r) => r.value === formData.room)?.label
                  : 'Choose available room'}
              </Text>
            </TouchableOpacity>

            {showRoomPicker && (
              <View style={styles.pickerOptions}>
                {availableRooms.map((room) => (
                  <TouchableOpacity
                    key={room.value}
                    style={styles.pickerOption}
                    onPress={() => {
                      setFormData({ ...formData, room: room.value });
                      setShowRoomPicker(false);
                    }}>
                    <Text style={styles.pickerOptionText}>{room.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Rent Details</Text>

          <View style={styles.row}>
            <View style={[styles.inputGroup, styles.flex1]}>
              <Text style={styles.label}>
                Monthly Rent <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={styles.input}
                placeholder="8000"
                keyboardType="numeric"
                value={formData.rentAmount}
                onChangeText={(text) =>
                  setFormData({ ...formData, rentAmount: text })
                }
              />
            </View>

            <View style={[styles.inputGroup, styles.flex1]}>
              <Text style={styles.label}>
                Due Date <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={styles.input}
                placeholder="5 (Day of month)"
                keyboardType="numeric"
                value={formData.dueDate}
                onChangeText={(text) =>
                  setFormData({ ...formData, dueDate: text })
                }
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Documents</Text>

          <TouchableOpacity style={styles.uploadButton}>
            <Upload size={20} color="#2563eb" />
            <Text style={styles.uploadText}>Upload Aadhar Card</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.uploadButton}>
            <Upload size={20} color="#2563eb" />
            <Text style={styles.uploadText}>Upload ID Proof</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.uploadButton}>
            <Upload size={20} color="#2563eb" />
            <Text style={styles.uploadText}>Upload Photo</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => router.back()}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
            <Text style={styles.submitButtonText}>Add Resident</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
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
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  flex1: {
    flex: 1,
  },
  pickerButton: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#fff',
  },
  pickerText: {
    fontSize: 16,
    color: '#1e293b',
  },
  pickerPlaceholder: {
    color: '#94a3b8',
  },
  pickerOptions: {
    marginTop: 8,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
  },
  pickerOption: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  pickerOptionText: {
    fontSize: 16,
    color: '#1e293b',
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderStyle: 'dashed',
  },
  uploadText: {
    fontSize: 16,
    color: '#2563eb',
    fontWeight: '600',
  },
  buttonContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748b',
  },
  submitButton: {
    flex: 1,
    backgroundColor: '#2563eb',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});

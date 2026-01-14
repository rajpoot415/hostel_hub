import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { ArrowLeft, Upload, X, Check } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { logError } from '@/lib/utils';

interface Room {
  id: string;
  room_number: string;
  capacity: number;
  occupied_seats: number;
  vacant: number;
}

interface DocumentFile {
  uri: string;
  name: string;
  type: string;
  mimeType: string;
}

export default function AddResidentScreen() {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    emergencyContact: '',
    emergencyPhone: '',
    roomId: '',
    rentAmount: '',
    dueDate: '',
  });

  const [showRoomPicker, setShowRoomPicker] = useState(false);
  const [availableRooms, setAvailableRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [photo, setPhoto] = useState<DocumentFile | null>(null);
  const [documents, setDocuments] = useState<{
    aadhar: DocumentFile | null;
    idProof: DocumentFile | null;
  }>({
    aadhar: null,
    idProof: null,
  });

  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    fetchAvailableRooms();
  }, [user]);

  const fetchAvailableRooms = async () => {
    if (!user) return;

    try {
      const { data: rooms, error } = await supabase
        .from('rooms')
        .select('id, room_number, capacity, occupied_seats')
        .eq('hostel_id', user.id)
        .order('room_number', { ascending: true });

      if (error) throw error;

      const roomsWithVacancy = (rooms || [])
        .map((room) => ({
          ...room,
          vacant: room.capacity - room.occupied_seats,
        }))
        .filter((room) => room.vacant > 0);

      setAvailableRooms(roomsWithVacancy);
    } catch (error) {
      logError('AddResident.fetchAvailableRooms', error);
      Alert.alert('Error', 'Failed to load available rooms');
    } finally {
      setLoadingRooms(false);
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant camera roll permissions');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setPhoto({
        uri: asset.uri,
        name: `photo_${Date.now()}.jpg`,
        type: 'photo',
        mimeType: 'image/jpeg',
      });
    }
  };

  const pickDocument = async (type: 'aadhar' | 'idProof') => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        setDocuments((prev) => ({
          ...prev,
          [type]: {
            uri: asset.uri,
            name: asset.name || `document_${Date.now()}.pdf`,
            type: type,
            mimeType: asset.mimeType || 'application/pdf',
          },
        }));
      }
    } catch (error) {
      logError('AddResident.pickDocument', error);
      Alert.alert('Error', 'Failed to pick document');
    }
  };

  const uploadFile = async (
    file: DocumentFile,
    bucket: string,
    path: string
  ): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${path}_${Date.now()}.${fileExt}`;

      // Read file as blob for upload
      const fileData = await fetch(file.uri).then((res) => res.blob());

      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(fileName, fileData, {
          contentType: file.mimeType,
          upsert: false,
        });

      if (error) throw error;

      const {
        data: { publicUrl },
      } = supabase.storage.from(bucket).getPublicUrl(data.path);

      return publicUrl;
    } catch (error) {
      logError('AddResident.uploadFile', error);
      return null;
    }
  };

  const handleSubmit = async () => {
    // Validation
    if (!formData.name.trim()) {
      Alert.alert('Validation Error', 'Please enter full name');
      return;
    }
    if (!formData.phone.trim()) {
      Alert.alert('Validation Error', 'Please enter phone number');
      return;
    }
    if (!formData.emergencyContact.trim()) {
      Alert.alert('Validation Error', 'Please enter emergency contact name');
      return;
    }
    if (!formData.emergencyPhone.trim()) {
      Alert.alert('Validation Error', 'Please enter emergency contact phone');
      return;
    }
    if (!formData.roomId) {
      Alert.alert('Validation Error', 'Please select a room');
      return;
    }
    if (!formData.rentAmount.trim() || isNaN(Number(formData.rentAmount))) {
      Alert.alert('Validation Error', 'Please enter a valid rent amount');
      return;
    }
    if (
      !formData.dueDate.trim() ||
      isNaN(Number(formData.dueDate)) ||
      Number(formData.dueDate) < 1 ||
      Number(formData.dueDate) > 31
    ) {
      Alert.alert(
        'Validation Error',
        'Please enter a valid due date (1-31)'
      );
      return;
    }

    if (!user) {
      Alert.alert('Error', 'User not authenticated');
      return;
    }

    setLoading(true);

    try {
      // Calculate due date (current month + due day)
      const today = new Date();
      const dueDay = Number(formData.dueDate);
      const dueDate = new Date(today.getFullYear(), today.getMonth(), dueDay);
      if (dueDate < today) {
        dueDate.setMonth(dueDate.getMonth() + 1);
      }

      // Upload photo if provided
      let photoUrl: string | null = null;
      if (photo) {
        photoUrl = await uploadFile(
          photo,
          'resident-photos',
          `photo_${formData.name.replace(/\s+/g, '_')}`
        );
        if (!photoUrl) {
          Alert.alert('Warning', 'Failed to upload photo, continuing...');
        }
      }

      // Insert resident
      const { data: resident, error: residentError } = await supabase
        .from('residents')
        .insert({
          hostel_id: user.id,
          name: formData.name.trim(),
          phone: formData.phone.trim(),
          photo_url: photoUrl,
          room_id: formData.roomId,
          admission_date: today.toISOString().split('T')[0],
          emergency_contact: `${formData.emergencyContact.trim()} (${formData.emergencyPhone.trim()})`,
          status: 'active',
        })
        .select()
        .single();

      if (residentError) throw residentError;

      // Update room occupied_seats
      const selectedRoom = availableRooms.find((r) => r.id === formData.roomId);
      if (selectedRoom) {
        const { error: roomError } = await supabase
          .from('rooms')
          .update({
            occupied_seats: selectedRoom.occupied_seats + 1,
          })
          .eq('id', formData.roomId);

        if (roomError) throw roomError;
      }

      // Create rent record
      const { error: rentError } = await supabase.from('rents').insert({
        resident_id: resident.id,
        amount: Number(formData.rentAmount),
        paid_amount: 0,
        due_date: dueDate.toISOString().split('T')[0],
        status: 'due',
      });

      if (rentError) throw rentError;

      // Upload documents
      const documentUploads = [];
      if (documents.aadhar) {
        documentUploads.push(
          uploadFile(
            documents.aadhar,
            'resident-documents',
            `${resident.id}_aadhar`
          ).then((url) => {
            if (url) {
              return supabase.from('documents').insert({
                resident_id: resident.id,
                file_url: url,
                file_type: 'aadhar',
              });
            }
          })
        );
      }
      if (documents.idProof) {
        documentUploads.push(
          uploadFile(
            documents.idProof,
            'resident-documents',
            `${resident.id}_id_proof`
          ).then((url) => {
            if (url) {
              return supabase.from('documents').insert({
                resident_id: resident.id,
                file_url: url,
                file_type: 'id_proof',
              });
            }
          })
        );
      }

      await Promise.all(documentUploads);

      Alert.alert('Success', 'Resident added successfully!', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    } catch (error: unknown) {
      logError('AddResident.handleSubmit', error);
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Failed to add resident'
      );
    } finally {
      setLoading(false);
    }
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
            {loadingRooms ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#2563eb" />
                <Text style={styles.loadingText}>Loading rooms...</Text>
              </View>
            ) : (
              <>
                <TouchableOpacity
                  style={styles.pickerButton}
                  onPress={() => setShowRoomPicker(!showRoomPicker)}>
                  <Text
                    style={[
                      styles.pickerText,
                      !formData.roomId && styles.pickerPlaceholder,
                    ]}>
                    {formData.roomId
                      ? availableRooms.find((r) => r.id === formData.roomId)
                          ? `Room ${availableRooms.find((r) => r.id === formData.roomId)?.room_number} (${availableRooms.find((r) => r.id === formData.roomId)?.vacant} seat${availableRooms.find((r) => r.id === formData.roomId)?.vacant !== 1 ? 's' : ''} vacant)`
                          : 'Choose available room'
                      : 'Choose available room'}
                  </Text>
                </TouchableOpacity>

                {showRoomPicker && (
                  <View style={styles.pickerOptions}>
                    {availableRooms.length > 0 ? (
                      availableRooms.map((room) => (
                        <TouchableOpacity
                          key={room.id}
                          style={styles.pickerOption}
                          onPress={() => {
                            setFormData({ ...formData, roomId: room.id });
                            setShowRoomPicker(false);
                          }}>
                          <Text style={styles.pickerOptionText}>
                            Room {room.room_number} ({room.vacant} seat
                            {room.vacant !== 1 ? 's' : ''} vacant)
                          </Text>
                        </TouchableOpacity>
                      ))
                    ) : (
                      <View style={styles.pickerOption}>
                        <Text style={styles.pickerOptionText}>
                          No rooms available
                        </Text>
                      </View>
                    )}
                  </View>
                )}
              </>
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

          <TouchableOpacity
            style={styles.uploadButton}
            onPress={() => pickDocument('aadhar')}>
            <Upload size={20} color="#2563eb" />
            <View style={styles.uploadTextContainer}>
              {documents.aadhar && (
                <Check size={16} color="#16a34a" style={styles.uploadIcon} />
              )}
              <Text style={styles.uploadText}>
                {documents.aadhar
                  ? documents.aadhar.name
                  : 'Upload Aadhar Card'}
              </Text>
            </View>
            {documents.aadhar && (
              <TouchableOpacity
                onPress={() =>
                  setDocuments((prev) => ({ ...prev, aadhar: null }))
                }>
                <X size={16} color="#dc2626" />
              </TouchableOpacity>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.uploadButton}
            onPress={() => pickDocument('idProof')}>
            <Upload size={20} color="#2563eb" />
            <View style={styles.uploadTextContainer}>
              {documents.idProof && (
                <Check size={16} color="#16a34a" style={styles.uploadIcon} />
              )}
              <Text style={styles.uploadText}>
                {documents.idProof
                  ? documents.idProof.name
                  : 'Upload ID Proof'}
              </Text>
            </View>
            {documents.idProof && (
              <TouchableOpacity
                onPress={() =>
                  setDocuments((prev) => ({ ...prev, idProof: null }))
                }>
                <X size={16} color="#dc2626" />
              </TouchableOpacity>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.uploadButton} onPress={pickImage}>
            <Upload size={20} color="#2563eb" />
            <View style={styles.uploadTextContainer}>
              {photo && (
                <Check size={16} color="#16a34a" style={styles.uploadIcon} />
              )}
              <Text style={styles.uploadText}>
                {photo ? 'Photo selected' : 'Upload Photo'}
              </Text>
            </View>
            {photo && (
              <TouchableOpacity onPress={() => setPhoto(null)}>
                <X size={16} color="#dc2626" />
              </TouchableOpacity>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => router.back()}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>Add Resident</Text>
            )}
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
    justifyContent: 'space-between',
  },
  uploadTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 8,
  },
  uploadIcon: {
    marginRight: 4,
  },
  uploadText: {
    fontSize: 16,
    color: '#2563eb',
    fontWeight: '600',
    flex: 1,
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
  submitButtonDisabled: {
    opacity: 0.6,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
  },
  loadingText: {
    fontSize: 14,
    color: '#64748b',
  },
});

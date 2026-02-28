import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { formatDate, logError } from '@/lib/utils';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/types/navigation';
import { Calendar, ChevronDown } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';

type GiveNoticeRouteProp = RouteProp<RootStackParamList, 'GiveNotice'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function GiveNoticeScreen() {
  const [leavingDate, setLeavingDate] = useState('');
  const [noticeDate, setNoticeDate] = useState(
    new Date().toISOString().split('T')[0],
  );
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showNoticeDatePicker, setShowNoticeDatePicker] = useState(false);
  const [showLeavingDatePicker, setShowLeavingDatePicker] = useState(false);
  const [tempNoticeDate, setTempNoticeDate] = useState(new Date());
  const [tempLeavingDate, setTempLeavingDate] = useState(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  );
  const [checkingNotice, setCheckingNotice] = useState(true);
  const [hasActiveNotice, setHasActiveNotice] = useState(false);
  const [existingNotice, setExistingNotice] = useState<Notice | null>(null);
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<GiveNoticeRouteProp>();
  const { user } = useAuth();

  const residentId = route.params?.residentId;

  // Check if resident already has an active notice
  useEffect(() => {
    const checkActiveNotice = async () => {
      if (!residentId) return;

      try {
        const { data, error } = await supabase
          .from('notices')
          .select('*')
          .eq('resident_id', residentId)
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (error && error.code !== 'PGRST116') {
          throw error;
        }

        if (data) {
          setHasActiveNotice(true);
          setExistingNotice(data);
        }
      } catch (error) {
        logError('GiveNotice.checkActiveNotice', error);
      } finally {
        setCheckingNotice(false);
      }
    };

    checkActiveNotice();
  }, [residentId]);

  const handleSubmit = async () => {
    if (hasActiveNotice) {
      Alert.alert(
        'Notice Already Exists',
        'This resident already has an active notice. Please cancel the existing notice first.',
      );
      return;
    }

    if (!leavingDate) {
      Alert.alert('Error', 'Please select a leaving date');
      return;
    }

    if (!residentId) {
      Alert.alert('Error', 'Resident ID is missing');
      return;
    }

    const leaving = new Date(leavingDate);
    const notice = new Date(noticeDate);

    if (leaving < notice) {
      Alert.alert(
        'Error',
        'Leaving date cannot be before notice date',
      );
      return;
    }

    Alert.alert(
      'Confirm Notice',
      `Create notice for leaving on ${formatDate(leavingDate)}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            setSubmitting(true);
            try {
              const { error } = await supabase.from('notices').insert({
                resident_id: residentId,
                notice_date: noticeDate,
                leaving_date: leavingDate,
                status: 'active',
                notes: notes.trim() || null,
              });

              if (error) throw error;

              Alert.alert('Success', 'Notice created successfully!', [
                {
                  text: 'OK',
                  onPress: () => {
                    // Navigate back and let useFocusEffect handle refresh
                    navigation.goBack();
                  },
                },
              ]);
            } catch (error: unknown) {
              logError('GiveNotice.handleSubmit', error);
              Alert.alert(
                'Error',
                error instanceof Error
                  ? error.message
                  : 'Failed to create notice',
              );
            } finally {
              setSubmitting(false);
            }
          },
        },
      ],
    );
  };

  // Date picker handlers
  const handleNoticeDateSelect = () => {
    const dateStr = tempNoticeDate.toISOString().split('T')[0];
    setNoticeDate(dateStr);
    setShowNoticeDatePicker(false);
  };

  const handleLeavingDateSelect = () => {
    const dateStr = tempLeavingDate.toISOString().split('T')[0];
    setLeavingDate(dateStr);
    setShowLeavingDatePicker(false);
  };

  const openNoticeDatePicker = () => {
    setTempNoticeDate(new Date(noticeDate || Date.now()));
    setShowNoticeDatePicker(true);
  };

  const openLeavingDatePicker = () => {
    setTempLeavingDate(new Date(leavingDate || Date.now() + 30 * 24 * 60 * 60 * 1000));
    setShowLeavingDatePicker(true);
  };

  // Generate date picker options
  const generateDateOptions = (startYear: number = new Date().getFullYear(), years: number = 5) => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const yearOptions = Array.from({ length: years }, (_, i) => startYear + i);
    const monthOptions = months.map((month, index) => ({ label: month, value: index + 1 }));
    const dayOptions = Array.from({ length: 31 }, (_, i) => i + 1);
    return { yearOptions, monthOptions, dayOptions };
  };

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month, 0).getDate();
  };

  const DatePickerModal = ({
    visible,
    date,
    onDateChange,
    onConfirm,
    onCancel,
    minDate,
  }: {
    visible: boolean;
    date: Date;
    onDateChange: (date: Date) => void;
    onConfirm: () => void;
    onCancel: () => void;
    minDate?: Date;
  }) => {
    const currentYear = date.getFullYear();
    const currentMonth = date.getMonth() + 1;
    const currentDay = date.getDate();
    
    const { yearOptions, monthOptions } = generateDateOptions();
    const maxDays = getDaysInMonth(currentYear, currentMonth);
    
    const [selectedYear, setSelectedYear] = useState(currentYear);
    const [selectedMonth, setSelectedMonth] = useState(currentMonth);
    const [selectedDay, setSelectedDay] = useState(Math.min(currentDay, maxDays));

    // Update state when date prop changes
    useEffect(() => {
      if (visible) {
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const day = date.getDate();
        setSelectedYear(year);
        setSelectedMonth(month);
        setSelectedDay(day);
      }
    }, [visible, date]);

    const handleConfirm = () => {
      const newDate = new Date(selectedYear, selectedMonth - 1, selectedDay);
      if (minDate && newDate < minDate) {
        Alert.alert('Error', 'Selected date cannot be before minimum date');
        return;
      }
      onDateChange(newDate);
      onConfirm();
    };

    const dayOptions = Array.from(
      { length: getDaysInMonth(selectedYear, selectedMonth) },
      (_, i) => i + 1
    );

    return (
      <Modal
        visible={visible}
        transparent
        animationType="slide"
        onRequestClose={onCancel}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Date</Text>
            
            <View style={styles.datePickerContainer}>
              <View style={styles.pickerColumn}>
                <Text style={styles.pickerLabel}>Day</Text>
                <ScrollView style={styles.pickerScroll}>
                  {dayOptions.map((day) => (
                    <TouchableOpacity
                      key={day}
                      style={[
                        styles.pickerOption,
                        selectedDay === day && styles.pickerOptionSelected,
                      ]}
                      onPress={() => setSelectedDay(day)}>
                      <Text
                        style={[
                          styles.pickerOptionText,
                          selectedDay === day && styles.pickerOptionTextSelected,
                        ]}>
                        {day}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <View style={styles.pickerColumn}>
                <Text style={styles.pickerLabel}>Month</Text>
                <ScrollView style={styles.pickerScroll}>
                  {monthOptions.map((month) => (
                    <TouchableOpacity
                      key={month.value}
                      style={[
                        styles.pickerOption,
                        selectedMonth === month.value && styles.pickerOptionSelected,
                      ]}
                      onPress={() => {
                        setSelectedMonth(month.value);
                        const newMaxDays = getDaysInMonth(selectedYear, month.value);
                        if (selectedDay > newMaxDays) {
                          setSelectedDay(newMaxDays);
                        }
                      }}>
                      <Text
                        style={[
                          styles.pickerOptionText,
                          selectedMonth === month.value && styles.pickerOptionTextSelected,
                        ]}>
                        {month.label.substring(0, 3)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <View style={styles.pickerColumn}>
                <Text style={styles.pickerLabel}>Year</Text>
                <ScrollView style={styles.pickerScroll}>
                  {yearOptions.map((year) => (
                    <TouchableOpacity
                      key={year}
                      style={[
                        styles.pickerOption,
                        selectedYear === year && styles.pickerOptionSelected,
                      ]}
                      onPress={() => {
                        setSelectedYear(year);
                        const newMaxDays = getDaysInMonth(year, selectedMonth);
                        if (selectedDay > newMaxDays) {
                          setSelectedDay(newMaxDays);
                        }
                      }}>
                      <Text
                        style={[
                          styles.pickerOptionText,
                          selectedYear === year && styles.pickerOptionTextSelected,
                        ]}>
                        {year}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={onCancel}>
                <Text style={styles.modalButtonCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonConfirm]}
                onPress={handleConfirm}>
                <Text style={styles.modalButtonConfirmText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  // Show loading while checking for existing notice
  if (checkingNotice) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  // Show existing notice if one exists
  if (hasActiveNotice && existingNotice) {
    return (
      <ScrollView style={styles.container}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Calendar size={32} color="#2563eb" />
            <Text style={styles.title}>Notice Already Exists</Text>
            <Text style={styles.subtitle}>
              This resident already has an active notice
            </Text>
          </View>

          <View style={styles.existingNoticeCard}>
            <Text style={styles.existingNoticeTitle}>Active Notice Details</Text>
            <View style={styles.existingNoticeRow}>
              <Text style={styles.existingNoticeLabel}>Notice Date:</Text>
              <Text style={styles.existingNoticeValue}>
                {formatDate(existingNotice.notice_date)}
              </Text>
            </View>
            <View style={styles.existingNoticeRow}>
              <Text style={styles.existingNoticeLabel}>Leaving Date:</Text>
              <Text style={styles.existingNoticeValue}>
                {formatDate(existingNotice.leaving_date)}
              </Text>
            </View>
            {existingNotice.notes && (
              <View style={styles.existingNoticeRow}>
                <Text style={styles.existingNoticeLabel}>Notes:</Text>
                <Text style={styles.existingNoticeValue}>{existingNotice.notes}</Text>
              </View>
            )}
            <View style={styles.existingNoticeBadge}>
              <Text style={styles.existingNoticeBadgeText}>
                Notice Status: Active
              </Text>
            </View>
            <Text style={styles.existingNoticeMessage}>
              To create a new notice, please cancel the existing notice first from the Notices screen.
            </Text>
          </View>

          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Calendar size={32} color="#2563eb" />
          <Text style={styles.title}>Give Notice</Text>
          <Text style={styles.subtitle}>
            Set the date when the resident will be leaving
          </Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Notice Date</Text>
            <TouchableOpacity
              style={styles.dateInput}
              onPress={openNoticeDatePicker}>
              <Text style={[styles.dateInputText, !noticeDate && styles.dateInputPlaceholder]}>
                {noticeDate ? formatDate(noticeDate) : 'Select notice date'}
              </Text>
              <ChevronDown size={20} color="#64748b" />
            </TouchableOpacity>
            <Text style={styles.helpText}>
              Date when notice is being given (defaults to today)
            </Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Leaving Date *</Text>
            <TouchableOpacity
              style={styles.dateInput}
              onPress={openLeavingDatePicker}>
              <Text style={[styles.dateInputText, !leavingDate && styles.dateInputPlaceholder]}>
                {leavingDate ? formatDate(leavingDate) : 'Select leaving date'}
              </Text>
              <ChevronDown size={20} color="#64748b" />
            </TouchableOpacity>
            <Text style={styles.helpText}>
              Date when the resident will leave (seat will be available from this date)
            </Text>
            {!leavingDate && (
              <TouchableOpacity
                style={styles.quickDateButton}
                onPress={() => {
                  const date = new Date();
                  date.setDate(date.getDate() + 30);
                  setLeavingDate(date.toISOString().split('T')[0]);
                }}>
                <Text style={styles.quickDateText}>
                  Set to 30 days from now
                </Text>
              </TouchableOpacity>
            )}
          </View>

          <DatePickerModal
            visible={showNoticeDatePicker}
            date={tempNoticeDate}
            onDateChange={setTempNoticeDate}
            onConfirm={handleNoticeDateSelect}
            onCancel={() => setShowNoticeDatePicker(false)}
            minDate={new Date()}
          />

          <DatePickerModal
            visible={showLeavingDatePicker}
            date={tempLeavingDate}
            onDateChange={setTempLeavingDate}
            onConfirm={handleLeavingDateSelect}
            onCancel={() => setShowLeavingDatePicker(false)}
            minDate={new Date(noticeDate || Date.now())}
          />

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Notes (Optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Add any additional notes about this notice..."
              placeholderTextColor="#94a3b8"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          <TouchableOpacity
            style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={submitting}>
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>Create Notice</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1e293b',
    marginTop: 16,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
  },
  form: {
    gap: 24,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1e293b',
  },
  textArea: {
    minHeight: 100,
    paddingTop: 12,
  },
  helpText: {
    fontSize: 12,
    color: '#64748b',
  },
  quickDateButton: {
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#dbeafe',
    borderRadius: 6,
    marginTop: 4,
  },
  quickDateText: {
    fontSize: 12,
    color: '#2563eb',
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: '#2563eb',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  dateInput: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateInputText: {
    fontSize: 16,
    color: '#1e293b',
  },
  dateInputPlaceholder: {
    color: '#94a3b8',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 20,
    textAlign: 'center',
  },
  datePickerContainer: {
    flexDirection: 'row',
    gap: 12,
    height: 200,
    marginBottom: 20,
  },
  pickerColumn: {
    flex: 1,
    gap: 8,
  },
  pickerLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
    textAlign: 'center',
  },
  pickerScroll: {
    flex: 1,
  },
  pickerOption: {
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 6,
    marginBottom: 4,
  },
  pickerOptionSelected: {
    backgroundColor: '#2563eb',
  },
  pickerOptionText: {
    fontSize: 16,
    color: '#1e293b',
    textAlign: 'center',
  },
  pickerOptionTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
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
  modalButtonConfirm: {
    backgroundColor: '#2563eb',
  },
  modalButtonCancelText: {
    color: '#64748b',
    fontSize: 16,
    fontWeight: '600',
  },
  modalButtonConfirmText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  existingNoticeCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    borderWidth: 2,
    borderColor: '#dbeafe',
  },
  existingNoticeTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 16,
    textAlign: 'center',
  },
  existingNoticeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  existingNoticeLabel: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
    flex: 1,
  },
  existingNoticeValue: {
    fontSize: 14,
    color: '#1e293b',
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  existingNoticeBadge: {
    backgroundColor: '#dbeafe',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 8,
    marginBottom: 12,
    alignItems: 'center',
  },
  existingNoticeBadgeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2563eb',
  },
  existingNoticeMessage: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 8,
  },
  backButton: {
    backgroundColor: '#2563eb',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});


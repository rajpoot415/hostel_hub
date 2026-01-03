import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
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

const mockResident = {
  id: 1,
  name: 'Rahul Sharma',
  photo: null,
  phone: '+91 98765 43210',
  email: 'rahul.sharma@email.com',
  room: '101',
  admissionDate: 'Jan 15, 2024',
  emergencyContact: 'Suresh Sharma (+91 98765 00000)',
  address: 'Mumbai, Maharashtra',
  rentAmount: 8000,
  dueDate: 'Jan 5, 2025',
  status: 'Rent Due',
};

const rentHistory = [
  { month: 'Dec 2024', amount: 8000, status: 'Paid', date: 'Dec 2, 2024' },
  { month: 'Nov 2024', amount: 8000, status: 'Paid', date: 'Nov 1, 2024' },
  { month: 'Oct 2024', amount: 8000, status: 'Paid', date: 'Oct 3, 2024' },
  { month: 'Sep 2024', amount: 8000, status: 'Paid', date: 'Sep 1, 2024' },
];

const documents = [
  { name: 'Aadhar Card', uploaded: true },
  { name: 'ID Proof', uploaded: true },
  { name: 'Police Verification', uploaded: false },
];

export default function ResidentProfileScreen() {
  const [activeTab, setActiveTab] = useState('details');
  const router = useRouter();
  const params = useLocalSearchParams();

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
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <View style={styles.avatarLarge}>
            <User size={48} color="#fff" />
          </View>
          <Text style={styles.residentName}>{mockResident.name}</Text>
          <View style={styles.contactRow}>
            <View style={styles.contactItem}>
              <Phone size={16} color="#64748b" />
              <Text style={styles.contactText}>{mockResident.phone}</Text>
            </View>
            <View style={styles.contactItem}>
              <Mail size={16} color="#64748b" />
              <Text style={styles.contactText}>{mockResident.email}</Text>
            </View>
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
                    {mockResident.admissionDate}
                  </Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <View style={styles.infoIcon}>
                  <DoorOpen size={20} color="#2563eb" />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Room Number</Text>
                  <Text style={styles.infoValue}>{mockResident.room}</Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <View style={styles.infoIcon}>
                  <AlertCircle size={20} color="#2563eb" />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Emergency Contact</Text>
                  <Text style={styles.infoValue}>
                    {mockResident.emergencyContact}
                  </Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <View style={styles.infoIcon}>
                  <MapPin size={20} color="#2563eb" />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Address</Text>
                  <Text style={styles.infoValue}>{mockResident.address}</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {activeTab === 'rent' && (
          <View style={styles.content}>
            <View style={styles.rentCard}>
              <Text style={styles.rentTitle}>Current Rent</Text>
              <Text style={styles.rentAmount}>
                ₹{mockResident.rentAmount}
              </Text>
              <View style={styles.rentDue}>
                <Text style={styles.rentDueLabel}>Due Date:</Text>
                <Text style={styles.rentDueValue}>{mockResident.dueDate}</Text>
              </View>
              <TouchableOpacity style={styles.payButton}>
                <IndianRupee size={20} color="#fff" />
                <Text style={styles.payButtonText}>Pay Now</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.sectionTitle}>Rent History</Text>
            {rentHistory.map((record, index) => (
              <View key={index} style={styles.historyCard}>
                <View>
                  <Text style={styles.historyMonth}>{record.month}</Text>
                  <Text style={styles.historyDate}>{record.date}</Text>
                </View>
                <View style={styles.historyRight}>
                  <Text style={styles.historyAmount}>₹{record.amount}</Text>
                  <View style={styles.paidBadge}>
                    <Text style={styles.paidText}>{record.status}</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        {activeTab === 'documents' && (
          <View style={styles.content}>
            {documents.map((doc, index) => (
              <View key={index} style={styles.documentCard}>
                <View style={styles.documentLeft}>
                  <View
                    style={[
                      styles.documentIcon,
                      {
                        backgroundColor: doc.uploaded ? '#dcfce7' : '#fee2e2',
                      },
                    ]}>
                    <FileText
                      size={20}
                      color={doc.uploaded ? '#16a34a' : '#dc2626'}
                    />
                  </View>
                  <View>
                    <Text style={styles.documentName}>{doc.name}</Text>
                    <Text
                      style={[
                        styles.documentStatus,
                        { color: doc.uploaded ? '#16a34a' : '#dc2626' },
                      ]}>
                      {doc.uploaded ? 'Uploaded' : 'Not Uploaded'}
                    </Text>
                  </View>
                </View>
                {doc.uploaded && (
                  <TouchableOpacity>
                    <Text style={styles.viewButton}>View</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View>
        )}
      </ScrollView>
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
});

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Animated,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Calendar } from 'lucide-react-native';
import { useAuth } from '../../contexts/AuthContext';
import { appointmentApi } from '../../services/api';
import { COLORS, SPACING, FONT_SIZES } from '../../constants/theme';
import { useFocusEffect } from '@react-navigation/native';

interface Appointment {
  appointmentId: string;
  visitTypeName: string;
  patientBookedChannel: string;
  status: 'completed' | 'pending' | 'confirmed';
  paidAmount: number;
  practitionerName: string;
  dateTime: string;
}

type TabType = 'upcoming' | 'past';

export default function AppointmentsScreen() {
  const { patient } = useAuth();

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('upcoming');

  useFocusEffect(
    useCallback(() => {
      setActiveTab('upcoming');
      loadAppointments();
    }, [])
  );

  const loadAppointments = async () => {
    if (!patient) return;
    try {
      setLoading(true);
      const data = await appointmentApi.getPatientAppointments();
      setAppointments(data);
    } catch {
      Alert.alert('Error', 'Failed to load appointments');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAppointments();
    setRefreshing(false);
  };

  const now = new Date();

  const upcomingAppointments = useMemo(
    () => appointments.filter(a => new Date(a.dateTime) >= now),
    [appointments]
  );

  const pastAppointments = useMemo(
    () => appointments.filter(a => new Date(a.dateTime) < now),
    [appointments]
  );

  const filteredAppointments =
    activeTab === 'upcoming' ? upcomingAppointments : pastAppointments;

  const formatDateTime = (date: string) =>
    new Date(date).toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'completed':
        return { bg: '#34C75915', color: '#34C759' };
      case 'pending':
        return { bg: '#FF950015', color: '#FF9500' };
      case 'confirmed':
        return { bg: '#007AFF15', color: '#007AFF' };
      default:
        return { bg: COLORS.lightGray, color: COLORS.secondary };
    }
  };

  /* ---------------- Skeleton ---------------- */

  const SkeletonCard = () => (
    <View style={styles.skeletonCard}>
      <View style={styles.skeletonLineLarge} />
      <View style={styles.skeletonLineSmall} />
      <View style={styles.skeletonLineSmall} />
      <View style={styles.skeletonLineMedium} />
    </View>
  );

  /* ---------------- Appointment Card ---------------- */

  const AppointmentCard = ({ appointment }: { appointment: Appointment }) => {
    const statusStyle = getStatusStyle(appointment.status);

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.label}>Appointment Type</Text>
            <Text style={styles.value}>{appointment.visitTypeName}</Text>
          </View>

          <View
            style={[
              styles.statusBadge,
              { backgroundColor: statusStyle.bg },
            ]}
          >
            <Text
              style={[styles.statusText, { color: statusStyle.color }]}
            >
              {appointment.status.toUpperCase()}
            </Text>
          </View>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Practitioner</Text>
          <Text style={styles.value}>{appointment.practitionerName}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Appointment Date</Text>
          <Text style={styles.value}>
            {formatDateTime(appointment.dateTime)}
          </Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Booking Source</Text>
          <Text style={styles.value}>
            {appointment.patientBookedChannel}
          </Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Paid Amount</Text>
          <Text style={styles.value}>₹{appointment.paidAmount}</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#20206b', '#262f82', '#9966ff']}
        style={styles.headerBg}
      />

      <View style={styles.pageHeader}>
        <Calendar size={28} color={COLORS.white} />
        <Text style={styles.pageTitle}>Appointments</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          onPress={() => setActiveTab('upcoming')}
          style={[styles.tab, activeTab === 'upcoming' && styles.activeTab]}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'upcoming' && styles.activeTabText,
            ]}
          >
            UPCOMING ({upcomingAppointments.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveTab('past')}
          style={[styles.tab, activeTab === 'past' && styles.activeTab]}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'past' && styles.activeTabText,
            ]}
          >
            PAST ({pastAppointments.length})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.list}>
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <SkeletonCard key={`skeleton-${i}`} />
            ))
          ) : filteredAppointments.length === 0 ? (
            <Text style={styles.emptyText}>
              No {activeTab} appointments
            </Text>
          ) : (
            filteredAppointments.map((appt, idx) => (
              <AppointmentCard
                key={`${appt.appointmentId}-${idx}`}
                appointment={appt}
              />
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

/* ---------------- Styles ---------------- */

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F6FA' },

  headerBg: {
    position: 'absolute',
    height: 180,
    left: 0,
    right: 0,
  },

  pageHeader: {
    paddingTop: 55,
    paddingBottom: SPACING.md,
    paddingHorizontal: SPACING.lg,
  },

  pageTitle: {
    fontSize: FONT_SIZES.xl + 1,
    fontWeight: '600',
    color: COLORS.white,
    marginTop: 4,
  },

  tabs: {
    flexDirection: 'row',
    margin: SPACING.lg,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 4,
  },

  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },

  activeTab: { backgroundColor: COLORS.primary },

  tabText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.secondary,
  },

  activeTabText: { color: COLORS.white },

  list: { paddingHorizontal: SPACING.lg },

  card: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },

  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },

  row: { marginTop: 6 },

  label: {
    fontSize: FONT_SIZES.xs + 1,
    color: COLORS.textSecondary,
  },

  value: {
    fontSize: FONT_SIZES.sm + 1,
    fontWeight: '500',
    color: COLORS.secondary,
  },

  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },

  statusText: {
    fontSize: FONT_SIZES.xs - 1,
    fontWeight: '700',
  },

  skeletonCard: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },

  skeletonLineLarge: {
    height: 16,
    width: '70%',
    backgroundColor: COLORS.lightGray,
    borderRadius: 6,
    marginBottom: 8,
  },

  skeletonLineSmall: {
    height: 12,
    width: '45%',
    backgroundColor: COLORS.lightGray,
    borderRadius: 6,
    marginBottom: 8,
  },

  skeletonLineMedium: {
    height: 14,
    width: '60%',
    backgroundColor: COLORS.lightGray,
    borderRadius: 6,
  },

  emptyText: {
    textAlign: 'center',
    marginTop: SPACING.xl,
    fontSize: FONT_SIZES.sm + 1,
    color: COLORS.secondary,
  },
});

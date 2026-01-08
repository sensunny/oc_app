import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Calendar,
  Clock,
  XCircle,
  CheckCircle,
  MapPin,
  User,
} from 'lucide-react-native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { appointmentApi } from '../../services/api';
import { COLORS, SPACING, FONT_SIZES } from '../../constants/theme';
import { Sun, Sunrise, Sunset } from 'lucide-react-native';

/* ================= API ================= */

const API = 'https://www.oncarecancer.com/mobile-app/';

const groupSlotsByTime = (slots: any[]) => {
  const groups = {
    morning: [],
    afternoon: [],
    evening: [],
  };

  slots.forEach(slot => {
    const hour = new Date(slot.dateTime).getHours();

    if (hour >= 5 && hour < 12) groups.morning.push(slot);
    else if (hour >= 12 && hour < 17) groups.afternoon.push(slot);
    else if (hour >= 17 && hour < 22) groups.evening.push(slot);
  });

  return groups;
};


const retry = async <T,>(fn: () => Promise<T>, retries = 2): Promise<T> => {
  try {
    return await fn();
  } catch {
    if (retries <= 0) throw new Error('Failed');
    await new Promise(r => setTimeout(r, 800));
    return retry(fn, retries - 1);
  }
};

const post = async (url: string, body: any) => {
  const token = await AsyncStorage.getItem('access_token');

  const res = await fetch(`${API}${url}`, {
    method: 'POST',
    headers: {
      token: `${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const json = await res.json();
  if (json.code !== 1) throw new Error(json.message);
  return json.data;
};

/* ================= HELPERS ================= */

const formatDateTime = (dateStr: string) =>
  new Date(dateStr).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

const formatOnlyDate = (date: Date) =>
  date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

/* ================= TYPES ================= */

interface Appointment {
  appointmentId: string;
  visitTypeName: string;
  patientBookedChannel: string;
  status: 'completed' | 'pending' | 'confirmed' | 'cancelled';
  paidAmount: number;
  practitionerName: string;
  dateTime: string;
  locationId: string;
  locationAlias: string;
  practionerId: string;
}

type TabType = 'upcoming' | 'past';

/* ================= SCREEN ================= */

export default function AppointmentsScreen() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('upcoming');

  const [rescheduleAppt, setRescheduleAppt] = useState<Appointment | null>(null);
  const [cancelAppt, setCancelAppt] = useState<Appointment | null>(null);
  const [newDate, setNewDate] = useState(new Date());
  const [slots, setSlots] = useState<any[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<any>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [reviewMode, setReviewMode] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [slotLoading, setSlotLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [cancelSubmitting, setCancelSubmitting] = useState(false);
const [cancelSuccess, setCancelSuccess] = useState(false);

  /* ================= LOAD ================= */

  const loadAppointments = async () => {
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

  useFocusEffect(
    useCallback(() => {
      setActiveTab('upcoming');
      loadAppointments();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAppointments();
    setRefreshing(false);
  };

  /* ================= FILTER ================= */

  const now = new Date();

  const upcomingAppointments = useMemo(
  () =>
    appointments.filter(
      a =>
        new Date(a.dateTime) >= now &&
        (a.status === 'confirmed' || a.status === 'pending')
    ),
  [appointments]
);

const pastAppointments = useMemo(
  () =>
    appointments.filter(
      a =>
        new Date(a.dateTime) < now ||
        a.status === 'completed' ||
        a.status === 'cancelled'
    ),
  [appointments]
);

  const filteredAppointments =
    activeTab === 'upcoming' ? upcomingAppointments : pastAppointments;

  /* ================= SLOTS ================= */

  const fetchSlots = async (appt: Appointment, date: Date) => {
    setSlotLoading(true);
    setSlots([]);
    setSelectedSlot(null);
    setError('');
    try {
      const data = await retry(() =>
        post('visit-slots', {
          locationId: appt.locationId,
          practitionerId: appt.practionerId,
          visitTypeName: appt.visitTypeName,
          date: date.toISOString().split('T')[0],
        })
      );
      setSlots(data);

      const existing = data.find(
        (s: any) => s.dateTime === appt.dateTime
      );
      if (existing) {
        setSelectedSlot(existing);
      }
    } catch {
      Alert.alert('Error', 'Failed to load slots');
    } finally {
      setSlotLoading(false);
    }
  };

  const confirmReschedule = async () => {
    if (!selectedSlot) {
      setError('Please select a time slot');
      return;
    }

    try {
      setSubmitting(true);
      await retry(() =>
        post('reschedule-appointment', {
          appointmentId: rescheduleAppt?.appointmentId,
          locationId: rescheduleAppt?.locationId,
          dateTime: selectedSlot.dateTime,
        })
      );
      setSuccess(true);
      setTimeout(() => {
        setRescheduleAppt(null);
        setReviewMode(false);
        setSuccess(false);
        loadAppointments();
      }, 1600);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setSubmitting(false);
    }
  };

  /* ================= CARD ================= */

  const AppointmentCard = ({ appointment }: { appointment: Appointment }) => (
    <View style={styles.card}>
      <View
        style={[
          styles.statusBadge,
          appointment.status === 'confirmed' && styles.statusConfirmed,
          appointment.status === 'pending' && styles.statusPending,
          appointment.status === 'completed' && styles.statusCompleted,
          appointment.status === 'cancelled' && styles.statusCancelled,
        ]}
      >
        <Text style={styles.statusText}>
          {appointment.status.toUpperCase()}
        </Text>
      </View>

      <Text style={styles.cardTitle}>{appointment.visitTypeName}</Text>

      <View style={styles.row}>
        <User size={14} color={COLORS.primary} />
        <Text style={styles.label}>Doctor:</Text>
        <Text style={styles.value}>{appointment.practitionerName}</Text>
      </View>

      <View style={styles.row}>
        <MapPin size={14} color={COLORS.primary} />
        <Text style={styles.label}>Location:</Text>
        <Text style={styles.value}>{appointment.locationAlias}</Text>
      </View>

      <View style={styles.row}>
        <Clock size={14} color={COLORS.primary} />
        <Text style={styles.label}>Date:</Text>
        <Text style={styles.value}>
          {formatDateTime(appointment.dateTime)}
        </Text>
      </View>

      {appointment.status === 'confirmed' && (
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.glassBtn}
            onPress={() => {
              const apptDate = new Date(appointment.dateTime);
              setRescheduleAppt(appointment);
              setNewDate(apptDate);
              setSelectedSlot({
                dateTime: appointment.dateTime,
                name: formatDateTime(appointment.dateTime),
              });
              fetchSlots(appointment, apptDate);
            }}
          >
            <Clock size={14} color="#fff" />
            <Text style={styles.glassText}>Reschedule</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.glassBtnRed}
            onPress={() => setCancelAppt(appointment)}
          >
            <XCircle size={14} color="#fff" />
            <Text style={styles.glassText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  /* ================= UI ================= */

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
            <ActivityIndicator />
          ) : filteredAppointments.length === 0 ? (
            <Text style={styles.emptyText}>
              No {activeTab} appointments
            </Text>
          ) : (
            filteredAppointments.map(appt => (
              <AppointmentCard
                key={appt.appointmentId}
                appointment={appt}
              />
            ))
          )}
        </View>
      </ScrollView>

      {/* ================= RESCHEDULE MODAL ================= */}
      {rescheduleAppt && (
        <View style={styles.overlay}>
          <View style={styles.modalCard}>
            {success ? (
              <>
                <CheckCircle size={72} color="#16A34A" />
                <Text style={styles.successText}>
                  Appointment Rescheduled
                </Text>
              </>
            ) : (
              <>
                <Text style={styles.modalTitle}>
                  {reviewMode ? 'Review Changes' : 'Reschedule Appointment'}
                </Text>

                <Text style={styles.modalSub}>
                  {rescheduleAppt.visitTypeName} •{' '}
                  {rescheduleAppt.practitionerName}
                </Text>

                {!reviewMode ? (
                  <>
                    <TouchableOpacity
                      style={styles.dateCard}
                      onPress={() => setShowDatePicker(true)}
                    >
                      <Text style={styles.value}>
                        {newDate.toDateString()}
                      </Text>
                    </TouchableOpacity>

                    {slotLoading && (
                      <ActivityIndicator />
                    )}

                    {slots.length === 0 && !slotLoading && (
                      <Text style={styles.emptyText}>
                        No slots are available for the selected date. Please try another day.
                      </Text>
                    )}

                    {(() => {
  const grouped = groupSlotsByTime(slots);

  const renderGroup = (title: string, data: any[]) => {
    if (!data.length) return null;

    return (
      <View style={{ marginBottom: SPACING.lg, width: '100%' }}>
        <View style={styles.slotGroupHeader}>
          {title === 'Morning' && <Sunrise size={16} color={COLORS.primary} />}
          {title === 'Afternoon' && <Sun size={16} color={COLORS.primary} />}
          {title === 'Evening' && <Sunset size={16} color={COLORS.primary} />}
          <Text style={styles.slotGroupTitle}>{title}</Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.slotRow}
        >
          {data.map(s => (
            <TouchableOpacity
              key={s.dateTime}
              style={[
                styles.slot,
                selectedSlot?.dateTime === s.dateTime && styles.slotActive,
              ]}
              onPress={() => setSelectedSlot(s)}
            >
              <Text
                style={[
                  styles.slotText,
                  selectedSlot?.dateTime === s.dateTime &&
                    styles.slotTextActive,
                ]}
              >
                {s.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  return (
    <>
      {renderGroup('Morning', grouped.morning)}
      {renderGroup('Afternoon', grouped.afternoon)}
      {renderGroup('Evening', grouped.evening)}
    </>
  );
})()}

                    {error ? <Text style={styles.errorText}>{error}</Text> : null}

                    <TouchableOpacity
                      style={styles.primaryBtn}
                      onPress={() => {
                        if (!selectedSlot) {
                          setError('Please select a time slot');
                          return;
                        }
                        setError('');
                        setReviewMode(true);
                      }}
                    >
                      <Text style={styles.primaryText}>Review</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.secondaryBtn}
                      onPress={() => setRescheduleAppt(null)}
                    >
                      <Text style={styles.secondaryText}>Cancel</Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <>
                    <Text style={styles.reviewText}>
                      Old: {formatDateTime(rescheduleAppt.dateTime)}
                    </Text>

                    <Text style={styles.reviewText}>                      
                      New: {formatDateTime(selectedSlot?.dateTime)}
                    </Text>

                    <TouchableOpacity
                      style={styles.primaryBtn}
                      disabled={submitting}
                      onPress={confirmReschedule}
                    >
                      {submitting ? (
                        <ActivityIndicator color="#fff" />
                      ) : (
                        <Text style={styles.primaryText}>Confirm</Text>
                      )}
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.secondaryBtn}
                      onPress={() => setReviewMode(false)}
                    >
                      <Text style={styles.secondaryText}>Go Back</Text>
                    </TouchableOpacity>

                    

                    {/* <TouchableOpacity
                      style={styles.dangerBtn}
                      onPress={() => setRescheduleAppt(null)}
                    >
                      <Text style={styles.dangerText}>Cancel</Text>
                    </TouchableOpacity> */}
                  </>
                )}
              </>
            )}
          </View>
        </View>
      )}

      {/* ================= CANCEL MODAL ================= */}
      {cancelAppt && (
  <View style={styles.overlay}>
    <View style={styles.modalCard}>
      {cancelSuccess ? (
        <>
          <CheckCircle size={72} color="#16A34A" />
          <Text style={styles.successText}>
            Appointment Cancelled
          </Text>
        </>
      ) : (
        <>
          <Text style={styles.modalTitle}>Cancel Appointment?</Text>

          <Text style={styles.modalSub}>
            {cancelAppt.visitTypeName} •{' '}
            {formatDateTime(cancelAppt.dateTime)}
          </Text>

          <View style={styles.cancelActions}>
            <TouchableOpacity
              style={styles.secondaryBtn}
              disabled={cancelSubmitting}
              onPress={() => setCancelAppt(null)}
            >
              <Text style={styles.secondaryText}>No</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.dangerBtn}
              disabled={cancelSubmitting}
              onPress={async () => {
                try {
                  setCancelSubmitting(true);

                  await retry(() =>
                    post('cancel-appointment', {
                      appointmentId: cancelAppt.appointmentId,
                    })
                  );

                  setCancelSuccess(true);

                  setTimeout(() => {
                    setCancelAppt(null);
                    setCancelSuccess(false);
                    loadAppointments();
                  }, 1500);
                } catch {
                  Alert.alert('Error', 'Failed to cancel appointment');
                } finally {
                  setCancelSubmitting(false);
                }
              }}
            >
              {cancelSubmitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.dangerText}>Yes, Cancel</Text>
              )}
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  </View>
)}


      <DateTimePickerModal
        isVisible={showDatePicker}
        mode="date"
        minimumDate={new Date()}
        onConfirm={d => {
          setShowDatePicker(false);
          setNewDate(d);
          if (rescheduleAppt) fetchSlots(rescheduleAppt, d);
        }}
        onCancel={() => setShowDatePicker(false)}
      />
    </View>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F6FA' },
  headerBg: { position: 'absolute', height: 180, left: 0, right: 0 },

  pageHeader: {
    paddingTop: 55,
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
  },
  pageTitle: {
    fontSize: FONT_SIZES.xl + 1,
    fontWeight: '700',
    color: COLORS.white,
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
  emptyText: {
    textAlign: 'center',
    marginTop: SPACING.xl,
    color: COLORS.textSecondary,
  },

  card: {
    backgroundColor: COLORS.white,
    borderRadius: 18,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  cardTitle: {
    fontSize: FONT_SIZES.md + 1,
    fontWeight: '800',
    marginBottom: SPACING.sm,
    color: COLORS.secondary,
  },

  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  label: { marginLeft: 6, marginRight: 4, fontWeight: '600', color: COLORS.textSecondary },
  value: { fontWeight: '600', color: COLORS.secondary },

  statusBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  statusText: { fontSize: FONT_SIZES.xs, fontWeight: '800', color: '#fff' },
  statusConfirmed: { backgroundColor: '#16A34A' },
  statusPending: { backgroundColor: '#F59E0B' },
  statusCompleted: { backgroundColor: '#6B7280' },
  statusCancelled: { backgroundColor: '#DC2626' },

  actionRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: SPACING.md },
  glassBtn: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 6,
  paddingVertical: 10,
  paddingHorizontal: 16,
  borderRadius: 999,
  backgroundColor: COLORS.primary,
},
glassBtnRed: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 6,
  paddingVertical: 10,
  paddingHorizontal: 16,
  borderRadius: 999,
  backgroundColor: '#E11D48',
},
  glassText: { color: '#fff', fontWeight: '700' },

  overlay: { position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  modalCard: { backgroundColor: COLORS.white, borderRadius: 24, padding: 24, width: '88%', alignItems: 'center' },

  modalTitle: { fontSize: FONT_SIZES.lg + 1, fontWeight: '800', marginBottom: 6 },
  modalSub: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, marginBottom: SPACING.md, textAlign: 'center' },

  dateCard: { padding: 16, borderRadius: 14, borderWidth: 1, borderColor: COLORS.border, marginBottom: SPACING.md, width: '100%' },

  slot: {
  paddingVertical: 14,
  paddingHorizontal: 20,
  borderRadius: 22,
  borderWidth: 1,
  borderColor: COLORS.border,
  backgroundColor: '#FFFFFF',

  // IMPORTANT: remove grid behavior
  width: undefined,
  marginBottom: 0,

  // Premium elevation (Android)
  elevation: 3,

  // Premium shadow (iOS)
  shadowColor: '#000',
  shadowOpacity: 0.06,
  shadowRadius: 8,
  shadowOffset: { width: 0, height: 4 },
},

slotActive: {
  backgroundColor: COLORS.primary,
  borderColor: COLORS.primary,
  shadowOpacity: 0.2,
  elevation: 6,
},

slotText: {
  fontSize: FONT_SIZES.sm + 1,
  fontWeight: '700',
  color: COLORS.secondary,
},

slotTextActive: {
  color: '#FFFFFF',
},


  errorText: { color: '#DC2626', marginTop: 6, fontWeight: '600' },
  reviewText: { fontSize: FONT_SIZES.sm, marginVertical: 4 },

  primaryBtn: { marginTop: SPACING.md, backgroundColor: COLORS.primary, paddingVertical: 14, borderRadius: 999, width: '100%', alignItems: 'center' },
  primaryText: { color: '#fff', fontWeight: '800', fontSize: FONT_SIZES.md },

  secondaryBtn: { marginTop: SPACING.sm, paddingVertical: 14, borderRadius: 999, width: '100%', alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
  secondaryText: { fontWeight: '700', color: COLORS.secondary },

  dangerBtn: { marginTop: SPACING.sm, paddingVertical: 14, borderRadius: 999, width: '100%', alignItems: 'center', backgroundColor: '#DC2626' },
  dangerText: { color: '#fff', fontWeight: '800' },

  successText: { marginTop: SPACING.md, fontSize: FONT_SIZES.md, fontWeight: '800', color: '#16A34A' },
  cancelActions: {
    width: '100%',
  marginTop: SPACING.lg,
  },
  slotGroupHeader: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 6,
  marginBottom: SPACING.sm,
},

slotGroupTitle: {
  fontSize: FONT_SIZES.sm + 1,
  fontWeight: '800',
  color: COLORS.secondary,
},

slotRow: {
  gap: 12,
  paddingVertical: 4,
},

});

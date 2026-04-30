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
  Platform,
  Image,
  Animated as RNAnimated,
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
import { COLORS, SPACING, FONT_SIZES, LOGO_URL } from '../../constants/theme';
import { Sun, Sunrise, Sunset } from 'lucide-react-native';
import { APP_VERSION, BASE_URL, DEVICE_DATA, fetchWrapper } from "@/utils/fetchWrapper";


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
  const data = await fetchWrapper<any>(`/${url}`, {
    method: 'POST',
    body,
  });

  if (data.code !== 1) throw new Error(data.message);
  return data.data;
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

  // Today at midnight — appointments today and forward are "upcoming"
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const upcomingAppointments = useMemo(
  () =>
    appointments
      .filter(
        a =>
          new Date(a.dateTime) >= todayStart &&
          (a.status === 'confirmed' || a.status === 'pending')
      )
      .sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime()),
  [appointments]
);

const pastAppointments = useMemo(
  () =>
    appointments
      .filter(
        a =>
          new Date(a.dateTime) < todayStart ||
          a.status === 'completed' ||
          a.status === 'cancelled'
      )
      .sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime()),
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

  /* ================= SKELETON ================= */

  const SkeletonCard = () => {
    const pulseAnim = React.useRef(new RNAnimated.Value(0.4)).current;
    React.useEffect(() => {
      RNAnimated.loop(
        RNAnimated.sequence([
          RNAnimated.timing(pulseAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
          RNAnimated.timing(pulseAnim, { toValue: 0.4, duration: 700, useNativeDriver: true }),
        ])
      ).start();
    }, []);
    const Bone = ({ w, h, r = 6, style }: { w: number | string; h: number; r?: number; style?: any }) => (
      <RNAnimated.View style={[{ width: w, height: h, borderRadius: r, backgroundColor: '#eef0f6', opacity: pulseAnim }, style]} />
    );
    return (
      <View style={styles.card}>
        <Bone w={80} h={10} r={10} style={{ position: 'absolute', top: 14, right: 14 }} />
        <Bone w={'60%'} h={14} style={{ marginBottom: 12 }} />
        <Bone w={'80%'} h={10} style={{ marginBottom: 8 }} />
        <Bone w={'70%'} h={10} style={{ marginBottom: 8 }} />
        <Bone w={'75%'} h={10} />
      </View>
    );
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
        <Text style={styles.value}>Dr. {appointment.practitionerName}</Text>
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
            <Clock size={13} color={COLORS.primary} />
            <Text style={[styles.glassText, styles.glassTextPrimary]}>Reschedule</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.glassBtnRed}
            onPress={() => setCancelAppt(appointment)}
          >
            <XCircle size={13} color={COLORS.error} />
            <Text style={[styles.glassText, styles.glassTextRed]}>Cancel</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  /* ================= UI ================= */

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[COLORS.primary, COLORS.secondary, COLORS.accent1]}
        style={styles.headerBg}
      />

      <View style={styles.pageHeader}>
        <Image source={{ uri: LOGO_URL }} style={styles.logoImg} resizeMode="contain" />
        <View style={styles.titleRow}>
          <Calendar size={20} color={COLORS.white} strokeWidth={2.5} />
          <Text style={styles.pageTitle}>Appointments</Text>
        </View>
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
            <>
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </>
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
                <View style={styles.rescheduleSuccessIcon}>
                  <CheckCircle size={28} color={COLORS.white} />
                </View>
                <Text style={styles.rescheduleSuccessTitle}>Rescheduled!</Text>
                <Text style={styles.rescheduleSuccessSub}>Your appointment has been updated</Text>
              </>
            ) : (
              <>
                {/* Header icon */}
                <View style={styles.rescheduleIconWrap}>
                  <Clock size={22} color={COLORS.primary} />
                </View>
                <Text style={styles.modalTitle}>
                  {reviewMode ? 'Confirm Changes' : 'Reschedule'}
                </Text>
                <Text style={styles.modalSub}>
                  {rescheduleAppt.visitTypeName} • Dr. {rescheduleAppt.practitionerName}
                </Text>

                {!reviewMode ? (
                  <>
                    {/* Date picker */}
                    <TouchableOpacity style={styles.datePickerRow} onPress={() => setShowDatePicker(true)}>
                      <Calendar size={16} color={COLORS.primary} />
                      <Text style={styles.datePickerText}>{newDate.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</Text>
                      <Text style={styles.datePickerHint}>Change</Text>
                    </TouchableOpacity>

                    {slotLoading && (
                      <View style={styles.slotLoadingWrap}>
                        <ActivityIndicator size="small" color={COLORS.primary} />
                        <Text style={styles.slotLoadingText}>Loading slots...</Text>
                      </View>
                    )}

                    {slots.length === 0 && !slotLoading && (
                      <Text style={styles.emptyText}>No slots available. Try another date.</Text>
                    )}

                    {(() => {
                      const grouped = groupSlotsByTime(slots);
                      const renderGroup = (title: string, data: any[], Icon: any) => {
                        if (!data.length) return null;
                        return (
                          <View style={styles.slotSection} key={title}>
                            <View style={styles.slotGroupHeader}>
                              <Icon size={14} color={COLORS.gray} />
                              <Text style={styles.slotGroupTitle}>{title}</Text>
                            </View>
                            <View style={styles.slotWrap}>
                              {data.map(s => {
                                const active = selectedSlot?.dateTime === s.dateTime;
                                return (
                                  <TouchableOpacity key={s.dateTime} style={[styles.slotChip, active && styles.slotChipActive]} onPress={() => setSelectedSlot(s)}>
                                    <Text style={[styles.slotChipText, active && styles.slotChipTextActive]}>{s.name}</Text>
                                  </TouchableOpacity>
                                );
                              })}
                            </View>
                          </View>
                        );
                      };
                      return (
                        <>
                          {renderGroup('Morning', grouped.morning, Sunrise)}
                          {renderGroup('Afternoon', grouped.afternoon, Sun)}
                          {renderGroup('Evening', grouped.evening, Sunset)}
                        </>
                      );
                    })()}

                    {error ? <Text style={styles.errorText}>{error}</Text> : null}

                    <TouchableOpacity style={styles.primaryBtn} onPress={() => {
                      if (!selectedSlot) { setError('Please select a time slot'); return; }
                      setError(''); setReviewMode(true);
                    }}>
                      <Text style={styles.primaryText}>Review Changes</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.ghostBtn} onPress={() => setRescheduleAppt(null)}>
                      <Text style={styles.ghostBtnText}>Cancel</Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <>
                    {/* Comparison card */}
                    <View style={styles.comparisonCard}>
                      <View style={styles.comparisonRow}>
                        <Text style={styles.comparisonLabel}>Previous</Text>
                        <Text style={styles.comparisonOld}>{formatDateTime(rescheduleAppt.dateTime)}</Text>
                      </View>
                      <View style={styles.comparisonArrow}>
                        <Text style={{ fontSize: 16 }}>↓</Text>
                      </View>
                      <View style={styles.comparisonRow}>
                        <Text style={styles.comparisonLabel}>New Time</Text>
                        <Text style={styles.comparisonNew}>{formatDateTime(selectedSlot?.dateTime)}</Text>
                      </View>
                    </View>

                    <TouchableOpacity style={[styles.primaryBtn, submitting && { opacity: 0.6 }]} disabled={submitting} onPress={confirmReschedule}>
                      {submitting ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.primaryText}>Confirm Reschedule</Text>}
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.ghostBtn} onPress={() => setReviewMode(false)}>
                      <Text style={styles.ghostBtnText}>Go Back</Text>
                    </TouchableOpacity>
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
          <View style={styles.cancelSuccessIcon}>
            <CheckCircle size={28} color={COLORS.white} />
          </View>
          <Text style={styles.cancelSuccessTitle}>Appointment Cancelled</Text>
          <Text style={styles.cancelSuccessSub}>Your appointment has been cancelled successfully</Text>
        </>
      ) : (
        <>
          <View style={styles.cancelIconWrap}>
            <XCircle size={24} color={COLORS.error} />
          </View>
          <Text style={styles.modalTitle}>Cancel Appointment?</Text>
          <Text style={styles.modalSub}>
            {cancelAppt.visitTypeName} • {formatDateTime(cancelAppt.dateTime)}
          </Text>

          <View style={styles.cancelBtnRow}>
            <TouchableOpacity
              style={styles.cancelBtnNo}
              disabled={cancelSubmitting}
              onPress={() => setCancelAppt(null)}
            >
              <Text style={styles.cancelBtnNoText}>No, Keep It</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelBtnYes}
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
                <ActivityIndicator color={COLORS.white} size="small" />
              ) : (
                <Text style={styles.cancelBtnYesText}>Yes, Cancel</Text>
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
  container: { flex: 1, backgroundColor: '#f4f5f9' },
  headerBg: { position: 'absolute', height: 200, left: 0, right: 0 },

  pageHeader: {
    paddingTop: 48,
    paddingHorizontal: 22,
    paddingBottom: 14,
    alignItems: 'center',
  },
  logoImg: {
    width: 105,
    height: 32,
    marginBottom: 14,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pageTitle: {
    fontSize: 21,
    fontWeight: '700',
    color: COLORS.white,
    letterSpacing: -0.2,
  },

  tabs: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 16,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 3,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(238,240,248,0.9)',
  },
  tab: {
    flex: 1,
    paddingVertical: 9,
    alignItems: 'center',
    borderRadius: 10,
  },
  activeTab: { backgroundColor: COLORS.primary },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.gray,
  },
  activeTabText: { color: COLORS.white },

  list: { paddingHorizontal: 20 },
  emptyText: {
    textAlign: 'center',
    marginTop: SPACING.xl,
    color: COLORS.gray,
    fontSize: 13,
  },

  card: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 18,
    marginBottom: 14,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(238,240,248,0.9)',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 10,
    color: COLORS.primary,
  },

  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  label: { marginLeft: 6, marginRight: 4, fontWeight: '600', color: COLORS.gray, fontSize: 12 },
  value: { fontWeight: '600', color: COLORS.primary, fontSize: 12 },

  statusBadge: {
    position: 'absolute',
    top: 14,
    right: 14,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
  },
  statusText: { fontSize: 10, fontWeight: '700', color: '#fff', letterSpacing: 0.3 },
  statusConfirmed: { backgroundColor: COLORS.success },
  statusPending: { backgroundColor: '#F59E0B' },
  statusCompleted: { backgroundColor: COLORS.gray },
  statusCancelled: { backgroundColor: COLORS.error },

  actionRow: { flexDirection: 'row', marginTop: 14, gap: 10 },
  glassBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: COLORS.primary + '12',
    borderWidth: 1,
    borderColor: COLORS.primary + '20',
  },
  glassBtnRed: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: COLORS.error + '10',
    borderWidth: 1,
    borderColor: COLORS.error + '20',
  },
  glassText: { fontWeight: '600', fontSize: 12 },
  glassTextPrimary: { color: COLORS.primary },
  glassTextRed: { color: COLORS.error },

  overlay: { position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'center', alignItems: 'center' },
  modalCard: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 24,
    width: '88%',
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(238,240,248,0.9)',
  },

  modalTitle: { fontSize: 18, fontWeight: '700', marginBottom: 4, color: COLORS.primary },
  modalSub: { fontSize: 12, color: COLORS.gray, marginBottom: 18, textAlign: 'center' },

  /* Reschedule modal */
  rescheduleIconWrap: {
    width: 48, height: 48, borderRadius: 16,
    backgroundColor: COLORS.primary + '10',
    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  datePickerRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10, width: '100%',
    backgroundColor: '#f4f5f9', borderRadius: 14,
    paddingVertical: 12, paddingHorizontal: 14,
    marginBottom: 16, borderWidth: 1, borderColor: '#f0f1f6',
  },
  datePickerText: { flex: 1, fontSize: 13, fontWeight: '600', color: COLORS.primary },
  datePickerHint: { fontSize: 11, fontWeight: '600', color: COLORS.accent1 },
  slotLoadingWrap: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 16 },
  slotLoadingText: { fontSize: 12, color: COLORS.gray },
  slotSection: { marginBottom: 14, width: '100%' },
  slotWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  slotChip: {
    paddingVertical: 9, paddingHorizontal: 14, borderRadius: 10,
    backgroundColor: '#fafbfe', borderWidth: 1, borderColor: '#f0f1f6',
  },
  slotChipActive: {
    backgroundColor: COLORS.primary, borderColor: COLORS.primary,
    shadowColor: COLORS.primary, shadowOpacity: 0.15, shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 }, elevation: 4,
  },
  slotChipText: { fontSize: 12, fontWeight: '600', color: COLORS.primary },
  slotChipTextActive: { color: COLORS.white },
  ghostBtn: { marginTop: 10, paddingVertical: 10, alignItems: 'center', width: '100%' },
  ghostBtnText: { fontSize: 13, fontWeight: '600', color: COLORS.gray },

  /* Comparison card */
  comparisonCard: {
    width: '100%', backgroundColor: '#f4f5f9', borderRadius: 16,
    padding: 16, marginBottom: 4, borderWidth: 1, borderColor: '#f0f1f6',
  },
  comparisonRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  comparisonArrow: { alignItems: 'center', paddingVertical: 6 },
  comparisonOld: { fontSize: 13, color: COLORS.gray, fontWeight: '600', textDecorationLine: 'line-through' },
  comparisonNew: { fontSize: 13, color: COLORS.success, fontWeight: '700' },

  /* Reschedule success */
  rescheduleSuccessIcon: {
    width: 52, height: 52, borderRadius: 26, backgroundColor: COLORS.success,
    alignItems: 'center', justifyContent: 'center', marginBottom: 14,
    shadowColor: COLORS.success, shadowOpacity: 0.25, shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 }, elevation: 6,
  },
  rescheduleSuccessTitle: { fontSize: 18, fontWeight: '700', color: COLORS.primary, marginBottom: 4 },
  rescheduleSuccessSub: { fontSize: 12, color: COLORS.gray, textAlign: 'center' },

  dateCard: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(238,240,248,0.9)',
    marginBottom: SPACING.md,
    width: '100%',
    backgroundColor: '#f4f5f9',
  },

  slot: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(238,240,248,0.9)',
    backgroundColor: COLORS.white,
    width: undefined,
    marginBottom: 0,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },

  slotActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
    shadowOpacity: 0.15,
    elevation: 5,
  },

  slotText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
  },

  slotTextActive: {
    color: COLORS.white,
  },

  errorText: { color: COLORS.error, marginTop: 6, fontWeight: '600', fontSize: 12 },
  reviewText: { fontSize: 13, marginVertical: 4 },

  primaryBtn: {
    marginTop: SPACING.md,
    backgroundColor: COLORS.primary,
    paddingVertical: 13,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  primaryText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  secondaryBtn: {
    marginTop: SPACING.sm,
    paddingVertical: 13,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(238,240,248,0.9)',
  },
  secondaryText: { fontWeight: '600', color: COLORS.primary, fontSize: 14 },

  dangerBtn: {
    marginTop: SPACING.sm,
    paddingVertical: 13,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    backgroundColor: COLORS.error,
  },
  dangerText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  successText: { marginTop: SPACING.md, fontSize: 15, fontWeight: '700', color: COLORS.success },

  /* Cancel modal */
  cancelIconWrap: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: COLORS.error + '10',
    alignItems: 'center', justifyContent: 'center', marginBottom: 14,
  },
  cancelBtnRow: {
    flexDirection: 'row', width: '100%', gap: 10, marginTop: 18,
  },
  cancelBtnNo: {
    flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center',
    backgroundColor: '#f4f5f9', borderWidth: 1, borderColor: '#f0f1f6',
  },
  cancelBtnNoText: { fontSize: 13, fontWeight: '600', color: COLORS.primary },
  cancelBtnYes: {
    flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center',
    backgroundColor: COLORS.error,
    shadowColor: COLORS.error, shadowOpacity: 0.2, shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 }, elevation: 4,
  },
  cancelBtnYesText: { fontSize: 13, fontWeight: '700', color: COLORS.white },
  cancelSuccessIcon: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: COLORS.success, alignItems: 'center', justifyContent: 'center',
    marginBottom: 14,
    shadowColor: COLORS.success, shadowOpacity: 0.25, shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 }, elevation: 6,
  },
  cancelSuccessTitle: { fontSize: 17, fontWeight: '700', color: COLORS.primary, marginBottom: 4 },
  cancelSuccessSub: { fontSize: 12, color: COLORS.gray, textAlign: 'center' },

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
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
  },

  slotRow: {
    gap: 10,
    paddingVertical: 4,
  },

  comparisonLabel: {
    fontSize: 11,
    color: COLORS.gray,
    fontWeight: '600',
    letterSpacing: 0.2,
    textTransform: 'uppercase',
  },
});

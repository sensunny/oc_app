import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Calendar,
  MapPin,
  User,
  Clock,
  CheckCircle,
  Stethoscope,
} from 'lucide-react-native';
import { useFocusEffect } from '@react-navigation/native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { router } from 'expo-router';
import { COLORS, SPACING, FONT_SIZES } from '../../constants/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Sun,
  Sunrise,
  Sunset,
} from 'lucide-react-native';
import { BASE_URL } from "@/utils/apiClient";



if (Platform.OS === 'android') {
  UIManager.setLayoutAnimationEnabledExperimental?.(true);
}

const get = async (url: string) => {
  const token = await AsyncStorage.getItem('access_token');

  const res = await fetch(`${BASE_URL}/${url}`, {
    headers: {
      token: `${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (res.status >= 400 && res.status < 500) {
    console.warn('Session expired or invalid. Logging out...');
    throw new Error('Session expired or unauthorized.');
  }

  const json = await res.json();

  if (json.code !== 1) {
    throw new Error(json.message);
  }

  return json.data;
};


const post = async (url: string, body: any) => {
  const token = await AsyncStorage.getItem('access_token');

  const res = await fetch(`${BASE_URL}/${url}`, {
    method: 'POST',
    headers: {
      token: `${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (res.status >= 400 && res.status < 500) {
    console.warn('Session expired or invalid. Logging out...');
    throw new Error('Session expired or unauthorized.');
  }

  const json = await res.json();

  if (json.code !== 1) {
    throw new Error(json.message);
  }

  return json.data;
};


/* ================= SCREEN ================= */

export default function BookAppointmentScreen() {
  const [stepLoading, setStepLoading] = useState<string | null>(null);

  const [locations, setLocations] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [visitTypes, setVisitTypes] = useState<string[]>([]);
  const [slots, setSlots] = useState<any[]>([]);

  const [location, setLocation] = useState<any>(null);
  const [doctor, setDoctor] = useState<any>(null);
  const [visitType, setVisitType] = useState<string | null>(null);
  const [date, setDate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<any>(null);

  const [showConfirm, setShowConfirm] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);

  /* ================= RESET ================= */

  const resetBooking = () => {
    LayoutAnimation.easeInEaseOut();
    setLocation(null);
    setDoctor(null);
    setVisitType(null);
    setSelectedSlot(null);
    setSlots([]);
    setVisitTypes([]);
    setDoctors([]);
    setDate(new Date());
    setShowConfirm(false);
    setIsConfirming(false);
    setIsConfirmed(false);
  };

  /* ================= RESET ON OPEN ================= */

  useFocusEffect(
    useCallback(() => {
      resetBooking();
      setStepLoading('location');
      get('locations')
        .then(setLocations)
        .catch(() => Alert.alert('Error', 'Failed to load locations'))
        .finally(() => setStepLoading(null));
    }, [])
  );

  /* ================= HELPERS ================= */

  const groupSlotsByTime = (slots: any[]) => {
  const groups = {
    morning: [],
    afternoon: [],
    evening: [],
  };

  slots.forEach((slot) => {
    const hour = new Date(slot.dateTime).getHours();

    if (hour >= 5 && hour < 12) groups.morning.push(slot);
    else if (hour >= 12 && hour < 17) groups.afternoon.push(slot);
    else if (hour >= 17 && hour < 22) groups.evening.push(slot);
  });

  return groups;
};


  const fetchSlots = async (
    locationId: number,
    practitionerId: number,
    d: Date,
    v: string
  ) => {
    if (!locationId || !practitionerId) return;

    setSlots([]);
    setSelectedSlot(null);
    setStepLoading('slots');

    try {
      const data = await post('visit-slots', {
        locationId,
        practitionerId,
        visitTypeName: v,
        date: d.toISOString().split('T')[0],
      });
      setSlots(data);
    } catch {
      Alert.alert('Error', 'Failed to load slots');
    } finally {
      setStepLoading(null);
    }
  };

  const retry = async <T>(
  fn: () => Promise<T>,
  retries = 2,
  delay = 800
): Promise<T> => {
  try {
    return await fn();
  } catch (error: any) {
    if (retries <= 0) throw error;

    // Do NOT retry for 4xx errors
    if (error?.message?.includes('unauthorized')) {
      throw error;
    }

    await new Promise((r) => setTimeout(r, delay));
    return retry(fn, retries - 1, delay);
  }
};



    const createAppointment = async () => {
  if (!doctor || !location || !selectedSlot || !visitType) {
    throw new Error('Missing appointment details');
  }

  return retry(() =>
    post('create-appointment', {
      practitionerId: doctor.id,
      locationId: location.id,
      dateTime: selectedSlot.dateTime,
      visitTypeName: visitType,
    })
  );
};


  /* ================= HANDLERS ================= */

  const selectLocation = async (loc: any) => {
    setLocation(loc);
    setDoctor(null);
    setVisitType(null);
    setSlots([]);
    setSelectedSlot(null);

    setStepLoading('doctor');
    const data = await post('practitioners', { locationId: loc.id });
    setDoctors(data);
    setStepLoading(null);
  };

  const selectDoctor = async (doc: any) => {
    setDoctor(doc);
    setVisitType(null);
    setSlots([]);
    setSelectedSlot(null);

    setStepLoading('visitType');
    const data = await post('visit-types', {
      locationId: location.id,
      practitionerId: doc.id,
    });
    setVisitTypes(data);

    if (data.length === 1) {
      setVisitType(data[0]);
      fetchSlots(location.id, doc.id, date, data[0]);
    }
    setStepLoading(null);
  };

  const onDateConfirm = (d: Date) => {
    setShowDatePicker(false);
    setDate(d);
    if (visitType && location && doctor) {
      fetchSlots(location.id, doctor.id, d, visitType);
    }
  };

  /* ================= UI ================= */

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#14143C', '#1F2A6D', '#7B5CFA']}
        style={styles.headerBg}
      />

      <View style={styles.pageHeader}>
        <Calendar size={30} color={COLORS.white} />
        <Text style={styles.pageTitle}>Book Appointment</Text>
        <Text style={styles.pageSubtitle}>
          Seamless & priority medical booking
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Section
          title="Select Care Location"
          icon={<MapPin color={COLORS.primary} />}
          loading={stepLoading === 'location'}
        >
          {locations.map((l) => (
            <Option
              key={l.id}
              label={`${l.name}, ${l.area}`}
              active={location?.id === l.id}
              onPress={() => selectLocation(l)}
            />
          ))}
        </Section>

        {location && (
          <Section
            title="Consulting Doctor"
            icon={<User color={COLORS.primary} />}
            loading={stepLoading === 'doctor'}
          >
            {doctors.map((d) => (
              <Option
                key={d.id}
                label={`${d.firstName} ${d.lastName || ''}`}
                active={doctor?.id === d.id}
                onPress={() => selectDoctor(d)}
              />
            ))}
          </Section>
        )}

        {doctor && (
          <Section
            title="Type of Consultation"
            icon={<Stethoscope color={COLORS.primary} />}
            loading={stepLoading === 'visitType'}
          >
            {visitTypes.map((v) => (
              <Option
                key={v}
                label={v}
                active={visitType === v}
                onPress={() => {
                  setVisitType(v);
                  fetchSlots(location.id, doctor.id, date, v);
                }}
              />
            ))}
          </Section>
        )}

        {visitType && (
          <Section
            title="Preferred Appointment Date"
            icon={<Calendar color={COLORS.primary} />}
          >
            <TouchableOpacity
              style={styles.dateCard}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={styles.dateText}>
                {date.toLocaleDateString('en-IN', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </Text>
              <Text style={styles.dateHint}>Tap to change date</Text>
            </TouchableOpacity>
          </Section>
        )}

        {visitType && (
          <Section
            title="Available Time Slots"
            icon={<Clock color={COLORS.primary} />}
            loading={stepLoading === 'slots'}
          >
            {slots.length === 0 && !stepLoading && (
              <Text style={styles.emptyText}>
                No slots are available for the selected date. Please try another day.
              </Text>
            )}

            {(() => {
  const grouped = groupSlotsByTime(slots);

  const renderGroup = (title: string, data: any[]) => {
    if (!data.length) return null;

    return (
      <View style={{ marginBottom: SPACING.lg }}>
        <View style={styles.slotGroupHeader}>
  {title === 'Morning' && <Sunrise size={18} color={COLORS.primary} />}
  {title === 'Afternoon' && <Sun size={18} color={COLORS.primary} />}
  {title === 'Evening' && <Sunset size={18} color={COLORS.primary} />}

  <Text style={styles.slotGroupTitle}>{title}</Text>
</View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.slotRow}
        >
          {data.map((s) => (
            <Slot
              key={s.dateTime}
              label={s.name}
              active={selectedSlot?.dateTime === s.dateTime}
              onPress={() => setSelectedSlot(s)}
            />
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

          </Section>
        )}
      </ScrollView>

      {selectedSlot && (
        <View style={styles.cta}>
          <TouchableOpacity
            style={styles.ctaButton}
            onPress={() => setShowConfirm(true)}
          >
            <Text style={styles.ctaText}>Review Appointment</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ================= CONFIRM + SUCCESS POPUP ================= */}

      {showConfirm && (
        <View style={styles.overlay}>
          <View style={styles.confirmCard}>
            {!isConfirmed ? (
              <>
                <Text style={styles.confirmTitleCentered}>
                  Review Appointment
                </Text>

                <ConfirmRow label="Doctor" value={doctor.firstName} />
                <ConfirmRow label="Date" value={date.toDateString()} />
                <ConfirmRow label="Time Slot" value={selectedSlot.name} />

                <TouchableOpacity
                    style={[
    styles.confirmBtn,
    isConfirming && { opacity: 0.6 },
  ]}
  disabled={isConfirming}
                  onPress={async () => {
                    try {
                      setIsConfirming(true);

                      await createAppointment(); 

                      setTimeout(() => {
                        setIsConfirming(false);
                        setIsConfirmed(true);
                      }, 1000);
                    } catch (err: any) {
                      setIsConfirming(false);
                      Alert.alert('Error', err.message || 'Failed to book appointment');
                    }
                  }}
                >
                  {isConfirming ? (
                    <ActivityIndicator color={COLORS.white} />
                  ) : (
                    <Text style={styles.confirmBtnText}>
                      Confirm Appointment
                    </Text>
                  )}
                </TouchableOpacity>

                {!isConfirming && (
                  <TouchableOpacity onPress={() => setShowConfirm(false)}>
                    <Text style={styles.backText}>Modify Selection</Text>
                  </TouchableOpacity>
                )}
              </>
            ) : (
              <>
                <CheckCircle size={72} color="#22C55E" />
                <Text style={styles.successTitle}>
                  Appointment Confirmed
                </Text>

                <ConfirmRow label="Doctor" value={doctor.firstName} />
                <ConfirmRow label="Date" value={date.toDateString()} />
                <ConfirmRow label="Time" value={selectedSlot.name} />

                <TouchableOpacity
                  style={styles.successPrimaryBtn}
                  onPress={resetBooking}
                >
                  <Text style={styles.successPrimaryText}>
                    Schedule New Appointment
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    resetBooking();
                    router.replace('/appointments');
                  }}
                >
                  <Text style={styles.successSecondaryText}>
                    View All Appointments
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      )}

      <DateTimePickerModal
        isVisible={showDatePicker}
        mode="date"
        minimumDate={new Date()}
        onConfirm={onDateConfirm}
        onCancel={() => setShowDatePicker(false)}
      />
    </View>
  );
}

/* ================= COMPONENTS ================= */

const Section = ({ title, icon, loading, children }: any) => (
  <View style={styles.section}>
    <View style={styles.sectionHeader}>
      {icon}
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
    {loading ? (
      <View style={{ marginTop: SPACING.md }}>
        <ActivityIndicator color={COLORS.primary} />
      </View>
    ) : (
      children
    )}
  </View>
);

const Option = ({ label, onPress, active }: any) => (
  <TouchableOpacity
    onPress={onPress}
    style={[styles.option, active && styles.optionActive]}
  >
    <Text style={styles.optionText}>{label}</Text>
  </TouchableOpacity>
);

const Slot = ({ label, onPress, active }: any) => (
  <TouchableOpacity
    onPress={onPress}
    style={[styles.slot, active && styles.slotActive]}
  >
    <Text style={[styles.slotText, active && styles.slotTextActive]}>
      {label}
    </Text>
  </TouchableOpacity>
);

const ConfirmRow = ({ label, value }: any) => (
  <View style={styles.confirmRow}>
    <Text style={styles.confirmLabel}>{label}</Text>
    <Text style={styles.confirmValue}>{value}</Text>
  </View>
);

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F6FA' },
  headerBg: { position: 'absolute', height: 200, left: 0, right: 0 },

  pageHeader: {
    paddingTop: 60,
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
  },

  pageTitle: {
    fontSize: FONT_SIZES.xl + 4,
    fontWeight: '800',
    color: COLORS.white,
    marginTop: 6,
  },

  pageSubtitle: {
    marginTop: 6,
    fontSize: FONT_SIZES.sm + 1,
    color: 'rgba(255,255,255,0.8)',
  },

  content: {
    padding: SPACING.lg,
    paddingTop: SPACING.xl,
  },

  section: {
    backgroundColor: COLORS.white,
    borderRadius: 18,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: SPACING.md + 4,
  },

  sectionTitle: {
    fontSize: FONT_SIZES.md + 1,
    fontWeight: '700',
  },

  option: {
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.sm,
  },

  optionActive: {
    backgroundColor: '#EEF2FF',
    borderColor: COLORS.primary,
  },

  optionText: {
    fontSize: FONT_SIZES.sm + 1,
    fontWeight: '600',
  },

  dateCard: {
    padding: 20,
    borderRadius: 16,
    backgroundColor: '#F8FAFF',
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  dateText: {
    fontSize: FONT_SIZES.md + 1,
    fontWeight: '700',
  },

  dateHint: {
    marginTop: 8,
    fontSize: FONT_SIZES.xs + 1,
    color: COLORS.textSecondary,
  },

  slotGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: SPACING.sm,
  },

  slot: {
    width: '48%',
    paddingVertical: 18,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.md,
    alignItems: 'center',
  },

  slotActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },

  slotText: {
    fontSize: FONT_SIZES.sm + 1,
    fontWeight: '700',
  },

  slotTextActive: {
    color: COLORS.white,
  },

  emptyText: {
    textAlign: 'center',
    marginTop: SPACING.md,
    color: COLORS.textSecondary,
  },

  cta: {
    padding: SPACING.md,
    backgroundColor: COLORS.white,
  },

  ctaButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 18,
    borderRadius: 18,
    alignItems: 'center',
  },

  ctaText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.md + 1,
    fontWeight: '800',
  },

  overlay: {
    position: 'absolute',
    inset: 0,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  confirmCard: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 28,
    width: '88%',
    alignItems: 'center',
  },

  confirmTitleCentered: {
    fontSize: FONT_SIZES.lg + 2,
    fontWeight: '800',
    marginBottom: SPACING.lg,
    textAlign: 'center',
  },

  confirmRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },

  confirmLabel: {
    color: COLORS.textSecondary,
    fontWeight: '600',
  },

  confirmValue: {
    fontWeight: '700',
  },

  confirmBtn: {
    marginTop: SPACING.lg,
    backgroundColor: COLORS.primary,
    paddingVertical: 18,
    borderRadius: 18,
    width: '100%',
    alignItems: 'center',
  },

  confirmBtnText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.md + 1,
    fontWeight: '800',
  },

  backText: {
    marginTop: SPACING.md,
    color: COLORS.primary,
    fontWeight: '600',
  },

  successTitle: {
    fontSize: FONT_SIZES.lg + 2,
    fontWeight: '800',
    marginVertical: SPACING.lg,
  },

  successPrimaryBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 18,
    borderRadius: 18,
    width: '100%',
    alignItems: 'center',
    marginTop: SPACING.lg,
  },

  successPrimaryText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.md + 1,
    fontWeight: '800',
  },

  successSecondaryText: {
    marginTop: SPACING.md,
    color: COLORS.primary,
    fontWeight: '600',
  },

  slotGroupTitle: {
  fontSize: FONT_SIZES.sm + 2,
  fontWeight: '800',
  marginBottom: SPACING.sm,
  color: COLORS.textPrimary,
},

slotRow: {
  gap: 12,
  paddingVertical: 4,
},

slot: {
  paddingVertical: 14,
  paddingHorizontal: 20,
  borderRadius: 22,
  borderWidth: 1,
  borderColor: COLORS.border,
  backgroundColor: '#FFFFFF',
  shadowColor: '#000',
  shadowOpacity: 0.06,
  shadowRadius: 8,
  elevation: 3,
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
  color: COLORS.textPrimary,
},

slotTextActive: {
  color: COLORS.white,
},
slotGroupHeader: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 8,
  marginBottom: SPACING.sm,
},

slotGroupTitle: {
  fontSize: FONT_SIZES.sm + 2,
  fontWeight: '800',
  color: COLORS.textPrimary,
  letterSpacing: 0.3,
},

});

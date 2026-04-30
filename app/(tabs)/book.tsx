import React, { useCallback, useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  LayoutAnimation,
  Platform,
  UIManager,
  TextInput,
  Image,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Calendar,
  MapPin,
  User,
  Clock,
  CheckCircle,
  Stethoscope,
  Search,
  ChevronRight,
  ChevronDown,
  X,
} from 'lucide-react-native';
import { useFocusEffect } from '@react-navigation/native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { router } from 'expo-router';
import { COLORS, SPACING, LOGO_URL } from '../../constants/theme';
import { Sun, Sunrise, Sunset } from 'lucide-react-native';
import { fetchWrapper } from '@/utils/fetchWrapper';
import DoctorCard from '../../components/DoctorCard';

if (Platform.OS === 'android') {
  UIManager.setLayoutAnimationEnabledExperimental?.(true);
}

/* ── API helpers (unchanged) ── */

const get = async (url: string) => {
  const data = await fetchWrapper<any>(`/${url}`, { method: 'GET' });
  if (data.code !== 1) throw new Error(data.message);
  return data.data;
};

const post = async (url: string, body: any) => {
  const data = await fetchWrapper<any>(`/${url}`, { method: 'POST', body });
  if (data.code !== 1) throw new Error(data.message);
  return data.data;
};

const retry = async <T,>(fn: () => Promise<T>, retries = 2, delay = 800): Promise<T> => {
  try { return await fn(); }
  catch (error: any) {
    if (retries <= 0) throw error;
    if (error?.message?.includes('unauthorized')) throw error;
    await new Promise((r) => setTimeout(r, delay));
    return retry(fn, retries - 1, delay);
  }
};

const groupSlotsByTime = (slots: any[]) => {
  const g: { morning: any[]; afternoon: any[]; evening: any[] } = { morning: [], afternoon: [], evening: [] };
  slots.forEach((sl) => {
    const h = new Date(sl.dateTime).getHours();
    if (h >= 5 && h < 12) g.morning.push(sl);
    else if (h >= 12 && h < 17) g.afternoon.push(sl);
    else if (h >= 17 && h < 22) g.evening.push(sl);
  });
  return g;
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

  const [locationSearch, setLocationSearch] = useState('');
  const [doctorSearch, setDoctorSearch] = useState('');

  const scrollRef = useRef<ScrollView>(null);
  const sectionRefs = useRef<{ [key: string]: number }>({});

  /* ── Reset ── */
  const resetBooking = () => {
    LayoutAnimation.easeInEaseOut();
    setLocation(null); setDoctor(null); setVisitType(null);
    setSelectedSlot(null); setSlots([]); setVisitTypes([]);
    setDoctors([]); setDate(new Date()); setShowConfirm(false);
    setIsConfirming(false); setIsConfirmed(false);
    setLocationSearch(''); setDoctorSearch('');
  };

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

  /* ── Helpers ── */
  const scrollToSection = (key: string) => {
    setTimeout(() => {
      const y = sectionRefs.current[key];
      if (y !== undefined) scrollRef.current?.scrollTo({ y: y - 10, animated: true });
    }, 150);
  };

  const fetchSlots = async (locId: number, docId: number, d: Date, v: string) => {
    if (!locId || !docId) return;
    setSlots([]); setSelectedSlot(null); setStepLoading('slots');
    try {
      const data = await post('visit-slots', {
        locationId: locId, practitionerId: docId, visitTypeName: v,
        date: d.toISOString().split('T')[0],
      });
      setSlots(data);
    } catch { Alert.alert('Error', 'Failed to load slots'); }
    finally { setStepLoading(null); }
  };

  const createAppointment = async () => {
    if (!doctor || !location || !selectedSlot || !visitType) throw new Error('Missing details');
    return retry(() => post('create-appointment', {
      practitionerId: doctor.id, locationId: location.id,
      dateTime: selectedSlot.dateTime, visitTypeName: visitType,
    }));
  };

  /* ── Handlers ── */
  const selectLocation = async (loc: any) => {
    LayoutAnimation.easeInEaseOut();
    setLocation(loc); setDoctor(null); setVisitType(null);
    setSlots([]); setSelectedSlot(null); setDoctorSearch('');
    scrollToSection('doctor');
    setStepLoading('doctor');
    const data = await post('practitioners', { locationId: loc.id });
    setDoctors(data); setStepLoading(null);
  };

  const selectDoctor = async (doc: any) => {
    LayoutAnimation.easeInEaseOut();
    setDoctor(doc); setVisitType(null); setSlots([]); setSelectedSlot(null);
    scrollToSection('visitType');
    setStepLoading('visitType');
    const data = await post('visit-types', { locationId: location.id, practitionerId: doc.id });
    setVisitTypes(data);
    if (data.length === 1) { setVisitType(data[0]); fetchSlots(location.id, doc.id, date, data[0]); }
    setStepLoading(null);
  };

  const onDateConfirm = (d: Date) => {
    setShowDatePicker(false); setDate(d);
    if (visitType && location && doctor) fetchSlots(location.id, doctor.id, d, visitType);
  };

  const filteredLocations = locations.filter((l) =>
    `${l.name} ${l.area}`.toLowerCase().includes(locationSearch.toLowerCase())
  );
  const filteredDoctors = doctors.filter((d) =>
    `${d.firstName} ${d.lastName || ''}`.toLowerCase().includes(doctorSearch.toLowerCase())
  );

  /* ── Progress indicator ── */
  const currentStep = !location ? 0 : !doctor ? 1 : !visitType ? 2 : !selectedSlot ? 3 : 4;
  const steps = ['Location', 'Doctor', 'Type', 'Slot'];

  /* ── Render ── */
  return (
    <View style={st.root}>
      <LinearGradient colors={[COLORS.primary, COLORS.secondary, COLORS.accent1]} style={st.headerBg} />

      {/* Header */}
      <View style={st.header}>
        <Image source={{ uri: LOGO_URL }} style={st.logo} resizeMode="contain" />
        <Text style={st.headerTitle}>Book Appointment</Text>

        {/* Progress dots */}
        <View style={st.progressRow}>
          {steps.map((label, i) => (
            <View key={label} style={st.progressItem}>
              <View style={[st.progressDot, i <= currentStep && st.progressDotActive]} />
              <Text style={[st.progressLabel, i <= currentStep && st.progressLabelActive]}>{label}</Text>
            </View>
          ))}
        </View>
      </View>

      <ScrollView ref={scrollRef} contentContainerStyle={st.body} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

        {/* ── Location ── */}
        <SectionCard
          icon={<MapPin size={16} color={COLORS.accent1} strokeWidth={2.5} />}
          title="Care Location"
          selected={location ? `${location.name}, ${location.area}` : undefined}
          onClear={() => { LayoutAnimation.easeInEaseOut(); resetBooking(); }}
          loading={stepLoading === 'location'}
        >
          {!location && (
            <>
              {locations.length > 3 && <SearchInput value={locationSearch} onChange={setLocationSearch} placeholder="Search locations..." />}
              {filteredLocations.map((l) => (
                <OptionRow key={l.id} label={`${l.name}, ${l.area}`} onPress={() => selectLocation(l)} />
              ))}
              {filteredLocations.length === 0 && !stepLoading && <Text style={st.empty}>No locations found</Text>}
            </>
          )}
        </SectionCard>

        {/* ── Doctor ── */}
        {location && (
          <View onLayout={(e) => { sectionRefs.current['doctor'] = e.nativeEvent.layout.y; }}>
            <SectionCard
              icon={<User size={16} color={COLORS.accent1} strokeWidth={2.5} />}
              title="Consulting Doctor"
              onClear={() => { LayoutAnimation.easeInEaseOut(); setDoctor(null); setVisitType(null); setSlots([]); setSelectedSlot(null); }}
              loading={stepLoading === 'doctor'}
            >
              {doctor ? (
                <DoctorCard doctor={doctor} active={true} onPress={() => {}} />
              ) : (
                <>
                  {doctors.length > 3 && <SearchInput value={doctorSearch} onChange={setDoctorSearch} placeholder="Search doctors..." />}
                  {filteredDoctors.map((d) => (
                    <DoctorCard key={d.id} doctor={d} active={false} onPress={() => selectDoctor(d)} />
                  ))}
                  {filteredDoctors.length === 0 && !stepLoading && <Text style={st.empty}>No doctors found</Text>}
                </>
              )}
            </SectionCard>
          </View>
        )}

        {/* ── Visit Type ── */}
        {doctor && (
          <View onLayout={(e) => { sectionRefs.current['visitType'] = e.nativeEvent.layout.y; }}>
            <SectionCard
              icon={<Stethoscope size={16} color={COLORS.accent1} strokeWidth={2.5} />}
              title="Consultation Type"
              selected={visitType || undefined}
              onClear={() => { LayoutAnimation.easeInEaseOut(); setVisitType(null); setSlots([]); setSelectedSlot(null); }}
              loading={stepLoading === 'visitType'}
            >
              {!visitType && visitTypes.map((v) => (
                <OptionRow key={v} label={v} onPress={() => {
                  LayoutAnimation.easeInEaseOut();
                  setVisitType(v); fetchSlots(location.id, doctor.id, date, v);
                  scrollToSection('slots');
                }} />
              ))}
            </SectionCard>
          </View>
        )}

        {/* ── Date + Slots ── */}
        {visitType && (
          <View onLayout={(e) => { sectionRefs.current['slots'] = e.nativeEvent.layout.y; }}>
            <SectionCard
              icon={<Clock size={16} color={COLORS.accent1} strokeWidth={2.5} />}
              title="Date & Time"
              loading={stepLoading === 'slots'}
            >
              {/* Date picker */}
              <TouchableOpacity style={st.datePicker} onPress={() => setShowDatePicker(true)} activeOpacity={0.7}>
                <Calendar size={16} color={COLORS.primary} />
                <Text style={st.dateText}>
                  {date.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                </Text>
                <ChevronDown size={16} color={COLORS.gray} />
              </TouchableOpacity>

              {/* Slots */}
              {slots.length === 0 && !stepLoading && (
                <Text style={st.empty}>No slots available. Try another date.</Text>
              )}
              {(() => {
                const grouped = groupSlotsByTime(slots);
                const renderGroup = (title: string, data: any[], Icon: any) => {
                  if (!data.length) return null;
                  return (
                    <View style={st.slotGroup} key={title}>
                      <View style={st.slotGroupHead}>
                        <Icon size={14} color={COLORS.gray} />
                        <Text style={st.slotGroupLabel}>{title}</Text>
                      </View>
                      <View style={st.slotWrap}>
                        {data.map((sl) => {
                          const active = selectedSlot?.dateTime === sl.dateTime;
                          return (
                            <TouchableOpacity key={sl.dateTime} style={[st.slotChip, active && st.slotChipActive]} onPress={() => setSelectedSlot(sl)}>
                              <Text style={[st.slotChipText, active && st.slotChipTextActive]}>{sl.name}</Text>
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
            </SectionCard>
          </View>
        )}

        <View style={{ height: 110 }} />
      </ScrollView>

      {/* ── CTA ── */}
      {selectedSlot && (
        <View style={st.ctaBar}>
          <LinearGradient colors={[COLORS.primary, COLORS.accent1]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={st.ctaGradient}>
            <TouchableOpacity style={st.ctaBtn} onPress={() => setShowConfirm(true)} activeOpacity={0.85}>
              <Text style={st.ctaText}>Review Appointment</Text>
              <ChevronRight size={18} color={COLORS.white} />
            </TouchableOpacity>
          </LinearGradient>
        </View>
      )}

      {/* ── Confirm / Success ── */}
      {showConfirm && (
        <View style={st.overlay}>
          <View style={st.modal}>
            {!isConfirmed ? (
              <>
                {/* Review header */}
                <View style={st.modalIconWrap}>
                  <Calendar size={22} color={COLORS.primary} />
                </View>
                <Text style={st.modalTitle}>Review Appointment</Text>
                <Text style={st.modalSub}>Please confirm your booking details</Text>

                {/* Details card */}
                <View style={st.modalDetailsCard}>
                  <DetailRow icon={<User size={14} color={COLORS.accent1} />} label="Doctor" value={`Dr. ${doctor.firstName} ${doctor.lastName || ''}`} />
                  <View style={st.modalRowDivider} />
                  <DetailRow icon={<MapPin size={14} color={COLORS.accent1} />} label="Location" value={`${location.name}, ${location.area}`} />
                  <View style={st.modalRowDivider} />
                  <DetailRow icon={<Calendar size={14} color={COLORS.accent1} />} label="Date" value={date.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })} />
                  <View style={st.modalRowDivider} />
                  <DetailRow icon={<Clock size={14} color={COLORS.accent1} />} label="Time" value={selectedSlot.name} />
                  <View style={st.modalRowDivider} />
                  <DetailRow icon={<Stethoscope size={14} color={COLORS.accent1} />} label="Type" value={visitType!} />
                </View>

                <LinearGradient colors={[COLORS.primary, COLORS.accent1]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={st.modalBtnGradient}>
                  <TouchableOpacity style={st.modalBtn} disabled={isConfirming} onPress={async () => {
                    try {
                      setIsConfirming(true);
                      await createAppointment();
                      setTimeout(() => { setIsConfirming(false); setIsConfirmed(true); }, 800);
                    } catch (err: any) { setIsConfirming(false); Alert.alert('Error', err.message || 'Failed'); }
                  }}>
                    {isConfirming ? <ActivityIndicator color={COLORS.white} size="small" /> : <Text style={st.modalBtnText}>Confirm Appointment</Text>}
                  </TouchableOpacity>
                </LinearGradient>

                {!isConfirming && (
                  <TouchableOpacity onPress={() => setShowConfirm(false)} style={st.modalBackWrap}>
                    <Text style={st.modalBack}>Modify Selection</Text>
                  </TouchableOpacity>
                )}
              </>
            ) : (
              <>
                {/* Success header */}
                <View style={st.successIconWrap}>
                  <CheckCircle size={32} color={COLORS.white} />
                </View>
                <Text style={st.successTitle}>Appointment Confirmed!</Text>
                <Text style={st.successSub}>Your booking has been scheduled successfully</Text>

                {/* Details card */}
                <View style={st.modalDetailsCard}>
                  <DetailRow icon={<User size={14} color={COLORS.accent1} />} label="Doctor" value={`Dr. ${doctor.firstName} ${doctor.lastName || ''}`} />
                  <View style={st.modalRowDivider} />
                  <DetailRow icon={<Calendar size={14} color={COLORS.accent1} />} label="Date" value={date.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })} />
                  <View style={st.modalRowDivider} />
                  <DetailRow icon={<Clock size={14} color={COLORS.accent1} />} label="Time" value={selectedSlot.name} />
                </View>

                <TouchableOpacity style={st.successPrimaryBtn} onPress={resetBooking}>
                  <Text style={st.successPrimaryText}>Book Another Appointment</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => { resetBooking(); router.replace('/appointments'); }} style={st.modalBackWrap}>
                  <Text style={st.modalBack}>View All Appointments</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      )}

      <DateTimePickerModal isVisible={showDatePicker} mode="date" minimumDate={new Date()} onConfirm={onDateConfirm} onCancel={() => setShowDatePicker(false)} />
    </View>
  );
}

/* ================= SUB-COMPONENTS ================= */

const Skeleton = () => {
  const anim = useRef(new Animated.Value(0.35)).current;
  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(anim, { toValue: 1, duration: 650, useNativeDriver: true }),
      Animated.timing(anim, { toValue: 0.35, duration: 650, useNativeDriver: true }),
    ])).start();
  }, []);
  return (
    <View style={{ gap: 10, paddingTop: 6 }}>
      <Animated.View style={{ width: '75%', height: 40, borderRadius: 12, backgroundColor: '#eef0f6', opacity: anim }} />
      <Animated.View style={{ width: '90%', height: 40, borderRadius: 12, backgroundColor: '#eef0f6', opacity: anim }} />
    </View>
  );
};

const SectionCard = ({ icon, title, selected, onClear, loading, children }: any) => (
  <View style={st.card}>
    <View style={st.cardHead}>
      <View style={st.cardIconWrap}>{icon}</View>
      <Text style={st.cardTitle}>{title}</Text>
      {selected && onClear && (
        <TouchableOpacity onPress={onClear} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <X size={16} color={COLORS.gray} />
        </TouchableOpacity>
      )}
    </View>
    {selected ? (
      <View style={st.selectedPill}>
        <CheckCircle size={14} color={COLORS.success} />
        <Text style={st.selectedText} numberOfLines={1}>{selected}</Text>
      </View>
    ) : loading ? <Skeleton /> : children}
  </View>
);

const SearchInput = ({ value, onChange, placeholder }: { value: string; onChange: (t: string) => void; placeholder: string }) => (
  <View style={st.searchBar}>
    <Search size={15} color={COLORS.gray} />
    <TextInput style={st.searchText} value={value} onChangeText={onChange} placeholder={placeholder} placeholderTextColor={COLORS.gray} />
    {value.length > 0 && (
      <TouchableOpacity onPress={() => onChange('')}><X size={14} color={COLORS.gray} /></TouchableOpacity>
    )}
  </View>
);

const OptionRow = ({ label, onPress }: { label: string; onPress: () => void }) => (
  <TouchableOpacity style={st.optionRow} onPress={onPress} activeOpacity={0.6}>
    <Text style={st.optionLabel}>{label}</Text>
    <ChevronRight size={16} color={COLORS.border} />
  </TouchableOpacity>
);

const DetailRow = ({ icon, label, value }: { icon?: any; label: string; value: string }) => (
  <View style={st.detailRow}>
    <View style={st.detailLeft}>
      {icon && <View style={st.detailIconWrap}>{icon}</View>}
      <Text style={st.detailLabel}>{label}</Text>
    </View>
    <Text style={st.detailValue} numberOfLines={2}>{value}</Text>
  </View>
);

/* ================= STYLES ================= */

const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f4f5f9' },
  headerBg: { position: 'absolute', height: 220, left: 0, right: 0 },

  /* Header */
  header: { paddingTop: 48, paddingHorizontal: 22, paddingBottom: 10, alignItems: 'center' },
  logo: { width: 105, height: 32, marginBottom: 12 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: COLORS.white, letterSpacing: -0.2, marginBottom: 14 },

  /* Progress */
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 20 },
  progressItem: { alignItems: 'center', gap: 4 },
  progressDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.25)' },
  progressDotActive: { backgroundColor: COLORS.white, width: 10, height: 10, borderRadius: 5 },
  progressLabel: { fontSize: 10, color: 'rgba(255,255,255,0.4)', fontWeight: '600' },
  progressLabelActive: { color: 'rgba(255,255,255,0.9)' },

  /* Body */
  body: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 40 },

  /* Card */
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
  cardHead: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  cardIconWrap: {
    width: 30, height: 30, borderRadius: 10,
    backgroundColor: COLORS.accent1 + '12',
    alignItems: 'center', justifyContent: 'center', marginRight: 10,
  },
  cardTitle: { fontSize: 15, fontWeight: '700', color: COLORS.primary, flex: 1 },

  /* Selected pill */
  selectedPill: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: COLORS.success + '0A',
    paddingVertical: 10, paddingHorizontal: 14,
    borderRadius: 12, borderWidth: 1, borderColor: COLORS.success + '20',
  },
  selectedText: { fontSize: 13, fontWeight: '600', color: COLORS.primary, flex: 1 },

  /* Search */
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#f4f5f9', borderRadius: 12,
    paddingHorizontal: 12, paddingVertical: 9, marginBottom: 10,
  },
  searchText: { flex: 1, fontSize: 13, color: COLORS.primary, padding: 0, outlineStyle: 'none' } as any,

  /* Option row */
  optionRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 13, paddingHorizontal: 14,
    borderRadius: 14, marginBottom: 6,
    backgroundColor: '#fafbfe',
    borderWidth: 1, borderColor: '#f0f1f6',
  },
  optionLabel: { fontSize: 13, fontWeight: '600', color: COLORS.primary },

  /* Date picker */
  datePicker: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#f4f5f9', borderRadius: 14,
    paddingVertical: 13, paddingHorizontal: 14,
    marginBottom: 16, borderWidth: 1, borderColor: '#f0f1f6',
  },
  dateText: { flex: 1, fontSize: 14, fontWeight: '600', color: COLORS.primary },

  /* Slot groups */
  slotGroup: { marginBottom: 16 },
  slotGroupHead: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  slotGroupLabel: { fontSize: 12, fontWeight: '600', color: COLORS.gray, letterSpacing: 0.2 },
  slotWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  slotChip: {
    paddingVertical: 10, paddingHorizontal: 16,
    borderRadius: 12, backgroundColor: '#fafbfe',
    borderWidth: 1, borderColor: '#f0f1f6',
  },
  slotChipActive: {
    backgroundColor: COLORS.primary, borderColor: COLORS.primary,
    shadowColor: COLORS.primary, shadowOpacity: 0.15, shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 }, elevation: 4,
  },
  slotChipText: { fontSize: 12, fontWeight: '600', color: COLORS.primary },
  slotChipTextActive: { color: COLORS.white },

  empty: { textAlign: 'center', marginVertical: 16, color: COLORS.gray, fontSize: 13 },

  /* CTA */
  ctaBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    padding: 16, paddingBottom: Platform.OS === 'ios' ? 30 : 16,
    backgroundColor: 'rgba(244,245,249,0.95)',
  },
  ctaGradient: { borderRadius: 14 },
  ctaBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 14, gap: 6,
  },
  ctaText: { color: COLORS.white, fontSize: 15, fontWeight: '700' },

  /* Modal */
  overlay: {
    position: 'absolute', inset: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center', alignItems: 'center',
  },
  modal: {
    backgroundColor: COLORS.white, borderRadius: 24, padding: 26, width: '90%',
    alignItems: 'center',
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.1, shadowRadius: 30, elevation: 10,
    borderWidth: 1, borderColor: 'rgba(238,240,248,0.9)',
  },
  modalIconWrap: {
    width: 52, height: 52, borderRadius: 16,
    backgroundColor: COLORS.primary + '10',
    alignItems: 'center', justifyContent: 'center', marginBottom: 14,
  },
  modalTitle: { fontSize: 19, fontWeight: '700', color: COLORS.primary, marginBottom: 4 },
  modalSub: { fontSize: 12, color: COLORS.gray, marginBottom: 18 },
  modalDivider: { width: '100%', height: 1, backgroundColor: '#f0f1f6', marginVertical: 12 },
  modalDetailsCard: {
    width: '100%', backgroundColor: '#fafbfe', borderRadius: 16,
    paddingVertical: 6, paddingHorizontal: 16,
    borderWidth: 1, borderColor: '#f0f1f6', marginBottom: 4,
  },
  modalRowDivider: { height: 1, backgroundColor: '#f0f1f6' },
  modalBtnGradient: { borderRadius: 14, width: '100%', marginTop: 18 },
  modalBtn: { paddingVertical: 14, alignItems: 'center' },
  modalBtnText: { color: COLORS.white, fontSize: 15, fontWeight: '700' },
  modalBackWrap: { marginTop: 14, paddingVertical: 4 },
  modalBack: { color: COLORS.gray, fontWeight: '600', fontSize: 13 },

  /* Success */
  successIconWrap: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: COLORS.success,
    alignItems: 'center', justifyContent: 'center', marginBottom: 14,
    shadowColor: COLORS.success, shadowOpacity: 0.25, shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 }, elevation: 6,
  },
  successTitle: { fontSize: 19, fontWeight: '700', color: COLORS.primary, marginBottom: 4 },
  successSub: { fontSize: 12, color: COLORS.gray, marginBottom: 18 },
  successPrimaryBtn: {
    marginTop: 18, backgroundColor: COLORS.primary,
    paddingVertical: 14, borderRadius: 14, width: '100%', alignItems: 'center',
  },
  successPrimaryText: { color: COLORS.white, fontSize: 14, fontWeight: '700' },

  /* Detail row */
  detailRow: {
    width: '100%', flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingVertical: 11,
  },
  detailLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  detailIconWrap: {
    width: 26, height: 26, borderRadius: 8,
    backgroundColor: COLORS.accent1 + '12',
    alignItems: 'center', justifyContent: 'center',
  },
  detailLabel: { fontSize: 12, color: COLORS.gray, fontWeight: '500' },
  detailValue: { fontSize: 13, fontWeight: '600', color: COLORS.primary, maxWidth: '55%', textAlign: 'right' },
});

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Animated,
  RefreshControl,
  Alert,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Users,
  Phone,
  Calendar,
  Shield,
  VenusAndMars,
  IdCard,
  ChevronRight,
} from 'lucide-react-native';
import { useAuth } from '../../contexts/AuthContext';
import { COLORS, SPACING, FONT_SIZES, LOGO_URL } from '../../constants/theme';
import { useFocusEffect } from 'expo-router';

const { width: SCREEN_W } = Dimensions.get('window');

export default function HomeScreen() {
  const { patient, getPatient, loading: isAuthLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadPatientData();
    }, [])
  );

  const loadPatientData = async () => {
    try {
      setLoading(true);
      await getPatient();
    } catch (error) {
      console.error('Error loading patient data:', error);
      Alert.alert('Error', 'Failed to load patient data');
    } finally {
      setLoading(false);
    }
  };

  const safeValue = (value?: string | null) => {
    if (!value || value === 'undefined' || value === 'null') return '—';
    return String(value);
  };

  const getAge = (dob?: string) => {
    if (!dob) return '—';
    const date = new Date(dob);
    if (isNaN(date.getTime())) return '—';
    const age = new Date().getFullYear() - date.getFullYear();
    return age > 0 ? `${age} yrs` : '—';
  };

  const formatDOB = (dob?: string) => {
    if (!dob) return '—';
    const date = new Date(dob);
    if (isNaN(date.getTime())) return '—';
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  function combineAddress({ govtIdNum }: any) {
    return safeValue(govtIdNum);
  }

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPatientData();
    setRefreshing(false);
  };

  /* ── Skeleton ── */
  const SkeletonLoader = () => {
    const pulseAnim = React.useRef(new Animated.Value(0.3)).current;

    React.useEffect(() => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 0.3, duration: 800, useNativeDriver: true }),
        ])
      ).start();
    }, []);

    const Bone = ({ w, h, r = 8, style }: { w: number | string; h: number; r?: number; style?: any }) => (
      <Animated.View style={[{ width: w, height: h, backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: r, opacity: pulseAnim }, style]} />
    );

    return (
      <View style={s.root}>
        <LinearGradient colors={[COLORS.primary, COLORS.secondary, COLORS.accent1]} style={s.headerGradient} />
        <View style={s.headerInner}>
          <View style={s.logoRow}>
            <Image source={{ uri: LOGO_URL }} style={s.logoImg} resizeMode="contain" />
          </View>
          <Bone w={90} h={12} style={{ marginBottom: 8 }} />
          <Bone w={180} h={20} style={{ marginBottom: 10 }} />
          <Bone w={110} h={22} r={12} />
        </View>
        <View style={s.body}>
          <View style={s.statsRow}>
            <View style={s.statCard}><Bone w={36} h={36} r={18} style={{ marginBottom: 8, backgroundColor: '#eee' }} /><Bone w={40} h={16} style={{ backgroundColor: '#eee' }} /></View>
            <View style={s.statCard}><Bone w={36} h={36} r={18} style={{ marginBottom: 8, backgroundColor: '#eee' }} /><Bone w={40} h={16} style={{ backgroundColor: '#eee' }} /></View>
          </View>
          <Bone w={130} h={18} style={{ marginBottom: 14, backgroundColor: '#e5e5e5' }} />
          {[1, 2, 3, 4].map((i) => (
            <View key={i} style={[s.infoRow, { marginBottom: 10 }]}>
              <Bone w={38} h={38} r={10} style={{ backgroundColor: '#eee' }} />
              <View style={{ marginLeft: 12, flex: 1 }}>
                <Bone w={70} h={10} style={{ marginBottom: 6, backgroundColor: '#eee' }} />
                <Bone w={140} h={14} style={{ backgroundColor: '#eee' }} />
              </View>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const isLoading = loading || isAuthLoading;
  if (isLoading && !patient) return <SkeletonLoader />;

  if (!patient) {
    return (
      <View style={[s.root, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ fontSize: 14, color: COLORS.error }}>No patient data available</Text>
      </View>
    );
  }

  /* ── Sub-components ── */

  const StatCard = ({ icon: Icon, label, value, accent }: { icon: any; label: string; value: string; accent: string }) => (
    <View style={s.statCard}>
      <View style={[s.statIconWrap, { backgroundColor: accent + '12' }]}>
        <Icon size={18} color={accent} strokeWidth={2.5} />
      </View>
      <Text style={s.statValue}>{value}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </View>
  );

  const InfoRow = ({ icon: Icon, label, value, accent = COLORS.primary }: { icon: any; label: string; value: string; accent?: string }) => (
    <TouchableOpacity style={s.infoRow} activeOpacity={0.6}>
      <LinearGradient
        colors={[accent + '10', accent + '06']}
        style={s.infoIconWrap}
      >
        <Icon size={17} color={accent} strokeWidth={2.5} />
      </LinearGradient>
      <View style={s.infoText}>
        <Text style={s.infoLabel}>{label}</Text>
        <Text style={s.infoValue}>{value}</Text>
      </View>
      <ChevronRight size={16} color={COLORS.border} strokeWidth={2} />
    </TouchableOpacity>
  );

  /* ── Main render ── */

  return (
    <View style={s.root}>
      {/* Header gradient */}
      <LinearGradient
        colors={[COLORS.primary, COLORS.secondary, COLORS.accent1]}
        style={s.headerGradient}
      />

      {/* Fixed header content */}
      <View style={s.headerInner}>
        <View style={s.logoRow}>
          <Image source={{ uri: LOGO_URL }} style={s.logoImg} resizeMode="contain" />
        </View>

        <Text style={s.welcomeLabel}>Welcome back,</Text>
        <Text style={s.patientName}>{patient.patient_name}</Text>

        <View style={s.idPill}>
          <Shield size={12} color={COLORS.white} strokeWidth={2.5} />
          <Text style={s.idPillText}>Hospital ID: {patient.patient_id}</Text>
        </View>
        <View style={s.idPillSpacing} />
      </View>

      {/* Scrollable body */}
      <ScrollView
        style={s.scroll}
        showsVerticalScrollIndicator={false}
        scrollEnabled={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.white} />}
      >
        {/* Spacer for header */}
        <View style={{ height: 216 }} />

        {/* White body sheet */}
        <View style={s.body}>
          {/* Quick stats — overlapping header */}
          <View style={s.statsRow}>
            <StatCard icon={Users} label="Age" value={getAge(patient.date_of_birth)} accent={COLORS.accent1} />
            <StatCard icon={VenusAndMars} label="Gender" value={safeValue(patient.gender)} accent={COLORS.secondary} />
          </View>

          {/* Section: Personal Details */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>Personal Details</Text>

            <View style={s.glassCard}>
              <InfoRow icon={Calendar} label="Date of Birth" value={formatDOB(patient.date_of_birth)} accent={COLORS.accent1} />
              <View style={s.separator} />
              <InfoRow icon={Phone} label="Mobile Number" value={safeValue(patient.phone_number)} accent={COLORS.success} />
              <View style={s.separator} />
              <InfoRow icon={IdCard} label="Govt ID Number" value={combineAddress({ ...patient })} accent={COLORS.secondary} />
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

/* ================= STYLES ================= */

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#f4f5f9',
  },

  /* ── Header ── */
  headerGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 240,
  },

  headerInner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingTop: 48,
    paddingHorizontal: 22,
    zIndex: 2,
  },

  logoRow: {
    alignItems: 'center',
    marginBottom: 14,
  },
  logoImg: {
    width: 105,
    height: 32,
  },

  welcomeLabel: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.75)',
    letterSpacing: 0.2,
  },
  patientName: {
    fontSize: 21,
    fontWeight: '700',
    color: COLORS.white,
    marginTop: 2,
    marginBottom: 10,
    letterSpacing: -0.2,
  },

  idPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 5,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  idPillText: {
    fontSize: 11,
    color: COLORS.white,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  idPillSpacing: {
    height: 16,
  },

  /* ── Scroll / Body ── */
  scroll: {
    flex: 1,
  },

  body: {
    backgroundColor: '#f4f5f9',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 0,
    paddingBottom: 40,
    minHeight: 500,
  },

  /* ── Quick Stats ── */
  statsRow: {
    flexDirection: 'row',
    gap: 14,
    marginTop: -28,
    marginBottom: 24,
  },

  statCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 18,
    paddingVertical: 18,
    paddingHorizontal: 14,
    alignItems: 'center',
    /* Glassy shadow */
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 5,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.8)',
  },
  statIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    color: COLORS.gray,
    fontWeight: '500',
    letterSpacing: 0.2,
  },

  /* ── Section ── */
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 12,
    letterSpacing: -0.2,
  },

  /* ── Glass Card ── */
  glassCard: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 0,
    /* Premium shadow */
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(238,240,248,0.9)',
  },

  separator: {
    height: 1,
    backgroundColor: '#f0f1f6',
    marginHorizontal: 18,
  },

  /* ── Info Row ── */
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 18,
  },
  infoIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  infoText: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 11,
    color: COLORS.gray,
    fontWeight: '500',
    marginBottom: 2,
    letterSpacing: 0.1,
  },
  infoValue: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
  },

  /* ── Error ── */
  errorText: {
    fontSize: 14,
    color: COLORS.error,
    textAlign: 'center',
  },
});

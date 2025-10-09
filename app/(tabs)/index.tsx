import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Animated, RefreshControl } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { User, Phone, Calendar, Droplet, MapPin, AlertCircle, Heart, Shield } from 'lucide-react-native';
import { useAuth } from '../../contexts/AuthContext';
import { patientApi } from '../../services/api';
import { Patient } from '../../types';
import { COLORS, SPACING, FONT_SIZES, LOGO_URL } from '../../constants/theme';

export default function HomeScreen() {
  const { patient: authPatient } = useAuth();
  const [patient, setPatient] = useState<Patient | null>(authPatient);
  const [refreshing, setRefreshing] = useState(false);
  const scrollY = new Animated.Value(0);

  useEffect(() => {
    loadPatientData();
  }, [authPatient]);

  const loadPatientData = async () => {
    if (authPatient) {
      try {
        const data = await patientApi.getProfile(authPatient.id);
        if (data) {
          setPatient(data);
        }
      } catch (error) {
        console.error('Error loading patient data:', error);
      }
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPatientData();
    setRefreshing(false);
  };

  if (!patient) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>No patient data available</Text>
      </View>
    );
  }

  const QuickStatCard = ({ icon: Icon, label, value, color }: { icon: any; label: string; value: string; color: string }) => (
    <View style={styles.quickStatCard}>
      <View style={[styles.quickStatIcon, { backgroundColor: color + '15' }]}>
        <Icon size={20} color={color} strokeWidth={2.5} />
      </View>
      <Text style={styles.quickStatValue}>{value}</Text>
      <Text style={styles.quickStatLabel}>{label}</Text>
    </View>
  );

  const InfoCard = ({ icon: Icon, label, value }: { icon: any; label: string; value: string }) => (
    <TouchableOpacity style={styles.infoCard} activeOpacity={0.7}>
      <View style={styles.iconContainer}>
        <Icon size={20} color={COLORS.primary} strokeWidth={2.5} />
      </View>
      <View style={styles.infoContent}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#20606B', '#262F82']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.headerBackground} />

      <View style={styles.headerContent}>
        <View style={styles.logoSmallContainer}>
          <Image source={{ uri: LOGO_URL }} style={styles.logoSmall} resizeMode="contain" />
        </View>
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeText}>Welcome back,</Text>
          <Text style={styles.patientName}>{patient.full_name}</Text>
          <View style={styles.idBadge}>
            <Shield size={12} color={COLORS.white} />
            <Text style={styles.patientId}>ID: {patient.hospital_id}</Text>
          </View>
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        <View style={styles.headerSpacer} />

        <View style={styles.content}>
          <View style={styles.quickStatsSection}>
            <View style={styles.quickStatsGrid}>
              <QuickStatCard icon={Droplet} label="Blood Group" value={patient.blood_group} color="#FF3B30" />
              <QuickStatCard icon={Heart} label="Age" value={new Date().getFullYear() - new Date(patient.date_of_birth).getFullYear() + ' yrs'} color="#FF6B9D" />
              <QuickStatCard icon={Calendar} label="Gender" value={patient.gender} color="#5AC8FA" />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Personal Details</Text>
            <View style={styles.cardsContainer}>
              <InfoCard icon={User} label="Full Name" value={patient.full_name} />
              <InfoCard icon={Calendar} label="Date of Birth" value={new Date(patient.date_of_birth).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} />
              <InfoCard icon={Phone} label="Mobile Number" value={patient.mobile_number} />
              <InfoCard icon={AlertCircle} label="Emergency Contact" value={patient.emergency_contact} />
              <InfoCard icon={MapPin} label="Address" value={patient.address} />
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  headerBackground: { position: 'absolute', top: 0, left: 0, right: 0, height: 280 },
  headerContent: { position: 'absolute', top: 0, left: 0, right: 0, paddingTop: 60, paddingHorizontal: SPACING.lg, paddingBottom: SPACING.lg, zIndex: 10 },
  logoSmallContainer: { backgroundColor: 'rgba(255, 255, 255, 0.2)', borderRadius: 12, padding: SPACING.sm, alignSelf: 'flex-start', marginBottom: SPACING.md },
  logoSmall: { width: 100, height: 32 },
  welcomeSection: { marginTop: SPACING.sm },
  welcomeText: { fontSize: FONT_SIZES.md, color: 'rgba(255, 255, 255, 0.9)', marginBottom: 4 },
  patientName: { fontSize: FONT_SIZES.xxxl, fontWeight: '800', color: COLORS.white, marginBottom: SPACING.sm, letterSpacing: -0.5 },
  idBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255, 255, 255, 0.2)', paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs, borderRadius: 20, alignSelf: 'flex-start', gap: SPACING.xs },
  patientId: { fontSize: FONT_SIZES.sm, color: COLORS.white, fontWeight: '600' },
  headerSpacer: { height: 220 },
  scrollView: { flex: 1 },
  content: { paddingHorizontal: SPACING.lg, paddingBottom: SPACING.xxl },
  quickStatsSection: { marginTop: -40, marginBottom: SPACING.lg },
  quickStatsGrid: { flexDirection: 'row', gap: SPACING.md },
  quickStatCard: { flex: 1, backgroundColor: COLORS.white, borderRadius: 20, padding: SPACING.md, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 4 },
  quickStatIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.sm },
  quickStatValue: { fontSize: FONT_SIZES.xl, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 2 },
  quickStatLabel: { fontSize: FONT_SIZES.xs, color: COLORS.textSecondary, textAlign: 'center' },
  section: { marginBottom: SPACING.lg },
  sectionTitle: { fontSize: FONT_SIZES.xl, fontWeight: '700', color: COLORS.textPrimary, marginBottom: SPACING.md },
  cardsContainer: { gap: SPACING.sm },
  infoCard: { backgroundColor: COLORS.white, borderRadius: 16, padding: SPACING.md, flexDirection: 'row', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  iconContainer: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#F0F7F9', alignItems: 'center', justifyContent: 'center', marginRight: SPACING.md },
  infoContent: { flex: 1 },
  infoLabel: { fontSize: FONT_SIZES.xs, color: COLORS.textSecondary, marginBottom: 2, fontWeight: '500' },
  infoValue: { fontSize: FONT_SIZES.md, color: COLORS.textPrimary, fontWeight: '600' },
  errorText: { fontSize: FONT_SIZES.md, color: COLORS.error, textAlign: 'center', marginTop: SPACING.xxl },
});

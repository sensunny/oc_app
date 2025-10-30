import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Animated, RefreshControl, Alert, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { User, Users, Phone, Calendar, MapPin, Heart, Shield, VenusAndMars } from 'lucide-react-native';
import { useAuth } from '../../contexts/AuthContext';
import { COLORS, SPACING, FONT_SIZES, LOGO_URL } from '../../constants/theme';
import { useFocusEffect } from 'expo-router';

export default function HomeScreen() {
  const { patient, getPatient } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const scrollY = new Animated.Value(0);

  useFocusEffect(
    useCallback(() => {
      loadPatientData();
    }, [])
  );

  const loadPatientData = async () => {
    if (!patient) return;
    try {
      await getPatient();
    } catch (error) {
      console.error('Error loading documents:', error);
      Alert.alert('Error', 'Failed to load documents');
    }
    setLoading(false);
  };

  function combineAddress({ address, area, city, state }) {
    const parts = [address, area, city, state].filter(part => part && part.trim() !== '');
    if (parts.length === 0) return '-';
    return parts.join(', ');
  }

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPatientData();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={{ marginTop: 10, color: COLORS.text }}>Loading patient data...</Text>
      </View>
    );
  }


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
        <Icon size={20} color="#20606b" strokeWidth={2.5} />
      </View>
      <View style={styles.infoContent}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#20606b', '#262f82', '#9966ff']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerBackground}
      />

      <View style={styles.headerContent}>
        <View style={styles.logoSmallContainer}>
          <Image source={{ uri: LOGO_URL }} style={styles.logoSmall} resizeMode="contain" />
        </View>
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeText}>Welcome back,</Text>
          <Text style={styles.patientName}>{patient.patient_name}</Text>
          <View style={styles.idBadge}>
            <Shield size={14} color="#20606b" strokeWidth={3} />
            <Text style={styles.patientId}>Hospital ID: {patient.patient_id}</Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.headerSpacer} />

        <View style={styles.content}>
          <View style={styles.quickStatsSection}>
            <View style={styles.quickStatsGrid}>
              <QuickStatCard icon={Users} label="Age" value={new Date().getFullYear() - new Date(patient.date_of_birth).getFullYear() + ' yrs'} color="#9966ff" />
              <QuickStatCard icon={VenusAndMars} label="Gender" value={patient.gender} color="#262f82" />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Personal Details</Text>
            <View style={styles.cardsContainer}>
              <InfoCard icon={User} label="Full Name" value={patient.patient_name} />
              <InfoCard
                icon={Calendar}
                label="Date of Birth"
                value={new Date(patient.date_of_birth).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              />
              <InfoCard icon={Phone} label="Mobile Number" value={patient.phone_number} />
              <InfoCard icon={MapPin} label="Address" value={`${combineAddress({ ...patient })}`} />
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.lightGray }, // brand light background
  headerBackground: { position: 'absolute', top: 0, left: 0, right: 0, height: 280 },
  headerContent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingTop: 60,
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.lg,
    zIndex: 0,
  },
  logoSmallContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    padding: SPACING.sm,
    alignSelf: 'flex-start',
    marginBottom: SPACING.md,
    zIndex: -1,
  },
  logoSmall: { width: 100, height: 32 },
  welcomeSection: { marginTop: SPACING.sm, zIndex: 0 },
  welcomeText: { fontSize: FONT_SIZES.md, color: 'rgba(255,255,255,0.9)', marginBottom: 4 },
  patientName: { fontSize: FONT_SIZES.xxxl, fontWeight: '800', color: COLORS.white, marginBottom: SPACING.sm, letterSpacing: -0.5 },
  idBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dfedf6',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: 20,
    alignSelf: 'flex-start',
    gap: SPACING.xs,
    borderWidth: 1,
    borderColor: '#20606b',
  },
  patientId: { fontSize: FONT_SIZES.sm, color: '#20606b', fontWeight: '700' },
  headerSpacer: { height: 300 },
  scrollView: { flex: 1 },
  content: { paddingHorizontal: SPACING.lg, paddingBottom: SPACING.xxl },
  quickStatsSection: { marginTop: -40, marginBottom: SPACING.lg },
  quickStatsGrid: { flexDirection: 'row', gap: SPACING.md, zIndex: 4 },
  quickStatCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: SPACING.md,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  quickStatIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.sm },
  quickStatValue: { fontSize: FONT_SIZES.xl, fontWeight: '800', color: '#20606b', marginBottom: 2 },
  quickStatLabel: { fontSize: FONT_SIZES.xs, color: '#262f82', textAlign: 'center' },
  section: { marginBottom: SPACING.lg },
  sectionTitle: { fontSize: FONT_SIZES.xl, fontWeight: '700', color: '#20606b', marginBottom: SPACING.md },
  cardsContainer: { gap: SPACING.sm },
  infoCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#dfedf6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  infoContent: { flex: 1 },
  infoLabel: { fontSize: FONT_SIZES.xs, color: '#262f82', marginBottom: 2, fontWeight: '500' },
  infoValue: { fontSize: FONT_SIZES.md, color: '#20606b', fontWeight: '600' },
  errorText: { fontSize: FONT_SIZES.md, color: COLORS.error, textAlign: 'center', marginTop: SPACING.xxl },
});

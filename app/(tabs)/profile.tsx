import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import {
  LogOut,
  User,
  Phone,
  Mail,
  Shield,
  Bell,
  HelpCircle,
  ChevronRight,
} from 'lucide-react-native';
import { useAuth } from '../../contexts/AuthContext';
import { COLORS, SPACING, FONT_SIZES } from '../../constants/theme';
import { patientApi } from '@/services/api';

export default function ProfileScreen() {
  const router = useRouter();
  const { patient, logout, getPatient } = useAuth();

  useFocusEffect(
    useCallback(() => {
      loadPatientData();
    }, [])
  );


  const loadPatientData = async () => {
    if (!patient) return;
    try {
      const docs = await getPatient();
      console.log({docs})
      // setDocuments(docs);
    } catch (error) {
      console.error('Error loading documents:', error);
      Alert.alert('Error', 'Failed to load documents');
    }
  };

  const handleLogout = async () => {
    console.log('22');
    await logout();
    // router.replace('/login');
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/login');
          },
        },
      ],
      { cancelable: true }
    );
  };

  const MenuItem = ({
    icon: Icon,
    title,
    subtitle,
    onPress,
    showChevron = true,
  }: {
    icon: any;
    title: string;
    subtitle?: string;
    onPress?: () => void;
    showChevron?: boolean;
  }) => (
    <TouchableOpacity
      style={styles.menuItem}
      onPress={onPress}
      activeOpacity={0.7}
      disabled={!onPress}
    >
      <View style={styles.menuIconContainer}>
        <Icon size={20} color={COLORS.primary} />
      </View>
      <View style={styles.menuContent}>
        <Text style={styles.menuTitle}>{title}</Text>
        {subtitle && <Text style={styles.menuSubtitle}>{subtitle}</Text>}
      </View>
      {showChevron && <ChevronRight size={20} color={COLORS.gray} />}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <User size={40} color={COLORS.white} />
        </View>
        <Text style={styles.patientName}>{patient?.patient_name}</Text>
        <Text style={styles.patientId}>Hospital ID: {patient?.patient_id}</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Information</Text>
          <View style={styles.card}>
            <MenuItem
              icon={User}
              onPress={() => router.replace('/(tabs)')}
              title="Personal Details"
              subtitle="View and update your information"
            />
            <MenuItem
              icon={Phone}
              onPress={() => Linking.openURL(`tel:${patient?.otherData?.oncare_number}`)}
              title="Oncare Support Number"
              subtitle={patient?.otherData?.oncare_number || ''}
              showChevron={false}
            />
          </View>
        </View>

        <View style={styles.section, { display: "none"}}>
          <Text style={styles.sectionTitle}>Settings</Text>
          <View style={styles.card}>
            <MenuItem
              icon={Bell}
              title="Notifications"
              subtitle="Manage notification preferences"
            />
            <MenuItem
              icon={Shield}
              title="Privacy & Security"
              subtitle="Manage your privacy settings"
            />
          </View>
        </View>

        <View style={styles.section, { display: "none"}}>
          <Text style={styles.sectionTitle}>Support</Text>
          <View style={styles.card}>
            <MenuItem
              icon={HelpCircle}
              title="Help & Support"
              subtitle="Get help and contact support"
            />
            <MenuItem
              icon={Mail}
              title="Feedback"
              subtitle="Share your feedback with us"
            />
          </View>
        </View>

        <View style={styles.section}>
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
            activeOpacity={0.7}
          >
            <LogOut size={20} color={COLORS.error} />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Version 1.0.0</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.lightBlue,
  },
  header: {
    backgroundColor: COLORS.primary,
    paddingTop: 60,
    paddingBottom: SPACING.xl,
    alignItems: 'center',
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  patientName: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    color: COLORS.white,
  },
  patientId: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.white,
    opacity: 0.8,
    marginTop: SPACING.xs,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    padding: SPACING.lg,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: COLORS.lightBlue,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  menuSubtitle: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    padding: SPACING.md,
    borderRadius: 16,
    gap: SPACING.sm,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  logoutText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.error,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
  },
  footerText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
  },
});

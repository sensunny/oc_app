import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
  Image,
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
import { COLORS, SPACING, FONT_SIZES, LOGO_URL } from '../../constants/theme';
import { patientApi } from '@/services/api';
import { LinearGradient } from 'expo-linear-gradient';
import Constants from "expo-constants";
import { FAQView } from '@/components/FAQView';
import { fetchWrapper } from '@/utils/fetchWrapper';

export default function ProfileScreen() {
  const router = useRouter();
  const { patient, logout, getPatient } = useAuth();
  const [faqTabs, setFaqTabs] = useState<any[]>([]);

  useFocusEffect(
    useCallback(() => {
      loadPatientData();
      loadFaq();
    }, [])
  );

  const loadFaq = async () => {
  try {
    const data = await retry(() =>
      post('getFaqQuestions', {})
    );
    setFaqTabs(data || []);
  } catch (e) {
    console.log("e", e)
    console.warn('FAQ load failed');
  }
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


  const loadPatientData = async () => {
    if (!patient) return;
    try {
      const docs = await getPatient();
      // setDocuments(docs);
    } catch (error) {
      console.error('Error loading documents:', error);
      Alert.alert('Error', 'Failed to load documents');
    }
  };

  const appVersion =
  Constants.expoConfig?.version ?? "N/A";

  const [activeFAQ, setActiveFAQ] = useState<any>(null);
  

  const handleLogout = async () => {
    // console.log('22');
    // await logout();
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

  if (activeFAQ) {
    return <FAQView data={activeFAQ} onClose={() => setActiveFAQ(null)} />;
  } 

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <LinearGradient
            colors={[COLORS.primary, COLORS.secondary, COLORS.accent1]}
            style={StyleSheet.absoluteFillObject}
          />
        <Image source={{ uri: LOGO_URL }} style={styles.logoImg} resizeMode="contain" />
        <View style={styles.avatarContainer}>
          <User size={22} color={COLORS.white} />
        </View>
        <Text style={styles.patientName}>{patient?.patient_name}</Text>
        <Text style={styles.patientId}>Hospital ID: {patient?.patient_id}</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        scrollEnabled={false}
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Information</Text>
          <View style={styles.card}>
            <MenuItem
              icon={User}
              onPress={() => router.replace('/(tabs)')}
              title="Personal Details"
              subtitle="View your personal information"
            />
            {/* <MenuItem
              icon={Phone}
              onPress={() => Linking.openURL(`tel:${patient?.otherData?.oncare_number}`)}
              title="Oncare Support Number"
              subtitle={patient?.otherData?.oncare_number || ''}
              showChevron={false}
            /> */}
          </View>
        </View>

        <View style={[styles.section, { display: "none"}]}>
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

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>
          <View style={styles.card}>
            <MenuItem
              icon={Phone}
              onPress={() => Linking.openURL(`tel:${patient?.otherData?.oncare_number}`)}
              title="Oncare Support Number"
              subtitle={patient?.otherData?.oncare_number || ''}
              showChevron={false}
            />
            {faqTabs.map(tab => (
              <MenuItem
                key={tab.key}
                icon={HelpCircle}
                title={tab.title}
                subtitle={tab.subtitle}
                onPress={() => setActiveFAQ(faqTabs[0].page)}
              />
            ))}

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
          <Text style={styles.footerText}>Version {appVersion}</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f5f9',
  },
  header: {
    backgroundColor: COLORS.primary,
    paddingTop: 48,
    paddingBottom: 18,
    alignItems: 'center',
  },
  logoImg: {
    width: 105,
    height: 32,
    marginBottom: 12,
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  patientName: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.white,
    letterSpacing: -0.2,
  },
  patientId: {
    fontSize: 11,
    color: COLORS.white,
    opacity: 0.55,
    fontWeight: '600',
    marginTop: 3,
    letterSpacing: 0.2,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.gray,
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(238,240,248,0.9)',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f1f6',
  },
  menuIconContainer: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: COLORS.primary + '10',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
  menuSubtitle: {
    fontSize: 11,
    color: COLORS.gray,
    marginTop: 2,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 14,
    gap: 8,
    borderWidth: 1.5,
    borderColor: COLORS.error + '30',
  },
  logoutText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.error,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  footerText: {
    fontSize: 11,
    color: COLORS.gray,
  },
});

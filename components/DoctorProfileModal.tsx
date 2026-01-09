import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  Modal,
} from 'react-native';
import { COLORS, SPACING, FONT_SIZES } from '../constants/theme';
import { X } from 'lucide-react-native';

const DoctorProfileModal = ({ doctor, onClose }: any) => {
  const details = doctor?.doctorDetails || {};

  const educationList = Array.isArray(details.qualificationsArray)
    ? details.qualificationsArray
    : details.qualificationsArray
    ? [details.qualificationsArray]
    : [];

  const experienceList = Array.isArray(details.past_experience)
    ? details.past_experience
    : details.past_experience
    ? [details.past_experience]
    : [];

  const expertiseList = Array.isArray(details.expertise)
    ? details.expertise
    : details.expertise
    ? details.expertise.split(',').map((e: string) => e.trim())
    : [];

  return (
    <Modal transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* ================= HEADER ================= */}
          <View style={styles.header}>
            <View>
              <Text style={styles.headerName}>
                Dr. {doctor.firstName} {doctor.lastName || ''}
              </Text>
            </View>

            <TouchableOpacity onPress={onClose}>
              <X size={22} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* ================= IMAGE ================= */}
            <Image
              source={{ uri: details.img }}
              style={styles.avatar}
            />

            {/* ================= SPECIALISATION ================= */}
            {details.specialisation && (
              <Text style={styles.speciality}>
                {details.specialisation}
              </Text>
            )}

            {/* ================= EXPERIENCE ================= */}
            {details.experience && (
              <Text style={styles.experience}>
                {details.experience} years of experience
              </Text>
            )}

            {/* ================= EDUCATION ================= */}
            {educationList.length > 0 && (
              <Section title="Education" items={educationList} />
            )}

            {/* ================= PROFESSIONAL EXPERIENCE ================= */}
            {experienceList.length > 0 && (
              <Section
                title="Professional Experience"
                items={experienceList}
              />
            )}

            {/* ================= AREA OF EXPERTISE (BOTTOM) ================= */}
            {expertiseList.length > 0 && (
              <Section title="Area of Expertise" items={expertiseList} />
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

export default DoctorProfileModal;

/* ===================== SECTION ===================== */

const Section = ({ title, items }: any) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {items.map((item: string, index: number) => (
      <Text key={index} style={styles.sectionValue}>
        • {item}
      </Text>
    ))}
  </View>
);

/* ===================== STYLES ===================== */

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    padding: SPACING.lg,
  },

  card: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: SPACING.lg,
    maxHeight: '85%',
  },

  /* ===== HEADER ===== */

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },

  headerTitle: {
    fontSize: FONT_SIZES.sm + 2,
    fontWeight: '700',
    color: COLORS.primary,
  },

  headerName: {
    marginTop: 2,
    fontSize: FONT_SIZES.md + 2,
    fontWeight: '800',
    color: COLORS.primary,
  },

  /* ===== IMAGE ===== */

  avatar: {
    width: 110,
    height: 110,
    borderRadius: 55,
    alignSelf: 'center',
    marginVertical: SPACING.md,
    backgroundColor: COLORS.lightGray,
  },

  /* ===== META ===== */

  speciality: {
    fontSize: FONT_SIZES.sm + 1,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
    marginTop: 4,
  },

  experience: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.secondary,
    textAlign: 'center',
    marginTop: 6,
  },

  /* ===== SECTIONS ===== */

  section: {
    marginTop: SPACING.lg,
  },

  sectionTitle: {
    fontSize: FONT_SIZES.sm + 1,
    fontWeight: '800',
    color: COLORS.primary,
    marginBottom: 8,
  },

  sectionValue: {
    fontSize: FONT_SIZES.sm + 1,
    fontWeight: '400',
    color: '#1F2937',
    lineHeight: 24,
    marginBottom: 4,
  },
});

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { COLORS, SPACING, FONT_SIZES } from '../constants/theme';
import DoctorProfileModal from './DoctorProfileModal';
import { User } from 'lucide-react-native';

type DoctorCardProps = {
  doctor: {
    firstName: string;
    lastName?: string;
    doctorDetails?: {
      experience?: number | string;
      specialisation?: string;
      img?: string;
      qualificationsArray?: string[] | string;
      past_experience?: string[] | string;
    };
  };
  active?: boolean;
  onPress: () => void;
};

const DoctorCard: React.FC<DoctorCardProps> = ({
  doctor,
  active = false,
  onPress,
}) => {
  const [showProfile, setShowProfile] = useState(false);

  const hasDoctorDetails = Object.keys(doctor?.doctorDetails || {}).length > 0;
  const hasImage = !!doctor?.doctorDetails?.img;

  return (
    <>
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.88}
        style={[styles.card, active && styles.cardActive]}
      >
        {/* Doctor Image / Icon */}
        <View style={[styles.avatarWrapper, active && styles.avatarActive]}>
  {hasImage ? (
    <Image
      source={{ uri: doctor.doctorDetails!.img }}
      style={styles.avatar}
      resizeMode="cover"
    />
  ) : (
    <User size={34} color={COLORS.primary} />
  )}
</View>

        {/* Doctor Info */}
        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={1}>
            Dr. {doctor.firstName} {doctor.lastName || ''}
          </Text>

          {doctor?.doctorDetails?.experience ? (
            <Text style={styles.experience}>
              {doctor.doctorDetails.experience}
            </Text>
          ) : null}

          {doctor?.doctorDetails?.specialisation ? (
            <Text style={styles.speciality} numberOfLines={1}>
              {doctor.doctorDetails.specialisation}
            </Text>
          ) : null}

          {/* View Profile only if details exist */}
          {hasDoctorDetails && (
            <TouchableOpacity onPress={() => setShowProfile(true)}>
              <Text style={styles.viewProfile}>View Doctor Profile</Text>
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>

      {/* Profile Modal */}
      {showProfile && hasDoctorDetails && (
        <DoctorProfileModal
          doctor={doctor}
          onClose={() => setShowProfile(false)}
        />
      )}
    </>
  );
};

export default DoctorCard;

/* ===================== STYLES ===================== */

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.sm + 5,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.primary,
    shadowOpacity: Platform.OS === 'ios' ? 0.08 : 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },

  cardActive: {
    backgroundColor: COLORS.lightBlue,
    borderColor: COLORS.primary,
    shadowOpacity: Platform.OS === 'ios' ? 0.18 : 0.25,
    elevation: 7,
  },

  avatarWrapper: {
  width: 84,              // ⬅️ bigger presence
  height: 84,
  borderRadius: 42,
  justifyContent: 'center',
  alignItems: 'center',
  backgroundColor: COLORS.white,   // cleaner contrast
  borderWidth: 1,
  borderColor: COLORS.border,
  marginRight: SPACING.lg,         // more separation from text

  shadowColor: COLORS.primary,     // subtle depth
  shadowOpacity: Platform.OS === 'ios' ? 0.12 : 0.18,
  shadowRadius: 10,
  shadowOffset: { width: 0, height: 4 },
  elevation: 5,
},

  avatarActive: {
  borderColor: COLORS.primary,
},

avatar: {
  width: 76,               // ⬅️ image fills space
  height: 76,
  borderRadius: 38,
},

  info: {
    flex: 1,
  },

  name: {
    fontSize: FONT_SIZES.md,
    fontWeight: '800',
    color: COLORS.primary,
  },

  experience: {
    marginTop: 4,
    fontSize: FONT_SIZES.xs + 3,
    fontWeight: '700',
    color: COLORS.secondary,
  },

  speciality: {
    marginTop: 6,
    fontSize: FONT_SIZES.xs + 2,
    color: COLORS.textSecondary,
  },

  viewProfile: {
    marginTop: 8,
    fontSize: FONT_SIZES.xs + 1,
    fontWeight: '700',
    color: COLORS.accent1,
  },
});

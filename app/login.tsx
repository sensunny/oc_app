import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Dimensions,
  LayoutAnimation,
  UIManager,
  Pressable,
  Modal,
  Animated,
  Keyboard
} from 'react-native';

import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { COLORS, SPACING, FONT_SIZES, LOGO_URL } from '../constants/theme';
import Toast from 'react-native-toast-message';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

if (Platform.OS === 'android') {
  UIManager.setLayoutAnimationEnabledExperimental?.(true);
}

const showToast = (
  message: string,
  type: 'success' | 'error' = 'error'
) => {
  Toast.show({
    type,
    text1: message,
    position: 'top',
    visibilityTime: 3500,
    topOffset: 60,
  });
};

/* ===== ORIGINAL BRAND – REFINED ===== */
const BRAND = {
  color1: '#20206b',
  color2: '#262f82',
  color3: '#9966ff',
  surface: '#ffffff',
  textPrimary: '#1f2937',
  textMuted: '#6b7280',
};

export default function LoginScreen() {
  const router = useRouter();
  const { login, sendOTP } = useAuth();
  const sheetAnim = useRef(new Animated.Value(0)).current;
const openSheet = () => {
  setIsUidOpen(true);
  Animated.timing(sheetAnim, {
    toValue: 1,
    duration: 260,
    useNativeDriver: true,
  }).start();
};

const closeSheet = () => {
  Animated.timing(sheetAnim, {
    toValue: 0,
    duration: 220,
    useNativeDriver: true,
  }).start(() => setIsUidOpen(false));
};


  const [identifier, setIdentifier] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'identifier' | 'otp'>('identifier');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({ identifier: '', otp: '', hospitalUid: '' });
  const [userMobile, setUserMobile] = useState('');
  const [hospitalUids, setHospitalUids] = useState<any[]>([]);
  const [selectedHospitalUid, setSelectedHospitalUid] = useState('');
  const [isUidOpen, setIsUidOpen] = useState(false);



  /* Smooth & glitch-free */
  useEffect(() => {
    LayoutAnimation.configureNext(
      LayoutAnimation.create(
        220,
        LayoutAnimation.Types.easeInEaseOut,
        LayoutAnimation.Properties.opacity
      )
    );
  }, [step]);

  const handleSendOtp = async () => {
    Keyboard.dismiss();
  setErrors({ identifier: '', otp: '', hospitalUid: '' });

  if (!identifier.trim()) {
    setErrors({ identifier: 'Please enter Mobile Number/Hospital Id', otp: '', hospitalUid: '' });
    return;
  }

  setLoading(true);
  const response: any = await sendOTP(identifier);
  setLoading(false);

  if (response?.code === 1) {
    setStep('otp');
    setUserMobile(response.data.mobile);

    // 🔑 NEW
    setHospitalUids(response.data.hospitalUids || []);

    // Auto-select if only one UID
    if (response.data.hospitalUids?.length === 1) {
      setSelectedHospitalUid(response.data.hospitalUids[0].hospitalUid);
    }
  } else {
    showToast(response?.message || 'Something went wrong', 'error');
  }
  };


  const handleVerifyOtp = async () => {
    Keyboard.dismiss();
  setErrors({ identifier: '', otp: '', hospitalUid: '' });

  if (!otp.trim()) {
    setErrors({ identifier: '', otp: 'Please enter OTP', hospitalUid: '' });
    return;
  }

  if (otp.length !== 4) {
    setErrors({ identifier: '', otp: 'OTP must be 4 digits', hospitalUid: '' });
    return;
  }

  // 🔑 MULTI UID VALIDATION
  if (hospitalUids.length > 1 && !selectedHospitalUid) {
    setErrors({
    identifier: '',
    otp: '',
    hospitalUid: 'Please select Hospital ID',
  });
  return;
  }

  setLoading(true);
  const success = await login(userMobile, otp, selectedHospitalUid);
  setLoading(false);

  if (success) {
    router.replace('/(tabs)');
  } else {
    showToast('Invalid OTP or credentials', 'error');
  }
};


  const handleBack = () => {
    setOtp('');
    setErrors({ identifier: '', otp: '', hospitalUid: '' });
    setStep('identifier');
  };

  const toggleUidDropdown = () => {
  LayoutAnimation.configureNext(
    LayoutAnimation.create(
      200,
      LayoutAnimation.Types.easeInEaseOut,
      LayoutAnimation.Properties.opacity
    )
  );
  setIsUidOpen((prev) => !prev);
};

  return (
    <View style={styles.container}>
      {/* Clean medical gradient */}
      <LinearGradient
        colors={[BRAND.color1, BRAND.color2]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Soft accent blobs (not glass) */}
      <View style={styles.decor}>
        <View style={styles.blob1} />
        <View style={styles.blob2} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.logoContainer}>
            <Image source={{ uri: LOGO_URL }} style={styles.logo} />
          </View>

          {/* Premium Card */}
          <View style={styles.card}>
            <Text style={styles.title}>
              {step === 'identifier' ? 'Welcome Back' : 'Verify OTP'}
            </Text>

            <Text style={styles.subtitle}>
              {step === 'identifier'
                ? 'Access your OnCare medical records securely'
                : `Enter the code sent to ${userMobile}`}
            </Text>

            {step === 'identifier' ? (
              <>
                <Input
                  label="Mobile Number/Hospital Id"
                  value={identifier}
                  onChangeText={setIdentifier}
                  placeholder="Mobile Number/Hospital Id"
                  keyboardType="phone-pad"
                  error={errors.identifier}
                />

                <LinearGradient
                  colors={[BRAND.color1, BRAND.color3]}
                  style={styles.cta}
                >
                  <Button
                    title="Continue"
                    onPress={handleSendOtp}
                    loading={loading}
                    transparent
                  />
                </LinearGradient>
              </>
            ) : (
              <>
              {hospitalUids.length > 1 ? (
  <>
    {/* INPUT (unchanged look) */}
    <Pressable onPress={openSheet}>
      <View pointerEvents="none">
        <Input
          label="Hospital ID"
          value={selectedHospitalUid || 'Select Hospital ID'}
          editable={false}
          error={errors.hospitalUid}
        />
      </View>
    </Pressable>

    {/* BOTTOM SHEET */}
    <Modal
      visible={isUidOpen}
      transparent
      animationType="none"
      onRequestClose={closeSheet}
    >
      {/* Backdrop */}
      <Pressable style={styles.sheetBackdrop} onPress={closeSheet} />

      {/* Sheet */}
      <Animated.View
        style={[
          styles.sheetContainer,
          {
            transform: [
              {
                translateY: sheetAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [400, 0],
                }),
              },
            ],
          },
        ]}
      >
        <View style={styles.sheetHandle} />

        <Text style={styles.sheetTitle}>Select Hospital ID</Text>

        <ScrollView>
          {hospitalUids.map((item) => (
            <Pressable
              key={item.hospitalUid}
              onPress={() => {
                setSelectedHospitalUid(item.hospitalUid);
                setErrors({ ...errors, hospitalUid: '' });
                closeSheet();
              }}
            >
              <View style={styles.sheetOption}>
                <Text style={styles.sheetUid}>
                  {item.hospitalUid}
                </Text>
                <Text style={styles.sheetName}>
                  {item.name}
                </Text>
              </View>
            </Pressable>
          ))}
        </ScrollView>
      </Animated.View>
    </Modal>
  </>
) : (
  <Input
    label="Hospital ID"
    value={selectedHospitalUid}
    editable={false}
  />
)}


                <Input
                  label="Enter OTP"
                  value={otp}
                  onChangeText={setOtp}
                  placeholder="4-digit code"
                  keyboardType="number-pad"
                  maxLength={4}
                  error={errors.otp}
                />

                <LinearGradient
                  colors={[BRAND.color1, BRAND.color3]}
                  style={styles.cta}
                >
                  <Button
                    title="Verify & Login"
                    onPress={handleVerifyOtp}
                    loading={loading}
                    transparent
                  />
                </LinearGradient>

                <Button
                  title="Change Number"
                  variant="outline"
                  onPress={handleBack}
                  style={styles.backBtn}
                />
              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: { flex: 1 },

  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: SPACING.lg,
  },

  decor: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  blob1: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: '#9966ff',
    opacity: 0.15,
    top: -120,
    right: -100,
  },
  blob2: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: '#ffffff',
    opacity: 0.12,
    bottom: -80,
    left: -80,
  },

  logoContainer: {
    alignItems: 'center',
    marginBottom: SPACING.xxl,
  },
  logo: {
    width: 160,
    height: 60,
    resizeMode: 'contain',
  },

  card: {
    backgroundColor: BRAND.surface,
    borderRadius: 28,
    padding: SPACING.xl,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 25,
    shadowOffset: { width: 0, height: 15 },
    elevation: 12,
  },

  title: {
    fontSize: FONT_SIZES.xxxl,
    fontWeight: '800',
    color: BRAND.color2,
    marginBottom: SPACING.sm,
  },

  subtitle: {
    fontSize: FONT_SIZES.md,
    color: BRAND.textMuted,
    marginBottom: SPACING.xl,
    lineHeight: 22,
  },

  cta: {
    borderRadius: 14,
    padding: 2,
    marginTop: SPACING.md,
  },

  backBtn: {
    marginTop: SPACING.md,
  },

dropdownLabel: {
  fontSize: FONT_SIZES.sm,
  color: BRAND.textMuted,
  marginBottom: 6,
},

dropdownWrapper: {
  borderRadius: 14,
  borderWidth: 1,
  borderColor: '#e5e7eb',
  paddingVertical: 16,
  paddingHorizontal: 14,
  backgroundColor: '#fafafa',
  marginBottom: SPACING.md,
},

dropdownValue: {
  fontSize: FONT_SIZES.md,
  color: BRAND.textPrimary,
  fontWeight: '600',
},

placeholderText: {
  color: '#9ca3af',
  fontWeight: '500',
},


selectField: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  borderWidth: 1,
  borderColor: '#e5e7eb',
  borderRadius: 14,
  paddingVertical: 16,
  paddingHorizontal: 14,
  backgroundColor: '#fafafa',
},

selectValue: {
  fontSize: FONT_SIZES.md,
  fontWeight: '600',
  color: BRAND.textPrimary,
},

caret: {
  fontSize: 18,
  color: BRAND.textMuted,
},

inputLabel: {
  fontSize: FONT_SIZES.sm,
  color: BRAND.textMuted,
  marginBottom: 6,
},

selectContainer: {
  borderWidth: 1,
  borderColor: '#e5e7eb',
  borderRadius: 14,
  paddingVertical: 16,
  paddingHorizontal: 14,
  backgroundColor: '#ffffff',
},

selectText: {
  fontSize: FONT_SIZES.md,
  fontWeight: '500',
  color: BRAND.textPrimary,
},

selectPlaceholder: {
  color: '#9ca3af',
},

selectOptionSelected: {
  backgroundColor: '#f4f6ff',
  fontWeight: '700',
},


inputErrorBorder: {
  borderColor: '#ef4444',
},

inputErrorText: {
  marginTop: 6,
  fontSize: FONT_SIZES.sm,
  color: '#ef4444',
},

selectDropdown: {
  marginTop: -20,
  marginBottom: 15,
  borderWidth: 1,
  borderColor: '#e5e7eb',
  borderRadius: 14,
  backgroundColor: '#ffffff',
  overflow: 'hidden',
},

selectOption: {
  paddingVertical: 16,
  paddingHorizontal: 14,
  borderBottomWidth: 1,
  borderBottomColor: '#f1f5f9',
  fontSize: FONT_SIZES.md,
  fontWeight: '500',
  color: BRAND.textPrimary,
},

selectSub: {
  fontSize: FONT_SIZES.sm,
  color: BRAND.textMuted,
},
sheetBackdrop: {
  flex: 1,
  backgroundColor: 'rgba(0,0,0,0.35)',
},

sheetContainer: {
  position: 'absolute',
  bottom: 0,
  width: '100%',
  maxHeight: '70%',
  backgroundColor: '#ffffff',
  borderTopLeftRadius: 28,
  borderTopRightRadius: 28,
  padding: SPACING.xl,
  shadowColor: '#000',
  shadowOpacity: 0.25,
  shadowRadius: 30,
  shadowOffset: { width: 0, height: -10 },
  elevation: 20,
},

sheetHandle: {
  width: 44,
  height: 5,
  borderRadius: 3,
  backgroundColor: '#d1d5db',
  alignSelf: 'center',
  marginBottom: SPACING.md,
},

sheetTitle: {
  fontSize: FONT_SIZES.lg,
  fontWeight: '800',
  color: BRAND.color2,
  textAlign: 'center',
  marginBottom: SPACING.lg,
},

sheetOption: {
  paddingVertical: 18,
  borderBottomWidth: 1,
  borderBottomColor: '#f1f5f9',
},

sheetUid: {
  fontSize: FONT_SIZES.md,
  fontWeight: '700',
  color: BRAND.textPrimary,
},

sheetName: {
  fontSize: FONT_SIZES.sm,
  color: BRAND.textMuted,
  marginTop: 2,
},


});

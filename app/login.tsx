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

  const [identifier, setIdentifier] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'identifier' | 'otp'>('identifier');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({ identifier: '', otp: '' });
  const [userMobile, setUserMobile] = useState('');

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
    setErrors({ identifier: '', otp: '' });

    if (!identifier.trim()) {
      setErrors({ identifier: 'Please enter Mobile Number/Hospital Id', otp: '' });
      return;
    }

    if (identifier.length < 4) {
      setErrors({ identifier: 'Please enter a valid Mobile Number/Hospital Id', otp: '' });
      return;
    }

    setLoading(true);
    const success = await sendOTP(identifier);
    setLoading(false);

    if (success === 'true') {
      setStep('otp');
      let mobileValue = await AsyncStorage.getItem('mobile')
      console.log("mobileValue",mobileValue)
      setUserMobile(mobileValue || "");
    } else {
      showToast(success, 'error');
    }
  };

  const handleVerifyOtp = async () => {
    setErrors({ identifier: '', otp: '' });

    if (!otp.trim()) {
      setErrors({ identifier: '', otp: 'Please enter OTP' });
      return;
    }

    if (otp.length !== 4) {
      setErrors({ identifier: '', otp: 'OTP must be 4 digits' });
      return;
    }

    setLoading(true);
    const success = await login(userMobile, otp);
    setLoading(false);

    if (success) {
      router.replace('/(tabs)');
    } else {
      showToast('Invalid OTP or credentials', 'error');
    }
  };

  const handleBack = () => {
    setOtp('');
    setErrors({ identifier: '', otp: '' });
    setStep('identifier');
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
});

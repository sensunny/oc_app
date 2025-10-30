import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  Animated,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { COLORS, SPACING, FONT_SIZES, LOGO_URL } from '../constants/theme';

const { width } = Dimensions.get('window');

// Brand palette
const BRAND = {
  color1: '#20606b', // teal-blue
  color2: '#262f82', // deep blue
  color3: '#9966ff', // violet
  color4: '#cc66ff', // light purple
  color5: '#dfedf6', // soft pale
};

export default function LoginScreen() {
  const router = useRouter();
  const { login, sendOTP } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'identifier' | 'otp'>('identifier');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({ identifier: '', otp: '' });

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  }, [step]);

  const handleSendOtp = async () => {
    setErrors({ identifier: '', otp: '' });
    if (!identifier.trim()) {
      setErrors({ identifier: 'Please enter Mobile Number', otp: '' });
      return;
    }
    if (identifier.length < 8) {
      setErrors({ identifier: 'Please enter a valid Mobile Number', otp: '' });
      return;
    }
    const success = await sendOTP(identifier);
    if (success && success === 'true') {
      fadeAnim.setValue(0);
      slideAnim.setValue(50);
      setStep('otp');
    } else {
      Alert.alert(success);
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
    const success = await login(identifier, otp);
    setLoading(false);
    if (success) {
      router.replace('/(tabs)');
    } else {
      Alert.alert('Login Failed', 'Invalid credentials. Please try again.');
    }
  };

  const handleBack = () => {
    fadeAnim.setValue(0);
    slideAnim.setValue(50);
    setStep('identifier');
    setOtp('');
    setErrors({ identifier: '', otp: '' });
  };

  return (
    <View style={styles.container}>
      {/* 3D gradient background */}
      <LinearGradient
        colors={[BRAND.color1, BRAND.color2, BRAND.color3]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Floating color circles for 3D feel */}
      <View style={styles.circleContainer}>
        <View style={[styles.circle, styles.circle1]} />
        <View style={[styles.circle, styles.circle2]} />
        <View style={[styles.circle, styles.circle3]} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View
            style={[
              styles.content,
              { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
            ]}
          >
            {/* Logo */}
            <View style={styles.logoContainer}>
              <Image source={{ uri: LOGO_URL }} style={styles.logo} resizeMode="contain" />
            </View>

            {/* Glassmorphic card */}
            <View style={styles.cardContainer}>
              <BlurView intensity={50} tint="light" style={styles.blurCard}>
                <View style={styles.card}>
                  <Text style={styles.title}>
                    {step === 'identifier' ? 'Welcome Back' : 'Verify OTP'}
                  </Text>
                  <Text style={styles.subtitle}>
                    {step === 'identifier'
                      ? 'Sign in to access your medical records with OnCare'
                      : `We sent a code to ${identifier}`}
                  </Text>

                  <View style={styles.formContainer}>
                    {step === 'identifier' ? (
                      <>
                        <Input
                          label="Mobile Number"
                          value={identifier}
                          onChangeText={setIdentifier}
                          placeholder="Enter your mobile number"
                          keyboardType="phone-pad"
                          error={errors.identifier}
                        />
                        <LinearGradient
                          colors={[BRAND.color1, BRAND.color2]}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          style={styles.gradientButton}
                        >
                          <Button title="Continue" onPress={handleSendOtp} transparent />
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
                          colors={[BRAND.color1, BRAND.color2]}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          style={styles.gradientButton}
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
                          onPress={handleBack}
                          variant="outline"
                          style={styles.backButton}
                        />
                      </>
                    )}
                  </View>
                </View>
              </BlurView>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  // Depth circles
  circleContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  circle: {
    position: 'absolute',
    borderRadius: 1000,
    opacity: 0.25,
  },
  circle1: {
    width: 400,
    height: 400,
    backgroundColor: '#9966ff',
    top: -100,
    right: -120,
  },
  circle2: {
    width: 300,
    height: 300,
    backgroundColor: '#cc66ff',
    bottom: -80,
    left: -80,
  },
  circle3: {
    width: 220,
    height: 220,
    backgroundColor: '#dfedf6',
    top: '40%',
    right: -100,
  },

  keyboardView: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: SPACING.lg,
  },
  content: { flex: 1, justifyContent: 'center' },

  logoContainer: {
    alignItems: 'center',
    marginBottom: SPACING.xxl,
  },
  logo: {
    width: 160,
    height: 60,
  },

  // Glass card
  cardContainer: {
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
    backgroundColor:"#fff"
  },
  blurCard: {
    borderRadius: 28,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  card: {
    borderRadius: 28,
    padding: SPACING.xl,
  },

  title: {
    fontSize: FONT_SIZES.xxxl,
    fontWeight: '800',
    color: BRAND.color2,
    marginBottom: SPACING.sm,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: FONT_SIZES.md,
    color: BRAND.color2,
    marginBottom: SPACING.xl,
    lineHeight: 22,
  },

  formContainer: { marginBottom: SPACING.lg },
  hospitalId:{
    color: BRAND.color2
  },

  gradientButton: {
    borderRadius: 14,
    padding: 2,
    marginTop: SPACING.md,
    elevation: 8,
  },
  backButton: {
    marginTop: SPACING.md,
    color: "#ffffff"
  },
});

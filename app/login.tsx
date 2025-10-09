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

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();
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

  const handleSendOtp = () => {
    setErrors({ identifier: '', otp: '' });

    if (!identifier.trim()) {
      setErrors({ identifier: 'Please enter Hospital ID or Mobile Number', otp: '' });
      return;
    }

    if (identifier.length < 8) {
      setErrors({ identifier: 'Please enter a valid Hospital ID or Mobile Number', otp: '' });
      return;
    }

    fadeAnim.setValue(0);
    slideAnim.setValue(50);
    setStep('otp');
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
      <LinearGradient
        colors={['#20606B', '#262F82']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

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
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <View style={styles.logoContainer}>
              <View style={styles.logoWrapper}>
                <Image source={{ uri: LOGO_URL }} style={styles.logo} resizeMode="contain" />
              </View>
            </View>

            <View style={styles.cardContainer}>
              <BlurView intensity={20} tint="light" style={styles.blurCard}>
                <View style={styles.card}>
                  <Text style={styles.title}>
                    {step === 'identifier' ? 'Welcome Back' : 'Verify OTP'}
                  </Text>
                  <Text style={styles.subtitle}>
                    {step === 'identifier'
                      ? 'Sign in to access your medical records'
                      : `We sent a code to ${identifier}`}
                  </Text>

                  <View style={styles.formContainer}>
                    {step === 'identifier' ? (
                      <>
                        <Input
                          label="Hospital ID / Mobile Number"
                          value={identifier}
                          onChangeText={setIdentifier}
                          placeholder="Enter your ID or mobile"
                          keyboardType="phone-pad"
                          error={errors.identifier}
                          autoFocus
                        />
                        <Button title="Continue" onPress={handleSendOtp} />
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
                          autoFocus
                        />
                        <Button title="Verify & Login" onPress={handleVerifyOtp} loading={loading} />
                        <Button
                          title="Change Number"
                          onPress={handleBack}
                          variant="outline"
                          style={styles.backButton}
                        />
                      </>
                    )}
                  </View>

                  <View style={styles.testInfo}>
                    <Text style={styles.testInfoTitle}>Test Credentials</Text>
                    <Text style={styles.testInfoText}>ID: 8888888888 • OTP: 8888</Text>
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
  container: {
    flex: 1,
  },
  circleContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  circle: {
    position: 'absolute',
    borderRadius: 1000,
    opacity: 0.1,
  },
  circle1: {
    width: 400,
    height: 400,
    backgroundColor: '#9966ff',
    top: -100,
    right: -100,
  },
  circle2: {
    width: 300,
    height: 300,
    backgroundColor: '#cc66ff',
    bottom: -50,
    left: -50,
  },
  circle3: {
    width: 200,
    height: 200,
    backgroundColor: '#dfedf6',
    top: '40%',
    right: -100,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: SPACING.lg,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: SPACING.xxl,
  },
  logoWrapper: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: SPACING.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  logo: {
    width: 160,
    height: 60,
  },
  cardContainer: {
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  blurCard: {
    borderRadius: 28,
    overflow: 'hidden',
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 28,
    padding: SPACING.xl,
  },
  title: {
    fontSize: FONT_SIZES.xxxl,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xl,
    lineHeight: 22,
  },
  formContainer: {
    marginBottom: SPACING.lg,
  },
  backButton: {
    marginTop: SPACING.md,
  },
  testInfo: {
    marginTop: SPACING.lg,
    paddingTop: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    alignItems: 'center',
  },
  testInfoTitle: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '700',
    color: COLORS.primary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: SPACING.xs,
  },
  testInfoText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
});

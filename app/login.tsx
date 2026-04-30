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
  Animated,
  Keyboard,
  Modal,
  TextInput,
} from 'react-native';

import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { COLORS, LOGO_URL } from '../constants/theme';
import { PremiumAlert } from '../components/PremiumAlert';
import { PulseGraphic, MedicalCrossGraphic, FloatingDots, ShieldGraphic, DNAHelixGraphic, StethoscopeGraphic, MoleculeGraphic, CapsuleGraphic } from '../components/LoginGraphics';

const { height: SCREEN_H } = Dimensions.get('window');

if (Platform.OS === 'android') {
  UIManager.setLayoutAnimationEnabledExperimental?.(true);
}

export default function LoginScreen() {
  const router = useRouter();
  const { login, sendOTP } = useAuth();

  const [identifier, setIdentifier] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'identifier' | 'otp'>('identifier');
  const [loginMethod, setLoginMethod] = useState<'mobile' | 'hospitalUid'>('mobile');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({ identifier: '', otp: '', hospitalUid: '' });
  const [userMobile, setUserMobile] = useState('');
  const [hospitalUids, setHospitalUids] = useState<any[]>([]);
  const [selectedHospitalUid, setSelectedHospitalUid] = useState('');
  const [isUidOpen, setIsUidOpen] = useState(false);
  const [alert, setAlert] = useState({ visible: false, title: '', message: '' });
  const [callbackName, setCallbackName] = useState('');
  const [isCallback, setIsCallback] = useState(false);
  const [otpInfoMessage, setOtpInfoMessage] = useState('');
  const [callbackPopup, setCallbackPopup] = useState({ visible: false, message: '' });

  const dropdownAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    LayoutAnimation.configureNext(
      LayoutAnimation.create(220, LayoutAnimation.Types.easeInEaseOut, LayoutAnimation.Properties.opacity)
    );
  }, [step]);

  /* ── Handlers ── */

  const handleSendOtp = async () => {
    Keyboard.dismiss();
    setErrors({ identifier: '', otp: '', hospitalUid: '' });

    if (!identifier.trim()) {
      const msg = loginMethod === 'mobile' ? 'Please enter Mobile Number' : 'Please enter Hospital UID';
      setErrors({ identifier: msg, otp: '', hospitalUid: '' });
      return;
    }

    setLoading(true);
    const response: any = await sendOTP(identifier, callbackName);
    setLoading(false);

    if (response?.code === 1 || response?.data?.code === 1) {
      setIsCallback(false);
      setStep('otp');
      setUserMobile(response.data.mobile);
      setHospitalUids(response.data.hospitalUids || []);
      setOtpInfoMessage(response?.message || response?.data?.message || '');
      if (response.data.hospitalUids?.length === 1) {
        setSelectedHospitalUid(response.data.hospitalUids[0].hospitalUid);
      }
    }

    if (response?.code === 3) {
      setCallbackPopup({ visible: true, message: response?.message || 'No details found for this number.' });
      return;
    }

    if (response?.code === 4) {
      setIsCallback(false);
      setCallbackName('');
      setIdentifier('');
      setAlert({ visible: true, title: 'Success', message: response?.message || 'Our team will contact you shortly' });
      return;
    }

    if (!response || response?.code !== 1) {
      setAlert({ visible: true, title: 'Error', message: response?.message || 'Something went wrong' });
    }
  };

  const handleCallbackRequest = async (name: string) => {
    if (!name.trim()) return;
    setCallbackPopup({ ...callbackPopup, visible: false });
    setCallbackName(name);
    setLoading(true);
    const response: any = await sendOTP(identifier, name);
    setLoading(false);

    if (response?.code === 4) {
      setCallbackName('');
      setIdentifier('');
      setAlert({ visible: true, title: 'Success', message: response?.message || 'Our team will contact you shortly' });
      return;
    }
    if (response?.code === 1 || response?.data?.code === 1) {
      setStep('otp');
      setUserMobile(response.data.mobile);
      setHospitalUids(response.data.hospitalUids || []);
      setOtpInfoMessage(response?.message || response?.data?.message || '');
      if (response.data.hospitalUids?.length === 1) {
        setSelectedHospitalUid(response.data.hospitalUids[0].hospitalUid);
      }
      return;
    }
    setAlert({ visible: true, title: 'Info', message: response?.message || 'Something went wrong' });
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
    if (hospitalUids.length > 1 && !selectedHospitalUid) {
      setErrors({ identifier: '', otp: '', hospitalUid: 'Please select Hospital ID' });
      return;
    }

    setLoading(true);
    const success = await login(userMobile, otp, selectedHospitalUid);
    setLoading(false);

    if (success) {
      router.replace('/(tabs)');
    } else {
      setAlert({ visible: true, title: 'Error', message: 'Invalid OTP or credentials' });
    }
  };

  const handleBack = () => {
    setOtp('');
    setErrors({ identifier: '', otp: '', hospitalUid: '' });
    setOtpInfoMessage('');
    setStep('identifier');
  };

  const toggleUidDropdown = () => {
    const toValue = isUidOpen ? 0 : 1;
    setIsUidOpen(!isUidOpen);
    Animated.timing(dropdownAnim, { toValue, duration: 220, useNativeDriver: false }).start();
  };

  /* ── Render ── */

  return (
    <View style={styles.root}>
      <PremiumAlert
        visible={alert.visible}
        title={alert.title}
        message={alert.message}
        onClose={() => setAlert({ visible: false, title: '', message: '' })}
      />

      {/* Background gradient — matched to home screen */}
      <LinearGradient
        colors={[COLORS.primary, COLORS.secondary, COLORS.accent1]}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Decorative layer: blobs + SVG graphics */}
      <View style={styles.decor} pointerEvents="none">
        <View style={styles.blob1} />
        <View style={styles.blob2} />
        <View style={styles.blob3} />
        {/* Heartbeat pulse — top right */}
        <View style={styles.pulseWrap}>
          <PulseGraphic size={140} />
        </View>
        {/* Medical cross — bottom left */}
        <View style={styles.crossWrap}>
          <MedicalCrossGraphic size={70} />
        </View>
        {/* DNA Helix — left side */}
        <View style={styles.dnaWrap}>
          <DNAHelixGraphic size={160} />
        </View>
        {/* Stethoscope — bottom right */}
        <View style={styles.stethWrap}>
          <StethoscopeGraphic size={90} />
        </View>
        {/* Molecule — top left */}
        <View style={styles.moleculeWrap}>
          <MoleculeGraphic size={55} />
        </View>
        {/* Capsule — mid right */}
        <View style={styles.capsuleWrap}>
          <CapsuleGraphic size={45} />
        </View>
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
          {/* Logo */}
          <View style={styles.logoWrap}>
            <Image source={{ uri: LOGO_URL }} style={styles.logo} />
          </View>

          {/* Floating dots between logo and card */}
          <View style={styles.dotsWrap}>
            <FloatingDots width={220} height={20} />
          </View>

          {/* Card */}
          <View style={styles.card}>
            {/* Thin accent bar at top */}
            <View style={styles.accentBar} />

            <View style={styles.titleRow}>
              <Text style={styles.title}>
                {step === 'identifier' ? 'Welcome Back' : 'Verify OTP'}
              </Text>
              <View style={styles.shieldWrap}>
                <ShieldGraphic size={18} />
              </View>
            </View>

            <Text style={styles.subtitle}>
              {step === 'identifier'
                ? 'Access your Oncare medical records securely'
                : `Enter the code sent to ${userMobile}`}
            </Text>

            {/* OTP info message */}
            {step === 'otp' && otpInfoMessage ? (
              <View style={styles.infoMessageWrap}>
                <Text style={styles.infoMessageText}>{otpInfoMessage}</Text>
              </View>
            ) : null}

            {/* Divider */}
            <View style={styles.divider} />

            {step === 'identifier' ? (
              <>
                    {/* Tab switcher */}
                    <View style={[styles.tabRow, loading && { opacity: 0.5 }]}>
                      <Pressable
                        style={[styles.tab, loginMethod === 'mobile' && styles.tabActive]}
                        onPress={() => { setLoginMethod('mobile'); setIdentifier(''); setErrors({ ...errors, identifier: '' }); }}
                        disabled={loading}
                      >
                        <Text style={[styles.tabLabel, loginMethod === 'mobile' && styles.tabLabelActive]}>
                          Mobile Number
                        </Text>
                      </Pressable>
                      <Pressable
                        style={[styles.tab, loginMethod === 'hospitalUid' && styles.tabActive]}
                        onPress={() => { setLoginMethod('hospitalUid'); setIdentifier(''); setErrors({ ...errors, identifier: '' }); }}
                        disabled={loading}
                      >
                        <Text style={[styles.tabLabel, loginMethod === 'hospitalUid' && styles.tabLabelActive]}>
                          Hospital UID
                        </Text>
                      </Pressable>
                    </View>

                    <Input
                      label={loginMethod === 'mobile' ? 'Mobile Number' : 'Hospital UID'}
                      value={identifier}
                      onChangeText={setIdentifier}
                      placeholder={loginMethod === 'mobile' ? 'Enter Mobile Number' : 'Enter Hospital UID'}
                      keyboardType="phone-pad"
                      error={errors.identifier}
                    />

                    <LinearGradient
                      colors={[COLORS.primary, COLORS.accent1]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.ctaGradient}
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
                {/* Hospital UID selector */}
                {hospitalUids.length > 1 ? (
                  <>
                    <Pressable onPress={toggleUidDropdown}>
                      <View pointerEvents="none">
                        <Input
                          label="Hospital ID"
                          value={selectedHospitalUid || 'Select Hospital ID'}
                          editable={false}
                          error={errors.hospitalUid}
                        />
                      </View>
                    </Pressable>

                    <Animated.View
                      style={[
                        styles.dropdown,
                        {
                          maxHeight: dropdownAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 200] }),
                          opacity: dropdownAnim,
                        },
                      ]}
                    >
                      <ScrollView nestedScrollEnabled>
                        {hospitalUids.map((item) => (
                          <Pressable
                            key={item.hospitalUid}
                            onPress={() => {
                              setSelectedHospitalUid(item.hospitalUid);
                              setErrors({ ...errors, hospitalUid: '' });
                              toggleUidDropdown();
                            }}
                          >
                            <View style={styles.dropdownItem}>
                              <Text style={styles.dropdownUid}>{item.hospitalUid}</Text>
                              <Text style={styles.dropdownName}>{item.name}</Text>
                            </View>
                          </Pressable>
                        ))}
                      </ScrollView>
                    </Animated.View>
                  </>
                ) : (
                  <Input label="Hospital ID" value={selectedHospitalUid} editable={false} />
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
                  colors={[COLORS.primary, COLORS.accent1]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.ctaGradient}
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
                  disabled={loading}
                />
              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Callback Popup */}
      <CallbackPopup
        visible={callbackPopup.visible}
        message={callbackPopup.message}
        loading={loading}
        onSubmit={handleCallbackRequest}
        onClose={() => setCallbackPopup({ visible: false, message: '' })}
      />
    </View>
  );
}

/* ================= CALLBACK POPUP ================= */

const CallbackPopup = ({ visible, message, loading, onSubmit, onClose }: {
  visible: boolean;
  message: string;
  loading: boolean;
  onSubmit: (name: string) => void;
  onClose: () => void;
}) => {
  const [name, setName] = React.useState('');

  React.useEffect(() => {
    if (visible) setName('');
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={cbStyles.overlay}>
        <View style={cbStyles.card}>
          {/* Icon */}
          <View style={cbStyles.iconWrap}>
            <View style={cbStyles.iconInner}>
              <Text style={{ fontSize: 20 }}>📞</Text>
            </View>
          </View>

          {/* Message */}
          <Text style={cbStyles.title}>We couldn't find you</Text>
          <Text style={cbStyles.message}>{message}</Text>

          {/* Name input */}
          <Text style={cbStyles.label}>What should we call you?</Text>
          <TextInput
            style={cbStyles.input}
            value={name}
            onChangeText={setName}
            placeholder="Enter your name"
            placeholderTextColor={COLORS.gray}
          />

          {/* Submit */}
          <LinearGradient
            colors={[COLORS.primary, COLORS.accent1]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={cbStyles.btnGradient}
          >
            <Pressable
              style={cbStyles.btn}
              onPress={() => onSubmit(name)}
              disabled={loading || !name.trim()}
            >
              <Text style={cbStyles.btnText}>
                {loading ? 'Requesting...' : 'Request a Callback'}
              </Text>
            </Pressable>
          </LinearGradient>

          {/* Cancel */}
          <Pressable onPress={onClose} style={cbStyles.cancelWrap}>
            <Text style={cbStyles.cancelText}>Cancel</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
};

const cbStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    width: '88%',
    backgroundColor: COLORS.white,
    borderRadius: 22,
    padding: 26,
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.1,
    shadowRadius: 30,
    elevation: 12,
    borderWidth: 1,
    borderColor: 'rgba(238,240,248,0.9)',
  },
  iconWrap: {
    marginBottom: 16,
  },
  iconInner: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.primary + '10',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 6,
  },
  message: {
    fontSize: 13,
    color: COLORS.gray,
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  label: {
    alignSelf: 'flex-start',
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
    marginBottom: 6,
    letterSpacing: 0.2,
  },
  input: {
    width: '100%',
    backgroundColor: '#f4f5f9',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 13,
    fontSize: 15,
    color: COLORS.primary,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#f0f1f6',
  },
  btnGradient: {
    width: '100%',
    borderRadius: 14,
  },
  btn: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  btnText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '700',
  },
  cancelWrap: {
    marginTop: 14,
    paddingVertical: 6,
  },
  cancelText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.gray,
  },
});

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },

  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 28,
    paddingVertical: 40,
  },

  /* Decorative blobs */
  decor: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  blob1: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: COLORS.accent1,
    opacity: 0.08,
    top: -60,
    right: -50,
  },
  blob2: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: COLORS.white,
    opacity: 0.06,
    bottom: -40,
    left: -50,
  },
  blob3: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.accent2,
    opacity: 0.06,
    top: SCREEN_H * 0.35,
    left: -30,
  },
  pulseWrap: {
    position: 'absolute',
    top: 60,
    right: 10,
    opacity: 0.9,
  },
  crossWrap: {
    position: 'absolute',
    bottom: 80,
    left: 15,
    opacity: 0.9,
  },
  dnaWrap: {
    position: 'absolute',
    left: -5,
    top: SCREEN_H * 0.15,
    opacity: 0.7,
  },
  stethWrap: {
    position: 'absolute',
    bottom: 40,
    right: 10,
    opacity: 0.6,
  },
  moleculeWrap: {
    position: 'absolute',
    top: 30,
    left: 20,
    opacity: 0.7,
  },
  capsuleWrap: {
    position: 'absolute',
    right: 30,
    top: SCREEN_H * 0.42,
    opacity: 0.6,
    transform: [{ rotate: '-20deg' }],
  },

  /* Logo */
  logoWrap: {
    alignItems: 'center',
    marginBottom: 14,
  },
  logo: {
    width: 190,
    height: 65,
    resizeMode: 'contain',
  },
  dotsWrap: {
    alignItems: 'center',
    marginBottom: 16,
  },

  /* Card — premium glassy shadow style matching home screen */
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    paddingTop: 28,
    paddingBottom: 24,
    paddingHorizontal: 22,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(238,240,248,0.9)',
    overflow: 'hidden',
  },

  accentBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: COLORS.accent1,
    opacity: 0.6,
  },

  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },

  shieldWrap: {
    marginLeft: 6,
    marginBottom: -1,
  },

  title: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.secondary,
    letterSpacing: -0.3,
  },

  subtitle: {
    fontSize: 14,
    color: COLORS.gray,
    lineHeight: 20,
    marginBottom: 6,
  },

  divider: {
    height: 1,
    backgroundColor: '#f0f1f6',
    marginVertical: 16,
  },

  /* OTP info message */
  infoMessageWrap: {
    backgroundColor: COLORS.success + '0A',
    borderWidth: 1,
    borderColor: COLORS.success + '20',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginTop: 8,
  },
  infoMessageText: {
    fontSize: 12,
    color: COLORS.success,
    fontWeight: '600',
    lineHeight: 17,
  },

  /* Tabs */
  tabRow: {
    flexDirection: 'row',
    backgroundColor: '#f4f5f9',
    borderRadius: 10,
    padding: 3,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: COLORS.white,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.gray,
  },
  tabLabelActive: {
    color: COLORS.primary,
    fontWeight: '700',
  },

  /* CTA gradient wrapper */
  ctaGradient: {
    borderRadius: 12,
    marginTop: 6,
  },

  backBtn: {
    marginTop: 10,
  },

  /* Dropdown */
  dropdown: {
    marginTop: -6,
    marginBottom: 10,
    backgroundColor: COLORS.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(238,240,248,0.9)',
    overflow: 'hidden',
    shadowColor: COLORS.primary,
    shadowOpacity: 0.06,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  dropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f1f6',
  },
  dropdownUid: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
  },
  dropdownName: {
    fontSize: 11,
    color: COLORS.gray,
    marginTop: 1,
  },
});

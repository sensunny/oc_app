import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Animated,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ArrowLeft,
  ChevronDown,
  X,
  Mail,
  CheckCircle,
} from 'lucide-react-native';
import { COLORS } from '@/constants/theme';
import { fetchWrapper } from '@/utils/fetchWrapper';

export function FAQView({ data, onClose }: any) {
  const [openGroup, setOpenGroup] = useState<number | null>(0);
  const [openIndex, setOpenIndex] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

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

  const isValidEmail = (val: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim());

  const anim = useRef(new Animated.Value(0)).current;

  const openForm = () => {
    setShowForm(true);
    setIsSuccess(false);
    Animated.timing(anim, {
      toValue: 1,
      duration: 260,
      useNativeDriver: true,
    }).start();
  };

  const closeForm = () => {
    Animated.timing(anim, {
      toValue: 0,
      duration: 220,
      useNativeDriver: true,
    }).start(() => {
      setShowForm(false);
      setEmail('');
      setEmailError('');
      setIsSuccess(false);
    });
  };

  return (
    <View style={{ flex: 1 }}>
      <LinearGradient
        colors={[COLORS.primary, COLORS.secondary]}
        style={StyleSheet.absoluteFillObject}
      />

      <View style={styles.header}>
        <Pressable onPress={onClose} style={styles.backBtn}>
          <ArrowLeft color={COLORS.white} size={20} />
        </Pressable>
        <Text style={styles.heading}>{data.heading}</Text>
        <Text style={styles.subheading}>{data.subheading}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {data.groups.map((group: any, gi: number) => (
          <View key={gi} style={styles.groupCard}>
            <Pressable
              onPress={() => {
                setOpenGroup(openGroup === gi ? null : gi);
                setOpenIndex(null);
              }}
              style={styles.groupHeader}
            >
              <Text style={styles.groupTitle}>{group.title}</Text>
              <ChevronDown
                size={18}
                color={COLORS.primary}
                style={{
                  transform: [{ rotate: openGroup === gi ? '180deg' : '0deg' }],
                }}
              />
            </Pressable>

            {openGroup === gi &&
              group.items.map((item: any, i: number) => {
                const key = `${gi}-${i}`;
                return (
                  <View key={key} style={styles.card}>
                    <Pressable
                      onPress={() =>
                        setOpenIndex(openIndex === key ? null : key)
                      }
                    >
                      <View style={styles.row}>
                        <Text style={styles.q}>{item.q}</Text>
                        <ChevronDown size={16} color={COLORS.primary} />
                      </View>
                    </Pressable>

                    {openIndex === key && (
                      <Text style={styles.a}>{item.a}</Text>
                    )}
                  </View>
                );
              })}
          </View>
        ))}
      </ScrollView>

      {/* Floating CTA */}
      <Pressable onPress={openForm} style={styles.fab}>
        <Mail size={16} color={COLORS.white} />
        <Text style={styles.fabText}>{data.ctaText}</Text>
      </Pressable>

      {/* Bottom Sheet Form */}
      {showForm && (
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
          style={StyleSheet.absoluteFill}
        >
          <Pressable style={styles.formBackdrop} onPress={closeForm} />

          <View style={{ flex: 1, justifyContent: 'flex-end' }}>
            <Animated.View
              style={[
                styles.form,
                {
                  transform: [
                    {
                      translateY: anim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [360, 0],
                      }),
                    },
                  ],
                },
              ]}
            >
              {!isSuccess ? (
                <>
                  <View style={styles.formHeader}>
                    <View>
                      <Text style={styles.formTitle}>{data.formTitle}</Text>
                      <Text style={styles.formSub}>{data.formSubtitle}</Text>
                    </View>

                    <Pressable onPress={closeForm}>
                      <X size={20} color={COLORS.black} />
                    </Pressable>
                  </View>

                  <TextInput
                    value={email}
                    onChangeText={(v) => {
                      setEmail(v);
                      if (emailError) setEmailError('');
                    }}
                    placeholder="Enter your email"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    style={[
                      styles.input,
                      emailError && { borderColor: COLORS.error },
                    ]}
                  />

                  {emailError ? (
                    <Text style={styles.inlineError}>{emailError}</Text>
                  ) : null}

                  <Pressable
                    style={[
                      styles.submitBtn,
                      !isValidEmail(email) && { opacity: 0.6 },
                    ]}
                    onPress={async () => {
                      const trimmed = email.trim();

                      if (!trimmed) {
                        setEmailError('Email is required');
                        return;
                      }

                      if (!isValidEmail(trimmed)) {
                        setEmailError('Please enter a valid email address');
                        return;
                      }

                      try {
                        await retry(() =>
                          post('askUsEmailQuery', { email: trimmed })
                        );

                        setIsSuccess(true);
                        setEmail('');
                        setEmailError('');
                      } catch {
                        setEmailError('Something went wrong. Please try again.');
                      }
                    }}
                  >
                    <Text style={styles.submitText}>Submit</Text>
                  </Pressable>
                </>
              ) : (
                <View style={styles.successWrap}>
                  <CheckCircle size={56} color={COLORS.success} />
                  <Text style={styles.successTitle}>Request Received</Text>
                  <Text style={styles.successSub}>
                    Our support team will reach out to you shortly.
                  </Text>

                  <Pressable style={styles.successBtn} onPress={closeForm}>
                    <Text style={styles.successBtnText}>Done</Text>
                  </Pressable>
                </View>
              )}
            </Animated.View>
          </View>
        </KeyboardAvoidingView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  backBtn: {
    marginBottom: 16,
  },
  heading: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.white,
  },
  subheading: {
    color: 'rgba(255,255,255,0.8)',
    marginTop: 6,
  },
  content: {
    padding: 20,
    paddingBottom: 140,
  },

  groupCard: {
    marginBottom: 20,
    borderRadius: 20,
    padding: 14,
    backgroundColor: COLORS.white,
    shadowColor: COLORS.black,
    shadowOpacity: 0.12,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },

  groupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 6,
  },

  groupTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: 0.4,
  },

  card: {
    borderRadius: 14,
    padding: 14,
    marginTop: 10,
    // borderWidth: 1,
    // borderColor: 'rgba(32, 32, 107, 0.18)',
    backgroundColor: COLORS.white,
  },

  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  q: {
    fontWeight: '700',
    color: COLORS.primary,
    flex: 1,
    marginRight: 8,
  },

  a: {
    marginTop: 10,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },

  fab: {
    position: 'absolute',
    right: 20,
    bottom: 30,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 28,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    shadowColor: COLORS.black,
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 10,
  },

  fabText: {
    color: COLORS.white,
    fontWeight: '700',
  },

  formBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },

  form: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    shadowColor: COLORS.black,
    shadowOpacity: 0.25,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: -8 },
    elevation: 20,
  },

  formHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },

  formTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },

  formSub: {
    color: COLORS.textSecondary,
    marginTop: 4,
  },

  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginTop: 8,
    marginBottom: 16,
    fontSize: 14,
  },

  inlineError: {
    color: COLORS.error,
    fontSize: 12,
    marginTop: -8,
    marginBottom: 12,
  },

  submitBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },

  submitText: {
    color: COLORS.white,
    fontWeight: '700',
  },

  successWrap: {
    alignItems: 'center',
    paddingVertical: 30,
  },

  successTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginTop: 16,
  },

  successSub: {
    color: COLORS.textSecondary,
    marginTop: 6,
    textAlign: 'center',
    lineHeight: 20,
  },

  successBtn: {
    marginTop: 24,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 14,
  },

  successBtnText: {
    color: COLORS.white,
    fontWeight: '700',
  },
});

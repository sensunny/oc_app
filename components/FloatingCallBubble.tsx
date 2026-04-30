import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  PanResponder,
  Dimensions,
  Linking,
  Modal,
} from 'react-native';
import { Phone, Building2, Home } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../constants/theme';
import { useAuth } from '../contexts/AuthContext';
import { appointmentApi } from '../services/api';

const SCREEN = Dimensions.get('window');
const BUBBLE_SIZE = 56;
const EXPANDED_W = 165;
const EXPANDED_H = 48;
const MARGIN = 10;
const TOP_SAFE = 50;
const BOTTOM_SAFE = 105;

export const FloatingCallBubble = () => {
  const { patient } = useAuth();
  const centers = patient?.otherData?.centers || [];
  const defaultCenter = centers.find((c: any) => c.default === true);
  const defaultNumber = defaultCenter?.number || patient?.otherData?.oncare_number;

  const [expanded, setExpanded] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [calling, setCalling] = useState(false);

  const pan = useRef(
    new Animated.ValueXY({
      x: SCREEN.width - BUBBLE_SIZE - MARGIN,
      y: SCREEN.height - BOTTOM_SAFE - BUBBLE_SIZE - MARGIN,
    })
  ).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const didDrag = useRef(false);

  const clamp = (x: number, y: number, w: number, h: number) => ({
    x: Math.max(MARGIN, Math.min(x, SCREEN.width - w - MARGIN)),
    y: Math.max(TOP_SAFE, Math.min(y, SCREEN.height - BOTTOM_SAFE - h)),
  });

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 3 || Math.abs(g.dy) > 3,
      onPanResponderGrant: () => {
        didDrag.current = false;
        pan.setOffset({ x: (pan.x as any)._value, y: (pan.y as any)._value });
        pan.setValue({ x: 0, y: 0 });
        Animated.spring(scaleAnim, { toValue: 0.93, useNativeDriver: true, friction: 8 }).start();
      },
      onPanResponderMove: (_, g) => {
        if (Math.abs(g.dx) > 3 || Math.abs(g.dy) > 3) didDrag.current = true;
        pan.setValue({ x: g.dx, y: g.dy });
      },
      onPanResponderRelease: () => {
        pan.flattenOffset();
        Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, friction: 5 }).start();

        const rawX = (pan.x as any)._value;
        const rawY = (pan.y as any)._value;
        const curW = expanded ? EXPANDED_W : BUBBLE_SIZE;
        const curH = expanded ? EXPANDED_H : BUBBLE_SIZE;
        const snapX = rawX < SCREEN.width / 2 ? MARGIN : SCREEN.width - curW - MARGIN;
        const clamped = clamp(snapX, rawY, curW, curH);

        if (!didDrag.current) {
          // Tap — show the choice modal
          setShowModal(true);
        }

        Animated.spring(pan, {
          toValue: clamped, useNativeDriver: false, friction: 6, tension: 60,
        }).start();
      },
    })
  ).current;

  /* ── Call logic ── */

  const dialNumber = (number: string) => {
    setShowModal(false);
    setExpanded(false);
    Linking.openURL(`tel:${number}`);
  };

  const handleCenterCall = async () => {
    setCalling(true);
    try {
      const appointments = await appointmentApi.getPatientAppointments();
      // Sort by dateTime descending to get the most recent
      const sorted = (appointments || []).sort(
        (a: any, b: any) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime()
      );
      const lastAppt = sorted[0];

      if (lastAppt?.locationId) {
        // Match locationId with centers
        const matchedCenter = centers.find(
          (c: any) => c.id !== null && String(c.id) === String(lastAppt.locationId)
        );
        if (matchedCenter?.number) {
          dialNumber(matchedCenter.number);
          return;
        }
      }
      // Fallback to default
      if (defaultNumber) dialNumber(defaultNumber);
    } catch {
      // On error, dial default
      if (defaultNumber) dialNumber(defaultNumber);
    } finally {
      setCalling(false);
    }
  };

  const handleHomeCall = () => {
    if (defaultNumber) dialNumber(defaultNumber);
  };

  if (!defaultNumber) return null;

  return (
    <>
      {/* Draggable bubble */}
      <Animated.View
        {...panResponder.panHandlers}
        style={[
          styles.wrap,
          {
            transform: [{ translateX: pan.x }, { translateY: pan.y }, { scale: scaleAnim }],
            width: BUBBLE_SIZE,
            height: BUBBLE_SIZE,
          },
        ]}
      >
        <LinearGradient
          colors={['#EF4444', '#DC2626']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.bubble}
        >
          <View style={styles.shine} />
          <Phone size={18} color={COLORS.white} fill={COLORS.white} />
          <Text style={styles.sosText}>SOS</Text>
        </LinearGradient>
      </Animated.View>

      {/* Choice modal */}
      <Modal visible={showModal} transparent animationType="fade" onRequestClose={() => setShowModal(false)}>
        <View style={styles.overlay}>
          <View style={styles.modal} onStartShouldSetResponder={() => true}>
            {/* Header */}
            <View style={styles.modalIconWrap}>
              <Phone size={22} color={COLORS.white} fill={COLORS.white} />
            </View>
            <Text style={styles.modalTitle}>Emergency Call</Text>
            <Text style={styles.modalSub}>Where are you right now?</Text>

            {/* Options */}
            <View style={styles.optionRow}>
              <TouchableOpacity
                style={styles.optionCard}
                onPress={handleCenterCall}
                disabled={calling}
                activeOpacity={0.7}
              >
                <View style={[styles.optionIcon, { backgroundColor: COLORS.primary + '12' }]}>
                  <Building2 size={22} color={COLORS.primary} />
                </View>
                <Text style={styles.optionTitle}>At Oncare Center</Text>
                <Text style={styles.optionDesc}>We'll connect you to your center</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.optionCard}
                onPress={handleHomeCall}
                disabled={calling}
                activeOpacity={0.7}
              >
                <View style={[styles.optionIcon, { backgroundColor: COLORS.success + '12' }]}>
                  <Home size={22} color={COLORS.success} />
                </View>
                <Text style={styles.optionTitle}>At Home</Text>
                <Text style={styles.optionDesc}>Connect to Oncare support</Text>
              </TouchableOpacity>
            </View>

            {/* Cancel */}
            <TouchableOpacity onPress={() => setShowModal(false)} style={styles.cancelBtn}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    zIndex: 999,
  },

  bubble: {
    width: BUBBLE_SIZE,
    height: BUBBLE_SIZE,
    borderRadius: BUBBLE_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    overflow: 'hidden',
  },

  shine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '45%',
    borderTopLeftRadius: BUBBLE_SIZE / 2,
    borderTopRightRadius: BUBBLE_SIZE / 2,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },

  sosText: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.white,
    letterSpacing: 1.2,
    marginTop: 1,
  },

  /* Modal */
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  modal: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 26,
    width: '88%',
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.1,
    shadowRadius: 30,
    elevation: 10,
    borderWidth: 1,
    borderColor: 'rgba(238,240,248,0.9)',
  },

  closeBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#f4f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },

  modalIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#DC2626',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    shadowColor: '#DC2626',
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },

  modalTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 4,
  },

  modalSub: {
    fontSize: 13,
    color: COLORS.gray,
    marginBottom: 22,
  },

  optionRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    marginBottom: 18,
  },

  optionCard: {
    flex: 1,
    backgroundColor: '#fafbfe',
    borderRadius: 18,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f0f1f6',
  },

  optionIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },

  optionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
    textAlign: 'center',
    marginBottom: 4,
  },

  optionDesc: {
    fontSize: 10,
    color: COLORS.gray,
    textAlign: 'center',
    lineHeight: 14,
  },

  cancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 24,
  },

  cancelText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.gray,
  },
});

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Pressable,
  Dimensions,
} from 'react-native';
import { FONT_SIZES, SPACING } from '../constants/theme';

const { width } = Dimensions.get('window');

type Props = {
  visible: boolean;
  title: string;
  message: string;
  onClose: () => void;
  dismissible?: boolean;
};

export const PremiumAlert = ({
  visible,
  title,
  message,
  onClose,
  dismissible = true,
}: Props) => {
  const scale = useRef(new Animated.Value(0.92)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scale, {
          toValue: 1,
          friction: 7,
          tension: 70,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const handleClose = () => {
    if (!dismissible) return; // Prevent closing if not dismissible
    
    Animated.parallel([
      Animated.timing(scale, {
        toValue: 0.92,
        duration: 160,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 160,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose(); // ✅ GUARANTEED STATE UPDATE
    });
  };

  if (!visible) return null;

  return (
    <View style={styles.overlay} pointerEvents="box-none">
      <Pressable
        style={StyleSheet.absoluteFill}
        onPress={handleClose}
      />

      <Animated.View
        style={[
          styles.card,
          {
            opacity,
            transform: [{ scale }],
          },
        ]}
      >
        <View style={styles.highlight} />

        <Text style={styles.icon}>⚠️</Text>

        <Text style={styles.title}>{title}</Text>

        <Text style={styles.message}>{message}</Text>

        {dismissible && (
          <Pressable onPress={handleClose} style={styles.button}>
            <Text style={styles.buttonText}>OK</Text>
          </Pressable>
        )}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },

  card: {
    width: width * 0.82,
    borderRadius: 28,
    paddingVertical: SPACING.xl,
    paddingHorizontal: SPACING.lg,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center',

    shadowColor: '#000',
    shadowOpacity: 0.28,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 18 },
    elevation: 25,
  },

  highlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },

  icon: {
    fontSize: 34,
    marginBottom: SPACING.sm,
  },

  title: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '800',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },

  message: {
    fontSize: FONT_SIZES.md,
    color: '#4b5563',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: SPACING.lg,
  },

  button: {
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 16,
    backgroundColor: '#20206b',
  },

  buttonText: {
    color: '#ffffff',
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
  },
});

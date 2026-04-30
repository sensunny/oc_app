import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Pressable,
  Dimensions,
} from 'react-native';
import { COLORS } from '../constants/theme';
import { AlertCircle, CheckCircle, Info, X } from 'lucide-react-native';

const { width } = Dimensions.get('window');

type Props = {
  visible: boolean;
  title: string;
  message: string;
  onClose: () => void;
  dismissible?: boolean;
};

const getAlertConfig = (title: string) => {
  const t = title.toLowerCase();
  if (t.includes('success')) {
    return {
      Icon: CheckCircle,
      iconColor: COLORS.white,
      bgColor: COLORS.success,
      shadowColor: COLORS.success,
    };
  }
  if (t.includes('error')) {
    return {
      Icon: AlertCircle,
      iconColor: COLORS.white,
      bgColor: COLORS.error,
      shadowColor: COLORS.error,
    };
  }
  return {
    Icon: Info,
    iconColor: COLORS.white,
    bgColor: COLORS.primary,
    shadowColor: COLORS.primary,
  };
};

export const PremiumAlert = ({
  visible,
  title,
  message,
  onClose,
  dismissible = true,
}: Props) => {
  const scale = useRef(new Animated.Value(0.9)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scale, {
          toValue: 1,
          friction: 6,
          tension: 80,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const handleClose = () => {
    if (!dismissible) return;
    Animated.parallel([
      Animated.timing(scale, {
        toValue: 0.9,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => onClose());
  };

  if (!visible) return null;

  const config = getAlertConfig(title);
  const { Icon } = config;

  return (
    <View style={styles.overlay} pointerEvents="box-none">
      <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />

      <Animated.View
        style={[
          styles.card,
          { opacity, transform: [{ scale }] },
        ]}
      >
        {/* Icon circle */}
        <View style={[styles.iconCircle, { backgroundColor: config.bgColor, shadowColor: config.shadowColor }]}>
          <Icon size={24} color={config.iconColor} />
        </View>

        {/* Title */}
        <Text style={styles.title}>{title}</Text>

        {/* Message */}
        <Text style={styles.message}>{message}</Text>

        {/* Button */}
        {dismissible && (
          <Pressable onPress={handleClose} style={styles.button}>
            <Text style={styles.buttonText}>Got it</Text>
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
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },

  card: {
    width: width * 0.84,
    borderRadius: 22,
    paddingTop: 30,
    paddingBottom: 24,
    paddingHorizontal: 24,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOpacity: 0.1,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 16 },
    elevation: 12,
    borderWidth: 1,
    borderColor: 'rgba(238,240,248,0.9)',
  },

  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },

  title: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.primary,
    textAlign: 'center',
    marginBottom: 8,
  },

  message: {
    fontSize: 14,
    color: COLORS.gray,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 22,
    paddingHorizontal: 4,
  },

  button: {
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },

  buttonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '700',
  },
});

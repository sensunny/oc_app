import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Path, Circle, G, Defs, LinearGradient as SvgGradient, Stop, Rect } from 'react-native-svg';
import { COLORS } from '../constants/theme';

/**
 * Subtle healthcare-themed decorative graphics for the login screen.
 * Renders a heartbeat pulse line, a medical cross, and soft floating circles.
 */

/* ── Top-right: pulse line + heart ── */
export const PulseGraphic = ({ size = 120 }: { size?: number }) => (
  <Svg width={size} height={size * 0.5} viewBox="0 0 120 60" fill="none">
    <Defs>
      <SvgGradient id="pulseGrad" x1="0" y1="0" x2="1" y2="0">
        <Stop offset="0" stopColor={COLORS.white} stopOpacity="0.5" />
        <Stop offset="1" stopColor={COLORS.accent1} stopOpacity="0.35" />
      </SvgGradient>
    </Defs>
    {/* Heartbeat line */}
    <Path
      d="M0 35 L25 35 L32 18 L40 50 L48 10 L56 42 L62 28 L70 35 L120 35"
      stroke="url(#pulseGrad)"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
    {/* Small heart at the peak */}
    <Path
      d="M48 8 C46 4, 41 4, 41 8 C41 12, 48 16, 48 16 C48 16, 55 12, 55 8 C55 4, 50 4, 48 8Z"
      fill={COLORS.accent1}
      opacity={0.3}
    />
  </Svg>
);

/* ── Bottom-left: medical cross with soft glow ── */
export const MedicalCrossGraphic = ({ size = 60 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 60 60" fill="none">
    <Defs>
      <SvgGradient id="crossGrad" x1="0" y1="0" x2="0" y2="1">
        <Stop offset="0" stopColor={COLORS.white} stopOpacity="0.35" />
        <Stop offset="1" stopColor={COLORS.accent1} stopOpacity="0.15" />
      </SvgGradient>
    </Defs>
    {/* Outer glow circle */}
    <Circle cx="30" cy="30" r="28" fill={COLORS.white} opacity={0.04} />
    {/* Cross */}
    <G opacity={0.3}>
      <Rect x="24" y="12" width="12" height="36" rx="4" fill="url(#crossGrad)" />
      <Rect x="12" y="24" width="36" height="12" rx="4" fill="url(#crossGrad)" />
    </G>
  </Svg>
);

/* ── Floating dots pattern (between logo and card) ── */
export const FloatingDots = ({ width = 200, height = 30 }: { width?: number; height?: number }) => (
  <Svg width={width} height={height} viewBox="0 0 200 30" fill="none">
    {/* Scattered soft dots */}
    <Circle cx="20" cy="15" r="2" fill={COLORS.white} opacity={0.2} />
    <Circle cx="50" cy="8" r="1.5" fill={COLORS.accent1} opacity={0.25} />
    <Circle cx="75" cy="22" r="2.5" fill={COLORS.white} opacity={0.15} />
    <Circle cx="100" cy="12" r="1.8" fill={COLORS.accent2} opacity={0.2} />
    <Circle cx="130" cy="20" r="2" fill={COLORS.white} opacity={0.18} />
    <Circle cx="155" cy="7" r="1.5" fill={COLORS.accent1} opacity={0.22} />
    <Circle cx="180" cy="18" r="2.2" fill={COLORS.white} opacity={0.15} />
  </Svg>
);

/* ── Shield / trust badge (optional, can be placed near title) ── */
export const ShieldGraphic = ({ size = 22 }: { size?: number }) => (
  <Svg width={size} height={size * 1.15} viewBox="0 0 22 26" fill="none">
    <Defs>
      <SvgGradient id="shieldGrad" x1="0" y1="0" x2="0" y2="1">
        <Stop offset="0" stopColor={COLORS.accent1} stopOpacity="0.9" />
        <Stop offset="1" stopColor={COLORS.primary} stopOpacity="0.9" />
      </SvgGradient>
    </Defs>
    <Path
      d="M11 1 L21 5 L21 13 C21 19 16.5 23.5 11 25 C5.5 23.5 1 19 1 13 L1 5 L11 1Z"
      fill="url(#shieldGrad)"
      opacity={0.2}
    />
    {/* Checkmark inside shield */}
    <Path
      d="M7 13 L10 16 L15 10"
      stroke={COLORS.white}
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      opacity={0.6}
    />
  </Svg>
);

/* ── DNA Helix — left side ── */
export const DNAHelixGraphic = ({ size = 140 }: { size?: number }) => (
  <Svg width={size * 0.35} height={size} viewBox="0 0 50 140" fill="none">
    <Defs>
      <SvgGradient id="dnaGrad" x1="0" y1="0" x2="0" y2="1">
        <Stop offset="0" stopColor={COLORS.white} stopOpacity="0.3" />
        <Stop offset="1" stopColor={COLORS.accent1} stopOpacity="0.1" />
      </SvgGradient>
    </Defs>
    {/* Left strand */}
    <Path
      d="M10 0 C10 20, 40 20, 40 40 C40 60, 10 60, 10 80 C10 100, 40 100, 40 120 C40 140, 10 140, 10 140"
      stroke="url(#dnaGrad)"
      strokeWidth="1.8"
      strokeLinecap="round"
      fill="none"
    />
    {/* Right strand */}
    <Path
      d="M40 0 C40 20, 10 20, 10 40 C10 60, 40 60, 40 80 C40 100, 10 100, 10 120 C10 140, 40 140, 40 140"
      stroke="url(#dnaGrad)"
      strokeWidth="1.8"
      strokeLinecap="round"
      fill="none"
    />
    {/* Cross bars */}
    {[20, 40, 60, 80, 100, 120].map((y, i) => (
      <Path
        key={i}
        d={`M${i % 2 === 0 ? 15 : 20} ${y} L${i % 2 === 0 ? 35 : 30} ${y}`}
        stroke={COLORS.white}
        strokeWidth="1"
        strokeLinecap="round"
        opacity={0.15}
      />
    ))}
  </Svg>
);

/* ── Stethoscope outline — bottom right ── */
export const StethoscopeGraphic = ({ size = 80 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 80 80" fill="none">
    <Defs>
      <SvgGradient id="stethGrad" x1="0" y1="0" x2="1" y2="1">
        <Stop offset="0" stopColor={COLORS.white} stopOpacity="0.25" />
        <Stop offset="1" stopColor={COLORS.accent2} stopOpacity="0.12" />
      </SvgGradient>
    </Defs>
    {/* Tube */}
    <Path
      d="M20 10 C20 10, 15 30, 25 45 C35 60, 45 55, 45 45 C45 35, 35 30, 35 20"
      stroke="url(#stethGrad)"
      strokeWidth="2"
      strokeLinecap="round"
      fill="none"
    />
    {/* Earpieces */}
    <Circle cx="20" cy="8" r="4" fill={COLORS.white} opacity={0.12} />
    <Circle cx="35" cy="18" r="4" fill={COLORS.white} opacity={0.12} />
    {/* Chest piece */}
    <Circle cx="25" cy="50" r="8" stroke={COLORS.white} strokeWidth="1.5" opacity={0.15} fill="none" />
    <Circle cx="25" cy="50" r="4" fill={COLORS.accent1} opacity={0.1} />
  </Svg>
);

/* ── Molecule / atom rings — decorative ── */
export const MoleculeGraphic = ({ size = 60 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 60 60" fill="none">
    {/* Orbits */}
    <Circle cx="30" cy="30" r="20" stroke={COLORS.white} strokeWidth="0.8" opacity={0.12} fill="none" />
    <G rotation={60} origin="30, 30">
      <Circle cx="30" cy="30" r="20" stroke={COLORS.white} strokeWidth="0.8" opacity={0.1} fill="none" />
    </G>
    <G rotation={120} origin="30, 30">
      <Circle cx="30" cy="30" r="20" stroke={COLORS.accent1} strokeWidth="0.8" opacity={0.08} fill="none" />
    </G>
    {/* Center nucleus */}
    <Circle cx="30" cy="30" r="4" fill={COLORS.white} opacity={0.15} />
    {/* Electrons */}
    <Circle cx="30" cy="10" r="2.5" fill={COLORS.accent1} opacity={0.2} />
    <Circle cx="47" cy="40" r="2" fill={COLORS.white} opacity={0.18} />
    <Circle cx="13" cy="40" r="2" fill={COLORS.accent2} opacity={0.15} />
  </Svg>
);

/* ── Capsule pill — small decorative ── */
export const CapsuleGraphic = ({ size = 40 }: { size?: number }) => (
  <Svg width={size} height={size * 0.5} viewBox="0 0 40 20" fill="none">
    <Rect x="2" y="2" width="36" height="16" rx="8" stroke={COLORS.white} strokeWidth="1.2" opacity={0.15} fill="none" />
    <Rect x="20" y="2" width="18" height="16" rx="8" fill={COLORS.accent1} opacity={0.08} />
    <Path d="M20 2 L20 18" stroke={COLORS.white} strokeWidth="0.8" opacity={0.12} />
  </Svg>
);

import { Tabs } from 'expo-router';
import {
  Home,
  FileText,
  User,
  ClipboardPlus,
  Plus,
} from 'lucide-react-native';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS } from '../../constants/theme';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.gray,
        tabBarStyle: {
          backgroundColor: COLORS.white,
          borderTopWidth: 1,
          borderTopColor: COLORS.border,
          height: 80,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      }}
    >
      {/* Home */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ size, color }) => (
            <Home size={size} color={color} />
          ),
        }}
      />

      {/* Documents */}
      <Tabs.Screen
        name="documents"
        options={{
          title: 'Documents',
          tabBarIcon: ({ size, color }) => (
            <FileText size={size} color={color} />
          ),
        }}
      />

      {/* BOOK – CENTER ACTION */}
      <Tabs.Screen
        name="book"
        options={{
          title: '',
          tabBarButton: (props) => (
            <TouchableOpacity
              {...props}
              style={styles.bookButtonWrapper}
              activeOpacity={0.9}
            >
              <View style={styles.bookButton}>
                <Plus size={26} color={COLORS.white} />
              </View>
              <Text style={styles.bookLabel}>Book</Text>
            </TouchableOpacity>
          ),
        }}
      />

      {/* Appointments */}
      <Tabs.Screen
        name="appointments"
        options={{
          title: 'Appointments',
          tabBarIcon: ({ size, color }) => (
            <ClipboardPlus size={size} color={color} />
          ),
        }}
      />

      {/* Profile */}
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ size, color }) => (
            <User size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  bookButtonWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    top: -20,
  },

  bookButton: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },

  bookLabel: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
  },
});

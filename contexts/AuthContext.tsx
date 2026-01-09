import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthState } from '../types';
import { patientApi } from '../services/api';
import { cleanupListeners } from '../services/notifications';

interface AuthContextType extends AuthState {
  login: (identifier: string, otp: string, selectedHospitalUid: string) => Promise<boolean>;
  sendOTP: (identifier: string) => Promise<any>;
  logout: () => Promise<void>;
  refreshPatient: () => Promise<void>;
  getPatient: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const INITIAL_STATE: AuthState = {
  isAuthenticated: false,
  patient: null,
  loading: true, // only for app boot
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>(INITIAL_STATE);

  // ============================
  // App boot auth check
  // ============================
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = await AsyncStorage.getItem('access_token');

      if (!token) {
        setAuthState({
          isAuthenticated: false,
          patient: null,
          loading: false,
        });
        return;
      }

      const patientData = await patientApi.getPatientDetails();

      setAuthState({
        isAuthenticated: true,
        patient: patientData,
        loading: false,
      });
    } catch (error) {
      console.error('Auth check error:', error);
      setAuthState({
        isAuthenticated: false,
        patient: null,
        loading: false,
      });
    }
  };

  // ============================
  // OTP
  // ============================
  const sendOTP = async (identifier: string): Promise<any> => {
    try {
      const result = await patientApi.sendOTP(identifier);

      if (result?.success && result?.otp_id) {
        await AsyncStorage.setItem('otp_id', result.otp_id);
        await AsyncStorage.setItem('mobile', result.mobile);
      }

      return result;
    } catch (error) {
      console.error('Send OTP error:', error);
      return { success: false, message: 'Failed to send OTP' };
    }
  };

  // ============================
  // Login
  // ============================
  const login = async (
    identifier: string,
    otp: string,
    selectedHospitalUid: string
  ): Promise<boolean> => {
    try {
      const otp_id = (await AsyncStorage.getItem('otp_id')) || '';

      const result = await patientApi.login(
        identifier,
        otp,
        otp_id,
        selectedHospitalUid
      );

      if (!result?.success) return false;

      await AsyncStorage.setItem(
        'access_token',
        result?.authData?.access_token ?? ''
      );
      await AsyncStorage.removeItem('otp_id');

      await getPatient();
      return true;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  // ============================
  // Get patient (SAFE refresh)
  // ============================
  const getPatient = useCallback(async () => {
    try {
      const patientData = await patientApi.getPatientDetails();

      // IMPORTANT: do not clear previous patient
      setAuthState(prev => ({
        ...prev,
        isAuthenticated: true,
        patient: patientData,
        loading: false,
      }));
    } catch (error) {
      console.error('Get patient error:', error);

      // keep old patient if fetch fails
      setAuthState(prev => ({
        ...prev,
        loading: false,
      }));
    }
  }, []);

  // ============================
  // Manual refresh
  // ============================
  const refreshPatient = async () => {
    await getPatient();
  };

  // ============================
  // Logout
  // ============================
  const logout = async () => {
    try {
      await patientApi.logout();
    } catch (e) {
      console.warn('Logout API failed');
    } finally {
      cleanupListeners();
      await AsyncStorage.removeItem('access_token');
      await AsyncStorage.removeItem('patient');

      setAuthState({
        isAuthenticated: false,
        patient: null,
        loading: false,
      });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        ...authState,
        login,
        logout,
        refreshPatient,
        sendOTP,
        getPatient,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthState } from '../types';
import { patientApi } from '../services/api';
import { cleanupListeners } from '../services/notifications';

interface AuthContextType extends AuthState {
  login: (identifier: string, otp: string) => Promise<boolean>;
  sendOTP: (identifier: string) => Promise<string>;
  logout: () => Promise<void>;
  refreshPatient: () => Promise<void>;
  getPatient: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    patient: null,
    loading: true
  });

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = await AsyncStorage.getItem('access_token');
      if (token) {
        const patientData = await patientApi.getPatientDetails();
        setAuthState({
          isAuthenticated: true,
          patient: patientData,
          loading: false,
        });
      } else {
        setAuthState({
          isAuthenticated: false,
          patient: null,
          loading: false,
        });
      }
    } catch (error) {
      console.error('Auth check error:', error);
      setAuthState({
        isAuthenticated: false,
        patient: null,
        loading: false,
      });
    }
  };

  const sendOTP = async (identifier: string): Promise<string> => {
    try {
      const result = await patientApi.sendOTP(identifier);
  
      if (result.success && result.otp_id) {
        // Store OTP ID for later use during verification
        await AsyncStorage.setItem('otp_id', result.otp_id);
        await AsyncStorage.setItem('mobile', result.mobile);
        console.log('OTP sent successfully:', result.message);
        return 'true';
      }
  
      console.warn('Send OTP failed:', result.message);
      return result.message;
    } catch (error) {
      console.error('Send OTP error:', error);
      return error;
    }
  };

  const login = async (identifier: string, otp: string): Promise<boolean> => {
    try {
      const otp_id = await AsyncStorage.getItem('otp_id') || "";
      const result = await patientApi.login(identifier, otp, otp_id);
      console.log({result})
      if (result.success) {
        await AsyncStorage.setItem('access_token', result?.authData?.access_token ?? '');
        await AsyncStorage.removeItem('otp_id');
        await getPatient()
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const getPatient = async () => {
    const patientData = await patientApi.getPatientDetails();
        setAuthState({
          isAuthenticated: true,
          loading: false,
          patient: patientData
        });

        return patientData
  }


  const logout = async () => {
    try {
      const result = await patientApi.logout();
      if (result.success) {
        cleanupListeners();
        await AsyncStorage.removeItem('access_token');
        await AsyncStorage.removeItem('patient');
        setAuthState({
          isAuthenticated: false,
          patient: null,
          loading: false,
        });
        console.log(result.message);
      } else {
        console.warn('Logout failed:', result.message);
      }
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const refreshPatient = async () => {
    await checkAuthStatus();
  };

  return (
    <AuthContext.Provider
      value={{
        ...authState,
        login,
        logout,
        refreshPatient,
        sendOTP,
        getPatient
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

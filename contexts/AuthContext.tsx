import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Patient, AuthState } from '../types';
import { patientApi } from '../services/api';
import { cleanupListeners } from '../services/notifications';

interface AuthContextType extends AuthState {
  login: (identifier: string, otp: string) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshPatient: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    patient: null,
    loading: true,
  });

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const patientData = await AsyncStorage.getItem('patient');
      if (patientData) {
        setAuthState({
          isAuthenticated: true,
          patient: JSON.parse(patientData),
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
      setAuthState({
        isAuthenticated: false,
        patient: null,
        loading: false,
      });
    }
  };

  const login = async (identifier: string, otp: string): Promise<boolean> => {
    try {
      const result = await patientApi.login(identifier, otp);

      if (result.success && result.patient) {
        await AsyncStorage.setItem('patient', JSON.stringify(result.patient));
        setAuthState({
          isAuthenticated: true,
          patient: result.patient,
          loading: false,
        });
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const logout = async () => {
    try {
      cleanupListeners();
      await AsyncStorage.removeItem('patient');
      setAuthState({
        isAuthenticated: false,
        patient: null,
        loading: false,
      });
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

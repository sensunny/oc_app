import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthState } from '../types';
import { patientApi, documentApi } from '../services/api';
import { cleanupListeners } from '../services/notifications';
import { setUnauthorizedHandler, clearUnauthorizedHandler, setUpgradeRequiredHandler } from '../utils/fetchWrapper';
import { PremiumAlert } from '../components/PremiumAlert';

interface AuthContextType extends AuthState {
  login: (identifier: string, otp: string, selectedHospitalUid: string) => Promise<boolean>;
  sendOTP: (identifier: string, patientname: string) => Promise<any>;
  logout: () => Promise<void>;
  refreshPatient: () => Promise<void>;
  getPatient: () => Promise<void>;
  fetchDocuments: (background?: boolean) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const INITIAL_STATE: AuthState = {
  isAuthenticated: false,
  patient: null,
  loading: true, // only for app boot
  documents: null,
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>(INITIAL_STATE);
  const [alert, setAlert] = useState<{
    visible: boolean;
    title: string;
    message: string;
    dismissible?: boolean;
  }>({
    visible: false,
    title: '',
    message: '',
    dismissible: true,
  });

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
          documents: null,
        });
        return;
      }

      const patientData = await patientApi.getPatientDetails();

      setAuthState({
        isAuthenticated: true,
        patient: patientData,
        loading: false,
        documents: null, // Will be fetched via fetchDocuments
      });
    } catch (error) {
      console.error('Auth check error:', error);
      setAuthState({
        isAuthenticated: false,
        patient: null,
        loading: false,
        documents: null,
      });
    }
  };

  // ============================
  // OTP
  // ============================
  const sendOTP = async (identifier: string, patientname: string): Promise<any> => {
    try {
      const result:any = await patientApi.sendOTP(identifier, patientname);

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
  // Fetch Documents (Global Cache)
  // ============================
  const fetchDocuments = useCallback(async (background = false) => {
    try {
      const docs = await documentApi.getPatientDocuments();
      setAuthState(prev => ({
        ...prev,
        documents: docs || [],
      }));
    } catch (error) {
      console.warn('Failed to refresh documents', error);
      // Keeps old documents in state if fetch fails
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
        documents: null,
      });
    }
  };

  // ============================
  // Register Global Handlers (401 & 426)
  // ============================
  useEffect(() => {
    // 401: Unauthorized - Logout
    const handleUnauthorized = () => {
      cleanupListeners();
      AsyncStorage.multiRemove(['access_token', 'patient']);
      setAuthState({
        isAuthenticated: false,
        patient: null,
        loading: false,
        documents: null,
      });
      setAlert({
        visible: true,
        title: 'Session Expired',
        message: 'Please login again to continue.',
        dismissible: true,
      });
    };

    // 426: Upgrade Required - Force Update
    const handleUpgradeRequired = (message: string) => {
      setAlert({
        visible: true,
        title: 'Update Required',
        message: message,
        dismissible: false, // NON-DISMISSIBLE
      });
    };

    setUnauthorizedHandler(handleUnauthorized);
    setUpgradeRequiredHandler(handleUpgradeRequired);

    return () => {
      clearUnauthorizedHandler();
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{
        ...authState,
        login,
        logout,
        refreshPatient,
        sendOTP,
        getPatient,
        fetchDocuments,
      }}
    >
      <PremiumAlert
        visible={alert.visible}
        title={alert.title}
        message={alert.message}
        dismissible={alert.dismissible}
        onClose={() =>
          setAlert(prev => ({
            ...prev,
            visible: false,
            title: '',
            message: '',
          }))
        }
      />
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

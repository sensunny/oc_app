import AsyncStorage from '@react-native-async-storage/async-storage';
import { Patient, Document, Notification, AuthData } from '../types';
import { apiRequest } from '@/utils/apiClient';
import { BASE_URL } from '@/utils/apiClient';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const patientApi = {
  sendOTP: async (identifier: string): Promise<{ success: boolean; otp_id?: string; message?: string, mobile?: string, hospitalUids?: any[], code?: number, data?: any }> => {
    try {
      const res = await fetch(`${BASE_URL}/sendOTP`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier }),
      });

      const data = await res.json();
      console.log({data}, data.code)

      if (data.code !== 1) {
        return { success: false, message: data.message || 'Failed to send OTP' };
      }

      return {
        success: true,
        otp_id: data.data.otp_id,
        message: data.message || 'OTP sent successfully',
        mobile: data.data.mobile,
        hospitalUids: data.data.hospitalUids,
        code: data.code,
        data: data.data
      };
    } catch (error) {
      console.error('Send OTP error:', error);
      return { success: false, message: 'Network or server error' };
    }
  },

  login: async (mobile: string, otp: string, otp_id?: string, selectedHospitalUid?: string): Promise<{ success: boolean; authData?: AuthData; message?: string }> => {
    try {
      const res = await fetch(`${BASE_URL}/verifyOTP`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mobile,
          otp,
          otp_id,
          hospitalUid: selectedHospitalUid
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        return { success: false, message: data.message || 'OTP verification failed' };
      }

      // Assuming your backend returns a patient object on success
      return {
        success: true,
        authData: data.data,
      };
    } catch (err) {
      console.error('Login error:', err);
      return { success: false, message: 'Network or server error' };
    }
  },

  logout: async (): Promise<{ success: boolean; message?: string }> => {
    try {
      const token = await AsyncStorage.getItem('access_token');
      if (!token) {
        console.warn('No access token found for logout');
        return { success: false, message: 'No active session' };
      }
  
      const res = await fetch(`${BASE_URL}/logout`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          token,
        },
      });
  
      const data = await res.json();
      if (!res.ok) {
        console.warn('Logout failed:', data.message);
        return { success: false, message: data.message || 'Logout failed' };
      }
  
      // Clear stored tokens after successful logout
      await AsyncStorage.multiRemove(['access_token', 'token_expiresAt', 'otp_id']);
  
      return { success: true, message: data.message || 'Logged out successfully' };
    } catch (error) {
      console.error('Logout error:', error);
      return { success: false, message: 'Network or server error' };
    }
  },
  // ---- Get Patient Details ----
  getPatientDetails: async (): Promise<Patient | null> => {
    try {
      const token = await AsyncStorage.getItem('access_token');
      if (!token) {
        console.warn('No access token found');
        return null;
      }

      const res = await fetch(`${BASE_URL}/getPatientDetails`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          token,
        },
      });

      const data = await res.json();
      if (!res.ok) {
        console.warn('Failed to fetch patient details:', data.message);
        return null;
      }

      return data.data || null; // Assuming the patient data is under `data`
    } catch (error) {
      console.error('Get Patient Details error:', error);
      return null;
    }
  },
};

export const documentApi = {
  getPatientDocuments: async (): Promise<any[] | null> => {
    try {
      const token = await AsyncStorage.getItem('access_token');
      if (!token) {
        console.warn('No access token found');
        return null;
      }

      const data = await apiRequest("/getPatientDocuments", { token });

      // const data = await res.json();
      console.log({data})

      return data?.data?.length ? data.data : [];
    } catch (error) {
      console.error('Get Patient Documents error:', error);
      return null;
    }
  },
};

export const notificationApi = {
  getNotifications: async (patientId: string): Promise<Notification[]> => {
    await delay(600);

    return [
      {
        id: '1',
        patient_id: patientId,
        title: 'New Document Uploaded',
        message: 'Your Complete Blood Count Report has been uploaded',
        type: 'document_upload',
        related_document_id: '1',
        is_read: false,
        created_at: '2025-10-05T10:30:00Z',
      },
      {
        id: '2',
        patient_id: patientId,
        title: 'Appointment Reminder',
        message: 'You have an appointment tomorrow at 10:00 AM',
        type: 'appointment',
        is_read: true,
        created_at: '2025-10-04T15:00:00Z',
      },
      {
        id: '3',
        patient_id: patientId,
        title: 'New Document Uploaded',
        message: 'Your Chest X-Ray Analysis has been uploaded',
        type: 'document_upload',
        related_document_id: '2',
        is_read: true,
        created_at: '2025-10-03T14:20:00Z',
      },
    ];
  },

  markAsRead: async (notificationId: string): Promise<boolean> => {
    await delay(300);
    return true;
  },

  markAllAsRead: async (patientId: string): Promise<boolean> => {
    await delay(500);
    return true;
  },
};

export const pushTokenApi = {
  registerToken: async (patientId: string, token: string, deviceInfo: any): Promise<boolean> => {
    await delay(500);
    console.log('Registering push token:', { patientId, token, deviceInfo });
    return true;
  },

  unregisterToken: async (patientId: string, token: string): Promise<boolean> => {
    await delay(300);
    console.log('Unregistering push token:', { patientId, token });
    return true;
  },
};

export const appointmentApi = {
  getPatientAppointments: async (): Promise<any[] | null> => {
    try {
      const token = await AsyncStorage.getItem('access_token');
      if (!token) {
        console.warn('No access token found');
        return null;
      }

      const data = await apiRequest("/getPatientAppointments", { token });

      return data?.data?.length ? data.data : [];
    } catch (error) {
      console.error('Get Patient Documents error:', error);
      return null;
    }
  },
};

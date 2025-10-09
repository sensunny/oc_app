import { Patient, Document, Notification } from '../types';

const API_BASE_URL = 'https://api.example.com';
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const patientApi = {
  login: async (identifier: string, otp: string): Promise<{ success: boolean; patient?: Patient }> => {
    await delay(1000);

    if (identifier === '8888888888' && otp === '8888') {
      return {
        success: true,
        patient: {
          id: '1',
          hospital_id: '8888888888',
          mobile_number: '8888888888',
          full_name: 'Sarah Johnson',
          date_of_birth: '1988-05-15',
          blood_group: 'O+',
          gender: 'Female',
          address: '456 Wellness Avenue, Medical District, City 54321',
          emergency_contact: '+1 (555) 987-6543',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      };
    }

    return { success: false };
  },

  getProfile: async (patientId: string): Promise<Patient | null> => {
    await delay(500);

    return {
      id: patientId,
      hospital_id: '8888888888',
      mobile_number: '8888888888',
      full_name: 'Sarah Johnson',
      date_of_birth: '1988-05-15',
      blood_group: 'O+',
      gender: 'Female',
      address: '456 Wellness Avenue, Medical District, City 54321',
      emergency_contact: '+1 (555) 987-6543',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  },

  updateProfile: async (patientId: string, data: Partial<Patient>): Promise<Patient> => {
    await delay(1000);

    return {
      id: patientId,
      hospital_id: '8888888888',
      mobile_number: '8888888888',
      full_name: data.full_name || 'Sarah Johnson',
      date_of_birth: data.date_of_birth || '1988-05-15',
      blood_group: data.blood_group || 'O+',
      gender: data.gender || 'Female',
      address: data.address || '456 Wellness Avenue, Medical District, City 54321',
      emergency_contact: data.emergency_contact || '+1 (555) 987-6543',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  },
};

export const documentApi = {
  getDocuments: async (patientId: string): Promise<Document[]> => {
    await delay(800);

    return [
      {
        id: '1',
        patient_id: patientId,
        title: 'Complete Blood Count Report',
        description: 'Comprehensive blood analysis showing all vital parameters',
        document_type: 'Lab Report',
        file_url: 'https://www.oncarecancer.com/documents/cbc-report.pdf',
        file_size: 245000,
        uploaded_by: 'Dr. Michael Smith',
        uploaded_at: '2025-10-05T10:30:00Z',
        created_at: '2025-10-05T10:30:00Z',
      },
      {
        id: '2',
        patient_id: patientId,
        title: 'Chest X-Ray Analysis',
        description: 'Digital chest radiograph with detailed findings',
        document_type: 'Radiology',
        file_url: 'https://www.oncarecancer.com/documents/chest-xray.pdf',
        file_size: 1024000,
        uploaded_by: 'Dr. Emily Johnson',
        uploaded_at: '2025-10-03T14:20:00Z',
        created_at: '2025-10-03T14:20:00Z',
      },
      {
        id: '3',
        patient_id: patientId,
        title: 'Monthly Prescription',
        description: 'Current medication schedule and dosage information',
        document_type: 'Prescription',
        file_url: 'https://www.oncarecancer.com/documents/prescription.pdf',
        file_size: 180000,
        uploaded_by: 'Dr. Robert Williams',
        uploaded_at: '2025-10-01T09:15:00Z',
        created_at: '2025-10-01T09:15:00Z',
      },
      {
        id: '4',
        patient_id: patientId,
        title: 'MRI Scan Report',
        description: 'Brain MRI with contrast enhancement',
        document_type: 'Radiology',
        file_url: 'https://www.oncarecancer.com/documents/mri-scan.pdf',
        file_size: 2048000,
        uploaded_by: 'Dr. Jennifer Davis',
        uploaded_at: '2025-09-28T16:45:00Z',
        created_at: '2025-09-28T16:45:00Z',
      },
      {
        id: '5',
        patient_id: patientId,
        title: 'Cardiac Health Assessment',
        description: 'ECG and echocardiogram results',
        document_type: 'Cardiology',
        file_url: 'https://www.oncarecancer.com/documents/cardiac-report.pdf',
        file_size: 456000,
        uploaded_by: 'Dr. David Martinez',
        uploaded_at: '2025-09-25T11:00:00Z',
        created_at: '2025-09-25T11:00:00Z',
      },
    ];
  },

  getDocument: async (documentId: string): Promise<Document | null> => {
    await delay(500);

    return {
      id: documentId,
      patient_id: '1',
      title: 'Complete Blood Count Report',
      description: 'Comprehensive blood analysis showing all vital parameters',
      document_type: 'Lab Report',
      file_url: 'https://www.oncarecancer.com/documents/cbc-report.pdf',
      file_size: 245000,
      uploaded_by: 'Dr. Michael Smith',
      uploaded_at: '2025-10-05T10:30:00Z',
      created_at: '2025-10-05T10:30:00Z',
    };
  },

  downloadDocument: async (documentId: string): Promise<string> => {
    await delay(1500);
    return `https://www.oncarecancer.com/documents/download/${documentId}`;
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

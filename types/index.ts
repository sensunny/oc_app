export interface Patient {
  id: string;
  hospital_id: string;
  mobile_number: string;
  full_name: string;
  date_of_birth: string;
  blood_group: string;
  gender: string;
  address: string;
  emergency_contact: string;
  created_at: string;
  updated_at: string;
}

export interface Document {
  id: string;
  patient_id: string;
  title: string;
  description: string;
  document_type: string;
  file_url: string;
  file_size: number;
  uploaded_by: string;
  uploaded_at: string;
  created_at: string;
}

export interface Notification {
  id: string;
  patient_id: string;
  title: string;
  message: string;
  type: string;
  related_document_id?: string;
  is_read: boolean;
  created_at: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  patient: Patient | null;
  loading: boolean;
}

export interface Patient {
  _id: string;
  patient_id: string;
  patient_name: string;
  is_registered: string;
  phone_number: string;
  date_of_birth: string;
  age_yrs: string;
  age_mnths: string;
  gender: string;
  address: string;
  area: string;
  city: string;
  state: string;
  reg_date: string;
  aadhar_number: string;
  registeration_center: string;
  access_token: string;
}

export interface AuthData {
  access_token: string;
  expiresAt: string;
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
  loading: boolean;
  patient: Patient | null;
}

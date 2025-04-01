
export interface ConsultationRecord {
  id: string;
  patientName: string;
  dateTime: string;
  audioUrl?: string;
  transcription?: string;
  summary?: string;
  patientData?: {
    dni?: string;
    phone?: string;
    age?: string;
    email?: string;
  };
}

export interface ApiResponse {
  success: boolean;
  data?: any;
  error?: string;
}

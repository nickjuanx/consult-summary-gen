
export interface ConsultationRecord {
  id: string;
  patientName: string;
  dateTime: string;
  audioUrl?: string;
  transcription?: string;
  summary?: string;
}

export interface ApiResponse {
  success: boolean;
  data?: any;
  error?: string;
}

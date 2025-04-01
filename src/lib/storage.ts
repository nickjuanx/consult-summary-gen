
import { ConsultationRecord } from "@/types";

// Local storage keys
const CONSULTATIONS_KEY = 'medical-consultations';

// Save consultations to local storage
export const saveConsultations = (consultations: ConsultationRecord[]): void => {
  localStorage.setItem(CONSULTATIONS_KEY, JSON.stringify(consultations));
};

// Get consultations from local storage
export const getConsultations = (): ConsultationRecord[] => {
  const consultations = localStorage.getItem(CONSULTATIONS_KEY);
  return consultations ? JSON.parse(consultations) : [];
};

// Add a new consultation to storage
export const addConsultation = (consultation: ConsultationRecord): void => {
  const consultations = getConsultations();
  consultations.unshift(consultation); // Add to the beginning
  saveConsultations(consultations);
};

// Update an existing consultation
export const updateConsultation = (consultation: ConsultationRecord): void => {
  const consultations = getConsultations();
  const index = consultations.findIndex(c => c.id === consultation.id);
  
  if (index !== -1) {
    consultations[index] = consultation;
    saveConsultations(consultations);
  }
};

// Delete a consultation
export const deleteConsultation = (id: string): void => {
  const consultations = getConsultations();
  const filtered = consultations.filter(c => c.id !== id);
  saveConsultations(filtered);
};

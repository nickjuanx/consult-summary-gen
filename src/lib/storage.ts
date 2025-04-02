import { ConsultationRecord } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { savePatient } from "./patients";

// Guardar consultas en Supabase
export const saveConsultation = async (consultation: ConsultationRecord): Promise<string | null> => {
  try {
    console.log("saveConsultation starting for consultation:", consultation.id);
    
    // Primero guardamos el audio si existe
    let audioUrl = consultation.audioUrl;
    
    if (audioUrl && audioUrl.startsWith('blob:')) {
      console.log("Processing blob audio URL");
      // Convertir blob URL a File/Blob para subir a Supabase Storage
      try {
        const response = await fetch(audioUrl);
        if (!response.ok) {
          throw new Error(`Failed to fetch blob: ${response.status} ${response.statusText}`);
        }
        
        const blob = await response.blob();
        console.log("Audio blob fetched successfully, size:", blob.size);
        
        const fileName = `${consultation.id}.webm`;
        console.log("Uploading audio to Supabase Storage:", fileName);
        
        const { data, error } = await supabase.storage
          .from('consultation-audios')
          .upload(fileName, blob, {
            contentType: 'audio/webm',
            cacheControl: '3600',
          });
        
        if (error) {
          console.error("Error al subir el audio:", error);
          throw error;
        }
        
        console.log("Audio uploaded successfully:", data?.path);
        
        // Obtener URL pública del audio
        const { data: publicUrlData } = supabase.storage
          .from('consultation-audios')
          .getPublicUrl(fileName);
        
        audioUrl = publicUrlData.publicUrl;
        console.log("Audio public URL:", audioUrl);
      } catch (audioError) {
        console.error("Error processing audio:", audioError);
        // Continue with the consultation save even if audio upload fails
        audioUrl = null;
      }
    }
    
    // Si tenemos datos del paciente, intentamos crear/actualizar el paciente
    let patientId = consultation.patientId;
    console.log("Initial patient ID:", patientId);
    
    if (consultation.patientData && !patientId) {
      console.log("Attempting to save patient data:", consultation.patientData);
      // Creamos o actualizamos el paciente con los datos extraídos
      const patientResult = await savePatient({
        name: consultation.patientName,
        dni: consultation.patientData.dni,
        phone: consultation.patientData.phone,
        age: consultation.patientData.age,
        email: consultation.patientData.email
      });
      
      if (!patientResult.error) {
        patientId = patientResult.id;
        console.log("Linking consultation to new patient with ID:", patientId);
      } else {
        console.error("Error saving patient:", patientResult.error);
      }
    }
    
    // Aseguramos que patientId sea un UUID válido o null
    const validPatientId = patientId ? patientId : null;
    console.log("Final patient ID for consultation:", validPatientId);
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error("No se pudo obtener el usuario actual");
    }
    
    console.log("Current user ID:", user.id);
    
    // Guardar la consulta en la base de datos
    const { error } = await supabase
      .from('consultations')
      .insert({
        id: consultation.id,
        user_id: user.id,
        patient_name: consultation.patientName,
        date_time: consultation.dateTime,
        audio_url: audioUrl,
        transcription: consultation.transcription,
        summary: consultation.summary,
        patient_data: consultation.patientData,
        patient_id: validPatientId
      });
    
    if (error) {
      console.error("Error al guardar la consulta:", error);
      throw error;
    }
    
    console.log("Consultation saved successfully with ID:", consultation.id);
    return null; // Sin errores
  } catch (error) {
    console.error("Error en saveConsultation:", error);
    return error instanceof Error ? error.message : "Error al guardar la consulta";
  }
};

// Obtener consultas del usuario actual
export const getConsultations = async (): Promise<ConsultationRecord[]> => {
  try {
    const { data, error } = await supabase
      .from('consultations')
      .select('*')
      .order('date_time', { ascending: false });
    
    if (error) {
      console.error("Error al obtener consultas:", error);
      return [];
    }
    
    return data.map(item => ({
      id: item.id,
      patientName: item.patient_name,
      dateTime: item.date_time,
      audioUrl: item.audio_url,
      transcription: item.transcription,
      summary: item.summary,
      patientData: processPatientData(item.patient_data),
      patientId: item.patient_id
    })) || [];
  } catch (error) {
    console.error("Error en getConsultations:", error);
    return [];
  }
};

// Obtener consultas por paciente
export const getConsultationsByPatient = async (patientId: string): Promise<ConsultationRecord[]> => {
  try {
    console.log("Getting consultations for patient ID:", patientId);
    
    if (!patientId) {
      console.error("Patient ID is undefined or null");
      return [];
    }
    
    const { data, error } = await supabase
      .from('consultations')
      .select('*')
      .eq('patient_id', patientId)
      .order('date_time', { ascending: false });
    
    if (error) {
      console.error("Error al obtener consultas del paciente:", error);
      return [];
    }
    
    console.log(`Retrieved ${data?.length || 0} consultations for patient:`, patientId);
    
    return data.map(item => ({
      id: item.id,
      patientName: item.patient_name,
      dateTime: item.date_time,
      audioUrl: item.audio_url,
      transcription: item.transcription,
      summary: item.summary,
      patientData: processPatientData(item.patient_data),
      patientId: item.patient_id
    })) || [];
  } catch (error) {
    console.error("Error en getConsultationsByPatient:", error);
    return [];
  }
};

// Helper function to process and type-cast patient data from Supabase
const processPatientData = (data: any): { dni?: string; phone?: string; age?: string; email?: string } => {
  if (!data) return {};
  
  if (typeof data === 'object' && data !== null && !Array.isArray(data)) {
    return {
      dni: typeof data.dni === 'string' ? data.dni : undefined,
      phone: typeof data.phone === 'string' ? data.phone : undefined,
      age: typeof data.age === 'string' ? data.age : undefined,
      email: typeof data.email === 'string' ? data.email : undefined
    };
  }
  
  return {};
};

// Actualizar una consulta existente
export const updateConsultation = async (consultation: ConsultationRecord): Promise<string | null> => {
  try {
    const { error } = await supabase
      .from('consultations')
      .update({
        patient_name: consultation.patientName,
        transcription: consultation.transcription,
        summary: consultation.summary,
        patient_data: consultation.patientData,
        patient_id: consultation.patientId
      })
      .eq('id', consultation.id);
    
    if (error) {
      console.error("Error al actualizar la consulta:", error);
      return "Error al actualizar la consulta";
    }
    
    return null; // Sin errores
  } catch (error) {
    console.error("Error en updateConsultation:", error);
    return "Error al actualizar la consulta";
  }
};

// Eliminar una consulta
export const deleteConsultation = async (id: string): Promise<string | null> => {
  try {
    const { error } = await supabase
      .from('consultations')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error("Error al eliminar la consulta:", error);
      return "Error al eliminar la consulta";
    }
    
    return null; // Sin errores
  } catch (error) {
    console.error("Error en deleteConsultation:", error);
    return "Error al eliminar la consulta";
  }
};


import { ConsultationRecord } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { savePatient } from "./patients";

// Guardar consultas en Supabase
export const saveConsultation = async (consultation: ConsultationRecord): Promise<string | null> => {
  try {
    // Primero guardamos el audio si existe
    let audioUrl = consultation.audioUrl;
    
    if (audioUrl && audioUrl.startsWith('blob:')) {
      // Convertir blob URL a File/Blob para subir a Supabase Storage
      const response = await fetch(audioUrl);
      const blob = await response.blob();
      
      const fileName = `${consultation.id}.webm`;
      const { data, error } = await supabase.storage
        .from('consultation-audios')
        .upload(fileName, blob, {
          contentType: 'audio/webm',
          cacheControl: '3600',
        });
      
      if (error) {
        console.error("Error al subir el audio:", error);
        return "Error al guardar el audio";
      }
      
      // Obtener URL pública del audio
      const { data: publicUrlData } = supabase.storage
        .from('consultation-audios')
        .getPublicUrl(fileName);
      
      audioUrl = publicUrlData.publicUrl;
    }
    
    // Si tenemos datos del paciente, intentamos crear/actualizar el paciente
    let patientId: string | undefined = consultation.patientId;
    
    if (consultation.patientData && !patientId) {
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
      }
    }
    
    // Guardar la consulta en la base de datos
    const { error } = await supabase
      .from('consultations')
      .insert({
        id: consultation.id,
        user_id: (await supabase.auth.getUser()).data.user?.id,
        patient_name: consultation.patientName,
        date_time: consultation.dateTime,
        audio_url: audioUrl,
        transcription: consultation.transcription,
        summary: consultation.summary,
        patient_data: consultation.patientData,
        patient_id: patientId
      });
    
    if (error) {
      console.error("Error al guardar la consulta:", error);
      return "Error al guardar la consulta";
    }
    
    return null; // Sin errores
  } catch (error) {
    console.error("Error en saveConsultation:", error);
    return "Error al guardar la consulta";
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

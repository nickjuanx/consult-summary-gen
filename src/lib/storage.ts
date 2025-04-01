
import { ConsultationRecord } from "@/types";
import { supabase } from "@/integrations/supabase/client";

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
        patient_data: consultation.patientData
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
      patientData: item.patient_data
    })) || [];
  } catch (error) {
    console.error("Error en getConsultations:", error);
    return [];
  }
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
        patient_data: consultation.patientData
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

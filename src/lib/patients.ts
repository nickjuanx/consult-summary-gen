
import { Patient } from "@/types";
import { supabase } from "@/integrations/supabase/client";

// Guardar un nuevo paciente o actualizar uno existente
export const savePatient = async (patient: Omit<Patient, "id"> & { id?: string }): Promise<{ id: string; error: string | null }> => {
  try {
    const userId = (await supabase.auth.getUser()).data.user?.id;
    
    if (!userId) {
      return { id: '', error: "Usuario no autenticado" };
    }
    
    // Si el paciente tiene un ID, actualizamos sus datos
    if (patient.id) {
      const { error } = await supabase
        .from('patients')
        .update({
          name: patient.name,
          dni: patient.dni,
          phone: patient.phone,
          age: patient.age,
          email: patient.email,
          notes: patient.notes
        })
        .eq('id', patient.id);
      
      if (error) {
        console.error("Error al actualizar el paciente:", error);
        return { id: patient.id, error: "Error al actualizar el paciente" };
      }
      
      return { id: patient.id, error: null };
    } 
    // Si no tiene ID, creamos un nuevo paciente
    else {
      const { data, error } = await supabase
        .from('patients')
        .insert({
          user_id: userId,
          name: patient.name,
          dni: patient.dni,
          phone: patient.phone,
          age: patient.age,
          email: patient.email,
          notes: patient.notes
        })
        .select('id')
        .single();
      
      if (error) {
        console.error("Error al crear el paciente:", error);
        return { id: '', error: "Error al crear el paciente" };
      }
      
      return { id: data.id, error: null };
    }
  } catch (error) {
    console.error("Error en savePatient:", error);
    return { id: '', error: "Error al guardar el paciente" };
  }
};

// Obtener todos los pacientes del usuario actual
export const getPatients = async (startDate?: Date, endDate?: Date): Promise<Patient[]> => {
  try {
    // Obtenemos todos los pacientes
    const { data: patients, error } = await supabase
      .from('patients')
      .select('*')
      .order('name');
    
    if (error) {
      console.error("Error al obtener pacientes:", error);
      return [];
    }

    // Para cada paciente, obtenemos su primera consulta
    const patientsWithFirstConsultation = await Promise.all(
      patients.map(async (patient) => {
        const { data: consultations, error: consultationsError } = await supabase
          .from('consultations')
          .select('date_time')
          .eq('patient_id', patient.id)
          .order('date_time', { ascending: true })
          .limit(1);

        let firstConsultationDate = null;
        if (!consultationsError && consultations && consultations.length > 0) {
          firstConsultationDate = consultations[0].date_time;
        }

        return {
          id: patient.id,
          name: patient.name,
          dni: patient.dni,
          phone: patient.phone,
          age: patient.age,
          email: patient.email,
          notes: patient.notes,
          firstConsultationDate
        };
      })
    );

    // Filtramos por fecha si se proporcionaron fechas
    let filteredPatients = patientsWithFirstConsultation;
    
    if (startDate || endDate) {
      filteredPatients = patientsWithFirstConsultation.filter(patient => {
        if (!patient.firstConsultationDate) return false;
        
        const consultDate = new Date(patient.firstConsultationDate);
        
        if (startDate && endDate) {
          return consultDate >= startDate && consultDate <= endDate;
        } else if (startDate) {
          return consultDate >= startDate;
        } else if (endDate) {
          return consultDate <= endDate;
        }
        
        return true;
      });
    }
    
    return filteredPatients;
  } catch (error) {
    console.error("Error en getPatients:", error);
    return [];
  }
};

// Obtener un paciente por su ID
export const getPatientById = async (id: string): Promise<Patient | null> => {
  try {
    const { data, error } = await supabase
      .from('patients')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error("Error al obtener el paciente:", error);
      return null;
    }
    
    return {
      id: data.id,
      name: data.name,
      dni: data.dni,
      phone: data.phone,
      age: data.age,
      email: data.email,
      notes: data.notes
    };
  } catch (error) {
    console.error("Error en getPatientById:", error);
    return null;
  }
};

// Buscar paciente por nombre o DNI
export const searchPatients = async (query: string): Promise<Patient[]> => {
  try {
    const { data, error } = await supabase
      .from('patients')
      .select('*')
      .or(`name.ilike.%${query}%,dni.ilike.%${query}%`)
      .order('name');
    
    if (error) {
      console.error("Error al buscar pacientes:", error);
      return [];
    }
    
    return data.map(item => ({
      id: item.id,
      name: item.name,
      dni: item.dni,
      phone: item.phone,
      age: item.age,
      email: item.email,
      notes: item.notes
    })) || [];
  } catch (error) {
    console.error("Error en searchPatients:", error);
    return [];
  }
};

// Eliminar un paciente
export const deletePatient = async (id: string): Promise<string | null> => {
  try {
    // First, check if there are consultations associated with this patient
    const { data: consultations, error: consultationsError } = await supabase
      .from('consultations')
      .select('id')
      .eq('patient_id', id);
    
    if (consultationsError) {
      console.error("Error al verificar consultas del paciente:", consultationsError);
      return "Error al eliminar el paciente: no se pudieron verificar consultas asociadas";
    }
    
    // Delete any associated consultations first to maintain referential integrity
    if (consultations && consultations.length > 0) {
      const { error: deleteConsultationsError } = await supabase
        .from('consultations')
        .delete()
        .eq('patient_id', id);
      
      if (deleteConsultationsError) {
        console.error("Error al eliminar consultas asociadas:", deleteConsultationsError);
        return "Error al eliminar consultas asociadas al paciente";
      }
    }
    
    // Now delete the patient
    const { error } = await supabase
      .from('patients')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error("Error al eliminar el paciente:", error);
      return `Error al eliminar el paciente: ${error.message}`;
    }
    
    return null; // Sin errores
  } catch (error) {
    console.error("Error en deletePatient:", error);
    return "Error al eliminar el paciente";
  }
};

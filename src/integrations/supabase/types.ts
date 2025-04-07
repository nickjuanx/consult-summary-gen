export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      appointments: {
        Row: {
          client_id: string
          created_at: string
          date: string
          id: string
          notes: string | null
          service_id: string
          status: string
          time: string
          user_id: string
        }
        Insert: {
          client_id: string
          created_at?: string
          date: string
          id?: string
          notes?: string | null
          service_id: string
          status?: string
          time: string
          user_id: string
        }
        Update: {
          client_id?: string
          created_at?: string
          date?: string
          id?: string
          notes?: string | null
          service_id?: string
          status?: string
          time?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          created_at: string
          email: string | null
          id: string
          name: string
          notes: string | null
          phone: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          phone: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string
          user_id?: string
        }
        Relationships: []
      }
      consultations: {
        Row: {
          audio_url: string | null
          created_at: string
          date_time: string
          id: string
          patient_data: Json | null
          patient_id: string | null
          patient_name: string
          summary: string | null
          transcription: string | null
          user_id: string
        }
        Insert: {
          audio_url?: string | null
          created_at?: string
          date_time?: string
          id?: string
          patient_data?: Json | null
          patient_id?: string | null
          patient_name: string
          summary?: string | null
          transcription?: string | null
          user_id: string
        }
        Update: {
          audio_url?: string | null
          created_at?: string
          date_time?: string
          id?: string
          patient_data?: Json | null
          patient_id?: string | null
          patient_name?: string
          summary?: string | null
          transcription?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "consultations_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      job_vacancies: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          location: string | null
          min_experience: number | null
          required_skills: string[] | null
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          location?: string | null
          min_experience?: number | null
          required_skills?: string[] | null
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          location?: string | null
          min_experience?: number | null
          required_skills?: string[] | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      patients: {
        Row: {
          age: string | null
          created_at: string
          dni: string | null
          email: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          user_id: string
        }
        Insert: {
          age?: string | null
          created_at?: string
          dni?: string | null
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          user_id: string
        }
        Update: {
          age?: string | null
          created_at?: string
          dni?: string | null
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          business_name: string | null
          created_at: string
          email: string | null
          id: string
        }
        Insert: {
          business_name?: string | null
          created_at?: string
          email?: string | null
          id: string
        }
        Update: {
          business_name?: string | null
          created_at?: string
          email?: string | null
          id?: string
        }
        Relationships: []
      }
      resumes: {
        Row: {
          created_at: string | null
          education: string | null
          experience: number | null
          id: string
          last_updated: string | null
          location: string | null
          match_score: number | null
          name: string
          skills: string[] | null
          title: string | null
        }
        Insert: {
          created_at?: string | null
          education?: string | null
          experience?: number | null
          id?: string
          last_updated?: string | null
          location?: string | null
          match_score?: number | null
          name: string
          skills?: string[] | null
          title?: string | null
        }
        Update: {
          created_at?: string | null
          education?: string | null
          experience?: number | null
          id?: string
          last_updated?: string | null
          location?: string | null
          match_score?: number | null
          name?: string
          skills?: string[] | null
          title?: string | null
        }
        Relationships: []
      }
      services: {
        Row: {
          created_at: string
          duration: number
          id: string
          name: string
          price: number
          user_id: string
        }
        Insert: {
          created_at?: string
          duration: number
          id?: string
          name: string
          price: number
          user_id: string
        }
        Update: {
          created_at?: string
          duration?: number
          id?: string
          name?: string
          price?: number
          user_id?: string
        }
        Relationships: []
      }
      shared_api_keys: {
        Row: {
          api_key: string
          created_at: string
          id: string
          service_name: string
        }
        Insert: {
          api_key: string
          created_at?: string
          id?: string
          service_name: string
        }
        Update: {
          api_key?: string
          created_at?: string
          id?: string
          service_name?: string
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          created_at: string
          email: string | null
          id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const

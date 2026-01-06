// AVOID UPDATING THIS FILE DIRECTLY. It is automatically generated.
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: '14.1'
  }
  public: {
    Tables: {
      reurb_audit_processes: {
        Row: {
          action: string
          created_at: string | null
          details: string | null
          id: string
          target_id: string
          target_type: string
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          details?: string | null
          id?: string
          target_id: string
          target_type: string
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          details?: string | null
          id?: string
          target_id?: string
          target_type?: string
          user_id?: string | null
        }
        Relationships: []
      }
      reurb_contracts: {
        Row: {
          created_at: string | null
          document_url: string | null
          id: string
          property_id: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          document_url?: string | null
          id?: string
          property_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          document_url?: string | null
          id?: string
          property_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'reurb_contracts_property_id_fkey'
            columns: ['property_id']
            isOneToOne: false
            referencedRelation: 'reurb_properties'
            referencedColumns: ['id']
          },
        ]
      }
      reurb_map_layers: {
        Row: {
          created_at: string | null
          data: Json
          id: string
          name: string
          project_id: string | null
          type: string
          visible: boolean | null
          z_index: number | null
        }
        Insert: {
          created_at?: string | null
          data: Json
          id?: string
          name: string
          project_id?: string | null
          type: string
          visible?: boolean | null
          z_index?: number | null
        }
        Update: {
          created_at?: string | null
          data?: Json
          id?: string
          name?: string
          project_id?: string | null
          type?: string
          visible?: boolean | null
          z_index?: number | null
        }
        Relationships: [
          {
            foreignKeyName: 'reurb_map_layers_project_id_fkey'
            columns: ['project_id']
            isOneToOne: false
            referencedRelation: 'reurb_projects'
            referencedColumns: ['id']
          },
        ]
      }
      reurb_owners: {
        Row: {
          contact: string | null
          created_at: string | null
          document: string | null
          full_name: string
          id: string
          property_id: string | null
          updated_at: string | null
        }
        Insert: {
          contact?: string | null
          created_at?: string | null
          document?: string | null
          full_name: string
          id?: string
          property_id?: string | null
          updated_at?: string | null
        }
        Update: {
          contact?: string | null
          created_at?: string | null
          document?: string | null
          full_name?: string
          id?: string
          property_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'reurb_owners_property_id_fkey'
            columns: ['property_id']
            isOneToOne: false
            referencedRelation: 'reurb_properties'
            referencedColumns: ['id']
          },
        ]
      }
      reurb_profiles: {
        Row: {
          created_at: string | null
          full_name: string | null
          id: string
          role: string | null
          updated_at: string | null
          username: string | null
        }
        Insert: {
          created_at?: string | null
          full_name?: string | null
          id: string
          role?: string | null
          updated_at?: string | null
          username?: string | null
        }
        Update: {
          created_at?: string | null
          full_name?: string | null
          id?: string
          role?: string | null
          updated_at?: string | null
          username?: string | null
        }
        Relationships: []
      }
      reurb_project_checkpoints: {
        Row: {
          created_at: string | null
          id: string
          name: string
          project_id: string | null
          snapshot_data: Json
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          project_id?: string | null
          snapshot_data: Json
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          project_id?: string | null
          snapshot_data?: Json
        }
        Relationships: [
          {
            foreignKeyName: 'reurb_project_checkpoints_project_id_fkey'
            columns: ['project_id']
            isOneToOne: false
            referencedRelation: 'reurb_projects'
            referencedColumns: ['id']
          },
        ]
      }
      reurb_projects: {
        Row: {
          auto_update_map: boolean | null
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          image_url: string | null
          last_map_update: string | null
          latitude: number | null
          longitude: number | null
          name: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          auto_update_map?: boolean | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          last_map_update?: string | null
          latitude?: number | null
          longitude?: number | null
          name: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          auto_update_map?: boolean | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          last_map_update?: string | null
          latitude?: number | null
          longitude?: number | null
          name?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      reurb_properties: {
        Row: {
          address: string | null
          area: string | null
          created_at: string | null
          description: string | null
          id: string
          images: string[] | null
          latitude: number | null
          longitude: number | null
          name: string
          quadra_id: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          area?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          images?: string[] | null
          latitude?: number | null
          longitude?: number | null
          name: string
          quadra_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          area?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          images?: string[] | null
          latitude?: number | null
          longitude?: number | null
          name?: string
          quadra_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'reurb_properties_quadra_id_fkey'
            columns: ['quadra_id']
            isOneToOne: false
            referencedRelation: 'reurb_quadras'
            referencedColumns: ['id']
          },
        ]
      }
      reurb_quadras: {
        Row: {
          area: string | null
          created_at: string | null
          document_url: string | null
          id: string
          image_url: string | null
          name: string
          project_id: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          area?: string | null
          created_at?: string | null
          document_url?: string | null
          id?: string
          image_url?: string | null
          name: string
          project_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          area?: string | null
          created_at?: string | null
          document_url?: string | null
          id?: string
          image_url?: string | null
          name?: string
          project_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'reurb_quadras_project_id_fkey'
            columns: ['project_id']
            isOneToOne: false
            referencedRelation: 'reurb_projects'
            referencedColumns: ['id']
          },
        ]
      }
      reurb_surveys: {
        Row: {
          acquisition_mode: string | null
          applicant_civil_status: string | null
          applicant_cpf: string | null
          applicant_income: string | null
          applicant_name: string | null
          applicant_nis: string | null
          applicant_profession: string | null
          applicant_rg: string | null
          city: string | null
          conservation_state: string | null
          construction_type: string | null
          created_at: string | null
          energy_supply: string | null
          fencing: string | null
          floor_type: string | null
          form_number: string | null
          has_children: boolean | null
          id: string
          observations: string | null
          occupation_time: string | null
          property_id: string
          property_use: string | null
          residents_count: number | null
          roof_type: string | null
          rooms_count: number | null
          sanitation: string | null
          spouse_cpf: string | null
          spouse_name: string | null
          state: string | null
          street_paving: string | null
          survey_date: string | null
          surveyor_name: string | null
          updated_at: string | null
          water_supply: string | null
        }
        Insert: {
          acquisition_mode?: string | null
          applicant_civil_status?: string | null
          applicant_cpf?: string | null
          applicant_income?: string | null
          applicant_name?: string | null
          applicant_nis?: string | null
          applicant_profession?: string | null
          applicant_rg?: string | null
          city?: string | null
          conservation_state?: string | null
          construction_type?: string | null
          created_at?: string | null
          energy_supply?: string | null
          fencing?: string | null
          floor_type?: string | null
          form_number?: string | null
          has_children?: boolean | null
          id?: string
          observations?: string | null
          occupation_time?: string | null
          property_id: string
          property_use?: string | null
          residents_count?: number | null
          roof_type?: string | null
          rooms_count?: number | null
          sanitation?: string | null
          spouse_cpf?: string | null
          spouse_name?: string | null
          state?: string | null
          street_paving?: string | null
          survey_date?: string | null
          surveyor_name?: string | null
          updated_at?: string | null
          water_supply?: string | null
        }
        Update: {
          acquisition_mode?: string | null
          applicant_civil_status?: string | null
          applicant_cpf?: string | null
          applicant_income?: string | null
          applicant_name?: string | null
          applicant_nis?: string | null
          applicant_profession?: string | null
          applicant_rg?: string | null
          city?: string | null
          conservation_state?: string | null
          construction_type?: string | null
          created_at?: string | null
          energy_supply?: string | null
          fencing?: string | null
          floor_type?: string | null
          form_number?: string | null
          has_children?: boolean | null
          id?: string
          observations?: string | null
          occupation_time?: string | null
          property_id?: string
          property_use?: string | null
          residents_count?: number | null
          roof_type?: string | null
          rooms_count?: number | null
          sanitation?: string | null
          spouse_cpf?: string | null
          spouse_name?: string | null
          state?: string | null
          street_paving?: string | null
          survey_date?: string | null
          surveyor_name?: string | null
          updated_at?: string | null
          water_supply?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'reurb_surveys_property_id_fkey'
            columns: ['property_id']
            isOneToOne: false
            referencedRelation: 'reurb_properties'
            referencedColumns: ['id']
          },
        ]
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

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] &
        DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] &
        DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema['Enums']
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const

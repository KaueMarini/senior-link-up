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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      ai_profile_summaries: {
        Row: {
          bridge_data: Json
          id: string
          readiness_score: number
          role: string
          summary_data: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          bridge_data?: Json
          id?: string
          readiness_score?: number
          role: string
          summary_data?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          bridge_data?: Json
          id?: string
          readiness_score?: number
          role?: string
          summary_data?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      appointments: {
        Row: {
          created_at: string
          cuidador_id: string | null
          data_hora: string
          descricao: string | null
          id: string
          status: string
          tipo: string
          titulo: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          cuidador_id?: string | null
          data_hora: string
          descricao?: string | null
          id?: string
          status?: string
          tipo?: string
          titulo: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          cuidador_id?: string | null
          data_hora?: string
          descricao?: string | null
          id?: string
          status?: string
          tipo?: string
          titulo?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_cuidador_id_fkey"
            columns: ["cuidador_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      caregiver_reviews: {
        Row: {
          created_at: string
          cuidador_id: string
          id: string
          mensagem: string | null
          tipo: string
          user_id: string
        }
        Insert: {
          created_at?: string
          cuidador_id: string
          id?: string
          mensagem?: string | null
          tipo?: string
          user_id: string
        }
        Update: {
          created_at?: string
          cuidador_id?: string
          id?: string
          mensagem?: string | null
          tipo?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "caregiver_reviews_cuidador_id_fkey"
            columns: ["cuidador_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      certificates: {
        Row: {
          arquivo_url: string | null
          created_at: string
          data_conclusao: string | null
          id: string
          instituicao: string | null
          nome: string
          user_id: string
          verificado: boolean | null
        }
        Insert: {
          arquivo_url?: string | null
          created_at?: string
          data_conclusao?: string | null
          id?: string
          instituicao?: string | null
          nome: string
          user_id: string
          verificado?: boolean | null
        }
        Update: {
          arquivo_url?: string | null
          created_at?: string
          data_conclusao?: string | null
          id?: string
          instituicao?: string | null
          nome?: string
          user_id?: string
          verificado?: boolean | null
        }
        Relationships: []
      }
      chat_conversations: {
        Row: {
          created_at: string
          cuidador_id: string
          id: string
          responsavel_id: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          cuidador_id: string
          id?: string
          responsavel_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          cuidador_id?: string
          id?: string
          responsavel_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          read: boolean
          sender_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          read?: boolean
          sender_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          read?: boolean
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "chat_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      dependentes: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          data_nascimento: string | null
          diagnosticos: string[] | null
          id: string
          medicamentos_ativos: string | null
          nivel_dependencia: string | null
          nome: string
          observacoes: string | null
          responsavel_id: string
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          data_nascimento?: string | null
          diagnosticos?: string[] | null
          id?: string
          medicamentos_ativos?: string | null
          nivel_dependencia?: string | null
          nome: string
          observacoes?: string | null
          responsavel_id: string
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          data_nascimento?: string | null
          diagnosticos?: string[] | null
          id?: string
          medicamentos_ativos?: string | null
          nivel_dependencia?: string | null
          nome?: string
          observacoes?: string | null
          responsavel_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      favorites: {
        Row: {
          created_at: string
          cuidador_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          cuidador_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          cuidador_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_cuidador_id_fkey"
            columns: ["cuidador_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      mediated_chat_messages: {
        Row: {
          author_role: string
          content: string
          conversation_id: string
          created_at: string
          id: string
          message_kind: string
          owner_user_id: string | null
          visible_to_role: string
        }
        Insert: {
          author_role: string
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          message_kind?: string
          owner_user_id?: string | null
          visible_to_role: string
        }
        Update: {
          author_role?: string
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          message_kind?: string
          owner_user_id?: string | null
          visible_to_role?: string
        }
        Relationships: []
      }
      medical_exams: {
        Row: {
          appointment_id: string | null
          arquivo_url: string | null
          created_at: string
          data_exame: string | null
          descricao: string | null
          id: string
          nome: string
          user_id: string
        }
        Insert: {
          appointment_id?: string | null
          arquivo_url?: string | null
          created_at?: string
          data_exame?: string | null
          descricao?: string | null
          id?: string
          nome: string
          user_id: string
        }
        Update: {
          appointment_id?: string | null
          arquivo_url?: string | null
          created_at?: string
          data_exame?: string | null
          descricao?: string | null
          id?: string
          nome?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "medical_exams_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
        ]
      }
      medications: {
        Row: {
          ativo: boolean
          created_at: string
          data_fim: string | null
          data_inicio: string | null
          dias_semana: string[] | null
          dosagem: string | null
          frequencia: string
          horarios: string[] | null
          id: string
          nome: string
          observacoes: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          data_fim?: string | null
          data_inicio?: string | null
          dias_semana?: string[] | null
          dosagem?: string | null
          frequencia?: string
          horarios?: string[] | null
          id?: string
          nome: string
          observacoes?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          data_fim?: string | null
          data_inicio?: string | null
          dias_semana?: string[] | null
          dosagem?: string | null
          frequencia?: string
          horarios?: string[] | null
          id?: string
          nome?: string
          observacoes?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          banner_url: string | null
          bio: string | null
          cidade: string | null
          cpf: string | null
          created_at: string
          disponibilidade: string | null
          especialidade: string | null
          estado: string | null
          experiencia: string | null
          formacao: string | null
          id: string
          nome: string
          perfil: string
          preco_diaria: string | null
          telefone: string | null
          updated_at: string
          user_id: string
          verificado: boolean | null
        }
        Insert: {
          avatar_url?: string | null
          banner_url?: string | null
          bio?: string | null
          cidade?: string | null
          cpf?: string | null
          created_at?: string
          disponibilidade?: string | null
          especialidade?: string | null
          estado?: string | null
          experiencia?: string | null
          formacao?: string | null
          id?: string
          nome?: string
          perfil?: string
          preco_diaria?: string | null
          telefone?: string | null
          updated_at?: string
          user_id: string
          verificado?: boolean | null
        }
        Update: {
          avatar_url?: string | null
          banner_url?: string | null
          bio?: string | null
          cidade?: string | null
          cpf?: string | null
          created_at?: string
          disponibilidade?: string | null
          especialidade?: string | null
          estado?: string | null
          experiencia?: string | null
          formacao?: string | null
          id?: string
          nome?: string
          perfil?: string
          preco_diaria?: string | null
          telefone?: string | null
          updated_at?: string
          user_id?: string
          verificado?: boolean | null
        }
        Relationships: []
      }
      proposals: {
        Row: {
          conversation_id: string
          created_at: string
          cuidador_accepted: boolean
          cuidador_id: string
          horarios: string | null
          id: string
          mensagem: string | null
          periodo: string | null
          regras: string[]
          responsavel_accepted: boolean
          responsavel_id: string
          status: string
          tarefas: string[]
          updated_at: string
          valor: string | null
        }
        Insert: {
          conversation_id: string
          created_at?: string
          cuidador_accepted?: boolean
          cuidador_id: string
          horarios?: string | null
          id?: string
          mensagem?: string | null
          periodo?: string | null
          regras?: string[]
          responsavel_accepted?: boolean
          responsavel_id: string
          status?: string
          tarefas?: string[]
          updated_at?: string
          valor?: string | null
        }
        Update: {
          conversation_id?: string
          created_at?: string
          cuidador_accepted?: boolean
          cuidador_id?: string
          horarios?: string | null
          id?: string
          mensagem?: string | null
          periodo?: string | null
          regras?: string[]
          responsavel_accepted?: boolean
          responsavel_id?: string
          status?: string
          tarefas?: string[]
          updated_at?: string
          valor?: string | null
        }
        Relationships: []
      }
      video_tips: {
        Row: {
          categoria: string
          created_at: string
          descricao: string | null
          id: string
          ordem: number | null
          thumbnail_url: string | null
          titulo: string
          url: string
        }
        Insert: {
          categoria?: string
          created_at?: string
          descricao?: string | null
          id?: string
          ordem?: number | null
          thumbnail_url?: string | null
          titulo: string
          url: string
        }
        Update: {
          categoria?: string
          created_at?: string
          descricao?: string | null
          id?: string
          ordem?: number | null
          thumbnail_url?: string | null
          titulo?: string
          url?: string
        }
        Relationships: []
      }
      vinculos: {
        Row: {
          created_at: string | null
          cuidador_profile_id: string
          dependente_id: string
          id: string
          proposta_texto: string | null
          responsavel_id: string
          status: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          cuidador_profile_id: string
          dependente_id: string
          id?: string
          proposta_texto?: string | null
          responsavel_id: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          cuidador_profile_id?: string
          dependente_id?: string
          id?: string
          proposta_texto?: string | null
          responsavel_id?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vinculos_cuidador_profile_id_fkey"
            columns: ["cuidador_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vinculos_dependente_id_fkey"
            columns: ["dependente_id"]
            isOneToOne: false
            referencedRelation: "dependentes"
            referencedColumns: ["id"]
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

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const

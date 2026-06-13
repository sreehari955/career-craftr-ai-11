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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      alert_matches: {
        Row: {
          alert_id: string
          created_at: string
          id: string
          job_id: string
          seen: boolean
          user_id: string
        }
        Insert: {
          alert_id: string
          created_at?: string
          id?: string
          job_id: string
          seen?: boolean
          user_id: string
        }
        Update: {
          alert_id?: string
          created_at?: string
          id?: string
          job_id?: string
          seen?: boolean
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "alert_matches_alert_id_fkey"
            columns: ["alert_id"]
            isOneToOne: false
            referencedRelation: "job_alerts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alert_matches_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      applications: {
        Row: {
          applied_at: string | null
          company: string
          contact: string | null
          created_at: string
          id: string
          job_id: string | null
          link: string | null
          notes: string | null
          resume_id: string | null
          role: string
          status: Database["public"]["Enums"]["application_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          applied_at?: string | null
          company: string
          contact?: string | null
          created_at?: string
          id?: string
          job_id?: string | null
          link?: string | null
          notes?: string | null
          resume_id?: string | null
          role: string
          status?: Database["public"]["Enums"]["application_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          applied_at?: string | null
          company?: string
          contact?: string | null
          created_at?: string
          id?: string
          job_id?: string | null
          link?: string | null
          notes?: string | null
          resume_id?: string | null
          role?: string
          status?: Database["public"]["Enums"]["application_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "applications_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_resume_id_fkey"
            columns: ["resume_id"]
            isOneToOne: false
            referencedRelation: "resumes"
            referencedColumns: ["id"]
          },
        ]
      }
      cover_letters: {
        Row: {
          content: string
          created_at: string
          id: string
          job_id: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          job_id?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          job_id?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cover_letters_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      interview_sessions: {
        Row: {
          answers: Json
          created_at: string
          feedback: Json
          id: string
          job_id: string | null
          questions: Json
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          answers?: Json
          created_at?: string
          feedback?: Json
          id?: string
          job_id?: string | null
          questions?: Json
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          answers?: Json
          created_at?: string
          feedback?: Json
          id?: string
          job_id?: string | null
          questions?: Json
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "interview_sessions_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      job_alerts: {
        Row: {
          active: boolean
          created_at: string
          id: string
          job_types: string[]
          keywords: string[]
          last_checked_at: string | null
          locations: string[]
          modes: string[]
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          job_types?: string[]
          keywords?: string[]
          last_checked_at?: string | null
          locations?: string[]
          modes?: string[]
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          job_types?: string[]
          keywords?: string[]
          last_checked_at?: string | null
          locations?: string[]
          modes?: string[]
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      jobs: {
        Row: {
          apply_url: string | null
          company: string
          description: string
          id: string
          job_type: string
          location: string
          mode: string
          posted_at: string
          requirements: string[] | null
          skills: string[] | null
          stipend: string | null
          title: string
        }
        Insert: {
          apply_url?: string | null
          company: string
          description: string
          id?: string
          job_type: string
          location: string
          mode: string
          posted_at?: string
          requirements?: string[] | null
          skills?: string[] | null
          stipend?: string | null
          title: string
        }
        Update: {
          apply_url?: string | null
          company?: string
          description?: string
          id?: string
          job_type?: string
          location?: string
          mode?: string
          posted_at?: string
          requirements?: string[] | null
          skills?: string[] | null
          stipend?: string | null
          title?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount_paise: number
          created_at: string
          currency: string
          id: string
          notes: Json
          plan: string
          razorpay_order_id: string
          razorpay_payment_id: string | null
          razorpay_signature: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount_paise: number
          created_at?: string
          currency?: string
          id?: string
          notes?: Json
          plan: string
          razorpay_order_id: string
          razorpay_payment_id?: string | null
          razorpay_signature?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount_paise?: number
          created_at?: string
          currency?: string
          id?: string
          notes?: Json
          plan?: string
          razorpay_order_id?: string
          razorpay_payment_id?: string | null
          razorpay_signature?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          cgpa: number | null
          college: string | null
          created_at: string
          degree: string | null
          full_name: string | null
          github_url: string | null
          goals: string[] | null
          graduation_year: number | null
          headline: string | null
          id: string
          is_premium: boolean
          linkedin_url: string | null
          location: string | null
          onboarded: boolean
          phone: string | null
          portfolio_url: string | null
          preferred_locations: string[] | null
          preferred_roles: string[] | null
          skills: string[] | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          cgpa?: number | null
          college?: string | null
          created_at?: string
          degree?: string | null
          full_name?: string | null
          github_url?: string | null
          goals?: string[] | null
          graduation_year?: number | null
          headline?: string | null
          id: string
          is_premium?: boolean
          linkedin_url?: string | null
          location?: string | null
          onboarded?: boolean
          phone?: string | null
          portfolio_url?: string | null
          preferred_locations?: string[] | null
          preferred_roles?: string[] | null
          skills?: string[] | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          cgpa?: number | null
          college?: string | null
          created_at?: string
          degree?: string | null
          full_name?: string | null
          github_url?: string | null
          goals?: string[] | null
          graduation_year?: number | null
          headline?: string | null
          id?: string
          is_premium?: boolean
          linkedin_url?: string | null
          location?: string | null
          onboarded?: boolean
          phone?: string | null
          portfolio_url?: string | null
          preferred_locations?: string[] | null
          preferred_roles?: string[] | null
          skills?: string[] | null
          updated_at?: string
        }
        Relationships: []
      }
      resumes: {
        Row: {
          ats_feedback: Json | null
          ats_score: number | null
          content: Json
          created_at: string
          id: string
          is_master: boolean
          job_id: string | null
          name: string
          parent_resume_id: string | null
          updated_at: string
          user_id: string
          version: number
        }
        Insert: {
          ats_feedback?: Json | null
          ats_score?: number | null
          content?: Json
          created_at?: string
          id?: string
          is_master?: boolean
          job_id?: string | null
          name: string
          parent_resume_id?: string | null
          updated_at?: string
          user_id: string
          version?: number
        }
        Update: {
          ats_feedback?: Json | null
          ats_score?: number | null
          content?: Json
          created_at?: string
          id?: string
          is_master?: boolean
          job_id?: string | null
          name?: string
          parent_resume_id?: string | null
          updated_at?: string
          user_id?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "resumes_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resumes_parent_resume_id_fkey"
            columns: ["parent_resume_id"]
            isOneToOne: false
            referencedRelation: "resumes"
            referencedColumns: ["id"]
          },
        ]
      }
      site_settings: {
        Row: {
          key: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          updated_by?: string | null
          value: Json
        }
        Update: {
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      application_status:
        | "saved"
        | "applied"
        | "interview"
        | "offer"
        | "rejected"
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
    Enums: {
      app_role: ["admin", "moderator", "user"],
      application_status: [
        "saved",
        "applied",
        "interview",
        "offer",
        "rejected",
      ],
    },
  },
} as const

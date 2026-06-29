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
      activity_logs: {
        Row: {
          action: Database["public"]["Enums"]["activity_action"]
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          meta: Json | null
          user_id: string | null
        }
        Insert: {
          action: Database["public"]["Enums"]["activity_action"]
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
          meta?: Json | null
          user_id?: string | null
        }
        Update: {
          action?: Database["public"]["Enums"]["activity_action"]
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          meta?: Json | null
          user_id?: string | null
        }
        Relationships: []
      }
      app_settings: {
        Row: {
          default_locale: string
          default_theme: string
          icp_weights: Json
          id: number
          logo_url: string | null
          updated_at: string
        }
        Insert: {
          default_locale?: string
          default_theme?: string
          icp_weights?: Json
          id?: number
          logo_url?: string | null
          updated_at?: string
        }
        Update: {
          default_locale?: string
          default_theme?: string
          icp_weights?: Json
          id?: number
          logo_url?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      companies: {
        Row: {
          archived_at: string | null
          contact_person: string | null
          created_at: string
          created_by: string | null
          email: string | null
          icp_accessibility: number
          icp_consumption: number
          icp_frequency: number
          icp_profitability: number
          icp_score: number | null
          icp_sector_fit: number
          icp_strategic: number
          icp_tier: string | null
          id: string
          linkedin: string | null
          location: string | null
          logo_url: string | null
          name: string
          notes: string | null
          phone: string | null
          sector_id: string | null
          status: string | null
          type: Database["public"]["Enums"]["company_type"]
          updated_at: string
          website: string | null
        }
        Insert: {
          archived_at?: string | null
          contact_person?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          icp_accessibility?: number
          icp_consumption?: number
          icp_frequency?: number
          icp_profitability?: number
          icp_score?: number | null
          icp_sector_fit?: number
          icp_strategic?: number
          icp_tier?: string | null
          id?: string
          linkedin?: string | null
          location?: string | null
          logo_url?: string | null
          name: string
          notes?: string | null
          phone?: string | null
          sector_id?: string | null
          status?: string | null
          type?: Database["public"]["Enums"]["company_type"]
          updated_at?: string
          website?: string | null
        }
        Update: {
          archived_at?: string | null
          contact_person?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          icp_accessibility?: number
          icp_consumption?: number
          icp_frequency?: number
          icp_profitability?: number
          icp_score?: number | null
          icp_sector_fit?: number
          icp_strategic?: number
          icp_tier?: string | null
          id?: string
          linkedin?: string | null
          location?: string | null
          logo_url?: string | null
          name?: string
          notes?: string | null
          phone?: string | null
          sector_id?: string | null
          status?: string | null
          type?: Database["public"]["Enums"]["company_type"]
          updated_at?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "companies_sector_id_fkey"
            columns: ["sector_id"]
            isOneToOne: false
            referencedRelation: "sectors"
            referencedColumns: ["id"]
          },
        ]
      }
      company_notes: {
        Row: {
          archived_at: string | null
          company_id: string
          created_at: string
          created_by: string | null
          id: string
          note: string
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          company_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          note: string
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          company_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          note?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_notes_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      company_products: {
        Row: {
          company_id: string
          created_at: string
          created_by: string | null
          id: string
          notes: string | null
          product_id: string
        }
        Insert: {
          company_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          product_id: string
        }
        Update: {
          company_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_products_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      contacts: {
        Row: {
          archived_at: string | null
          avatar_url: string | null
          company_id: string | null
          created_at: string
          created_by: string | null
          email: string | null
          full_name: string
          id: string
          is_primary: boolean
          job_title: string | null
          linkedin: string | null
          notes: string | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          avatar_url?: string | null
          company_id?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          full_name: string
          id?: string
          is_primary?: boolean
          job_title?: string | null
          linkedin?: string | null
          notes?: string | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          avatar_url?: string | null
          company_id?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          full_name?: string
          id?: string
          is_primary?: boolean
          job_title?: string | null
          linkedin?: string | null
          notes?: string | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contacts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      extra_fields: {
        Row: {
          created_at: string
          created_by: string | null
          entity_id: string
          entity_type: string
          id: string
          label: string
          updated_at: string
          value: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          entity_id: string
          entity_type: string
          id?: string
          label: string
          updated_at?: string
          value: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          entity_id?: string
          entity_type?: string
          id?: string
          label?: string
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      meetings: {
        Row: {
          archived_at: string | null
          attendees: string[]
          company_id: string | null
          created_at: string
          created_by: string | null
          decisions: string | null
          id: string
          meeting_date: string
          notes: string | null
          opportunity_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          attendees?: string[]
          company_id?: string | null
          created_at?: string
          created_by?: string | null
          decisions?: string | null
          id?: string
          meeting_date?: string
          notes?: string | null
          opportunity_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          attendees?: string[]
          company_id?: string | null
          created_at?: string
          created_by?: string | null
          decisions?: string | null
          id?: string
          meeting_date?: string
          notes?: string | null
          opportunity_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "meetings_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meetings_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          read_at: string | null
          title: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          read_at?: string | null
          title: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          read_at?: string | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      opportunities: {
        Row: {
          archived_at: string | null
          blockers: string | null
          company_id: string
          created_at: string
          deadline: string | null
          expected_profit: number | null
          expected_revenue: number | null
          expected_tons: number | null
          id: string
          next_action: string | null
          owner_id: string | null
          pipeline_status: Database["public"]["Enums"]["pipeline_status"]
          product_id: string | null
          title: string | null
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          blockers?: string | null
          company_id: string
          created_at?: string
          deadline?: string | null
          expected_profit?: number | null
          expected_revenue?: number | null
          expected_tons?: number | null
          id?: string
          next_action?: string | null
          owner_id?: string | null
          pipeline_status?: Database["public"]["Enums"]["pipeline_status"]
          product_id?: string | null
          title?: string | null
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          blockers?: string | null
          company_id?: string
          created_at?: string
          deadline?: string | null
          expected_profit?: number | null
          expected_revenue?: number | null
          expected_tons?: number | null
          id?: string
          next_action?: string | null
          owner_id?: string | null
          pipeline_status?: Database["public"]["Enums"]["pipeline_status"]
          product_id?: string | null
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "opportunities_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunities_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          archived_at: string | null
          created_at: string
          default_margin: number | null
          description: string | null
          id: string
          name_ar: string
          name_en: string
          sector_id: string | null
          specialty: string | null
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          created_at?: string
          default_margin?: number | null
          description?: string | null
          id?: string
          name_ar: string
          name_en: string
          sector_id?: string | null
          specialty?: string | null
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          created_at?: string
          default_margin?: number | null
          description?: string | null
          id?: string
          name_ar?: string
          name_en?: string
          sector_id?: string | null
          specialty?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_sector_id_fkey"
            columns: ["sector_id"]
            isOneToOne: false
            referencedRelation: "sectors"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          locale: string
          theme: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          locale?: string
          theme?: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          locale?: string
          theme?: string
          updated_at?: string
        }
        Relationships: []
      }
      sales_records: {
        Row: {
          archived_at: string | null
          company_id: string
          created_at: string
          created_by: string | null
          id: string
          margin: number | null
          opportunity_id: string | null
          period_month: string
          product_id: string | null
          profit: number
          revenue: number
          tons: number
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          company_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          margin?: number | null
          opportunity_id?: string | null
          period_month: string
          product_id?: string | null
          profit?: number
          revenue?: number
          tons?: number
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          company_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          margin?: number | null
          opportunity_id?: string | null
          period_month?: string
          product_id?: string | null
          profit?: number
          revenue?: number
          tons?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sales_records_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_records_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_records_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      sectors: {
        Row: {
          archived_at: string | null
          created_at: string
          id: string
          name_ar: string
          name_en: string
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          created_at?: string
          id?: string
          name_ar: string
          name_en: string
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          created_at?: string
          id?: string
          name_ar?: string
          name_en?: string
          updated_at?: string
        }
        Relationships: []
      }
      task_comments: {
        Row: {
          body: string
          created_at: string
          id: string
          task_id: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          task_id: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          task_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_comments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          archived_at: string | null
          assignee_id: string | null
          company_id: string | null
          created_at: string
          created_by: string | null
          deadline: string | null
          description: string | null
          id: string
          opportunity_id: string | null
          priority: Database["public"]["Enums"]["task_priority"]
          status: Database["public"]["Enums"]["task_status"]
          title: string
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          assignee_id?: string | null
          company_id?: string | null
          created_at?: string
          created_by?: string | null
          deadline?: string | null
          description?: string | null
          id?: string
          opportunity_id?: string | null
          priority?: Database["public"]["Enums"]["task_priority"]
          status?: Database["public"]["Enums"]["task_status"]
          title: string
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          assignee_id?: string | null
          company_id?: string | null
          created_at?: string
          created_by?: string | null
          deadline?: string | null
          description?: string | null
          id?: string
          opportunity_id?: string | null
          priority?: Database["public"]["Enums"]["task_priority"]
          status?: Database["public"]["Enums"]["task_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
        ]
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
      is_staff: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      activity_action:
        | "created"
        | "edited"
        | "archived"
        | "restored"
        | "status_changed"
      app_role: "owner" | "admin" | "member"
      company_type: "customer" | "target" | "opportunity"
      pipeline_status:
        | "lead"
        | "contacted"
        | "qualified"
        | "negotiation"
        | "won"
        | "lost"
      task_priority: "low" | "medium" | "high" | "urgent"
      task_status: "todo" | "in_progress" | "blocked" | "completed"
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
      activity_action: [
        "created",
        "edited",
        "archived",
        "restored",
        "status_changed",
      ],
      app_role: ["owner", "admin", "member"],
      company_type: ["customer", "target", "opportunity"],
      pipeline_status: [
        "lead",
        "contacted",
        "qualified",
        "negotiation",
        "won",
        "lost",
      ],
      task_priority: ["low", "medium", "high", "urgent"],
      task_status: ["todo", "in_progress", "blocked", "completed"],
    },
  },
} as const

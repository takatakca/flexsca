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
      credit_purchases: {
        Row: {
          amount_cents: number
          created_at: string
          credits: number
          currency: string
          id: string
          status: string
          stripe_checkout_session_id: string
          stripe_payment_intent_id: string | null
          user_id: string
        }
        Insert: {
          amount_cents: number
          created_at?: string
          credits: number
          currency?: string
          id?: string
          status?: string
          stripe_checkout_session_id: string
          stripe_payment_intent_id?: string | null
          user_id: string
        }
        Update: {
          amount_cents?: number
          created_at?: string
          credits?: number
          currency?: string
          id?: string
          status?: string
          stripe_checkout_session_id?: string
          stripe_payment_intent_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "credit_purchases_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_transactions: {
        Row: {
          created_at: string
          delta: number
          id: string
          lead_id: string | null
          reason: string
          user_id: string
        }
        Insert: {
          created_at?: string
          delta: number
          id?: string
          lead_id?: string | null
          reason: string
          user_id: string
        }
        Update: {
          created_at?: string
          delta?: number
          id?: string
          lead_id?: string | null
          reason?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "credit_transactions_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credit_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_wallets: {
        Row: {
          balance: number
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "credit_wallets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_statuses: {
        Row: {
          agent_id: string
          category: string
          color: string
          created_at: string
          id: string
          is_default: boolean
          name: string
          sort_order: number
        }
        Insert: {
          agent_id: string
          category?: string
          color?: string
          created_at?: string
          id?: string
          is_default?: boolean
          name: string
          sort_order?: number
        }
        Update: {
          agent_id?: string
          category?: string
          color?: string
          created_at?: string
          id?: string
          is_default?: boolean
          name?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "custom_statuses_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_agent_state: {
        Row: {
          agent_id: string
          archived_at: string | null
          contacted: boolean
          contacted_at: string | null
          created_at: string
          custom_status_id: string | null
          first_to_respond: boolean
          is_archived: boolean
          is_unread: boolean
          lead_id: string
          updated_at: string
        }
        Insert: {
          agent_id: string
          archived_at?: string | null
          contacted?: boolean
          contacted_at?: string | null
          created_at?: string
          custom_status_id?: string | null
          first_to_respond?: boolean
          is_archived?: boolean
          is_unread?: boolean
          lead_id: string
          updated_at?: string
        }
        Update: {
          agent_id?: string
          archived_at?: string | null
          contacted?: boolean
          contacted_at?: string | null
          created_at?: string
          custom_status_id?: string | null
          first_to_respond?: boolean
          is_archived?: boolean
          is_unread?: boolean
          lead_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_agent_state_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_agent_state_custom_status_id_fkey"
            columns: ["custom_status_id"]
            isOneToOne: false
            referencedRelation: "custom_statuses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_agent_state_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_messages: {
        Row: {
          agent_id: string | null
          created_at: string
          id: string
          lead_id: string
          message: string
          read_at: string | null
          sender_type: string
        }
        Insert: {
          agent_id?: string | null
          created_at?: string
          id?: string
          lead_id: string
          message: string
          read_at?: string | null
          sender_type: string
        }
        Update: {
          agent_id?: string | null
          created_at?: string
          id?: string
          lead_id?: string
          message?: string
          read_at?: string | null
          sender_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_messages_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_messages_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_pricing_rules: {
        Row: {
          base_cost: number
          category: string
          id: string
        }
        Insert: {
          base_cost?: number
          category: string
          id?: string
        }
        Update: {
          base_cost?: number
          category?: string
          id?: string
        }
        Relationships: []
      }
      lead_purchases: {
        Row: {
          cost: number
          created_at: string
          id: string
          lead_id: string
          user_id: string
        }
        Insert: {
          cost: number
          created_at?: string
          id?: string
          lead_id: string
          user_id: string
        }
        Update: {
          cost?: number
          created_at?: string
          id?: string
          lead_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_purchases_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_purchases_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          answers: Json
          archived: boolean
          archived_at: string | null
          assigned_to: string | null
          category: string
          city: string | null
          created_at: string
          credits_cost: number
          customer_email: string | null
          customer_name: string | null
          customer_phone: string | null
          details: string | null
          has_additional_details: boolean
          id: string
          is_urgent: boolean
          last_activity_at: string
          location_text: string
          postal_code: string | null
          province: string | null
          service_subtype: string | null
          status: string
          submitted_at: string
          updated_at: string
        }
        Insert: {
          answers?: Json
          archived?: boolean
          archived_at?: string | null
          assigned_to?: string | null
          category: string
          city?: string | null
          created_at?: string
          credits_cost?: number
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          details?: string | null
          has_additional_details?: boolean
          id?: string
          is_urgent?: boolean
          last_activity_at?: string
          location_text: string
          postal_code?: string | null
          province?: string | null
          service_subtype?: string | null
          status?: string
          submitted_at?: string
          updated_at?: string
        }
        Update: {
          answers?: Json
          archived?: boolean
          archived_at?: string | null
          assigned_to?: string | null
          category?: string
          city?: string | null
          created_at?: string
          credits_cost?: number
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          details?: string | null
          has_additional_details?: boolean
          id?: string
          is_urgent?: boolean
          last_activity_at?: string
          location_text?: string
          postal_code?: string | null
          province?: string | null
          service_subtype?: string | null
          status?: string
          submitted_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "leads_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          onboarding_completed: boolean
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          id: string
          onboarding_completed?: boolean
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          onboarding_completed?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      provider_accreditations: {
        Row: {
          created_at: string
          id: string
          issuer: string | null
          name: string
          sort_order: number
          user_id: string
          year_obtained: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          issuer?: string | null
          name: string
          sort_order?: number
          user_id: string
          year_obtained?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          issuer?: string | null
          name?: string
          sort_order?: number
          user_id?: string
          year_obtained?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "provider_accreditations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      provider_photos: {
        Row: {
          caption: string | null
          created_at: string
          id: string
          sort_order: number
          url: string
          user_id: string
        }
        Insert: {
          caption?: string | null
          created_at?: string
          id?: string
          sort_order?: number
          url: string
          user_id: string
        }
        Update: {
          caption?: string | null
          created_at?: string
          id?: string
          sort_order?: number
          url?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "provider_photos_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      provider_profiles: {
        Row: {
          city: string | null
          company_description: string | null
          company_email: string | null
          company_name: string | null
          company_phone: string | null
          company_size: string | null
          covid_safety: string | null
          created_at: string
          facebook_url: string | null
          instagram_handle: string | null
          location_private: boolean | null
          profile_photo_url: string | null
          province: string | null
          twitter_handle: string | null
          updated_at: string
          user_id: string
          video_urls: string[] | null
          website_links: string | null
          years_in_business: number | null
        }
        Insert: {
          city?: string | null
          company_description?: string | null
          company_email?: string | null
          company_name?: string | null
          company_phone?: string | null
          company_size?: string | null
          covid_safety?: string | null
          created_at?: string
          facebook_url?: string | null
          instagram_handle?: string | null
          location_private?: boolean | null
          profile_photo_url?: string | null
          province?: string | null
          twitter_handle?: string | null
          updated_at?: string
          user_id: string
          video_urls?: string[] | null
          website_links?: string | null
          years_in_business?: number | null
        }
        Update: {
          city?: string | null
          company_description?: string | null
          company_email?: string | null
          company_name?: string | null
          company_phone?: string | null
          company_size?: string | null
          covid_safety?: string | null
          created_at?: string
          facebook_url?: string | null
          instagram_handle?: string | null
          location_private?: boolean | null
          profile_photo_url?: string | null
          province?: string | null
          twitter_handle?: string | null
          updated_at?: string
          user_id?: string
          video_urls?: string[] | null
          website_links?: string | null
          years_in_business?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "provider_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      provider_qas: {
        Row: {
          answer: string
          created_at: string
          id: string
          question: string
          sort_order: number
          user_id: string
        }
        Insert: {
          answer: string
          created_at?: string
          id?: string
          question: string
          sort_order?: number
          user_id: string
        }
        Update: {
          answer?: string
          created_at?: string
          id?: string
          question?: string
          sort_order?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "provider_qas_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      provider_reviews: {
        Row: {
          created_at: string
          id: string
          rating: number
          review_text: string | null
          reviewer_email: string | null
          reviewer_name: string | null
          source: string
          user_id: string
          verified: boolean
        }
        Insert: {
          created_at?: string
          id?: string
          rating: number
          review_text?: string | null
          reviewer_email?: string | null
          reviewer_name?: string | null
          source?: string
          user_id: string
          verified?: boolean
        }
        Update: {
          created_at?: string
          id?: string
          rating?: number
          review_text?: string | null
          reviewer_email?: string | null
          reviewer_name?: string | null
          source?: string
          user_id?: string
          verified?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "provider_reviews_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      provider_services: {
        Row: {
          created_at: string
          description: string | null
          id: string
          sort_order: number
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          sort_order?: number
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          sort_order?: number
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "provider_services_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      reminders: {
        Row: {
          created_at: string
          id: string
          lead_id: string
          note: string | null
          remind_at: string
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          lead_id: string
          note?: string | null
          remind_at: string
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          lead_id?: string
          note?: string | null
          remind_at?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reminders_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reminders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      responses: {
        Row: {
          availability: string | null
          created_at: string
          id: string
          lead_id: string
          message: string
          price_max: number | null
          price_min: number | null
          pro_id: string
          status: string
        }
        Insert: {
          availability?: string | null
          created_at?: string
          id?: string
          lead_id: string
          message: string
          price_max?: number | null
          price_min?: number | null
          pro_id: string
          status?: string
        }
        Update: {
          availability?: string | null
          created_at?: string
          id?: string
          lead_id?: string
          message?: string
          price_max?: number | null
          price_min?: number | null
          pro_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "responses_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "responses_pro_id_fkey"
            columns: ["pro_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      review_invitations: {
        Row: {
          created_at: string
          email: string
          id: string
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_invitations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      lead_last_message: {
        Row: {
          created_at: string | null
          lead_id: string | null
          message: string | null
          sender_type: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_messages_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      contact_lead: { Args: { p_lead_id: string }; Returns: Json }
      fulfill_credit_purchase: {
        Args: {
          p_amount_cents: number
          p_credits: number
          p_currency: string
          p_payment_intent_id: string
          p_session_id: string
          p_user_id: string
        }
        Returns: boolean
      }
      is_lead_assigned_to_current_user: {
        Args: { lead_row_id: string }
        Returns: boolean
      }
      seed_default_statuses: { Args: { p_user_id: string }; Returns: undefined }
      set_lead_custom_status: {
        Args: { p_lead_id: string; p_status_id: string }
        Returns: undefined
      }
      unlock_lead: { Args: { p_lead_id: string }; Returns: number }
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

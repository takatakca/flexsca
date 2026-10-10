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
      support_tickets: {
        Row: { id:string; user_id:string; subject:string; category:string; status:string; request_id:string; created_at:string; updated_at:string }
        Insert: { user_id:string; subject:string; category:string; request_id:string }
        Update: { status?:string }
        Relationships: []
      }
      support_messages: {
        Row: { id:string; ticket_id:string; author_id:string; is_staff:boolean; message:string; request_id:string; created_at:string }
        Insert: { ticket_id:string; author_id:string; message:string; request_id:string }
        Update: Record<string,never>
        Relationships: []
      }

      notification_preferences: {
        Row: { user_id: string; messages: boolean; reminders: boolean }
        Insert: { user_id: string; messages?: boolean; reminders?: boolean }
        Update: { messages?: boolean; reminders?: boolean }
        Relationships: []
      }
      notifications: {
        Row: { id: string; user_id: string; lead_id: string | null; support_ticket_id: string | null; title: string; read_at: string | null; created_at: string }
        Insert: { user_id: string; lead_id?: string | null; title: string }
        Update: { read_at?: string | null }
        Relationships: []
      }
      lead_refund_requests: {
        Row: { id: string; purchase_id: string; user_id: string; reason: string; status: string; created_at: string; resolved_at: string | null }
        Insert: { purchase_id: string; user_id: string; reason: string }
        Update: { status?: string }
        Relationships: []
      }

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
            foreignKeyName: "credit_transactions_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads_safe"
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
          {
            foreignKeyName: "lead_agent_state_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads_safe"
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
          {
            foreignKeyName: "lead_messages_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads_safe"
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
            foreignKeyName: "lead_purchases_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads_safe"
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
          customer_user_id: string | null
          attribution_id: string | null
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
          customer_user_id?: string | null
          attribution_id?: string | null
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
          customer_user_id?: string | null
          attribution_id?: string | null
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
      merchant_amenities: {
        Row: {
          enabled: boolean | null
          icon: string | null
          id: string
          merchant_id: string
          name: string
          sort_order: number | null
        }
        Insert: {
          enabled?: boolean | null
          icon?: string | null
          id?: string
          merchant_id: string
          name: string
          sort_order?: number | null
        }
        Update: {
          enabled?: boolean | null
          icon?: string | null
          id?: string
          merchant_id?: string
          name?: string
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "merchant_amenities_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchant_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      merchant_categories: {
        Row: {
          category_name: string
          created_at: string
          id: string
          merchant_id: string
          sort_order: number | null
        }
        Insert: {
          category_name: string
          created_at?: string
          id?: string
          merchant_id: string
          sort_order?: number | null
        }
        Update: {
          category_name?: string
          created_at?: string
          id?: string
          merchant_id?: string
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "merchant_categories_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchant_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      merchant_ctas: {
        Row: {
          button_text: string | null
          button_url: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          merchant_id: string
          title: string
        }
        Insert: {
          button_text?: string | null
          button_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          merchant_id: string
          title: string
        }
        Update: {
          button_text?: string | null
          button_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          merchant_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "merchant_ctas_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchant_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      merchant_highlights: {
        Row: {
          icon: string | null
          id: string
          merchant_id: string
          name: string
          sort_order: number | null
        }
        Insert: {
          icon?: string | null
          id?: string
          merchant_id: string
          name: string
          sort_order?: number | null
        }
        Update: {
          icon?: string | null
          id?: string
          merchant_id?: string
          name?: string
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "merchant_highlights_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchant_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      merchant_hours: {
        Row: {
          close_time: string | null
          day_of_week: number
          id: string
          is_closed: boolean | null
          merchant_id: string
          open_time: string | null
        }
        Insert: {
          close_time?: string | null
          day_of_week: number
          id?: string
          is_closed?: boolean | null
          merchant_id: string
          open_time?: string | null
        }
        Update: {
          close_time?: string | null
          day_of_week?: number
          id?: string
          is_closed?: boolean | null
          merchant_id?: string
          open_time?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "merchant_hours_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchant_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      merchant_media: {
        Row: {
          caption: string | null
          created_at: string
          id: string
          media_type: string
          merchant_id: string
          sort_order: number | null
          url: string
        }
        Insert: {
          caption?: string | null
          created_at?: string
          id?: string
          media_type?: string
          merchant_id: string
          sort_order?: number | null
          url: string
        }
        Update: {
          caption?: string | null
          created_at?: string
          id?: string
          media_type?: string
          merchant_id?: string
          sort_order?: number | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "merchant_media_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchant_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      merchant_profiles: {
        Row: {
          address: string | null
          business_description: string | null
          business_name: string | null
          business_status: string | null
          city: string | null
          cover_image_url: string | null
          created_at: string
          history: string | null
          id: string
          latitude: number | null
          logo_url: string | null
          longitude: number | null
          menu_url: string | null
          phone: string | null
          postal_code: string | null
          primary_category: string | null
          province: string | null
          rating: number | null
          review_count: number | null
          specialties: string | null
          updated_at: string
          user_id: string
          verified: boolean | null
          verified_at: string | null
          website: string | null
        }
        Insert: {
          address?: string | null
          business_description?: string | null
          business_name?: string | null
          business_status?: string | null
          city?: string | null
          cover_image_url?: string | null
          created_at?: string
          history?: string | null
          id?: string
          latitude?: number | null
          logo_url?: string | null
          longitude?: number | null
          menu_url?: string | null
          phone?: string | null
          postal_code?: string | null
          primary_category?: string | null
          province?: string | null
          rating?: number | null
          review_count?: number | null
          specialties?: string | null
          updated_at?: string
          user_id: string
          verified?: boolean | null
          verified_at?: string | null
          website?: string | null
        }
        Update: {
          address?: string | null
          business_description?: string | null
          business_name?: string | null
          business_status?: string | null
          city?: string | null
          cover_image_url?: string | null
          created_at?: string
          history?: string | null
          id?: string
          latitude?: number | null
          logo_url?: string | null
          longitude?: number | null
          menu_url?: string | null
          phone?: string | null
          postal_code?: string | null
          primary_category?: string | null
          province?: string | null
          rating?: number | null
          review_count?: number | null
          specialties?: string | null
          updated_at?: string
          user_id?: string
          verified?: boolean | null
          verified_at?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "merchant_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      merchant_special_hours: {
        Row: {
          close_time: string | null
          created_at: string
          date: string
          id: string
          is_closed: boolean | null
          label: string | null
          merchant_id: string
          open_time: string | null
        }
        Insert: {
          close_time?: string | null
          created_at?: string
          date: string
          id?: string
          is_closed?: boolean | null
          label?: string | null
          merchant_id: string
          open_time?: string | null
        }
        Update: {
          close_time?: string | null
          created_at?: string
          date?: string
          id?: string
          is_closed?: boolean | null
          label?: string | null
          merchant_id?: string
          open_time?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "merchant_special_hours_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchant_profiles"
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
          personal_name: string | null
          personal_photo_url: string | null
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
          personal_name?: string | null
          personal_photo_url?: string | null
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
          personal_name?: string | null
          personal_photo_url?: string | null
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
            foreignKeyName: "reminders_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads_safe"
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
            foreignKeyName: "responses_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads_safe"
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
      service_categories: {
        Row: {
          base_credit_cost: number
          created_at: string
          hero_image: string | null
          icon: string | null
          id: string
          is_active: boolean
          name: string
          parent_slug: string | null
          questions: Json
          slug: string
          sort_order: number
        }
        Insert: {
          base_credit_cost?: number
          created_at?: string
          hero_image?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          name: string
          parent_slug?: string | null
          questions?: Json
          slug: string
          sort_order?: number
        }
        Update: {
          base_credit_cost?: number
          created_at?: string
          hero_image?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          name?: string
          parent_slug?: string | null
          questions?: Json
          slug?: string
          sort_order?: number
        }
        Relationships: []
      }
    }
    Views: {
      provider_profiles_public: {
        Row: { user_id: string; company_name: string | null; company_description: string | null; company_size: string | null; years_in_business: number | null; city: string | null; province: string | null; profile_photo_url: string | null; personal_name: string | null; company_email: string | null; company_phone: string | null; website_links: string | null }
        Relationships: []
      }
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
          {
            foreignKeyName: "lead_messages_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      leads_safe: {
        Row: {
          answers: Json | null
          archived: boolean | null
          archived_at: string | null
          assigned_to: string | null
          category: string | null
          city: string | null
          created_at: string | null
          credits_cost: number | null
          customer_email: string | null
          customer_name: string | null
          customer_phone: string | null
          details: string | null
          has_additional_details: boolean | null
          id: string | null
          is_urgent: boolean | null
          last_activity_at: string | null
          location_text: string | null
          postal_code: string | null
          province: string | null
          service_subtype: string | null
          status: string | null
          submitted_at: string | null
          updated_at: string | null
        }
        Insert: {
          answers?: Json | null
          archived?: boolean | null
          archived_at?: string | null
          assigned_to?: string | null
          category?: string | null
          city?: string | null
          created_at?: string | null
          credits_cost?: number | null
          customer_email?: never
          customer_name?: never
          customer_phone?: never
          details?: string | null
          has_additional_details?: boolean | null
          id?: string | null
          is_urgent?: boolean | null
          last_activity_at?: string | null
          location_text?: string | null
          postal_code?: string | null
          province?: string | null
          service_subtype?: string | null
          status?: string | null
          submitted_at?: string | null
          updated_at?: string | null
        }
        Update: {
          answers?: Json | null
          archived?: boolean | null
          archived_at?: string | null
          assigned_to?: string | null
          category?: string | null
          city?: string | null
          created_at?: string | null
          credits_cost?: number | null
          customer_email?: never
          customer_name?: never
          customer_phone?: never
          details?: string | null
          has_additional_details?: boolean | null
          id?: string | null
          is_urgent?: boolean | null
          last_activity_at?: string | null
          location_text?: string | null
          postal_code?: string | null
          province?: string | null
          service_subtype?: string | null
          status?: string | null
          submitted_at?: string | null
          updated_at?: string | null
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
      provider_reviews_public: {
        Row: {
          created_at: string | null
          id: string | null
          rating: number | null
          review_text: string | null
          reviewer_name: string | null
          source: string | null
          user_id: string | null
          verified: boolean | null
        }
        Insert: {
          created_at?: string | null
          id?: string | null
          rating?: number | null
          review_text?: string | null
          reviewer_name?: string | null
          source?: string | null
          user_id?: string | null
          verified?: boolean | null
        }
        Update: {
          created_at?: string | null
          id?: string | null
          rating?: number | null
          review_text?: string | null
          reviewer_name?: string | null
          source?: string | null
          user_id?: string | null
          verified?: boolean | null
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
    }
    Functions: {
      admin_attribution_health: { Args: Record<string,never>; Returns:Json }
      admin_retry_attribution: { Args: {p_id:string}; Returns:boolean }
      create_support_ticket: { Args: { p_subject:string; p_category:string; p_message:string; p_request_id:string }; Returns:string }
      reply_support_ticket: { Args: { p_ticket_id:string; p_message:string; p_request_id:string }; Returns:string }
      set_support_ticket_status: { Args: { p_ticket_id:string; p_status:string }; Returns:undefined }

      set_notification_preferences: { Args: { p_messages: boolean; p_reminders: boolean }; Returns: undefined }
      provider_sales_summary: { Args: { p_since?: string | null }; Returns: Json }
      create_follow_up: { Args: { p_lead_id: string; p_remind_at: string; p_note?: string | null; p_request_id?: string }; Returns: string }
      collect_due_follow_ups: { Args: Record<string, never>; Returns: number }
      customer_review_status: { Args: { p_lead_id: string }; Returns: Json }
      submit_customer_review: { Args: { p_lead_id: string; p_rating: number; p_text: string }; Returns: string }
      search_marketplace_leads: { Args: { p_filters?: Json; p_page?: number; p_page_size?: number }; Returns: Json }
      send_quote: { Args: { p_lead_id: string; p_message: string; p_price_min?: number | null; p_price_max?: number | null; p_availability?: string | null }; Returns: string }
      decide_quote: { Args: { p_quote_id: string; p_decision: string }; Returns: boolean }
      is_platform_admin: { Args: Record<string, never>; Returns: boolean }
      admin_lead_queue: { Args: Record<string, never>; Returns: { id: string; category: string; city: string | null; status: string; archived: boolean; created_at: string; purchases: number }[] }
      admin_archive_lead: { Args: { p_lead_id: string; p_archived: boolean }; Returns: undefined }
      request_lead_refund: { Args: { p_lead_id: string; p_reason: string }; Returns: string }
      admin_decide_refund: { Args: { p_request_id: string; p_approve: boolean }; Returns: boolean }
      customer_request_providers: { Args: { p_lead_id: string }; Returns: { user_id: string; company_name: string; profile_photo_url: string | null; contacted_at: string }[] }
      close_customer_request: { Args: { p_lead_id: string }; Returns: boolean }
      claim_customer_leads: { Args: Record<string, never>; Returns: number }
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
      is_merchant_owner: { Args: { p_merchant_id: string }; Returns: boolean }
      seed_default_statuses: { Args: { p_user_id: string }; Returns: undefined }
      set_lead_custom_status: {
        Args: { p_lead_id: string; p_status_id: string }
        Returns: undefined
      }
      submit_lead: {
        Args: {
          p_attribution_id?: string | null
          p_answers?: Json
          p_category: string
          p_city?: string
          p_customer_email?: string
          p_customer_name?: string
          p_customer_phone?: string
          p_details?: string
          p_is_urgent?: boolean
          p_location_text: string
          p_postal_code?: string
        }
        Returns: string
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

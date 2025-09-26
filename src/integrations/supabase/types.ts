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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      broker_chat_messages: {
        Row: {
          broker_id: string
          created_at: string
          deal_id: string | null
          file_url: string | null
          id: string
          is_read: boolean | null
          message: string
          message_type: string | null
          sender_id: string
          sender_type: string
        }
        Insert: {
          broker_id: string
          created_at?: string
          deal_id?: string | null
          file_url?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          message_type?: string | null
          sender_id: string
          sender_type: string
        }
        Update: {
          broker_id?: string
          created_at?: string
          deal_id?: string | null
          file_url?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          message_type?: string | null
          sender_id?: string
          sender_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "broker_chat_messages_broker_id_fkey"
            columns: ["broker_id"]
            isOneToOne: false
            referencedRelation: "broker_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "broker_chat_messages_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "broker_deals"
            referencedColumns: ["id"]
          },
        ]
      }
      broker_deals: {
        Row: {
          admin_notes: string | null
          approved_at: string | null
          approved_by: string | null
          broker_id: string
          cargo_type: string | null
          commission_amount: number | null
          commission_rate: number | null
          created_at: string
          currency: string | null
          deal_date: string | null
          deal_type: string
          delivery_date: string | null
          destination_port: string | null
          id: string
          price_per_unit: number | null
          quantity: number | null
          source_port: string | null
          status: string | null
          steps_completed: number | null
          terms_conditions: string | null
          total_steps: number | null
          total_value: number | null
          updated_at: string
          vessel_id: number | null
        }
        Insert: {
          admin_notes?: string | null
          approved_at?: string | null
          approved_by?: string | null
          broker_id: string
          cargo_type?: string | null
          commission_amount?: number | null
          commission_rate?: number | null
          created_at?: string
          currency?: string | null
          deal_date?: string | null
          deal_type: string
          delivery_date?: string | null
          destination_port?: string | null
          id?: string
          price_per_unit?: number | null
          quantity?: number | null
          source_port?: string | null
          status?: string | null
          steps_completed?: number | null
          terms_conditions?: string | null
          total_steps?: number | null
          total_value?: number | null
          updated_at?: string
          vessel_id?: number | null
        }
        Update: {
          admin_notes?: string | null
          approved_at?: string | null
          approved_by?: string | null
          broker_id?: string
          cargo_type?: string | null
          commission_amount?: number | null
          commission_rate?: number | null
          created_at?: string
          currency?: string | null
          deal_date?: string | null
          deal_type?: string
          delivery_date?: string | null
          destination_port?: string | null
          id?: string
          price_per_unit?: number | null
          quantity?: number | null
          source_port?: string | null
          status?: string | null
          steps_completed?: number | null
          terms_conditions?: string | null
          total_steps?: number | null
          total_value?: number | null
          updated_at?: string
          vessel_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "broker_deals_broker_id_fkey"
            columns: ["broker_id"]
            isOneToOne: false
            referencedRelation: "broker_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "broker_deals_vessel_id_fkey"
            columns: ["vessel_id"]
            isOneToOne: false
            referencedRelation: "vessels"
            referencedColumns: ["id"]
          },
        ]
      }
      broker_memberships: {
        Row: {
          amount: number | null
          created_at: string
          currency: string | null
          email: string
          id: string
          membership_status: string | null
          payment_date: string | null
          payment_status: string | null
          stripe_session_id: string | null
          updated_at: string
          user_id: string
          verification_status: string | null
        }
        Insert: {
          amount?: number | null
          created_at?: string
          currency?: string | null
          email: string
          id?: string
          membership_status?: string | null
          payment_date?: string | null
          payment_status?: string | null
          stripe_session_id?: string | null
          updated_at?: string
          user_id: string
          verification_status?: string | null
        }
        Update: {
          amount?: number | null
          created_at?: string
          currency?: string | null
          email?: string
          id?: string
          membership_status?: string | null
          payment_date?: string | null
          payment_status?: string | null
          stripe_session_id?: string | null
          updated_at?: string
          user_id?: string
          verification_status?: string | null
        }
        Relationships: []
      }
      broker_profiles: {
        Row: {
          additional_documents: string[] | null
          address: string | null
          bio: string | null
          business_registration: string | null
          certifications: string[] | null
          city: string | null
          commission_rate: number | null
          company_name: string | null
          company_size: string | null
          company_type: string | null
          country: string | null
          created_at: string
          education: string | null
          email: string | null
          full_name: string
          id: string
          id_document_url: string | null
          languages: string[] | null
          license_number: string | null
          linkedin_url: string | null
          membership_id: string
          passport_document_url: string | null
          phone: string
          preferred_regions: string[] | null
          profile_image_url: string | null
          specializations: string[] | null
          tax_id: string | null
          trading_volume: string | null
          twitter_url: string | null
          updated_at: string
          user_id: string
          verification_notes: string | null
          verified_at: string | null
          verified_by: string | null
          website: string | null
          years_experience: number | null
        }
        Insert: {
          additional_documents?: string[] | null
          address?: string | null
          bio?: string | null
          business_registration?: string | null
          certifications?: string[] | null
          city?: string | null
          commission_rate?: number | null
          company_name?: string | null
          company_size?: string | null
          company_type?: string | null
          country?: string | null
          created_at?: string
          education?: string | null
          email?: string | null
          full_name: string
          id?: string
          id_document_url?: string | null
          languages?: string[] | null
          license_number?: string | null
          linkedin_url?: string | null
          membership_id: string
          passport_document_url?: string | null
          phone: string
          preferred_regions?: string[] | null
          profile_image_url?: string | null
          specializations?: string[] | null
          tax_id?: string | null
          trading_volume?: string | null
          twitter_url?: string | null
          updated_at?: string
          user_id: string
          verification_notes?: string | null
          verified_at?: string | null
          verified_by?: string | null
          website?: string | null
          years_experience?: number | null
        }
        Update: {
          additional_documents?: string[] | null
          address?: string | null
          bio?: string | null
          business_registration?: string | null
          certifications?: string[] | null
          city?: string | null
          commission_rate?: number | null
          company_name?: string | null
          company_size?: string | null
          company_type?: string | null
          country?: string | null
          created_at?: string
          education?: string | null
          email?: string | null
          full_name?: string
          id?: string
          id_document_url?: string | null
          languages?: string[] | null
          license_number?: string | null
          linkedin_url?: string | null
          membership_id?: string
          passport_document_url?: string | null
          phone?: string
          preferred_regions?: string[] | null
          profile_image_url?: string | null
          specializations?: string[] | null
          tax_id?: string | null
          trading_volume?: string | null
          twitter_url?: string | null
          updated_at?: string
          user_id?: string
          verification_notes?: string | null
          verified_at?: string | null
          verified_by?: string | null
          website?: string | null
          years_experience?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "broker_profiles_membership_id_fkey"
            columns: ["membership_id"]
            isOneToOne: false
            referencedRelation: "broker_memberships"
            referencedColumns: ["id"]
          },
        ]
      }
      brokers: {
        Row: {
          address: string | null
          certification: string[] | null
          commission_rate: number | null
          company_name: string
          contact_person: string | null
          created_at: string
          email: string
          experience_years: number | null
          id: string
          phone: string | null
          rating: number | null
          regions: string[] | null
          specialization: string[] | null
          status: string | null
          total_deals: number | null
          total_volume: number | null
          updated_at: string
          user_id: string | null
          verified: boolean | null
        }
        Insert: {
          address?: string | null
          certification?: string[] | null
          commission_rate?: number | null
          company_name: string
          contact_person?: string | null
          created_at?: string
          email: string
          experience_years?: number | null
          id?: string
          phone?: string | null
          rating?: number | null
          regions?: string[] | null
          specialization?: string[] | null
          status?: string | null
          total_deals?: number | null
          total_volume?: number | null
          updated_at?: string
          user_id?: string | null
          verified?: boolean | null
        }
        Update: {
          address?: string | null
          certification?: string[] | null
          commission_rate?: number | null
          company_name?: string
          contact_person?: string | null
          created_at?: string
          email?: string
          experience_years?: number | null
          id?: string
          phone?: string | null
          rating?: number | null
          regions?: string[] | null
          specialization?: string[] | null
          status?: string | null
          total_deals?: number | null
          total_volume?: number | null
          updated_at?: string
          user_id?: string | null
          verified?: boolean | null
        }
        Relationships: []
      }
      cms_content_blocks: {
        Row: {
          content_ar: string | null
          content_en: string | null
          created_at: string
          created_by: string | null
          id: string
          image_url: string | null
          is_active: boolean
          name: string
          settings: Json | null
          type: string
          updated_at: string
        }
        Insert: {
          content_ar?: string | null
          content_en?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name: string
          settings?: Json | null
          type: string
          updated_at?: string
        }
        Update: {
          content_ar?: string | null
          content_en?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name?: string
          settings?: Json | null
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      cms_media: {
        Row: {
          alt_text_ar: string | null
          alt_text_en: string | null
          created_at: string
          file_path: string
          file_size: number
          file_type: string
          filename: string
          id: string
          original_name: string
          uploaded_by: string | null
        }
        Insert: {
          alt_text_ar?: string | null
          alt_text_en?: string | null
          created_at?: string
          file_path: string
          file_size: number
          file_type: string
          filename: string
          id?: string
          original_name: string
          uploaded_by?: string | null
        }
        Update: {
          alt_text_ar?: string | null
          alt_text_en?: string | null
          created_at?: string
          file_path?: string
          file_size?: number
          file_type?: string
          filename?: string
          id?: string
          original_name?: string
          uploaded_by?: string | null
        }
        Relationships: []
      }
      cms_pages: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          is_homepage: boolean
          is_published: boolean
          meta_description_ar: string | null
          meta_description_en: string | null
          slug: string
          sort_order: number | null
          template_type: string
          title_ar: string
          title_en: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_homepage?: boolean
          is_published?: boolean
          meta_description_ar?: string | null
          meta_description_en?: string | null
          slug: string
          sort_order?: number | null
          template_type?: string
          title_ar: string
          title_en: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_homepage?: boolean
          is_published?: boolean
          meta_description_ar?: string | null
          meta_description_en?: string | null
          slug?: string
          sort_order?: number | null
          template_type?: string
          title_ar?: string
          title_en?: string
          updated_at?: string
        }
        Relationships: []
      }
      cms_sections: {
        Row: {
          background_color: string | null
          button_text_ar: string | null
          button_text_en: string | null
          button_url: string | null
          content_ar: string | null
          content_en: string | null
          created_at: string
          id: string
          image_url: string | null
          is_visible: boolean
          page_id: string
          section_type: string
          settings: Json | null
          sort_order: number
          subtitle_ar: string | null
          subtitle_en: string | null
          text_color: string | null
          title_ar: string | null
          title_en: string | null
          updated_at: string
        }
        Insert: {
          background_color?: string | null
          button_text_ar?: string | null
          button_text_en?: string | null
          button_url?: string | null
          content_ar?: string | null
          content_en?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          is_visible?: boolean
          page_id: string
          section_type: string
          settings?: Json | null
          sort_order?: number
          subtitle_ar?: string | null
          subtitle_en?: string | null
          text_color?: string | null
          title_ar?: string | null
          title_en?: string | null
          updated_at?: string
        }
        Update: {
          background_color?: string | null
          button_text_ar?: string | null
          button_text_en?: string | null
          button_url?: string | null
          content_ar?: string | null
          content_en?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          is_visible?: boolean
          page_id?: string
          section_type?: string
          settings?: Json | null
          sort_order?: number
          subtitle_ar?: string | null
          subtitle_en?: string | null
          text_color?: string | null
          title_ar?: string | null
          title_en?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cms_sections_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "cms_pages"
            referencedColumns: ["id"]
          },
        ]
      }
      cms_settings: {
        Row: {
          description: string | null
          group_name: string | null
          id: string
          key: string
          type: string
          updated_at: string
          updated_by: string | null
          value_ar: string | null
          value_en: string | null
        }
        Insert: {
          description?: string | null
          group_name?: string | null
          id?: string
          key: string
          type?: string
          updated_at?: string
          updated_by?: string | null
          value_ar?: string | null
          value_en?: string | null
        }
        Update: {
          description?: string | null
          group_name?: string | null
          id?: string
          key?: string
          type?: string
          updated_at?: string
          updated_by?: string | null
          value_ar?: string | null
          value_en?: string | null
        }
        Relationships: []
      }
      companies: {
        Row: {
          address: string | null
          annual_revenue: number | null
          ceo_name: string | null
          city: string | null
          company_type: string
          country: string | null
          created_at: string | null
          description: string | null
          email: string | null
          employees_count: number | null
          founded_year: number | null
          headquarters_address: string | null
          id: number
          industry: string | null
          is_verified: boolean | null
          logo_url: string | null
          name: string
          owner_name: string | null
          phone: string | null
          updated_at: string | null
          website: string | null
        }
        Insert: {
          address?: string | null
          annual_revenue?: number | null
          ceo_name?: string | null
          city?: string | null
          company_type?: string
          country?: string | null
          created_at?: string | null
          description?: string | null
          email?: string | null
          employees_count?: number | null
          founded_year?: number | null
          headquarters_address?: string | null
          id?: number
          industry?: string | null
          is_verified?: boolean | null
          logo_url?: string | null
          name: string
          owner_name?: string | null
          phone?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          address?: string | null
          annual_revenue?: number | null
          ceo_name?: string | null
          city?: string | null
          company_type?: string
          country?: string | null
          created_at?: string | null
          description?: string | null
          email?: string | null
          employees_count?: number | null
          founded_year?: number | null
          headquarters_address?: string | null
          id?: number
          industry?: string | null
          is_verified?: boolean | null
          logo_url?: string | null
          name?: string
          owner_name?: string | null
          phone?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Relationships: []
      }
      company_partnership_requests: {
        Row: {
          company_id: number
          created_at: string
          id: string
          message: string | null
          notes: string | null
          requester_id: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string
        }
        Insert: {
          company_id: number
          created_at?: string
          id?: string
          message?: string | null
          notes?: string | null
          requester_id: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          company_id?: number
          created_at?: string
          id?: string
          message?: string | null
          notes?: string | null
          requester_id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_partnership_requests_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      deal_steps: {
        Row: {
          completed_at: string | null
          created_at: string
          deal_id: string
          file_url: string | null
          id: string
          notes: string | null
          status: string | null
          step_description: string | null
          step_name: string
          step_number: number
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          deal_id: string
          file_url?: string | null
          id?: string
          notes?: string | null
          status?: string | null
          step_description?: string | null
          step_name: string
          step_number: number
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          deal_id?: string
          file_url?: string | null
          id?: string
          notes?: string | null
          status?: string | null
          step_description?: string | null
          step_name?: string
          step_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "deal_steps_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "broker_deals"
            referencedColumns: ["id"]
          },
        ]
      }
      deals: {
        Row: {
          broker_id: string | null
          buyer_company: string | null
          cargo_type: string | null
          commission: number | null
          created_at: string
          deal_date: string | null
          id: string
          notes: string | null
          price_per_unit: number | null
          quantity: number | null
          seller_company: string | null
          status: string | null
          total_value: number | null
          updated_at: string
          vessel_id: number | null
        }
        Insert: {
          broker_id?: string | null
          buyer_company?: string | null
          cargo_type?: string | null
          commission?: number | null
          created_at?: string
          deal_date?: string | null
          id?: string
          notes?: string | null
          price_per_unit?: number | null
          quantity?: number | null
          seller_company?: string | null
          status?: string | null
          total_value?: number | null
          updated_at?: string
          vessel_id?: number | null
        }
        Update: {
          broker_id?: string | null
          buyer_company?: string | null
          cargo_type?: string | null
          commission?: number | null
          created_at?: string
          deal_date?: string | null
          id?: string
          notes?: string | null
          price_per_unit?: number | null
          quantity?: number | null
          seller_company?: string | null
          status?: string | null
          total_value?: number | null
          updated_at?: string
          vessel_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "deals_broker_id_fkey"
            columns: ["broker_id"]
            isOneToOne: false
            referencedRelation: "brokers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_vessel_id_fkey"
            columns: ["vessel_id"]
            isOneToOne: false
            referencedRelation: "vessels"
            referencedColumns: ["id"]
          },
        ]
      }
      document_templates: {
        Row: {
          analysis_result: Json | null
          auto_mapped_fields: Json | null
          created_at: string
          created_by: string | null
          description: string | null
          fallback_data_config: Json | null
          field_mappings: Json | null
          file_name: string
          file_url: string
          id: string
          is_active: boolean | null
          last_tested: string | null
          mapping_confidence: number | null
          placeholders: Json | null
          subscription_level: string | null
          supports_pdf: boolean | null
          template_status: string | null
          test_results: Json | null
          title: string
          updated_at: string
        }
        Insert: {
          analysis_result?: Json | null
          auto_mapped_fields?: Json | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          fallback_data_config?: Json | null
          field_mappings?: Json | null
          file_name: string
          file_url: string
          id?: string
          is_active?: boolean | null
          last_tested?: string | null
          mapping_confidence?: number | null
          placeholders?: Json | null
          subscription_level?: string | null
          supports_pdf?: boolean | null
          template_status?: string | null
          test_results?: Json | null
          title: string
          updated_at?: string
        }
        Update: {
          analysis_result?: Json | null
          auto_mapped_fields?: Json | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          fallback_data_config?: Json | null
          field_mappings?: Json | null
          file_name?: string
          file_url?: string
          id?: string
          is_active?: boolean | null
          last_tested?: string | null
          mapping_confidence?: number | null
          placeholders?: Json | null
          subscription_level?: string | null
          supports_pdf?: boolean | null
          template_status?: string | null
          test_results?: Json | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      filter_options: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          filter_type: string
          id: string
          is_active: boolean
          label: string
          sort_order: number | null
          updated_at: string
          value: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          filter_type: string
          id?: string
          is_active?: boolean
          label: string
          sort_order?: number | null
          updated_at?: string
          value: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          filter_type?: string
          id?: string
          is_active?: boolean
          label?: string
          sort_order?: number | null
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      landing_page_content: {
        Row: {
          content: Json | null
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          section_name: string
          subtitle: string | null
          title: string | null
          updated_at: string
        }
        Insert: {
          content?: Json | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          section_name: string
          subtitle?: string | null
          title?: string | null
          updated_at?: string
        }
        Update: {
          content?: Json | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          section_name?: string
          subtitle?: string | null
          title?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      oil_prices: {
        Row: {
          created_at: string
          currency: string
          current_price: number
          exchange: string | null
          id: string
          last_updated: string
          oil_type: string
          previous_price: number | null
          price_change: number | null
          price_change_percent: number | null
          symbol: string
          unit: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          currency?: string
          current_price: number
          exchange?: string | null
          id?: string
          last_updated?: string
          oil_type: string
          previous_price?: number | null
          price_change?: number | null
          price_change_percent?: number | null
          symbol: string
          unit?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          currency?: string
          current_price?: number
          exchange?: string | null
          id?: string
          last_updated?: string
          oil_type?: string
          previous_price?: number | null
          price_change?: number | null
          price_change_percent?: number | null
          symbol?: string
          unit?: string
          updated_at?: string
        }
        Relationships: []
      }
      ports: {
        Row: {
          address: string | null
          airport_distance: number | null
          anchorage_depth: number | null
          annual_throughput: number | null
          average_wait_time: number | null
          berth_count: number | null
          berth_depth: number | null
          capacity: number | null
          cargo_types: string | null
          channel_depth: number | null
          city: string | null
          connected_refineries: string | null
          country: string | null
          created_at: string | null
          currency: string | null
          customs_office: boolean | null
          description: string | null
          email: string | null
          environmental_certifications: string | null
          established: number | null
          facilities: string | null
          free_trade_zone: boolean | null
          id: number
          last_inspection: string | null
          last_updated: string | null
          lat: number | null
          lng: number | null
          max_deadweight: number | null
          max_draught: number | null
          max_vessel_beam: number | null
          max_vessel_length: number | null
          name: string | null
          nearby_ports: string | null
          next_inspection: string | null
          operating_hours: string | null
          operator: string | null
          owner: string | null
          phone: string | null
          photo: string | null
          pilotage_required: boolean | null
          port_authority: string | null
          port_charges: number | null
          port_type: string | null
          postal_code: string | null
          quarantine_station: boolean | null
          rail_connection: boolean | null
          region: string | null
          road_connection: boolean | null
          security_level: string | null
          services: string | null
          status: string | null
          terminal_count: number | null
          tidal_range: number | null
          timezone: string | null
          total_cargo: number | null
          tug_assistance: boolean | null
          type: string | null
          updated_at: string | null
          vessel_count: number | null
          weather_restrictions: string | null
          website: string | null
        }
        Insert: {
          address?: string | null
          airport_distance?: number | null
          anchorage_depth?: number | null
          annual_throughput?: number | null
          average_wait_time?: number | null
          berth_count?: number | null
          berth_depth?: number | null
          capacity?: number | null
          cargo_types?: string | null
          channel_depth?: number | null
          city?: string | null
          connected_refineries?: string | null
          country?: string | null
          created_at?: string | null
          currency?: string | null
          customs_office?: boolean | null
          description?: string | null
          email?: string | null
          environmental_certifications?: string | null
          established?: number | null
          facilities?: string | null
          free_trade_zone?: boolean | null
          id?: number
          last_inspection?: string | null
          last_updated?: string | null
          lat?: number | null
          lng?: number | null
          max_deadweight?: number | null
          max_draught?: number | null
          max_vessel_beam?: number | null
          max_vessel_length?: number | null
          name?: string | null
          nearby_ports?: string | null
          next_inspection?: string | null
          operating_hours?: string | null
          operator?: string | null
          owner?: string | null
          phone?: string | null
          photo?: string | null
          pilotage_required?: boolean | null
          port_authority?: string | null
          port_charges?: number | null
          port_type?: string | null
          postal_code?: string | null
          quarantine_station?: boolean | null
          rail_connection?: boolean | null
          region?: string | null
          road_connection?: boolean | null
          security_level?: string | null
          services?: string | null
          status?: string | null
          terminal_count?: number | null
          tidal_range?: number | null
          timezone?: string | null
          total_cargo?: number | null
          tug_assistance?: boolean | null
          type?: string | null
          updated_at?: string | null
          vessel_count?: number | null
          weather_restrictions?: string | null
          website?: string | null
        }
        Update: {
          address?: string | null
          airport_distance?: number | null
          anchorage_depth?: number | null
          annual_throughput?: number | null
          average_wait_time?: number | null
          berth_count?: number | null
          berth_depth?: number | null
          capacity?: number | null
          cargo_types?: string | null
          channel_depth?: number | null
          city?: string | null
          connected_refineries?: string | null
          country?: string | null
          created_at?: string | null
          currency?: string | null
          customs_office?: boolean | null
          description?: string | null
          email?: string | null
          environmental_certifications?: string | null
          established?: number | null
          facilities?: string | null
          free_trade_zone?: boolean | null
          id?: number
          last_inspection?: string | null
          last_updated?: string | null
          lat?: number | null
          lng?: number | null
          max_deadweight?: number | null
          max_draught?: number | null
          max_vessel_beam?: number | null
          max_vessel_length?: number | null
          name?: string | null
          nearby_ports?: string | null
          next_inspection?: string | null
          operating_hours?: string | null
          operator?: string | null
          owner?: string | null
          phone?: string | null
          photo?: string | null
          pilotage_required?: boolean | null
          port_authority?: string | null
          port_charges?: number | null
          port_type?: string | null
          postal_code?: string | null
          quarantine_station?: boolean | null
          rail_connection?: boolean | null
          region?: string | null
          road_connection?: boolean | null
          security_level?: string | null
          services?: string | null
          status?: string | null
          terminal_count?: number | null
          tidal_range?: number | null
          timezone?: string | null
          total_cargo?: number | null
          tug_assistance?: boolean | null
          type?: string | null
          updated_at?: string | null
          vessel_count?: number | null
          weather_restrictions?: string | null
          website?: string | null
        }
        Relationships: []
      }
      ports_uuid_backup: {
        Row: {
          address: string | null
          airport_distance: number | null
          anchorage_depth: number | null
          annual_throughput: number | null
          average_wait_time: number | null
          berth_count: number | null
          berth_depth: number | null
          capacity: number | null
          cargo_types: string | null
          channel_depth: number | null
          city: string | null
          connected_refineries: string | null
          country: string | null
          created_at: string | null
          currency: string | null
          customs_office: boolean | null
          description: string | null
          email: string | null
          environmental_certifications: string | null
          established: number | null
          facilities: string | null
          free_trade_zone: boolean | null
          id: string | null
          last_inspection: string | null
          last_updated: string | null
          lat: number | null
          lng: number | null
          max_deadweight: number | null
          max_draught: number | null
          max_vessel_beam: number | null
          max_vessel_length: number | null
          name: string | null
          nearby_ports: string | null
          next_inspection: string | null
          operating_hours: string | null
          operator: string | null
          owner: string | null
          phone: string | null
          photo: string | null
          pilotage_required: boolean | null
          port_authority: string | null
          port_charges: number | null
          port_type: string | null
          postal_code: string | null
          quarantine_station: boolean | null
          rail_connection: boolean | null
          region: string | null
          road_connection: boolean | null
          security_level: string | null
          services: string | null
          status: string | null
          terminal_count: number | null
          tidal_range: number | null
          timezone: string | null
          total_cargo: number | null
          tug_assistance: boolean | null
          type: string | null
          updated_at: string | null
          vessel_count: number | null
          weather_restrictions: string | null
          website: string | null
        }
        Insert: {
          address?: string | null
          airport_distance?: number | null
          anchorage_depth?: number | null
          annual_throughput?: number | null
          average_wait_time?: number | null
          berth_count?: number | null
          berth_depth?: number | null
          capacity?: number | null
          cargo_types?: string | null
          channel_depth?: number | null
          city?: string | null
          connected_refineries?: string | null
          country?: string | null
          created_at?: string | null
          currency?: string | null
          customs_office?: boolean | null
          description?: string | null
          email?: string | null
          environmental_certifications?: string | null
          established?: number | null
          facilities?: string | null
          free_trade_zone?: boolean | null
          id?: string | null
          last_inspection?: string | null
          last_updated?: string | null
          lat?: number | null
          lng?: number | null
          max_deadweight?: number | null
          max_draught?: number | null
          max_vessel_beam?: number | null
          max_vessel_length?: number | null
          name?: string | null
          nearby_ports?: string | null
          next_inspection?: string | null
          operating_hours?: string | null
          operator?: string | null
          owner?: string | null
          phone?: string | null
          photo?: string | null
          pilotage_required?: boolean | null
          port_authority?: string | null
          port_charges?: number | null
          port_type?: string | null
          postal_code?: string | null
          quarantine_station?: boolean | null
          rail_connection?: boolean | null
          region?: string | null
          road_connection?: boolean | null
          security_level?: string | null
          services?: string | null
          status?: string | null
          terminal_count?: number | null
          tidal_range?: number | null
          timezone?: string | null
          total_cargo?: number | null
          tug_assistance?: boolean | null
          type?: string | null
          updated_at?: string | null
          vessel_count?: number | null
          weather_restrictions?: string | null
          website?: string | null
        }
        Update: {
          address?: string | null
          airport_distance?: number | null
          anchorage_depth?: number | null
          annual_throughput?: number | null
          average_wait_time?: number | null
          berth_count?: number | null
          berth_depth?: number | null
          capacity?: number | null
          cargo_types?: string | null
          channel_depth?: number | null
          city?: string | null
          connected_refineries?: string | null
          country?: string | null
          created_at?: string | null
          currency?: string | null
          customs_office?: boolean | null
          description?: string | null
          email?: string | null
          environmental_certifications?: string | null
          established?: number | null
          facilities?: string | null
          free_trade_zone?: boolean | null
          id?: string | null
          last_inspection?: string | null
          last_updated?: string | null
          lat?: number | null
          lng?: number | null
          max_deadweight?: number | null
          max_draught?: number | null
          max_vessel_beam?: number | null
          max_vessel_length?: number | null
          name?: string | null
          nearby_ports?: string | null
          next_inspection?: string | null
          operating_hours?: string | null
          operator?: string | null
          owner?: string | null
          phone?: string | null
          photo?: string | null
          pilotage_required?: boolean | null
          port_authority?: string | null
          port_charges?: number | null
          port_type?: string | null
          postal_code?: string | null
          quarantine_station?: boolean | null
          rail_connection?: boolean | null
          region?: string | null
          road_connection?: boolean | null
          security_level?: string | null
          services?: string | null
          status?: string | null
          terminal_count?: number | null
          tidal_range?: number | null
          timezone?: string | null
          total_cargo?: number | null
          tug_assistance?: boolean | null
          type?: string | null
          updated_at?: string | null
          vessel_count?: number | null
          weather_restrictions?: string | null
          website?: string | null
        }
        Relationships: []
      }
      processed_documents: {
        Row: {
          company_id: number | null
          completed_at: string | null
          created_at: string
          created_by: string | null
          error_message: string | null
          generated_file_url: string | null
          id: string
          placeholders_filled: Json | null
          port_id: number | null
          processing_status: string | null
          refinery_id: string | null
          template_id: string
          vessel_id: number | null
        }
        Insert: {
          company_id?: number | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          error_message?: string | null
          generated_file_url?: string | null
          id?: string
          placeholders_filled?: Json | null
          port_id?: number | null
          processing_status?: string | null
          refinery_id?: string | null
          template_id: string
          vessel_id?: number | null
        }
        Update: {
          company_id?: number | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          error_message?: string | null
          generated_file_url?: string | null
          id?: string
          placeholders_filled?: Json | null
          port_id?: number | null
          processing_status?: string | null
          refinery_id?: string | null
          template_id?: string
          vessel_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "processed_documents_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "document_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      refineries: {
        Row: {
          active_vessels: number | null
          address: string | null
          annual_revenue: number | null
          annual_throughput: number | null
          capacity: number | null
          certifications: string | null
          city: string | null
          competitive_advantages: string | null
          competitive_analysis: string | null
          complexity: string | null
          compliance_status: string | null
          confidence_level: number | null
          conversion_capacity: number | null
          country: string | null
          created_at: string
          crude_oil_sources: string | null
          daily_throughput: number | null
          data_source: string | null
          description: string | null
          diesel_specifications: string | null
          distillation_capacity: number | null
          distribution_network: string | null
          domestic_market_share: number | null
          downtime_statistics: string | null
          efficiency_rating: number | null
          email: string | null
          emissions_data: string | null
          employees_count: number | null
          energy_consumption: number | null
          environmental_certifications: string | null
          environmental_compliance: string | null
          environmental_rating: string | null
          established_year: number | null
          expansion_plans: string | null
          export_markets: string | null
          financial_performance: string | null
          fuel_types: string | null
          future_outlook: string | null
          hydrogen_capacity: number | null
          id: string
          innovation_projects: string | null
          inspection_schedule: string | null
          investment_cost: number | null
          investment_plans: string | null
          last_maintenance: string | null
          last_updated: string | null
          last_verified: string | null
          lat: number | null
          lng: number | null
          local_suppliers: string | null
          maintenance_schedule: string | null
          major_customers: string | null
          market_position: string | null
          market_share: number | null
          market_trends: string | null
          modernization_projects: string | null
          name: string | null
          nearest_airport: string | null
          nearest_port: string | null
          next_maintenance: string | null
          notes: string | null
          octane_rating: number | null
          operating_costs: number | null
          operational_efficiency: number | null
          operator: string | null
          owner: string | null
          parent_company: string | null
          permits_licenses: string | null
          phone: string | null
          photo: string | null
          pipeline_connections: string | null
          processing_capacity: number | null
          processing_units: string | null
          production_capacity: number | null
          products: string | null
          profit_margin: number | null
          quality_standards: string | null
          rail_connections: string | null
          refinery_complexity: string | null
          region: string | null
          regulatory_compliance: string | null
          regulatory_status: string | null
          revenue: number | null
          safety_rating: string | null
          safety_record: string | null
          shipping_terminals: string | null
          status: string | null
          storage_capacity: number | null
          strategic_partnerships: string | null
          sulfur_recovery: number | null
          supply_chain_partners: string | null
          supply_contracts: string | null
          sustainability_initiatives: string | null
          technical_specs: string | null
          technology_partnerships: string | null
          technology_upgrades: string | null
          transportation_links: string | null
          type: string | null
          updated_at: string
          utilities_infrastructure: string | null
          utilization: number | null
          water_usage: number | null
          website: string | null
          workforce_size: number | null
          year_built: number | null
        }
        Insert: {
          active_vessels?: number | null
          address?: string | null
          annual_revenue?: number | null
          annual_throughput?: number | null
          capacity?: number | null
          certifications?: string | null
          city?: string | null
          competitive_advantages?: string | null
          competitive_analysis?: string | null
          complexity?: string | null
          compliance_status?: string | null
          confidence_level?: number | null
          conversion_capacity?: number | null
          country?: string | null
          created_at?: string
          crude_oil_sources?: string | null
          daily_throughput?: number | null
          data_source?: string | null
          description?: string | null
          diesel_specifications?: string | null
          distillation_capacity?: number | null
          distribution_network?: string | null
          domestic_market_share?: number | null
          downtime_statistics?: string | null
          efficiency_rating?: number | null
          email?: string | null
          emissions_data?: string | null
          employees_count?: number | null
          energy_consumption?: number | null
          environmental_certifications?: string | null
          environmental_compliance?: string | null
          environmental_rating?: string | null
          established_year?: number | null
          expansion_plans?: string | null
          export_markets?: string | null
          financial_performance?: string | null
          fuel_types?: string | null
          future_outlook?: string | null
          hydrogen_capacity?: number | null
          id?: string
          innovation_projects?: string | null
          inspection_schedule?: string | null
          investment_cost?: number | null
          investment_plans?: string | null
          last_maintenance?: string | null
          last_updated?: string | null
          last_verified?: string | null
          lat?: number | null
          lng?: number | null
          local_suppliers?: string | null
          maintenance_schedule?: string | null
          major_customers?: string | null
          market_position?: string | null
          market_share?: number | null
          market_trends?: string | null
          modernization_projects?: string | null
          name?: string | null
          nearest_airport?: string | null
          nearest_port?: string | null
          next_maintenance?: string | null
          notes?: string | null
          octane_rating?: number | null
          operating_costs?: number | null
          operational_efficiency?: number | null
          operator?: string | null
          owner?: string | null
          parent_company?: string | null
          permits_licenses?: string | null
          phone?: string | null
          photo?: string | null
          pipeline_connections?: string | null
          processing_capacity?: number | null
          processing_units?: string | null
          production_capacity?: number | null
          products?: string | null
          profit_margin?: number | null
          quality_standards?: string | null
          rail_connections?: string | null
          refinery_complexity?: string | null
          region?: string | null
          regulatory_compliance?: string | null
          regulatory_status?: string | null
          revenue?: number | null
          safety_rating?: string | null
          safety_record?: string | null
          shipping_terminals?: string | null
          status?: string | null
          storage_capacity?: number | null
          strategic_partnerships?: string | null
          sulfur_recovery?: number | null
          supply_chain_partners?: string | null
          supply_contracts?: string | null
          sustainability_initiatives?: string | null
          technical_specs?: string | null
          technology_partnerships?: string | null
          technology_upgrades?: string | null
          transportation_links?: string | null
          type?: string | null
          updated_at?: string
          utilities_infrastructure?: string | null
          utilization?: number | null
          water_usage?: number | null
          website?: string | null
          workforce_size?: number | null
          year_built?: number | null
        }
        Update: {
          active_vessels?: number | null
          address?: string | null
          annual_revenue?: number | null
          annual_throughput?: number | null
          capacity?: number | null
          certifications?: string | null
          city?: string | null
          competitive_advantages?: string | null
          competitive_analysis?: string | null
          complexity?: string | null
          compliance_status?: string | null
          confidence_level?: number | null
          conversion_capacity?: number | null
          country?: string | null
          created_at?: string
          crude_oil_sources?: string | null
          daily_throughput?: number | null
          data_source?: string | null
          description?: string | null
          diesel_specifications?: string | null
          distillation_capacity?: number | null
          distribution_network?: string | null
          domestic_market_share?: number | null
          downtime_statistics?: string | null
          efficiency_rating?: number | null
          email?: string | null
          emissions_data?: string | null
          employees_count?: number | null
          energy_consumption?: number | null
          environmental_certifications?: string | null
          environmental_compliance?: string | null
          environmental_rating?: string | null
          established_year?: number | null
          expansion_plans?: string | null
          export_markets?: string | null
          financial_performance?: string | null
          fuel_types?: string | null
          future_outlook?: string | null
          hydrogen_capacity?: number | null
          id?: string
          innovation_projects?: string | null
          inspection_schedule?: string | null
          investment_cost?: number | null
          investment_plans?: string | null
          last_maintenance?: string | null
          last_updated?: string | null
          last_verified?: string | null
          lat?: number | null
          lng?: number | null
          local_suppliers?: string | null
          maintenance_schedule?: string | null
          major_customers?: string | null
          market_position?: string | null
          market_share?: number | null
          market_trends?: string | null
          modernization_projects?: string | null
          name?: string | null
          nearest_airport?: string | null
          nearest_port?: string | null
          next_maintenance?: string | null
          notes?: string | null
          octane_rating?: number | null
          operating_costs?: number | null
          operational_efficiency?: number | null
          operator?: string | null
          owner?: string | null
          parent_company?: string | null
          permits_licenses?: string | null
          phone?: string | null
          photo?: string | null
          pipeline_connections?: string | null
          processing_capacity?: number | null
          processing_units?: string | null
          production_capacity?: number | null
          products?: string | null
          profit_margin?: number | null
          quality_standards?: string | null
          rail_connections?: string | null
          refinery_complexity?: string | null
          region?: string | null
          regulatory_compliance?: string | null
          regulatory_status?: string | null
          revenue?: number | null
          safety_rating?: string | null
          safety_record?: string | null
          shipping_terminals?: string | null
          status?: string | null
          storage_capacity?: number | null
          strategic_partnerships?: string | null
          sulfur_recovery?: number | null
          supply_chain_partners?: string | null
          supply_contracts?: string | null
          sustainability_initiatives?: string | null
          technical_specs?: string | null
          technology_partnerships?: string | null
          technology_upgrades?: string | null
          transportation_links?: string | null
          type?: string | null
          updated_at?: string
          utilities_infrastructure?: string | null
          utilization?: number | null
          water_usage?: number | null
          website?: string | null
          workforce_size?: number | null
          year_built?: number | null
        }
        Relationships: []
      }
      subscribers: {
        Row: {
          api_access: boolean | null
          billing_cycle: string | null
          created_at: string
          document_access: string[] | null
          email: string
          id: string
          is_trial_active: boolean | null
          last_payment_failure: string | null
          next_billing_date: string | null
          payment_failed_count: number | null
          plan_trial_end_date: string | null
          plan_trial_start_date: string | null
          plan_trial_used: boolean | null
          port_limit: number | null
          preview_access: boolean | null
          real_time_analytics: boolean | null
          refinery_limit: number | null
          regions_limit: number | null
          registration_step: number | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          subscribed: boolean
          subscription_end: string | null
          subscription_start_date: string | null
          subscription_status: string | null
          subscription_tier: string | null
          support_level: string | null
          trial_end_date: string | null
          trial_start_date: string | null
          trial_used: boolean | null
          trial_with_subscription: boolean | null
          unified_trial_end_date: string | null
          updated_at: string
          user_id: string | null
          user_seats: number | null
          vessel_limit: number | null
        }
        Insert: {
          api_access?: boolean | null
          billing_cycle?: string | null
          created_at?: string
          document_access?: string[] | null
          email: string
          id?: string
          is_trial_active?: boolean | null
          last_payment_failure?: string | null
          next_billing_date?: string | null
          payment_failed_count?: number | null
          plan_trial_end_date?: string | null
          plan_trial_start_date?: string | null
          plan_trial_used?: boolean | null
          port_limit?: number | null
          preview_access?: boolean | null
          real_time_analytics?: boolean | null
          refinery_limit?: number | null
          regions_limit?: number | null
          registration_step?: number | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscribed?: boolean
          subscription_end?: string | null
          subscription_start_date?: string | null
          subscription_status?: string | null
          subscription_tier?: string | null
          support_level?: string | null
          trial_end_date?: string | null
          trial_start_date?: string | null
          trial_used?: boolean | null
          trial_with_subscription?: boolean | null
          unified_trial_end_date?: string | null
          updated_at?: string
          user_id?: string | null
          user_seats?: number | null
          vessel_limit?: number | null
        }
        Update: {
          api_access?: boolean | null
          billing_cycle?: string | null
          created_at?: string
          document_access?: string[] | null
          email?: string
          id?: string
          is_trial_active?: boolean | null
          last_payment_failure?: string | null
          next_billing_date?: string | null
          payment_failed_count?: number | null
          plan_trial_end_date?: string | null
          plan_trial_start_date?: string | null
          plan_trial_used?: boolean | null
          port_limit?: number | null
          preview_access?: boolean | null
          real_time_analytics?: boolean | null
          refinery_limit?: number | null
          regions_limit?: number | null
          registration_step?: number | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscribed?: boolean
          subscription_end?: string | null
          subscription_start_date?: string | null
          subscription_status?: string | null
          subscription_tier?: string | null
          support_level?: string | null
          trial_end_date?: string | null
          trial_start_date?: string | null
          trial_used?: boolean | null
          trial_with_subscription?: boolean | null
          unified_trial_end_date?: string | null
          updated_at?: string
          user_id?: string | null
          user_seats?: number | null
          vessel_limit?: number | null
        }
        Relationships: []
      }
      subscription_discounts: {
        Row: {
          billing_cycle: string | null
          created_at: string | null
          created_by: string | null
          discount_name: string | null
          discount_percentage: number
          id: string
          is_active: boolean | null
          plan_tier: string
          updated_at: string | null
          valid_from: string | null
          valid_until: string | null
        }
        Insert: {
          billing_cycle?: string | null
          created_at?: string | null
          created_by?: string | null
          discount_name?: string | null
          discount_percentage?: number
          id?: string
          is_active?: boolean | null
          plan_tier: string
          updated_at?: string | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Update: {
          billing_cycle?: string | null
          created_at?: string | null
          created_by?: string | null
          discount_name?: string | null
          discount_percentage?: number
          id?: string
          is_active?: boolean | null
          plan_tier?: string
          updated_at?: string | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Relationships: []
      }
      subscription_plans: {
        Row: {
          annual_price: number
          api_access: boolean | null
          created_at: string | null
          created_by: string | null
          description: string | null
          document_access: string[] | null
          features: string[] | null
          id: string
          is_active: boolean | null
          is_popular: boolean | null
          monthly_price: number
          plan_name: string
          plan_tier: string
          port_limit: number
          real_time_analytics: boolean | null
          refinery_limit: number
          regions_limit: number
          sort_order: number | null
          support_level: string | null
          trial_days: number | null
          updated_at: string | null
          user_seats: number | null
          vessel_limit: number
        }
        Insert: {
          annual_price: number
          api_access?: boolean | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          document_access?: string[] | null
          features?: string[] | null
          id?: string
          is_active?: boolean | null
          is_popular?: boolean | null
          monthly_price: number
          plan_name: string
          plan_tier: string
          port_limit?: number
          real_time_analytics?: boolean | null
          refinery_limit?: number
          regions_limit?: number
          sort_order?: number | null
          support_level?: string | null
          trial_days?: number | null
          updated_at?: string | null
          user_seats?: number | null
          vessel_limit?: number
        }
        Update: {
          annual_price?: number
          api_access?: boolean | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          document_access?: string[] | null
          features?: string[] | null
          id?: string
          is_active?: boolean | null
          is_popular?: boolean | null
          monthly_price?: number
          plan_name?: string
          plan_tier?: string
          port_limit?: number
          real_time_analytics?: boolean | null
          refinery_limit?: number
          regions_limit?: number
          sort_order?: number | null
          support_level?: string | null
          trial_days?: number | null
          updated_at?: string | null
          user_seats?: number | null
          vessel_limit?: number
        }
        Relationships: []
      }
      support_articles: {
        Row: {
          category_id: string
          content_ar: string
          content_en: string
          created_at: string
          created_by: string | null
          id: string
          is_popular: boolean
          is_published: boolean
          slug: string
          title_ar: string
          title_en: string
          updated_at: string
          view_count: number
        }
        Insert: {
          category_id: string
          content_ar: string
          content_en: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_popular?: boolean
          is_published?: boolean
          slug: string
          title_ar: string
          title_en: string
          updated_at?: string
          view_count?: number
        }
        Update: {
          category_id?: string
          content_ar?: string
          content_en?: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_popular?: boolean
          is_published?: boolean
          slug?: string
          title_ar?: string
          title_en?: string
          updated_at?: string
          view_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "support_articles_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "support_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      support_categories: {
        Row: {
          created_at: string
          description_ar: string | null
          description_en: string | null
          icon: string
          id: string
          is_active: boolean
          name_ar: string
          name_en: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description_ar?: string | null
          description_en?: string | null
          icon?: string
          id?: string
          is_active?: boolean
          name_ar: string
          name_en: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description_ar?: string | null
          description_en?: string | null
          icon?: string
          id?: string
          is_active?: boolean
          name_ar?: string
          name_en?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      support_ticket_messages: {
        Row: {
          attachments: string[] | null
          created_at: string
          id: string
          is_internal: boolean
          message: string
          ticket_id: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          attachments?: string[] | null
          created_at?: string
          id?: string
          is_internal?: boolean
          message: string
          ticket_id: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          attachments?: string[] | null
          created_at?: string
          id?: string
          is_internal?: boolean
          message?: string
          ticket_id?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "support_ticket_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          assigned_to: string | null
          category_id: string
          closed_at: string | null
          created_at: string
          description: string
          email: string
          id: string
          language: string
          priority: string
          resolved_at: string | null
          service_domain: string | null
          status: string
          subject: string
          ticket_number: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          assigned_to?: string | null
          category_id: string
          closed_at?: string | null
          created_at?: string
          description: string
          email: string
          id?: string
          language?: string
          priority?: string
          resolved_at?: string | null
          service_domain?: string | null
          status?: string
          subject: string
          ticket_number: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          assigned_to?: string | null
          category_id?: string
          closed_at?: string | null
          created_at?: string
          description?: string
          email?: string
          id?: string
          language?: string
          priority?: string
          resolved_at?: string | null
          service_domain?: string | null
          status?: string
          subject?: string
          ticket_number?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "support_tickets_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "support_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      tutorials: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean
          sort_order: number | null
          title: string
          updated_at: string
          video_url: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          sort_order?: number | null
          title: string
          updated_at?: string
          video_url: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          sort_order?: number | null
          title?: string
          updated_at?: string
          video_url?: string
        }
        Relationships: []
      }
      user_document_storage: {
        Row: {
          created_at: string
          document_id: string
          document_title: string
          downloaded_at: string
          file_size: number | null
          file_url: string
          id: string
          last_viewed_at: string | null
          updated_at: string
          user_id: string
          vessel_id: number | null
          vessel_name: string | null
          view_count: number | null
        }
        Insert: {
          created_at?: string
          document_id: string
          document_title: string
          downloaded_at?: string
          file_size?: number | null
          file_url: string
          id?: string
          last_viewed_at?: string | null
          updated_at?: string
          user_id: string
          vessel_id?: number | null
          vessel_name?: string | null
          view_count?: number | null
        }
        Update: {
          created_at?: string
          document_id?: string
          document_title?: string
          downloaded_at?: string
          file_size?: number | null
          file_url?: string
          id?: string
          last_viewed_at?: string | null
          updated_at?: string
          user_id?: string
          vessel_id?: number | null
          vessel_name?: string | null
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "user_document_storage_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "vessel_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_document_storage_vessel_id_fkey"
            columns: ["vessel_id"]
            isOneToOne: false
            referencedRelation: "vessels"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      vessel_documents: {
        Row: {
          broker_membership_required: boolean
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean
          subscription_level: string
          title: string
          updated_at: string
        }
        Insert: {
          broker_membership_required?: boolean
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          subscription_level?: string
          title: string
          updated_at?: string
        }
        Update: {
          broker_membership_required?: boolean
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          subscription_level?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      vessels: {
        Row: {
          arrival_date: string | null
          beam: string | null
          built: number | null
          buyer_name: string | null
          callsign: string | null
          cargo_capacity: number | null
          cargo_quantity: number | null
          cargo_type: string | null
          company_id: number | null
          course: number | null
          created_at: string | null
          crew_size: number | null
          current_lat: number | null
          current_lng: number | null
          current_region: string | null
          currentport: string | null
          deadweight: number | null
          deal_value: number | null
          dealvalue: string | null
          departure_date: string | null
          departure_lat: number | null
          departure_lng: number | null
          departure_port: number | null
          destination: string | null
          destination_lat: number | null
          destination_lng: number | null
          destination_port: number | null
          draft: string | null
          draught: number | null
          engine_power: number | null
          eta: string | null
          flag: string | null
          fuel_consumption: number | null
          gross_tonnage: number | null
          id: number
          imo: string | null
          last_updated: string | null
          length: number | null
          loading_port: string | null
          market_price: number | null
          marketprice: string | null
          metadata: Json | null
          mmsi: string | null
          name: string
          nav_status: string | null
          oil_source: string | null
          oil_type: string | null
          operator_name: string | null
          owner_name: string | null
          price: number | null
          quantity: number | null
          refinery_id: string | null
          route_distance: number | null
          route_info: string | null
          routedistance: string | null
          seller_name: string | null
          shipping_type: string | null
          source_company: string | null
          speed: string | null
          status: string | null
          target_refinery: string | null
          updated_at: string | null
          vessel_type: string | null
          vesselstatus: string | null
          width: number | null
        }
        Insert: {
          arrival_date?: string | null
          beam?: string | null
          built?: number | null
          buyer_name?: string | null
          callsign?: string | null
          cargo_capacity?: number | null
          cargo_quantity?: number | null
          cargo_type?: string | null
          company_id?: number | null
          course?: number | null
          created_at?: string | null
          crew_size?: number | null
          current_lat?: number | null
          current_lng?: number | null
          current_region?: string | null
          currentport?: string | null
          deadweight?: number | null
          deal_value?: number | null
          dealvalue?: string | null
          departure_date?: string | null
          departure_lat?: number | null
          departure_lng?: number | null
          departure_port?: number | null
          destination?: string | null
          destination_lat?: number | null
          destination_lng?: number | null
          destination_port?: number | null
          draft?: string | null
          draught?: number | null
          engine_power?: number | null
          eta?: string | null
          flag?: string | null
          fuel_consumption?: number | null
          gross_tonnage?: number | null
          id?: number
          imo?: string | null
          last_updated?: string | null
          length?: number | null
          loading_port?: string | null
          market_price?: number | null
          marketprice?: string | null
          metadata?: Json | null
          mmsi?: string | null
          name: string
          nav_status?: string | null
          oil_source?: string | null
          oil_type?: string | null
          operator_name?: string | null
          owner_name?: string | null
          price?: number | null
          quantity?: number | null
          refinery_id?: string | null
          route_distance?: number | null
          route_info?: string | null
          routedistance?: string | null
          seller_name?: string | null
          shipping_type?: string | null
          source_company?: string | null
          speed?: string | null
          status?: string | null
          target_refinery?: string | null
          updated_at?: string | null
          vessel_type?: string | null
          vesselstatus?: string | null
          width?: number | null
        }
        Update: {
          arrival_date?: string | null
          beam?: string | null
          built?: number | null
          buyer_name?: string | null
          callsign?: string | null
          cargo_capacity?: number | null
          cargo_quantity?: number | null
          cargo_type?: string | null
          company_id?: number | null
          course?: number | null
          created_at?: string | null
          crew_size?: number | null
          current_lat?: number | null
          current_lng?: number | null
          current_region?: string | null
          currentport?: string | null
          deadweight?: number | null
          deal_value?: number | null
          dealvalue?: string | null
          departure_date?: string | null
          departure_lat?: number | null
          departure_lng?: number | null
          departure_port?: number | null
          destination?: string | null
          destination_lat?: number | null
          destination_lng?: number | null
          destination_port?: number | null
          draft?: string | null
          draught?: number | null
          engine_power?: number | null
          eta?: string | null
          flag?: string | null
          fuel_consumption?: number | null
          gross_tonnage?: number | null
          id?: number
          imo?: string | null
          last_updated?: string | null
          length?: number | null
          loading_port?: string | null
          market_price?: number | null
          marketprice?: string | null
          metadata?: Json | null
          mmsi?: string | null
          name?: string
          nav_status?: string | null
          oil_source?: string | null
          oil_type?: string | null
          operator_name?: string | null
          owner_name?: string | null
          price?: number | null
          quantity?: number | null
          refinery_id?: string | null
          route_distance?: number | null
          route_info?: string | null
          routedistance?: string | null
          seller_name?: string | null
          shipping_type?: string | null
          source_company?: string | null
          speed?: string | null
          status?: string | null
          target_refinery?: string | null
          updated_at?: string | null
          vessel_type?: string | null
          vesselstatus?: string | null
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_vessels_company"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_vessels_departure_port"
            columns: ["departure_port"]
            isOneToOne: false
            referencedRelation: "ports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_vessels_destination_port"
            columns: ["destination_port"]
            isOneToOne: false
            referencedRelation: "ports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vessels_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vessels_departure_port_fkey"
            columns: ["departure_port"]
            isOneToOne: false
            referencedRelation: "ports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vessels_destination_port_fkey"
            columns: ["destination_port"]
            isOneToOne: false
            referencedRelation: "ports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vessels_refinery_id_fkey"
            columns: ["refinery_id"]
            isOneToOne: false
            referencedRelation: "refineries"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_broker_membership_status: {
        Args: { user_id_param?: string }
        Returns: Json
      }
      check_subscription_status: {
        Args: { user_email: string }
        Returns: Json
      }
      check_user_access: {
        Args: { user_email: string }
        Returns: {
          access_type: string
          has_access: boolean
          is_subscribed: boolean
          trial_days_left: number
        }[]
      }
      check_user_access_unified: {
        Args: { user_email: string }
        Returns: {
          access_type: string
          has_access: boolean
          is_subscribed: boolean
          subscription_tier: string
          trial_days_left: number
          trial_end_date: string
        }[]
      }
      generate_maritime_random_data: {
        Args: { data_type?: string; field_name: string }
        Returns: string
      }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      get_user_role_safe: {
        Args: { user_uuid: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      get_users_with_roles: {
        Args: Record<PropertyKey, never>
        Returns: {
          created_at: string
          email: string
          email_confirmed_at: string
          id: string
          last_sign_in_at: string
          role: Database["public"]["Enums"]["app_role"]
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      has_user_downloaded_document: {
        Args: { p_document_id: string; p_user_id: string; p_vessel_id: number }
        Returns: boolean
      }
      is_admin: {
        Args: { user_id_param?: string }
        Returns: boolean
      }
      is_trial_expired: {
        Args: { user_email: string }
        Returns: boolean
      }
      start_plan_trial: {
        Args: {
          plan_tier_param: string
          user_email: string
          user_id_param: string
        }
        Returns: undefined
      }
      start_subscription_with_trial: {
        Args: {
          plan_tier_param: string
          trial_days?: number
          user_email: string
          user_id_param: string
        }
        Returns: Json
      }
      start_trial_period: {
        Args: { user_email: string; user_id_param: string }
        Returns: Json
      }
      start_trial_secure: {
        Args: { user_email: string; user_id_param: string }
        Returns: Json
      }
      validate_subscription_access: {
        Args: { required_tier?: string; user_email: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "broker" | "trader" | "user"
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
      app_role: ["admin", "broker", "trader", "user"],
    },
  },
} as const

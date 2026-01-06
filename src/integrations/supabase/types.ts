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
      admin_notes: {
        Row: {
          admin_id: string | null
          category: string | null
          content: string | null
          created_at: string | null
          id: string
          priority: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          admin_id?: string | null
          category?: string | null
          content?: string | null
          created_at?: string | null
          id?: string
          priority?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          admin_id?: string | null
          category?: string | null
          content?: string | null
          created_at?: string | null
          id?: string
          priority?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      agent_executions: {
        Row: {
          agent_id: string | null
          completed_at: string | null
          current_step: number | null
          error_message: string | null
          execution_time_ms: number | null
          execution_trace: Json | null
          id: string
          openai_run_id: string | null
          openai_thread_id: string | null
          source: string | null
          started_at: string | null
          status: string | null
          steps_completed: Json | null
          trigger_data: Json | null
          trigger_event: string | null
          workflow_id: string | null
        }
        Insert: {
          agent_id?: string | null
          completed_at?: string | null
          current_step?: number | null
          error_message?: string | null
          execution_time_ms?: number | null
          execution_trace?: Json | null
          id?: string
          openai_run_id?: string | null
          openai_thread_id?: string | null
          source?: string | null
          started_at?: string | null
          status?: string | null
          steps_completed?: Json | null
          trigger_data?: Json | null
          trigger_event?: string | null
          workflow_id?: string | null
        }
        Update: {
          agent_id?: string | null
          completed_at?: string | null
          current_step?: number | null
          error_message?: string | null
          execution_time_ms?: number | null
          execution_trace?: Json | null
          id?: string
          openai_run_id?: string | null
          openai_thread_id?: string | null
          source?: string | null
          started_at?: string | null
          status?: string | null
          steps_completed?: Json | null
          trigger_data?: Json | null
          trigger_event?: string | null
          workflow_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_executions_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "ai_agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_executions_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "agent_workflows"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_tools: {
        Row: {
          avg_execution_time_ms: number | null
          category: string | null
          created_at: string
          description: string | null
          edge_function_url: string | null
          execution_count: number | null
          function_name: string
          id: string
          is_active: boolean | null
          is_system: boolean | null
          last_executed_at: string | null
          last_execution_status: string | null
          name: string
          parameters: Json | null
        }
        Insert: {
          avg_execution_time_ms?: number | null
          category?: string | null
          created_at?: string
          description?: string | null
          edge_function_url?: string | null
          execution_count?: number | null
          function_name: string
          id?: string
          is_active?: boolean | null
          is_system?: boolean | null
          last_executed_at?: string | null
          last_execution_status?: string | null
          name: string
          parameters?: Json | null
        }
        Update: {
          avg_execution_time_ms?: number | null
          category?: string | null
          created_at?: string
          description?: string | null
          edge_function_url?: string | null
          execution_count?: number | null
          function_name?: string
          id?: string
          is_active?: boolean | null
          is_system?: boolean | null
          last_executed_at?: string | null
          last_execution_status?: string | null
          name?: string
          parameters?: Json | null
        }
        Relationships: []
      }
      agent_workflows: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          schedule: Json | null
          steps: Json | null
          trigger_event: string | null
          updated_at: string
          version: number | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          schedule?: Json | null
          steps?: Json | null
          trigger_event?: string | null
          updated_at?: string
          version?: number | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          schedule?: Json | null
          steps?: Json | null
          trigger_event?: string | null
          updated_at?: string
          version?: number | null
        }
        Relationships: []
      }
      ai_agents: {
        Row: {
          auto_workflows_generated: boolean | null
          behaviors: Json | null
          compiled_json: Json | null
          created_at: string
          created_by: string | null
          description: string | null
          execution_context: Json | null
          id: string
          is_active: boolean | null
          linked_assistant_id: string | null
          model: string
          name: string
          openai_workflow_id: string | null
          system_prompt: string | null
          tools: Json | null
          triggers: Json | null
          updated_at: string
          workflow_versions: Json | null
          workflows: Json | null
        }
        Insert: {
          auto_workflows_generated?: boolean | null
          behaviors?: Json | null
          compiled_json?: Json | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          execution_context?: Json | null
          id?: string
          is_active?: boolean | null
          linked_assistant_id?: string | null
          model?: string
          name: string
          openai_workflow_id?: string | null
          system_prompt?: string | null
          tools?: Json | null
          triggers?: Json | null
          updated_at?: string
          workflow_versions?: Json | null
          workflows?: Json | null
        }
        Update: {
          auto_workflows_generated?: boolean | null
          behaviors?: Json | null
          compiled_json?: Json | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          execution_context?: Json | null
          id?: string
          is_active?: boolean | null
          linked_assistant_id?: string | null
          model?: string
          name?: string
          openai_workflow_id?: string | null
          system_prompt?: string | null
          tools?: Json | null
          triggers?: Json | null
          updated_at?: string
          workflow_versions?: Json | null
          workflows?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_agents_linked_assistant_id_fkey"
            columns: ["linked_assistant_id"]
            isOneToOne: false
            referencedRelation: "ai_assistants"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_assistants: {
        Row: {
          code_interpreter: boolean | null
          created_at: string
          created_by: string | null
          description: string | null
          file_search: boolean | null
          id: string
          instructions: string | null
          is_active: boolean | null
          model: string
          name: string
          openai_assistant_id: string | null
          tools: Json | null
          updated_at: string
        }
        Insert: {
          code_interpreter?: boolean | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          file_search?: boolean | null
          id?: string
          instructions?: string | null
          is_active?: boolean | null
          model?: string
          name: string
          openai_assistant_id?: string | null
          tools?: Json | null
          updated_at?: string
        }
        Update: {
          code_interpreter?: boolean | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          file_search?: boolean | null
          id?: string
          instructions?: string | null
          is_active?: boolean | null
          model?: string
          name?: string
          openai_assistant_id?: string | null
          tools?: Json | null
          updated_at?: string
        }
        Relationships: []
      }
      api_keys: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          key_hash: string
          key_prefix: string
          last_used_at: string | null
          name: string
          permissions: Json | null
          rate_limit_per_day: number | null
          rate_limit_per_hour: number | null
          rate_limit_per_minute: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          key_hash: string
          key_prefix: string
          last_used_at?: string | null
          name: string
          permissions?: Json | null
          rate_limit_per_day?: number | null
          rate_limit_per_hour?: number | null
          rate_limit_per_minute?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          key_hash?: string
          key_prefix?: string
          last_used_at?: string | null
          name?: string
          permissions?: Json | null
          rate_limit_per_day?: number | null
          rate_limit_per_hour?: number | null
          rate_limit_per_minute?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      api_usage_logs: {
        Row: {
          api_key_id: string | null
          created_at: string | null
          endpoint: string
          error_message: string | null
          id: string
          ip_address: unknown
          method: string
          request_body: Json | null
          response_body: Json | null
          response_time_ms: number | null
          status_code: number | null
          user_agent: string | null
        }
        Insert: {
          api_key_id?: string | null
          created_at?: string | null
          endpoint: string
          error_message?: string | null
          id?: string
          ip_address?: unknown
          method: string
          request_body?: Json | null
          response_body?: Json | null
          response_time_ms?: number | null
          status_code?: number | null
          user_agent?: string | null
        }
        Update: {
          api_key_id?: string | null
          created_at?: string | null
          endpoint?: string
          error_message?: string | null
          id?: string
          ip_address?: unknown
          method?: string
          request_body?: Json | null
          response_body?: Json | null
          response_time_ms?: number | null
          status_code?: number | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "api_usage_logs_api_key_id_fkey"
            columns: ["api_key_id"]
            isOneToOne: false
            referencedRelation: "api_keys"
            referencedColumns: ["id"]
          },
        ]
      }
      assistant_conversations: {
        Row: {
          assistant_id: string | null
          created_at: string
          id: string
          messages: Json | null
          openai_thread_id: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          assistant_id?: string | null
          created_at?: string
          id?: string
          messages?: Json | null
          openai_thread_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          assistant_id?: string | null
          created_at?: string
          id?: string
          messages?: Json | null
          openai_thread_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assistant_conversations_assistant_id_fkey"
            columns: ["assistant_id"]
            isOneToOne: false
            referencedRelation: "ai_assistants"
            referencedColumns: ["id"]
          },
        ]
      }
      auto_reply_rules: {
        Row: {
          ai_enabled: boolean | null
          created_at: string | null
          custom_response: string | null
          enabled: boolean | null
          id: string
          keywords: string[] | null
          name: string
          priority: number | null
          template_id: string | null
          updated_at: string | null
        }
        Insert: {
          ai_enabled?: boolean | null
          created_at?: string | null
          custom_response?: string | null
          enabled?: boolean | null
          id?: string
          keywords?: string[] | null
          name: string
          priority?: number | null
          template_id?: string | null
          updated_at?: string | null
        }
        Update: {
          ai_enabled?: boolean | null
          created_at?: string | null
          custom_response?: string | null
          enabled?: boolean | null
          id?: string
          keywords?: string[] | null
          name?: string
          priority?: number | null
          template_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "auto_reply_rules_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "email_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      banner_configs: {
        Row: {
          created_at: string | null
          cta_link: string | null
          cta_text: string | null
          end_date: string | null
          id: string
          is_active: boolean | null
          show_countdown: boolean | null
          start_date: string
          subtitle: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          cta_link?: string | null
          cta_text?: string | null
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          show_countdown?: boolean | null
          start_date?: string
          subtitle?: string | null
          title?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          cta_link?: string | null
          cta_text?: string | null
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          show_countdown?: boolean | null
          start_date?: string
          subtitle?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      blog_categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      blog_posts: {
        Row: {
          author_id: string | null
          category_id: string | null
          content: string
          created_at: string
          excerpt: string | null
          featured_image: string | null
          id: string
          meta_description: string | null
          meta_keywords: string[] | null
          meta_title: string | null
          publish_date: string | null
          slug: string
          status: string
          tags: string[] | null
          title: string
          updated_at: string
          views: number | null
        }
        Insert: {
          author_id?: string | null
          category_id?: string | null
          content: string
          created_at?: string
          excerpt?: string | null
          featured_image?: string | null
          id?: string
          meta_description?: string | null
          meta_keywords?: string[] | null
          meta_title?: string | null
          publish_date?: string | null
          slug: string
          status?: string
          tags?: string[] | null
          title: string
          updated_at?: string
          views?: number | null
        }
        Update: {
          author_id?: string | null
          category_id?: string | null
          content?: string
          created_at?: string
          excerpt?: string | null
          featured_image?: string | null
          id?: string
          meta_description?: string | null
          meta_keywords?: string[] | null
          meta_title?: string | null
          publish_date?: string | null
          slug?: string
          status?: string
          tags?: string[] | null
          title?: string
          updated_at?: string
          views?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "blog_posts_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "blog_categories"
            referencedColumns: ["id"]
          },
        ]
      }
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
            foreignKeyName: "broker_chat_messages_broker_id_fkey"
            columns: ["broker_id"]
            isOneToOne: false
            referencedRelation: "broker_profiles_public"
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
            foreignKeyName: "broker_deals_broker_id_fkey"
            columns: ["broker_id"]
            isOneToOne: false
            referencedRelation: "broker_profiles_public"
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
      broker_membership_content: {
        Row: {
          billing_cycle: string
          created_at: string
          description: string
          discount_badge_text: string | null
          features: Json
          guarantee_text: string | null
          id: string
          is_active: boolean
          original_price: number | null
          payment_note: string | null
          price: number
          sale_price: number | null
          savings_text: string | null
          title: string
          updated_at: string
        }
        Insert: {
          billing_cycle?: string
          created_at?: string
          description?: string
          discount_badge_text?: string | null
          features?: Json
          guarantee_text?: string | null
          id?: string
          is_active?: boolean
          original_price?: number | null
          payment_note?: string | null
          price?: number
          sale_price?: number | null
          savings_text?: string | null
          title?: string
          updated_at?: string
        }
        Update: {
          billing_cycle?: string
          created_at?: string
          description?: string
          discount_badge_text?: string | null
          features?: Json
          guarantee_text?: string | null
          id?: string
          is_active?: boolean
          original_price?: number | null
          payment_note?: string | null
          price?: number
          sale_price?: number | null
          savings_text?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
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
      broker_template_permissions: {
        Row: {
          broker_membership_id: string
          can_download: boolean | null
          created_at: string | null
          id: string
          max_downloads_per_template: number | null
          template_id: string
          updated_at: string | null
        }
        Insert: {
          broker_membership_id: string
          can_download?: boolean | null
          created_at?: string | null
          id?: string
          max_downloads_per_template?: number | null
          template_id: string
          updated_at?: string | null
        }
        Update: {
          broker_membership_id?: string
          can_download?: boolean | null
          created_at?: string | null
          id?: string
          max_downloads_per_template?: number | null
          template_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "broker_template_permissions_broker_membership_id_fkey"
            columns: ["broker_membership_id"]
            isOneToOne: false
            referencedRelation: "broker_memberships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "broker_template_permissions_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "document_templates"
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
      buyer_companies: {
        Row: {
          address: string | null
          annual_revenue: number | null
          city: string | null
          company_objective: string | null
          compliance_notes: string | null
          country: string | null
          country_risk: string | null
          created_at: string
          description: string | null
          director_photo_url: string | null
          email: string | null
          employees_count: number | null
          founded_year: number | null
          id: string
          industry: string | null
          is_verified: boolean | null
          kyc_status: string | null
          legal_address: string | null
          logo_url: string | null
          name: string
          official_email: string | null
          operations_email: string | null
          passport_country: string | null
          passport_number: string | null
          phone: string | null
          primary_activity: string | null
          registration_country: string | null
          registration_number: string | null
          representative_email: string | null
          representative_name: string | null
          representative_title: string | null
          sanctions_status: string | null
          signatory_signature_url: string | null
          trade_name: string | null
          trading_regions: string[] | null
          updated_at: string
          website: string | null
        }
        Insert: {
          address?: string | null
          annual_revenue?: number | null
          city?: string | null
          company_objective?: string | null
          compliance_notes?: string | null
          country?: string | null
          country_risk?: string | null
          created_at?: string
          description?: string | null
          director_photo_url?: string | null
          email?: string | null
          employees_count?: number | null
          founded_year?: number | null
          id?: string
          industry?: string | null
          is_verified?: boolean | null
          kyc_status?: string | null
          legal_address?: string | null
          logo_url?: string | null
          name: string
          official_email?: string | null
          operations_email?: string | null
          passport_country?: string | null
          passport_number?: string | null
          phone?: string | null
          primary_activity?: string | null
          registration_country?: string | null
          registration_number?: string | null
          representative_email?: string | null
          representative_name?: string | null
          representative_title?: string | null
          sanctions_status?: string | null
          signatory_signature_url?: string | null
          trade_name?: string | null
          trading_regions?: string[] | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          address?: string | null
          annual_revenue?: number | null
          city?: string | null
          company_objective?: string | null
          compliance_notes?: string | null
          country?: string | null
          country_risk?: string | null
          created_at?: string
          description?: string | null
          director_photo_url?: string | null
          email?: string | null
          employees_count?: number | null
          founded_year?: number | null
          id?: string
          industry?: string | null
          is_verified?: boolean | null
          kyc_status?: string | null
          legal_address?: string | null
          logo_url?: string | null
          name?: string
          official_email?: string | null
          operations_email?: string | null
          passport_country?: string | null
          passport_number?: string | null
          phone?: string | null
          primary_activity?: string | null
          registration_country?: string | null
          registration_number?: string | null
          representative_email?: string | null
          representative_name?: string | null
          representative_title?: string | null
          sanctions_status?: string | null
          signatory_signature_url?: string | null
          trade_name?: string | null
          trading_regions?: string[] | null
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      buyer_company_bank_accounts: {
        Row: {
          account_name: string
          account_number: string | null
          bank_address: string | null
          bank_name: string
          beneficiary_address: string | null
          company_id: string
          created_at: string
          currency: string | null
          iban: string | null
          id: string
          is_primary: boolean | null
          swift_code: string | null
          updated_at: string
        }
        Insert: {
          account_name: string
          account_number?: string | null
          bank_address?: string | null
          bank_name: string
          beneficiary_address?: string | null
          company_id: string
          created_at?: string
          currency?: string | null
          iban?: string | null
          id?: string
          is_primary?: boolean | null
          swift_code?: string | null
          updated_at?: string
        }
        Update: {
          account_name?: string
          account_number?: string | null
          bank_address?: string | null
          bank_name?: string
          beneficiary_address?: string | null
          company_id?: string
          created_at?: string
          currency?: string | null
          iban?: string | null
          id?: string
          is_primary?: boolean | null
          swift_code?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "buyer_company_bank_accounts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "buyer_companies"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_recipients: {
        Row: {
          campaign_id: string | null
          created_at: string | null
          email: string
          error_message: string | null
          id: string
          name: string | null
          placeholders: Json | null
          sent_at: string | null
          status: string | null
        }
        Insert: {
          campaign_id?: string | null
          created_at?: string | null
          email: string
          error_message?: string | null
          id?: string
          name?: string | null
          placeholders?: Json | null
          sent_at?: string | null
          status?: string | null
        }
        Update: {
          campaign_id?: string | null
          created_at?: string | null
          email?: string
          error_message?: string | null
          id?: string
          name?: string | null
          placeholders?: Json | null
          sent_at?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "campaign_recipients_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "email_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      chatbot_configs: {
        Row: {
          allowed_topics: string[] | null
          blocked_topics: string[] | null
          created_at: string | null
          created_by: string | null
          description: string | null
          escalation_triggers: Json | null
          id: string
          is_active: boolean | null
          is_default: boolean | null
          linked_assistant_id: string | null
          name: string
          platform_data_access: boolean | null
          rules: Json | null
          updated_at: string | null
          welcome_message: string | null
        }
        Insert: {
          allowed_topics?: string[] | null
          blocked_topics?: string[] | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          escalation_triggers?: Json | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          linked_assistant_id?: string | null
          name: string
          platform_data_access?: boolean | null
          rules?: Json | null
          updated_at?: string | null
          welcome_message?: string | null
        }
        Update: {
          allowed_topics?: string[] | null
          blocked_topics?: string[] | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          escalation_triggers?: Json | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          linked_assistant_id?: string | null
          name?: string
          platform_data_access?: boolean | null
          rules?: Json | null
          updated_at?: string | null
          welcome_message?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chatbot_configs_linked_assistant_id_fkey"
            columns: ["linked_assistant_id"]
            isOneToOne: false
            referencedRelation: "ai_assistants"
            referencedColumns: ["id"]
          },
        ]
      }
      chatbot_conversations: {
        Row: {
          chatbot_config_id: string | null
          created_at: string | null
          escalated: boolean | null
          escalated_to_ticket_id: string | null
          id: string
          messages: Json | null
          metadata: Json | null
          status: string | null
          subscription_tier: string | null
          updated_at: string | null
          user_email: string | null
          user_id: string | null
          user_name: string | null
        }
        Insert: {
          chatbot_config_id?: string | null
          created_at?: string | null
          escalated?: boolean | null
          escalated_to_ticket_id?: string | null
          id?: string
          messages?: Json | null
          metadata?: Json | null
          status?: string | null
          subscription_tier?: string | null
          updated_at?: string | null
          user_email?: string | null
          user_id?: string | null
          user_name?: string | null
        }
        Update: {
          chatbot_config_id?: string | null
          created_at?: string | null
          escalated?: boolean | null
          escalated_to_ticket_id?: string | null
          id?: string
          messages?: Json | null
          metadata?: Json | null
          status?: string | null
          subscription_tier?: string | null
          updated_at?: string | null
          user_email?: string | null
          user_id?: string | null
          user_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chatbot_conversations_chatbot_config_id_fkey"
            columns: ["chatbot_config_id"]
            isOneToOne: false
            referencedRelation: "chatbot_configs"
            referencedColumns: ["id"]
          },
        ]
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
      cms_footer_content: {
        Row: {
          column_name: string
          column_order: number | null
          created_at: string | null
          id: string
          is_active: boolean | null
          items: Json | null
          updated_at: string | null
        }
        Insert: {
          column_name: string
          column_order?: number | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          items?: Json | null
          updated_at?: string | null
        }
        Update: {
          column_name?: string
          column_order?: number | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          items?: Json | null
          updated_at?: string | null
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
      cms_menu_items: {
        Row: {
          created_at: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          link: string
          menu_location: string | null
          order_index: number | null
          parent_id: string | null
          requires_auth: boolean | null
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          link: string
          menu_location?: string | null
          order_index?: number | null
          parent_id?: string | null
          requires_auth?: boolean | null
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          link?: string
          menu_location?: string | null
          order_index?: number | null
          parent_id?: string | null
          requires_auth?: boolean | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cms_menu_items_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "cms_menu_items"
            referencedColumns: ["id"]
          },
        ]
      }
      cms_page_content: {
        Row: {
          content_sections: Json | null
          created_at: string | null
          hero_cta_link: string | null
          hero_cta_text: string | null
          hero_image_url: string | null
          hero_subtitle: string | null
          hero_title: string | null
          id: string
          is_editable: boolean | null
          is_in_sitemap: boolean | null
          is_published: boolean | null
          meta_description: string | null
          meta_title: string | null
          page_category: string | null
          page_name: string
          page_slug: string
          seo_keywords: string[] | null
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          content_sections?: Json | null
          created_at?: string | null
          hero_cta_link?: string | null
          hero_cta_text?: string | null
          hero_image_url?: string | null
          hero_subtitle?: string | null
          hero_title?: string | null
          id?: string
          is_editable?: boolean | null
          is_in_sitemap?: boolean | null
          is_published?: boolean | null
          meta_description?: string | null
          meta_title?: string | null
          page_category?: string | null
          page_name: string
          page_slug: string
          seo_keywords?: string[] | null
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          content_sections?: Json | null
          created_at?: string | null
          hero_cta_link?: string | null
          hero_cta_text?: string | null
          hero_image_url?: string | null
          hero_subtitle?: string | null
          hero_title?: string | null
          id?: string
          is_editable?: boolean | null
          is_in_sitemap?: boolean | null
          is_published?: boolean | null
          meta_description?: string | null
          meta_title?: string | null
          page_category?: string | null
          page_name?: string
          page_slug?: string
          seo_keywords?: string[] | null
          sort_order?: number | null
          updated_at?: string | null
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
          company_objective: string | null
          company_type: string
          compliance_notes: string | null
          country: string | null
          country_risk: string | null
          created_at: string | null
          description: string | null
          director_photo_url: string | null
          email: string | null
          employees_count: number | null
          founded_year: number | null
          headquarters_address: string | null
          id: number
          industry: string | null
          is_refinery_owner: boolean | null
          is_verified: boolean | null
          kyc_status: string | null
          legal_address: string | null
          loading_ports: string[] | null
          logo_url: string | null
          name: string
          official_email: string | null
          operations_email: string | null
          owner_name: string | null
          passport_country: string | null
          passport_number: string | null
          phone: string | null
          primary_activity: string | null
          products_supplied: string[] | null
          refinery_capacity_bpd: number | null
          refinery_location: string | null
          refinery_name: string | null
          registration_country: string | null
          registration_number: string | null
          representative_email: string | null
          representative_name: string | null
          representative_title: string | null
          sanctions_status: string | null
          signatory_signature_url: string | null
          trade_name: string | null
          trading_regions: string[] | null
          updated_at: string | null
          website: string | null
        }
        Insert: {
          address?: string | null
          annual_revenue?: number | null
          ceo_name?: string | null
          city?: string | null
          company_objective?: string | null
          company_type?: string
          compliance_notes?: string | null
          country?: string | null
          country_risk?: string | null
          created_at?: string | null
          description?: string | null
          director_photo_url?: string | null
          email?: string | null
          employees_count?: number | null
          founded_year?: number | null
          headquarters_address?: string | null
          id?: number
          industry?: string | null
          is_refinery_owner?: boolean | null
          is_verified?: boolean | null
          kyc_status?: string | null
          legal_address?: string | null
          loading_ports?: string[] | null
          logo_url?: string | null
          name: string
          official_email?: string | null
          operations_email?: string | null
          owner_name?: string | null
          passport_country?: string | null
          passport_number?: string | null
          phone?: string | null
          primary_activity?: string | null
          products_supplied?: string[] | null
          refinery_capacity_bpd?: number | null
          refinery_location?: string | null
          refinery_name?: string | null
          registration_country?: string | null
          registration_number?: string | null
          representative_email?: string | null
          representative_name?: string | null
          representative_title?: string | null
          sanctions_status?: string | null
          signatory_signature_url?: string | null
          trade_name?: string | null
          trading_regions?: string[] | null
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          address?: string | null
          annual_revenue?: number | null
          ceo_name?: string | null
          city?: string | null
          company_objective?: string | null
          company_type?: string
          compliance_notes?: string | null
          country?: string | null
          country_risk?: string | null
          created_at?: string | null
          description?: string | null
          director_photo_url?: string | null
          email?: string | null
          employees_count?: number | null
          founded_year?: number | null
          headquarters_address?: string | null
          id?: number
          industry?: string | null
          is_refinery_owner?: boolean | null
          is_verified?: boolean | null
          kyc_status?: string | null
          legal_address?: string | null
          loading_ports?: string[] | null
          logo_url?: string | null
          name?: string
          official_email?: string | null
          operations_email?: string | null
          owner_name?: string | null
          passport_country?: string | null
          passport_number?: string | null
          phone?: string | null
          primary_activity?: string | null
          products_supplied?: string[] | null
          refinery_capacity_bpd?: number | null
          refinery_location?: string | null
          refinery_name?: string | null
          registration_country?: string | null
          registration_number?: string | null
          representative_email?: string | null
          representative_name?: string | null
          representative_title?: string | null
          sanctions_status?: string | null
          signatory_signature_url?: string | null
          trade_name?: string | null
          trading_regions?: string[] | null
          updated_at?: string | null
          website?: string | null
        }
        Relationships: []
      }
      company_bank_accounts: {
        Row: {
          account_name: string
          account_number: string
          bank_address: string
          bank_name: string
          beneficiary_address: string
          company_id: number
          created_at: string | null
          currency: string | null
          iban: string
          id: string
          is_primary: boolean | null
          swift_code: string
          updated_at: string | null
        }
        Insert: {
          account_name: string
          account_number: string
          bank_address: string
          bank_name: string
          beneficiary_address: string
          company_id: number
          created_at?: string | null
          currency?: string | null
          iban: string
          id?: string
          is_primary?: boolean | null
          swift_code: string
          updated_at?: string | null
        }
        Update: {
          account_name?: string
          account_number?: string
          bank_address?: string
          bank_name?: string
          beneficiary_address?: string
          company_id?: number
          created_at?: string | null
          currency?: string | null
          iban?: string
          id?: string
          is_primary?: boolean | null
          swift_code?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_bank_accounts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
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
      deal_step_templates: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          requires_file: boolean | null
          step_description: string | null
          step_name: string
          step_number: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          requires_file?: boolean | null
          step_description?: string | null
          step_name: string
          step_number: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          requires_file?: boolean | null
          step_description?: string | null
          step_name?: string
          step_number?: number
          updated_at?: string | null
        }
        Relationships: []
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
      document_saved_templates: {
        Row: {
          content: string
          content_format: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          document_type: string
          entity_types: string[] | null
          id: string
          is_public: boolean | null
          name: string
          placeholders: string[] | null
          updated_at: string | null
        }
        Insert: {
          content: string
          content_format?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          document_type: string
          entity_types?: string[] | null
          id?: string
          is_public?: boolean | null
          name: string
          placeholders?: string[] | null
          updated_at?: string | null
        }
        Update: {
          content?: string
          content_format?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          document_type?: string
          entity_types?: string[] | null
          id?: string
          is_public?: boolean | null
          name?: string
          placeholders?: string[] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      document_templates: {
        Row: {
          analysis_result: Json | null
          broker_only: boolean | null
          created_at: string | null
          created_by: string | null
          description: string | null
          field_mappings: Json | null
          file_name: string
          file_size: number | null
          file_url: string | null
          font_family: string | null
          font_size: number | null
          id: string
          is_active: boolean | null
          last_tested: string | null
          mapping_confidence: number | null
          mime_type: string | null
          name: string | null
          placeholder_mappings: Json | null
          placeholders: Json | null
          requires_broker_membership: boolean
          supports_pdf: boolean | null
          template_file: string | null
          test_results: Json | null
          title: string | null
          updated_at: string | null
          uploaded_at: string | null
        }
        Insert: {
          analysis_result?: Json | null
          broker_only?: boolean | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          field_mappings?: Json | null
          file_name: string
          file_size?: number | null
          file_url?: string | null
          font_family?: string | null
          font_size?: number | null
          id?: string
          is_active?: boolean | null
          last_tested?: string | null
          mapping_confidence?: number | null
          mime_type?: string | null
          name?: string | null
          placeholder_mappings?: Json | null
          placeholders?: Json | null
          requires_broker_membership?: boolean
          supports_pdf?: boolean | null
          template_file?: string | null
          test_results?: Json | null
          title?: string | null
          updated_at?: string | null
          uploaded_at?: string | null
        }
        Update: {
          analysis_result?: Json | null
          broker_only?: boolean | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          field_mappings?: Json | null
          file_name?: string
          file_size?: number | null
          file_url?: string | null
          font_family?: string | null
          font_size?: number | null
          id?: string
          is_active?: boolean | null
          last_tested?: string | null
          mapping_confidence?: number | null
          mime_type?: string | null
          name?: string | null
          placeholder_mappings?: Json | null
          placeholders?: Json | null
          requires_broker_membership?: boolean
          supports_pdf?: boolean | null
          template_file?: string | null
          test_results?: Json | null
          title?: string | null
          updated_at?: string | null
          uploaded_at?: string | null
        }
        Relationships: []
      }
      document_type_templates: {
        Row: {
          created_at: string | null
          default_prompt: string | null
          description: string | null
          id: string
          is_active: boolean | null
          legal_sections: Json | null
          name: string
          recommended_entity_types: string[] | null
          short_code: string
          typical_page_range: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          default_prompt?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          legal_sections?: Json | null
          name: string
          recommended_entity_types?: string[] | null
          short_code: string
          typical_page_range?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          default_prompt?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          legal_sections?: Json | null
          name?: string
          recommended_entity_types?: string[] | null
          short_code?: string
          typical_page_range?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      email_accounts: {
        Row: {
          account_name: string
          created_at: string | null
          email_address: string
          enable_tls: boolean | null
          id: string
          imap_host: string | null
          imap_password: string | null
          imap_port: number | null
          imap_username: string | null
          is_active: boolean | null
          is_default: boolean | null
          last_tested_at: string | null
          smtp_host: string | null
          smtp_password: string | null
          smtp_port: number | null
          smtp_username: string | null
          test_status: string | null
          updated_at: string | null
        }
        Insert: {
          account_name: string
          created_at?: string | null
          email_address: string
          enable_tls?: boolean | null
          id?: string
          imap_host?: string | null
          imap_password?: string | null
          imap_port?: number | null
          imap_username?: string | null
          is_active?: boolean | null
          is_default?: boolean | null
          last_tested_at?: string | null
          smtp_host?: string | null
          smtp_password?: string | null
          smtp_port?: number | null
          smtp_username?: string | null
          test_status?: string | null
          updated_at?: string | null
        }
        Update: {
          account_name?: string
          created_at?: string | null
          email_address?: string
          enable_tls?: boolean | null
          id?: string
          imap_host?: string | null
          imap_password?: string | null
          imap_port?: number | null
          imap_username?: string | null
          is_active?: boolean | null
          is_default?: boolean | null
          last_tested_at?: string | null
          smtp_host?: string | null
          smtp_password?: string | null
          smtp_port?: number | null
          smtp_username?: string | null
          test_status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      email_automation_rules: {
        Row: {
          conditions: Json | null
          created_at: string | null
          delay_minutes: number | null
          id: string
          is_enabled: boolean | null
          name: string
          template_id: string | null
          trigger_event: string
          updated_at: string | null
        }
        Insert: {
          conditions?: Json | null
          created_at?: string | null
          delay_minutes?: number | null
          id?: string
          is_enabled?: boolean | null
          name: string
          template_id?: string | null
          trigger_event: string
          updated_at?: string | null
        }
        Update: {
          conditions?: Json | null
          created_at?: string | null
          delay_minutes?: number | null
          id?: string
          is_enabled?: boolean | null
          name?: string
          template_id?: string | null
          trigger_event?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_automation_rules_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "email_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      email_campaigns: {
        Row: {
          body: string
          created_at: string | null
          created_by: string | null
          email_account_id: string | null
          failed_count: number | null
          html_content: string | null
          id: string
          name: string
          scheduled_at: string | null
          sent_at: string | null
          sent_count: number | null
          status: string | null
          subject: string
          total_recipients: number | null
          updated_at: string | null
        }
        Insert: {
          body: string
          created_at?: string | null
          created_by?: string | null
          email_account_id?: string | null
          failed_count?: number | null
          html_content?: string | null
          id?: string
          name: string
          scheduled_at?: string | null
          sent_at?: string | null
          sent_count?: number | null
          status?: string | null
          subject: string
          total_recipients?: number | null
          updated_at?: string | null
        }
        Update: {
          body?: string
          created_at?: string | null
          created_by?: string | null
          email_account_id?: string | null
          failed_count?: number | null
          html_content?: string | null
          id?: string
          name?: string
          scheduled_at?: string | null
          sent_at?: string | null
          sent_count?: number | null
          status?: string | null
          subject?: string
          total_recipients?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_campaigns_email_account_id_fkey"
            columns: ["email_account_id"]
            isOneToOne: false
            referencedRelation: "email_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      email_configurations: {
        Row: {
          active: boolean | null
          check_interval: number | null
          created_at: string | null
          enable_auto_reply: boolean | null
          enable_tls: boolean | null
          from_email: string | null
          from_name: string | null
          host: string
          id: string
          password: string
          port: number
          type: string
          updated_at: string | null
          username: string
        }
        Insert: {
          active?: boolean | null
          check_interval?: number | null
          created_at?: string | null
          enable_auto_reply?: boolean | null
          enable_tls?: boolean | null
          from_email?: string | null
          from_name?: string | null
          host: string
          id?: string
          password: string
          port: number
          type: string
          updated_at?: string | null
          username: string
        }
        Update: {
          active?: boolean | null
          check_interval?: number | null
          created_at?: string | null
          enable_auto_reply?: boolean | null
          enable_tls?: boolean | null
          from_email?: string | null
          from_name?: string | null
          host?: string
          id?: string
          password?: string
          port?: number
          type?: string
          updated_at?: string | null
          username?: string
        }
        Relationships: []
      }
      email_logs: {
        Row: {
          body: string | null
          created_at: string | null
          error_message: string | null
          id: string
          sent_at: string | null
          status: string | null
          subject: string
          template_id: string | null
          to_email: string
        }
        Insert: {
          body?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          sent_at?: string | null
          status?: string | null
          subject: string
          template_id?: string | null
          to_email: string
        }
        Update: {
          body?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          sent_at?: string | null
          status?: string | null
          subject?: string
          template_id?: string | null
          to_email?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_logs_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "email_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      email_sending_history: {
        Row: {
          automation_rule_id: string | null
          body: string | null
          error_message: string | null
          id: string
          metadata: Json | null
          recipient_email: string
          sent_at: string | null
          source: string | null
          status: string | null
          subject: string
          template_id: string | null
          template_name: string | null
        }
        Insert: {
          automation_rule_id?: string | null
          body?: string | null
          error_message?: string | null
          id?: string
          metadata?: Json | null
          recipient_email: string
          sent_at?: string | null
          source?: string | null
          status?: string | null
          subject: string
          template_id?: string | null
          template_name?: string | null
        }
        Update: {
          automation_rule_id?: string | null
          body?: string | null
          error_message?: string | null
          id?: string
          metadata?: Json | null
          recipient_email?: string
          sent_at?: string | null
          source?: string | null
          status?: string | null
          subject?: string
          template_id?: string | null
          template_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_sending_history_automation_rule_id_fkey"
            columns: ["automation_rule_id"]
            isOneToOne: false
            referencedRelation: "email_automation_rules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_sending_history_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "email_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      email_templates: {
        Row: {
          active: boolean | null
          body: string
          category: string | null
          created_at: string | null
          email_account_id: string | null
          html_source: string | null
          id: string
          name: string
          subject: string
          updated_at: string | null
          variables: Json | null
        }
        Insert: {
          active?: boolean | null
          body: string
          category?: string | null
          created_at?: string | null
          email_account_id?: string | null
          html_source?: string | null
          id?: string
          name: string
          subject: string
          updated_at?: string | null
          variables?: Json | null
        }
        Update: {
          active?: boolean | null
          body?: string
          category?: string | null
          created_at?: string | null
          email_account_id?: string | null
          html_source?: string | null
          id?: string
          name?: string
          subject?: string
          updated_at?: string | null
          variables?: Json | null
        }
        Relationships: []
      }
      event_registry: {
        Row: {
          category: string
          created_at: string | null
          description: string | null
          event_name: string
          id: string
          is_active: boolean | null
          payload_schema: Json | null
          sample_payload: Json | null
          updated_at: string | null
        }
        Insert: {
          category?: string
          created_at?: string | null
          description?: string | null
          event_name: string
          id?: string
          is_active?: boolean | null
          payload_schema?: Json | null
          sample_payload?: Json | null
          updated_at?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          description?: string | null
          event_name?: string
          id?: string
          is_active?: boolean | null
          payload_schema?: Json | null
          sample_payload?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      external_openai_workflows: {
        Row: {
          callback_url: string | null
          configuration: Json | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          openai_workflow_id: string
          updated_at: string
        }
        Insert: {
          callback_url?: string | null
          configuration?: Json | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          openai_workflow_id: string
          updated_at?: string
        }
        Update: {
          callback_url?: string | null
          configuration?: Json | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          openai_workflow_id?: string
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
      generated_documents: {
        Row: {
          ai_prompt: string | null
          created_at: string | null
          created_by: string | null
          document_type: string
          entity_type: string
          estimated_pages: number | null
          generated_content: string | null
          id: string
          placeholders_from_db: Json | null
          placeholders_generated: Json | null
          selected_entity_id: string | null
          status: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          ai_prompt?: string | null
          created_at?: string | null
          created_by?: string | null
          document_type: string
          entity_type: string
          estimated_pages?: number | null
          generated_content?: string | null
          id?: string
          placeholders_from_db?: Json | null
          placeholders_generated?: Json | null
          selected_entity_id?: string | null
          status?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          ai_prompt?: string | null
          created_at?: string | null
          created_by?: string | null
          document_type?: string
          entity_type?: string
          estimated_pages?: number | null
          generated_content?: string | null
          id?: string
          placeholders_from_db?: Json | null
          placeholders_generated?: Json | null
          selected_entity_id?: string | null
          status?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      imfpa_agreements: {
        Row: {
          bank_name: string | null
          bank_swift: string | null
          beneficiary_account_masked: string | null
          broker_company_number: string | null
          broker_entity_name: string | null
          broker_registration_country: string | null
          broker_role: string | null
          buyer_entity_name: string | null
          commission_type: string | null
          commission_value: number | null
          commodity_type: string | null
          created_at: string | null
          currency: string | null
          deal_id: string | null
          document_url: string | null
          governing_law: string | null
          imfpa_id: string
          imfpa_reference_code: string | null
          jurisdiction: string | null
          payment_method: string | null
          payment_trigger: string | null
          seller_entity_name: string | null
          signature_hash: string | null
          signed_by_broker: boolean | null
          signed_by_buyer: boolean | null
          signed_by_seller: boolean | null
          status: string | null
          updated_at: string | null
          valid_from: string | null
          valid_until: string | null
        }
        Insert: {
          bank_name?: string | null
          bank_swift?: string | null
          beneficiary_account_masked?: string | null
          broker_company_number?: string | null
          broker_entity_name?: string | null
          broker_registration_country?: string | null
          broker_role?: string | null
          buyer_entity_name?: string | null
          commission_type?: string | null
          commission_value?: number | null
          commodity_type?: string | null
          created_at?: string | null
          currency?: string | null
          deal_id?: string | null
          document_url?: string | null
          governing_law?: string | null
          imfpa_id?: string
          imfpa_reference_code?: string | null
          jurisdiction?: string | null
          payment_method?: string | null
          payment_trigger?: string | null
          seller_entity_name?: string | null
          signature_hash?: string | null
          signed_by_broker?: boolean | null
          signed_by_buyer?: boolean | null
          signed_by_seller?: boolean | null
          status?: string | null
          updated_at?: string | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Update: {
          bank_name?: string | null
          bank_swift?: string | null
          beneficiary_account_masked?: string | null
          broker_company_number?: string | null
          broker_entity_name?: string | null
          broker_registration_country?: string | null
          broker_role?: string | null
          buyer_entity_name?: string | null
          commission_type?: string | null
          commission_value?: number | null
          commodity_type?: string | null
          created_at?: string | null
          currency?: string | null
          deal_id?: string | null
          document_url?: string | null
          governing_law?: string | null
          imfpa_id?: string
          imfpa_reference_code?: string | null
          jurisdiction?: string | null
          payment_method?: string | null
          payment_trigger?: string | null
          seller_entity_name?: string | null
          signature_hash?: string | null
          signed_by_broker?: boolean | null
          signed_by_buyer?: boolean | null
          signed_by_seller?: boolean | null
          status?: string | null
          updated_at?: string | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "imfpa_agreements_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "broker_deals"
            referencedColumns: ["id"]
          },
        ]
      }
      incoming_emails: {
        Row: {
          auto_replied: boolean | null
          body: string
          created_at: string | null
          from_email: string
          id: string
          processed: boolean | null
          received_at: string | null
          replied_at: string | null
          reply_body: string | null
          subject: string
        }
        Insert: {
          auto_replied?: boolean | null
          body: string
          created_at?: string | null
          from_email: string
          id?: string
          processed?: boolean | null
          received_at?: string | null
          replied_at?: string | null
          reply_body?: string | null
          subject: string
        }
        Update: {
          auto_replied?: boolean | null
          body?: string
          created_at?: string | null
          from_email?: string
          id?: string
          processed?: boolean | null
          received_at?: string | null
          replied_at?: string | null
          reply_body?: string | null
          subject?: string
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
      marketing_events: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          display_name: string
          event_name: string
          event_params: Json | null
          id: string
          is_enabled: boolean | null
          providers: string[] | null
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          display_name: string
          event_name: string
          event_params?: Json | null
          id?: string
          is_enabled?: boolean | null
          providers?: string[] | null
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          display_name?: string
          event_name?: string
          event_params?: Json | null
          id?: string
          is_enabled?: boolean | null
          providers?: string[] | null
          updated_at?: string
        }
        Relationships: []
      }
      marketing_popups: {
        Row: {
          button_link: string | null
          button_text: string | null
          collect_email: boolean | null
          collect_name: boolean | null
          collect_phone: boolean | null
          content: string | null
          created_at: string | null
          created_by: string | null
          display_delay_seconds: number | null
          end_date: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          popup_type: string
          show_on_all_pages: boolean | null
          show_once_per_session: boolean | null
          start_date: string | null
          style_config: Json | null
          subtitle: string | null
          title: string
          trigger_pages: string[] | null
          updated_at: string | null
        }
        Insert: {
          button_link?: string | null
          button_text?: string | null
          collect_email?: boolean | null
          collect_name?: boolean | null
          collect_phone?: boolean | null
          content?: string | null
          created_at?: string | null
          created_by?: string | null
          display_delay_seconds?: number | null
          end_date?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          popup_type?: string
          show_on_all_pages?: boolean | null
          show_once_per_session?: boolean | null
          start_date?: string | null
          style_config?: Json | null
          subtitle?: string | null
          title: string
          trigger_pages?: string[] | null
          updated_at?: string | null
        }
        Update: {
          button_link?: string | null
          button_text?: string | null
          collect_email?: boolean | null
          collect_name?: boolean | null
          collect_phone?: boolean | null
          content?: string | null
          created_at?: string | null
          created_by?: string | null
          display_delay_seconds?: number | null
          end_date?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          popup_type?: string
          show_on_all_pages?: boolean | null
          show_once_per_session?: boolean | null
          start_date?: string | null
          style_config?: Json | null
          subtitle?: string | null
          title?: string
          trigger_pages?: string[] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      marketing_settings: {
        Row: {
          config: Json | null
          created_at: string
          created_by: string | null
          id: string
          is_enabled: boolean | null
          name: string | null
          provider: string
          tracking_id: string
          updated_at: string
        }
        Insert: {
          config?: Json | null
          created_at?: string
          created_by?: string | null
          id?: string
          is_enabled?: boolean | null
          name?: string | null
          provider: string
          tracking_id: string
          updated_at?: string
        }
        Update: {
          config?: Json | null
          created_at?: string
          created_by?: string | null
          id?: string
          is_enabled?: boolean | null
          name?: string | null
          provider?: string
          tracking_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      newsletter_subscribers: {
        Row: {
          created_at: string | null
          email: string
          id: string
          source: string | null
          status: string | null
          subscribed_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          source?: string | null
          status?: string | null
          subscribed_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          source?: string | null
          status?: string | null
          subscribed_at?: string | null
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
      oil_products: {
        Row: {
          analysis_date: string | null
          ash_content_max: number | null
          carbon_residue_max: number | null
          cetane_number_min: number | null
          cloud_point_c: number | null
          coa_url: string | null
          color_max: number | null
          commodity_name: string
          commodity_type: string | null
          contract_duration_months: number | null
          contract_type: string | null
          created_at: string
          created_by: string | null
          currency: string | null
          delivery_terms: string | null
          density_kg_m3: number | null
          destination_ports: string[] | null
          discharge_ports: string[] | null
          distillation_range: string | null
          fame_content_max: number | null
          flash_point_min_c: number | null
          grade: string | null
          id: string
          incoterms: string | null
          is_active: boolean | null
          lab_certificate_url: string | null
          lab_name: string | null
          loading_ports: string[] | null
          lubricity_um: number | null
          msds_url: string | null
          notes: string | null
          option_months: number | null
          origin: string | null
          origin_country: string | null
          oxidation_stability: number | null
          payment_condition: string | null
          payment_days: number | null
          payment_terms: string | null
          pour_point_c: number | null
          premium_discount: number | null
          price_basis: string | null
          price_reference: string | null
          price_type: string | null
          product_code: string | null
          q88_document_url: string | null
          quantity_max_mt: number | null
          quantity_min_mt: number | null
          quantity_unit: string | null
          refinery_id: string | null
          status: string | null
          sulphur_content_ppm: number | null
          supplier_company_id: string | null
          test_method: string | null
          updated_at: string
          viscosity_cst: number | null
          water_content_max_ppm: number | null
        }
        Insert: {
          analysis_date?: string | null
          ash_content_max?: number | null
          carbon_residue_max?: number | null
          cetane_number_min?: number | null
          cloud_point_c?: number | null
          coa_url?: string | null
          color_max?: number | null
          commodity_name: string
          commodity_type?: string | null
          contract_duration_months?: number | null
          contract_type?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string | null
          delivery_terms?: string | null
          density_kg_m3?: number | null
          destination_ports?: string[] | null
          discharge_ports?: string[] | null
          distillation_range?: string | null
          fame_content_max?: number | null
          flash_point_min_c?: number | null
          grade?: string | null
          id?: string
          incoterms?: string | null
          is_active?: boolean | null
          lab_certificate_url?: string | null
          lab_name?: string | null
          loading_ports?: string[] | null
          lubricity_um?: number | null
          msds_url?: string | null
          notes?: string | null
          option_months?: number | null
          origin?: string | null
          origin_country?: string | null
          oxidation_stability?: number | null
          payment_condition?: string | null
          payment_days?: number | null
          payment_terms?: string | null
          pour_point_c?: number | null
          premium_discount?: number | null
          price_basis?: string | null
          price_reference?: string | null
          price_type?: string | null
          product_code?: string | null
          q88_document_url?: string | null
          quantity_max_mt?: number | null
          quantity_min_mt?: number | null
          quantity_unit?: string | null
          refinery_id?: string | null
          status?: string | null
          sulphur_content_ppm?: number | null
          supplier_company_id?: string | null
          test_method?: string | null
          updated_at?: string
          viscosity_cst?: number | null
          water_content_max_ppm?: number | null
        }
        Update: {
          analysis_date?: string | null
          ash_content_max?: number | null
          carbon_residue_max?: number | null
          cetane_number_min?: number | null
          cloud_point_c?: number | null
          coa_url?: string | null
          color_max?: number | null
          commodity_name?: string
          commodity_type?: string | null
          contract_duration_months?: number | null
          contract_type?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string | null
          delivery_terms?: string | null
          density_kg_m3?: number | null
          destination_ports?: string[] | null
          discharge_ports?: string[] | null
          distillation_range?: string | null
          fame_content_max?: number | null
          flash_point_min_c?: number | null
          grade?: string | null
          id?: string
          incoterms?: string | null
          is_active?: boolean | null
          lab_certificate_url?: string | null
          lab_name?: string | null
          loading_ports?: string[] | null
          lubricity_um?: number | null
          msds_url?: string | null
          notes?: string | null
          option_months?: number | null
          origin?: string | null
          origin_country?: string | null
          oxidation_stability?: number | null
          payment_condition?: string | null
          payment_days?: number | null
          payment_terms?: string | null
          pour_point_c?: number | null
          premium_discount?: number | null
          price_basis?: string | null
          price_reference?: string | null
          price_type?: string | null
          product_code?: string | null
          q88_document_url?: string | null
          quantity_max_mt?: number | null
          quantity_min_mt?: number | null
          quantity_unit?: string | null
          refinery_id?: string | null
          status?: string | null
          sulphur_content_ppm?: number | null
          supplier_company_id?: string | null
          test_method?: string | null
          updated_at?: string
          viscosity_cst?: number | null
          water_content_max_ppm?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "oil_products_refinery_id_fkey"
            columns: ["refinery_id"]
            isOneToOne: false
            referencedRelation: "refineries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "oil_products_supplier_company_id_fkey"
            columns: ["supplier_company_id"]
            isOneToOne: false
            referencedRelation: "seller_companies"
            referencedColumns: ["id"]
          },
        ]
      }
      plan_template_permissions: {
        Row: {
          can_download: boolean | null
          created_at: string | null
          id: string
          max_downloads_per_template: number | null
          plan_id: string
          template_id: string
          updated_at: string | null
        }
        Insert: {
          can_download?: boolean | null
          created_at?: string | null
          id?: string
          max_downloads_per_template?: number | null
          plan_id: string
          template_id: string
          updated_at?: string | null
        }
        Update: {
          can_download?: boolean | null
          created_at?: string | null
          id?: string
          max_downloads_per_template?: number | null
          plan_id?: string
          template_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "plan_template_permissions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plan_template_permissions_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "document_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      popup_subscribers: {
        Row: {
          email: string | null
          id: string
          ip_address: string | null
          name: string | null
          page_subscribed_from: string | null
          phone: string | null
          popup_id: string | null
          subscribed_at: string | null
          user_agent: string | null
        }
        Insert: {
          email?: string | null
          id?: string
          ip_address?: string | null
          name?: string | null
          page_subscribed_from?: string | null
          phone?: string | null
          popup_id?: string | null
          subscribed_at?: string | null
          user_agent?: string | null
        }
        Update: {
          email?: string | null
          id?: string
          ip_address?: string | null
          name?: string | null
          page_subscribed_from?: string | null
          phone?: string | null
          popup_id?: string | null
          subscribed_at?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "popup_subscribers_popup_id_fkey"
            columns: ["popup_id"]
            isOneToOne: false
            referencedRelation: "marketing_popups"
            referencedColumns: ["id"]
          },
        ]
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
          completed_at: string | null
          created_at: string | null
          created_by: string | null
          file_name: string
          id: string
          pdf_file: string | null
          processed_file: string | null
          processing_log: string | null
          processing_status: string | null
          template_id: string | null
          vessel_id: number | null
          vessel_imo: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          file_name: string
          id?: string
          pdf_file?: string | null
          processed_file?: string | null
          processing_log?: string | null
          processing_status?: string | null
          template_id?: string | null
          vessel_id?: number | null
          vessel_imo?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          file_name?: string
          id?: string
          pdf_file?: string | null
          processed_file?: string | null
          processing_log?: string | null
          processing_status?: string | null
          template_id?: string | null
          vessel_id?: number | null
          vessel_imo?: string | null
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
      promotion_frames: {
        Row: {
          billing_cycle: string | null
          created_at: string | null
          description: string | null
          discount_type: string | null
          discount_value: number | null
          eligible_plans: string[] | null
          end_date: string | null
          id: string
          is_active: boolean | null
          placement: string | null
          show_countdown: boolean | null
          show_on_home: boolean | null
          show_on_registration: boolean | null
          show_on_subscription: boolean | null
          start_date: string
          title: string
          updated_at: string | null
        }
        Insert: {
          billing_cycle?: string | null
          created_at?: string | null
          description?: string | null
          discount_type?: string | null
          discount_value?: number | null
          eligible_plans?: string[] | null
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          placement?: string | null
          show_countdown?: boolean | null
          show_on_home?: boolean | null
          show_on_registration?: boolean | null
          show_on_subscription?: boolean | null
          start_date?: string
          title?: string
          updated_at?: string | null
        }
        Update: {
          billing_cycle?: string | null
          created_at?: string | null
          description?: string | null
          discount_type?: string | null
          discount_value?: number | null
          eligible_plans?: string[] | null
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          placement?: string | null
          show_countdown?: boolean | null
          show_on_home?: boolean | null
          show_on_registration?: boolean | null
          show_on_subscription?: boolean | null
          start_date?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: []
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
      seller_companies: {
        Row: {
          address: string | null
          annual_revenue: number | null
          city: string | null
          company_objective: string | null
          compliance_notes: string | null
          country: string | null
          country_risk: string | null
          created_at: string
          description: string | null
          director_photo_url: string | null
          email: string | null
          employees_count: number | null
          founded_year: number | null
          id: string
          industry: string | null
          is_refinery_owner: boolean | null
          is_verified: boolean | null
          kyc_status: string | null
          legal_address: string | null
          loading_ports: string[] | null
          logo_url: string | null
          name: string
          official_email: string | null
          operations_email: string | null
          passport_country: string | null
          passport_number: string | null
          phone: string | null
          primary_activity: string | null
          products_supplied: string[] | null
          refinery_capacity_bpd: number | null
          refinery_location: string | null
          refinery_name: string | null
          registration_country: string | null
          registration_number: string | null
          representative_email: string | null
          representative_name: string | null
          representative_title: string | null
          sanctions_status: string | null
          signatory_signature_url: string | null
          trade_name: string | null
          trading_regions: string[] | null
          updated_at: string
          website: string | null
        }
        Insert: {
          address?: string | null
          annual_revenue?: number | null
          city?: string | null
          company_objective?: string | null
          compliance_notes?: string | null
          country?: string | null
          country_risk?: string | null
          created_at?: string
          description?: string | null
          director_photo_url?: string | null
          email?: string | null
          employees_count?: number | null
          founded_year?: number | null
          id?: string
          industry?: string | null
          is_refinery_owner?: boolean | null
          is_verified?: boolean | null
          kyc_status?: string | null
          legal_address?: string | null
          loading_ports?: string[] | null
          logo_url?: string | null
          name: string
          official_email?: string | null
          operations_email?: string | null
          passport_country?: string | null
          passport_number?: string | null
          phone?: string | null
          primary_activity?: string | null
          products_supplied?: string[] | null
          refinery_capacity_bpd?: number | null
          refinery_location?: string | null
          refinery_name?: string | null
          registration_country?: string | null
          registration_number?: string | null
          representative_email?: string | null
          representative_name?: string | null
          representative_title?: string | null
          sanctions_status?: string | null
          signatory_signature_url?: string | null
          trade_name?: string | null
          trading_regions?: string[] | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          address?: string | null
          annual_revenue?: number | null
          city?: string | null
          company_objective?: string | null
          compliance_notes?: string | null
          country?: string | null
          country_risk?: string | null
          created_at?: string
          description?: string | null
          director_photo_url?: string | null
          email?: string | null
          employees_count?: number | null
          founded_year?: number | null
          id?: string
          industry?: string | null
          is_refinery_owner?: boolean | null
          is_verified?: boolean | null
          kyc_status?: string | null
          legal_address?: string | null
          loading_ports?: string[] | null
          logo_url?: string | null
          name?: string
          official_email?: string | null
          operations_email?: string | null
          passport_country?: string | null
          passport_number?: string | null
          phone?: string | null
          primary_activity?: string | null
          products_supplied?: string[] | null
          refinery_capacity_bpd?: number | null
          refinery_location?: string | null
          refinery_name?: string | null
          registration_country?: string | null
          registration_number?: string | null
          representative_email?: string | null
          representative_name?: string | null
          representative_title?: string | null
          sanctions_status?: string | null
          signatory_signature_url?: string | null
          trade_name?: string | null
          trading_regions?: string[] | null
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      seller_company_bank_accounts: {
        Row: {
          account_name: string
          account_number: string | null
          bank_address: string | null
          bank_name: string
          beneficiary_address: string | null
          company_id: string
          created_at: string
          currency: string | null
          iban: string | null
          id: string
          is_primary: boolean | null
          swift_code: string | null
          updated_at: string
        }
        Insert: {
          account_name: string
          account_number?: string | null
          bank_address?: string | null
          bank_name: string
          beneficiary_address?: string | null
          company_id: string
          created_at?: string
          currency?: string | null
          iban?: string | null
          id?: string
          is_primary?: boolean | null
          swift_code?: string | null
          updated_at?: string
        }
        Update: {
          account_name?: string
          account_number?: string | null
          bank_address?: string | null
          bank_name?: string
          beneficiary_address?: string | null
          company_id?: string
          created_at?: string
          currency?: string | null
          iban?: string | null
          id?: string
          is_primary?: boolean | null
          swift_code?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "seller_company_bank_accounts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "seller_companies"
            referencedColumns: ["id"]
          },
        ]
      }
      sponsor_banners: {
        Row: {
          created_at: string
          display_order: number
          id: string
          is_active: boolean
          show_on_dashboard_map: boolean
          show_on_footer: boolean
          show_on_registration: boolean
          sponsor_logo_url: string | null
          sponsor_name: string
          sponsor_text: string
          sponsor_website_url: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          show_on_dashboard_map?: boolean
          show_on_footer?: boolean
          show_on_registration?: boolean
          sponsor_logo_url?: string | null
          sponsor_name: string
          sponsor_text: string
          sponsor_website_url?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          show_on_dashboard_map?: boolean
          show_on_footer?: boolean
          show_on_registration?: boolean
          sponsor_logo_url?: string | null
          sponsor_name?: string
          sponsor_text?: string
          sponsor_website_url?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      stripe_configuration: {
        Row: {
          created_at: string | null
          id: string
          publishable_key: string
          secret_key: string
          stripe_mode: string
          updated_at: string | null
          webhook_secret: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          publishable_key: string
          secret_key: string
          stripe_mode: string
          updated_at?: string | null
          webhook_secret?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          publishable_key?: string
          secret_key?: string
          stripe_mode?: string
          updated_at?: string | null
          webhook_secret?: string | null
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
          has_broker_subscription: boolean | null
          id: string
          is_locked: boolean | null
          is_trial_active: boolean | null
          last_payment_failure: string | null
          locked_at: string | null
          locked_reason: string | null
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
          selected_plan_tier: string | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          subscribed: boolean
          subscription_duration_months: number | null
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
          has_broker_subscription?: boolean | null
          id?: string
          is_locked?: boolean | null
          is_trial_active?: boolean | null
          last_payment_failure?: string | null
          locked_at?: string | null
          locked_reason?: string | null
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
          selected_plan_tier?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscribed?: boolean
          subscription_duration_months?: number | null
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
          has_broker_subscription?: boolean | null
          id?: string
          is_locked?: boolean | null
          is_trial_active?: boolean | null
          last_payment_failure?: string | null
          locked_at?: string | null
          locked_reason?: string | null
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
          selected_plan_tier?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscribed?: boolean
          subscription_duration_months?: number | null
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
          first_time_only: boolean | null
          id: string
          is_active: boolean | null
          max_redemptions: number | null
          plan_tier: string
          promo_code: string | null
          stripe_coupon_id: string | null
          stripe_promo_code_id: string | null
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
          first_time_only?: boolean | null
          id?: string
          is_active?: boolean | null
          max_redemptions?: number | null
          plan_tier: string
          promo_code?: string | null
          stripe_coupon_id?: string | null
          stripe_promo_code_id?: string | null
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
          first_time_only?: boolean | null
          id?: string
          is_active?: boolean | null
          max_redemptions?: number | null
          plan_tier?: string
          promo_code?: string | null
          stripe_coupon_id?: string | null
          stripe_promo_code_id?: string | null
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
          max_downloads_per_month: number | null
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
          max_downloads_per_month?: number | null
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
          max_downloads_per_month?: number | null
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
      support_contact_info: {
        Row: {
          business_hours: string
          email_support: string
          id: string
          phone_support: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          business_hours?: string
          email_support?: string
          id?: string
          phone_support?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          business_hours?: string
          email_support?: string
          id?: string
          phone_support?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      support_faqs: {
        Row: {
          answer: string
          category: string
          created_at: string
          id: string
          is_active: boolean
          question: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          answer: string
          category?: string
          created_at?: string
          id?: string
          is_active?: boolean
          question: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          answer?: string
          category?: string
          created_at?: string
          id?: string
          is_active?: boolean
          question?: string
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
      system_settings: {
        Row: {
          description: string | null
          id: string
          setting_key: string
          setting_value: Json | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          description?: string | null
          id?: string
          setting_key: string
          setting_value?: Json | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          description?: string | null
          id?: string
          setting_key?: string
          setting_value?: Json | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      template_files: {
        Row: {
          file_content: string | null
          file_data: string | null
          file_name: string | null
          file_size: number | null
          filename: string | null
          id: string
          mime_type: string | null
          sha256: string | null
          template_id: string | null
          uploaded_at: string | null
        }
        Insert: {
          file_content?: string | null
          file_data?: string | null
          file_name?: string | null
          file_size?: number | null
          filename?: string | null
          id?: string
          mime_type?: string | null
          sha256?: string | null
          template_id?: string | null
          uploaded_at?: string | null
        }
        Update: {
          file_content?: string | null
          file_data?: string | null
          file_name?: string | null
          file_size?: number | null
          filename?: string | null
          id?: string
          mime_type?: string | null
          sha256?: string | null
          template_id?: string | null
          uploaded_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "template_files_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "document_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      template_mapping_associations: {
        Row: {
          created_at: string
          id: string
          mapping_id: string
          override_value: string | null
          template_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          mapping_id: string
          override_value?: string | null
          template_id: string
        }
        Update: {
          created_at?: string
          id?: string
          mapping_id?: string
          override_value?: string | null
          template_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "template_mapping_associations_mapping_id_fkey"
            columns: ["mapping_id"]
            isOneToOne: false
            referencedRelation: "template_placeholder_mappings"
            referencedColumns: ["id"]
          },
        ]
      }
      template_placeholder_mappings: {
        Row: {
          created_at: string
          default_value: string | null
          description: string | null
          id: string
          is_global: boolean | null
          mapped_field: string | null
          name: string
          placeholder_key: string
          placeholder_type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          default_value?: string | null
          description?: string | null
          id?: string
          is_global?: boolean | null
          mapped_field?: string | null
          name: string
          placeholder_key: string
          placeholder_type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          default_value?: string | null
          description?: string | null
          id?: string
          is_global?: boolean | null
          mapped_field?: string | null
          name?: string
          placeholder_key?: string
          placeholder_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      template_placeholders: {
        Row: {
          created_at: string
          csv_field: string | null
          csv_id: string | null
          csv_row: number | null
          custom_value: string | null
          database_field: string | null
          database_table: string | null
          id: string
          placeholder: string
          random_option: string
          source: string
          template_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          csv_field?: string | null
          csv_id?: string | null
          csv_row?: number | null
          custom_value?: string | null
          database_field?: string | null
          database_table?: string | null
          id?: string
          placeholder: string
          random_option?: string
          source?: string
          template_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          csv_field?: string | null
          csv_id?: string | null
          csv_row?: number | null
          custom_value?: string | null
          database_field?: string | null
          database_table?: string | null
          id?: string
          placeholder?: string
          random_option?: string
          source?: string
          template_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "template_placeholders_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "document_templates"
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
      unsubscribe_requests: {
        Row: {
          admin_notes: string | null
          approved_at: string | null
          approved_by: string | null
          created_at: string | null
          id: string
          policy_accepted: boolean | null
          reason: string | null
          requested_at: string | null
          status: string | null
          subscriber_id: string | null
          subscription_end_date: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          id?: string
          policy_accepted?: boolean | null
          reason?: string | null
          requested_at?: string | null
          status?: string | null
          subscriber_id?: string | null
          subscription_end_date?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          id?: string
          policy_accepted?: boolean | null
          reason?: string | null
          requested_at?: string | null
          status?: string | null
          subscriber_id?: string | null
          subscription_end_date?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "unsubscribe_requests_subscriber_id_fkey"
            columns: ["subscriber_id"]
            isOneToOne: false
            referencedRelation: "subscribers"
            referencedColumns: ["id"]
          },
        ]
      }
      user_document_downloads: {
        Row: {
          created_at: string | null
          download_type: string | null
          file_size: number | null
          id: string
          template_id: string
          user_id: string
          vessel_imo: string | null
        }
        Insert: {
          created_at?: string | null
          download_type?: string | null
          file_size?: number | null
          id?: string
          template_id: string
          user_id: string
          vessel_imo?: string | null
        }
        Update: {
          created_at?: string | null
          download_type?: string | null
          file_size?: number | null
          id?: string
          template_id?: string
          user_id?: string
          vessel_imo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_document_downloads_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "document_templates"
            referencedColumns: ["id"]
          },
        ]
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
      user_notifications: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          is_global: boolean | null
          is_read: boolean
          is_read_by: string[] | null
          message: string
          target_user_id: string | null
          target_user_ids: string[] | null
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_global?: boolean | null
          is_read?: boolean
          is_read_by?: string[] | null
          message: string
          target_user_id?: string | null
          target_user_ids?: string[] | null
          title: string
          type?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_global?: boolean | null
          is_read?: boolean
          is_read_by?: string[] | null
          message?: string
          target_user_id?: string | null
          target_user_ids?: string[] | null
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
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
      utm_tracking: {
        Row: {
          created_at: string
          id: string
          landing_page: string | null
          referrer: string | null
          session_id: string | null
          user_id: string | null
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          landing_page?: string | null
          referrer?: string | null
          session_id?: string | null
          user_id?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          landing_page?: string | null
          referrer?: string | null
          session_id?: string | null
          user_id?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Relationships: []
      }
      vessel_connections: {
        Row: {
          ai_confidence: string | null
          ai_notes: string | null
          arrival_detected: boolean | null
          arrival_detected_at: string | null
          buyer_company: string | null
          cargo_quantity: number | null
          cargo_type: string | null
          charter_type: string | null
          charterer: string | null
          created_at: string | null
          currency: string | null
          current_lat: number | null
          current_lng: number | null
          departure_port_id: number | null
          destination_port_id: number | null
          eta: string | null
          etd: string | null
          freight_rate: number | null
          id: string
          load_status: string | null
          market_price: number | null
          payment_terms: string | null
          receiver: string | null
          seller_company: string | null
          shipper: string | null
          target_refinery_id: string | null
          updated_at: string | null
          vessel_id: number | null
          voyage_status: string | null
        }
        Insert: {
          ai_confidence?: string | null
          ai_notes?: string | null
          arrival_detected?: boolean | null
          arrival_detected_at?: string | null
          buyer_company?: string | null
          cargo_quantity?: number | null
          cargo_type?: string | null
          charter_type?: string | null
          charterer?: string | null
          created_at?: string | null
          currency?: string | null
          current_lat?: number | null
          current_lng?: number | null
          departure_port_id?: number | null
          destination_port_id?: number | null
          eta?: string | null
          etd?: string | null
          freight_rate?: number | null
          id?: string
          load_status?: string | null
          market_price?: number | null
          payment_terms?: string | null
          receiver?: string | null
          seller_company?: string | null
          shipper?: string | null
          target_refinery_id?: string | null
          updated_at?: string | null
          vessel_id?: number | null
          voyage_status?: string | null
        }
        Update: {
          ai_confidence?: string | null
          ai_notes?: string | null
          arrival_detected?: boolean | null
          arrival_detected_at?: string | null
          buyer_company?: string | null
          cargo_quantity?: number | null
          cargo_type?: string | null
          charter_type?: string | null
          charterer?: string | null
          created_at?: string | null
          currency?: string | null
          current_lat?: number | null
          current_lng?: number | null
          departure_port_id?: number | null
          destination_port_id?: number | null
          eta?: string | null
          etd?: string | null
          freight_rate?: number | null
          id?: string
          load_status?: string | null
          market_price?: number | null
          payment_terms?: string | null
          receiver?: string | null
          seller_company?: string | null
          shipper?: string | null
          target_refinery_id?: string | null
          updated_at?: string | null
          vessel_id?: number | null
          voyage_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vessel_connections_departure_port_id_fkey"
            columns: ["departure_port_id"]
            isOneToOne: false
            referencedRelation: "ports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vessel_connections_destination_port_id_fkey"
            columns: ["destination_port_id"]
            isOneToOne: false
            referencedRelation: "ports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vessel_connections_vessel_id_fkey"
            columns: ["vessel_id"]
            isOneToOne: false
            referencedRelation: "vessels"
            referencedColumns: ["id"]
          },
        ]
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
          ai_autofill_source: string | null
          arrival_date: string | null
          beam: string | null
          benchmark_reference: string | null
          built: number | null
          buyer_company_id: number | null
          buyer_name: string | null
          callsign: string | null
          cargo_capacity: number | null
          cargo_capacity_bbl: number | null
          cargo_origin_country: string | null
          cargo_quantity: number | null
          cargo_type: string | null
          commodity_category: string | null
          commodity_name: string | null
          commodity_source_company_id: number | null
          company_id: number | null
          contract_type: string | null
          course: number | null
          created_at: string | null
          crew_size: number | null
          current_lat: number | null
          current_lng: number | null
          current_region: string | null
          currentport: string | null
          deadweight: number | null
          deal_reference_id: string | null
          deal_status: string | null
          deal_value: number | null
          dealvalue: string | null
          delivery_method: string | null
          delivery_terms: string | null
          departure_date: string | null
          departure_lat: number | null
          departure_lng: number | null
          departure_port: number | null
          destination: string | null
          destination_lat: number | null
          destination_lng: number | null
          destination_port: number | null
          discharge_port: string | null
          draft: string | null
          draught: number | null
          engine_power: number | null
          eta: string | null
          flag: string | null
          fuel_consumption: number | null
          gross_tonnage: number | null
          hs_code: string | null
          id: number
          imo: string | null
          indicative_price: number | null
          last_updated: string | null
          length: number | null
          loading_port: string | null
          market_price: number | null
          marketprice: string | null
          max_quantity: number | null
          metadata: Json | null
          min_quantity: number | null
          mmsi: string | null
          name: string
          nav_status: string | null
          oil_source: string | null
          oil_type: string | null
          operator_name: string | null
          owner_name: string | null
          payment_method: string | null
          payment_notes: string | null
          payment_timing: string | null
          price: number | null
          price_basis: string | null
          price_notes: string | null
          quality_specification: string | null
          quantity: number | null
          quantity_unit: string | null
          refinery_id: string | null
          route_distance: number | null
          route_info: string | null
          routedistance: string | null
          sanctions_status: string | null
          seller_company_id: number | null
          seller_name: string | null
          service_speed: number | null
          shipping_type: string | null
          source_company: string | null
          source_refinery: string | null
          speed: string | null
          status: string | null
          target_refinery: string | null
          total_shipment_quantity: number | null
          updated_at: string | null
          vessel_type: string | null
          vesselstatus: string | null
          voyage_notes: string | null
          voyage_status: string | null
          width: number | null
        }
        Insert: {
          ai_autofill_source?: string | null
          arrival_date?: string | null
          beam?: string | null
          benchmark_reference?: string | null
          built?: number | null
          buyer_company_id?: number | null
          buyer_name?: string | null
          callsign?: string | null
          cargo_capacity?: number | null
          cargo_capacity_bbl?: number | null
          cargo_origin_country?: string | null
          cargo_quantity?: number | null
          cargo_type?: string | null
          commodity_category?: string | null
          commodity_name?: string | null
          commodity_source_company_id?: number | null
          company_id?: number | null
          contract_type?: string | null
          course?: number | null
          created_at?: string | null
          crew_size?: number | null
          current_lat?: number | null
          current_lng?: number | null
          current_region?: string | null
          currentport?: string | null
          deadweight?: number | null
          deal_reference_id?: string | null
          deal_status?: string | null
          deal_value?: number | null
          dealvalue?: string | null
          delivery_method?: string | null
          delivery_terms?: string | null
          departure_date?: string | null
          departure_lat?: number | null
          departure_lng?: number | null
          departure_port?: number | null
          destination?: string | null
          destination_lat?: number | null
          destination_lng?: number | null
          destination_port?: number | null
          discharge_port?: string | null
          draft?: string | null
          draught?: number | null
          engine_power?: number | null
          eta?: string | null
          flag?: string | null
          fuel_consumption?: number | null
          gross_tonnage?: number | null
          hs_code?: string | null
          id?: number
          imo?: string | null
          indicative_price?: number | null
          last_updated?: string | null
          length?: number | null
          loading_port?: string | null
          market_price?: number | null
          marketprice?: string | null
          max_quantity?: number | null
          metadata?: Json | null
          min_quantity?: number | null
          mmsi?: string | null
          name: string
          nav_status?: string | null
          oil_source?: string | null
          oil_type?: string | null
          operator_name?: string | null
          owner_name?: string | null
          payment_method?: string | null
          payment_notes?: string | null
          payment_timing?: string | null
          price?: number | null
          price_basis?: string | null
          price_notes?: string | null
          quality_specification?: string | null
          quantity?: number | null
          quantity_unit?: string | null
          refinery_id?: string | null
          route_distance?: number | null
          route_info?: string | null
          routedistance?: string | null
          sanctions_status?: string | null
          seller_company_id?: number | null
          seller_name?: string | null
          service_speed?: number | null
          shipping_type?: string | null
          source_company?: string | null
          source_refinery?: string | null
          speed?: string | null
          status?: string | null
          target_refinery?: string | null
          total_shipment_quantity?: number | null
          updated_at?: string | null
          vessel_type?: string | null
          vesselstatus?: string | null
          voyage_notes?: string | null
          voyage_status?: string | null
          width?: number | null
        }
        Update: {
          ai_autofill_source?: string | null
          arrival_date?: string | null
          beam?: string | null
          benchmark_reference?: string | null
          built?: number | null
          buyer_company_id?: number | null
          buyer_name?: string | null
          callsign?: string | null
          cargo_capacity?: number | null
          cargo_capacity_bbl?: number | null
          cargo_origin_country?: string | null
          cargo_quantity?: number | null
          cargo_type?: string | null
          commodity_category?: string | null
          commodity_name?: string | null
          commodity_source_company_id?: number | null
          company_id?: number | null
          contract_type?: string | null
          course?: number | null
          created_at?: string | null
          crew_size?: number | null
          current_lat?: number | null
          current_lng?: number | null
          current_region?: string | null
          currentport?: string | null
          deadweight?: number | null
          deal_reference_id?: string | null
          deal_status?: string | null
          deal_value?: number | null
          dealvalue?: string | null
          delivery_method?: string | null
          delivery_terms?: string | null
          departure_date?: string | null
          departure_lat?: number | null
          departure_lng?: number | null
          departure_port?: number | null
          destination?: string | null
          destination_lat?: number | null
          destination_lng?: number | null
          destination_port?: number | null
          discharge_port?: string | null
          draft?: string | null
          draught?: number | null
          engine_power?: number | null
          eta?: string | null
          flag?: string | null
          fuel_consumption?: number | null
          gross_tonnage?: number | null
          hs_code?: string | null
          id?: number
          imo?: string | null
          indicative_price?: number | null
          last_updated?: string | null
          length?: number | null
          loading_port?: string | null
          market_price?: number | null
          marketprice?: string | null
          max_quantity?: number | null
          metadata?: Json | null
          min_quantity?: number | null
          mmsi?: string | null
          name?: string
          nav_status?: string | null
          oil_source?: string | null
          oil_type?: string | null
          operator_name?: string | null
          owner_name?: string | null
          payment_method?: string | null
          payment_notes?: string | null
          payment_timing?: string | null
          price?: number | null
          price_basis?: string | null
          price_notes?: string | null
          quality_specification?: string | null
          quantity?: number | null
          quantity_unit?: string | null
          refinery_id?: string | null
          route_distance?: number | null
          route_info?: string | null
          routedistance?: string | null
          sanctions_status?: string | null
          seller_company_id?: number | null
          seller_name?: string | null
          service_speed?: number | null
          shipping_type?: string | null
          source_company?: string | null
          source_refinery?: string | null
          speed?: string | null
          status?: string | null
          target_refinery?: string | null
          total_shipment_quantity?: number | null
          updated_at?: string | null
          vessel_type?: string | null
          vesselstatus?: string | null
          voyage_notes?: string | null
          voyage_status?: string | null
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
            foreignKeyName: "vessels_buyer_company_id_fkey"
            columns: ["buyer_company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vessels_commodity_source_company_id_fkey"
            columns: ["commodity_source_company_id"]
            isOneToOne: false
            referencedRelation: "companies"
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
          {
            foreignKeyName: "vessels_seller_company_id_fkey"
            columns: ["seller_company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      webhook_deliveries: {
        Row: {
          attempt_number: number | null
          created_at: string | null
          delivered_at: string | null
          error_message: string | null
          event_type: string
          id: string
          payload: Json
          response_body: string | null
          status: string
          status_code: number | null
          webhook_id: string | null
        }
        Insert: {
          attempt_number?: number | null
          created_at?: string | null
          delivered_at?: string | null
          error_message?: string | null
          event_type: string
          id?: string
          payload: Json
          response_body?: string | null
          status: string
          status_code?: number | null
          webhook_id?: string | null
        }
        Update: {
          attempt_number?: number | null
          created_at?: string | null
          delivered_at?: string | null
          error_message?: string | null
          event_type?: string
          id?: string
          payload?: Json
          response_body?: string | null
          status?: string
          status_code?: number | null
          webhook_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "webhook_deliveries_webhook_id_fkey"
            columns: ["webhook_id"]
            isOneToOne: false
            referencedRelation: "webhooks"
            referencedColumns: ["id"]
          },
        ]
      }
      webhooks: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          events: Json | null
          headers: Json | null
          id: string
          is_active: boolean | null
          name: string
          retry_count: number | null
          secret: string | null
          timeout_seconds: number | null
          updated_at: string | null
          url: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          events?: Json | null
          headers?: Json | null
          id?: string
          is_active?: boolean | null
          name: string
          retry_count?: number | null
          secret?: string | null
          timeout_seconds?: number | null
          updated_at?: string | null
          url: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          events?: Json | null
          headers?: Json | null
          id?: string
          is_active?: boolean | null
          name?: string
          retry_count?: number | null
          secret?: string | null
          timeout_seconds?: number | null
          updated_at?: string | null
          url?: string
        }
        Relationships: []
      }
    }
    Views: {
      broker_profiles_public: {
        Row: {
          bio: string | null
          certifications: string[] | null
          city: string | null
          company_name: string | null
          country: string | null
          created_at: string | null
          full_name: string | null
          id: string | null
          languages: string[] | null
          preferred_regions: string[] | null
          profile_image_url: string | null
          specializations: string[] | null
          trading_volume: string | null
          verified_at: string | null
          years_experience: number | null
        }
        Insert: {
          bio?: string | null
          certifications?: string[] | null
          city?: string | null
          company_name?: string | null
          country?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string | null
          languages?: string[] | null
          preferred_regions?: string[] | null
          profile_image_url?: string | null
          specializations?: string[] | null
          trading_volume?: string | null
          verified_at?: string | null
          years_experience?: number | null
        }
        Update: {
          bio?: string | null
          certifications?: string[] | null
          city?: string | null
          company_name?: string | null
          country?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string | null
          languages?: string[] | null
          preferred_regions?: string[] | null
          profile_image_url?: string | null
          specializations?: string[] | null
          trading_volume?: string | null
          verified_at?: string | null
          years_experience?: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      admin_extend_trial: {
        Args: { additional_days: number; subscriber_email: string }
        Returns: Json
      }
      admin_toggle_account_lock: {
        Args: {
          lock_reason?: string
          should_lock: boolean
          subscriber_email: string
        }
        Returns: Json
      }
      can_user_download_template: {
        Args: { p_template_id: string; p_user_id: string }
        Returns: Json
      }
      check_broker_membership_status: {
        Args: { user_id_param?: string }
        Returns: Json
      }
      check_subscription_status: { Args: { user_email: string }; Returns: Json }
      check_user_access: {
        Args: { user_email: string }
        Returns: {
          access_type: string
          has_access: boolean
          is_subscribed: boolean
          trial_days_left: number
        }[]
      }
      check_user_access_enhanced: {
        Args: { user_email: string }
        Returns: {
          access_type: string
          can_upgrade: boolean
          has_access: boolean
          is_subscribed: boolean
          subscription_tier: string
          trial_days_left: number
          trial_end_date: string
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
      check_user_access_with_lock: {
        Args: { user_email: string }
        Returns: {
          access_type: string
          has_access: boolean
          is_locked: boolean
          is_subscribed: boolean
          locked_reason: string
          subscription_tier: string
          trial_days_left: number
          trial_end_date: string
        }[]
      }
      extract_template_placeholders: {
        Args: { template_content: string }
        Returns: string[]
      }
      generate_api_key: { Args: { prefix?: string }; Returns: string }
      generate_maritime_random_data: {
        Args: { data_type?: string; field_name: string }
        Returns: string
      }
      get_user_downloadable_templates: {
        Args: { p_user_id: string }
        Returns: {
          access_type: string
          can_download: boolean
          current_downloads: number
          max_downloads: number
          remaining_downloads: number
          template_id: string
          template_name: string
        }[]
      }
      get_user_email_by_id: { Args: { user_uuid: string }; Returns: string }
      get_user_id_by_email: { Args: { user_email: string }; Returns: string }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      get_user_role_safe: {
        Args: { user_uuid: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      get_users_with_roles: {
        Args: never
        Returns: {
          created_at: string
          email: string
          email_confirmed_at: string
          id: string
          last_sign_in_at: string
          role: string
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
      increment_payment_failures: { Args: never; Returns: number }
      is_admin: { Args: { user_id_param?: string }; Returns: boolean }
      is_trial_expired: { Args: { user_email: string }; Returns: boolean }
      lock_expired_accounts: { Args: never; Returns: Json }
      refresh_users_with_roles_cache: { Args: never; Returns: undefined }
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
      start_trial_with_plan: {
        Args: {
          plan_tier_param?: string
          trial_days?: number
          user_email: string
          user_id_param: string
        }
        Returns: Json
      }
      update_expired_trials: { Args: never; Returns: Json }
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

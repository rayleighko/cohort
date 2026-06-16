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
      aurora_chat: {
        Row: {
          character: string
          created_at: string
          id: string
          role: string
          safety_filter_category: string | null
          safety_filter_triggered: boolean
          session_id: string
          text: string
          turn_index: number
          user_id: string | null
        }
        Insert: {
          character?: string
          created_at?: string
          id?: string
          role: string
          safety_filter_category?: string | null
          safety_filter_triggered?: boolean
          session_id: string
          text: string
          turn_index: number
          user_id?: string | null
        }
        Update: {
          character?: string
          created_at?: string
          id?: string
          role?: string
          safety_filter_category?: string | null
          safety_filter_triggered?: boolean
          session_id?: string
          text?: string
          turn_index?: number
          user_id?: string | null
        }
        Relationships: []
      }
      aurora_narration_log: {
        Row: {
          category: string
          character: string
          composite_snapshot: Json
          created_at: string
          id: string
          safety_filter_category: string | null
          text: string
          triggered: boolean
        }
        Insert: {
          category: string
          character?: string
          composite_snapshot: Json
          created_at?: string
          id?: string
          safety_filter_category?: string | null
          text: string
          triggered?: boolean
        }
        Update: {
          category?: string
          character?: string
          composite_snapshot?: Json
          created_at?: string
          id?: string
          safety_filter_category?: string | null
          text?: string
          triggered?: boolean
        }
        Relationships: []
      }
      behavioral_event: {
        Row: {
          context_jsonb: Json
          created_at: string
          event_type: string
          id: string
          severity: string
          trigger_id: string | null
          user_id: string
        }
        Insert: {
          context_jsonb?: Json
          created_at?: string
          event_type: string
          id?: string
          severity?: string
          trigger_id?: string | null
          user_id: string
        }
        Update: {
          context_jsonb?: Json
          created_at?: string
          event_type?: string
          id?: string
          severity?: string
          trigger_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "behavioral_event_trigger_id_fkey"
            columns: ["trigger_id"]
            isOneToOne: false
            referencedRelation: "shape_c_triggers"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_quota_usage: {
        Row: {
          created_at: string
          date: string
          haiku_count: number
          id: string
          message_count: number
          session_id: string | null
          sonnet_count: number
          tier: string
          token_input_total: number
          token_output_total: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          date?: string
          haiku_count?: number
          id?: string
          message_count?: number
          session_id?: string | null
          sonnet_count?: number
          tier: string
          token_input_total?: number
          token_output_total?: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          date?: string
          haiku_count?: number
          id?: string
          message_count?: number
          session_id?: string | null
          sonnet_count?: number
          tier?: string
          token_input_total?: number
          token_output_total?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      investment_principle: {
        Row: {
          acknowledged_at: string
          created_at: string
          document: Json
          id: string
          superseded_at: string | null
          user_id: string
          version: number
        }
        Insert: {
          acknowledged_at?: string
          created_at?: string
          document: Json
          id?: string
          superseded_at?: string | null
          user_id: string
          version?: number
        }
        Update: {
          acknowledged_at?: string
          created_at?: string
          document?: Json
          id?: string
          superseded_at?: string | null
          user_id?: string
          version?: number
        }
        Relationships: []
      }
      loi_conversion: {
        Row: {
          churn_reason: string[] | null
          conversion_decision: string | null
          created_at: string | null
          id: string
          payment_started_at: string | null
          retention_30d: boolean | null
          retention_90d: boolean | null
          trial_end: string | null
          trial_start: string | null
          user_id: string | null
        }
        Insert: {
          churn_reason?: string[] | null
          conversion_decision?: string | null
          created_at?: string | null
          id?: string
          payment_started_at?: string | null
          retention_30d?: boolean | null
          retention_90d?: boolean | null
          trial_end?: string | null
          trial_start?: string | null
          user_id?: string | null
        }
        Update: {
          churn_reason?: string[] | null
          conversion_decision?: string | null
          created_at?: string | null
          id?: string
          payment_started_at?: string | null
          retention_30d?: boolean | null
          retention_90d?: boolean | null
          trial_end?: string | null
          trial_start?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      mascot_chat: {
        Row: {
          character: string
          content: string
          created_at: string | null
          id: string
          role: string
          safety_filter_category: string | null
          safety_filter_triggered: boolean | null
          user_id: string | null
        }
        Insert: {
          character: string
          content: string
          created_at?: string | null
          id?: string
          role: string
          safety_filter_category?: string | null
          safety_filter_triggered?: boolean | null
          user_id?: string | null
        }
        Update: {
          character?: string
          content?: string
          created_at?: string | null
          id?: string
          role?: string
          safety_filter_category?: string | null
          safety_filter_triggered?: boolean | null
          user_id?: string | null
        }
        Relationships: []
      }
      micro_survey_response: {
        Row: {
          created_at: string | null
          id: string
          response_data: Json | null
          session_number: number | null
          trigger_type: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          response_data?: Json | null
          session_number?: number | null
          trigger_type?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          response_data?: Json | null
          session_number?: number | null
          trigger_type?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      notification_log: {
        Row: {
          behavioral_event_id: string | null
          body: string
          category: string
          channel: string
          created_at: string
          error_message: string | null
          id: string
          payload_jsonb: Json
          provider_message_id: string | null
          retry_count: number
          sent_at: string | null
          status: string
          trigger_id: string | null
          user_id: string
          voice: string
        }
        Insert: {
          behavioral_event_id?: string | null
          body: string
          category: string
          channel: string
          created_at?: string
          error_message?: string | null
          id?: string
          payload_jsonb?: Json
          provider_message_id?: string | null
          retry_count?: number
          sent_at?: string | null
          status?: string
          trigger_id?: string | null
          user_id: string
          voice: string
        }
        Update: {
          behavioral_event_id?: string | null
          body?: string
          category?: string
          channel?: string
          created_at?: string
          error_message?: string | null
          id?: string
          payload_jsonb?: Json
          provider_message_id?: string | null
          retry_count?: number
          sent_at?: string | null
          status?: string
          trigger_id?: string | null
          user_id?: string
          voice?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_log_behavioral_event_id_fkey"
            columns: ["behavioral_event_id"]
            isOneToOne: false
            referencedRelation: "behavioral_event"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_log_trigger_id_fkey"
            columns: ["trigger_id"]
            isOneToOne: false
            referencedRelation: "shape_c_triggers"
            referencedColumns: ["id"]
          },
        ]
      }
      onboarding_response: {
        Row: {
          account_irp: boolean | null
          account_isa: boolean | null
          account_pension: boolean | null
          account_youth: boolean | null
          acquisition_channel: string | null
          allocation_bond: number | null
          allocation_cash: number | null
          allocation_crypto: number | null
          allocation_kr: number | null
          allocation_macro: number | null
          allocation_other: number | null
          allocation_us: number | null
          created_at: string | null
          experience_years: string | null
          id: string
          impersonation_received: string | null
          landing_page_version: string | null
          leading_room_experience: string | null
          macro_frequency: string | null
          monthly_budget: string | null
          past_paid_services: string[] | null
          plan_intuition_score: number | null
          profession: string | null
          sources: string[] | null
          trial_duration_preferred: string | null
          user_id: string | null
          weekly_trades: string | null
        }
        Insert: {
          account_irp?: boolean | null
          account_isa?: boolean | null
          account_pension?: boolean | null
          account_youth?: boolean | null
          acquisition_channel?: string | null
          allocation_bond?: number | null
          allocation_cash?: number | null
          allocation_crypto?: number | null
          allocation_kr?: number | null
          allocation_macro?: number | null
          allocation_other?: number | null
          allocation_us?: number | null
          created_at?: string | null
          experience_years?: string | null
          id?: string
          impersonation_received?: string | null
          landing_page_version?: string | null
          leading_room_experience?: string | null
          macro_frequency?: string | null
          monthly_budget?: string | null
          past_paid_services?: string[] | null
          plan_intuition_score?: number | null
          profession?: string | null
          sources?: string[] | null
          trial_duration_preferred?: string | null
          user_id?: string | null
          weekly_trades?: string | null
        }
        Update: {
          account_irp?: boolean | null
          account_isa?: boolean | null
          account_pension?: boolean | null
          account_youth?: boolean | null
          acquisition_channel?: string | null
          allocation_bond?: number | null
          allocation_cash?: number | null
          allocation_crypto?: number | null
          allocation_kr?: number | null
          allocation_macro?: number | null
          allocation_other?: number | null
          allocation_us?: number | null
          created_at?: string | null
          experience_years?: string | null
          id?: string
          impersonation_received?: string | null
          landing_page_version?: string | null
          leading_room_experience?: string | null
          macro_frequency?: string | null
          monthly_budget?: string | null
          past_paid_services?: string[] | null
          plan_intuition_score?: number | null
          profession?: string | null
          sources?: string[] | null
          trial_duration_preferred?: string | null
          user_id?: string | null
          weekly_trades?: string | null
        }
        Relationships: []
      }
      push_subscription: {
        Row: {
          auth: string
          created_at: string | null
          endpoint: string
          id: string
          p256dh: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          auth: string
          created_at?: string | null
          endpoint: string
          id?: string
          p256dh: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          auth?: string
          created_at?: string | null
          endpoint?: string
          id?: string
          p256dh?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      shape_c_nudge_log: {
        Row: {
          fired_at: string | null
          id: string
          nudge_type: string | null
          nudge_ux_variant: string | null
          user_action_after: string | null
          user_context: Json | null
          user_feedback: string | null
          user_id: string | null
        }
        Insert: {
          fired_at?: string | null
          id?: string
          nudge_type?: string | null
          nudge_ux_variant?: string | null
          user_action_after?: string | null
          user_context?: Json | null
          user_feedback?: string | null
          user_id?: string | null
        }
        Update: {
          fired_at?: string | null
          id?: string
          nudge_type?: string | null
          nudge_ux_variant?: string | null
          user_action_after?: string | null
          user_context?: Json | null
          user_feedback?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      shape_c_triggers: {
        Row: {
          condition_params: Json
          cooldown_hours: number
          created_at: string
          id: string
          is_active: boolean
          label: string | null
          last_fired_at: string | null
          trigger_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          condition_params?: Json
          cooldown_hours?: number
          created_at?: string
          id?: string
          is_active?: boolean
          label?: string | null
          last_fired_at?: string | null
          trigger_type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          condition_params?: Json
          cooldown_hours?: number
          created_at?: string
          id?: string
          is_active?: boolean
          label?: string | null
          last_fired_at?: string | null
          trigger_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      trigger_config: {
        Row: {
          active: boolean | null
          condition: Json | null
          cooldown_hours: number | null
          created_at: string | null
          id: string
          last_fired_at: string | null
          name: string | null
          type: string | null
          user_id: string | null
        }
        Insert: {
          active?: boolean | null
          condition?: Json | null
          cooldown_hours?: number | null
          created_at?: string | null
          id?: string
          last_fired_at?: string | null
          name?: string | null
          type?: string | null
          user_id?: string | null
        }
        Update: {
          active?: boolean | null
          condition?: Json | null
          cooldown_hours?: number | null
          created_at?: string | null
          id?: string
          last_fired_at?: string | null
          name?: string | null
          type?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_investment_profile: {
        Row: {
          asset_goal_5y: string | null
          classification_confidence: number | null
          cluster_b_sub_classification: string | null
          created_at: string
          emotional_decision_count_12m: string | null
          framework_affinity: string[] | null
          framework_affinity_inferred: string[] | null
          framework_self_described: string | null
          gl_rts_answers: Json | null
          info_sources: string[] | null
          last_updated_at: string
          linked_principle_id: string | null
          macro_watching_freq: string | null
          payment_willingness_ceiling_krw: number | null
          plan_formalization: string | null
          portfolio_composition_pct: Json | null
          profile_version: string
          service_expectations: string[] | null
          shape_c_trigger_presets: Json | null
          split_buy_enforcement: string | null
          time_horizon: string | null
          user_id: string
          user_stage: string | null
          user_stage_self_referred_valley: boolean | null
          weakness_self_assessment: string | null
        }
        Insert: {
          asset_goal_5y?: string | null
          classification_confidence?: number | null
          cluster_b_sub_classification?: string | null
          created_at?: string
          emotional_decision_count_12m?: string | null
          framework_affinity?: string[] | null
          framework_affinity_inferred?: string[] | null
          framework_self_described?: string | null
          gl_rts_answers?: Json | null
          info_sources?: string[] | null
          last_updated_at?: string
          linked_principle_id?: string | null
          macro_watching_freq?: string | null
          payment_willingness_ceiling_krw?: number | null
          plan_formalization?: string | null
          portfolio_composition_pct?: Json | null
          profile_version?: string
          service_expectations?: string[] | null
          shape_c_trigger_presets?: Json | null
          split_buy_enforcement?: string | null
          time_horizon?: string | null
          user_id: string
          user_stage?: string | null
          user_stage_self_referred_valley?: boolean | null
          weakness_self_assessment?: string | null
        }
        Update: {
          asset_goal_5y?: string | null
          classification_confidence?: number | null
          cluster_b_sub_classification?: string | null
          created_at?: string
          emotional_decision_count_12m?: string | null
          framework_affinity?: string[] | null
          framework_affinity_inferred?: string[] | null
          framework_self_described?: string | null
          gl_rts_answers?: Json | null
          info_sources?: string[] | null
          last_updated_at?: string
          linked_principle_id?: string | null
          macro_watching_freq?: string | null
          payment_willingness_ceiling_krw?: number | null
          plan_formalization?: string | null
          portfolio_composition_pct?: Json | null
          profile_version?: string
          service_expectations?: string[] | null
          shape_c_trigger_presets?: Json | null
          split_buy_enforcement?: string | null
          time_horizon?: string | null
          user_id?: string
          user_stage?: string | null
          user_stage_self_referred_valley?: boolean | null
          weakness_self_assessment?: string | null
        }
        Relationships: []
      }
      user_notification_preference: {
        Row: {
          channels: string[]
          created_at: string
          kakao_user_id: string | null
          opt_out: boolean
          quiet_hours_end: string | null
          quiet_hours_start: string | null
          updated_at: string
          user_id: string
          web_push_subscription: Json | null
        }
        Insert: {
          channels?: string[]
          created_at?: string
          kakao_user_id?: string | null
          opt_out?: boolean
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          updated_at?: string
          user_id: string
          web_push_subscription?: Json | null
        }
        Update: {
          channels?: string[]
          created_at?: string
          kakao_user_id?: string | null
          opt_out?: boolean
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          updated_at?: string
          user_id?: string
          web_push_subscription?: Json | null
        }
        Relationships: []
      }
      user_profile: {
        Row: {
          acquisition_channel: string | null
          consent_analytics: boolean | null
          consent_interview: boolean | null
          consent_kakao_notification: boolean | null
          created_at: string | null
          current_tier: string | null
          experience_years_range: string | null
          id: string
          landing_page_version: string | null
          mascot_last_interaction_at: string | null
          mascot_streak_days: number | null
          polar_customer_id: string | null
          polar_subscription_id: string | null
          sub_cluster: string | null
          subscription_active: boolean | null
          subscription_renewal_at: string | null
          trial_ends_at: string | null
          trial_started_at: string | null
          updated_at: string | null
        }
        Insert: {
          acquisition_channel?: string | null
          consent_analytics?: boolean | null
          consent_interview?: boolean | null
          consent_kakao_notification?: boolean | null
          created_at?: string | null
          current_tier?: string | null
          experience_years_range?: string | null
          id: string
          landing_page_version?: string | null
          mascot_last_interaction_at?: string | null
          mascot_streak_days?: number | null
          polar_customer_id?: string | null
          polar_subscription_id?: string | null
          sub_cluster?: string | null
          subscription_active?: boolean | null
          subscription_renewal_at?: string | null
          trial_ends_at?: string | null
          trial_started_at?: string | null
          updated_at?: string | null
        }
        Update: {
          acquisition_channel?: string | null
          consent_analytics?: boolean | null
          consent_interview?: boolean | null
          consent_kakao_notification?: boolean | null
          created_at?: string | null
          current_tier?: string | null
          experience_years_range?: string | null
          id?: string
          landing_page_version?: string | null
          mascot_last_interaction_at?: string | null
          mascot_streak_days?: number | null
          polar_customer_id?: string | null
          polar_subscription_id?: string | null
          sub_cluster?: string | null
          subscription_active?: boolean | null
          subscription_renewal_at?: string | null
          trial_ends_at?: string | null
          trial_started_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      waitlist: {
        Row: {
          ab_variant: string | null
          consent_marketing: boolean | null
          consent_pipa: boolean
          created_at: string | null
          email: string
          id: string
          referral_source: string | null
        }
        Insert: {
          ab_variant?: string | null
          consent_marketing?: boolean | null
          consent_pipa: boolean
          created_at?: string | null
          email: string
          id?: string
          referral_source?: string | null
        }
        Update: {
          ab_variant?: string | null
          consent_marketing?: boolean | null
          consent_pipa?: boolean
          created_at?: string | null
          email?: string
          id?: string
          referral_source?: string | null
        }
        Relationships: []
      }
      watchlist: {
        Row: {
          added_at: string | null
          id: string
          market: string
          plan: Json | null
          ticker: string
          user_id: string | null
        }
        Insert: {
          added_at?: string | null
          id?: string
          market: string
          plan?: Json | null
          ticker: string
          user_id?: string | null
        }
        Update: {
          added_at?: string | null
          id?: string
          market?: string
          plan?: Json | null
          ticker?: string
          user_id?: string | null
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

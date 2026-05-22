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
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const

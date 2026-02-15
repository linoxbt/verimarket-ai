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
      arbitrations: {
        Row: {
          confidence: number
          data_hash: string
          dispute_id: string
          finalized_at: string
          id: string
          market_id: string
          outcome: string
          reasoning_steps: Json
        }
        Insert: {
          confidence: number
          data_hash: string
          dispute_id: string
          finalized_at?: string
          id?: string
          market_id: string
          outcome: string
          reasoning_steps?: Json
        }
        Update: {
          confidence?: number
          data_hash?: string
          dispute_id?: string
          finalized_at?: string
          id?: string
          market_id?: string
          outcome?: string
          reasoning_steps?: Json
        }
        Relationships: [
          {
            foreignKeyName: "arbitrations_dispute_id_fkey"
            columns: ["dispute_id"]
            isOneToOne: false
            referencedRelation: "disputes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "arbitrations_market_id_fkey"
            columns: ["market_id"]
            isOneToOne: false
            referencedRelation: "markets"
            referencedColumns: ["id"]
          },
        ]
      }
      disputes: {
        Row: {
          bond_amount: number
          created_at: string
          disputer_address: string
          evidence: Json
          evidence_hash: string
          id: string
          market_id: string
        }
        Insert: {
          bond_amount?: number
          created_at?: string
          disputer_address: string
          evidence?: Json
          evidence_hash: string
          id?: string
          market_id: string
        }
        Update: {
          bond_amount?: number
          created_at?: string
          disputer_address?: string
          evidence?: Json
          evidence_hash?: string
          id?: string
          market_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "disputes_market_id_fkey"
            columns: ["market_id"]
            isOneToOne: false
            referencedRelation: "markets"
            referencedColumns: ["id"]
          },
        ]
      }
      markets: {
        Row: {
          api_source: string
          category: Database["public"]["Enums"]["market_category"]
          created_at: string
          creator_address: string | null
          expiry: string
          id: string
          pinned: boolean
          question: string
          resolution_criteria: string
          status: Database["public"]["Enums"]["market_status"]
          updated_at: string
          volume: number
          yes_probability: number
        }
        Insert: {
          api_source: string
          category: Database["public"]["Enums"]["market_category"]
          created_at?: string
          creator_address?: string | null
          expiry: string
          id?: string
          pinned?: boolean
          question: string
          resolution_criteria: string
          status?: Database["public"]["Enums"]["market_status"]
          updated_at?: string
          volume?: number
          yes_probability?: number
        }
        Update: {
          api_source?: string
          category?: Database["public"]["Enums"]["market_category"]
          created_at?: string
          creator_address?: string | null
          expiry?: string
          id?: string
          pinned?: boolean
          question?: string
          resolution_criteria?: string
          status?: Database["public"]["Enums"]["market_status"]
          updated_at?: string
          volume?: number
          yes_probability?: number
        }
        Relationships: []
      }
      resolutions: {
        Row: {
          confidence: number
          data_hash: string
          evidence_package: Json | null
          id: string
          market_id: string
          model_id: string
          outcome: string
          prompt_version: string
          reasoning_steps: Json
          resolved_at: string
        }
        Insert: {
          confidence: number
          data_hash: string
          evidence_package?: Json | null
          id?: string
          market_id: string
          model_id: string
          outcome: string
          prompt_version?: string
          reasoning_steps?: Json
          resolved_at?: string
        }
        Update: {
          confidence?: number
          data_hash?: string
          evidence_package?: Json | null
          id?: string
          market_id?: string
          model_id?: string
          outcome?: string
          prompt_version?: string
          reasoning_steps?: Json
          resolved_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "resolutions_market_id_fkey"
            columns: ["market_id"]
            isOneToOne: false
            referencedRelation: "markets"
            referencedColumns: ["id"]
          },
        ]
      }
      trades: {
        Row: {
          amount: number
          created_at: string
          estimated_payout: number
          id: string
          market_id: string
          position: string
          trader_address: string
        }
        Insert: {
          amount: number
          created_at?: string
          estimated_payout: number
          id?: string
          market_id: string
          position: string
          trader_address: string
        }
        Update: {
          amount?: number
          created_at?: string
          estimated_payout?: number
          id?: string
          market_id?: string
          position?: string
          trader_address?: string
        }
        Relationships: [
          {
            foreignKeyName: "trades_market_id_fkey"
            columns: ["market_id"]
            isOneToOne: false
            referencedRelation: "markets"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
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
      market_category: "news" | "sports" | "crypto" | "weather"
      market_status: "open" | "resolving" | "disputed" | "finalized"
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
      market_category: ["news", "sports", "crypto", "weather"],
      market_status: ["open", "resolving", "disputed", "finalized"],
    },
  },
} as const

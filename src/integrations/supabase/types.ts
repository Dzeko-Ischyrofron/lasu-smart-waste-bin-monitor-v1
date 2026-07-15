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
      activities: {
        Row: {
          bin_id: string | null
          created_at: string
          id: string
          message: string
          type: Database["public"]["Enums"]["activity_type"]
        }
        Insert: {
          bin_id?: string | null
          created_at?: string
          id?: string
          message: string
          type: Database["public"]["Enums"]["activity_type"]
        }
        Update: {
          bin_id?: string | null
          created_at?: string
          id?: string
          message?: string
          type?: Database["public"]["Enums"]["activity_type"]
        }
        Relationships: [
          {
            foreignKeyName: "activities_bin_id_fkey"
            columns: ["bin_id"]
            isOneToOne: false
            referencedRelation: "bins"
            referencedColumns: ["id"]
          },
        ]
      }
      alerts: {
        Row: {
          acknowledged: boolean
          bin_id: string | null
          category: Database["public"]["Enums"]["alert_category"]
          created_at: string
          id: string
          message: string
          type: Database["public"]["Enums"]["alert_type"]
        }
        Insert: {
          acknowledged?: boolean
          bin_id?: string | null
          category: Database["public"]["Enums"]["alert_category"]
          created_at?: string
          id?: string
          message: string
          type: Database["public"]["Enums"]["alert_type"]
        }
        Update: {
          acknowledged?: boolean
          bin_id?: string | null
          category?: Database["public"]["Enums"]["alert_category"]
          created_at?: string
          id?: string
          message?: string
          type?: Database["public"]["Enums"]["alert_type"]
        }
        Relationships: [
          {
            foreignKeyName: "alerts_bin_id_fkey"
            columns: ["bin_id"]
            isOneToOne: false
            referencedRelation: "bins"
            referencedColumns: ["id"]
          },
        ]
      }
      bin_assignments: {
        Row: {
          bin_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          bin_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          bin_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bin_assignments_bin_id_fkey"
            columns: ["bin_id"]
            isOneToOne: false
            referencedRelation: "bins"
            referencedColumns: ["id"]
          },
        ]
      }
      bins: {
        Row: {
          battery: number
          created_at: string
          device_api_key: string
          fill_level: number
          hand_detected: boolean
          id: string
          is_online: boolean
          last_update: string
          latitude: number | null
          lid_status: Database["public"]["Enums"]["lid_status"]
          location: string
          longitude: number | null
          name: string
          odor_level: Database["public"]["Enums"]["odor_level"]
        }
        Insert: {
          battery?: number
          created_at?: string
          device_api_key?: string
          fill_level?: number
          hand_detected?: boolean
          id: string
          is_online?: boolean
          last_update?: string
          latitude?: number | null
          lid_status?: Database["public"]["Enums"]["lid_status"]
          location: string
          longitude?: number | null
          name: string
          odor_level?: Database["public"]["Enums"]["odor_level"]
        }
        Update: {
          battery?: number
          created_at?: string
          device_api_key?: string
          fill_level?: number
          hand_detected?: boolean
          id?: string
          is_online?: boolean
          last_update?: string
          latitude?: number | null
          lid_status?: Database["public"]["Enums"]["lid_status"]
          location?: string
          longitude?: number | null
          name?: string
          odor_level?: Database["public"]["Enums"]["odor_level"]
        }
        Relationships: []
      }
      control_commands: {
        Row: {
          bin_id: string
          command: string
          created_at: string
          executed: boolean
          executed_at: string | null
          id: string
          issued_by: string | null
          payload: Json | null
        }
        Insert: {
          bin_id: string
          command: string
          created_at?: string
          executed?: boolean
          executed_at?: string | null
          id?: string
          issued_by?: string | null
          payload?: Json | null
        }
        Update: {
          bin_id?: string
          command?: string
          created_at?: string
          executed?: boolean
          executed_at?: string | null
          id?: string
          issued_by?: string | null
          payload?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "control_commands_bin_id_fkey"
            columns: ["bin_id"]
            isOneToOne: false
            referencedRelation: "bins"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      schedule: {
        Row: {
          bin_id: string
          completed_at: string | null
          completed_by: string | null
          created_at: string
          estimated_fill: number | null
          id: string
          priority: Database["public"]["Enums"]["priority_level"]
          scheduled_time: string
          status: Database["public"]["Enums"]["schedule_status"]
        }
        Insert: {
          bin_id: string
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          estimated_fill?: number | null
          id?: string
          priority?: Database["public"]["Enums"]["priority_level"]
          scheduled_time: string
          status?: Database["public"]["Enums"]["schedule_status"]
        }
        Update: {
          bin_id?: string
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          estimated_fill?: number | null
          id?: string
          priority?: Database["public"]["Enums"]["priority_level"]
          scheduled_time?: string
          status?: Database["public"]["Enums"]["schedule_status"]
        }
        Relationships: [
          {
            foreignKeyName: "schedule_bin_id_fkey"
            columns: ["bin_id"]
            isOneToOne: false
            referencedRelation: "bins"
            referencedColumns: ["id"]
          },
        ]
      }
      sensor_readings: {
        Row: {
          battery: number | null
          bin_id: string
          fill_percent: number | null
          id: string
          ir_sensor: boolean | null
          mq135_ppm: number | null
          recorded_at: string
          servo_angle: number | null
          signal_strength: number | null
          ultrasonic_cm: number | null
        }
        Insert: {
          battery?: number | null
          bin_id: string
          fill_percent?: number | null
          id?: string
          ir_sensor?: boolean | null
          mq135_ppm?: number | null
          recorded_at?: string
          servo_angle?: number | null
          signal_strength?: number | null
          ultrasonic_cm?: number | null
        }
        Update: {
          battery?: number | null
          bin_id?: string
          fill_percent?: number | null
          id?: string
          ir_sensor?: boolean | null
          mq135_ppm?: number | null
          recorded_at?: string
          servo_angle?: number | null
          signal_strength?: number | null
          ultrasonic_cm?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "sensor_readings_bin_id_fkey"
            columns: ["bin_id"]
            isOneToOne: false
            referencedRelation: "bins"
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
      waste_bin_config: {
        Row: {
          bin_depth_cm: number
          bin_id: string
          gas_alert_threshold: number
          id: number
          lid_hold_ms: number
          servo_close_deg: number
          servo_open_deg: number
          updated_at: string
          wifi_pass: string | null
          wifi_ssid: string | null
        }
        Insert: {
          bin_depth_cm?: number
          bin_id: string
          gas_alert_threshold?: number
          id?: number
          lid_hold_ms?: number
          servo_close_deg?: number
          servo_open_deg?: number
          updated_at?: string
          wifi_pass?: string | null
          wifi_ssid?: string | null
        }
        Update: {
          bin_depth_cm?: number
          bin_id?: string
          gas_alert_threshold?: number
          id?: number
          lid_hold_ms?: number
          servo_close_deg?: number
          servo_open_deg?: number
          updated_at?: string
          wifi_pass?: string | null
          wifi_ssid?: string | null
        }
        Relationships: []
      }
      waste_bin_telemetry: {
        Row: {
          bin_depth_cm: number | null
          bin_id: string
          created_at: string
          distance_cm: number | null
          fw_version: string | null
          gas_alert: boolean
          gas_ppm_est: number | null
          gas_raw: number | null
          heap_free: number | null
          id: number
          is_full: boolean
          level_zone: number
          lid_open: boolean
          pir_detected: boolean
          rssi_dbm: number | null
          uptime_s: number | null
          waste_filled_cm: number | null
          waste_pct: number
          wifi_ssid: string | null
        }
        Insert: {
          bin_depth_cm?: number | null
          bin_id: string
          created_at?: string
          distance_cm?: number | null
          fw_version?: string | null
          gas_alert?: boolean
          gas_ppm_est?: number | null
          gas_raw?: number | null
          heap_free?: number | null
          id?: number
          is_full?: boolean
          level_zone: number
          lid_open?: boolean
          pir_detected?: boolean
          rssi_dbm?: number | null
          uptime_s?: number | null
          waste_filled_cm?: number | null
          waste_pct: number
          wifi_ssid?: string | null
        }
        Update: {
          bin_depth_cm?: number | null
          bin_id?: string
          created_at?: string
          distance_cm?: number | null
          fw_version?: string | null
          gas_alert?: boolean
          gas_ppm_est?: number | null
          gas_raw?: number | null
          heap_free?: number | null
          id?: number
          is_full?: boolean
          level_zone?: number
          lid_open?: boolean
          pir_detected?: boolean
          rssi_dbm?: number | null
          uptime_s?: number | null
          waste_filled_cm?: number | null
          waste_pct?: number
          wifi_ssid?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      vw_bin_daily_summary: {
        Row: {
          avg_gas_ppm: number | null
          avg_waste_pct: number | null
          bin_id: string | null
          day: string | null
          gas_alerts: number | null
          max_waste_pct: number | null
          min_waste_pct: number | null
          total_motion_events: number | null
          total_readings: number | null
        }
        Relationships: []
      }
      vw_bin_hourly_avg: {
        Row: {
          avg_gas_ppm: number | null
          avg_waste_pct: number | null
          bin_id: string | null
          gas_alert_count: number | null
          hour: string | null
          motion_count: number | null
          reading_count: number | null
        }
        Relationships: []
      }
      vw_bin_latest: {
        Row: {
          bin_depth_cm: number | null
          bin_id: string | null
          created_at: string | null
          fw_version: string | null
          gas_alert: boolean | null
          gas_ppm_est: number | null
          gas_raw: number | null
          is_full: boolean | null
          level_zone: number | null
          lid_open: boolean | null
          pir_detected: boolean | null
          rssi_dbm: number | null
          uptime_s: number | null
          waste_filled_cm: number | null
          waste_pct: number | null
          wifi_ssid: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      get_bin_device_key: { Args: { _bin_id: string }; Returns: string }
      get_telemetry_trend: {
        Args: { _bin_id: string; _range: string }
        Returns: {
          bucket: string
          fill_avg: number
          gas_alerts: number
          gas_avg: number
          sample_count: number
        }[]
      }
    }
    Enums: {
      activity_type: "alert" | "fill" | "collection" | "control" | "system"
      alert_category: "fill" | "battery" | "odor" | "lid" | "connection"
      alert_type: "critical" | "warning" | "info"
      app_role: "admin" | "viewer" | "personnel"
      lid_status: "open" | "closed"
      odor_level: "normal" | "moderate" | "high"
      priority_level: "low" | "medium" | "high"
      schedule_status: "pending" | "completed" | "cancelled"
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
      activity_type: ["alert", "fill", "collection", "control", "system"],
      alert_category: ["fill", "battery", "odor", "lid", "connection"],
      alert_type: ["critical", "warning", "info"],
      app_role: ["admin", "viewer", "personnel"],
      lid_status: ["open", "closed"],
      odor_level: ["normal", "moderate", "high"],
      priority_level: ["low", "medium", "high"],
      schedule_status: ["pending", "completed", "cancelled"],
    },
  },
} as const

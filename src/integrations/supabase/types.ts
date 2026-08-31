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
      companies: {
        Row: {
          created_at: string
          description_ar: string | null
          description_en: string | null
          founded_date: string | null
          id: string
          image_url: string | null
          link_type: string
          link_url: string | null
          name_ar: string
          name_en: string
          opening_date: string | null
          page_bg_type: string
          page_bg_url: string | null
          page_content_ar: string
          page_content_en: string
          page_overlay: number
          page_subtitle_ar: string
          page_subtitle_en: string
          page_title_ar: string
          page_title_en: string
          page_youtube_id: string | null
          published: boolean
          slug: string
          sort_order: number
          tagline_ar: string | null
          tagline_en: string | null
          tile_bg_type: string
          tile_bg_url: string | null
          tile_overlay: number | null
          tile_youtube_id: string | null
          timeline_title_ar: string
          timeline_title_en: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description_ar?: string | null
          description_en?: string | null
          founded_date?: string | null
          id?: string
          image_url?: string | null
          link_type?: string
          link_url?: string | null
          name_ar: string
          name_en: string
          opening_date?: string | null
          page_bg_type?: string
          page_bg_url?: string | null
          page_content_ar?: string
          page_content_en?: string
          page_overlay?: number
          page_subtitle_ar?: string
          page_subtitle_en?: string
          page_title_ar?: string
          page_title_en?: string
          page_youtube_id?: string | null
          published?: boolean
          slug: string
          sort_order?: number
          tagline_ar?: string | null
          tagline_en?: string | null
          tile_bg_type?: string
          tile_bg_url?: string | null
          tile_overlay?: number | null
          tile_youtube_id?: string | null
          timeline_title_ar?: string
          timeline_title_en?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description_ar?: string | null
          description_en?: string | null
          founded_date?: string | null
          id?: string
          image_url?: string | null
          link_type?: string
          link_url?: string | null
          name_ar?: string
          name_en?: string
          opening_date?: string | null
          page_bg_type?: string
          page_bg_url?: string | null
          page_content_ar?: string
          page_content_en?: string
          page_overlay?: number
          page_subtitle_ar?: string
          page_subtitle_en?: string
          page_title_ar?: string
          page_title_en?: string
          page_youtube_id?: string | null
          published?: boolean
          slug?: string
          sort_order?: number
          tagline_ar?: string | null
          tagline_en?: string | null
          tile_bg_type?: string
          tile_bg_url?: string | null
          tile_overlay?: number | null
          tile_youtube_id?: string | null
          timeline_title_ar?: string
          timeline_title_en?: string
          updated_at?: string
        }
        Relationships: []
      }
      company_timeline: {
        Row: {
          company_id: string
          created_at: string
          description_ar: string | null
          description_en: string | null
          event_date: string
          id: string
          sort_order: number
          title_ar: string
          title_en: string
        }
        Insert: {
          company_id: string
          created_at?: string
          description_ar?: string | null
          description_en?: string | null
          event_date: string
          id?: string
          sort_order?: number
          title_ar: string
          title_en: string
        }
        Update: {
          company_id?: string
          created_at?: string
          description_ar?: string | null
          description_en?: string | null
          event_date?: string
          id?: string
          sort_order?: number
          title_ar?: string
          title_en?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_timeline_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_messages: {
        Row: {
          created_at: string
          email: string | null
          id: string
          message: string
          name: string
          phone: string | null
          status: string
          subject: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          message: string
          name: string
          phone?: string | null
          status?: string
          subject?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          message?: string
          name?: string
          phone?: string | null
          status?: string
          subject?: string | null
        }
        Relationships: []
      }
      inquiries: {
        Row: {
          created_at: string
          email: string | null
          id: string
          message: string | null
          name: string
          phone: string
          product_id: string | null
          quantity: number
          status: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          message?: string | null
          name: string
          phone: string
          product_id?: string | null
          quantity?: number
          status?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          message?: string | null
          name?: string
          phone?: string
          product_id?: string | null
          quantity?: number
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "inquiries_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      journey_events: {
        Row: {
          caption_ar: string | null
          caption_en: string | null
          created_at: string
          description_ar: string | null
          description_en: string | null
          event_date: string
          id: string
          image_url: string | null
          published: boolean
          sort_order: number
          title_ar: string
          title_en: string
          updated_at: string
        }
        Insert: {
          caption_ar?: string | null
          caption_en?: string | null
          created_at?: string
          description_ar?: string | null
          description_en?: string | null
          event_date: string
          id?: string
          image_url?: string | null
          published?: boolean
          sort_order?: number
          title_ar: string
          title_en: string
          updated_at?: string
        }
        Update: {
          caption_ar?: string | null
          caption_en?: string | null
          created_at?: string
          description_ar?: string | null
          description_en?: string | null
          event_date?: string
          id?: string
          image_url?: string | null
          published?: boolean
          sort_order?: number
          title_ar?: string
          title_en?: string
          updated_at?: string
        }
        Relationships: []
      }
      page_settings: {
        Row: {
          bg_type: string
          bg_url: string | null
          enabled: boolean
          fx_density: number
          fx_enabled: boolean
          fx_glow: number
          fx_grid: boolean
          fx_hue: number
          fx_scan: boolean
          fx_speed: number
          overlay: number
          page_key: string
          subtitle_ar: string
          subtitle_en: string
          tile_bg_type: string
          tile_bg_url: string | null
          tile_overlay: number
          tile_youtube_id: string | null
          title_ar: string
          title_en: string
          updated_at: string
          youtube_id: string | null
        }
        Insert: {
          bg_type?: string
          bg_url?: string | null
          enabled?: boolean
          fx_density?: number
          fx_enabled?: boolean
          fx_glow?: number
          fx_grid?: boolean
          fx_hue?: number
          fx_scan?: boolean
          fx_speed?: number
          overlay?: number
          page_key: string
          subtitle_ar?: string
          subtitle_en?: string
          tile_bg_type?: string
          tile_bg_url?: string | null
          tile_overlay?: number
          tile_youtube_id?: string | null
          title_ar?: string
          title_en?: string
          updated_at?: string
          youtube_id?: string | null
        }
        Update: {
          bg_type?: string
          bg_url?: string | null
          enabled?: boolean
          fx_density?: number
          fx_enabled?: boolean
          fx_glow?: number
          fx_grid?: boolean
          fx_hue?: number
          fx_scan?: boolean
          fx_speed?: number
          overlay?: number
          page_key?: string
          subtitle_ar?: string
          subtitle_en?: string
          tile_bg_type?: string
          tile_bg_url?: string | null
          tile_overlay?: number
          tile_youtube_id?: string | null
          title_ar?: string
          title_en?: string
          updated_at?: string
          youtube_id?: string | null
        }
        Relationships: []
      }
      product_images: {
        Row: {
          created_at: string
          id: string
          image_url: string
          product_id: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          id?: string
          image_url: string
          product_id: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string
          product_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "product_images_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          category_id: string | null
          created_at: string
          currency: string
          description_ar: string | null
          description_en: string | null
          featured: boolean
          id: string
          image_url: string | null
          in_stock: boolean
          name_ar: string
          name_en: string
          price: number | null
          published: boolean
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          currency?: string
          description_ar?: string | null
          description_en?: string | null
          featured?: boolean
          id?: string
          image_url?: string | null
          in_stock?: boolean
          name_ar: string
          name_en: string
          price?: number | null
          published?: boolean
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          category_id?: string | null
          created_at?: string
          currency?: string
          description_ar?: string | null
          description_en?: string | null
          featured?: boolean
          id?: string
          image_url?: string | null
          in_stock?: boolean
          name_ar?: string
          name_en?: string
          price?: number | null
          published?: boolean
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "store_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          company_id: string | null
          created_at: string
          description_ar: string | null
          description_en: string | null
          end_date: string | null
          id: string
          image_url: string | null
          location_ar: string | null
          location_en: string | null
          published: boolean
          slug: string
          sort_order: number
          start_date: string | null
          status: string
          title_ar: string
          title_en: string
          updated_at: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          description_ar?: string | null
          description_en?: string | null
          end_date?: string | null
          id?: string
          image_url?: string | null
          location_ar?: string | null
          location_en?: string | null
          published?: boolean
          slug: string
          sort_order?: number
          start_date?: string | null
          status?: string
          title_ar: string
          title_en: string
          updated_at?: string
        }
        Update: {
          company_id?: string | null
          created_at?: string
          description_ar?: string | null
          description_en?: string | null
          end_date?: string | null
          id?: string
          image_url?: string | null
          location_ar?: string | null
          location_en?: string | null
          published?: boolean
          slug?: string
          sort_order?: number
          start_date?: string | null
          status?: string
          title_ar?: string
          title_en?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          created_at: string
          description_ar: string | null
          description_en: string | null
          icon: string | null
          id: string
          image_url: string | null
          published: boolean
          sort_order: number
          title_ar: string
          title_en: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description_ar?: string | null
          description_en?: string | null
          icon?: string | null
          id?: string
          image_url?: string | null
          published?: boolean
          sort_order?: number
          title_ar: string
          title_en: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description_ar?: string | null
          description_en?: string | null
          icon?: string | null
          id?: string
          image_url?: string | null
          published?: boolean
          sort_order?: number
          title_ar?: string
          title_en?: string
          updated_at?: string
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          address_ar: string | null
          address_en: string | null
          email: string | null
          facebook: string | null
          footer_note_ar: string | null
          footer_note_en: string | null
          group_name_ar: string
          group_name_en: string
          id: number
          instagram: string | null
          linkedin: string | null
          logo_url: string | null
          phone: string | null
          topbar_text_ar: string | null
          topbar_text_en: string | null
          updated_at: string
          whatsapp: string | null
          youtube: string | null
        }
        Insert: {
          address_ar?: string | null
          address_en?: string | null
          email?: string | null
          facebook?: string | null
          footer_note_ar?: string | null
          footer_note_en?: string | null
          group_name_ar?: string
          group_name_en?: string
          id?: number
          instagram?: string | null
          linkedin?: string | null
          logo_url?: string | null
          phone?: string | null
          topbar_text_ar?: string | null
          topbar_text_en?: string | null
          updated_at?: string
          whatsapp?: string | null
          youtube?: string | null
        }
        Update: {
          address_ar?: string | null
          address_en?: string | null
          email?: string | null
          facebook?: string | null
          footer_note_ar?: string | null
          footer_note_en?: string | null
          group_name_ar?: string
          group_name_en?: string
          id?: number
          instagram?: string | null
          linkedin?: string | null
          logo_url?: string | null
          phone?: string | null
          topbar_text_ar?: string | null
          topbar_text_en?: string | null
          updated_at?: string
          whatsapp?: string | null
          youtube?: string | null
        }
        Relationships: []
      }
      store_categories: {
        Row: {
          created_at: string
          id: string
          name_ar: string
          name_en: string
          slug: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          id?: string
          name_ar: string
          name_en: string
          slug: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          id?: string
          name_ar?: string
          name_en?: string
          slug?: string
          sort_order?: number
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
      app_role: "admin" | "editor" | "user"
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
      app_role: ["admin", "editor", "user"],
    },
  },
} as const

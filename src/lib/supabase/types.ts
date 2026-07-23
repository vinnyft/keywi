export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      access_codes: {
        Row: {
          beneficiaire_email: string | null
          beneficiaire_nom: string | null
          code_6: string
          created_at: string
          expire_at: string | null
          id: string
          key_id: string
          qr_payload: string
          statut: Database["public"]["Enums"]["access_code_status"]
        }
        Insert: {
          beneficiaire_email?: string | null
          beneficiaire_nom?: string | null
          code_6: string
          created_at?: string
          expire_at?: string | null
          id?: string
          key_id: string
          qr_payload: string
          statut?: Database["public"]["Enums"]["access_code_status"]
        }
        Update: {
          beneficiaire_email?: string | null
          beneficiaire_nom?: string | null
          code_6?: string
          created_at?: string
          expire_at?: string | null
          id?: string
          key_id?: string
          qr_payload?: string
          statut?: Database["public"]["Enums"]["access_code_status"]
        }
        Relationships: [
          {
            foreignKeyName: "access_codes_key_id_fkey"
            columns: ["key_id"]
            isOneToOne: false
            referencedRelation: "keys"
            referencedColumns: ["id"]
          },
        ]
      }
      candidatures_commercants: {
        Row: {
          adresse: string
          code_postal: string
          created_at: string
          email: string
          id: string
          message: string | null
          nom_commerce: string
          nom_contact: string
          statut: Database["public"]["Enums"]["candidature_status"]
          telephone: string | null
          ville: string
        }
        Insert: {
          adresse: string
          code_postal: string
          created_at?: string
          email: string
          id?: string
          message?: string | null
          nom_commerce: string
          nom_contact: string
          statut?: Database["public"]["Enums"]["candidature_status"]
          telephone?: string | null
          ville?: string
        }
        Update: {
          adresse?: string
          code_postal?: string
          created_at?: string
          email?: string
          id?: string
          message?: string | null
          nom_commerce?: string
          nom_contact?: string
          statut?: Database["public"]["Enums"]["candidature_status"]
          telephone?: string | null
          ville?: string
        }
        Relationships: []
      }
      keys: {
        Row: {
          badge_uid: string | null
          code_badge_imprime: string
          created_at: string
          date_retour_attendue: string | null
          hote_id: string
          id: string
          logement: string
          paiement_statut: Database["public"]["Enums"]["paiement_status"]
          photo_url: string | null
          relay_point_id: string | null
          retard_notifie: boolean
          slot_id: string | null
          statut: Database["public"]["Enums"]["key_status"]
          updated_at: string
        }
        Insert: {
          badge_uid?: string | null
          code_badge_imprime: string
          created_at?: string
          date_retour_attendue?: string | null
          hote_id: string
          id?: string
          logement: string
          paiement_statut?: Database["public"]["Enums"]["paiement_status"]
          photo_url?: string | null
          relay_point_id?: string | null
          retard_notifie?: boolean
          slot_id?: string | null
          statut?: Database["public"]["Enums"]["key_status"]
          updated_at?: string
        }
        Update: {
          badge_uid?: string | null
          code_badge_imprime?: string
          created_at?: string
          date_retour_attendue?: string | null
          hote_id?: string
          id?: string
          logement?: string
          paiement_statut?: Database["public"]["Enums"]["paiement_status"]
          photo_url?: string | null
          relay_point_id?: string | null
          retard_notifie?: boolean
          slot_id?: string | null
          statut?: Database["public"]["Enums"]["key_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "keys_hote_id_fkey"
            columns: ["hote_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "keys_relay_point_id_fkey"
            columns: ["relay_point_id"]
            isOneToOne: false
            referencedRelation: "relay_points"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "keys_slot_id_fkey"
            columns: ["slot_id"]
            isOneToOne: false
            referencedRelation: "slots"
            referencedColumns: ["id"]
          },
        ]
      }
      movements: {
        Row: {
          created_at: string
          details: Json
          id: string
          key_id: string
          relay_point_id: string
          scanned_by: string | null
          slot_id: string | null
          type: Database["public"]["Enums"]["movement_type"]
        }
        Insert: {
          created_at?: string
          details?: Json
          id?: string
          key_id: string
          relay_point_id: string
          scanned_by?: string | null
          slot_id?: string | null
          type: Database["public"]["Enums"]["movement_type"]
        }
        Update: {
          created_at?: string
          details?: Json
          id?: string
          key_id?: string
          relay_point_id?: string
          scanned_by?: string | null
          slot_id?: string | null
          type?: Database["public"]["Enums"]["movement_type"]
        }
        Relationships: [
          {
            foreignKeyName: "movements_key_id_fkey"
            columns: ["key_id"]
            isOneToOne: false
            referencedRelation: "keys"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movements_relay_point_id_fkey"
            columns: ["relay_point_id"]
            isOneToOne: false
            referencedRelation: "relay_points"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movements_scanned_by_fkey"
            columns: ["scanned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movements_slot_id_fkey"
            columns: ["slot_id"]
            isOneToOne: false
            referencedRelation: "slots"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          canal: string
          created_at: string
          id: string
          lu: boolean
          payload: Json
          type: string
          user_id: string
        }
        Insert: {
          canal?: string
          created_at?: string
          id?: string
          lu?: boolean
          payload?: Json
          type: string
          user_id: string
        }
        Update: {
          canal?: string
          created_at?: string
          id?: string
          lu?: boolean
          payload?: Json
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      paiements: {
        Row: {
          created_at: string
          hote_id: string
          id: string
          key_id: string | null
          montant_centimes: number
          statut: Database["public"]["Enums"]["paiement_status"]
          stripe_session_id: string | null
          type: string
        }
        Insert: {
          created_at?: string
          hote_id: string
          id?: string
          key_id?: string | null
          montant_centimes?: number
          statut?: Database["public"]["Enums"]["paiement_status"]
          stripe_session_id?: string | null
          type?: string
        }
        Update: {
          created_at?: string
          hote_id?: string
          id?: string
          key_id?: string | null
          montant_centimes?: number
          statut?: Database["public"]["Enums"]["paiement_status"]
          stripe_session_id?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "paiements_hote_id_fkey"
            columns: ["hote_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "paiements_key_id_fkey"
            columns: ["key_id"]
            isOneToOne: false
            referencedRelation: "keys"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          id: string
          nom: string | null
          role: Database["public"]["Enums"]["user_role"]
          telephone: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          id: string
          nom?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          telephone?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          nom?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          telephone?: string | null
        }
        Relationships: []
      }
      relay_points: {
        Row: {
          adresse: string
          capacite: number
          code_postal: string
          created_at: string
          description: string | null
          horaires: Json
          id: string
          lat: number
          lng: number
          nom: string
          owner_id: string | null
          photo_url: string | null
          statut: Database["public"]["Enums"]["relay_status"]
          ville: string
        }
        Insert: {
          adresse: string
          capacite?: number
          code_postal: string
          created_at?: string
          description?: string | null
          horaires?: Json
          id?: string
          lat: number
          lng: number
          nom: string
          owner_id?: string | null
          photo_url?: string | null
          statut?: Database["public"]["Enums"]["relay_status"]
          ville?: string
        }
        Update: {
          adresse?: string
          capacite?: number
          code_postal?: string
          created_at?: string
          description?: string | null
          horaires?: Json
          id?: string
          lat?: number
          lng?: number
          nom?: string
          owner_id?: string | null
          photo_url?: string | null
          statut?: Database["public"]["Enums"]["relay_status"]
          ville?: string
        }
        Relationships: [
          {
            foreignKeyName: "relay_points_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      remuneration_paliers: {
        Row: {
          id: number
          montant_centimes: number
          seuil_max: number | null
          seuil_min: number
        }
        Insert: {
          id?: number
          montant_centimes: number
          seuil_max?: number | null
          seuil_min: number
        }
        Update: {
          id?: number
          montant_centimes?: number
          seuil_max?: number | null
          seuil_min?: number
        }
        Relationships: []
      }
      slots: {
        Row: {
          id: string
          numero: number
          relay_point_id: string
          statut: Database["public"]["Enums"]["slot_status"]
        }
        Insert: {
          id?: string
          numero: number
          relay_point_id: string
          statut?: Database["public"]["Enums"]["slot_status"]
        }
        Update: {
          id?: string
          numero?: number
          relay_point_id?: string
          statut?: Database["public"]["Enums"]["slot_status"]
        }
        Relationships: [
          {
            foreignKeyName: "slots_relay_point_id_fkey"
            columns: ["relay_point_id"]
            isOneToOne: false
            referencedRelation: "relay_points"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      annuler_depot: { Args: { p_key_id: string }; Returns: Json }
      attribuer_case: {
        Args: { p_relay_point_id: string }
        Returns: {
          id: string
          numero: number
          relay_point_id: string
          statut: Database["public"]["Enums"]["slot_status"]
        }
        SetofOptions: {
          from: "*"
          to: "slots"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      chercher_retrait: { Args: { p_code: string }; Returns: Json }
      confirmer_depot: { Args: { p_key_id: string }; Returns: Json }
      confirmer_retrait: {
        Args: { p_badge_uid: string; p_code: string }
        Returns: Json
      }
      creer_code_retrait: {
        Args: {
          p_beneficiaire_email?: string
          p_beneficiaire_nom?: string
          p_expire_at?: string
          p_key_id: string
        }
        Returns: Json
      }
      est_admin: { Args: never; Returns: boolean }
      generer_code_badge: { Args: never; Returns: string }
      generer_code_retrait: { Args: never; Returns: string }
      get_my_role: {
        Args: never
        Returns: Database["public"]["Enums"]["user_role"]
      }
      guest_mes_cles: { Args: never; Returns: Json }
      relancer_retards: { Args: never; Returns: Json }
      mon_point_relais: {
        Args: never
        Returns: {
          adresse: string
          capacite: number
          code_postal: string
          created_at: string
          description: string | null
          horaires: Json
          id: string
          lat: number
          lng: number
          nom: string
          owner_id: string | null
          photo_url: string | null
          statut: Database["public"]["Enums"]["relay_status"]
          ville: string
        }
        SetofOptions: {
          from: "*"
          to: "relay_points"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      possede_cle: { Args: { p_key_id: string }; Returns: boolean }
      possede_point_relais: {
        Args: { p_relay_point_id: string }
        Returns: boolean
      }
      preparer_depot: { Args: { p_badge_uid: string }; Returns: Json }
      remuneration_mois: {
        Args: { p_mois?: string; p_relay_point_id: string }
        Returns: Json
      }
      revoquer_code: { Args: { p_access_code_id: string }; Returns: Json }
      stats_publiques: { Args: never; Returns: Json }
      trouver_cle_par_badge: {
        Args: { p_badge: string }
        Returns: {
          badge_uid: string | null
          code_badge_imprime: string
          created_at: string
          hote_id: string
          id: string
          logement: string
          paiement_statut: Database["public"]["Enums"]["paiement_status"]
          photo_url: string | null
          relay_point_id: string | null
          slot_id: string | null
          statut: Database["public"]["Enums"]["key_status"]
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "keys"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      valider_badge: { Args: { p_badge_uid: string }; Returns: Json }
    }
    Enums: {
      access_code_status: "actif" | "utilise" | "revoque" | "expire"
      candidature_status: "en_attente" | "validee" | "refusee"
      key_status:
        | "en_attente"
        | "deposee"
        | "prete_retrait"
        | "retiree"
        | "retour"
        | "perdue"
      movement_type: "depot" | "retrait" | "retour"
      paiement_status: "en_attente" | "paye" | "offert" | "echoue"
      relay_status: "actif" | "inactif" | "en_attente"
      slot_status: "libre" | "occupee"
      user_role: "hote" | "voyageur" | "commercant" | "admin"
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
      access_code_status: ["actif", "utilise", "revoque", "expire"],
      candidature_status: ["en_attente", "validee", "refusee"],
      key_status: [
        "en_attente",
        "deposee",
        "prete_retrait",
        "retiree",
        "retour",
        "perdue",
      ],
      movement_type: ["depot", "retrait", "retour"],
      paiement_status: ["en_attente", "paye", "offert", "echoue"],
      relay_status: ["actif", "inactif", "en_attente"],
      slot_status: ["libre", "occupee"],
      user_role: ["hote", "voyageur", "commercant", "admin"],
    },
  },
} as const


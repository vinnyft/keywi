export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: { id: string; role: "client" | "admin"; nom: string | null; email: string | null; telephone: string | null; created_at: string };
        Insert: { id: string; role?: "client" | "admin"; nom?: string | null; email?: string | null; telephone?: string | null };
        Update: { id?: string; role?: "client" | "admin"; nom?: string | null; email?: string | null; telephone?: string | null };
        Relationships: [];
      };
      settings: {
        Row: { id: number; hauteur_fixe_cm: number; cout_fixe: number; forfait_livraison: number; seuil_livraison_gratuite: number | null; dessous_carrelee: boolean; texte_accueil: string; updated_at: string };
        Insert: { id?: number; hauteur_fixe_cm?: number; cout_fixe?: number; forfait_livraison?: number; seuil_livraison_gratuite?: number | null; dessous_carrelee?: boolean; texte_accueil?: string };
        Update: { id?: number; hauteur_fixe_cm?: number; cout_fixe?: number; forfait_livraison?: number; seuil_livraison_gratuite?: number | null; dessous_carrelee?: boolean; texte_accueil?: string };
        Relationships: [];
      };
      pricing_tiers: {
        Row: { id: string; taille_min_cm: number; taille_max_cm: number; prix_par_m2: number; label: string };
        Insert: { id?: string; taille_min_cm: number; taille_max_cm: number; prix_par_m2: number; label: string };
        Update: { id?: string; taille_min_cm?: number; taille_max_cm?: number; prix_par_m2?: number; label?: string };
        Relationships: [];
      };
      color_surcharges: {
        Row: { nb_couleurs: number; surcharge_pct: number };
        Insert: { nb_couleurs: number; surcharge_pct?: number };
        Update: { nb_couleurs?: number; surcharge_pct?: number };
        Relationships: [];
      };
      colors: {
        Row: { id: string; nom: string; hex: string; type: "tile" | "grout"; ordre: number; actif: boolean };
        Insert: { id?: string; nom: string; hex: string; type: "tile" | "grout"; ordre?: number; actif?: boolean };
        Update: { id?: string; nom?: string; hex?: string; type?: "tile" | "grout"; ordre?: number; actif?: boolean };
        Relationships: [];
      };
      promotions: {
        Row: { id: string; code: string; type: "pourcentage" | "montant_fixe" | "livraison_gratuite"; valeur: number; seuil_montant: number | null; seuil_quantite: number | null; date_debut: string | null; date_fin: string | null; actif: boolean; usage_unique: boolean; nb_utilisations: number; description: string | null; created_at: string };
        Insert: { id?: string; code: string; type: "pourcentage" | "montant_fixe" | "livraison_gratuite"; valeur: number; seuil_montant?: number | null; seuil_quantite?: number | null; date_debut?: string | null; date_fin?: string | null; actif?: boolean; usage_unique?: boolean; nb_utilisations?: number; description?: string | null };
        Update: { id?: string; code?: string; type?: "pourcentage" | "montant_fixe" | "livraison_gratuite"; valeur?: number; seuil_montant?: number | null; seuil_quantite?: number | null; date_debut?: string | null; date_fin?: string | null; actif?: boolean; usage_unique?: boolean; nb_utilisations?: number; description?: string | null };
        Relationships: [];
      };
      orders: {
        Row: { id: string; user_id: string | null; statut: "en_attente_paiement" | "payee" | "en_production" | "expediee" | "livree" | "annulee"; montant_ht: number; montant_ttc: number; promo_id: string | null; promo_remise: number; stripe_session_id: string | null; adresse_livraison: Json | null; frais_livraison: number; created_at: string; updated_at: string };
        Insert: { id?: string; user_id?: string | null; statut?: "en_attente_paiement" | "payee" | "en_production" | "expediee" | "livree" | "annulee"; montant_ht: number; montant_ttc: number; promo_id?: string | null; promo_remise?: number; stripe_session_id?: string | null; adresse_livraison?: Json | null; frais_livraison?: number };
        Update: { id?: string; user_id?: string | null; statut?: "en_attente_paiement" | "payee" | "en_production" | "expediee" | "livree" | "annulee"; montant_ht?: number; montant_ttc?: number; promo_id?: string | null; promo_remise?: number; stripe_session_id?: string | null; adresse_livraison?: Json | null; frais_livraison?: number };
        Relationships: [
          { foreignKeyName: "orders_promo_id_fkey"; columns: ["promo_id"]; isOneToOne: false; referencedRelation: "promotions"; referencedColumns: ["id"] },
          { foreignKeyName: "orders_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] }
        ];
      };
      order_items: {
        Row: { id: string; order_id: string; config_json: Json; longueur_cm: number; largeur_cm: number; hauteur_cm: number; surface_m2: number; nb_carreaux_total: number; prix_unitaire: number; quantite: number };
        Insert: { id?: string; order_id: string; config_json: Json; longueur_cm: number; largeur_cm: number; hauteur_cm: number; surface_m2: number; nb_carreaux_total: number; prix_unitaire: number; quantite?: number };
        Update: { id?: string; order_id?: string; config_json?: Json; longueur_cm?: number; largeur_cm?: number; hauteur_cm?: number; surface_m2?: number; nb_carreaux_total?: number; prix_unitaire?: number; quantite?: number };
        Relationships: [{ foreignKeyName: "order_items_order_id_fkey"; columns: ["order_id"]; isOneToOne: false; referencedRelation: "orders"; referencedColumns: ["id"] }];
      };
    };
    Views: Record<string, never>;
    Functions: { is_admin: { Args: Record<string, never>; Returns: boolean } };
    Enums: {
      user_role: "client" | "admin";
      order_status: "en_attente_paiement" | "payee" | "en_production" | "expediee" | "livree" | "annulee";
      promo_type: "pourcentage" | "montant_fixe" | "livraison_gratuite";
      color_type: "tile" | "grout";
    };
    CompositeTypes: Record<string, never>;
  };
};

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Settings = Database["public"]["Tables"]["settings"]["Row"];
export type PricingTier = Database["public"]["Tables"]["pricing_tiers"]["Row"];
export type ColorSurcharge = Database["public"]["Tables"]["color_surcharges"]["Row"];
export type Color = Database["public"]["Tables"]["colors"]["Row"];
export type Promotion = Database["public"]["Tables"]["promotions"]["Row"];
export type Order = Database["public"]["Tables"]["orders"]["Row"];
export type OrderItem = Database["public"]["Tables"]["order_items"]["Row"];

export interface ConfigMeuble {
  tailleCm: number;
  nbLongueur: number;
  nbLargeur: number;
  couleurs: string[];
  couleurJoint: string;
  seed: number;
  hauteurCm: number;
  motif?: "aleatoire" | "lignes" | "croise" | "uni" | "accent";
}

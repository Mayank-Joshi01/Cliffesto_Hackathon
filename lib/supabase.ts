import "server-only";
import { createClient } from "@supabase/supabase-js";

let client: ReturnType<typeof createClient<Database>> | undefined;

type Id = string | number;

type Database = {
  public: {
    Tables: {
      Products: {
        Row: {
          product_id: Id;
          title: string | null;
          category: string | null;
          subcategory: string | null;
          brand: string | null;
          original_price: number | string | null;
          discounted_price: number | string | null;
          discount_percentage: number | string | null;
          availability: string | boolean | null;
          seller_name: string | null;
          image_url: string | null;
          product_url: string | null;
          description: string | null;
          colors_available: unknown;
          sizes_available: unknown;
          material: string | null;
          cod_available: string | boolean | null;
          return_policy: string | null;
          delivery_time: string | null;
          source_page: string | null;
        };
        Insert: never;
        Update: never;
        Relationships: [];
      };
      Categories: {
        Row: {
          category_id: Id;
          name: string;
          parent_category: string | null;
          level: number | null;
          product_count: number | null;
          url: string | null;
          image_url: string | null;
          is_active: boolean | null;
        };
        Insert: never;
        Update: never;
        Relationships: [];
      };
      Sellers: {
        Row: {
          seller_id: Id;
          name: string;
          rating: number | string | null;
          total_products: number | null;
          years_on_platform: number | null;
          location: string | null;
          verified: boolean | null;
          response_time: string | null;
          return_policy: string | null;
          cod_accepted: boolean | null;
        };
        Insert: never;
        Update: never;
        Relationships: [];
      };
      Cart: {
        Row: { user_id: Id; product_id: Id; count: number };
        Insert: never;
        Update: never;
        Relationships: [];
      };
      Users: {
        Row: {
          id: Id;
          name: string | null;
          phone: string | null;
          email: string | null;
          password_hash: string | null;
        };
        Insert: never;
        Update: never;
        Relationships: [];
      };
      Address: {
        Row: {
          pincode: string | null;
          "house_no/building_name": string | null;
          colony: string | null;
          city: string | null;
          state: string | null;
        };
        Insert: never;
        Update: never;
        Relationships: [];
      };
      Payments: {
        Row: {
          order_id: Id;
          gateway_txn_id: string | null;
          amount: number | string | null;
          status: string | null;
          user_id: Id;
        };
        Insert: never;
        Update: never;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

export function getSupabase() {
  if (client) return client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    throw new Error("Supabase is not configured. Set the project URL and publishable key.");
  }

  client = createClient<Database>(url, key, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  });
  return client;
}

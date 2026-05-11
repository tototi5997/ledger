export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string | null
          display_name: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email?: string | null
          display_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          email?: string | null
          display_name?: string | null
          avatar_url?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      ledgers: {
        Row: {
          id: string
          name: string
          description: string | null
          currency: string
          created_by: string
          is_default: boolean
          created_at: string
          updated_at: string
          archived_at: string | null
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          currency?: string
          created_by: string
          is_default?: boolean
          created_at?: string
          updated_at?: string
          archived_at?: string | null
        }
        Update: {
          name?: string
          description?: string | null
          currency?: string
          is_default?: boolean
          updated_at?: string
          archived_at?: string | null
        }
        Relationships: []
      }
      funding_sources: {
        Row: {
          id: string
          ledger_id: string
          name: string
          icon: string | null
          color: string | null
          created_by: string
          created_at: string
          updated_at: string
          hidden_at: string | null
        }
        Insert: {
          id?: string
          ledger_id: string
          name: string
          icon?: string | null
          color?: string | null
          created_by: string
          created_at?: string
          updated_at?: string
          hidden_at?: string | null
        }
        Update: {
          name?: string
          icon?: string | null
          color?: string | null
          updated_at?: string
          hidden_at?: string | null
        }
        Relationships: []
      }
      category_tags: {
        Row: {
          id: string
          ledger_id: string
          name: string
          type: "expense" | "income"
          icon: string | null
          color: string | null
          created_by: string
          created_at: string
          updated_at: string
          hidden_at: string | null
        }
        Insert: {
          id?: string
          ledger_id: string
          name: string
          type: "expense" | "income"
          icon?: string | null
          color?: string | null
          created_by: string
          created_at?: string
          updated_at?: string
          hidden_at?: string | null
        }
        Update: {
          name?: string
          type?: "expense" | "income"
          icon?: string | null
          color?: string | null
          updated_at?: string
          hidden_at?: string | null
        }
        Relationships: []
      }
      transactions: {
        Row: {
          id: string
          ledger_id: string
          type: "expense" | "income"
          amount: string
          currency: string
          funding_source_id: string
          category_tag_id: string
          transaction_date: string
          note: string | null
          created_by: string
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          ledger_id: string
          type: "expense" | "income"
          amount: string | number
          currency?: string
          funding_source_id: string
          category_tag_id: string
          transaction_date: string
          note?: string | null
          created_by: string
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Update: {
          type?: "expense" | "income"
          amount?: string | number
          currency?: string
          funding_source_id?: string
          category_tag_id?: string
          transaction_date?: string
          note?: string | null
          updated_at?: string
          deleted_at?: string | null
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}

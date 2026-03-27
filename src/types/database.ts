// Database Types - Vault Caixa Alerta
// Generated types for Supabase tables

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          company_name: string | null
          phone: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          company_name?: string | null
          phone?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          company_name?: string | null
          phone?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      transactions: {
        Row: {
          id: string
          user_id: string
          type: 'income' | 'expense'
          amount: number
          description: string
          category: string
          date: string
          pluggy_transaction_id: string | null
          pluggy_account_id: string | null
          bank_account_id: string | null
          synced_from_bank: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: 'income' | 'expense'
          amount: number
          description: string
          category: string
          date?: string
          pluggy_transaction_id?: string | null
          pluggy_account_id?: string | null
          bank_account_id?: string | null
          synced_from_bank?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: 'income' | 'expense'
          amount?: number
          description?: string
          category?: string
          date?: string
          pluggy_transaction_id?: string | null
          pluggy_account_id?: string | null
          bank_account_id?: string | null
          synced_from_bank?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      projections: {
        Row: {
          id: string
          user_id: string
          projection_date: string
          projected_balance: number
          confidence_level: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          projection_date: string
          projected_balance: number
          confidence_level?: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          projection_date?: string
          projected_balance?: number
          confidence_level?: number
          created_at?: string
        }
      }
      financial_goals: {
        Row: {
          id: string
          user_id: string
          title: string
          target_amount: number
          current_amount: number
          deadline: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          target_amount: number
          current_amount?: number
          deadline?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          target_amount?: number
          current_amount?: number
          deadline?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      ai_insights: {
        Row: {
          id: string
          user_id: string
          insight_type: 'warning' | 'success' | 'danger' | 'info'
          title: string
          description: string
          action: string
          is_read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          insight_type: 'warning' | 'success' | 'danger' | 'info'
          title: string
          description: string
          action: string
          is_read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          insight_type?: 'warning' | 'success' | 'danger' | 'info'
          title?: string
          description?: string
          action?: string
          is_read?: boolean
          created_at?: string
        }
      }
      bank_connections: {
        Row: {
          id: string
          user_id: string
          pluggy_item_id: string
          pluggy_connector_id: number
          connector_name: string
          connector_image_url: string | null
          status: string
          last_synced_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          pluggy_item_id: string
          pluggy_connector_id: number
          connector_name: string
          connector_image_url?: string | null
          status?: string
          last_synced_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          pluggy_item_id?: string
          pluggy_connector_id?: number
          connector_name?: string
          connector_image_url?: string | null
          status?: string
          last_synced_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      bank_accounts: {
        Row: {
          id: string
          user_id: string
          bank_connection_id: string
          pluggy_account_id: string
          account_type: string
          account_subtype: string | null
          account_name: string
          balance: number
          currency_code: string
          is_primary: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          bank_connection_id: string
          pluggy_account_id: string
          account_type: string
          account_subtype?: string | null
          account_name: string
          balance?: number
          currency_code?: string
          is_primary?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          bank_connection_id?: string
          pluggy_account_id?: string
          account_type?: string
          account_subtype?: string | null
          account_name?: string
          balance?: number
          currency_code?: string
          is_primary?: boolean
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      transaction_type: 'income' | 'expense'
      insight_type: 'warning' | 'success' | 'danger' | 'info'
    }
  }
}

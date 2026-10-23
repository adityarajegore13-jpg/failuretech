export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole = "admin" | "team_member" | "client";
export type OrgRole = "owner" | "admin" | "member" | "billing_contact";
export type PriorityLevel = "low" | "medium" | "high" | "urgent";
export type ProjectStatus =
  | "discovery"
  | "in_progress"
  | "in_review"
  | "completed"
  | "on_hold"
  | "cancelled";
export type MilestoneStatus =
  | "planned"
  | "in_progress"
  | "in_review"
  | "completed"
  | "blocked";
export type DeliverableStatus =
  | "backlog"
  | "in_progress"
  | "in_review"
  | "approved"
  | "rejected";
export type InvoiceStatus =
  | "draft"
  | "issued"
  | "paid"
  | "overdue"
  | "void"
  | "refunded";
export type PaymentStatus =
  | "pending"
  | "succeeded"
  | "failed"
  | "refunded";
export type NotificationType =
  | "project_update"
  | "milestone_completed"
  | "deliverable_ready"
  | "new_comment"
  | "invoice_issued"
  | "payment_received"
  | "system_alert";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          role: UserRole;
          phone: string | null;
          title: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          role?: UserRole;
          phone?: string | null;
          title?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          role?: UserRole;
          phone?: string | null;
          title?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      organizations: {
        Row: {
          id: string;
          name: string;
          slug: string;
          logo_url: string | null;
          website: string | null;
          billing_email: string | null;
          billing_address: Json;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          logo_url?: string | null;
          website?: string | null;
          billing_email?: string | null;
          billing_address?: Json;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          logo_url?: string | null;
          website?: string | null;
          billing_email?: string | null;
          billing_address?: Json;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      organization_members: {
        Row: {
          id: string;
          organization_id: string;
          user_id: string;
          role: OrgRole;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          user_id: string;
          role?: OrgRole;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          user_id?: string;
          role?: OrgRole;
          created_at?: string;
          updated_at?: string;
        };
      };
      projects: {
        Row: {
          id: string;
          organization_id: string;
          title: string;
          code: string;
          description: string | null;
          status: ProjectStatus;
          priority: PriorityLevel;
          is_archived: boolean;
          budget_total: number;
          currency: string;
          progress_percent: number;
          start_date: string | null;
          target_delivery_date: string | null;
          repository_url: string | null;
          staging_url: string | null;
          production_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          title: string;
          code: string;
          description?: string | null;
          status?: ProjectStatus;
          priority?: PriorityLevel;
          is_archived?: boolean;
          budget_total?: number;
          currency?: string;
          progress_percent?: number;
          start_date?: string | null;
          target_delivery_date?: string | null;
          repository_url?: string | null;
          staging_url?: string | null;
          production_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          title?: string;
          code?: string;
          description?: string | null;
          status?: ProjectStatus;
          priority?: PriorityLevel;
          is_archived?: boolean;
          budget_total?: number;
          currency?: string;
          progress_percent?: number;
          start_date?: string | null;
          target_delivery_date?: string | null;
          repository_url?: string | null;
          staging_url?: string | null;
          production_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      project_members: {
        Row: {
          id: string;
          project_id: string;
          user_id: string;
          project_role: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          user_id: string;
          project_role?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          user_id?: string;
          project_role?: string;
          created_at?: string;
        };
      };
      milestones: {
        Row: {
          id: string;
          project_id: string;
          title: string;
          description: string | null;
          status: MilestoneStatus;
          sequence_order: number;
          due_date: string | null;
          completed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          title: string;
          description?: string | null;
          status?: MilestoneStatus;
          sequence_order?: number;
          due_date?: string | null;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          title?: string;
          description?: string | null;
          status?: MilestoneStatus;
          sequence_order?: number;
          due_date?: string | null;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      deliverables: {
        Row: {
          id: string;
          project_id: string;
          milestone_id: string | null;
          title: string;
          description: string | null;
          status: DeliverableStatus;
          priority: PriorityLevel;
          acceptance_criteria: string | null;
          assigned_to: string | null;
          preview_url: string | null;
          submitted_at: string | null;
          reviewed_at: string | null;
          reviewed_by: string | null;
          revision_notes: string | null;
          due_date: string | null;
          completed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          milestone_id?: string | null;
          title: string;
          description?: string | null;
          status?: DeliverableStatus;
          priority?: PriorityLevel;
          acceptance_criteria?: string | null;
          assigned_to?: string | null;
          preview_url?: string | null;
          submitted_at?: string | null;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          revision_notes?: string | null;
          due_date?: string | null;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          milestone_id?: string | null;
          title?: string;
          description?: string | null;
          status?: DeliverableStatus;
          priority?: PriorityLevel;
          acceptance_criteria?: string | null;
          assigned_to?: string | null;
          preview_url?: string | null;
          submitted_at?: string | null;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          revision_notes?: string | null;
          due_date?: string | null;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      comments: {
        Row: {
          id: string;
          project_id: string;
          deliverable_id: string | null;
          author_id: string;
          parent_id: string | null;
          content: string;
          is_internal_only: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          deliverable_id?: string | null;
          author_id: string;
          parent_id?: string | null;
          content: string;
          is_internal_only?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          deliverable_id?: string | null;
          author_id?: string;
          parent_id?: string | null;
          content?: string;
          is_internal_only?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      files: {
        Row: {
          id: string;
          project_id: string;
          deliverable_id: string | null;
          uploaded_by: string;
          file_name: string;
          file_path: string;
          file_size_bytes: number;
          mime_type: string | null;
          category: string;
          description: string | null;
          is_public_to_client: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          deliverable_id?: string | null;
          uploaded_by: string;
          file_name: string;
          file_path: string;
          file_size_bytes?: number;
          mime_type?: string | null;
          category?: string;
          description?: string | null;
          is_public_to_client?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          deliverable_id?: string | null;
          uploaded_by?: string;
          file_name?: string;
          file_path?: string;
          file_size_bytes?: number;
          mime_type?: string | null;
          category?: string;
          description?: string | null;
          is_public_to_client?: boolean;
          created_at?: string;
        };
      };
      invoices: {
        Row: {
          id: string;
          organization_id: string;
          project_id: string | null;
          invoice_number: string;
          status: InvoiceStatus;
          subtotal_amount: number;
          tax_rate: number;
          tax_amount: number;
          discount_amount: number;
          total_amount: number;
          currency: string;
          issue_date: string;
          due_date: string;
          paid_at: string | null;
          notes: string | null;
          client_notes: string | null;
          razorpay_order_id: string | null;
          pdf_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          project_id?: string | null;
          invoice_number: string;
          status?: InvoiceStatus;
          subtotal_amount?: number;
          tax_rate?: number;
          tax_amount?: number;
          discount_amount?: number;
          total_amount?: number;
          currency?: string;
          issue_date?: string;
          due_date: string;
          paid_at?: string | null;
          notes?: string | null;
          client_notes?: string | null;
          razorpay_order_id?: string | null;
          pdf_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          project_id?: string | null;
          invoice_number?: string;
          status?: InvoiceStatus;
          subtotal_amount?: number;
          tax_rate?: number;
          tax_amount?: number;
          discount_amount?: number;
          total_amount?: number;
          currency?: string;
          issue_date?: string;
          due_date?: string;
          paid_at?: string | null;
          notes?: string | null;
          client_notes?: string | null;
          razorpay_order_id?: string | null;
          pdf_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      invoice_items: {
        Row: {
          id: string;
          invoice_id: string;
          description: string;
          quantity: number;
          unit_price: number;
          amount: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          invoice_id: string;
          description: string;
          quantity?: number;
          unit_price?: number;
          amount?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          invoice_id?: string;
          description?: string;
          quantity?: number;
          unit_price?: number;
          amount?: number;
          created_at?: string;
        };
      };
      payment_records: {
        Row: {
          id: string;
          invoice_id: string;
          transaction_reference: string;
          payment_method: string;
          amount: number;
          currency: string;
          status: PaymentStatus;
          metadata: Json;
          razorpay_order_id: string | null;
          razorpay_payment_id: string | null;
          paid_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          invoice_id: string;
          transaction_reference: string;
          payment_method: string;
          amount: number;
          currency?: string;
          status?: PaymentStatus;
          metadata?: Json;
          razorpay_order_id?: string | null;
          razorpay_payment_id?: string | null;
          paid_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          invoice_id?: string;
          transaction_reference?: string;
          payment_method?: string;
          amount?: number;
          currency?: string;
          status?: PaymentStatus;
          metadata?: Json;
          razorpay_order_id?: string | null;
          razorpay_payment_id?: string | null;
          paid_at?: string | null;
          created_at?: string;
        };
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type: NotificationType;
          title: string;
          message: string;
          link: string | null;
          is_read: boolean;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: NotificationType;
          title: string;
          message: string;
          link?: string | null;
          is_read?: boolean;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?: NotificationType;
          title?: string;
          message?: string;
          link?: string | null;
          is_read?: boolean;
          metadata?: Json;
          created_at?: string;
        };
      };
      invitations: {
        Row: {
          id: string;
          organization_id: string;
          email: string;
          role: UserRole;
          org_role: OrgRole;
          token: string;
          invited_by: string | null;
          status: "pending" | "accepted" | "expired" | "revoked";
          expires_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          email: string;
          role?: UserRole;
          org_role?: OrgRole;
          token: string;
          invited_by?: string | null;
          status?: "pending" | "accepted" | "expired" | "revoked";
          expires_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          email?: string;
          role?: UserRole;
          org_role?: OrgRole;
          token?: string;
          invited_by?: string | null;
          status?: "pending" | "accepted" | "expired" | "revoked";
          expires_at?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      record_verified_razorpay_payment: {
        Args: {
          p_invoice_id: string;
          p_payment_id: string;
          p_order_id: string;
          p_amount: number;
          p_currency: string;
          p_metadata?: Json;
        };
        Returns: Json;
      };
      can_access_invoice: {
        Args: {
          p_invoice_id: string;
        };
        Returns: boolean;
      };
      can_access_project: {
        Args: {
          p_project_id: string;
        };
        Returns: boolean;
      };
      is_admin: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
      is_agency_team: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
    };
  };
}

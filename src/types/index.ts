import {
  Database,
  UserRole,
  OrgRole,
  ProjectStatus,
  MilestoneStatus,
  DeliverableStatus,
  InvoiceStatus,
  PaymentStatus,
  NotificationType,
} from "./database";

export * from "./database";

// Entity Row Aliases
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Organization = Database["public"]["Tables"]["organizations"]["Row"];
export type OrganizationMember = Database["public"]["Tables"]["organization_members"]["Row"];
export type Project = Database["public"]["Tables"]["projects"]["Row"];
export type ProjectMember = Database["public"]["Tables"]["project_members"]["Row"];
export type Milestone = Database["public"]["Tables"]["milestones"]["Row"];
export type Deliverable = Database["public"]["Tables"]["deliverables"]["Row"];
export type Comment = Database["public"]["Tables"]["comments"]["Row"];
export type ProjectFile = Database["public"]["Tables"]["files"]["Row"];
export type ProjectFileWithUploader = ProjectFile & {
  uploader?: Pick<Profile, "id" | "full_name" | "email" | "avatar_url" | "role"> | null;
};
export type Invoice = Database["public"]["Tables"]["invoices"]["Row"];
export type InvoiceItem = Database["public"]["Tables"]["invoice_items"]["Row"];
export type PaymentRecord = Database["public"]["Tables"]["payment_records"]["Row"];
export type Notification = Database["public"]["Tables"]["notifications"]["Row"];
export type Invitation = Database["public"]["Tables"]["invitations"]["Row"];

export type InvoiceWithDetails = Invoice & {
  items: InvoiceItem[];
  organization?: Pick<Organization, "id" | "name" | "slug"> | null;
  project?: Pick<Project, "id" | "title" | "code"> | null;
  payment_records?: PaymentRecord[];
};

export interface CreateInvoiceLineItemInput {
  description: string;
  quantity: number;
  unit_price: number;
}

export interface CreateInvoiceInput {
  organization_id: string;
  project_id?: string | null;
  invoice_number?: string;
  issue_date?: string;
  due_date: string;
  tax_rate?: number;
  discount_amount?: number;
  currency?: string;
  notes?: string | null;
  client_notes?: string | null;
  status?: Invoice["status"];
  items: CreateInvoiceLineItemInput[];
}

// Domain View Models
export interface PortalUser {
  id: string;
  email: string;
  fullName: string;
  avatarUrl?: string;
  companyName: string;
  role: UserRole;
  title?: string;
}

export interface ProjectSummary {
  id: string;
  title: string;
  code: string;
  organizationName: string;
  status: ProjectStatus;
  progressPercent: number;
  deliveryDate: string;
  budgetTotal: number;
  currency: string;
  openDeliverablesCount: number;
  unpaidInvoicesCount: number;
}

export interface MetricCardData {
  title: string;
  value: string | number;
  change?: string;
  isPositive?: boolean;
  subtitle: string;
  iconName: string;
}

export interface ActivityItem {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  type: "project" | "milestone" | "deliverable" | "invoice" | "deployment" | "security";
}

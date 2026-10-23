import {
  PortalUser,
  ProjectSummary,
  ProjectStatus,
  MilestoneStatus,
} from "@/types";

export interface DashboardMetric {
  id: string;
  title: string;
  value: string;
  change: string;
  isPositive?: boolean;
  trend: "up" | "down" | "neutral" | "alert";
  subtitle: string;
  badgeText?: string;
  colorTheme: "indigo" | "emerald" | "amber" | "cyan" | "rose";
  iconName: "FolderKanban" | "CheckCircle2" | "Clock" | "Receipt" | "AlertTriangle";
}

export interface UpcomingDeadlineItem {
  id: string;
  title: string;
  projectTitle: string;
  projectCode: string;
  dueDate: string;
  urgency: "today" | "upcoming" | "overdue" | "next_week";
  status: MilestoneStatus;
  assignee: {
    name: string;
    avatar?: string;
    role: string;
  };
  deliverablesCount: number;
}

export interface PendingApprovalItem {
  id: string;
  title: string;
  projectTitle: string;
  deliverableType: "architecture" | "design" | "qa_report" | "milestone";
  submittedBy: string;
  submittedAt: string;
  dueDate: string;
  urgency: "urgent" | "standard";
}

export interface VelocityDataPoint {
  sprint: string;
  planned: number;
  completed: number;
  velocityRate: number;
}

export interface FinancialDataPoint {
  month: string;
  billed: number;
  unbilled: number;
  cap: number;
}

export const DEMO_PORTAL_USER: PortalUser = {
  id: "usr-demo-01",
  email: "m.vance@acmeglobal.com",
  fullName: "Marcus Vance",
  companyName: "Acme Global Ltd.",
  role: "client",
  title: "VP of Digital Engineering",
};

export const DEMO_DASHBOARD_METRICS: DashboardMetric[] = [
  {
    id: "metric-active-projects",
    title: "Active Projects",
    value: "4",
    change: "+1 this quarter",
    isPositive: true,
    trend: "up",
    subtitle: "Across Web, API & Mobile services",
    badgeText: "8 Deliverables In Flight",
    colorTheme: "indigo",
    iconName: "FolderKanban",
  },
  {
    id: "metric-pending-approvals",
    title: "Pending Approvals",
    value: "3",
    change: "2 require your review",
    isPositive: false,
    trend: "alert",
    subtitle: "Deliverables waiting for stakeholder sign-off",
    badgeText: "Action Required",
    colorTheme: "amber",
    iconName: "Clock",
  },
  {
    id: "metric-overdue-milestones",
    title: "Overdue Milestones",
    value: "1",
    change: "2 days past SLA",
    isPositive: false,
    trend: "alert",
    subtitle: "Blocked on external vendor API credentials",
    badgeText: "Critical Attention",
    colorTheme: "rose",
    iconName: "AlertTriangle",
  },
  {
    id: "metric-unbilled-amount",
    title: "Unbilled Retainer",
    value: "$18,450",
    change: "68% of monthly buffer",
    isPositive: true,
    trend: "neutral",
    subtitle: "Next billing cycle locks Nov 01, 2026",
    badgeText: "Retainer Active",
    colorTheme: "cyan",
    iconName: "Receipt",
  },
];

export const DEMO_PROJECTS_LIST: Array<
  ProjectSummary & {
    techStack: string[];
    teamLead: { name: string; avatar?: string };
    lastActivity: string;
  }
> = [
  {
    id: "ft-proj-01",
    title: "Fintech Core Banking API & Mobile Portal",
    code: "FT-FINTECH-01",
    organizationName: "Acme Global Ltd.",
    status: "in_progress",
    progressPercent: 78,
    deliveryDate: "Nov 15, 2026",
    budgetTotal: 45000,
    currency: "USD",
    openDeliverablesCount: 4,
    unpaidInvoicesCount: 1,
    techStack: ["Next.js 16", "TypeScript", "Supabase", "GraphQL"],
    teamLead: { name: "Alex Chen" },
    lastActivity: "Committed backend schema v2.14",
  },
  {
    id: "ft-proj-02",
    title: "AI Document Intelligence & Vector Pipeline",
    code: "FT-AI-04",
    organizationName: "Acme Global Ltd.",
    status: "in_review",
    progressPercent: 94,
    deliveryDate: "Oct 30, 2026",
    budgetTotal: 32000,
    currency: "USD",
    openDeliverablesCount: 2,
    unpaidInvoicesCount: 0,
    techStack: ["Python", "FastAPI", "VectorDB", "AWS Lambda"],
    teamLead: { name: "Elena Rostova" },
    lastActivity: "Staging benchmark cleared 99.4% accuracy",
  },
  {
    id: "ft-proj-03",
    title: "High-Frequency Algorithmic Analytics Dashboard",
    code: "FT-DASH-09",
    organizationName: "Acme Global Ltd.",
    status: "in_progress",
    progressPercent: 62,
    deliveryDate: "Dec 08, 2026",
    budgetTotal: 28500,
    currency: "USD",
    openDeliverablesCount: 5,
    unpaidInvoicesCount: 1,
    techStack: ["React 19", "Tailwind CSS", "WebSockets", "Redis"],
    teamLead: { name: "Devon Reed" },
    lastActivity: "Refactored WebSocket stream throttler",
  },
  {
    id: "ft-proj-04",
    title: "Next-Gen Client Security & Identity Broker",
    code: "FT-SEC-02",
    organizationName: "Acme Global Ltd.",
    status: "completed",
    progressPercent: 100,
    deliveryDate: "Oct 18, 2026",
    budgetTotal: 19000,
    currency: "USD",
    openDeliverablesCount: 0,
    unpaidInvoicesCount: 0,
    techStack: ["PostgreSQL RLS", "OAuth2", "PKCE", "Cloudflare Workers"],
    teamLead: { name: "Priya Sharma" },
    lastActivity: "Production deployment signed off by SecOps",
  },
];

export const DEMO_UPCOMING_DEADLINES: UpcomingDeadlineItem[] = [
  {
    id: "dl-01",
    title: "Staging Microservices API Penetration Audit",
    projectTitle: "Fintech Core Banking API",
    projectCode: "FT-FINTECH-01",
    dueDate: "Today, 5:00 PM EST",
    urgency: "today",
    status: "in_review",
    assignee: {
      name: "Alex Chen",
      role: "Lead Systems Architect",
    },
    deliverablesCount: 2,
  },
  {
    id: "dl-02",
    title: "Figma Design System Token Export & Review",
    projectTitle: "AI Document Intelligence",
    projectCode: "FT-AI-04",
    dueDate: "In 2 Days (Oct 24)",
    urgency: "upcoming",
    status: "in_progress",
    assignee: {
      name: "Sarah Lin",
      role: "Senior Product Designer",
    },
    deliverablesCount: 1,
  },
  {
    id: "dl-03",
    title: "Database Sharding & Read Replica Migration",
    projectTitle: "High-Frequency Algorithmic Dashboard",
    projectCode: "FT-DASH-09",
    dueDate: "2 Days Overdue (Oct 20)",
    urgency: "overdue",
    status: "blocked",
    assignee: {
      name: "Devon Reed",
      role: "DevOps Engineer",
    },
    deliverablesCount: 3,
  },
  {
    id: "dl-04",
    title: "Biometric WebAuthn FIDO2 Bridge Rollout",
    projectTitle: "Client Security & Identity Broker",
    projectCode: "FT-SEC-02",
    dueDate: "Next Week (Oct 29)",
    urgency: "next_week",
    status: "planned",
    assignee: {
      name: "Priya Sharma",
      role: "Security Specialist",
    },
    deliverablesCount: 1,
  },
];

export const DEMO_PENDING_APPROVALS: PendingApprovalItem[] = [
  {
    id: "appr-01",
    title: "OAuth2 Token Bridge Security Architecture RFC",
    projectTitle: "Fintech Core Banking API",
    deliverableType: "architecture",
    submittedBy: "Alex Chen",
    submittedAt: "Yesterday at 4:30 PM",
    dueDate: "Today by 6:00 PM",
    urgency: "urgent",
  },
  {
    id: "appr-02",
    title: "Staging Load Test Stress Report (10,000 RPS Cleared)",
    projectTitle: "AI Document Intelligence",
    deliverableType: "qa_report",
    submittedBy: "Elena Rostova",
    submittedAt: "2 days ago",
    dueDate: "Oct 24, 2026",
    urgency: "standard",
  },
  {
    id: "appr-03",
    title: "Sprint 14 User Acceptance Sign-off Checklist",
    projectTitle: "High-Frequency Algorithmic Dashboard",
    deliverableType: "milestone",
    submittedBy: "Devon Reed",
    submittedAt: "Oct 19, 2026",
    dueDate: "Oct 25, 2026",
    urgency: "standard",
  },
];

export const DEMO_VELOCITY_DATA: VelocityDataPoint[] = [
  { sprint: "Sprint 10", planned: 42, completed: 44, velocityRate: 104 },
  { sprint: "Sprint 11", planned: 48, completed: 46, velocityRate: 96 },
  { sprint: "Sprint 12", planned: 50, completed: 52, velocityRate: 104 },
  { sprint: "Sprint 13", planned: 55, completed: 54, velocityRate: 98 },
  { sprint: "Sprint 14 (Active)", planned: 60, completed: 56, velocityRate: 93 },
  { sprint: "Sprint 15 (Target)", planned: 62, completed: 18, velocityRate: 29 },
];

export const DEMO_CASHFLOW_DATA: FinancialDataPoint[] = [
  { month: "Jun", billed: 22000, unbilled: 4500, cap: 28000 },
  { month: "Jul", billed: 24500, unbilled: 3500, cap: 28000 },
  { month: "Aug", billed: 26000, unbilled: 2000, cap: 28000 },
  { month: "Sep", billed: 23500, unbilled: 5000, cap: 28000 },
  { month: "Oct (Current)", billed: 18450, unbilled: 8550, cap: 28000 },
];

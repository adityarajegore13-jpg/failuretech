"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  User,
  Calendar,
  FileCheck2,
  ExternalLink,
  MessageSquare,
  Paperclip,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DeliverableReviewModal } from "@/components/deliverables/deliverable-review-modal";
import { updateDeliverableStatusAction } from "@/lib/projects/actions";
import { getDeliverableDetailsAction } from "@/lib/storage/actions";
import { DeliverableDetailView } from "@/lib/projects/queries";
import { Deliverable, DeliverableStatus, PriorityLevel, Profile } from "@/types";

interface DeliverableItemProps {
  deliverable: Deliverable & {
    assignee?: Pick<Profile, "id" | "full_name" | "email" | "avatar_url" | "role"> | null;
  };
  projectId: string;
  isClient: boolean;
  isAdmin?: boolean;
}

const PRIORITY_BADGE_MAP: Record<PriorityLevel, { text: string; variant: "danger" | "warning" | "default" | "info" }> = {
  urgent: { text: "Urgent", variant: "danger" },
  high: { text: "High", variant: "warning" },
  medium: { text: "Medium", variant: "info" },
  low: { text: "Low", variant: "default" },
};

const STATUS_CONFIG: Record<
  DeliverableStatus,
  { text: string; color: string; badgeVariant: "purple" | "warning" | "success" | "danger" | "default" }
> = {
  backlog: { text: "Backlog", color: "text-slate-400", badgeVariant: "default" },
  in_progress: { text: "In Progress", color: "text-indigo-400", badgeVariant: "purple" },
  in_review: { text: "Ready for Client Review", color: "text-amber-400", badgeVariant: "warning" },
  approved: { text: "Approved", color: "text-emerald-400", badgeVariant: "success" },
  rejected: { text: "Revision Requested", color: "text-rose-400", badgeVariant: "danger" },
};

export function DeliverableItem({
  deliverable,
  projectId,
  isClient,
  isAdmin = false,
}: DeliverableItemProps) {
  const router = useRouter();
  const [status, setStatus] = React.useState<DeliverableStatus>(deliverable.status);
  const [isUpdating, setIsUpdating] = React.useState(false);
  const [isReviewOpen, setIsReviewOpen] = React.useState(false);

  // Initial stub for modal until fetched
  const [modalDetail, setModalDetail] = React.useState<DeliverableDetailView>({
    ...deliverable,
    files: [],
    comments: [],
    assignee: deliverable.assignee
      ? {
          id: deliverable.assignee.id,
          full_name: deliverable.assignee.full_name,
          email: deliverable.assignee.email,
          avatar_url: deliverable.assignee.avatar_url,
          role: deliverable.assignee.role,
          created_at: "",
          updated_at: "",
          phone: null,
          title: null,
        }
      : null,
    reviewer: null,
  });

  // Sync prop changes
  React.useEffect(() => {
    setStatus(deliverable.status);
  }, [deliverable.status]);

  const handleOpenReviewModal = async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setIsReviewOpen(true);

    const res = await getDeliverableDetailsAction(deliverable.id, projectId);
    if (res.deliverable) {
      setModalDetail(res.deliverable);
    }
  };

  const handleStatusChange = async (newStatus: DeliverableStatus, e?: React.ChangeEvent<HTMLSelectElement>) => {
    if (e) e.stopPropagation();
    setIsUpdating(true);
    setStatus(newStatus);
    await updateDeliverableStatusAction(deliverable.id, projectId, newStatus);
    setIsUpdating(false);
    router.refresh();
  };

  const priorityCfg = PRIORITY_BADGE_MAP[deliverable.priority] || PRIORITY_BADGE_MAP.medium;
  const statusCfg = STATUS_CONFIG[status] || STATUS_CONFIG.backlog;

  return (
    <>
      <div
        onClick={() => handleOpenReviewModal()}
        className="group relative rounded-xl border border-slate-800/80 bg-slate-900/50 p-4 hover:border-slate-700/90 hover:bg-slate-900/80 transition-all space-y-3 cursor-pointer shadow-sm hover:shadow-md"
      >
        {/* Top Row: Title, Priority, Status, and Controls */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div className="space-y-1.5 flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant={priorityCfg.variant}>
                {priorityCfg.text}
              </Badge>

              <Badge variant={statusCfg.badgeVariant} dot>
                {statusCfg.text}
              </Badge>

              {deliverable.due_date && (
                <span className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
                  <Calendar className="h-3 w-3 text-slate-400" />
                  Due: {deliverable.due_date}
                </span>
              )}

              {deliverable.preview_url && (
                <a
                  href={deliverable.preview_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center gap-1 text-[11px] font-medium text-cyan-400 hover:text-cyan-300 hover:underline bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded-md transition-colors"
                >
                  <Sparkles className="h-3 w-3" />
                  <span>Preview</span>
                  <ExternalLink className="h-2.5 w-2.5" />
                </a>
              )}
            </div>

            <h4 className="text-sm font-semibold text-white group-hover:text-indigo-300 transition-colors">
              {deliverable.title}
            </h4>

            {deliverable.description && (
              <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">
                {deliverable.description}
              </p>
            )}
          </div>

          {/* Action Hub Controls */}
          <div
            className="shrink-0 flex items-center gap-2"
            onClick={(e) => e.stopPropagation()}
          >
            {/* If Client and ready for review: primary sign-off action */}
            {status === "in_review" && isClient ? (
              <Button
                size="sm"
                variant="glow"
                disabled={isUpdating}
                onClick={(e) => handleOpenReviewModal(e)}
                className="text-xs font-semibold"
              >
                <FileCheck2 className="h-3.5 w-3.5 mr-1" />
                <span>Review & Sign Off</span>
              </Button>
            ) : null}

            {/* If Admin / Team: Quick status selector */}
            {!isClient && (
              <select
                value={status}
                disabled={isUpdating}
                onChange={(e) => handleStatusChange(e.target.value as DeliverableStatus, e)}
                className="rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
              >
                <option value="backlog">Backlog</option>
                <option value="in_progress">In Progress</option>
                <option value="in_review">In Review</option>
                <option value="approved">Approved & Done</option>
                <option value="rejected">Request Changes</option>
              </select>
            )}

            {/* Quick Button to Open Review & Feedback Hub */}
            <Button
              size="sm"
              variant="outline"
              onClick={(e) => handleOpenReviewModal(e)}
              className="text-xs h-7 border-slate-800 text-slate-300 hover:text-white hover:border-slate-700"
            >
              <MessageSquare className="h-3 w-3 mr-1 text-indigo-400" />
              <span>Feedback</span>
            </Button>
          </div>
        </div>

        {/* Revision notes banner if revisions requested */}
        {status === "rejected" && deliverable.revision_notes && (
          <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-2.5 text-xs text-rose-300 flex items-start gap-2">
            <RotateCcw className="h-3.5 w-3.5 shrink-0 mt-0.5 text-rose-400" />
            <div className="min-w-0">
              <span className="font-semibold block text-[11px] text-rose-200">Revision Notes:</span>
              <p className="font-mono text-[11px] text-rose-300 leading-snug line-clamp-2">
                &ldquo;{deliverable.revision_notes}&rdquo;
              </p>
            </div>
          </div>
        )}

        {/* Acceptance Criteria */}
        {deliverable.acceptance_criteria && (
          <div className="rounded-lg border border-slate-800/80 bg-slate-950/40 p-2.5 text-[11px] text-slate-300">
            <strong className="text-slate-400 block mb-0.5 uppercase tracking-wider text-[9px]">
              Acceptance Criteria
            </strong>
            <p className="font-mono leading-relaxed line-clamp-2">{deliverable.acceptance_criteria}</p>
          </div>
        )}

        {/* Assignee & Audit Footer */}
        <div className="flex items-center justify-between border-t border-slate-800/60 pt-2.5 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            {deliverable.assignee ? (
              <>
                <Avatar
                  name={deliverable.assignee.full_name || deliverable.assignee.email}
                  size="sm"
                  className="h-5 w-5 text-[10px]"
                />
                <span className="text-slate-300 text-[11px] font-medium">
                  {deliverable.assignee.full_name || deliverable.assignee.email}
                </span>
              </>
            ) : (
              <span className="text-[11px] text-slate-400 italic flex items-center gap-1">
                <User className="h-3 w-3" /> Unassigned task
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {deliverable.submitted_at && (
              <span className="text-[10px] text-slate-400 font-mono">
                Submitted {new Date(deliverable.submitted_at).toLocaleDateString()}
              </span>
            )}

            {status === "approved" && (
              <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Signed Off
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Full Deliverable Review, Feedback, & Storage Modal */}
      {isReviewOpen && (
        <DeliverableReviewModal
          isOpen={isReviewOpen}
          onClose={() => setIsReviewOpen(false)}
          deliverable={modalDetail}
          projectId={projectId}
          isClient={isClient}
          isAdmin={isAdmin}
          onUpdated={() => router.refresh()}
        />
      )}
    </>
  );
}

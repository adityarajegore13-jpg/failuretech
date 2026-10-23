"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  FileCheck2,
  AlertCircle,
  ExternalLink,
  Download,
  Calendar,
  Clock,
  Send,
  Lock,
  UploadCloud,
  CheckCircle2,
  RotateCcw,
  Sparkles,
  Paperclip,
  RefreshCw,
} from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import {
  reviewDeliverableAction,
  submitDeliverableForReviewAction,
  addDeliverableCommentAction,
  getDeliverableSignedUrlAction,
  getDeliverableDetailsAction,
  DeliverableActionResult,
} from "@/lib/storage/actions";
import { DeliverableDetailView } from "@/lib/projects/queries";
import { DeliverableStatus, PriorityLevel } from "@/types";

interface DeliverableReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  deliverable: DeliverableDetailView;
  projectId: string;
  isClient: boolean;
  isAdmin: boolean;
  onUpdated?: () => void;
}

const STATUS_CONFIG: Record<
  DeliverableStatus,
  { label: string; badgeVariant: "purple" | "warning" | "success" | "danger" | "default" }
> = {
  backlog: { label: "Backlog", badgeVariant: "default" },
  in_progress: { label: "In Development", badgeVariant: "purple" },
  in_review: { label: "Ready for Client Review", badgeVariant: "warning" },
  approved: { label: "Approved & Completed", badgeVariant: "success" },
  rejected: { label: "Revision Requested", badgeVariant: "danger" },
};

const PRIORITY_CONFIG: Record<
  PriorityLevel,
  { label: string; badgeVariant: "danger" | "warning" | "info" | "default" }
> = {
  urgent: { label: "Urgent", badgeVariant: "danger" },
  high: { label: "High", badgeVariant: "warning" },
  medium: { label: "Medium", badgeVariant: "info" },
  low: { label: "Low", badgeVariant: "default" },
};

export function DeliverableReviewModal({
  isOpen,
  onClose,
  deliverable: initialDeliverable,
  projectId,
  isClient,
  isAdmin,
  onUpdated,
}: DeliverableReviewModalProps) {
  const router = useRouter();
  const [currentDeliverable, setCurrentDeliverable] = React.useState<DeliverableDetailView>(initialDeliverable);
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  // Keep state synchronized with prop updates
  React.useEffect(() => {
    setCurrentDeliverable(initialDeliverable);
  }, [initialDeliverable]);

  const refreshDeliverable = React.useCallback(async () => {
    setIsRefreshing(true);
    const res = await getDeliverableDetailsAction(initialDeliverable.id, projectId);
    if (res.deliverable) {
      setCurrentDeliverable(res.deliverable);
    }
    setIsRefreshing(false);
  }, [initialDeliverable.id, projectId]);

  // Refresh on modal open
  React.useEffect(() => {
    if (isOpen) {
      refreshDeliverable();
    }
  }, [isOpen, refreshDeliverable]);

  // Review Action State
  const [reviewState, reviewFormAction, isReviewPending] = React.useActionState<
    DeliverableActionResult | null,
    FormData
  >(reviewDeliverableAction, null);

  // Submit for Review Action State
  const [submitState, submitFormAction, isSubmitPending] = React.useActionState<
    DeliverableActionResult | null,
    FormData
  >(submitDeliverableForReviewAction, null);

  // Comment Action State
  const [commentState, commentFormAction, isCommentPending] = React.useActionState<
    DeliverableActionResult | null,
    FormData
  >(addDeliverableCommentAction, null);

  // Local UI States
  const [showRevisionInput, setShowRevisionInput] = React.useState(false);
  const [revisionNotes, setRevisionNotes] = React.useState("");
  const [downloadingPath, setDownloadingPath] = React.useState<string | null>(null);
  const [commentText, setCommentText] = React.useState("");
  const [isInternalOnly, setIsInternalOnly] = React.useState(false);

  // Sync state after review action
  React.useEffect(() => {
    if (reviewState?.success) {
      setShowRevisionInput(false);
      setRevisionNotes("");
      refreshDeliverable();
      router.refresh();
      onUpdated?.();
    }
  }, [reviewState, refreshDeliverable, router, onUpdated]);

  // Sync state after submission
  React.useEffect(() => {
    if (submitState?.success) {
      refreshDeliverable();
      router.refresh();
      onUpdated?.();
    }
  }, [submitState, refreshDeliverable, router, onUpdated]);

  // Sync state after comment
  React.useEffect(() => {
    if (commentState?.success) {
      setCommentText("");
      refreshDeliverable();
      router.refresh();
      onUpdated?.();
    }
  }, [commentState, refreshDeliverable, router, onUpdated]);

  // Download File via Signed URL
  const handleDownloadFile = async (filePath: string) => {
    setDownloadingPath(filePath);
    const result = await getDeliverableSignedUrlAction(filePath, projectId);
    setDownloadingPath(null);

    if (result.signedUrl) {
      window.open(result.signedUrl, "_blank");
    } else {
      alert(result.error || "Failed to download asset.");
    }
  };

  const deliverable = currentDeliverable;
  const statusCfg = STATUS_CONFIG[deliverable.status] || STATUS_CONFIG.backlog;
  const priorityCfg = PRIORITY_CONFIG[deliverable.priority] || PRIORITY_CONFIG.medium;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={deliverable.title}
      description={`Deliverable review and client sign-off hub.`}
      maxWidth="xl"
    >
      <div className="space-y-6">
        {/* Error Banners */}
        {(reviewState?.error || submitState?.error || commentState?.error) && (
          <div className="flex items-start gap-2.5 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-400" />
            <p className="leading-snug">
              {reviewState?.error || submitState?.error || commentState?.error}
            </p>
          </div>
        )}

        {/* Success Messages */}
        {(reviewState?.message || submitState?.message) && (
          <div className="flex items-start gap-2.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-300">
            <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-emerald-400" />
            <p className="leading-snug">{reviewState?.message || submitState?.message}</p>
          </div>
        )}

        {/* 1. Header Badges & Audit Meta */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <Badge variant={statusCfg.badgeVariant} dot>
                {statusCfg.label}
              </Badge>
              <Badge variant={priorityCfg.badgeVariant}>
                {priorityCfg.label}
              </Badge>
            </div>

            {deliverable.due_date && (
              <span className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
                <Calendar className="h-3 w-3 text-cyan-400" />
                Due: {deliverable.due_date}
              </span>
            )}
          </div>

          {deliverable.description && (
            <p className="text-xs text-slate-300 leading-relaxed">
              {deliverable.description}
            </p>
          )}

          {/* Audit Timestamps Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-slate-800 text-[11px] text-slate-400">
            <div>
              <span className="text-slate-400 block text-[10px]">Assignee:</span>
              <span className="text-slate-200 font-medium">
                {deliverable.assignee?.full_name || "Unassigned"}
              </span>
            </div>

            <div>
              <span className="text-slate-400 block text-[10px]">Submitted At:</span>
              <span className="text-slate-200 font-mono">
                {deliverable.submitted_at
                  ? new Date(deliverable.submitted_at).toLocaleDateString()
                  : "Not yet submitted"}
              </span>
            </div>

            <div>
              <span className="text-slate-400 block text-[10px]">Reviewed By:</span>
              <span className="text-slate-200 font-medium">
                {deliverable.reviewer?.full_name || (deliverable.reviewed_at ? "Stakeholder" : "Pending")}
              </span>
            </div>
          </div>
        </div>

        {/* 2. Revision Notes Warning (if revision requested) */}
        {deliverable.status === "rejected" && deliverable.revision_notes && (
          <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 p-4 space-y-1 text-xs">
            <div className="flex items-center gap-2 text-rose-300 font-semibold">
              <RotateCcw className="h-4 w-4 text-rose-400" />
              <span>Client Revision Requested</span>
            </div>
            <p className="text-rose-200 leading-relaxed font-mono text-[11px]">
              &ldquo;{deliverable.revision_notes}&rdquo;
            </p>
          </div>
        )}

        {/* 3. Live Preview Link */}
        {deliverable.preview_url && (
          <div className="rounded-xl border border-indigo-500/30 bg-indigo-500/10 p-3.5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-cyan-400 shrink-0" />
              <div>
                <p className="text-xs font-semibold text-white">Live Prototype & Preview</p>
                <p className="text-[11px] text-slate-300 truncate max-w-sm">
                  {deliverable.preview_url}
                </p>
              </div>
            </div>
            <a
              href={deliverable.preview_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-500/40 bg-indigo-600/30 px-3 py-1.5 text-xs font-semibold text-indigo-200 hover:bg-indigo-600/50 hover:text-white transition-all shrink-0"
            >
              <span>Open Preview</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        )}

        {/* 4. Secure File Attachments List (Supabase Storage with Signed URLs) */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-200 flex items-center gap-1.5">
              <Paperclip className="h-3.5 w-3.5 text-indigo-400" />
              <span>Attached Artifacts & Files ({deliverable.files.length})</span>
            </span>
            <span className="text-[10px] text-emerald-400 font-mono">Encrypted Private Storage</span>
          </div>

          {deliverable.files.length === 0 ? (
            <p className="text-xs text-slate-400 italic py-2">
              No binary assets or documents attached to this deliverable.
            </p>
          ) : (
            <div className="space-y-2">
              {deliverable.files.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/60 p-2.5 hover:bg-slate-900 transition-colors"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="h-7 w-7 rounded bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                      <Paperclip className="h-3.5 w-3.5" />
                    </div>
                    <div className="truncate">
                      <p className="text-xs font-medium text-slate-200 truncate">{file.file_name}</p>
                      <p className="text-[10px] text-slate-400 font-mono">
                        {(file.file_size_bytes / 1024).toFixed(1)} KB • Private
                      </p>
                    </div>
                  </div>

                  <Button
                    size="sm"
                    variant="outline"
                    disabled={downloadingPath === file.file_path}
                    onClick={() => handleDownloadFile(file.file_path)}
                    className="text-xs h-7 border-slate-700"
                  >
                    <Download className="h-3 w-3 mr-1" />
                    <span>{downloadingPath === file.file_path ? "Signing..." : "Download"}</span>
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 5. Client Review Action Controls (Approve / Request Revision) */}
        {(isClient || isAdmin) && deliverable.status === "in_review" && (
          <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4 space-y-3">
            <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
              <FileCheck2 className="h-4 w-4 text-emerald-400" />
              <span>Client Stakeholder Sign-Off Action</span>
            </h3>
            <p className="text-xs text-slate-300">
              Verify acceptance criteria against the staging preview and attached artifacts before approving.
            </p>

            {showRevisionInput ? (
              <form action={reviewFormAction} className="space-y-3 pt-2">
                <input type="hidden" name="projectId" value={projectId} />
                <input type="hidden" name="deliverableId" value={deliverable.id} />
                <input type="hidden" name="decision" value="rejected" />

                <div className="space-y-1">
                  <label className="text-xs font-medium text-rose-300">
                    Specify Required Changes & Revision Notes <span className="text-rose-400">*</span>
                  </label>
                  <textarea
                    name="feedbackNotes"
                    value={revisionNotes}
                    onChange={(e) => setRevisionNotes(e.target.value)}
                    required
                    rows={3}
                    placeholder="Describe specific visual, logic, or performance issues requiring engineering revision..."
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 p-2.5 text-xs text-white placeholder-slate-400 focus:border-rose-500 focus:outline-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => setShowRevisionInput(false)}
                    className="text-xs"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="danger"
                    size="sm"
                    disabled={isReviewPending || !revisionNotes.trim()}
                    isLoading={isReviewPending}
                    className="text-xs font-semibold"
                  >
                    <RotateCcw className="h-3.5 w-3.5 mr-1" />
                    <span>Submit Revision Request</span>
                  </Button>
                </div>
              </form>
            ) : (
              <div className="flex items-center gap-3 pt-1">
                {/* Approve Button */}
                <form action={reviewFormAction} className="inline-block">
                  <input type="hidden" name="projectId" value={projectId} />
                  <input type="hidden" name="deliverableId" value={deliverable.id} />
                  <input type="hidden" name="decision" value="approved" />
                  <Button
                    type="submit"
                    variant="glow"
                    size="sm"
                    disabled={isReviewPending}
                    isLoading={isReviewPending}
                    className="text-xs font-semibold"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 mr-1 text-emerald-400" />
                    <span>Approve & Sign Off</span>
                  </Button>
                </form>

                {/* Request Revision Button */}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowRevisionInput(true)}
                  className="text-xs border-slate-700 text-rose-300 hover:border-rose-500/50 hover:bg-rose-500/10"
                >
                  <RotateCcw className="h-3.5 w-3.5 mr-1" />
                  <span>Request Revisions</span>
                </Button>
              </div>
            )}
          </div>
        )}

        {/* 6. Agency Team Submit / Resubmit Section */}
        {isAdmin && deliverable.status !== "approved" && (
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
            <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
              <UploadCloud className="h-4 w-4 text-indigo-400" />
              <span>Submit / Update Deliverable for Client Review</span>
            </h3>

            <form action={submitFormAction} className="space-y-3">
              <input type="hidden" name="projectId" value={projectId} />
              <input type="hidden" name="deliverableId" value={deliverable.id} />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-300">Live Preview URL</label>
                  <input
                    type="url"
                    name="previewUrl"
                    defaultValue={deliverable.preview_url || ""}
                    placeholder="https://www.figma.com/file/... or staging link"
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs text-white placeholder-slate-400 focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-300">Attach Secure File (Max 50MB)</label>
                  <input
                    type="file"
                    name="file"
                    className="w-full text-xs text-slate-400 file:mr-2 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-slate-800 file:text-slate-200 hover:file:bg-slate-700 cursor-pointer"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  type="submit"
                  variant="glow"
                  size="sm"
                  disabled={isSubmitPending}
                  isLoading={isSubmitPending}
                  className="text-xs font-semibold"
                >
                  <UploadCloud className="h-3.5 w-3.5 mr-1" />
                  <span>{isSubmitPending ? "Submitting..." : "Submit for Client Review"}</span>
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* 7. Threaded Discussion & Client Feedback Timeline */}
        <div className="space-y-3 pt-2 border-t border-slate-800">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
              <span>Feedback Thread & Audit History ({deliverable.comments.length})</span>
            </h3>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={refreshDeliverable}
                disabled={isRefreshing}
                className="text-[10px] text-slate-400 hover:text-slate-200 flex items-center gap-1 transition-colors"
                title="Refresh thread"
              >
                <RefreshCw className={`h-3 w-3 ${isRefreshing ? "animate-spin text-indigo-400" : ""}`} />
                <span>{isRefreshing ? "Syncing..." : "Sync"}</span>
              </button>
              <span className="text-[10px] text-slate-500 font-mono">• Realtime</span>
            </div>
          </div>

          {/* Comments List */}
          <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
            {deliverable.comments.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-2">
                No feedback comments yet. Use the input below to leave a note or ask questions.
              </p>
            ) : (
              deliverable.comments.map((comment) => (
                <div
                  key={comment.id}
                  className={`rounded-xl border p-3 text-xs space-y-1.5 ${
                    comment.is_internal_only
                      ? "border-amber-500/30 bg-amber-500/5"
                      : "border-slate-800 bg-slate-900/60"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Avatar
                        name={comment.author.full_name || comment.author.email}
                        size="sm"
                        className="h-5 w-5 text-[10px]"
                      />
                      <span className="font-semibold text-slate-200">
                        {comment.author.full_name || "Stakeholder"}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        ({comment.author.role})
                      </span>
                      {comment.is_internal_only && (
                        <span className="rounded bg-amber-500/20 px-1.5 py-0.2 text-[9px] font-mono text-amber-300 border border-amber-500/30 flex items-center gap-0.5">
                          <Lock className="h-2.5 w-2.5" /> INTERNAL ONLY
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400">
                      {new Date(comment.created_at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>

                  <p className="text-slate-300 leading-relaxed pl-7">{comment.content}</p>
                </div>
              ))
            )}
          </div>

          {/* Add Comment Form */}
          <form action={commentFormAction} className="space-y-2 pt-2">
            <input type="hidden" name="projectId" value={projectId} />
            <input type="hidden" name="deliverableId" value={deliverable.id} />
            <input
              type="hidden"
              name="isInternalOnly"
              value={isInternalOnly ? "true" : "false"}
            />

            <div className="relative">
              <textarea
                name="content"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                required
                rows={2}
                placeholder="Leave feedback, ask clarification questions, or submit review notes..."
                className="w-full rounded-xl border border-slate-800 bg-slate-900/90 p-3 text-xs text-white placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
              />
            </div>

            <div className="flex items-center justify-between">
              {/* Internal Note Toggle (Agency staff only) */}
              {isAdmin ? (
                <label className="flex items-center gap-1.5 text-[11px] text-slate-300 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isInternalOnly}
                    onChange={(e) => setIsInternalOnly(e.target.checked)}
                    className="rounded border-slate-700 bg-slate-800 text-amber-500 focus:ring-0"
                  />
                  <span className="flex items-center gap-1 text-amber-300">
                    <Lock className="h-3 w-3" />
                    Internal Agency Note (Hidden from client)
                  </span>
                </label>
              ) : (
                <span className="text-[10px] text-slate-400">
                  Visible to authorized project stakeholders
                </span>
              )}

              <Button
                type="submit"
                variant="glow"
                size="sm"
                disabled={isCommentPending || !commentText.trim()}
                isLoading={isCommentPending}
                className="text-xs"
              >
                <Send className="h-3 w-3 mr-1" />
                <span>Post Feedback</span>
              </Button>
            </div>
          </form>
        </div>
      </div>
    </Modal>
  );
}

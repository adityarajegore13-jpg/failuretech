"use client";

import * as React from "react";
import {
  UploadCloud,
  File,
  X,
  AlertCircle,
  CheckCircle2,
  Lock,
  Eye,
  FileText,
  Sparkles,
} from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { uploadVaultFileAction, VaultActionResult } from "@/lib/vault/actions";
import { Deliverable } from "@/types";

interface UploadFileModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  isClient: boolean;
  deliverables?: Pick<Deliverable, "id" | "title">[];
  onUploaded?: () => void;
}

const CATEGORIES = [
  { value: "general", label: "General Project Asset" },
  { value: "documents", label: "Documentation & Briefs" },
  { value: "design", label: "UI/UX & Design Assets" },
  { value: "deliverables", label: "Deliverable Artifacts" },
  { value: "contracts", label: "Contracts & SOWs" },
  { value: "assets", label: "Brand Kits & Media" },
];

export function UploadFileModal({
  isOpen,
  onClose,
  projectId,
  isClient,
  deliverables = [],
  onUploaded,
}: UploadFileModalProps) {
  const [file, setFile] = React.useState<File | null>(null);
  const [category, setCategory] = React.useState("general");
  const [description, setDescription] = React.useState("");
  const [isPublicToClient, setIsPublicToClient] = React.useState(true);
  const [selectedDeliverableId, setSelectedDeliverableId] = React.useState("");
  const [dragActive, setDragActive] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  const [state, formAction, isPending] = React.useActionState<
    VaultActionResult | null,
    FormData
  >(uploadVaultFileAction, null);

  React.useEffect(() => {
    if (state?.success) {
      setFile(null);
      setDescription("");
      setErrorMsg(null);
      onUploaded?.();
      onClose();
    }
  }, [state, onUploaded, onClose]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleSelectFile(e.dataTransfer.files[0]);
    }
  };

  const handleSelectFile = (selected: File) => {
    if (selected.size > 52428800) {
      setErrorMsg("File size exceeds 50MB security maximum.");
      setFile(null);
      return;
    }
    setErrorMsg(null);
    setFile(selected);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Upload Asset to Secure Vault"
      description="All files are encrypted in private storage with project-level access controls."
      maxWidth="md"
    >
      <form action={formAction} className="space-y-4">
        <input type="hidden" name="projectId" value={projectId} />
        <input
          type="hidden"
          name="isPublicToClient"
          value={isClient ? "true" : isPublicToClient ? "true" : "false"}
        />

        {/* Error Banner */}
        {(state?.error || errorMsg) && (
          <div className="flex items-start gap-2.5 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-400" />
            <p className="leading-snug">{state?.error || errorMsg}</p>
          </div>
        )}

        {/* Drag & Drop File Upload Area */}
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 transition-all text-center ${
            dragActive
              ? "border-cyan-400 bg-cyan-500/10"
              : "border-slate-800 bg-slate-950/60 hover:border-slate-700 hover:bg-slate-900/60"
          }`}
        >
          {file ? (
            <div className="flex items-center gap-3 w-full justify-between bg-slate-900/80 p-3 rounded-xl border border-slate-800">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                  <File className="h-4 w-4" />
                </div>
                <div className="truncate text-left">
                  <p className="text-xs font-semibold text-white truncate">{file.name}</p>
                  <p className="text-[10px] text-slate-400 font-mono">
                    {(file.size / (1024 * 1024)).toFixed(2)} MB • {file.type || "Document"}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setFile(null)}
                className="rounded-lg p-1 text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 mb-3">
                <UploadCloud className="h-6 w-6" />
              </div>
              <p className="text-xs font-semibold text-white">
                Drag and drop your file here, or{" "}
                <label className="text-cyan-400 hover:underline cursor-pointer">
                  browse
                  <input
                    type="file"
                    name="file"
                    required
                    onChange={(e) => {
                      if (e.target.files?.[0]) handleSelectFile(e.target.files[0]);
                    }}
                    className="sr-only"
                  />
                </label>
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                Max file size: 50MB • PDF, Images, Office Docs, Video, Archives
              </p>
            </>
          )}

          {/* Hidden input if file is chosen via drag-and-drop */}
          {file && (
            <input
              type="file"
              name="file"
              className="sr-only"
              ref={(ref) => {
                if (ref && file) {
                  const dataTransfer = new DataTransfer();
                  dataTransfer.items.add(file);
                  ref.files = dataTransfer.files;
                }
              }}
            />
          )}
        </div>

        {/* Category & Deliverable Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-300">Vault Category</label>
            <select
              name="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-300">Associated Deliverable</label>
            <select
              name="deliverableId"
              value={selectedDeliverableId}
              onChange={(e) => setSelectedDeliverableId(e.target.value)}
              className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
            >
              <option value="">General Project (None)</option>
              {deliverables.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Description textarea */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-300">Description & Usage Notes</label>
          <textarea
            name="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            placeholder="Brief description of this asset or specifications..."
            className="w-full rounded-lg border border-slate-800 bg-slate-950 p-2.5 text-xs text-white placeholder-slate-400 focus:border-indigo-500 focus:outline-none"
          />
        </div>

        {/* Client Visibility Toggle (Agency staff only) */}
        {!isClient && (
          <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/60 p-3">
            <div className="space-y-0.5">
              <span className="text-xs font-medium text-white flex items-center gap-1.5">
                {isPublicToClient ? (
                  <>
                    <Eye className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Client Stakeholder Access</span>
                  </>
                ) : (
                  <>
                    <Lock className="h-3.5 w-3.5 text-amber-400" />
                    <span>Internal Agency Confidential</span>
                  </>
                )}
              </span>
              <p className="text-[10px] text-slate-400">
                {isPublicToClient
                  ? "Authorized client members of this project can view and download this file."
                  : "Hidden from client stakeholders. Visible only to agency administrators and staff."}
              </p>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isPublicToClient}
                onChange={(e) => setIsPublicToClient(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
          <Button type="button" variant="secondary" size="sm" onClick={onClose} className="text-xs">
            Cancel
          </Button>
          <Button
            type="submit"
            variant="glow"
            size="sm"
            disabled={isPending || !file}
            isLoading={isPending}
            className="text-xs font-semibold"
          >
            <UploadCloud className="h-3.5 w-3.5 mr-1" />
            <span>{isPending ? "Encrypting & Uploading..." : "Vault Asset"}</span>
          </Button>
        </div>
      </form>
    </Modal>
  );
}

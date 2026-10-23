"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  FolderLock,
  UploadCloud,
  Search,
  Download,
  Trash2,
  Lock,
  Eye,
  FileText,
  FileImage,
  FileArchive,
  FileCode,
  FileVideo,
  File,
  ShieldCheck,
  RefreshCw,
  Sparkles,
  Inbox,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { UploadFileModal } from "@/components/vault/upload-file-modal";
import {
  getVaultFileSignedUrlAction,
  deleteVaultFileAction,
  getProjectFilesAction,
} from "@/lib/vault/actions";
import { ProjectFileWithUploader, Deliverable } from "@/types";

interface ProjectFileVaultProps {
  projectId: string;
  initialFiles: ProjectFileWithUploader[];
  isClient: boolean;
  isAdmin: boolean;
  currentUserId?: string;
  deliverables?: Pick<Deliverable, "id" | "title">[];
}

const CATEGORY_TABS = [
  { value: "all", label: "All Files" },
  { value: "general", label: "General" },
  { value: "documents", label: "Documents" },
  { value: "design", label: "Design & UI" },
  { value: "deliverables", label: "Deliverables" },
  { value: "contracts", label: "Contracts & SOWs" },
  { value: "assets", label: "Brand Assets" },
];

function getFileIcon(fileName: string, mimeType: string | null) {
  const ext = fileName.split(".").pop()?.toLowerCase();

  if (["png", "jpg", "jpeg", "webp", "svg", "gif"].includes(ext || "") || mimeType?.startsWith("image/")) {
    return <FileImage className="h-4 w-4 text-cyan-400" />;
  }
  if (["pdf", "doc", "docx", "txt", "rtf"].includes(ext || "") || mimeType?.includes("pdf")) {
    return <FileText className="h-4 w-4 text-indigo-400" />;
  }
  if (["zip", "tar", "gz", "rar", "7z"].includes(ext || "") || mimeType?.includes("zip")) {
    return <FileArchive className="h-4 w-4 text-amber-400" />;
  }
  if (["ts", "tsx", "js", "json", "html", "css"].includes(ext || "")) {
    return <FileCode className="h-4 w-4 text-emerald-400" />;
  }
  if (["mp4", "mov", "webm"].includes(ext || "") || mimeType?.startsWith("video/")) {
    return <FileVideo className="h-4 w-4 text-purple-400" />;
  }
  return <File className="h-4 w-4 text-slate-400" />;
}

export function ProjectFileVault({
  projectId,
  initialFiles,
  isClient,
  isAdmin,
  currentUserId,
  deliverables = [],
}: ProjectFileVaultProps) {
  const router = useRouter();
  const [files, setFiles] = React.useState<ProjectFileWithUploader[]>(initialFiles);
  const [search, setSearch] = React.useState("");
  const [activeCategory, setActiveCategory] = React.useState("all");
  const [isUploadOpen, setIsUploadOpen] = React.useState(false);
  const [downloadingId, setDownloadingId] = React.useState<string | null>(null);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [alertMsg, setAlertMsg] = React.useState<{ type: "error" | "success"; text: string } | null>(null);

  // Sync prop updates
  React.useEffect(() => {
    setFiles(initialFiles);
  }, [initialFiles]);

  // Refresh files from server
  const handleRefresh = async () => {
    setIsRefreshing(true);
    const res = await getProjectFilesAction(projectId);
    if (res.files) {
      setFiles(res.files);
    }
    setIsRefreshing(false);
  };

  // Download File via Signed URL
  const handleDownload = async (file: ProjectFileWithUploader) => {
    setDownloadingId(file.id);
    setAlertMsg(null);
    const result = await getVaultFileSignedUrlAction(file.id, projectId);
    setDownloadingId(null);

    if (result.signedUrl) {
      window.open(result.signedUrl, "_blank");
    } else {
      setAlertMsg({ type: "error", text: result.error || "Failed to download asset." });
    }
  };

  // Delete File
  const handleDelete = async (file: ProjectFileWithUploader) => {
    if (!confirm(`Are you sure you want to permanently delete "${file.file_name}"?`)) {
      return;
    }

    setDeletingId(file.id);
    setAlertMsg(null);
    const result = await deleteVaultFileAction(file.id, projectId);
    setDeletingId(null);

    if (result.success) {
      setFiles((prev) => prev.filter((f) => f.id !== file.id));
      setAlertMsg({ type: "success", text: `"${file.file_name}" removed from vault.` });
      router.refresh();
    } else {
      setAlertMsg({ type: "error", text: result.error || "Failed to delete file." });
    }
  };

  // Total storage footprint
  const totalBytes = files.reduce((sum, f) => sum + (f.file_size_bytes || 0), 0);
  const totalMB = (totalBytes / (1024 * 1024)).toFixed(1);

  // Filtered files
  const filteredFiles = files.filter((f) => {
    const matchesCategory = activeCategory === "all" || f.category === activeCategory;
    const matchesSearch =
      search === "" ||
      f.file_name.toLowerCase().includes(search.toLowerCase()) ||
      (f.description && f.description.toLowerCase().includes(search.toLowerCase()));

    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* 1. Vault Header Banner & Security Specs */}
      <div className="relative overflow-hidden rounded-2xl border border-indigo-500/20 bg-gradient-to-r from-indigo-950/40 via-slate-900/60 to-slate-950 p-6 backdrop-blur-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-300">
                <FolderLock className="h-4 w-4" />
              </span>
              <h2 className="text-base font-bold text-white tracking-wide">
                Secure Project File Vault
              </h2>
              <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-mono font-medium text-emerald-400 flex items-center gap-1">
                <ShieldCheck className="h-3 w-3" />
                RLS Protected
              </span>
            </div>

            <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
              Cryptographically signed asset storage. Client stakeholders only access client-authorized deliverables, preventing cross-organization data leaks.
            </p>
          </div>

          {/* Upload Button */}
          <div className="flex items-center gap-2 shrink-0">
            <Button
              size="sm"
              variant="outline"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="text-xs border-slate-700"
              title="Sync file catalog"
            >
              <RefreshCw className={`h-3 w-3 mr-1 ${isRefreshing ? "animate-spin text-indigo-400" : ""}`} />
              <span>{isRefreshing ? "Syncing..." : "Sync"}</span>
            </Button>

            <Button
              size="sm"
              variant="glow"
              onClick={() => setIsUploadOpen(true)}
              className="text-xs font-semibold"
            >
              <UploadCloud className="h-3.5 w-3.5 mr-1" />
              <span>Upload to Vault</span>
            </Button>
          </div>
        </div>

        {/* Stats Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 mt-4 border-t border-slate-800/80 text-xs">
          <div>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-mono">
              Vaulted Files
            </span>
            <span className="text-sm font-bold text-white font-mono">{files.length} Assets</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-mono">
              Vault Footprint
            </span>
            <span className="text-sm font-bold text-cyan-300 font-mono">{totalMB} MB</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-mono">
              Security Standard
            </span>
            <span className="text-sm font-bold text-emerald-400 font-mono">AES-256 GCM</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-mono">
              Signed URL TTL
            </span>
            <span className="text-sm font-bold text-indigo-300 font-mono">60 Minutes</span>
          </div>
        </div>
      </div>

      {/* Alert Notices */}
      {alertMsg && (
        <div
          className={`flex items-start gap-2.5 rounded-xl border p-3 text-xs ${
            alertMsg.type === "error"
              ? "border-rose-500/30 bg-rose-500/10 text-rose-300"
              : "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
          }`}
        >
          {alertMsg.type === "error" ? (
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-400" />
          ) : (
            <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-emerald-400" />
          )}
          <p className="leading-snug">{alertMsg.text}</p>
        </div>
      )}

      {/* 2. Search & Category Filters Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {CATEGORY_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveCategory(tab.value)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                activeCategory === tab.value
                  ? "bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 font-semibold"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/60"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search vault assets..."
            className="w-full rounded-lg border border-slate-800 bg-slate-900/80 pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-400 focus:border-indigo-500 focus:outline-none"
          />
        </div>
      </div>

      {/* 3. Files Grid / List */}
      {filteredFiles.length === 0 ? (
        <div className="rounded-2xl border border-slate-800/80 bg-slate-900/30 p-12 text-center space-y-3">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 border border-slate-800 text-slate-500">
            <Inbox className="h-6 w-6" />
          </div>
          <p className="text-sm font-semibold text-white">No files found</p>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {search
              ? "No assets matched your search query. Try clearing the filter."
              : "Upload design specs, contract documents, or sprint deliverables to this secure project vault."}
          </p>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsUploadOpen(true)}
            className="text-xs border-slate-700 mt-2"
          >
            <UploadCloud className="h-3.5 w-3.5 mr-1" />
            <span>Upload First Asset</span>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredFiles.map((file) => {
            const canDelete = isAdmin || file.uploaded_by === currentUserId;
            const isDownloading = downloadingId === file.id;
            const isDeleting = deletingId === file.id;

            return (
              <Card
                key={file.id}
                className="glass-panel border-slate-800/80 p-4 space-y-3 hover:border-slate-700/80 transition-all group flex flex-col justify-between"
              >
                <div className="space-y-2">
                  {/* Top row: Icon, Category pill, Visibility pill */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-950 border border-slate-800">
                        {getFileIcon(file.file_name, file.mime_type)}
                      </div>
                      <span className="rounded bg-slate-800/80 px-2 py-0.5 text-[10px] font-mono text-slate-300 uppercase">
                        {file.category}
                      </span>
                    </div>

                    {file.is_public_to_client ? (
                      <span className="inline-flex items-center gap-1 rounded bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-400 border border-emerald-500/20">
                        <Eye className="h-2.5 w-2.5" />
                        Client
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-300 border border-amber-500/20">
                        <Lock className="h-2.5 w-2.5" />
                        Internal
                      </span>
                    )}
                  </div>

                  {/* Title & Description */}
                  <div>
                    <h4
                      className="text-xs font-semibold text-white group-hover:text-cyan-300 transition-colors truncate"
                      title={file.file_name}
                    >
                      {file.file_name}
                    </h4>
                    {file.description && (
                      <p className="text-[11px] text-slate-400 line-clamp-2 mt-0.5 leading-snug">
                        {file.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Footer Metadata & Actions */}
                <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <Avatar
                      name={file.uploader?.full_name || file.uploader?.email || "User"}
                      size="sm"
                      className="h-5 w-5 text-[9px]"
                    />
                    <div className="truncate">
                      <span className="text-[10px] text-slate-300 block truncate font-medium">
                        {file.uploader?.full_name || "Staff"}
                      </span>
                      <span className="text-[9px] text-slate-500 block font-mono">
                        {(file.file_size_bytes / 1024).toFixed(1)} KB • {new Date(file.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {/* Download Button */}
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={isDownloading}
                      onClick={() => handleDownload(file)}
                      className="text-xs h-7 px-2 border-slate-700 text-slate-200 hover:text-white"
                      title="Generate signed download link"
                    >
                      <Download className={`h-3 w-3 ${isDownloading ? "animate-bounce" : ""}`} />
                      <span className="ml-1 hidden sm:inline">
                        {isDownloading ? "Signing..." : "Download"}
                      </span>
                    </Button>

                    {/* Delete Button */}
                    {canDelete && (
                      <button
                        type="button"
                        disabled={isDeleting}
                        onClick={() => handleDelete(file)}
                        className="rounded-lg p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors disabled:opacity-50"
                        title="Delete asset"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Upload File Modal */}
      {isUploadOpen && (
        <UploadFileModal
          isOpen={isUploadOpen}
          onClose={() => setIsUploadOpen(false)}
          projectId={projectId}
          isClient={isClient}
          deliverables={deliverables}
          onUploaded={handleRefresh}
        />
      )}
    </div>
  );
}

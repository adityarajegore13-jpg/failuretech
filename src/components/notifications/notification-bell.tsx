"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bell,
  CheckCircle2,
  FileCheck2,
  MessageSquare,
  Sparkles,
  Receipt,
  DollarSign,
  AlertCircle,
  Check,
  ChevronRight,
  ExternalLink,
  Inbox,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  getNotificationsAction,
  markNotificationAsReadAction,
  markAllNotificationsAsReadAction,
} from "@/lib/notifications/actions";
import { Notification, NotificationType, Profile } from "@/types";

interface NotificationBellProps {
  currentUser: Profile | null;
}

const TYPE_CONFIG: Record<
  NotificationType,
  { icon: typeof Bell; color: string; bg: string; border: string }
> = {
  deliverable_ready: {
    icon: FileCheck2,
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
  },
  milestone_completed: {
    icon: CheckCircle2,
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
  },
  new_comment: {
    icon: MessageSquare,
    color: "text-cyan-400",
    bg: "bg-cyan-500/10",
    border: "border-cyan-500/20",
  },
  project_update: {
    icon: Sparkles,
    color: "text-indigo-400",
    bg: "bg-indigo-500/10",
    border: "border-indigo-500/20",
  },
  invoice_issued: {
    icon: Receipt,
    color: "text-purple-400",
    bg: "bg-purple-500/10",
    border: "border-purple-500/20",
  },
  payment_received: {
    icon: DollarSign,
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
  },
  system_alert: {
    icon: AlertCircle,
    color: "text-rose-400",
    bg: "bg-rose-500/10",
    border: "border-rose-500/20",
  },
};

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return "Just now";
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays}d ago`;
  return date.toLocaleDateString();
}

export function NotificationBell({ currentUser }: NotificationBellProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = React.useState(false);
  const [filter, setFilter] = React.useState<"all" | "unread">("all");
  const [notifications, setNotifications] = React.useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = React.useState(0);
  const [isMarkingAll, setIsMarkingAll] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  // 1. Initial Load of Notifications
  const loadNotifications = React.useCallback(async () => {
    if (!currentUser) return;
    const res = await getNotificationsAction();
    if (res.notifications) {
      setNotifications(res.notifications);
      setUnreadCount(res.unreadCount);
    }
  }, [currentUser]);

  React.useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  // 2. Supabase Realtime Subscription: listens to Postgres changes on 'notifications'
  React.useEffect(() => {
    if (!currentUser) return;

    const supabase = createClient();
    const channel = supabase
      .channel(`realtime-notifications-${currentUser.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${currentUser.id}`,
        },
        (payload) => {
          const newNotification = payload.new as Notification;
          setNotifications((prev) => [newNotification, ...prev]);
          setUnreadCount((prev) => prev + 1);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${currentUser.id}`,
        },
        (payload) => {
          const updated = payload.new as Notification;
          setNotifications((prev) =>
            prev.map((n) => (n.id === updated.id ? updated : n))
          );
          setUnreadCount((prev) => {
            if (updated.is_read) {
              return Math.max(0, prev - 1);
            }
            return prev;
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser]);

  // Close dropdown on outside click
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Click single notification
  const handleNotificationClick = async (notif: Notification) => {
    if (!notif.is_read) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
      await markNotificationAsReadAction(notif.id);
    }

    setIsOpen(false);
    if (notif.link) {
      router.push(notif.link);
    }
  };

  // Mark all as read
  const handleMarkAllAsRead = async () => {
    setIsMarkingAll(true);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);
    await markAllNotificationsAsReadAction();
    setIsMarkingAll(false);
  };

  const filteredNotifications = notifications.filter((n) => {
    if (filter === "unread") return !n.is_read;
    return true;
  });

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-slate-800/80 bg-slate-900/80 text-slate-400 hover:text-white hover:border-slate-700 transition-colors"
        aria-label="View notifications"
      >
        <Bell className="h-4 w-4" />

        {/* Realtime Unread Ping Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-cyan-500 px-1 text-[10px] font-bold text-slate-950 shadow-md shadow-cyan-500/50">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Modal Container */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border border-slate-800 bg-[#090d16]/95 shadow-2xl backdrop-blur-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-800/80 px-4 py-3 bg-slate-900/50">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white tracking-wide">
                Notifications Hub
              </span>
              {unreadCount > 0 && (
                <span className="rounded-full bg-cyan-500/10 border border-cyan-500/30 px-2 py-0.5 text-[10px] font-semibold text-cyan-300 font-mono">
                  {unreadCount} unread
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllAsRead}
                disabled={isMarkingAll}
                className="text-[11px] font-medium text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1 disabled:opacity-50"
              >
                <Check className="h-3 w-3" />
                <span>Mark all read</span>
              </button>
            )}
          </div>

          {/* Filter Tabs */}
          <div className="flex border-b border-slate-800/60 bg-slate-950/40 px-3 py-1.5 text-xs">
            <button
              onClick={() => setFilter("all")}
              className={`rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors ${
                filter === "all"
                  ? "bg-slate-800 text-white font-semibold shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              All ({notifications.length})
            </button>
            <button
              onClick={() => setFilter("unread")}
              className={`rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors ${
                filter === "unread"
                  ? "bg-slate-800 text-cyan-300 font-semibold shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Unread ({unreadCount})
            </button>
          </div>

          {/* Notification Items List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-800/60">
            {filteredNotifications.length === 0 ? (
              <div className="py-10 text-center space-y-2">
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 border border-slate-800 text-slate-500">
                  <Inbox className="h-5 w-5" />
                </div>
                <p className="text-xs font-semibold text-slate-300">
                  {filter === "unread" ? "No unread alerts" : "No notifications yet"}
                </p>
                <p className="text-[11px] text-slate-400 max-w-xs mx-auto px-4">
                  Milestone completions, deliverable sign-offs, and client feedback will appear here in real time.
                </p>
              </div>
            ) : (
              filteredNotifications.map((notif) => {
                const cfg = TYPE_CONFIG[notif.type] || TYPE_CONFIG.project_update;
                const Icon = cfg.icon;

                return (
                  <div
                    key={notif.id}
                    onClick={() => handleNotificationClick(notif)}
                    className={`group flex items-start gap-3 p-3.5 transition-colors cursor-pointer ${
                      notif.is_read
                        ? "bg-slate-950/30 hover:bg-slate-900/60 text-slate-400"
                        : "bg-indigo-950/20 hover:bg-indigo-950/40 text-slate-200"
                    }`}
                  >
                    {/* Icon */}
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${cfg.bg} ${cfg.border} ${cfg.color} mt-0.5 group-hover:scale-105 transition-transform`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 space-y-0.5">
                      <div className="flex items-center justify-between gap-1">
                        <p
                          className={`text-xs font-semibold truncate ${
                            notif.is_read ? "text-slate-300" : "text-white group-hover:text-cyan-300"
                          }`}
                        >
                          {notif.title}
                        </p>
                        <span className="text-[10px] text-slate-400 shrink-0 font-mono">
                          {formatRelativeTime(notif.created_at)}
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                        {notif.message}
                      </p>
                    </div>

                    {/* Unread indicator bullet */}
                    {!notif.is_read && (
                      <span className="h-2 w-2 shrink-0 rounded-full bg-cyan-400 mt-2 ring-2 ring-cyan-400/20" />
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-slate-800/80 bg-slate-900/40 p-2 text-center">
            <span className="text-[10px] text-slate-400 font-mono">
              Live Supabase Realtime • End-to-End Encrypted
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

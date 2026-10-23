"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/auth/server";
import { Notification, NotificationType } from "@/types";

export interface NotificationsResult {
  notifications: Notification[];
  unreadCount: number;
  error?: string;
}

/**
 * Server Action: Fetches real notifications for the authenticated user with unread counter.
 * Supabase Row Level Security ensures users can strictly only view their own notifications.
 */
export async function getNotificationsAction(): Promise<NotificationsResult> {
  const user = await getAuthUser();
  if (!user) {
    return { notifications: [], unreadCount: 0 };
  }

  const supabase = await createClient();

  // 1. Fetch latest 30 notifications
  const { data: notifications, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(30);

  if (error) {
    return { notifications: [], unreadCount: 0, error: error.message };
  }

  // 2. Fetch accurate unread count
  const { count: unreadCount, error: countError } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("is_read", false);

  if (countError) {
    return {
      notifications: notifications || [],
      unreadCount: (notifications || []).filter((n) => !n.is_read).length,
    };
  }

  return {
    notifications: notifications || [],
    unreadCount: unreadCount || 0,
  };
}

/**
 * Server Action: Marks a specific notification as read.
 */
export async function markNotificationAsReadAction(
  notificationId: string
): Promise<{ success: boolean; error?: string }> {
  const user = await getAuthUser();
  if (!user) {
    return { success: false, error: "Authentication required." };
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("id", notificationId)
    .eq("user_id", user.id);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Server Action: Marks all notifications as read for current user.
 */
export async function markAllNotificationsAsReadAction(): Promise<{
  success: boolean;
  error?: string;
}> {
  const user = await getAuthUser();
  if (!user) {
    return { success: false, error: "Authentication required." };
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("user_id", user.id)
    .eq("is_read", false);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/dashboard");
  return { success: true };
}

/**
 * Server Action: Dismisses or deletes a notification record.
 */
export async function deleteNotificationAction(
  notificationId: string
): Promise<{ success: boolean; error?: string }> {
  const user = await getAuthUser();
  if (!user) {
    return { success: false, error: "Authentication required." };
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("notifications")
    .delete()
    .eq("id", notificationId)
    .eq("user_id", user.id);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

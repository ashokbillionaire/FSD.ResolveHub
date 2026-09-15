"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { getSupabaseBrowserClient } from "@/lib/supabase/client";

/**
 * Subscribes to Supabase Realtime and re-renders the current Server Component
 * tree when something relevant changes.
 *
 * How it stays safe and correct:
 *  - The subscription uses the user's own session, so Row Level Security
 *    decides which rows are delivered. A user only ever receives events for
 *    their own complaints and notifications.
 *  - Instead of patching state locally, it calls `router.refresh()`. The server
 *    re-runs every query, so the numbers, badges and timeline can never drift
 *    out of sync with the database.
 */
export function RealtimeRefresher({ userId }: { userId: string }) {
  const router = useRouter();

  React.useEffect(() => {
    let client;

    try {
      client = getSupabaseBrowserClient();
    } catch {
      // Supabase is not configured — realtime is simply unavailable.
      return;
    }

    // Guard against a burst of events causing a burst of refreshes.
    let timeout: ReturnType<typeof setTimeout> | undefined;
    function scheduleRefresh() {
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(() => router.refresh(), 350);
    }

    const channel = client
      .channel(`resolvehub-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        scheduleRefresh,
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "complaints",
        },
        scheduleRefresh,
      )
      .subscribe();

    return () => {
      if (timeout) clearTimeout(timeout);
      void client.removeChannel(channel);
    };
  }, [router, userId]);

  return null;
}

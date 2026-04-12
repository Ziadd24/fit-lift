"use client";

import { useEffect, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

/**
 * Subscribes to Supabase Realtime on the calorie_logs table.
 * When any INSERT or UPDATE happens, it invalidates the calorie_logs
 * React Query cache, triggering an immediate refetch on all subscribers.
 *
 * Usage:
 *   useNutritionRealtime();                     // invalidates all calorie_logs
 *   useNutritionRealtime({ memberId: 5 });      // filtered (still invalidates all; filter is for future use)
 */
export function useNutritionRealtime(options?: { memberId?: number; coachId?: number }) {
  const queryClient = useQueryClient();

  const handleChange = useCallback(() => {
    // Invalidate all calorie_logs queries so both coach and client get fresh data
    queryClient.invalidateQueries({ queryKey: ["calorie_logs"] });
  }, [queryClient]);

  useEffect(() => {
    const channelName = options?.memberId
      ? `nutrition-member-${options.memberId}`
      : options?.coachId
      ? `nutrition-coach-${options.coachId}`
      : "nutrition-global";

    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes" as any,
        {
          event: "INSERT",
          schema: "public",
          table: "calorie_logs",
          ...(options?.memberId ? { filter: `member_id=eq.${options.memberId}` } : {}),
        },
        handleChange
      )
      .on(
        "postgres_changes" as any,
        {
          event: "UPDATE",
          schema: "public",
          table: "calorie_logs",
          ...(options?.memberId ? { filter: `member_id=eq.${options.memberId}` } : {}),
        },
        handleChange
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [options?.memberId, options?.coachId, handleChange]);
}

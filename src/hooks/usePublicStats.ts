import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface PublicStats {
  totalUsers: number;
  totalTransactions: number;
}

export function usePublicStats() {
  const [stats, setStats] = useState<PublicStats | null>(null);

  useEffect(() => {
    supabase.rpc("get_public_stats").then(({ data }) => {
      if (data) {
        setStats({
          totalUsers: data.total_users ?? 0,
          totalTransactions: data.total_transactions ?? 0,
        });
      }
    });
  }, []);

  return stats;
}

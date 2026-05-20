import { useQuery } from "@tanstack/react-query";

const API = import.meta.env.VITE_API_URL ?? "";

export function useCompanionReasonsBatch(
  hostId: string | null,
  companionIds: string[],
  enabled: boolean,
) {
  const key = companionIds.join("|");
  return useQuery({
    queryKey: ["companion-reasons-batch", hostId, key],
    enabled: enabled && Boolean(hostId) && companionIds.length > 0,
    staleTime: Infinity,
    queryFn: async (): Promise<Record<string, string>> => {
      const res = await fetch(`${API}/api/companion-reasons/batch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          host_id: hostId,
          companion_ids: companionIds,
        }),
      });
      if (!res.ok) {
        throw new Error("Could not load companion advice");
      }
      const json = (await res.json()) as { reasons?: Record<string, string> };
      return json.reasons ?? {};
    },
  });
}

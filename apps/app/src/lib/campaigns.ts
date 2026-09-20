import type {
  CampaignWithListings,
  CreateCampaignInput,
  CreateListingInput,
  Listing,
  PresignLogoResponse,
  UpdateCampaignInput,
  UpdateListingInput,
  VerifyCampaignResponse,
} from "@repo/contracts/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "./api";

/**
 * A campaign is one destination site, and the listings under it are its
 * creatives. The API owns both, so nothing here derives a campaign from a
 * domain and nothing here keeps one in the browser.
 */
export const campaignsKey = ["campaigns"] as const;

export function useCampaigns() {
  return useQuery({
    queryKey: campaignsKey,
    queryFn: () => apiFetch<CampaignWithListings[]>("/campaigns"),
  });
}

function useInvalidate() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: campaignsKey });
}

export function useCreateCampaign() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (input: CreateCampaignInput) =>
      apiFetch<CampaignWithListings>("/campaigns", { method: "POST", body: input }),
    onSuccess: invalidate,
  });
}

export function useUpdateCampaign() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateCampaignInput }) =>
      apiFetch<CampaignWithListings>(`/campaigns/${id}`, { method: "PATCH", body: input }),
    onSuccess: invalidate,
  });
}

export function useArchiveCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetch<{ id: string }>(`/campaigns/${id}`, { method: "DELETE" }),
    onSuccess: (_data, id) => {
      // The row goes before the refetch, not after it. A stale section here
      // would read as a campaign that is still running.
      qc.setQueryData<CampaignWithListings[]>(campaignsKey, (old) =>
        old?.filter((row) => row.campaign.id !== id),
      );
      qc.invalidateQueries({ queryKey: campaignsKey });
    },
  });
}

export function useVerifyCampaign() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<VerifyCampaignResponse>(`/campaigns/${id}/verify`, { method: "POST" }),
    onSuccess: invalidate,
  });
}

// ── Listings ─────────────────────────────────────────────────────────────────
// A listing only ever appears inside its campaign, so every write here
// invalidates the campaign list rather than a list of its own.

export function useCreateListing() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (input: CreateListingInput) =>
      apiFetch<Listing>("/listings", { method: "POST", body: input }),
    onSuccess: invalidate,
  });
}

export function useUpdateListing() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateListingInput }) =>
      apiFetch<Listing>(`/listings/${id}`, { method: "PATCH", body: input }),
    onSuccess: invalidate,
  });
}

/** Presign + PUT. Returns the public URL to store on the listing. */
export async function uploadLogo(file: File): Promise<string> {
  const { uploadUrl, publicUrl } = await apiFetch<PresignLogoResponse>("/uploads/logo/presign", {
    method: "POST",
    body: { contentType: file.type, size: file.size },
  });
  const res = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": file.type },
    body: file,
  });
  if (!res.ok) throw new Error("Failed to upload logo");
  return publicUrl;
}

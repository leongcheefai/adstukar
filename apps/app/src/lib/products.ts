import type {
  CreateProductInput,
  PresignLogoResponse,
  Product,
  UpdateProductInput,
  VerifyProductResponse,
} from "@repo/contracts/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "./api";
import { designMode } from "./design-mode";
import { env } from "./env";

export const productsKey = ["products"] as const;

export function useProducts() {
  return useQuery({ queryKey: productsKey, queryFn: () => apiFetch<Product[]>("/products") });
}

export function useCreateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateProductInput) =>
      apiFetch<Product>("/products", { method: "POST", body: input }),
    onSuccess: () => qc.invalidateQueries({ queryKey: productsKey }),
  });
}

export function useUpdateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateProductInput }) =>
      apiFetch<Product>(`/products/${id}`, { method: "PATCH", body: input }),
    onSuccess: () => qc.invalidateQueries({ queryKey: productsKey }),
  });
}

export function useDeleteProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetch<{ id: string }>(`/products/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: productsKey });
      qc.invalidateQueries({ queryKey: ["placements"] });
    },
  });
}

export function useVerifyProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<VerifyProductResponse>(`/products/${id}/verify`, { method: "POST" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: productsKey }),
  });
}

/** Presign + PUT. Returns the public URL to store on the product. */
export async function uploadLogo(file: File): Promise<string> {
  // Design mode has no bucket to PUT to, so the picked file is shown from memory.
  if (designMode) return URL.createObjectURL(file);
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

/**
 * What the API returns when it reads a product page's metadata.
 *
 * TODO: this shape belongs in `packages/contracts` next to the route that serves
 * it. It lives here only because `POST /products/metadata` is not built yet, and
 * this branch is UI-only. Move it the moment the route lands.
 */
export interface ProductMetadata {
  name: string | null;
  tagline: string | null;
  logoUrl: string | null;
}

/** Best-effort name from a URL. Works with no network, so it always gives a start. */
export function nameFromUrl(raw: string): string {
  try {
    const host = new URL(raw).hostname.replace(/^www\./, "");
    const label = host.split(".")[0] ?? "";
    return label.charAt(0).toUpperCase() + label.slice(1);
  } catch {
    return "";
  }
}

/**
 * Reads the page behind `url` and returns what it can. The browser cannot do this
 * itself: another origin's HTML is blocked by CORS, so the API has to fetch it.
 */
export function useProductMetadata() {
  return useMutation<ProductMetadata, Error, string>({
    mutationFn: (url: string) =>
      apiFetch<ProductMetadata>("/products/metadata", { method: "POST", body: { url } }),
  });
}

/**
 * Icons a site publishes at a predictable path. Ordered best-first: the Apple
 * touch icon is normally 180px, while favicon.ico is often 16 or 32.
 */
const LOGO_CANDIDATE_PATHS = [
  "/apple-touch-icon.png",
  "/apple-touch-icon-precomposed.png",
  "/favicon.png",
  "/favicon.svg",
  "/favicon.ico",
];

/** Below this an icon looks like mush in the card, so it is not worth offering. */
const MIN_LOGO_PX = 32;

/**
 * Loads an image only to learn whether it exists and how big it is.
 * `naturalWidth` is readable across origins, so this needs no CORS header and no
 * server. A miss resolves to null rather than rejecting.
 */
function probeImage(src: string, timeoutMs = 2500): Promise<{ src: string; size: number } | null> {
  return new Promise((resolve) => {
    const img = new Image();
    let settled = false;
    const finish = (value: { src: string; size: number } | null) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      img.onload = null;
      img.onerror = null;
      resolve(value);
    };
    const timer = setTimeout(() => finish(null), timeoutMs);
    img.onload = () => finish({ src, size: Math.min(img.naturalWidth, img.naturalHeight) });
    img.onerror = () => finish(null);
    img.referrerPolicy = "no-referrer";
    img.src = src;
  });
}

/**
 * Finds the largest icon the site serves at a standard path. It asks the site
 * directly and no third party, so the only server that learns about the lookup is
 * the one the advertiser is listing.
 */
export async function findLogoUrl(rawUrl: string): Promise<string | null> {
  let origin: string;
  try {
    origin = new URL(rawUrl).origin;
  } catch {
    return null;
  }

  const found = await Promise.all(
    LOGO_CANDIDATE_PATHS.map((path) => probeImage(`${origin}${path}`)),
  );
  const best = found
    .filter((hit): hit is { src: string; size: number } => hit !== null)
    .sort((a, b) => b.size - a.size)[0];

  return best && best.size >= MIN_LOGO_PX ? best.src : null;
}

export function embedScriptUrl(): string {
  return env.VITE_EMBED_URL;
}

import type {
  CreateProductInput,
  PresignLogoResponse,
  Product,
  UpdateProductInput,
  VerifyProductResponse,
} from "@repo/contracts/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "./api";
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

export function embedScriptUrl(): string {
  return env.VITE_EMBED_URL;
}

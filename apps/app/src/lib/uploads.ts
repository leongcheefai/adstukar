import type { PresignLogoResponse, PresignVideoResponse } from "@repo/contracts/types";
import { apiFetch } from "./api";
import { kindOf } from "./library";

/**
 * Presign, then PUT straight to storage. The signed URL carries the size, so
 * storage refuses a larger body; the picker refused it earlier still.
 *
 * A clip goes through `/uploads/video/presign`. A picture goes through the logo
 * presign, because the API has no presign for a channel image yet; it takes
 * the same types at the same cap, under the `logos` prefix.
 *
 * XHR rather than fetch, because fetch reports no upload progress and a 50 MB
 * clip on a venue's network takes long enough to need a bar.
 */
export async function uploadChannelMedia(
  file: File,
  onProgress: (fraction: number) => void,
): Promise<string> {
  const kind = kindOf(file);
  const path = kind === "video" ? "/uploads/video/presign" : "/uploads/logo/presign";
  const { uploadUrl, publicUrl } = await apiFetch<PresignVideoResponse | PresignLogoResponse>(
    path,
    {
      method: "POST",
      body: { contentType: file.type, size: file.size },
    },
  );

  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", uploadUrl);
    xhr.setRequestHeader("Content-Type", file.type);
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress(event.loaded / event.total);
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else reject(new Error(`Storage refused the file (${xhr.status})`));
    };
    xhr.onerror = () => reject(new Error("The upload did not reach storage"));
    xhr.onabort = () => reject(new Error("The upload was cancelled"));
    xhr.send(file);
  });

  onProgress(1);
  return publicUrl;
}

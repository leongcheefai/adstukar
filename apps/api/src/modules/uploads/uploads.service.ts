import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import type { PresignAvatarInput, PresignAvatarResponse } from "@repo/contracts";
import { serverEnv } from "@repo/env";
import { HTTPException } from "hono/http-exception";

let _s3Client: S3Client | null = null;

function getS3Client(): S3Client {
  if (!_s3Client) {
    _s3Client = new S3Client({
      region: serverEnv.S3_REGION,
      credentials: {
        accessKeyId: serverEnv.S3_ACCESS_KEY_ID ?? "",
        secretAccessKey: serverEnv.S3_SECRET_ACCESS_KEY ?? "",
      },
      ...(serverEnv.S3_ENDPOINT ? { endpoint: serverEnv.S3_ENDPOINT, forcePathStyle: false } : {}),
    });
  }
  return _s3Client;
}

function getExtension(contentType: PresignAvatarInput["contentType"]): string {
  const map: Record<PresignAvatarInput["contentType"], string> = {
    "image/png": "png",
    "image/jpeg": "jpg",
    "image/webp": "webp",
  };
  return map[contentType];
}

export async function presignAvatarUpload(
  userId: string,
  input: PresignAvatarInput,
): Promise<PresignAvatarResponse> {
  if (
    !serverEnv.S3_BUCKET ||
    !serverEnv.S3_ACCESS_KEY_ID ||
    !serverEnv.S3_SECRET_ACCESS_KEY ||
    !serverEnv.S3_PUBLIC_URL
  ) {
    throw new HTTPException(503, { message: "Storage unavailable" });
  }

  const ext = getExtension(input.contentType);
  const key = `avatars/${userId}/${crypto.randomUUID()}.${ext}`;

  const client = getS3Client();
  const command = new PutObjectCommand({
    Bucket: serverEnv.S3_BUCKET,
    Key: key,
    ContentType: input.contentType,
    ContentLength: input.size,
  });

  const uploadUrl = await getSignedUrl(client, command, { expiresIn: 60 });
  const publicUrl = `${serverEnv.S3_PUBLIC_URL}/${key}`;

  return { uploadUrl, publicUrl, key };
}

import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import type {
  PresignAvatarInput,
  PresignAvatarResponse,
  PresignVideoInput,
  PresignVideoResponse,
} from "@repo/contracts";
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

type PresignInput = PresignAvatarInput | PresignVideoInput;

function getExtension(contentType: PresignInput["contentType"]): string {
  const map: Record<PresignInput["contentType"], string> = {
    "image/png": "png",
    "image/jpeg": "jpg",
    "image/webp": "webp",
    "video/mp4": "mp4",
  };
  return map[contentType];
}

export async function presignAvatarUpload(
  userId: string,
  input: PresignAvatarInput,
): Promise<PresignAvatarResponse> {
  return presignUpload("avatars", userId, input);
}

/** Listing logos share the avatar rules (png/jpeg/webp, 5 MB) under a separate prefix. */
export async function presignLogoUpload(
  userId: string,
  input: PresignAvatarInput,
): Promise<PresignAvatarResponse> {
  return presignUpload("logos", userId, input);
}

/**
 * A photo of the screen in place, for the admin who reviews the device. Same
 * rules as an avatar, under its own prefix.
 */
export async function presignDevicePhotoUpload(
  userId: string,
  input: PresignAvatarInput,
): Promise<PresignAvatarResponse> {
  return presignUpload("device-photos", userId, input);
}

/**
 * A clip a screen plays. The contract caps it at `media.video.maxBytes`, so a
 * member cannot presign a film; the cap is what a slot's dwell needs, not what
 * the bucket can hold.
 */
export async function presignVideoUpload(
  userId: string,
  input: PresignVideoInput,
): Promise<PresignVideoResponse> {
  return presignUpload("videos", userId, input);
}

async function presignUpload(
  prefix: "avatars" | "logos" | "device-photos" | "videos",
  userId: string,
  input: PresignInput,
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
  const key = `${prefix}/${userId}/${crypto.randomUUID()}.${ext}`;

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

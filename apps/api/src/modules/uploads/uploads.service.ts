import {
  DeleteObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import type {
  PresignAvatarInput,
  PresignAvatarResponse,
  PresignPresetInput,
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
type Prefix = "avatars" | "logos" | "device-photos" | "videos" | "presets";

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

/**
 * A picture or a clip an admin puts in every member's library. It takes the
 * caps a member's own file takes, under its own prefix, so the key alone says
 * the object is a preset (`PRESET_KEY` in the contracts).
 */
export async function presignPresetUpload(
  adminId: string,
  input: PresignPresetInput,
): Promise<PresignAvatarResponse> {
  return presignUpload("presets", adminId, input);
}

/** What storage holds under a key: the size and the type it was PUT with. */
export type StoredObject = { size: number; contentType: string };

/** Reads an object's size and type off storage, or null when nothing is there. */
export async function headStoredObject(key: string): Promise<StoredObject | null> {
  const bucket = requireStorage();
  try {
    const head = await getS3Client().send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
    return { size: head.ContentLength ?? 0, contentType: head.ContentType ?? "" };
  } catch (err) {
    if (isMissing(err)) return null;
    throw err;
  }
}

/** A HEAD on a missing key has no body to name the error, so the status is the test. */
function isMissing(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const rec = err as { name?: unknown; $metadata?: { httpStatusCode?: unknown } };
  return rec.name === "NotFound" || rec.$metadata?.httpStatusCode === 404;
}

export async function deleteStoredObject(key: string): Promise<void> {
  const bucket = requireStorage();
  await getS3Client().send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
}

/** The URL a browser loads an object from. */
export function publicUrlOf(key: string): string {
  requireStorage();
  return `${serverEnv.S3_PUBLIC_URL}/${key}`;
}

/** The bucket, or a 503 when storage is not configured. */
function requireStorage(): string {
  if (
    !serverEnv.S3_BUCKET ||
    !serverEnv.S3_ACCESS_KEY_ID ||
    !serverEnv.S3_SECRET_ACCESS_KEY ||
    !serverEnv.S3_PUBLIC_URL
  ) {
    throw new HTTPException(503, { message: "Storage unavailable" });
  }
  return serverEnv.S3_BUCKET;
}

async function presignUpload(
  prefix: Prefix,
  userId: string,
  input: PresignInput,
): Promise<PresignAvatarResponse> {
  const bucket = requireStorage();

  const ext = getExtension(input.contentType);
  const key = `${prefix}/${userId}/${crypto.randomUUID()}.${ext}`;

  const client = getS3Client();
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: input.contentType,
    ContentLength: input.size,
  });

  const uploadUrl = await getSignedUrl(client, command, { expiresIn: 60 });
  const publicUrl = publicUrlOf(key);

  return { uploadUrl, publicUrl, key };
}

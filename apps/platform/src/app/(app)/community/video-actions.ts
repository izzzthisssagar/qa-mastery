"use server";

import { createHash } from "node:crypto";
import { getAuthedUserId } from "@/lib/auth";
import type { MediaItem } from "./actions";

/**
 * Cloudinary signed direct-upload for ≤60s community videos. Free tier (25
 * credits/mo) is plenty at a 60s cap. The client uploads straight to Cloudinary
 * with a short-lived signature; we then verify the real duration server-side
 * (the client can't be trusted) before the video is embeddable. All of this is
 * a no-op unless CLOUDINARY_* env is set — the $0 default is image-only.
 */

const MAX_VIDEO_SECONDS = 60;

function cloudinaryEnv() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret) return null;
  return { cloudName, apiKey, apiSecret };
}

export interface CloudinarySignature {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  signature: string;
  folder: string;
}

/** Whether video upload is configured (drives the UI showing the video option). */
export async function videoUploadEnabled(): Promise<boolean> {
  return cloudinaryEnv() !== null;
}

/** Sign a direct upload. Params are sorted + joined + hashed with the secret,
 *  per Cloudinary's signature spec. The signed folder scopes the upload to the
 *  user, and eager mp4 transcoding gives a web-playable derivative. */
export async function signVideoUpload(): Promise<CloudinarySignature> {
  const userId = await getAuthedUserId();
  const env = cloudinaryEnv();
  if (!env) throw new Error("Video upload isn't configured.");

  // Date.now via a server action is fine (not inside a Workflow script).
  const timestamp = Math.floor(Date.now() / 1000);
  const folder = `community/${userId}`;
  const params: Record<string, string> = {
    eager: "f_mp4,q_auto",
    folder,
    timestamp: String(timestamp),
  };
  const toSign = Object.keys(params)
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join("&");
  const signature = createHash("sha1").update(toSign + env.apiSecret).digest("hex");

  return { cloudName: env.cloudName, apiKey: env.apiKey, timestamp, signature, folder };
}

/**
 * Verify an uploaded video's duration via Cloudinary's Admin API and return a
 * MediaItem if it's within the cap. Rejects anything over MAX_VIDEO_SECONDS —
 * the browser's reported duration is advisory; this is the real gate.
 */
export async function verifyVideo(publicId: string): Promise<MediaItem> {
  await getAuthedUserId();
  const env = cloudinaryEnv();
  if (!env) throw new Error("Video upload isn't configured.");

  const auth = Buffer.from(`${env.apiKey}:${env.apiSecret}`).toString("base64");
  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${env.cloudName}/resources/video/upload/${encodeURIComponent(publicId)}`,
    { headers: { Authorization: `Basic ${auth}` } },
  );
  if (!res.ok) throw new Error("Could not verify the uploaded video.");

  const data = (await res.json()) as { duration?: number; secure_url?: string };
  if ((data.duration ?? Infinity) > MAX_VIDEO_SECONDS) {
    throw new Error(`Videos must be ${MAX_VIDEO_SECONDS}s or shorter.`);
  }
  if (!data.secure_url) throw new Error("Cloudinary returned no URL.");

  return { type: "video", url: data.secure_url, provider: "cloudinary" };
}

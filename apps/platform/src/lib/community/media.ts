import { createBrowserSupabase } from "@qa-mastery/db";

/** Public bucket for community images (video lives on Cloudinary). */
export const COMMUNITY_BUCKET = "community-media";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";

/** Public URL for a stored community image path. */
export function communityImageUrl(path: string): string {
  return `${SUPABASE_URL}/storage/v1/object/public/${COMMUNITY_BUCKET}/${path}`;
}

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const IMAGE_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/webp", "image/gif"];

/**
 * Upload an image straight to the public community bucket (storage RLS scopes
 * the write to the user's own folder). Returns the object path to embed in a
 * post's media array. Client-side, mirroring the avatar uploader.
 */
export async function uploadCommunityImage(userId: string, file: File): Promise<string> {
  if (!IMAGE_TYPES.includes(file.type)) throw new Error("Use a PNG, JPG, WebP or GIF.");
  if (file.size > MAX_IMAGE_BYTES) throw new Error("Image must be under 5MB.");

  const supabase = createBrowserSupabase();
  const ext = file.name.split(".").pop() || "png";
  const objectPath = `${userId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage
    .from(COMMUNITY_BUCKET)
    .upload(objectPath, file, { upsert: false, contentType: file.type });
  if (error) throw new Error("Image upload failed.");
  return objectPath;
}

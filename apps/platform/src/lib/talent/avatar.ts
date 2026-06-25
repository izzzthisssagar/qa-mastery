/** Public URL for a talent avatar stored in the public `talent-avatars` bucket.
 *  Pure string-building from the public Supabase URL — safe on server + client.
 *  Returns null when there's no avatar. */
export const AVATAR_BUCKET = "talent-avatars";

export function avatarUrl(path?: string | null): string | null {
  if (!path) return null;
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) return null;
  return `${base}/storage/v1/object/public/${AVATAR_BUCKET}/${path}`;
}

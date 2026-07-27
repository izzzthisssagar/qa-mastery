import { NextResponse } from "next/server";
import { completeNote } from "@/app/(app)/notes/actions";

/** Beacon-style completion endpoint for the notes "Complete" button's
 *  optimistic save. The click already flips the UI to done and returns
 *  immediately, so the real sync must survive a hard navigation (or reload)
 *  that follows within milliseconds — a plain server-action fetch does not
 *  (browsers abort in-flight requests from an unloading document unless
 *  `keepalive` is set, which server actions don't set). Route handlers can
 *  be called with a `keepalive: true` fetch, so this wraps the same
 *  `completeNote` action for that purpose. */
export async function POST(request: Request) {
  const { noteSlug } = (await request.json()) as { noteSlug?: string };
  if (!noteSlug) {
    return NextResponse.json({ error: "noteSlug required" }, { status: 400 });
  }
  try {
    const result = await completeNote(noteSlug);
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to complete note" },
      { status: 400 },
    );
  }
}

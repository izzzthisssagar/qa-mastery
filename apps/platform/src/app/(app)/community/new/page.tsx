import { getAuthedUserId } from "@/lib/auth";
import { Composer } from "./composer";
import { videoUploadEnabled } from "../video-actions";

export const metadata = {
  title: "New post · Community · QA Mastery",
};

export default async function NewPostPage() {
  const userId = await getAuthedUserId();
  const videoEnabled = await videoUploadEnabled();

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <p className="text-xs font-medium uppercase tracking-widest text-accent">Community</p>
      <h1 className="mt-1 text-2xl font-semibold text-foreground">Start a conversation</h1>
      <div className="mt-6">
        <Composer userId={userId} videoEnabled={videoEnabled} />
      </div>
    </main>
  );
}

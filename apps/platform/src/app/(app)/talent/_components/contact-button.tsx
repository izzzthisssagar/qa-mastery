"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@qa-mastery/ui";
import { contactTester } from "@/app/(app)/talent/actions";

/** Opens (or reuses) a conversation with this tester, then jumps to the inbox
 *  thread. The conversation row is the consent boundary — messaging only exists
 *  after this. */
export function ContactButton({ handle }: { handle: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function contact() {
    setError(null);
    startTransition(async () => {
      const res = await contactTester({ handle, from: "directory" });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      router.push(`/talent/inbox/${res.data.conversationId}`);
    });
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <Button onClick={contact} disabled={pending}>
        {pending ? "Opening…" : "Contact"}
      </Button>
      {error && <span className="text-xs text-red-300">{error}</span>}
    </div>
  );
}

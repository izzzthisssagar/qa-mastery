import type { Metadata } from "next";
import { Badge, Card, CardBody, CardTitle } from "@qa-mastery/ui";

export const metadata: Metadata = { title: "Dashboard" };

export default function DashboardPage() {
  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-2xl font-semibold">Your learning</h1>
      <p className="mt-1 text-sm text-zinc-400">
        Tracks appear here as soon as the first lessons ship.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <Card>
          <div className="mb-2 flex items-center justify-between">
            <CardTitle className="mb-0">Track A — Manual Testing</CardTitle>
            <Badge tone="info">Coming first</Badge>
          </div>
          <CardBody>
            28 lessons from SDLC to a full test-cycle capstone. The opening
            lesson — Boundary Value Analysis, with the Boundary Hunter widget —
            is being built right now.
          </CardBody>
        </Card>
        <Card>
          <div className="mb-2 flex items-center justify-between">
            <CardTitle className="mb-0">Track B — Automation</CardTitle>
            <Badge>Planned</Badge>
          </div>
          <CardBody>
            Selenium + Java + TestNG, from &ldquo;just enough Java&rdquo; to a
            framework capstone, with code you actually run.
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

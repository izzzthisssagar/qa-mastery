"use client";

import { useState } from "react";
import { motion } from "motion/react";

type Status = "todo" | "dev" | "qa" | "done";

interface Ticket {
  id: string;
  title: string;
  status: Status;
  severity: "Major" | "Minor";
}

const COLUMNS: { id: Status; title: string; color: string }[] = [
  { id: "todo", title: "To Do", color: "border-border" },
  { id: "dev", title: "In Dev", color: "border-amber-500/50" },
  { id: "qa", title: "In QA", color: "border-purple-500/50" },
  { id: "done", title: "Done", color: "border-emerald-500/50" },
];

const COLUMN_TITLE: Record<Status, string> = {
  todo: "To Do",
  dev: "In Dev",
  qa: "In QA",
  done: "Done",
};

const NEXT_STATUS: Record<Status, Status | null> = {
  todo: "dev",
  dev: "qa",
  qa: "done",
  done: null,
};

export function JiraBoard({ onMilestone }: { onMilestone?: (m: string) => void }) {
  const [tickets, setTickets] = useState<Ticket[]>([
    { id: "BS-102", title: "Checkout total ignores item quantity", status: "todo", severity: "Major" },
    { id: "BS-105", title: "Typo in password reset email", status: "todo", severity: "Minor" }
  ]);
  const [announcement, setAnnouncement] = useState("");

  const advanceTicket = (id: string) => {
    setTickets(prev => {
      const updated = prev.map(t => {
        if (t.id === id) {
          const next = NEXT_STATUS[t.status];
          if (!next) return t;
          if (next === "done") onMilestone?.("completed-ticket");
          setAnnouncement(`${t.id} moved to ${COLUMN_TITLE[next]}`);
          return { ...t, status: next };
        }
        return t;
      });
      return updated;
    });
  };

  const reset = () => {
    setTickets([
      { id: "BS-102", title: "Checkout total ignores item quantity", status: "todo", severity: "Major" },
      { id: "BS-105", title: "Typo in password reset email", status: "todo", severity: "Minor" }
    ]);
    setAnnouncement("Board reset");
  };

  return (
    <div className="my-8 rounded-2xl border border-border bg-surface/30 p-6 backdrop-blur-xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Ticket Lifecycle</h3>
          <p className="text-sm text-muted-foreground">Click a ticket to advance it through the Agile board.</p>
        </div>
        <button onClick={reset} className="text-xs font-semibold text-muted-foreground hover:text-foreground">Reset Board</button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {COLUMNS.map(col => (
          <div key={col.id} className={`rounded-xl border border-border bg-background/50 flex flex-col h-64 overflow-hidden`}>
            <div className={`px-3 py-2 border-b text-xs font-bold uppercase tracking-wider bg-surface/50 ${col.color}`}>
              {col.title}
            </div>
            <div className="p-2 flex-1 flex flex-col gap-2">
              {tickets.filter(t => t.status === col.id).map(ticket => {
                const next = NEXT_STATUS[ticket.status];
                return (
                  <motion.div
                    key={ticket.id}
                    layout
                    role="button"
                    tabIndex={next ? 0 : -1}
                    aria-disabled={!next}
                    aria-label={
                      next
                        ? `${ticket.id}: ${ticket.title}. Currently ${COLUMN_TITLE[ticket.status]}. Activate to move to ${COLUMN_TITLE[next]}.`
                        : `${ticket.id}: ${ticket.title}. Done.`
                    }
                    onClick={() => advanceTicket(ticket.id)}
                    onKeyDown={(e) => {
                      if (e.key !== "Enter" && e.key !== " ") return;
                      e.preventDefault();
                      advanceTicket(ticket.id);
                    }}
                    className={`cursor-pointer rounded-lg border border-border bg-surface-raised p-3 shadow-md hover:border-border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${ticket.status === "done" ? "opacity-50" : ""}`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs font-mono text-muted-foreground">{ticket.id}</span>
                      <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${ticket.severity === "Major" ? "bg-rose-500/20 text-rose-400" : "bg-amber-500/20 text-amber-400"}`}>
                        {ticket.severity}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-foreground leading-snug">{ticket.title}</p>
                  </motion.div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div role="status" aria-live="polite" className="sr-only">
        {announcement}
      </div>
    </div>
  );
}

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
  { id: "todo", title: "To Do", color: "border-zinc-700" },
  { id: "dev", title: "In Dev", color: "border-amber-500/50" },
  { id: "qa", title: "In QA", color: "border-purple-500/50" },
  { id: "done", title: "Done", color: "border-emerald-500/50" },
];

export function JiraBoard({ onMilestone }: { onMilestone?: (m: string) => void }) {
  const [tickets, setTickets] = useState<Ticket[]>([
    { id: "BS-102", title: "Checkout total ignores item quantity", status: "todo", severity: "Major" },
    { id: "BS-105", title: "Typo in password reset email", status: "todo", severity: "Minor" }
  ]);

  const advanceTicket = (id: string) => {
    setTickets(prev => {
      const updated = prev.map(t => {
        if (t.id === id) {
          if (t.status === "todo") return { ...t, status: "dev" as Status };
          if (t.status === "dev") return { ...t, status: "qa" as Status };
          if (t.status === "qa") {
            onMilestone?.("completed-ticket");
            return { ...t, status: "done" as Status };
          }
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
  };

  return (
    <div className="my-8 rounded-2xl border border-zinc-800 bg-zinc-900/30 p-6 backdrop-blur-xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-zinc-100">Ticket Lifecycle</h3>
          <p className="text-sm text-zinc-400">Click a ticket to advance it through the Agile board.</p>
        </div>
        <button onClick={reset} className="text-xs font-semibold text-zinc-400 hover:text-zinc-200">Reset Board</button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {COLUMNS.map(col => (
          <div key={col.id} className={`rounded-xl border border-zinc-800 bg-zinc-950/50 flex flex-col h-64 overflow-hidden`}>
            <div className={`px-3 py-2 border-b text-xs font-bold uppercase tracking-wider bg-zinc-900/50 ${col.color}`}>
              {col.title}
            </div>
            <div className="p-2 flex-1 flex flex-col gap-2">
              {tickets.filter(t => t.status === col.id).map(ticket => (
                <motion.div
                  key={ticket.id}
                  layout
                  onClick={() => advanceTicket(ticket.id)}
                  className={`cursor-pointer rounded-lg border border-zinc-700 bg-zinc-800 p-3 shadow-md hover:border-zinc-500 transition-colors ${ticket.status === "done" ? "opacity-50" : ""}`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-mono text-zinc-400">{ticket.id}</span>
                    <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${ticket.severity === "Major" ? "bg-rose-500/20 text-rose-400" : "bg-amber-500/20 text-amber-400"}`}>
                      {ticket.severity}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-zinc-200 leading-snug">{ticket.title}</p>
                </motion.div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

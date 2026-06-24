"use client";

import { useState, useTransition } from "react";
import { Button } from "@qa-mastery/ui";
import { DEVICE_KINDS, labelFor } from "@/lib/talent/taxonomy";
import { addDevice, removeDevice } from "@/app/(app)/talent/actions";

export type DeviceRow = {
  id: string;
  kind: string;
  device: string;
  os?: string | null;
  os_version?: string | null;
};

const field =
  "rounded-lg border border-zinc-700 bg-zinc-900/60 px-3 py-2 text-sm text-zinc-100 outline-none focus-visible:border-zinc-500";

export function DeviceEditor({ initial }: { initial: DeviceRow[] }) {
  const [rows, setRows] = useState<DeviceRow[]>(initial);
  const [kind, setKind] = useState<string>("mobile");
  const [device, setDevice] = useState("");
  const [os, setOs] = useState("");
  const [osVersion, setOsVersion] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function add() {
    if (!device.trim()) return;
    setError(null);
    startTransition(async () => {
      const res = await addDevice({ kind, device, os: os || undefined, osVersion: osVersion || undefined });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setRows((r) => [
        ...r,
        { id: res.data.id, kind, device, os: os || null, os_version: osVersion || null },
      ]);
      setDevice("");
      setOs("");
      setOsVersion("");
    });
  }

  function remove(id: string) {
    startTransition(async () => {
      const res = await removeDevice(id);
      if (res.ok) setRows((r) => r.filter((x) => x.id !== id));
    });
  }

  return (
    <div className="space-y-4">
      {rows.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {rows.map((d) => (
            <li
              key={d.id}
              className="inline-flex items-center gap-2 rounded-md border border-zinc-800 bg-zinc-900/60 px-2 py-1 font-mono text-xs text-zinc-300"
            >
              {d.device}
              {d.os ? ` · ${d.os}` : ""}
              {d.os_version ? ` ${d.os_version}` : ""}
              <button
                type="button"
                aria-label={`Remove ${d.device}`}
                onClick={() => remove(d.id)}
                disabled={pending}
                className="text-zinc-500 hover:text-red-300"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-wrap items-end gap-2">
        <select className={field} value={kind} onChange={(e) => setKind(e.target.value)} aria-label="Device kind">
          {DEVICE_KINDS.map((k) => (
            <option key={k} value={k}>
              {labelFor(k)}
            </option>
          ))}
        </select>
        <input
          className={field}
          value={device}
          onChange={(e) => setDevice(e.target.value)}
          placeholder="iPhone 13"
          aria-label="Device"
        />
        <input
          className={field + " w-24"}
          value={os}
          onChange={(e) => setOs(e.target.value)}
          placeholder="iOS"
          aria-label="OS"
        />
        <input
          className={field + " w-20"}
          value={osVersion}
          onChange={(e) => setOsVersion(e.target.value)}
          placeholder="17"
          aria-label="OS version"
        />
        <Button variant="secondary" onClick={add} disabled={pending || !device.trim()}>
          Add device
        </Button>
      </div>
      {error && <p className="text-sm text-red-300">{error}</p>}
    </div>
  );
}

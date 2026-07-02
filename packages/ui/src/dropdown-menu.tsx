"use client";

import {
  createContext,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { cn } from "./cn";

/**
 * A tiny headless dropdown — no Radix. Click-to-open, click-outside + Escape to
 * close, focus returns to the trigger on close. The panel fades/rises in via CSS
 * that a `prefers-reduced-motion` media query neutralizes. Enough for an avatar
 * menu / overflow menu; not a full ARIA menu widget.
 */

interface Ctx {
  open: boolean;
  setOpen: (v: boolean) => void;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
  menuId: string;
}
const DropdownContext = createContext<Ctx | null>(null);

function useDropdown(): Ctx {
  const ctx = useContext(DropdownContext);
  if (!ctx) throw new Error("Dropdown parts must be used inside <DropdownMenu>");
  return ctx;
}

export function DropdownMenu({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const menuId = useId();
  return (
    <DropdownContext.Provider value={{ open, setOpen, triggerRef, menuId }}>
      <div className="relative">{children}</div>
    </DropdownContext.Provider>
  );
}

export function DropdownTrigger({
  children,
  className,
  "aria-label": ariaLabel,
}: {
  children: ReactNode;
  className?: string;
  "aria-label"?: string;
}) {
  const { open, setOpen, triggerRef, menuId } = useDropdown();
  return (
    <button
      ref={triggerRef}
      type="button"
      aria-haspopup="menu"
      aria-expanded={open}
      aria-controls={open ? menuId : undefined}
      aria-label={ariaLabel}
      onClick={() => setOpen(!open)}
      className={className}
    >
      {children}
    </button>
  );
}

export function DropdownContent({
  children,
  align = "end",
  className,
}: {
  children: ReactNode;
  align?: "start" | "end";
  className?: string;
}) {
  const { open, setOpen, triggerRef, menuId } = useDropdown();
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    function onPointer(e: PointerEvent) {
      const t = e.target as Node;
      if (ref.current?.contains(t) || triggerRef.current?.contains(t)) return;
      setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    }
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, setOpen, triggerRef]);

  if (!open) return null;
  return (
    <div
      ref={ref}
      id={menuId}
      role="menu"
      className={cn(
        "absolute z-50 mt-2 min-w-52 rounded-xl border border-border bg-surface p-1.5 shadow-lg",
        "motion-safe:animate-[dropdown-in_120ms_ease-out]",
        align === "end" ? "right-0" : "left-0",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function DropdownItem({
  children,
  onSelect,
  className,
}: {
  children: ReactNode;
  onSelect?: () => void;
  className?: string;
}) {
  const { setOpen } = useDropdown();
  return (
    <button
      type="button"
      role="menuitem"
      onClick={() => {
        onSelect?.();
        setOpen(false);
      }}
      className={cn(
        "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-foreground transition-colors hover:bg-muted focus-visible:bg-muted focus-visible:outline-none",
        className,
      )}
    >
      {children}
    </button>
  );
}

export function DropdownSeparator() {
  return <div role="separator" className="my-1 h-px bg-border" />;
}

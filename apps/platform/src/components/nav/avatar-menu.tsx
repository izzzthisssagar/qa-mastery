"use client";

import Link from "next/link";
import { useTheme } from "next-themes";
import {
  DropdownMenu,
  DropdownTrigger,
  DropdownContent,
  DropdownItem,
  DropdownSeparator,
} from "@qa-mastery/ui";
import { logout } from "@/app/(auth)/actions";

/**
 * Header avatar dropdown: Profile, Settings, theme toggle, Sign out. Replaces
 * the old scattered nav links (Portfolio / Test cases / Settings / Sign out) —
 * those destinations now live on the hub dashboard, the nav stays minimal.
 */
export function AvatarMenu({ email }: { email: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const initial = (email?.[0] ?? "?").toUpperCase();
  const isDark = resolvedTheme !== "light";

  return (
    <DropdownMenu>
      <DropdownTrigger
        aria-label="Account menu"
        // relative + before:inset-[-6px] pads the 36px circle out to a 48px
        // hit box without growing the visible element (avoids reflowing the
        // header — see notification-bell.tsx for the matching pattern).
        className="relative flex h-9 w-9 items-center justify-center rounded-full bg-accent text-sm font-semibold text-accent-foreground transition before:absolute before:inset-[-6px] before:content-[''] hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
      >
        {initial}
      </DropdownTrigger>
      <DropdownContent align="end">
        <p className="truncate px-3 py-1.5 text-xs text-muted-foreground">{email}</p>
        <DropdownSeparator />
        <Link href="/portfolio/me" role="menuitem" className="block">
          <DropdownItem>Profile</DropdownItem>
        </Link>
        <Link href="/settings" role="menuitem" className="block">
          <DropdownItem>Settings</DropdownItem>
        </Link>
        <DropdownItem onSelect={() => setTheme(isDark ? "light" : "dark")}>
          {isDark ? "☀️ Light mode" : "🌙 Dark mode"}
        </DropdownItem>
        <DropdownSeparator />
        <DropdownItem
          onSelect={() => {
            void logout();
          }}
          className="text-danger-text hover:bg-red-500/10"
        >
          Sign out
        </DropdownItem>
      </DropdownContent>
    </DropdownMenu>
  );
}

"use client";

import { useInstallLink } from "@/lib/install";

/** "Install web app" in the footer, only where the browser can install it (AGENTS.md "Offline and install"). */
export function InstallLink({ className }: { className: string }) {
  const link = useInstallLink();
  if (!link.available) return null;
  return (
    <button type="button" className={className} onClick={link.install}>
      Install web app
    </button>
  );
}

"use client";

import { useState } from "react";
import { X, Megaphone } from "lucide-react";

export function UrgentBanner({
  text,
  linkUrl,
  linkText,
  bgColor,
  primaryColor,
}: {
  text: string;
  linkUrl?: string;
  linkText?: string;
  bgColor?: string;
  primaryColor: string;
}) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div
      className="relative z-[60]"
      style={{ backgroundColor: bgColor || primaryColor }}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-center gap-3 px-10 py-2.5 text-center text-sm font-semibold text-white">
        <Megaphone className="h-4 w-4 shrink-0" />
        <span>{text}</span>
        {linkUrl && (
          <a
            href={linkUrl}
            className="font-bold underline hover:no-underline"
          >
            {linkText || "Afla mai mult"}
          </a>
        )}
      </div>
      <button
        onClick={() => setDismissed(true)}
        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-white/70 transition-colors hover:bg-white/20 hover:text-white"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

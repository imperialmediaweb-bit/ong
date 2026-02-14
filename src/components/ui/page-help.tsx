"use client";

import { useState } from "react";
import { HelpCircle, ChevronDown, ChevronUp, MessageCircle } from "lucide-react";

interface HelpItem {
  title: string;
  description: string;
}

export function PageHelp({ items, chatHint }: { items: HelpItem[]; chatHint?: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="mt-8 border-t border-dashed border-muted-foreground/15 pt-4">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 text-[11px] text-muted-foreground/50 hover:text-muted-foreground transition-colors"
      >
        <HelpCircle className="h-3.5 w-3.5" />
        <span>Ghid rapid — ce poti face aici</span>
        {open ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
      </button>
      {open && (
        <div className="mt-3 space-y-1.5 pl-5">
          {items.map((item, i) => (
            <div key={i} className="text-[11px] text-muted-foreground/60 leading-relaxed">
              <span className="font-medium text-muted-foreground/80">{item.title}</span>
              {" — "}
              {item.description}
            </div>
          ))}
          <p className="text-[11px] text-muted-foreground/40 mt-3 pt-2 border-t border-dashed border-muted-foreground/10 flex items-center gap-1.5">
            <MessageCircle className="h-3 w-3" />
            {chatHint || "Ai intrebari? Foloseste chat-ul pentru asistenta."}
          </p>
        </div>
      )}
    </div>
  );
}

"use client";

import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

export function Toaster() {
  const { toasts, dismiss } = useToast();

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-md">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={cn(
            "rounded-lg border bg-card p-4 shadow-lg transition-all animate-in slide-in-from-right-full",
            toast.variant === "destructive" && "border-destructive bg-destructive text-destructive-foreground"
          )}
        >
          <div className="flex items-start gap-3">
            <div className="flex-1">
              {toast.title && <p className="text-sm font-semibold">{toast.title}</p>}
              {toast.description && <p className="text-sm opacity-90 mt-1">{toast.description}</p>}
            </div>
            <button onClick={() => dismiss(toast.id)} className="opacity-70 hover:opacity-100">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

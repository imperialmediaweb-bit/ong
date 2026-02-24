"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AlertTriangle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ImpersonationBanner() {
  const { data: session, update } = useSession();
  const router = useRouter();
  const [stopping, setStopping] = useState(false);

  const isImpersonating = (session?.user as any)?.isImpersonating;
  const ngoName = (session?.user as any)?.ngoName;

  if (!isImpersonating) return null;

  const handleStop = async () => {
    setStopping(true);
    try {
      await fetch("/api/admin/impersonate", { method: "DELETE" });
      await update({ stopImpersonation: true });
      router.push("/admin/ngos");
    } catch (error) {
      console.error("Eroare la oprirea impersonarii:", error);
    } finally {
      setStopping(false);
    }
  };

  return (
    <>
      <div className="fixed top-0 left-0 right-0 z-[60] bg-amber-500 text-amber-950 px-4 py-2 text-sm font-medium flex items-center justify-center gap-3 shadow-md">
        <AlertTriangle className="h-4 w-4 flex-shrink-0" />
        <span>
          Vizualizezi ca: <strong>{ngoName}</strong>
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={handleStop}
          disabled={stopping}
          className="ml-2 h-7 bg-amber-600 border-amber-700 text-white hover:bg-amber-700 hover:text-white text-xs"
        >
          <ArrowLeft className="h-3 w-3 mr-1" />
          {stopping ? "Se opreste..." : "Inapoi la Admin"}
        </Button>
      </div>
      <div className="h-10" />
    </>
  );
}

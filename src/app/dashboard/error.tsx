"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Dashboard error:", error);
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-[60vh] p-4">
      <Card className="max-w-lg w-full">
        <CardHeader className="text-center">
          <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-2" />
          <CardTitle>Eroare in panou</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
            <p className="text-sm font-mono text-destructive break-all">
              {error.message || "Eroare necunoscuta"}
            </p>
            {error.digest && (
              <p className="text-xs text-muted-foreground mt-1">
                Digest: {error.digest}
              </p>
            )}
          </div>
          <p className="text-sm text-muted-foreground text-center">
            A aparut o eroare neasteptata. Incercati sa reincarcati pagina.
          </p>
          <div className="flex justify-center gap-3">
            <Button onClick={reset} variant="outline">
              <RefreshCw className="mr-2 h-4 w-4" />
              Reincearca
            </Button>
            <Button onClick={() => window.location.href = "/dashboard"}>
              Panou principal
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

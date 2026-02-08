"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Heart } from "lucide-react";

interface Props {
  params: { slug: string };
}

function UnsubscribeContent({ slug }: { slug: string }) {
  const searchParams = useSearchParams();
  const donorId = searchParams.get("did");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const handleUnsubscribe = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ donorId, ngoSlug: slug }),
      });
      if (!res.ok) {
        setError("Dezabonarea a esuat. Te rugam sa incerci din nou.");
      } else {
        setDone(true);
      }
    } catch {
      setError("Ceva nu a functionat corect.");
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <Card className="max-w-md w-full">
        <CardContent className="py-10 text-center">
          <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <Check className="h-6 w-6 text-green-600" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Dezabonat</h3>
          <p className="text-sm text-muted-foreground">
            Ai fost dezabonat cu succes. Nu vei mai primi mesaje de la aceasta organizatie.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-md w-full">
      <CardHeader className="text-center">
        <Heart className="h-8 w-8 text-primary mx-auto mb-2" />
        <CardTitle>Dezabonare</CardTitle>
        <CardDescription>
          Apasa mai jos pentru a nu mai primi mesaje de la aceasta organizatie.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md">{error}</div>
        )}
        <Button onClick={handleUnsubscribe} className="w-full" disabled={loading}>
          {loading ? "Se proceseaza..." : "Dezaboneaza-ma"}
        </Button>
        <p className="text-xs text-center text-muted-foreground">
          Aceasta actiune este conforma cu regulamentul GDPR.
        </p>
      </CardContent>
    </Card>
  );
}

export default function UnsubscribePage({ params }: Props) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-primary/5 to-background">
      <Suspense fallback={<div className="text-muted-foreground">Se incarca...</div>}>
        <UnsubscribeContent slug={params.slug} />
      </Suspense>
    </div>
  );
}

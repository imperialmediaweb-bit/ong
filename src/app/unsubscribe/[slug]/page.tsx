"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Heart } from "lucide-react";

interface Props {
  params: { slug: string };
}

export default function UnsubscribePage({ params }: Props) {
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
        body: JSON.stringify({ donorId, ngoSlug: params.slug }),
      });
      if (!res.ok) {
        setError("Failed to unsubscribe. Please try again.");
      } else {
        setDone(true);
      }
    } catch {
      setError("Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-primary/5 to-background">
        <Card className="max-w-md w-full">
          <CardContent className="py-10 text-center">
            <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <Check className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Unsubscribed</h3>
            <p className="text-sm text-muted-foreground">
              You have been unsubscribed. You will no longer receive messages from this organization.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-primary/5 to-background">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <Heart className="h-8 w-8 text-primary mx-auto mb-2" />
          <CardTitle>Unsubscribe</CardTitle>
          <CardDescription>
            Click below to stop receiving messages from this organization.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md">{error}</div>
          )}
          <Button onClick={handleUnsubscribe} className="w-full" disabled={loading}>
            {loading ? "Processing..." : "Unsubscribe"}
          </Button>
          <p className="text-xs text-center text-muted-foreground">
            This action is in compliance with GDPR regulations.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

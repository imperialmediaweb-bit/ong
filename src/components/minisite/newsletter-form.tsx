"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, Check } from "lucide-react";

interface Props {
  ngoSlug: string;
  consentTexts: Record<string, string>;
}

export function MiniSiteNewsletter({ ngoSlug, consentTexts }: Props) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [emailConsent, setEmailConsent] = useState(false);
  const [privacyConsent, setPrivacyConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailConsent || !privacyConsent) {
      setError("Trebuie sa accepti primirea de email-uri si politica de confidentialitate");
      return;
    }
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`/api/minisite/${ngoSlug}/subscribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name, emailConsent, privacyConsent }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Abonarea a esuat");
      } else {
        setSuccess(true);
      }
    } catch {
      setError("Ceva nu a functionat corect");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <Check className="h-6 w-6 text-green-600" />
          </div>
          <h3 className="text-lg font-semibold">Te-ai abonat cu succes!</h3>
          <p className="text-sm text-muted-foreground mt-1">Vei primi actualizari la {email}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5 text-primary" />
          Ramai la curent
        </CardTitle>
        <CardDescription>Aboneaza-te la newsletter pentru actualizari si rapoarte de impact</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md">{error}</div>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="sub-name">Nume (optional)</Label>
              <Input id="sub-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Numele tau" />
            </div>
            <div>
              <Label htmlFor="sub-email">Email *</Label>
              <Input id="sub-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu@exemplu.ro" required />
            </div>
          </div>

          <div className="space-y-3 border-t pt-3">
            <div className="flex items-start gap-2">
              <Checkbox
                id="sub-email-consent"
                checked={emailConsent}
                onCheckedChange={(v) => setEmailConsent(v === true)}
              />
              <Label htmlFor="sub-email-consent" className="text-sm leading-snug">
                {consentTexts.EMAIL_MARKETING || "Sunt de acord sa primesc actualizari prin email"} *
              </Label>
            </div>
            <div className="flex items-start gap-2">
              <Checkbox
                id="sub-privacy-consent"
                checked={privacyConsent}
                onCheckedChange={(v) => setPrivacyConsent(v === true)}
              />
              <Label htmlFor="sub-privacy-consent" className="text-sm leading-snug">
                {consentTexts.PRIVACY_POLICY || "Sunt de acord cu Politica de Confidentialitate si Termenii"} *
              </Label>
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Se aboneaza..." : "Aboneaza-te"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

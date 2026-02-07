"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart, Check } from "lucide-react";

interface Props {
  ngoSlug: string;
  ngoName: string;
  consentTexts: Record<string, string>;
}

const AMOUNTS = [25, 50, 100, 250, 500];

export function MiniSiteDonation({ ngoSlug, ngoName, consentTexts }: Props) {
  const [amount, setAmount] = useState<number>(50);
  const [customAmount, setCustomAmount] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [emailConsent, setEmailConsent] = useState(false);
  const [smsConsent, setSmsConsent] = useState(false);
  const [privacyConsent, setPrivacyConsent] = useState(false);
  const [isRecurring, setIsRecurring] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!privacyConsent) {
      setError("Trebuie sa accepti politica de confidentialitate");
      return;
    }
    setError("");
    setLoading(true);

    try {
      const finalAmount = customAmount ? parseFloat(customAmount) : amount;
      const res = await fetch(`/api/minisite/${ngoSlug}/donate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: finalAmount,
          name, email, phone,
          emailConsent, smsConsent, privacyConsent,
          isRecurring,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Donatia a esuat");
      } else {
        setSuccess(true);
      }
    } catch {
      setError("Ceva nu a functionat. Te rugam sa incerci din nou.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <Check className="h-6 w-6 text-green-600" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Multumim pentru donatia ta!</h3>
          <p className="text-muted-foreground">
            Sprijinul tau de {customAmount || amount} RON inseamna foarte mult pentru {ngoName}.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Heart className="h-5 w-5 text-primary" />
          Fa o donatie
        </CardTitle>
        <CardDescription>Sustine {ngoName} cu o donatie unica sau recurenta</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md">{error}</div>
          )}

          <div>
            <Label className="mb-3 block">Selecteaza suma (RON)</Label>
            <div className="grid grid-cols-5 gap-2 mb-3">
              {AMOUNTS.map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => { setAmount(a); setCustomAmount(""); }}
                  className={`py-2 rounded-md border text-sm font-medium transition-colors ${
                    amount === a && !customAmount
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background hover:bg-accent"
                  }`}
                >
                  {a}
                </button>
              ))}
            </div>
            <Input
              type="number"
              placeholder="Alta suma"
              value={customAmount}
              onChange={(e) => setCustomAmount(e.target.value)}
              min="1"
            />
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="recurring"
              checked={isRecurring}
              onCheckedChange={(v) => setIsRecurring(v === true)}
            />
            <Label htmlFor="recurring" className="text-sm">Vreau sa donez lunar</Label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="donor-name">Nume (optional)</Label>
              <Input id="donor-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Numele tau" />
            </div>
            <div>
              <Label htmlFor="donor-email">Email (optional)</Label>

              <Input id="donor-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
            </div>
          </div>

          <div>
            <Label htmlFor="donor-phone">Telefon (optional)</Label>
            <Input id="donor-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+40 7xx xxx xxx" />
          </div>

          <div className="space-y-3 border-t pt-4">
            <div className="flex items-start gap-2">
              <Checkbox
                id="email-consent"
                checked={emailConsent}
                onCheckedChange={(v) => setEmailConsent(v === true)}
              />
              <Label htmlFor="email-consent" className="text-sm leading-snug">
                {consentTexts.EMAIL_MARKETING || "Sunt de acord sa primesc actualizari prin email despre impactul donatiei mele"}
              </Label>
            </div>
            <div className="flex items-start gap-2">
              <Checkbox
                id="sms-consent"
                checked={smsConsent}
                onCheckedChange={(v) => setSmsConsent(v === true)}
              />
              <Label htmlFor="sms-consent" className="text-sm leading-snug">
                {consentTexts.SMS_MARKETING || "Sunt de acord sa primesc notificari SMS (optional)"}
              </Label>
            </div>
            <div className="flex items-start gap-2">
              <Checkbox
                id="privacy-consent"
                checked={privacyConsent}
                onCheckedChange={(v) => setPrivacyConsent(v === true)}
              />
              <Label htmlFor="privacy-consent" className="text-sm leading-snug">
                {consentTexts.PRIVACY_POLICY || "Sunt de acord cu Politica de Confidentialitate si Termenii de Utilizare"} *
              </Label>
            </div>
          </div>

          <Button type="submit" className="w-full" size="lg" disabled={loading}>
            {loading ? "Se proceseaza..." : `Doneaza ${customAmount || amount} RON`}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

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
      setError("You must consent to email updates and accept the privacy policy");
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
        setError(data.error || "Subscription failed");
      } else {
        setSuccess(true);
      }
    } catch {
      setError("Something went wrong");
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
          <h3 className="text-lg font-semibold">You&apos;re subscribed!</h3>
          <p className="text-sm text-muted-foreground mt-1">You&apos;ll receive updates at {email}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5 text-primary" />
          Stay Updated
        </CardTitle>
        <CardDescription>Subscribe to our newsletter for updates and impact reports</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md">{error}</div>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="sub-name">Name (optional)</Label>
              <Input id="sub-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
            </div>
            <div>
              <Label htmlFor="sub-email">Email *</Label>
              <Input id="sub-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
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
                {consentTexts.EMAIL_MARKETING || "I agree to receive updates by email"} *
              </Label>
            </div>
            <div className="flex items-start gap-2">
              <Checkbox
                id="sub-privacy-consent"
                checked={privacyConsent}
                onCheckedChange={(v) => setPrivacyConsent(v === true)}
              />
              <Label htmlFor="sub-privacy-consent" className="text-sm leading-snug">
                {consentTexts.PRIVACY_POLICY || "I agree to the Privacy Policy & Terms"} *
              </Label>
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Subscribing..." : "Subscribe"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

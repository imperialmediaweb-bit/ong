"use client";

import { useState } from "react";
import { Heart, Loader2, ShieldCheck, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const PRESET_AMOUNTS = [25, 50, 100, 250, 500];

interface DonationWidgetProps {
  ngoSlug: string;
  ngoName: string;
  isVerified: boolean;
}

export function DonationWidget({
  ngoSlug,
  ngoName,
  isVerified,
}: DonationWidgetProps) {
  const [selectedAmount, setSelectedAmount] = useState<number | null>(50);
  const [customAmount, setCustomAmount] = useState("");
  const [isCustom, setIsCustom] = useState(false);
  const [donorName, setDonorName] = useState("");
  const [donorEmail, setDonorEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const finalAmount = isCustom ? Number(customAmount) || 0 : selectedAmount || 0;

  const handlePresetClick = (amount: number) => {
    setSelectedAmount(amount);
    setIsCustom(false);
    setCustomAmount("");
    setError(null);
  };

  const handleCustomClick = () => {
    setIsCustom(true);
    setSelectedAmount(null);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (finalAmount < 1) {
      setError("Suma minima pentru donatie este 1 RON.");
      return;
    }

    if (finalAmount > 50000) {
      setError("Suma maxima pentru donatie este 50.000 RON.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/donate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ngoSlug,
          amount: finalAmount,
          donorEmail: donorEmail || undefined,
          donorName: donorName || undefined,
          message: message || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "A aparut o eroare. Te rugam sa incerci din nou.");
        return;
      }

      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
        return;
      }

      setSuccess(true);
    } catch {
      setError("Eroare de conexiune. Te rugam sa incerci din nou.");
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <Heart className="h-8 w-8 text-green-600" />
          </div>
          <h3 className="text-xl font-bold mb-2">Multumim pentru donatie!</h3>
          <p className="text-muted-foreground">
            Donatia ta de {finalAmount} RON catre {ngoName} a fost inregistrata cu succes.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-primary" />
            Doneaza pentru {ngoName}
          </CardTitle>
          {isVerified && (
            <Badge className="bg-green-600 text-white gap-1">
              <ShieldCheck className="h-3 w-3" />
              Verificat
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Amount Selection */}
          <div>
            <Label className="text-sm font-medium mb-3 block">
              Alege suma donatie (RON)
            </Label>
            <div className="grid grid-cols-3 gap-2 mb-3">
              {PRESET_AMOUNTS.map((amount) => (
                <Button
                  key={amount}
                  type="button"
                  variant={
                    !isCustom && selectedAmount === amount
                      ? "default"
                      : "outline"
                  }
                  className="h-12 text-base font-semibold"
                  onClick={() => handlePresetClick(amount)}
                >
                  {amount} RON
                </Button>
              ))}
              <Button
                type="button"
                variant={isCustom ? "default" : "outline"}
                className="h-12 text-base font-semibold"
                onClick={handleCustomClick}
              >
                Alta suma
              </Button>
            </div>

            {isCustom && (
              <div className="relative">
                <Input
                  type="number"
                  min="1"
                  max="50000"
                  step="1"
                  placeholder="Introdu suma dorita"
                  value={customAmount}
                  onChange={(e) => {
                    setCustomAmount(e.target.value);
                    setError(null);
                  }}
                  className="pr-16 h-12 text-lg"
                  autoFocus
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">
                  RON
                </span>
              </div>
            )}
          </div>

          {/* Donor Info */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="donorName" className="text-sm mb-1.5 block">
                Numele tau (optional)
              </Label>
              <Input
                id="donorName"
                type="text"
                placeholder="Numele si prenumele"
                value={donorName}
                onChange={(e) => setDonorName(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="donorEmail" className="text-sm mb-1.5 block">
                Email (optional)
              </Label>
              <Input
                id="donorEmail"
                type="email"
                placeholder="email@exemplu.ro"
                value={donorEmail}
                onChange={(e) => setDonorEmail(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="message" className="text-sm mb-1.5 block">
                Mesaj (optional)
              </Label>
              <Textarea
                id="message"
                placeholder="Un mesaj de incurajare pentru echipa ONG-ului..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Submit */}
          <Button
            type="submit"
            size="lg"
            className="w-full text-base h-12"
            disabled={isLoading || finalAmount < 1}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Se proceseaza...
              </>
            ) : (
              <>
                <Heart className="h-5 w-5 mr-2" />
                Doneaza {finalAmount > 0 ? `${finalAmount} RON` : ""}
              </>
            )}
          </Button>

          {/* Privacy Note */}
          <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/50 rounded-md p-3">
            <Lock className="h-4 w-4 shrink-0 mt-0.5" />
            <p>
              Plata este procesata securizat prin Stripe. Banii ajung direct in
              contul ONG-ului.
            </p>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

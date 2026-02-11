"use client";

import { useState, useEffect } from "react";
import { Heart, Loader2, ShieldCheck, Lock, CreditCard, Banknote, Wallet, Copy, Check, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const PRESET_AMOUNTS = [25, 50, 100, 250, 500];

interface PaymentMethod {
  id: string;
  label: string;
  description: string;
  available: boolean;
  details?: any;
}

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

  // Payment methods
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<string>("card");
  const [methodsLoading, setMethodsLoading] = useState(true);

  // Pledge result
  const [pledgeResult, setPledgeResult] = useState<any>(null);
  const [copied, setCopied] = useState("");

  const finalAmount = isCustom ? Number(customAmount) || 0 : selectedAmount || 0;

  useEffect(() => {
    const fetchMethods = async () => {
      try {
        const res = await fetch(`/api/donate/methods/${ngoSlug}`);
        if (res.ok) {
          const data = await res.json();
          setMethods(data.methods || []);
          if (data.methods?.length > 0) {
            setSelectedMethod(data.methods[0].id);
          }
        }
      } catch {
        // Fall back to card only
      } finally {
        setMethodsLoading(false);
      }
    };
    fetchMethods();
  }, [ngoSlug]);

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

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(label);
      setTimeout(() => setCopied(""), 2000);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (selectedMethod === "card" || selectedMethod === "paypal") {
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
        // PayPal flow
        if (selectedMethod === "paypal") {
          const response = await fetch("/api/donate/paypal", {
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
          if (data.approveUrl) {
            window.location.href = data.approveUrl;
            return;
          }
          setSuccess(true);
          return;
        }

        // Stripe card flow
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
    } else {
      // Manual pledge flow (bank_transfer / revolut)
      setIsLoading(true);
      try {
        const response = await fetch("/api/donate/pledge", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ngoSlug,
            amount: finalAmount > 0 ? finalAmount : undefined,
            paymentMethod: selectedMethod,
            donorName: donorName || undefined,
            donorEmail: donorEmail || undefined,
          }),
        });

        const data = await response.json();
        if (!response.ok) {
          setError(data.error || "A aparut o eroare.");
          return;
        }
        setPledgeResult(data);
      } catch {
        setError("Eroare de conexiune. Te rugam sa incerci din nou.");
      } finally {
        setIsLoading(false);
      }
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

  // Show pledge confirmation (bank transfer / revolut)
  if (pledgeResult) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="text-center mb-6">
            <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
              {selectedMethod === "bank_transfer" ? (
                <Banknote className="h-8 w-8 text-blue-600" />
              ) : (
                <Wallet className="h-8 w-8 text-purple-600" />
              )}
            </div>
            <h3 className="text-xl font-bold mb-2">
              {selectedMethod === "bank_transfer" ? "Detalii transfer bancar" : "Detalii plata Revolut"}
            </h3>
            <p className="text-muted-foreground text-sm">
              Te rugam sa folosesti referinta de mai jos in descrierea platii.
            </p>
          </div>

          {/* Reference Code */}
          <div className="bg-muted/50 border rounded-lg p-4 mb-4">
            <Label className="text-xs text-muted-foreground">Referinta plata</Label>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-2xl font-mono font-bold tracking-wider">{pledgeResult.referenceCode}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(pledgeResult.referenceCode, "ref")}
              >
                {copied === "ref" ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {/* Bank Details */}
          {pledgeResult.bankDetails && (
            <div className="space-y-3 border rounded-lg p-4 mb-4">
              {pledgeResult.bankDetails.beneficiary && (
                <div>
                  <Label className="text-xs text-muted-foreground">Beneficiar</Label>
                  <p className="font-medium">{pledgeResult.bankDetails.beneficiary}</p>
                </div>
              )}
              {pledgeResult.bankDetails.bankName && (
                <div>
                  <Label className="text-xs text-muted-foreground">Banca</Label>
                  <p className="font-medium">{pledgeResult.bankDetails.bankName}</p>
                </div>
              )}
              {pledgeResult.bankDetails.ibanRon && (
                <div>
                  <Label className="text-xs text-muted-foreground">IBAN RON</Label>
                  <div className="flex items-center gap-2">
                    <p className="font-mono text-sm">{pledgeResult.bankDetails.ibanRon}</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(pledgeResult.bankDetails.ibanRon, "iban")}
                    >
                      {copied === "iban" ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              )}
              {pledgeResult.bankDetails.ibanEur && (
                <div>
                  <Label className="text-xs text-muted-foreground">IBAN EUR</Label>
                  <div className="flex items-center gap-2">
                    <p className="font-mono text-sm">{pledgeResult.bankDetails.ibanEur}</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(pledgeResult.bankDetails.ibanEur, "iban-eur")}
                    >
                      {copied === "iban-eur" ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Revolut Details */}
          {pledgeResult.revolutDetails && (
            <div className="space-y-3 border rounded-lg p-4 mb-4">
              {pledgeResult.revolutDetails.tag && (
                <div>
                  <Label className="text-xs text-muted-foreground">Revolut Tag</Label>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-lg">{pledgeResult.revolutDetails.tag}</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(pledgeResult.revolutDetails.tag, "tag")}
                    >
                      {copied === "tag" ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              )}
              {pledgeResult.revolutDetails.phone && (
                <div>
                  <Label className="text-xs text-muted-foreground">Telefon Revolut</Label>
                  <p className="font-medium">{pledgeResult.revolutDetails.phone}</p>
                </div>
              )}
              {pledgeResult.revolutDetails.link && (
                <div>
                  <a
                    href={pledgeResult.revolutDetails.link}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button variant="outline" className="gap-2">
                      <ExternalLink className="h-4 w-4" />
                      Deschide Revolut
                    </Button>
                  </a>
                </div>
              )}
            </div>
          )}

          <div className="text-center">
            <Button variant="outline" onClick={() => setPledgeResult(null)}>
              Inapoi la formular
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const methodIcons: Record<string, React.ReactNode> = {
    card: <CreditCard className="h-4 w-4" />,
    paypal: <span className="text-sm font-bold">P</span>,
    bank_transfer: <Banknote className="h-4 w-4" />,
    revolut: <Wallet className="h-4 w-4" />,
  };

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
          {/* Payment Method Selection */}
          {!methodsLoading && methods.length > 1 && (
            <div>
              <Label className="text-sm font-medium mb-3 block">Metoda de plata</Label>
              <div className={`grid gap-2 ${methods.length >= 4 ? "grid-cols-2 sm:grid-cols-4" : methods.length === 3 ? "grid-cols-3" : "grid-cols-2"}`}>
                {methods.map((method) => (
                  <button
                    key={method.id}
                    type="button"
                    onClick={() => { setSelectedMethod(method.id); setError(null); }}
                    className={`flex items-center justify-center gap-2 p-3 rounded-lg border text-sm font-medium transition-colors ${
                      selectedMethod === method.id
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background hover:bg-accent border-border"
                    }`}
                  >
                    {methodIcons[method.id]}
                    {method.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Amount Selection */}
          <div>
            <Label className="text-sm font-medium mb-3 block">
              {selectedMethod === "card" || selectedMethod === "paypal" ? "Alege suma donatie (RON)" : "Suma (optional, RON)"}
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

            {(selectedMethod === "card" || selectedMethod === "paypal") && (
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
            )}
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
            disabled={isLoading || ((selectedMethod === "card" || selectedMethod === "paypal") && finalAmount < 1)}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Se proceseaza...
              </>
            ) : selectedMethod === "card" ? (
              <>
                <CreditCard className="h-5 w-5 mr-2" />
                Plateste {finalAmount > 0 ? `${finalAmount} RON` : ""} cu cardul
              </>
            ) : selectedMethod === "paypal" ? (
              <>
                <span className="text-lg font-bold mr-2">P</span>
                Plateste {finalAmount > 0 ? `${finalAmount} RON` : ""} cu PayPal
              </>
            ) : selectedMethod === "bank_transfer" ? (
              <>
                <Banknote className="h-5 w-5 mr-2" />
                Obtine detalii transfer bancar
              </>
            ) : (
              <>
                <Wallet className="h-5 w-5 mr-2" />
                Obtine detalii Revolut
              </>
            )}
          </Button>

          {/* Privacy Note */}
          <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/50 rounded-md p-3">
            <Lock className="h-4 w-4 shrink-0 mt-0.5" />
            <p>
              {selectedMethod === "card"
                ? "Plata este procesata securizat prin Stripe. Banii ajung direct in contul ONG-ului."
                : selectedMethod === "paypal"
                ? "Plata este procesata securizat prin PayPal. Banii ajung direct in contul ONG-ului."
                : "Donatia va fi confirmata de catre echipa ONG-ului dupa primirea transferului."
              }
            </p>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

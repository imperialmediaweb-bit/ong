"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BinevoLogo } from "@/components/BinevoLogo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle,
  Star,
  CreditCard,
  FileText,
  RefreshCw,
  ArrowLeft,
  Loader2,
  Shield,
  Zap,
} from "lucide-react";

export default function CheckoutPage() {
  const router = useRouter();
  const [selectedPlan, setSelectedPlan] = useState<"PRO" | "ELITE">("PRO");
  const [paymentMethod, setPaymentMethod] = useState<"recurring_card" | "invoice">("recurring_card");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const plans = {
    PRO: {
      name: "Pro",
      price: 149,
      features: [
        "1.000 donatori",
        "Campanii email nelimitate",
        "Generator continut AI",
        "Automatizari de baza",
        "Analitica si rapoarte",
        "Export CSV",
        "5 utilizatori",
        "Suport prioritar",
        "Blog ONG",
      ],
      color: "border-indigo-300 ring-indigo-200",
      badgeColor: "bg-indigo-100 text-indigo-700 border-indigo-200",
      buttonColor: "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700",
      checkColor: "text-indigo-500",
    },
    ELITE: {
      name: "Elite",
      price: 349,
      features: [
        "Donatori nelimitati",
        "Email + SMS campanii",
        "Automatizari avansate",
        "A/B Testing",
        "Super Agent AI (OpenAI, Gemini, Claude)",
        "Optimizare AI continut",
        "Verificare prioritara",
        "Utilizatori nelimitati",
        "Suport dedicat",
        "Blog + pagini custom",
        "ONG promovat pe homepage",
      ],
      color: "border-purple-300 ring-purple-200",
      badgeColor: "bg-purple-100 text-purple-700 border-purple-200",
      buttonColor: "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700",
      checkColor: "text-purple-500",
    },
  };

  const plan = plans[selectedPlan];

  const handleCheckout = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan: selectedPlan,
          paymentMethod,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Eroare la procesare");
        return;
      }

      if (data.paymentUrl) {
        router.push(data.paymentUrl);
      }
    } catch {
      setError("Eroare la conectarea cu serverul");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white border-b shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/">
            <BinevoLogo size="md" />
          </Link>
          <Link href="/dashboard">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Dashboard
            </Button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-gray-900">Alege planul potrivit</h1>
          <p className="text-muted-foreground mt-2">
            Upgradeaza pentru a debloca toate functionalitatile platformei
          </p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 p-3 rounded-md text-sm mb-6 text-center">{error}</div>
        )}

        {/* Plan Selection */}
        <div className="grid md:grid-cols-2 gap-6 mb-10">
          {(["PRO", "ELITE"] as const).map((p) => {
            const planInfo = plans[p];
            const isSelected = selectedPlan === p;
            return (
              <Card
                key={p}
                className={`cursor-pointer transition-all duration-200 ${
                  isSelected
                    ? `${planInfo.color} ring-2 shadow-lg`
                    : "hover:shadow-md"
                }`}
                onClick={() => setSelectedPlan(p)}
              >
                <CardHeader className="text-center pb-2">
                  <Badge className={`w-fit mx-auto mb-2 ${planInfo.badgeColor}`}>{p}</Badge>
                  <CardTitle className="text-xl">{planInfo.name}</CardTitle>
                  <div className="mt-2">
                    <span className="text-4xl font-extrabold text-gray-900">{planInfo.price}</span>
                    <span className="text-lg text-gray-500 ml-1">RON/luna</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {planInfo.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm text-gray-600">
                        <CheckCircle className={`h-4 w-4 ${planInfo.checkColor} flex-shrink-0 mt-0.5`} />
                        {f}
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter className="justify-center">
                  {isSelected && (
                    <Badge className="bg-green-100 text-green-700 border-green-200">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Selectat
                    </Badge>
                  )}
                </CardFooter>
              </Card>
            );
          })}
        </div>

        {/* Payment Method Selection */}
        <div className="mb-10">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 text-center">
            Alege metoda de plata
          </h2>
          <div className="grid md:grid-cols-2 gap-4 max-w-2xl mx-auto">
            {/* Recurring Card */}
            <Card
              className={`cursor-pointer transition-all duration-200 ${
                paymentMethod === "recurring_card"
                  ? "border-indigo-300 ring-2 ring-indigo-200 shadow-md"
                  : "hover:shadow-md"
              }`}
              onClick={() => setPaymentMethod("recurring_card")}
            >
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0">
                    <RefreshCw className="h-5 w-5 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Plata recurenta cu cardul</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Se debiteaza automat lunar. Factura se genereaza automat dupa plata.
                    </p>
                    {paymentMethod === "recurring_card" && (
                      <Badge className="mt-2 bg-indigo-100 text-indigo-700">
                        <Zap className="h-3 w-3 mr-1" />
                        Recomandat
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Manual Invoice */}
            <Card
              className={`cursor-pointer transition-all duration-200 ${
                paymentMethod === "invoice"
                  ? "border-indigo-300 ring-2 ring-indigo-200 shadow-md"
                  : "hover:shadow-md"
              }`}
              onClick={() => setPaymentMethod("invoice")}
            >
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0">
                    <FileText className="h-5 w-5 text-gray-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Factura cu termen de plata</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Primiti factura pe email. Platiti cu cardul sau transfer bancar in termenul specificat.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Summary & Checkout */}
        <Card className="max-w-lg mx-auto">
          <CardContent className="p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Sumar comanda</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Plan</span>
                <span className="font-semibold">{plan.name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Pret lunar</span>
                <span className="font-semibold">{plan.price} RON</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Metoda plata</span>
                <span className="font-semibold">
                  {paymentMethod === "recurring_card" ? "Card recurent" : "Factura"}
                </span>
              </div>
              <div className="border-t pt-3">
                <div className="flex justify-between">
                  <span className="font-semibold">Total prima luna</span>
                  <span className="text-xl font-bold text-indigo-600">{plan.price} RON</span>
                </div>
              </div>
            </div>

            <Button
              onClick={handleCheckout}
              disabled={loading}
              className={`w-full mt-6 ${plan.buttonColor}`}
              size="lg"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : paymentMethod === "recurring_card" ? (
                <CreditCard className="h-4 w-4 mr-2" />
              ) : (
                <FileText className="h-4 w-4 mr-2" />
              )}
              {loading
                ? "Se proceseaza..."
                : paymentMethod === "recurring_card"
                ? `Plateste ${plan.price} RON`
                : "Genereaza factura"}
            </Button>

            <div className="flex items-center gap-1.5 justify-center mt-3 text-xs text-gray-400">
              <Shield className="h-3 w-3" />
              Plati securizate. Puteti anula oricand.
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

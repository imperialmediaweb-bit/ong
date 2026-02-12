"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  CreditCard, Save, Eye, EyeOff, CheckCircle2, XCircle,
  Loader2, ToggleLeft, ToggleRight, Shield, AlertTriangle,
  Landmark, Globe, FileText, ExternalLink, Link2,
} from "lucide-react";

interface PaymentProcessorState {
  // Stripe
  stripeEnabled: boolean;
  stripeSecretKey: string;
  stripePublishableKey: string;
  stripeWebhookSecret: string;
  stripeConnectWebhookSecret: string;
  stripeHasKeys: boolean;

  // Netopia
  netopiaEnabled: boolean;
  netopiaApiKey: string;
  netopiaMerchantId: string;
  netopiaPublicKey: string;
  netopiaPrivateKey: string;
  netopiaSandbox: boolean;
  netopiaNotifyUrl: string;
  netopiaHasPublicKey: boolean;
  netopiaHasPrivateKey: boolean;

  // PayPal
  paypalPlatformEnabled: boolean;
  paypalPlatformClientId: string;
  paypalPlatformSecret: string;
  paypalPlatformSandbox: boolean;
  paypalHasKeys: boolean;

  // e-Factura
  eFacturaEnabled: boolean;
  eFacturaAutoSend: boolean;
  anafClientId: string;
  anafClientSecret: string;
  anafSandbox: boolean;
  anafCui: string;
  anafCallbackUrl: string;
  anafIsConnected: boolean;
  anafTokenExpiresAt: string | null;
}

const defaultState: PaymentProcessorState = {
  stripeEnabled: true,
  stripeSecretKey: "",
  stripePublishableKey: "",
  stripeWebhookSecret: "",
  stripeConnectWebhookSecret: "",
  stripeHasKeys: false,
  netopiaEnabled: false,
  netopiaApiKey: "",
  netopiaMerchantId: "",
  netopiaPublicKey: "",
  netopiaPrivateKey: "",
  netopiaSandbox: true,
  netopiaNotifyUrl: "",
  netopiaHasPublicKey: false,
  netopiaHasPrivateKey: false,
  paypalPlatformEnabled: false,
  paypalPlatformClientId: "",
  paypalPlatformSecret: "",
  paypalPlatformSandbox: true,
  paypalHasKeys: false,
  eFacturaEnabled: false,
  eFacturaAutoSend: false,
  anafClientId: "",
  anafClientSecret: "",
  anafSandbox: true,
  anafCui: "",
  anafCallbackUrl: "",
  anafIsConnected: false,
  anafTokenExpiresAt: null,
};

export default function PaymentProcessorsPage() {
  const [data, setData] = useState<PaymentProcessorState>(defaultState);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const [payRes, efRes] = await Promise.all([
        fetch("/api/admin/payment-processors"),
        fetch("/api/admin/efactura"),
      ]);
      const result = payRes.ok ? await payRes.json() : {};
      const efResult = efRes.ok ? await efRes.json() : {};
      setData({
        ...defaultState,
        ...result,
        stripeSecretKey: result.stripeSecretKey || "",
        stripePublishableKey: result.stripePublishableKey || "",
        stripeWebhookSecret: result.stripeWebhookSecret || "",
        stripeConnectWebhookSecret: result.stripeConnectWebhookSecret || "",
        netopiaApiKey: result.netopiaApiKey || "",
        netopiaMerchantId: result.netopiaMerchantId || "",
        netopiaNotifyUrl: result.netopiaNotifyUrl || "",
        paypalPlatformClientId: result.paypalPlatformClientId || "",
        // e-Factura
        eFacturaEnabled: efResult.eFacturaEnabled || false,
        eFacturaAutoSend: efResult.eFacturaAutoSend || false,
        anafClientId: efResult.anafClientId || "",
        anafSandbox: efResult.anafSandbox ?? true,
        anafCui: efResult.anafCui || "",
        anafCallbackUrl: efResult.anafCallbackUrl || "",
        anafIsConnected: efResult.anafIsConnected || false,
        anafTokenExpiresAt: efResult.anafTokenExpiresAt || null,
      });
    } catch {
      setError("Eroare la incarcarea setarilor");
    } finally {
      setLoading(false);
    }
  };

  const showMsg = (type: "success" | "error", msg: string) => {
    if (type === "success") { setSuccess(msg); setError(""); }
    else { setError(msg); setSuccess(""); }
    setTimeout(() => { setSuccess(""); setError(""); }, 4000);
  };

  const handleSave = async (processor: string, fields: Record<string, any>) => {
    setSaving(processor);
    try {
      // Use different endpoint for e-Factura
      const endpoint = processor === "e-Factura"
        ? "/api/admin/efactura"
        : "/api/admin/payment-processors";
      const res = await fetch(endpoint, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fields),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Eroare la salvare");
      }
      showMsg("success", `Setarile ${processor} au fost salvate cu succes`);
      fetchSettings();
    } catch (err: any) {
      showMsg("error", err.message);
    } finally {
      setSaving(null);
    }
  };

  const toggleKey = (field: string) => {
    setShowKeys((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const updateField = (field: keyof PaymentProcessorState, value: any) => {
    setData((prev) => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">Se incarca...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <CreditCard className="h-7 w-7 text-blue-600" />
        <div>
          <h1 className="text-3xl font-bold">Procesatoare de plati</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Configureaza procesatoarele de plati pentru abonamente si facturi platformei
          </p>
        </div>
      </div>

      {success && <div className="bg-green-50 text-green-700 p-3 rounded-md text-sm">{success}</div>}
      {error && <div className="bg-red-50 text-red-700 p-3 rounded-md text-sm">{error}</div>}

      {/* ─── Stripe ───────────────────────────────────────── */}
      <Card className="border-indigo-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center">
                <CreditCard className="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Stripe</h2>
                <p className="text-xs text-muted-foreground">
                  Plati cu cardul, abonamente recurente, Stripe Connect pentru donatii
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {data.stripeHasKeys && (
                <Badge className="bg-green-100 text-green-700">
                  <CheckCircle2 className="h-3 w-3 mr-1" />Configurat
                </Badge>
              )}
              <button
                onClick={() => updateField("stripeEnabled", !data.stripeEnabled)}
                className="text-muted-foreground hover:text-foreground"
              >
                {data.stripeEnabled ? (
                  <ToggleRight className="h-8 w-8 text-green-600" />
                ) : (
                  <ToggleLeft className="h-8 w-8 text-gray-400" />
                )}
              </button>
            </div>
          </div>

          {data.stripeEnabled && (
            <div className="space-y-4 mt-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
                <Shield className="h-4 w-4 inline mr-1" />
                Stripe este procesatorul principal. Cheile pot fi setate si din variabilele de mediu (STRIPE_SECRET_KEY, etc.)
              </div>

              <div className="space-y-2">
                <Label>Publishable Key (pk_...)</Label>
                <Input
                  value={data.stripePublishableKey}
                  onChange={(e) => updateField("stripePublishableKey", e.target.value)}
                  placeholder="pk_live_... sau pk_test_..."
                  className="font-mono text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label>Secret Key (sk_...)</Label>
                <div className="flex gap-2">
                  <Input
                    type={showKeys.stripeSecretKey ? "text" : "password"}
                    value={data.stripeSecretKey}
                    onChange={(e) => updateField("stripeSecretKey", e.target.value)}
                    placeholder="sk_live_... sau sk_test_..."
                    className="font-mono text-sm"
                  />
                  <Button variant="ghost" size="icon" onClick={() => toggleKey("stripeSecretKey")}>
                    {showKeys.stripeSecretKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Webhook Secret (whsec_...)</Label>
                <div className="flex gap-2">
                  <Input
                    type={showKeys.stripeWebhookSecret ? "text" : "password"}
                    value={data.stripeWebhookSecret}
                    onChange={(e) => updateField("stripeWebhookSecret", e.target.value)}
                    placeholder="whsec_..."
                    className="font-mono text-sm"
                  />
                  <Button variant="ghost" size="icon" onClick={() => toggleKey("stripeWebhookSecret")}>
                    {showKeys.stripeWebhookSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Connect Webhook Secret</Label>
                <div className="flex gap-2">
                  <Input
                    type={showKeys.stripeConnectWebhookSecret ? "text" : "password"}
                    value={data.stripeConnectWebhookSecret}
                    onChange={(e) => updateField("stripeConnectWebhookSecret", e.target.value)}
                    placeholder="whsec_..."
                    className="font-mono text-sm"
                  />
                  <Button variant="ghost" size="icon" onClick={() => toggleKey("stripeConnectWebhookSecret")}>
                    {showKeys.stripeConnectWebhookSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <Button
                onClick={() => handleSave("Stripe", {
                  stripeEnabled: data.stripeEnabled,
                  stripeSecretKey: data.stripeSecretKey,
                  stripePublishableKey: data.stripePublishableKey,
                  stripeWebhookSecret: data.stripeWebhookSecret,
                  stripeConnectWebhookSecret: data.stripeConnectWebhookSecret,
                })}
                disabled={saving === "Stripe"}
              >
                {saving === "Stripe" ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                Salveaza Stripe
              </Button>
            </div>
          )}

          {!data.stripeEnabled && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800 mt-2">
              <AlertTriangle className="h-4 w-4 inline mr-1" />
              Stripe dezactivat. ONG-urile nu vor putea primi donatii cu cardul sau plati abonamente cu cardul.
            </div>
          )}
        </CardContent>
      </Card>

      {/* ─── Netopia ──────────────────────────────────────── */}
      <Card className="border-emerald-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center">
                <Landmark className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Netopia Payments</h2>
                <p className="text-xs text-muted-foreground">
                  Procesor romanesc de plati - card, rate, transfer bancar
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {data.netopiaMerchantId && (
                <Badge className="bg-green-100 text-green-700">
                  <CheckCircle2 className="h-3 w-3 mr-1" />Configurat
                </Badge>
              )}
              <button
                onClick={() => updateField("netopiaEnabled", !data.netopiaEnabled)}
                className="text-muted-foreground hover:text-foreground"
              >
                {data.netopiaEnabled ? (
                  <ToggleRight className="h-8 w-8 text-green-600" />
                ) : (
                  <ToggleLeft className="h-8 w-8 text-gray-400" />
                )}
              </button>
            </div>
          </div>

          {data.netopiaEnabled && (
            <div className="space-y-4 mt-4">
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-sm text-emerald-800">
                <Globe className="h-4 w-4 inline mr-1" />
                Netopia Payments (v2 API) - procesator romanesc. Obtine credentialele din admin.netopia-payments.com
              </div>

              <div className="flex items-center gap-3 mb-2">
                <Label className="text-sm">Mod:</Label>
                <button
                  onClick={() => updateField("netopiaSandbox", !data.netopiaSandbox)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    data.netopiaSandbox
                      ? "bg-yellow-100 text-yellow-700 border border-yellow-300"
                      : "bg-green-100 text-green-700 border border-green-300"
                  }`}
                >
                  {data.netopiaSandbox ? "Sandbox (test)" : "Productie (live)"}
                </button>
              </div>

              <div className="space-y-2">
                <Label>Merchant ID (POS Signature)</Label>
                <Input
                  value={data.netopiaMerchantId}
                  onChange={(e) => updateField("netopiaMerchantId", e.target.value)}
                  placeholder="XXXX-XXXX-XXXX-XXXX-XXXX"
                  className="font-mono text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label>API Key</Label>
                <div className="flex gap-2">
                  <Input
                    type={showKeys.netopiaApiKey ? "text" : "password"}
                    value={data.netopiaApiKey}
                    onChange={(e) => updateField("netopiaApiKey", e.target.value)}
                    placeholder="Cheia API din panoul Netopia"
                    className="font-mono text-sm"
                  />
                  <Button variant="ghost" size="icon" onClick={() => toggleKey("netopiaApiKey")}>
                    {showKeys.netopiaApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label>Cheie publica (PEM)</Label>
                  {data.netopiaHasPublicKey && (
                    <Badge className="bg-green-100 text-green-700 text-[10px]">
                      <CheckCircle2 className="h-3 w-3 mr-1" />Incarcat
                    </Badge>
                  )}
                </div>
                <Textarea
                  value={data.netopiaPublicKey}
                  onChange={(e) => updateField("netopiaPublicKey", e.target.value)}
                  placeholder="-----BEGIN CERTIFICATE-----&#10;...&#10;-----END CERTIFICATE-----"
                  rows={4}
                  className="font-mono text-xs"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label>Cheie privata (PEM)</Label>
                  {data.netopiaHasPrivateKey && (
                    <Badge className="bg-green-100 text-green-700 text-[10px]">
                      <CheckCircle2 className="h-3 w-3 mr-1" />Incarcat
                    </Badge>
                  )}
                </div>
                <Textarea
                  value={data.netopiaPrivateKey}
                  onChange={(e) => updateField("netopiaPrivateKey", e.target.value)}
                  placeholder="-----BEGIN PRIVATE KEY-----&#10;...&#10;-----END PRIVATE KEY-----"
                  rows={4}
                  className="font-mono text-xs"
                />
              </div>

              <div className="space-y-2">
                <Label>IPN Notify URL</Label>
                <Input
                  value={data.netopiaNotifyUrl}
                  onChange={(e) => updateField("netopiaNotifyUrl", e.target.value)}
                  placeholder="https://binevo.ro/api/webhooks/netopia"
                  className="text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  URL-ul la care Netopia trimite notificari IPN. Trebuie configurat si in panoul Netopia.
                </p>
              </div>

              <Button
                onClick={() => handleSave("Netopia", {
                  netopiaEnabled: data.netopiaEnabled,
                  netopiaApiKey: data.netopiaApiKey,
                  netopiaMerchantId: data.netopiaMerchantId,
                  netopiaPublicKey: data.netopiaPublicKey || undefined,
                  netopiaPrivateKey: data.netopiaPrivateKey || undefined,
                  netopiaSandbox: data.netopiaSandbox,
                  netopiaNotifyUrl: data.netopiaNotifyUrl || undefined,
                })}
                disabled={saving === "Netopia"}
              >
                {saving === "Netopia" ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                Salveaza Netopia
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ─── PayPal Platform ──────────────────────────────── */}
      <Card className="border-blue-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                <span className="text-lg font-bold text-blue-600">P</span>
              </div>
              <div>
                <h2 className="text-lg font-semibold">PayPal</h2>
                <p className="text-xs text-muted-foreground">
                  Plati PayPal pentru abonamente si facturi platformei
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {data.paypalHasKeys && (
                <Badge className="bg-green-100 text-green-700">
                  <CheckCircle2 className="h-3 w-3 mr-1" />Configurat
                </Badge>
              )}
              <button
                onClick={() => updateField("paypalPlatformEnabled", !data.paypalPlatformEnabled)}
                className="text-muted-foreground hover:text-foreground"
              >
                {data.paypalPlatformEnabled ? (
                  <ToggleRight className="h-8 w-8 text-green-600" />
                ) : (
                  <ToggleLeft className="h-8 w-8 text-gray-400" />
                )}
              </button>
            </div>
          </div>

          {data.paypalPlatformEnabled && (
            <div className="space-y-4 mt-4">
              <div className="flex items-center gap-3 mb-2">
                <Label className="text-sm">Mod:</Label>
                <button
                  onClick={() => updateField("paypalPlatformSandbox", !data.paypalPlatformSandbox)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    data.paypalPlatformSandbox
                      ? "bg-yellow-100 text-yellow-700 border border-yellow-300"
                      : "bg-green-100 text-green-700 border border-green-300"
                  }`}
                >
                  {data.paypalPlatformSandbox ? "Sandbox (test)" : "Productie (live)"}
                </button>
              </div>

              <div className="space-y-2">
                <Label>Client ID</Label>
                <div className="flex gap-2">
                  <Input
                    type={showKeys.paypalPlatformClientId ? "text" : "password"}
                    value={data.paypalPlatformClientId}
                    onChange={(e) => updateField("paypalPlatformClientId", e.target.value)}
                    placeholder="PayPal Client ID"
                    className="font-mono text-sm"
                  />
                  <Button variant="ghost" size="icon" onClick={() => toggleKey("paypalPlatformClientId")}>
                    {showKeys.paypalPlatformClientId ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Client Secret</Label>
                <div className="flex gap-2">
                  <Input
                    type={showKeys.paypalPlatformSecret ? "text" : "password"}
                    value={data.paypalPlatformSecret}
                    onChange={(e) => updateField("paypalPlatformSecret", e.target.value)}
                    placeholder="PayPal Client Secret"
                    className="font-mono text-sm"
                  />
                  <Button variant="ghost" size="icon" onClick={() => toggleKey("paypalPlatformSecret")}>
                    {showKeys.paypalPlatformSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <Button
                onClick={() => handleSave("PayPal", {
                  paypalPlatformEnabled: data.paypalPlatformEnabled,
                  paypalPlatformClientId: data.paypalPlatformClientId,
                  paypalPlatformSecret: data.paypalPlatformSecret,
                  paypalPlatformSandbox: data.paypalPlatformSandbox,
                })}
                disabled={saving === "PayPal"}
              >
                {saving === "PayPal" ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                Salveaza PayPal
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ─── e-Factura (ANAF SPV) ────────────────────────── */}
      <Card className="border-orange-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center">
                <FileText className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">e-Factura (ANAF SPV)</h2>
                <p className="text-xs text-muted-foreground">
                  Integrare directa cu sistemul e-Factura ANAF pentru facturile generate
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {data.anafIsConnected && (
                <Badge className="bg-green-100 text-green-700">
                  <CheckCircle2 className="h-3 w-3 mr-1" />Conectat ANAF
                </Badge>
              )}
              <button
                onClick={() => updateField("eFacturaEnabled", !data.eFacturaEnabled)}
                className="text-muted-foreground hover:text-foreground"
              >
                {data.eFacturaEnabled ? (
                  <ToggleRight className="h-8 w-8 text-green-600" />
                ) : (
                  <ToggleLeft className="h-8 w-8 text-gray-400" />
                )}
              </button>
            </div>
          </div>

          {data.eFacturaEnabled && (
            <div className="space-y-4 mt-4">
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-sm text-orange-800">
                <FileText className="h-4 w-4 inline mr-1" />
                e-Factura ANAF - trimite facturile electronic direct in SPV.
                Obtine credentialele OAuth2 din portalul ANAF pentru dezvoltatori.
              </div>

              <div className="flex items-center gap-3 mb-2">
                <Label className="text-sm">Mod:</Label>
                <button
                  onClick={() => updateField("anafSandbox", !data.anafSandbox)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    data.anafSandbox
                      ? "bg-yellow-100 text-yellow-700 border border-yellow-300"
                      : "bg-green-100 text-green-700 border border-green-300"
                  }`}
                >
                  {data.anafSandbox ? "Sandbox (test)" : "Productie (live)"}
                </button>
              </div>

              <div className="flex items-center gap-3 mb-2">
                <Label className="text-sm">Trimitere automata:</Label>
                <button
                  onClick={() => updateField("eFacturaAutoSend", !data.eFacturaAutoSend)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    data.eFacturaAutoSend
                      ? "bg-green-100 text-green-700 border border-green-300"
                      : "bg-gray-100 text-gray-600 border border-gray-300"
                  }`}
                >
                  {data.eFacturaAutoSend ? "Da - trimite automat la emitere" : "Nu - trimitere manuala"}
                </button>
              </div>

              <div className="space-y-2">
                <Label>CUI (Cod Unic de Inregistrare)</Label>
                <Input
                  value={data.anafCui}
                  onChange={(e) => updateField("anafCui", e.target.value)}
                  placeholder="12345678"
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  CUI-ul companiei platformei. Trebuie sa coincida cu cel din PlatformBilling.
                </p>
              </div>

              <div className="space-y-2">
                <Label>OAuth2 Client ID</Label>
                <div className="flex gap-2">
                  <Input
                    type={showKeys.anafClientId ? "text" : "password"}
                    value={data.anafClientId}
                    onChange={(e) => updateField("anafClientId", e.target.value)}
                    placeholder="Client ID din ANAF"
                    className="font-mono text-sm"
                  />
                  <Button variant="ghost" size="icon" onClick={() => toggleKey("anafClientId")}>
                    {showKeys.anafClientId ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>OAuth2 Client Secret</Label>
                <div className="flex gap-2">
                  <Input
                    type={showKeys.anafClientSecret ? "text" : "password"}
                    value={data.anafClientSecret}
                    onChange={(e) => updateField("anafClientSecret", e.target.value)}
                    placeholder="Client Secret din ANAF"
                    className="font-mono text-sm"
                  />
                  <Button variant="ghost" size="icon" onClick={() => toggleKey("anafClientSecret")}>
                    {showKeys.anafClientSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Callback URL (OAuth2 Redirect)</Label>
                <Input
                  value={data.anafCallbackUrl}
                  onChange={(e) => updateField("anafCallbackUrl", e.target.value)}
                  placeholder="https://binevo.ro/api/admin/efactura/callback"
                  className="text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  URL-ul de redirect OAuth2. Trebuie inregistrat in aplicatia ANAF.
                </p>
              </div>

              {/* ANAF Connection Status */}
              <div className={`rounded-lg p-4 border ${data.anafIsConnected ? "bg-green-50 border-green-200" : "bg-gray-50 border-gray-200"}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Link2 className={`h-5 w-5 ${data.anafIsConnected ? "text-green-600" : "text-gray-400"}`} />
                    <div>
                      <p className="font-medium text-sm">
                        {data.anafIsConnected ? "Conectat la ANAF SPV" : "Neconectat la ANAF"}
                      </p>
                      {data.anafTokenExpiresAt && (
                        <p className="text-xs text-muted-foreground">
                          Token expira: {new Date(data.anafTokenExpiresAt).toLocaleString("ro-RO")}
                        </p>
                      )}
                    </div>
                  </div>
                  {data.anafClientId && !data.anafClientId.includes("****") && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const callbackUrl = data.anafCallbackUrl || `${window.location.origin}/api/admin/efactura/callback`;
                        const baseUrl = data.anafSandbox
                          ? "https://logincert.anaf.ro/anaf-oauth2/v1"
                          : "https://logincert.anaf.ro/anaf-oauth2/v1";
                        const params = new URLSearchParams({
                          response_type: "code",
                          client_id: data.anafClientId,
                          redirect_uri: callbackUrl,
                          token_content_type: "jwt",
                        });
                        window.location.href = `${baseUrl}/authorize?${params.toString()}`;
                      }}
                    >
                      <ExternalLink className="h-4 w-4 mr-1" />
                      {data.anafIsConnected ? "Reconecteaza" : "Conecteaza la ANAF"}
                    </Button>
                  )}
                </div>
              </div>

              <Button
                onClick={() => handleSave("e-Factura", {
                  eFacturaEnabled: data.eFacturaEnabled,
                  eFacturaAutoSend: data.eFacturaAutoSend,
                  anafClientId: data.anafClientId,
                  anafClientSecret: data.anafClientSecret,
                  anafSandbox: data.anafSandbox,
                  anafCui: data.anafCui,
                  anafCallbackUrl: data.anafCallbackUrl || undefined,
                })}
                disabled={saving === "e-Factura"}
              >
                {saving === "e-Factura" ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                Salveaza e-Factura
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ─── Status Overview ──────────────────────────────── */}
      <Card>
        <CardContent className="p-6">
          <h2 className="text-lg font-semibold mb-4">Status procesatoare</h2>
          <div className="grid gap-3 sm:grid-cols-4">
            <div className={`flex items-center gap-3 p-3 rounded-lg border ${data.stripeEnabled ? "bg-green-50 border-green-200" : "bg-gray-50 border-gray-200"}`}>
              <CreditCard className={`h-5 w-5 ${data.stripeEnabled ? "text-green-600" : "text-gray-400"}`} />
              <div>
                <p className="font-medium text-sm">Stripe</p>
                <p className="text-xs text-muted-foreground">{data.stripeEnabled ? "Activ" : "Dezactivat"}</p>
              </div>
            </div>
            <div className={`flex items-center gap-3 p-3 rounded-lg border ${data.netopiaEnabled ? "bg-green-50 border-green-200" : "bg-gray-50 border-gray-200"}`}>
              <Landmark className={`h-5 w-5 ${data.netopiaEnabled ? "text-green-600" : "text-gray-400"}`} />
              <div>
                <p className="font-medium text-sm">Netopia</p>
                <p className="text-xs text-muted-foreground">
                  {data.netopiaEnabled ? (data.netopiaSandbox ? "Sandbox" : "Productie") : "Dezactivat"}
                </p>
              </div>
            </div>
            <div className={`flex items-center gap-3 p-3 rounded-lg border ${data.paypalPlatformEnabled ? "bg-green-50 border-green-200" : "bg-gray-50 border-gray-200"}`}>
              <span className={`text-lg font-bold ${data.paypalPlatformEnabled ? "text-green-600" : "text-gray-400"}`}>P</span>
              <div>
                <p className="font-medium text-sm">PayPal</p>
                <p className="text-xs text-muted-foreground">
                  {data.paypalPlatformEnabled ? (data.paypalPlatformSandbox ? "Sandbox" : "Productie") : "Dezactivat"}
                </p>
              </div>
            </div>
            <div className={`flex items-center gap-3 p-3 rounded-lg border ${data.eFacturaEnabled ? "bg-green-50 border-green-200" : "bg-gray-50 border-gray-200"}`}>
              <FileText className={`h-5 w-5 ${data.eFacturaEnabled ? "text-green-600" : "text-gray-400"}`} />
              <div>
                <p className="font-medium text-sm">e-Factura</p>
                <p className="text-xs text-muted-foreground">
                  {data.eFacturaEnabled ? (data.anafIsConnected ? "Conectat ANAF" : "Neconectat") : "Dezactivat"}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

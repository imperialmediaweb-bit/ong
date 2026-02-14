"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  MessageSquare, Save, Send, Eye, EyeOff, CheckCircle2, XCircle,
  Loader2, Smartphone, Shield, Settings2, AlertTriangle, Phone,
} from "lucide-react";

interface SmsConfig {
  smsProvider: string;
  twilioSid: string;
  twilioToken: string;
  twilioPhone: string;
  _hasTwilioSid?: boolean;
  _hasTwilioToken?: boolean;
}

const defaultConfig: SmsConfig = {
  smsProvider: "twilio",
  twilioSid: "",
  twilioToken: "",
  twilioPhone: "",
};

const providers = [
  {
    id: "twilio",
    name: "Twilio",
    description: "Cel mai popular serviciu SMS - Romania si international",
    icon: Phone,
    color: "red",
    recommended: true,
  },
  {
    id: "telnyx",
    name: "Telnyx",
    description: "Alternativa ieftina - ideal pentru volum mare",
    icon: MessageSquare,
    color: "green",
    recommended: false,
  },
];

export default function AdminSmsPage() {
  const [config, setConfig] = useState<SmsConfig>(defaultConfig);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testPhone, setTestPhone] = useState("");
  const [testResult, setTestResult] = useState<{ success: boolean; error?: string; provider?: string } | null>(null);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/sms-config");
      if (!res.ok) throw new Error("Eroare la incarcare");
      const data = await res.json();
      setConfig({ ...defaultConfig, ...data });
    } catch {
      setError("Eroare la incarcarea configuratiei");
    } finally {
      setLoading(false);
    }
  };

  const showMsg = (type: "success" | "error", msg: string) => {
    if (type === "success") {
      setSuccess(msg);
      setError("");
    } else {
      setError(msg);
      setSuccess("");
    }
    setTimeout(() => { setSuccess(""); setError(""); }, 5000);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/sms-config", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      if (!res.ok) throw new Error("Eroare la salvare");
      showMsg("success", "Configuratia SMS a fost salvata cu succes!");
    } catch {
      showMsg("error", "Eroare la salvarea configuratiei");
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    if (!testPhone || testPhone.length < 8) {
      showMsg("error", "Introduceti un numar de telefon valid pentru test");
      return;
    }
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch("/api/admin/sms-config/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...config, testPhone }),
      });
      const result = await res.json();
      setTestResult(result);
      if (result.success) {
        showMsg("success", `SMS de test trimis cu succes via ${result.provider}!`);
      } else {
        showMsg("error", result.error || "Eroare la trimiterea SMS-ului de test");
      }
    } catch {
      showMsg("error", "Eroare la testare");
    } finally {
      setTesting(false);
    }
  };

  const updateField = (field: keyof SmsConfig, value: string) => {
    setConfig((prev) => ({ ...prev, [field]: value }));
  };

  const togglePassword = (field: string) => {
    setShowPasswords((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const isConfigured = () => {
    return !!(config.twilioSid || config._hasTwilioSid) && !!(config.twilioToken || config._hasTwilioToken) && !!config.twilioPhone;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <MessageSquare className="h-7 w-7 text-green-600" />
          <div>
            <h1 className="text-3xl font-bold">Configurare SMS</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Configureaza provider-ul SMS pentru notificari si campanii
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isConfigured() ? (
            <Badge className="bg-green-100 text-green-800">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Configurat
            </Badge>
          ) : (
            <Badge className="bg-amber-100 text-amber-800">
              <AlertTriangle className="h-3 w-3 mr-1" />
              Neconfigurat
            </Badge>
          )}
          <Button onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Se salveaza..." : "Salveaza"}
          </Button>
        </div>
      </div>

      {/* Messages */}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 p-3 rounded-lg text-sm flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
          {success}
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-sm flex items-center gap-2">
          <XCircle className="h-4 w-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Provider Selection */}
      <Card>
        <CardContent className="p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Settings2 className="h-5 w-5" />
            Provider SMS activ
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {providers.map((p) => (
              <div
                key={p.id}
                className={`relative p-4 rounded-xl border-2 text-left ${
                  config.smsProvider === p.id
                    ? "border-green-500 bg-green-50 shadow-md"
                    : "border-slate-200 bg-slate-50"
                }`}
              >
                {p.recommended && (
                  <Badge className="absolute -top-2 right-2 bg-green-600 text-white text-[10px]">
                    Recomandat
                  </Badge>
                )}
                <div className="flex items-center gap-3 mb-2">
                  <p.icon className={`h-5 w-5 ${
                    config.smsProvider === p.id ? "text-green-600" : "text-slate-400"
                  }`} />
                  <span className="font-semibold">{p.name}</span>
                </div>
                <p className="text-xs text-muted-foreground">{p.description}</p>
                <p className="text-[10px] text-muted-foreground mt-2">
                  Setat via variabila de mediu SMS_PROVIDER
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Twilio Configuration */}
      <Card className="border-green-200">
        <CardContent className="p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Phone className="h-5 w-5 text-green-600" />
            Credentiale Twilio (Platform-level)
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            Aceste credentiale sunt folosite la nivel de platforma. ONG-urile pot configura propriile lor credentiale Twilio din setarile lor.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Account SID *</Label>
              <div className="flex gap-2">
                <Input
                  type={showPasswords.twilioSid ? "text" : "password"}
                  value={config.twilioSid}
                  onChange={(e) => updateField("twilioSid", e.target.value)}
                  placeholder="ACxxxxxxxxx..."
                  className="font-mono text-sm"
                />
                <Button variant="ghost" size="icon" onClick={() => togglePassword("twilioSid")}>
                  {showPasswords.twilioSid ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Auth Token *</Label>
              <div className="flex gap-2">
                <Input
                  type={showPasswords.twilioToken ? "text" : "password"}
                  value={config.twilioToken}
                  onChange={(e) => updateField("twilioToken", e.target.value)}
                  placeholder="••••••••"
                  className="font-mono text-sm"
                />
                <Button variant="ghost" size="icon" onClick={() => togglePassword("twilioToken")}>
                  {showPasswords.twilioToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Numar de telefon Twilio *</Label>
              <Input
                value={config.twilioPhone}
                onChange={(e) => updateField("twilioPhone", e.target.value)}
                placeholder="+40xxxxxxxxx"
              />
              <p className="text-xs text-muted-foreground">
                Numarul de telefon Twilio de pe care se trimit SMS-urile (format international: +40...)
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SMS Pricing Info */}
      <Card>
        <CardContent className="p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-600" />
            Informatii SMS Romania
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-red-50 border border-red-100">
              <p className="font-semibold text-sm text-red-900">Twilio</p>
              <p className="text-2xl font-bold text-red-700 mt-1">~0.34 RON</p>
              <p className="text-xs text-red-600 mt-1">per SMS Romania ($0.0737)</p>
            </div>
            <div className="p-4 rounded-lg bg-green-50 border border-green-100">
              <p className="font-semibold text-sm text-green-900">Telnyx</p>
              <p className="text-2xl font-bold text-green-700 mt-1">~0.02 RON</p>
              <p className="text-xs text-green-600 mt-1">per SMS Romania ($0.004)</p>
            </div>
            <div className="p-4 rounded-lg bg-blue-50 border border-blue-100">
              <p className="font-semibold text-sm text-blue-900">Infobip</p>
              <p className="text-2xl font-bold text-blue-700 mt-1">~0.28 RON</p>
              <p className="text-xs text-blue-600 mt-1">per SMS Romania ($0.06)</p>
            </div>
          </div>
          <div className="mt-4 p-3 rounded-lg bg-amber-50 border border-amber-200">
            <p className="text-sm text-amber-800">
              <strong>Conformitate SMS Romania:</strong> Toate SMS-urile includ automat instructiuni de dezabonare
              (&quot;Reply STOP to unsubscribe&quot;). Respectam regulamentul ANCOM si GDPR.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Test SMS */}
      <Card className="border-green-200">
        <CardContent className="p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Send className="h-5 w-5 text-green-600" />
            Trimite SMS de Test
          </h2>
          <div className="flex gap-3">
            <Input
              type="tel"
              value={testPhone}
              onChange={(e) => setTestPhone(e.target.value)}
              placeholder="+40712345678"
              className="max-w-sm"
            />
            <Button
              onClick={handleTest}
              disabled={testing || !testPhone}
              variant="outline"
              className="border-green-300 text-green-700 hover:bg-green-50"
            >
              {testing ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Smartphone className="h-4 w-4 mr-2" />
              )}
              {testing ? "Se trimite..." : "Trimite test SMS"}
            </Button>
          </div>
          {testResult && (
            <div className={`mt-3 p-3 rounded-lg text-sm flex items-center gap-2 ${
              testResult.success
                ? "bg-green-50 border border-green-200 text-green-700"
                : "bg-red-50 border border-red-200 text-red-700"
            }`}>
              {testResult.success ? (
                <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
              ) : (
                <XCircle className="h-4 w-4 flex-shrink-0" />
              )}
              {testResult.success
                ? `SMS trimis cu succes via ${testResult.provider}!`
                : `Eroare: ${testResult.error}`
              }
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bottom Save Button */}
      <div className="flex justify-end gap-3">
        <Button onClick={handleSave} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? "Se salveaza..." : "Salveaza configuratia"}
        </Button>
      </div>
    </div>
  );
}

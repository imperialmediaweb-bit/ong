"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Mail, Save, Send, Eye, EyeOff, CheckCircle2, XCircle,
  Loader2, Server, Shield, Bell, FileText, Settings2,
  AlertTriangle,
} from "lucide-react";

interface EmailConfig {
  emailProvider: string;
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPassword: string;
  smtpEncryption: string;
  smtpFromEmail: string;
  smtpFromName: string;
  smtpReplyTo: string;
  sendgridApiKey: string;
  mailgunApiKey: string;
  mailgunDomain: string;
  mailgunRegion: string;
  notifyOnRegistration: boolean;
  notifyOnVerification: boolean;
  notifyOnSubscription: boolean;
  notifyOnDonation: boolean;
  notifyOnInvoice: boolean;
  notifyWelcomeEmail: boolean;
  invoicePrefix: string;
  invoiceNextNumber: number;
  _hasSmtpPassword?: boolean;
  _hasSendgridKey?: boolean;
  _hasMailgunKey?: boolean;
}

const defaultConfig: EmailConfig = {
  emailProvider: "smtp",
  smtpHost: "",
  smtpPort: 587,
  smtpUser: "",
  smtpPassword: "",
  smtpEncryption: "tls",
  smtpFromEmail: "",
  smtpFromName: "Binevo",
  smtpReplyTo: "",
  sendgridApiKey: "",
  mailgunApiKey: "",
  mailgunDomain: "",
  mailgunRegion: "eu",
  notifyOnRegistration: true,
  notifyOnVerification: true,
  notifyOnSubscription: true,
  notifyOnDonation: true,
  notifyOnInvoice: true,
  notifyWelcomeEmail: true,
  invoicePrefix: "BNV",
  invoiceNextNumber: 1,
};

const providers = [
  {
    id: "smtp",
    name: "SMTP Generic",
    description: "Mailgun SMTP, Gmail, Outlook, orice server SMTP",
    icon: Server,
    color: "blue",
    recommended: true,
  },
  {
    id: "sendgrid",
    name: "SendGrid API",
    description: "API direct SendGrid - tracking avansat",
    icon: Send,
    color: "purple",
    recommended: false,
  },
  {
    id: "mailgun",
    name: "Mailgun API",
    description: "API Mailgun - ieftin, ideal pentru tranzactionale",
    icon: Mail,
    color: "orange",
    recommended: false,
  },
];

const smtpPresets = [
  { name: "Mailgun EU", host: "smtp.eu.mailgun.org", port: 587, encryption: "tls" },
  { name: "Mailgun US", host: "smtp.mailgun.org", port: 587, encryption: "tls" },
  { name: "Gmail", host: "smtp.gmail.com", port: 587, encryption: "tls" },
  { name: "Outlook/O365", host: "smtp.office365.com", port: 587, encryption: "tls" },
  { name: "Brevo (Sendinblue)", host: "smtp-relay.brevo.com", port: 587, encryption: "tls" },
  { name: "Amazon SES EU", host: "email-smtp.eu-west-1.amazonaws.com", port: 587, encryption: "tls" },
  { name: "Zoho Mail", host: "smtp.zoho.eu", port: 587, encryption: "tls" },
  { name: "Postmark", host: "smtp.postmarkapp.com", port: 587, encryption: "tls" },
];

export default function AdminEmailPage() {
  const [config, setConfig] = useState<EmailConfig>(defaultConfig);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testEmail, setTestEmail] = useState("");
  const [testResult, setTestResult] = useState<{ success: boolean; error?: string; provider?: string } | null>(null);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  const [activeTab, setActiveTab] = useState<"provider" | "notifications" | "invoices">("provider");

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/email-config");
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
      const res = await fetch("/api/admin/email-config", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      if (!res.ok) throw new Error("Eroare la salvare");
      showMsg("success", "Configuratia email a fost salvata cu succes!");
    } catch {
      showMsg("error", "Eroare la salvarea configuratiei");
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    if (!testEmail || !testEmail.includes("@")) {
      showMsg("error", "Introduceti o adresa email valida pentru test");
      return;
    }
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch("/api/admin/email-config/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...config, testEmail }),
      });
      const result = await res.json();
      setTestResult(result);
      if (result.success) {
        showMsg("success", `Email de test trimis cu succes via ${result.provider}!`);
      } else {
        showMsg("error", result.error || "Eroare la trimiterea email-ului de test");
      }
    } catch {
      showMsg("error", "Eroare la testare");
    } finally {
      setTesting(false);
    }
  };

  const updateField = (field: keyof EmailConfig, value: string | number | boolean) => {
    setConfig((prev) => ({ ...prev, [field]: value }));
  };

  const applyPreset = (preset: typeof smtpPresets[0]) => {
    setConfig((prev) => ({
      ...prev,
      smtpHost: preset.host,
      smtpPort: preset.port,
      smtpEncryption: preset.encryption,
    }));
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
    switch (config.emailProvider) {
      case "smtp":
        return !!(config.smtpHost && config.smtpUser && (config.smtpPassword || config._hasSmtpPassword));
      case "sendgrid":
        return !!(config.sendgridApiKey || config._hasSendgridKey);
      case "mailgun":
        return !!((config.mailgunApiKey || config._hasMailgunKey) && config.mailgunDomain);
      default:
        return false;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Mail className="h-7 w-7 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold">Email &amp; Notificari</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Configureaza sender-ul de email pentru notificari, facturi si comunicari automate
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

      {/* Tabs */}
      <div className="flex gap-1 bg-muted p-1 rounded-lg w-fit">
        {[
          { id: "provider" as const, label: "Provider Email", icon: Server },
          { id: "notifications" as const, label: "Notificari", icon: Bell },
          { id: "invoices" as const, label: "Facturi", icon: FileText },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab: Provider Email */}
      {activeTab === "provider" && (
        <div className="space-y-6">
          {/* Provider Selection */}
          <Card>
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Settings2 className="h-5 w-5" />
                Alege provider-ul de email
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {providers.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => updateField("emailProvider", p.id)}
                    className={`relative p-4 rounded-xl border-2 text-left transition-all ${
                      config.emailProvider === p.id
                        ? "border-blue-500 bg-blue-50 shadow-md"
                        : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    {p.recommended && (
                      <Badge className="absolute -top-2 right-2 bg-green-600 text-white text-[10px]">
                        Recomandat
                      </Badge>
                    )}
                    <div className="flex items-center gap-3 mb-2">
                      <p.icon className={`h-5 w-5 ${
                        config.emailProvider === p.id ? "text-blue-600" : "text-slate-400"
                      }`} />
                      <span className="font-semibold">{p.name}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{p.description}</p>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* SMTP Configuration */}
          {config.emailProvider === "smtp" && (
            <Card className="border-blue-200">
              <CardContent className="p-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Server className="h-5 w-5 text-blue-600" />
                  Configurare SMTP
                </h2>

                {/* Presets */}
                <div className="mb-6">
                  <Label className="text-sm text-muted-foreground mb-2 block">Presete rapide:</Label>
                  <div className="flex flex-wrap gap-2">
                    {smtpPresets.map((preset) => (
                      <button
                        key={preset.name}
                        onClick={() => applyPreset(preset)}
                        className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${
                          config.smtpHost === preset.host
                            ? "bg-blue-100 border-blue-300 text-blue-700"
                            : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        {preset.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>SMTP Host *</Label>
                    <Input
                      value={config.smtpHost}
                      onChange={(e) => updateField("smtpHost", e.target.value)}
                      placeholder="smtp.eu.mailgun.org"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Port *</Label>
                    <Input
                      type="number"
                      value={config.smtpPort}
                      onChange={(e) => updateField("smtpPort", parseInt(e.target.value) || 587)}
                      placeholder="587"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Utilizator SMTP *</Label>
                    <Input
                      value={config.smtpUser}
                      onChange={(e) => updateField("smtpUser", e.target.value)}
                      placeholder="postmaster@mg.binevo.ro"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Parola SMTP *</Label>
                    <div className="flex gap-2">
                      <Input
                        type={showPasswords.smtpPassword ? "text" : "password"}
                        value={config.smtpPassword}
                        onChange={(e) => updateField("smtpPassword", e.target.value)}
                        placeholder="••••••••"
                        className="font-mono text-sm"
                      />
                      <Button variant="ghost" size="icon" onClick={() => togglePassword("smtpPassword")}>
                        {showPasswords.smtpPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Criptare</Label>
                    <div className="flex gap-2">
                      {["tls", "ssl", "none"].map((enc) => (
                        <button
                          key={enc}
                          onClick={() => updateField("smtpEncryption", enc)}
                          className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                            config.smtpEncryption === enc
                              ? "bg-blue-100 border-blue-300 text-blue-700"
                              : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                          }`}
                        >
                          {enc.toUpperCase()}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* SendGrid Configuration */}
          {config.emailProvider === "sendgrid" && (
            <Card className="border-purple-200">
              <CardContent className="p-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Send className="h-5 w-5 text-purple-600" />
                  Configurare SendGrid
                </h2>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>SendGrid API Key *</Label>
                    <div className="flex gap-2">
                      <Input
                        type={showPasswords.sendgridApiKey ? "text" : "password"}
                        value={config.sendgridApiKey}
                        onChange={(e) => updateField("sendgridApiKey", e.target.value)}
                        placeholder="SG.xxxx..."
                        className="font-mono text-sm"
                      />
                      <Button variant="ghost" size="icon" onClick={() => togglePassword("sendgridApiKey")}>
                        {showPasswords.sendgridApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Obtine cheia de la app.sendgrid.com &gt; Settings &gt; API Keys
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Mailgun Configuration */}
          {config.emailProvider === "mailgun" && (
            <Card className="border-orange-200">
              <CardContent className="p-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Mail className="h-5 w-5 text-orange-600" />
                  Configurare Mailgun
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Mailgun API Key *</Label>
                    <div className="flex gap-2">
                      <Input
                        type={showPasswords.mailgunApiKey ? "text" : "password"}
                        value={config.mailgunApiKey}
                        onChange={(e) => updateField("mailgunApiKey", e.target.value)}
                        placeholder="key-xxxx..."
                        className="font-mono text-sm"
                      />
                      <Button variant="ghost" size="icon" onClick={() => togglePassword("mailgunApiKey")}>
                        {showPasswords.mailgunApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Domain *</Label>
                    <Input
                      value={config.mailgunDomain}
                      onChange={(e) => updateField("mailgunDomain", e.target.value)}
                      placeholder="mg.binevo.ro"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Regiune</Label>
                    <div className="flex gap-2">
                      {[
                        { id: "eu", label: "Europa (EU)" },
                        { id: "us", label: "SUA (US)" },
                      ].map((r) => (
                        <button
                          key={r.id}
                          onClick={() => updateField("mailgunRegion", r.id)}
                          className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                            config.mailgunRegion === r.id
                              ? "bg-orange-100 border-orange-300 text-orange-700"
                              : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                          }`}
                        >
                          {r.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-3">
                  Obtine cheile de la app.mailgun.com. Mailgun EU este ideal pentru GDPR.
                  Pretul incepe de la $0.80/1000 emailuri.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Sender Identity */}
          <Card>
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Shield className="h-5 w-5 text-green-600" />
                Identitate Expeditor
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Email expeditor *</Label>
                  <Input
                    type="email"
                    value={config.smtpFromEmail}
                    onChange={(e) => updateField("smtpFromEmail", e.target.value)}
                    placeholder="noreply@binevo.ro"
                  />
                  <p className="text-xs text-muted-foreground">
                    Adresa de la care se trimit toate notificarile platformei
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Numele expeditorului</Label>
                  <Input
                    value={config.smtpFromName}
                    onChange={(e) => updateField("smtpFromName", e.target.value)}
                    placeholder="Binevo"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Reply-To (optional)</Label>
                  <Input
                    type="email"
                    value={config.smtpReplyTo}
                    onChange={(e) => updateField("smtpReplyTo", e.target.value)}
                    placeholder="support@binevo.ro"
                  />
                  <p className="text-xs text-muted-foreground">
                    Adresa la care utilizatorii pot raspunde (diferita de expeditor)
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Test Email */}
          <Card className="border-green-200">
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Send className="h-5 w-5 text-green-600" />
                Trimite Email de Test
              </h2>
              <div className="flex gap-3">
                <Input
                  type="email"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  placeholder="adresa@test.com"
                  className="max-w-sm"
                />
                <Button
                  onClick={handleTest}
                  disabled={testing || !testEmail}
                  variant="outline"
                  className="border-green-300 text-green-700 hover:bg-green-50"
                >
                  {testing ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4 mr-2" />
                  )}
                  {testing ? "Se trimite..." : "Trimite test"}
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
                    ? `Email trimis cu succes via ${testResult.provider}!`
                    : `Eroare: ${testResult.error}`
                  }
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tab: Notifications */}
      {activeTab === "notifications" && (
        <div className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold mb-2 flex items-center gap-2">
                <Bell className="h-5 w-5 text-blue-600" />
                Notificari Automate
              </h2>
              <p className="text-sm text-muted-foreground mb-6">
                Selecteaza ce notificari email sa se trimita automat de pe platforma
              </p>

              <div className="space-y-4">
                {[
                  {
                    field: "notifyWelcomeEmail" as const,
                    label: "Email de bun venit",
                    desc: "Trimite email de bun venit cand un utilizator nou se inregistreaza pe platforma",
                    icon: "👋",
                  },
                  {
                    field: "notifyOnRegistration" as const,
                    label: "Inregistrare ONG nou",
                    desc: "Notifica adminii cand un ONG nou se inregistreaza pe platforma",
                    icon: "🏢",
                  },
                  {
                    field: "notifyOnVerification" as const,
                    label: "Schimbare status verificare",
                    desc: "Email catre ONG cand statusul verificarii se schimba (aprobat/respins)",
                    icon: "✅",
                  },
                  {
                    field: "notifyOnSubscription" as const,
                    label: "Schimbare abonament",
                    desc: "Notifica ONG-ul la activare, expirare sau reinnoire abonament",
                    icon: "💳",
                  },
                  {
                    field: "notifyOnDonation" as const,
                    label: "Donatie noua",
                    desc: "Confirmare email la fiecare donatie noua primita",
                    icon: "💰",
                  },
                  {
                    field: "notifyOnInvoice" as const,
                    label: "Facturi automate",
                    desc: "Trimite factura automat dupa fiecare plata sau abonament",
                    icon: "🧾",
                  },
                ].map((item) => (
                  <div
                    key={item.field}
                    className={`flex items-center justify-between p-4 rounded-xl border transition-colors ${
                      config[item.field]
                        ? "bg-blue-50 border-blue-200"
                        : "bg-slate-50 border-slate-200"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{item.icon}</span>
                      <div>
                        <p className="font-medium">{item.label}</p>
                        <p className="text-xs text-muted-foreground">{item.desc}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => updateField(item.field, !config[item.field])}
                      className={`relative w-12 h-6 rounded-full transition-colors ${
                        config[item.field] ? "bg-blue-600" : "bg-slate-300"
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                          config[item.field] ? "translate-x-6" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Email Preview Info */}
          <Card>
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold mb-4">Tipuri de emailuri trimise</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  { type: "Bun venit", desc: "Email de bun venit cu ghid de utilizare", when: "La inregistrare utilizator" },
                  { type: "Verificare ONG", desc: "Notificare aprobare/respingere verificare", when: "La schimbare status" },
                  { type: "Abonament activat", desc: "Confirmare plan nou cu detalii", when: "La atribuire plan" },
                  { type: "Abonament expira", desc: "Avertizare cu 7 zile inainte", when: "Automat - cron job" },
                  { type: "Abonament expirat", desc: "Notificare downgrade la BASIC", when: "Automat - cron job" },
                  { type: "Confirmare donatie", desc: "Multumire + detalii donatie", when: "La fiecare donatie" },
                  { type: "Factura", desc: "Factura PDF atasata", when: "Dupa plata abonament" },
                  { type: "Resetare parola", desc: "Link securizat resetare", when: "La cererea utilizatorului" },
                ].map((t) => (
                  <div key={t.type} className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                    <p className="font-medium text-sm">{t.type}</p>
                    <p className="text-xs text-muted-foreground">{t.desc}</p>
                    <p className="text-xs text-blue-600 mt-1">{t.when}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tab: Invoices */}
      {activeTab === "invoices" && (
        <div className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold mb-2 flex items-center gap-2">
                <FileText className="h-5 w-5 text-purple-600" />
                Configurare Facturi
              </h2>
              <p className="text-sm text-muted-foreground mb-6">
                Seteaza prefixul si numerotarea facturilor generate automat
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Prefix factura</Label>
                  <Input
                    value={config.invoicePrefix}
                    onChange={(e) => updateField("invoicePrefix", e.target.value.toUpperCase())}
                    placeholder="BNV"
                    maxLength={10}
                  />
                  <p className="text-xs text-muted-foreground">
                    Ex: BNV-0001, BNV-0002, etc.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Urmatorul numar factura</Label>
                  <Input
                    type="number"
                    value={config.invoiceNextNumber}
                    onChange={(e) => updateField("invoiceNextNumber", parseInt(e.target.value) || 1)}
                    min={1}
                  />
                  <p className="text-xs text-muted-foreground">
                    Numarul urmei facturi care va fi generata
                  </p>
                </div>
              </div>

              {/* Preview */}
              <div className="mt-6 p-4 bg-slate-50 border border-slate-200 rounded-xl">
                <p className="text-sm text-muted-foreground mb-2">Previzualizare numar factura:</p>
                <p className="text-2xl font-mono font-bold text-slate-700">
                  {config.invoicePrefix}-{String(config.invoiceNextNumber).padStart(4, "0")}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Invoice Automation Info */}
          <Card>
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold mb-4">Automatizare Facturi</h2>
              <div className="space-y-3">
                <div className="p-3 rounded-lg bg-blue-50 border border-blue-100">
                  <p className="font-medium text-sm text-blue-900">Facturi pentru abonamente</p>
                  <p className="text-xs text-blue-700 mt-1">
                    La fiecare plata de abonament (PRO/ELITE), o factura se genereaza si trimite automat.
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-green-50 border border-green-100">
                  <p className="font-medium text-sm text-green-900">Confirmari donatii</p>
                  <p className="text-xs text-green-700 mt-1">
                    Donatia de peste un anumit prag genereaza automat un document fiscal.
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-purple-50 border border-purple-100">
                  <p className="font-medium text-sm text-purple-900">Export rapoarte</p>
                  <p className="text-xs text-purple-700 mt-1">
                    Rapoartele lunare se trimit automat catre administratorii ONG-urilor active.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

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

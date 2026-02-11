"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Settings, Save, Key, Eye, EyeOff, CheckCircle2, XCircle, Zap, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface PlatformSettings {
  name: string;
  description: string;
  logoUrl: string;
  primaryColor: string;
  heroTitle: string;
  heroSubtitle: string;
  ctaButtonText: string;
  statsEnabled: boolean;
  contactEmail: string;
  footerText: string;
  facebookUrl: string;
  linkedinUrl: string;
  twitterUrl: string;
  instagramUrl: string;
  openaiApiKey: string;
  anthropicApiKey: string;
  googleAiApiKey: string;
  sendgridApiKey: string;
  twilioSid: string;
  twilioToken: string;
  twilioPhone: string;
}

const defaultSettings: PlatformSettings = {
  name: "",
  description: "",
  logoUrl: "",
  primaryColor: "#3b82f6",
  heroTitle: "",
  heroSubtitle: "",
  ctaButtonText: "",
  statsEnabled: true,
  contactEmail: "",
  footerText: "",
  facebookUrl: "",
  linkedinUrl: "",
  twitterUrl: "",
  instagramUrl: "",
  openaiApiKey: "",
  anthropicApiKey: "",
  googleAiApiKey: "",
  sendgridApiKey: "",
  twilioSid: "",
  twilioToken: "",
  twilioPhone: "",
};

export default function AdminSettingsPage() {
  const [data, setData] = useState<PlatformSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingKeys, setSavingKeys] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [testingKeys, setTestingKeys] = useState(false);
  const [testResults, setTestResults] = useState<Record<string, { status: string; error?: string; model?: string }> | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/platform");
      if (!res.ok) throw new Error("Eroare la incarcare");
      const result = await res.json();
      const settings = result.settings || result;
      setData({
        name: settings.name || settings.siteName || "",
        description: settings.description || settings.siteDescription || "",
        logoUrl: settings.logoUrl || "",
        primaryColor: settings.primaryColor || "#3b82f6",
        heroTitle: settings.heroTitle || "",
        heroSubtitle: settings.heroSubtitle || "",
        ctaButtonText: settings.ctaButtonText || settings.heroCtaText || "",
        statsEnabled: settings.statsEnabled ?? true,
        contactEmail: settings.contactEmail || "",
        footerText: settings.footerText || "",
        facebookUrl: settings.facebookUrl || (settings.socialLinks as any)?.facebook || "",
        linkedinUrl: settings.linkedinUrl || (settings.socialLinks as any)?.linkedin || "",
        twitterUrl: settings.twitterUrl || (settings.socialLinks as any)?.twitter || "",
        instagramUrl: settings.instagramUrl || (settings.socialLinks as any)?.instagram || "",
        openaiApiKey: settings.openaiApiKey || "",
        anthropicApiKey: settings.anthropicApiKey || "",
        googleAiApiKey: settings.googleAiApiKey || "",
        sendgridApiKey: settings.sendgridApiKey || "",
        twilioSid: settings.twilioSid || "",
        twilioToken: settings.twilioToken || "",
        twilioPhone: settings.twilioPhone || "",
      });
    } catch (err) {
      console.error(err);
      setError("Eroare la incarcarea setarilor");
    } finally {
      setLoading(false);
    }
  };

  const showSuccess = (msg: string) => {
    setSuccess(msg);
    setError("");
    setTimeout(() => setSuccess(""), 3000);
  };

  const showError = (msg: string) => {
    setError(msg);
    setSuccess("");
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        siteName: data.name,
        siteDescription: data.description,
        logoUrl: data.logoUrl,
        primaryColor: data.primaryColor,
        heroTitle: data.heroTitle,
        heroSubtitle: data.heroSubtitle,
        heroCtaText: data.ctaButtonText,
        statsEnabled: data.statsEnabled,
        contactEmail: data.contactEmail,
        footerText: data.footerText,
        socialLinks: {
          facebook: data.facebookUrl,
          linkedin: data.linkedinUrl,
          twitter: data.twitterUrl,
          instagram: data.instagramUrl,
        },
      };
      const res = await fetch("/api/admin/platform", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Eroare la salvare");
      showSuccess("Setarile au fost salvate cu succes");
    } catch {
      showError("Eroare la salvarea setarilor");
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field: keyof PlatformSettings, value: string | boolean) => {
    setData((prev) => ({ ...prev, [field]: value }));
  };

  const toggleKeyVisibility = (field: string) => {
    setShowKeys((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const handleSaveApiKeys = async () => {
    setSavingKeys(true);
    try {
      const res = await fetch("/api/admin/platform", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          openaiApiKey: data.openaiApiKey,
          anthropicApiKey: data.anthropicApiKey,
          googleAiApiKey: data.googleAiApiKey,
          sendgridApiKey: data.sendgridApiKey,
          twilioSid: data.twilioSid,
          twilioToken: data.twilioToken,
          twilioPhone: data.twilioPhone,
        }),
      });
      if (!res.ok) throw new Error("Eroare la salvare");
      showSuccess("Cheile API au fost salvate cu succes");
    } catch {
      showError("Eroare la salvarea cheilor API");
    } finally {
      setSavingKeys(false);
    }
  };

  const handleTestApiKeys = async () => {
    setTestingKeys(true);
    setTestResults(null);
    try {
      const res = await fetch("/api/admin/test-ai", { method: "POST" });
      const result = await res.json();
      if (result.results) {
        setTestResults(result.results);
        if (result.workingProviders?.length > 0) {
          showSuccess(`Test reusit! Provideri activi: ${result.workingProviders.join(", ")}`);
        } else {
          showError("Niciun provider AI nu functioneaza. Verificati cheile.");
        }
      } else {
        showError(result.error || "Eroare la testare");
      }
    } catch {
      showError("Eroare la testarea cheilor API");
    } finally {
      setTestingKeys(false);
    }
  };

  const maskKey = (key: string) => {
    if (!key) return "";
    if (key.length <= 8) return "****";
    return key.substring(0, 4) + "****" + key.substring(key.length - 4);
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-muted-foreground">Se incarca...</div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Settings className="h-7 w-7 text-blue-600" />
          <h1 className="text-3xl font-bold">Setari platforma</h1>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? "Se salveaza..." : "Salveaza setarile"}
        </Button>
      </div>

      {/* Messages */}
      {success && (
        <div className="bg-green-50 text-green-700 p-3 rounded-md text-sm">{success}</div>
      )}
      {error && (
        <div className="bg-red-50 text-red-700 p-3 rounded-md text-sm">{error}</div>
      )}

      {/* General */}
      <Card>
        <CardContent className="p-6">
          <h2 className="text-lg font-semibold mb-4">General</h2>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Numele platformei</Label>
              <Input
                value={data.name}
                onChange={(e) => updateField("name", e.target.value)}
                placeholder="Numele platformei"
              />
            </div>
            <div className="space-y-2">
              <Label>Descriere</Label>
              <Textarea
                value={data.description}
                onChange={(e) => updateField("description", e.target.value)}
                placeholder="Descrierea platformei"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>Logo URL</Label>
              <Input
                value={data.logoUrl}
                onChange={(e) => updateField("logoUrl", e.target.value)}
                placeholder="https://exemplu.ro/logo.png"
              />
            </div>
            <div className="space-y-2">
              <Label>Culoare primara</Label>
              <div className="flex items-center gap-3">
                <Input
                  type="color"
                  value={data.primaryColor}
                  onChange={(e) => updateField("primaryColor", e.target.value)}
                  className="w-16 h-10 p-1 cursor-pointer"
                />
                <Input
                  value={data.primaryColor}
                  onChange={(e) => updateField("primaryColor", e.target.value)}
                  placeholder="#3b82f6"
                  className="w-32"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Homepage */}
      <Card>
        <CardContent className="p-6">
          <h2 className="text-lg font-semibold mb-4">Homepage</h2>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Titlu hero</Label>
              <Input
                value={data.heroTitle}
                onChange={(e) => updateField("heroTitle", e.target.value)}
                placeholder="Titlul principal al paginii de start"
              />
            </div>
            <div className="space-y-2">
              <Label>Subtitlu hero</Label>
              <Input
                value={data.heroSubtitle}
                onChange={(e) => updateField("heroSubtitle", e.target.value)}
                placeholder="Subtitlul paginii de start"
              />
            </div>
            <div className="space-y-2">
              <Label>Text buton CTA</Label>
              <Input
                value={data.ctaButtonText}
                onChange={(e) => updateField("ctaButtonText", e.target.value)}
                placeholder="Textul butonului principal"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Optiuni */}
      <Card>
        <CardContent className="p-6">
          <h2 className="text-lg font-semibold mb-4">Optiuni</h2>
          <div className="flex items-center gap-2">
            <Checkbox
              id="statsEnabled"
              checked={data.statsEnabled}
              onCheckedChange={(checked) => updateField("statsEnabled", checked === true)}
            />
            <Label htmlFor="statsEnabled">Statistici activate</Label>
          </div>
        </CardContent>
      </Card>

      {/* Contact */}
      <Card>
        <CardContent className="p-6">
          <h2 className="text-lg font-semibold mb-4">Contact</h2>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Email contact</Label>
              <Input
                type="email"
                value={data.contactEmail}
                onChange={(e) => updateField("contactEmail", e.target.value)}
                placeholder="contact@exemplu.ro"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Footer */}
      <Card>
        <CardContent className="p-6">
          <h2 className="text-lg font-semibold mb-4">Footer</h2>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Text footer</Label>
              <Textarea
                value={data.footerText}
                onChange={(e) => updateField("footerText", e.target.value)}
                placeholder="Textul afisat in footer-ul site-ului"
                rows={3}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* API Keys - AI Providers */}
      <Card className="border-blue-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Key className="h-5 w-5 text-blue-600" />
              <h2 className="text-lg font-semibold">Chei API - Provideri AI</h2>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleTestApiKeys} disabled={testingKeys} size="sm" variant="outline" className="border-green-300 text-green-700 hover:bg-green-50">
                {testingKeys ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Zap className="h-4 w-4 mr-2" />}
                {testingKeys ? "Se testeaza..." : "Testeaza cheile"}
              </Button>
              <Button onClick={handleSaveApiKeys} disabled={savingKeys} size="sm" variant="outline">
                <Save className="h-4 w-4 mr-2" />
                {savingKeys ? "Se salveaza..." : "Salveaza cheile"}
              </Button>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Configureaza cheile API pentru generarea de continut AI. Cel putin un provider AI trebuie configurat.
            Dupa salvare, apasati &quot;Testeaza cheile&quot; pentru a verifica ca functioneaza.
          </p>
          {testResults && (
            <div className="mb-4 p-3 rounded-lg bg-slate-50 border space-y-2">
              <p className="text-sm font-medium">Rezultate test:</p>
              {Object.entries(testResults).map(([provider, result]) => (
                <div key={provider} className="flex items-center gap-2 text-sm">
                  {result.status === "ok" ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                  ) : result.status === "not_configured" ? (
                    <XCircle className="h-4 w-4 text-slate-400 flex-shrink-0" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
                  )}
                  <span className="font-medium capitalize">{provider}:</span>
                  {result.status === "ok" && <span className="text-green-700">Functioneaza ({result.model})</span>}
                  {result.status === "not_configured" && <span className="text-slate-500">Neconfigurat</span>}
                  {result.status === "error" && <span className="text-red-600">{result.error}</span>}
                </div>
              ))}
            </div>
          )}
          <div className="space-y-4">
            {/* OpenAI */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label>OpenAI API Key</Label>
                {data.openaiApiKey ? (
                  <Badge className="bg-green-100 text-green-800 text-[10px]"><CheckCircle2 className="h-3 w-3 mr-1" />Configurat</Badge>
                ) : (
                  <Badge className="bg-slate-100 text-slate-600 text-[10px]"><XCircle className="h-3 w-3 mr-1" />Neconfigurat</Badge>
                )}
              </div>
              <div className="flex gap-2">
                <Input
                  type={showKeys.openaiApiKey ? "text" : "password"}
                  value={data.openaiApiKey}
                  onChange={(e) => updateField("openaiApiKey", e.target.value)}
                  placeholder="sk-..."
                  className="font-mono text-sm"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => toggleKeyVisibility("openaiApiKey")}
                >
                  {showKeys.openaiApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">Model: GPT-4o-mini. Obtine cheia de la platform.openai.com</p>
            </div>

            {/* Anthropic / Claude */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label>Anthropic (Claude) API Key</Label>
                {data.anthropicApiKey ? (
                  <Badge className="bg-green-100 text-green-800 text-[10px]"><CheckCircle2 className="h-3 w-3 mr-1" />Configurat</Badge>
                ) : (
                  <Badge className="bg-slate-100 text-slate-600 text-[10px]"><XCircle className="h-3 w-3 mr-1" />Neconfigurat</Badge>
                )}
              </div>
              <div className="flex gap-2">
                <Input
                  type={showKeys.anthropicApiKey ? "text" : "password"}
                  value={data.anthropicApiKey}
                  onChange={(e) => updateField("anthropicApiKey", e.target.value)}
                  placeholder="sk-ant-..."
                  className="font-mono text-sm"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => toggleKeyVisibility("anthropicApiKey")}
                >
                  {showKeys.anthropicApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">Model: Claude Sonnet 4.5. Obtine cheia de la console.anthropic.com</p>
            </div>

            {/* Google AI / Gemini */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label>Google AI (Gemini) API Key</Label>
                {data.googleAiApiKey ? (
                  <Badge className="bg-green-100 text-green-800 text-[10px]"><CheckCircle2 className="h-3 w-3 mr-1" />Configurat</Badge>
                ) : (
                  <Badge className="bg-slate-100 text-slate-600 text-[10px]"><XCircle className="h-3 w-3 mr-1" />Neconfigurat</Badge>
                )}
              </div>
              <div className="flex gap-2">
                <Input
                  type={showKeys.googleAiApiKey ? "text" : "password"}
                  value={data.googleAiApiKey}
                  onChange={(e) => updateField("googleAiApiKey", e.target.value)}
                  placeholder="AIza..."
                  className="font-mono text-sm"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => toggleKeyVisibility("googleAiApiKey")}
                >
                  {showKeys.googleAiApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">Model: Gemini 2.0 Flash. Obtine cheia de la aistudio.google.com</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* API Keys - Email & SMS */}
      <Card className="border-purple-200">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Key className="h-5 w-5 text-purple-600" />
            <h2 className="text-lg font-semibold">Chei API - Email &amp; SMS</h2>
          </div>
          <div className="space-y-4">
            {/* SendGrid */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label>SendGrid API Key</Label>
                {data.sendgridApiKey ? (
                  <Badge className="bg-green-100 text-green-800 text-[10px]"><CheckCircle2 className="h-3 w-3 mr-1" />Configurat</Badge>
                ) : (
                  <Badge className="bg-slate-100 text-slate-600 text-[10px]"><XCircle className="h-3 w-3 mr-1" />Neconfigurat</Badge>
                )}
              </div>
              <div className="flex gap-2">
                <Input
                  type={showKeys.sendgridApiKey ? "text" : "password"}
                  value={data.sendgridApiKey}
                  onChange={(e) => updateField("sendgridApiKey", e.target.value)}
                  placeholder="SG...."
                  className="font-mono text-sm"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => toggleKeyVisibility("sendgridApiKey")}
                >
                  {showKeys.sendgridApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">Pentru trimiterea de emailuri. Obtine cheia de la app.sendgrid.com</p>
            </div>

            {/* Twilio */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label>Twilio Account SID</Label>
                {data.twilioSid ? (
                  <Badge className="bg-green-100 text-green-800 text-[10px]"><CheckCircle2 className="h-3 w-3 mr-1" />Configurat</Badge>
                ) : (
                  <Badge className="bg-slate-100 text-slate-600 text-[10px]"><XCircle className="h-3 w-3 mr-1" />Neconfigurat</Badge>
                )}
              </div>
              <div className="flex gap-2">
                <Input
                  type={showKeys.twilioSid ? "text" : "password"}
                  value={data.twilioSid}
                  onChange={(e) => updateField("twilioSid", e.target.value)}
                  placeholder="AC..."
                  className="font-mono text-sm"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => toggleKeyVisibility("twilioSid")}
                >
                  {showKeys.twilioSid ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Twilio Auth Token</Label>
              <div className="flex gap-2">
                <Input
                  type={showKeys.twilioToken ? "text" : "password"}
                  value={data.twilioToken}
                  onChange={(e) => updateField("twilioToken", e.target.value)}
                  placeholder="Auth token..."
                  className="font-mono text-sm"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => toggleKeyVisibility("twilioToken")}
                >
                  {showKeys.twilioToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Twilio Phone Number</Label>
              <Input
                value={data.twilioPhone}
                onChange={(e) => updateField("twilioPhone", e.target.value)}
                placeholder="+40..."
              />
              <p className="text-xs text-muted-foreground">Pentru trimiterea de SMS-uri. Configureaza de la twilio.com/console</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Social Media */}
      <Card>
        <CardContent className="p-6">
          <h2 className="text-lg font-semibold mb-4">Social Media</h2>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Facebook URL</Label>
              <Input
                value={data.facebookUrl}
                onChange={(e) => updateField("facebookUrl", e.target.value)}
                placeholder="https://facebook.com/pagina"
              />
            </div>
            <div className="space-y-2">
              <Label>LinkedIn URL</Label>
              <Input
                value={data.linkedinUrl}
                onChange={(e) => updateField("linkedinUrl", e.target.value)}
                placeholder="https://linkedin.com/company/pagina"
              />
            </div>
            <div className="space-y-2">
              <Label>Twitter URL</Label>
              <Input
                value={data.twitterUrl}
                onChange={(e) => updateField("twitterUrl", e.target.value)}
                placeholder="https://twitter.com/pagina"
              />
            </div>
            <div className="space-y-2">
              <Label>Instagram URL</Label>
              <Input
                value={data.instagramUrl}
                onChange={(e) => updateField("instagramUrl", e.target.value)}
                placeholder="https://instagram.com/pagina"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bottom Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? "Se salveaza..." : "Salveaza setarile"}
        </Button>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Settings, Save } from "lucide-react";

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
};

export default function AdminSettingsPage() {
  const [data, setData] = useState<PlatformSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

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
        name: settings.name || "",
        description: settings.description || "",
        logoUrl: settings.logoUrl || "",
        primaryColor: settings.primaryColor || "#3b82f6",
        heroTitle: settings.heroTitle || "",
        heroSubtitle: settings.heroSubtitle || "",
        ctaButtonText: settings.ctaButtonText || "",
        statsEnabled: settings.statsEnabled ?? true,
        contactEmail: settings.contactEmail || "",
        footerText: settings.footerText || "",
        facebookUrl: settings.facebookUrl || "",
        linkedinUrl: settings.linkedinUrl || "",
        twitterUrl: settings.twitterUrl || "",
        instagramUrl: settings.instagramUrl || "",
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
      const res = await fetch("/api/admin/platform", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Eroare la salvare");
      showSuccess("Setarile au fost salvate cu succes");
    } catch (err) {
      showError("Eroare la salvarea setarilor");
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field: keyof PlatformSettings, value: string | boolean) => {
    setData((prev) => ({ ...prev, [field]: value }));
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

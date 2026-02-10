"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Sparkles,
  Save,
  Loader2,
  ExternalLink,
  Building,
  FileText,
  Wand2,
  Palette,
  Globe,
  Phone,
  Mail,
  MapPin,
  Facebook,
  Instagram,
  Linkedin,
  Youtube,
  Twitter,
  Music2,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Image,
  Type,
  Download,
  MapPin as MapPinIcon,
  Heart,
  Plus,
  Trash2,
  Target,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────

interface MiniSiteState {
  // NGO basic info (Tab 1)
  ngoName: string;
  slug: string;
  logoUrl: string;
  shortDescription: string;
  description: string;
  category: string;
  websiteUrl: string;
  coverImageUrl: string;

  // Association / Legal data (Tab 2)
  cui: string;
  registrationNr: string;
  bankAccount: string;
  bankName: string;
  contactAddress: string;
  contactEmail: string;
  contactPhone: string;
  socialFacebook: string;
  socialInstagram: string;
  socialLinkedin: string;
  socialYoutube: string;
  socialTiktok: string;
  socialTwitter: string;

  // AI-generated content (Tab 3)
  heroTitle: string;
  heroDescription: string;
  aboutText: string;
  aboutImageUrl: string;
  missionText: string;
  impactText: string;

  // Formular 230
  formular230EmbedCode: string;
  formular230PdfUrl: string;
  formular230Address: string;

  // Customization (Tab 4)
  primaryColor: string;
  accentColor: string;
  theme: string;
  heroCtaText: string;
  showAbout: boolean;
  showMission: boolean;
  showImpact: boolean;
  showDonation: boolean;
  showNewsletter: boolean;
  showContact: boolean;
  showSocial: boolean;
  showFormular230: boolean;
  showContract: boolean;
  customCss: string;
  isPublished: boolean;
  miniSiteCampaigns: MiniSiteCampaign[];
  templateStyle: string;
}

interface MiniSiteCampaign {
  id: string;
  title: string;
  description: string;
  goalAmount: number;
  raisedAmount: number;
  imageUrl: string;
  isActive: boolean;
}

const DEFAULT_STATE: MiniSiteState = {
  ngoName: "",
  slug: "",
  logoUrl: "",
  shortDescription: "",
  description: "",
  category: "",
  websiteUrl: "",
  coverImageUrl: "",
  cui: "",
  registrationNr: "",
  bankAccount: "",
  bankName: "",
  contactAddress: "",
  contactEmail: "",
  contactPhone: "",
  socialFacebook: "",
  socialInstagram: "",
  socialLinkedin: "",
  socialYoutube: "",
  socialTiktok: "",
  socialTwitter: "",
  formular230EmbedCode: "",
  formular230PdfUrl: "",
  formular230Address: "",
  heroTitle: "",
  heroDescription: "",
  aboutText: "",
  aboutImageUrl: "",
  missionText: "",
  impactText: "",
  primaryColor: "#6366f1",
  accentColor: "#f59e0b",
  theme: "modern",
  heroCtaText: "Doneaza acum",
  showAbout: true,
  showMission: true,
  showImpact: true,
  showDonation: true,
  showNewsletter: true,
  showContact: true,
  showSocial: true,
  showFormular230: false,
  showContract: false,
  customCss: "",
  isPublished: false,
  miniSiteCampaigns: [],
  templateStyle: "modern",
};

const CATEGORIES = [
  "Social",
  "Educatie",
  "Sanatate",
  "Mediu",
  "Cultura",
  "Sport",
  "Drepturile omului",
  "Altele",
];

const THEMES = [
  { value: "modern", label: "Modern" },
  { value: "classic", label: "Clasic" },
  { value: "minimal", label: "Minimal" },
];

// ─── Component ───────────────────────────────────────────────────────

export default function MiniSiteBuilderPage() {
  const [state, setState] = useState<MiniSiteState>(DEFAULT_STATE);
  const [activeTab, setActiveTab] = useState("date-ong");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [aiGenerated, setAiGenerated] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  // ─── Helpers ─────────────────────────────────────────────────────

  const updateField = useCallback(
    <K extends keyof MiniSiteState>(field: K, value: MiniSiteState[K]) => {
      setState((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  const clearSaveMessage = useCallback(() => {
    setTimeout(() => setSaveMessage(null), 4000);
  }, []);

  // ─── Load data on mount ──────────────────────────────────────────

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setLoadError(null);
        const res = await fetch("/api/minisite/builder");
        if (!res.ok) {
          throw new Error("Nu s-au putut incarca datele mini-site-ului.");
        }
        const data = await res.json();

        setState((prev) => ({
          ...prev,
          ngoName: data.ngoName || "",
          slug: data.slug || "",
          logoUrl: data.logoUrl || "",
          shortDescription: data.shortDescription || "",
          description: data.description || "",
          category: data.category || "",
          websiteUrl: data.websiteUrl || "",
          coverImageUrl: data.coverImageUrl || "",
          cui: data.cui || "",
          registrationNr: data.registrationNr || "",
          bankAccount: data.bankAccount || "",
          bankName: data.bankName || "",
          contactAddress: data.contactAddress || "",
          contactEmail: data.contactEmail || "",
          contactPhone: data.contactPhone || "",
          socialFacebook: data.socialFacebook || "",
          socialInstagram: data.socialInstagram || "",
          socialLinkedin: data.socialLinkedin || "",
          socialYoutube: data.socialYoutube || "",
          socialTiktok: data.socialTiktok || "",
          socialTwitter: data.socialTwitter || "",
          formular230EmbedCode: data.formular230EmbedCode || "",
          formular230PdfUrl: data.formular230PdfUrl || "",
          formular230Address: data.formular230Address || "",
          heroTitle: data.heroTitle || "",
          heroDescription: data.heroDescription || "",
          aboutText: data.aboutText || "",
          aboutImageUrl: data.aboutImageUrl || "",
          missionText: data.missionText || "",
          impactText: data.impactText || "",
          primaryColor: data.primaryColor || "#6366f1",
          accentColor: data.accentColor || "#f59e0b",
          theme: data.theme || "modern",
          heroCtaText: data.heroCtaText || "Doneaza acum",
          showAbout: data.showAbout ?? true,
          showMission: data.showMission ?? true,
          showImpact: data.showImpact ?? true,
          showDonation: data.showDonation ?? true,
          showNewsletter: data.showNewsletter ?? true,
          showContact: data.showContact ?? true,
          showSocial: data.showSocial ?? true,
          showFormular230: data.showFormular230 ?? false,
          showContract: data.showContract ?? false,
          customCss: data.customCss || "",
          isPublished: data.isPublished ?? false,
          miniSiteCampaigns: Array.isArray(data.miniSiteCampaigns) ? data.miniSiteCampaigns : [],
          templateStyle: data.templateStyle || "modern",
        }));

        if (data.heroTitle || data.aboutText || data.missionText) {
          setAiGenerated(true);
        }
      } catch (err) {
        console.error("Error loading minisite data:", err);
        setLoadError(
          err instanceof Error
            ? err.message
            : "Eroare la incarcarea datelor."
        );
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // ─── Save ────────────────────────────────────────────────────────

  const handleSave = async () => {
    try {
      setSaving(true);
      setSaveMessage(null);

      const res = await fetch("/api/minisite/builder", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(state),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(
          errData?.error || "Eroare la salvare. Incercati din nou."
        );
      }

      setSaveMessage({
        type: "success",
        text: "Mini-site-ul a fost salvat cu succes!",
      });
      clearSaveMessage();
    } catch (err) {
      console.error("Error saving minisite:", err);
      setSaveMessage({
        type: "error",
        text:
          err instanceof Error
            ? err.message
            : "Eroare la salvare. Incercati din nou.",
      });
      clearSaveMessage();
    } finally {
      setSaving(false);
    }
  };

  // ─── AI Generate ─────────────────────────────────────────────────

  const handleAiGenerate = async (saveAndPublish = false) => {
    try {
      setGenerating(true);
      setSaveMessage(null);

      const res = await fetch("/api/minisite/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: state.ngoName,
          description: state.description,
          shortDescription: state.shortDescription,
          category: state.category,
          cui: state.cui,
          registrationNr: state.registrationNr,
          bankAccount: state.bankAccount,
          bankName: state.bankName,
          contactEmail: state.contactEmail,
          contactPhone: state.contactPhone,
          contactAddress: state.contactAddress,
          socialFacebook: state.socialFacebook,
          socialInstagram: state.socialInstagram,
          socialLinkedin: state.socialLinkedin,
          socialYoutube: state.socialYoutube,
          socialTiktok: state.socialTiktok,
          socialTwitter: state.socialTwitter,
          logoUrl: state.logoUrl,
          websiteUrl: state.websiteUrl,
          coverImageUrl: state.coverImageUrl,
          autoSave: saveAndPublish,
          autoPublish: saveAndPublish,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(
          errData?.error || "Eroare la generarea continutului AI."
        );
      }

      const data = await res.json();
      const gen = data.generated || data;

      setState((prev) => ({
        ...prev,
        heroTitle: gen.heroTitle || prev.heroTitle,
        heroDescription: gen.heroDescription || prev.heroDescription,
        aboutText: gen.aboutText || prev.aboutText,
        missionText: gen.missionText || prev.missionText,
        impactText: gen.impactText || prev.impactText,
        heroCtaText: gen.heroCtaText || prev.heroCtaText,
        primaryColor: gen.primaryColor || prev.primaryColor,
        accentColor: gen.accentColor || prev.accentColor,
        isPublished: data.published || prev.isPublished,
      }));

      setAiGenerated(true);

      if (data.saved && data.siteUrl) {
        setSaveMessage({
          type: "success",
          text: `Site-ul a fost generat si publicat! Viziteaza: ${window.location.origin}${data.siteUrl}`,
        });
      } else {
        setSaveMessage({
          type: "success",
          text: "Continutul a fost generat cu succes! Puteti edita textele si apoi salva.",
        });
        clearSaveMessage();
      }
    } catch (err) {
      console.error("Error generating AI content:", err);
      setSaveMessage({
        type: "error",
        text:
          err instanceof Error
            ? err.message
            : "Eroare la generarea continutului AI.",
      });
      clearSaveMessage();
    } finally {
      setGenerating(false);
    }
  };

  // ─── Preview ─────────────────────────────────────────────────────

  const handlePreview = () => {
    if (state.slug) {
      window.open(`/s/${state.slug}`, "_blank");
    }
  };

  // ─── Loading screen ──────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">
            Se incarca datele mini-site-ului...
          </p>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <AlertCircle className="h-8 w-8 mx-auto text-destructive" />
              <p className="text-destructive">{loadError}</p>
              <Button
                variant="outline"
                onClick={() => window.location.reload()}
              >
                Reincarca pagina
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ─── Render ──────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Constructor Mini-Site
          </h1>
          <p className="text-muted-foreground mt-1">
            Configureaza pagina publica a organizatiei tale cu ajutorul AI-ului
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={state.isPublished ? "success" : "secondary"}>
            {state.isPublished ? "Publicat" : "Nepublicat"}
          </Badge>
          {state.slug && (
            <Badge variant="outline" className="font-mono text-xs">
              /s/{state.slug}
            </Badge>
          )}
        </div>
      </div>

      {/* ── One-Click AI Site Generator ───────────────────────────── */}
      <Card className="border-2 border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="flex-1 text-center sm:text-left">
              <h2 className="text-xl font-bold flex items-center gap-2 justify-center sm:justify-start">
                <Sparkles className="h-6 w-6 text-primary" />
                Genereaza si publica site-ul cu AI
              </h2>
              <p className="text-sm text-muted-foreground mt-2">
                Completeaza datele de mai jos, apoi apasa butonul. AI-ul genereaza automat tot continutul,
                salveaza si publica site-ul tau instant la adresa <strong>/s/{state.slug || "..."}</strong>
              </p>
            </div>
            <Button
              size="lg"
              className="px-8 py-6 text-lg font-bold shadow-lg gap-3"
              disabled={generating || !state.ngoName}
              onClick={() => handleAiGenerate(true)}
            >
              {generating ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  AI genereaza site-ul...
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5" />
                  Genereaza si publica
                </>
              )}
            </Button>
          </div>
          {saveMessage && (
            <div className={`mt-4 p-3 rounded-lg text-sm ${
              saveMessage.type === "success"
                ? "bg-green-50 text-green-800 border border-green-200"
                : "bg-red-50 text-red-800 border border-red-200"
            }`}>
              {saveMessage.text}
              {saveMessage.type === "success" && state.slug && (
                <a
                  href={`/s/${state.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-2 inline-flex items-center gap-1 font-semibold underline"
                >
                  Deschide site-ul <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tabs wizard */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="date-ong" className="gap-1.5">
            <Building className="h-4 w-4" />
            <span className="hidden sm:inline">Date ONG</span>
          </TabsTrigger>
          <TabsTrigger value="date-asociatie" className="gap-1.5">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Date asociatie</span>
          </TabsTrigger>
          <TabsTrigger value="campanii" className="gap-1.5">
            <Heart className="h-4 w-4" />
            <span className="hidden sm:inline">Campanii</span>
          </TabsTrigger>
          <TabsTrigger value="genereaza-ai" className="gap-1.5">
            <Wand2 className="h-4 w-4" />
            <span className="hidden sm:inline">Genereaza AI</span>
          </TabsTrigger>
          <TabsTrigger value="personalizeaza" className="gap-1.5">
            <Palette className="h-4 w-4" />
            <span className="hidden sm:inline">Personalizeaza</span>
          </TabsTrigger>
        </TabsList>

        {/* ─── Tab 1: Date ONG ──────────────────────────────────── */}
        <TabsContent value="date-ong">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Date ONG
              </CardTitle>
              <CardDescription>
                Informatiile de baza ale organizatiei care vor aparea pe
                mini-site
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Logo URL */}
              <div className="space-y-2">
                <Label htmlFor="logoUrl" className="flex items-center gap-2">
                  <Image className="h-4 w-4" />
                  URL Logo
                </Label>
                <Input
                  id="logoUrl"
                  placeholder="https://exemplu.ro/logo.png"
                  value={state.logoUrl}
                  onChange={(e) => updateField("logoUrl", e.target.value)}
                />
                {state.logoUrl && (
                  <div className="mt-2 p-3 border rounded-md bg-muted/30 inline-block">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={state.logoUrl}
                      alt="Logo preview"
                      className="h-16 w-auto object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  </div>
                )}
              </div>

              {/* NGO Name */}
              <div className="space-y-2">
                <Label htmlFor="ngoName" className="flex items-center gap-2">
                  <Type className="h-4 w-4" />
                  Numele organizatiei *
                </Label>
                <Input
                  id="ngoName"
                  value={state.ngoName}
                  onChange={(e) => setState((prev) => ({ ...prev, ngoName: e.target.value }))}
                  placeholder="Asociatia / Fundatia ..."
                />
              </div>

              {/* Short description */}
              <div className="space-y-2">
                <Label htmlFor="shortDescription">
                  Descriere scurta (max 150 caractere)
                </Label>
                <Textarea
                  id="shortDescription"
                  placeholder="O descriere scurta a organizatiei..."
                  value={state.shortDescription}
                  onChange={(e) => {
                    if (e.target.value.length <= 150) {
                      updateField("shortDescription", e.target.value);
                    }
                  }}
                  rows={2}
                />
                <p className="text-xs text-muted-foreground text-right">
                  {state.shortDescription.length}/150 caractere
                </p>
              </div>

              {/* Full description */}
              <div className="space-y-2">
                <Label htmlFor="description">Descriere completa</Label>
                <Textarea
                  id="description"
                  placeholder="Descrieti pe larg activitatea organizatiei..."
                  value={state.description}
                  onChange={(e) => updateField("description", e.target.value)}
                  rows={5}
                />
              </div>

              {/* Category (button group) */}
              <div className="space-y-2">
                <Label>Categoria</Label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map((cat) => (
                    <Button
                      key={cat}
                      type="button"
                      variant={state.category === cat ? "default" : "outline"}
                      size="sm"
                      onClick={() => updateField("category", cat)}
                    >
                      {cat}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Website URL */}
              <div className="space-y-2">
                <Label htmlFor="websiteUrl" className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  Website URL
                </Label>
                <Input
                  id="websiteUrl"
                  placeholder="https://www.organizatia-ta.ro"
                  value={state.websiteUrl}
                  onChange={(e) => updateField("websiteUrl", e.target.value)}
                />
              </div>

              {/* Cover Image URL */}
              <div className="space-y-2">
                <Label
                  htmlFor="coverImageUrl"
                  className="flex items-center gap-2"
                >
                  <Image className="h-4 w-4" />
                  URL Imagine de coperta
                </Label>
                <Input
                  id="coverImageUrl"
                  placeholder="https://exemplu.ro/cover.jpg"
                  value={state.coverImageUrl}
                  onChange={(e) => updateField("coverImageUrl", e.target.value)}
                />
                {state.coverImageUrl && (
                  <div className="mt-2 border rounded-md overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={state.coverImageUrl}
                      alt="Cover preview"
                      className="w-full h-40 object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Tab 2: Date Asociatie ────────────────────────────── */}
        <TabsContent value="date-asociatie">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Date asociatie
              </CardTitle>
              <CardDescription>
                Informatii legale, bancare si de contact ale asociatiei
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Legal info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cui">CUI / CIF</Label>
                  <Input
                    id="cui"
                    placeholder="RO12345678"
                    value={state.cui}
                    onChange={(e) => updateField("cui", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="registrationNr">
                    Numar inregistrare
                  </Label>
                  <Input
                    id="registrationNr"
                    placeholder="J40/1234/2020"
                    value={state.registrationNr}
                    onChange={(e) =>
                      updateField("registrationNr", e.target.value)
                    }
                  />
                </div>
              </div>

              {/* Bank info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bankAccount">Cont bancar IBAN</Label>
                  <Input
                    id="bankAccount"
                    placeholder="RO49AAAA1B31007593840000"
                    value={state.bankAccount}
                    onChange={(e) => updateField("bankAccount", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bankName">Banca</Label>
                  <Input
                    id="bankName"
                    placeholder="Banca Transilvania"
                    value={state.bankName}
                    onChange={(e) => updateField("bankName", e.target.value)}
                  />
                </div>
              </div>

              {/* Address */}
              <div className="space-y-2">
                <Label
                  htmlFor="contactAddress"
                  className="flex items-center gap-2"
                >
                  <MapPin className="h-4 w-4" />
                  Adresa sediu
                </Label>
                <Input
                  id="contactAddress"
                  placeholder="Str. Exemplu nr. 1, Bucuresti"
                  value={state.contactAddress}
                  onChange={(e) =>
                    updateField("contactAddress", e.target.value)
                  }
                />
              </div>

              {/* Contact info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label
                    htmlFor="contactEmail"
                    className="flex items-center gap-2"
                  >
                    <Mail className="h-4 w-4" />
                    Email contact
                  </Label>
                  <Input
                    id="contactEmail"
                    type="email"
                    placeholder="contact@organizatia.ro"
                    value={state.contactEmail}
                    onChange={(e) =>
                      updateField("contactEmail", e.target.value)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="contactPhone"
                    className="flex items-center gap-2"
                  >
                    <Phone className="h-4 w-4" />
                    Telefon contact
                  </Label>
                  <Input
                    id="contactPhone"
                    type="tel"
                    placeholder="+40 712 345 678"
                    value={state.contactPhone}
                    onChange={(e) =>
                      updateField("contactPhone", e.target.value)
                    }
                  />
                </div>
              </div>

              {/* Social media links */}
              <div className="space-y-3">
                <Label className="text-base font-semibold">
                  Retele sociale
                </Label>
                <p className="text-sm text-muted-foreground">
                  Adaugati link-urile catre profilurile organizatiei pe retelele
                  sociale
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label
                      htmlFor="socialFacebook"
                      className="flex items-center gap-2"
                    >
                      <Facebook className="h-4 w-4" />
                      Facebook
                    </Label>
                    <Input
                      id="socialFacebook"
                      placeholder="https://facebook.com/organizatia"
                      value={state.socialFacebook}
                      onChange={(e) =>
                        updateField("socialFacebook", e.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor="socialInstagram"
                      className="flex items-center gap-2"
                    >
                      <Instagram className="h-4 w-4" />
                      Instagram
                    </Label>
                    <Input
                      id="socialInstagram"
                      placeholder="https://instagram.com/organizatia"
                      value={state.socialInstagram}
                      onChange={(e) =>
                        updateField("socialInstagram", e.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor="socialLinkedin"
                      className="flex items-center gap-2"
                    >
                      <Linkedin className="h-4 w-4" />
                      LinkedIn
                    </Label>
                    <Input
                      id="socialLinkedin"
                      placeholder="https://linkedin.com/company/organizatia"
                      value={state.socialLinkedin}
                      onChange={(e) =>
                        updateField("socialLinkedin", e.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor="socialYoutube"
                      className="flex items-center gap-2"
                    >
                      <Youtube className="h-4 w-4" />
                      YouTube
                    </Label>
                    <Input
                      id="socialYoutube"
                      placeholder="https://youtube.com/@organizatia"
                      value={state.socialYoutube}
                      onChange={(e) =>
                        updateField("socialYoutube", e.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor="socialTiktok"
                      className="flex items-center gap-2"
                    >
                      <Music2 className="h-4 w-4" />
                      TikTok
                    </Label>
                    <Input
                      id="socialTiktok"
                      placeholder="https://tiktok.com/@organizatia"
                      value={state.socialTiktok}
                      onChange={(e) =>
                        updateField("socialTiktok", e.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor="socialTwitter"
                      className="flex items-center gap-2"
                    >
                      <Twitter className="h-4 w-4" />
                      Twitter / X
                    </Label>
                    <Input
                      id="socialTwitter"
                      placeholder="https://twitter.com/organizatia"
                      value={state.socialTwitter}
                      onChange={(e) =>
                        updateField("socialTwitter", e.target.value)
                      }
                    />
                  </div>
                </div>
              </div>

              {/* ── Formular 230 - Full Section ────────────────── */}
              <div className="space-y-6 border-t pt-6">
                <div>
                  <Label className="text-base font-semibold flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Formular 230 - Redirectionare 3,5%
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Configureaza pagina Formular 230 a mini-site-ului tau pentru
                    a permite donatorilor sa redirectioneze 3,5% din impozit
                  </p>
                </div>

                {/* Link to formular230.ro */}
                <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
                  <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                    <div className="space-y-1">
                      <h4 className="font-semibold text-blue-900 text-sm">
                        Pasul 1: Creeaza cont pe formular230.ro
                      </h4>
                      <p className="text-xs text-blue-700">
                        Inregistreaza-te gratuit, adauga datele asociatiei (CUI, IBAN, denumire)
                        si copiaza codul embed generat.
                      </p>
                    </div>
                    <a
                      href="https://formular230.ro"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg font-medium hover:bg-blue-700 transition-colors"
                    >
                      Mergi la formular230.ro
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </div>
                </div>

                {/* Instructions box */}
                <div className="p-4 bg-white border rounded-lg space-y-3">
                  <h4 className="font-semibold text-sm">
                    Cum functioneaza?
                  </h4>
                  <ol className="text-sm text-muted-foreground space-y-2 list-decimal ml-4">
                    <li>
                      Creeaza-ti un cont gratuit pe <strong>formular230.ro</strong> si
                      completeaza datele organizatiei tale (CUI, IBAN, denumire, etc.)
                    </li>
                    <li>
                      Dupa configurare, formular230.ro iti genereaza un <strong>cod embed</strong> (un
                      cod HTML cu iframe) pe care il copiezi si il lipesti mai jos
                    </li>
                    <li>
                      Codul embed va fi afisat pe pagina Formular 230 a mini-site-ului
                      tau, permitand donatorilor sa completeze si sa trimita formularul
                      <strong> direct online</strong>
                    </li>
                    <li>
                      Optional, poti urca si un <strong>PDF</strong> cu Formularul 230
                      pre-completat pe care donatorii il pot descarca, printa, semna
                      si trimite prin posta la adresa pe care o specifici
                    </li>
                  </ol>
                </div>

                {/* Embed code */}
                <div className="space-y-2">
                  <Label htmlFor="formular230EmbedCode" className="font-medium">
                    Cod embed de la formular230.ro
                  </Label>
                  <Textarea
                    id="formular230EmbedCode"
                    placeholder={'<iframe src="https://formular230.ro/organizatia-ta" width="100%" height="600" ...></iframe>'}
                    value={state.formular230EmbedCode}
                    onChange={(e) => updateField("formular230EmbedCode", e.target.value)}
                    rows={4}
                    className="font-mono text-sm"
                  />
                  {state.formular230EmbedCode && (
                    <div className="flex items-center gap-2 text-sm text-green-700">
                      <CheckCircle2 className="h-4 w-4" />
                      Cod embed configurat - formularul online va fi afisat pe pagina 230
                    </div>
                  )}
                </div>

                {/* PDF URL */}
                <div className="space-y-2">
                  <Label htmlFor="formular230PdfUrl" className="font-medium flex items-center gap-2">
                    <Download className="h-4 w-4" />
                    Link PDF Formular 230 (optional)
                  </Label>
                  <Input
                    id="formular230PdfUrl"
                    placeholder="https://drive.google.com/... sau https://exemplu.ro/formular-230.pdf"
                    value={state.formular230PdfUrl}
                    onChange={(e) => updateField("formular230PdfUrl", e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Urca PDF-ul pe Google Drive, Dropbox sau alt serviciu si lipeste link-ul aici.
                    Donatorii vor putea descarca formularul pre-completat cu datele asociatiei.
                  </p>
                </div>

                {/* Mailing address */}
                <div className="space-y-2">
                  <Label htmlFor="formular230Address" className="font-medium flex items-center gap-2">
                    <MapPinIcon className="h-4 w-4" />
                    Adresa pentru trimiterea formularului prin posta (optional)
                  </Label>
                  <Textarea
                    id="formular230Address"
                    placeholder={"Administratia Finantelor Publice Sector 1\nStr. Exemplu nr. 10\nBucuresti, 010101"}
                    value={state.formular230Address}
                    onChange={(e) => updateField("formular230Address", e.target.value)}
                    rows={3}
                  />
                  <p className="text-xs text-muted-foreground">
                    Adresa ANAF sau a asociatiei unde donatorii trimit formularul completat si semnat.
                  </p>
                </div>

                {/* Summary of what's configured */}
                {(state.formular230EmbedCode || state.formular230PdfUrl || state.formular230Address) && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm font-medium text-green-800 mb-2">Configurare Formular 230:</p>
                    <ul className="text-sm text-green-700 space-y-1">
                      {state.formular230EmbedCode && (
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Formular online (embed formular230.ro)
                        </li>
                      )}
                      {state.formular230PdfUrl && (
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          PDF descarcabil configurat
                        </li>
                      )}
                      {state.formular230Address && (
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Adresa de trimitere configurata
                        </li>
                      )}
                    </ul>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Tab: Campanii ──────────────────────────────────────── */}
        <TabsContent value="campanii">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Heart className="h-5 w-5" />
                    Campaniile tale
                  </CardTitle>
                  <CardDescription>
                    Adauga campanii de strangere de fonduri pe mini-site-ul tau.
                    Fiecare campanie apare ca un card pe pagina publica.
                  </CardDescription>
                </div>
                <Button
                  onClick={() => {
                    const newCampaign: MiniSiteCampaign = {
                      id: Date.now().toString(),
                      title: "",
                      description: "",
                      goalAmount: 0,
                      raisedAmount: 0,
                      imageUrl: "",
                      isActive: true,
                    };
                    setState((prev) => ({
                      ...prev,
                      miniSiteCampaigns: [...prev.miniSiteCampaigns, newCampaign],
                    }));
                  }}
                  size="sm"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Adauga campanie
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {state.miniSiteCampaigns.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed rounded-xl">
                  <Target className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                  <h3 className="font-semibold text-lg mb-1">Nicio campanie inca</h3>
                  <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
                    Adauga prima ta campanie de strangere de fonduri.
                    Donatiile se vor face prin platforma noastra.
                  </p>
                  <Button
                    onClick={() => {
                      const newCampaign: MiniSiteCampaign = {
                        id: Date.now().toString(),
                        title: "",
                        description: "",
                        goalAmount: 0,
                        raisedAmount: 0,
                        imageUrl: "",
                        isActive: true,
                      };
                      setState((prev) => ({
                        ...prev,
                        miniSiteCampaigns: [...prev.miniSiteCampaigns, newCampaign],
                      }));
                    }}
                    variant="outline"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Adauga prima campanie
                  </Button>
                </div>
              ) : (
                state.miniSiteCampaigns.map((campaign, idx) => (
                  <div
                    key={campaign.id}
                    className="border rounded-xl p-5 space-y-4 bg-white"
                  >
                    <div className="flex items-center justify-between">
                      <Badge variant={campaign.isActive ? "default" : "secondary"}>
                        {campaign.isActive ? "Activa" : "Inactiva"}
                      </Badge>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setState((prev) => ({
                              ...prev,
                              miniSiteCampaigns: prev.miniSiteCampaigns.map((c, i) =>
                                i === idx ? { ...c, isActive: !c.isActive } : c
                              ),
                            }));
                          }}
                        >
                          {campaign.isActive ? (
                            <><EyeOff className="h-4 w-4 mr-1" /> Dezactiveaza</>
                          ) : (
                            <><Eye className="h-4 w-4 mr-1" /> Activeaza</>
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          onClick={() => {
                            setState((prev) => ({
                              ...prev,
                              miniSiteCampaigns: prev.miniSiteCampaigns.filter((_, i) => i !== idx),
                            }));
                          }}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Sterge
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="grid gap-2">
                        <Label>Titlu campanie *</Label>
                        <Input
                          placeholder="Ex: Ajuta 100 de copii sa mearga la scoala"
                          value={campaign.title}
                          onChange={(e) => {
                            setState((prev) => ({
                              ...prev,
                              miniSiteCampaigns: prev.miniSiteCampaigns.map((c, i) =>
                                i === idx ? { ...c, title: e.target.value } : c
                              ),
                            }));
                          }}
                        />
                      </div>

                      <div className="grid gap-2">
                        <Label>Descriere</Label>
                        <Textarea
                          placeholder="Ce doriti sa realizati, de ce e important, cum vor fi folositi banii..."
                          rows={3}
                          value={campaign.description}
                          onChange={(e) => {
                            setState((prev) => ({
                              ...prev,
                              miniSiteCampaigns: prev.miniSiteCampaigns.map((c, i) =>
                                i === idx ? { ...c, description: e.target.value } : c
                              ),
                            }));
                          }}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label>Obiectiv (RON)</Label>
                          <Input
                            type="number"
                            placeholder="10000"
                            value={campaign.goalAmount || ""}
                            onChange={(e) => {
                              setState((prev) => ({
                                ...prev,
                                miniSiteCampaigns: prev.miniSiteCampaigns.map((c, i) =>
                                  i === idx ? { ...c, goalAmount: parseFloat(e.target.value) || 0 } : c
                                ),
                              }));
                            }}
                          />
                        </div>

                        <div className="grid gap-2">
                          <Label>Suma stransa (RON)</Label>
                          <Input
                            type="number"
                            placeholder="0"
                            value={campaign.raisedAmount || ""}
                            onChange={(e) => {
                              setState((prev) => ({
                                ...prev,
                                miniSiteCampaigns: prev.miniSiteCampaigns.map((c, i) =>
                                  i === idx ? { ...c, raisedAmount: parseFloat(e.target.value) || 0 } : c
                                ),
                              }));
                            }}
                          />
                          <p className="text-xs text-muted-foreground">
                            Se va actualiza automat din donatiile prin platforma
                          </p>
                        </div>
                      </div>

                      <div className="grid gap-2">
                        <Label>Imagine campanie (URL)</Label>
                        <Input
                          placeholder="https://exemplu.ro/imagine-campanie.jpg"
                          value={campaign.imageUrl}
                          onChange={(e) => {
                            setState((prev) => ({
                              ...prev,
                              miniSiteCampaigns: prev.miniSiteCampaigns.map((c, i) =>
                                i === idx ? { ...c, imageUrl: e.target.value } : c
                              ),
                            }));
                          }}
                        />
                        <p className="text-xs text-muted-foreground">
                          Urca imaginea pe Google Drive, Imgur sau alt serviciu si lipeste link-ul.
                        </p>
                      </div>

                      <div className="rounded-lg bg-blue-50 border border-blue-200 p-3">
                        <p className="text-xs text-blue-700">
                          <strong>Donatiile se fac prin platforma.</strong> Butonul &quot;Doneaza acum&quot; de pe mini-site va duce donatorii
                          direct pe pagina de donatie a organizatiei tale.
                        </p>
                      </div>
                    </div>

                    {/* Preview progress bar */}
                    {campaign.goalAmount > 0 && (
                      <div className="pt-2 border-t">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="font-medium">
                            {campaign.raisedAmount.toLocaleString("ro-RO")} RON strans
                          </span>
                          <span className="text-muted-foreground">
                            din {campaign.goalAmount.toLocaleString("ro-RO")} RON
                          </span>
                        </div>
                        <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full transition-all"
                            style={{
                              width: `${Math.min(100, (campaign.raisedAmount / campaign.goalAmount) * 100)}%`,
                            }}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {Math.round((campaign.raisedAmount / campaign.goalAmount) * 100)}% din obiectiv
                        </p>
                      </div>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Tab 3: Genereaza cu AI ───────────────────────────── */}
        <TabsContent value="genereaza-ai">
          <div className="space-y-6">
            {/* AI generation card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wand2 className="h-5 w-5" />
                  Genereaza continut cu AI
                </CardTitle>
                <CardDescription>
                  Inteligenta artificiala va genera automat texte optimizate
                  pentru mini-site-ul tau pe baza informatiilor despre
                  organizatie
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                  <p className="text-sm font-medium">
                    AI-ul va genera urmatoarele sectiuni:
                  </p>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-amber-500" />
                      <span>
                        <strong>Titlu Hero</strong> - Titlul principal al
                        paginii
                      </span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-amber-500" />
                      <span>
                        <strong>Descriere Hero</strong> - Subtitlul de pe
                        pagina principala
                      </span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-amber-500" />
                      <span>
                        <strong>Sectiunea Despre noi</strong> - Prezentarea
                        organizatiei
                      </span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-amber-500" />
                      <span>
                        <strong>Sectiunea Misiune</strong> - Misiunea si
                        viziunea organizatiei
                      </span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-amber-500" />
                      <span>
                        <strong>Text Impact</strong> - Descrierea impactului
                        asupra comunitatii
                      </span>
                    </li>
                  </ul>
                </div>

                {!state.ngoName && !state.description && (
                  <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-md">
                    <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                    <p className="text-sm text-amber-800">
                      Pentru rezultate mai bune, completati mai intai
                      informatiile din tabul &quot;Date ONG&quot; (numele,
                      descrierea si categoria organizatiei).
                    </p>
                  </div>
                )}

                <Button
                  size="lg"
                  className="w-full gap-2"
                  onClick={() => handleAiGenerate(false)}
                  disabled={generating}
                >
                  {generating ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Se genereaza continutul...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-5 w-5" />
                      Genereaza cu AI
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* AI-generated texts (editable) */}
            {aiGenerated && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    Continut generat
                  </CardTitle>
                  <CardDescription>
                    Editati textele generate pentru a le personaliza dupa
                    preferintele dumneavoastra
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="heroTitle" className="font-medium">
                      Titlu Hero
                    </Label>
                    <Input
                      id="heroTitle"
                      value={state.heroTitle}
                      onChange={(e) =>
                        updateField("heroTitle", e.target.value)
                      }
                      placeholder="Titlul principal al paginii..."
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="heroDescription" className="font-medium">
                      Descriere Hero
                    </Label>
                    <Textarea
                      id="heroDescription"
                      value={state.heroDescription}
                      onChange={(e) =>
                        updateField("heroDescription", e.target.value)
                      }
                      placeholder="Subtitlul de pe pagina principala..."
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="aboutText" className="font-medium">
                      Sectiunea Despre noi
                    </Label>
                    <Textarea
                      id="aboutText"
                      value={state.aboutText}
                      onChange={(e) =>
                        updateField("aboutText", e.target.value)
                      }
                      placeholder="Prezentarea organizatiei..."
                      rows={5}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="aboutImageUrl" className="flex items-center gap-2 font-medium">
                      <Image className="h-4 w-4" />
                      Imagine sectiune Despre noi (optional)
                    </Label>
                    <Input
                      id="aboutImageUrl"
                      placeholder="https://exemplu.ro/echipa.jpg"
                      value={state.aboutImageUrl}
                      onChange={(e) => updateField("aboutImageUrl", e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      O poza cu echipa, sediul sau activitatile organizatiei. Arata frumos si fara poza.
                    </p>
                    {state.aboutImageUrl && (
                      <div className="mt-2 border rounded-md overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={state.aboutImageUrl}
                          alt="About preview"
                          className="w-full h-40 object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = "none";
                          }}
                        />
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="missionText" className="font-medium">
                      Sectiunea Misiune
                    </Label>
                    <Textarea
                      id="missionText"
                      value={state.missionText}
                      onChange={(e) =>
                        updateField("missionText", e.target.value)
                      }
                      placeholder="Misiunea si viziunea organizatiei..."
                      rows={5}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="impactText" className="font-medium">
                      Text Impact
                    </Label>
                    <Textarea
                      id="impactText"
                      value={state.impactText}
                      onChange={(e) =>
                        updateField("impactText", e.target.value)
                      }
                      placeholder="Descrierea impactului asupra comunitatii..."
                      rows={4}
                    />
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* ─── Tab 4: Personalizeaza ────────────────────────────── */}
        <TabsContent value="personalizeaza">
          <div className="space-y-6">
            {/* Colors & Theme */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  Aspect si culori
                </CardTitle>
                <CardDescription>
                  Personalizeaza culorile si tema mini-site-ului
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Primary Color */}
                  <div className="space-y-2">
                    <Label htmlFor="primaryColor">Culoare principala</Label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        id="primaryColor"
                        value={state.primaryColor}
                        onChange={(e) =>
                          updateField("primaryColor", e.target.value)
                        }
                        className="h-10 w-14 cursor-pointer rounded border border-input"
                      />
                      <Input
                        value={state.primaryColor}
                        onChange={(e) =>
                          updateField("primaryColor", e.target.value)
                        }
                        className="font-mono w-32"
                        maxLength={7}
                      />
                    </div>
                  </div>

                  {/* Accent Color */}
                  <div className="space-y-2">
                    <Label htmlFor="accentColor">Culoare accent</Label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        id="accentColor"
                        value={state.accentColor}
                        onChange={(e) =>
                          updateField("accentColor", e.target.value)
                        }
                        className="h-10 w-14 cursor-pointer rounded border border-input"
                      />
                      <Input
                        value={state.accentColor}
                        onChange={(e) =>
                          updateField("accentColor", e.target.value)
                        }
                        className="font-mono w-32"
                        maxLength={7}
                      />
                    </div>
                  </div>
                </div>

                {/* Theme selector */}
                <div className="space-y-2">
                  <Label>Tema</Label>
                  <div className="flex flex-wrap gap-2">
                    {THEMES.map((t) => (
                      <Button
                        key={t.value}
                        type="button"
                        variant={
                          state.theme === t.value ? "default" : "outline"
                        }
                        size="sm"
                        onClick={() => updateField("theme", t.value)}
                      >
                        {t.label}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Hero CTA text */}
                <div className="space-y-2">
                  <Label htmlFor="heroCtaText">
                    Text buton CTA (Call to Action)
                  </Label>
                  <Input
                    id="heroCtaText"
                    placeholder="Doneaza acum"
                    value={state.heroCtaText}
                    onChange={(e) =>
                      updateField("heroCtaText", e.target.value)
                    }
                  />
                </div>
              </CardContent>
            </Card>

            {/* Section toggles */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Sectiuni vizibile
                </CardTitle>
                <CardDescription>
                  Alege ce sectiuni sa fie afisate pe mini-site
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {(
                    [
                      {
                        key: "showAbout" as const,
                        label: "Sectiunea Despre noi",
                      },
                      {
                        key: "showMission" as const,
                        label: "Sectiunea Misiune",
                      },
                      {
                        key: "showImpact" as const,
                        label: "Sectiunea Impact",
                      },
                      {
                        key: "showDonation" as const,
                        label: "Formular donatie",
                      },
                      {
                        key: "showNewsletter" as const,
                        label: "Newsletter",
                      },
                      {
                        key: "showContact" as const,
                        label: "Informatii contact",
                      },
                      {
                        key: "showSocial" as const,
                        label: "Retele sociale",
                      },
                      {
                        key: "showFormular230" as const,
                        label: "Formular 230",
                      },
                      {
                        key: "showContract" as const,
                        label: "Contract sponsorizare",
                      },
                    ] as const
                  ).map(({ key, label }) => (
                    <label
                      key={key}
                      className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
                    >
                      <span className="text-sm font-medium">{label}</span>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={state[key]}
                        onClick={() => updateField(key, !state[key])}
                        className={`
                          relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent
                          transition-colors duration-200 ease-in-out
                          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
                          ${state[key] ? "bg-primary" : "bg-input"}
                        `}
                      >
                        <span
                          className={`
                            pointer-events-none inline-block h-5 w-5 transform rounded-full bg-background shadow-lg ring-0
                            transition duration-200 ease-in-out
                            ${state[key] ? "translate-x-5" : "translate-x-0"}
                          `}
                        />
                      </button>
                    </label>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Custom CSS */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">CSS personalizat</CardTitle>
                <CardDescription>
                  Adaugati reguli CSS personalizate pentru mini-site (optional,
                  pentru utilizatori avansati)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  id="customCss"
                  placeholder={`.hero-section {\n  background: linear-gradient(...);\n}`}
                  value={state.customCss}
                  onChange={(e) => updateField("customCss", e.target.value)}
                  rows={6}
                  className="font-mono text-sm"
                />
              </CardContent>
            </Card>

            {/* Publish toggle */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Publicare</CardTitle>
                <CardDescription>
                  Controlati vizibilitatea mini-site-ului pentru public
                </CardDescription>
              </CardHeader>
              <CardContent>
                <label className="flex items-center justify-between p-4 rounded-lg border-2 hover:bg-muted/50 cursor-pointer transition-colors">
                  <div className="space-y-1">
                    <span className="text-sm font-semibold flex items-center gap-2">
                      {state.isPublished ? (
                        <Eye className="h-4 w-4 text-green-600" />
                      ) : (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      )}
                      {state.isPublished
                        ? "Mini-site publicat"
                        : "Mini-site nepublicat"}
                    </span>
                    <p className="text-xs text-muted-foreground">
                      {state.isPublished
                        ? "Pagina este vizibila public la adresa /s/" +
                          state.slug
                        : "Pagina nu este vizibila public. Activati pentru a o publica."}
                    </p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={state.isPublished}
                    onClick={() =>
                      updateField("isPublished", !state.isPublished)
                    }
                    className={`
                      relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent
                      transition-colors duration-200 ease-in-out
                      focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
                      ${state.isPublished ? "bg-green-600" : "bg-input"}
                    `}
                  >
                    <span
                      className={`
                        pointer-events-none inline-block h-6 w-6 transform rounded-full bg-background shadow-lg ring-0
                        transition duration-200 ease-in-out
                        ${state.isPublished ? "translate-x-5" : "translate-x-0"}
                      `}
                    />
                  </button>
                </label>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* ─── Bottom action bar ────────────────────────────────────── */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Status messages */}
            <div className="flex-1">
              {saveMessage && (
                <div
                  className={`flex items-center gap-2 text-sm ${
                    saveMessage.type === "success"
                      ? "text-green-700"
                      : "text-destructive"
                  }`}
                >
                  {saveMessage.type === "success" ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                  ) : (
                    <AlertCircle className="h-4 w-4 shrink-0" />
                  )}
                  {saveMessage.text}
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={handlePreview}
                disabled={!state.slug}
                className="gap-2"
              >
                <ExternalLink className="h-4 w-4" />
                Previzualizeaza
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving}
                className="gap-2 min-w-[140px]"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Se salveaza...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Salveaza
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

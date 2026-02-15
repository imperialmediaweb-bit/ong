"use client";

import { useState, useEffect, useCallback } from "react";
import { PageHelp } from "@/components/ui/page-help";
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
import { MinisiteSubNav } from "./_components/minisite-nav";
import {
  Sparkles,
  Save,
  Loader2,
  ExternalLink,
  Building,
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
  ChevronDown,
  ChevronRight,
  Briefcase,
  ArrowRight,
  FileText,
  Heart,
  LayoutGrid,
} from "lucide-react";
import Link from "next/link";

// ─── Collapsible Section Component ────────────────────────────────────
function Section({ id, title, description, icon: Icon, expanded, onToggle, badge, children }: {
  id: string; title: string; description?: string;
  icon: React.ElementType; expanded: boolean; onToggle: (id: string) => void;
  badge?: React.ReactNode; children: React.ReactNode;
}) {
  return (
    <Card className="overflow-hidden">
      <button type="button" className="w-full text-left" onClick={() => onToggle(id)}>
        <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-base">{title}</CardTitle>
                {description && <CardDescription className="mt-0.5">{description}</CardDescription>}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {badge}
              {expanded ? <ChevronDown className="h-5 w-5 text-muted-foreground" /> : <ChevronRight className="h-5 w-5 text-muted-foreground" />}
            </div>
          </div>
        </CardHeader>
      </button>
      {expanded && <CardContent className="pt-0 pb-6">{children}</CardContent>}
    </Card>
  );
}

// ─── State ────────────────────────────────────────────────────────────

interface CoreState {
  ngoName: string;
  slug: string;
  logoUrl: string;
  shortDescription: string;
  description: string;
  category: string;
  websiteUrl: string;
  coverImageUrl: string;
  cui: string;
  registrationNr: string;
  bankAccount: string;
  bankName: string;
  legalRepresentative: string;
  legalRepresentativeRole: string;
  contactAddress: string;
  contactEmail: string;
  contactPhone: string;
  socialFacebook: string;
  socialInstagram: string;
  socialLinkedin: string;
  socialYoutube: string;
  socialTiktok: string;
  socialTwitter: string;
  primaryColor: string;
  accentColor: string;
  theme: string;
  showAbout: boolean;
  showMission: boolean;
  showImpact: boolean;
  showDonation: boolean;
  showNewsletter: boolean;
  showContact: boolean;
  showSocial: boolean;
  showFormular230: boolean;
  showContract: boolean;
  showVolunteerForm: boolean;
  customCss: string;
  isPublished: boolean;
}

const DEFAULT_STATE: CoreState = {
  ngoName: "", slug: "", logoUrl: "", shortDescription: "", description: "",
  category: "", websiteUrl: "", coverImageUrl: "", cui: "", registrationNr: "",
  bankAccount: "", bankName: "", legalRepresentative: "", legalRepresentativeRole: "Presedinte",
  contactAddress: "", contactEmail: "", contactPhone: "",
  socialFacebook: "", socialInstagram: "", socialLinkedin: "",
  socialYoutube: "", socialTiktok: "", socialTwitter: "",
  primaryColor: "#6366f1", accentColor: "#f59e0b", theme: "modern",
  showAbout: true, showMission: true, showImpact: true, showDonation: true,
  showNewsletter: true, showContact: true, showSocial: true,
  showFormular230: false, showContract: false, showVolunteerForm: false,
  customCss: "", isPublished: false,
};

const CATEGORIES = ["Social", "Educatie", "Sanatate", "Mediu", "Cultura", "Sport", "Drepturile omului", "Altele"];
const THEMES = [
  { value: "modern", label: "Modern" },
  { value: "classic", label: "Clasic" },
  { value: "minimal", label: "Minimal" },
  { value: "bold", label: "Bold" },
];

// ─── Component ────────────────────────────────────────────────────────

export default function MiniSiteSettingsPage() {
  const [state, setState] = useState<CoreState>(DEFAULT_STATE);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(["identitate"]));

  const updateField = useCallback(
    <K extends keyof CoreState>(field: K, value: CoreState[K]) => {
      setState((prev) => ({ ...prev, [field]: value }));
    }, []
  );

  const clearSaveMessage = useCallback(() => {
    setTimeout(() => setSaveMessage(null), 4000);
  }, []);

  const toggleSection = useCallback((id: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  // ─── Load ───────────────────────────────────────────────────────
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setLoadError(null);
        const res = await fetch("/api/minisite/builder");
        if (!res.ok) throw new Error("Nu s-au putut incarca datele.");
        const data = await res.json();
        setState({
          ngoName: data.ngoName || "", slug: data.slug || "", logoUrl: data.logoUrl || "",
          shortDescription: data.shortDescription || "", description: data.description || "",
          category: data.category || "", websiteUrl: data.websiteUrl || "",
          coverImageUrl: data.coverImageUrl || "", cui: data.cui || "",
          registrationNr: data.registrationNr || "", bankAccount: data.bankAccount || "",
          bankName: data.bankName || "",
          legalRepresentative: data.legalRepresentative || "",
          legalRepresentativeRole: data.legalRepresentativeRole || "Presedinte",
          contactAddress: data.contactAddress || "",
          contactEmail: data.contactEmail || "", contactPhone: data.contactPhone || "",
          socialFacebook: data.socialFacebook || "", socialInstagram: data.socialInstagram || "",
          socialLinkedin: data.socialLinkedin || "", socialYoutube: data.socialYoutube || "",
          socialTiktok: data.socialTiktok || "", socialTwitter: data.socialTwitter || "",
          primaryColor: data.primaryColor || "#6366f1", accentColor: data.accentColor || "#f59e0b",
          theme: data.theme || "modern",
          showAbout: data.showAbout ?? true, showMission: data.showMission ?? true,
          showImpact: data.showImpact ?? true, showDonation: data.showDonation ?? true,
          showNewsletter: data.showNewsletter ?? true, showContact: data.showContact ?? true,
          showSocial: data.showSocial ?? true, showFormular230: data.showFormular230 ?? false,
          showContract: data.showContract ?? false, showVolunteerForm: data.showVolunteerForm ?? false,
          customCss: data.customCss || "", isPublished: data.isPublished ?? false,
        });
      } catch (err) {
        console.error("Error loading minisite:", err);
        setLoadError(err instanceof Error ? err.message : "Eroare la incarcarea datelor.");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // ─── Save ───────────────────────────────────────────────────────
  const handleSave = async () => {
    try {
      setSaving(true);
      setSaveMessage(null);
      const res = await fetch("/api/minisite/builder", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ngoName: state.ngoName, description: state.description,
          shortDescription: state.shortDescription, category: state.category,
          logoUrl: state.logoUrl, websiteUrl: state.websiteUrl,
          coverImageUrl: state.coverImageUrl,
          cui: state.cui, registrationNr: state.registrationNr,
          bankAccount: state.bankAccount, bankName: state.bankName,
          legalRepresentative: state.legalRepresentative,
          legalRepresentativeRole: state.legalRepresentativeRole,
          contactEmail: state.contactEmail, contactPhone: state.contactPhone,
          contactAddress: state.contactAddress,
          socialFacebook: state.socialFacebook, socialInstagram: state.socialInstagram,
          socialLinkedin: state.socialLinkedin, socialYoutube: state.socialYoutube,
          socialTiktok: state.socialTiktok, socialTwitter: state.socialTwitter,
          primaryColor: state.primaryColor, accentColor: state.accentColor,
          theme: state.theme, customCss: state.customCss,
          showAbout: state.showAbout, showMission: state.showMission,
          showImpact: state.showImpact, showDonation: state.showDonation,
          showNewsletter: state.showNewsletter, showContact: state.showContact,
          showSocial: state.showSocial, showFormular230: state.showFormular230,
          showContract: state.showContract, showVolunteerForm: state.showVolunteerForm,
          isPublished: state.isPublished,
        }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.error || "Eroare la salvare.");
      }
      setSaveMessage({ type: "success", text: "Setarile au fost salvate!" });
      clearSaveMessage();
    } catch (err) {
      setSaveMessage({ type: "error", text: err instanceof Error ? err.message : "Eroare la salvare." });
      clearSaveMessage();
    } finally {
      setSaving(false);
    }
  };

  // ─── AI Generate & Publish ──────────────────────────────────────
  const handleAiGenerate = async () => {
    try {
      setGenerating(true);
      setSaveMessage(null);
      const res = await fetch("/api/minisite/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: state.ngoName, description: state.description,
          shortDescription: state.shortDescription, category: state.category,
          cui: state.cui, registrationNr: state.registrationNr,
          bankAccount: state.bankAccount, bankName: state.bankName,
          legalRepresentative: state.legalRepresentative,
          legalRepresentativeRole: state.legalRepresentativeRole,
          contactEmail: state.contactEmail, contactPhone: state.contactPhone,
          contactAddress: state.contactAddress,
          socialFacebook: state.socialFacebook, socialInstagram: state.socialInstagram,
          socialLinkedin: state.socialLinkedin, socialYoutube: state.socialYoutube,
          socialTiktok: state.socialTiktok, socialTwitter: state.socialTwitter,
          logoUrl: state.logoUrl, websiteUrl: state.websiteUrl,
          coverImageUrl: state.coverImageUrl,
          autoSave: true, autoPublish: true,
        }),
      });
      if (!res.ok) throw new Error("Eroare la generarea cu AI.");
      setSaveMessage({ type: "success", text: "Site-ul a fost generat si publicat cu succes!" });
      clearSaveMessage();
      // Reload to get latest data
      setTimeout(() => window.location.reload(), 1500);
    } catch (err) {
      setSaveMessage({ type: "error", text: err instanceof Error ? err.message : "Eroare la generarea cu AI." });
      clearSaveMessage();
    } finally {
      setGenerating(false);
    }
  };

  const handlePreview = () => {
    if (state.slug) window.open(`/s/${state.slug}`, "_blank");
  };

  // ─── Loading / Error ────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Se incarca datele mini-site-ului...</p>
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
              <Button variant="outline" onClick={() => window.location.reload()}>Reincarca pagina</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24">
      {/* ═══ HEADER ═════════════════════════════════════════════════ */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Mini-Site</h1>
          <p className="text-muted-foreground mt-1">Pagina publica a organizatiei tale</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={state.isPublished ? "default" : "secondary"} className={state.isPublished ? "bg-green-600" : ""}>
            {state.isPublished ? "Publicat" : "Nepublicat"}
          </Badge>
          {state.slug && (
            <Button variant="outline" size="sm" onClick={handlePreview} className="gap-1.5 font-mono text-xs">
              /s/{state.slug} <ExternalLink className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>

      {/* ═══ SUB-NAVIGATION ════════════════════════════════════════ */}
      <MinisiteSubNav />

      {/* ═══ AI GENERATE BANNER ════════════════════════════════════ */}
      <Card className="border-2 border-primary/20 bg-gradient-to-r from-primary/5 via-primary/8 to-primary/5 overflow-hidden">
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
              onClick={handleAiGenerate}
            >
              {generating ? (
                <><Loader2 className="h-5 w-5 animate-spin" /> Se genereaza...</>
              ) : (
                <><Sparkles className="h-5 w-5" /> Genereaza si publica</>
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
                <a href={`/s/${state.slug}`} target="_blank" rel="noopener noreferrer"
                  className="ml-2 inline-flex items-center gap-1 font-semibold underline">
                  Deschide site-ul <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ═══ QUICK LINKS TO SUB-PAGES ══════════════════════════════ */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href="/dashboard/minisite/continut">
          <Card className="group hover:border-primary/30 hover:shadow-md transition-all cursor-pointer h-full">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm group-hover:text-primary transition-colors">Continut site</h3>
                <p className="text-xs text-muted-foreground">Hero, despre noi, misiune, SEO</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </CardContent>
          </Card>
        </Link>
        <Link href="/dashboard/minisite/campanii">
          <Card className="group hover:border-primary/30 hover:shadow-md transition-all cursor-pointer h-full">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-rose-50 flex items-center justify-center group-hover:bg-rose-100 transition-colors">
                <Heart className="h-6 w-6 text-rose-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm group-hover:text-primary transition-colors">Campanii</h3>
                <p className="text-xs text-muted-foreground">Campanii de strangere de fonduri</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </CardContent>
          </Card>
        </Link>
        <Link href="/dashboard/minisite/componente">
          <Card className="group hover:border-primary/30 hover:shadow-md transition-all cursor-pointer h-full">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-amber-50 flex items-center justify-center group-hover:bg-amber-100 transition-colors">
                <LayoutGrid className="h-6 w-6 text-amber-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm group-hover:text-primary transition-colors">Componente</h3>
                <p className="text-xs text-muted-foreground">Echipa, testimoniale, FAQ, evenimente</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* ═══ SECTION 1: IDENTITATE ══════════════════════════════════ */}
      <Section
        id="identitate" title="Identitate organizatie"
        description="Nume, logo, descriere si categorie"
        icon={Building} expanded={expandedSections.has("identitate")} onToggle={toggleSection}
        badge={state.ngoName ? <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50 text-xs">Completat</Badge> : undefined}
      >
        <div className="space-y-5">
          <div className="space-y-2">
            <Label className="flex items-center gap-2"><Image className="h-4 w-4" /> URL Logo</Label>
            <Input placeholder="https://exemplu.ro/logo.png" value={state.logoUrl} onChange={(e) => updateField("logoUrl", e.target.value)} />
            {state.logoUrl && (
              <div className="mt-2 p-3 border rounded-lg bg-muted/30 inline-block">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={state.logoUrl} alt="Logo preview" className="h-16 w-auto object-contain"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-2">
              <Label className="flex items-center gap-2"><Type className="h-4 w-4" /> Numele organizatiei *</Label>
              <Input value={state.ngoName} onChange={(e) => setState((prev) => ({ ...prev, ngoName: e.target.value }))} placeholder="Asociatia / Fundatia ..." />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2"><Globe className="h-4 w-4" /> Website URL</Label>
              <Input placeholder="https://www.organizatia-ta.ro" value={state.websiteUrl} onChange={(e) => updateField("websiteUrl", e.target.value)} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Descriere scurta (max 150 caractere)</Label>
            <Textarea placeholder="O descriere scurta a organizatiei..." value={state.shortDescription}
              onChange={(e) => { if (e.target.value.length <= 150) updateField("shortDescription", e.target.value); }} rows={2} />
            <p className="text-xs text-muted-foreground text-right">{state.shortDescription.length}/150 caractere</p>
          </div>

          <div className="space-y-2">
            <Label>Descriere completa</Label>
            <Textarea placeholder="Descrieti pe larg activitatea organizatiei..." value={state.description}
              onChange={(e) => updateField("description", e.target.value)} rows={4} />
          </div>

          <div className="space-y-2">
            <Label>Categoria</Label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => (
                <Button key={cat} type="button" variant={state.category === cat ? "default" : "outline"} size="sm"
                  onClick={() => updateField("category", cat)}>{cat}</Button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2"><Image className="h-4 w-4" /> Imagine de coperta</Label>
            <Input placeholder="https://exemplu.ro/cover.jpg" value={state.coverImageUrl}
              onChange={(e) => updateField("coverImageUrl", e.target.value)} />
            {state.coverImageUrl && (
              <div className="mt-2 border rounded-lg overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={state.coverImageUrl} alt="Cover preview" className="w-full h-40 object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
              </div>
            )}
          </div>
        </div>
      </Section>

      {/* ═══ SECTION 2: DATE LEGALE ═════════════════════════════════ */}
      <Section
        id="legal" title="Date legale si bancare"
        description="CUI, IBAN, reprezentant legal"
        icon={Briefcase} expanded={expandedSections.has("legal")} onToggle={toggleSection}
        badge={state.cui ? <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50 text-xs">Completat</Badge> : undefined}
      >
        <div className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>CUI / CIF</Label>
              <Input placeholder="RO12345678" value={state.cui} onChange={(e) => updateField("cui", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Numar inregistrare</Label>
              <Input placeholder="J40/1234/2020" value={state.registrationNr} onChange={(e) => updateField("registrationNr", e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Reprezentant legal</Label>
              <Input placeholder="Ion Popescu" value={state.legalRepresentative} onChange={(e) => updateField("legalRepresentative", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Functia reprezentantului</Label>
              <Input placeholder="Presedinte" value={state.legalRepresentativeRole} onChange={(e) => updateField("legalRepresentativeRole", e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Cont bancar IBAN</Label>
              <Input placeholder="RO49AAAA1B31007593840000" value={state.bankAccount} onChange={(e) => updateField("bankAccount", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Banca</Label>
              <Input placeholder="Banca Transilvania" value={state.bankName} onChange={(e) => updateField("bankName", e.target.value)} />
            </div>
          </div>
        </div>
      </Section>

      {/* ═══ SECTION 3: CONTACT & SOCIAL ════════════════════════════ */}
      <Section
        id="contact" title="Contact si retele sociale"
        description="Adresa, email, telefon, social media"
        icon={Mail} expanded={expandedSections.has("contact")} onToggle={toggleSection}
      >
        <div className="space-y-5">
          <div className="space-y-2">
            <Label className="flex items-center gap-2"><MapPin className="h-4 w-4" /> Adresa sediu</Label>
            <Input placeholder="Str. Exemplu nr. 1, Bucuresti" value={state.contactAddress}
              onChange={(e) => updateField("contactAddress", e.target.value)} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2"><Mail className="h-4 w-4" /> Email contact</Label>
              <Input type="email" placeholder="contact@organizatia.ro" value={state.contactEmail}
                onChange={(e) => updateField("contactEmail", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2"><Phone className="h-4 w-4" /> Telefon contact</Label>
              <Input type="tel" placeholder="+40 712 345 678" value={state.contactPhone}
                onChange={(e) => updateField("contactPhone", e.target.value)} />
            </div>
          </div>

          <div className="border-t pt-5">
            <Label className="text-base font-semibold mb-3 block">Retele sociale</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2"><Facebook className="h-4 w-4" /> Facebook</Label>
                <Input placeholder="https://facebook.com/organizatia" value={state.socialFacebook}
                  onChange={(e) => updateField("socialFacebook", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2"><Instagram className="h-4 w-4" /> Instagram</Label>
                <Input placeholder="https://instagram.com/organizatia" value={state.socialInstagram}
                  onChange={(e) => updateField("socialInstagram", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2"><Linkedin className="h-4 w-4" /> LinkedIn</Label>
                <Input placeholder="https://linkedin.com/company/organizatia" value={state.socialLinkedin}
                  onChange={(e) => updateField("socialLinkedin", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2"><Youtube className="h-4 w-4" /> YouTube</Label>
                <Input placeholder="https://youtube.com/@organizatia" value={state.socialYoutube}
                  onChange={(e) => updateField("socialYoutube", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2"><Music2 className="h-4 w-4" /> TikTok</Label>
                <Input placeholder="https://tiktok.com/@organizatia" value={state.socialTiktok}
                  onChange={(e) => updateField("socialTiktok", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2"><Twitter className="h-4 w-4" /> Twitter / X</Label>
                <Input placeholder="https://twitter.com/organizatia" value={state.socialTwitter}
                  onChange={(e) => updateField("socialTwitter", e.target.value)} />
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* ═══ SECTION 4: DESIGN ══════════════════════════════════════ */}
      <Section
        id="design" title="Design si aspect"
        description="Culori, tema, sectiuni vizibile"
        icon={Palette} expanded={expandedSections.has("design")} onToggle={toggleSection}
      >
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label>Culoare principala</Label>
              <div className="flex items-center gap-3">
                <input type="color" value={state.primaryColor} onChange={(e) => updateField("primaryColor", e.target.value)}
                  className="h-10 w-14 cursor-pointer rounded border border-input" />
                <Input value={state.primaryColor} onChange={(e) => updateField("primaryColor", e.target.value)}
                  className="font-mono w-32" maxLength={7} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Culoare accent</Label>
              <div className="flex items-center gap-3">
                <input type="color" value={state.accentColor} onChange={(e) => updateField("accentColor", e.target.value)}
                  className="h-10 w-14 cursor-pointer rounded border border-input" />
                <Input value={state.accentColor} onChange={(e) => updateField("accentColor", e.target.value)}
                  className="font-mono w-32" maxLength={7} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Tema</Label>
              <div className="flex flex-wrap gap-2">
                {THEMES.map((t) => (
                  <Button key={t.value} type="button" variant={state.theme === t.value ? "default" : "outline"} size="sm"
                    onClick={() => updateField("theme", t.value)}>{t.label}</Button>
                ))}
              </div>
            </div>
          </div>

          <div className="border-t pt-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2"><Eye className="h-5 w-5" /> Sectiuni vizibile pe site</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {([
                { key: "showAbout" as const, label: "Despre noi" },
                { key: "showMission" as const, label: "Misiune" },
                { key: "showImpact" as const, label: "Impact" },
                { key: "showDonation" as const, label: "Formular donatie" },
                { key: "showNewsletter" as const, label: "Newsletter" },
                { key: "showContact" as const, label: "Contact" },
                { key: "showSocial" as const, label: "Retele sociale" },
                { key: "showFormular230" as const, label: "Formular 230" },
                { key: "showContract" as const, label: "Contract sponsorizare" },
                { key: "showVolunteerForm" as const, label: "Formular voluntariat" },
              ] as const).map(({ key, label }) => (
                <label key={key} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors">
                  <span className="text-sm">{label}</span>
                  <button type="button" role="switch" aria-checked={state[key]}
                    onClick={() => updateField(key, !state[key])}
                    className={`relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ${state[key] ? "bg-primary" : "bg-input"}`}>
                    <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-background shadow ring-0 transition duration-200 ${state[key] ? "translate-x-4" : "translate-x-0"}`} />
                  </button>
                </label>
              ))}
            </div>
          </div>

          <div className="border-t pt-6 space-y-2">
            <Label className="font-medium">CSS personalizat (optional)</Label>
            <Textarea placeholder={`.hero-section {\n  background: linear-gradient(...);\n}`}
              value={state.customCss} onChange={(e) => updateField("customCss", e.target.value)}
              rows={4} className="font-mono text-sm" />
          </div>
        </div>
      </Section>

      {/* ═══ PUBLICARE ══════════════════════════════════════════════ */}
      <Card className={`border-2 ${state.isPublished ? "border-green-200 bg-green-50/50" : "border-muted"}`}>
        <CardContent className="p-5">
          <label className="flex items-center justify-between cursor-pointer">
            <div className="flex items-center gap-3">
              <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${state.isPublished ? "bg-green-100 text-green-600" : "bg-muted text-muted-foreground"}`}>
                {state.isPublished ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
              </div>
              <div>
                <p className="font-semibold">{state.isPublished ? "Mini-site publicat" : "Mini-site nepublicat"}</p>
                <p className="text-xs text-muted-foreground">
                  {state.isPublished ? `Vizibil public la /s/${state.slug}` : "Activeaza pentru a face pagina vizibila public"}
                </p>
              </div>
            </div>
            <button type="button" role="switch" aria-checked={state.isPublished}
              onClick={() => updateField("isPublished", !state.isPublished)}
              className={`relative inline-flex h-7 w-12 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ${
                state.isPublished ? "bg-green-600" : "bg-input"
              }`}>
              <span className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-background shadow-lg ring-0 transition duration-200 ${
                state.isPublished ? "translate-x-5" : "translate-x-0"
              }`} />
            </button>
          </label>
        </CardContent>
      </Card>

      {/* ═══ STICKY SAVE BAR ═══════════════════════════════════════ */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-t shadow-lg">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex-1 min-w-0">
            {saveMessage && (
              <div className={`flex items-center gap-2 text-sm truncate ${
                saveMessage.type === "success" ? "text-green-700" : "text-destructive"
              }`}>
                {saveMessage.type === "success" ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0" />}
                <span className="truncate">{saveMessage.text}</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-3 ml-4">
            <Button variant="outline" onClick={handlePreview} disabled={!state.slug} className="gap-2">
              <ExternalLink className="h-4 w-4" /> Previzualizeaza
            </Button>
            <Button onClick={handleSave} disabled={saving} className="gap-2 min-w-[140px]">
              {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Se salveaza...</> : <><Save className="h-4 w-4" /> Salveaza</>}
            </Button>
          </div>
        </div>
      </div>

      <PageHelp items={[
        { title: "Ce este mini-site-ul", description: "Pagina publica a ONG-ului tau unde donatorii pot dona, vedea misiunea si informatiile de contact." },
        { title: "Genereaza cu AI", description: "Apasa butonul pentru a genera automat tot continutul site-ului bazat pe datele completate." },
        { title: "Continut", description: "Acceseaza pagina Continut pentru a edita textele hero, despre noi, misiune si SEO." },
        { title: "Campanii", description: "Gestioneaza campaniile de strangere de fonduri pe pagina Campanii." },
        { title: "Componente", description: "Adauga echipa, testimoniale, FAQ, evenimente si alte sectiuni pe pagina Componente." },
      ]} />
    </div>
  );
}

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
  Heart,
  Plus,
  Trash2,
  Target,
  Settings,
  Video,
  Users,
  MessageSquareQuote,
  Handshake,
  CalendarDays,
  HelpCircle,
  FileDown,
  Map,
  Bell,
  Search,
  BarChart3,
  ChevronDown,
  ChevronRight,
  Briefcase,
  LayoutGrid,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────

interface MiniSiteState {
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
  heroTitle: string;
  heroDescription: string;
  aboutText: string;
  aboutImageUrl: string;
  missionText: string;
  impactText: string;
  formular230EmbedCode: string;
  formular230PdfUrl: string;
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
  videoUrl: string;
  showVideo: boolean;
  teamMembers: TeamMember[];
  showTeam: boolean;
  testimonials: Testimonial[];
  showTestimonials: boolean;
  partners: Partner[];
  showPartners: boolean;
  events: EventItem[];
  showEvents: boolean;
  faqItems: FaqItem[];
  showFaq: boolean;
  showVolunteerForm: boolean;
  transparencyDocs: TransparencyDoc[];
  showTransparency: boolean;
  urgentBanner: UrgentBanner;
  showUrgentBanner: boolean;
  googleMapsEmbed: string;
  showGoogleMaps: boolean;
  showDonationPopup: boolean;
  donationPopupDelay: number;
  donationPopupText: string;
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string;
  counterStats: CounterStat[];
  showCounterStats: boolean;
}

interface CampaignUpdate {
  id: string;
  date: string;
  text: string;
}

interface MiniSiteCampaign {
  id: string;
  title: string;
  description: string;
  goalAmount: number;
  raisedAmount: number;
  imageUrl: string;
  isActive: boolean;
  updates?: CampaignUpdate[];
}

interface TeamMember { id: string; name: string; role: string; photoUrl: string; bio: string; }
interface Testimonial { id: string; name: string; role: string; text: string; photoUrl: string; }
interface Partner { id: string; name: string; logoUrl: string; websiteUrl: string; }
interface EventItem { id: string; title: string; date: string; location: string; description: string; imageUrl: string; }
interface FaqItem { id: string; question: string; answer: string; }
interface TransparencyDoc { id: string; title: string; year: string; pdfUrl: string; }
interface UrgentBanner { text: string; ctaText: string; ctaUrl: string; isActive: boolean; bgColor: string; }
interface CounterStat { id: string; label: string; value: number; suffix: string; }

const DEFAULT_STATE: MiniSiteState = {
  ngoName: "", slug: "", logoUrl: "", shortDescription: "", description: "",
  category: "", websiteUrl: "", coverImageUrl: "", cui: "", registrationNr: "",
  bankAccount: "", bankName: "", legalRepresentative: "", legalRepresentativeRole: "Presedinte",
  contactAddress: "", contactEmail: "",
  contactPhone: "", socialFacebook: "", socialInstagram: "", socialLinkedin: "",
  socialYoutube: "", socialTiktok: "", socialTwitter: "",
  formular230EmbedCode: "", formular230PdfUrl: "",
  heroTitle: "", heroDescription: "", aboutText: "", aboutImageUrl: "",
  missionText: "", impactText: "",
  primaryColor: "#6366f1", accentColor: "#f59e0b", theme: "modern",
  heroCtaText: "Doneaza acum",
  showAbout: true, showMission: true, showImpact: true, showDonation: true,
  showNewsletter: true, showContact: true, showSocial: true,
  showFormular230: false, showContract: false, customCss: "",
  isPublished: false, miniSiteCampaigns: [], templateStyle: "modern",
  videoUrl: "", showVideo: false, teamMembers: [], showTeam: false,
  testimonials: [], showTestimonials: false, partners: [], showPartners: false,
  events: [], showEvents: false, faqItems: [], showFaq: false,
  showVolunteerForm: false, transparencyDocs: [], showTransparency: false,
  urgentBanner: { text: "", ctaText: "", ctaUrl: "", isActive: false, bgColor: "#dc2626" },
  showUrgentBanner: false, googleMapsEmbed: "", showGoogleMaps: false,
  showDonationPopup: false, donationPopupDelay: 15, donationPopupText: "",
  seoTitle: "", seoDescription: "", seoKeywords: "",
  counterStats: [], showCounterStats: false,
};

const CATEGORIES = ["Social", "Educatie", "Sanatate", "Mediu", "Cultura", "Sport", "Drepturile omului", "Altele"];
const THEMES = [
  { value: "modern", label: "Modern" },
  { value: "classic", label: "Clasic" },
  { value: "minimal", label: "Minimal" },
];

// ─── Collapsible Section Component ────────────────────────────────────
function Section({ id, title, description, icon: Icon, expanded, onToggle, badge, children }: {
  id: string; title: string; description?: string;
  icon: React.ElementType; expanded: boolean; onToggle: (id: string) => void;
  badge?: React.ReactNode; children: React.ReactNode;
}) {
  return (
    <Card className="overflow-hidden">
      <button
        type="button"
        className="w-full text-left"
        onClick={() => onToggle(id)}
      >
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

// ─── Feature Toggle Card ──────────────────────────────────────────────
function FeatureCard({ icon: Icon, title, description, enabled, onToggle, configured, onClick }: {
  icon: React.ElementType; title: string; description: string;
  enabled: boolean; onToggle: () => void; configured?: boolean; onClick?: () => void;
}) {
  return (
    <div
      className={`relative rounded-xl border-2 p-4 transition-all cursor-pointer ${
        enabled ? "border-primary/40 bg-primary/5 shadow-sm" : "border-muted hover:border-muted-foreground/20"
      }`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-3">
        <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${
          enabled ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
        }`}>
          <Icon className="h-4.5 w-4.5" />
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          onClick={(e) => { e.stopPropagation(); onToggle(); }}
          className={`relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ${
            enabled ? "bg-primary" : "bg-input"
          }`}
        >
          <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-background shadow ring-0 transition duration-200 ${
            enabled ? "translate-x-4" : "translate-x-0"
          }`} />
        </button>
      </div>
      <h4 className="font-medium text-sm mb-0.5">{title}</h4>
      <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
      {configured && enabled && (
        <div className="mt-2 flex items-center gap-1 text-xs text-green-600">
          <CheckCircle2 className="h-3 w-3" /> Configurat
        </div>
      )}
    </div>
  );
}

// ─── Component ───────────────────────────────────────────────────────

export default function MiniSiteBuilderPage() {
  const [state, setState] = useState<MiniSiteState>(DEFAULT_STATE);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [aiGenerated, setAiGenerated] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [aiToolLoading, setAiToolLoading] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(["identitate"]));
  const [activeFeature, setActiveFeature] = useState<string | null>(null);

  // ─── Helpers ─────────────────────────────────────────────────────

  const updateField = useCallback(
    <K extends keyof MiniSiteState>(field: K, value: MiniSiteState[K]) => {
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

  // ─── Load data on mount ──────────────────────────────────────────

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setLoadError(null);
        const res = await fetch("/api/minisite/builder");
        if (!res.ok) throw new Error("Nu s-au putut incarca datele mini-site-ului.");
        const data = await res.json();

        setState((prev) => ({
          ...prev,
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
          formular230EmbedCode: data.formular230EmbedCode || "",
          formular230PdfUrl: data.formular230PdfUrl || "",
          heroTitle: data.heroTitle || "", heroDescription: data.heroDescription || "",
          aboutText: data.aboutText || "", aboutImageUrl: data.aboutImageUrl || "",
          missionText: data.missionText || "", impactText: data.impactText || "",
          primaryColor: data.primaryColor || "#6366f1", accentColor: data.accentColor || "#f59e0b",
          theme: data.theme || "modern", heroCtaText: data.heroCtaText || "Doneaza acum",
          showAbout: data.showAbout ?? true, showMission: data.showMission ?? true,
          showImpact: data.showImpact ?? true, showDonation: data.showDonation ?? true,
          showNewsletter: data.showNewsletter ?? true, showContact: data.showContact ?? true,
          showSocial: data.showSocial ?? true, showFormular230: data.showFormular230 ?? false,
          showContract: data.showContract ?? false, customCss: data.customCss || "",
          isPublished: data.isPublished ?? false,
          miniSiteCampaigns: Array.isArray(data.miniSiteCampaigns) ? data.miniSiteCampaigns : [],
          templateStyle: data.templateStyle || "modern",
          videoUrl: data.videoUrl || "", showVideo: data.showVideo ?? false,
          teamMembers: Array.isArray(data.teamMembers) ? data.teamMembers : [],
          showTeam: data.showTeam ?? false,
          testimonials: Array.isArray(data.testimonials) ? data.testimonials : [],
          showTestimonials: data.showTestimonials ?? false,
          partners: Array.isArray(data.partners) ? data.partners : [],
          showPartners: data.showPartners ?? false,
          events: Array.isArray(data.events) ? data.events : [],
          showEvents: data.showEvents ?? false,
          faqItems: Array.isArray(data.faqItems) ? data.faqItems : [],
          showFaq: data.showFaq ?? false,
          showVolunteerForm: data.showVolunteerForm ?? false,
          transparencyDocs: Array.isArray(data.transparencyDocs) ? data.transparencyDocs : [],
          showTransparency: data.showTransparency ?? false,
          urgentBanner: data.urgentBanner || { text: "", ctaText: "", ctaUrl: "", isActive: false, bgColor: "#dc2626" },
          showUrgentBanner: data.showUrgentBanner ?? false,
          googleMapsEmbed: data.googleMapsEmbed || "",
          showGoogleMaps: data.showGoogleMaps ?? false,
          showDonationPopup: data.showDonationPopup ?? false,
          donationPopupDelay: data.donationPopupDelay ?? 15,
          donationPopupText: data.donationPopupText || "",
          seoTitle: data.seoTitle || "", seoDescription: data.seoDescription || "",
          seoKeywords: data.seoKeywords || "",
          counterStats: Array.isArray(data.counterStats) ? data.counterStats : [],
          showCounterStats: data.showCounterStats ?? false,
        }));

        if (data.heroTitle || data.aboutText || data.missionText) setAiGenerated(true);
      } catch (err) {
        console.error("Error loading minisite data:", err);
        setLoadError(err instanceof Error ? err.message : "Eroare la incarcarea datelor.");
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
        throw new Error(errData?.error || "Eroare la salvare. Incercati din nou.");
      }
      setSaveMessage({ type: "success", text: "Mini-site-ul a fost salvat cu succes!" });
      clearSaveMessage();
    } catch (err) {
      console.error("Error saving minisite:", err);
      setSaveMessage({ type: "error", text: err instanceof Error ? err.message : "Eroare la salvare." });
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
          autoSave: saveAndPublish, autoPublish: saveAndPublish,
        }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.error || "Eroare la generarea continutului AI.");
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
        faqItems: Array.isArray(gen.faqItems) ? gen.faqItems.map((f: any, i: number) => ({ ...f, id: f.id || `faq-${Date.now()}-${i}` })) : prev.faqItems,
        testimonials: Array.isArray(gen.testimonials) ? gen.testimonials.map((t: any, i: number) => ({ ...t, id: t.id || `test-${Date.now()}-${i}` })) : prev.testimonials,
        counterStats: Array.isArray(gen.counterStats) ? gen.counterStats.map((c: any, i: number) => ({ ...c, id: c.id || `stat-${Date.now()}-${i}` })) : prev.counterStats,
        showFaq: Array.isArray(gen.faqItems) && gen.faqItems.length > 0 ? true : prev.showFaq,
        showTestimonials: Array.isArray(gen.testimonials) && gen.testimonials.length > 0 ? true : prev.showTestimonials,
        showDonationPopup: data.published ? true : prev.showDonationPopup,
        seoTitle: gen.seoTitle || prev.seoTitle,
        seoDescription: gen.seoDescription || prev.seoDescription,
      }));
      setAiGenerated(true);

      if (data.saved && data.siteUrl) {
        setSaveMessage({ type: "success", text: `Site-ul a fost generat si publicat! Viziteaza: ${window.location.origin}${data.siteUrl}` });
      } else {
        setSaveMessage({ type: "success", text: "Continutul a fost generat cu succes! Puteti edita textele si apoi salva." });
        clearSaveMessage();
      }
    } catch (err) {
      console.error("Error generating AI content:", err);
      setSaveMessage({ type: "error", text: err instanceof Error ? err.message : "Eroare la generarea continutului AI." });
      clearSaveMessage();
    } finally {
      setGenerating(false);
    }
  };

  const handlePreview = () => {
    if (state.slug) window.open(`/s/${state.slug}`, "_blank");
  };

  // ─── AI Tool Generate (per-section) ─────────────────────────────

  const handleAiToolGenerate = async (toolName: string, extraContext?: Record<string, any>) => {
    try {
      setAiToolLoading(toolName);
      setSaveMessage(null);
      const res = await fetch("/api/minisite/ai-tools", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tool: toolName,
          context: {
            name: state.ngoName, ngoName: state.ngoName,
            description: state.description, category: state.category,
            shortDescription: state.shortDescription, aboutText: state.aboutText,
            missionText: state.missionText, contactAddress: state.contactAddress,
            showFormular230: state.showFormular230, showDonation: state.showDonation,
            ...extraContext,
          },
        }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.error || "Eroare la generarea cu AI.");
      }
      const raw = await res.json();
      const data = raw.result || raw;

      if (toolName === "faq" && Array.isArray(data.faqItems))
        updateField("faqItems", data.faqItems.map((f: any, i: number) => ({ ...f, id: f.id || `faq-${Date.now()}-${i}` })) as any);
      if (toolName === "testimonials" && Array.isArray(data.testimonials))
        updateField("testimonials", data.testimonials.map((t: any, i: number) => ({ ...t, id: t.id || `test-${Date.now()}-${i}` })) as any);
      if (toolName === "counterStats" && Array.isArray(data.counterStats))
        updateField("counterStats", data.counterStats.map((c: any, i: number) => ({ ...c, id: c.id || `stat-${Date.now()}-${i}` })) as any);
      if (toolName === "team" && Array.isArray(data.teamMembers))
        updateField("teamMembers", data.teamMembers.map((m: any, i: number) => ({ ...m, id: m.id || `tm-${Date.now()}-${i}` })) as any);
      if (toolName === "events" && Array.isArray(data.events))
        updateField("events", data.events.map((e: any, i: number) => ({ ...e, id: e.id || `ev-${Date.now()}-${i}` })) as any);
      if (toolName === "partners" && Array.isArray(data.partners))
        updateField("partners", data.partners.map((p: any, i: number) => ({ ...p, id: p.id || `par-${Date.now()}-${i}` })) as any);
      if (toolName === "transparency" && Array.isArray(data.transparencyDocs))
        updateField("transparencyDocs", data.transparencyDocs.map((d: any, i: number) => ({ ...d, id: d.id || `doc-${Date.now()}-${i}` })) as any);
      if (toolName === "seo" && data.seoTitle)
        setState((prev) => ({ ...prev, seoTitle: data.seoTitle || prev.seoTitle, seoDescription: data.seoDescription || prev.seoDescription, seoKeywords: data.seoKeywords || prev.seoKeywords }));
      if (toolName === "urgentBanner" && data.urgentBanner)
        updateField("urgentBanner", data.urgentBanner as any);
      if (toolName === "donationPopup" && data.donationPopupText)
        setState((prev) => ({ ...prev, donationPopupText: data.donationPopupText || prev.donationPopupText, donationPopupDelay: data.donationPopupDelay ?? prev.donationPopupDelay }));
      if (toolName === "enhanceCampaign" && data.title && extraContext?.campaignIdx !== undefined) {
        const cIdx = extraContext.campaignIdx;
        setState((prev) => ({ ...prev, miniSiteCampaigns: prev.miniSiteCampaigns.map((c, i) => i === cIdx ? { ...c, title: data.title || c.title, description: data.description || c.description } : c) }));
      }
      if (toolName === "generateCampaigns" && Array.isArray(data.campaigns)) {
        const newCampaigns = data.campaigns.map((c: any, i: number) => ({
          id: `ai-${Date.now()}-${i}`, title: c.title || "", description: c.description || "",
          goalAmount: c.goalAmount || 5000, raisedAmount: 0, imageUrl: c.imageUrl || "", isActive: true,
        }));
        setState((prev) => ({ ...prev, miniSiteCampaigns: [...prev.miniSiteCampaigns, ...newCampaigns] }));
      }
      setSaveMessage({ type: "success", text: "Continut generat cu AI cu succes!" });
      clearSaveMessage();
    } catch (err) {
      console.error("AI tool error:", err);
      setSaveMessage({ type: "error", text: err instanceof Error ? err.message : "Eroare la generarea cu AI." });
      clearSaveMessage();
    } finally {
      setAiToolLoading(null);
    }
  };

  // ─── Loading / Error ──────────────────────────────────────────────

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

  // ─── Render ──────────────────────────────────────────────────────

  return (
    <div className="space-y-6 pb-24">
      {/* ═══ HEADER ════════════════════════════════════════════════════ */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Constructor Mini-Site</h1>
          <p className="text-muted-foreground mt-1">Construieste pagina publica a organizatiei tale</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={state.isPublished ? "success" : "secondary"} className="px-3 py-1">
            {state.isPublished ? "Publicat" : "Nepublicat"}
          </Badge>
          {state.slug && (
            <Button variant="outline" size="sm" onClick={handlePreview} className="gap-1.5 font-mono text-xs">
              /s/{state.slug} <ExternalLink className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>

      {/* ═══ AI GENERATE BANNER ═══════════════════════════════════════ */}
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
              onClick={() => handleAiGenerate(true)}
            >
              {generating ? (
                <><Loader2 className="h-5 w-5 animate-spin" /> AI genereaza site-ul...</>
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

      {/* ═══ SECTION 1: IDENTITATE ═════════════════════════════════════ */}
      <Section
        id="identitate" title="Identitate organizatie"
        description="Nume, logo, descriere si categorie"
        icon={Building} expanded={expandedSections.has("identitate")} onToggle={toggleSection}
        badge={state.ngoName ? <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50 text-xs">Completat</Badge> : undefined}
      >
        <div className="space-y-5">
          {/* Logo */}
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

          {/* Cover Image */}
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

      {/* ═══ SECTION 2: DATE LEGALE ════════════════════════════════════ */}
      <Section
        id="legal" title="Date legale si bancare"
        description="CUI, IBAN, numar inregistrare"
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

      {/* ═══ SECTION 3: CONTACT & SOCIAL ═══════════════════════════════ */}
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

      {/* ═══ SECTION 4: FORMULAR 230 ═══════════════════════════════════ */}
      <Section
        id="formular230" title="Formular 230 - Redirectionare 3,5%"
        description="Formular online si PDF descarcabil"
        icon={FileText} expanded={expandedSections.has("formular230")} onToggle={toggleSection}
        badge={state.formular230EmbedCode ? <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50 text-xs">Configurat</Badge> : undefined}
      >
        <div className="space-y-5">
          <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="space-y-1">
                <h4 className="font-semibold text-blue-900 text-sm">Pasul 1: Creeaza cont pe formular230.ro</h4>
                <p className="text-xs text-blue-700">Inregistreaza-te gratuit, adauga datele asociatiei si copiaza codul embed generat.</p>
              </div>
              <a href="https://formular230.ro" target="_blank" rel="noopener noreferrer"
                className="shrink-0 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg font-medium hover:bg-blue-700 transition-colors">
                Mergi la formular230.ro <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="font-medium">Cod embed de la formular230.ro</Label>
            <Textarea placeholder={'<iframe src="https://formular230.ro/organizatia-ta" width="100%" height="600" ...></iframe>'}
              value={state.formular230EmbedCode} onChange={(e) => updateField("formular230EmbedCode", e.target.value)}
              rows={3} className="font-mono text-sm" />
            {state.formular230EmbedCode && (
              <div className="flex items-center gap-2 text-sm text-green-700">
                <CheckCircle2 className="h-4 w-4" /> Cod embed configurat
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label className="font-medium flex items-center gap-2"><Download className="h-4 w-4" /> Link PDF Formular 230 (optional)</Label>
            <Input placeholder="https://drive.google.com/... sau https://exemplu.ro/formular-230.pdf"
              value={state.formular230PdfUrl} onChange={(e) => updateField("formular230PdfUrl", e.target.value)} />
            <p className="text-xs text-muted-foreground">Urca PDF-ul pe Google Drive sau Dropbox si lipeste link-ul aici.</p>
          </div>
        </div>
      </Section>

      {/* ═══ SECTION 5: CAMPANII ═══════════════════════════════════════ */}
      <Section
        id="campanii" title="Campanii de strangere de fonduri"
        description={`${state.miniSiteCampaigns.length} campani${state.miniSiteCampaigns.length === 1 ? "e" : "i"} configurate`}
        icon={Heart} expanded={expandedSections.has("campanii")} onToggle={toggleSection}
        badge={state.miniSiteCampaigns.length > 0 ? (
          <Badge variant="outline" className="text-primary border-primary/30 bg-primary/5 text-xs">
            {state.miniSiteCampaigns.length} campanii
          </Badge>
        ) : undefined}
      >
        <div className="space-y-4">
          <div className="flex gap-2 justify-end">
            <Button variant="outline" size="sm" disabled={aiToolLoading === "generateCampaigns"}
              onClick={() => handleAiToolGenerate("generateCampaigns")}>
              {aiToolLoading === "generateCampaigns" ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Sparkles className="h-4 w-4 mr-1" />}
              Genereaza cu AI
            </Button>
            <Button size="sm" onClick={() => {
              setState((prev) => ({ ...prev, miniSiteCampaigns: [...prev.miniSiteCampaigns, {
                id: Date.now().toString(), title: "", description: "", goalAmount: 0, raisedAmount: 0, imageUrl: "", isActive: true,
              }] }));
            }}>
              <Plus className="h-4 w-4 mr-1" /> Adauga campanie
            </Button>
          </div>

          {state.miniSiteCampaigns.length === 0 ? (
            <div className="text-center py-10 border-2 border-dashed rounded-xl">
              <Target className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <h3 className="font-semibold text-lg mb-1">Nicio campanie inca</h3>
              <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
                Adauga prima ta campanie sau lasa AI sa genereze campanii potrivite.
              </p>
            </div>
          ) : (
            state.miniSiteCampaigns.map((campaign, idx) => (
              <Card key={campaign.id} className="border shadow-sm">
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <Badge variant={campaign.isActive ? "default" : "secondary"}>
                      {campaign.isActive ? "Activa" : "Inactiva"}
                    </Badge>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" onClick={() => {
                        setState((prev) => ({ ...prev, miniSiteCampaigns: prev.miniSiteCampaigns.map((c, i) =>
                          i === idx ? { ...c, isActive: !c.isActive } : c) }));
                      }}>
                        {campaign.isActive ? <><EyeOff className="h-4 w-4 mr-1" /> Dezactiveaza</> : <><Eye className="h-4 w-4 mr-1" /> Activeaza</>}
                      </Button>
                      <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        onClick={() => setState((prev) => ({ ...prev, miniSiteCampaigns: prev.miniSiteCampaigns.filter((_, i) => i !== idx) }))}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2 md:col-span-2">
                      <Label>Titlu campanie *</Label>
                      <Input placeholder="Ex: Ajuta 100 de copii sa mearga la scoala" value={campaign.title}
                        onChange={(e) => setState((prev) => ({ ...prev, miniSiteCampaigns: prev.miniSiteCampaigns.map((c, i) =>
                          i === idx ? { ...c, title: e.target.value } : c) }))} />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label>Descriere</Label>
                      <Textarea placeholder="Ce doriti sa realizati, de ce e important..." rows={3}
                        value={campaign.description} onChange={(e) => setState((prev) => ({ ...prev,
                          miniSiteCampaigns: prev.miniSiteCampaigns.map((c, i) =>
                            i === idx ? { ...c, description: e.target.value } : c) }))} />
                    </div>
                    <div className="space-y-2">
                      <Label>Obiectiv (RON)</Label>
                      <Input type="number" placeholder="10000" value={campaign.goalAmount || ""}
                        onChange={(e) => setState((prev) => ({ ...prev, miniSiteCampaigns: prev.miniSiteCampaigns.map((c, i) =>
                          i === idx ? { ...c, goalAmount: parseFloat(e.target.value) || 0 } : c) }))} />
                    </div>
                    <div className="space-y-2">
                      <Label>Suma stransa (RON)</Label>
                      <Input type="number" placeholder="0" value={campaign.raisedAmount || ""}
                        onChange={(e) => setState((prev) => ({ ...prev, miniSiteCampaigns: prev.miniSiteCampaigns.map((c, i) =>
                          i === idx ? { ...c, raisedAmount: parseFloat(e.target.value) || 0 } : c) }))} />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label>Imagine campanie (URL)</Label>
                      <Input placeholder="https://exemplu.ro/imagine-campanie.jpg" value={campaign.imageUrl}
                        onChange={(e) => setState((prev) => ({ ...prev, miniSiteCampaigns: prev.miniSiteCampaigns.map((c, i) =>
                          i === idx ? { ...c, imageUrl: e.target.value } : c) }))} />
                    </div>
                  </div>

                  {/* Campaign Updates / Timeline */}
                  <div className="space-y-3 border-t pt-4">
                    <div className="flex items-center justify-between">
                      <Label className="flex items-center gap-1.5">
                        <CalendarDays className="h-4 w-4" />
                        Actualizari campanie
                      </Label>
                      <Button variant="outline" size="sm" onClick={() => {
                        const today = new Date().toISOString().split("T")[0];
                        setState((prev) => ({ ...prev, miniSiteCampaigns: prev.miniSiteCampaigns.map((c, i) =>
                          i === idx ? { ...c, updates: [...(c.updates || []), { id: Date.now().toString(), date: today, text: "" }] } : c) }));
                      }}>
                        <Plus className="h-3.5 w-3.5 mr-1" /> Adauga update
                      </Button>
                    </div>
                    {(campaign.updates || []).length === 0 ? (
                      <p className="text-xs text-muted-foreground italic">Niciun update adaugat. Adauga actualizari pentru a tine donatorii la curent cu progresul campaniei.</p>
                    ) : (
                      <div className="space-y-2">
                        {(campaign.updates || []).map((update, uIdx) => (
                          <div key={update.id} className="flex gap-2 items-start">
                            <Input type="date" value={update.date} className="w-40 shrink-0 text-xs"
                              onChange={(e) => setState((prev) => ({ ...prev, miniSiteCampaigns: prev.miniSiteCampaigns.map((c, i) =>
                                i === idx ? { ...c, updates: (c.updates || []).map((u, ui) => ui === uIdx ? { ...u, date: e.target.value } : u) } : c) }))} />
                            <Input placeholder="Ex: Operatia a fost realizata cu succes!" value={update.text} className="flex-1 text-xs"
                              onChange={(e) => setState((prev) => ({ ...prev, miniSiteCampaigns: prev.miniSiteCampaigns.map((c, i) =>
                                i === idx ? { ...c, updates: (c.updates || []).map((u, ui) => ui === uIdx ? { ...u, text: e.target.value } : u) } : c) }))} />
                            <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700 shrink-0 h-9 w-9 p-0"
                              onClick={() => setState((prev) => ({ ...prev, miniSiteCampaigns: prev.miniSiteCampaigns.map((c, i) =>
                                i === idx ? { ...c, updates: (c.updates || []).filter((_, ui) => ui !== uIdx) } : c) }))}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="gap-1"
                      disabled={aiToolLoading === `enhance-${idx}`}
                      onClick={async () => { setAiToolLoading(`enhance-${idx}`);
                        await handleAiToolGenerate("enhanceCampaign", { campaignIdx: idx, title: campaign.title, description: campaign.description, goalAmount: campaign.goalAmount });
                        setAiToolLoading(null); }}>
                      {aiToolLoading === `enhance-${idx}` ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                      Imbunatateste cu AI
                    </Button>
                    <Button variant="outline" size="sm" className="gap-1"
                      disabled={aiToolLoading === `social-${idx}`}
                      onClick={async () => { setAiToolLoading(`social-${idx}`);
                        try {
                          const res = await fetch("/api/minisite/ai-tools", {
                            method: "POST", headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ tool: "socialPosts", context: {
                              title: campaign.title, description: campaign.description, goalAmount: campaign.goalAmount,
                              ngoName: state.ngoName, donateUrl: state.slug ? `/s/${state.slug}#campanii` : "",
                            } }),
                          });
                          if (res.ok) {
                            const raw = await res.json(); const data = raw.result || raw;
                            if (Array.isArray(data.posts)) {
                              const text = data.posts.map((p: any) => `--- ${p.platform} ---\n${p.text}`).join("\n\n");
                              navigator.clipboard.writeText(text).then(() => {
                                setSaveMessage({ type: "success", text: "Postari generate si copiate in clipboard!" }); clearSaveMessage();
                              }).catch(() => { setSaveMessage({ type: "success", text: text.substring(0, 200) + "..." }); clearSaveMessage(); });
                            }
                          }
                        } catch { setSaveMessage({ type: "error", text: "Eroare la generarea postarilor." }); clearSaveMessage(); }
                        setAiToolLoading(null); }}>
                      {aiToolLoading === `social-${idx}` ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <MessageSquareQuote className="h-3.5 w-3.5" />}
                      Postari social media
                    </Button>
                  </div>

                  {campaign.goalAmount > 0 && (
                    <div className="pt-3 border-t">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium">{campaign.raisedAmount.toLocaleString("ro-RO")} RON strans</span>
                        <span className="text-muted-foreground">din {campaign.goalAmount.toLocaleString("ro-RO")} RON</span>
                      </div>
                      <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full transition-all"
                          style={{ width: `${Math.min(100, (campaign.raisedAmount / campaign.goalAmount) * 100)}%` }} />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{Math.round((campaign.raisedAmount / campaign.goalAmount) * 100)}% din obiectiv</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </Section>

      {/* ═══ SECTION 6: CONTINUT AI ════════════════════════════════════ */}
      <Section
        id="continut-ai" title="Continut generat cu AI"
        description="Texte hero, despre noi, misiune, impact"
        icon={Wand2} expanded={expandedSections.has("continut-ai")} onToggle={toggleSection}
        badge={aiGenerated ? <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50 text-xs">Generat</Badge> : undefined}
      >
        <div className="space-y-5">
          {!aiGenerated && (
            <div className="text-center py-6 border-2 border-dashed rounded-xl">
              <Wand2 className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground mb-4">Genereaza continutul automat cu AI sau completeaza manual mai jos.</p>
              <Button onClick={() => handleAiGenerate(false)} disabled={generating} className="gap-2">
                {generating ? <><Loader2 className="h-4 w-4 animate-spin" /> Se genereaza...</> : <><Sparkles className="h-4 w-4" /> Genereaza cu AI</>}
              </Button>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-2">
              <Label className="font-medium">Titlu Hero</Label>
              <Input value={state.heroTitle} onChange={(e) => updateField("heroTitle", e.target.value)}
                placeholder="Titlul principal al paginii..." />
            </div>
            <div className="space-y-2">
              <Label className="font-medium">Text buton CTA</Label>
              <Input value={state.heroCtaText} onChange={(e) => updateField("heroCtaText", e.target.value)}
                placeholder="Doneaza acum" />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="font-medium">Descriere Hero</Label>
            <Textarea value={state.heroDescription} onChange={(e) => updateField("heroDescription", e.target.value)}
              placeholder="Subtitlul de pe pagina principala..." rows={3} />
          </div>

          <div className="space-y-2">
            <Label className="font-medium">Sectiunea Despre noi</Label>
            <Textarea value={state.aboutText} onChange={(e) => updateField("aboutText", e.target.value)}
              placeholder="Prezentarea organizatiei..." rows={4} />
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2 font-medium"><Image className="h-4 w-4" /> Imagine Despre noi (optional)</Label>
            <Input placeholder="https://exemplu.ro/echipa.jpg" value={state.aboutImageUrl}
              onChange={(e) => updateField("aboutImageUrl", e.target.value)} />
            {state.aboutImageUrl && (
              <div className="mt-2 border rounded-lg overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={state.aboutImageUrl} alt="About preview" className="w-full h-40 object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label className="font-medium">Sectiunea Misiune</Label>
            <Textarea value={state.missionText} onChange={(e) => updateField("missionText", e.target.value)}
              placeholder="Misiunea si viziunea organizatiei..." rows={4} />
          </div>

          <div className="space-y-2">
            <Label className="font-medium">Text Impact</Label>
            <Textarea value={state.impactText} onChange={(e) => updateField("impactText", e.target.value)}
              placeholder="Descrierea impactului asupra comunitatii..." rows={3} />
          </div>

          {aiGenerated && (
            <Button variant="outline" onClick={() => handleAiGenerate(false)} disabled={generating} className="gap-2">
              {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              Regenereaza continutul
            </Button>
          )}
        </div>
      </Section>

      {/* ═══ SECTION 7: FUNCTIONALITATI (FEATURE GRID) ═════════════════ */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <LayoutGrid className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Functionalitati extra</h2>
            <p className="text-sm text-muted-foreground">Activeaza si configureaza sectiunile suplimentare</p>
          </div>
        </div>

        {/* Feature Toggle Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          <FeatureCard icon={Search} title="SEO" description="Optimizare Google" enabled={!!state.seoTitle}
            onToggle={() => setActiveFeature(activeFeature === "seo" ? null : "seo")}
            configured={!!state.seoTitle} onClick={() => setActiveFeature(activeFeature === "seo" ? null : "seo")} />
          <FeatureCard icon={Video} title="Video" description="Embed YouTube/Vimeo" enabled={state.showVideo}
            onToggle={() => updateField("showVideo", !state.showVideo)}
            configured={!!state.videoUrl} onClick={() => setActiveFeature(activeFeature === "video" ? null : "video")} />
          <FeatureCard icon={Users} title="Echipa" description="Membrii echipei" enabled={state.showTeam}
            onToggle={() => updateField("showTeam", !state.showTeam)}
            configured={state.teamMembers.length > 0} onClick={() => setActiveFeature(activeFeature === "team" ? null : "team")} />
          <FeatureCard icon={MessageSquareQuote} title="Testimoniale" description="Povesti si recenzii" enabled={state.showTestimonials}
            onToggle={() => updateField("showTestimonials", !state.showTestimonials)}
            configured={state.testimonials.length > 0} onClick={() => setActiveFeature(activeFeature === "testimonials" ? null : "testimonials")} />
          <FeatureCard icon={HelpCircle} title="FAQ" description="Intrebari frecvente" enabled={state.showFaq}
            onToggle={() => updateField("showFaq", !state.showFaq)}
            configured={state.faqItems.length > 0} onClick={() => setActiveFeature(activeFeature === "faq" ? null : "faq")} />
          <FeatureCard icon={Handshake} title="Parteneri" description="Logo-uri sponsori" enabled={state.showPartners}
            onToggle={() => updateField("showPartners", !state.showPartners)}
            configured={state.partners.length > 0} onClick={() => setActiveFeature(activeFeature === "partners" ? null : "partners")} />
          <FeatureCard icon={CalendarDays} title="Evenimente" description="Calendar evenimente" enabled={state.showEvents}
            onToggle={() => updateField("showEvents", !state.showEvents)}
            configured={state.events.length > 0} onClick={() => setActiveFeature(activeFeature === "events" ? null : "events")} />
          <FeatureCard icon={BarChart3} title="Statistici" description="Numere animate" enabled={state.showCounterStats}
            onToggle={() => updateField("showCounterStats", !state.showCounterStats)}
            configured={state.counterStats.length > 0} onClick={() => setActiveFeature(activeFeature === "stats" ? null : "stats")} />
          <FeatureCard icon={FileDown} title="Transparenta" description="Rapoarte PDF" enabled={state.showTransparency}
            onToggle={() => updateField("showTransparency", !state.showTransparency)}
            configured={state.transparencyDocs.length > 0} onClick={() => setActiveFeature(activeFeature === "transparency" ? null : "transparency")} />
          <FeatureCard icon={Map} title="Harta" description="Google Maps embed" enabled={state.showGoogleMaps}
            onToggle={() => updateField("showGoogleMaps", !state.showGoogleMaps)}
            configured={!!state.googleMapsEmbed} onClick={() => setActiveFeature(activeFeature === "map" ? null : "map")} />
          <FeatureCard icon={Bell} title="Banner urgent" description="Anunt campanie urgenta" enabled={state.showUrgentBanner}
            onToggle={() => updateField("showUrgentBanner", !state.showUrgentBanner)}
            configured={!!state.urgentBanner.text} onClick={() => setActiveFeature(activeFeature === "banner" ? null : "banner")} />
          <FeatureCard icon={Heart} title="Popup donatie" description="Popup conversie donatii" enabled={state.showDonationPopup}
            onToggle={() => updateField("showDonationPopup", !state.showDonationPopup)}
            configured={!!state.donationPopupText} onClick={() => setActiveFeature(activeFeature === "popup" ? null : "popup")} />
        </div>

        {/* ─── Feature Editor Panels ──────────────────────────────── */}
        {activeFeature === "seo" && (
          <Card><CardContent className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold flex items-center gap-2"><Search className="h-5 w-5" /> SEO - Optimizare Google</h3>
              <Button variant="outline" size="sm" className="gap-2" disabled={aiToolLoading === "seo"} onClick={() => handleAiToolGenerate("seo")}>
                {aiToolLoading === "seo" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />} Genereaza cu AI
              </Button>
            </div>
            <div className="space-y-2"><Label>Titlu SEO (max 60 caractere)</Label>
              <Input placeholder="Titlu optimizat pentru Google..." value={state.seoTitle} onChange={(e) => updateField("seoTitle", e.target.value)} maxLength={60} /></div>
            <div className="space-y-2"><Label>Descriere SEO (max 155 caractere)</Label>
              <Textarea placeholder="Descriere captivanta..." value={state.seoDescription} onChange={(e) => updateField("seoDescription", e.target.value)} rows={2} /></div>
            <div className="space-y-2"><Label>Cuvinte cheie (separate prin virgula)</Label>
              <Input placeholder="ONG, donatii, voluntariat, ..." value={state.seoKeywords} onChange={(e) => updateField("seoKeywords", e.target.value)} /></div>
          </CardContent></Card>
        )}

        {activeFeature === "video" && (
          <Card><CardContent className="p-5 space-y-4">
            <h3 className="font-semibold flex items-center gap-2"><Video className="h-5 w-5" /> Video embed</h3>
            <div className="space-y-2"><Label>URL Video (YouTube sau Vimeo)</Label>
              <Input placeholder="https://www.youtube.com/watch?v=..." value={state.videoUrl} onChange={(e) => updateField("videoUrl", e.target.value)} /></div>
          </CardContent></Card>
        )}

        {activeFeature === "team" && (
          <Card><CardContent className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold flex items-center gap-2"><Users className="h-5 w-5" /> Echipa</h3>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="gap-1" disabled={aiToolLoading === "team"} onClick={() => handleAiToolGenerate("team")}>
                  {aiToolLoading === "team" ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />} AI
                </Button>
                <Button size="sm" onClick={() => setState(p => ({ ...p, teamMembers: [...p.teamMembers, { id: Date.now().toString(), name: "", role: "", photoUrl: "", bio: "" }] }))}>
                  <Plus className="h-4 w-4 mr-1" /> Adauga
                </Button>
              </div>
            </div>
            {state.teamMembers.map((m, idx) => (
              <div key={m.id} className="border rounded-xl p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <Badge variant="outline">Membru {idx + 1}</Badge>
                  <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700"
                    onClick={() => setState(p => ({ ...p, teamMembers: p.teamMembers.filter((_, i) => i !== idx) }))}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Input placeholder="Nume" value={m.name} onChange={(e) => setState(p => ({ ...p, teamMembers: p.teamMembers.map((t, i) => i === idx ? { ...t, name: e.target.value } : t) }))} />
                  <Input placeholder="Rol / Functie" value={m.role} onChange={(e) => setState(p => ({ ...p, teamMembers: p.teamMembers.map((t, i) => i === idx ? { ...t, role: e.target.value } : t) }))} />
                </div>
                <Input placeholder="URL poza (optional)" value={m.photoUrl} onChange={(e) => setState(p => ({ ...p, teamMembers: p.teamMembers.map((t, i) => i === idx ? { ...t, photoUrl: e.target.value } : t) }))} />
                <Textarea placeholder="Scurta descriere..." rows={2} value={m.bio} onChange={(e) => setState(p => ({ ...p, teamMembers: p.teamMembers.map((t, i) => i === idx ? { ...t, bio: e.target.value } : t) }))} />
              </div>
            ))}
            {state.teamMembers.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Niciun membru adaugat.</p>}
          </CardContent></Card>
        )}

        {activeFeature === "testimonials" && (
          <Card><CardContent className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold flex items-center gap-2"><MessageSquareQuote className="h-5 w-5" /> Testimoniale</h3>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="gap-1" disabled={aiToolLoading === "testimonials"} onClick={() => handleAiToolGenerate("testimonials")}>
                  {aiToolLoading === "testimonials" ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />} AI
                </Button>
                <Button size="sm" onClick={() => setState(p => ({ ...p, testimonials: [...p.testimonials, { id: Date.now().toString(), name: "", role: "", text: "", photoUrl: "" }] }))}>
                  <Plus className="h-4 w-4 mr-1" /> Adauga
                </Button>
              </div>
            </div>
            {state.testimonials.map((t, idx) => (
              <div key={t.id} className="border rounded-xl p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <Badge variant="outline">Testimonial {idx + 1}</Badge>
                  <Button variant="ghost" size="sm" className="text-red-500"
                    onClick={() => setState(p => ({ ...p, testimonials: p.testimonials.filter((_, i) => i !== idx) }))}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Input placeholder="Nume" value={t.name} onChange={(e) => setState(p => ({ ...p, testimonials: p.testimonials.map((x, i) => i === idx ? { ...x, name: e.target.value } : x) }))} />
                  <Input placeholder="Rol (Donator/Beneficiar/Voluntar)" value={t.role} onChange={(e) => setState(p => ({ ...p, testimonials: p.testimonials.map((x, i) => i === idx ? { ...x, role: e.target.value } : x) }))} />
                </div>
                <Textarea placeholder="Text testimonial..." rows={3} value={t.text} onChange={(e) => setState(p => ({ ...p, testimonials: p.testimonials.map((x, i) => i === idx ? { ...x, text: e.target.value } : x) }))} />
              </div>
            ))}
            {state.testimonials.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Niciun testimonial adaugat.</p>}
          </CardContent></Card>
        )}

        {activeFeature === "faq" && (
          <Card><CardContent className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold flex items-center gap-2"><HelpCircle className="h-5 w-5" /> Intrebari frecvente (FAQ)</h3>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="gap-1" disabled={aiToolLoading === "faq"} onClick={() => handleAiToolGenerate("faq")}>
                  {aiToolLoading === "faq" ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />} AI
                </Button>
                <Button size="sm" onClick={() => setState(p => ({ ...p, faqItems: [...p.faqItems, { id: Date.now().toString(), question: "", answer: "" }] }))}>
                  <Plus className="h-4 w-4 mr-1" /> Adauga
                </Button>
              </div>
            </div>
            {state.faqItems.map((f, idx) => (
              <div key={f.id} className="border rounded-xl p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <Badge variant="outline">Intrebarea {idx + 1}</Badge>
                  <Button variant="ghost" size="sm" className="text-red-500"
                    onClick={() => setState(p => ({ ...p, faqItems: p.faqItems.filter((_, i) => i !== idx) }))}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <Input placeholder="Intrebare..." value={f.question} onChange={(e) => setState(p => ({ ...p, faqItems: p.faqItems.map((x, i) => i === idx ? { ...x, question: e.target.value } : x) }))} />
                <Textarea placeholder="Raspuns..." rows={3} value={f.answer} onChange={(e) => setState(p => ({ ...p, faqItems: p.faqItems.map((x, i) => i === idx ? { ...x, answer: e.target.value } : x) }))} />
              </div>
            ))}
            {state.faqItems.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Niciun FAQ adaugat.</p>}
          </CardContent></Card>
        )}

        {activeFeature === "partners" && (
          <Card><CardContent className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold flex items-center gap-2"><Handshake className="h-5 w-5" /> Parteneri / Sponsori</h3>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="gap-1" disabled={aiToolLoading === "partners"} onClick={() => handleAiToolGenerate("partners")}>
                  {aiToolLoading === "partners" ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />} AI
                </Button>
                <Button size="sm" onClick={() => setState(p => ({ ...p, partners: [...p.partners, { id: Date.now().toString(), name: "", logoUrl: "", websiteUrl: "" }] }))}>
                  <Plus className="h-4 w-4 mr-1" /> Adauga
                </Button>
              </div>
            </div>
            {state.partners.map((partner, idx) => (
              <div key={partner.id} className="border rounded-xl p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <Badge variant="outline">Partener {idx + 1}</Badge>
                  <Button variant="ghost" size="sm" className="text-red-500"
                    onClick={() => setState(prev => ({ ...prev, partners: prev.partners.filter((_, i) => i !== idx) }))}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <Input placeholder="Nume partener" value={partner.name} onChange={(e) => setState(prev => ({ ...prev, partners: prev.partners.map((x, i) => i === idx ? { ...x, name: e.target.value } : x) }))} />
                  <Input placeholder="URL logo" value={partner.logoUrl} onChange={(e) => setState(prev => ({ ...prev, partners: prev.partners.map((x, i) => i === idx ? { ...x, logoUrl: e.target.value } : x) }))} />
                  <Input placeholder="Website" value={partner.websiteUrl} onChange={(e) => setState(prev => ({ ...prev, partners: prev.partners.map((x, i) => i === idx ? { ...x, websiteUrl: e.target.value } : x) }))} />
                </div>
              </div>
            ))}
            {state.partners.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Niciun partener adaugat.</p>}
          </CardContent></Card>
        )}

        {activeFeature === "events" && (
          <Card><CardContent className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold flex items-center gap-2"><CalendarDays className="h-5 w-5" /> Evenimente</h3>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="gap-1" disabled={aiToolLoading === "events"} onClick={() => handleAiToolGenerate("events")}>
                  {aiToolLoading === "events" ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />} AI
                </Button>
                <Button size="sm" onClick={() => setState(p => ({ ...p, events: [...p.events, { id: Date.now().toString(), title: "", date: "", location: "", description: "", imageUrl: "" }] }))}>
                  <Plus className="h-4 w-4 mr-1" /> Adauga
                </Button>
              </div>
            </div>
            {state.events.map((ev, idx) => (
              <div key={ev.id} className="border rounded-xl p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <Badge variant="outline">Eveniment {idx + 1}</Badge>
                  <Button variant="ghost" size="sm" className="text-red-500"
                    onClick={() => setState(p => ({ ...p, events: p.events.filter((_, i) => i !== idx) }))}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Input placeholder="Titlu eveniment" value={ev.title} onChange={(e) => setState(p => ({ ...p, events: p.events.map((x, i) => i === idx ? { ...x, title: e.target.value } : x) }))} />
                  <Input type="date" value={ev.date} onChange={(e) => setState(p => ({ ...p, events: p.events.map((x, i) => i === idx ? { ...x, date: e.target.value } : x) }))} />
                </div>
                <Input placeholder="Locatie" value={ev.location} onChange={(e) => setState(p => ({ ...p, events: p.events.map((x, i) => i === idx ? { ...x, location: e.target.value } : x) }))} />
                <Input placeholder="URL poza (optional)" value={ev.imageUrl || ""} onChange={(e) => setState(p => ({ ...p, events: p.events.map((x, i) => i === idx ? { ...x, imageUrl: e.target.value } : x) }))} />
                <Textarea placeholder="Descriere..." rows={2} value={ev.description} onChange={(e) => setState(p => ({ ...p, events: p.events.map((x, i) => i === idx ? { ...x, description: e.target.value } : x) }))} />
              </div>
            ))}
            {state.events.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Niciun eveniment adaugat.</p>}
          </CardContent></Card>
        )}

        {activeFeature === "stats" && (
          <Card><CardContent className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold flex items-center gap-2"><BarChart3 className="h-5 w-5" /> Statistici animate</h3>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="gap-1" disabled={aiToolLoading === "counterStats"} onClick={() => handleAiToolGenerate("counterStats")}>
                  {aiToolLoading === "counterStats" ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />} AI
                </Button>
                <Button size="sm" onClick={() => setState(p => ({ ...p, counterStats: [...p.counterStats, { id: Date.now().toString(), label: "", value: 0, suffix: "" }] }))}>
                  <Plus className="h-4 w-4 mr-1" /> Adauga
                </Button>
              </div>
            </div>
            {state.counterStats.map((cs, idx) => (
              <div key={cs.id} className="border rounded-xl p-4">
                <div className="flex justify-between items-center mb-3">
                  <Badge variant="outline">Statistica {idx + 1}</Badge>
                  <Button variant="ghost" size="sm" className="text-red-500"
                    onClick={() => setState(p => ({ ...p, counterStats: p.counterStats.filter((_, i) => i !== idx) }))}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <Input placeholder="Eticheta" value={cs.label} onChange={(e) => setState(p => ({ ...p, counterStats: p.counterStats.map((x, i) => i === idx ? { ...x, label: e.target.value } : x) }))} />
                  <Input type="number" placeholder="Valoare" value={cs.value || ""} onChange={(e) => setState(p => ({ ...p, counterStats: p.counterStats.map((x, i) => i === idx ? { ...x, value: parseInt(e.target.value) || 0 } : x) }))} />
                  <Input placeholder="Sufix (+, %, etc)" value={cs.suffix} onChange={(e) => setState(p => ({ ...p, counterStats: p.counterStats.map((x, i) => i === idx ? { ...x, suffix: e.target.value } : x) }))} />
                </div>
              </div>
            ))}
            {state.counterStats.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Nicio statistica adaugata.</p>}
          </CardContent></Card>
        )}

        {activeFeature === "transparency" && (
          <Card><CardContent className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold flex items-center gap-2"><FileDown className="h-5 w-5" /> Documente transparenta</h3>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="gap-1" disabled={aiToolLoading === "transparency"} onClick={() => handleAiToolGenerate("transparency")}>
                  {aiToolLoading === "transparency" ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />} AI
                </Button>
                <Button size="sm" onClick={() => setState(p => ({ ...p, transparencyDocs: [...p.transparencyDocs, { id: Date.now().toString(), title: "", year: new Date().getFullYear().toString(), pdfUrl: "" }] }))}>
                  <Plus className="h-4 w-4 mr-1" /> Adauga
                </Button>
              </div>
            </div>
            {state.transparencyDocs.map((doc, idx) => (
              <div key={doc.id} className="border rounded-xl p-4">
                <div className="flex justify-between items-center mb-3">
                  <Badge variant="outline">Document {idx + 1}</Badge>
                  <Button variant="ghost" size="sm" className="text-red-500"
                    onClick={() => setState(p => ({ ...p, transparencyDocs: p.transparencyDocs.filter((_, i) => i !== idx) }))}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <Input placeholder="Titlu document" value={doc.title} onChange={(e) => setState(p => ({ ...p, transparencyDocs: p.transparencyDocs.map((x, i) => i === idx ? { ...x, title: e.target.value } : x) }))} />
                  <Input placeholder="An" value={doc.year} onChange={(e) => setState(p => ({ ...p, transparencyDocs: p.transparencyDocs.map((x, i) => i === idx ? { ...x, year: e.target.value } : x) }))} />
                  <Input placeholder="URL PDF" value={doc.pdfUrl} onChange={(e) => setState(p => ({ ...p, transparencyDocs: p.transparencyDocs.map((x, i) => i === idx ? { ...x, pdfUrl: e.target.value } : x) }))} />
                </div>
              </div>
            ))}
            {state.transparencyDocs.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Niciun document adaugat.</p>}
          </CardContent></Card>
        )}

        {activeFeature === "map" && (
          <Card><CardContent className="p-5 space-y-4">
            <h3 className="font-semibold flex items-center gap-2"><Map className="h-5 w-5" /> Harta Google Maps</h3>
            <Textarea placeholder={'<iframe src="https://www.google.com/maps/embed?..." ...></iframe>'}
              value={state.googleMapsEmbed} onChange={(e) => updateField("googleMapsEmbed", e.target.value)} rows={3} className="font-mono text-sm" />
          </CardContent></Card>
        )}

        {activeFeature === "banner" && (
          <Card><CardContent className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold flex items-center gap-2"><Bell className="h-5 w-5" /> Banner urgent</h3>
              <Button variant="outline" size="sm" className="gap-1" disabled={aiToolLoading === "urgentBanner"} onClick={() => handleAiToolGenerate("urgentBanner")}>
                {aiToolLoading === "urgentBanner" ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />} AI
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Text banner</Label>
                <Input placeholder="Campanie urgenta! Ajuta-ne..." value={state.urgentBanner.text} onChange={(e) => setState(p => ({ ...p, urgentBanner: { ...p.urgentBanner, text: e.target.value } }))} /></div>
              <div className="space-y-2"><Label>Text buton CTA</Label>
                <Input placeholder="Doneaza acum" value={state.urgentBanner.ctaText} onChange={(e) => setState(p => ({ ...p, urgentBanner: { ...p.urgentBanner, ctaText: e.target.value } }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Link buton</Label>
                <Input placeholder="#donatie" value={state.urgentBanner.ctaUrl} onChange={(e) => setState(p => ({ ...p, urgentBanner: { ...p.urgentBanner, ctaUrl: e.target.value } }))} /></div>
              <div className="space-y-2"><Label>Culoare fundal</Label>
                <div className="flex items-center gap-3">
                  <input type="color" value={state.urgentBanner.bgColor || "#dc2626"} onChange={(e) => setState(p => ({ ...p, urgentBanner: { ...p.urgentBanner, bgColor: e.target.value } }))} className="h-10 w-14 cursor-pointer rounded border border-input" />
                  <Input value={state.urgentBanner.bgColor || "#dc2626"} onChange={(e) => setState(p => ({ ...p, urgentBanner: { ...p.urgentBanner, bgColor: e.target.value } }))} className="font-mono w-32" />
                </div>
              </div>
            </div>
          </CardContent></Card>
        )}

        {activeFeature === "popup" && (
          <Card><CardContent className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold flex items-center gap-2"><Heart className="h-5 w-5" /> Popup donatie</h3>
              <Button variant="outline" size="sm" className="gap-1" disabled={aiToolLoading === "donationPopup"} onClick={() => handleAiToolGenerate("donationPopup")}>
                {aiToolLoading === "donationPopup" ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />} AI
              </Button>
            </div>
            <div className="space-y-2"><Label>Delay (secunde pana la aparitie)</Label>
              <Input type="number" value={state.donationPopupDelay} onChange={(e) => updateField("donationPopupDelay", parseInt(e.target.value) || 15)} className="w-32" /></div>
            <div className="space-y-2"><Label>Text popup</Label>
              <Textarea placeholder="Fiecare donatie conteaza..." value={state.donationPopupText} onChange={(e) => updateField("donationPopupText", e.target.value)} rows={3} /></div>
          </CardContent></Card>
        )}
      </div>

      {/* ═══ SECTION 8: DESIGN ═════════════════════════════════════════ */}
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

          {/* Sectiuni vizibile - compact grid */}
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

          {/* Custom CSS */}
          <div className="border-t pt-6 space-y-2">
            <Label className="font-medium">CSS personalizat (optional)</Label>
            <Textarea placeholder={`.hero-section {\n  background: linear-gradient(...);\n}`}
              value={state.customCss} onChange={(e) => updateField("customCss", e.target.value)}
              rows={4} className="font-mono text-sm" />
          </div>
        </div>
      </Section>

      {/* ═══ SECTION 9: PUBLICARE ══════════════════════════════════════ */}
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

      {/* ═══ STICKY BOTTOM BAR ═════════════════════════════════════════ */}
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
        { title: "Informatii de baza", description: "Seteaza numele, slug-ul (URL), logo-ul si descrierea organizatiei." },
        { title: "Hero", description: "Sectiunea principala cu titlu, descriere, buton CTA si imagine de fundal." },
        { title: "Despre / Misiune / Impact", description: "Texte care prezinta organizatia, misiunea si impactul social." },
        { title: "Retele sociale", description: "Link-uri catre Facebook, Instagram, LinkedIn, YouTube, TikTok, Twitter." },
        { title: "Tema si culori", description: "Personalizeaza culorile principale si de accent ale mini-site-ului." },
        { title: "Date bancare", description: "Informatii bancare afisate pe pagina de donatie (IBAN, banca, titular)." },
        { title: "Previzualizeaza", description: "Click pe Previzualizeaza pentru a vedea cum arata pagina publica." },
      ]} />
    </div>
  );
}

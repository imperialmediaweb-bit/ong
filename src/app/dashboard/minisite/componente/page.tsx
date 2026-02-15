"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Video,
  Users,
  MessageSquareQuote,
  Handshake,
  CalendarDays,
  HelpCircle,
  FileDown,
  Map,
  Bell,
  Heart,
  BarChart3,
  Search,
  Plus,
  Trash2,
  Sparkles,
  Loader2,
  Save,
  CheckCircle2,
  AlertCircle,
  LayoutGrid,
} from "lucide-react";
import { MinisiteSubNav } from "../_components/minisite-nav";

// ─── Types ───────────────────────────────────────────────────────────

interface TeamMember { id: string; name: string; role: string; photoUrl: string; bio: string; }
interface Testimonial { id: string; name: string; role: string; text: string; photoUrl: string; }
interface Partner { id: string; name: string; logoUrl: string; websiteUrl: string; }
interface EventItem { id: string; title: string; date: string; location: string; description: string; imageUrl: string; }
interface FaqItem { id: string; question: string; answer: string; }
interface TransparencyDoc { id: string; title: string; year: string; pdfUrl: string; }
interface UrgentBanner { text: string; ctaText: string; ctaUrl: string; isActive: boolean; bgColor: string; }
interface CounterStat { id: string; label: string; value: number; suffix: string; }

interface ComponentState {
  // Context fields (read-only, for AI)
  ngoName: string;
  description: string;
  shortDescription: string;
  category: string;
  contactAddress: string;
  missionText: string;
  // Component fields
  videoUrl: string;
  showVideo: boolean;
  teamMembers: TeamMember[];
  showTeam: boolean;
  testimonials: Testimonial[];
  showTestimonials: boolean;
  faqItems: FaqItem[];
  showFaq: boolean;
  partners: Partner[];
  showPartners: boolean;
  events: EventItem[];
  showEvents: boolean;
  counterStats: CounterStat[];
  showCounterStats: boolean;
  transparencyDocs: TransparencyDoc[];
  showTransparency: boolean;
  googleMapsEmbed: string;
  showGoogleMaps: boolean;
  urgentBanner: UrgentBanner;
  showUrgentBanner: boolean;
  donationPopupText: string;
  donationPopupDelay: number;
  showDonationPopup: boolean;
}

const DEFAULT_STATE: ComponentState = {
  ngoName: "", description: "", shortDescription: "", category: "",
  contactAddress: "", missionText: "",
  videoUrl: "", showVideo: false,
  teamMembers: [], showTeam: false,
  testimonials: [], showTestimonials: false,
  faqItems: [], showFaq: false,
  partners: [], showPartners: false,
  events: [], showEvents: false,
  counterStats: [], showCounterStats: false,
  transparencyDocs: [], showTransparency: false,
  googleMapsEmbed: "", showGoogleMaps: false,
  urgentBanner: { text: "", ctaText: "", ctaUrl: "", isActive: false, bgColor: "#dc2626" },
  showUrgentBanner: false,
  donationPopupText: "", donationPopupDelay: 15, showDonationPopup: false,
};

// ─── Feature Card Component ──────────────────────────────────────────

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

// ─── Helper: generate unique ID ──────────────────────────────────────

function uid(): string {
  return Math.random().toString(36).substring(2, 10);
}

// ─── Main Component ──────────────────────────────────────────────────

export default function ComponentePage() {
  const [state, setState] = useState<ComponentState>(DEFAULT_STATE);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [aiToolLoading, setAiToolLoading] = useState<string | null>(null);
  const [activeFeature, setActiveFeature] = useState<string | null>(null);

  // ─── Helpers ─────────────────────────────────────────────────────

  const updateField = useCallback(
    <K extends keyof ComponentState>(field: K, value: ComponentState[K]) => {
      setState((prev) => ({ ...prev, [field]: value }));
    }, []
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
        if (!res.ok) throw new Error("Nu s-au putut incarca datele mini-site-ului.");
        const data = await res.json();

        setState({
          // Context (read-only)
          ngoName: data.ngoName || "",
          description: data.description || "",
          shortDescription: data.shortDescription || "",
          category: data.category || "",
          contactAddress: data.contactAddress || "",
          missionText: data.missionText || "",
          // Component fields
          videoUrl: data.videoUrl || "",
          showVideo: data.showVideo ?? false,
          teamMembers: Array.isArray(data.teamMembers) ? data.teamMembers : [],
          showTeam: data.showTeam ?? false,
          testimonials: Array.isArray(data.testimonials) ? data.testimonials : [],
          showTestimonials: data.showTestimonials ?? false,
          faqItems: Array.isArray(data.faqItems) ? data.faqItems : [],
          showFaq: data.showFaq ?? false,
          partners: Array.isArray(data.partners) ? data.partners : [],
          showPartners: data.showPartners ?? false,
          events: Array.isArray(data.events) ? data.events : [],
          showEvents: data.showEvents ?? false,
          counterStats: Array.isArray(data.counterStats) ? data.counterStats : [],
          showCounterStats: data.showCounterStats ?? false,
          transparencyDocs: Array.isArray(data.transparencyDocs) ? data.transparencyDocs : [],
          showTransparency: data.showTransparency ?? false,
          googleMapsEmbed: data.googleMapsEmbed || "",
          showGoogleMaps: data.showGoogleMaps ?? false,
          urgentBanner: data.urgentBanner || { text: "", ctaText: "", ctaUrl: "", isActive: false, bgColor: "#dc2626" },
          showUrgentBanner: data.showUrgentBanner ?? false,
          donationPopupText: data.donationPopupText || "",
          donationPopupDelay: data.donationPopupDelay ?? 15,
          showDonationPopup: data.showDonationPopup ?? false,
        });
      } catch (err) {
        console.error("Error loading minisite data:", err);
        setLoadError(err instanceof Error ? err.message : "Eroare la incarcarea datelor.");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // ─── Save (only component fields) ─────────────────────────────────

  const handleSave = async () => {
    try {
      setSaving(true);
      setSaveMessage(null);
      const payload = {
        videoUrl: state.videoUrl,
        showVideo: state.showVideo,
        teamMembers: state.teamMembers,
        showTeam: state.showTeam,
        testimonials: state.testimonials,
        showTestimonials: state.showTestimonials,
        faqItems: state.faqItems,
        showFaq: state.showFaq,
        partners: state.partners,
        showPartners: state.showPartners,
        events: state.events,
        showEvents: state.showEvents,
        counterStats: state.counterStats,
        showCounterStats: state.showCounterStats,
        transparencyDocs: state.transparencyDocs,
        showTransparency: state.showTransparency,
        googleMapsEmbed: state.googleMapsEmbed,
        showGoogleMaps: state.showGoogleMaps,
        urgentBanner: state.urgentBanner,
        showUrgentBanner: state.showUrgentBanner,
        donationPopupText: state.donationPopupText,
        donationPopupDelay: state.donationPopupDelay,
        showDonationPopup: state.showDonationPopup,
      };
      const res = await fetch("/api/minisite/builder", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.error || "Eroare la salvare. Incercati din nou.");
      }
      setSaveMessage({ type: "success", text: "Componentele au fost salvate cu succes!" });
      clearSaveMessage();
    } catch (err) {
      console.error("Error saving components:", err);
      setSaveMessage({ type: "error", text: err instanceof Error ? err.message : "Eroare la salvare." });
      clearSaveMessage();
    } finally {
      setSaving(false);
    }
  };

  // ─── AI Tool call ──────────────────────────────────────────────────

  const callAiTool = async (toolName: string) => {
    try {
      setAiToolLoading(toolName);
      const res = await fetch("/api/minisite/ai-tools", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tool: toolName,
          context: {
            ngoName: state.ngoName,
            name: state.ngoName,
            description: state.description,
            shortDescription: state.shortDescription,
            category: state.category,
            contactAddress: state.contactAddress,
            missionText: state.missionText,
          },
        }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.error || "Eroare la generarea AI.");
      }
      const data = await res.json();
      return data.result;
    } catch (err) {
      console.error("AI tool error:", err);
      setSaveMessage({ type: "error", text: err instanceof Error ? err.message : "Eroare la generarea AI." });
      clearSaveMessage();
      return null;
    } finally {
      setAiToolLoading(null);
    }
  };

  // ─── AI handlers for each component ────────────────────────────────

  const handleAiTeam = async () => {
    const result = await callAiTool("team");
    if (result?.teamMembers) {
      const members = result.teamMembers.map((m: Omit<TeamMember, "id">) => ({ ...m, id: uid() }));
      updateField("teamMembers", [...state.teamMembers, ...members]);
    }
  };

  const handleAiTestimonials = async () => {
    const result = await callAiTool("testimonials");
    if (result?.testimonials) {
      const items = result.testimonials.map((t: Omit<Testimonial, "id">) => ({ ...t, id: uid() }));
      updateField("testimonials", [...state.testimonials, ...items]);
    }
  };

  const handleAiFaq = async () => {
    const result = await callAiTool("faq");
    if (result?.faqItems) {
      const items = result.faqItems.map((f: Omit<FaqItem, "id">) => ({ ...f, id: uid() }));
      updateField("faqItems", [...state.faqItems, ...items]);
    }
  };

  const handleAiEvents = async () => {
    const result = await callAiTool("events");
    if (result?.events) {
      const items = result.events.map((e: Omit<EventItem, "id">) => ({ ...e, id: uid() }));
      updateField("events", [...state.events, ...items]);
    }
  };

  const handleAiCounterStats = async () => {
    const result = await callAiTool("counterStats");
    if (result?.counterStats) {
      const items = result.counterStats.map((s: Omit<CounterStat, "id">) => ({ ...s, id: uid() }));
      updateField("counterStats", [...state.counterStats, ...items]);
    }
  };

  // ─── Array item helpers ────────────────────────────────────────────

  function updateArrayItem<T extends { id: string }>(
    field: keyof ComponentState,
    items: T[],
    id: string,
    updates: Partial<T>
  ) {
    const updated = items.map((item) => item.id === id ? { ...item, ...updates } : item);
    updateField(field, updated as any);
  }

  function removeArrayItem<T extends { id: string }>(
    field: keyof ComponentState,
    items: T[],
    id: string
  ) {
    updateField(field, items.filter((item) => item.id !== id) as any);
  }

  // ─── Feature definitions ───────────────────────────────────────────

  const features = [
    { key: "video", icon: Video, title: "Video", description: "Embed YouTube sau Vimeo", toggle: "showVideo" as const, configured: !!state.videoUrl },
    { key: "team", icon: Users, title: "Echipa", description: "Membrii echipei organizatiei", toggle: "showTeam" as const, configured: state.teamMembers.length > 0 },
    { key: "testimonials", icon: MessageSquareQuote, title: "Testimoniale", description: "Recenzii si testimoniale", toggle: "showTestimonials" as const, configured: state.testimonials.length > 0 },
    { key: "faq", icon: HelpCircle, title: "FAQ", description: "Intrebari frecvente", toggle: "showFaq" as const, configured: state.faqItems.length > 0 },
    { key: "partners", icon: Handshake, title: "Parteneri", description: "Logo-uri si link-uri parteneri", toggle: "showPartners" as const, configured: state.partners.length > 0 },
    { key: "events", icon: CalendarDays, title: "Evenimente", description: "Evenimente viitoare", toggle: "showEvents" as const, configured: state.events.length > 0 },
    { key: "stats", icon: BarChart3, title: "Statistici", description: "Contoare de impact", toggle: "showCounterStats" as const, configured: state.counterStats.length > 0 },
    { key: "transparency", icon: FileDown, title: "Transparenta", description: "Documente si rapoarte", toggle: "showTransparency" as const, configured: state.transparencyDocs.length > 0 },
    { key: "map", icon: Map, title: "Harta", description: "Google Maps embed", toggle: "showGoogleMaps" as const, configured: !!state.googleMapsEmbed },
    { key: "banner", icon: Bell, title: "Banner urgent", description: "Banner de urgenta cu CTA", toggle: "showUrgentBanner" as const, configured: !!state.urgentBanner.text },
    { key: "popup", icon: Heart, title: "Popup donatie", description: "Popup automat pentru donatii", toggle: "showDonationPopup" as const, configured: !!state.donationPopupText },
  ];

  // ─── Loading / Error states ────────────────────────────────────────

  if (loading) {
    return (
      <div className="p-6">
        <MinisiteSubNav />
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-3 text-muted-foreground">Se incarca componentele...</span>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="p-6">
        <MinisiteSubNav />
        <Card className="max-w-lg mx-auto mt-12">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <p className="text-destructive font-medium mb-2">Eroare la incarcare</p>
            <p className="text-sm text-muted-foreground">{loadError}</p>
            <Button className="mt-4" onClick={() => window.location.reload()}>Reincearca</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ─── Editor panels ─────────────────────────────────────────────────

  const renderEditorPanel = () => {
    if (!activeFeature) return null;

    switch (activeFeature) {
      // ── Video ──────────────────────────────────────────────────────
      case "video":
        return (
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Video className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">Video</h3>
              </div>
              <div className="space-y-2">
                <Label>URL video (YouTube sau Vimeo)</Label>
                <Input
                  placeholder="https://www.youtube.com/embed/..."
                  value={state.videoUrl}
                  onChange={(e) => updateField("videoUrl", e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Foloseste URL-ul de embed (ex: https://www.youtube.com/embed/VIDEO_ID)
                </p>
              </div>
              {state.videoUrl && (
                <div className="rounded-lg overflow-hidden border aspect-video">
                  <iframe
                    src={state.videoUrl}
                    className="w-full h-full"
                    allowFullScreen
                    title="Video preview"
                  />
                </div>
              )}
            </CardContent>
          </Card>
        );

      // ── Echipa ─────────────────────────────────────────────────────
      case "team":
        return (
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">Echipa</h3>
                  <Badge variant="secondary">{state.teamMembers.length} membri</Badge>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleAiTeam}
                    disabled={aiToolLoading === "team"}
                  >
                    {aiToolLoading === "team" ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Sparkles className="h-4 w-4 mr-1" />}
                    Genereaza cu AI
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => updateField("teamMembers", [...state.teamMembers, { id: uid(), name: "", role: "", photoUrl: "", bio: "" }])}
                  >
                    <Plus className="h-4 w-4 mr-1" /> Adauga
                  </Button>
                </div>
              </div>
              {state.teamMembers.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-6">
                  Niciun membru adaugat. Adauga manual sau genereaza cu AI.
                </p>
              )}
              <div className="space-y-4">
                {state.teamMembers.map((member) => (
                  <div key={member.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{member.name || "Membru nou"}</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:text-destructive"
                        onClick={() => removeArrayItem("teamMembers", state.teamMembers, member.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Nume</Label>
                        <Input
                          value={member.name}
                          onChange={(e) => updateArrayItem("teamMembers", state.teamMembers, member.id, { name: e.target.value })}
                          placeholder="Prenume Nume"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Rol</Label>
                        <Input
                          value={member.role}
                          onChange={(e) => updateArrayItem("teamMembers", state.teamMembers, member.id, { role: e.target.value })}
                          placeholder="Director executiv"
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">URL fotografie</Label>
                      <Input
                        value={member.photoUrl}
                        onChange={(e) => updateArrayItem("teamMembers", state.teamMembers, member.id, { photoUrl: e.target.value })}
                        placeholder="https://..."
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Biografie</Label>
                      <Textarea
                        value={member.bio}
                        onChange={(e) => updateArrayItem("teamMembers", state.teamMembers, member.id, { bio: e.target.value })}
                        placeholder="Scurta descriere..."
                        rows={2}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        );

      // ── Testimoniale ───────────────────────────────────────────────
      case "testimonials":
        return (
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <MessageSquareQuote className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">Testimoniale</h3>
                  <Badge variant="secondary">{state.testimonials.length} testimoniale</Badge>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleAiTestimonials}
                    disabled={aiToolLoading === "testimonials"}
                  >
                    {aiToolLoading === "testimonials" ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Sparkles className="h-4 w-4 mr-1" />}
                    Genereaza cu AI
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => updateField("testimonials", [...state.testimonials, { id: uid(), name: "", role: "", text: "", photoUrl: "" }])}
                  >
                    <Plus className="h-4 w-4 mr-1" /> Adauga
                  </Button>
                </div>
              </div>
              {state.testimonials.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-6">
                  Niciun testimonial adaugat. Adauga manual sau genereaza cu AI.
                </p>
              )}
              <div className="space-y-4">
                {state.testimonials.map((t) => (
                  <div key={t.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{t.name || "Testimonial nou"}</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:text-destructive"
                        onClick={() => removeArrayItem("testimonials", state.testimonials, t.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Nume</Label>
                        <Input
                          value={t.name}
                          onChange={(e) => updateArrayItem("testimonials", state.testimonials, t.id, { name: e.target.value })}
                          placeholder="Prenume Nume"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Rol</Label>
                        <Input
                          value={t.role}
                          onChange={(e) => updateArrayItem("testimonials", state.testimonials, t.id, { role: e.target.value })}
                          placeholder="Donator / Voluntar / Beneficiar"
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">URL fotografie</Label>
                      <Input
                        value={t.photoUrl}
                        onChange={(e) => updateArrayItem("testimonials", state.testimonials, t.id, { photoUrl: e.target.value })}
                        placeholder="https://..."
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Text testimonial</Label>
                      <Textarea
                        value={t.text}
                        onChange={(e) => updateArrayItem("testimonials", state.testimonials, t.id, { text: e.target.value })}
                        placeholder="Ce spune aceasta persoana despre organizatie..."
                        rows={3}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        );

      // ── FAQ ────────────────────────────────────────────────────────
      case "faq":
        return (
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <HelpCircle className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">Intrebari frecvente (FAQ)</h3>
                  <Badge variant="secondary">{state.faqItems.length} intrebari</Badge>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleAiFaq}
                    disabled={aiToolLoading === "faq"}
                  >
                    {aiToolLoading === "faq" ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Sparkles className="h-4 w-4 mr-1" />}
                    Genereaza cu AI
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => updateField("faqItems", [...state.faqItems, { id: uid(), question: "", answer: "" }])}
                  >
                    <Plus className="h-4 w-4 mr-1" /> Adauga
                  </Button>
                </div>
              </div>
              {state.faqItems.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-6">
                  Nicio intrebare adaugata. Adauga manual sau genereaza cu AI.
                </p>
              )}
              <div className="space-y-4">
                {state.faqItems.map((faq) => (
                  <div key={faq.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{faq.question || "Intrebare noua"}</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:text-destructive"
                        onClick={() => removeArrayItem("faqItems", state.faqItems, faq.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Intrebare</Label>
                      <Input
                        value={faq.question}
                        onChange={(e) => updateArrayItem("faqItems", state.faqItems, faq.id, { question: e.target.value })}
                        placeholder="Ce intrebare au vizitatorii?"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Raspuns</Label>
                      <Textarea
                        value={faq.answer}
                        onChange={(e) => updateArrayItem("faqItems", state.faqItems, faq.id, { answer: e.target.value })}
                        placeholder="Raspunsul la intrebare..."
                        rows={3}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        );

      // ── Parteneri ──────────────────────────────────────────────────
      case "partners":
        return (
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Handshake className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">Parteneri</h3>
                  <Badge variant="secondary">{state.partners.length} parteneri</Badge>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => updateField("partners", [...state.partners, { id: uid(), name: "", logoUrl: "", websiteUrl: "" }])}
                  >
                    <Plus className="h-4 w-4 mr-1" /> Adauga
                  </Button>
                </div>
              </div>
              {state.partners.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-6">
                  Niciun partener adaugat. Adauga partenerii organizatiei tale.
                </p>
              )}
              <div className="space-y-4">
                {state.partners.map((p) => (
                  <div key={p.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{p.name || "Partener nou"}</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:text-destructive"
                        onClick={() => removeArrayItem("partners", state.partners, p.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Nume partener</Label>
                        <Input
                          value={p.name}
                          onChange={(e) => updateArrayItem("partners", state.partners, p.id, { name: e.target.value })}
                          placeholder="Companie SRL"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">URL logo</Label>
                        <Input
                          value={p.logoUrl}
                          onChange={(e) => updateArrayItem("partners", state.partners, p.id, { logoUrl: e.target.value })}
                          placeholder="https://..."
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Website</Label>
                        <Input
                          value={p.websiteUrl}
                          onChange={(e) => updateArrayItem("partners", state.partners, p.id, { websiteUrl: e.target.value })}
                          placeholder="https://..."
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        );

      // ── Evenimente ─────────────────────────────────────────────────
      case "events":
        return (
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">Evenimente</h3>
                  <Badge variant="secondary">{state.events.length} evenimente</Badge>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleAiEvents}
                    disabled={aiToolLoading === "events"}
                  >
                    {aiToolLoading === "events" ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Sparkles className="h-4 w-4 mr-1" />}
                    Genereaza cu AI
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => updateField("events", [...state.events, { id: uid(), title: "", date: "", location: "", description: "", imageUrl: "" }])}
                  >
                    <Plus className="h-4 w-4 mr-1" /> Adauga
                  </Button>
                </div>
              </div>
              {state.events.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-6">
                  Niciun eveniment adaugat. Adauga manual sau genereaza cu AI.
                </p>
              )}
              <div className="space-y-4">
                {state.events.map((ev) => (
                  <div key={ev.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{ev.title || "Eveniment nou"}</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:text-destructive"
                        onClick={() => removeArrayItem("events", state.events, ev.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Titlu eveniment</Label>
                        <Input
                          value={ev.title}
                          onChange={(e) => updateArrayItem("events", state.events, ev.id, { title: e.target.value })}
                          placeholder="Gala caritabila anuala"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Data</Label>
                        <Input
                          type="date"
                          value={ev.date}
                          onChange={(e) => updateArrayItem("events", state.events, ev.id, { date: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Locatie</Label>
                        <Input
                          value={ev.location}
                          onChange={(e) => updateArrayItem("events", state.events, ev.id, { location: e.target.value })}
                          placeholder="Sala de conferinte, Bucuresti"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">URL imagine</Label>
                        <Input
                          value={ev.imageUrl}
                          onChange={(e) => updateArrayItem("events", state.events, ev.id, { imageUrl: e.target.value })}
                          placeholder="https://..."
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Descriere</Label>
                      <Textarea
                        value={ev.description}
                        onChange={(e) => updateArrayItem("events", state.events, ev.id, { description: e.target.value })}
                        placeholder="Descrierea evenimentului..."
                        rows={2}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        );

      // ── Statistici (Counter Stats) ─────────────────────────────────
      case "stats":
        return (
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">Statistici de impact</h3>
                  <Badge variant="secondary">{state.counterStats.length} statistici</Badge>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleAiCounterStats}
                    disabled={aiToolLoading === "counterStats"}
                  >
                    {aiToolLoading === "counterStats" ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Sparkles className="h-4 w-4 mr-1" />}
                    Genereaza cu AI
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => updateField("counterStats", [...state.counterStats, { id: uid(), label: "", value: 0, suffix: "" }])}
                  >
                    <Plus className="h-4 w-4 mr-1" /> Adauga
                  </Button>
                </div>
              </div>
              {state.counterStats.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-6">
                  Nicio statistica adaugata. Adauga manual sau genereaza cu AI.
                </p>
              )}
              <div className="space-y-4">
                {state.counterStats.map((stat) => (
                  <div key={stat.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{stat.label || "Statistica noua"}</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:text-destructive"
                        onClick={() => removeArrayItem("counterStats", state.counterStats, stat.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Eticheta</Label>
                        <Input
                          value={stat.label}
                          onChange={(e) => updateArrayItem("counterStats", state.counterStats, stat.id, { label: e.target.value })}
                          placeholder="Beneficiari ajutati"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Valoare</Label>
                        <Input
                          type="number"
                          value={stat.value}
                          onChange={(e) => updateArrayItem("counterStats", state.counterStats, stat.id, { value: parseInt(e.target.value) || 0 })}
                          placeholder="1500"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Sufix</Label>
                        <Input
                          value={stat.suffix}
                          onChange={(e) => updateArrayItem("counterStats", state.counterStats, stat.id, { suffix: e.target.value })}
                          placeholder="+ / % / RON"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        );

      // ── Transparenta ───────────────────────────────────────────────
      case "transparency":
        return (
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <FileDown className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">Transparenta</h3>
                  <Badge variant="secondary">{state.transparencyDocs.length} documente</Badge>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => updateField("transparencyDocs", [...state.transparencyDocs, { id: uid(), title: "", year: new Date().getFullYear().toString(), pdfUrl: "" }])}
                  >
                    <Plus className="h-4 w-4 mr-1" /> Adauga
                  </Button>
                </div>
              </div>
              {state.transparencyDocs.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-6">
                  Niciun document adaugat. Adauga rapoarte de transparenta.
                </p>
              )}
              <div className="space-y-4">
                {state.transparencyDocs.map((doc) => (
                  <div key={doc.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{doc.title || "Document nou"}</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:text-destructive"
                        onClick={() => removeArrayItem("transparencyDocs", state.transparencyDocs, doc.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Titlu document</Label>
                        <Input
                          value={doc.title}
                          onChange={(e) => updateArrayItem("transparencyDocs", state.transparencyDocs, doc.id, { title: e.target.value })}
                          placeholder="Raport anual 2024"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">An</Label>
                        <Input
                          value={doc.year}
                          onChange={(e) => updateArrayItem("transparencyDocs", state.transparencyDocs, doc.id, { year: e.target.value })}
                          placeholder="2024"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">URL PDF</Label>
                        <Input
                          value={doc.pdfUrl}
                          onChange={(e) => updateArrayItem("transparencyDocs", state.transparencyDocs, doc.id, { pdfUrl: e.target.value })}
                          placeholder="https://...document.pdf"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        );

      // ── Harta (Google Maps) ────────────────────────────────────────
      case "map":
        return (
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Map className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">Harta Google Maps</h3>
              </div>
              <div className="space-y-2">
                <Label>Cod embed Google Maps</Label>
                <Textarea
                  value={state.googleMapsEmbed}
                  onChange={(e) => updateField("googleMapsEmbed", e.target.value)}
                  placeholder='<iframe src="https://www.google.com/maps/embed?pb=..." ...></iframe>'
                  rows={4}
                />
                <p className="text-xs text-muted-foreground">
                  Copiaza codul de embed din Google Maps (Share &gt; Embed a map)
                </p>
              </div>
              {state.googleMapsEmbed && (
                <div
                  className="rounded-lg overflow-hidden border aspect-video"
                  dangerouslySetInnerHTML={{ __html: state.googleMapsEmbed }}
                />
              )}
            </CardContent>
          </Card>
        );

      // ── Banner urgent ──────────────────────────────────────────────
      case "banner":
        return (
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Bell className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">Banner urgent</h3>
              </div>
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label>Text banner</Label>
                  <Input
                    value={state.urgentBanner.text}
                    onChange={(e) => updateField("urgentBanner", { ...state.urgentBanner, text: e.target.value })}
                    placeholder="Avem nevoie urgenta de ajutorul tau!"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label>Text buton CTA</Label>
                    <Input
                      value={state.urgentBanner.ctaText}
                      onChange={(e) => updateField("urgentBanner", { ...state.urgentBanner, ctaText: e.target.value })}
                      placeholder="Doneaza acum"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>URL buton CTA</Label>
                    <Input
                      value={state.urgentBanner.ctaUrl}
                      onChange={(e) => updateField("urgentBanner", { ...state.urgentBanner, ctaUrl: e.target.value })}
                      placeholder="https://..."
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label>Culoare fundal</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={state.urgentBanner.bgColor}
                        onChange={(e) => updateField("urgentBanner", { ...state.urgentBanner, bgColor: e.target.value })}
                        className="w-12 h-9 p-1 cursor-pointer"
                      />
                      <Input
                        value={state.urgentBanner.bgColor}
                        onChange={(e) => updateField("urgentBanner", { ...state.urgentBanner, bgColor: e.target.value })}
                        placeholder="#dc2626"
                        className="flex-1"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label>Activ</Label>
                    <div className="flex items-center gap-2 h-9">
                      <button
                        type="button"
                        role="switch"
                        aria-checked={state.urgentBanner.isActive}
                        onClick={() => updateField("urgentBanner", { ...state.urgentBanner, isActive: !state.urgentBanner.isActive })}
                        className={`relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ${
                          state.urgentBanner.isActive ? "bg-primary" : "bg-input"
                        }`}
                      >
                        <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-background shadow ring-0 transition duration-200 ${
                          state.urgentBanner.isActive ? "translate-x-4" : "translate-x-0"
                        }`} />
                      </button>
                      <span className="text-sm text-muted-foreground">
                        {state.urgentBanner.isActive ? "Banner activ" : "Banner inactiv"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              {state.urgentBanner.text && (
                <div
                  className="rounded-lg p-3 text-white text-center text-sm font-medium"
                  style={{ backgroundColor: state.urgentBanner.bgColor || "#dc2626" }}
                >
                  {state.urgentBanner.text}
                  {state.urgentBanner.ctaText && (
                    <span className="ml-2 underline">{state.urgentBanner.ctaText}</span>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        );

      // ── Popup donatie ──────────────────────────────────────────────
      case "popup":
        return (
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Heart className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">Popup donatie</h3>
              </div>
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label>Text popup</Label>
                  <Textarea
                    value={state.donationPopupText}
                    onChange={(e) => updateField("donationPopupText", e.target.value)}
                    placeholder="Sustine cauza noastra cu o donatie. Fiecare contributie conteaza!"
                    rows={3}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Intarziere afisare (secunde)</Label>
                  <Input
                    type="number"
                    min={0}
                    value={state.donationPopupDelay}
                    onChange={(e) => updateField("donationPopupDelay", parseInt(e.target.value) || 0)}
                    placeholder="15"
                  />
                  <p className="text-xs text-muted-foreground">
                    Popup-ul va aparea dupa acest numar de secunde de la incarcarea paginii.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  };

  // ─── Render ────────────────────────────────────────────────────────

  return (
    <div className="p-6 pb-28">
      <MinisiteSubNav />

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <LayoutGrid className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Componente mini-site</h1>
        </div>
        <p className="text-muted-foreground ml-9">
          Activeaza si configureaza sectiunile suplimentare ale site-ului
        </p>
      </div>

      {/* Feature Toggle Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-6">
        {features.map((f) => (
          <FeatureCard
            key={f.key}
            icon={f.icon}
            title={f.title}
            description={f.description}
            enabled={state[f.toggle] as boolean}
            onToggle={() => updateField(f.toggle, !state[f.toggle])}
            configured={f.configured}
            onClick={() => setActiveFeature(activeFeature === f.key ? null : f.key)}
          />
        ))}
      </div>

      {/* Active feature indicator */}
      {activeFeature && (
        <div className="mb-4 flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            <Search className="h-3 w-3 mr-1" />
            Editare: {features.find((f) => f.key === activeFeature)?.title}
          </Badge>
          <button
            className="text-xs text-muted-foreground hover:text-foreground underline"
            onClick={() => setActiveFeature(null)}
          >
            Inchide editorul
          </button>
        </div>
      )}

      {/* Editor Panel */}
      {renderEditorPanel()}

      {/* Sticky Save Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="flex items-center justify-between px-6 py-3 max-w-screen-2xl mx-auto">
          <div className="flex items-center gap-2">
            {saveMessage && (
              <div className={`flex items-center gap-1.5 text-sm ${
                saveMessage.type === "success" ? "text-green-600" : "text-destructive"
              }`}>
                {saveMessage.type === "success" ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <AlertCircle className="h-4 w-4" />
                )}
                {saveMessage.text}
              </div>
            )}
          </div>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            {saving ? "Se salveaza..." : "Salveaza componentele"}
          </Button>
        </div>
      </div>
    </div>
  );
}

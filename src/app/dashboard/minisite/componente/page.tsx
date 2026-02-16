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
  Plus,
  Trash2,
  Sparkles,
  Loader2,
  Save,
  CheckCircle2,
  AlertCircle,
  LayoutGrid,
  Pencil,
  X,
  User,
  Globe,
  MapPin,
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
  ngoName: string; description: string; shortDescription: string;
  category: string; contactAddress: string; missionText: string;
  videoUrl: string; showVideo: boolean;
  teamMembers: TeamMember[]; showTeam: boolean;
  testimonials: Testimonial[]; showTestimonials: boolean;
  faqItems: FaqItem[]; showFaq: boolean;
  partners: Partner[]; showPartners: boolean;
  events: EventItem[]; showEvents: boolean;
  counterStats: CounterStat[]; showCounterStats: boolean;
  transparencyDocs: TransparencyDoc[]; showTransparency: boolean;
  googleMapsEmbed: string; showGoogleMaps: boolean;
  urgentBanner: UrgentBanner; showUrgentBanner: boolean;
  donationPopupText: string; donationPopupDelay: number; showDonationPopup: boolean;
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

function uid(): string { return Math.random().toString(36).substring(2, 10); }

// ─── Main Component ──────────────────────────────────────────────────

export default function ComponentePage() {
  const [state, setState] = useState<ComponentState>(DEFAULT_STATE);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [aiToolLoading, setAiToolLoading] = useState<string | null>(null);
  const [activeFeature, setActiveFeature] = useState<string | null>(null);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);

  const updateField = useCallback(
    <K extends keyof ComponentState>(field: K, value: ComponentState[K]) => {
      setState((prev) => ({ ...prev, [field]: value }));
    }, []
  );

  const clearSaveMessage = useCallback(() => {
    setTimeout(() => setSaveMessage(null), 4000);
  }, []);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setLoadError(null);
        const res = await fetch("/api/minisite/builder");
        if (!res.ok) throw new Error("Nu s-au putut incarca datele mini-site-ului.");
        const data = await res.json();
        setState({
          ngoName: data.ngoName || "", description: data.description || "",
          shortDescription: data.shortDescription || "", category: data.category || "",
          contactAddress: data.contactAddress || "", missionText: data.missionText || "",
          videoUrl: data.videoUrl || "", showVideo: data.showVideo ?? false,
          teamMembers: Array.isArray(data.teamMembers) ? data.teamMembers : [], showTeam: data.showTeam ?? false,
          testimonials: Array.isArray(data.testimonials) ? data.testimonials : [], showTestimonials: data.showTestimonials ?? false,
          faqItems: Array.isArray(data.faqItems) ? data.faqItems : [], showFaq: data.showFaq ?? false,
          partners: Array.isArray(data.partners) ? data.partners : [], showPartners: data.showPartners ?? false,
          events: Array.isArray(data.events) ? data.events : [], showEvents: data.showEvents ?? false,
          counterStats: Array.isArray(data.counterStats) ? data.counterStats : [], showCounterStats: data.showCounterStats ?? false,
          transparencyDocs: Array.isArray(data.transparencyDocs) ? data.transparencyDocs : [], showTransparency: data.showTransparency ?? false,
          googleMapsEmbed: data.googleMapsEmbed || "", showGoogleMaps: data.showGoogleMaps ?? false,
          urgentBanner: data.urgentBanner || { text: "", ctaText: "", ctaUrl: "", isActive: false, bgColor: "#dc2626" },
          showUrgentBanner: data.showUrgentBanner ?? false,
          donationPopupText: data.donationPopupText || "",
          donationPopupDelay: data.donationPopupDelay ?? 15,
          showDonationPopup: data.showDonationPopup ?? false,
        });
      } catch (err) {
        setLoadError(err instanceof Error ? err.message : "Eroare la incarcarea datelor.");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const handleSave = async () => {
    try {
      setSaving(true);
      setSaveMessage(null);
      const { ngoName, description, shortDescription, category, contactAddress, missionText, ...payload } = state;
      const res = await fetch("/api/minisite/builder", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Eroare la salvare.");
      setSaveMessage({ type: "success", text: "Componentele au fost salvate!" });
      clearSaveMessage();
    } catch (err) {
      setSaveMessage({ type: "error", text: err instanceof Error ? err.message : "Eroare la salvare." });
      clearSaveMessage();
    } finally {
      setSaving(false);
    }
  };

  const callAiTool = async (toolName: string) => {
    try {
      setAiToolLoading(toolName);
      const res = await fetch("/api/minisite/ai-tools", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tool: toolName, context: { ngoName: state.ngoName, name: state.ngoName, description: state.description, shortDescription: state.shortDescription, category: state.category, contactAddress: state.contactAddress, missionText: state.missionText } }),
      });
      if (!res.ok) throw new Error("Eroare AI.");
      const data = await res.json();
      return data.result;
    } catch (err) {
      setSaveMessage({ type: "error", text: err instanceof Error ? err.message : "Eroare AI." });
      clearSaveMessage();
      return null;
    } finally {
      setAiToolLoading(null);
    }
  };

  const handleAiTeam = async () => { const r = await callAiTool("team"); if (r?.teamMembers) updateField("teamMembers", [...state.teamMembers, ...r.teamMembers.map((m: any) => ({ ...m, id: uid() }))]); };
  const handleAiTestimonials = async () => { const r = await callAiTool("testimonials"); if (r?.testimonials) updateField("testimonials", [...state.testimonials, ...r.testimonials.map((t: any) => ({ ...t, id: uid() }))]); };
  const handleAiFaq = async () => { const r = await callAiTool("faq"); if (r?.faqItems) updateField("faqItems", [...state.faqItems, ...r.faqItems.map((f: any) => ({ ...f, id: uid() }))]); };
  const handleAiEvents = async () => { const r = await callAiTool("events"); if (r?.events) updateField("events", [...state.events, ...r.events.map((e: any) => ({ ...e, id: uid() }))]); };
  const handleAiCounterStats = async () => { const r = await callAiTool("counterStats"); if (r?.counterStats) updateField("counterStats", [...state.counterStats, ...r.counterStats.map((s: any) => ({ ...s, id: uid() }))]); };

  function updateArrayItem<T extends { id: string }>(field: keyof ComponentState, items: T[], id: string, updates: Partial<T>) {
    updateField(field, items.map((item) => item.id === id ? { ...item, ...updates } : item) as any);
  }

  function removeArrayItem<T extends { id: string }>(field: keyof ComponentState, items: T[], id: string) {
    updateField(field, items.filter((item) => item.id !== id) as any);
    if (editingItemId === id) setEditingItemId(null);
  }

  function addAndEdit<T extends { id: string }>(field: keyof ComponentState, items: T[], newItem: T) {
    updateField(field, [...items, newItem] as any);
    setEditingItemId(newItem.id);
  }

  const features = [
    { key: "video", icon: Video, title: "Video", description: "Embed YouTube sau Vimeo", toggle: "showVideo" as const, configured: !!state.videoUrl },
    { key: "team", icon: Users, title: "Echipa", description: "Membrii echipei", toggle: "showTeam" as const, configured: state.teamMembers.length > 0 },
    { key: "testimonials", icon: MessageSquareQuote, title: "Testimoniale", description: "Recenzii si testimoniale", toggle: "showTestimonials" as const, configured: state.testimonials.length > 0 },
    { key: "faq", icon: HelpCircle, title: "FAQ", description: "Intrebari frecvente", toggle: "showFaq" as const, configured: state.faqItems.length > 0 },
    { key: "partners", icon: Handshake, title: "Parteneri", description: "Logo-uri parteneri", toggle: "showPartners" as const, configured: state.partners.length > 0 },
    { key: "events", icon: CalendarDays, title: "Evenimente", description: "Evenimente viitoare", toggle: "showEvents" as const, configured: state.events.length > 0 },
    { key: "stats", icon: BarChart3, title: "Statistici", description: "Contoare de impact", toggle: "showCounterStats" as const, configured: state.counterStats.length > 0 },
    { key: "transparency", icon: FileDown, title: "Transparenta", description: "Documente si rapoarte", toggle: "showTransparency" as const, configured: state.transparencyDocs.length > 0 },
    { key: "map", icon: Map, title: "Harta", description: "Google Maps embed", toggle: "showGoogleMaps" as const, configured: !!state.googleMapsEmbed },
    { key: "banner", icon: Bell, title: "Banner urgent", description: "Banner de urgenta", toggle: "showUrgentBanner" as const, configured: !!state.urgentBanner.text },
    { key: "popup", icon: Heart, title: "Popup donatie", description: "Popup automat donatii", toggle: "showDonationPopup" as const, configured: !!state.donationPopupText },
  ];

  if (loading) {
    return (
      <div className="p-6">
        <MinisiteSubNav />
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
            <p className="text-destructive">{loadError}</p>
            <Button className="mt-4" onClick={() => window.location.reload()}>Reincearca</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ─── Item Card + Edit pattern ───────────────────────────────────────

  const renderItemCard = (
    id: string,
    title: string,
    subtitle: string,
    photoUrl: string | undefined,
    icon: React.ElementType,
    onDelete: () => void,
    editForm: React.ReactNode
  ) => {
    const isEditing = editingItemId === id;
    const Icon = icon;

    if (isEditing) {
      return (
        <div key={id} className="border-2 border-primary rounded-xl p-4 space-y-3 bg-primary/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Pencil className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold">Editeaza</span>
            </div>
            <div className="flex gap-1">
              <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={onDelete}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setEditingItemId(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          {editForm}
          <div className="flex justify-end pt-2">
            <Button size="sm" onClick={() => setEditingItemId(null)}>
              <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Gata
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div key={id} className="border rounded-xl p-3 flex items-center gap-3 hover:shadow-sm transition-all group">
        {photoUrl ? (
          <img src={photoUrl} alt={title} className="h-12 w-12 rounded-lg object-cover shrink-0" />
        ) : (
          <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center shrink-0">
            <Icon className="h-5 w-5 text-muted-foreground" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">{title || "Fara titlu"}</p>
          {subtitle && <p className="text-xs text-muted-foreground truncate">{subtitle}</p>}
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button size="sm" variant="ghost" onClick={() => setEditingItemId(id)}>
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={onDelete}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    );
  };

  const renderEditorPanel = () => {
    if (!activeFeature) return null;

    switch (activeFeature) {
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
                <Input placeholder="https://www.youtube.com/embed/..." value={state.videoUrl} onChange={(e) => updateField("videoUrl", e.target.value)} />
              </div>
              {state.videoUrl && (
                <div className="rounded-lg overflow-hidden border aspect-video">
                  <iframe src={state.videoUrl} className="w-full h-full" allowFullScreen title="Video preview" />
                </div>
              )}
            </CardContent>
          </Card>
        );

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
                  <Button size="sm" variant="outline" onClick={handleAiTeam} disabled={aiToolLoading === "team"}>
                    {aiToolLoading === "team" ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Sparkles className="h-4 w-4 mr-1" />}
                    Genereaza cu AI
                  </Button>
                  <Button size="sm" onClick={() => addAndEdit("teamMembers", state.teamMembers, { id: uid(), name: "", role: "", photoUrl: "", bio: "" })}>
                    <Plus className="h-4 w-4 mr-1" /> Adauga
                  </Button>
                </div>
              </div>
              {state.teamMembers.length === 0 && <p className="text-sm text-muted-foreground text-center py-6">Niciun membru. Adauga manual sau genereaza cu AI.</p>}
              <div className="space-y-2">
                {state.teamMembers.map((member) =>
                  renderItemCard(
                    member.id,
                    member.name,
                    member.role,
                    member.photoUrl,
                    User,
                    () => removeArrayItem("teamMembers", state.teamMembers, member.id),
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div><Label className="text-xs">Nume</Label><Input value={member.name} onChange={(e) => updateArrayItem("teamMembers", state.teamMembers, member.id, { name: e.target.value })} placeholder="Prenume Nume" /></div>
                        <div><Label className="text-xs">Rol</Label><Input value={member.role} onChange={(e) => updateArrayItem("teamMembers", state.teamMembers, member.id, { role: e.target.value })} placeholder="Director executiv" /></div>
                      </div>
                      <div><Label className="text-xs">URL fotografie</Label><Input value={member.photoUrl} onChange={(e) => updateArrayItem("teamMembers", state.teamMembers, member.id, { photoUrl: e.target.value })} placeholder="https://..." /></div>
                      <div><Label className="text-xs">Biografie</Label><Textarea value={member.bio} onChange={(e) => updateArrayItem("teamMembers", state.teamMembers, member.id, { bio: e.target.value })} placeholder="Scurta descriere..." rows={2} /></div>
                    </div>
                  )
                )}
              </div>
            </CardContent>
          </Card>
        );

      case "testimonials":
        return (
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <MessageSquareQuote className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">Testimoniale</h3>
                  <Badge variant="secondary">{state.testimonials.length}</Badge>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={handleAiTestimonials} disabled={aiToolLoading === "testimonials"}>
                    {aiToolLoading === "testimonials" ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Sparkles className="h-4 w-4 mr-1" />}
                    Genereaza cu AI
                  </Button>
                  <Button size="sm" onClick={() => addAndEdit("testimonials", state.testimonials, { id: uid(), name: "", role: "", text: "", photoUrl: "" })}>
                    <Plus className="h-4 w-4 mr-1" /> Adauga
                  </Button>
                </div>
              </div>
              {state.testimonials.length === 0 && <p className="text-sm text-muted-foreground text-center py-6">Niciun testimonial. Adauga manual sau genereaza cu AI.</p>}
              <div className="space-y-2">
                {state.testimonials.map((t) =>
                  renderItemCard(
                    t.id,
                    t.name,
                    t.role || t.text.slice(0, 50),
                    t.photoUrl,
                    MessageSquareQuote,
                    () => removeArrayItem("testimonials", state.testimonials, t.id),
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div><Label className="text-xs">Nume</Label><Input value={t.name} onChange={(e) => updateArrayItem("testimonials", state.testimonials, t.id, { name: e.target.value })} placeholder="Prenume Nume" /></div>
                        <div><Label className="text-xs">Rol</Label><Input value={t.role} onChange={(e) => updateArrayItem("testimonials", state.testimonials, t.id, { role: e.target.value })} placeholder="Donator / Voluntar" /></div>
                      </div>
                      <div><Label className="text-xs">URL fotografie</Label><Input value={t.photoUrl} onChange={(e) => updateArrayItem("testimonials", state.testimonials, t.id, { photoUrl: e.target.value })} placeholder="https://..." /></div>
                      <div><Label className="text-xs">Text testimonial</Label><Textarea value={t.text} onChange={(e) => updateArrayItem("testimonials", state.testimonials, t.id, { text: e.target.value })} placeholder="Ce spune aceasta persoana..." rows={3} /></div>
                    </div>
                  )
                )}
              </div>
            </CardContent>
          </Card>
        );

      case "faq":
        return (
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <HelpCircle className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">FAQ</h3>
                  <Badge variant="secondary">{state.faqItems.length} intrebari</Badge>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={handleAiFaq} disabled={aiToolLoading === "faq"}>
                    {aiToolLoading === "faq" ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Sparkles className="h-4 w-4 mr-1" />}
                    Genereaza cu AI
                  </Button>
                  <Button size="sm" onClick={() => addAndEdit("faqItems", state.faqItems, { id: uid(), question: "", answer: "" })}>
                    <Plus className="h-4 w-4 mr-1" /> Adauga
                  </Button>
                </div>
              </div>
              {state.faqItems.length === 0 && <p className="text-sm text-muted-foreground text-center py-6">Nicio intrebare. Adauga manual sau genereaza cu AI.</p>}
              <div className="space-y-2">
                {state.faqItems.map((faq) =>
                  renderItemCard(
                    faq.id,
                    faq.question,
                    faq.answer.slice(0, 60) + (faq.answer.length > 60 ? "..." : ""),
                    undefined,
                    HelpCircle,
                    () => removeArrayItem("faqItems", state.faqItems, faq.id),
                    <div className="space-y-3">
                      <div><Label className="text-xs">Intrebare</Label><Input value={faq.question} onChange={(e) => updateArrayItem("faqItems", state.faqItems, faq.id, { question: e.target.value })} placeholder="Ce intrebare au vizitatorii?" /></div>
                      <div><Label className="text-xs">Raspuns</Label><Textarea value={faq.answer} onChange={(e) => updateArrayItem("faqItems", state.faqItems, faq.id, { answer: e.target.value })} placeholder="Raspunsul..." rows={3} /></div>
                    </div>
                  )
                )}
              </div>
            </CardContent>
          </Card>
        );

      case "partners":
        return (
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Handshake className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">Parteneri</h3>
                  <Badge variant="secondary">{state.partners.length}</Badge>
                </div>
                <Button size="sm" onClick={() => addAndEdit("partners", state.partners, { id: uid(), name: "", logoUrl: "", websiteUrl: "" })}>
                  <Plus className="h-4 w-4 mr-1" /> Adauga
                </Button>
              </div>
              {state.partners.length === 0 && <p className="text-sm text-muted-foreground text-center py-6">Niciun partener adaugat.</p>}
              <div className="space-y-2">
                {state.partners.map((p) =>
                  renderItemCard(
                    p.id,
                    p.name,
                    p.websiteUrl,
                    p.logoUrl,
                    Handshake,
                    () => removeArrayItem("partners", state.partners, p.id),
                    <div className="space-y-3">
                      <div><Label className="text-xs">Nume partener</Label><Input value={p.name} onChange={(e) => updateArrayItem("partners", state.partners, p.id, { name: e.target.value })} placeholder="Companie SRL" /></div>
                      <div><Label className="text-xs">URL logo</Label><Input value={p.logoUrl} onChange={(e) => updateArrayItem("partners", state.partners, p.id, { logoUrl: e.target.value })} placeholder="https://..." /></div>
                      <div><Label className="text-xs">Website</Label><Input value={p.websiteUrl} onChange={(e) => updateArrayItem("partners", state.partners, p.id, { websiteUrl: e.target.value })} placeholder="https://..." /></div>
                    </div>
                  )
                )}
              </div>
            </CardContent>
          </Card>
        );

      case "events":
        return (
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">Evenimente</h3>
                  <Badge variant="secondary">{state.events.length}</Badge>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={handleAiEvents} disabled={aiToolLoading === "events"}>
                    {aiToolLoading === "events" ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Sparkles className="h-4 w-4 mr-1" />}
                    Genereaza cu AI
                  </Button>
                  <Button size="sm" onClick={() => addAndEdit("events", state.events, { id: uid(), title: "", date: "", location: "", description: "", imageUrl: "" })}>
                    <Plus className="h-4 w-4 mr-1" /> Adauga
                  </Button>
                </div>
              </div>
              {state.events.length === 0 && <p className="text-sm text-muted-foreground text-center py-6">Niciun eveniment. Adauga manual sau genereaza cu AI.</p>}
              <div className="space-y-2">
                {state.events.map((ev) =>
                  renderItemCard(
                    ev.id,
                    ev.title,
                    [ev.date, ev.location].filter(Boolean).join(" - "),
                    ev.imageUrl,
                    CalendarDays,
                    () => removeArrayItem("events", state.events, ev.id),
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div><Label className="text-xs">Titlu</Label><Input value={ev.title} onChange={(e) => updateArrayItem("events", state.events, ev.id, { title: e.target.value })} placeholder="Gala caritabila" /></div>
                        <div><Label className="text-xs">Data</Label><Input type="date" value={ev.date} onChange={(e) => updateArrayItem("events", state.events, ev.id, { date: e.target.value })} /></div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div><Label className="text-xs">Locatie</Label><Input value={ev.location} onChange={(e) => updateArrayItem("events", state.events, ev.id, { location: e.target.value })} placeholder="Bucuresti" /></div>
                        <div><Label className="text-xs">URL imagine</Label><Input value={ev.imageUrl} onChange={(e) => updateArrayItem("events", state.events, ev.id, { imageUrl: e.target.value })} placeholder="https://..." /></div>
                      </div>
                      <div><Label className="text-xs">Descriere</Label><Textarea value={ev.description} onChange={(e) => updateArrayItem("events", state.events, ev.id, { description: e.target.value })} placeholder="Descrierea evenimentului..." rows={2} /></div>
                    </div>
                  )
                )}
              </div>
            </CardContent>
          </Card>
        );

      case "stats":
        return (
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">Statistici de impact</h3>
                  <Badge variant="secondary">{state.counterStats.length}</Badge>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={handleAiCounterStats} disabled={aiToolLoading === "counterStats"}>
                    {aiToolLoading === "counterStats" ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Sparkles className="h-4 w-4 mr-1" />}
                    Genereaza cu AI
                  </Button>
                  <Button size="sm" onClick={() => addAndEdit("counterStats", state.counterStats, { id: uid(), label: "", value: 0, suffix: "" })}>
                    <Plus className="h-4 w-4 mr-1" /> Adauga
                  </Button>
                </div>
              </div>
              {state.counterStats.length === 0 && <p className="text-sm text-muted-foreground text-center py-6">Nicio statistica. Adauga manual sau genereaza cu AI.</p>}
              <div className="space-y-2">
                {state.counterStats.map((stat) =>
                  renderItemCard(
                    stat.id,
                    stat.label || "Statistica",
                    `${stat.value}${stat.suffix}`,
                    undefined,
                    BarChart3,
                    () => removeArrayItem("counterStats", state.counterStats, stat.id),
                    <div className="grid grid-cols-3 gap-3">
                      <div><Label className="text-xs">Eticheta</Label><Input value={stat.label} onChange={(e) => updateArrayItem("counterStats", state.counterStats, stat.id, { label: e.target.value })} placeholder="Beneficiari" /></div>
                      <div><Label className="text-xs">Valoare</Label><Input type="number" value={stat.value} onChange={(e) => updateArrayItem("counterStats", state.counterStats, stat.id, { value: parseInt(e.target.value) || 0 })} /></div>
                      <div><Label className="text-xs">Sufix</Label><Input value={stat.suffix} onChange={(e) => updateArrayItem("counterStats", state.counterStats, stat.id, { suffix: e.target.value })} placeholder="+" /></div>
                    </div>
                  )
                )}
              </div>
            </CardContent>
          </Card>
        );

      case "transparency":
        return (
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <FileDown className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">Transparenta</h3>
                  <Badge variant="secondary">{state.transparencyDocs.length}</Badge>
                </div>
                <Button size="sm" onClick={() => addAndEdit("transparencyDocs", state.transparencyDocs, { id: uid(), title: "", year: new Date().getFullYear().toString(), pdfUrl: "" })}>
                  <Plus className="h-4 w-4 mr-1" /> Adauga
                </Button>
              </div>
              {state.transparencyDocs.length === 0 && <p className="text-sm text-muted-foreground text-center py-6">Niciun document adaugat.</p>}
              <div className="space-y-2">
                {state.transparencyDocs.map((doc) =>
                  renderItemCard(
                    doc.id,
                    doc.title || "Document",
                    doc.year,
                    undefined,
                    FileDown,
                    () => removeArrayItem("transparencyDocs", state.transparencyDocs, doc.id),
                    <div className="grid grid-cols-3 gap-3">
                      <div><Label className="text-xs">Titlu</Label><Input value={doc.title} onChange={(e) => updateArrayItem("transparencyDocs", state.transparencyDocs, doc.id, { title: e.target.value })} placeholder="Raport anual 2024" /></div>
                      <div><Label className="text-xs">An</Label><Input value={doc.year} onChange={(e) => updateArrayItem("transparencyDocs", state.transparencyDocs, doc.id, { year: e.target.value })} placeholder="2024" /></div>
                      <div><Label className="text-xs">URL PDF</Label><Input value={doc.pdfUrl} onChange={(e) => updateArrayItem("transparencyDocs", state.transparencyDocs, doc.id, { pdfUrl: e.target.value })} placeholder="https://..." /></div>
                    </div>
                  )
                )}
              </div>
            </CardContent>
          </Card>
        );

      case "map":
        return (
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Map className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">Harta Google Maps</h3>
              </div>
              <div className="space-y-2">
                <Label>Cod embed</Label>
                <Textarea value={state.googleMapsEmbed} onChange={(e) => updateField("googleMapsEmbed", e.target.value)} placeholder='<iframe src="https://www.google.com/maps/embed?pb=..." ...></iframe>' rows={4} />
              </div>
              {state.googleMapsEmbed && <div className="rounded-lg overflow-hidden border aspect-video" dangerouslySetInnerHTML={{ __html: state.googleMapsEmbed }} />}
            </CardContent>
          </Card>
        );

      case "banner":
        return (
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Bell className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">Banner urgent</h3>
              </div>
              <div className="space-y-3">
                <div><Label>Text banner</Label><Input value={state.urgentBanner.text} onChange={(e) => updateField("urgentBanner", { ...state.urgentBanner, text: e.target.value })} placeholder="Avem nevoie urgenta de ajutor!" /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Text buton CTA</Label><Input value={state.urgentBanner.ctaText} onChange={(e) => updateField("urgentBanner", { ...state.urgentBanner, ctaText: e.target.value })} placeholder="Doneaza acum" /></div>
                  <div><Label>URL buton CTA</Label><Input value={state.urgentBanner.ctaUrl} onChange={(e) => updateField("urgentBanner", { ...state.urgentBanner, ctaUrl: e.target.value })} placeholder="https://..." /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Culoare fundal</Label>
                    <div className="flex gap-2">
                      <Input type="color" value={state.urgentBanner.bgColor} onChange={(e) => updateField("urgentBanner", { ...state.urgentBanner, bgColor: e.target.value })} className="w-12 h-9 p-1 cursor-pointer" />
                      <Input value={state.urgentBanner.bgColor} onChange={(e) => updateField("urgentBanner", { ...state.urgentBanner, bgColor: e.target.value })} className="flex-1" />
                    </div>
                  </div>
                  <div>
                    <Label>Activ</Label>
                    <div className="flex items-center gap-2 h-9">
                      <button type="button" role="switch" aria-checked={state.urgentBanner.isActive} onClick={() => updateField("urgentBanner", { ...state.urgentBanner, isActive: !state.urgentBanner.isActive })}
                        className={`relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors ${state.urgentBanner.isActive ? "bg-primary" : "bg-input"}`}>
                        <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-background shadow transition ${state.urgentBanner.isActive ? "translate-x-4" : "translate-x-0"}`} />
                      </button>
                      <span className="text-sm text-muted-foreground">{state.urgentBanner.isActive ? "Activ" : "Inactiv"}</span>
                    </div>
                  </div>
                </div>
              </div>
              {state.urgentBanner.text && (
                <div className="rounded-lg p-3 text-white text-center text-sm font-medium" style={{ backgroundColor: state.urgentBanner.bgColor || "#dc2626" }}>
                  {state.urgentBanner.text}
                  {state.urgentBanner.ctaText && <span className="ml-2 underline">{state.urgentBanner.ctaText}</span>}
                </div>
              )}
            </CardContent>
          </Card>
        );

      case "popup":
        return (
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Heart className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">Popup donatie</h3>
              </div>
              <div className="space-y-3">
                <div><Label>Text popup</Label><Textarea value={state.donationPopupText} onChange={(e) => updateField("donationPopupText", e.target.value)} placeholder="Sustine cauza noastra cu o donatie!" rows={3} /></div>
                <div>
                  <Label>Intarziere afisare (secunde)</Label>
                  <Input type="number" min={0} value={state.donationPopupDelay} onChange={(e) => updateField("donationPopupDelay", parseInt(e.target.value) || 0)} />
                  <p className="text-xs text-muted-foreground mt-1">Popup-ul apare dupa acest numar de secunde.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  };

  return (
    <div className="p-6 pb-28">
      <MinisiteSubNav />

      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <LayoutGrid className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Componente mini-site</h1>
        </div>
        <p className="text-muted-foreground ml-9">Activeaza si configureaza sectiunile suplimentare</p>
      </div>

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
            onClick={() => { setActiveFeature(activeFeature === f.key ? null : f.key); setEditingItemId(null); }}
          />
        ))}
      </div>

      {activeFeature && (
        <div className="mb-4 flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            Editare: {features.find((f) => f.key === activeFeature)?.title}
          </Badge>
          <button className="text-xs text-muted-foreground hover:text-foreground underline" onClick={() => { setActiveFeature(null); setEditingItemId(null); }}>
            Inchide editorul
          </button>
        </div>
      )}

      {renderEditorPanel()}

      <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="flex items-center justify-between px-6 py-3 max-w-screen-2xl mx-auto">
          <div className="flex items-center gap-2">
            {saveMessage && (
              <div className={`flex items-center gap-1.5 text-sm ${saveMessage.type === "success" ? "text-green-600" : "text-destructive"}`}>
                {saveMessage.type === "success" ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                {saveMessage.text}
              </div>
            )}
          </div>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
            {saving ? "Se salveaza..." : "Salveaza"}
          </Button>
        </div>
      </div>
    </div>
  );
}

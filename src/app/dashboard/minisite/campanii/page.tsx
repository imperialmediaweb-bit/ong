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
import {
  Sparkles,
  Save,
  Loader2,
  Heart,
  Plus,
  Trash2,
  Target,
  ChevronDown,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Share2,
  ClipboardCopy,
  Eye,
  EyeOff,
  ImageIcon,
} from "lucide-react";
import { MinisiteSubNav } from "../_components/minisite-nav";

// ─── Types ───────────────────────────────────────────────────────────

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

interface BuilderData {
  ngoName: string;
  slug: string;
  description: string;
  shortDescription: string;
  category: string;
  contactAddress: string;
  missionText: string;
  miniSiteCampaigns: MiniSiteCampaign[];
}

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

// ─── Social Posts Dialog ──────────────────────────────────────────────

function SocialPostsModal({ posts, onClose }: { posts: { platform: string; text: string }[]; onClose: () => void }) {
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const handleCopy = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-background rounded-xl shadow-2xl max-w-lg w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Share2 className="h-5 w-5 text-primary" />
            Postari social media generate
          </h3>
          <p className="text-sm text-muted-foreground mt-1">Copiaza textele si posteaza-le pe retelele sociale</p>
        </div>
        <div className="p-6 space-y-4">
          {posts.map((post, idx) => (
            <div key={idx} className="border rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between">
                <Badge variant="secondary">{post.platform}</Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCopy(post.text, idx)}
                >
                  {copiedIdx === idx ? (
                    <><CheckCircle2 className="h-4 w-4 mr-1 text-green-600" /> Copiat</>
                  ) : (
                    <><ClipboardCopy className="h-4 w-4 mr-1" /> Copiaza</>
                  )}
                </Button>
              </div>
              <p className="text-sm whitespace-pre-wrap">{post.text}</p>
            </div>
          ))}
        </div>
        <div className="p-4 border-t flex justify-end">
          <Button variant="outline" onClick={onClose}>Inchide</Button>
        </div>
      </div>
    </div>
  );
}

// ─── Component ───────────────────────────────────────────────────────

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<MiniSiteCampaign[]>([]);
  const [ngoContext, setNgoContext] = useState<Omit<BuilderData, "miniSiteCampaigns">>({
    ngoName: "", slug: "", description: "", shortDescription: "",
    category: "", contactAddress: "", missionText: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [aiToolLoading, setAiToolLoading] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(["campaigns"]));
  const [socialPosts, setSocialPosts] = useState<{ platform: string; text: string }[] | null>(null);

  // ─── Helpers ─────────────────────────────────────────────────────

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

        setCampaigns(Array.isArray(data.miniSiteCampaigns) ? data.miniSiteCampaigns : []);
        setNgoContext({
          ngoName: data.ngoName || "",
          slug: data.slug || "",
          description: data.description || "",
          shortDescription: data.shortDescription || "",
          category: data.category || "",
          contactAddress: data.contactAddress || "",
          missionText: data.missionText || "",
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

  // ─── Save ────────────────────────────────────────────────────────

  const handleSave = async () => {
    try {
      setSaving(true);
      setSaveMessage(null);
      const res = await fetch("/api/minisite/builder", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ miniSiteCampaigns: campaigns }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.error || "Eroare la salvare. Incercati din nou.");
      }
      setSaveMessage({ type: "success", text: "Campaniile au fost salvate cu succes!" });
      clearSaveMessage();
    } catch (err) {
      console.error("Error saving campaigns:", err);
      setSaveMessage({ type: "error", text: err instanceof Error ? err.message : "Eroare la salvare." });
      clearSaveMessage();
    } finally {
      setSaving(false);
    }
  };

  // ─── Campaign CRUD ──────────────────────────────────────────────

  const addCampaign = () => {
    const newCampaign: MiniSiteCampaign = {
      id: `camp-${Date.now()}`,
      title: "",
      description: "",
      goalAmount: 5000,
      raisedAmount: 0,
      imageUrl: "",
      isActive: true,
      updates: [],
    };
    setCampaigns((prev) => [...prev, newCampaign]);
  };

  const removeCampaign = (id: string) => {
    setCampaigns((prev) => prev.filter((c) => c.id !== id));
  };

  const updateCampaign = (id: string, field: keyof MiniSiteCampaign, value: any) => {
    setCampaigns((prev) =>
      prev.map((c) => (c.id === id ? { ...c, [field]: value } : c))
    );
  };

  const toggleCampaignActive = (id: string) => {
    setCampaigns((prev) =>
      prev.map((c) => (c.id === id ? { ...c, isActive: !c.isActive } : c))
    );
  };

  // ─── Campaign Updates CRUD ──────────────────────────────────────

  const addCampaignUpdate = (campaignId: string) => {
    setCampaigns((prev) =>
      prev.map((c) => {
        if (c.id !== campaignId) return c;
        const newUpdate: CampaignUpdate = {
          id: `upd-${Date.now()}`,
          date: new Date().toISOString().split("T")[0],
          text: "",
        };
        return { ...c, updates: [...(c.updates || []), newUpdate] };
      })
    );
  };

  const removeCampaignUpdate = (campaignId: string, updateId: string) => {
    setCampaigns((prev) =>
      prev.map((c) => {
        if (c.id !== campaignId) return c;
        return { ...c, updates: (c.updates || []).filter((u) => u.id !== updateId) };
      })
    );
  };

  const updateCampaignUpdate = (campaignId: string, updateId: string, field: keyof CampaignUpdate, value: string) => {
    setCampaigns((prev) =>
      prev.map((c) => {
        if (c.id !== campaignId) return c;
        return {
          ...c,
          updates: (c.updates || []).map((u) =>
            u.id === updateId ? { ...u, [field]: value } : u
          ),
        };
      })
    );
  };

  // ─── AI Tools ───────────────────────────────────────────────────

  const handleGenerateCampaigns = async () => {
    try {
      setAiToolLoading("generateCampaigns");
      setSaveMessage(null);
      const res = await fetch("/api/minisite/ai-tools", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tool: "generateCampaigns",
          context: {
            name: ngoContext.ngoName,
            description: ngoContext.description,
            shortDescription: ngoContext.shortDescription,
            category: ngoContext.category,
            contactAddress: ngoContext.contactAddress,
            missionText: ngoContext.missionText,
          },
        }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.error || "Eroare la generarea campaniilor cu AI.");
      }
      const raw = await res.json();
      const data = raw.result || raw;

      if (Array.isArray(data.campaigns)) {
        const newCampaigns = data.campaigns.map((c: any, i: number) => ({
          id: `ai-${Date.now()}-${i}`,
          title: c.title || "",
          description: c.description || "",
          goalAmount: c.goalAmount || 5000,
          raisedAmount: 0,
          imageUrl: c.imageUrl || "",
          isActive: true,
          updates: [],
        }));
        setCampaigns((prev) => [...prev, ...newCampaigns]);
      }
      setSaveMessage({ type: "success", text: "Campaniile au fost generate cu AI cu succes!" });
      clearSaveMessage();
    } catch (err) {
      console.error("AI generateCampaigns error:", err);
      setSaveMessage({ type: "error", text: err instanceof Error ? err.message : "Eroare la generarea campaniilor cu AI." });
      clearSaveMessage();
    } finally {
      setAiToolLoading(null);
    }
  };

  const handleEnhanceCampaign = async (campaignIdx: number) => {
    const campaign = campaigns[campaignIdx];
    if (!campaign) return;

    try {
      setAiToolLoading(`enhanceCampaign-${campaignIdx}`);
      setSaveMessage(null);
      const res = await fetch("/api/minisite/ai-tools", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tool: "enhanceCampaign",
          context: {
            campaignIdx,
            title: campaign.title,
            description: campaign.description,
            goalAmount: campaign.goalAmount,
          },
        }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.error || "Eroare la imbunatatirea campaniei cu AI.");
      }
      const raw = await res.json();
      const data = raw.result || raw;

      if (data.title || data.description) {
        setCampaigns((prev) =>
          prev.map((c, i) =>
            i === campaignIdx
              ? { ...c, title: data.title || c.title, description: data.description || c.description }
              : c
          )
        );
      }
      setSaveMessage({ type: "success", text: "Campania a fost imbunatatita cu AI!" });
      clearSaveMessage();
    } catch (err) {
      console.error("AI enhanceCampaign error:", err);
      setSaveMessage({ type: "error", text: err instanceof Error ? err.message : "Eroare la imbunatatirea campaniei." });
      clearSaveMessage();
    } finally {
      setAiToolLoading(null);
    }
  };

  const handleSocialPosts = async (campaign: MiniSiteCampaign) => {
    try {
      setAiToolLoading(`socialPosts-${campaign.id}`);
      setSaveMessage(null);
      const donateUrl = ngoContext.slug ? `/s/${ngoContext.slug}` : "";
      const res = await fetch("/api/minisite/ai-tools", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tool: "socialPosts",
          context: {
            title: campaign.title,
            description: campaign.description,
            goalAmount: campaign.goalAmount,
            ngoName: ngoContext.ngoName,
            donateUrl,
          },
        }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.error || "Eroare la generarea postarilor social media.");
      }
      const raw = await res.json();
      const data = raw.result || raw;

      if (Array.isArray(data.posts)) {
        setSocialPosts(data.posts);
      }
      setSaveMessage({ type: "success", text: "Postarile au fost generate cu succes!" });
      clearSaveMessage();
    } catch (err) {
      console.error("AI socialPosts error:", err);
      setSaveMessage({ type: "error", text: err instanceof Error ? err.message : "Eroare la generarea postarilor." });
      clearSaveMessage();
    } finally {
      setAiToolLoading(null);
    }
  };

  // ─── Loading / Error ──────────────────────────────────────────────

  if (loading) {
    return (
      <div className="space-y-6">
        <MinisiteSubNav />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            <p className="text-muted-foreground">Se incarca datele mini-site-ului...</p>
          </div>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="space-y-6">
        <MinisiteSubNav />
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
      </div>
    );
  }

  // ─── Progress helper ────────────────────────────────────────────

  const getProgressPercent = (raised: number, goal: number) => {
    if (!goal || goal <= 0) return 0;
    return Math.min(Math.round((raised / goal) * 100), 100);
  };

  // ─── Render ──────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      <MinisiteSubNav />

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Campanii mini-site</h1>
        <p className="text-muted-foreground mt-1">Gestioneaza campaniile de strangere de fonduri de pe mini-site</p>
      </div>

      {/* Campaigns Section */}
      <Section
        id="campaigns"
        title="Campanii de strangere de fonduri"
        description="Adauga si gestioneaza campaniile afisate pe mini-site"
        icon={Heart}
        expanded={expandedSections.has("campaigns")}
        onToggle={toggleSection}
        badge={
          <Badge variant="secondary">
            {campaigns.length} {campaigns.length === 1 ? "campanie" : "campanii"}
          </Badge>
        }
      >
        {/* Top action buttons */}
        <div className="flex flex-wrap gap-2 mb-6">
          <Button
            variant="outline"
            size="sm"
            onClick={handleGenerateCampaigns}
            disabled={aiToolLoading === "generateCampaigns"}
          >
            {aiToolLoading === "generateCampaigns" ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4 mr-2" />
            )}
            Genereaza cu AI
          </Button>
          <Button variant="outline" size="sm" onClick={addCampaign}>
            <Plus className="h-4 w-4 mr-2" />
            Adauga campanie
          </Button>
        </div>

        {/* Empty state */}
        {campaigns.length === 0 && (
          <div className="text-center py-12 border-2 border-dashed rounded-lg">
            <Target className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground mb-1">Nu exista campanii inca</p>
            <p className="text-sm text-muted-foreground mb-4">
              Adauga o campanie manual sau genereaza cu AI
            </p>
            <div className="flex justify-center gap-2">
              <Button variant="outline" size="sm" onClick={addCampaign}>
                <Plus className="h-4 w-4 mr-2" />
                Adauga manual
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleGenerateCampaigns}
                disabled={aiToolLoading === "generateCampaigns"}
              >
                {aiToolLoading === "generateCampaigns" ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4 mr-2" />
                )}
                Genereaza cu AI
              </Button>
            </div>
          </div>
        )}

        {/* Campaign cards */}
        <div className="space-y-6">
          {campaigns.map((campaign, idx) => {
            const progress = getProgressPercent(campaign.raisedAmount, campaign.goalAmount);
            return (
              <div
                key={campaign.id}
                className={`border rounded-xl p-5 space-y-4 transition-all ${
                  campaign.isActive
                    ? "border-primary/30 bg-primary/5"
                    : "border-muted bg-muted/10 opacity-80"
                }`}
              >
                {/* Campaign header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant={campaign.isActive ? "default" : "secondary"}>
                      {campaign.isActive ? "Activa" : "Inactiva"}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      Campanie #{idx + 1}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleCampaignActive(campaign.id)}
                      title={campaign.isActive ? "Dezactiveaza" : "Activeaza"}
                    >
                      {campaign.isActive ? (
                        <Eye className="h-4 w-4" />
                      ) : (
                        <EyeOff className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => removeCampaign(campaign.id)}
                      title="Sterge campania"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {campaign.raisedAmount.toLocaleString("ro-RO")} RON strans
                    </span>
                    <span className="font-medium">{progress}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
                    <div
                      className="bg-primary h-full rounded-full transition-all duration-500"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground text-right">
                    Obiectiv: {campaign.goalAmount.toLocaleString("ro-RO")} RON
                  </p>
                </div>

                {/* Form fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <Label htmlFor={`camp-title-${campaign.id}`}>Titlu campanie *</Label>
                    <Input
                      id={`camp-title-${campaign.id}`}
                      value={campaign.title}
                      onChange={(e) => updateCampaign(campaign.id, "title", e.target.value)}
                      placeholder="ex: Construim o scoala pentru comunitate"
                      required
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor={`camp-desc-${campaign.id}`}>Descriere campanie</Label>
                    <Textarea
                      id={`camp-desc-${campaign.id}`}
                      value={campaign.description}
                      onChange={(e) => updateCampaign(campaign.id, "description", e.target.value)}
                      placeholder="Descrie scopul si impactul campaniei..."
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label htmlFor={`camp-goal-${campaign.id}`}>Obiectiv (RON)</Label>
                    <Input
                      id={`camp-goal-${campaign.id}`}
                      type="number"
                      min={0}
                      value={campaign.goalAmount}
                      onChange={(e) => updateCampaign(campaign.id, "goalAmount", Number(e.target.value) || 0)}
                      placeholder="5000"
                    />
                  </div>
                  <div>
                    <Label htmlFor={`camp-raised-${campaign.id}`}>Suma stransa (RON)</Label>
                    <Input
                      id={`camp-raised-${campaign.id}`}
                      type="number"
                      min={0}
                      value={campaign.raisedAmount}
                      onChange={(e) => updateCampaign(campaign.id, "raisedAmount", Number(e.target.value) || 0)}
                      placeholder="0"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor={`camp-img-${campaign.id}`}>
                      <span className="flex items-center gap-1">
                        <ImageIcon className="h-3.5 w-3.5" />
                        URL imagine campanie
                      </span>
                    </Label>
                    <Input
                      id={`camp-img-${campaign.id}`}
                      value={campaign.imageUrl}
                      onChange={(e) => updateCampaign(campaign.id, "imageUrl", e.target.value)}
                      placeholder="https://exemplu.ro/imagine-campanie.jpg"
                    />
                  </div>
                </div>

                {/* Campaign Updates / Timeline */}
                <div className="border-t pt-4 mt-2">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Actualizari campanie</span>
                      <Badge variant="outline" className="text-xs">
                        {(campaign.updates || []).length}
                      </Badge>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addCampaignUpdate(campaign.id)}
                    >
                      <Plus className="h-3.5 w-3.5 mr-1" />
                      Adauga actualizare
                    </Button>
                  </div>
                  {(campaign.updates || []).length === 0 && (
                    <p className="text-xs text-muted-foreground italic">
                      Nu exista actualizari. Adauga o actualizare pentru a informa donatorii.
                    </p>
                  )}
                  <div className="space-y-3">
                    {(campaign.updates || []).map((upd) => (
                      <div key={upd.id} className="flex gap-2 items-start bg-muted/30 rounded-lg p-3">
                        <div className="flex-1 grid grid-cols-1 sm:grid-cols-[140px_1fr] gap-2">
                          <div>
                            <Label htmlFor={`upd-date-${upd.id}`} className="text-xs">Data</Label>
                            <Input
                              id={`upd-date-${upd.id}`}
                              type="date"
                              value={upd.date}
                              onChange={(e) =>
                                updateCampaignUpdate(campaign.id, upd.id, "date", e.target.value)
                              }
                              className="text-sm"
                            />
                          </div>
                          <div>
                            <Label htmlFor={`upd-text-${upd.id}`} className="text-xs">Text actualizare</Label>
                            <Input
                              id={`upd-text-${upd.id}`}
                              value={upd.text}
                              onChange={(e) =>
                                updateCampaignUpdate(campaign.id, upd.id, "text", e.target.value)
                              }
                              placeholder="ex: Am achizitionat materialele de constructie"
                              className="text-sm"
                            />
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive mt-5"
                          onClick={() => removeCampaignUpdate(campaign.id, upd.id)}
                          title="Sterge actualizarea"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* AI action buttons */}
                <div className="flex flex-wrap gap-2 border-t pt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEnhanceCampaign(idx)}
                    disabled={aiToolLoading === `enhanceCampaign-${idx}`}
                  >
                    {aiToolLoading === `enhanceCampaign-${idx}` ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4 mr-2" />
                    )}
                    Imbunatateste cu AI
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSocialPosts(campaign)}
                    disabled={aiToolLoading === `socialPosts-${campaign.id}`}
                  >
                    {aiToolLoading === `socialPosts-${campaign.id}` ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Share2 className="h-4 w-4 mr-2" />
                    )}
                    Postari social media
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </Section>

      {/* Social Posts Modal */}
      {socialPosts && (
        <SocialPostsModal
          posts={socialPosts}
          onClose={() => setSocialPosts(null)}
        />
      )}

      {/* Sticky save bar */}
      <div className="sticky bottom-0 z-40 -mx-1 px-1">
        <div className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border rounded-xl shadow-lg p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              {saveMessage && (
                <div className={`flex items-center gap-2 text-sm ${
                  saveMessage.type === "success" ? "text-green-600" : "text-destructive"
                }`}>
                  {saveMessage.type === "success" ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                  ) : (
                    <AlertCircle className="h-4 w-4 shrink-0" />
                  )}
                  <span className="truncate">{saveMessage.text}</span>
                </div>
              )}
              {!saveMessage && (
                <p className="text-sm text-muted-foreground">
                  {campaigns.length} {campaigns.length === 1 ? "campanie" : "campanii"} configurate
                </p>
              )}
            </div>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Salveaza campaniile
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

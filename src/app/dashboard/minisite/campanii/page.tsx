"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
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
  Plus,
  Trash2,
  Target,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Share2,
  ClipboardCopy,
  Eye,
  EyeOff,
  ImageIcon,
  Pencil,
  X,
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
                <Button variant="ghost" size="sm" onClick={() => handleCopy(post.text, idx)}>
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
  const [socialPosts, setSocialPosts] = useState<{ platform: string; text: string }[] | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

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
        setCampaigns(Array.isArray(data.miniSiteCampaigns) ? data.miniSiteCampaigns : []);
        setNgoContext({
          ngoName: data.ngoName || "", slug: data.slug || "",
          description: data.description || "", shortDescription: data.shortDescription || "",
          category: data.category || "", contactAddress: data.contactAddress || "",
          missionText: data.missionText || "",
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
      const res = await fetch("/api/minisite/builder", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ miniSiteCampaigns: campaigns }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.error || "Eroare la salvare.");
      }
      setSaveMessage({ type: "success", text: "Campaniile au fost salvate cu succes!" });
      clearSaveMessage();
    } catch (err) {
      setSaveMessage({ type: "error", text: err instanceof Error ? err.message : "Eroare la salvare." });
      clearSaveMessage();
    } finally {
      setSaving(false);
    }
  };

  const addCampaign = () => {
    const id = `camp-${Date.now()}`;
    setCampaigns((prev) => [...prev, {
      id, title: "", description: "", goalAmount: 5000,
      raisedAmount: 0, imageUrl: "", isActive: true, updates: [],
    }]);
    setEditingId(id);
  };

  const removeCampaign = (id: string) => {
    setCampaigns((prev) => prev.filter((c) => c.id !== id));
    if (editingId === id) setEditingId(null);
  };

  const updateCampaign = (id: string, field: keyof MiniSiteCampaign, value: any) => {
    setCampaigns((prev) => prev.map((c) => (c.id === id ? { ...c, [field]: value } : c)));
  };

  const toggleCampaignActive = (id: string) => {
    setCampaigns((prev) => prev.map((c) => (c.id === id ? { ...c, isActive: !c.isActive } : c)));
  };

  const addCampaignUpdate = (campaignId: string) => {
    setCampaigns((prev) => prev.map((c) => {
      if (c.id !== campaignId) return c;
      return { ...c, updates: [...(c.updates || []), { id: `upd-${Date.now()}`, date: new Date().toISOString().split("T")[0], text: "" }] };
    }));
  };

  const removeCampaignUpdate = (campaignId: string, updateId: string) => {
    setCampaigns((prev) => prev.map((c) => {
      if (c.id !== campaignId) return c;
      return { ...c, updates: (c.updates || []).filter((u) => u.id !== updateId) };
    }));
  };

  const updateCampaignUpdate = (campaignId: string, updateId: string, field: keyof CampaignUpdate, value: string) => {
    setCampaigns((prev) => prev.map((c) => {
      if (c.id !== campaignId) return c;
      return { ...c, updates: (c.updates || []).map((u) => u.id === updateId ? { ...u, [field]: value } : u) };
    }));
  };

  // ─── AI Tools ─────────────────────────────────────────────────────

  const handleGenerateCampaigns = async () => {
    try {
      setAiToolLoading("generateCampaigns");
      const res = await fetch("/api/minisite/ai-tools", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tool: "generateCampaigns", context: { name: ngoContext.ngoName, description: ngoContext.description, shortDescription: ngoContext.shortDescription, category: ngoContext.category, contactAddress: ngoContext.contactAddress, missionText: ngoContext.missionText } }),
      });
      if (!res.ok) throw new Error("Eroare la generarea campaniilor cu AI.");
      const raw = await res.json();
      const data = raw.result || raw;
      if (Array.isArray(data.campaigns)) {
        const newCampaigns = data.campaigns.map((c: any, i: number) => ({
          id: `ai-${Date.now()}-${i}`, title: c.title || "", description: c.description || "",
          goalAmount: c.goalAmount || 5000, raisedAmount: 0, imageUrl: c.imageUrl || "",
          isActive: true, updates: [],
        }));
        setCampaigns((prev) => [...prev, ...newCampaigns]);
      }
      setSaveMessage({ type: "success", text: "Campaniile au fost generate cu AI!" });
      clearSaveMessage();
    } catch (err) {
      setSaveMessage({ type: "error", text: err instanceof Error ? err.message : "Eroare AI." });
      clearSaveMessage();
    } finally { setAiToolLoading(null); }
  };

  const handleEnhanceCampaign = async (campaignIdx: number) => {
    const campaign = campaigns[campaignIdx];
    if (!campaign) return;
    try {
      setAiToolLoading(`enhance-${campaignIdx}`);
      const res = await fetch("/api/minisite/ai-tools", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tool: "enhanceCampaign", context: { campaignIdx, title: campaign.title, description: campaign.description, goalAmount: campaign.goalAmount } }),
      });
      if (!res.ok) throw new Error("Eroare AI.");
      const raw = await res.json();
      const data = raw.result || raw;
      if (data.title || data.description) {
        setCampaigns((prev) => prev.map((c, i) => i === campaignIdx ? { ...c, title: data.title || c.title, description: data.description || c.description } : c));
      }
      setSaveMessage({ type: "success", text: "Campania a fost imbunatatita cu AI!" });
      clearSaveMessage();
    } catch (err) {
      setSaveMessage({ type: "error", text: err instanceof Error ? err.message : "Eroare AI." });
      clearSaveMessage();
    } finally { setAiToolLoading(null); }
  };

  const handleSocialPosts = async (campaign: MiniSiteCampaign) => {
    try {
      setAiToolLoading(`social-${campaign.id}`);
      const res = await fetch("/api/minisite/ai-tools", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tool: "socialPosts", context: { title: campaign.title, description: campaign.description, goalAmount: campaign.goalAmount, ngoName: ngoContext.ngoName, donateUrl: ngoContext.slug ? `/s/${ngoContext.slug}` : "" } }),
      });
      if (!res.ok) throw new Error("Eroare la generarea postarilor.");
      const raw = await res.json();
      const data = raw.result || raw;
      if (Array.isArray(data.posts)) setSocialPosts(data.posts);
    } catch (err) {
      setSaveMessage({ type: "error", text: err instanceof Error ? err.message : "Eroare." });
      clearSaveMessage();
    } finally { setAiToolLoading(null); }
  };

  // ─── Loading / Error ──────────────────────────────────────────────

  if (loading) {
    return (
      <div className="space-y-6">
        <MinisiteSubNav />
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="space-y-6">
        <MinisiteSubNav />
        <Card className="max-w-md mx-auto mt-12">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-8 w-8 mx-auto text-destructive mb-4" />
            <p className="text-destructive">{loadError}</p>
            <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>Reincarca</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getProgress = (raised: number, goal: number) => {
    if (!goal || goal <= 0) return 0;
    return Math.min(Math.round((raised / goal) * 100), 100);
  };

  return (
    <div className="space-y-6 pb-24">
      <MinisiteSubNav />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Campanii mini-site</h1>
          <p className="text-muted-foreground mt-1">Gestioneaza campaniile de strangere de fonduri</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleGenerateCampaigns} disabled={aiToolLoading === "generateCampaigns"}>
            {aiToolLoading === "generateCampaigns" ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
            Genereaza cu AI
          </Button>
          <Button onClick={addCampaign}>
            <Plus className="h-4 w-4 mr-2" />
            Adauga campanie
          </Button>
        </div>
      </div>

      {/* Empty state */}
      {campaigns.length === 0 && (
        <Card>
          <CardContent className="py-16 text-center">
            <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-1">Nu exista campanii inca</h3>
            <p className="text-sm text-muted-foreground mb-6">Adauga o campanie manual sau genereaza cu AI</p>
            <div className="flex justify-center gap-3">
              <Button variant="outline" onClick={addCampaign}><Plus className="h-4 w-4 mr-2" /> Adauga manual</Button>
              <Button variant="outline" onClick={handleGenerateCampaigns} disabled={aiToolLoading === "generateCampaigns"}>
                {aiToolLoading === "generateCampaigns" ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
                Genereaza cu AI
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Campaign Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {campaigns.map((campaign, idx) => {
          const progress = getProgress(campaign.raisedAmount, campaign.goalAmount);
          const isEditing = editingId === campaign.id;

          if (isEditing) {
            return (
              <Card key={campaign.id} className="col-span-full ring-2 ring-primary">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                      <Pencil className="h-5 w-5 text-primary" />
                      <h3 className="font-semibold text-lg">Editeaza campania</h3>
                      <Badge variant={campaign.isActive ? "default" : "secondary"}>
                        {campaign.isActive ? "Activa" : "Inactiva"}
                      </Badge>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setEditingId(null)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <Label>Titlu campanie *</Label>
                      <Input value={campaign.title} onChange={(e) => updateCampaign(campaign.id, "title", e.target.value)} placeholder="ex: Construim o scoala" />
                    </div>
                    <div className="md:col-span-2">
                      <Label>Descriere campanie</Label>
                      <Textarea value={campaign.description} onChange={(e) => updateCampaign(campaign.id, "description", e.target.value)} placeholder="Descrie scopul campaniei..." rows={3} />
                    </div>
                    <div>
                      <Label>Obiectiv (RON)</Label>
                      <Input type="number" min={0} value={campaign.goalAmount} onChange={(e) => updateCampaign(campaign.id, "goalAmount", Number(e.target.value) || 0)} />
                    </div>
                    <div>
                      <Label>Suma stransa (RON)</Label>
                      <Input type="number" min={0} value={campaign.raisedAmount} onChange={(e) => updateCampaign(campaign.id, "raisedAmount", Number(e.target.value) || 0)} />
                    </div>
                    <div className="md:col-span-2">
                      <Label><span className="flex items-center gap-1"><ImageIcon className="h-3.5 w-3.5" /> URL imagine</span></Label>
                      <Input value={campaign.imageUrl} onChange={(e) => updateCampaign(campaign.id, "imageUrl", e.target.value)} placeholder="https://exemplu.ro/imagine.jpg" />
                    </div>
                  </div>

                  {/* Progress preview */}
                  <div className="mt-4 p-3 bg-muted/30 rounded-lg">
                    <div className="flex justify-between text-sm mb-1.5">
                      <span className="text-muted-foreground">{campaign.raisedAmount.toLocaleString("ro-RO")} RON</span>
                      <span className="font-medium">{progress}%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
                      <div className="bg-primary h-full rounded-full transition-all" style={{ width: `${progress}%` }} />
                    </div>
                  </div>

                  {/* Updates */}
                  <div className="border-t pt-4 mt-6">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Actualizari</span>
                        <Badge variant="outline" className="text-xs">{(campaign.updates || []).length}</Badge>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => addCampaignUpdate(campaign.id)}>
                        <Plus className="h-3.5 w-3.5 mr-1" /> Adauga
                      </Button>
                    </div>
                    {(campaign.updates || []).length === 0 && (
                      <p className="text-xs text-muted-foreground italic">Nu exista actualizari.</p>
                    )}
                    <div className="space-y-3">
                      {(campaign.updates || []).map((upd) => (
                        <div key={upd.id} className="flex gap-2 items-start bg-muted/30 rounded-lg p-3">
                          <div className="flex-1 grid grid-cols-1 sm:grid-cols-[140px_1fr] gap-2">
                            <div>
                              <Label className="text-xs">Data</Label>
                              <Input type="date" value={upd.date} onChange={(e) => updateCampaignUpdate(campaign.id, upd.id, "date", e.target.value)} className="text-sm" />
                            </div>
                            <div>
                              <Label className="text-xs">Text</Label>
                              <Input value={upd.text} onChange={(e) => updateCampaignUpdate(campaign.id, upd.id, "text", e.target.value)} placeholder="Ce s-a intamplat..." className="text-sm" />
                            </div>
                          </div>
                          <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive mt-5" onClick={() => removeCampaignUpdate(campaign.id, upd.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap items-center gap-2 border-t pt-4 mt-4">
                    <Button variant="outline" size="sm" onClick={() => handleEnhanceCampaign(idx)} disabled={aiToolLoading === `enhance-${idx}`}>
                      {aiToolLoading === `enhance-${idx}` ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
                      Imbunatateste cu AI
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleSocialPosts(campaign)} disabled={aiToolLoading === `social-${campaign.id}`}>
                      {aiToolLoading === `social-${campaign.id}` ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Share2 className="h-4 w-4 mr-2" />}
                      Postari social media
                    </Button>
                    <div className="flex-1" />
                    <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => removeCampaign(campaign.id)}>
                      <Trash2 className="h-4 w-4 mr-1" /> Sterge
                    </Button>
                    <Button size="sm" onClick={() => setEditingId(null)}>
                      <CheckCircle2 className="h-4 w-4 mr-1" /> Gata
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          }

          // Card view (not editing)
          return (
            <Card key={campaign.id} className={`overflow-hidden hover:shadow-md transition-all ${!campaign.isActive ? "opacity-60" : ""}`}>
              {campaign.imageUrl ? (
                <div className="aspect-video bg-gray-100 relative">
                  <img src={campaign.imageUrl} alt={campaign.title} className="w-full h-full object-cover" />
                  <div className="absolute top-2 right-2">
                    <Badge variant={campaign.isActive ? "default" : "secondary"} className="text-xs">
                      {campaign.isActive ? "Activa" : "Inactiva"}
                    </Badge>
                  </div>
                </div>
              ) : (
                <div className="aspect-video bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center relative">
                  <ImageIcon className="h-10 w-10 text-primary/30" />
                  <div className="absolute top-2 right-2">
                    <Badge variant={campaign.isActive ? "default" : "secondary"} className="text-xs">
                      {campaign.isActive ? "Activa" : "Inactiva"}
                    </Badge>
                  </div>
                </div>
              )}
              <CardContent className="p-4">
                <h3 className="font-semibold text-base mb-1 line-clamp-1">{campaign.title || "Campanie fara titlu"}</h3>
                {campaign.description && <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{campaign.description}</p>}
                <div className="space-y-1.5 mb-3">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">{campaign.raisedAmount.toLocaleString("ro-RO")} RON</span>
                    <span className="font-medium">{progress}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                    <div className="bg-primary h-full rounded-full transition-all" style={{ width: `${progress}%` }} />
                  </div>
                  <p className="text-xs text-muted-foreground text-right">Obiectiv: {campaign.goalAmount.toLocaleString("ro-RO")} RON</p>
                </div>
                {(campaign.updates || []).length > 0 && (
                  <p className="text-xs text-muted-foreground mb-3">{(campaign.updates || []).length} actualizari</p>
                )}
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" className="flex-1" onClick={() => setEditingId(campaign.id)}>
                    <Pencil className="h-3.5 w-3.5 mr-1.5" /> Editeaza
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => toggleCampaignActive(campaign.id)} title={campaign.isActive ? "Dezactiveaza" : "Activeaza"}>
                    {campaign.isActive ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  </Button>
                  <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => removeCampaign(campaign.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {socialPosts && <SocialPostsModal posts={socialPosts} onClose={() => setSocialPosts(null)} />}

      {/* Sticky save bar */}
      <div className="sticky bottom-0 z-40 -mx-1 px-1">
        <div className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border rounded-xl shadow-lg p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              {saveMessage ? (
                <div className={`flex items-center gap-2 text-sm ${saveMessage.type === "success" ? "text-green-600" : "text-destructive"}`}>
                  {saveMessage.type === "success" ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0" />}
                  <span className="truncate">{saveMessage.text}</span>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">{campaigns.length} {campaigns.length === 1 ? "campanie" : "campanii"} configurate</p>
              )}
            </div>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              Salveaza
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

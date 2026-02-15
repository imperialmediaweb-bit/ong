"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { MinisiteSubNav } from "../_components/minisite-nav";
import {
  Sparkles, Save, Loader2, ExternalLink, Wand2, FileText,
  CheckCircle2, AlertCircle, ChevronDown, ChevronRight, Download, Search, Image,
} from "lucide-react";

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

// ─── Types ───────────────────────────────────────────────────────────

interface ContentState {
  heroTitle: string;
  heroDescription: string;
  heroCtaText: string;
  aboutText: string;
  aboutImageUrl: string;
  missionText: string;
  impactText: string;
  formular230EmbedCode: string;
  formular230PdfUrl: string;
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string;
  // Context for AI
  ngoName: string;
  slug: string;
  description: string;
  shortDescription: string;
  category: string;
  contactAddress: string;
  missionText_: string;
}

const DEFAULT_STATE: ContentState = {
  heroTitle: "",
  heroDescription: "",
  heroCtaText: "Doneaza acum",
  aboutText: "",
  aboutImageUrl: "",
  missionText: "",
  impactText: "",
  formular230EmbedCode: "",
  formular230PdfUrl: "",
  seoTitle: "",
  seoDescription: "",
  seoKeywords: "",
  ngoName: "",
  slug: "",
  description: "",
  shortDescription: "",
  category: "",
  contactAddress: "",
  missionText_: "",
};

// ─── Component ───────────────────────────────────────────────────────

export default function ContinutPage() {
  const [state, setState] = useState<ContentState>(DEFAULT_STATE);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [aiGenerated, setAiGenerated] = useState(false);
  const [seoGenerating, setSeoGenerating] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(["continut-ai"]));

  // ─── Helpers ─────────────────────────────────────────────────────

  const updateField = useCallback(
    <K extends keyof ContentState>(field: K, value: ContentState[K]) => {
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
          heroTitle: data.heroTitle || "",
          heroDescription: data.heroDescription || "",
          heroCtaText: data.heroCtaText || "Doneaza acum",
          aboutText: data.aboutText || "",
          aboutImageUrl: data.aboutImageUrl || "",
          missionText: data.missionText || "",
          impactText: data.impactText || "",
          formular230EmbedCode: data.formular230EmbedCode || "",
          formular230PdfUrl: data.formular230PdfUrl || "",
          seoTitle: data.seoTitle || "",
          seoDescription: data.seoDescription || "",
          seoKeywords: data.seoKeywords || "",
          // Context fields (read-only, for AI generation)
          ngoName: data.ngoName || "",
          slug: data.slug || "",
          description: data.description || "",
          shortDescription: data.shortDescription || "",
          category: data.category || "",
          contactAddress: data.contactAddress || "",
          missionText_: data.missionText || "",
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

  // ─── Save (only fields this page manages) ─────────────────────────

  const handleSave = async () => {
    try {
      setSaving(true);
      setSaveMessage(null);
      const res = await fetch("/api/minisite/builder", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          heroTitle: state.heroTitle,
          heroDescription: state.heroDescription,
          heroCtaText: state.heroCtaText,
          aboutText: state.aboutText,
          aboutImageUrl: state.aboutImageUrl,
          missionText: state.missionText,
          impactText: state.impactText,
          formular230EmbedCode: state.formular230EmbedCode,
          formular230PdfUrl: state.formular230PdfUrl,
          seoTitle: state.seoTitle,
          seoDescription: state.seoDescription,
          seoKeywords: state.seoKeywords,
        }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.error || "Eroare la salvare. Incercati din nou.");
      }
      setSaveMessage({ type: "success", text: "Continutul a fost salvat cu succes!" });
      clearSaveMessage();
    } catch (err) {
      console.error("Error saving content:", err);
      setSaveMessage({ type: "error", text: err instanceof Error ? err.message : "Eroare la salvare." });
      clearSaveMessage();
    } finally {
      setSaving(false);
    }
  };

  // ─── AI Generate Content ──────────────────────────────────────────

  const handleAiGenerate = async () => {
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
          contactAddress: state.contactAddress,
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
        seoTitle: gen.seoTitle || prev.seoTitle,
        seoDescription: gen.seoDescription || prev.seoDescription,
      }));
      setAiGenerated(true);

      setSaveMessage({ type: "success", text: "Continutul a fost generat cu succes! Puteti edita textele si apoi salva." });
      clearSaveMessage();
    } catch (err) {
      console.error("Error generating AI content:", err);
      setSaveMessage({ type: "error", text: err instanceof Error ? err.message : "Eroare la generarea continutului AI." });
      clearSaveMessage();
    } finally {
      setGenerating(false);
    }
  };

  // ─── AI Generate SEO ──────────────────────────────────────────────

  const handleSeoGenerate = async () => {
    try {
      setSeoGenerating(true);
      setSaveMessage(null);
      const res = await fetch("/api/minisite/ai-tools", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tool: "seo",
          context: {
            name: state.ngoName,
            ngoName: state.ngoName,
            description: state.description,
            category: state.category,
            shortDescription: state.shortDescription,
            aboutText: state.aboutText,
            missionText: state.missionText,
          },
        }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.error || "Eroare la generarea SEO cu AI.");
      }
      const raw = await res.json();
      const data = raw.result || raw;

      if (data.seoTitle) {
        setState((prev) => ({
          ...prev,
          seoTitle: data.seoTitle || prev.seoTitle,
          seoDescription: data.seoDescription || prev.seoDescription,
          seoKeywords: data.seoKeywords || prev.seoKeywords,
        }));
      }

      setSaveMessage({ type: "success", text: "SEO generat cu AI cu succes!" });
      clearSaveMessage();
    } catch (err) {
      console.error("Error generating SEO:", err);
      setSaveMessage({ type: "error", text: err instanceof Error ? err.message : "Eroare la generarea SEO." });
      clearSaveMessage();
    } finally {
      setSeoGenerating(false);
    }
  };

  // ─── Loading / Error ──────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Se incarca datele...</p>
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
      <MinisiteSubNav />

      {/* ═══ HEADER ════════════════════════════════════════════════════ */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Continut site</h1>
          <p className="text-muted-foreground mt-1">Texte, hero, SEO si formular 230</p>
        </div>
        {state.slug && (
          <Button variant="outline" size="sm" onClick={() => window.open(`/s/${state.slug}`, "_blank")} className="gap-1.5 font-mono text-xs">
            /s/{state.slug} <ExternalLink className="h-3 w-3" />
          </Button>
        )}
      </div>

      {/* ═══ SECTION 1: CONTINUT AI ═══════════════════════════════════ */}
      <Section
        id="continut-ai"
        title="Continut AI"
        description="Hero, despre noi, misiune, impact"
        icon={Wand2}
        expanded={expandedSections.has("continut-ai")}
        onToggle={toggleSection}
        badge={aiGenerated ? <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50 text-xs">Generat</Badge> : undefined}
      >
        <div className="space-y-5">
          {!aiGenerated && (
            <div className="text-center py-6 border-2 border-dashed rounded-xl">
              <Wand2 className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground mb-4">Genereaza continutul automat cu AI sau completeaza manual mai jos.</p>
              <Button onClick={handleAiGenerate} disabled={generating || !state.ngoName} className="gap-2">
                {generating ? <><Loader2 className="h-4 w-4 animate-spin" /> Se genereaza...</> : <><Sparkles className="h-4 w-4" /> Genereaza cu AI</>}
              </Button>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-2">
              <Label className="font-medium">Titlu Hero</Label>
              <Input
                value={state.heroTitle}
                onChange={(e) => updateField("heroTitle", e.target.value)}
                placeholder="Titlul principal al paginii..."
              />
            </div>
            <div className="space-y-2">
              <Label className="font-medium">Text buton CTA</Label>
              <Input
                value={state.heroCtaText}
                onChange={(e) => updateField("heroCtaText", e.target.value)}
                placeholder="Doneaza acum"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="font-medium">Descriere Hero</Label>
            <Textarea
              value={state.heroDescription}
              onChange={(e) => updateField("heroDescription", e.target.value)}
              placeholder="Subtitlul de pe pagina principala..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label className="font-medium">Sectiunea Despre noi</Label>
            <Textarea
              value={state.aboutText}
              onChange={(e) => updateField("aboutText", e.target.value)}
              placeholder="Prezentarea organizatiei..."
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2 font-medium"><Image className="h-4 w-4" /> Imagine Despre noi (optional)</Label>
            <Input
              placeholder="https://exemplu.ro/echipa.jpg"
              value={state.aboutImageUrl}
              onChange={(e) => updateField("aboutImageUrl", e.target.value)}
            />
            {state.aboutImageUrl && (
              <div className="mt-2 border rounded-lg overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={state.aboutImageUrl}
                  alt="About preview"
                  className="w-full h-40 object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label className="font-medium">Sectiunea Misiune</Label>
            <Textarea
              value={state.missionText}
              onChange={(e) => updateField("missionText", e.target.value)}
              placeholder="Misiunea si viziunea organizatiei..."
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label className="font-medium">Text Impact</Label>
            <Textarea
              value={state.impactText}
              onChange={(e) => updateField("impactText", e.target.value)}
              placeholder="Descrierea impactului asupra comunitatii..."
              rows={3}
            />
          </div>

          {aiGenerated && (
            <Button variant="outline" onClick={handleAiGenerate} disabled={generating} className="gap-2">
              {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              Regenereaza continutul
            </Button>
          )}
        </div>
      </Section>

      {/* ═══ SECTION 2: FORMULAR 230 ═══════════════════════════════════ */}
      <Section
        id="formular230"
        title="Formular 230 - Redirectionare 3,5%"
        description="Formular online si PDF descarcabil"
        icon={FileText}
        expanded={expandedSections.has("formular230")}
        onToggle={toggleSection}
        badge={state.formular230EmbedCode ? <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50 text-xs">Configurat</Badge> : undefined}
      >
        <div className="space-y-5">
          <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="space-y-1">
                <h4 className="font-semibold text-blue-900 text-sm">Pasul 1: Creeaza cont pe formular230.ro</h4>
                <p className="text-xs text-blue-700">Inregistreaza-te gratuit, adauga datele asociatiei si copiaza codul embed generat.</p>
              </div>
              <a
                href="https://formular230.ro"
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Mergi la formular230.ro <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="font-medium">Cod embed de la formular230.ro</Label>
            <Textarea
              placeholder={'<iframe src="https://formular230.ro/organizatia-ta" width="100%" height="600" ...></iframe>'}
              value={state.formular230EmbedCode}
              onChange={(e) => updateField("formular230EmbedCode", e.target.value)}
              rows={3}
              className="font-mono text-sm"
            />
            {state.formular230EmbedCode && (
              <div className="flex items-center gap-2 text-sm text-green-700">
                <CheckCircle2 className="h-4 w-4" /> Cod embed configurat
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label className="font-medium flex items-center gap-2"><Download className="h-4 w-4" /> Link PDF Formular 230 (optional)</Label>
            <Input
              placeholder="https://drive.google.com/... sau https://exemplu.ro/formular-230.pdf"
              value={state.formular230PdfUrl}
              onChange={(e) => updateField("formular230PdfUrl", e.target.value)}
            />
            <p className="text-xs text-muted-foreground">Urca PDF-ul pe Google Drive sau Dropbox si lipeste link-ul aici.</p>
          </div>
        </div>
      </Section>

      {/* ═══ SECTION 3: SEO ═══════════════════════════════════════════ */}
      <Section
        id="seo"
        title="SEO - Optimizare Google"
        description="Titlu, descriere si cuvinte cheie pentru motoarele de cautare"
        icon={Search}
        expanded={expandedSections.has("seo")}
        onToggle={toggleSection}
        badge={state.seoTitle ? <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50 text-xs">Configurat</Badge> : undefined}
      >
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Optimizeaza modul in care site-ul tau apare in rezultatele Google.</p>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSeoGenerate}
              disabled={seoGenerating || !state.ngoName}
              className="gap-2"
            >
              {seoGenerating ? <><Loader2 className="h-4 w-4 animate-spin" /> Se genereaza...</> : <><Sparkles className="h-4 w-4" /> Genereaza cu AI</>}
            </Button>
          </div>

          <div className="space-y-2">
            <Label className="font-medium">Titlu SEO (max 60 caractere)</Label>
            <Input
              placeholder="Titlu optimizat pentru Google..."
              value={state.seoTitle}
              onChange={(e) => updateField("seoTitle", e.target.value)}
              maxLength={60}
            />
            <p className="text-xs text-muted-foreground text-right">{state.seoTitle.length} / 60 caractere</p>
          </div>

          <div className="space-y-2">
            <Label className="font-medium">Descriere SEO (max 155 caractere)</Label>
            <Textarea
              placeholder="Descriere captivanta pentru rezultatele Google..."
              value={state.seoDescription}
              onChange={(e) => updateField("seoDescription", e.target.value)}
              rows={2}
              maxLength={155}
            />
            <p className="text-xs text-muted-foreground text-right">{state.seoDescription.length} / 155 caractere</p>
          </div>

          <div className="space-y-2">
            <Label className="font-medium">Cuvinte cheie (separate prin virgula)</Label>
            <Input
              placeholder="ONG, donatii, voluntariat, comunitate..."
              value={state.seoKeywords}
              onChange={(e) => updateField("seoKeywords", e.target.value)}
            />
            <p className="text-xs text-muted-foreground">10-15 cuvinte cheie relevante pentru organizatia ta.</p>
          </div>
        </div>
      </Section>

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
            <Button variant="outline" onClick={() => state.slug && window.open(`/s/${state.slug}`, "_blank")} disabled={!state.slug} className="gap-2">
              <ExternalLink className="h-4 w-4" /> Previzualizeaza
            </Button>
            <Button onClick={handleSave} disabled={saving} className="gap-2 min-w-[140px]">
              {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Se salveaza...</> : <><Save className="h-4 w-4" /> Salveaza</>}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

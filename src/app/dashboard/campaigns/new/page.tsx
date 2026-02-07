"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Mail,
  MessageSquare,
  Sparkles,
  Eye,
  Send,
  Calendar,
  Users,
  Loader2,
  Monitor,
  Smartphone,
  Wand2,
  X,
} from "lucide-react";

const STEPS = [
  { id: "type", label: "Tip", icon: Mail },
  { id: "content", label: "Continut", icon: MessageSquare },
  { id: "audience", label: "Audienta", icon: Users },
  { id: "schedule", label: "Programare", icon: Calendar },
  { id: "review", label: "Revizuire", icon: CheckCircle2 },
] as const;

type StepId = typeof STEPS[number]["id"];

const CAMPAIGN_TYPES = [
  { value: "THANK_YOU", label: "Multumire", description: "Trimite recunostinta donatorilor dupa o donatie" },
  { value: "UPDATE", label: "Actualizare", description: "Distribuie noutati si progresul proiectelor" },
  { value: "EMERGENCY_APPEAL", label: "Apel de urgenta", description: "Strangere urgenta de fonduri pentru nevoi critice" },
  { value: "NEWSLETTER", label: "Newsletter", description: "Actualizari regulate si implicare" },
  { value: "REACTIVATION", label: "Reactivare", description: "Reangajeaza donatorii inactivi" },
  { value: "CORPORATE_OUTREACH", label: "Parteneriate corporate", description: "Contacteaza partenerii corporativi" },
  { value: "CUSTOM", label: "Personalizat", description: "Creeaza o campanie complet personalizata" },
];

interface CampaignForm {
  name: string;
  type: string;
  channel: string;
  subject: string;
  emailBody: string;
  previewText: string;
  smsBody: string;
  segmentTags: string[];
  segmentStatus: string;
  segmentMinDonation: string;
  scheduleType: "now" | "later";
  scheduledAt: string;
  goalAmount: string;
}

export default function NewCampaignPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<StepId>("type");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">("desktop");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSidebarOpen, setAiSidebarOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [audienceCount, setAudienceCount] = useState<number | null>(null);
  const [audienceLoading, setAudienceLoading] = useState(false);

  const [form, setForm] = useState<CampaignForm>({
    name: "",
    type: "",
    channel: "EMAIL",
    subject: "",
    emailBody: "",
    previewText: "",
    smsBody: "",
    segmentTags: [],
    segmentStatus: "ACTIVE",
    segmentMinDonation: "",
    scheduleType: "now",
    scheduledAt: "",
    goalAmount: "",
  });

  const updateForm = (fields: Partial<CampaignForm>) => {
    setForm((prev) => ({ ...prev, ...fields }));
  };

  const currentStepIndex = STEPS.findIndex((s) => s.id === currentStep);

  const goNext = () => {
    if (currentStepIndex < STEPS.length - 1) {
      setCurrentStep(STEPS[currentStepIndex + 1].id);
    }
  };

  const goBack = () => {
    if (currentStepIndex > 0) {
      setCurrentStep(STEPS[currentStepIndex - 1].id);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case "type":
        return form.name.trim() !== "" && form.type !== "" && form.channel !== "";
      case "content":
        if (form.channel === "EMAIL" || form.channel === "BOTH") {
          return form.subject.trim() !== "" && form.emailBody.trim() !== "";
        }
        if (form.channel === "SMS") {
          return form.smsBody.trim() !== "";
        }
        return true;
      case "audience":
        return true;
      case "schedule":
        return form.scheduleType === "now" || form.scheduledAt !== "";
      case "review":
        return true;
      default:
        return false;
    }
  };

  const handleAiGenerate = async () => {
    if (!aiPrompt.trim()) return;
    setAiLoading(true);
    try {
      const res = await fetch("/api/ai/generate-campaign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: aiPrompt,
          type: form.type,
          channel: form.channel,
        }),
      });
      if (!res.ok) throw new Error("AI generation failed");
      const data = await res.json();
      if (data.subject) updateForm({ subject: data.subject });
      if (data.emailBody) updateForm({ emailBody: data.emailBody });
      if (data.smsBody) updateForm({ smsBody: data.smsBody });
      if (data.previewText) updateForm({ previewText: data.previewText });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setAiLoading(false);
    }
  };

  const estimateAudience = async () => {
    setAudienceLoading(true);
    try {
      const params = new URLSearchParams();
      if (form.segmentStatus) params.set("status", form.segmentStatus);
      if (form.segmentMinDonation) params.set("minDonation", form.segmentMinDonation);
      if (form.segmentTags.length) params.set("tags", form.segmentTags.join(","));
      params.set("channel", form.channel);

      const res = await fetch(`/api/donors/count?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to estimate audience");
      const data = await res.json();
      setAudienceCount(data.count);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setAudienceLoading(false);
    }
  };

  const handleSubmit = async () => {
    setSaving(true);
    setError(null);
    try {
      const body = {
        name: form.name,
        type: form.type,
        channel: form.channel,
        subject: form.subject || undefined,
        emailBody: form.emailBody || undefined,
        previewText: form.previewText || undefined,
        smsBody: form.smsBody || undefined,
        segmentQuery: {
          status: form.segmentStatus,
          tags: form.segmentTags,
          minDonation: form.segmentMinDonation ? parseFloat(form.segmentMinDonation) : undefined,
        },
        scheduledAt: form.scheduleType === "later" ? form.scheduledAt : undefined,
        sendNow: form.scheduleType === "now",
        goalAmount: form.goalAmount ? parseFloat(form.goalAmount) : undefined,
      };

      const res = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to create campaign");
      }
      const data = await res.json();
      router.push(`/dashboard/campaigns/${data.id}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const smsCharCount = form.smsBody.length;
  const smsSegments = Math.ceil(smsCharCount / 160) || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Campanie noua</h1>
          <p className="text-muted-foreground">Creeaza si trimite o campanie noua de email sau SMS.</p>
        </div>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center justify-between">
        {STEPS.map((step, idx) => {
          const isActive = step.id === currentStep;
          const isCompleted = idx < currentStepIndex;
          return (
            <div key={step.id} className="flex items-center flex-1">
              <button
                onClick={() => idx <= currentStepIndex && setCurrentStep(step.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : isCompleted
                    ? "bg-primary/10 text-primary cursor-pointer"
                    : "text-muted-foreground"
                }`}
              >
                <step.icon className="h-4 w-4" />
                <span className="hidden sm:inline">{step.label}</span>
              </button>
              {idx < STEPS.length - 1 && (
                <div className={`flex-1 h-px mx-2 ${idx < currentStepIndex ? "bg-primary" : "bg-border"}`} />
              )}
            </div>
          );
        })}
      </div>

      {error && (
        <Card className="border-destructive">
          <CardContent className="py-3">
            <p className="text-sm text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      <div className="flex gap-6">
        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {/* Step 1: Type */}
          {currentStep === "type" && (
            <Card>
              <CardHeader>
                <CardTitle>Detalii campanie</CardTitle>
                <CardDescription>Alege tipul si canalul pentru campanie.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-2">
                  <Label htmlFor="name">Nume campanie *</Label>
                  <Input
                    id="name"
                    placeholder="ex., Newsletter lunar - Ianuarie"
                    value={form.name}
                    onChange={(e) => updateForm({ name: e.target.value })}
                  />
                </div>

                <div className="grid gap-2">
                  <Label>Tip campanie *</Label>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {CAMPAIGN_TYPES.map((type) => (
                      <div
                        key={type.value}
                        onClick={() => updateForm({ type: type.value })}
                        className={`p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                          form.type === type.value
                            ? "border-primary bg-primary/5"
                            : "border-muted hover:border-muted-foreground/30"
                        }`}
                      >
                        <p className="font-medium text-sm">{type.label}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{type.description}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label>Canal *</Label>
                  <div className="flex gap-3">
                    {[
                      { value: "EMAIL", label: "Email", icon: Mail },
                      { value: "SMS", label: "SMS", icon: MessageSquare },
                      { value: "BOTH", label: "Ambele", icon: Send },
                    ].map((ch) => (
                      <div
                        key={ch.value}
                        onClick={() => updateForm({ channel: ch.value })}
                        className={`flex items-center gap-2 px-4 py-3 rounded-lg border-2 cursor-pointer transition-colors flex-1 ${
                          form.channel === ch.value
                            ? "border-primary bg-primary/5"
                            : "border-muted hover:border-muted-foreground/30"
                        }`}
                      >
                        <ch.icon className="h-4 w-4" />
                        <span className="font-medium text-sm">{ch.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="goal">Obiectiv de strangere de fonduri (optional)</Label>
                  <Input
                    id="goal"
                    type="number"
                    placeholder="ex., 5000"
                    value={form.goalAmount}
                    onChange={(e) => updateForm({ goalAmount: e.target.value })}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Content */}
          {currentStep === "content" && (
            <div className="space-y-4">
              {(form.channel === "EMAIL" || form.channel === "BOTH") && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>Continut email</CardTitle>
                        <CardDescription>Compune mesajul email.</CardDescription>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setAiSidebarOpen(!aiSidebarOpen)}
                      >
                        <Sparkles className="mr-2 h-4 w-4" />
                        Asistent AI
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-2">
                      <Label htmlFor="subject">Linie subiect *</Label>
                      <Input
                        id="subject"
                        placeholder="Subiectul emailului..."
                        value={form.subject}
                        onChange={(e) => updateForm({ subject: e.target.value })}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="preview">Text previzualizare</Label>
                      <Input
                        id="preview"
                        placeholder="Text afisat in previzualizarea inbox-ului..."
                        value={form.previewText}
                        onChange={(e) => updateForm({ previewText: e.target.value })}
                      />
                    </div>
                    <div className="grid gap-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="emailBody">Continut email (HTML) *</Label>
                        <div className="flex items-center gap-1 border rounded-md">
                          <Button
                            variant={previewMode === "desktop" ? "secondary" : "ghost"}
                            size="sm"
                            className="h-7 px-2"
                            onClick={() => setPreviewMode("desktop")}
                          >
                            <Monitor className="h-3 w-3" />
                          </Button>
                          <Button
                            variant={previewMode === "mobile" ? "secondary" : "ghost"}
                            size="sm"
                            className="h-7 px-2"
                            onClick={() => setPreviewMode("mobile")}
                          >
                            <Smartphone className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      <Tabs defaultValue="edit">
                        <TabsList className="w-full">
                          <TabsTrigger value="edit" className="flex-1">Editeaza</TabsTrigger>
                          <TabsTrigger value="preview" className="flex-1">Previzualizare</TabsTrigger>
                        </TabsList>
                        <TabsContent value="edit">
                          <Textarea
                            id="emailBody"
                            placeholder="<h1>Buna {{donor.name}}</h1><p>Continutul emailului aici...</p>"
                            value={form.emailBody}
                            onChange={(e) => updateForm({ emailBody: e.target.value })}
                            className="min-h-[300px] font-mono text-sm"
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            Folositi {"{{donor.name}}"}, {"{{donor.email}}"}, {"{{ngo.name}}"} ca etichete de imbinare.
                          </p>
                        </TabsContent>
                        <TabsContent value="preview">
                          <div
                            className={`border rounded-lg p-4 min-h-[300px] bg-white mx-auto ${
                              previewMode === "mobile" ? "max-w-[375px]" : "max-w-full"
                            }`}
                          >
                            {form.emailBody ? (
                              <div
                                dangerouslySetInnerHTML={{ __html: form.emailBody }}
                                className="prose prose-sm max-w-none"
                              />
                            ) : (
                              <p className="text-muted-foreground text-center py-12">
                                Incepe sa scrii pentru a vedea previzualizarea.
                              </p>
                            )}
                          </div>
                        </TabsContent>
                      </Tabs>
                    </div>
                  </CardContent>
                </Card>
              )}

              {(form.channel === "SMS" || form.channel === "BOTH") && (
                <Card>
                  <CardHeader>
                    <CardTitle>Continut SMS</CardTitle>
                    <CardDescription>Compune mesajul SMS.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-2">
                      <Label htmlFor="smsBody">Mesaj SMS *</Label>
                      <Textarea
                        id="smsBody"
                        placeholder="Mesajul SMS aici..."
                        value={form.smsBody}
                        onChange={(e) => updateForm({ smsBody: e.target.value })}
                        className="min-h-[120px]"
                        maxLength={480}
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>
                          {smsCharCount} / 480 caractere ({smsSegments} segment{smsSegments !== 1 ? "e" : ""})
                        </span>
                        {smsCharCount > 160 && (
                          <span className="text-yellow-600">
                            Segmentele multiple vor creste costul
                          </span>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Step 3: Audience */}
          {currentStep === "audience" && (
            <Card>
              <CardHeader>
                <CardTitle>Selecteaza audienta</CardTitle>
                <CardDescription>Defineste cine va primi aceasta campanie.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-2">
                  <Label>Status donator</Label>
                  <Select
                    value={form.segmentStatus}
                    onValueChange={(v) => updateForm({ segmentStatus: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ACTIVE">Doar donatori activi</SelectItem>
                      <SelectItem value="INACTIVE">Doar donatori inactivi</SelectItem>
                      <SelectItem value="ALL">Toti donatorii</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label>Donatie totala minima (optional)</Label>
                  <Input
                    type="number"
                    placeholder="ex., 100"
                    value={form.segmentMinDonation}
                    onChange={(e) => updateForm({ segmentMinDonation: e.target.value })}
                  />
                </div>

                <div className="grid gap-2">
                  <Label>Filtreaza dupa etichete (optional)</Label>
                  <Input
                    placeholder="Introduceti numele etichetelor separate prin virgula"
                    value={form.segmentTags.join(", ")}
                    onChange={(e) =>
                      updateForm({
                        segmentTags: e.target.value
                          .split(",")
                          .map((t) => t.trim())
                          .filter(Boolean),
                      })
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Lasati gol pentru a include toti donatorii care corespund celorlalte criterii.
                  </p>
                </div>

                <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
                  <Button variant="outline" onClick={estimateAudience} disabled={audienceLoading}>
                    {audienceLoading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Users className="mr-2 h-4 w-4" />
                    )}
                    Estimeaza audienta
                  </Button>
                  {audienceCount !== null && (
                    <div>
                      <span className="text-2xl font-bold">{audienceCount}</span>
                      <span className="text-sm text-muted-foreground ml-2">
                        {form.channel === "EMAIL"
                          ? "destinatari cu consimtamant email"
                          : form.channel === "SMS"
                          ? "destinatari cu consimtamant SMS"
                          : "destinatari"}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 4: Schedule */}
          {currentStep === "schedule" && (
            <Card>
              <CardHeader>
                <CardTitle>Programeaza campania</CardTitle>
                <CardDescription>Alege cand sa trimiti campania.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div
                    onClick={() => updateForm({ scheduleType: "now" })}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                      form.scheduleType === "now"
                        ? "border-primary bg-primary/5"
                        : "border-muted hover:border-muted-foreground/30"
                    }`}
                  >
                    <div className="flex items-center gap-2 font-medium">
                      <Send className="h-4 w-4" />
                      Trimite acum
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Campania va fi trimisa imediat dupa creare.
                    </p>
                  </div>
                  <div
                    onClick={() => updateForm({ scheduleType: "later" })}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                      form.scheduleType === "later"
                        ? "border-primary bg-primary/5"
                        : "border-muted hover:border-muted-foreground/30"
                    }`}
                  >
                    <div className="flex items-center gap-2 font-medium">
                      <Calendar className="h-4 w-4" />
                      Programeaza pentru mai tarziu
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Alege o data si ora pentru trimiterea campaniei.
                    </p>
                  </div>
                </div>

                {form.scheduleType === "later" && (
                  <div className="grid gap-2">
                    <Label htmlFor="scheduledAt">Data si ora trimiterii</Label>
                    <Input
                      id="scheduledAt"
                      type="datetime-local"
                      value={form.scheduledAt}
                      onChange={(e) => updateForm({ scheduledAt: e.target.value })}
                      min={new Date().toISOString().slice(0, 16)}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Step 5: Review */}
          {currentStep === "review" && (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Revizuire campanie</CardTitle>
                  <CardDescription>Revizuieste campania inainte de trimitere.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <Label className="text-xs text-muted-foreground">Nume campanie</Label>
                      <p className="font-medium">{form.name}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Tip</Label>
                      <p className="font-medium">{form.type.replace(/_/g, " ")}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Canal</Label>
                      <Badge variant="outline">{form.channel}</Badge>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Programare</Label>
                      <p className="font-medium">
                        {form.scheduleType === "now"
                          ? "Trimite imediat"
                          : `Programat: ${form.scheduledAt}`}
                      </p>
                    </div>
                    {form.goalAmount && (
                      <div>
                        <Label className="text-xs text-muted-foreground">Obiectiv strangere fonduri</Label>
                        <p className="font-medium">{form.goalAmount} RON</p>
                      </div>
                    )}
                    {audienceCount !== null && (
                      <div>
                        <Label className="text-xs text-muted-foreground">Destinatari estimati</Label>
                        <p className="font-medium">{audienceCount}</p>
                      </div>
                    )}
                  </div>

                  {form.subject && (
                    <div className="pt-4 border-t">
                      <Label className="text-xs text-muted-foreground">Subiect</Label>
                      <p className="font-medium">{form.subject}</p>
                    </div>
                  )}

                  {form.emailBody && (
                    <div className="pt-4 border-t">
                      <Label className="text-xs text-muted-foreground mb-2 block">Previzualizare email</Label>
                      <div className="border rounded-lg p-4 bg-white max-h-[300px] overflow-y-auto">
                        <div
                          dangerouslySetInnerHTML={{ __html: form.emailBody }}
                          className="prose prose-sm max-w-none"
                        />
                      </div>
                    </div>
                  )}

                  {form.smsBody && (
                    <div className="pt-4 border-t">
                      <Label className="text-xs text-muted-foreground mb-2 block">Previzualizare SMS</Label>
                      <div className="bg-muted p-3 rounded-lg max-w-sm">
                        <p className="text-sm">{form.smsBody}</p>
                        <p className="text-xs text-muted-foreground mt-2">
                          {form.smsBody.length} caractere / {Math.ceil(form.smsBody.length / 160)} segment(e)
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-6">
            <Button
              variant="outline"
              onClick={goBack}
              disabled={currentStepIndex === 0}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Inapoi
            </Button>
            <div className="flex gap-2">
              {currentStep === "review" ? (
                <Button onClick={handleSubmit} disabled={saving}>
                  {saving ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="mr-2 h-4 w-4" />
                  )}
                  {form.scheduleType === "now" ? "Trimite campania" : "Programeaza campania"}
                </Button>
              ) : (
                <Button onClick={goNext} disabled={!canProceed()}>
                  Urmatorul
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* AI Sidebar */}
        {aiSidebarOpen && (
          <div className="w-80 shrink-0">
            <Card className="sticky top-8">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-purple-500" />
                  Asistent AI
                </CardTitle>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setAiSidebarOpen(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Descrie ce doresti si AI va genera continutul campaniei pentru tine.
                </p>
                <Textarea
                  placeholder="ex., Scrie un email de multumire pentru donatorii care au contribuit la campania de ajutor in caz de inundatii..."
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  className="min-h-[120px]"
                />
                <Button
                  className="w-full"
                  onClick={handleAiGenerate}
                  disabled={aiLoading || !aiPrompt.trim()}
                >
                  {aiLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Wand2 className="mr-2 h-4 w-4" />
                  )}
                  Genereaza continut
                </Button>
                <div className="text-xs text-muted-foreground space-y-1">
                  <p className="font-medium">Sfaturi:</p>
                  <ul className="list-disc list-inside space-y-0.5">
                    <li>Mentioneaza scopul campaniei</li>
                    <li>Specifica tonul (formal, prietenos)</li>
                    <li>Include un obiectiv de actiune</li>
                    <li>Mentioneaza numele si misiunea ONG-ului</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

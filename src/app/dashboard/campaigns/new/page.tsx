"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Mail,
  MessageSquare,
  Sparkles,
  Send,
  Calendar,
  Users,
  Loader2,
  Monitor,
  Smartphone,
  Wand2,
  X,
  LayoutTemplate,
  FileText,
  CreditCard,
  Zap,
  Bot,
  RefreshCw,
  Copy,
  Heart,
  AlertTriangle,
  Newspaper,
  UserPlus,
  Building2,
  Settings,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────

interface EmailTemplate {
  id: string;
  name: string;
  category: string;
  subject: string;
  htmlBody: string;
  preview: string;
}

interface SmsTemplate {
  id: string;
  name: string;
  category: string;
  body: string;
  preview: string;
}

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

// ─── Constants ──────────────────────────────────────────────────

const STEPS = [
  { id: "template", label: "Template", icon: LayoutTemplate },
  { id: "type", label: "Detalii", icon: FileText },
  { id: "content", label: "Continut", icon: MessageSquare },
  { id: "audience", label: "Audienta", icon: Users },
  { id: "schedule", label: "Credite & Trimitere", icon: CreditCard },
  { id: "review", label: "Revizuire", icon: CheckCircle2 },
] as const;

type StepId = (typeof STEPS)[number]["id"];

const CAMPAIGN_TYPES = [
  { value: "THANK_YOU", label: "Multumire", icon: Heart, color: "text-pink-600 bg-pink-50" },
  { value: "NEWSLETTER", label: "Newsletter", icon: Newspaper, color: "text-blue-600 bg-blue-50" },
  { value: "EMERGENCY_APPEAL", label: "Apel urgent", icon: AlertTriangle, color: "text-red-600 bg-red-50" },
  { value: "REACTIVATION", label: "Reactivare", icon: UserPlus, color: "text-green-600 bg-green-50" },
  { value: "UPDATE", label: "Actualizare", icon: RefreshCw, color: "text-indigo-600 bg-indigo-50" },
  { value: "CORPORATE_OUTREACH", label: "Corporate", icon: Building2, color: "text-amber-600 bg-amber-50" },
  { value: "CUSTOM", label: "Personalizat", icon: Settings, color: "text-slate-600 bg-slate-50" },
];

const CATEGORY_ICONS: Record<string, string> = {
  thank_you: "💜",
  newsletter: "📰",
  emergency: "⚠️",
  reactivation: "🌟",
  event: "🎉",
  impact_report: "📊",
  reminder: "⏰",
  update: "📢",
};

// ─── Component ──────────────────────────────────────────────────

export default function NewCampaignPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<StepId>("template");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">("desktop");

  // AI Agent
  const [aiLoading, setAiLoading] = useState(false);
  const [aiAction, setAiAction] = useState<string>("");
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [aiPanelOpen, setAiPanelOpen] = useState(false);

  // Templates
  const [emailTemplates, setEmailTemplates] = useState<EmailTemplate[]>([]);
  const [smsTemplates, setSmsTemplates] = useState<SmsTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  // Credits
  const [emailCredits, setEmailCredits] = useState(0);
  const [smsCredits, setSmsCredits] = useState(0);

  // Audience
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

  // Load templates and credits
  useEffect(() => {
    loadTemplates();
    loadCredits();
  }, []);

  const loadTemplates = async () => {
    try {
      const res = await fetch("/api/campaigns/templates");
      if (res.ok) {
        const data = await res.json();
        setEmailTemplates(data.emailTemplates || []);
        setSmsTemplates(data.smsTemplates || []);
      }
    } catch {
      // Templates will just be empty
    }
  };

  const loadCredits = async () => {
    try {
      const res = await fetch("/api/campaigns/credits");
      if (res.ok) {
        const data = await res.json();
        setEmailCredits(data.emailCredits);
        setSmsCredits(data.smsCredits);
      }
    } catch {
      // Credits will stay at 0
    }
  };

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
      case "template":
        return true; // can skip templates
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

  // ─── AI Agent Functions ─────────────────────────────────────

  const handleAiGenerate = async (action: string, extraContext?: Record<string, string>) => {
    setAiLoading(true);
    setAiAction(action);
    try {
      const res = await fetch("/api/ai/campaign-agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          context: {
            campaignName: form.name,
            type: form.type,
            ngoName: "",
            tone: "cald, personal",
            additionalInfo: aiPrompt,
            channel: form.channel,
            content: form.emailBody || form.smsBody,
            ...extraContext,
          },
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Eroare AI");
      }

      const data = await res.json();

      if (action === "generate_email") {
        if (data.subject) updateForm({ subject: data.subject });
        if (data.previewText) updateForm({ previewText: data.previewText });
        if (data.htmlBody) updateForm({ emailBody: data.htmlBody });
      } else if (action === "generate_sms") {
        if (data.body) updateForm({ smsBody: data.body });
      } else if (action === "improve_content") {
        if (data.improved) {
          if (form.channel === "SMS" || (!form.emailBody && form.smsBody)) {
            updateForm({ smsBody: data.improved });
          } else {
            updateForm({ emailBody: data.improved });
          }
        }
        if (data.tips) setAiSuggestions(data.tips);
      } else if (action === "generate_subject") {
        if (data.subjects) setAiSuggestions(data.subjects);
      } else if (action === "generate_social") {
        // Store for display
        setAiSuggestions([
          data.facebook ? `Facebook: ${data.facebook}` : "",
          data.instagram ? `Instagram: ${data.instagram}` : "",
          data.linkedin ? `LinkedIn: ${data.linkedin}` : "",
        ].filter(Boolean));
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setAiLoading(false);
      setAiAction("");
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
      if (!res.ok) throw new Error("Eroare la estimare");
      const data = await res.json();
      setAudienceCount(data.count ?? data.total ?? 0);
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
        throw new Error(errData.error || "Eroare la creare campanie");
      }
      const data = await res.json();
      router.push(`/dashboard/campaigns/${data.id}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const selectEmailTemplate = (tpl: EmailTemplate) => {
    setSelectedTemplate(tpl.id);
    updateForm({
      emailBody: tpl.htmlBody,
      subject: tpl.subject,
      channel: "EMAIL",
    });
    // Map template category to campaign type
    const categoryMap: Record<string, string> = {
      thank_you: "THANK_YOU",
      newsletter: "NEWSLETTER",
      emergency: "EMERGENCY_APPEAL",
      reactivation: "REACTIVATION",
      event: "CUSTOM",
      impact_report: "UPDATE",
    };
    if (categoryMap[tpl.category]) {
      updateForm({ type: categoryMap[tpl.category] });
    }
  };

  const selectSmsTemplate = (tpl: SmsTemplate) => {
    setSelectedTemplate(tpl.id);
    updateForm({ smsBody: tpl.body, channel: "SMS" });
    const categoryMap: Record<string, string> = {
      thank_you: "THANK_YOU",
      reminder: "CUSTOM",
      emergency: "EMERGENCY_APPEAL",
      update: "UPDATE",
      reactivation: "REACTIVATION",
    };
    if (categoryMap[tpl.category]) {
      updateForm({ type: categoryMap[tpl.category] });
    }
  };

  const smsCharCount = form.smsBody.length;
  const smsSegments = Math.ceil(smsCharCount / 160) || 0;

  const estimatedEmailCost = audienceCount && (form.channel === "EMAIL" || form.channel === "BOTH") ? audienceCount : 0;
  const estimatedSmsCost = audienceCount && (form.channel === "SMS" || form.channel === "BOTH") ? audienceCount : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">Campanie noua</h1>
          <p className="text-muted-foreground">Creeaza campanii email si SMS cu template-uri si AI</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 rounded-full">
            <Mail className="h-3.5 w-3.5 text-blue-600" />
            <span className="text-sm font-medium text-blue-700">{emailCredits} emailuri</span>
          </div>
          <div className="flex items-center gap-1 px-3 py-1.5 bg-green-50 rounded-full">
            <MessageSquare className="h-3.5 w-3.5 text-green-600" />
            <span className="text-sm font-medium text-green-700">{smsCredits} SMS</span>
          </div>
        </div>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center justify-between bg-card border rounded-xl p-2">
        {STEPS.map((step, idx) => {
          const isActive = step.id === currentStep;
          const isCompleted = idx < currentStepIndex;
          return (
            <div key={step.id} className="flex items-center flex-1">
              <button
                onClick={() => idx <= currentStepIndex && setCurrentStep(step.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : isCompleted
                    ? "bg-primary/10 text-primary cursor-pointer hover:bg-primary/15"
                    : "text-muted-foreground"
                }`}
              >
                {isCompleted ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <step.icon className="h-4 w-4" />
                )}
                <span className="hidden md:inline">{step.label}</span>
              </button>
              {idx < STEPS.length - 1 && (
                <div className={`flex-1 h-0.5 mx-2 rounded-full ${idx < currentStepIndex ? "bg-primary" : "bg-border"}`} />
              )}
            </div>
          );
        })}
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <AlertTriangle className="h-4 w-4 text-red-600 flex-shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
          <button onClick={() => setError(null)} className="ml-auto">
            <X className="h-4 w-4 text-red-400" />
          </button>
        </div>
      )}

      <div className="flex gap-6">
        {/* Main Content */}
        <div className="flex-1 min-w-0">

          {/* ═══ Step 1: Template Selection ═══ */}
          {currentStep === "template" && (
            <div className="space-y-6">
              {/* Start from scratch */}
              <Card className="border-dashed border-2 hover:border-primary/50 transition-colors cursor-pointer"
                onClick={() => { setSelectedTemplate(null); goNext(); }}>
                <CardContent className="flex items-center gap-4 p-6">
                  <div className="p-3 bg-slate-100 rounded-xl">
                    <FileText className="h-6 w-6 text-slate-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">Incepe de la zero</h3>
                    <p className="text-sm text-muted-foreground">Scrie propriul continut sau lasa AI sa genereze pentru tine</p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground" />
                </CardContent>
              </Card>

              {/* AI Quick Generate */}
              <Card className="border-purple-200 bg-gradient-to-r from-purple-50 to-blue-50">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2.5 bg-purple-100 rounded-xl">
                      <Bot className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-purple-900">Super Agent AI</h3>
                      <p className="text-sm text-purple-700">Descrie ce vrei si AI genereaza totul</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Input
                      placeholder="ex: Email de multumire pentru donatorii care au contribuit luna asta..."
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                      className="bg-white"
                      onKeyDown={(e) => e.key === "Enter" && aiPrompt.trim() && handleAiGenerate("generate_email")}
                    />
                    <Button
                      onClick={() => handleAiGenerate(form.channel === "SMS" ? "generate_sms" : "generate_email")}
                      disabled={aiLoading || !aiPrompt.trim()}
                      className="bg-purple-600 hover:bg-purple-700 shrink-0"
                    >
                      {aiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
                      <span className="ml-2 hidden sm:inline">Genereaza</span>
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {["Multumire donatie", "Newsletter lunar", "Apel urgent", "Invitatie eveniment", "Raport impact"].map((q) => (
                      <button
                        key={q}
                        onClick={() => { setAiPrompt(q); handleAiGenerate("generate_email", { additionalInfo: q }); }}
                        className="px-3 py-1 text-xs bg-white border border-purple-200 rounded-full text-purple-700 hover:bg-purple-50 transition-colors"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Email Templates */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Mail className="h-5 w-5 text-blue-600" />
                  <h2 className="text-lg font-semibold">Template-uri Email</h2>
                  <Badge variant="outline" className="ml-auto">{emailTemplates.length} template-uri</Badge>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {emailTemplates.map((tpl) => (
                    <Card
                      key={tpl.id}
                      className={`cursor-pointer transition-all hover:shadow-md ${
                        selectedTemplate === tpl.id ? "ring-2 ring-primary border-primary" : ""
                      }`}
                      onClick={() => selectEmailTemplate(tpl)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <span className="text-2xl">{CATEGORY_ICONS[tpl.category] || "📧"}</span>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-sm truncate">{tpl.name}</h4>
                            <p className="text-xs text-muted-foreground mt-0.5">{tpl.preview}</p>
                          </div>
                        </div>
                        {selectedTemplate === tpl.id && (
                          <div className="mt-3 flex items-center gap-1 text-xs text-primary">
                            <CheckCircle2 className="h-3 w-3" />
                            Selectat
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* SMS Templates */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <MessageSquare className="h-5 w-5 text-green-600" />
                  <h2 className="text-lg font-semibold">Template-uri SMS</h2>
                  <Badge variant="outline" className="ml-auto">{smsTemplates.length} template-uri</Badge>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {smsTemplates.map((tpl) => (
                    <Card
                      key={tpl.id}
                      className={`cursor-pointer transition-all hover:shadow-md ${
                        selectedTemplate === tpl.id ? "ring-2 ring-primary border-primary" : ""
                      }`}
                      onClick={() => selectSmsTemplate(tpl)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <span className="text-2xl">{CATEGORY_ICONS[tpl.category] || "💬"}</span>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-sm truncate">{tpl.name}</h4>
                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{tpl.body}</p>
                          </div>
                        </div>
                        {selectedTemplate === tpl.id && (
                          <div className="mt-3 flex items-center gap-1 text-xs text-primary">
                            <CheckCircle2 className="h-3 w-3" />
                            Selectat
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ═══ Step 2: Campaign Details ═══ */}
          {currentStep === "type" && (
            <Card>
              <CardHeader>
                <CardTitle>Detalii campanie</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-2">
                  <Label htmlFor="name">Nume campanie *</Label>
                  <Input
                    id="name"
                    placeholder="ex., Newsletter lunar - Februarie 2026"
                    value={form.name}
                    onChange={(e) => updateForm({ name: e.target.value })}
                  />
                </div>

                <div className="grid gap-2">
                  <Label>Tip campanie *</Label>
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {CAMPAIGN_TYPES.map((type) => {
                      const Icon = type.icon;
                      return (
                        <div
                          key={type.value}
                          onClick={() => updateForm({ type: type.value })}
                          className={`p-3 rounded-xl border-2 cursor-pointer transition-all ${
                            form.type === type.value
                              ? "border-primary bg-primary/5 shadow-sm"
                              : "border-muted hover:border-muted-foreground/30"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <div className={`p-1.5 rounded-lg ${type.color}`}>
                              <Icon className="h-4 w-4" />
                            </div>
                            <span className="font-medium text-sm">{type.label}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label>Canal de comunicare *</Label>
                  <div className="grid gap-3 sm:grid-cols-3">
                    {[
                      { value: "EMAIL", label: "Email", icon: Mail, desc: `${emailCredits} credite disponibile`, color: "blue" },
                      { value: "SMS", label: "SMS", icon: MessageSquare, desc: `${smsCredits} credite disponibile`, color: "green" },
                      { value: "BOTH", label: "Email + SMS", icon: Send, desc: "Trimite pe ambele canale", color: "purple" },
                    ].map((ch) => (
                      <div
                        key={ch.value}
                        onClick={() => updateForm({ channel: ch.value })}
                        className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                          form.channel === ch.value
                            ? "border-primary bg-primary/5 shadow-sm"
                            : "border-muted hover:border-muted-foreground/30"
                        }`}
                      >
                        <ch.icon className="h-5 w-5 mb-2" />
                        <p className="font-medium text-sm">{ch.label}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{ch.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="goal">Obiectiv strangere fonduri (RON, optional)</Label>
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

          {/* ═══ Step 3: Content ═══ */}
          {currentStep === "content" && (
            <div className="space-y-4">
              {/* AI Quick Actions Bar */}
              <Card className="border-purple-200 bg-purple-50/50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Bot className="h-4 w-4 text-purple-600" />
                    <span className="text-sm font-medium text-purple-900">Super Agent AI</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(form.channel === "EMAIL" || form.channel === "BOTH") && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-purple-200 text-purple-700 hover:bg-purple-100"
                          onClick={() => handleAiGenerate("generate_email")}
                          disabled={aiLoading}
                        >
                          {aiLoading && aiAction === "generate_email" ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Wand2 className="h-3 w-3 mr-1" />}
                          Genereaza email
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-purple-200 text-purple-700 hover:bg-purple-100"
                          onClick={() => handleAiGenerate("generate_subject")}
                          disabled={aiLoading}
                        >
                          {aiLoading && aiAction === "generate_subject" ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Sparkles className="h-3 w-3 mr-1" />}
                          Sugereaza subiecte
                        </Button>
                      </>
                    )}
                    {(form.channel === "SMS" || form.channel === "BOTH") && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-purple-200 text-purple-700 hover:bg-purple-100"
                        onClick={() => handleAiGenerate("generate_sms")}
                        disabled={aiLoading}
                      >
                        {aiLoading && aiAction === "generate_sms" ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Wand2 className="h-3 w-3 mr-1" />}
                        Genereaza SMS
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-purple-200 text-purple-700 hover:bg-purple-100"
                      onClick={() => handleAiGenerate("improve_content")}
                      disabled={aiLoading || (!form.emailBody && !form.smsBody)}
                    >
                      {aiLoading && aiAction === "improve_content" ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Zap className="h-3 w-3 mr-1" />}
                      Imbunatateste continut
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-purple-200 text-purple-700 hover:bg-purple-100"
                      onClick={() => handleAiGenerate("generate_social")}
                      disabled={aiLoading}
                    >
                      {aiLoading && aiAction === "generate_social" ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Sparkles className="h-3 w-3 mr-1" />}
                      Postari social media
                    </Button>
                  </div>

                  {/* AI Custom prompt */}
                  <div className="flex gap-2 mt-3">
                    <Input
                      placeholder="Descrie ce vrei sa genereze AI..."
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                      className="bg-white text-sm"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && aiPrompt.trim()) {
                          handleAiGenerate(form.channel === "SMS" ? "generate_sms" : "generate_email");
                        }
                      }}
                    />
                  </div>

                  {/* AI Suggestions */}
                  {aiSuggestions.length > 0 && (
                    <div className="mt-3 p-3 bg-white rounded-lg border border-purple-200">
                      <p className="text-xs font-medium text-purple-800 mb-2">Sugestii AI:</p>
                      <div className="space-y-1.5">
                        {aiSuggestions.map((s, i) => (
                          <div
                            key={i}
                            className="flex items-center gap-2 text-sm text-purple-900 p-1.5 hover:bg-purple-50 rounded cursor-pointer"
                            onClick={() => {
                              if (s.startsWith("Facebook:") || s.startsWith("Instagram:") || s.startsWith("LinkedIn:")) {
                                navigator.clipboard.writeText(s.split(": ").slice(1).join(": "));
                              } else {
                                updateForm({ subject: s });
                              }
                            }}
                          >
                            <Copy className="h-3 w-3 flex-shrink-0" />
                            <span className="line-clamp-2">{s}</span>
                          </div>
                        ))}
                      </div>
                      <button
                        onClick={() => setAiSuggestions([])}
                        className="text-xs text-purple-500 mt-2 hover:underline"
                      >
                        Inchide
                      </button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Email Content */}
              {(form.channel === "EMAIL" || form.channel === "BOTH") && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <Mail className="h-5 w-5 text-blue-600" />
                        Continut email
                      </CardTitle>
                      <div className="flex items-center gap-1 border rounded-lg p-0.5">
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
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="grid gap-2">
                        <Label htmlFor="subject">Subiect *</Label>
                        <Input
                          id="subject"
                          placeholder="Subiectul emailului..."
                          value={form.subject}
                          onChange={(e) => updateForm({ subject: e.target.value })}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="preview">Text preview (inbox)</Label>
                        <Input
                          id="preview"
                          placeholder="Scurt text afisat in inbox..."
                          value={form.previewText}
                          onChange={(e) => updateForm({ previewText: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="grid gap-2">
                      <Label>Continut email (HTML)</Label>
                      <Tabs defaultValue="edit">
                        <TabsList className="w-full">
                          <TabsTrigger value="edit" className="flex-1">Editeaza HTML</TabsTrigger>
                          <TabsTrigger value="preview" className="flex-1">Previzualizare</TabsTrigger>
                        </TabsList>
                        <TabsContent value="edit">
                          <Textarea
                            placeholder="Scrieti HTML sau folositi butonul AI pentru a genera automat..."
                            value={form.emailBody}
                            onChange={(e) => updateForm({ emailBody: e.target.value })}
                            className="min-h-[350px] font-mono text-xs"
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            Merge tags: {"{{donor.name}}"}, {"{{donor.email}}"}, {"{{ngo.name}}"}, {"{{unsubscribe_url}}"}
                          </p>
                        </TabsContent>
                        <TabsContent value="preview">
                          <div
                            className={`border rounded-xl bg-white mx-auto overflow-auto ${
                              previewMode === "mobile" ? "max-w-[375px]" : "max-w-full"
                            }`}
                            style={{ minHeight: 350 }}
                          >
                            {form.emailBody ? (
                              <div
                                dangerouslySetInnerHTML={{ __html: form.emailBody }}
                                className="prose prose-sm max-w-none"
                              />
                            ) : (
                              <p className="text-muted-foreground text-center py-16">
                                Scrieti sau generati continut pentru a vedea previzualizarea.
                              </p>
                            )}
                          </div>
                        </TabsContent>
                      </Tabs>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* SMS Content */}
              {(form.channel === "SMS" || form.channel === "BOTH") && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MessageSquare className="h-5 w-5 text-green-600" />
                      Continut SMS
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-2">
                      <Label>Mesaj SMS *</Label>
                      <Textarea
                        placeholder="Scrieti mesajul SMS sau folositi AI..."
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
                          <span className="text-amber-600 font-medium">
                            {smsSegments} segmente = {smsSegments} credite SMS / destinatar
                          </span>
                        )}
                      </div>
                    </div>

                    {/* SMS Preview */}
                    {form.smsBody && (
                      <div className="max-w-xs mx-auto">
                        <div className="bg-slate-100 rounded-2xl p-4">
                          <div className="bg-green-500 text-white rounded-2xl rounded-bl-sm p-3 text-sm">
                            {form.smsBody}
                          </div>
                          <p className="text-[10px] text-slate-400 mt-1 text-right">Acum</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* ═══ Step 4: Audience ═══ */}
          {currentStep === "audience" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-indigo-600" />
                  Selecteaza audienta
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2">
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
                    <Label>Donatie minima (RON, optional)</Label>
                    <Input
                      type="number"
                      placeholder="ex., 100"
                      value={form.segmentMinDonation}
                      onChange={(e) => updateForm({ segmentMinDonation: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label>Filtreaza dupa etichete (optional)</Label>
                  <Input
                    placeholder="Etichete separate prin virgula..."
                    value={form.segmentTags.join(", ")}
                    onChange={(e) =>
                      updateForm({
                        segmentTags: e.target.value.split(",").map((t) => t.trim()).filter(Boolean),
                      })
                    }
                  />
                </div>

                <div className="flex items-center gap-4 p-4 bg-indigo-50 rounded-xl">
                  <Button
                    variant="outline"
                    onClick={estimateAudience}
                    disabled={audienceLoading}
                    className="border-indigo-300"
                  >
                    {audienceLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Users className="mr-2 h-4 w-4" />}
                    Estimeaza audienta
                  </Button>
                  {audienceCount !== null && (
                    <div className="flex items-center gap-3">
                      <span className="text-3xl font-bold text-indigo-700">{audienceCount}</span>
                      <span className="text-sm text-indigo-600">destinatari</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* ═══ Step 5: Schedule & Credits ═══ */}
          {currentStep === "schedule" && (
            <div className="space-y-4">
              {/* Credit Check */}
              <Card className="border-amber-200 bg-amber-50/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-amber-900">
                    <CreditCard className="h-5 w-5" />
                    Verificare credite
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {(form.channel === "EMAIL" || form.channel === "BOTH") && (
                      <div className="p-4 bg-white rounded-xl border">
                        <div className="flex items-center gap-2 mb-2">
                          <Mail className="h-4 w-4 text-blue-600" />
                          <span className="font-medium text-sm">Credite Email</span>
                        </div>
                        <div className="flex items-baseline gap-2">
                          <span className="text-2xl font-bold">{emailCredits}</span>
                          <span className="text-sm text-muted-foreground">disponibile</span>
                        </div>
                        {audienceCount !== null && (
                          <div className={`mt-2 text-sm ${emailCredits >= estimatedEmailCost ? "text-green-600" : "text-red-600"}`}>
                            {emailCredits >= estimatedEmailCost ? (
                              <span className="flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5" /> Suficiente pentru {estimatedEmailCost} emailuri</span>
                            ) : (
                              <span className="flex items-center gap-1"><AlertTriangle className="h-3.5 w-3.5" /> Necesare: {estimatedEmailCost}, lipsesc {estimatedEmailCost - emailCredits}</span>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                    {(form.channel === "SMS" || form.channel === "BOTH") && (
                      <div className="p-4 bg-white rounded-xl border">
                        <div className="flex items-center gap-2 mb-2">
                          <MessageSquare className="h-4 w-4 text-green-600" />
                          <span className="font-medium text-sm">Credite SMS</span>
                        </div>
                        <div className="flex items-baseline gap-2">
                          <span className="text-2xl font-bold">{smsCredits}</span>
                          <span className="text-sm text-muted-foreground">disponibile</span>
                        </div>
                        {audienceCount !== null && (
                          <div className={`mt-2 text-sm ${smsCredits >= estimatedSmsCost ? "text-green-600" : "text-red-600"}`}>
                            {smsCredits >= estimatedSmsCost ? (
                              <span className="flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5" /> Suficiente pentru {estimatedSmsCost} SMS-uri</span>
                            ) : (
                              <span className="flex items-center gap-1"><AlertTriangle className="h-3.5 w-3.5" /> Necesare: {estimatedSmsCost}, lipsesc {estimatedSmsCost - smsCredits}</span>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  {audienceCount === null && (
                    <p className="text-sm text-amber-700 mt-3">
                      Estimeaza audienta la pasul anterior pentru a verifica daca ai suficiente credite.
                    </p>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3"
                    onClick={() => router.push("/dashboard/campaigns?tab=credits")}
                  >
                    <CreditCard className="h-3.5 w-3.5 mr-1" />
                    Cumpara credite
                  </Button>
                </CardContent>
              </Card>

              {/* Schedule */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-indigo-600" />
                    Programare
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div
                      onClick={() => updateForm({ scheduleType: "now" })}
                      className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        form.scheduleType === "now"
                          ? "border-primary bg-primary/5 shadow-sm"
                          : "border-muted hover:border-muted-foreground/30"
                      }`}
                    >
                      <div className="flex items-center gap-2 font-medium">
                        <Send className="h-4 w-4" />
                        Trimite acum
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        Campania se trimite imediat dupa creare.
                      </p>
                    </div>
                    <div
                      onClick={() => updateForm({ scheduleType: "later" })}
                      className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        form.scheduleType === "later"
                          ? "border-primary bg-primary/5 shadow-sm"
                          : "border-muted hover:border-muted-foreground/30"
                      }`}
                    >
                      <div className="flex items-center gap-2 font-medium">
                        <Calendar className="h-4 w-4" />
                        Programeaza
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        Alege data si ora trimiterii.
                      </p>
                    </div>
                  </div>
                  {form.scheduleType === "later" && (
                    <div className="grid gap-2">
                      <Label>Data si ora</Label>
                      <Input
                        type="datetime-local"
                        value={form.scheduledAt}
                        onChange={(e) => updateForm({ scheduledAt: e.target.value })}
                        min={new Date().toISOString().slice(0, 16)}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* ═══ Step 6: Review ═══ */}
          {currentStep === "review" && (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Revizuire campanie</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="p-3 bg-slate-50 rounded-lg">
                      <p className="text-xs text-muted-foreground mb-1">Campanie</p>
                      <p className="font-semibold text-sm">{form.name}</p>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-lg">
                      <p className="text-xs text-muted-foreground mb-1">Tip</p>
                      <p className="font-semibold text-sm">{CAMPAIGN_TYPES.find(t => t.value === form.type)?.label || form.type}</p>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-lg">
                      <p className="text-xs text-muted-foreground mb-1">Canal</p>
                      <Badge variant="outline">{form.channel}</Badge>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="p-3 bg-slate-50 rounded-lg">
                      <p className="text-xs text-muted-foreground mb-1">Programare</p>
                      <p className="font-semibold text-sm">
                        {form.scheduleType === "now" ? "Trimite imediat" : form.scheduledAt}
                      </p>
                    </div>
                    {form.goalAmount && (
                      <div className="p-3 bg-slate-50 rounded-lg">
                        <p className="text-xs text-muted-foreground mb-1">Obiectiv</p>
                        <p className="font-semibold text-sm">{form.goalAmount} RON</p>
                      </div>
                    )}
                    {audienceCount !== null && (
                      <div className="p-3 bg-slate-50 rounded-lg">
                        <p className="text-xs text-muted-foreground mb-1">Destinatari</p>
                        <p className="font-semibold text-sm">{audienceCount}</p>
                      </div>
                    )}
                  </div>

                  {form.subject && (
                    <div className="pt-4 border-t">
                      <p className="text-xs text-muted-foreground mb-1">Subiect email</p>
                      <p className="font-medium">{form.subject}</p>
                    </div>
                  )}

                  {form.emailBody && (
                    <div className="pt-4 border-t">
                      <p className="text-xs text-muted-foreground mb-2">Previzualizare email</p>
                      <div className="border rounded-xl bg-white max-h-[300px] overflow-y-auto">
                        <div dangerouslySetInnerHTML={{ __html: form.emailBody }} />
                      </div>
                    </div>
                  )}

                  {form.smsBody && (
                    <div className="pt-4 border-t">
                      <p className="text-xs text-muted-foreground mb-2">Previzualizare SMS</p>
                      <div className="max-w-xs">
                        <div className="bg-green-500 text-white rounded-2xl rounded-bl-sm p-3 text-sm">
                          {form.smsBody}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
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
            <Button variant="outline" onClick={goBack} disabled={currentStepIndex === 0}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Inapoi
            </Button>
            <div className="flex gap-2">
              {currentStep === "review" ? (
                <Button onClick={handleSubmit} disabled={saving} size="lg">
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
      </div>
    </div>
  );
}

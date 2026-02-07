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
  { id: "type", label: "Type", icon: Mail },
  { id: "content", label: "Content", icon: MessageSquare },
  { id: "audience", label: "Audience", icon: Users },
  { id: "schedule", label: "Schedule", icon: Calendar },
  { id: "review", label: "Review", icon: CheckCircle2 },
] as const;

type StepId = typeof STEPS[number]["id"];

const CAMPAIGN_TYPES = [
  { value: "THANK_YOU", label: "Thank You", description: "Send gratitude to your donors after a donation" },
  { value: "UPDATE", label: "Update", description: "Share news and progress on your projects" },
  { value: "EMERGENCY_APPEAL", label: "Emergency Appeal", description: "Urgent fundraising for critical needs" },
  { value: "NEWSLETTER", label: "Newsletter", description: "Regular updates and engagement" },
  { value: "REACTIVATION", label: "Reactivation", description: "Re-engage dormant donors" },
  { value: "CORPORATE_OUTREACH", label: "Corporate Outreach", description: "Reach out to corporate partners" },
  { value: "CUSTOM", label: "Custom", description: "Create a fully customized campaign" },
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
          <h1 className="text-3xl font-bold tracking-tight">New Campaign</h1>
          <p className="text-muted-foreground">Create and send a new email or SMS campaign.</p>
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
                <CardTitle>Campaign Details</CardTitle>
                <CardDescription>Choose the type and channel for your campaign.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-2">
                  <Label htmlFor="name">Campaign Name *</Label>
                  <Input
                    id="name"
                    placeholder="e.g., Monthly Newsletter - January"
                    value={form.name}
                    onChange={(e) => updateForm({ name: e.target.value })}
                  />
                </div>

                <div className="grid gap-2">
                  <Label>Campaign Type *</Label>
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
                  <Label>Channel *</Label>
                  <div className="flex gap-3">
                    {[
                      { value: "EMAIL", label: "Email", icon: Mail },
                      { value: "SMS", label: "SMS", icon: MessageSquare },
                      { value: "BOTH", label: "Both", icon: Send },
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
                  <Label htmlFor="goal">Fundraising Goal (optional)</Label>
                  <Input
                    id="goal"
                    type="number"
                    placeholder="e.g., 5000"
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
                        <CardTitle>Email Content</CardTitle>
                        <CardDescription>Compose your email message.</CardDescription>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setAiSidebarOpen(!aiSidebarOpen)}
                      >
                        <Sparkles className="mr-2 h-4 w-4" />
                        AI Assistant
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-2">
                      <Label htmlFor="subject">Subject Line *</Label>
                      <Input
                        id="subject"
                        placeholder="Your email subject..."
                        value={form.subject}
                        onChange={(e) => updateForm({ subject: e.target.value })}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="preview">Preview Text</Label>
                      <Input
                        id="preview"
                        placeholder="Text shown in inbox preview..."
                        value={form.previewText}
                        onChange={(e) => updateForm({ previewText: e.target.value })}
                      />
                    </div>
                    <div className="grid gap-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="emailBody">Email Body (HTML) *</Label>
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
                          <TabsTrigger value="edit" className="flex-1">Edit</TabsTrigger>
                          <TabsTrigger value="preview" className="flex-1">Preview</TabsTrigger>
                        </TabsList>
                        <TabsContent value="edit">
                          <Textarea
                            id="emailBody"
                            placeholder="<h1>Hello {{donor.name}}</h1><p>Your email content here...</p>"
                            value={form.emailBody}
                            onChange={(e) => updateForm({ emailBody: e.target.value })}
                            className="min-h-[300px] font-mono text-sm"
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            Use {"{{donor.name}}"}, {"{{donor.email}}"}, {"{{ngo.name}}"} as merge tags.
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
                                Start writing to see a preview.
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
                    <CardTitle>SMS Content</CardTitle>
                    <CardDescription>Compose your SMS message.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-2">
                      <Label htmlFor="smsBody">SMS Message *</Label>
                      <Textarea
                        id="smsBody"
                        placeholder="Your SMS message here..."
                        value={form.smsBody}
                        onChange={(e) => updateForm({ smsBody: e.target.value })}
                        className="min-h-[120px]"
                        maxLength={480}
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>
                          {smsCharCount} / 480 characters ({smsSegments} segment{smsSegments !== 1 ? "s" : ""})
                        </span>
                        {smsCharCount > 160 && (
                          <span className="text-yellow-600">
                            Multiple segments will increase cost
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
                <CardTitle>Select Audience</CardTitle>
                <CardDescription>Define who will receive this campaign.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-2">
                  <Label>Donor Status</Label>
                  <Select
                    value={form.segmentStatus}
                    onValueChange={(v) => updateForm({ segmentStatus: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ACTIVE">Active donors only</SelectItem>
                      <SelectItem value="INACTIVE">Inactive donors only</SelectItem>
                      <SelectItem value="ALL">All donors</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label>Minimum Total Donation (optional)</Label>
                  <Input
                    type="number"
                    placeholder="e.g., 100"
                    value={form.segmentMinDonation}
                    onChange={(e) => updateForm({ segmentMinDonation: e.target.value })}
                  />
                </div>

                <div className="grid gap-2">
                  <Label>Filter by Tags (optional)</Label>
                  <Input
                    placeholder="Enter tag names separated by commas"
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
                    Leave empty to include all donors matching other criteria.
                  </p>
                </div>

                <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
                  <Button variant="outline" onClick={estimateAudience} disabled={audienceLoading}>
                    {audienceLoading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Users className="mr-2 h-4 w-4" />
                    )}
                    Estimate Audience
                  </Button>
                  {audienceCount !== null && (
                    <div>
                      <span className="text-2xl font-bold">{audienceCount}</span>
                      <span className="text-sm text-muted-foreground ml-2">
                        {form.channel === "EMAIL"
                          ? "recipients with email consent"
                          : form.channel === "SMS"
                          ? "recipients with SMS consent"
                          : "recipients"}
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
                <CardTitle>Schedule Campaign</CardTitle>
                <CardDescription>Choose when to send your campaign.</CardDescription>
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
                      Send Now
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Campaign will be sent immediately after creation.
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
                      Schedule for Later
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Pick a date and time to send the campaign.
                    </p>
                  </div>
                </div>

                {form.scheduleType === "later" && (
                  <div className="grid gap-2">
                    <Label htmlFor="scheduledAt">Send Date & Time</Label>
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
                  <CardTitle>Review Campaign</CardTitle>
                  <CardDescription>Review your campaign before sending.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <Label className="text-xs text-muted-foreground">Campaign Name</Label>
                      <p className="font-medium">{form.name}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Type</Label>
                      <p className="font-medium">{form.type.replace(/_/g, " ")}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Channel</Label>
                      <Badge variant="outline">{form.channel}</Badge>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Schedule</Label>
                      <p className="font-medium">
                        {form.scheduleType === "now"
                          ? "Send immediately"
                          : `Scheduled: ${form.scheduledAt}`}
                      </p>
                    </div>
                    {form.goalAmount && (
                      <div>
                        <Label className="text-xs text-muted-foreground">Fundraising Goal</Label>
                        <p className="font-medium">{form.goalAmount} RON</p>
                      </div>
                    )}
                    {audienceCount !== null && (
                      <div>
                        <Label className="text-xs text-muted-foreground">Estimated Recipients</Label>
                        <p className="font-medium">{audienceCount}</p>
                      </div>
                    )}
                  </div>

                  {form.subject && (
                    <div className="pt-4 border-t">
                      <Label className="text-xs text-muted-foreground">Subject</Label>
                      <p className="font-medium">{form.subject}</p>
                    </div>
                  )}

                  {form.emailBody && (
                    <div className="pt-4 border-t">
                      <Label className="text-xs text-muted-foreground mb-2 block">Email Preview</Label>
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
                      <Label className="text-xs text-muted-foreground mb-2 block">SMS Preview</Label>
                      <div className="bg-muted p-3 rounded-lg max-w-sm">
                        <p className="text-sm">{form.smsBody}</p>
                        <p className="text-xs text-muted-foreground mt-2">
                          {form.smsBody.length} chars / {Math.ceil(form.smsBody.length / 160)} segment(s)
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
              Back
            </Button>
            <div className="flex gap-2">
              {currentStep === "review" ? (
                <Button onClick={handleSubmit} disabled={saving}>
                  {saving ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="mr-2 h-4 w-4" />
                  )}
                  {form.scheduleType === "now" ? "Send Campaign" : "Schedule Campaign"}
                </Button>
              ) : (
                <Button onClick={goNext} disabled={!canProceed()}>
                  Next
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
                  AI Assistant
                </CardTitle>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setAiSidebarOpen(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Describe what you want and AI will generate the campaign content for you.
                </p>
                <Textarea
                  placeholder="e.g., Write a heartfelt thank-you email for donors who contributed to our flood relief campaign..."
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
                  Generate Content
                </Button>
                <div className="text-xs text-muted-foreground space-y-1">
                  <p className="font-medium">Tips:</p>
                  <ul className="list-disc list-inside space-y-0.5">
                    <li>Mention the campaign purpose</li>
                    <li>Specify the tone (formal, friendly)</li>
                    <li>Include a call-to-action goal</li>
                    <li>Mention your NGO name and mission</li>
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

"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Save,
  Loader2,
  Zap,
  Mail,
  MessageSquare,
  Clock,
  Tag,
  Bell,
  GitBranch,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

const TRIGGER_OPTIONS = [
  {
    value: "NEW_DONATION",
    label: "Donatie noua",
    description: "Se activeaza cand un donator face o donatie noua.",
  },
  {
    value: "DONOR_CREATED",
    label: "Donator nou creat",
    description: "Se activeaza cand un donator nou este adaugat in sistem.",
  },
  {
    value: "CAMPAIGN_GOAL_REACHED",
    label: "Obiectiv campanie atins",
    description: "Se activeaza cand obiectivul de strangere de fonduri este atins.",
  },
  {
    value: "NO_DONATION_PERIOD",
    label: "Donator inactiv",
    description: "Se activeaza cand un donator nu a donat intr-o perioada specificata.",
  },
  {
    value: "NEW_SUBSCRIBER",
    label: "Abonat nou",
    description: "Se activeaza cand un abonat nou se inscrie prin mini-site.",
  },
  {
    value: "TAG_ADDED",
    label: "Eticheta adaugata",
    description: "Se activeaza cand o eticheta este adaugata unui donator.",
  },
  {
    value: "CAMPAIGN_ENDED",
    label: "Campanie incheiata",
    description: "Se activeaza cand o campanie se incheie.",
  },
  {
    value: "MANUAL",
    label: "Declansator manual",
    description: "Declansat manual.",
  },
];

const ACTION_TYPES = [
  { value: "SEND_EMAIL", label: "Trimite email", icon: "Mail" },
  { value: "SEND_SMS", label: "Trimite SMS", icon: "MessageSquare" },
  { value: "WAIT", label: "Asteapta / Intarziere", icon: "Clock" },
  { value: "ADD_TAG", label: "Adauga eticheta", icon: "Tag" },
  { value: "REMOVE_TAG", label: "Sterge eticheta", icon: "Tag" },
  { value: "SEND_NOTIFICATION", label: "Trimite notificare", icon: "Bell" },
];

const ACTION_ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Mail,
  MessageSquare,
  Clock,
  Tag,
  Bell,
};

const DELAY_UNITS = [
  { value: "minutes", label: "Minute" },
  { value: "hours", label: "Ore" },
  { value: "days", label: "Zile" },
  { value: "weeks", label: "Saptamani" },
];

interface AutomationStep {
  id: string;
  actionType: string;
  config: {
    subject?: string;
    body?: string;
    templateId?: string;
    tagName?: string;
    delayAmount?: number;
    delayUnit?: string;
    notificationMessage?: string;
  };
  delayMinutes: number;
}

let stepIdCounter = 0;
const generateStepId = () => `step-${++stepIdCounter}-${Date.now()}`;

export default function NewAutomationPage() {
  const router = useRouter();
  const editId: string | null = null;

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [trigger, setTrigger] = useState("");
  const [triggerConfig, setTriggerConfig] = useState<Record<string, any>>({});
  const [steps, setSteps] = useState<AutomationStep[]>([]);
  const [expandedStep, setExpandedStep] = useState<string | null>(null);

  useEffect(() => {
    if (!editId) return;
    const loadAutomation = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/automations/${editId}`);
        if (!res.ok) throw new Error("Nu s-a putut incarca automatizarea");
        const data = await res.json();
        setName(data.name || "");
        setDescription(data.description || "");
        setTrigger(data.trigger || "");
        setTriggerConfig(data.triggerConfig || {});
        if (data.steps && Array.isArray(data.steps)) {
          setSteps(
            data.steps.map((s: any) => ({
              id: generateStepId(),
              actionType: s.actionType,
              config: s.config || {},
              delayMinutes: s.delayMinutes || 0,
            }))
          );
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    loadAutomation();
  }, [editId]);

  const addStep = () => {
    const newStep: AutomationStep = {
      id: generateStepId(),
      actionType: "SEND_EMAIL",
      config: {},
      delayMinutes: 0,
    };
    setSteps((prev) => [...prev, newStep]);
    setExpandedStep(newStep.id);
  };

  const removeStep = (stepId: string) => {
    setSteps((prev) => prev.filter((s) => s.id !== stepId));
    if (expandedStep === stepId) setExpandedStep(null);
  };

  const updateStep = (stepId: string, updates: Partial<AutomationStep>) => {
    setSteps((prev) =>
      prev.map((s) => (s.id === stepId ? { ...s, ...updates } : s))
    );
  };

  const updateStepConfig = (stepId: string, configUpdates: Record<string, any>) => {
    setSteps((prev) =>
      prev.map((s) =>
        s.id === stepId
          ? { ...s, config: { ...s.config, ...configUpdates } }
          : s
      )
    );
  };

  const moveStep = (stepId: string, direction: "up" | "down") => {
    const idx = steps.findIndex((s) => s.id === stepId);
    if (direction === "up" && idx > 0) {
      const newSteps = [...steps];
      [newSteps[idx - 1], newSteps[idx]] = [newSteps[idx], newSteps[idx - 1]];
      setSteps(newSteps);
    } else if (direction === "down" && idx < steps.length - 1) {
      const newSteps = [...steps];
      [newSteps[idx], newSteps[idx + 1]] = [newSteps[idx + 1], newSteps[idx]];
      setSteps(newSteps);
    }
  };

  const computeDelayMinutes = (amount: number, unit: string): number => {
    switch (unit) {
      case "minutes": return amount;
      case "hours": return amount * 60;
      case "days": return amount * 60 * 24;
      case "weeks": return amount * 60 * 24 * 7;
      default: return amount;
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      setError("Va rugam furnizati un nume pentru automatizare.");
      return;
    }
    if (!trigger) {
      setError("Va rugam selectati un declansator.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const payload = {
        name,
        description,
        trigger,
        triggerConfig,
        steps: steps.map((s, i) => ({
          order: i,
          actionType: s.actionType,
          config: s.config,
          delayMinutes: s.delayMinutes,
        })),
      };

      const url = editId ? `/api/automations/${editId}` : "/api/automations";
      const method = editId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Nu s-a putut salva automatizarea");
      }
      router.push("/dashboard/automations");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push("/dashboard/automations")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {editId ? "Editeaza automatizarea" : "Creeaza automatizare"}
          </h1>
          <p className="text-muted-foreground">
            Construieste un flux automatizat cu declansatoare si pasi secventiali.
          </p>
        </div>
      </div>

      {error && (
        <Card className="border-destructive">
          <CardContent className="py-4">
            <p className="text-sm text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Automation Details */}
      <Card>
        <CardHeader>
          <CardTitle>Detalii automatizare</CardTitle>
          <CardDescription>Da automatizarii tale un nume si o descriere.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Nume</Label>
            <Input
              id="name"
              placeholder="ex., Bun venit donatori noi"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description">Descriere (optional)</Label>
            <Textarea
              id="description"
              placeholder="Descrie ce face aceasta automatizare..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Trigger */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-amber-500" />
            Declansator
          </CardTitle>
          <CardDescription>Alege ce porneste aceasta automatizare.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {TRIGGER_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setTrigger(opt.value)}
                className={`rounded-lg border p-3 text-left transition-colors hover:bg-muted/50 ${
                  trigger === opt.value
                    ? "border-primary bg-primary/5 ring-1 ring-primary"
                    : "border-border"
                }`}
              >
                <p className="text-sm font-medium">{opt.label}</p>
                <p className="text-xs text-muted-foreground mt-1">{opt.description}</p>
              </button>
            ))}
          </div>

          {trigger === "NO_DONATION_PERIOD" && (
            <div className="grid gap-2 max-w-xs">
              <Label>Perioada de inactivitate (zile)</Label>
              <Input
                type="number"
                placeholder="90"
                value={triggerConfig.inactiveDays || ""}
                onChange={(e) =>
                  setTriggerConfig({ ...triggerConfig, inactiveDays: Number(e.target.value) })
                }
              />
            </div>
          )}

          {trigger === "TAG_ADDED" && (
            <div className="grid gap-2 max-w-xs">
              <Label>Numele etichetei</Label>
              <Input
                placeholder="ex., donator-vip"
                value={triggerConfig.tagName || ""}
                onChange={(e) =>
                  setTriggerConfig({ ...triggerConfig, tagName: e.target.value })
                }
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Steps */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <GitBranch className="h-5 w-5 text-indigo-500" />
                Pasi ({steps.length})
              </CardTitle>
              <CardDescription>Defineste secventa de actiuni pentru aceasta automatizare.</CardDescription>
            </div>
            <Button onClick={addStep}>
              <Plus className="mr-2 h-4 w-4" />
              Adauga pas
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {steps.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed rounded-lg">
              <GitBranch className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                Niciun pas inca. Adauga primul pas pentru a construi fluxul.
              </p>
              <Button variant="outline" className="mt-3" onClick={addStep}>
                <Plus className="mr-2 h-4 w-4" />
                Adauga primul pas
              </Button>
            </div>
          ) : (
            steps.map((step, index) => {
              const isExpanded = expandedStep === step.id;
              const actionInfo = ACTION_TYPES.find((a) => a.value === step.actionType);
              const ActionIcon = ACTION_ICON_MAP[actionInfo?.icon || "Zap"] || Zap;

              return (
                <div key={step.id}>
                  {index > 0 && (
                    <div className="flex justify-center py-1">
                      <div className="w-px h-6 bg-border" />
                    </div>
                  )}
                  <div
                    className={`rounded-lg border transition-colors ${
                      isExpanded ? "border-primary ring-1 ring-primary/20" : "border-border"
                    }`}
                  >
                    {/* Step Header */}
                    <div
                      className="flex items-center gap-3 p-3 cursor-pointer hover:bg-muted/30"
                      onClick={() => setExpandedStep(isExpanded ? null : step.id)}
                    >
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={(e) => {
                            e.stopPropagation();
                            moveStep(step.id, "up");
                          }}
                          disabled={index === 0}
                        >
                          <ChevronUp className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={(e) => {
                            e.stopPropagation();
                            moveStep(step.id, "down");
                          }}
                          disabled={index === steps.length - 1}
                        >
                          <ChevronDown className="h-3 w-3" />
                        </Button>
                      </div>
                      <Badge variant="secondary" className="shrink-0">
                        {index + 1}
                      </Badge>
                      <ActionIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="text-sm font-medium flex-1 truncate">
                        {actionInfo?.label || step.actionType}
                      </span>
                      {step.delayMinutes > 0 && (
                        <Badge variant="outline" className="text-xs shrink-0">
                          <Clock className="mr-1 h-3 w-3" />
                          {step.delayMinutes >= 1440
                            ? `${Math.round(step.delayMinutes / 1440)}d`
                            : step.delayMinutes >= 60
                            ? `${Math.round(step.delayMinutes / 60)}h`
                            : `${step.delayMinutes}m`}{" "}
                          intarziere
                        </Badge>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:text-destructive shrink-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeStep(step.id);
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>

                    {/* Step Config (expanded) */}
                    {isExpanded && (
                      <div className="border-t p-4 space-y-4 bg-muted/10">
                        <div className="grid gap-2">
                          <Label>Selecteaza tipul actiunii</Label>
                          <Select
                            value={step.actionType}
                            onValueChange={(v) => updateStep(step.id, { actionType: v, config: {} })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {ACTION_TYPES.map((a) => (
                                <SelectItem key={a.value} value={a.value}>
                                  {a.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="grid gap-2">
                          <Label>Intarziere inainte de acest pas</Label>
                          <div className="flex gap-2">
                            <Input
                              type="number"
                              placeholder="0"
                              className="w-24"
                              value={step.config.delayAmount || ""}
                              onChange={(e) => {
                                const amount = Number(e.target.value);
                                const unit = step.config.delayUnit || "minutes";
                                updateStepConfig(step.id, { delayAmount: amount });
                                updateStep(step.id, {
                                  delayMinutes: computeDelayMinutes(amount, unit),
                                });
                              }}
                            />
                            <Select
                              value={step.config.delayUnit || "minutes"}
                              onValueChange={(v) => {
                                const amount = step.config.delayAmount || 0;
                                updateStepConfig(step.id, { delayUnit: v });
                                updateStep(step.id, {
                                  delayMinutes: computeDelayMinutes(amount, v),
                                });
                              }}
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {DELAY_UNITS.map((u) => (
                                  <SelectItem key={u.value} value={u.value}>
                                    {u.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        {step.actionType === "SEND_EMAIL" && (
                          <div className="space-y-3">
                            <div className="grid gap-2">
                              <Label>Subiect email</Label>
                              <Input
                                placeholder="Linia subiectului..."
                                value={step.config.subject || ""}
                                onChange={(e) =>
                                  updateStepConfig(step.id, { subject: e.target.value })
                                }
                              />
                            </div>
                            <div className="grid gap-2">
                              <Label>Corp email (HTML)</Label>
                              <Textarea
                                placeholder={"<p>Buna {{donor_name}},</p>"}
                                className="min-h-[150px] font-mono text-sm"
                                value={step.config.body || ""}
                                onChange={(e) =>
                                  updateStepConfig(step.id, { body: e.target.value })
                                }
                              />
                            </div>
                          </div>
                        )}

                        {step.actionType === "SEND_SMS" && (
                          <div className="space-y-3">
                            <div className="grid gap-2">
                              <div className="flex items-center justify-between">
                                <Label>Mesaj SMS</Label>
                                <span className="text-xs text-muted-foreground">
                                  {(step.config.body || "").length}/160
                                </span>
                              </div>
                              <Textarea
                                placeholder={"Buna {{donor_name}}, ..."}
                                className="min-h-[100px]"
                                value={step.config.body || ""}
                                onChange={(e) =>
                                  updateStepConfig(step.id, { body: e.target.value })
                                }
                              />
                            </div>
                          </div>
                        )}

                        {(step.actionType === "ADD_TAG" || step.actionType === "REMOVE_TAG") && (
                          <div className="grid gap-2">
                            <Label>Numele etichetei</Label>
                            <Input
                              placeholder="ex., implicat, vip"
                              value={step.config.tagName || ""}
                              onChange={(e) =>
                                updateStepConfig(step.id, { tagName: e.target.value })
                              }
                            />
                          </div>
                        )}

                        {step.actionType === "SEND_NOTIFICATION" && (
                          <div className="grid gap-2">
                            <Label>Mesaj notificare</Label>
                            <Textarea
                              placeholder="Alerta: Un donator tocmai..."
                              value={step.config.notificationMessage || ""}
                              onChange={(e) =>
                                updateStepConfig(step.id, {
                                  notificationMessage: e.target.value,
                                })
                              }
                            />
                          </div>
                        )}

                        {step.actionType === "WAIT" && (
                          <p className="text-sm text-muted-foreground">
                            Acest pas va pune in pauza automatizarea pentru intarzierea configurata mai sus
                            inainte de a trece la pasul urmator.
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
        <CardFooter className="border-t pt-6 flex justify-between">
          <Button variant="outline" onClick={() => router.push("/dashboard/automations")}>
            Anuleaza
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            {editId ? "Actualizeaza automatizarea" : "Salveaza automatizarea"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

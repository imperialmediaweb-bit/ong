"use client";

import { useState, useEffect, useCallback } from "react";
import { PageHelp } from "@/components/ui/page-help";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatDate, formatDateTime } from "@/lib/utils";
import { PlanGate } from "@/components/dashboard/plan-gate";
import { Zap as AutoIcon, Mail as MailIcon, Clock as ClockIcon } from "lucide-react";
import {
  Plus,
  Zap,
  Search,
  Loader2,
  Play,
  Pause,
  MoreHorizontal,
  Clock,
  Mail,
  MessageSquare,
  Tag,
  Bell,
  Sparkles,
  GitBranch,
  CheckCircle2,
  AlertTriangle,
  Activity,
} from "lucide-react";

interface Automation {
  id: string;
  name: string;
  description: string | null;
  trigger: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count: {
    steps: number;
    executions: number;
  };
}

const TRIGGER_OPTIONS = [
  { value: "NEW_DONATION", label: "Donatie noua", icon: "heart", description: "Se activeaza cand un donator face o donatie noua" },
  { value: "CAMPAIGN_GOAL_REACHED", label: "Obiectiv campanie atins", icon: "target", description: "Se activeaza cand obiectivul de strangere de fonduri este atins" },
  { value: "NO_DONATION_PERIOD", label: "Perioada fara donatii", icon: "clock", description: "Se activeaza cand un donator nu a donat intr-o perioada specificata" },
  { value: "NEW_SUBSCRIBER", label: "Abonat nou", icon: "user-plus", description: "Se activeaza cand un abonat nou se inscrie" },
  { value: "CAMPAIGN_ENDED", label: "Campanie incheiata", icon: "flag", description: "Se activeaza cand o campanie se incheie" },
  { value: "LOW_PERFORMANCE", label: "Performanta scazuta", icon: "trending-down", description: "Se activeaza cand o campanie are performanta scazuta" },
  { value: "MANUAL", label: "Manual", icon: "hand", description: "Declansat manual" },
];

const triggerBadgeColor = (trigger: string) => {
  switch (trigger) {
    case "NEW_DONATION":
      return "bg-green-100 text-green-800";
    case "CAMPAIGN_GOAL_REACHED":
      return "bg-blue-100 text-blue-800";
    case "NO_DONATION_PERIOD":
      return "bg-yellow-100 text-yellow-800";
    case "NEW_SUBSCRIBER":
      return "bg-purple-100 text-purple-800";
    case "CAMPAIGN_ENDED":
      return "bg-gray-100 text-gray-800";
    case "LOW_PERFORMANCE":
      return "bg-red-100 text-red-800";
    case "MANUAL":
      return "bg-indigo-100 text-indigo-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

export default function AutomationsPage() {
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);

  const [newAutomation, setNewAutomation] = useState({
    name: "",
    description: "",
    trigger: "",
  });

  const fetchAutomations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      const res = await fetch(`/api/automations?${params.toString()}`);
      if (!res.ok) throw new Error("Nu s-au putut incarca automatizarile");
      const data = await res.json();
      setAutomations(data.automations || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const timeout = setTimeout(fetchAutomations, 300);
    return () => clearTimeout(timeout);
  }, [fetchAutomations]);

  const handleToggleActive = async (id: string, currentState: boolean) => {
    try {
      const res = await fetch(`/api/automations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !currentState }),
      });
      if (!res.ok) throw new Error("Nu s-a putut comuta automatizarea");
      setAutomations((prev) =>
        prev.map((a) => (a.id === id ? { ...a, isActive: !a.isActive } : a))
      );
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleCreate = async () => {
    if (!newAutomation.name || !newAutomation.trigger) return;
    setCreateLoading(true);
    try {
      const res = await fetch("/api/automations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newAutomation),
      });
      if (!res.ok) throw new Error("Nu s-a putut crea automatizarea");
      setCreateDialogOpen(false);
      setNewAutomation({ name: "", description: "", trigger: "" });
      fetchAutomations();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCreateLoading(false);
    }
  };

  return (
    <PlanGate
      requiredPlan="PRO"
      featureName="Automatizari"
      featureDescription="Configureaza actiuni automate: trimitere email, SMS sau tag-uri cand se intampla un eveniment important."
      features={[
        { icon: AutoIcon, title: "Workflow-uri Automate", description: "Seteaza triggere si actiuni care se executa automat.", iconBg: "bg-purple-100", iconColor: "text-purple-600" },
        { icon: MailIcon, title: "Email & SMS Automat", description: "Trimite mesaje automate la donatie noua, abonat nou, etc.", iconBg: "bg-blue-100", iconColor: "text-blue-600" },
        { icon: ClockIcon, title: "Actiuni Programate", description: "Adauga pasi cu delay (ore, zile) intre actiuni.", iconBg: "bg-green-100", iconColor: "text-green-600" },
      ]}
    >
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Automatizari</h1>
          <p className="text-muted-foreground">
            Creeaza fluxuri automate pentru a interactiona cu donatorii.
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Plus className="mr-2 h-4 w-4" />
                Creare rapida
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Creeaza automatizare</DialogTitle>
                <DialogDescription>
                  Configureaza un flux automatizat nou. Poti adauga pasi ulterior.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="auto-name">Nume *</Label>
                  <Input
                    id="auto-name"
                    placeholder="ex., Bun venit donatori noi"
                    value={newAutomation.name}
                    onChange={(e) => setNewAutomation({ ...newAutomation, name: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="auto-desc">Descriere</Label>
                  <Textarea
                    id="auto-desc"
                    placeholder="Ce face aceasta automatizare?"
                    value={newAutomation.description}
                    onChange={(e) => setNewAutomation({ ...newAutomation, description: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Declansator *</Label>
                  <Select
                    value={newAutomation.trigger || undefined}
                    onValueChange={(v) => setNewAutomation({ ...newAutomation, trigger: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecteaza un declansator..." />
                    </SelectTrigger>
                    <SelectContent>
                      {TRIGGER_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {newAutomation.trigger && (
                    <p className="text-xs text-muted-foreground">
                      {TRIGGER_OPTIONS.find((t) => t.value === newAutomation.trigger)?.description}
                    </p>
                  )}
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>Anuleaza</Button>
                <Button
                  onClick={handleCreate}
                  disabled={createLoading || !newAutomation.name || !newAutomation.trigger}
                >
                  {createLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Creeaza
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Link href="/dashboard/automations/new">
            <Button>
              <Zap className="mr-2 h-4 w-4" />
              Construieste automatizare
            </Button>
          </Link>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Cauta automatizari..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {error && (
        <Card className="border-destructive">
          <CardContent className="py-3">
            <p className="text-sm text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Automations List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : automations.length === 0 ? (
        <Card>
          <CardContent className="py-20 text-center">
            <Zap className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold">Nicio automatizare inca</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
              Creeaza prima automatizare pentru a interactiona automat cu donatorii.
            </p>
            <Link href="/dashboard/automations/new">
              <Button className="mt-4">
                <Zap className="mr-2 h-4 w-4" />
                Construieste automatizare
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {automations.map((automation) => (
            <Card key={automation.id} className="hover:shadow-md transition-shadow">
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <button
                      onClick={() => handleToggleActive(automation.id, automation.isActive)}
                      className={`flex h-10 w-10 items-center justify-center rounded-full shrink-0 transition-colors ${
                        automation.isActive
                          ? "bg-green-100 text-green-600 hover:bg-green-200"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      }`}
                    >
                      {automation.isActive ? (
                        <Play className="h-4 w-4" />
                      ) : (
                        <Pause className="h-4 w-4" />
                      )}
                    </button>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold truncate">{automation.name}</h3>
                        <Badge
                          variant={automation.isActive ? "success" : "secondary"}
                          className="shrink-0"
                        >
                          {automation.isActive ? "Activ" : "Inactiv"}
                        </Badge>
                      </div>
                      {automation.description && (
                        <p className="text-sm text-muted-foreground truncate mt-0.5">
                          {automation.description}
                        </p>
                      )}
                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${triggerBadgeColor(
                            automation.trigger
                          )}`}
                        >
                          <Zap className="h-3 w-3" />
                          {automation.trigger.replace(/_/g, " ")}
                        </span>
                        <span className="flex items-center gap-1">
                          <GitBranch className="h-3 w-3" />
                          {automation._count.steps} {automation._count.steps !== 1 ? "pasi" : "pas"}
                        </span>
                        <span className="flex items-center gap-1">
                          <Activity className="h-3 w-3" />
                          {automation._count.executions} {automation._count.executions !== 1 ? "executii" : "executie"}
                        </span>
                        <span className="hidden sm:inline">
                          Actualizat {formatDate(automation.updatedAt)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 ml-4">
                    <Link href={`/dashboard/automations/new?edit=${automation.id}`}>
                      <Button variant="outline" size="sm">
                        Editeaza flux
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <PageHelp items={[
        { title: "Ce sunt automatizarile", description: "Actiuni care se executa automat cand se intampla un eveniment (ex: donatie noua, abonat nou)." },
        { title: "Trigger (declansator)", description: "Evenimentul care porneste automatizarea: donatie noua, obiectiv atins, lipsa donatii, abonat nou, campanie terminata." },
        { title: "Play / Pauza", description: "Activeaza sau dezactiveaza o automatizare fara a o sterge." },
        { title: "Executii", description: "Numarul de ori cand automatizarea a fost declansata." },
        { title: "Automatizare noua", description: "Click pe + Automatizare noua pentru a configura trigger-ul si pasii (email, SMS, asteptare, tag-uri)." },
      ]} />
    </div>
    </PlanGate>
  );
}

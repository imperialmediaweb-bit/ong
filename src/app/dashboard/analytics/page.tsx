"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCurrency, formatDate } from "@/lib/utils";
import { PageHelp } from "@/components/ui/page-help";
import {
  Send,
  Eye,
  MousePointerClick,
  Users,
  Loader2,
  ArrowUpRight,
  Calendar,
  Sparkles,
  Bot,
  MessageCircle,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  TrendingUp,
  Target,
  Zap,
  Mail,
  MessageSquare,
  CreditCard,
  BarChart3,
} from "lucide-react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface AgentMessage {
  role: "user" | "assistant";
  content: string;
}

interface AnalyticsSummary {
  totalSent: number;
  totalDelivered: number;
  totalOpened: number;
  totalClicked: number;
  avgOpenRate: number;
  avgClickRate: number;
  totalDonations: number;
  totalDonationAmount: number;
  donorCount: number;
  newDonorsThisPeriod: number;
}

interface SendsOverTime {
  date: string;
  sent: number;
  delivered: number;
  opened: number;
}

interface CampaignPerformance {
  id: string;
  name: string;
  type: string;
  channel: string;
  sent: number;
  openRate: number;
  clickRate: number;
  donations: number;
  revenue: number;
}

interface DonationByCampaign {
  name: string;
  amount: number;
}

interface DonorGrowth {
  date: string;
  total: number;
  new: number;
}

interface ChannelStats {
  campaignCount: number;
  totalSent: number;
  totalDelivered: number;
  totalOpened: number;
  totalClicked: number;
  totalBounced?: number;
  openRate: string;
  clickRate: string;
}

interface CreditsInfo {
  emailCredits: number;
  smsCredits: number;
}

const PIE_COLORS = ["#6366f1", "#22c55e", "#f59e0b", "#ef4444", "#3b82f6", "#8b5cf6", "#ec4899"];

const PERIOD_OPTIONS = [
  { value: "7d", label: "Ultimele 7 zile" },
  { value: "30d", label: "Ultimele 30 zile" },
  { value: "90d", label: "Ultimele 90 zile" },
  { value: "1y", label: "Ultimul an" },
  { value: "all", label: "Tot timpul" },
];

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState("30d");

  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [sendsOverTime, setSendsOverTime] = useState<SendsOverTime[]>([]);
  const [campaignPerformance, setCampaignPerformance] = useState<CampaignPerformance[]>([]);
  const [donationsByCampaign, setDonationsByCampaign] = useState<DonationByCampaign[]>([]);
  const [donorGrowth, setDonorGrowth] = useState<DonorGrowth[]>([]);
  const [emailStats, setEmailStats] = useState<ChannelStats | null>(null);
  const [smsStats, setSmsStats] = useState<ChannelStats | null>(null);
  const [credits, setCredits] = useState<CreditsInfo | null>(null);

  // AI Marketing Agent state
  const [agentMessages, setAgentMessages] = useState<AgentMessage[]>([]);
  const [agentInput, setAgentInput] = useState("");
  const [agentLoading, setAgentLoading] = useState(false);
  const [agentExpanded, setAgentExpanded] = useState(true);
  const agentChatRef = useRef<HTMLDivElement>(null);

  const sendToAgent = async (message: string) => {
    if (!message.trim() || agentLoading) return;

    const userMsg: AgentMessage = { role: "user", content: message.trim() };
    setAgentMessages((prev) => [...prev, userMsg]);
    setAgentInput("");
    setAgentLoading(true);

    try {
      const res = await fetch("/api/ai/marketing-agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: message.trim(),
          conversationHistory: [...agentMessages, userMsg],
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Eroare la comunicarea cu agentul AI");
      }

      const data = await res.json();
      setAgentMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.reply },
      ]);
    } catch (err: any) {
      setAgentMessages((prev) => [
        ...prev,
        { role: "assistant", content: `Eroare: ${err.message}` },
      ]);
    } finally {
      setAgentLoading(false);
    }
  };

  useEffect(() => {
    if (agentChatRef.current) {
      agentChatRef.current.scrollTop = agentChatRef.current.scrollHeight;
    }
  }, [agentMessages, agentLoading]);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ period });
      const res = await fetch(`/api/analytics?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch analytics");
      const json = await res.json();
      const d = json.data || json;

      // Map API response to frontend format
      const overview = d.overview || {};
      const perf = d.campaignPerformance || {};
      setSummary({
        totalSent: perf.totalSent || 0,
        totalDelivered: perf.totalDelivered || 0,
        totalOpened: perf.totalOpened || 0,
        totalClicked: perf.totalClicked || 0,
        avgOpenRate: parseFloat(perf.openRate) || 0,
        avgClickRate: parseFloat(perf.clickRate) || 0,
        totalDonations: overview.totalDonationsInPeriod || 0,
        totalDonationAmount: overview.donationSumInPeriod || 0,
        donorCount: overview.totalDonors || 0,
        newDonorsThisPeriod: overview.newDonorsInPeriod || 0,
      });

      // Build sendsOverTime from donationsByMonth if available
      const byMonth = d.donationsByMonth || [];
      setSendsOverTime(byMonth.map((m: any) => ({
        date: m.month,
        sent: m.count || 0,
        delivered: m.count || 0,
        opened: 0,
      })));

      // Campaign performance from API
      const campaigns = d.campaigns || [];
      setCampaignPerformance(campaigns.map((c: any) => ({
        id: c.id,
        name: c.name,
        type: c.type || "CUSTOM",
        channel: c.channel || "EMAIL",
        sent: c.sent || 0,
        openRate: c.openRate || 0,
        clickRate: c.clickRate || 0,
        donations: c.donations || 0,
        revenue: 0,
      })));

      // Build donationsByCampaign from recentDonations
      const donations = d.recentDonations || [];
      const campaignMap = new Map<string, number>();
      donations.forEach((don: any) => {
        const name = don.campaign?.name || "Donatie directa";
        campaignMap.set(name, (campaignMap.get(name) || 0) + (don.amount || 0));
      });
      setDonationsByCampaign(
        Array.from(campaignMap.entries()).map(([name, amount]) => ({ name, amount: Number(amount) }))
      );

      // Email / SMS stats
      setEmailStats(d.emailStats || null);
      setSmsStats(d.smsStats || null);
      setCredits(d.credits || null);

      // Donor growth - use donorsByChannel for now
      setDonorGrowth([]);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

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
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 p-8 text-white shadow-xl">
        <div className="absolute inset-0 opacity-10">
          <svg className="h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <pattern id="analytics-grid" width="10" height="10" patternUnits="userSpaceOnUse">
                <path d="M 10 0 L 0 0 0 10" fill="none" stroke="white" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100" height="100" fill="url(#analytics-grid)" />
          </svg>
        </div>
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
              <BarChart3 className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Analitica</h1>
              <p className="text-white/70 mt-1">
                Performanta campaniilor, perspective si tendinte.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2">
            <Calendar className="h-4 w-4 text-white/70" />
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-40 border-0 bg-transparent text-white focus:ring-0 focus:ring-offset-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PERIOD_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {error && (
        <Card className="border-destructive">
          <CardContent className="py-4">
            <p className="text-sm text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* ── Super AI Marketing Agent ───────────────────────────────── */}
      <Card className="border-0 shadow-lg overflow-hidden bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        <CardHeader
          className="cursor-pointer border-b bg-gradient-to-r from-indigo-600 to-purple-600 text-white"
          onClick={() => setAgentExpanded(!agentExpanded)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
                <Bot className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-white text-lg">Super Agent Marketing AI</CardTitle>
                <CardDescription className="text-white/70 text-xs">
                  Analizeaza datele, ofera sfaturi si strategii de marketing
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-white/20 text-white border-0 text-xs">
                <Sparkles className="h-3 w-3 mr-1" />
                Powered by AI
              </Badge>
              {agentExpanded ? (
                <ChevronUp className="h-5 w-5 text-white/70" />
              ) : (
                <ChevronDown className="h-5 w-5 text-white/70" />
              )}
            </div>
          </div>
        </CardHeader>

        {agentExpanded && (
          <CardContent className="p-0">
            {/* Quick action buttons */}
            {agentMessages.length === 0 && (
              <div className="p-6 border-b">
                <p className="text-sm text-gray-500 mb-4">
                  Intreaba agentul orice despre performanta ONG-ului tau. Iata cateva sugestii:
                </p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {[
                    { icon: TrendingUp, label: "Analizeaza performanta generala", prompt: "Analizeaza performanta generala a organizatiei noastre si da-mi un raport complet cu ce merge bine si ce trebuie imbunatatit." },
                    { icon: Target, label: "Strategii de crestere donatori", prompt: "Ce strategii concrete pot folosi pentru a creste numarul de donatori? Da-mi un plan de actiune detaliat." },
                    { icon: Lightbulb, label: "Idei campanii de fundraising", prompt: "Propune 5 idei de campanii de fundraising creative adaptate pentru organizatia noastra, cu texte si strategii concrete." },
                    { icon: Zap, label: "Optimizeaza ratele de conversie", prompt: "Analizeaza ratele noastre de deschidere si click si sugereaza cum le putem imbunatati. Ce tip de subiecte si continut functioneaza mai bine?" },
                  ].map((suggestion) => (
                    <button
                      key={suggestion.label}
                      onClick={() => sendToAgent(suggestion.prompt)}
                      className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-3 text-left text-sm transition-all hover:border-indigo-300 hover:bg-indigo-50 hover:shadow-sm"
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-100">
                        <suggestion.icon className="h-4 w-4 text-indigo-600" />
                      </div>
                      <span className="font-medium text-gray-700">{suggestion.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Chat messages */}
            {agentMessages.length > 0 && (
              <div
                ref={agentChatRef}
                className="max-h-[500px] overflow-y-auto p-6 space-y-4"
              >
                {agentMessages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    {msg.role === "assistant" && (
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-500">
                        <Bot className="h-4 w-4 text-white" />
                      </div>
                    )}
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                        msg.role === "user"
                          ? "bg-indigo-600 text-white"
                          : "bg-white border border-gray-200 text-gray-800 shadow-sm"
                      }`}
                    >
                      {msg.role === "assistant" ? (
                        <div
                          className="prose prose-sm max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-li:text-gray-700 prose-strong:text-gray-900"
                          dangerouslySetInnerHTML={{
                            __html: msg.content
                              .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
                              .replace(/\n\n/g, "<br/><br/>")
                              .replace(/\n- /g, "<br/>&#8226; ")
                              .replace(/\n(\d+)\. /g, "<br/>$1. ")
                              .replace(/\n/g, "<br/>"),
                          }}
                        />
                      ) : (
                        msg.content
                      )}
                    </div>
                    {msg.role === "user" && (
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-100">
                        <MessageCircle className="h-4 w-4 text-indigo-600" />
                      </div>
                    )}
                  </div>
                ))}

                {agentLoading && (
                  <div className="flex gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-500">
                      <Bot className="h-4 w-4 text-white" />
                    </div>
                    <div className="rounded-2xl bg-white border border-gray-200 px-4 py-3 shadow-sm">
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Agentul analizeaza datele...
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Input */}
            <div className="border-t bg-white p-4">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  sendToAgent(agentInput);
                }}
                className="flex gap-2"
              >
                <Input
                  value={agentInput}
                  onChange={(e) => setAgentInput(e.target.value)}
                  placeholder="Intreaba agentul AI despre marketing, campanii, strategie..."
                  disabled={agentLoading}
                  className="h-11"
                />
                <Button
                  type="submit"
                  disabled={agentLoading || !agentInput.trim()}
                  className="h-11 px-6 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                >
                  {agentLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </form>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Summary Cards */}
      {summary && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="border-0 shadow-lg overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-indigo-500 to-purple-500" />
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total trimise</p>
                  <p className="text-2xl font-bold">{summary.totalSent.toLocaleString()}</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
                  <Send className="h-5 w-5" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {summary.totalDelivered.toLocaleString()} livrate
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Rata medie deschidere</p>
                  <p className="text-2xl font-bold">{summary.avgOpenRate.toFixed(1)}%</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                  <Eye className="h-5 w-5" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {summary.totalOpened.toLocaleString()} total deschise
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Rata medie click</p>
                  <p className="text-2xl font-bold">{summary.avgClickRate.toFixed(1)}%</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-amber-600">
                  <MousePointerClick className="h-5 w-5" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {summary.totalClicked.toLocaleString()} total clickuri
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Crestere donatori</p>
                  <p className="text-2xl font-bold">{summary.donorCount.toLocaleString()}</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-green-600">
                  <Users className="h-5 w-5" />
                </div>
              </div>
              <div className="flex items-center gap-1 mt-2">
                <ArrowUpRight className="h-3 w-3 text-green-600" />
                <p className="text-xs text-green-600">
                  +{summary.newDonorsThisPeriod} noi in aceasta perioada
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── Email & SMS Performance ──────────────────────────────── */}
      {(emailStats || smsStats) && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* Email Stats */}
          {emailStats && (
            <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-white">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Mail className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-blue-900">Campanii Email</h3>
                    <p className="text-xs text-blue-600">{emailStats.campaignCount} campanii trimise</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-2.5 bg-white rounded-lg border border-blue-100">
                    <p className="text-xs text-muted-foreground">Trimise</p>
                    <p className="text-lg font-bold text-blue-900">{emailStats.totalSent.toLocaleString()}</p>
                  </div>
                  <div className="p-2.5 bg-white rounded-lg border border-blue-100">
                    <p className="text-xs text-muted-foreground">Livrate</p>
                    <p className="text-lg font-bold text-blue-900">{emailStats.totalDelivered.toLocaleString()}</p>
                  </div>
                  <div className="p-2.5 bg-white rounded-lg border border-blue-100">
                    <p className="text-xs text-muted-foreground">Deschise</p>
                    <p className="text-lg font-bold text-blue-700">{emailStats.totalOpened.toLocaleString()}</p>
                    <p className="text-[10px] text-blue-500">{emailStats.openRate}% rata</p>
                  </div>
                  <div className="p-2.5 bg-white rounded-lg border border-blue-100">
                    <p className="text-xs text-muted-foreground">Click-uri</p>
                    <p className="text-lg font-bold text-blue-700">{emailStats.totalClicked.toLocaleString()}</p>
                    <p className="text-[10px] text-blue-500">{emailStats.clickRate}% rata</p>
                  </div>
                </div>
                {(emailStats.totalBounced || 0) > 0 && (
                  <p className="text-xs text-red-500 mt-2">{emailStats.totalBounced} bounce-uri</p>
                )}
              </CardContent>
            </Card>
          )}

          {/* SMS Stats */}
          {smsStats && (
            <Card className="border-green-200 bg-gradient-to-br from-green-50 to-white">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <MessageSquare className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-green-900">Campanii SMS</h3>
                    <p className="text-xs text-green-600">{smsStats.campaignCount} campanii trimise</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-2.5 bg-white rounded-lg border border-green-100">
                    <p className="text-xs text-muted-foreground">Trimise</p>
                    <p className="text-lg font-bold text-green-900">{smsStats.totalSent.toLocaleString()}</p>
                  </div>
                  <div className="p-2.5 bg-white rounded-lg border border-green-100">
                    <p className="text-xs text-muted-foreground">Livrate</p>
                    <p className="text-lg font-bold text-green-900">{smsStats.totalDelivered.toLocaleString()}</p>
                  </div>
                  <div className="p-2.5 bg-white rounded-lg border border-green-100">
                    <p className="text-xs text-muted-foreground">Deschise</p>
                    <p className="text-lg font-bold text-green-700">{smsStats.totalOpened.toLocaleString()}</p>
                  </div>
                  <div className="p-2.5 bg-white rounded-lg border border-green-100">
                    <p className="text-xs text-muted-foreground">Click-uri</p>
                    <p className="text-lg font-bold text-green-700">{smsStats.totalClicked.toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Credits Remaining */}
          {credits && (
            <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-white">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <CreditCard className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-purple-900">Credite disponibile</h3>
                    <p className="text-xs text-purple-600">Sold curent</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="p-3 bg-white rounded-lg border border-purple-100">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium">Email</span>
                      </div>
                      <span className="text-xl font-bold text-purple-900">{credits.emailCredits.toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="p-3 bg-white rounded-lg border border-purple-100">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-medium">SMS</span>
                      </div>
                      <span className="text-xl font-bold text-purple-900">{credits.smsCredits.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Donation Stats Cards */}
      {summary && (summary.totalDonations > 0 || summary.totalDonationAmount > 0) && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Card className="border-0 shadow-md bg-gradient-to-br from-green-50 to-emerald-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-700 font-medium">Total donatii</p>
                  <p className="text-2xl font-bold text-green-900">{summary.totalDonations.toLocaleString()}</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
                  <Target className="h-5 w-5 text-green-600" />
                </div>
              </div>
              <p className="text-xs text-green-600 mt-2">In perioada selectata</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md bg-gradient-to-br from-emerald-50 to-teal-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-emerald-700 font-medium">Venituri donatii</p>
                  <p className="text-2xl font-bold text-emerald-900">{formatCurrency(summary.totalDonationAmount)}</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100">
                  <TrendingUp className="h-5 w-5 text-emerald-600" />
                </div>
              </div>
              <p className="text-xs text-emerald-600 mt-2">Suma totala colectata</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md bg-gradient-to-br from-violet-50 to-purple-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-violet-700 font-medium">Donatori noi</p>
                  <p className="text-2xl font-bold text-violet-900">+{summary.newDonorsThisPeriod}</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-100">
                  <Users className="h-5 w-5 text-violet-600" />
                </div>
              </div>
              <p className="text-xs text-violet-600 mt-2">In aceasta perioada</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Sends Over Time - Line Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Performanta campaniilor in timp</CardTitle>
          <CardDescription>Tendintele de livrare in perioada selectata.</CardDescription>
        </CardHeader>
        <CardContent>
          {sendsOverTime.length === 0 ? (
            <div className="flex items-center justify-center h-[300px] text-muted-foreground">
              Nu sunt date disponibile pentru aceasta perioada.
            </div>
          ) : (
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={sendsOverTime}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="date"
                    className="text-xs"
                    tickFormatter={(val) => {
                      const d = new Date(val);
                      return `${d.getMonth() + 1}/${d.getDate()}`;
                    }}
                  />
                  <YAxis className="text-xs" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                    labelFormatter={(label) => formatDate(label)}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="sent" stroke="#6366f1" strokeWidth={2} dot={false} name="Trimise" />
                  <Line type="monotone" dataKey="delivered" stroke="#22c55e" strokeWidth={2} dot={false} name="Livrate" />
                  <Line type="monotone" dataKey="opened" stroke="#3b82f6" strokeWidth={2} dot={false} name="Deschise" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Open/Click Rates by Campaign - Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Rata deschidere si click pe campanie</CardTitle>
            <CardDescription>Compara engagement-ul campaniilor.</CardDescription>
          </CardHeader>
          <CardContent>
            {campaignPerformance.length === 0 ? (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                Nicio data campanie inca.
              </div>
            ) : (
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={campaignPerformance.slice(0, 8)}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis
                      dataKey="name"
                      className="text-xs"
                      tickFormatter={(val) => (val.length > 12 ? val.slice(0, 12) + "..." : val)}
                    />
                    <YAxis className="text-xs" unit="%" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                    <Legend />
                    <Bar dataKey="openRate" name="Rata deschidere %" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="clickRate" name="Rata click %" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Donations by Campaign - Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Donatii pe campanie</CardTitle>
            <CardDescription>Distributia veniturilor pe campanii.</CardDescription>
          </CardHeader>
          <CardContent>
            {donationsByCampaign.length === 0 ? (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                Nu sunt date de donatii disponibile.
              </div>
            ) : (
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={donationsByCampaign}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="amount"
                      nameKey="name"
                      label={({ name, percent }) =>
                        `${name.length > 15 ? name.slice(0, 15) + "..." : name} ${(percent * 100).toFixed(0)}%`
                      }
                    >
                      {donationsByCampaign.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                      formatter={(value: number) => formatCurrency(value)}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Donor Growth - Line Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Crestere donatori</CardTitle>
          <CardDescription>Urmareste cresterea bazei de donatori in timp.</CardDescription>
        </CardHeader>
        <CardContent>
          {donorGrowth.length === 0 ? (
            <div className="flex items-center justify-center h-[300px] text-muted-foreground">
              Nu sunt date de crestere disponibile.
            </div>
          ) : (
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={donorGrowth}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="date"
                    className="text-xs"
                    tickFormatter={(val) => {
                      const d = new Date(val);
                      return `${d.getMonth() + 1}/${d.getDate()}`;
                    }}
                  />
                  <YAxis className="text-xs" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                    labelFormatter={(label) => formatDate(label)}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="total" stroke="#6366f1" strokeWidth={2} name="Total donatori" />
                  <Line type="monotone" dataKey="new" stroke="#22c55e" strokeWidth={2} name="Donatori noi" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Top Campaigns Table */}
      <Card>
        <CardHeader>
          <CardTitle>Campaniile cu cele mai bune rezultate</CardTitle>
          <CardDescription>Clasificate dupa engagement si generare de venituri.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {campaignPerformance.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              Nicio data campanie de afisat.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="p-3 text-left font-medium">Campanie</th>
                    <th className="p-3 text-left font-medium">Canal</th>
                    <th className="p-3 text-right font-medium">Trimise</th>
                    <th className="p-3 text-right font-medium">Rata deschidere</th>
                    <th className="p-3 text-right font-medium">Rata click</th>
                    <th className="p-3 text-right font-medium hidden md:table-cell">Donatii</th>
                  </tr>
                </thead>
                <tbody>
                  {campaignPerformance
                    .sort((a, b) => b.openRate - a.openRate)
                    .slice(0, 10)
                    .map((camp) => (
                      <tr key={camp.id} className="border-b hover:bg-muted/30 transition-colors">
                        <td className="p-3 font-medium max-w-[200px] truncate">{camp.name}</td>
                        <td className="p-3">
                          <Badge variant="secondary" className="text-xs flex items-center gap-1 w-fit">
                            {(camp as any).channel === "EMAIL" && <Mail className="h-3 w-3" />}
                            {(camp as any).channel === "SMS" && <MessageSquare className="h-3 w-3" />}
                            {(camp as any).channel === "BOTH" && <><Mail className="h-3 w-3" /><MessageSquare className="h-3 w-3" /></>}
                            {(camp as any).channel || camp.type.replace(/_/g, " ")}
                          </Badge>
                        </td>
                        <td className="p-3 text-right">{camp.sent.toLocaleString()}</td>
                        <td className="p-3 text-right">
                          <span className={camp.openRate >= 30 ? "text-green-600 font-medium" : camp.openRate >= 15 ? "text-amber-600" : "text-red-600"}>
                            {camp.openRate.toFixed(1)}%
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <span className={camp.clickRate >= 5 ? "text-green-600 font-medium" : camp.clickRate >= 2 ? "text-amber-600" : "text-red-600"}>
                            {camp.clickRate.toFixed(1)}%
                          </span>
                        </td>
                        <td className="p-3 text-right hidden md:table-cell">
                          {camp.donations.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <PageHelp items={[
        { title: "Performanta campanii", description: "Grafice cu ratele de deschidere, click si bounce pentru fiecare campanie trimisa." },
        { title: "Trimiteri in timp", description: "Evolutia numarului de mesaje trimise pe zile/saptamani." },
        { title: "Donatii pe campanie", description: "Cat a generat fiecare campanie in donatii." },
        { title: "Crestere donatori", description: "Grafic cu evolutia numarului de donatori noi in timp." },
        { title: "Agent AI", description: "Intreaba AI-ul despre datele tale — ex: care campanie a performat cel mai bine?" },
        { title: "Filtre", description: "Filtreaza datele dupa interval de timp sau campanie specifica." },
      ]} chatHint="Foloseste Agent-ul AI din aceasta pagina pentru intrebari despre analitice." />
    </div>
  );
}

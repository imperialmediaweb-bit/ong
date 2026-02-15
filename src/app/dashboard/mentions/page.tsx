"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search, Globe, TrendingUp, TrendingDown, Minus,
  Eye, CheckCircle2, XCircle, AlertCircle, RefreshCw,
  Settings2, Bell, Filter, ExternalLink, Loader2,
  Sparkles, Newspaper, Radio, MessageSquare, Youtube,
  Twitter, Facebook, Rss, BarChart3, Download,
  ThumbsUp, ThumbsDown, Clock, ChevronDown, ChevronUp,
  Plus, Trash2, Save, Lock, Crown, Zap,
} from "lucide-react";
import { PageHelp } from "@/components/ui/page-help";

interface MentionItem {
  id: string;
  sourceType: string;
  title: string;
  url: string;
  snippet: string;
  publishedAt: string;
  relevanceScore: number;
  sentiment: string;
  mentionType: string;
  summary: string;
  status: string;
  entities: any;
  createdAt: string;
}

interface MentionStats {
  total: number;
  positive: number;
  neutral: number;
  negative: number;
  confirmed: number;
  pending: number;
  avgRelevance: number;
  todayCount: number;
}

export default function MentionsPage() {
  const { data: session } = useSession();
  const plan = (session?.user as any)?.plan || "BASIC";
  const role = (session?.user as any)?.role;
  const isElite = plan === "ELITE" || role === "SUPER_ADMIN";

  const [activeTab, setActiveTab] = useState("inbox");
  const [mentions, setMentions] = useState<MentionItem[]>([]);
  const [stats, setStats] = useState<MentionStats>({
    total: 0, positive: 0, neutral: 0, negative: 0,
    confirmed: 0, pending: 0, avgRelevance: 0, todayCount: 0
  });
  const [loading, setLoading] = useState(true);
  const [crawling, setCrawling] = useState(false);

  // Filters
  const [filterSentiment, setFilterSentiment] = useState("all");
  const [filterSource, setFilterSource] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterRelevance, setFilterRelevance] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Settings
  const [searchTerms, setSearchTerms] = useState<string[]>([""]);
  const [rssSources, setRssSources] = useState<string[]>([""]);
  const [relevanceThreshold, setRelevanceThreshold] = useState("70");
  const [notifyEmail, setNotifyEmail] = useState(true);
  const [notifyFrequency, setNotifyFrequency] = useState("DAILY");
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  // Expanded mention
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const loadMentions = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterSentiment !== "all") params.set("sentiment", filterSentiment);
      if (filterSource !== "all") params.set("source", filterSource);
      if (filterStatus !== "all") params.set("status", filterStatus);
      if (searchQuery) params.set("q", searchQuery);

      const res = await fetch(`/api/mentions?${params.toString()}`);
      const data = await res.json();
      setMentions(data.mentions || []);
      setStats(data.stats || stats);
    } catch {
      // Keep existing state
    } finally {
      setLoading(false);
    }
  }, [filterSentiment, filterSource, filterStatus, searchQuery]);

  const loadSettings = async () => {
    try {
      const res = await fetch("/api/mentions?action=settings");
      const data = await res.json();
      if (data.config) {
        setSearchTerms(data.config.searchQueries?.length ? data.config.searchQueries : [""]);
        setRssSources(data.config.rssSources?.length ? data.config.rssSources : [""]);
        setRelevanceThreshold(String(data.config.relevanceThreshold || 70));
        setNotifyEmail(data.config.notifyEmail ?? true);
        setNotifyFrequency(data.config.notifyFrequency || "DAILY");
      }
      setSettingsLoaded(true);
    } catch {
      setSettingsLoaded(true);
    }
  };

  useEffect(() => {
    loadMentions();
    loadSettings();
  }, []);

  useEffect(() => {
    loadMentions();
  }, [filterSentiment, filterSource, filterStatus]);

  const [crawlResult, setCrawlResult] = useState<string | null>(null);

  const handleCrawl = async () => {
    setCrawling(true);
    setCrawlResult(null);
    try {
      const res = await fetch("/api/mentions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "crawl" }),
      });
      const data = await res.json();
      if (data.saved > 0) {
        setCrawlResult(`S-au gasit ${data.crawled} mentiuni, ${data.saved} noi salvate.`);
      } else if (data.crawled > 0) {
        setCrawlResult(`S-au gasit ${data.crawled} mentiuni, toate existau deja.`);
      } else {
        setCrawlResult(data.message || "Nu s-au gasit mentiuni noi.");
      }
      await loadMentions();
    } catch {
      setCrawlResult("Eroare la scanare. Incercati din nou.");
    } finally {
      setCrawling(false);
    }
  };

  const handleUpdateStatus = async (mentionId: string, newStatus: string) => {
    try {
      await fetch("/api/mentions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "update_status", mentionId, status: newStatus }),
      });
      setMentions(prev => prev.map(m =>
        m.id === mentionId ? { ...m, status: newStatus } : m
      ));
    } catch {
      // silently fail
    }
  };

  const handleDeleteMention = async (mentionId: string) => {
    try {
      await fetch("/api/mentions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete_mention", mentionId }),
      });
      setMentions(prev => prev.filter(m => m.id !== mentionId));
    } catch { /* silently fail */ }
  };

  const handleSaveSettings = async () => {
    setSettingsSaving(true);
    try {
      await fetch("/api/mentions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "save_settings",
          searchQueries: searchTerms.filter(s => s.trim()),
          rssSources: rssSources.filter(s => s.trim()),
          relevanceThreshold: parseInt(relevanceThreshold),
          notifyEmail,
          notifyFrequency,
        }),
      });
    } catch {
      // silently fail
    } finally {
      setSettingsSaving(false);
    }
  };

  const handleSearch = () => {
    loadMentions();
  };

  const sentimentIcon = (s: string) => {
    switch (s) {
      case "POSITIVE": return <TrendingUp className="h-3.5 w-3.5 text-green-500" />;
      case "NEGATIVE": return <TrendingDown className="h-3.5 w-3.5 text-red-500" />;
      default: return <Minus className="h-3.5 w-3.5 text-gray-400" />;
    }
  };

  const sentimentBadge = (s: string) => {
    switch (s) {
      case "POSITIVE": return <Badge className="bg-green-100 text-green-700 border-green-200 text-xs">Pozitiv</Badge>;
      case "NEGATIVE": return <Badge className="bg-red-100 text-red-700 border-red-200 text-xs">Negativ</Badge>;
      default: return <Badge className="bg-gray-100 text-gray-600 border-gray-200 text-xs">Neutru</Badge>;
    }
  };

  const sourceIcon = (s: string) => {
    switch (s) {
      case "GOOGLE": return <Globe className="h-4 w-4 text-blue-500" />;
      case "FACEBOOK": return <Facebook className="h-4 w-4 text-blue-600" />;
      case "TWITTER": return <Twitter className="h-4 w-4" />;
      case "YOUTUBE": return <Youtube className="h-4 w-4 text-red-600" />;
      case "RSS": return <Rss className="h-4 w-4 text-orange-500" />;
      case "NEWS": return <Newspaper className="h-4 w-4 text-gray-700" />;
      default: return <Globe className="h-4 w-4 text-gray-500" />;
    }
  };

  const typeBadge = (t: string) => {
    const map: Record<string, string> = {
      NEWS: "Stire",
      PRESS_RELEASE: "Comunicat",
      INTERVIEW: "Interviu",
      OPINION: "Opinie",
      REVIEW: "Recenzie",
      SOCIAL_MENTION: "Social",
      BLOG: "Blog",
      OTHER: "Altele",
    };
    return <Badge variant="outline" className="text-xs">{map[t] || t}</Badge>;
  };

  const statusBadge = (s: string) => {
    switch (s) {
      case "CONFIRMED": return <Badge className="bg-green-100 text-green-700 border-green-200 text-xs">Confirmat</Badge>;
      case "REJECTED": return <Badge className="bg-red-100 text-red-700 border-red-200 text-xs">Respins</Badge>;
      case "NEEDS_REVIEW": return <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-xs">Necesita revizuire</Badge>;
      default: return <Badge className="bg-blue-100 text-blue-700 border-blue-200 text-xs">In asteptare</Badge>;
    }
  };

  if (!isElite) {
    return (
      <div className="space-y-6">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500 via-orange-500 to-red-500 p-8 text-white shadow-xl">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djZoLTZWMzRoNnptMC0zMHY2aC02VjRoNnptMCAxMnY2aC02VjE2aDZ6bTAgMTJ2Nmg2djZoLTZ2LTZ6bTEyLTEydjZoLTZWMTZoNnptLTI0IDB2Nmg2djZILTZ2LTZIMjR6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-30" />
          <div className="relative text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm mx-auto mb-4">
              <Crown className="h-8 w-8" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight mb-2">Monitorizare Mentiuni</h1>
            <p className="text-white/90 text-lg mb-1">Functie disponibila exclusiv in pachetul ELITE</p>
            <p className="text-white/70 text-sm max-w-xl mx-auto">
              Monitorizeaza automat mentiunile organizatiei tale din Google News, Facebook, presa si alte surse online cu analiza AI.
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <Card className="border-0 shadow-md">
            <CardContent className="pt-6 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-600 mx-auto mb-3">
                <Search className="h-6 w-6" />
              </div>
              <h3 className="font-semibold mb-1">Google News & RSS</h3>
              <p className="text-sm text-muted-foreground">Scanare automata din Google News, surse RSS si publicatii online.</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md">
            <CardContent className="pt-6 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100 text-purple-600 mx-auto mb-3">
                <Sparkles className="h-6 w-6" />
              </div>
              <h3 className="font-semibold mb-1">Analiza AI</h3>
              <p className="text-sm text-muted-foreground">Sentiment, relevanta si rezumat automat pentru fiecare mentiune gasita.</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md">
            <CardContent className="pt-6 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100 text-green-600 mx-auto mb-3">
                <Bell className="h-6 w-6" />
              </div>
              <h3 className="font-semibold mb-1">Notificari</h3>
              <p className="text-sm text-muted-foreground">Primesti alerte instant, zilnice sau saptamanale cu mentiunile noi.</p>
            </CardContent>
          </Card>
        </div>

        <Card className="border-0 shadow-lg overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-amber-500 to-orange-500" />
          <CardContent className="py-8 text-center">
            <h3 className="text-xl font-bold mb-2">Upgradare la pachetul ELITE</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Obtine acces la monitorizarea mentiunilor, AI optimization, A/B testing si toate functiile premium.
            </p>
            <Link href="/dashboard/billing">
              <Button className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-md rounded-lg px-8 py-3 text-base font-semibold">
                <Zap className="mr-2 h-5 w-5" />
                Upgradare ELITE
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-cyan-600 via-blue-600 to-indigo-700 p-6 text-white shadow-xl">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djZoLTZWMzRoNnptMC0zMHY2aC02VjRoNnptMCAxMnY2aC02VjE2aDZ6bTAgMTJ2Nmg2djZoLTZ2LTZ6bTEyLTEydjZoLTZWMTZoNnptLTI0IDB2Nmg2djZILTZ2LTZIMjR6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-30" />
        <div className="relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
                <Eye className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Monitorizare Mentiuni</h1>
                <p className="text-white/80 text-sm">
                  Gaseste automat mentiuni despre organizatia ta din Google, Facebook, presa si alte surse online.
                </p>
              </div>
            </div>
            <Button
              onClick={handleCrawl}
              disabled={crawling}
              className="bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm"
              variant="outline"
            >
              {crawling ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              Scanare acum
            </Button>
          </div>
          {crawlResult && (
            <div className="mt-3 text-sm text-white/90 bg-white/10 rounded-lg px-3 py-2 backdrop-blur-sm">
              {crawlResult}
            </div>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-0 shadow-md overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-blue-500 to-indigo-500" />
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Total mentiuni</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                <BarChart3 className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-green-500 to-emerald-500" />
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Pozitive</p>
                <p className="text-2xl font-bold text-green-600">{stats.positive}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100 text-green-600">
                <ThumbsUp className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-red-500 to-rose-500" />
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Negative</p>
                <p className="text-2xl font-bold text-red-600">{stats.negative}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100 text-red-600">
                <ThumbsDown className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-amber-500 to-orange-500" />
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Azi</p>
                <p className="text-2xl font-bold text-amber-600">{stats.todayCount}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
                <Clock className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="h-auto p-1 bg-muted/50 rounded-xl">
          <TabsTrigger value="inbox" className="gap-1.5 text-xs py-2.5 rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-md">
            <Newspaper className="h-3.5 w-3.5" />
            Inbox mentiuni
            {stats.pending > 0 && (
              <Badge className="ml-1 bg-white/20 text-white text-[10px] h-4 px-1.5">{stats.pending}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="settings" className="gap-1.5 text-xs py-2.5 rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-gray-500 data-[state=active]:to-gray-600 data-[state=active]:text-white data-[state=active]:shadow-md">
            <Settings2 className="h-3.5 w-3.5" />
            Configurare
          </TabsTrigger>
        </TabsList>

        {/* Inbox Tab */}
        <TabsContent value="inbox" className="space-y-4 mt-4">
          {/* Filters */}
          <Card className="border-0 shadow-md">
            <CardContent className="py-3">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Cauta in mentiuni..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    className="h-9 rounded-lg border-0 bg-muted/50"
                  />
                </div>
                <Select value={filterSentiment} onValueChange={setFilterSentiment}>
                  <SelectTrigger className="w-[140px] h-9 rounded-lg">
                    <SelectValue placeholder="Sentiment" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toate</SelectItem>
                    <SelectItem value="POSITIVE">Pozitive</SelectItem>
                    <SelectItem value="NEUTRAL">Neutre</SelectItem>
                    <SelectItem value="NEGATIVE">Negative</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterSource} onValueChange={setFilterSource}>
                  <SelectTrigger className="w-[140px] h-9 rounded-lg">
                    <SelectValue placeholder="Sursa" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toate</SelectItem>
                    <SelectItem value="GOOGLE">Google</SelectItem>
                    <SelectItem value="FACEBOOK">Facebook</SelectItem>
                    <SelectItem value="NEWS">Presa</SelectItem>
                    <SelectItem value="RSS">RSS</SelectItem>
                    <SelectItem value="TWITTER">Twitter</SelectItem>
                    <SelectItem value="YOUTUBE">YouTube</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-[150px] h-9 rounded-lg">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toate</SelectItem>
                    <SelectItem value="PENDING">In asteptare</SelectItem>
                    <SelectItem value="CONFIRMED">Confirmate</SelectItem>
                    <SelectItem value="REJECTED">Respinse</SelectItem>
                    <SelectItem value="NEEDS_REVIEW">Necesita revizuire</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterRelevance} onValueChange={setFilterRelevance}>
                  <SelectTrigger className="w-[140px] h-9 rounded-lg">
                    <SelectValue placeholder="Relevanta" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toate</SelectItem>
                    <SelectItem value="90">&gt; 90%</SelectItem>
                    <SelectItem value="80">&gt; 80%</SelectItem>
                    <SelectItem value="70">&gt; 70%</SelectItem>
                    <SelectItem value="50">&gt; 50%</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" size="sm" className="h-9 rounded-lg" onClick={() => {/* TODO: export */}}>
                  <Download className="h-3.5 w-3.5 mr-1" />
                  Export
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Mentions List */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : mentions.length === 0 ? (
            <Card className="border-0 shadow-md">
              <CardContent className="py-12 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-100 text-blue-600 mx-auto mb-4">
                  <Search className="h-8 w-8" />
                </div>
                <h3 className="text-lg font-semibold mb-1">Nicio mentiune gasita</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Configureaza termenii de cautare si apasa &quot;Scanare acum&quot; pentru a gasi mentiuni despre organizatia ta.
                </p>
                <Button onClick={() => setActiveTab("settings")} variant="outline" className="rounded-lg">
                  <Settings2 className="mr-2 h-4 w-4" />
                  Configureaza cautarea
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {mentions
                .filter(m => filterRelevance === "all" || (m.relevanceScore && m.relevanceScore > parseInt(filterRelevance)))
                .map((mention) => (
                <Card key={mention.id} className="border-0 shadow-md hover:shadow-lg transition-all duration-200 overflow-hidden">
                  <CardContent className="py-4">
                    <div className="flex items-start gap-3">
                      {/* Source icon */}
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted shrink-0">
                        {sourceIcon(mention.sourceType)}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <a
                            href={mention.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm font-semibold hover:text-primary transition-colors line-clamp-1 flex items-center gap-1"
                          >
                            {mention.title}
                            <ExternalLink className="h-3 w-3 shrink-0 opacity-50" />
                          </a>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {sentimentBadge(mention.sentiment)}
                            {typeBadge(mention.mentionType)}
                            {statusBadge(mention.status)}
                          </div>
                        </div>

                        <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{mention.snippet || mention.summary}</p>

                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            {sourceIcon(mention.sourceType)}
                            {mention.entities?.sourceName || mention.sourceType}
                          </span>
                          {mention.relevanceScore && (
                            <span className="flex items-center gap-1">
                              <Sparkles className="h-3 w-3 text-amber-500" />
                              Relevanta: {mention.relevanceScore}%
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {mention.publishedAt ? new Date(mention.publishedAt).toLocaleDateString("ro-RO") : new Date(mention.createdAt).toLocaleDateString("ro-RO")}
                          </span>
                        </div>

                        {/* Expanded content */}
                        {expandedId === mention.id && (
                          <div className="mt-3 p-3 bg-muted/30 rounded-lg space-y-3">
                            {mention.summary && (
                              <div>
                                <p className="text-xs font-medium text-muted-foreground mb-1">Rezumat AI:</p>
                                <p className="text-sm">{mention.summary}</p>
                              </div>
                            )}
                            {/* URL edit section */}
                            <div className="flex items-center gap-2">
                              <Globe className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                              <Input
                                value={mention.url || ""}
                                onChange={(e) => {
                                  setMentions(prev => prev.map(m => m.id === mention.id ? { ...m, url: e.target.value } : m));
                                }}
                                placeholder="https://..."
                                className="h-8 text-xs rounded-lg flex-1"
                              />
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 rounded-lg text-xs"
                                onClick={async () => {
                                  await fetch("/api/mentions", {
                                    method: "POST",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({ action: "update_mention", mentionId: mention.id, url: mention.url }),
                                  });
                                }}
                              >
                                <Save className="h-3 w-3 mr-1" />
                                Salveaza
                              </Button>
                            </div>
                            {mention.entities && (
                              <div className="flex flex-wrap gap-1">
                                {mention.entities.project && <Badge variant="outline" className="text-xs">Proiect: {mention.entities.project}</Badge>}
                                {mention.entities.location && <Badge variant="outline" className="text-xs">Locatie: {mention.entities.location}</Badge>}
                                {mention.entities.persons?.map((p: string, i: number) => (
                                  <Badge key={i} variant="outline" className="text-xs">Persoana: {p}</Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col gap-1 shrink-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 rounded-lg"
                          onClick={() => setExpandedId(expandedId === mention.id ? null : mention.id)}
                        >
                          {expandedId === mention.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </Button>
                        {mention.status === "PENDING" && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 rounded-lg text-green-600 hover:bg-green-50 hover:text-green-700"
                              onClick={() => handleUpdateStatus(mention.id, "CONFIRMED")}
                            >
                              <CheckCircle2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 rounded-lg text-red-600 hover:bg-red-50 hover:text-red-700"
                              onClick={() => handleUpdateStatus(mention.id, "REJECTED")}
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 rounded-lg text-red-600 hover:bg-red-50 hover:text-red-700"
                          onClick={() => handleDeleteMention(mention.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-4 mt-4">
          <Card className="border-0 shadow-lg overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-gray-50 to-slate-50 dark:from-gray-950/30 dark:to-slate-950/30 border-b">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-gray-500 to-slate-600 text-white shadow-md">
                  <Search className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-lg">Termeni de cautare</CardTitle>
                  <CardDescription>
                    Adauga numele organizatiei, proiectelor, campaniilor si persoanelor pe care vrei sa le monitorizezi.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 pt-5">
              {searchTerms.map((term, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Input
                    placeholder={i === 0 ? 'Ex: "Asociatia Binevo"' : 'Ex: "Proiectul Speranta"'}
                    value={term}
                    onChange={(e) => {
                      const updated = [...searchTerms];
                      updated[i] = e.target.value;
                      setSearchTerms(updated);
                    }}
                    className="rounded-lg"
                  />
                  {searchTerms.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-9 w-9 p-0 text-red-500 hover:bg-red-50 rounded-lg"
                      onClick={() => setSearchTerms(searchTerms.filter((_, j) => j !== i))}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                className="rounded-lg"
                onClick={() => setSearchTerms([...searchTerms, ""])}
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                Adauga termen
              </Button>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30 border-b">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 text-white shadow-md">
                  <Rss className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-lg">Surse RSS / Publicatii</CardTitle>
                  <CardDescription>
                    Adauga link-uri RSS de la publicatii locale sau nationale pe care vrei sa le monitorizezi.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 pt-5">
              {rssSources.map((src, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Input
                    placeholder="Ex: https://publicatie.ro/rss"
                    value={src}
                    onChange={(e) => {
                      const updated = [...rssSources];
                      updated[i] = e.target.value;
                      setRssSources(updated);
                    }}
                    className="rounded-lg"
                  />
                  {rssSources.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-9 w-9 p-0 text-red-500 hover:bg-red-50 rounded-lg"
                      onClick={() => setRssSources(rssSources.filter((_, j) => j !== i))}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                className="rounded-lg"
                onClick={() => setRssSources([...rssSources, ""])}
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                Adauga sursa RSS
              </Button>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-b">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-md">
                  <Bell className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-lg">Notificari & Filtrare AI</CardTitle>
                  <CardDescription>
                    Configureaza pragul de relevanta si preferintele de notificare.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Prag relevanta AI (0-100)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={relevanceThreshold}
                    onChange={(e) => setRelevanceThreshold(e.target.value)}
                    className="rounded-lg"
                  />
                  <p className="text-xs text-muted-foreground">Mentiunile sub acest prag vor fi marcate &quot;Necesita revizuire&quot;</p>
                </div>
                <div className="grid gap-2">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Frecventa notificari</Label>
                  <Select value={notifyFrequency} onValueChange={setNotifyFrequency}>
                    <SelectTrigger className="rounded-lg">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="INSTANT">Instant (la fiecare mentiune)</SelectItem>
                      <SelectItem value="DAILY">Zilnic (rezumat)</SelectItem>
                      <SelectItem value="WEEKLY">Saptamanal (raport)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifyEmail}
                    onChange={(e) => setNotifyEmail(e.target.checked)}
                    className="h-4 w-4 rounded"
                  />
                  <span className="text-sm font-medium">Notificari pe email</span>
                </label>
              </div>
            </CardContent>
            <CardFooter className="border-t bg-muted/20 pt-4">
              <Button
                onClick={handleSaveSettings}
                disabled={settingsSaving}
                className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-md rounded-lg"
              >
                {settingsSaving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Salveaza setarile
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>

      <PageHelp items={[
        { title: "Monitorizare mentiuni", description: "Sistemul cauta automat mentiuni despre organizatia ta pe Google, Facebook, presa si alte surse." },
        { title: "AI analizeaza mentiunile", description: "Inteligenta artificiala elimina duplicatele, verifica relevanta, clasifica sentimentul si rezuma fiecare mentiune." },
        { title: "Confirma sau respinge", description: "Revizuieste mentiunile gasite si confirma sau respinge cele care nu sunt relevante." },
        { title: "Notificari automate", description: "Primesti notificari zilnice sau saptamanale cu rezumatul mentiunilor noi." },
      ]} chatHint="Configureaza termenii de cautare si sursele RSS pentru a gasi mentiuni despre organizatia ta." />
    </div>
  );
}

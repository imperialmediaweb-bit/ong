"use client";

import { useState } from "react";
import { PageHelp } from "@/components/ui/page-help";
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
  Sparkles, Facebook, Instagram, Linkedin, Twitter,
  Loader2, Copy, CheckCircle2, MessageCircle,
  Target, TrendingUp, Lightbulb, Send, RefreshCw,
  Megaphone, BookOpen, Zap,
} from "lucide-react";

export default function SocialAiPage() {
  const [activeTab, setActiveTab] = useState("generator");

  // Post Generator
  const [platform, setPlatform] = useState("facebook");
  const [topic, setTopic] = useState("");
  const [tone, setTone] = useState("inspiring");
  const [campaignName, setCampaignName] = useState("");
  const [includeHashtags, setIncludeHashtags] = useState(true);
  const [includeEmoji, setIncludeEmoji] = useState(true);
  const [customContext, setCustomContext] = useState("");
  const [variants, setVariants] = useState<string[]>([]);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState<number | null>(null);

  // Fundraising Trainer
  const [question, setQuestion] = useState("");
  const [advice, setAdvice] = useState("");
  const [adviceLoading, setAdviceLoading] = useState(false);

  // Campaign Strategy
  const [campaignGoal, setCampaignGoal] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [budget, setBudget] = useState("");
  const [timeline, setTimeline] = useState("1 luna");
  const [strategy, setStrategy] = useState("");
  const [strategyLoading, setStrategyLoading] = useState(false);

  // Post Optimizer
  const [postToOptimize, setPostToOptimize] = useState("");
  const [optimizePlatform, setOptimizePlatform] = useState("facebook");
  const [analysis, setAnalysis] = useState("");
  const [optimizeLoading, setOptimizeLoading] = useState(false);

  const handleGenerate = async () => {
    if (!topic.trim()) return;
    setGenerating(true);
    setVariants([]);
    try {
      const res = await fetch("/api/social-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "generate_post",
          platform,
          topic,
          tone,
          campaignName,
          includeHashtags,
          includeEmoji,
          customContext,
        }),
      });
      const data = await res.json();
      setVariants(data.variants || []);
    } catch {
      setVariants(["Eroare la generare. Incearca din nou."]);
    } finally {
      setGenerating(false);
    }
  };

  const handleAskTrainer = async () => {
    if (!question.trim()) return;
    setAdviceLoading(true);
    setAdvice("");
    try {
      const res = await fetch("/api/social-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "fundraising_advice", question }),
      });
      const data = await res.json();
      setAdvice(data.advice || "");
    } catch {
      setAdvice("Eroare la generare. Incearca din nou.");
    } finally {
      setAdviceLoading(false);
    }
  };

  const handleStrategy = async () => {
    setStrategyLoading(true);
    setStrategy("");
    try {
      const res = await fetch("/api/social-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "campaign_strategy",
          campaignGoal,
          targetAudience,
          budget,
          timeline,
        }),
      });
      const data = await res.json();
      setStrategy(data.strategy || "");
    } catch {
      setStrategy("Eroare la generare. Incearca din nou.");
    } finally {
      setStrategyLoading(false);
    }
  };

  const handleOptimize = async () => {
    if (!postToOptimize.trim()) return;
    setOptimizeLoading(true);
    setAnalysis("");
    try {
      const res = await fetch("/api/social-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "optimize_post",
          content: postToOptimize,
          platform: optimizePlatform,
        }),
      });
      const data = await res.json();
      setAnalysis(data.analysis || "");
    } catch {
      setAnalysis("Eroare la analiza. Incearca din nou.");
    } finally {
      setOptimizeLoading(false);
    }
  };

  const copyToClipboard = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopied(idx);
    setTimeout(() => setCopied(null), 2000);
  };

  const platformIcon = (p: string) => {
    switch (p) {
      case "facebook": return <Facebook className="h-4 w-4" />;
      case "instagram": return <Instagram className="h-4 w-4" />;
      case "linkedin": return <Linkedin className="h-4 w-4" />;
      case "twitter": return <Twitter className="h-4 w-4" />;
      default: return <MessageCircle className="h-4 w-4" />;
    }
  };

  const renderMarkdown = (text: string) => {
    return text
      .replace(/### (.*)/g, '<h3 class="text-base font-semibold mt-4 mb-2">$1</h3>')
      .replace(/## (.*)/g, '<h2 class="text-lg font-bold mt-5 mb-2">$1</h2>')
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/- (.*)/g, '<li class="ml-4 list-disc text-sm">$1</li>')
      .replace(/\n/g, "<br />");
  };

  const quickQuestions = [
    "Cum pot strange mai multi bani de la donatori individuali?",
    "Care sunt cele mai bune strategii pentru Formularul 230?",
    "Cum contactez firme pentru sponsorizari?",
    "Ce continut functioneaza cel mai bine pe social media?",
    "Cum creez o campanie de crowdfunding de succes?",
    "Care sunt cele mai bune perioade pentru fundraising in Romania?",
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Sparkles className="h-7 w-7 text-primary" />
          Social Media & AI Trainer
        </h1>
        <p className="text-muted-foreground">
          Genereaza postari, primeste sfaturi de fundraising si planifica campanii cu ajutorul AI.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="generator" className="gap-1 text-xs">
            <Megaphone className="h-3 w-3" />
            Generator postari
          </TabsTrigger>
          <TabsTrigger value="trainer" className="gap-1 text-xs">
            <BookOpen className="h-3 w-3" />
            Trainer fundraising
          </TabsTrigger>
          <TabsTrigger value="strategy" className="gap-1 text-xs">
            <Target className="h-3 w-3" />
            Strategie campanie
          </TabsTrigger>
          <TabsTrigger value="optimize" className="gap-1 text-xs">
            <Zap className="h-3 w-3" />
            Optimizare postare
          </TabsTrigger>
        </TabsList>

        {/* Post Generator */}
        <TabsContent value="generator" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Megaphone className="h-5 w-5" />
                Generator postari social media
              </CardTitle>
              <CardDescription>
                Genereaza automat postari optimizate pentru Facebook, Instagram, LinkedIn, Twitter sau TikTok.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Platforma</Label>
                  <Select value={platform} onValueChange={setPlatform}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="facebook">
                        <span className="flex items-center gap-2"><Facebook className="h-3 w-3" /> Facebook</span>
                      </SelectItem>
                      <SelectItem value="instagram">
                        <span className="flex items-center gap-2"><Instagram className="h-3 w-3" /> Instagram</span>
                      </SelectItem>
                      <SelectItem value="linkedin">
                        <span className="flex items-center gap-2"><Linkedin className="h-3 w-3" /> LinkedIn</span>
                      </SelectItem>
                      <SelectItem value="twitter">
                        <span className="flex items-center gap-2"><Twitter className="h-3 w-3" /> Twitter / X</span>
                      </SelectItem>
                      <SelectItem value="tiktok">
                        <span className="flex items-center gap-2"><MessageCircle className="h-3 w-3" /> TikTok</span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Ton</Label>
                  <Select value={tone} onValueChange={setTone}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="inspiring">Inspirational</SelectItem>
                      <SelectItem value="emotional">Emotional</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                      <SelectItem value="informative">Informativ</SelectItem>
                      <SelectItem value="casual">Casual / Prietenos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="topic">Subiectul postarii *</Label>
                <Input
                  id="topic"
                  placeholder="Ex: Campanie de strangere de fonduri pentru copii, Multumim donatorilor, Rezultatele proiectului..."
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="campaign">Numele campaniei (optional)</Label>
                <Input
                  id="campaign"
                  placeholder="Ex: Speranta pentru Educatie"
                  value={campaignName}
                  onChange={(e) => setCampaignName(e.target.value)}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="context">Context aditional (optional)</Label>
                <Textarea
                  id="context"
                  placeholder="Informatii suplimentare despre campanie, public tinta, rezultate, etc."
                  value={customContext}
                  onChange={(e) => setCustomContext(e.target.value)}
                  className="min-h-[60px]"
                />
              </div>

              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeHashtags}
                    onChange={(e) => setIncludeHashtags(e.target.checked)}
                    className="h-4 w-4"
                  />
                  <span className="text-sm"># Hashtag-uri</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeEmoji}
                    onChange={(e) => setIncludeEmoji(e.target.checked)}
                    className="h-4 w-4"
                  />
                  <span className="text-sm">Emoji-uri</span>
                </label>
              </div>
            </CardContent>
            <CardFooter className="border-t pt-6">
              <Button onClick={handleGenerate} disabled={generating || !topic.trim()}>
                {generating ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="mr-2 h-4 w-4" />
                )}
                Genereaza 3 variante
              </Button>
            </CardFooter>
          </Card>

          {/* Generated variants */}
          {variants.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                {platformIcon(platform)}
                Variante generate pentru {platform.charAt(0).toUpperCase() + platform.slice(1)}
              </h3>
              {variants.map((v, i) => (
                <Card key={i} className="hover:border-primary/30 transition">
                  <CardContent className="py-4">
                    <div className="flex justify-between items-start gap-3">
                      <div className="flex-1">
                        <Badge variant="outline" className="mb-2">Varianta {i + 1}</Badge>
                        <p className="text-sm whitespace-pre-wrap">{v}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(v, i)}
                        className="shrink-0"
                      >
                        {copied === i ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Fundraising Trainer */}
        <TabsContent value="trainer" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                AI Trainer Fundraising
              </CardTitle>
              <CardDescription>
                Intreaba orice despre fundraising, strategie, campanii sau social media. AI-ul cunoaste contextul romanesc, legislatia si cele mai bune practici.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label>Intreaba trainerul AI</Label>
                <Textarea
                  placeholder="Ex: Cum pot atrage mai multi donatori prin social media? Ce strategii functioneaza pentru ONG-uri mici?"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  className="min-h-[80px]"
                />
              </div>

              <div>
                <p className="text-xs text-muted-foreground mb-2">Intrebari rapide:</p>
                <div className="flex flex-wrap gap-2">
                  {quickQuestions.map((q, i) => (
                    <Button
                      key={i}
                      variant="outline"
                      size="sm"
                      className="text-xs h-auto py-1.5"
                      onClick={() => setQuestion(q)}
                    >
                      <Lightbulb className="h-3 w-3 mr-1" />
                      {q.length > 45 ? q.slice(0, 45) + "..." : q}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
            <CardFooter className="border-t pt-6">
              <Button onClick={handleAskTrainer} disabled={adviceLoading || !question.trim()}>
                {adviceLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Send className="mr-2 h-4 w-4" />
                )}
                Intreaba
              </Button>
            </CardFooter>
          </Card>

          {advice && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Raspunsul trainerului AI
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  className="prose prose-sm max-w-none text-sm"
                  dangerouslySetInnerHTML={{ __html: renderMarkdown(advice) }}
                />
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Campaign Strategy */}
        <TabsContent value="strategy" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Generator strategie campanie
              </CardTitle>
              <CardDescription>
                Primeste un plan complet de campanie cu calendar, canale, mesaje si KPI-uri.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Obiectivul campaniei</Label>
                  <Input
                    placeholder="Ex: Strangere 50.000 RON pentru echipamente"
                    value={campaignGoal}
                    onChange={(e) => setCampaignGoal(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Public tinta</Label>
                  <Input
                    placeholder="Ex: Tineri 25-35 ani, profesionisti IT"
                    value={targetAudience}
                    onChange={(e) => setTargetAudience(e.target.value)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Buget estimat</Label>
                  <Select value={budget || undefined} onValueChange={setBudget}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecteaza" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Fara buget (organic)</SelectItem>
                      <SelectItem value="sub 500 RON">Sub 500 RON</SelectItem>
                      <SelectItem value="500-2000 RON">500 - 2.000 RON</SelectItem>
                      <SelectItem value="2000-5000 RON">2.000 - 5.000 RON</SelectItem>
                      <SelectItem value="peste 5000 RON">Peste 5.000 RON</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Durata campaniei</Label>
                  <Select value={timeline} onValueChange={setTimeline}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1 saptamana">1 saptamana</SelectItem>
                      <SelectItem value="2 saptamani">2 saptamani</SelectItem>
                      <SelectItem value="1 luna">1 luna</SelectItem>
                      <SelectItem value="3 luni">3 luni</SelectItem>
                      <SelectItem value="6 luni">6 luni</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
            <CardFooter className="border-t pt-6">
              <Button onClick={handleStrategy} disabled={strategyLoading}>
                {strategyLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Target className="mr-2 h-4 w-4" />
                )}
                Genereaza strategie
              </Button>
            </CardFooter>
          </Card>

          {strategy && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Strategie de campanie
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  className="prose prose-sm max-w-none text-sm"
                  dangerouslySetInnerHTML={{ __html: renderMarkdown(strategy) }}
                />
              </CardContent>
              <CardFooter className="border-t pt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(strategy, -1)}
                >
                  {copied === -1 ? (
                    <CheckCircle2 className="mr-2 h-3 w-3 text-green-500" />
                  ) : (
                    <Copy className="mr-2 h-3 w-3" />
                  )}
                  Copiaza strategia
                </Button>
              </CardFooter>
            </Card>
          )}
        </TabsContent>

        {/* Post Optimizer */}
        <TabsContent value="optimize" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Optimizator postari
              </CardTitle>
              <CardDescription>
                Lipeste o postare existenta si primeste analiza, scor de impact si versiune optimizata.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label>Platforma</Label>
                <Select value={optimizePlatform} onValueChange={setOptimizePlatform}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="facebook">Facebook</SelectItem>
                    <SelectItem value="instagram">Instagram</SelectItem>
                    <SelectItem value="linkedin">LinkedIn</SelectItem>
                    <SelectItem value="twitter">Twitter / X</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Postarea ta</Label>
                <Textarea
                  placeholder="Lipeste aici postarea pe care vrei sa o optimizezi..."
                  value={postToOptimize}
                  onChange={(e) => setPostToOptimize(e.target.value)}
                  className="min-h-[120px]"
                />
              </div>
            </CardContent>
            <CardFooter className="border-t pt-6">
              <Button onClick={handleOptimize} disabled={optimizeLoading || !postToOptimize.trim()}>
                {optimizeLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Zap className="mr-2 h-4 w-4" />
                )}
                Analizeaza si optimizeaza
              </Button>
            </CardFooter>
          </Card>

          {analysis && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Analiza si recomandari
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  className="prose prose-sm max-w-none text-sm"
                  dangerouslySetInnerHTML={{ __html: renderMarkdown(analysis) }}
                />
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      <PageHelp items={[
        { title: "Generator postari", description: "Genereaza postari pentru Facebook, Instagram, LinkedIn sau Twitter. Alege tonul, include hashtag-uri si emoji-uri." },
        { title: "Trainer Fundraising", description: "Intreaba AI-ul despre strategii de fundraising, bune practici si sfaturi pentru ONG-uri." },
        { title: "Strategie campanie", description: "Descrie obiectivul, audienta, bugetul si perioada — AI-ul genereaza o strategie completa." },
        { title: "Optimizare postari", description: "Lipeste o postare existenta si primesti sugestii de imbunatatire de la AI." },
      ]} chatHint="Fiecare tab foloseste AI — scrie in limba romana si vei primi raspunsuri personalizate." />
    </div>
  );
}

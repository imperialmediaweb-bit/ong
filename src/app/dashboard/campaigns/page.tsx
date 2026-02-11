"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatDate, percentage } from "@/lib/utils";
import {
  Search,
  Plus,
  Mail,
  MessageSquare,
  Filter,
  Loader2,
  Eye,
  MousePointerClick,
  Send,
  Calendar,
  CreditCard,
  Package,
  TrendingUp,
  CheckCircle2,
  Star,
  Zap,
  ArrowRight,
  History,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  FileText,
} from "lucide-react";

interface Campaign {
  id: string;
  name: string;
  type: string;
  channel: string;
  status: string;
  subject: string | null;
  recipientCount: number;
  totalSent: number;
  totalDelivered: number;
  totalOpened: number;
  totalClicked: number;
  totalBounced: number;
  scheduledAt: string | null;
  sentAt: string | null;
  createdAt: string;
  goalAmount: number | null;
  currentAmount: number;
}

interface CreditPkg {
  id: string;
  name: string;
  channel: string;
  emailCredits: number;
  smsCredits: number;
  price: number;
  popular?: boolean;
  description: string;
}

interface CreditTx {
  id: string;
  type: string;
  channel: string;
  amount: number;
  balance: number;
  description: string | null;
  createdAt: string;
}

const TYPE_OPTIONS = [
  { value: "all", label: "Toate tipurile" },
  { value: "THANK_YOU", label: "Multumire" },
  { value: "UPDATE", label: "Actualizare" },
  { value: "EMERGENCY_APPEAL", label: "Apel de urgenta" },
  { value: "NEWSLETTER", label: "Newsletter" },
  { value: "REACTIVATION", label: "Reactivare" },
  { value: "CORPORATE_OUTREACH", label: "Parteneriate corporate" },
  { value: "CUSTOM", label: "Personalizat" },
];

const STATUS_OPTIONS = [
  { value: "all", label: "Toate statusurile" },
  { value: "DRAFT", label: "Ciorna" },
  { value: "SCHEDULED", label: "Programat" },
  { value: "SENDING", label: "Se trimite" },
  { value: "SENT", label: "Trimis" },
  { value: "PAUSED", label: "In pauza" },
  { value: "CANCELLED", label: "Anulat" },
];

const CHANNEL_OPTIONS = [
  { value: "all", label: "Toate canalele" },
  { value: "EMAIL", label: "Email" },
  { value: "SMS", label: "SMS" },
  { value: "BOTH", label: "Ambele" },
];

const statusBadgeVariant = (status: string) => {
  switch (status) {
    case "DRAFT": return "secondary" as const;
    case "SCHEDULED": return "warning" as const;
    case "SENDING": return "default" as const;
    case "SENT": return "success" as const;
    case "PAUSED": return "warning" as const;
    case "CANCELLED": return "destructive" as const;
    default: return "secondary" as const;
  }
};

const channelIcon = (channel: string) => {
  switch (channel) {
    case "EMAIL": return <Mail className="h-3 w-3" />;
    case "SMS": return <MessageSquare className="h-3 w-3" />;
    default: return <div className="flex gap-0.5"><Mail className="h-3 w-3" /><MessageSquare className="h-3 w-3" /></div>;
  }
};

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("campaigns");

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [channelFilter, setChannelFilter] = useState("all");
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Credits
  const [emailCredits, setEmailCredits] = useState(0);
  const [smsCredits, setSmsCredits] = useState(0);
  const [packages, setPackages] = useState<CreditPkg[]>([]);
  const [transactions, setTransactions] = useState<CreditTx[]>([]);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [creditsLoaded, setCreditsLoaded] = useState(false);

  // Compliance
  const [complianceLoaded, setComplianceLoaded] = useState(false);
  const [complianceData, setComplianceData] = useState<any>(null);
  const [savingCompliance, setSavingCompliance] = useState(false);
  const [complianceForm, setComplianceForm] = useState({
    legalRepresentative: "",
    cui: "",
  });

  const fetchCampaigns = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (typeFilter !== "all") params.set("type", typeFilter);
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (channelFilter !== "all") params.set("channel", channelFilter);

      const res = await fetch(`/api/campaigns?${params.toString()}`);
      if (!res.ok) throw new Error("Eroare la incarcarea campaniilor");
      const data = await res.json();
      setCampaigns(data.campaigns || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [search, typeFilter, statusFilter, channelFilter]);

  const fetchCredits = async () => {
    try {
      const res = await fetch("/api/campaigns/credits");
      if (res.ok) {
        const data = await res.json();
        setEmailCredits(data.emailCredits || 0);
        setSmsCredits(data.smsCredits || 0);
        setPackages(data.packages || []);
        setTransactions(data.transactions || []);
        setCreditsLoaded(true);
      }
    } catch { /* ignore */ }
  };

  useEffect(() => {
    const timeout = setTimeout(fetchCampaigns, 300);
    return () => clearTimeout(timeout);
  }, [fetchCampaigns]);

  useEffect(() => {
    if (activeTab === "credits" && !creditsLoaded) {
      fetchCredits();
    }
    if (activeTab === "compliance" && !complianceLoaded) {
      fetchCompliance();
    }
  }, [activeTab, creditsLoaded, complianceLoaded]);

  const handlePurchase = async (packageId: string) => {
    setPurchasing(packageId);
    try {
      const res = await fetch("/api/campaigns/credits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packageId }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Eroare la achizitie");
      }
      const data = await res.json();
      setEmailCredits(data.emailCredits);
      setSmsCredits(data.smsCredits);
      await fetchCredits(); // Refresh transactions
    } catch (err: any) {
      setError(err.message);
    } finally {
      setPurchasing(null);
    }
  };

  const fetchCompliance = async () => {
    try {
      const res = await fetch("/api/campaigns/compliance");
      if (res.ok) {
        const data = await res.json();
        setComplianceData(data);
        setComplianceForm({
          legalRepresentative: data.legalRepresentative || "",
          cui: data.cui || "",
        });
        setComplianceLoaded(true);
      }
    } catch { /* ignore */ }
  };

  const handleAcceptCompliance = async (fields: { acceptTos?: boolean; acceptGdpr?: boolean; acceptAntiSpam?: boolean }) => {
    setSavingCompliance(true);
    try {
      const res = await fetch("/api/campaigns/compliance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...fields,
          legalRepresentative: complianceForm.legalRepresentative || undefined,
          cui: complianceForm.cui || undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Eroare");
      }
      await fetchCompliance();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSavingCompliance(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Campanii</h1>
          <p className="text-muted-foreground">Campanii email si SMS cu template-uri, AI si credite.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2">
            <div className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 rounded-full">
              <Mail className="h-3.5 w-3.5 text-blue-600" />
              <span className="text-sm font-medium text-blue-700">{emailCredits}</span>
            </div>
            <div className="flex items-center gap-1 px-3 py-1.5 bg-green-50 rounded-full">
              <MessageSquare className="h-3.5 w-3.5 text-green-600" />
              <span className="text-sm font-medium text-green-700">{smsCredits}</span>
            </div>
          </div>
          <Link href="/dashboard/campaigns/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Campanie noua
            </Button>
          </Link>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="campaigns" className="flex items-center gap-2">
            <Send className="h-4 w-4" />
            Campanii
          </TabsTrigger>
          <TabsTrigger value="credits" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Credite &amp; Pachete
          </TabsTrigger>
          <TabsTrigger value="compliance" className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4" />
            Conformitate
          </TabsTrigger>
        </TabsList>

        {/* ═══ Campaigns Tab ═══ */}
        <TabsContent value="campaigns" className="space-y-4 mt-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Cauta campanii..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
                </div>
                <Button variant={filtersOpen ? "secondary" : "outline"} onClick={() => setFiltersOpen(!filtersOpen)}>
                  <Filter className="mr-2 h-4 w-4" />
                  Filtre
                </Button>
              </div>
              {filtersOpen && (
                <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t">
                  <div className="w-48">
                    <Select value={typeFilter} onValueChange={setTypeFilter}>
                      <SelectTrigger><SelectValue placeholder="Tip" /></SelectTrigger>
                      <SelectContent>
                        {TYPE_OPTIONS.map((opt) => (<SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="w-48">
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
                      <SelectContent>
                        {STATUS_OPTIONS.map((opt) => (<SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="w-48">
                    <Select value={channelFilter} onValueChange={setChannelFilter}>
                      <SelectTrigger><SelectValue placeholder="Canal" /></SelectTrigger>
                      <SelectContent>
                        {CHANNEL_OPTIONS.map((opt) => (<SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {error && (
            <Card className="border-destructive">
              <CardContent className="py-4"><p className="text-sm text-destructive">{error}</p></CardContent>
            </Card>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : campaigns.length === 0 ? (
            <Card>
              <CardContent className="py-20 text-center">
                <Mail className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold">Nicio campanie gasita</h3>
                <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
                  {search || typeFilter !== "all"
                    ? "Incercati sa ajustati cautarea sau filtrele."
                    : "Creati prima campanie pentru a interactiona cu donatorii."}
                </p>
                <Link href="/dashboard/campaigns/new">
                  <Button className="mt-4"><Plus className="mr-2 h-4 w-4" />Creeaza campanie</Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {campaigns.map((campaign) => {
                const openRate = campaign.totalSent > 0 ? (campaign.totalOpened / campaign.totalSent) * 100 : 0;
                const clickRate = campaign.totalSent > 0 ? (campaign.totalClicked / campaign.totalSent) * 100 : 0;
                return (
                  <Link key={campaign.id} href={`/dashboard/campaigns/${campaign.id}`}>
                    <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-base truncate">{campaign.name}</CardTitle>
                            <CardDescription className="flex items-center gap-2 mt-1">
                              {channelIcon(campaign.channel)}
                              <span>{campaign.type.replace(/_/g, " ")}</span>
                            </CardDescription>
                          </div>
                          <Badge variant={statusBadgeVariant(campaign.status)}>{campaign.status}</Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {campaign.subject && (
                          <p className="text-sm text-muted-foreground truncate">Subiect: {campaign.subject}</p>
                        )}
                        {campaign.totalSent > 0 ? (
                          <div className="space-y-3">
                            <div className="grid grid-cols-3 gap-2 text-center">
                              <div>
                                <p className="text-lg font-bold">{campaign.totalSent}</p>
                                <p className="text-[10px] text-muted-foreground">Trimise</p>
                              </div>
                              <div>
                                <p className="text-lg font-bold">{openRate.toFixed(1)}%</p>
                                <p className="text-[10px] text-muted-foreground">Deschise</p>
                              </div>
                              <div>
                                <p className="text-lg font-bold">{clickRate.toFixed(1)}%</p>
                                <p className="text-[10px] text-muted-foreground">Click</p>
                              </div>
                            </div>
                            <Progress value={openRate} className="h-1.5" />
                          </div>
                        ) : (
                          <div className="text-center py-2">
                            <p className="text-xs text-muted-foreground">
                              {campaign.recipientCount > 0 ? `${campaign.recipientCount} destinatari` : "Niciun destinatar inca"}
                            </p>
                          </div>
                        )}
                        <div className="flex items-center gap-1 text-xs text-muted-foreground pt-2 border-t">
                          <Calendar className="h-3 w-3" />
                          {campaign.sentAt ? `Trimis ${formatDate(campaign.sentAt)}`
                            : campaign.scheduledAt ? `Programat ${formatDate(campaign.scheduledAt)}`
                            : `Creat ${formatDate(campaign.createdAt)}`}
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* ═══ Credits Tab ═══ */}
        <TabsContent value="credits" className="space-y-6 mt-4">
          {/* Credit Balance */}
          <div className="grid gap-4 sm:grid-cols-2">
            <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-white">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2.5 bg-blue-100 rounded-xl">
                    <Mail className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-blue-700">Credite Email</p>
                    <p className="text-3xl font-bold text-blue-900">{emailCredits}</p>
                  </div>
                </div>
                <p className="text-xs text-blue-600">1 credit = 1 email trimis</p>
              </CardContent>
            </Card>
            <Card className="border-green-200 bg-gradient-to-br from-green-50 to-white">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2.5 bg-green-100 rounded-xl">
                    <MessageSquare className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-green-700">Credite SMS</p>
                    <p className="text-3xl font-bold text-green-900">{smsCredits}</p>
                  </div>
                </div>
                <p className="text-xs text-green-600">1 credit = 1 segment SMS (160 caractere)</p>
              </CardContent>
            </Card>
          </div>

          {/* Packages */}
          <div>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Package className="h-5 w-5 text-indigo-600" />
              Pachete de credite
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {packages.map((pkg) => (
                <Card
                  key={pkg.id}
                  className={`relative transition-all hover:shadow-md ${
                    pkg.popular ? "border-indigo-300 shadow-sm ring-1 ring-indigo-200" : ""
                  }`}
                >
                  {pkg.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="bg-indigo-600 text-white">
                        <Star className="h-3 w-3 mr-1" />
                        Popular
                      </Badge>
                    </div>
                  )}
                  <CardContent className="p-5 pt-6">
                    <div className="flex items-center gap-2 mb-2">
                      {pkg.channel === "EMAIL" && <Mail className="h-4 w-4 text-blue-600" />}
                      {pkg.channel === "SMS" && <MessageSquare className="h-4 w-4 text-green-600" />}
                      {pkg.channel === "BOTH" && <Zap className="h-4 w-4 text-purple-600" />}
                      <h3 className="font-semibold text-sm">{pkg.name}</h3>
                    </div>
                    <p className="text-xs text-muted-foreground mb-3">{pkg.description}</p>
                    <div className="flex items-baseline gap-1 mb-4">
                      <span className="text-2xl font-bold">{pkg.price}</span>
                      <span className="text-sm text-muted-foreground">RON</span>
                    </div>
                    <div className="space-y-1 mb-4 text-xs">
                      {pkg.emailCredits > 0 && (
                        <div className="flex items-center gap-1.5">
                          <CheckCircle2 className="h-3.5 w-3.5 text-blue-600" />
                          <span>{pkg.emailCredits.toLocaleString()} emailuri</span>
                        </div>
                      )}
                      {pkg.smsCredits > 0 && (
                        <div className="flex items-center gap-1.5">
                          <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                          <span>{pkg.smsCredits.toLocaleString()} SMS-uri</span>
                        </div>
                      )}
                    </div>
                    <Button
                      className="w-full"
                      size="sm"
                      variant={pkg.popular ? "default" : "outline"}
                      onClick={() => handlePurchase(pkg.id)}
                      disabled={purchasing === pkg.id}
                    >
                      {purchasing === pkg.id ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-1" />
                      ) : (
                        <CreditCard className="h-4 w-4 mr-1" />
                      )}
                      Achizitioneaza
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Transaction History */}
          {transactions.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <History className="h-5 w-5 text-slate-600" />
                Istoric tranzactii
              </h2>
              <Card>
                <CardContent className="p-0">
                  <div className="divide-y">
                    {transactions.map((tx) => (
                      <div key={tx.id} className="flex items-center gap-3 px-4 py-3">
                        <div className={`p-1.5 rounded-lg ${
                          tx.type === "PURCHASE" ? "bg-green-100" :
                          tx.type === "USAGE" ? "bg-red-100" :
                          tx.type === "BONUS" ? "bg-purple-100" : "bg-slate-100"
                        }`}>
                          {tx.channel === "EMAIL" ? <Mail className="h-3.5 w-3.5" /> : <MessageSquare className="h-3.5 w-3.5" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{tx.description || tx.type}</p>
                          <p className="text-xs text-muted-foreground">{formatDate(tx.createdAt)}</p>
                        </div>
                        <div className="text-right">
                          <p className={`text-sm font-semibold ${tx.amount > 0 ? "text-green-600" : "text-red-600"}`}>
                            {tx.amount > 0 ? "+" : ""}{tx.amount}
                          </p>
                          <p className="text-xs text-muted-foreground">Sold: {tx.balance}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* ═══ Compliance Tab ═══ */}
        <TabsContent value="compliance" className="space-y-6 mt-4">
          {/* Status Banner */}
          {complianceData && (
            <Card className={complianceData.isCompliant ? "border-green-200 bg-green-50/50" : "border-red-200 bg-red-50/50"}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  {complianceData.isCompliant ? (
                    <ShieldCheck className="h-6 w-6 text-green-600" />
                  ) : (
                    <ShieldAlert className="h-6 w-6 text-red-600" />
                  )}
                  <div>
                    <h3 className={`font-semibold ${complianceData.isCompliant ? "text-green-900" : "text-red-900"}`}>
                      {complianceData.isCompliant ? "Organizatia este conforma" : "Conformitate incompleta"}
                    </h3>
                    <p className={`text-sm ${complianceData.isCompliant ? "text-green-700" : "text-red-700"}`}>
                      {complianceData.isCompliant
                        ? "Toate acordurile sunt acceptate. Puteti trimite campanii."
                        : "Acceptati toate acordurile de mai jos pentru a putea trimite campanii."}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* KYC Fields */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-indigo-600" />
                Date organizatie (KYC)
              </CardTitle>
              <CardDescription>Informatii legale necesare pentru conformitate.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Reprezentant legal</label>
                  <Input
                    placeholder="Nume si prenume"
                    value={complianceForm.legalRepresentative}
                    onChange={(e) => setComplianceForm(p => ({ ...p, legalRepresentative: e.target.value }))}
                  />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium">CUI / CIF</label>
                  <Input
                    placeholder="ex. RO12345678"
                    value={complianceForm.cui}
                    onChange={(e) => setComplianceForm(p => ({ ...p, cui: e.target.value }))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* TOS */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {complianceData?.tosAcceptedAt ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-amber-600" />
                )}
                Termeni si Conditii de Utilizare
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="p-4 bg-slate-50 rounded-lg text-sm text-slate-700 space-y-2 mb-4 max-h-[200px] overflow-y-auto">
                <p><strong>1.</strong> Platforma NGO HUB ofera servicii tehnice de trimitere email si SMS. Expeditorul mesajelor este exclusiv organizatia (ONG-ul) care utilizeaza platforma.</p>
                <p><strong>2.</strong> ONG-ul este singurul responsabil pentru continutul mesajelor, obtinerea consimtamantului destinatarilor si respectarea legislatiei GDPR, ePrivacy si anti-spam aplicabile.</p>
                <p><strong>3.</strong> NGO HUB nu raspunde pentru mesajele trimise de ONG, inclusiv reclamatii, spam reports sau sanctiuni legale rezultate din utilizarea platformei.</p>
                <p><strong>4.</strong> ONG-ul garanteaza ca detine consimtamantul explicit al tuturor destinatarilor inaintea trimiterii fiecarei campanii.</p>
                <p><strong>5.</strong> NGO HUB isi rezerva dreptul de a suspenda accesul ONG-urilor care incalca acesti termeni sau care genereaza rate ridicate de reclamatii/bounce.</p>
              </div>
              {complianceData?.tosAcceptedAt ? (
                <p className="text-sm text-green-700 flex items-center gap-1">
                  <CheckCircle2 className="h-4 w-4" />
                  Acceptat la {new Date(complianceData.tosAcceptedAt).toLocaleDateString("ro-RO")}
                </p>
              ) : (
                <Button
                  onClick={() => handleAcceptCompliance({ acceptTos: true })}
                  disabled={savingCompliance}
                >
                  {savingCompliance ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <ShieldCheck className="h-4 w-4 mr-2" />}
                  Accept Termenii si Conditiile
                </Button>
              )}
            </CardContent>
          </Card>

          {/* GDPR */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {complianceData?.gdprAcceptedAt ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-amber-600" />
                )}
                Acord de Prelucrare Date (GDPR / DPA)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="p-4 bg-slate-50 rounded-lg text-sm text-slate-700 space-y-2 mb-4 max-h-[200px] overflow-y-auto">
                <p><strong>1.</strong> NGO HUB prelucreaza datele personale (email, telefon) ale donatorilor exclusiv in calitate de operator imputernicit, la instructiunea ONG-ului.</p>
                <p><strong>2.</strong> ONG-ul ramane operatorul de date si este responsabil pentru informarea persoanelor vizate si obtinerea consimtamantului.</p>
                <p><strong>3.</strong> Datele sunt criptate (AES-256-GCM) in repaus si in tranzit. Accesul este restrictionat prin roluri si permisiuni.</p>
                <p><strong>4.</strong> NGO HUB nu cedeaza, vinde sau partajeaza datele cu terti, cu exceptia furnizorilor de servicii necesare (SendGrid pentru email, Twilio pentru SMS).</p>
                <p><strong>5.</strong> ONG-ul poate solicita stergerea tuturor datelor in conformitate cu dreptul la uitare (Art. 17 GDPR). Anonimizarea este disponibila in platforma.</p>
              </div>
              {complianceData?.gdprAcceptedAt ? (
                <p className="text-sm text-green-700 flex items-center gap-1">
                  <CheckCircle2 className="h-4 w-4" />
                  Acceptat la {new Date(complianceData.gdprAcceptedAt).toLocaleDateString("ro-RO")}
                </p>
              ) : (
                <Button
                  onClick={() => handleAcceptCompliance({ acceptGdpr: true })}
                  disabled={savingCompliance}
                >
                  {savingCompliance ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <ShieldCheck className="h-4 w-4 mr-2" />}
                  Accept Acordul GDPR / DPA
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Anti-Spam */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {complianceData?.antiSpamAcceptedAt ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-amber-600" />
                )}
                Politica Anti-Spam
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="p-4 bg-slate-50 rounded-lg text-sm text-slate-700 space-y-2 mb-4 max-h-[200px] overflow-y-auto">
                <p><strong>1.</strong> ONG-ul se obliga sa trimita mesaje doar catre destinatari care au acordat consimtamantul explicit (opt-in).</p>
                <p><strong>2.</strong> Fiecare mesaj trebuie sa contina un mecanism clar de dezabonare (unsubscribe). Platforma adauga automat link-ul de dezabonare.</p>
                <p><strong>3.</strong> ONG-ul nu va trimite mesaje nesolicitate, continut inselator sau oferte comerciale deghizate in comunicari ale organizatiei.</p>
                <p><strong>4.</strong> Exista limite zilnice de trimitere care cresc gradual pe masura ce organizatia demonstreaza bune practici.</p>
                <p><strong>5.</strong> Incalcarea politicii anti-spam poate duce la suspendarea contului si pierderea creditelor ramase.</p>
              </div>
              {complianceData?.antiSpamAcceptedAt ? (
                <p className="text-sm text-green-700 flex items-center gap-1">
                  <CheckCircle2 className="h-4 w-4" />
                  Acceptat la {new Date(complianceData.antiSpamAcceptedAt).toLocaleDateString("ro-RO")}
                </p>
              ) : (
                <Button
                  onClick={() => handleAcceptCompliance({ acceptAntiSpam: true })}
                  disabled={savingCompliance}
                >
                  {savingCompliance ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <ShieldCheck className="h-4 w-4 mr-2" />}
                  Accept Politica Anti-Spam
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Rate Limits Info */}
          {complianceData && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-slate-600" />
                  Limite zilnice de trimitere
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="p-4 bg-blue-50 rounded-xl">
                    <div className="flex items-center gap-2 mb-2">
                      <Mail className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-900">Email</span>
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-bold text-blue-700">{complianceData.emailsSentToday || 0}</span>
                      <span className="text-sm text-blue-600">/ {complianceData.dailyEmailLimit || 500}</span>
                    </div>
                    <Progress value={((complianceData.emailsSentToday || 0) / (complianceData.dailyEmailLimit || 500)) * 100} className="mt-2 h-1.5" />
                  </div>
                  <div className="p-4 bg-green-50 rounded-xl">
                    <div className="flex items-center gap-2 mb-2">
                      <MessageSquare className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium text-green-900">SMS</span>
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-bold text-green-700">{complianceData.smsSentToday || 0}</span>
                      <span className="text-sm text-green-600">/ {complianceData.dailySmsLimit || 200}</span>
                    </div>
                    <Progress value={((complianceData.smsSentToday || 0) / (complianceData.dailySmsLimit || 200)) * 100} className="mt-2 h-1.5" />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-3">
                  Limitele se reseteaza zilnic. Contactati suportul pentru cresterea limitelor.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

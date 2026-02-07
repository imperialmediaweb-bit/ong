"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCurrency, formatDate, formatDateTime, percentage, getInitials } from "@/lib/utils";
import {
  ArrowLeft,
  Send,
  Eye,
  MousePointerClick,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Pause,
  Play,
  Copy,
  Loader2,
  Mail,
  MessageSquare,
  Users,
  TrendingUp,
  BarChart3,
  Search,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

interface CampaignDetail {
  id: string;
  name: string;
  type: string;
  channel: string;
  status: string;
  subject: string | null;
  emailBody: string | null;
  smsBody: string | null;
  previewText: string | null;
  recipientCount: number;
  totalSent: number;
  totalDelivered: number;
  totalOpened: number;
  totalClicked: number;
  totalBounced: number;
  totalComplaints: number;
  totalUnsubscribed: number;
  scheduledAt: string | null;
  sentAt: string | null;
  completedAt: string | null;
  goalAmount: number | null;
  currentAmount: number;
  createdAt: string;
  updatedAt: string;
}

interface Recipient {
  id: string;
  channel: string;
  address: string;
  status: string;
  deliveredAt: string | null;
  openedAt: string | null;
  clickedAt: string | null;
  bouncedAt: string | null;
  errorMsg: string | null;
  createdAt: string;
  donor: {
    id: string;
    name: string | null;
    email: string | null;
  };
}

const PIE_COLORS = ["#22c55e", "#3b82f6", "#f59e0b", "#ef4444", "#6b7280"];

export default function CampaignDetailPage() {
  const params = useParams();
  const router = useRouter();
  const campaignId = params.id as string;

  const [campaign, setCampaign] = useState<CampaignDetail | null>(null);
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [recipientSearch, setRecipientSearch] = useState("");
  const [recipientStatusFilter, setRecipientStatusFilter] = useState("all");

  const fetchCampaign = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [campaignRes, recipientsRes] = await Promise.all([
        fetch(`/api/campaigns/${campaignId}`),
        fetch(`/api/campaigns/${campaignId}/recipients`),
      ]);
      if (!campaignRes.ok) throw new Error("Failed to fetch campaign");
      const campaignData = await campaignRes.json();
      setCampaign(campaignData);

      if (recipientsRes.ok) {
        const recipientsData = await recipientsRes.json();
        setRecipients(recipientsData.recipients || []);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [campaignId]);

  useEffect(() => {
    fetchCampaign();
  }, [fetchCampaign]);

  const handleAction = async (action: "pause" | "resume" | "duplicate") => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/campaigns/${campaignId}/${action}`, {
        method: "POST",
      });
      if (!res.ok) throw new Error(`Failed to ${action} campaign`);
      if (action === "duplicate") {
        const data = await res.json();
        router.push(`/dashboard/campaigns/${data.id}`);
      } else {
        fetchCampaign();
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !campaign) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Inapoi
        </Button>
        <Card className="max-w-md mx-auto">
          <CardContent className="py-10 text-center">
            <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h3 className="text-lg font-semibold">{error || "Campania nu a fost gasita"}</h3>
            <Link href="/dashboard/campaigns">
              <Button className="mt-4">Inapoi la campanii</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const openRate = campaign.totalSent > 0 ? (campaign.totalOpened / campaign.totalSent) * 100 : 0;
  const clickRate = campaign.totalSent > 0 ? (campaign.totalClicked / campaign.totalSent) * 100 : 0;
  const bounceRate = campaign.totalSent > 0 ? (campaign.totalBounced / campaign.totalSent) * 100 : 0;
  const deliveryRate = campaign.totalSent > 0 ? (campaign.totalDelivered / campaign.totalSent) * 100 : 0;

  const pieData = [
    { name: "Deschis", value: campaign.totalOpened },
    { name: "Click", value: campaign.totalClicked },
    { name: "Doar livrat", value: Math.max(0, campaign.totalDelivered - campaign.totalOpened) },
    { name: "Respins", value: campaign.totalBounced },
    { name: "In asteptare", value: Math.max(0, campaign.totalSent - campaign.totalDelivered - campaign.totalBounced) },
  ].filter((d) => d.value > 0);

  const barData = [
    { name: "Trimis", value: campaign.totalSent },
    { name: "Livrat", value: campaign.totalDelivered },
    { name: "Deschis", value: campaign.totalOpened },
    { name: "Click", value: campaign.totalClicked },
    { name: "Respins", value: campaign.totalBounced },
  ];

  const filteredRecipients = recipients.filter((r) => {
    const matchesSearch =
      !recipientSearch ||
      r.donor.name?.toLowerCase().includes(recipientSearch.toLowerCase()) ||
      r.address.toLowerCase().includes(recipientSearch.toLowerCase());
    const matchesStatus = recipientStatusFilter === "all" || r.status === recipientStatusFilter;
    return matchesSearch && matchesStatus;
  });

  const statusBadgeVariant = (status: string) => {
    switch (status) {
      case "SENT":
      case "DELIVERED":
        return "success" as const;
      case "SENDING":
      case "SCHEDULED":
        return "warning" as const;
      case "PAUSED":
        return "warning" as const;
      case "DRAFT":
        return "secondary" as const;
      case "CANCELLED":
      case "FAILED":
      case "BOUNCED":
        return "destructive" as const;
      case "OPENED":
      case "CLICKED":
        return "default" as const;
      default:
        return "secondary" as const;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">{campaign.name}</h1>
              <Badge variant={statusBadgeVariant(campaign.status)}>{campaign.status}</Badge>
            </div>
            <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
              <span className="flex items-center gap-1">
                {campaign.channel === "EMAIL" ? <Mail className="h-3 w-3" /> : <MessageSquare className="h-3 w-3" />}
                {campaign.channel}
              </span>
              <span>{campaign.type.replace(/_/g, " ")}</span>
              {campaign.sentAt && <span>Trimis {formatDate(campaign.sentAt)}</span>}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          {(campaign.status === "SENDING" || campaign.status === "SCHEDULED") && (
            <Button variant="outline" onClick={() => handleAction("pause")} disabled={actionLoading}>
              <Pause className="mr-2 h-4 w-4" />
              Pauza
            </Button>
          )}
          {campaign.status === "PAUSED" && (
            <Button variant="outline" onClick={() => handleAction("resume")} disabled={actionLoading}>
              <Play className="mr-2 h-4 w-4" />
              Reia
            </Button>
          )}
          <Button variant="outline" onClick={() => handleAction("duplicate")} disabled={actionLoading}>
            <Copy className="mr-2 h-4 w-4" />
            Duplica
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Send className="h-4 w-4" />
              <span className="text-sm">Trimis</span>
            </div>
            <p className="text-2xl font-bold">{campaign.totalSent.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <CheckCircle2 className="h-4 w-4" />
              <span className="text-sm">Livrat</span>
            </div>
            <p className="text-2xl font-bold">{deliveryRate.toFixed(1)}%</p>
            <p className="text-xs text-muted-foreground">{campaign.totalDelivered.toLocaleString()} din {campaign.totalSent.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Eye className="h-4 w-4" />
              <span className="text-sm">Deschis</span>
            </div>
            <p className="text-2xl font-bold">{openRate.toFixed(1)}%</p>
            <p className="text-xs text-muted-foreground">{campaign.totalOpened.toLocaleString()} deschideri</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <MousePointerClick className="h-4 w-4" />
              <span className="text-sm">Click</span>
            </div>
            <p className="text-2xl font-bold">{clickRate.toFixed(1)}%</p>
            <p className="text-xs text-muted-foreground">{campaign.totalClicked.toLocaleString()} clickuri</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <XCircle className="h-4 w-4" />
              <span className="text-sm">Respins</span>
            </div>
            <p className="text-2xl font-bold">{bounceRate.toFixed(1)}%</p>
            <p className="text-xs text-muted-foreground">{campaign.totalBounced.toLocaleString()} respinse</p>
          </CardContent>
        </Card>
      </div>

      {/* Goal Progress */}
      {campaign.goalAmount && campaign.goalAmount > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Progres obiectiv strangere de fonduri</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">
                {formatCurrency(campaign.currentAmount)} strans
              </span>
              <span className="text-sm font-medium">
                Obiectiv: {formatCurrency(campaign.goalAmount)}
              </span>
            </div>
            <Progress
              value={Math.min((campaign.currentAmount / campaign.goalAmount) * 100, 100)}
              className="h-3"
            />
            <p className="text-xs text-muted-foreground mt-1">
              {percentage(campaign.currentAmount, campaign.goalAmount)} din obiectiv atins
            </p>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="performance" className="space-y-4">
        <TabsList>
          <TabsTrigger value="performance" className="gap-1">
            <BarChart3 className="h-3 w-3" />
            Performanta
          </TabsTrigger>
          <TabsTrigger value="recipients" className="gap-1">
            <Users className="h-3 w-3" />
            Destinatari
          </TabsTrigger>
          <TabsTrigger value="content" className="gap-1">
            <Mail className="h-3 w-3" />
            Continut
          </TabsTrigger>
        </TabsList>

        {/* Performance Tab */}
        <TabsContent value="performance">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Palnie livrare</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" fontSize={12} />
                      <YAxis fontSize={12} />
                      <Tooltip />
                      <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Distributie livrare</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  {pieData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={2}
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {pieData.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      Niciun dat de livrare inca
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Additional Stats */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-base">Statistici detaliate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-sm text-muted-foreground">Reclamatii</p>
                    <p className="text-xl font-bold">{campaign.totalComplaints}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-sm text-muted-foreground">Dezabonat</p>
                    <p className="text-xl font-bold">{campaign.totalUnsubscribed}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-sm text-muted-foreground">Destinatari</p>
                    <p className="text-xl font-bold">{campaign.recipientCount}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-sm text-muted-foreground">Venituri</p>
                    <p className="text-xl font-bold text-green-600">{formatCurrency(campaign.currentAmount)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Recipients Tab */}
        <TabsContent value="recipients">
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle className="text-base">Destinatari</CardTitle>
                  <CardDescription>{recipients.length} destinatari in total</CardDescription>
                </div>
                <div className="flex gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Cauta destinatari..."
                      value={recipientSearch}
                      onChange={(e) => setRecipientSearch(e.target.value)}
                      className="pl-9 w-60"
                    />
                  </div>
                  <Select value={recipientStatusFilter} onValueChange={setRecipientStatusFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toate statusurile</SelectItem>
                      <SelectItem value="DELIVERED">Livrat</SelectItem>
                      <SelectItem value="OPENED">Deschis</SelectItem>
                      <SelectItem value="CLICKED">Click</SelectItem>
                      <SelectItem value="BOUNCED">Respins</SelectItem>
                      <SelectItem value="FAILED">Esuat</SelectItem>
                      <SelectItem value="PENDING">In asteptare</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {filteredRecipients.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Niciun destinatar nu corespunde cautarii.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="p-3 text-left font-medium">Destinatar</th>
                        <th className="p-3 text-left font-medium">Adresa</th>
                        <th className="p-3 text-left font-medium">Canal</th>
                        <th className="p-3 text-left font-medium">Status</th>
                        <th className="p-3 text-left font-medium hidden md:table-cell">Livrat</th>
                        <th className="p-3 text-left font-medium hidden lg:table-cell">Deschis</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRecipients.slice(0, 50).map((r) => (
                        <tr key={r.id} className="border-b hover:bg-muted/30">
                          <td className="p-3">
                            <Link
                              href={`/dashboard/donors/${r.donor.id}`}
                              className="flex items-center gap-2 hover:underline"
                            >
                              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-medium shrink-0">
                                {r.donor.name ? getInitials(r.donor.name) : "?"}
                              </div>
                              <span className="font-medium truncate max-w-[150px]">
                                {r.donor.name || "Necunoscut"}
                              </span>
                            </Link>
                          </td>
                          <td className="p-3 text-muted-foreground">{r.address}</td>
                          <td className="p-3">
                            <Badge variant="outline">{r.channel}</Badge>
                          </td>
                          <td className="p-3">
                            <Badge variant={statusBadgeVariant(r.status)}>{r.status}</Badge>
                          </td>
                          <td className="p-3 hidden md:table-cell text-muted-foreground">
                            {r.deliveredAt ? formatDateTime(r.deliveredAt) : "-"}
                          </td>
                          <td className="p-3 hidden lg:table-cell text-muted-foreground">
                            {r.openedAt ? formatDateTime(r.openedAt) : "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {filteredRecipients.length > 50 && (
                    <p className="text-sm text-muted-foreground text-center py-3 border-t">
                      Se afiseaza 50 din {filteredRecipients.length} destinatari
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Content Tab */}
        <TabsContent value="content">
          <div className="space-y-4">
            {campaign.subject && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Subiect email</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="font-medium">{campaign.subject}</p>
                  {campaign.previewText && (
                    <p className="text-sm text-muted-foreground mt-1">{campaign.previewText}</p>
                  )}
                </CardContent>
              </Card>
            )}
            {campaign.emailBody && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Corpul emailului</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="border rounded-lg p-4 bg-white">
                    <div
                      dangerouslySetInnerHTML={{ __html: campaign.emailBody }}
                      className="prose prose-sm max-w-none"
                    />
                  </div>
                </CardContent>
              </Card>
            )}
            {campaign.smsBody && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Mesaj SMS</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-muted p-4 rounded-lg max-w-sm">
                    <p className="text-sm">{campaign.smsBody}</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

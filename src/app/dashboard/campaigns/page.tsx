"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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
  BarChart3,
  Calendar,
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
    case "DRAFT":
      return "secondary" as const;
    case "SCHEDULED":
      return "warning" as const;
    case "SENDING":
      return "default" as const;
    case "SENT":
      return "success" as const;
    case "PAUSED":
      return "warning" as const;
    case "CANCELLED":
      return "destructive" as const;
    default:
      return "secondary" as const;
  }
};

const channelIcon = (channel: string) => {
  switch (channel) {
    case "EMAIL":
      return <Mail className="h-3 w-3" />;
    case "SMS":
      return <MessageSquare className="h-3 w-3" />;
    default:
      return (
        <div className="flex gap-0.5">
          <Mail className="h-3 w-3" />
          <MessageSquare className="h-3 w-3" />
        </div>
      );
  }
};

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [channelFilter, setChannelFilter] = useState("all");
  const [filtersOpen, setFiltersOpen] = useState(false);

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
      if (!res.ok) throw new Error("Failed to fetch campaigns");
      const data = await res.json();
      setCampaigns(data.campaigns || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [search, typeFilter, statusFilter, channelFilter]);

  useEffect(() => {
    const timeout = setTimeout(fetchCampaigns, 300);
    return () => clearTimeout(timeout);
  }, [fetchCampaigns]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Campanii</h1>
          <p className="text-muted-foreground">Creeaza si gestioneaza campanii email si SMS.</p>
        </div>
        <Link href="/dashboard/campaigns/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Campanie noua
          </Button>
        </Link>
      </div>

      {/* Search & Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cauta campanii..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button
              variant={filtersOpen ? "secondary" : "outline"}
              onClick={() => setFiltersOpen(!filtersOpen)}
            >
              <Filter className="mr-2 h-4 w-4" />
              Filtre
            </Button>
          </div>
          {filtersOpen && (
            <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t">
              <div className="w-48">
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tip" />
                  </SelectTrigger>
                  <SelectContent>
                    {TYPE_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-48">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-48">
                <Select value={channelFilter} onValueChange={setChannelFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Canal" />
                  </SelectTrigger>
                  <SelectContent>
                    {CHANNEL_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Error */}
      {error && (
        <Card className="border-destructive">
          <CardContent className="py-4">
            <p className="text-sm text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Campaign Grid */}
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
              <Button className="mt-4">
                <Plus className="mr-2 h-4 w-4" />
                Creeaza campanie
              </Button>
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
                      <Badge variant={statusBadgeVariant(campaign.status)}>
                        {campaign.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {campaign.subject && (
                      <p className="text-sm text-muted-foreground truncate">
                        Subiect: {campaign.subject}
                      </p>
                    )}

                    {/* Stats */}
                    {campaign.totalSent > 0 ? (
                      <div className="space-y-3">
                        <div className="grid grid-cols-3 gap-2 text-center">
                          <div>
                            <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                              <Send className="h-3 w-3" />
                            </div>
                            <p className="text-lg font-bold">{campaign.totalSent}</p>
                            <p className="text-[10px] text-muted-foreground">Trimise</p>
                          </div>
                          <div>
                            <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                              <Eye className="h-3 w-3" />
                            </div>
                            <p className="text-lg font-bold">{openRate.toFixed(1)}%</p>
                            <p className="text-[10px] text-muted-foreground">Deschise</p>
                          </div>
                          <div>
                            <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                              <MousePointerClick className="h-3 w-3" />
                            </div>
                            <p className="text-lg font-bold">{clickRate.toFixed(1)}%</p>
                            <p className="text-[10px] text-muted-foreground">Click</p>
                          </div>
                        </div>
                        <Progress value={openRate} className="h-1.5" />
                      </div>
                    ) : (
                      <div className="text-center py-2">
                        <p className="text-xs text-muted-foreground">
                          {campaign.recipientCount > 0
                            ? `${campaign.recipientCount} destinatari`
                            : "Niciun destinatar inca"}
                        </p>
                      </div>
                    )}

                    {/* Date */}
                    <div className="flex items-center gap-1 text-xs text-muted-foreground pt-2 border-t">
                      <Calendar className="h-3 w-3" />
                      {campaign.sentAt
                        ? `Trimis ${formatDate(campaign.sentAt)}`
                        : campaign.scheduledAt
                        ? `Programat pentru ${formatDate(campaign.scheduledAt)}`
                        : `Creat ${formatDate(campaign.createdAt)}`}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

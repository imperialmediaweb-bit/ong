"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  Send,
  Eye,
  MousePointerClick,
  Users,
  Loader2,
  ArrowUpRight,
  Calendar,
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

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ period });
      const res = await fetch(`/api/analytics?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch analytics");
      const data = await res.json();

      setSummary(data.summary || null);
      setSendsOverTime(data.sendsOverTime || []);
      setCampaignPerformance(data.campaignPerformance || []);
      setDonationsByCampaign(data.donationsByCampaign || []);
      setDonorGrowth(data.donorGrowth || []);
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analitica</h1>
          <p className="text-muted-foreground">
            Performanta campaniilor, perspective si tendinte.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-40">
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

      {error && (
        <Card className="border-destructive">
          <CardContent className="py-4">
            <p className="text-sm text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Summary Cards */}
      {summary && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
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
                    <th className="p-3 text-left font-medium">Tip</th>
                    <th className="p-3 text-right font-medium">Trimise</th>
                    <th className="p-3 text-right font-medium">Rata deschidere</th>
                    <th className="p-3 text-right font-medium">Rata click</th>
                    <th className="p-3 text-right font-medium hidden md:table-cell">Donatii</th>
                    <th className="p-3 text-right font-medium hidden md:table-cell">Venituri</th>
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
                          <Badge variant="secondary" className="text-xs">
                            {camp.type.replace(/_/g, " ")}
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
                        <td className="p-3 text-right font-medium hidden md:table-cell">
                          {formatCurrency(camp.revenue)}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

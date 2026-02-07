"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils";
import {
  Search,
  Filter,
  Loader2,
  Heart,
  ChevronLeft,
  ChevronRight,
  Download,
  Calendar,
  DollarSign,
  TrendingUp,
  X,
} from "lucide-react";

interface Donation {
  id: string;
  donorId: string;
  donorName: string | null;
  donorEmail: string | null;
  amount: number;
  currency: string;
  campaignId: string | null;
  campaignName: string | null;
  status: string;
  paymentMethod: string | null;
  transactionId: string | null;
  createdAt: string;
}

interface DonationsResponse {
  donations: Donation[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  totalAmount: number;
}

const STATUS_OPTIONS = [
  { value: "all", label: "All Statuses" },
  { value: "COMPLETED", label: "Completed" },
  { value: "PENDING", label: "Pending" },
  { value: "FAILED", label: "Failed" },
  { value: "REFUNDED", label: "Refunded" },
];

const statusBadgeVariant = (status: string) => {
  switch (status) {
    case "COMPLETED":
      return "success" as const;
    case "PENDING":
      return "warning" as const;
    case "FAILED":
      return "destructive" as const;
    case "REFUNDED":
      return "secondary" as const;
    default:
      return "secondary" as const;
  }
};

export default function DonationsPage() {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [campaignFilter, setCampaignFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 25;

  const fetchDonations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (campaignFilter) params.set("campaign", campaignFilter);
      if (dateFrom) params.set("dateFrom", dateFrom);
      if (dateTo) params.set("dateTo", dateTo);
      params.set("page", page.toString());
      params.set("pageSize", pageSize.toString());

      const res = await fetch(`/api/donations?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch donations");
      const data: DonationsResponse = await res.json();
      setDonations(data.donations || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 0);
      setTotalAmount(data.totalAmount || 0);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, campaignFilter, dateFrom, dateTo, page]);

  useEffect(() => {
    const timeout = setTimeout(fetchDonations, 300);
    return () => clearTimeout(timeout);
  }, [fetchDonations]);

  const handleExport = async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (campaignFilter) params.set("campaign", campaignFilter);
      if (dateFrom) params.set("dateFrom", dateFrom);
      if (dateTo) params.set("dateTo", dateTo);
      params.set("format", "csv");

      const res = await fetch(`/api/donations/export?${params.toString()}`);
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "donations-export.csv";
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setCampaignFilter("");
    setDateFrom("");
    setDateTo("");
    setPage(1);
  };

  const hasActiveFilters = search || statusFilter !== "all" || campaignFilter || dateFrom || dateTo;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Donations</h1>
          <p className="text-muted-foreground">
            Track and manage all donations.{" "}
            {total > 0 && `${total} donation${total !== 1 ? "s" : ""} totaling ${formatCurrency(totalAmount)}.`}
          </p>
        </div>
        <Button variant="outline" onClick={handleExport}>
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Donations</p>
                <p className="text-2xl font-bold">{total.toLocaleString()}</p>
              </div>
              <Heart className="h-8 w-8 text-muted-foreground/30" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Amount</p>
                <p className="text-2xl font-bold">{formatCurrency(totalAmount)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-muted-foreground/30" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Average Donation</p>
                <p className="text-2xl font-bold">
                  {total > 0 ? formatCurrency(totalAmount / total) : formatCurrency(0)}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-muted-foreground/30" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search & Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by donor name, email..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-9"
              />
            </div>
            <Button
              variant={filtersOpen ? "secondary" : "outline"}
              onClick={() => setFiltersOpen(!filtersOpen)}
            >
              <Filter className="mr-2 h-4 w-4" />
              Filters
              {hasActiveFilters && (
                <Badge variant="default" className="ml-2 h-5 min-w-5 rounded-full p-0 text-[10px] flex items-center justify-center">
                  !
                </Badge>
              )}
            </Button>
          </div>
          {filtersOpen && (
            <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t items-end">
              <div className="w-48">
                <Label className="text-xs mb-1 block">Status</Label>
                <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-48">
                <Label className="text-xs mb-1 block">Campaign</Label>
                <Input
                  placeholder="Campaign name..."
                  value={campaignFilter}
                  onChange={(e) => { setCampaignFilter(e.target.value); setPage(1); }}
                />
              </div>
              <div className="w-40">
                <Label className="text-xs mb-1 block">From Date</Label>
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
                />
              </div>
              <div className="w-40">
                <Label className="text-xs mb-1 block">To Date</Label>
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
                />
              </div>
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  <X className="mr-1 h-3 w-3" />
                  Clear All
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {error && (
        <Card className="border-destructive">
          <CardContent className="py-4">
            <p className="text-sm text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Donations Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : donations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Heart className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">No donations found</h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                {hasActiveFilters
                  ? "Try adjusting your search or filters."
                  : "Donations will appear here once they are recorded."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="p-3 text-left font-medium">Date</th>
                    <th className="p-3 text-left font-medium">Donor</th>
                    <th className="p-3 text-right font-medium">Amount</th>
                    <th className="p-3 text-left font-medium">Currency</th>
                    <th className="p-3 text-left font-medium hidden md:table-cell">Campaign</th>
                    <th className="p-3 text-left font-medium">Status</th>
                    <th className="p-3 text-left font-medium hidden lg:table-cell">Payment</th>
                  </tr>
                </thead>
                <tbody>
                  {donations.map((donation) => (
                    <tr key={donation.id} className="border-b hover:bg-muted/30 transition-colors">
                      <td className="p-3 text-muted-foreground whitespace-nowrap">
                        {formatDateTime(donation.createdAt)}
                      </td>
                      <td className="p-3">
                        <div>
                          <p className="font-medium">{donation.donorName || "Anonymous"}</p>
                          {donation.donorEmail && (
                            <p className="text-xs text-muted-foreground">{donation.donorEmail}</p>
                          )}
                        </div>
                      </td>
                      <td className="p-3 text-right font-bold">
                        {formatCurrency(donation.amount, donation.currency)}
                      </td>
                      <td className="p-3">
                        <Badge variant="outline" className="text-xs">
                          {donation.currency}
                        </Badge>
                      </td>
                      <td className="p-3 hidden md:table-cell text-muted-foreground max-w-[180px] truncate">
                        {donation.campaignName || "-"}
                      </td>
                      <td className="p-3">
                        <Badge variant={statusBadgeVariant(donation.status)}>
                          {donation.status}
                        </Badge>
                      </td>
                      <td className="p-3 hidden lg:table-cell text-muted-foreground">
                        {donation.paymentMethod || "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t">
              <p className="text-sm text-muted-foreground">
                Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, total)} of {total}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {page} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage(page + 1)}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

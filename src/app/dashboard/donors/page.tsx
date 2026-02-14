"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
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
import { formatCurrency, formatDate, getInitials } from "@/lib/utils";
import { PageHelp } from "@/components/ui/page-help";
import {
  Search,
  Plus,
  Download,
  Trash2,
  Tag,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Filter,
  X,
  Loader2,
  Users,
  MoreHorizontal,
} from "lucide-react";
import { useForm } from "react-hook-form";

interface Donor {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  status: string;
  totalDonated: number;
  donationCount: number;
  lastDonationAt: string | null;
  createdAt: string;
  preferredChannel: string;
  emailConsent: boolean;
  smsConsent: boolean;
  tags: { tag: { id: string; name: string; color: string } }[];
}

interface DonorsResponse {
  donors: Donor[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

interface AddDonorForm {
  name: string;
  email: string;
  phone: string;
  preferredChannel: string;
  emailConsent: boolean;
  smsConsent: boolean;
  privacyConsent: boolean;
}

const STATUS_OPTIONS = [
  { value: "all", label: "Toate statusurile" },
  { value: "ACTIVE", label: "Activ" },
  { value: "INACTIVE", label: "Inactiv" },
  { value: "UNSUBSCRIBED", label: "Dezabonat" },
];

const CHANNEL_OPTIONS = [
  { value: "all", label: "Toate canalele" },
  { value: "EMAIL", label: "Email" },
  { value: "SMS", label: "SMS" },
  { value: "BOTH", label: "Ambele" },
];

const statusBadgeVariant = (status: string) => {
  switch (status) {
    case "ACTIVE":
      return "success" as const;
    case "INACTIVE":
      return "warning" as const;
    case "UNSUBSCRIBED":
      return "destructive" as const;
    default:
      return "secondary" as const;
  }
};

export default function DonorsPage() {
  const router = useRouter();

  const [donors, setDonors] = useState<Donor[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [channelFilter, setChannelFilter] = useState("all");
  const [sortField, setSortField] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const [selectedDonors, setSelectedDonors] = useState<Set<string>>(new Set());
  const [addDialogOpen, setAddDialogOpen] = useState(
    false
  );
  const [addLoading, setAddLoading] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AddDonorForm>({
    defaultValues: {
      preferredChannel: "EMAIL",
      emailConsent: false,
      smsConsent: false,
      privacyConsent: false,
    },
  });

  const fetchDonors = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (channelFilter !== "all") params.set("channel", channelFilter);
      params.set("sort", sortField);
      params.set("order", sortOrder);
      params.set("page", page.toString());
      params.set("pageSize", pageSize.toString());

      const res = await fetch(`/api/donors?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch donors");
      const data = await res.json();
      setDonors(data.data || []);
      setTotal(data.pagination?.total || 0);
      setTotalPages(data.pagination?.totalPages || 0);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, channelFilter, sortField, sortOrder, page]);

  useEffect(() => {
    const timeout = setTimeout(fetchDonors, 300);
    return () => clearTimeout(timeout);
  }, [fetchDonors]);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
    setPage(1);
  };

  const toggleSelectAll = () => {
    if (selectedDonors.size === donors.length) {
      setSelectedDonors(new Set());
    } else {
      setSelectedDonors(new Set(donors.map((d) => d.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selectedDonors);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedDonors(next);
  };

  const handleAddDonor = async (data: AddDonorForm) => {
    setAddLoading(true);
    try {
      const res = await fetch("/api/donors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to add donor");
      }
      setAddDialogOpen(false);
      reset();
      fetchDonors();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setAddLoading(false);
    }
  };

  const handleBulkExport = async () => {
    const ids = Array.from(selectedDonors);
    try {
      const res = await fetch("/api/donors/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ donorIds: ids }),
      });
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "donors-export.csv";
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Sunteti sigur ca doriti sa stergeti ${selectedDonors.size} donator(i)? Aceasta actiune nu poate fi anulata.`)) return;
    const ids = Array.from(selectedDonors);
    try {
      const res = await fetch("/api/donors/bulk", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ donorIds: ids }),
      });
      if (!res.ok) throw new Error("Bulk delete failed");
      setSelectedDonors(new Set());
      fetchDonors();
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 p-8 text-white shadow-xl">
        <div className="absolute inset-0 opacity-10">
          <svg className="h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <pattern id="donors-grid" width="10" height="10" patternUnits="userSpaceOnUse">
                <path d="M 10 0 L 0 0 0 10" fill="none" stroke="white" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100" height="100" fill="url(#donors-grid)" />
          </svg>
        </div>
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
              <Users className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Donatori</h1>
              <p className="text-white/70 mt-1">
                Gestioneaza baza de date a donatorilor. {total > 0 && `${total} donator${total !== 1 ? "i" : ""} in total.`}
              </p>
            </div>
          </div>
          <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-white/20 hover:bg-white/30 text-white border-0 backdrop-blur-sm">
                <Plus className="mr-2 h-4 w-4" />
                Adauga donator
              </Button>
            </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <form onSubmit={handleSubmit(handleAddDonor)}>
              <DialogHeader>
                <DialogTitle>Adauga donator nou</DialogTitle>
                <DialogDescription>
                  Inregistreaza un donator nou in CRM. Va primi o confirmare de consimtamant.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Nume complet</Label>
                  <Input
                    id="name"
                    placeholder="John Doe"
                    {...register("name", { required: "Numele este obligatoriu" })}
                  />
                  {errors.name && (
                    <p className="text-xs text-destructive">{errors.name.message}</p>
                  )}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="john@example.com"
                    {...register("email", { required: "Email-ul este obligatoriu" })}
                  />
                  {errors.email && (
                    <p className="text-xs text-destructive">{errors.email.message}</p>
                  )}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="phone">Telefon</Label>
                  <Input
                    id="phone"
                    placeholder="+40 712 345 678"
                    {...register("phone")}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="channel">Canal preferat</Label>
                  <select
                    id="channel"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    {...register("preferredChannel")}
                  >
                    <option value="EMAIL">Email</option>
                    <option value="SMS">SMS</option>
                    <option value="BOTH">Ambele</option>
                  </select>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="emailConsent" {...register("emailConsent")} className="rounded" />
                    <Label htmlFor="emailConsent" className="text-sm">Consimtamant marketing email</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="smsConsent" {...register("smsConsent")} className="rounded" />
                    <Label htmlFor="smsConsent" className="text-sm">Consimtamant marketing SMS</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="privacyConsent"
                      {...register("privacyConsent", { required: "Consimtamantul pentru confidentialitate este obligatoriu" })}
                      className="rounded"
                    />
                    <Label htmlFor="privacyConsent" className="text-sm">Consimtamant politica de confidentialitate *</Label>
                  </div>
                  {errors.privacyConsent && (
                    <p className="text-xs text-destructive">{errors.privacyConsent.message}</p>
                  )}
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setAddDialogOpen(false)}>
                  Anuleaza
                </Button>
                <Button type="submit" disabled={addLoading}>
                  {addLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Adauga donator
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Search & Filters */}
      <Card className="border-0 shadow-lg">
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cauta dupa nume, email sau telefon..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-9"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={filtersOpen ? "secondary" : "outline"}
                onClick={() => setFiltersOpen(!filtersOpen)}
              >
                <Filter className="mr-2 h-4 w-4" />
                Filtre
                {(statusFilter !== "all" || channelFilter !== "all") && (
                  <Badge variant="default" className="ml-2 h-5 w-5 rounded-full p-0 text-[10px] flex items-center justify-center">
                    {(statusFilter !== "all" ? 1 : 0) + (channelFilter !== "all" ? 1 : 0)}
                  </Badge>
                )}
              </Button>
            </div>
          </div>

          {filtersOpen && (
            <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t">
              <div className="w-48">
                <Label className="text-xs mb-1 block">Status</Label>
                <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-48">
                <Label className="text-xs mb-1 block">Channel</Label>
                <Select value={channelFilter} onValueChange={(v) => { setChannelFilter(v); setPage(1); }}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CHANNEL_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setStatusFilter("all");
                    setChannelFilter("all");
                    setSearch("");
                    setPage(1);
                  }}
                >
                  <X className="mr-1 h-3 w-3" />
                  Sterge toate
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedDonors.size > 0 && (
        <Card>
          <CardContent className="py-3">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium">
                {selectedDonors.size} donator{selectedDonors.size !== 1 ? "i" : ""} selectat{selectedDonors.size !== 1 ? "i" : ""}
              </span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleBulkExport}>
                  <Download className="mr-1 h-3 w-3" />
                  Exporta
                </Button>
                <Button variant="outline" size="sm">
                  <Tag className="mr-1 h-3 w-3" />
                  Eticheta
                </Button>
                <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
                  <Trash2 className="mr-1 h-3 w-3" />
                  Sterge
                </Button>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedDonors(new Set())}
                className="ml-auto"
              >
                Anuleaza selectia
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error State */}
      {error && (
        <Card className="border-destructive">
          <CardContent className="py-4">
            <p className="text-sm text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Table */}
      <Card className="border-0 shadow-lg">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : donors.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Users className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">Niciun donator gasit</h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                {search || statusFilter !== "all"
                  ? "Incercati sa ajustati cautarea sau filtrele."
                  : "Adaugati primul donator pentru a incepe."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gradient-to-r from-emerald-50 to-teal-50">
                    <th className="p-3 w-10">
                      <Checkbox
                        checked={selectedDonors.size === donors.length && donors.length > 0}
                        onCheckedChange={toggleSelectAll}
                      />
                    </th>
                    <th className="p-3 text-left">
                      <button
                        className="flex items-center gap-1 font-medium hover:text-foreground"
                        onClick={() => handleSort("name")}
                      >
                        Nume
                        <ArrowUpDown className="h-3 w-3" />
                      </button>
                    </th>
                    <th className="p-3 text-left hidden md:table-cell">Email</th>
                    <th className="p-3 text-left hidden lg:table-cell">Telefon</th>
                    <th className="p-3 text-left">
                      <button
                        className="flex items-center gap-1 font-medium hover:text-foreground"
                        onClick={() => handleSort("status")}
                      >
                        Status
                        <ArrowUpDown className="h-3 w-3" />
                      </button>
                    </th>
                    <th className="p-3 text-right">
                      <button
                        className="flex items-center gap-1 font-medium hover:text-foreground ml-auto"
                        onClick={() => handleSort("totalDonated")}
                      >
                        Total donat
                        <ArrowUpDown className="h-3 w-3" />
                      </button>
                    </th>
                    <th className="p-3 text-left hidden xl:table-cell">
                      <button
                        className="flex items-center gap-1 font-medium hover:text-foreground"
                        onClick={() => handleSort("lastDonationAt")}
                      >
                        Ultima donatie
                        <ArrowUpDown className="h-3 w-3" />
                      </button>
                    </th>
                    <th className="p-3 text-left hidden lg:table-cell">Etichete</th>
                    <th className="p-3 w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {donors.map((donor) => (
                    <tr
                      key={donor.id}
                      className="border-b hover:bg-muted/30 transition-colors cursor-pointer"
                      onClick={() => router.push(`/dashboard/donors/${donor.id}`)}
                    >
                      <td className="p-3" onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={selectedDonors.has(donor.id)}
                          onCheckedChange={() => toggleSelect(donor.id)}
                        />
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-medium shrink-0">
                            {donor.name ? getInitials(donor.name) : "?"}
                          </div>
                          <span className="font-medium truncate max-w-[150px]">
                            {donor.name || "Necunoscut"}
                          </span>
                        </div>
                      </td>
                      <td className="p-3 hidden md:table-cell text-muted-foreground">
                        {donor.email || "-"}
                      </td>
                      <td className="p-3 hidden lg:table-cell text-muted-foreground">
                        {donor.phone || "-"}
                      </td>
                      <td className="p-3">
                        <Badge variant={statusBadgeVariant(donor.status)}>
                          {donor.status}
                        </Badge>
                      </td>
                      <td className="p-3 text-right font-medium">
                        {formatCurrency(donor.totalDonated)}
                      </td>
                      <td className="p-3 hidden xl:table-cell text-muted-foreground">
                        {donor.lastDonationAt ? formatDate(donor.lastDonationAt) : "Niciodata"}
                      </td>
                      <td className="p-3 hidden lg:table-cell">
                        <div className="flex flex-wrap gap-1">
                          {donor.tags?.slice(0, 3).map((ta) => (
                            <Badge
                              key={ta.tag.id}
                              variant="outline"
                              className="text-[10px]"
                              style={{ borderColor: ta.tag.color, color: ta.tag.color }}
                            >
                              {ta.tag.name}
                            </Badge>
                          ))}
                          {donor.tags?.length > 3 && (
                            <Badge variant="outline" className="text-[10px]">
                              +{donor.tags.length - 3}
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="p-3" onClick={(e) => e.stopPropagation()}>
                        <Link href={`/dashboard/donors/${donor.id}`}>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </Link>
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
                Se afiseaza {(page - 1) * pageSize + 1} pana la{" "}
                {Math.min(page * pageSize, total)} din {total}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Anterioara
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    let pageNum: number;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (page <= 3) {
                      pageNum = i + 1;
                    } else if (page >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = page - 2 + i;
                    }
                    return (
                      <Button
                        key={pageNum}
                        variant={page === pageNum ? "default" : "outline"}
                        size="sm"
                        className="w-9"
                        onClick={() => setPage(pageNum)}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage(page + 1)}
                >
                  Urmatoarea
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <PageHelp items={[
        { title: "Adauga donator", description: "Butonul + adauga manual un donator nou cu email, telefon si consimtaminte GDPR." },
        { title: "Filtre", description: "Filtreaza dupa status (Activ, Inactiv, Dezabonat) sau cauta dupa nume/email." },
        { title: "Tag-uri", description: "Atribuie tag-uri donatorilor pentru segmentare in campanii (ex: corporate, recurent)." },
        { title: "Click pe donator", description: "Deschide profilul complet: istoric donatii, consimtaminte, mesaje primite." },
        { title: "Status donator", description: "ACTIV = primeste mesaje, INACTIV = nu a donat recent, DEZABONAT = nu mai doreste comunicari." },
      ]} />
    </div>
  );
}

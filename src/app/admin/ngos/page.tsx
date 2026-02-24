"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Search, ChevronLeft, ChevronRight, Pencil, Power, Eye } from "lucide-react";
import { useSession } from "next-auth/react";

interface Ngo {
  id: string;
  name: string;
  slug: string;
  plan: string;
  isActive: boolean;
  verificationStatus: string;
  donorCount: number;
  totalDonations: number;
  createdAt: string;
}

export default function AdminNgosPage() {
  const router = useRouter();
  const { update: updateSession } = useSession();
  const [ngos, setNgos] = useState<Ngo[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [verificationFilter, setVerificationFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchNgos();
  }, [page, planFilter, statusFilter, verificationFilter]);

  const fetchNgos = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
      });
      if (planFilter !== "all") params.set("plan", planFilter);
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (verificationFilter !== "all") params.set("verificationStatus", verificationFilter);
      if (search) params.set("search", search);

      const res = await fetch(`/api/admin/ngos?${params}`);
      const data = await res.json();
      setNgos(data.ngos || []);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(1);
    fetchNgos();
  };

  const handleToggleStatus = async (ngoId: string, currentActive: boolean) => {
    try {
      await fetch(`/api/admin/ngos/${ngoId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !currentActive }),
      });
      fetchNgos();
    } catch (err) {
      console.error(err);
    }
  };

  const handleImpersonate = async (ngoId: string) => {
    try {
      const res = await fetch("/api/admin/impersonate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ngoId }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Eroare la impersonare");
        return;
      }
      await updateSession({
        impersonateNgoId: data.ngoId,
        impersonateNgoName: data.ngoName,
        impersonateNgoSlug: data.ngoSlug,
        impersonateNgoLogoUrl: data.ngoLogoUrl,
      });
      router.push("/dashboard");
    } catch (err) {
      console.error(err);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("ro-RO", {
      style: "currency",
      currency: "RON",
    }).format(amount);
  };

  const planColors: Record<string, string> = {
    BASIC: "bg-slate-100 text-slate-800",
    PRO: "bg-blue-100 text-blue-800",
    ELITE: "bg-purple-100 text-purple-800",
  };

  const verificationColors: Record<string, string> = {
    PENDING: "bg-yellow-100 text-yellow-800",
    APPROVED: "bg-green-100 text-green-800",
    REJECTED: "bg-red-100 text-red-800",
  };

  const verificationLabels: Record<string, string> = {
    PENDING: "In asteptare",
    APPROVED: "Aprobat",
    REJECTED: "Respins",
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">ONG-uri</h1>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1 flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cauta dupa nume sau slug..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  className="pl-9"
                />
              </div>
              <Button onClick={handleSearch} variant="secondary">
                Cauta
              </Button>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Select value={planFilter} onValueChange={(v) => { setPlanFilter(v); setPage(1); }}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Plan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toate</SelectItem>
                  <SelectItem value="BASIC">BASIC</SelectItem>
                  <SelectItem value="PRO">PRO</SelectItem>
                  <SelectItem value="ELITE">ELITE</SelectItem>
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toate</SelectItem>
                  <SelectItem value="active">Activ</SelectItem>
                  <SelectItem value="inactive">Inactiv</SelectItem>
                </SelectContent>
              </Select>

              <Select value={verificationFilter} onValueChange={(v) => { setVerificationFilter(v); setPage(1); }}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Verificare" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toate</SelectItem>
                  <SelectItem value="PENDING">In asteptare</SelectItem>
                  <SelectItem value="APPROVED">Aprobat</SelectItem>
                  <SelectItem value="REJECTED">Respins</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">Se incarca...</div>
          ) : ngos.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">Niciun ONG gasit</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50 text-left text-muted-foreground">
                    <th className="p-3 font-medium">Nume</th>
                    <th className="p-3 font-medium">Slug</th>
                    <th className="p-3 font-medium">Plan</th>
                    <th className="p-3 font-medium">Status</th>
                    <th className="p-3 font-medium">Verificare</th>
                    <th className="p-3 font-medium text-right">Donatori</th>
                    <th className="p-3 font-medium text-right">Donatii total</th>
                    <th className="p-3 font-medium">Data inregistrarii</th>
                    <th className="p-3 font-medium">Actiuni</th>
                  </tr>
                </thead>
                <tbody>
                  {ngos.map((ngo) => (
                    <tr
                      key={ngo.id}
                      className="border-b hover:bg-muted/30 cursor-pointer"
                      onClick={() => router.push(`/admin/ngos/${ngo.id}`)}
                    >
                      <td className="p-3 font-medium">{ngo.name}</td>
                      <td className="p-3 text-muted-foreground">{ngo.slug}</td>
                      <td className="p-3">
                        <Badge className={planColors[ngo.plan] || planColors.BASIC}>
                          {ngo.plan}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <Badge variant={ngo.isActive ? "success" : "secondary"}>
                          {ngo.isActive ? "Activ" : "Inactiv"}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <Badge className={verificationColors[ngo.verificationStatus] || verificationColors.PENDING}>
                          {verificationLabels[ngo.verificationStatus] || ngo.verificationStatus}
                        </Badge>
                      </td>
                      <td className="p-3 text-right">{ngo.donorCount}</td>
                      <td className="p-3 text-right">{formatCurrency(ngo.totalDonations)}</td>
                      <td className="p-3 text-muted-foreground">
                        {new Date(ngo.createdAt).toLocaleDateString("ro-RO")}
                      </td>
                      <td className="p-3">
                        <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push(`/admin/ngos/${ngo.id}`)}
                          >
                            <Pencil className="h-3.5 w-3.5 mr-1" />
                            Editeaza
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleImpersonate(ngo.id)}
                            className="text-amber-600 hover:text-amber-700"
                          >
                            <Eye className="h-3.5 w-3.5 mr-1" />
                            Vizualizeaza
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleStatus(ngo.id, ngo.isActive)}
                            className={ngo.isActive ? "text-red-600 hover:text-red-700" : "text-green-600 hover:text-green-700"}
                          >
                            <Power className="h-3.5 w-3.5 mr-1" />
                            {ngo.isActive ? "Dezactiveaza" : "Activeaza"}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground">
            Pagina {page} din {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage(page + 1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}

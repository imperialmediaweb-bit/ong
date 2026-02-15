"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatCurrency, formatDate, getInitials } from "@/lib/utils";
import { PlanGate } from "@/components/dashboard/plan-gate";
import {
  Search,
  Plus,
  Building2,
  Phone,
  Mail,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Heart,
  ArrowUpDown,
  TrendingUp,
  Users,
  ExternalLink,
} from "lucide-react";

interface Company {
  id: string;
  name: string | null;
  companyName: string | null;
  companyCui: string | null;
  companyAddress: string | null;
  contactPerson: string | null;
  email: string | null;
  phone: string | null;
  status: string;
  totalDonated: number;
  donationCount: number;
  lastDonationAt: string | null;
  createdAt: string;
  tags: { tag: { id: string; name: string; color: string } }[];
  donations: {
    id: string;
    amount: number;
    currency: string;
    status: string;
    createdAt: string;
    campaign: { name: string } | null;
  }[];
}

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [sortBy, setSortBy] = useState("totalDonated");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [addOpen, setAddOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newCompany, setNewCompany] = useState({
    companyName: "",
    companyCui: "",
    companyAddress: "",
    contactPerson: "",
    email: "",
    phone: "",
  });

  const fetchCompanies = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
        donorType: "COMPANY",
        sortBy,
        sortOrder,
      });
      if (search) params.set("search", search);
      const res = await fetch(`/api/donors?${params}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setCompanies(data.data || []);
      setTotalPages(data.pagination?.totalPages || 1);
      setTotal(data.pagination?.total || 0);
    } catch {
      setCompanies([]);
    } finally {
      setLoading(false);
    }
  }, [page, search, sortBy, sortOrder]);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  const handleAddCompany = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/donors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newCompany.contactPerson || newCompany.companyName,
          email: newCompany.email,
          phone: newCompany.phone,
          donorType: "COMPANY",
          companyName: newCompany.companyName,
          companyCui: newCompany.companyCui,
          companyAddress: newCompany.companyAddress,
          contactPerson: newCompany.contactPerson,
          preferredChannel: "EMAIL",
          privacyConsent: true,
        }),
      });
      if (!res.ok) throw new Error("Failed to add company");
      setAddOpen(false);
      setNewCompany({ companyName: "", companyCui: "", companyAddress: "", contactPerson: "", email: "", phone: "" });
      fetchCompanies();
    } catch {
      // error handled silently
    } finally {
      setSaving(false);
    }
  };

  const toggleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
  };

  const totalDonatedAll = companies.reduce((sum, c) => sum + c.totalDonated, 0);

  return (
    <PlanGate
      requiredPlan="ELITE"
      featureName="Firme & Sponsori CRM"
      featureDescription="Gestioneaza relatiile cu firmele sponsoare, urmareste donatiile corporate si dezvolta parteneriate strategice."
      features={[
        { icon: Building2, title: "CRM Corporate", description: "Baza de date dedicata pentru firme, cu detalii de contact si istoric.", iconBg: "bg-blue-100", iconColor: "text-blue-600" },
        { icon: TrendingUp, title: "Tracking Donatii", description: "Urmareste donatiile si sponsorizarile de la fiecare firma.", iconBg: "bg-green-100", iconColor: "text-green-600" },
        { icon: Users, title: "Contacte Multiple", description: "Gestioneaza mai multe persoane de contact per firma.", iconBg: "bg-purple-100", iconColor: "text-purple-600" },
      ]}
    >
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Building2 className="h-6 w-6 text-indigo-600" />
            Firme &amp; Sponsori
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Gestioneaza companiile si sponsorii care sustin organizatia ta
          </p>
        </div>
        <Button onClick={() => setAddOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Adauga firma
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-50">
              <Building2 className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{total}</p>
              <p className="text-xs text-muted-foreground">Firme inregistrate</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-50">
              <TrendingUp className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{formatCurrency(totalDonatedAll, "RON")}</p>
              <p className="text-xs text-muted-foreground">Total donat (pagina curenta)</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-50">
              <Heart className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {companies.reduce((sum, c) => sum + c.donationCount, 0)}
              </p>
              <p className="text-xs text-muted-foreground">Donatii totale</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search + Sort */}
      <div className="flex gap-3 items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cauta dupa nume firma, CUI, persoana contact..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-10"
          />
        </div>
        <Button variant="outline" size="sm" onClick={() => toggleSort("totalDonated")}>
          <ArrowUpDown className="h-4 w-4 mr-1" />
          Suma {sortBy === "totalDonated" ? (sortOrder === "desc" ? "↓" : "↑") : ""}
        </Button>
        <Button variant="outline" size="sm" onClick={() => toggleSort("createdAt")}>
          <ArrowUpDown className="h-4 w-4 mr-1" />
          Data {sortBy === "createdAt" ? (sortOrder === "desc" ? "↓" : "↑") : ""}
        </Button>
      </div>

      {/* Companies list */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : companies.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Building2 className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="font-semibold text-lg mb-1">Nicio firma inregistrata</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Adauga prima firma sau sponsor care sustine organizatia ta.
            </p>
            <Button onClick={() => setAddOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Adauga firma
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {companies.map((company) => (
            <Card key={company.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 font-bold text-sm shrink-0">
                      {getInitials(company.companyName || company.name || "?")}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/dashboard/donors/${company.id}`}
                          className="font-semibold text-base hover:text-indigo-600 transition-colors"
                        >
                          {company.companyName || company.name || "Fara nume"}
                        </Link>
                        <Badge variant={company.status === "ACTIVE" ? "success" : "secondary"} className="text-xs">
                          {company.status === "ACTIVE" ? "Activ" : company.status}
                        </Badge>
                      </div>
                      {company.companyCui && (
                        <p className="text-xs text-muted-foreground mt-0.5">CUI: {company.companyCui}</p>
                      )}
                      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-muted-foreground">
                        {company.contactPerson && (
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {company.contactPerson}
                          </span>
                        )}
                        {company.email && (
                          <span className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {company.email}
                          </span>
                        )}
                        {company.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {company.phone}
                          </span>
                        )}
                        {company.companyAddress && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {company.companyAddress}
                          </span>
                        )}
                      </div>
                      {/* Tags */}
                      {company.tags.length > 0 && (
                        <div className="flex gap-1 mt-2">
                          {company.tags.map((t) => (
                            <Badge key={t.tag.id} variant="outline" className="text-[10px]" style={{ borderColor: t.tag.color, color: t.tag.color }}>
                              {t.tag.name}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="text-lg font-bold text-emerald-600">
                      {formatCurrency(company.totalDonated, "RON")}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {company.donationCount} donati{company.donationCount === 1 ? "e" : "i"}
                    </p>
                    {company.lastDonationAt && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Ultima: {formatDate(company.lastDonationAt)}
                      </p>
                    )}
                    <Link href={`/dashboard/donors/${company.id}`}>
                      <Button variant="ghost" size="sm" className="mt-1 gap-1 text-xs">
                        <ExternalLink className="h-3 w-3" />
                        Detalii
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <p className="text-sm text-muted-foreground">
                {total} firme gasite
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="flex items-center text-sm px-2">
                  {page} / {totalPages}
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
            </div>
          )}
        </div>
      )}

      {/* Add Company Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Adauga firma noua
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid gap-2">
              <Label>Numele firmei *</Label>
              <Input
                placeholder="SC Exemplu SRL"
                value={newCompany.companyName}
                onChange={(e) => setNewCompany({ ...newCompany, companyName: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>CUI</Label>
                <Input
                  placeholder="RO12345678"
                  value={newCompany.companyCui}
                  onChange={(e) => setNewCompany({ ...newCompany, companyCui: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label>Persoana de contact</Label>
                <Input
                  placeholder="Ion Popescu"
                  value={newCompany.contactPerson}
                  onChange={(e) => setNewCompany({ ...newCompany, contactPerson: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  placeholder="contact@firma.ro"
                  value={newCompany.email}
                  onChange={(e) => setNewCompany({ ...newCompany, email: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label>Telefon</Label>
                <Input
                  placeholder="+40 700 000 000"
                  value={newCompany.phone}
                  onChange={(e) => setNewCompany({ ...newCompany, phone: e.target.value })}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Adresa</Label>
              <Input
                placeholder="Str. Exemplu, Nr. 1, Bucuresti"
                value={newCompany.companyAddress}
                onChange={(e) => setNewCompany({ ...newCompany, companyAddress: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Anuleaza</Button>
            <Button onClick={handleAddCompany} disabled={saving || !newCompany.companyName}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
              Adauga firma
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
    </PlanGate>
  );
}

"use client";

import { useState, useEffect } from "react";
import { PageHelp } from "@/components/ui/page-help";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  FileText,
  Copy,
  ExternalLink,
  Loader2,
  CheckCircle2,
  Building,
  TrendingUp,
  Calendar,
  Briefcase,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { formatCurrency, formatDate } from "@/lib/utils";

interface Contract {
  id: string;
  companyName: string;
  companyCui: string;
  amount: number;
  currency: string;
  contractNumber: string;
  status: string;
  purpose: string | null;
  createdAt: string;
  contractDate: string;
}

const STATUS_MAP: Record<string, { label: string; variant: "default" | "secondary" | "success" | "warning" | "destructive" | "outline" }> = {
  DRAFT: { label: "Ciorna", variant: "secondary" },
  SENT: { label: "Trimis", variant: "warning" },
  SIGNED: { label: "Semnat", variant: "default" },
  ACTIVE: { label: "Activ", variant: "success" },
  COMPLETED: { label: "Finalizat", variant: "outline" },
  CANCELLED: { label: "Anulat", variant: "destructive" },
};

export default function ContracteDashboardPage() {
  const { data: session } = useSession();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const ngoSlug = (session?.user as any)?.ngoSlug || "";

  useEffect(() => {
    fetchContracts();
  }, []);

  const fetchContracts = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/contracte");
      if (!res.ok) throw new Error("Eroare la incarcarea contractelor");
      const data = await res.json();
      setContracts(data.contracts || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const publicUrl =
    typeof window !== "undefined" && ngoSlug
      ? `${window.location.origin}/s/${ngoSlug}/contract-sponsorizare`
      : "";

  const handleCopy = () => {
    if (publicUrl) {
      navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Stats
  const totalContracts = contracts.length;
  const totalAmount = contracts.reduce((sum, c) => sum + c.amount, 0);
  const activeContracts = contracts.filter(
    (c) => c.status === "ACTIVE" || c.status === "SIGNED"
  ).length;

  const getStatusBadge = (status: string) => {
    const info = STATUS_MAP[status] || { label: status, variant: "outline" as const };
    return <Badge variant={info.variant}>{info.label}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Contracte de Sponsorizare</h1>
        <p className="text-muted-foreground">
          Gestioneaza contractele de sponsorizare si trimite link-ul companiilor.
        </p>
      </div>

      {/* Share Link Card */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Link public pentru contracte
          </CardTitle>
          <CardDescription>
            Trimite acest link companiilor care doresc sa te sponsorizeze. Ele vor completa datele
            firmei si contractul se va genera automat.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {ngoSlug ? (
            <div className="flex gap-2">
              <Input
                value={publicUrl}
                readOnly
                className="bg-background font-mono text-sm"
              />
              <Button variant="outline" onClick={handleCopy} className="shrink-0">
                {copied ? (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4 text-green-600" />
                    Copiat!
                  </>
                ) : (
                  <>
                    <Copy className="mr-2 h-4 w-4" />
                    Copiaza
                  </>
                )}
              </Button>
              <Button asChild variant="outline" className="shrink-0">
                <a href={publicUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Deschide
                </a>
              </Button>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Configurati slug-ul organizatiei in Setari pentru a genera link-ul public.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total contracte</p>
                <p className="text-2xl font-bold">{totalContracts}</p>
              </div>
              <Briefcase className="h-8 w-8 text-muted-foreground/30" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Valoare totala</p>
                <p className="text-2xl font-bold">{formatCurrency(totalAmount)}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-muted-foreground/30" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Contracte active</p>
                <p className="text-2xl font-bold">{activeContracts}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-muted-foreground/30" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Error state */}
      {error && (
        <Card className="border-destructive">
          <CardContent className="py-4">
            <p className="text-sm text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Contracts Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista contractelor</CardTitle>
          <CardDescription>
            Toate contractele de sponsorizare generate prin platforma.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : contracts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center px-4">
              <Building className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">Niciun contract inca</h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                Contractele generate de companii vor aparea aici. Trimite link-ul public companiilor
                care doresc sa te sponsorizeze.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="p-3 text-left font-medium">Nr. Contract</th>
                    <th className="p-3 text-left font-medium">Companie</th>
                    <th className="p-3 text-left font-medium hidden md:table-cell">CUI</th>
                    <th className="p-3 text-right font-medium">Suma</th>
                    <th className="p-3 text-left font-medium hidden lg:table-cell">Scop</th>
                    <th className="p-3 text-left font-medium">Data</th>
                    <th className="p-3 text-left font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {contracts.map((contract) => (
                    <tr
                      key={contract.id}
                      className="border-b hover:bg-muted/30 transition-colors"
                    >
                      <td className="p-3">
                        <span className="font-mono text-xs bg-muted px-2 py-1 rounded">
                          {contract.contractNumber}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <Building className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <span className="font-medium">{contract.companyName}</span>
                        </div>
                      </td>
                      <td className="p-3 hidden md:table-cell text-muted-foreground">
                        {contract.companyCui}
                      </td>
                      <td className="p-3 text-right font-bold">
                        {formatCurrency(contract.amount, contract.currency)}
                      </td>
                      <td className="p-3 hidden lg:table-cell text-muted-foreground max-w-[200px] truncate">
                        {contract.purpose || "-"}
                      </td>
                      <td className="p-3 text-muted-foreground whitespace-nowrap">
                        {formatDate(contract.contractDate || contract.createdAt)}
                      </td>
                      <td className="p-3">{getStatusBadge(contract.status)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <PageHelp items={[
        { title: "Ce sunt contractele", description: "Contracte de sponsorizare generate automat care pot fi trimise companiilor pentru semnare." },
        { title: "Contract nou", description: "Completeaza datele companiei (nume, CUI, suma, scop) si genereaza un contract cu link public." },
        { title: "Link public", description: "Copiaza link-ul si trimite-l companiei — pot completa si semna contractul online." },
        { title: "Status", description: "DRAFT = ciorna, SENT = trimis, SIGNED = semnat, ACTIVE = activ, COMPLETED = finalizat, CANCELLED = anulat." },
        { title: "Statistici", description: "Vezi totalul contractelor, suma totala si numarul de contracte active." },
      ]} />
    </div>
  );
}

"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatDateTime } from "@/lib/utils";
import {
  Shield,
  FileText,
  Download,
  Trash2,
  Loader2,
  Search,
  Save,
  AlertTriangle,
  CheckCircle2,
  Clock,
  User,
  Eye,
  ScrollText,
} from "lucide-react";

interface ConsentText {
  id: string;
  type: string;
  text: string;
  version: number;
  isActive: boolean;
  updatedAt: string;
}

interface AuditEvent {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  userId: string | null;
  userName: string | null;
  details: string | null;
  ipAddress: string | null;
  createdAt: string;
}

const CONSENT_TYPES = [
  { value: "EMAIL_MARKETING", label: "Marketing email" },
  { value: "SMS_MARKETING", label: "Marketing SMS" },
  { value: "DATA_PROCESSING", label: "Procesare date" },
  { value: "PRIVACY_POLICY", label: "Politica de confidentialitate" },
  { value: "TERMS_OF_SERVICE", label: "Termeni si conditii" },
  { value: "COOKIE_POLICY", label: "Politica cookie" },
];

const AUDIT_ACTION_FILTER = [
  { value: "all", label: "Toate actiunile" },
  { value: "DONOR_CREATED", label: "Donator creat" },
  { value: "DONOR_UPDATED", label: "Donator actualizat" },
  { value: "DONOR_DELETED", label: "Donator sters" },
  { value: "DATA_EXPORTED", label: "Date exportate" },
  { value: "DATA_ANONYMIZED", label: "Date anonimizate" },
  { value: "CONSENT_UPDATED", label: "Consimtamant actualizat" },
  { value: "LOGIN", label: "Autentificare" },
];

const actionBadgeVariant = (action: string) => {
  if (action.includes("DELETE") || action.includes("ANONYMIZE")) return "destructive" as const;
  if (action.includes("CREATE") || action.includes("LOGIN")) return "success" as const;
  if (action.includes("EXPORT")) return "warning" as const;
  return "secondary" as const;
};

export default function PrivacyPage() {
  const [activeTab, setActiveTab] = useState("consent");

  // Consent state
  const [consentTexts, setConsentTexts] = useState<ConsentText[]>([]);
  const [consentLoading, setConsentLoading] = useState(true);
  const [consentSaving, setConsentSaving] = useState<string | null>(null);
  const [editingConsent, setEditingConsent] = useState<Record<string, string>>({});

  // Export state
  const [exportEmail, setExportEmail] = useState("");
  const [exportLoading, setExportLoading] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);

  // Deletion state
  const [deleteEmail, setDeleteEmail] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteSuccess, setDeleteSuccess] = useState(false);
  const [donorPreview, setDonorPreview] = useState<{ id: string; name: string; email: string } | null>(null);
  const [searchingDonor, setSearchingDonor] = useState(false);

  // Audit state
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditFilter, setAuditFilter] = useState("all");
  const [auditSearch, setAuditSearch] = useState("");

  const [error, setError] = useState<string | null>(null);

  // Fetch consent texts
  const fetchConsentTexts = useCallback(async () => {
    setConsentLoading(true);
    try {
      const res = await fetch("/api/consent");
      if (!res.ok) throw new Error("Failed to fetch consent texts");
      const data = await res.json();
      setConsentTexts(data.consentTexts || []);
      const editing: Record<string, string> = {};
      (data.consentTexts || []).forEach((ct: ConsentText) => {
        editing[ct.id] = ct.text;
      });
      setEditingConsent(editing);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setConsentLoading(false);
    }
  }, []);

  // Fetch audit log
  const fetchAuditLog = useCallback(async () => {
    setAuditLoading(true);
    try {
      const params = new URLSearchParams();
      if (auditFilter !== "all") params.set("action", auditFilter);
      if (auditSearch) params.set("search", auditSearch);
      const res = await fetch(`/api/audit?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch audit log");
      const data = await res.json();
      setAuditEvents(data.events || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setAuditLoading(false);
    }
  }, [auditFilter, auditSearch]);

  useEffect(() => {
    if (activeTab === "consent") fetchConsentTexts();
    if (activeTab === "audit") fetchAuditLog();
  }, [activeTab, fetchConsentTexts, fetchAuditLog]);

  const handleSaveConsent = async (consentId: string) => {
    setConsentSaving(consentId);
    setError(null);
    try {
      const res = await fetch(`/api/consent/${consentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: editingConsent[consentId] }),
      });
      if (!res.ok) throw new Error("Failed to save consent text");
      fetchConsentTexts();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setConsentSaving(null);
    }
  };

  const handleSearchDonorForExport = async () => {
    if (!exportEmail.trim()) return;
    setExportSuccess(false);
    setExportLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/privacy/export?email=${encodeURIComponent(exportEmail)}`);
      if (!res.ok) throw new Error("Failed to export donor data");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `donor-data-${exportEmail}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setExportSuccess(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setExportLoading(false);
    }
  };

  const handleSearchDonorForDelete = async () => {
    if (!deleteEmail.trim()) return;
    setSearchingDonor(true);
    setDonorPreview(null);
    setDeleteSuccess(false);
    setError(null);
    try {
      const res = await fetch(`/api/donors?search=${encodeURIComponent(deleteEmail)}&pageSize=1`);
      if (!res.ok) throw new Error("Failed to search donor");
      const data = await res.json();
      if (data.donors && data.donors.length > 0) {
        const d = data.donors[0];
        setDonorPreview({ id: d.id, name: d.name || "Necunoscut", email: d.email || deleteEmail });
      } else {
        setError("Niciun donator gasit cu aceasta adresa de email.");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSearchingDonor(false);
    }
  };

  const handleAnonymizeDonor = async () => {
    if (!donorPreview) return;
    setDeleteLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/privacy/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ donorId: donorPreview.id }),
      });
      if (!res.ok) throw new Error("Failed to anonymize donor data");
      setDeleteSuccess(true);
      setDeleteConfirmOpen(false);
      setDonorPreview(null);
      setDeleteEmail("");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Shield className="h-8 w-8 text-primary" />
          Confidentialitate si GDPR
        </h1>
        <p className="text-muted-foreground">
          Gestioneaza consimtamantul, protectia datelor si conformitate.
        </p>
      </div>

      {error && (
        <Card className="border-destructive">
          <CardContent className="py-4">
            <p className="text-sm text-destructive">{error}</p>
            <Button variant="ghost" size="sm" className="mt-2" onClick={() => setError(null)}>
              Inchide
            </Button>
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="consent" className="gap-1">
            <FileText className="h-3 w-3" />
            Texte consimtamant
          </TabsTrigger>
          <TabsTrigger value="export" className="gap-1">
            <Download className="h-3 w-3" />
            Exporta date
          </TabsTrigger>
          <TabsTrigger value="delete" className="gap-1">
            <Trash2 className="h-3 w-3" />
            Stergere date
          </TabsTrigger>
          <TabsTrigger value="audit" className="gap-1">
            <ScrollText className="h-3 w-3" />
            Jurnal audit
          </TabsTrigger>
        </TabsList>

        {/* Consent Texts Tab */}
        <TabsContent value="consent" className="space-y-4">
          {consentLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : consentTexts.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold">Niciun text de consimtamant configurat</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Textele de consimtamant vor aparea aici odata configurate de sistem.
                </p>
              </CardContent>
            </Card>
          ) : (
            consentTexts.map((ct) => (
              <Card key={ct.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base">
                        {CONSENT_TYPES.find((t) => t.value === ct.type)?.label || ct.type}
                      </CardTitle>
                      <CardDescription>
                        Versiunea {ct.version} - Ultima actualizare {formatDateTime(ct.updatedAt)}
                      </CardDescription>
                    </div>
                    <Badge variant={ct.isActive ? "success" : "secondary"}>
                      {ct.isActive ? "Activ" : "Inactiv"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <Textarea
                    className="min-h-[120px]"
                    value={editingConsent[ct.id] || ""}
                    onChange={(e) =>
                      setEditingConsent((prev) => ({ ...prev, [ct.id]: e.target.value }))
                    }
                  />
                </CardContent>
                <CardFooter className="border-t pt-4">
                  <Button
                    onClick={() => handleSaveConsent(ct.id)}
                    disabled={consentSaving === ct.id || editingConsent[ct.id] === ct.text}
                  >
                    {consentSaving === ct.id ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="mr-2 h-4 w-4" />
                    )}
                    Salveaza modificarile
                  </Button>
                </CardFooter>
              </Card>
            ))
          )}
        </TabsContent>

        {/* Data Export Tab */}
        <TabsContent value="export">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5" />
                Exporta date donator
              </CardTitle>
              <CardDescription>
                Cauta un donator dupa email si exporta toate datele personale conform GDPR Articolul 20 (Dreptul la portabilitatea datelor).
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-3 max-w-lg">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="donor@example.com"
                    value={exportEmail}
                    onChange={(e) => {
                      setExportEmail(e.target.value);
                      setExportSuccess(false);
                    }}
                    className="pl-9"
                  />
                </div>
                <Button
                  onClick={handleSearchDonorForExport}
                  disabled={exportLoading || !exportEmail.trim()}
                >
                  {exportLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="mr-2 h-4 w-4" />
                  )}
                  Exporta date
                </Button>
              </div>
              {exportSuccess && (
                <div className="flex items-center gap-2 text-green-600 text-sm">
                  <CheckCircle2 className="h-4 w-4" />
                  Date exportate cu succes. Descarcarea ar fi trebuit sa inceapa.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Data Deletion Tab */}
        <TabsContent value="delete">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trash2 className="h-5 w-5 text-destructive" />
                Stergere / Anonimizare date
              </CardTitle>
              <CardDescription>
                Cauta un donator si anonimizeaza datele personale conform GDPR Articolul 17 (Dreptul la stergere). Aceasta actiune este ireversibila.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-3 max-w-lg">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="donor@example.com"
                    value={deleteEmail}
                    onChange={(e) => {
                      setDeleteEmail(e.target.value);
                      setDonorPreview(null);
                      setDeleteSuccess(false);
                    }}
                    className="pl-9"
                  />
                </div>
                <Button
                  variant="outline"
                  onClick={handleSearchDonorForDelete}
                  disabled={searchingDonor || !deleteEmail.trim()}
                >
                  {searchingDonor ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="mr-2 h-4 w-4" />
                  )}
                  Cauta donator
                </Button>
              </div>

              {donorPreview && (
                <div className="p-4 border rounded-lg bg-muted/30 max-w-lg">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                      <User className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium">{donorPreview.name}</p>
                      <p className="text-sm text-muted-foreground">{donorPreview.email}</p>
                    </div>
                  </div>
                  <Button
                    variant="destructive"
                    className="mt-4"
                    onClick={() => setDeleteConfirmOpen(true)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Anonimizeaza acest donator
                  </Button>
                </div>
              )}

              {deleteSuccess && (
                <div className="flex items-center gap-2 text-green-600 text-sm">
                  <CheckCircle2 className="h-4 w-4" />
                  Datele donatorului au fost anonimizate cu succes.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Confirmation Dialog */}
          <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-destructive">
                  <AlertTriangle className="h-5 w-5" />
                  Confirma anonimizarea datelor
                </DialogTitle>
                <DialogDescription>
                  Aceasta va anonimiza permanent toate datele personale pentru{" "}
                  <strong>{donorPreview?.name}</strong> ({donorPreview?.email}). Numele, emailul,
                  telefonul si alte informatii de identificare vor fi inlocuite cu valori anonimizate.
                  Aceasta actiune nu poate fi anulata.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>
                  Anuleaza
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleAnonymizeDonor}
                  disabled={deleteLoading}
                >
                  {deleteLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="mr-2 h-4 w-4" />
                  )}
                  Da, anonimizeaza datele
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* Audit Log Tab */}
        <TabsContent value="audit" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ScrollText className="h-5 w-5" />
                Jurnal audit
              </CardTitle>
              <CardDescription>
                Jurnal complet al accesului si modificarilor datelor pentru conformitate GDPR.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Cauta dupa utilizator, entitate sau detalii..."
                    value={auditSearch}
                    onChange={(e) => setAuditSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select value={auditFilter} onValueChange={setAuditFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {AUDIT_ACTION_FILTER.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button variant="outline" onClick={fetchAuditLog} disabled={auditLoading}>
                  {auditLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="mr-2 h-4 w-4" />
                  )}
                  Cauta
                </Button>
              </div>
            </CardContent>
          </Card>

          {auditLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : auditEvents.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <ScrollText className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">Nicio inregistrare audit gasita.</p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="p-3 text-left font-medium">Data</th>
                        <th className="p-3 text-left font-medium">Actiune</th>
                        <th className="p-3 text-left font-medium">Utilizator</th>
                        <th className="p-3 text-left font-medium hidden md:table-cell">Entitate</th>
                        <th className="p-3 text-left font-medium hidden lg:table-cell">Detalii</th>
                        <th className="p-3 text-left font-medium hidden lg:table-cell">IP</th>
                      </tr>
                    </thead>
                    <tbody>
                      {auditEvents.map((event) => (
                        <tr key={event.id} className="border-b hover:bg-muted/30 transition-colors">
                          <td className="p-3 text-muted-foreground whitespace-nowrap">
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatDateTime(event.createdAt)}
                            </div>
                          </td>
                          <td className="p-3">
                            <Badge variant={actionBadgeVariant(event.action)} className="text-xs">
                              {event.action.replace(/_/g, " ")}
                            </Badge>
                          </td>
                          <td className="p-3">
                            {event.userName || event.userId || "Sistem"}
                          </td>
                          <td className="p-3 hidden md:table-cell text-muted-foreground">
                            {event.entityType} {event.entityId ? `#${event.entityId.slice(0, 8)}` : ""}
                          </td>
                          <td className="p-3 hidden lg:table-cell text-muted-foreground max-w-[200px] truncate">
                            {event.details || "-"}
                          </td>
                          <td className="p-3 hidden lg:table-cell text-muted-foreground">
                            {event.ipAddress || "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

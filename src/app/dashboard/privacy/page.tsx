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
  { value: "EMAIL_MARKETING", label: "Email Marketing" },
  { value: "SMS_MARKETING", label: "SMS Marketing" },
  { value: "DATA_PROCESSING", label: "Data Processing" },
  { value: "PRIVACY_POLICY", label: "Privacy Policy" },
  { value: "TERMS_OF_SERVICE", label: "Terms of Service" },
  { value: "COOKIE_POLICY", label: "Cookie Policy" },
];

const AUDIT_ACTION_FILTER = [
  { value: "all", label: "All Actions" },
  { value: "DONOR_CREATED", label: "Donor Created" },
  { value: "DONOR_UPDATED", label: "Donor Updated" },
  { value: "DONOR_DELETED", label: "Donor Deleted" },
  { value: "DATA_EXPORTED", label: "Data Exported" },
  { value: "DATA_ANONYMIZED", label: "Data Anonymized" },
  { value: "CONSENT_UPDATED", label: "Consent Updated" },
  { value: "LOGIN", label: "Login" },
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
        setDonorPreview({ id: d.id, name: d.name || "Unknown", email: d.email || deleteEmail });
      } else {
        setError("No donor found with that email address.");
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
          GDPR & Privacy
        </h1>
        <p className="text-muted-foreground">
          Manage consent texts, data exports, data deletion, and audit logs.
        </p>
      </div>

      {error && (
        <Card className="border-destructive">
          <CardContent className="py-4">
            <p className="text-sm text-destructive">{error}</p>
            <Button variant="ghost" size="sm" className="mt-2" onClick={() => setError(null)}>
              Dismiss
            </Button>
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="consent" className="gap-1">
            <FileText className="h-3 w-3" />
            Consent Texts
          </TabsTrigger>
          <TabsTrigger value="export" className="gap-1">
            <Download className="h-3 w-3" />
            Data Export
          </TabsTrigger>
          <TabsTrigger value="delete" className="gap-1">
            <Trash2 className="h-3 w-3" />
            Data Deletion
          </TabsTrigger>
          <TabsTrigger value="audit" className="gap-1">
            <ScrollText className="h-3 w-3" />
            Audit Log
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
                <h3 className="text-lg font-semibold">No consent texts configured</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Consent texts will appear here once configured by the system.
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
                        Version {ct.version} - Last updated {formatDateTime(ct.updatedAt)}
                      </CardDescription>
                    </div>
                    <Badge variant={ct.isActive ? "success" : "secondary"}>
                      {ct.isActive ? "Active" : "Inactive"}
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
                    Save Changes
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
                Export Donor Data
              </CardTitle>
              <CardDescription>
                Search for a donor by email and export all their personal data as required by GDPR Article 20 (Right to Data Portability).
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
                  Export Data
                </Button>
              </div>
              {exportSuccess && (
                <div className="flex items-center gap-2 text-green-600 text-sm">
                  <CheckCircle2 className="h-4 w-4" />
                  Data exported successfully. The download should have started.
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
                Data Deletion / Anonymization
              </CardTitle>
              <CardDescription>
                Search for a donor and anonymize their personal data as required by GDPR Article 17 (Right to Erasure). This action is irreversible.
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
                  Search Donor
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
                    Anonymize This Donor
                  </Button>
                </div>
              )}

              {deleteSuccess && (
                <div className="flex items-center gap-2 text-green-600 text-sm">
                  <CheckCircle2 className="h-4 w-4" />
                  Donor data has been anonymized successfully.
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
                  Confirm Data Anonymization
                </DialogTitle>
                <DialogDescription>
                  This will permanently anonymize all personal data for{" "}
                  <strong>{donorPreview?.name}</strong> ({donorPreview?.email}). Their name, email,
                  phone, and other identifying information will be replaced with anonymized values.
                  This action cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>
                  Cancel
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
                  Yes, Anonymize Data
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
                Audit Log
              </CardTitle>
              <CardDescription>
                Complete log of data access and modifications for GDPR compliance.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by user, entity, or details..."
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
                  Search
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
                <p className="text-sm text-muted-foreground">No audit events found.</p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="p-3 text-left font-medium">Timestamp</th>
                        <th className="p-3 text-left font-medium">Action</th>
                        <th className="p-3 text-left font-medium">User</th>
                        <th className="p-3 text-left font-medium hidden md:table-cell">Entity</th>
                        <th className="p-3 text-left font-medium hidden lg:table-cell">Details</th>
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
                            {event.userName || event.userId || "System"}
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

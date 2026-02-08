"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Building, Search, Plus, Upload, Sparkles, Mail, Phone,
  Loader2, X, ChevronRight, ChevronLeft, Users, MessageCircle,
  Calendar, Clock, TrendingUp, ExternalLink, Linkedin,
  FileText, Send, Trash2, Edit, Eye, Star, AlertTriangle,
  CheckCircle2, XCircle, ArrowRight, RefreshCw, Copy, MoreHorizontal,
} from "lucide-react";

// ─── Types ─────────────────────────────────────────

interface SponsorCompany {
  id: string;
  name: string;
  domain?: string | null;
  website?: string | null;
  industry?: string | null;
  city?: string | null;
  country: string;
  status: string;
  tags: string[];
  notes?: string | null;
  lastContactedAt?: string | null;
  nextFollowupAt?: string | null;
  createdAt: string;
  _count?: { contacts: number; interactions: number };
  aiMatches?: { score: number }[];
  contacts?: SponsorContact[];
  interactions?: SponsorInteraction[];
}

interface SponsorContact {
  id: string;
  fullName: string;
  role?: string | null;
  email?: string | null;
  phone?: string | null;
  linkedinUrl?: string | null;
  status: string;
  notes?: string | null;
  dncFlag: boolean;
  createdAt: string;
}

interface SponsorInteraction {
  id: string;
  type: string;
  subject?: string | null;
  body?: string | null;
  createdBy?: string | null;
  createdAt: string;
  contact?: { fullName: string; role?: string | null } | null;
}

interface AiMatch {
  score: number;
  reasons: string[];
  angle?: string;
}

interface EmailVariant {
  tone: string;
  subject: string;
  body: string;
}

// ─── Helpers ───────────────────────────────────────

const STATUS_LABELS: Record<string, string> = {
  NEW: "Nou",
  CONTACTED: "Contactat",
  REPLIED: "Raspuns",
  MEETING: "Intalnire",
  SPONSOR: "Sponsor",
  NOT_INTERESTED: "Neinteresat",
  LATER: "Mai tarziu",
};

const STATUS_COLORS: Record<string, string> = {
  NEW: "bg-gray-100 text-gray-800",
  CONTACTED: "bg-blue-100 text-blue-800",
  REPLIED: "bg-yellow-100 text-yellow-800",
  MEETING: "bg-purple-100 text-purple-800",
  SPONSOR: "bg-green-100 text-green-800",
  NOT_INTERESTED: "bg-red-100 text-red-800",
  LATER: "bg-orange-100 text-orange-800",
};

const CONTACT_STATUS_LABELS: Record<string, string> = {
  NEW: "Nou",
  CONTACTED: "Contactat",
  REPLIED: "Raspuns",
  DO_NOT_CONTACT: "Nu contacta",
};

const INTERACTION_ICONS: Record<string, string> = {
  NOTE: "📝",
  EMAIL_SENT: "📧",
  EMAIL_RECEIVED: "📩",
  CALL: "📞",
  MEETING: "🤝",
  AI_MATCH: "🤖",
  STATUS_CHANGE: "🔄",
};

function formatDate(d: string | null | undefined): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("ro-RO", { day: "numeric", month: "short", year: "numeric" });
}

function formatDateTime(d: string): string {
  return new Date(d).toLocaleDateString("ro-RO", {
    day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

function isOverdue(d: string | null | undefined): boolean {
  if (!d) return false;
  return new Date(d) < new Date();
}

// ─── Main Component ────────────────────────────────

export function SponsorCRM() {
  // Companies list
  const [companies, setCompanies] = useState<SponsorCompany[]>([]);
  const [totalCompanies, setTotalCompanies] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Selected company (drawer)
  const [selectedCompany, setSelectedCompany] = useState<SponsorCompany | null>(null);
  const [drawerTab, setDrawerTab] = useState<"info" | "contacts" | "timeline" | "email" | "ai">("info");
  const [drawerLoading, setDrawerLoading] = useState(false);

  // Company form (add/edit)
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "", domain: "", website: "", industry: "", city: "", country: "Romania",
    status: "NEW", tags: "", notes: "",
  });
  const [saving, setSaving] = useState(false);
  const [editingCompanyId, setEditingCompanyId] = useState<string | null>(null);

  // Contact form
  const [showContactForm, setShowContactForm] = useState(false);
  const [contactForm, setContactForm] = useState({
    fullName: "", role: "", email: "", phone: "", linkedinUrl: "", notes: "",
  });
  const [savingContact, setSavingContact] = useState(false);

  // Note form
  const [noteText, setNoteText] = useState("");
  const [savingNote, setSavingNote] = useState(false);

  // Email composer
  const [emailContactId, setEmailContactId] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [emailFollowup, setEmailFollowup] = useState("");
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  // AI
  const [aiLoading, setAiLoading] = useState(false);
  const [aiMatch, setAiMatch] = useState<AiMatch | null>(null);
  const [aiVariants, setAiVariants] = useState<EmailVariant[]>([]);
  const [aiMsgLoading, setAiMsgLoading] = useState(false);
  const [aiMsgContactId, setAiMsgContactId] = useState("");

  // CSV import
  const [showImport, setShowImport] = useState(false);
  const [importData, setImportData] = useState("");
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);

  // ─── Fetch companies ────────────────────────────

  const fetchCompanies = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set("search", searchQuery);
      if (statusFilter !== "all") params.set("status", statusFilter);
      const res = await fetch(`/api/sponsors?${params.toString()}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setCompanies(data.companies || []);
      setTotalCompanies(data.total || 0);
    } catch {
      console.error("Failed to fetch sponsors");
    } finally {
      setLoading(false);
    }
  }, [searchQuery, statusFilter]);

  useEffect(() => {
    const timer = setTimeout(fetchCompanies, 300);
    return () => clearTimeout(timer);
  }, [fetchCompanies]);

  // ─── Fetch single company details ──────────────

  const openCompany = async (id: string) => {
    setDrawerLoading(true);
    setDrawerTab("info");
    setAiMatch(null);
    setAiVariants([]);
    setEmailSent(false);
    try {
      const res = await fetch(`/api/sponsors/${id}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setSelectedCompany(data.company);
    } catch {
      console.error("Failed to fetch company");
    } finally {
      setDrawerLoading(false);
    }
  };

  // ─── Create/Update company ─────────────────────

  const handleSaveCompany = async () => {
    if (!formData.name.trim()) return;
    setSaving(true);
    try {
      const url = editingCompanyId ? `/api/sponsors/${editingCompanyId}` : "/api/sponsors";
      const method = editingCompanyId ? "PUT" : "POST";
      const body = {
        ...formData,
        tags: formData.tags ? formData.tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
      };
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "Eroare la salvare");
        return;
      }
      setShowAddForm(false);
      setEditingCompanyId(null);
      setFormData({ name: "", domain: "", website: "", industry: "", city: "", country: "Romania", status: "NEW", tags: "", notes: "" });
      fetchCompanies();
      if (editingCompanyId && selectedCompany) openCompany(editingCompanyId);
    } catch {
      alert("Eroare la salvare");
    } finally {
      setSaving(false);
    }
  };

  // ─── Delete company ───────────────────────────

  const handleDeleteCompany = async (id: string) => {
    if (!confirm("Stergi aceasta companie si toate datele asociate?")) return;
    try {
      await fetch(`/api/sponsors/${id}`, { method: "DELETE" });
      if (selectedCompany?.id === id) setSelectedCompany(null);
      fetchCompanies();
    } catch {
      alert("Eroare la stergere");
    }
  };

  // ─── Add contact ──────────────────────────────

  const handleAddContact = async () => {
    if (!contactForm.fullName.trim() || !selectedCompany) return;
    setSavingContact(true);
    try {
      const res = await fetch(`/api/sponsors/${selectedCompany.id}/contacts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(contactForm),
      });
      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "Eroare");
        return;
      }
      setShowContactForm(false);
      setContactForm({ fullName: "", role: "", email: "", phone: "", linkedinUrl: "", notes: "" });
      openCompany(selectedCompany.id);
    } catch {
      alert("Eroare");
    } finally {
      setSavingContact(false);
    }
  };

  // ─── Delete contact ──────────────────────────

  const handleDeleteContact = async (contactId: string) => {
    if (!selectedCompany || !confirm("Stergi acest contact?")) return;
    try {
      await fetch(`/api/sponsors/${selectedCompany.id}/contacts/${contactId}`, { method: "DELETE" });
      openCompany(selectedCompany.id);
    } catch {
      alert("Eroare la stergere");
    }
  };

  // ─── Toggle DNC flag ─────────────────────────

  const handleToggleDnc = async (contactId: string, currentDnc: boolean) => {
    if (!selectedCompany) return;
    try {
      await fetch(`/api/sponsors/${selectedCompany.id}/contacts/${contactId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dncFlag: !currentDnc }),
      });
      openCompany(selectedCompany.id);
    } catch {
      alert("Eroare");
    }
  };

  // ─── Add note ────────────────────────────────

  const handleAddNote = async () => {
    if (!noteText.trim() || !selectedCompany) return;
    setSavingNote(true);
    try {
      await fetch(`/api/sponsors/${selectedCompany.id}/interactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "NOTE", body: noteText }),
      });
      setNoteText("");
      openCompany(selectedCompany.id);
    } catch {
      alert("Eroare");
    } finally {
      setSavingNote(false);
    }
  };

  // ─── Send email ──────────────────────────────

  const handleSendEmail = async () => {
    if (!emailContactId || !emailSubject.trim() || !emailBody.trim() || !selectedCompany) return;
    setSendingEmail(true);
    setEmailSent(false);
    try {
      const res = await fetch(`/api/sponsors/${selectedCompany.id}/send-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contactId: emailContactId,
          subject: emailSubject,
          body: emailBody,
          followupDate: emailFollowup || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Eroare la trimiterea emailului");
        return;
      }
      setEmailSent(true);
      setEmailSubject("");
      setEmailBody("");
      setEmailFollowup("");
      openCompany(selectedCompany.id);
    } catch {
      alert("Eroare la trimitere");
    } finally {
      setSendingEmail(false);
    }
  };

  // ─── AI Match ────────────────────────────────

  const handleAiMatch = async () => {
    if (!selectedCompany) return;
    setAiLoading(true);
    setAiMatch(null);
    try {
      const res = await fetch(`/api/sponsors/${selectedCompany.id}/ai-match`, { method: "POST" });
      const data = await res.json();
      setAiMatch({ score: data.score, reasons: data.reasons || [], angle: data.angle });
      openCompany(selectedCompany.id);
    } catch {
      alert("Eroare AI");
    } finally {
      setAiLoading(false);
    }
  };

  // ─── AI Message ──────────────────────────────

  const handleAiMessage = async () => {
    if (!selectedCompany) return;
    setAiMsgLoading(true);
    setAiVariants([]);
    try {
      const res = await fetch(`/api/sponsors/${selectedCompany.id}/ai-message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contactId: aiMsgContactId || undefined }),
      });
      const data = await res.json();
      setAiVariants(data.variants || []);
    } catch {
      alert("Eroare AI");
    } finally {
      setAiMsgLoading(false);
    }
  };

  // ─── Use AI variant ──────────────────────────

  const applyVariant = (v: EmailVariant) => {
    setEmailSubject(v.subject);
    setEmailBody(v.body);
    setDrawerTab("email");
  };

  // ─── CSV Import ──────────────────────────────

  const handleImport = async () => {
    if (!importData.trim()) return;
    setImporting(true);
    setImportResult(null);
    try {
      // Parse CSV
      const lines = importData.trim().split("\n");
      if (lines.length < 2) { alert("CSV-ul trebuie sa aiba cel putin un header si o linie de date"); return; }
      const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
      const companies: any[] = [];
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(",").map((v) => v.trim());
        const row: any = {};
        headers.forEach((h, idx) => { row[h] = values[idx] || ""; });
        companies.push({
          name: row.name || row.company || row.companie || row.firma || "",
          domain: row.domain || row.website || "",
          website: row.website || row.site || "",
          industry: row.industry || row.industrie || row.domeniu || "",
          city: row.city || row.oras || row.localitate || "",
          country: row.country || row.tara || "Romania",
          contacts: row.contact_name || row.contact ? [{
            fullName: row.contact_name || row.contact || "",
            role: row.contact_role || row.functie || "",
            email: row.contact_email || row.email || "",
            phone: row.contact_phone || row.telefon || "",
            linkedinUrl: row.linkedin || "",
          }] : [],
        });
      }
      const res = await fetch("/api/sponsors/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companies }),
      });
      const data = await res.json();
      setImportResult(data);
      fetchCompanies();
    } catch {
      alert("Eroare la import");
    } finally {
      setImporting(false);
    }
  };

  // ─── Edit company (populate form) ────────────

  const startEditCompany = (c: SponsorCompany) => {
    setEditingCompanyId(c.id);
    setFormData({
      name: c.name,
      domain: c.domain || "",
      website: c.website || "",
      industry: c.industry || "",
      city: c.city || "",
      country: c.country || "Romania",
      status: c.status,
      tags: (c.tags || []).join(", "),
      notes: c.notes || "",
    });
    setShowAddForm(true);
  };

  // ─── Match score badge ───────────────────────

  const matchScore = (c: SponsorCompany): number | null => {
    if (c.aiMatches && c.aiMatches.length > 0) return c.aiMatches[0].score;
    return null;
  };

  const scoreColor = (s: number) => {
    if (s >= 75) return "bg-green-100 text-green-800";
    if (s >= 50) return "bg-yellow-100 text-yellow-800";
    return "bg-red-100 text-red-800";
  };

  // ─── Stats ───────────────────────────────────

  const activeSponsors = companies.filter((c) => c.status === "SPONSOR").length;
  const totalContacts = companies.reduce((sum, c) => sum + (c._count?.contacts || 0), 0);
  const dueFollowups = companies.filter((c) => c.nextFollowupAt && isOverdue(c.nextFollowupAt)).length;

  // ────────────────────────────────────────────────
  // RENDER
  // ────────────────────────────────────────────────

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Companii</p>
                <p className="text-2xl font-bold">{totalCompanies}</p>
              </div>
              <Building className="h-8 w-8 text-muted-foreground/30" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Sponsori activi</p>
                <p className="text-2xl font-bold text-green-600">{activeSponsors}</p>
              </div>
              <Star className="h-8 w-8 text-green-200" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Contacte</p>
                <p className="text-2xl font-bold">{totalContacts}</p>
              </div>
              <Users className="h-8 w-8 text-muted-foreground/30" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Follow-up scadent</p>
                <p className={`text-2xl font-bold ${dueFollowups > 0 ? "text-red-600" : ""}`}>{dueFollowups}</p>
              </div>
              <Clock className="h-8 w-8 text-muted-foreground/30" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Cauta companii (nume, industrie, oras)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toate statusurile</SelectItem>
            {Object.entries(STATUS_LABELS).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={() => { setShowAddForm(true); setEditingCompanyId(null); setFormData({ name: "", domain: "", website: "", industry: "", city: "", country: "Romania", status: "NEW", tags: "", notes: "" }); }}>
          <Plus className="h-4 w-4 mr-1" /> Adauga
        </Button>
        <Button variant="outline" onClick={() => { setShowImport(true); setImportResult(null); setImportData(""); }}>
          <Upload className="h-4 w-4 mr-1" /> Import CSV
        </Button>
      </div>

      {/* Add/Edit form */}
      {showAddForm && (
        <Card className="border-primary/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{editingCompanyId ? "Editeaza companie" : "Adauga companie noua"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div className="grid gap-1">
                <Label className="text-xs">Nume companie *</Label>
                <Input placeholder="SC Exemplu SRL" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
              </div>
              <div className="grid gap-1">
                <Label className="text-xs">Website</Label>
                <Input placeholder="https://exemplu.ro" value={formData.website} onChange={(e) => setFormData({ ...formData, website: e.target.value })} />
              </div>
              <div className="grid gap-1">
                <Label className="text-xs">Domeniu/Industrie</Label>
                <Input placeholder="IT, Constructii, Retail..." value={formData.industry} onChange={(e) => setFormData({ ...formData, industry: e.target.value })} />
              </div>
              <div className="grid gap-1">
                <Label className="text-xs">Oras</Label>
                <Input placeholder="Bucuresti" value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} />
              </div>
              <div className="grid gap-1">
                <Label className="text-xs">Status</Label>
                <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(STATUS_LABELS).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1">
                <Label className="text-xs">Taguri (virgula)</Label>
                <Input placeholder="IT, mare, local" value={formData.tags} onChange={(e) => setFormData({ ...formData, tags: e.target.value })} />
              </div>
            </div>
            <div className="grid gap-1">
              <Label className="text-xs">Note</Label>
              <Textarea placeholder="Note interne..." value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} className="min-h-[60px]" />
            </div>
          </CardContent>
          <CardFooter className="gap-2 border-t pt-4">
            <Button onClick={handleSaveCompany} disabled={saving || !formData.name.trim()}>
              {saving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <CheckCircle2 className="h-4 w-4 mr-1" />}
              {editingCompanyId ? "Salveaza" : "Adauga"}
            </Button>
            <Button variant="outline" onClick={() => { setShowAddForm(false); setEditingCompanyId(null); }}>Anuleaza</Button>
          </CardFooter>
        </Card>
      )}

      {/* CSV Import */}
      {showImport && (
        <Card className="border-orange-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Upload className="h-4 w-4" /> Import CSV
            </CardTitle>
            <CardDescription>
              Formatul: name, website, industry, city, contact_name, contact_role, contact_email, contact_phone, linkedin
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Textarea
              placeholder={"name,website,industry,city,contact_name,contact_role,contact_email\nSC Tech SRL,tech.ro,IT,Cluj,Ion Pop,Director,ion@tech.ro"}
              value={importData}
              onChange={(e) => setImportData(e.target.value)}
              className="min-h-[120px] font-mono text-xs"
            />
            {importResult && (
              <div className="p-3 bg-muted rounded-lg text-sm space-y-1">
                <p><strong>Rezultat import:</strong></p>
                <p>Companii create: {importResult.companiesCreated} | Actualizate: {importResult.companiesUpdated}</p>
                <p>Contacte create: {importResult.contactsCreated} | Actualizate: {importResult.contactsUpdated}</p>
                {importResult.errors > 0 && <p className="text-red-600">Erori: {importResult.errors}</p>}
              </div>
            )}
          </CardContent>
          <CardFooter className="gap-2 border-t pt-4">
            <Button onClick={handleImport} disabled={importing || !importData.trim()}>
              {importing ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Upload className="h-4 w-4 mr-1" />}
              Importa
            </Button>
            <Button variant="outline" onClick={() => setShowImport(false)}>Inchide</Button>
          </CardFooter>
        </Card>
      )}

      {/* Companies list + Drawer layout */}
      <div className="flex gap-4">
        {/* Table */}
        <div className={`flex-1 min-w-0 ${selectedCompany ? "hidden lg:block" : ""}`}>
          <Card>
            <CardContent className="p-0">
              {loading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : companies.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center px-4">
                  <Building className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Nicio companie sponsor inca</h3>
                  <p className="text-muted-foreground mb-4">
                    Adauga companii manual sau importa un CSV pentru a incepe.
                  </p>
                  <Button onClick={() => setShowAddForm(true)}>
                    <Plus className="h-4 w-4 mr-2" /> Adauga prima companie
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/30">
                        <th className="text-left p-3 font-medium">Companie</th>
                        <th className="text-left p-3 font-medium hidden md:table-cell">Industrie</th>
                        <th className="text-left p-3 font-medium hidden md:table-cell">Oras</th>
                        <th className="text-left p-3 font-medium">Status</th>
                        <th className="text-center p-3 font-medium hidden lg:table-cell">AI Score</th>
                        <th className="text-left p-3 font-medium hidden lg:table-cell">Ultimul contact</th>
                        <th className="text-left p-3 font-medium hidden xl:table-cell">Follow-up</th>
                        <th className="text-right p-3 font-medium">Actiuni</th>
                      </tr>
                    </thead>
                    <tbody>
                      {companies.map((c) => {
                        const score = matchScore(c);
                        return (
                          <tr key={c.id} className="border-b hover:bg-muted/20 cursor-pointer transition" onClick={() => openCompany(c.id)}>
                            <td className="p-3">
                              <div className="font-medium">{c.name}</div>
                              {c.domain && <div className="text-xs text-muted-foreground">{c.domain}</div>}
                              <div className="text-xs text-muted-foreground">{c._count?.contacts || 0} contacte</div>
                            </td>
                            <td className="p-3 hidden md:table-cell text-muted-foreground">{c.industry || "—"}</td>
                            <td className="p-3 hidden md:table-cell text-muted-foreground">{c.city || "—"}</td>
                            <td className="p-3">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[c.status] || ""}`}>
                                {STATUS_LABELS[c.status] || c.status}
                              </span>
                            </td>
                            <td className="p-3 text-center hidden lg:table-cell">
                              {score !== null ? (
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${scoreColor(score)}`}>
                                  {score}%
                                </span>
                              ) : (
                                <span className="text-xs text-muted-foreground">—</span>
                              )}
                            </td>
                            <td className="p-3 hidden lg:table-cell text-xs text-muted-foreground">{formatDate(c.lastContactedAt)}</td>
                            <td className="p-3 hidden xl:table-cell">
                              {c.nextFollowupAt ? (
                                <span className={`text-xs ${isOverdue(c.nextFollowupAt) ? "text-red-600 font-medium" : "text-muted-foreground"}`}>
                                  {isOverdue(c.nextFollowupAt) ? "⚠ " : ""}{formatDate(c.nextFollowupAt)}
                                </span>
                              ) : (
                                <span className="text-xs text-muted-foreground">—</span>
                              )}
                            </td>
                            <td className="p-3 text-right" onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center justify-end gap-1">
                                <Button variant="ghost" size="sm" onClick={() => openCompany(c.id)}>
                                  <Eye className="h-3 w-3" />
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => startEditCompany(c)}>
                                  <Edit className="h-3 w-3" />
                                </Button>
                                <Button variant="ghost" size="sm" className="text-red-500" onClick={() => handleDeleteCompany(c.id)}>
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Company Drawer */}
        {selectedCompany && (
          <div className="w-full lg:w-[520px] shrink-0">
            <Card className="sticky top-4">
              {drawerLoading ? (
                <CardContent className="flex items-center justify-center py-16">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </CardContent>
              ) : (
                <>
                  {/* Drawer header */}
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg truncate">{selectedCompany.name}</CardTitle>
                        <CardDescription className="flex items-center gap-2 flex-wrap mt-1">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[selectedCompany.status]}`}>
                            {STATUS_LABELS[selectedCompany.status]}
                          </span>
                          {selectedCompany.industry && <Badge variant="outline" className="text-xs">{selectedCompany.industry}</Badge>}
                          {selectedCompany.city && <span className="text-xs">{selectedCompany.city}</span>}
                        </CardDescription>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <Button variant="ghost" size="sm" onClick={() => startEditCompany(selectedCompany)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setSelectedCompany(null)}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    {selectedCompany.website && (
                      <a href={selectedCompany.website} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1 mt-1">
                        <ExternalLink className="h-3 w-3" /> {selectedCompany.website}
                      </a>
                    )}
                    {selectedCompany.tags && selectedCompany.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {selectedCompany.tags.map((t) => (
                          <Badge key={t} variant="secondary" className="text-xs">{t}</Badge>
                        ))}
                      </div>
                    )}
                  </CardHeader>

                  {/* Drawer tabs */}
                  <div className="border-t border-b">
                    <div className="flex overflow-x-auto">
                      {[
                        { key: "info" as const, label: "Info", icon: <Building className="h-3 w-3" /> },
                        { key: "contacts" as const, label: `Contacte (${selectedCompany.contacts?.length || 0})`, icon: <Users className="h-3 w-3" /> },
                        { key: "timeline" as const, label: "Timeline", icon: <Clock className="h-3 w-3" /> },
                        { key: "email" as const, label: "Email", icon: <Mail className="h-3 w-3" /> },
                        { key: "ai" as const, label: "AI", icon: <Sparkles className="h-3 w-3" /> },
                      ].map((tab) => (
                        <button
                          key={tab.key}
                          onClick={() => setDrawerTab(tab.key)}
                          className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium whitespace-nowrap border-b-2 transition ${
                            drawerTab === tab.key ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          {tab.icon} {tab.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <CardContent className="pt-4 max-h-[500px] overflow-y-auto">
                    {/* INFO TAB */}
                    {drawerTab === "info" && (
                      <div className="space-y-3 text-sm">
                        {selectedCompany.notes && (
                          <div className="p-3 bg-muted/50 rounded-lg">
                            <p className="text-xs text-muted-foreground mb-1">Note</p>
                            <p className="whitespace-pre-wrap">{selectedCompany.notes}</p>
                          </div>
                        )}
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <p className="text-xs text-muted-foreground">Industrie</p>
                            <p className="font-medium">{selectedCompany.industry || "—"}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Oras</p>
                            <p className="font-medium">{selectedCompany.city || "—"}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Ultimul contact</p>
                            <p className="font-medium">{formatDate(selectedCompany.lastContactedAt)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Urmatorul follow-up</p>
                            <p className={`font-medium ${selectedCompany.nextFollowupAt && isOverdue(selectedCompany.nextFollowupAt) ? "text-red-600" : ""}`}>
                              {formatDate(selectedCompany.nextFollowupAt)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Contacte</p>
                            <p className="font-medium">{selectedCompany.contacts?.length || 0}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Interactiuni</p>
                            <p className="font-medium">{selectedCompany.interactions?.length || 0}</p>
                          </div>
                        </div>
                        {/* Quick note */}
                        <div className="pt-3 border-t space-y-2">
                          <p className="text-xs font-medium">Adauga nota rapida</p>
                          <div className="flex gap-2">
                            <Input placeholder="Nota..." value={noteText} onChange={(e) => setNoteText(e.target.value)} className="text-sm" />
                            <Button size="sm" onClick={handleAddNote} disabled={savingNote || !noteText.trim()}>
                              {savingNote ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
                            </Button>
                          </div>
                        </div>
                        {/* Status change */}
                        <div className="pt-3 border-t space-y-2">
                          <p className="text-xs font-medium">Schimba status</p>
                          <div className="flex flex-wrap gap-1.5">
                            {Object.entries(STATUS_LABELS).map(([k, v]) => (
                              <button
                                key={k}
                                onClick={async () => {
                                  if (k === selectedCompany.status) return;
                                  await fetch(`/api/sponsors/${selectedCompany.id}`, {
                                    method: "PUT",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({ status: k }),
                                  });
                                  openCompany(selectedCompany.id);
                                  fetchCompanies();
                                }}
                                className={`px-2 py-1 rounded-full text-xs font-medium transition ${
                                  k === selectedCompany.status
                                    ? STATUS_COLORS[k] + " ring-2 ring-offset-1 ring-primary"
                                    : STATUS_COLORS[k] + " opacity-50 hover:opacity-100"
                                }`}
                              >
                                {v}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* CONTACTS TAB */}
                    {drawerTab === "contacts" && (
                      <div className="space-y-3">
                        <Button size="sm" onClick={() => setShowContactForm(!showContactForm)}>
                          <Plus className="h-3 w-3 mr-1" /> Adauga contact
                        </Button>

                        {showContactForm && (
                          <div className="p-3 border rounded-lg space-y-2 bg-muted/30">
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <Label className="text-xs">Nume complet *</Label>
                                <Input placeholder="Ion Popescu" value={contactForm.fullName} onChange={(e) => setContactForm({ ...contactForm, fullName: e.target.value })} className="text-sm" />
                              </div>
                              <div>
                                <Label className="text-xs">Functie</Label>
                                <Input placeholder="Director General" value={contactForm.role} onChange={(e) => setContactForm({ ...contactForm, role: e.target.value })} className="text-sm" />
                              </div>
                              <div>
                                <Label className="text-xs">Email</Label>
                                <Input type="email" placeholder="ion@company.ro" value={contactForm.email} onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })} className="text-sm" />
                              </div>
                              <div>
                                <Label className="text-xs">Telefon</Label>
                                <Input placeholder="0722..." value={contactForm.phone} onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })} className="text-sm" />
                              </div>
                            </div>
                            <div>
                              <Label className="text-xs">LinkedIn URL</Label>
                              <Input placeholder="https://linkedin.com/in/..." value={contactForm.linkedinUrl} onChange={(e) => setContactForm({ ...contactForm, linkedinUrl: e.target.value })} className="text-sm" />
                            </div>
                            <div className="flex gap-2">
                              <Button size="sm" onClick={handleAddContact} disabled={savingContact || !contactForm.fullName.trim()}>
                                {savingContact ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : null}
                                Salveaza
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => setShowContactForm(false)}>Anuleaza</Button>
                            </div>
                          </div>
                        )}

                        {/* Contacts list */}
                        {selectedCompany.contacts?.length === 0 ? (
                          <p className="text-sm text-muted-foreground text-center py-6">Niciun contact adaugat inca.</p>
                        ) : (
                          <div className="space-y-2">
                            {selectedCompany.contacts?.map((contact) => (
                              <div key={contact.id} className={`p-3 border rounded-lg ${contact.dncFlag ? "border-red-200 bg-red-50/30" : ""}`}>
                                <div className="flex items-start justify-between">
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                      <p className="font-medium text-sm">{contact.fullName}</p>
                                      <span className={`text-xs px-1.5 py-0.5 rounded ${CONTACT_STATUS_LABELS[contact.status] ? "" : ""} ${
                                        contact.status === "DO_NOT_CONTACT" ? "bg-red-100 text-red-700" :
                                        contact.status === "REPLIED" ? "bg-green-100 text-green-700" :
                                        contact.status === "CONTACTED" ? "bg-blue-100 text-blue-700" :
                                        "bg-gray-100 text-gray-700"
                                      }`}>
                                        {CONTACT_STATUS_LABELS[contact.status] || contact.status}
                                      </span>
                                      {contact.dncFlag && (
                                        <Badge variant="destructive" className="text-xs">DNC</Badge>
                                      )}
                                    </div>
                                    {contact.role && <p className="text-xs text-muted-foreground">{contact.role}</p>}
                                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                                      {contact.email && (
                                        <a href={`mailto:${contact.email}`} className="text-xs text-primary hover:underline flex items-center gap-1">
                                          <Mail className="h-3 w-3" /> {contact.email}
                                        </a>
                                      )}
                                      {contact.phone && (
                                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                                          <Phone className="h-3 w-3" /> {contact.phone}
                                        </span>
                                      )}
                                      {contact.linkedinUrl && (
                                        <a href={contact.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                                          <Linkedin className="h-3 w-3" /> LinkedIn
                                        </a>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex gap-1 shrink-0">
                                    {contact.email && !contact.dncFlag && (
                                      <Button variant="ghost" size="sm" onClick={() => { setEmailContactId(contact.id); setDrawerTab("email"); }}>
                                        <Mail className="h-3 w-3" />
                                      </Button>
                                    )}
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className={contact.dncFlag ? "text-green-600" : "text-orange-600"}
                                      onClick={() => handleToggleDnc(contact.id, contact.dncFlag)}
                                      title={contact.dncFlag ? "Permite contactarea" : "Marcheaza Nu Contacta"}
                                    >
                                      {contact.dncFlag ? <CheckCircle2 className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
                                    </Button>
                                    <Button variant="ghost" size="sm" className="text-red-500" onClick={() => handleDeleteContact(contact.id)}>
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* TIMELINE TAB */}
                    {drawerTab === "timeline" && (
                      <div className="space-y-3">
                        {/* Quick note */}
                        <div className="flex gap-2">
                          <Input placeholder="Adauga nota..." value={noteText} onChange={(e) => setNoteText(e.target.value)} className="text-sm" />
                          <Button size="sm" onClick={handleAddNote} disabled={savingNote || !noteText.trim()}>
                            {savingNote ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
                          </Button>
                        </div>

                        {selectedCompany.interactions?.length === 0 ? (
                          <p className="text-sm text-muted-foreground text-center py-6">Nicio interactiune inca.</p>
                        ) : (
                          <div className="space-y-2">
                            {selectedCompany.interactions?.map((item) => (
                              <div key={item.id} className="flex gap-3 p-2 border-l-2 border-muted ml-2">
                                <span className="text-lg shrink-0">{INTERACTION_ICONS[item.type] || "📌"}</span>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-medium capitalize">{item.type.replace(/_/g, " ").toLowerCase()}</span>
                                    {item.contact && (
                                      <span className="text-xs text-muted-foreground">→ {item.contact.fullName}</span>
                                    )}
                                    <span className="text-xs text-muted-foreground ml-auto shrink-0">{formatDateTime(item.createdAt)}</span>
                                  </div>
                                  {item.subject && <p className="text-sm font-medium mt-0.5">{item.subject}</p>}
                                  {item.body && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-3 whitespace-pre-wrap">{item.body}</p>}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* EMAIL TAB */}
                    {drawerTab === "email" && (
                      <div className="space-y-3">
                        {emailSent && (
                          <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800 flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4" /> Emailul a fost trimis cu succes!
                          </div>
                        )}
                        <div className="grid gap-2">
                          <Label className="text-xs">Contact destinatar *</Label>
                          <Select value={emailContactId} onValueChange={setEmailContactId}>
                            <SelectTrigger><SelectValue placeholder="Selecteaza contact..." /></SelectTrigger>
                            <SelectContent>
                              {selectedCompany.contacts?.filter((c) => c.email && !c.dncFlag).map((c) => (
                                <SelectItem key={c.id} value={c.id}>
                                  {c.fullName} ({c.email})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {selectedCompany.contacts?.filter((c) => c.email && !c.dncFlag).length === 0 && (
                            <p className="text-xs text-red-600">Niciun contact cu email disponibil (adauga un contact cu email sau deblocheaza DNC).</p>
                          )}
                        </div>
                        <div className="grid gap-2">
                          <Label className="text-xs">Subiect *</Label>
                          <Input placeholder="Propunere de sponsorizare..." value={emailSubject} onChange={(e) => setEmailSubject(e.target.value)} />
                        </div>
                        <div className="grid gap-2">
                          <Label className="text-xs">Continut email *</Label>
                          <Textarea
                            placeholder="Stimate domnule/doamna..."
                            value={emailBody}
                            onChange={(e) => setEmailBody(e.target.value)}
                            className="min-h-[150px] text-sm"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label className="text-xs">Data follow-up (optional)</Label>
                          <Input type="date" value={emailFollowup} onChange={(e) => setEmailFollowup(e.target.value)} />
                        </div>
                        <div className="flex gap-2">
                          <Button onClick={handleSendEmail} disabled={sendingEmail || !emailContactId || !emailSubject.trim() || !emailBody.trim()}>
                            {sendingEmail ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Send className="h-4 w-4 mr-1" />}
                            Trimite email
                          </Button>
                          <Button variant="outline" onClick={() => { setDrawerTab("ai"); }}>
                            <Sparkles className="h-4 w-4 mr-1" /> Genereaza cu AI
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* AI TAB */}
                    {drawerTab === "ai" && (
                      <div className="space-y-4">
                        {/* AI Match */}
                        <div className="space-y-2">
                          <h4 className="text-sm font-semibold flex items-center gap-2">
                            <TrendingUp className="h-4 w-4" /> AI Match Score
                          </h4>
                          <p className="text-xs text-muted-foreground">
                            AI analizeaza compatibilitatea intre companie si ONG-ul tau.
                          </p>
                          <Button size="sm" onClick={handleAiMatch} disabled={aiLoading}>
                            {aiLoading ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Sparkles className="h-3 w-3 mr-1" />}
                            Calculeaza match
                          </Button>
                          {aiMatch && (
                            <div className="p-3 border rounded-lg space-y-2">
                              <div className="flex items-center gap-3">
                                <span className={`text-3xl font-bold ${aiMatch.score >= 75 ? "text-green-600" : aiMatch.score >= 50 ? "text-yellow-600" : "text-red-600"}`}>
                                  {aiMatch.score}%
                                </span>
                                {aiMatch.angle && (
                                  <Badge variant="outline">{aiMatch.angle}</Badge>
                                )}
                              </div>
                              <div className="space-y-1">
                                {aiMatch.reasons.map((r, i) => (
                                  <p key={i} className="text-xs flex items-start gap-1.5">
                                    <CheckCircle2 className="h-3 w-3 text-green-500 shrink-0 mt-0.5" />
                                    {r}
                                  </p>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* AI Message Generator */}
                        <div className="space-y-2 pt-3 border-t">
                          <h4 className="text-sm font-semibold flex items-center gap-2">
                            <MessageCircle className="h-4 w-4" /> Generator mesaj AI
                          </h4>
                          <p className="text-xs text-muted-foreground">
                            Genereaza 3 variante de email (Formal / Prietenos / Ultra-scurt) pentru a contacta compania.
                          </p>
                          <div className="flex gap-2">
                            <Select value={aiMsgContactId} onValueChange={setAiMsgContactId}>
                              <SelectTrigger className="flex-1">
                                <SelectValue placeholder="Contact (optional)" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value=" ">Fara contact specific</SelectItem>
                                {selectedCompany.contacts?.map((c) => (
                                  <SelectItem key={c.id} value={c.id}>{c.fullName}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Button size="sm" onClick={handleAiMessage} disabled={aiMsgLoading}>
                              {aiMsgLoading ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Sparkles className="h-3 w-3 mr-1" />}
                              Genereaza
                            </Button>
                          </div>
                          {aiVariants.length > 0 && (
                            <div className="space-y-2">
                              {aiVariants.map((v, i) => (
                                <div key={i} className="p-3 border rounded-lg space-y-1.5">
                                  <div className="flex items-center justify-between">
                                    <Badge variant="outline" className="text-xs capitalize">{v.tone}</Badge>
                                    <Button variant="ghost" size="sm" onClick={() => applyVariant(v)}>
                                      <ArrowRight className="h-3 w-3 mr-1" /> Foloseste
                                    </Button>
                                  </div>
                                  <p className="text-sm font-medium">{v.subject}</p>
                                  <p className="text-xs text-muted-foreground whitespace-pre-wrap line-clamp-4">{v.body}</p>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </>
              )}
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

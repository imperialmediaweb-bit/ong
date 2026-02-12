"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { formatCurrency, formatDate, formatDateTime, getInitials } from "@/lib/utils";
import {
  ArrowLeft, Edit2, Save, X, Trash2, Download, Shield, Tag, Plus, Mail,
  Phone, Heart, Clock, MessageSquare, FileText, AlertTriangle, Loader2,
  CheckCircle2, XCircle, TrendingUp, Calendar, Hash, Activity, Send,
} from "lucide-react";

interface DonorDetail {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  status: string;
  preferredChannel: string;
  emailConsent: boolean;
  smsConsent: boolean;
  privacyConsent: boolean;
  totalDonated: number;
  donationCount: number;
  lastDonationAt: string | null;
  notes: string | null;
  isAnonymized: boolean;
  createdAt: string;
  updatedAt: string;
  tags: { tag: { id: string; name: string; color: string } }[];
  donations: {
    id: string;
    amount: number;
    currency: string;
    status: string;
    source: string | null;
    createdAt: string;
    campaign: { id: string; name: string } | null;
  }[];
  consents: {
    id: string;
    type: string;
    granted: boolean;
    source: string | null;
    createdAt: string;
  }[];
  messageRecipients: {
    id: string;
    channel: string;
    status: string;
    address: string;
    deliveredAt: string | null;
    openedAt: string | null;
    createdAt: string;
    message: { subject: string | null; campaign: { name: string } | null } | null;
  }[];
}

interface AvailableTag {
  id: string;
  name: string;
  color: string;
}

const statusConfig: Record<string, { label: string; variant: "success" | "warning" | "destructive" }> = {
  ACTIVE: { label: "Activ", variant: "success" },
  INACTIVE: { label: "Inactiv", variant: "warning" },
  UNSUBSCRIBED: { label: "Dezabonat", variant: "destructive" },
  DELETED: { label: "Sters", variant: "destructive" },
};

const channelConfig: Record<string, { label: string; icon: typeof Mail }> = {
  EMAIL: { label: "Email", icon: Mail },
  SMS: { label: "SMS", icon: MessageSquare },
  BOTH: { label: "Email + SMS", icon: Send },
};

export default function DonorDetailPage() {
  const params = useParams();
  const router = useRouter();
  const donorId = params.id as string;

  const [donor, setDonor] = useState<DonorDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [availableTags, setAvailableTags] = useState<AvailableTag[]>([]);
  const [editForm, setEditForm] = useState({ name: "", email: "", phone: "", preferredChannel: "EMAIL", status: "ACTIVE", notes: "" });
  const [newNote, setNewNote] = useState("");
  const [addTagDialogOpen, setAddTagDialogOpen] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const [gdprDialogOpen, setGdprDialogOpen] = useState(false);
  const [gdprAction, setGdprAction] = useState<"export" | "delete">("export");

  const fetchDonor = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/donors/${donorId}`);
      if (!res.ok) {
        if (res.status === 404) throw new Error("Donor not found");
        throw new Error("Failed to fetch donor");
      }
      const data: DonorDetail = await res.json();
      setDonor(data);
      setEditForm({
        name: data.name || "", email: data.email || "", phone: data.phone || "",
        preferredChannel: data.preferredChannel, status: data.status, notes: data.notes || "",
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [donorId]);

  const fetchTags = useCallback(async () => {
    try {
      const res = await fetch("/api/tags");
      if (res.ok) { const data = await res.json(); setAvailableTags(data.tags || []); }
    } catch { /* silently fail */ }
  }, []);

  useEffect(() => { fetchDonor(); fetchTags(); }, [fetchDonor, fetchTags]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/donors/${donorId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(editForm) });
      if (!res.ok) throw new Error("Failed to update donor");
      await fetchDonor(); setEditing(false);
    } catch (err: any) { setError(err.message); } finally { setSaving(false); }
  };

  const handleAddTag = async (tagId?: string) => {
    try {
      const body = tagId ? { tagId } : { name: newTagName };
      const res = await fetch(`/api/donors/${donorId}/tags`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (!res.ok) throw new Error("Failed to add tag");
      setAddTagDialogOpen(false); setNewTagName(""); fetchDonor();
    } catch (err: any) { setError(err.message); }
  };

  const handleRemoveTag = async (tagId: string) => {
    try {
      const res = await fetch(`/api/donors/${donorId}/tags/${tagId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to remove tag");
      fetchDonor();
    } catch (err: any) { setError(err.message); }
  };

  const handleGdprAction = async () => {
    try {
      if (gdprAction === "export") {
        const res = await fetch(`/api/donors/${donorId}/export`);
        if (!res.ok) throw new Error("Failed to export data");
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a"); a.href = url; a.download = `donor-${donorId}-data.json`; a.click();
        URL.revokeObjectURL(url);
      } else {
        if (!confirm("Aceasta actiune va anonimiza permanent datele personale ale donatorului. Nu poate fi anulata. Continuati?")) return;
        const res = await fetch(`/api/donors/${donorId}/anonymize`, { method: "POST" });
        if (!res.ok) throw new Error("Failed to anonymize donor");
        fetchDonor();
      }
      setGdprDialogOpen(false);
    } catch (err: any) { setError(err.message); }
  };

  const handleSaveNote = async () => {
    if (!newNote.trim()) return;
    try {
      const updatedNotes = donor?.notes ? `${donor.notes}\n\n---\n[${new Date().toISOString()}]\n${newNote}` : `[${new Date().toISOString()}]\n${newNote}`;
      const res = await fetch(`/api/donors/${donorId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ notes: updatedNotes }) });
      if (!res.ok) throw new Error("Failed to save note");
      setNewNote(""); fetchDonor();
    } catch (err: any) { setError(err.message); }
  };

  if (loading) {
    return (<div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>);
  }

  if (error || !donor) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => router.back()}><ArrowLeft className="mr-2 h-4 w-4" />Inapoi</Button>
        <Card className="max-w-md mx-auto">
          <CardContent className="py-10 text-center">
            <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h3 className="text-lg font-semibold">{error || "Donator negasit"}</h3>
            <p className="text-sm text-muted-foreground mt-1">Donatorul pe care il cautati nu exista sau nu aveti acces.</p>
            <Link href="/dashboard/donors"><Button className="mt-4">Inapoi la donatori</Button></Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const donorTags = donor.tags?.map((t) => t.tag) || [];
  const assignedTagIds = new Set(donorTags.map((t) => t.id));
  const unassignedTags = availableTags.filter((t) => !assignedTagIds.has(t.id));
  const avgDonation = donor.donationCount > 0 ? donor.totalDonated / donor.donationCount : 0;
  const statusInfo = statusConfig[donor.status] || statusConfig.ACTIVE;
  const channelInfo = channelConfig[donor.preferredChannel] || channelConfig.EMAIL;
  const ChannelIcon = channelInfo.icon;
  const openedMessages = donor.messageRecipients.filter((m) => m.status === "OPENED" || m.status === "CLICKED").length;

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 p-6 sm:p-8 text-white">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iYSIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVHJhbnNmb3JtPSJyb3RhdGUoNDUpIj48Y2lyY2xlIGN4PSIyMCIgY3k9IjIwIiByPSIxIiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDUpIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCBmaWxsPSJ1cmwoI2EpIiB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIvPjwvc3ZnPg==')] opacity-50" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-4">
            <Button variant="ghost" size="icon" className="text-white/80 hover:text-white hover:bg-white/10" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <Link href="/dashboard/donors" className="text-white/60 text-sm hover:text-white/80">Donatori</Link>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm text-white text-xl sm:text-2xl font-bold border border-white/30 shadow-lg">
                {donor.isAnonymized ? "?" : donor.name ? getInitials(donor.name) : "?"}
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                  {donor.isAnonymized ? "Donator anonimizat" : donor.name || "Donator necunoscut"}
                </h1>
                <div className="flex flex-wrap items-center gap-3 mt-1 text-white/70 text-sm">
                  {donor.email && (<span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5" />{donor.email}</span>)}
                  {donor.phone && (<span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" />{donor.phone}</span>)}
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <Badge className={`${statusInfo.variant === "success" ? "bg-emerald-500/20 text-emerald-200 border-emerald-400/30" : statusInfo.variant === "warning" ? "bg-amber-500/20 text-amber-200 border-amber-400/30" : "bg-red-500/20 text-red-200 border-red-400/30"} border text-xs`}>
                    {statusInfo.label}
                  </Badge>
                  <Badge className="bg-white/15 text-white/80 border border-white/20 text-xs"><ChannelIcon className="h-3 w-3 mr-1" />{channelInfo.label}</Badge>
                  {donorTags.slice(0, 3).map((tag) => (
                    <Badge key={tag.id} className="text-xs bg-white/15 border border-white/20 text-white/80">{tag.name}</Badge>
                  ))}
                  {donorTags.length > 3 && <Badge className="text-xs bg-white/15 border border-white/20 text-white/80">+{donorTags.length - 3}</Badge>}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {editing ? (
                <>
                  <Button className="bg-white/10 border border-white/20 hover:bg-white/20 text-white" onClick={() => setEditing(false)}><X className="mr-2 h-4 w-4" />Anuleaza</Button>
                  <Button className="bg-white text-indigo-700 hover:bg-white/90" onClick={handleSave} disabled={saving}>
                    {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}Salveaza
                  </Button>
                </>
              ) : (
                <>
                  <Button className="bg-white/10 border border-white/20 hover:bg-white/20 text-white" onClick={() => setEditing(true)}><Edit2 className="mr-2 h-4 w-4" />Editeaza</Button>
                  <Dialog open={gdprDialogOpen} onOpenChange={setGdprDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="bg-white/10 border border-white/20 hover:bg-white/20 text-white"><Shield className="mr-2 h-4 w-4" />GDPR</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Actiuni GDPR</DialogTitle>
                        <DialogDescription>Gestioneaza datele personale ale acestui donator in conformitate cu GDPR.</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className={`p-4 rounded-lg border-2 cursor-pointer transition-colors ${gdprAction === "export" ? "border-primary bg-primary/5" : "border-muted hover:border-muted-foreground/30"}`} onClick={() => setGdprAction("export")}>
                          <div className="flex items-center gap-2 font-medium"><Download className="h-4 w-4" />Exporta date personale</div>
                          <p className="text-sm text-muted-foreground mt-1">Descarca toate datele personale asociate (Art. 20 GDPR).</p>
                        </div>
                        <div className={`p-4 rounded-lg border-2 cursor-pointer transition-colors ${gdprAction === "delete" ? "border-destructive bg-destructive/5" : "border-muted hover:border-muted-foreground/30"}`} onClick={() => setGdprAction("delete")}>
                          <div className="flex items-center gap-2 font-medium text-destructive"><Trash2 className="h-4 w-4" />Sterge / Anonimizeaza date</div>
                          <p className="text-sm text-muted-foreground mt-1">Anonimizeaza permanent toate datele personale (Art. 17 GDPR).</p>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setGdprDialogOpen(false)}>Anuleaza</Button>
                        <Button variant={gdprAction === "delete" ? "destructive" : "default"} onClick={handleGdprAction}>
                          {gdprAction === "export" ? "Exporta date" : "Anonimizeaza donator"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Anonymized Warning */}
      {donor.isAnonymized && (
        <Card className="border-yellow-300 bg-yellow-50">
          <CardContent className="py-3 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <span className="text-sm text-yellow-800">Datele personale ale acestui donator au fost anonimizate conform solicitarii GDPR.</span>
          </CardContent>
        </Card>
      )}

      {/* Summary Stats */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-5">
        {[
          { label: "Total donat", value: formatCurrency(donor.totalDonated), icon: Heart, bg: "bg-emerald-50", text: "text-emerald-600", valueClass: "text-emerald-600" },
          { label: "Nr. donatii", value: donor.donationCount.toString(), icon: Hash, bg: "bg-blue-50", text: "text-blue-600" },
          { label: "Media / donatie", value: formatCurrency(avgDonation), icon: TrendingUp, bg: "bg-violet-50", text: "text-violet-600" },
          { label: "Ultima donatie", value: donor.lastDonationAt ? formatDate(donor.lastDonationAt) : "Niciodata", icon: Calendar, bg: "bg-amber-50", text: "text-amber-600", small: true },
          { label: "Mesaje trimise", value: donor.messageRecipients.length.toString(), sub: `${openedMessages} deschise`, icon: Activity, bg: "bg-pink-50", text: "text-pink-600" },
        ].map((stat) => (
          <Card key={stat.label} className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                  <p className={`${stat.small ? "text-lg" : "text-xl"} font-bold mt-1 ${stat.valueClass || ""}`}>{stat.value}</p>
                  {stat.sub && <p className="text-[10px] text-muted-foreground">{stat.sub}</p>}
                </div>
                <div className={`${stat.bg} ${stat.text} p-2.5 rounded-xl`}><stat.icon className="h-5 w-5" /></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Profile Info */}
        <div className="space-y-6">
          {editing && (
            <Card className="border-primary/30">
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><Edit2 className="h-4 w-4" />Editare profil</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2"><Label>Nume</Label><Input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} /></div>
                <div className="grid gap-2"><Label>Email</Label><Input value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} /></div>
                <div className="grid gap-2"><Label>Telefon</Label><Input value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} /></div>
                <div className="grid gap-2">
                  <Label>Canal preferat</Label>
                  <Select value={editForm.preferredChannel} onValueChange={(v) => setEditForm({ ...editForm, preferredChannel: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="EMAIL">Email</SelectItem><SelectItem value="SMS">SMS</SelectItem><SelectItem value="BOTH">Ambele</SelectItem></SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Status</Label>
                  <Select value={editForm.status} onValueChange={(v) => setEditForm({ ...editForm, status: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="ACTIVE">Activ</SelectItem><SelectItem value="INACTIVE">Inactiv</SelectItem><SelectItem value="UNSUBSCRIBED">Dezabonat</SelectItem></SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="border-0 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-base flex items-center gap-2"><Tag className="h-4 w-4 text-violet-500" />Etichete</CardTitle>
              <Dialog open={addTagDialogOpen} onOpenChange={setAddTagDialogOpen}>
                <DialogTrigger asChild><Button variant="ghost" size="sm"><Plus className="mr-1 h-3 w-3" />Adauga</Button></DialogTrigger>
                <DialogContent className="sm:max-w-sm">
                  <DialogHeader><DialogTitle>Adauga eticheta</DialogTitle><DialogDescription>Selecteaza o eticheta existenta sau creeaza una noua.</DialogDescription></DialogHeader>
                  <div className="space-y-4 py-4">
                    {unassignedTags.length > 0 && (
                      <div>
                        <Label className="text-xs mb-2 block">Etichete existente</Label>
                        <div className="flex flex-wrap gap-2">
                          {unassignedTags.map((tag) => (
                            <Badge key={tag.id} variant="outline" className="cursor-pointer hover:bg-accent" style={{ borderColor: tag.color, color: tag.color }} onClick={() => handleAddTag(tag.id)}>
                              <Plus className="mr-1 h-3 w-3" />{tag.name}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="grid gap-2">
                      <Label className="text-xs">Creeaza eticheta noua</Label>
                      <div className="flex gap-2">
                        <Input placeholder="Nume eticheta" value={newTagName} onChange={(e) => setNewTagName(e.target.value)} />
                        <Button onClick={() => handleAddTag()} disabled={!newTagName.trim()}>Adauga</Button>
                      </div>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {donorTags.length === 0 ? <p className="text-sm text-muted-foreground">Nicio eticheta atribuita.</p> : (
                <div className="flex flex-wrap gap-2">
                  {donorTags.map((tag) => (
                    <Badge key={tag.id} variant="outline" className="pr-1" style={{ borderColor: tag.color, color: tag.color }}>
                      {tag.name}
                      <button onClick={() => handleRemoveTag(tag.id)} className="ml-1 rounded-full hover:bg-muted p-0.5"><X className="h-3 w-3" /></button>
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><Shield className="h-4 w-4 text-blue-500" />Consimtamant</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {[
                { label: "Marketing email", value: donor.emailConsent },
                { label: "Marketing SMS", value: donor.smsConsent },
                { label: "Politica confidentialitate", value: donor.privacyConsent },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between">
                  <span className="text-sm">{item.label}</span>
                  {item.value ? <Badge variant="success"><CheckCircle2 className="mr-1 h-3 w-3" />Acordat</Badge> : <Badge variant="destructive"><XCircle className="mr-1 h-3 w-3" />Neacordat</Badge>}
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><Clock className="h-4 w-4 text-slate-500" />Detalii</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Inregistrat</span><span className="font-medium">{formatDate(donor.createdAt)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Ultima actualizare</span><span className="font-medium">{formatDate(donor.updatedAt)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">ID donator</span><span className="font-mono text-xs text-muted-foreground">{donor.id.slice(0, 12)}...</span></div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Tabs */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="donations" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="donations" className="gap-1 text-xs"><Heart className="h-3 w-3" />Donatii ({donor.donationCount})</TabsTrigger>
              <TabsTrigger value="messages" className="gap-1 text-xs"><MessageSquare className="h-3 w-3" />Mesaje ({donor.messageRecipients.length})</TabsTrigger>
              <TabsTrigger value="consent" className="gap-1 text-xs"><Shield className="h-3 w-3" />Consimtamant</TabsTrigger>
              <TabsTrigger value="notes" className="gap-1 text-xs"><FileText className="h-3 w-3" />Notite</TabsTrigger>
            </TabsList>

            <TabsContent value="donations">
              <Card className="border-0 shadow-sm">
                <CardHeader><CardTitle className="text-base">Istoric donatii</CardTitle><CardDescription>Toate donatiile de la acest donator</CardDescription></CardHeader>
                <CardContent>
                  {donor.donations.length === 0 ? (
                    <div className="text-center py-10"><Heart className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" /><p className="text-sm text-muted-foreground">Nicio donatie inregistrata inca.</p></div>
                  ) : (
                    <div className="space-y-2">
                      {donor.donations.map((donation) => (
                        <div key={donation.id} className="flex items-center justify-between py-3 px-3 -mx-3 rounded-lg hover:bg-accent/50 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${donation.status === "COMPLETED" ? "bg-emerald-50 text-emerald-600" : donation.status === "PENDING" ? "bg-amber-50 text-amber-600" : "bg-red-50 text-red-600"}`}>
                              <Heart className="h-4 w-4" />
                            </div>
                            <div>
                              <p className="text-sm font-semibold">{formatCurrency(donation.amount, donation.currency)}</p>
                              <p className="text-xs text-muted-foreground">{donation.campaign?.name || "Donatie directa"} &middot; {formatDateTime(donation.createdAt)}</p>
                            </div>
                          </div>
                          <Badge variant={donation.status === "COMPLETED" ? "success" : donation.status === "PENDING" ? "warning" : "destructive"}>
                            {donation.status === "COMPLETED" ? "Finalizat" : donation.status === "PENDING" ? "In asteptare" : donation.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="messages">
              <Card className="border-0 shadow-sm">
                <CardHeader><CardTitle className="text-base">Istoric comunicare</CardTitle><CardDescription>Mesaje trimise catre acest donator</CardDescription></CardHeader>
                <CardContent>
                  {donor.messageRecipients.length === 0 ? (
                    <div className="text-center py-10"><MessageSquare className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" /><p className="text-sm text-muted-foreground">Niciun mesaj trimis inca.</p></div>
                  ) : (
                    <div className="space-y-2">
                      {donor.messageRecipients.map((mr) => (
                        <div key={mr.id} className="flex items-center justify-between py-3 px-3 -mx-3 rounded-lg hover:bg-accent/50 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${mr.channel === "EMAIL" ? "bg-blue-50 text-blue-600" : "bg-green-50 text-green-600"}`}>
                              {mr.channel === "EMAIL" ? <Mail className="h-4 w-4" /> : <MessageSquare className="h-4 w-4" />}
                            </div>
                            <div>
                              <p className="text-sm font-medium">{mr.message?.subject || mr.message?.campaign?.name || "Mesaj"}</p>
                              <p className="text-xs text-muted-foreground">{formatDateTime(mr.createdAt)}{mr.openedAt && <span className="text-emerald-600 ml-1">- Deschis</span>}</p>
                            </div>
                          </div>
                          <Badge variant={mr.status === "DELIVERED" || mr.status === "OPENED" || mr.status === "CLICKED" ? "success" : mr.status === "BOUNCED" || mr.status === "FAILED" ? "destructive" : "secondary"}>
                            {mr.status === "DELIVERED" ? "Livrat" : mr.status === "OPENED" ? "Deschis" : mr.status === "CLICKED" ? "Click" : mr.status === "BOUNCED" ? "Respins" : mr.status === "FAILED" ? "Esuat" : mr.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="consent">
              <Card className="border-0 shadow-sm">
                <CardHeader><CardTitle className="text-base">Istoric consimtamant</CardTitle><CardDescription>Traseu complet de audit al modificarilor de consimtamant</CardDescription></CardHeader>
                <CardContent>
                  {donor.consents.length === 0 ? (
                    <div className="text-center py-10"><Shield className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" /><p className="text-sm text-muted-foreground">Nicio inregistrare de consimtamant gasita.</p></div>
                  ) : (
                    <div className="space-y-2">
                      {donor.consents.map((consent) => (
                        <div key={consent.id} className="flex items-center justify-between py-3 px-3 -mx-3 rounded-lg hover:bg-accent/50 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${consent.granted ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"}`}>
                              {consent.granted ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                            </div>
                            <div>
                              <p className="text-sm font-medium">{consent.type.replace(/_/g, " ")}</p>
                              <p className="text-xs text-muted-foreground">{consent.source && `Via ${consent.source} - `}{formatDateTime(consent.createdAt)}</p>
                            </div>
                          </div>
                          <Badge variant={consent.granted ? "success" : "destructive"}>{consent.granted ? "Acordat" : "Revocat"}</Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="notes">
              <Card className="border-0 shadow-sm">
                <CardHeader><CardTitle className="text-base">Notite</CardTitle><CardDescription>Notite interne despre acest donator</CardDescription></CardHeader>
                <CardContent className="space-y-4">
                  <Textarea placeholder="Adauga o notita..." value={newNote} onChange={(e) => setNewNote(e.target.value)} className="min-h-[80px]" />
                  <Button onClick={handleSaveNote} disabled={!newNote.trim()} size="sm"><Plus className="mr-1 h-3 w-3" />Adauga notita</Button>
                  {donor.notes ? (
                    <div className="mt-4 p-4 bg-muted/50 rounded-lg"><pre className="text-sm whitespace-pre-wrap font-sans">{donor.notes}</pre></div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">Nicio notita inca.</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

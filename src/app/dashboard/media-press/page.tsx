"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Newspaper, Users, Send, Plus, Loader2, Trash2,
  Building2, Mail, Phone, Globe, MapPin, ExternalLink,
  FileText, Sparkles, CheckCircle2, AlertCircle,
  Eye, Edit3, Save, Search, Filter, Download,
  Radio, Tv, BookOpen, Rss, Megaphone, Image,
  CreditCard, Package, Clock, ChevronRight,
  Star, Zap,
} from "lucide-react";
import { PageHelp } from "@/components/ui/page-help";
import { PlanGate } from "@/components/dashboard/plan-gate";

interface PressContactItem {
  id: string;
  publicationName: string;
  publicationType: string;
  city: string;
  county: string;
  website: string;
  circulationSize: string;
  contactName: string;
  contactRole: string;
  email: string;
  phone: string;
  isVerified: boolean;
  lastContactedAt: string | null;
  tags: string[];
}

interface PressReleaseItem {
  id: string;
  title: string;
  body: string;
  summary: string;
  imageUrl: string;
  status: string;
  sentAt: string | null;
  publishedCount: number;
  mediaExpressOrderId: string | null;
  mediaExpressStatus: string | null;
  mediaExpressPackage: string | null;
  createdAt: string;
}

export default function MediaPressPage() {
  const [activeTab, setActiveTab] = useState("contacts");

  // Press Contacts
  const [contacts, setContacts] = useState<PressContactItem[]>([]);
  const [contactsLoading, setContactsLoading] = useState(true);
  const [showContactForm, setShowContactForm] = useState(false);
  const [contactSearch, setContactSearch] = useState("");
  const [contactFilter, setContactFilter] = useState("all");

  // New contact form
  const [newContact, setNewContact] = useState({
    publicationName: "",
    publicationType: "ONLINE_NEWS",
    city: "",
    county: "",
    website: "",
    circulationSize: "mediu",
    contactName: "",
    contactRole: "",
    email: "",
    phone: "",
  });
  const [savingContact, setSavingContact] = useState(false);

  // Press Releases
  const [releases, setReleases] = useState<PressReleaseItem[]>([]);
  const [releasesLoading, setReleasesLoading] = useState(true);
  const [showReleaseForm, setShowReleaseForm] = useState(false);

  // New release form
  const [newRelease, setNewRelease] = useState({
    title: "",
    body: "",
    summary: "",
    imageUrl: "",
  });
  const [savingRelease, setSavingRelease] = useState(false);
  const [generatingRelease, setGeneratingRelease] = useState(false);

  // MediaExpress
  const [selectedReleaseId, setSelectedReleaseId] = useState("");
  const [sendingToME, setSendingToME] = useState(false);

  const loadContacts = useCallback(async () => {
    setContactsLoading(true);
    try {
      const params = new URLSearchParams();
      if (contactSearch) params.set("q", contactSearch);
      if (contactFilter !== "all") params.set("type", contactFilter);
      const res = await fetch(`/api/press?action=contacts&${params.toString()}`);
      const data = await res.json();
      setContacts(data.contacts || []);
    } catch {
      // keep existing state
    } finally {
      setContactsLoading(false);
    }
  }, [contactSearch, contactFilter]);

  const loadReleases = async () => {
    setReleasesLoading(true);
    try {
      const res = await fetch("/api/press?action=releases");
      const data = await res.json();
      setReleases(data.releases || []);
    } catch {
      // keep existing state
    } finally {
      setReleasesLoading(false);
    }
  };

  useEffect(() => {
    loadContacts();
    loadReleases();
  }, []);

  useEffect(() => {
    loadContacts();
  }, [contactFilter]);

  const handleSaveContact = async () => {
    setSavingContact(true);
    try {
      await fetch("/api/press", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "save_contact", ...newContact }),
      });
      setShowContactForm(false);
      setNewContact({
        publicationName: "",
        publicationType: "ONLINE_NEWS",
        city: "",
        county: "",
        website: "",
        circulationSize: "mediu",
        contactName: "",
        contactRole: "",
        email: "",
        phone: "",
      });
      await loadContacts();
    } catch {
      // silently fail
    } finally {
      setSavingContact(false);
    }
  };

  const handleDeleteContact = async (id: string) => {
    try {
      await fetch("/api/press", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete_contact", contactId: id }),
      });
      setContacts(prev => prev.filter(c => c.id !== id));
    } catch {
      // silently fail
    }
  };

  const handleSaveRelease = async () => {
    setSavingRelease(true);
    try {
      await fetch("/api/press", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "save_release", ...newRelease }),
      });
      setShowReleaseForm(false);
      setNewRelease({ title: "", body: "", summary: "", imageUrl: "" });
      await loadReleases();
    } catch {
      // silently fail
    } finally {
      setSavingRelease(false);
    }
  };

  const handleGenerateRelease = async () => {
    if (!newRelease.title.trim()) return;
    setGeneratingRelease(true);
    try {
      const res = await fetch("/api/press", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "generate_release",
          title: newRelease.title,
          context: newRelease.summary,
        }),
      });
      const data = await res.json();
      if (data.body) {
        setNewRelease(prev => ({ ...prev, body: data.body, summary: data.summary || prev.summary }));
      }
    } catch {
      // silently fail
    } finally {
      setGeneratingRelease(false);
    }
  };

  const handleSendToContacts = async (releaseId: string) => {
    try {
      await fetch("/api/press", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "send_to_contacts", releaseId }),
      });
      await loadReleases();
    } catch {
      // silently fail
    }
  };

  const handleSendToMediaExpress = async () => {
    if (!selectedReleaseId) return;
    setSendingToME(true);
    try {
      await fetch("/api/press", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "send_media_express",
          releaseId: selectedReleaseId,
          package: "articol_50",
        }),
      });
      await loadReleases();
    } catch {
      // silently fail
    } finally {
      setSendingToME(false);
    }
  };

  const handleSearchContacts = async () => {
    setContactsLoading(true);
    try {
      const res = await fetch("/api/press", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "find_contacts", query: contactSearch }),
      });
      const data = await res.json();
      if (data.contacts?.length) {
        setContacts(prev => [...data.contacts, ...prev]);
      }
    } catch {
      // silently fail
    } finally {
      setContactsLoading(false);
    }
  };

  const pubTypeLabel = (t: string) => {
    const map: Record<string, { label: string; color: string }> = {
      NEWSPAPER: { label: "Ziar", color: "bg-blue-100 text-blue-700 border-blue-200" },
      ONLINE_NEWS: { label: "Online", color: "bg-green-100 text-green-700 border-green-200" },
      TV: { label: "TV", color: "bg-purple-100 text-purple-700 border-purple-200" },
      RADIO: { label: "Radio", color: "bg-amber-100 text-amber-700 border-amber-200" },
      BLOG: { label: "Blog", color: "bg-pink-100 text-pink-700 border-pink-200" },
      NEWS_AGENCY: { label: "Agentie", color: "bg-cyan-100 text-cyan-700 border-cyan-200" },
      MAGAZINE: { label: "Revista", color: "bg-indigo-100 text-indigo-700 border-indigo-200" },
    };
    const info = map[t] || { label: t, color: "" };
    return <Badge className={`${info.color} text-xs`}>{info.label}</Badge>;
  };

  const releaseStatusBadge = (s: string) => {
    switch (s) {
      case "DRAFT": return <Badge className="bg-gray-100 text-gray-700 border-gray-200 text-xs">Ciorna</Badge>;
      case "SENDING": return <Badge className="bg-blue-100 text-blue-700 border-blue-200 text-xs">Se trimite</Badge>;
      case "SENT": return <Badge className="bg-green-100 text-green-700 border-green-200 text-xs">Trimis</Badge>;
      case "PUBLISHED": return <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-xs">Publicat</Badge>;
      case "FAILED": return <Badge className="bg-red-100 text-red-700 border-red-200 text-xs">Esuat</Badge>;
      default: return <Badge variant="outline" className="text-xs">{s}</Badge>;
    }
  };

  return (
    <PlanGate
      requiredPlan="ELITE"
      featureName="Retea Media & Presa"
      featureDescription="Gestioneaza contacte de presa, genereaza comunicate profesionale cu AI si distribuie in publicatii online din Romania."
      features={[
        { icon: Newspaper, title: "Contacte Presa", description: "Gestioneaza o baza de date cu publicatii, jurnalisti si contacte media.", iconBg: "bg-rose-100", iconColor: "text-rose-600" },
        { icon: Sparkles, title: "Comunicate AI", description: "Genereaza comunicate de presa profesionale cu ajutorul inteligentei artificiale.", iconBg: "bg-purple-100", iconColor: "text-purple-600" },
        { icon: Send, title: "Distribuire MediaExpress", description: "Distribuie comunicate in 50-200 publicatii online din Romania.", iconBg: "bg-blue-100", iconColor: "text-blue-600" },
      ]}
    >
    <div className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-rose-600 via-pink-600 to-fuchsia-700 p-6 text-white shadow-xl">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djZoLTZWMzRoNnptMC0zMHY2aC02VjRoNnptMCAxMnY2aC02VjE2aDZ6bTAgMTJ2Nmg2djZoLTZ2LTZ6bTEyLTEydjZoLTZWMTZoNnptLTI0IDB2Nmg2djZILTZ2LTZIMjR6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-30" />
        <div className="relative">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
              <Newspaper className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Retea Media & Presa</h1>
              <p className="text-white/80 text-sm">
                Gestioneaza contacte de presa, trimite comunicate si distribuie articole prin MediaExpress.
              </p>
            </div>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="h-auto p-1 bg-muted/50 rounded-xl">
          <TabsTrigger value="contacts" className="gap-1.5 text-xs py-2.5 rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-rose-500 data-[state=active]:to-pink-600 data-[state=active]:text-white data-[state=active]:shadow-md">
            <Users className="h-3.5 w-3.5" />
            Contacte presa
            {contacts.length > 0 && (
              <Badge className="ml-1 bg-white/20 text-current text-[10px] h-4 px-1.5">{contacts.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="releases" className="gap-1.5 text-xs py-2.5 rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-md">
            <FileText className="h-3.5 w-3.5" />
            Comunicate de presa
          </TabsTrigger>
          <TabsTrigger value="mediaexpress" className="gap-1.5 text-xs py-2.5 rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500 data-[state=active]:to-orange-600 data-[state=active]:text-white data-[state=active]:shadow-md">
            <Zap className="h-3.5 w-3.5" />
            MediaExpress
          </TabsTrigger>
        </TabsList>

        {/* Press Contacts Tab */}
        <TabsContent value="contacts" className="space-y-4 mt-4">
          {/* Search & Add */}
          <Card className="border-0 shadow-md">
            <CardContent className="py-3">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Cauta publicatie, oras, contact..."
                    value={contactSearch}
                    onChange={(e) => setContactSearch(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && loadContacts()}
                    className="h-9 rounded-lg border-0 bg-muted/50"
                  />
                </div>
                <Select value={contactFilter} onValueChange={setContactFilter}>
                  <SelectTrigger className="w-[140px] h-9 rounded-lg">
                    <SelectValue placeholder="Tip" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toate tipurile</SelectItem>
                    <SelectItem value="NEWSPAPER">Ziare</SelectItem>
                    <SelectItem value="ONLINE_NEWS">Online</SelectItem>
                    <SelectItem value="TV">TV</SelectItem>
                    <SelectItem value="RADIO">Radio</SelectItem>
                    <SelectItem value="BLOG">Blog</SelectItem>
                    <SelectItem value="NEWS_AGENCY">Agentii</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  className="bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white shadow-md rounded-lg h-9"
                  onClick={() => setShowContactForm(!showContactForm)}
                >
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Adauga contact
                </Button>
                <Button
                  variant="outline"
                  className="rounded-lg h-9"
                  onClick={handleSearchContacts}
                  disabled={!contactSearch.trim()}
                >
                  <Sparkles className="h-3.5 w-3.5 mr-1" />
                  AI cauta contacte
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Add Contact Form */}
          {showContactForm && (
            <Card className="border-0 shadow-lg overflow-hidden">
              <div className="h-1 bg-gradient-to-r from-rose-500 to-pink-500" />
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Adauga contact presa
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Numele publicatiei *</Label>
                    <Input
                      placeholder="Ex: Adevarul, Digi24, Ziarul local"
                      value={newContact.publicationName}
                      onChange={(e) => setNewContact(prev => ({ ...prev, publicationName: e.target.value }))}
                      className="rounded-lg"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Tip publicatie</Label>
                    <Select value={newContact.publicationType} onValueChange={(v) => setNewContact(prev => ({ ...prev, publicationType: v }))}>
                      <SelectTrigger className="rounded-lg">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="NEWSPAPER">Ziar</SelectItem>
                        <SelectItem value="ONLINE_NEWS">Stiri online</SelectItem>
                        <SelectItem value="TV">TV</SelectItem>
                        <SelectItem value="RADIO">Radio</SelectItem>
                        <SelectItem value="BLOG">Blog</SelectItem>
                        <SelectItem value="NEWS_AGENCY">Agentie de presa</SelectItem>
                        <SelectItem value="MAGAZINE">Revista</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="grid gap-2">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Oras</Label>
                    <Input
                      placeholder="Ex: Cluj-Napoca"
                      value={newContact.city}
                      onChange={(e) => setNewContact(prev => ({ ...prev, city: e.target.value }))}
                      className="rounded-lg"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Judet</Label>
                    <Input
                      placeholder="Ex: Cluj"
                      value={newContact.county}
                      onChange={(e) => setNewContact(prev => ({ ...prev, county: e.target.value }))}
                      className="rounded-lg"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Website</Label>
                    <Input
                      placeholder="Ex: https://publicatie.ro"
                      value={newContact.website}
                      onChange={(e) => setNewContact(prev => ({ ...prev, website: e.target.value }))}
                      className="rounded-lg"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Persoana de contact</Label>
                    <Input
                      placeholder="Ex: Ion Popescu"
                      value={newContact.contactName}
                      onChange={(e) => setNewContact(prev => ({ ...prev, contactName: e.target.value }))}
                      className="rounded-lg"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Rol / Functie</Label>
                    <Input
                      placeholder="Ex: Editor, Jurnalist, PR Manager"
                      value={newContact.contactRole}
                      onChange={(e) => setNewContact(prev => ({ ...prev, contactRole: e.target.value }))}
                      className="rounded-lg"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Email</Label>
                    <Input
                      type="email"
                      placeholder="redactie@publicatie.ro"
                      value={newContact.email}
                      onChange={(e) => setNewContact(prev => ({ ...prev, email: e.target.value }))}
                      className="rounded-lg"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Telefon</Label>
                    <Input
                      placeholder="07xxxxxxxx"
                      value={newContact.phone}
                      onChange={(e) => setNewContact(prev => ({ ...prev, phone: e.target.value }))}
                      className="rounded-lg"
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="border-t bg-muted/20 pt-4 gap-2">
                <Button
                  onClick={handleSaveContact}
                  disabled={savingContact || !newContact.publicationName.trim()}
                  className="bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white shadow-md rounded-lg"
                >
                  {savingContact ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Salveaza
                </Button>
                <Button variant="outline" className="rounded-lg" onClick={() => setShowContactForm(false)}>
                  Anuleaza
                </Button>
              </CardFooter>
            </Card>
          )}

          {/* Contacts List */}
          {contactsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : contacts.length === 0 ? (
            <Card className="border-0 shadow-md">
              <CardContent className="py-12 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 mx-auto mb-4">
                  <Users className="h-8 w-8" />
                </div>
                <h3 className="text-lg font-semibold mb-1">Niciun contact de presa</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Adauga contacte de presa manual sau lasa AI-ul sa gaseasca publicatii din orasul tau.
                </p>
                <Button
                  onClick={() => setShowContactForm(true)}
                  className="bg-gradient-to-r from-rose-500 to-pink-600 text-white rounded-lg"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Adauga primul contact
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3">
              {contacts.map((contact) => (
                <Card key={contact.id} className="border-0 shadow-md hover:shadow-lg transition-all duration-200 overflow-hidden">
                  <CardContent className="py-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-rose-100 to-pink-100 text-rose-600 shrink-0">
                        <Newspaper className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-sm">{contact.publicationName}</h4>
                          {pubTypeLabel(contact.publicationType)}
                          {contact.isVerified && (
                            <Badge className="bg-green-100 text-green-700 border-green-200 text-xs">
                              <CheckCircle2 className="h-2.5 w-2.5 mr-0.5" /> Verificat
                            </Badge>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                          {contact.city && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {contact.city}{contact.county ? `, ${contact.county}` : ""}
                            </span>
                          )}
                          {contact.contactName && (
                            <span className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {contact.contactName}{contact.contactRole ? ` (${contact.contactRole})` : ""}
                            </span>
                          )}
                          {contact.email && (
                            <span className="flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {contact.email}
                            </span>
                          )}
                          {contact.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {contact.phone}
                            </span>
                          )}
                          {contact.website && (
                            <a href={contact.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-primary">
                              <Globe className="h-3 w-3" />
                              Website
                              <ExternalLink className="h-2.5 w-2.5" />
                            </a>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-red-500 hover:bg-red-50 rounded-lg shrink-0"
                        onClick={() => handleDeleteContact(contact.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Press Releases Tab */}
        <TabsContent value="releases" className="space-y-4 mt-4">
          <div className="flex items-center justify-between">
            <div />
            <Button
              className="bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white shadow-md rounded-lg"
              onClick={() => setShowReleaseForm(!showReleaseForm)}
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              Comunicat nou
            </Button>
          </div>

          {/* New Release Form */}
          {showReleaseForm && (
            <Card className="border-0 shadow-lg overflow-hidden">
              <div className="h-1 bg-gradient-to-r from-violet-500 to-purple-500" />
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-md">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Comunicat de presa nou</CardTitle>
                    <CardDescription>Scrie sau genereaza cu AI un comunicat de presa profesional.</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Titlu comunicat *</Label>
                  <Input
                    placeholder="Ex: Lansare campanie de educatie pentru copii defavorizati"
                    value={newRelease.title}
                    onChange={(e) => setNewRelease(prev => ({ ...prev, title: e.target.value }))}
                    className="rounded-lg"
                  />
                </div>
                <div className="grid gap-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Context / Idei cheie</Label>
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-lg text-xs h-7"
                      onClick={handleGenerateRelease}
                      disabled={generatingRelease || !newRelease.title.trim()}
                    >
                      {generatingRelease ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Sparkles className="mr-1 h-3 w-3 text-violet-500" />}
                      Genereaza cu AI
                    </Button>
                  </div>
                  <Textarea
                    placeholder="Descrie pe scurt ce vrei sa comunici - AI-ul va genera un comunicat complet..."
                    value={newRelease.summary}
                    onChange={(e) => setNewRelease(prev => ({ ...prev, summary: e.target.value }))}
                    className="min-h-[60px] rounded-lg"
                  />
                </div>
                <div className="grid gap-2">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Corpul comunicatului</Label>
                  <Textarea
                    placeholder="Textul complet al comunicatului de presa..."
                    value={newRelease.body}
                    onChange={(e) => setNewRelease(prev => ({ ...prev, body: e.target.value }))}
                    className="min-h-[200px] rounded-lg"
                  />
                </div>
                <div className="grid gap-2">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">URL imagine (optional)</Label>
                  <Input
                    placeholder="https://..."
                    value={newRelease.imageUrl}
                    onChange={(e) => setNewRelease(prev => ({ ...prev, imageUrl: e.target.value }))}
                    className="rounded-lg"
                  />
                </div>
              </CardContent>
              <CardFooter className="border-t bg-muted/20 pt-4 gap-2">
                <Button
                  onClick={handleSaveRelease}
                  disabled={savingRelease || !newRelease.title.trim() || !newRelease.body.trim()}
                  className="bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white shadow-md rounded-lg"
                >
                  {savingRelease ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Salveaza comunicat
                </Button>
                <Button variant="outline" className="rounded-lg" onClick={() => setShowReleaseForm(false)}>
                  Anuleaza
                </Button>
              </CardFooter>
            </Card>
          )}

          {/* Releases List */}
          {releasesLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : releases.length === 0 ? (
            <Card className="border-0 shadow-md">
              <CardContent className="py-12 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-100 text-violet-600 mx-auto mb-4">
                  <FileText className="h-8 w-8" />
                </div>
                <h3 className="text-lg font-semibold mb-1">Niciun comunicat de presa</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Creeaza primul comunicat de presa si trimite-l la contactele tale sau prin MediaExpress.
                </p>
                <Button
                  onClick={() => setShowReleaseForm(true)}
                  className="bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-lg"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Creeaza comunicat
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3">
              {releases.map((release) => (
                <Card key={release.id} className="border-0 shadow-md hover:shadow-lg transition-all duration-200 overflow-hidden">
                  <CardContent className="py-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-100 to-purple-100 text-violet-600 shrink-0">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-sm line-clamp-1">{release.title}</h4>
                          {releaseStatusBadge(release.status)}
                          {release.mediaExpressOrderId && (
                            <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-xs">
                              <Zap className="h-2.5 w-2.5 mr-0.5" /> MediaExpress
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                          {release.summary || release.body?.slice(0, 150)}
                        </p>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(release.createdAt).toLocaleDateString("ro-RO")}
                          </span>
                          {release.publishedCount > 0 && (
                            <span className="flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3 text-green-500" />
                              {release.publishedCount} publicatii
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        {release.status === "DRAFT" && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="rounded-lg text-xs h-8"
                            onClick={() => handleSendToContacts(release.id)}
                          >
                            <Send className="h-3 w-3 mr-1" />
                            Trimite
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* MediaExpress Tab */}
        <TabsContent value="mediaexpress" className="space-y-4 mt-4">
          {/* MediaExpress Info Card */}
          <Card className="border-0 shadow-lg overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border-b">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-md">
                  <Zap className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-lg">MediaExpress - Distribuie in presa</CardTitle>
                  <CardDescription>
                    Publica un articol sau comunicat in 50+ ziare si publicatii online din Romania. Trimiti articolul si poza, primesti raport in 24h.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-5 space-y-4">
              {/* Single Package: Articol in presa - 1000 LEI */}
              <div className="max-w-lg mx-auto">
                <Card className="border-2 border-violet-500 shadow-lg bg-violet-50/50">
                  <CardContent className="pt-6 pb-5 text-center">
                    <Badge className="mb-3 bg-gradient-to-r from-violet-500 to-purple-600 text-white text-xs">Pachet unic</Badge>
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-400 to-purple-500 text-white mx-auto mb-4">
                      <Star className="h-7 w-7" />
                    </div>
                    <h3 className="font-bold text-xl mb-1">Articol in presa</h3>
                    <p className="text-3xl font-bold text-violet-600 mb-1">1.000 LEI</p>
                    <p className="text-sm text-muted-foreground mb-4">Articolul tau publicat in reteaua MediaExpress</p>
                    <div className="space-y-2.5 text-sm text-left">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                        <span>Publicare in <strong>~50 site-uri</strong> (41 locale + 9 nationale)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                        <span>Distribuire pe <strong>paginile de Facebook</strong> ale publicatiilor</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                        <span>Retea cu peste <strong>300.000 de cititori</strong></span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                        <span>Include poza + multimedia</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                        <span>Raport detaliat cu link-uri in 24h</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                        <span>SEO boost + backlink-uri + vizibilitate nationala</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Select Release to Send */}
              <Card className="bg-muted/30 border-dashed">
                <CardContent className="pt-5 pb-4">
                  <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <Send className="h-4 w-4" />
                    Trimite comunicat prin MediaExpress
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Selecteaza comunicatul</Label>
                      <Select value={selectedReleaseId} onValueChange={setSelectedReleaseId}>
                        <SelectTrigger className="rounded-lg">
                          <SelectValue placeholder="Alege un comunicat..." />
                        </SelectTrigger>
                        <SelectContent>
                          {releases.filter(r => r.status === "DRAFT" || r.status === "SENT").map(r => (
                            <SelectItem key={r.id} value={r.id}>
                              {r.title.slice(0, 60)}{r.title.length > 60 ? "..." : ""}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Pachet selectat</Label>
                      <div className="flex items-center gap-2 h-10 px-3 rounded-lg bg-background border text-sm">
                        Articol in presa - 1.000 LEI (~50 site-uri)
                      </div>
                    </div>
                  </div>
                  <Button
                    onClick={handleSendToMediaExpress}
                    disabled={sendingToME || !selectedReleaseId}
                    className="mt-4 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-md rounded-lg"
                  >
                    {sendingToME ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Zap className="mr-2 h-4 w-4" />
                    )}
                    Comanda publicare MediaExpress
                  </Button>
                </CardContent>
              </Card>

              {/* How it works */}
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 rounded-xl p-5">
                <h4 className="text-sm font-semibold mb-3">Cum functioneaza MediaExpress?</h4>
                <div className="grid grid-cols-4 gap-4">
                  {[
                    { step: "1", title: "Scrie comunicatul", desc: "Creeaza sau genereaza cu AI", icon: FileText },
                    { step: "2", title: "Alege pachetul", desc: "Articol in presa - 1.000 LEI", icon: Package },
                    { step: "3", title: "Trimite comanda", desc: "Se proceseaza automat", icon: Send },
                    { step: "4", title: "Primesti raport", desc: "Link-uri in 24h", icon: CheckCircle2 },
                  ].map((item) => (
                    <div key={item.step} className="text-center">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-200 text-amber-800 font-bold text-sm mx-auto mb-2">
                        {item.step}
                      </div>
                      <p className="text-xs font-semibold">{item.title}</p>
                      <p className="text-[11px] text-muted-foreground">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Link to MediaExpress */}
              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
                    <Globe className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">MediaExpress.ro</p>
                    <p className="text-xs text-muted-foreground">Serviciu extern de distribuire in presa romaneasca</p>
                  </div>
                </div>
                <a
                  href="https://mediaexpress.ro/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-amber-600 hover:text-amber-700 font-medium"
                >
                  Viziteaza site-ul
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <PageHelp items={[
        { title: "Contacte presa", description: "Adauga si gestioneaza contacte de presa - publicatii locale, nationale, TV, radio, bloguri." },
        { title: "Comunicate de presa", description: "Scrie sau genereaza cu AI comunicate de presa profesionale si trimite-le la contactele tale." },
        { title: "MediaExpress", description: "Distribuie articole in 50-200 de publicatii online din Romania prin serviciul MediaExpress." },
        { title: "Cauta contacte AI", description: "AI-ul poate gasi automat publicatii si adrese de email din orasul tau." },
      ]} chatHint="Gestioneaza reteaua media a organizatiei tale si distribuie comunicate in presa." />
    </div>
    </PlanGate>
  );
}

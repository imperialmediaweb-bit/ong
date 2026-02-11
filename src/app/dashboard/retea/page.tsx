"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Users, Search, MessageCircle, UserPlus, Check, X,
  Loader2, Send, Building, Heart, Globe, ChevronRight, Briefcase,
  Sparkles, Linkedin, Copy, Mail, ExternalLink, Save, MapPin, Target,
  UserSearch, ArrowRight, Phone, AlertTriangle, Settings, Zap,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { SponsorCRM } from "@/components/dashboard/sponsor-crm";

// ────────────────────────────────────────────
// Types
// ────────────────────────────────────────────

interface NgoInfo {
  id: string;
  name: string;
  slug: string;
  category?: string | null;
  logoUrl?: string | null;
}

interface UserInfo {
  id: string;
  name: string | null;
  email: string;
  role: string;
  ngo?: NgoInfo | null;
}

interface ConnectionItem {
  id: string;
  user: UserInfo;
  connectedAt?: string;
  requestedAt?: string;
  message?: string | null;
}

interface ConversationItem {
  user: UserInfo;
  lastMessage: {
    id: string;
    content: string;
    senderId: string;
    isRead: boolean;
    createdAt: string;
  };
  unreadCount: number;
}

interface MessageItem {
  id: string;
  senderId: string;
  content: string;
  isRead: boolean;
  createdAt: string;
  sender: {
    id: string;
    name: string | null;
    email: string;
    ngo?: { name: string; logoUrl?: string | null } | null;
  };
}

interface DiscoverItem {
  ngo: {
    id: string;
    name: string;
    slug: string;
    description?: string | null;
    category?: string | null;
    logoUrl?: string | null;
    coverImageUrl?: string | null;
    websiteUrl?: string | null;
    rating: number;
    ratingCount: number;
    totalRaised: number;
    isFeatured: boolean;
  };
  user: {
    id: string;
    name: string | null;
    email: string;
    role: string;
  };
  connectionStatus: string | null;
  memberCount: number;
}

// ────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────

function getInitial(name: string | null | undefined, email?: string): string {
  if (name && name.length > 0) return name.charAt(0).toUpperCase();
  if (email && email.length > 0) return email.charAt(0).toUpperCase();
  return "?";
}

function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffH = Math.floor(diffMs / 3600000);
  const diffD = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return "acum";
  if (diffMin < 60) return `acum ${diffMin} min`;
  if (diffH < 24) return `acum ${diffH} ore`;
  if (diffD < 7) return `acum ${diffD} zile`;
  return date.toLocaleDateString("ro-RO", { day: "numeric", month: "short" });
}

function formatFullDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("ro-RO", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

// ────────────────────────────────────────────
// Avatar component
// ────────────────────────────────────────────

function Avatar({ name, email, className = "" }: { name: string | null | undefined; email?: string; className?: string }) {
  const colors = [
    "bg-blue-500", "bg-green-500", "bg-purple-500", "bg-orange-500",
    "bg-pink-500", "bg-teal-500", "bg-indigo-500", "bg-red-500",
  ];
  const letter = getInitial(name, email);
  const colorIndex = letter.charCodeAt(0) % colors.length;

  return (
    <div className={`flex items-center justify-center rounded-full text-white font-semibold ${colors[colorIndex]} ${className}`}>
      {letter}
    </div>
  );
}

// ────────────────────────────────────────────
// Main page
// ────────────────────────────────────────────

export default function ReteaPage() {
  const { data: session } = useSession();
  const currentUserId = (session?.user as any)?.id;

  const [activeTab, setActiveTab] = useState("prospectare");

  // Connections state
  const [accepted, setAccepted] = useState<ConnectionItem[]>([]);
  const [pendingReceived, setPendingReceived] = useState<ConnectionItem[]>([]);
  const [pendingSent, setPendingSent] = useState<ConnectionItem[]>([]);
  const [loadingConnections, setLoadingConnections] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Prospect state
  const [prospectKeywords, setProspectKeywords] = useState("");
  const [prospectIndustry, setProspectIndustry] = useState("");
  const [prospectCity, setProspectCity] = useState("");
  const [prospectResults, setProspectResults] = useState<any[]>([]);
  const [prospectLoading, setProspectLoading] = useState(false);
  const [prospectSaving, setProspectSaving] = useState<string | null>(null);
  const [prospectSaved, setProspectSaved] = useState<Set<string>>(new Set());
  const [prospectMsg, setProspectMsg] = useState<{ company: string; loading: boolean; message?: string; subject?: string; tips?: string[]; channel?: string } | null>(null);

  // Discover state
  const [discoverResults, setDiscoverResults] = useState<DiscoverItem[]>([]);
  const [discoverCategories, setDiscoverCategories] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [loadingDiscover, setLoadingDiscover] = useState(true);
  const [connectingTo, setConnectingTo] = useState<string | null>(null);

  // Messages state
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<MessageItem[]>([]);
  const [chatPartner, setChatPartner] = useState<UserInfo | null>(null);
  const [loadingChat, setLoadingChat] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  // ─── Fetch connections ──────────────────
  const fetchConnections = async () => {
    try {
      const res = await fetch("/api/retea/connections");
      if (!res.ok) throw new Error("Failed to fetch connections");
      const data = await res.json();
      setAccepted(data.accepted || []);
      setPendingReceived(data.pendingReceived || []);
      setPendingSent(data.pendingSent || []);
    } catch (err) {
      console.error("Error fetching connections:", err);
    } finally {
      setLoadingConnections(false);
    }
  };

  // ─── Fetch discover ────────────────────
  const fetchDiscover = async (q = "", cat = "") => {
    setLoadingDiscover(true);
    try {
      const params = new URLSearchParams();
      if (q) params.set("q", q);
      if (cat) params.set("category", cat);
      const res = await fetch(`/api/retea/discover?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch discover");
      const data = await res.json();
      setDiscoverResults(data.results || []);
      setDiscoverCategories(data.categories || []);
    } catch (err) {
      console.error("Error fetching discover:", err);
    } finally {
      setLoadingDiscover(false);
    }
  };

  // ─── Fetch conversations ───────────────
  const fetchConversations = async () => {
    try {
      const res = await fetch("/api/retea/messages");
      if (!res.ok) throw new Error("Failed to fetch conversations");
      const data = await res.json();
      setConversations(data.conversations || []);
    } catch (err) {
      console.error("Error fetching conversations:", err);
    } finally {
      setLoadingConversations(false);
    }
  };

  // ─── Fetch chat messages ───────────────
  const fetchChatMessages = async (userId: string, showLoader = true) => {
    if (showLoader) setLoadingChat(true);
    try {
      const res = await fetch(`/api/retea/messages/${userId}`);
      if (!res.ok) throw new Error("Failed to fetch messages");
      const data = await res.json();
      setChatMessages(data.messages || []);
      setChatPartner(data.otherUser || null);
    } catch (err) {
      console.error("Error fetching chat:", err);
    } finally {
      setLoadingChat(false);
    }
  };

  // ─── Send connection request ───────────
  const sendConnectionRequest = async (receiverId: string) => {
    setConnectingTo(receiverId);
    try {
      const res = await fetch("/api/retea/connections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receiverId }),
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Eroare la trimiterea cererii");
        return;
      }
      // Refresh discover and connections
      await Promise.all([
        fetchDiscover(searchQuery, selectedCategory),
        fetchConnections(),
      ]);
    } catch (err) {
      console.error("Error sending connection request:", err);
      alert("Eroare la trimiterea cererii de conectare");
    } finally {
      setConnectingTo(null);
    }
  };

  // ─── Accept / reject connection ────────
  const handleConnectionAction = async (connectionId: string, action: "accept" | "reject") => {
    setActionLoading(connectionId);
    try {
      const res = await fetch(`/api/retea/connections/${connectionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Eroare la procesarea cererii");
        return;
      }
      await fetchConnections();
    } catch (err) {
      console.error("Error handling connection action:", err);
    } finally {
      setActionLoading(null);
    }
  };

  // ─── Cancel / delete connection ────────
  const handleDeleteConnection = async (connectionId: string) => {
    setActionLoading(connectionId);
    try {
      const res = await fetch(`/api/retea/connections/${connectionId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Eroare la stergerea conexiunii");
        return;
      }
      await fetchConnections();
    } catch (err) {
      console.error("Error deleting connection:", err);
    } finally {
      setActionLoading(null);
    }
  };

  // ─── Send message ─────────────────────
  const handleSendMessage = async () => {
    if (!selectedConversation || !newMessage.trim()) return;
    setSendingMessage(true);
    try {
      const res = await fetch("/api/retea/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          receiverId: selectedConversation,
          content: newMessage.trim(),
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Eroare la trimiterea mesajului");
        return;
      }
      setNewMessage("");
      await fetchChatMessages(selectedConversation, false);
      await fetchConversations();
    } catch (err) {
      console.error("Error sending message:", err);
    } finally {
      setSendingMessage(false);
    }
  };

  // ─── Open chat from connections tab ────
  const openChatWith = (userId: string) => {
    setActiveTab("mesaje");
    setSelectedConversation(userId);
  };

  // ─── Prospect: Search companies ──────
  const handleProspectSearch = async () => {
    if (!prospectKeywords.trim() && !prospectIndustry.trim()) return;
    setProspectLoading(true);
    setProspectResults([]);
    try {
      const res = await fetch("/api/sponsors/prospect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          keywords: prospectKeywords,
          industry: prospectIndustry,
          city: prospectCity,
          count: 8,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data?.noProvider) {
          alert("Niciun provider AI configurat. Mergeti la Super Admin > Setari pentru a adauga chei API (OpenAI, Claude sau Gemini).");
        } else {
          alert(data?.error || "Eroare la cautare");
        }
        return;
      }
      setProspectResults(data.companies || []);
    } catch (err) {
      console.error("Prospect search error:", err);
      alert("Eroare la cautare. Verificati conexiunea.");
    } finally {
      setProspectLoading(false);
    }
  };

  // ─── Prospect: Save to CRM ──────────
  const handleProspectSave = async (company: any) => {
    setProspectSaving(company.name);
    try {
      const res = await fetch("/api/sponsors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: company.name,
          domain: company.website?.replace(/https?:\/\/(www\.)?/, "").replace(/\/.*/, "") || null,
          website: company.website || null,
          industry: company.industry || null,
          city: company.city || null,
          country: "Romania",
          status: "NEW",
          tags: ["prospectare-ai"],
          notes: [company.description, company.whySponsor, company.contactTip ? `Abordare: ${company.contactTip}` : ""].filter(Boolean).join("\n"),
        }),
      });
      if (res.ok) {
        setProspectSaved((prev) => new Set(prev).add(company.name));
      } else if (res.status === 409) {
        setProspectSaved((prev) => new Set(prev).add(company.name));
      } else {
        alert("Eroare la salvarea companiei");
      }
    } catch (err) {
      console.error("Save sponsor error:", err);
    } finally {
      setProspectSaving(null);
    }
  };

  // ─── Prospect: Generate message ──────
  const handleProspectMessage = async (company: any, channel: "linkedin" | "email") => {
    setProspectMsg({ company: company.name, loading: true, channel });
    try {
      const res = await fetch("/api/sponsors/prospect/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName: company.name,
          industry: company.industry,
          city: company.city,
          whySponsor: company.whySponsor,
          channel,
        }),
      });
      if (!res.ok) {
        setProspectMsg(null);
        alert("Eroare la generarea mesajului");
        return;
      }
      const data = await res.json();
      setProspectMsg({
        company: company.name,
        loading: false,
        message: data.message,
        subject: data.subject,
        tips: data.tips,
        channel,
      });
    } catch (err) {
      console.error("Prospect message error:", err);
      setProspectMsg(null);
    }
  };

  // ─── Effects ──────────────────────────

  useEffect(() => {
    fetchConnections();
    fetchConversations();
    fetchDiscover();
  }, []);

  // Poll for new messages when a conversation is open
  useEffect(() => {
    if (selectedConversation) {
      fetchChatMessages(selectedConversation);

      pollingRef.current = setInterval(() => {
        fetchChatMessages(selectedConversation, false);
      }, 5000);

      return () => {
        if (pollingRef.current) clearInterval(pollingRef.current);
      };
    } else {
      setChatMessages([]);
      setChatPartner(null);
    }
  }, [selectedConversation]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  // Debounced search for discover
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchDiscover(searchQuery, selectedCategory);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, selectedCategory]);

  // ────────────────────────────────────────
  // Render
  // ────────────────────────────────────────

  const totalUnread = conversations.reduce((sum, c) => sum + c.unreadCount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Retea & Companii Sponsori</h1>
        <p className="text-muted-foreground">
          Gestioneaza companiile sponsor, contacteaza factorii de decizie si descopera parteneri noi.
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-0 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Prospecte AI</CardTitle>
            <Target className="h-4 w-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{prospectResults.length}</div>
            <p className="text-xs text-muted-foreground">
              Companii gasite cu AI
            </p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conexiuni</CardTitle>
            <Users className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{accepted.length}</div>
            <p className="text-xs text-muted-foreground">
              {pendingReceived.length > 0
                ? `${pendingReceived.length} cereri in asteptare`
                : "Conexiuni acceptate"}
            </p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversatii</CardTitle>
            <MessageCircle className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{conversations.length}</div>
            <p className="text-xs text-muted-foreground">
              {totalUnread > 0
                ? `${totalUnread} mesaje necitite`
                : "Toate mesajele citite"}
            </p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Organizatii</CardTitle>
            <Building className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{discoverResults.length}</div>
            <p className="text-xs text-muted-foreground">
              Disponibile pentru conectare
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="prospectare" className="flex items-center gap-1.5 text-xs sm:text-sm">
            <Target className="h-4 w-4" />
            <span className="hidden sm:inline">Prospectare</span>
            <span className="sm:hidden">Cauta</span>
          </TabsTrigger>
          <TabsTrigger value="sponsori" className="flex items-center gap-1.5 text-xs sm:text-sm">
            <Briefcase className="h-4 w-4" />
            <span className="hidden sm:inline">Companii</span>
            <span className="sm:hidden">CRM</span>
          </TabsTrigger>
          <TabsTrigger value="conexiuni" className="flex items-center gap-1.5 text-xs sm:text-sm">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Conexiuni</span>
            <span className="sm:hidden">Retea</span>
            {pendingReceived.length > 0 && (
              <Badge variant="destructive" className="ml-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center">
                {pendingReceived.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="descopera" className="flex items-center gap-1.5 text-xs sm:text-sm">
            <Search className="h-4 w-4" />
            <span className="hidden sm:inline">Descopera</span>
            <span className="sm:hidden">ONG</span>
          </TabsTrigger>
          <TabsTrigger value="mesaje" className="flex items-center gap-1.5 text-xs sm:text-sm">
            <MessageCircle className="h-4 w-4" />
            <span className="hidden sm:inline">Mesaje</span>
            <span className="sm:hidden">Chat</span>
            {totalUnread > 0 && (
              <Badge variant="destructive" className="ml-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center">
                {totalUnread}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* ═══════════════════════════════════════ */}
        {/* PROSPECTARE COMPANII TAB               */}
        {/* ═══════════════════════════════════════ */}
        <TabsContent value="prospectare" className="space-y-6">
          {/* Search Form */}
          <Card className="border-0 shadow-md overflow-hidden">
            <div className="h-1.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600" />
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-3 text-lg">
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-lg">
                  <Target className="h-5 w-5" />
                </div>
                <div>
                  <span>Prospectare Companii & Factori de Decizie</span>
                  <p className="text-sm font-normal text-muted-foreground mt-0.5">
                    Gaseste companii potentiale sponsor, identifica persoane de contact si genereaza mesaje personalizate
                  </p>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Cuvinte cheie *</label>
                  <Input
                    placeholder="Ex: IT, software, banci, retail..."
                    value={prospectKeywords}
                    onChange={(e) => setProspectKeywords(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleProspectSearch()}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Industrie</label>
                  <Input
                    placeholder="Ex: Tehnologie, Constructii..."
                    value={prospectIndustry}
                    onChange={(e) => setProspectIndustry(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Oras</label>
                  <Input
                    placeholder="Ex: Bucuresti, Cluj, Timisoara..."
                    value={prospectCity}
                    onChange={(e) => setProspectCity(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex flex-wrap gap-3 mt-4">
                <Button
                  onClick={handleProspectSearch}
                  disabled={prospectLoading || (!prospectKeywords.trim() && !prospectIndustry.trim())}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-md"
                >
                  {prospectLoading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4 mr-2" />
                  )}
                  Cauta cu AI
                </Button>
                {(prospectKeywords.trim() || prospectIndustry.trim()) && (
                  <a
                    href={`https://www.linkedin.com/search/results/companies/?keywords=${encodeURIComponent([prospectKeywords, prospectIndustry, prospectCity].filter(Boolean).join(" "))}&origin=GLOBAL_SEARCH_HEADER`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button variant="outline" type="button">
                      <Linkedin className="h-4 w-4 mr-2 text-[#0A66C2]" />
                      Cauta pe LinkedIn
                    </Button>
                  </a>
                )}
                {prospectResults.length > 0 && (
                  <p className="text-sm text-muted-foreground self-center ml-auto">
                    <Zap className="h-3.5 w-3.5 inline mr-1" />
                    {prospectResults.length} companii gasite
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Quick LinkedIn search suggestions */}
          {!prospectLoading && prospectResults.length === 0 && (
            <>
              <div className="grid gap-4 sm:grid-cols-3">
                <Card className="border-0 shadow-sm hover:shadow-md transition-all cursor-pointer group"
                  onClick={() => window.open("https://www.linkedin.com/search/results/companies/?keywords=Romania&origin=GLOBAL_SEARCH_HEADER", "_blank")}>
                  <CardContent className="p-5 flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-[#0A66C2]/10 text-[#0A66C2] group-hover:bg-[#0A66C2] group-hover:text-white transition-colors">
                      <Building className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">Cauta companii</p>
                      <p className="text-xs text-muted-foreground">Deschide LinkedIn Companies</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                  </CardContent>
                </Card>
                <Card className="border-0 shadow-sm hover:shadow-md transition-all cursor-pointer group"
                  onClick={() => window.open("https://www.linkedin.com/search/results/people/?keywords=CSR%20Romania&origin=GLOBAL_SEARCH_HEADER", "_blank")}>
                  <CardContent className="p-5 flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-purple-100 text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                      <UserSearch className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">Factori de decizie</p>
                      <p className="text-xs text-muted-foreground">Cauta persoane CSR / HR</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                  </CardContent>
                </Card>
                <Card className="border-0 shadow-sm hover:shadow-md transition-all cursor-pointer group"
                  onClick={() => window.open("https://www.linkedin.com/search/results/people/?keywords=Director%20General%20Romania&origin=GLOBAL_SEARCH_HEADER", "_blank")}>
                  <CardContent className="p-5 flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-amber-100 text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition-colors">
                      <Briefcase className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">CEO / Directori</p>
                      <p className="text-xs text-muted-foreground">Cauta directori executivi</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                  </CardContent>
                </Card>
              </div>

              {/* How it works */}
              <Card className="border-0 shadow-sm bg-gradient-to-br from-slate-50 to-blue-50/30">
                <CardContent className="py-8">
                  <h3 className="text-center text-lg font-bold mb-6">Cum functioneaza prospectarea</h3>
                  <div className="grid gap-6 sm:grid-cols-4">
                    <div className="text-center space-y-2">
                      <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mx-auto text-blue-600 font-bold text-lg">1</div>
                      <h4 className="text-sm font-semibold">Cauta</h4>
                      <p className="text-xs text-muted-foreground">Introdu cuvinte cheie, industrie sau oras. AI-ul gaseste companii potrivite din Romania.</p>
                    </div>
                    <div className="text-center space-y-2">
                      <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center mx-auto text-indigo-600 font-bold text-lg">2</div>
                      <h4 className="text-sm font-semibold">Identifica</h4>
                      <p className="text-xs text-muted-foreground">Fiecare companie vine cu factori de decizie si link-uri LinkedIn pentru contact direct.</p>
                    </div>
                    <div className="text-center space-y-2">
                      <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center mx-auto text-purple-600 font-bold text-lg">3</div>
                      <h4 className="text-sm font-semibold">Contacteaza</h4>
                      <p className="text-xs text-muted-foreground">Genereaza mesaje personalizate pentru LinkedIn sau email, copiaza si trimite direct.</p>
                    </div>
                    <div className="text-center space-y-2">
                      <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mx-auto text-emerald-600 font-bold text-lg">4</div>
                      <h4 className="text-sm font-semibold">Salveaza</h4>
                      <p className="text-xs text-muted-foreground">Salveaza companiile in CRM si urmareste pipeline-ul de sponsorizare.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {/* Loading state */}
          {prospectLoading && (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="relative">
                <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
                <Sparkles className="h-5 w-5 text-purple-500 absolute -top-1 -right-1 animate-pulse" />
              </div>
              <p className="text-base font-medium mt-4">AI analizeaza companii potrivite...</p>
              <p className="text-sm text-muted-foreground mt-1">Cautam companii, factori de decizie si potrivirea cu organizatia ta</p>
            </div>
          )}

          {/* Results */}
          {!prospectLoading && prospectResults.length > 0 && (
            <div className="space-y-4">
              {prospectResults.map((company, idx) => (
                <Card key={`${company.name}-${idx}`} className="group hover:shadow-lg transition-all duration-300 border-0 shadow-sm overflow-hidden">
                  <div className="h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />
                  <CardContent className="p-5">
                    <div className="flex flex-col lg:flex-row gap-5">
                      {/* Left: Company info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-3 mb-3">
                          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 text-slate-600 flex-shrink-0">
                            <Building className="h-6 w-6" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-base">{company.name}</h3>
                            <div className="flex flex-wrap gap-2 mt-1">
                              {company.industry && (
                                <Badge className="text-xs bg-blue-100 text-blue-700 hover:bg-blue-200">{company.industry}</Badge>
                              )}
                              {company.city && (
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                  <MapPin className="h-3 w-3" /> {company.city}
                                </span>
                              )}
                              {company.estimatedSize && (
                                <Badge variant="outline" className="text-xs capitalize">
                                  {company.estimatedSize}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>

                        {company.description && (
                          <p className="text-sm text-muted-foreground mb-3">{company.description}</p>
                        )}

                        {company.whySponsor && (
                          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 mb-3">
                            <p className="text-xs text-emerald-700">
                              <Target className="h-3 w-3 inline mr-1" />
                              <strong>De ce e potrivita:</strong> {company.whySponsor}
                            </p>
                          </div>
                        )}

                        {company.contactTip && (
                          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-3">
                            <p className="text-xs text-amber-700">
                              <Zap className="h-3 w-3 inline mr-1" />
                              <strong>Strategie de abordare:</strong> {company.contactTip}
                            </p>
                          </div>
                        )}

                        {/* Links row */}
                        <div className="flex flex-wrap gap-2">
                          {company.website && (
                            <a
                              href={company.website.startsWith("http") ? company.website : `https://${company.website}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 text-xs bg-gray-100 hover:bg-gray-200 rounded-full px-3 py-1.5 text-gray-700 transition-colors"
                            >
                              <Globe className="h-3 w-3" /> Website
                            </a>
                          )}
                          {company.linkedinUrl && (
                            <a
                              href={company.linkedinUrl.startsWith("http") ? company.linkedinUrl : `https://${company.linkedinUrl}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 text-xs bg-[#0A66C2]/10 hover:bg-[#0A66C2]/20 rounded-full px-3 py-1.5 text-[#0A66C2] transition-colors"
                            >
                              <Linkedin className="h-3 w-3" /> Pagina LinkedIn
                            </a>
                          )}
                          <a
                            href={`https://www.linkedin.com/search/results/companies/?keywords=${encodeURIComponent(company.name)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs bg-indigo-100 hover:bg-indigo-200 rounded-full px-3 py-1.5 text-indigo-700 transition-colors"
                          >
                            <Search className="h-3 w-3" /> Cauta compania pe LinkedIn
                          </a>
                        </div>
                      </div>

                      {/* Right: Decision makers */}
                      <div className="lg:w-72 flex-shrink-0">
                        <div className="bg-slate-50 rounded-xl p-4 border">
                          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
                            <UserSearch className="h-3.5 w-3.5" />
                            Factori de decizie
                          </h4>
                          {company.decisionMakers && company.decisionMakers.length > 0 ? (
                            <div className="space-y-2">
                              {company.decisionMakers.map((dm: any, dmIdx: number) => (
                                <a
                                  key={dmIdx}
                                  href={dm.linkedinSearch || `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(dm.title + " " + company.name)}&origin=GLOBAL_SEARCH_HEADER`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-white hover:shadow-sm transition-all group/dm"
                                >
                                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0A66C2]/10 text-[#0A66C2] flex-shrink-0 group-hover/dm:bg-[#0A66C2] group-hover/dm:text-white transition-colors">
                                    <Linkedin className="h-3.5 w-3.5" />
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <p className="text-xs font-medium truncate">{dm.title}</p>
                                    {dm.department && (
                                      <p className="text-[10px] text-muted-foreground">{dm.department}</p>
                                    )}
                                  </div>
                                  <ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 group-hover/dm:opacity-100 transition-opacity flex-shrink-0" />
                                </a>
                              ))}
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <a
                                href={`https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent("CEO " + company.name)}&origin=GLOBAL_SEARCH_HEADER`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-white hover:shadow-sm transition-all group/dm"
                              >
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0A66C2]/10 text-[#0A66C2] flex-shrink-0">
                                  <Linkedin className="h-3.5 w-3.5" />
                                </div>
                                <div>
                                  <p className="text-xs font-medium">CEO / Director General</p>
                                  <p className="text-[10px] text-muted-foreground">Management</p>
                                </div>
                              </a>
                              <a
                                href={`https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent("CSR " + company.name)}&origin=GLOBAL_SEARCH_HEADER`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-white hover:shadow-sm transition-all group/dm"
                              >
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0A66C2]/10 text-[#0A66C2] flex-shrink-0">
                                  <Linkedin className="h-3.5 w-3.5" />
                                </div>
                                <div>
                                  <p className="text-xs font-medium">CSR / Marketing Director</p>
                                  <p className="text-[10px] text-muted-foreground">CSR / Marketing</p>
                                </div>
                              </a>
                              <a
                                href={`https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent("HR " + company.name)}&origin=GLOBAL_SEARCH_HEADER`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-white hover:shadow-sm transition-all group/dm"
                              >
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0A66C2]/10 text-[#0A66C2] flex-shrink-0">
                                  <Linkedin className="h-3.5 w-3.5" />
                                </div>
                                <div>
                                  <p className="text-xs font-medium">HR Manager</p>
                                  <p className="text-[10px] text-muted-foreground">Resurse Umane</p>
                                </div>
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions bar */}
                    <div className="flex flex-wrap gap-2 pt-4 mt-4 border-t">
                      {prospectSaved.has(company.name) ? (
                        <Button size="sm" variant="outline" disabled className="text-emerald-600 border-emerald-300">
                          <Check className="h-3.5 w-3.5 mr-1.5" /> Salvat in CRM
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => handleProspectSave(company)}
                          disabled={prospectSaving === company.name}
                          className="bg-emerald-600 hover:bg-emerald-700"
                        >
                          {prospectSaving === company.name ? (
                            <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                          ) : (
                            <Save className="h-3.5 w-3.5 mr-1.5" />
                          )}
                          Salveaza in CRM
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-[#0A66C2]/30 text-[#0A66C2] hover:bg-[#0A66C2]/10"
                        onClick={() => handleProspectMessage(company, "linkedin")}
                        disabled={prospectMsg?.loading && prospectMsg.company === company.name}
                      >
                        {prospectMsg?.loading && prospectMsg.company === company.name && prospectMsg.channel === "linkedin" ? (
                          <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                        ) : (
                          <Linkedin className="h-3.5 w-3.5 mr-1.5" />
                        )}
                        Genereaza mesaj LinkedIn
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-indigo-300 text-indigo-600 hover:bg-indigo-50"
                        onClick={() => handleProspectMessage(company, "email")}
                        disabled={prospectMsg?.loading && prospectMsg.company === company.name}
                      >
                        {prospectMsg?.loading && prospectMsg.company === company.name && prospectMsg.channel === "email" ? (
                          <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                        ) : (
                          <Mail className="h-3.5 w-3.5 mr-1.5" />
                        )}
                        Genereaza email
                      </Button>
                      <a
                        href={`https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(company.name)}&origin=GLOBAL_SEARCH_HEADER`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-auto"
                      >
                        <Button size="sm" variant="ghost" className="text-[#0A66C2]">
                          <UserSearch className="h-3.5 w-3.5 mr-1.5" />
                          Toti angajatii pe LinkedIn
                          <ExternalLink className="h-3 w-3 ml-1" />
                        </Button>
                      </a>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Generated Message Modal */}
          {prospectMsg && !prospectMsg.loading && prospectMsg.message && (
            <Card className="border-[#0A66C2]/20 bg-[#0A66C2]/5 shadow-md sticky bottom-4">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    {prospectMsg.channel === "linkedin" ? (
                      <div className="p-1.5 rounded-lg bg-[#0A66C2] text-white">
                        <Linkedin className="h-4 w-4" />
                      </div>
                    ) : (
                      <div className="p-1.5 rounded-lg bg-indigo-600 text-white">
                        <Mail className="h-4 w-4" />
                      </div>
                    )}
                    Mesaj generat pentru {prospectMsg.company}
                  </CardTitle>
                  <Button size="sm" variant="ghost" onClick={() => setProspectMsg(null)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {prospectMsg.subject && (
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Subiect</label>
                    <div className="bg-white rounded-lg p-3 border mt-1 flex items-center justify-between">
                      <p className="text-sm font-medium">{prospectMsg.subject}</p>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => navigator.clipboard.writeText(prospectMsg.subject || "")}
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                )}
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Mesaj</label>
                  <div className="bg-white rounded-lg p-4 border mt-1">
                    <p className="text-sm whitespace-pre-wrap">{prospectMsg.message}</p>
                  </div>
                  <div className="flex gap-2 mt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const fullText = prospectMsg.subject
                          ? `Subiect: ${prospectMsg.subject}\n\n${prospectMsg.message}`
                          : prospectMsg.message || "";
                        navigator.clipboard.writeText(fullText);
                      }}
                    >
                      <Copy className="h-3.5 w-3.5 mr-1.5" /> Copiaza mesajul
                    </Button>
                    {prospectMsg.channel === "linkedin" && (
                      <a
                        href={`https://www.linkedin.com/search/results/companies/?keywords=${encodeURIComponent(prospectMsg.company)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Button size="sm" variant="outline" className="text-[#0A66C2] border-[#0A66C2]/30">
                          <Linkedin className="h-3.5 w-3.5 mr-1.5" /> Deschide LinkedIn
                        </Button>
                      </a>
                    )}
                  </div>
                </div>
                {prospectMsg.tips && prospectMsg.tips.length > 0 && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                    <p className="text-xs font-semibold text-amber-800 mb-1.5">Sfaturi pentru abordare:</p>
                    <ul className="space-y-1">
                      {prospectMsg.tips.map((tip, i) => (
                        <li key={i} className="text-xs text-amber-700 flex items-start gap-1.5">
                          <span className="text-amber-500 mt-0.5">&#8226;</span> {tip}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ═══════════════════════════════════════ */}
        {/* COMPANII SPONSORI TAB                  */}
        {/* ═══════════════════════════════════════ */}
        <TabsContent value="sponsori">
          <SponsorCRM />
        </TabsContent>

        {/* ═══════════════════════════════════════ */}
        {/* CONEXIUNI TAB                          */}
        {/* ═══════════════════════════════════════ */}
        <TabsContent value="conexiuni" className="space-y-6">
          {loadingConnections ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              {/* Pending received */}
              {pendingReceived.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <UserPlus className="h-5 w-5 text-orange-500" />
                    Cereri de conectare primite
                    <Badge variant="secondary">{pendingReceived.length}</Badge>
                  </h3>
                  <div className="grid gap-3 md:grid-cols-2">
                    {pendingReceived.map((item) => (
                      <Card key={item.id} className="border-orange-200 bg-orange-50/50">
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <Avatar name={item.user.name} email={item.user.email} className="h-12 w-12 text-lg shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold truncate">{item.user.name || item.user.email}</p>
                              {item.user.ngo && (
                                <p className="text-sm text-muted-foreground truncate flex items-center gap-1">
                                  <Building className="h-3 w-3" />
                                  {item.user.ngo.name}
                                </p>
                              )}
                              <p className="text-xs text-muted-foreground capitalize">{item.user.role.replace("_", " ").toLowerCase()}</p>
                              {item.message && (
                                <p className="text-sm text-muted-foreground mt-1 italic">&quot;{item.message}&quot;</p>
                              )}
                              <p className="text-xs text-muted-foreground mt-1">
                                {item.requestedAt && formatRelativeDate(item.requestedAt)}
                              </p>
                            </div>
                            <div className="flex gap-2 shrink-0">
                              <Button
                                size="sm"
                                onClick={() => handleConnectionAction(item.id, "accept")}
                                disabled={actionLoading === item.id}
                              >
                                {actionLoading === item.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Check className="h-4 w-4" />
                                )}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleConnectionAction(item.id, "reject")}
                                disabled={actionLoading === item.id}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Pending sent */}
              {pendingSent.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Loader2 className="h-5 w-5 text-blue-500" />
                    Cereri de conectare trimise
                    <Badge variant="secondary">{pendingSent.length}</Badge>
                  </h3>
                  <div className="grid gap-3 md:grid-cols-2">
                    {pendingSent.map((item) => (
                      <Card key={item.id} className="border-blue-200 bg-blue-50/50">
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <Avatar name={item.user.name} email={item.user.email} className="h-12 w-12 text-lg shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold truncate">{item.user.name || item.user.email}</p>
                              {item.user.ngo && (
                                <p className="text-sm text-muted-foreground truncate flex items-center gap-1">
                                  <Building className="h-3 w-3" />
                                  {item.user.ngo.name}
                                </p>
                              )}
                              <p className="text-xs text-muted-foreground capitalize">{item.user.role.replace("_", " ").toLowerCase()}</p>
                              <p className="text-xs text-muted-foreground mt-1">
                                Trimis {item.requestedAt && formatRelativeDate(item.requestedAt)}
                              </p>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600 hover:text-red-700 shrink-0"
                              onClick={() => handleDeleteConnection(item.id)}
                              disabled={actionLoading === item.id}
                            >
                              {actionLoading === item.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <>
                                  <X className="h-4 w-4 mr-1" /> Anuleaza
                                </>
                              )}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Accepted connections */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Users className="h-5 w-5 text-green-500" />
                  Conexiunile mele
                  <Badge variant="secondary">{accepted.length}</Badge>
                </h3>
                {accepted.length === 0 ? (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                      <Users className="h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold mb-2">Nicio conexiune inca</h3>
                      <p className="text-muted-foreground mb-4">
                        Descopera organizatii si trimite cereri de conectare pentru a incepe.
                      </p>
                      <Button onClick={() => setActiveTab("descopera")}>
                        <Search className="h-4 w-4 mr-2" />
                        Descopera organizatii
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                    {accepted.map((item) => (
                      <Card key={item.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <Avatar name={item.user.name} email={item.user.email} className="h-12 w-12 text-lg shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold truncate">{item.user.name || item.user.email}</p>
                              {item.user.ngo && (
                                <p className="text-sm text-muted-foreground truncate flex items-center gap-1">
                                  <Building className="h-3 w-3" />
                                  {item.user.ngo.name}
                                </p>
                              )}
                              <p className="text-xs text-muted-foreground capitalize">{item.user.role.replace("_", " ").toLowerCase()}</p>
                              {item.user.ngo?.category && (
                                <Badge variant="outline" className="mt-1 text-xs">
                                  {item.user.ngo.category}
                                </Badge>
                              )}
                              <p className="text-xs text-muted-foreground mt-1">
                                Conectat {item.connectedAt && formatRelativeDate(item.connectedAt)}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2 mt-3 pt-3 border-t">
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1"
                              onClick={() => openChatWith(item.user.id)}
                            >
                              <MessageCircle className="h-4 w-4 mr-1" />
                              Mesaj
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-red-500 hover:text-red-600 hover:bg-red-50"
                              onClick={() => handleDeleteConnection(item.id)}
                              disabled={actionLoading === item.id}
                            >
                              {actionLoading === item.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <X className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </TabsContent>

        {/* ═══════════════════════════════════════ */}
        {/* DESCOPERA TAB                          */}
        {/* ═══════════════════════════════════════ */}
        <TabsContent value="descopera" className="space-y-4">
          {/* Search and filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Cauta organizatii..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button
                size="sm"
                variant={selectedCategory === "" ? "default" : "outline"}
                onClick={() => setSelectedCategory("")}
              >
                Toate
              </Button>
              {discoverCategories.map((cat) => (
                <Button
                  key={cat}
                  size="sm"
                  variant={selectedCategory === cat ? "default" : "outline"}
                  onClick={() => setSelectedCategory(cat === selectedCategory ? "" : cat)}
                >
                  {cat}
                </Button>
              ))}
            </div>
          </div>

          {/* Results */}
          {loadingDiscover ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : discoverResults.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Building className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nicio organizatie gasita</h3>
                <p className="text-muted-foreground">
                  {searchQuery
                    ? `Nu am gasit rezultate pentru "${searchQuery}". Incearca alt termen.`
                    : "Nu exista organizatii disponibile momentan."}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {discoverResults.map((item) => (
                <Card key={item.ngo.id} className={`hover:shadow-md transition-shadow ${item.ngo.isFeatured ? "border-yellow-300 bg-yellow-50/30" : ""}`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start gap-3">
                      {item.ngo.logoUrl ? (
                        <img
                          src={item.ngo.logoUrl}
                          alt={item.ngo.name}
                          className="h-12 w-12 rounded-lg object-cover shrink-0"
                        />
                      ) : (
                        <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <Building className="h-6 w-6 text-primary" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-base truncate flex items-center gap-2">
                          {item.ngo.name}
                          {item.ngo.isFeatured && (
                            <Badge className="bg-yellow-100 text-yellow-800 text-xs">Promovat</Badge>
                          )}
                        </CardTitle>
                        <CardDescription className="flex items-center gap-2 mt-1">
                          {item.ngo.category && (
                            <Badge variant="outline" className="text-xs">{item.ngo.category}</Badge>
                          )}
                          {item.ngo.rating > 0 && (
                            <span className="text-xs flex items-center gap-1">
                              <Heart className="h-3 w-3 text-red-500 fill-red-500" />
                              {item.ngo.rating.toFixed(1)}
                            </span>
                          )}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    {item.ngo.description && (
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                        {item.ngo.description}
                      </p>
                    )}
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                      <Users className="h-3 w-3" />
                      <span>{item.user.name || item.user.email}</span>
                      {item.ngo.websiteUrl && (
                        <>
                          <Globe className="h-3 w-3 ml-2" />
                          <a
                            href={item.ngo.websiteUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:underline truncate"
                          >
                            Website
                          </a>
                        </>
                      )}
                    </div>

                    {/* Connection action */}
                    {item.connectionStatus === "ACCEPTED" ? (
                      <Button size="sm" variant="outline" className="w-full" disabled>
                        <Check className="h-4 w-4 mr-2 text-green-500" />
                        Conectat
                      </Button>
                    ) : item.connectionStatus === "PENDING" ? (
                      <Button size="sm" variant="outline" className="w-full" disabled>
                        <Loader2 className="h-4 w-4 mr-2" />
                        In asteptare
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        className="w-full"
                        onClick={() => sendConnectionRequest(item.user.id)}
                        disabled={connectingTo === item.user.id}
                      >
                        {connectingTo === item.user.id ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <UserPlus className="h-4 w-4 mr-2" />
                        )}
                        Conecteaza-te
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ═══════════════════════════════════════ */}
        {/* MESAJE TAB                             */}
        {/* ═══════════════════════════════════════ */}
        <TabsContent value="mesaje">
          <Card className="overflow-hidden">
            <div className="flex h-[600px]">
              {/* Conversations sidebar */}
              <div className={`w-full md:w-80 border-r flex flex-col ${selectedConversation ? "hidden md:flex" : "flex"}`}>
                <div className="p-3 border-b">
                  <h3 className="font-semibold text-sm">Conversatii</h3>
                </div>
                <div className="flex-1 overflow-y-auto">
                  {loadingConversations ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : conversations.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                      <MessageCircle className="h-10 w-10 text-muted-foreground mb-3" />
                      <p className="text-sm text-muted-foreground">
                        Nicio conversatie inca. Conecteaza-te cu alte organizatii si trimite primul mesaj.
                      </p>
                    </div>
                  ) : (
                    conversations.map((conv) => (
                      <button
                        key={conv.user.id}
                        onClick={() => setSelectedConversation(conv.user.id)}
                        className={`w-full p-3 flex items-start gap-3 hover:bg-muted/50 transition-colors text-left border-b ${
                          selectedConversation === conv.user.id ? "bg-muted" : ""
                        }`}
                      >
                        <Avatar name={conv.user.name} email={conv.user.email} className="h-10 w-10 text-sm shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className={`text-sm truncate ${conv.unreadCount > 0 ? "font-bold" : "font-medium"}`}>
                              {conv.user.name || conv.user.email}
                            </p>
                            <span className="text-xs text-muted-foreground shrink-0 ml-2">
                              {formatRelativeDate(conv.lastMessage.createdAt)}
                            </span>
                          </div>
                          {conv.user.ngo && (
                            <p className="text-xs text-muted-foreground truncate">{conv.user.ngo.name}</p>
                          )}
                          <p className={`text-xs truncate mt-0.5 ${conv.unreadCount > 0 ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                            {conv.lastMessage.senderId === currentUserId ? "Tu: " : ""}
                            {conv.lastMessage.content}
                          </p>
                        </div>
                        {conv.unreadCount > 0 && (
                          <Badge variant="destructive" className="h-5 min-w-[20px] rounded-full p-0 text-xs flex items-center justify-center shrink-0">
                            {conv.unreadCount}
                          </Badge>
                        )}
                      </button>
                    ))
                  )}
                </div>
              </div>

              {/* Chat panel */}
              <div className={`flex-1 flex flex-col ${!selectedConversation ? "hidden md:flex" : "flex"}`}>
                {!selectedConversation ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
                    <MessageCircle className="h-16 w-16 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Selecteaza o conversatie</h3>
                    <p className="text-muted-foreground">
                      Alege o conversatie din lista sau trimite un mesaj unei conexiuni.
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Chat header */}
                    <div className="p-3 border-b flex items-center gap-3">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="md:hidden"
                        onClick={() => setSelectedConversation(null)}
                      >
                        <ChevronRight className="h-4 w-4 rotate-180" />
                      </Button>
                      {chatPartner && (
                        <>
                          <Avatar name={chatPartner.name} email={chatPartner.email} className="h-8 w-8 text-sm" />
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm truncate">{chatPartner.name || chatPartner.email}</p>
                            {chatPartner.ngo && (
                              <p className="text-xs text-muted-foreground truncate">{chatPartner.ngo.name}</p>
                            )}
                          </div>
                        </>
                      )}
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                      {loadingChat ? (
                        <div className="flex items-center justify-center py-12">
                          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                      ) : chatMessages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                          <Send className="h-10 w-10 text-muted-foreground mb-3" />
                          <p className="text-sm text-muted-foreground">
                            Niciun mesaj inca. Trimite primul mesaj!
                          </p>
                        </div>
                      ) : (
                        chatMessages.map((msg) => {
                          const isMine = msg.senderId === currentUserId;
                          return (
                            <div
                              key={msg.id}
                              className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                            >
                              <div
                                className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                                  isMine
                                    ? "bg-primary text-primary-foreground rounded-br-md"
                                    : "bg-muted rounded-bl-md"
                                }`}
                              >
                                <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                                <p className={`text-xs mt-1 ${isMine ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                                  {formatRelativeDate(msg.createdAt)}
                                </p>
                              </div>
                            </div>
                          );
                        })
                      )}
                      <div ref={messagesEndRef} />
                    </div>

                    {/* Message input */}
                    <div className="p-3 border-t">
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          handleSendMessage();
                        }}
                        className="flex gap-2"
                      >
                        <Textarea
                          placeholder="Scrie un mesaj..."
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault();
                              handleSendMessage();
                            }
                          }}
                          className="min-h-[40px] max-h-[120px] resize-none"
                          rows={1}
                        />
                        <Button
                          type="submit"
                          size="icon"
                          disabled={!newMessage.trim() || sendingMessage}
                        >
                          {sendingMessage ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Send className="h-4 w-4" />
                          )}
                        </Button>
                      </form>
                    </div>
                  </>
                )}
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

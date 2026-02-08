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
  Loader2, Send, Building, Heart, Globe, ChevronRight,
} from "lucide-react";
import { useSession } from "next-auth/react";

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

  const [activeTab, setActiveTab] = useState("conexiuni");

  // Connections state
  const [accepted, setAccepted] = useState<ConnectionItem[]>([]);
  const [pendingReceived, setPendingReceived] = useState<ConnectionItem[]>([]);
  const [pendingSent, setPendingSent] = useState<ConnectionItem[]>([]);
  const [loadingConnections, setLoadingConnections] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

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
        <h1 className="text-3xl font-bold tracking-tight">Retea</h1>
        <p className="text-muted-foreground">
          Conecteaza-te cu alte organizatii, trimite mesaje si descopera parteneri noi.
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conexiuni</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
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
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversatii</CardTitle>
            <MessageCircle className="h-4 w-4 text-muted-foreground" />
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
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Organizatii</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
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
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="conexiuni" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Conexiuni
            {pendingReceived.length > 0 && (
              <Badge variant="destructive" className="ml-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center">
                {pendingReceived.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="descopera" className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            Descopera
          </TabsTrigger>
          <TabsTrigger value="mesaje" className="flex items-center gap-2">
            <MessageCircle className="h-4 w-4" />
            Mesaje
            {totalUnread > 0 && (
              <Badge variant="destructive" className="ml-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center">
                {totalUnread}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

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

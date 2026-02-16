"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Users, Search, MessageCircle, UserPlus, Check, X,
  Loader2, Send, Building, Heart, Globe, ChevronRight, Briefcase,
  Sparkles, Linkedin, Copy, Mail, ExternalLink, Save, MapPin, Target,
  UserSearch, ArrowRight, Phone, AlertTriangle, Settings, Zap,
  Download, Trash2, Eye, Key, RefreshCw, Star, TrendingUp, Brain,
  Clock, Filter, MoreHorizontal, ChevronDown, ChevronUp,
  Plus, Link, Shield, Monitor, Puzzle, CheckCircle, Info,
  FileDown, Chrome, MousePointer, Lightbulb, BarChart3, Award,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { SponsorCRM } from "@/components/dashboard/sponsor-crm";
import { PageHelp } from "@/components/ui/page-help";

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

  // Navigation
  const [activeSection, setActiveSection] = useState<"cauta" | "crm" | "retea" | "mesaje">("cauta");
  const [searchMode, setSearchMode] = useState<"ai" | "linkedin">("ai");
  const [networkMode, setNetworkMode] = useState<"conexiuni" | "descopera">("conexiuni");

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
  const [prospectMsg, setProspectMsg] = useState<{ company: string; loading: boolean; message?: string; subject?: string; tips?: string[]; channel?: string; psychologicalApproach?: string; followUpSuggestion?: string } | null>(null);
  const [prospectAnalysis, setProspectAnalysis] = useState<{ company: string; loading: boolean; analysis?: any } | null>(null);

  // LinkedIn Prospects state
  const [linkedinProspects, setLinkedinProspects] = useState<any[]>([]);
  const [linkedinStats, setLinkedinStats] = useState<any>({});
  const [linkedinTotal, setLinkedinTotal] = useState(0);
  const [linkedinLoading, setLinkedinLoading] = useState(false);
  const [linkedinSearch, setLinkedinSearch] = useState("");
  const [linkedinStatusFilter, setLinkedinStatusFilter] = useState("");
  const [linkedinPage, setLinkedinPage] = useState(1);
  const [linkedinAnalyzing, setLinkedinAnalyzing] = useState<string | null>(null);
  const [linkedinMsgGen, setLinkedinMsgGen] = useState<{ id: string; loading: boolean; data?: any; channel?: string } | null>(null);
  const [linkedinExpanded, setLinkedinExpanded] = useState<string | null>(null);
  const [linkedinTokens, setLinkedinTokens] = useState<any[]>([]);
  const [linkedinShowToken, setLinkedinShowToken] = useState(false);
  const [linkedinNewToken, setLinkedinNewToken] = useState<string | null>(null);
  const [linkedinTokenLoading, setLinkedinTokenLoading] = useState(false);

  // Manual add state
  const [manualAddUrl, setManualAddUrl] = useState("");
  const [manualAddName, setManualAddName] = useState("");
  const [manualAddCompany, setManualAddCompany] = useState("");
  const [manualAddHeadline, setManualAddHeadline] = useState("");
  const [manualAddLoading, setManualAddLoading] = useState(false);
  const [manualAddError, setManualAddError] = useState("");
  const [manualAddSuccess, setManualAddSuccess] = useState(false);
  const [showManualAdd, setShowManualAdd] = useState(false);
  const [extensionWizardStep, setExtensionWizardStep] = useState(0);
  const [showExtensionWizard, setShowExtensionWizard] = useState(false);

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

  // ─── Open chat from connections ────
  const openChatWith = (userId: string) => {
    setActiveSection("mesaje");
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
          alert("Niciun provider AI configurat. Mergeti la Super Admin > Setari pentru a adauga chei API.");
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
      if (res.ok || res.status === 409) {
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
        company: company.name, loading: false, message: data.message,
        subject: data.subject, tips: data.tips, channel,
        psychologicalApproach: data.psychologicalApproach,
        followUpSuggestion: data.followUpSuggestion,
      });
    } catch (err) {
      console.error("Prospect message error:", err);
      setProspectMsg(null);
    }
  };

  // ─── Prospect: Analyze company profile ──
  const handleProspectAnalyze = async (company: any) => {
    setProspectAnalysis({ company: company.name, loading: true });
    try {
      const res = await fetch("/api/sponsors/prospect/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName: company.name, industry: company.industry,
          city: company.city, website: company.website,
          description: company.description, estimatedSize: company.estimatedSize,
        }),
      });
      if (!res.ok) {
        setProspectAnalysis(null);
        alert("Eroare la analiza profilului");
        return;
      }
      const data = await res.json();
      setProspectAnalysis({ company: company.name, loading: false, analysis: data.analysis });
    } catch (err) {
      console.error("Prospect analyze error:", err);
      setProspectAnalysis(null);
    }
  };

  // Generate message WITH analysis context
  const handleSmartMessage = async (company: any, channel: "linkedin" | "email") => {
    const hasAnalysis = prospectAnalysis && prospectAnalysis.company === company.name && prospectAnalysis.analysis;
    const analysisCtx = hasAnalysis
      ? {
          motivations: prospectAnalysis!.analysis?.psychologicalProfile?.motivations,
          persuasionTriggers: prospectAnalysis!.analysis?.psychologicalProfile?.persuasionTriggers,
          toneOfVoice: prospectAnalysis!.analysis?.approachStrategy?.toneOfVoice,
          openingHook: prospectAnalysis!.analysis?.approachStrategy?.openingHook,
          keyArguments: prospectAnalysis!.analysis?.approachStrategy?.keyArguments,
        }
      : undefined;

    setProspectMsg({ company: company.name, loading: true, channel });
    try {
      const res = await fetch("/api/sponsors/prospect/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName: company.name, industry: company.industry,
          city: company.city, whySponsor: company.whySponsor,
          channel, analysisContext: analysisCtx,
        }),
      });
      if (!res.ok) {
        setProspectMsg(null);
        alert("Eroare la generarea mesajului");
        return;
      }
      const data = await res.json();
      setProspectMsg({
        company: company.name, loading: false, message: data.message,
        subject: data.subject, tips: data.tips, channel,
        psychologicalApproach: data.psychologicalApproach,
        followUpSuggestion: data.followUpSuggestion,
      });
    } catch (err) {
      console.error("Smart message error:", err);
      setProspectMsg(null);
    }
  };

  // ─── LinkedIn: Fetch prospects ─────────
  const fetchLinkedinProspects = async (page = 1, search = "", status = "") => {
    setLinkedinLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "30" });
      if (search) params.set("search", search);
      if (status) params.set("status", status);
      params.set("sortBy", "createdAt");
      params.set("sortDir", "desc");
      const res = await fetch(`/api/prospects?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setLinkedinProspects(data.prospects || []);
      setLinkedinStats(data.stats || {});
      setLinkedinTotal(data.total || 0);
    } catch (err) {
      console.error("Error fetching linkedin prospects:", err);
    } finally {
      setLinkedinLoading(false);
    }
  };

  // ─── LinkedIn: Fetch API tokens ────────
  const fetchLinkedinTokens = async () => {
    try {
      const res = await fetch("/api/prospects/token");
      if (!res.ok) throw new Error("Failed to fetch tokens");
      const data = await res.json();
      setLinkedinTokens(data.tokens || []);
    } catch (err) {
      console.error("Error fetching tokens:", err);
    }
  };

  // ─── LinkedIn: Generate API token ──────
  const handleGenerateToken = async () => {
    setLinkedinTokenLoading(true);
    try {
      const res = await fetch("/api/prospects/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Chrome Extension" }),
      });
      if (!res.ok) throw new Error("Failed to create token");
      const data = await res.json();
      setLinkedinNewToken(data.token);
      await fetchLinkedinTokens();
    } catch (err) {
      console.error("Error creating token:", err);
      alert("Eroare la generarea tokenului");
    } finally {
      setLinkedinTokenLoading(false);
    }
  };

  // ─── LinkedIn: Delete token ────────────
  const handleDeleteToken = async (tokenId: string) => {
    try {
      await fetch(`/api/prospects/token?id=${tokenId}`, { method: "DELETE" });
      await fetchLinkedinTokens();
    } catch (err) {
      console.error("Error deleting token:", err);
    }
  };

  // ─── LinkedIn: Analyze prospect ────────
  const handleLinkedinAnalyze = async (prospectId: string) => {
    setLinkedinAnalyzing(prospectId);
    try {
      const res = await fetch("/api/prospects/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prospectId }),
      });
      if (!res.ok) {
        const data = await res.json();
        if (data?.noProvider) alert("Niciun provider AI configurat.");
        else alert(data?.error || "Eroare la analiza");
        return;
      }
      await fetchLinkedinProspects(linkedinPage, linkedinSearch, linkedinStatusFilter);
    } catch (err) {
      console.error("Error analyzing prospect:", err);
    } finally {
      setLinkedinAnalyzing(null);
    }
  };

  // ─── LinkedIn: Generate message ────────
  const handleLinkedinMessage = async (prospectId: string, channel: "linkedin" | "email") => {
    setLinkedinMsgGen({ id: prospectId, loading: true, channel });
    try {
      const res = await fetch("/api/prospects/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prospectId, channel }),
      });
      if (!res.ok) {
        setLinkedinMsgGen(null);
        alert("Eroare la generarea mesajului");
        return;
      }
      const data = await res.json();
      setLinkedinMsgGen({ id: prospectId, loading: false, data, channel });
    } catch (err) {
      console.error("Error generating message:", err);
      setLinkedinMsgGen(null);
    }
  };

  // ─── LinkedIn: Update prospect status ──
  const handleLinkedinStatusChange = async (id: string, status: string) => {
    try {
      await fetch("/api/prospects", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      await fetchLinkedinProspects(linkedinPage, linkedinSearch, linkedinStatusFilter);
    } catch (err) {
      console.error("Error updating prospect:", err);
    }
  };

  // ─── LinkedIn: Delete prospect ─────────
  const handleLinkedinDelete = async (id: string) => {
    if (!confirm("Stergi acest prospect?")) return;
    try {
      await fetch(`/api/prospects?id=${id}`, { method: "DELETE" });
      await fetchLinkedinProspects(linkedinPage, linkedinSearch, linkedinStatusFilter);
    } catch (err) {
      console.error("Error deleting prospect:", err);
    }
  };

  // ─── Manual Add: Add LinkedIn prospect by URL ──
  const handleManualAdd = async () => {
    if (!manualAddUrl.trim()) return;
    setManualAddLoading(true);
    setManualAddError("");
    setManualAddSuccess(false);
    try {
      const res = await fetch("/api/prospects/add-manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          linkedinUrl: manualAddUrl.trim(),
          fullName: manualAddName.trim() || undefined,
          company: manualAddCompany.trim() || undefined,
          headline: manualAddHeadline.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setManualAddError(data.error || "Eroare la adaugare");
        return;
      }
      setManualAddSuccess(true);
      setManualAddUrl("");
      setManualAddName("");
      setManualAddCompany("");
      setManualAddHeadline("");
      await fetchLinkedinProspects(linkedinPage, linkedinSearch, linkedinStatusFilter);
      setTimeout(() => { setManualAddSuccess(false); setShowManualAdd(false); }, 2000);
    } catch (err) {
      console.error("Manual add error:", err);
      setManualAddError("Eroare de conexiune. Incearca din nou.");
    } finally {
      setManualAddLoading(false);
    }
  };

  // ─── Effects ──────────────────────────
  useEffect(() => {
    fetchConnections();
    fetchConversations();
    fetchDiscover();
    fetchLinkedinProspects();
    fetchLinkedinTokens();
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      fetchChatMessages(selectedConversation);
      pollingRef.current = setInterval(() => {
        fetchChatMessages(selectedConversation, false);
      }, 5000);
      return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
    } else {
      setChatMessages([]);
      setChatPartner(null);
    }
  }, [selectedConversation]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  useEffect(() => {
    const timer = setTimeout(() => { fetchDiscover(searchQuery, selectedCategory); }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, selectedCategory]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchLinkedinProspects(1, linkedinSearch, linkedinStatusFilter);
      setLinkedinPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [linkedinSearch, linkedinStatusFilter]);

  // ────────────────────────────────────────
  // Computed
  // ────────────────────────────────────────
  const totalUnread = conversations.reduce((sum, c) => sum + c.unreadCount, 0);

  const statusLabels: Record<string, string> = {
    NEW: "Nou", ANALYZED: "Analizat", CONTACTED: "Contactat",
    REPLIED: "Raspuns", MEETING: "Intalnire", CONVERTED: "Convertit", NOT_INTERESTED: "Refuzat",
  };
  const statusColors: Record<string, string> = {
    NEW: "bg-blue-100 text-blue-700", ANALYZED: "bg-purple-100 text-purple-700",
    CONTACTED: "bg-amber-100 text-amber-700", REPLIED: "bg-emerald-100 text-emerald-700",
    MEETING: "bg-indigo-100 text-indigo-700", CONVERTED: "bg-green-100 text-green-700",
    NOT_INTERESTED: "bg-red-100 text-red-700",
  };

  // ────────────────────────────────────────
  // RENDER
  // ────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* ══════════════════════════════════════════ */}
      {/* HEADER                                     */}
      {/* ══════════════════════════════════════════ */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Retea & Sponsori</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gaseste sponsori, gestioneaza companii si conecteaza-te cu alte ONG-uri
          </p>
        </div>
      </div>

      {/* ══════════════════════════════════════════ */}
      {/* NAVIGATION CARDS - 4 big clickable cards   */}
      {/* ══════════════════════════════════════════ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Card 1: Cauta Sponsori */}
        <button
          onClick={() => setActiveSection("cauta")}
          className={`text-left rounded-xl border-2 p-4 transition-all hover:shadow-md ${
            activeSection === "cauta"
              ? "border-blue-500 bg-blue-50 shadow-md"
              : "border-transparent bg-white shadow-sm hover:border-blue-200"
          }`}
        >
          <div className="flex items-center gap-3 mb-2">
            <div className={`p-2 rounded-lg ${activeSection === "cauta" ? "bg-blue-500 text-white" : "bg-blue-100 text-blue-600"}`}>
              <Search className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm">Cauta Sponsori</p>
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground mt-1 leading-tight">Gaseste companii potrivite pentru sponsorizari folosind AI sau LinkedIn</p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
            <span className="flex items-center gap-1">
              <Linkedin className="h-3 w-3 text-[#0A66C2]" />
              {linkedinTotal}
            </span>
            <span className="text-muted-foreground/40">|</span>
            <span className="flex items-center gap-1">
              <Sparkles className="h-3 w-3 text-purple-500" />
              {prospectResults.length} AI
            </span>
          </div>
        </button>

        {/* Card 2: CRM Companii */}
        <button
          onClick={() => setActiveSection("crm")}
          className={`text-left rounded-xl border-2 p-4 transition-all hover:shadow-md ${
            activeSection === "crm"
              ? "border-emerald-500 bg-emerald-50 shadow-md"
              : "border-transparent bg-white shadow-sm hover:border-emerald-200"
          }`}
        >
          <div className="flex items-center gap-3 mb-2">
            <div className={`p-2 rounded-lg ${activeSection === "crm" ? "bg-emerald-500 text-white" : "bg-emerald-100 text-emerald-600"}`}>
              <Briefcase className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm">CRM Companii</p>
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground mt-1 leading-tight">Gestioneaza relatii cu sponsorii: contacte, interactiuni si statusul fiecarei companii</p>
        </button>

        {/* Card 3: Retea ONG */}
        <button
          onClick={() => setActiveSection("retea")}
          className={`text-left rounded-xl border-2 p-4 transition-all hover:shadow-md ${
            activeSection === "retea"
              ? "border-purple-500 bg-purple-50 shadow-md"
              : "border-transparent bg-white shadow-sm hover:border-purple-200"
          }`}
        >
          <div className="flex items-center gap-3 mb-2">
            <div className={`p-2 rounded-lg ${activeSection === "retea" ? "bg-purple-500 text-white" : "bg-purple-100 text-purple-600"}`}>
              <Users className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm">Retea ONG</p>
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground mt-1 leading-tight">Conecteaza-te cu alte ONG-uri, descopera organizatii si colaboreaza</p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
            <span>{accepted.length} conexiuni</span>
            {pendingReceived.length > 0 && (
              <>
                <span className="text-muted-foreground/40">|</span>
                <Badge variant="destructive" className="h-4 text-[10px] px-1.5 rounded-full">
                  {pendingReceived.length} noi
                </Badge>
              </>
            )}
          </div>
        </button>

        {/* Card 4: Mesaje */}
        <button
          onClick={() => setActiveSection("mesaje")}
          className={`text-left rounded-xl border-2 p-4 transition-all hover:shadow-md ${
            activeSection === "mesaje"
              ? "border-orange-500 bg-orange-50 shadow-md"
              : "border-transparent bg-white shadow-sm hover:border-orange-200"
          }`}
        >
          <div className="flex items-center gap-3 mb-2">
            <div className={`p-2 rounded-lg ${activeSection === "mesaje" ? "bg-orange-500 text-white" : "bg-orange-100 text-orange-600"}`}>
              <MessageCircle className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm">Mesaje</p>
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground mt-1 leading-tight">Trimite mesaje directe catre ONG-urile din reteaua ta</p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
            <span>{conversations.length} conversatii</span>
            {totalUnread > 0 && (
              <>
                <span className="text-muted-foreground/40">|</span>
                <Badge variant="destructive" className="h-4 text-[10px] px-1.5 rounded-full">
                  {totalUnread} necitite
                </Badge>
              </>
            )}
          </div>
        </button>
      </div>

      {/* ══════════════════════════════════════════ */}
      {/* CONTENT AREA                               */}
      {/* ══════════════════════════════════════════ */}

      {/* ─────────────── CAUTA SPONSORI ──────────── */}
      {activeSection === "cauta" && (
        <div className="space-y-4">
          {/* Sub-navigation: AI vs LinkedIn */}
          <div className="flex items-center gap-2 bg-white rounded-lg p-1 border shadow-sm w-fit">
            <button
              onClick={() => setSearchMode("ai")}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                searchMode === "ai" ? "bg-blue-500 text-white shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Sparkles className="h-4 w-4" /> Cautare AI
            </button>
            <button
              onClick={() => setSearchMode("linkedin")}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                searchMode === "linkedin" ? "bg-[#0A66C2] text-white shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Linkedin className="h-4 w-4" /> LinkedIn Galaxy
              {linkedinTotal > 0 && (
                <Badge className={`h-5 text-[10px] px-1.5 rounded-full ${searchMode === "linkedin" ? "bg-white/20 text-white" : "bg-[#0A66C2]/10 text-[#0A66C2]"}`}>
                  {linkedinTotal}
                </Badge>
              )}
            </button>
          </div>

          {/* AI SEARCH MODE */}
          {searchMode === "ai" && (
            <div className="space-y-4">
              {/* Search Form */}
              <Card className="border-0 shadow-sm">
                <CardContent className="p-5">
                  <div className="grid gap-3 sm:grid-cols-4">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">Cuvinte cheie *</label>
                      <Input
                        placeholder="IT, software, banci..."
                        value={prospectKeywords}
                        onChange={(e) => setProspectKeywords(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleProspectSearch()}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">Industrie</label>
                      <Input
                        placeholder="Tehnologie, Constructii..."
                        value={prospectIndustry}
                        onChange={(e) => setProspectIndustry(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">Oras</label>
                      <Input
                        placeholder="Bucuresti, Cluj..."
                        value={prospectCity}
                        onChange={(e) => setProspectCity(e.target.value)}
                      />
                    </div>
                    <div className="flex items-end gap-2">
                      <Button
                        onClick={handleProspectSearch}
                        disabled={prospectLoading || (!prospectKeywords.trim() && !prospectIndustry.trim())}
                        className="bg-blue-600 hover:bg-blue-700 flex-1"
                      >
                        {prospectLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4 mr-1.5" />}
                        Cauta
                      </Button>
                      {(prospectKeywords.trim() || prospectIndustry.trim()) && (
                        <a
                          href={`https://www.linkedin.com/search/results/companies/?keywords=${encodeURIComponent([prospectKeywords, prospectIndustry, prospectCity].filter(Boolean).join(" "))}&origin=GLOBAL_SEARCH_HEADER`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Button variant="outline" size="icon" title="Cauta pe LinkedIn">
                            <Linkedin className="h-4 w-4 text-[#0A66C2]" />
                          </Button>
                        </a>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick LinkedIn shortcuts (when no results) */}
              {!prospectLoading && prospectResults.length === 0 && (
                <div className="space-y-3">
                  <p className="text-xs text-muted-foreground">Acces rapid LinkedIn — deschide direct cautari relevante pe LinkedIn:</p>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <a href="https://www.linkedin.com/search/results/companies/?keywords=Romania&origin=GLOBAL_SEARCH_HEADER" target="_blank" rel="noopener noreferrer"
                      className="group flex items-center gap-3 bg-white rounded-xl p-4 border shadow-sm hover:shadow-md hover:border-blue-200 transition-all">
                      <div className="p-2 rounded-lg bg-blue-100 text-blue-600 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                        <Building className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold">Companii Romania</p>
                        <p className="text-xs text-muted-foreground">Cauta companii din Romania pe LinkedIn</p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                    </a>
                    <a href="https://www.linkedin.com/search/results/people/?keywords=CSR%20Romania&origin=GLOBAL_SEARCH_HEADER" target="_blank" rel="noopener noreferrer"
                      className="group flex items-center gap-3 bg-white rounded-xl p-4 border shadow-sm hover:shadow-md hover:border-purple-200 transition-all">
                      <div className="p-2 rounded-lg bg-purple-100 text-purple-600 group-hover:bg-purple-500 group-hover:text-white transition-colors">
                        <UserSearch className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold">Factori de decizie CSR</p>
                        <p className="text-xs text-muted-foreground">Gaseste persoane din departamentele CSR / HR</p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                    </a>
                    <a href="https://www.linkedin.com/search/results/people/?keywords=Director%20General%20Romania&origin=GLOBAL_SEARCH_HEADER" target="_blank" rel="noopener noreferrer"
                      className="group flex items-center gap-3 bg-white rounded-xl p-4 border shadow-sm hover:shadow-md hover:border-amber-200 transition-all">
                      <div className="p-2 rounded-lg bg-amber-100 text-amber-600 group-hover:bg-amber-500 group-hover:text-white transition-colors">
                        <Briefcase className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold">CEO / Directori</p>
                        <p className="text-xs text-muted-foreground">Contacteaza directori executivi si CEO</p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                    </a>
                  </div>
                </div>
              )}

              {/* Loading */}
              {prospectLoading && (
                <div className="flex flex-col items-center justify-center py-16">
                  <div className="relative">
                    <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
                    <Sparkles className="h-4 w-4 text-purple-500 absolute -top-1 -right-1 animate-pulse" />
                  </div>
                  <p className="text-sm font-medium mt-3">AI cauta companii potrivite...</p>
                </div>
              )}

              {/* AI Results */}
              {!prospectLoading && prospectResults.length > 0 && (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">{prospectResults.length} companii gasite</p>
                  {prospectResults.map((company, idx) => (
                    <Card key={`${company.name}-${idx}`} className="border-0 shadow-sm hover:shadow-md transition-all overflow-hidden">
                      <CardContent className="p-4">
                        <div className="flex flex-col lg:flex-row gap-4">
                          {/* Company info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                                <Building className="h-5 w-5 text-slate-500" />
                              </div>
                              <div>
                                <h3 className="font-bold text-sm">{company.name}</h3>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  {company.industry && <Badge variant="outline" className="text-[10px] h-4">{company.industry}</Badge>}
                                  {company.city && <span className="flex items-center gap-0.5"><MapPin className="h-3 w-3" />{company.city}</span>}
                                  {company.estimatedSize && <span>{company.estimatedSize}</span>}
                                </div>
                              </div>
                            </div>

                            {company.description && <p className="text-xs text-muted-foreground mb-2">{company.description}</p>}

                            {company.whySponsor && (
                              <div className="bg-emerald-50 rounded-lg p-2 mb-2">
                                <p className="text-xs text-emerald-700"><Target className="h-3 w-3 inline mr-1" /><strong>De ce:</strong> {company.whySponsor}</p>
                              </div>
                            )}

                            {/* Quick links */}
                            <div className="flex flex-wrap gap-1.5">
                              {company.website && (
                                <a href={company.website.startsWith("http") ? company.website : `https://${company.website}`} target="_blank" rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-[10px] bg-gray-100 hover:bg-gray-200 rounded-full px-2 py-1 text-gray-600 transition-colors">
                                  <Globe className="h-3 w-3" /> Website
                                </a>
                              )}
                              <a href={`https://www.linkedin.com/search/results/companies/?keywords=${encodeURIComponent(company.name)}`} target="_blank" rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-[10px] bg-[#0A66C2]/10 hover:bg-[#0A66C2]/20 rounded-full px-2 py-1 text-[#0A66C2] transition-colors">
                                <Linkedin className="h-3 w-3" /> LinkedIn
                              </a>
                            </div>
                          </div>

                          {/* Decision makers (compact) */}
                          <div className="lg:w-56 flex-shrink-0">
                            <div className="bg-slate-50 rounded-lg p-3">
                              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-2">Factori de decizie</p>
                              <div className="space-y-1">
                                {(company.decisionMakers && company.decisionMakers.length > 0
                                  ? company.decisionMakers
                                  : [{ title: "CEO / Director", department: "Management" }, { title: "CSR / Marketing", department: "CSR" }]
                                ).slice(0, 3).map((dm: any, i: number) => (
                                  <a key={i}
                                    href={dm.linkedinSearch || `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(dm.title + " " + company.name)}&origin=GLOBAL_SEARCH_HEADER`}
                                    target="_blank" rel="noopener noreferrer"
                                    className="flex items-center gap-2 p-1.5 rounded-md hover:bg-white transition-all text-xs group/dm">
                                    <Linkedin className="h-3 w-3 text-[#0A66C2] flex-shrink-0" />
                                    <span className="truncate">{dm.title}</span>
                                    <ExternalLink className="h-2.5 w-2.5 text-muted-foreground ml-auto opacity-0 group-hover/dm:opacity-100" />
                                  </a>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex flex-wrap gap-2 pt-3 mt-3 border-t">
                          <Button size="sm" variant="outline" className="text-xs h-7"
                            onClick={() => handleProspectAnalyze(company)}
                            disabled={prospectAnalysis?.loading && prospectAnalysis.company === company.name}>
                            {prospectAnalysis?.loading && prospectAnalysis.company === company.name
                              ? <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                              : <Brain className="h-3 w-3 mr-1" />}
                            Analizeaza
                          </Button>
                          {prospectSaved.has(company.name) ? (
                            <Button size="sm" variant="outline" disabled className="text-xs h-7 text-emerald-600 border-emerald-300">
                              <Check className="h-3 w-3 mr-1" /> Salvat
                            </Button>
                          ) : (
                            <Button size="sm" className="text-xs h-7 bg-emerald-600 hover:bg-emerald-700"
                              onClick={() => handleProspectSave(company)} disabled={prospectSaving === company.name}>
                              {prospectSaving === company.name ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Save className="h-3 w-3 mr-1" />}
                              Salveaza CRM
                            </Button>
                          )}
                          <Button size="sm" variant="outline" className="text-xs h-7 text-[#0A66C2] border-[#0A66C2]/30"
                            onClick={() => handleSmartMessage(company, "linkedin")}
                            disabled={prospectMsg?.loading && prospectMsg.company === company.name}>
                            {prospectMsg?.loading && prospectMsg.company === company.name && prospectMsg.channel === "linkedin"
                              ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Linkedin className="h-3 w-3 mr-1" />}
                            Mesaj LI
                          </Button>
                          <Button size="sm" variant="outline" className="text-xs h-7"
                            onClick={() => handleSmartMessage(company, "email")}
                            disabled={prospectMsg?.loading && prospectMsg.company === company.name}>
                            {prospectMsg?.loading && prospectMsg.company === company.name && prospectMsg.channel === "email"
                              ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Mail className="h-3 w-3 mr-1" />}
                            Email
                          </Button>
                        </div>

                        {/* Inline Analysis */}
                        {prospectAnalysis && prospectAnalysis.company === company.name && !prospectAnalysis.loading && prospectAnalysis.analysis && (
                          <div className="mt-3 pt-3 border-t space-y-3">
                            <div className="flex items-center justify-between">
                              <p className="text-xs font-semibold flex items-center gap-1.5"><Brain className="h-3.5 w-3.5 text-purple-600" /> Analiza AI</p>
                              <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => setProspectAnalysis(null)}><X className="h-3 w-3" /></Button>
                            </div>
                            {prospectAnalysis.analysis.whyThisMatch && (
                              <div className="bg-emerald-50 rounded-lg p-2.5">
                                <p className="text-xs text-emerald-700">{prospectAnalysis.analysis.whyThisMatch}</p>
                              </div>
                            )}
                            <div className="grid gap-2 sm:grid-cols-3">
                              {prospectAnalysis.analysis.psychologicalProfile?.motivations && (
                                <div className="bg-purple-50 rounded-lg p-2.5">
                                  <p className="text-[10px] font-semibold text-purple-700 uppercase mb-1">Motivatii</p>
                                  <ul className="space-y-0.5">
                                    {prospectAnalysis.analysis.psychologicalProfile.motivations.map((m: string, i: number) => (
                                      <li key={i} className="text-xs text-purple-600">- {m}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                              {prospectAnalysis.analysis.psychologicalProfile?.persuasionTriggers && (
                                <div className="bg-blue-50 rounded-lg p-2.5">
                                  <p className="text-[10px] font-semibold text-blue-700 uppercase mb-1">Persuasiune</p>
                                  <ul className="space-y-0.5">
                                    {prospectAnalysis.analysis.psychologicalProfile.persuasionTriggers.map((t: string, i: number) => (
                                      <li key={i} className="text-xs text-blue-600">- {t}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                              {prospectAnalysis.analysis.approachStrategy && (
                                <div className="bg-amber-50 rounded-lg p-2.5">
                                  <p className="text-[10px] font-semibold text-amber-700 uppercase mb-1">Strategie</p>
                                  <div className="text-xs text-amber-600 space-y-0.5">
                                    {prospectAnalysis.analysis.approachStrategy.bestChannel && <p>Canal: {prospectAnalysis.analysis.approachStrategy.bestChannel}</p>}
                                    {prospectAnalysis.analysis.approachStrategy.toneOfVoice && <p>Ton: {prospectAnalysis.analysis.approachStrategy.toneOfVoice}</p>}
                                    {prospectAnalysis.analysis.approachStrategy.openingHook && <p className="italic">&quot;{prospectAnalysis.analysis.approachStrategy.openingHook}&quot;</p>}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {/* Generated Message (sticky) */}
              {prospectMsg && !prospectMsg.loading && prospectMsg.message && (
                <Card className="border-blue-200 bg-blue-50/50 shadow-md sticky bottom-4">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold flex items-center gap-2">
                        {prospectMsg.channel === "linkedin" ? <Linkedin className="h-4 w-4 text-[#0A66C2]" /> : <Mail className="h-4 w-4 text-indigo-600" />}
                        Mesaj pentru {prospectMsg.company}
                      </p>
                      <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => setProspectMsg(null)}><X className="h-3.5 w-3.5" /></Button>
                    </div>
                    {prospectMsg.subject && (
                      <div className="bg-white rounded-lg p-2.5 border text-sm">
                        <span className="text-xs text-muted-foreground">Subiect:</span> {prospectMsg.subject}
                      </div>
                    )}
                    <div className="bg-white rounded-lg p-3 border">
                      <p className="text-sm whitespace-pre-wrap">{prospectMsg.message}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="text-xs"
                        onClick={() => {
                          const fullText = prospectMsg.subject ? `Subiect: ${prospectMsg.subject}\n\n${prospectMsg.message}` : prospectMsg.message || "";
                          navigator.clipboard.writeText(fullText);
                        }}>
                        <Copy className="h-3 w-3 mr-1" /> Copiaza
                      </Button>
                      {prospectMsg.channel === "linkedin" && (
                        <a href={`https://www.linkedin.com/search/results/companies/?keywords=${encodeURIComponent(prospectMsg.company)}`} target="_blank" rel="noopener noreferrer">
                          <Button size="sm" variant="outline" className="text-xs text-[#0A66C2]">
                            <Linkedin className="h-3 w-3 mr-1" /> Deschide LinkedIn
                          </Button>
                        </a>
                      )}
                    </div>
                    {prospectMsg.psychologicalApproach && (
                      <p className="text-xs text-purple-600 bg-purple-50 rounded-lg p-2"><Sparkles className="h-3 w-3 inline mr-1" />{prospectMsg.psychologicalApproach}</p>
                    )}
                    {prospectMsg.followUpSuggestion && (
                      <p className="text-xs text-blue-600 bg-blue-50 rounded-lg p-2"><Clock className="h-3 w-3 inline mr-1" />Follow-up: {prospectMsg.followUpSuggestion}</p>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* LINKEDIN MODE */}
          {searchMode === "linkedin" && (
            <div className="space-y-4">
              {/* ═══ Header Bar with Actions ═══ */}
              <Card className="border-0 shadow-sm overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#0A66C2] to-[#004182] flex items-center justify-center shadow-md">
                        <Linkedin className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-bold text-sm">LinkedIn Galaxy</h3>
                        <p className="text-xs text-muted-foreground">Importa si analizeaza prospecte din LinkedIn</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="text-xs h-8 gap-1.5" onClick={() => { setShowManualAdd(!showManualAdd); setShowExtensionWizard(false); }}>
                        <Plus className="h-3.5 w-3.5" /> Adauga Manual
                      </Button>
                      <Button size="sm" variant="outline" className="text-xs h-8 gap-1.5 border-[#0A66C2]/30 text-[#0A66C2] hover:bg-[#0A66C2]/5"
                        onClick={() => { setShowExtensionWizard(!showExtensionWizard); setShowManualAdd(false); }}>
                        <Puzzle className="h-3.5 w-3.5" /> {showExtensionWizard ? "Ascunde Ghid" : "Extensie Chrome"}
                      </Button>
                      <Button size="sm" className="text-xs h-8 bg-[#0A66C2] hover:bg-[#004182]" onClick={() => fetchLinkedinProspects(linkedinPage, linkedinSearch, linkedinStatusFilter)} disabled={linkedinLoading}>
                        <RefreshCw className={`h-3.5 w-3.5 mr-1 ${linkedinLoading ? "animate-spin" : ""}`} /> Actualizeaza
                      </Button>
                    </div>
                  </div>

                  {/* ═══ Manual Add LinkedIn URL Form ═══ */}
                  {showManualAdd && (
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-5 border border-blue-200 mb-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Link className="h-4 w-4 text-[#0A66C2]" />
                          <p className="font-semibold text-sm">Adauga prospect manual din LinkedIn</p>
                        </div>
                        <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => setShowManualAdd(false)}>
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">Lipeste link-ul profilului sau al companiei de pe LinkedIn. Poti adauga si factori de decizie direct.</p>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="sm:col-span-2">
                          <label className="text-xs font-medium text-slate-600 mb-1 block">Link LinkedIn *</label>
                          <Input
                            placeholder="https://linkedin.com/in/nume-persoana sau /company/firma"
                            value={manualAddUrl}
                            onChange={(e) => { setManualAddUrl(e.target.value); setManualAddError(""); }}
                            className="h-9 bg-white"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-slate-600 mb-1 block">Nume complet (optional)</label>
                          <Input placeholder="Ion Popescu" value={manualAddName} onChange={(e) => setManualAddName(e.target.value)} className="h-9 bg-white" />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-slate-600 mb-1 block">Companie (optional)</label>
                          <Input placeholder="Numele companiei" value={manualAddCompany} onChange={(e) => setManualAddCompany(e.target.value)} className="h-9 bg-white" />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="text-xs font-medium text-slate-600 mb-1 block">Rol / Titlu (optional)</label>
                          <Input placeholder="CEO, Director CSR, Marketing Manager..." value={manualAddHeadline} onChange={(e) => setManualAddHeadline(e.target.value)} className="h-9 bg-white" />
                        </div>
                      </div>
                      {manualAddError && (
                        <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 rounded-lg p-2 border border-red-200">
                          <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" /> {manualAddError}
                        </div>
                      )}
                      {manualAddSuccess && (
                        <div className="flex items-center gap-2 text-xs text-emerald-600 bg-emerald-50 rounded-lg p-2 border border-emerald-200">
                          <CheckCircle className="h-3.5 w-3.5 flex-shrink-0" /> Prospect adaugat cu succes! Acum il poti analiza cu AI.
                        </div>
                      )}
                      <div className="flex items-center gap-3">
                        <Button size="sm" className="bg-[#0A66C2] hover:bg-[#004182] text-xs h-8"
                          onClick={handleManualAdd} disabled={manualAddLoading || !manualAddUrl.trim()}>
                          {manualAddLoading ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Plus className="h-3.5 w-3.5 mr-1.5" />}
                          Adauga Prospect
                        </Button>
                        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                          <Info className="h-3 w-3" />
                          <span>Dupa adaugare, apasa <Brain className="h-3 w-3 inline mx-0.5 text-purple-600" /> pentru analiza psihologica AI</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ═══ Chrome Extension Installation Wizard ═══ */}
                  {showExtensionWizard && (
                    <div className="bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 rounded-xl border border-blue-200 overflow-hidden mb-4">
                      <div className="p-5 space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Puzzle className="h-5 w-5 text-[#0A66C2]" />
                            <div>
                              <p className="font-bold text-sm">Instaleaza Extensia Chrome - LinkedIn Galaxy</p>
                              <p className="text-xs text-muted-foreground">Importa automat sute de prospecte direct din LinkedIn</p>
                            </div>
                          </div>
                          <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => setShowExtensionWizard(false)}>
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </div>

                        {/* Step indicators */}
                        <div className="flex items-center gap-2 overflow-x-auto pb-1">
                          {[
                            { label: "Descarca", icon: FileDown },
                            { label: "Instaleaza", icon: Monitor },
                            { label: "Activeaza", icon: Puzzle },
                            { label: "Conecteaza", icon: Key },
                            { label: "Importa", icon: Linkedin },
                          ].map((step, i) => (
                            <button key={i} onClick={() => setExtensionWizardStep(i)}
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap ${
                                extensionWizardStep === i ? "bg-[#0A66C2] text-white shadow-md" :
                                extensionWizardStep > i ? "bg-emerald-100 text-emerald-700" :
                                "bg-white text-slate-500 border hover:border-blue-300"
                              }`}>
                              {extensionWizardStep > i ? <Check className="h-3 w-3" /> : <step.icon className="h-3 w-3" />}
                              <span>{i + 1}. {step.label}</span>
                            </button>
                          ))}
                        </div>

                        {/* Step content */}
                        <div className="bg-white rounded-xl border p-4 min-h-[180px]">
                          {extensionWizardStep === 0 && (
                            <div className="space-y-3">
                              <div className="flex items-start gap-3">
                                <div className="h-10 w-10 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                                  <FileDown className="h-5 w-5 text-blue-600" />
                                </div>
                                <div>
                                  <h4 className="font-bold text-sm mb-1">Pasul 1: Descarca extensia</h4>
                                  <p className="text-xs text-muted-foreground mb-3">Descarca fisierul .zip cu extensia Chrome LinkedIn Galaxy. Acesta contine tot ce ai nevoie pentru a importa prospecte automat.</p>
                                </div>
                              </div>
                              <a href="/api/prospects/extension-download" download
                                className="flex items-center gap-3 bg-gradient-to-r from-[#0A66C2] to-[#004182] text-white rounded-xl p-4 hover:shadow-lg transition-all group cursor-pointer">
                                <div className="h-12 w-12 rounded-xl bg-white/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                                  <Download className="h-6 w-6" />
                                </div>
                                <div>
                                  <p className="font-bold text-sm">Descarca LinkedIn Galaxy Extension</p>
                                  <p className="text-xs text-white/80">linkedin-galaxy-extension.zip (~15KB)</p>
                                </div>
                                <ArrowRight className="h-5 w-5 ml-auto group-hover:translate-x-1 transition-transform" />
                              </a>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground bg-amber-50 rounded-lg p-2 border border-amber-200">
                                <Shield className="h-4 w-4 text-amber-600 flex-shrink-0" />
                                <span>Extensia e sigura si privata - codul sursa e verificabil. Functioneaza doar pe linkedin.com.</span>
                              </div>
                            </div>
                          )}

                          {extensionWizardStep === 1 && (
                            <div className="space-y-3">
                              <div className="flex items-start gap-3">
                                <div className="h-10 w-10 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                                  <Monitor className="h-5 w-5 text-indigo-600" />
                                </div>
                                <div>
                                  <h4 className="font-bold text-sm mb-1">Pasul 2: Deschide Chrome Extensions</h4>
                                  <p className="text-xs text-muted-foreground mb-3">Deschide pagina de extensii din Chrome pentru a incarca extensia descarcata.</p>
                                </div>
                              </div>
                              <div className="space-y-2">
                                <div className="flex items-center gap-3 bg-slate-50 rounded-lg p-3 border">
                                  <div className="h-7 w-7 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs">A</div>
                                  <div className="flex-1">
                                    <p className="text-xs font-medium">Deschide in bara de adrese Chrome:</p>
                                    <code className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded font-mono mt-0.5 inline-block">chrome://extensions</code>
                                  </div>
                                  <Button size="sm" variant="ghost" className="h-7 px-2 text-[10px]" onClick={() => navigator.clipboard.writeText("chrome://extensions")}>
                                    <Copy className="h-3 w-3" />
                                  </Button>
                                </div>
                                <div className="flex items-center gap-3 bg-slate-50 rounded-lg p-3 border">
                                  <div className="h-7 w-7 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs">B</div>
                                  <div className="flex-1">
                                    <p className="text-xs font-medium">Activeaza &quot;Developer mode&quot; (coltul din dreapta sus)</p>
                                    <p className="text-[10px] text-muted-foreground">Comutatorul trebuie sa fie albastru/activ</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-3 bg-emerald-50 rounded-lg p-3 border border-emerald-200">
                                  <div className="h-7 w-7 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold text-xs">C</div>
                                  <div className="flex-1">
                                    <p className="text-xs font-medium text-emerald-800">Dezarhiveaza fisierul .zip descarcat intr-un folder</p>
                                    <p className="text-[10px] text-emerald-600">Click dreapta pe .zip &gt; &quot;Extract All&quot; / &quot;Dezarhiveaza&quot;</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          {extensionWizardStep === 2 && (
                            <div className="space-y-3">
                              <div className="flex items-start gap-3">
                                <div className="h-10 w-10 rounded-xl bg-purple-100 flex items-center justify-center flex-shrink-0">
                                  <Puzzle className="h-5 w-5 text-purple-600" />
                                </div>
                                <div>
                                  <h4 className="font-bold text-sm mb-1">Pasul 3: Incarca extensia in Chrome</h4>
                                  <p className="text-xs text-muted-foreground mb-3">Incarca extensia din folderul dezarhivat.</p>
                                </div>
                              </div>
                              <div className="space-y-2">
                                <div className="flex items-center gap-3 bg-slate-50 rounded-lg p-3 border">
                                  <div className="h-7 w-7 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold text-xs">1</div>
                                  <div className="flex-1">
                                    <p className="text-xs font-medium">Apasa butonul &quot;Load unpacked&quot; (stanga sus)</p>
                                    <p className="text-[10px] text-muted-foreground">Pe pagina chrome://extensions</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-3 bg-slate-50 rounded-lg p-3 border">
                                  <div className="h-7 w-7 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold text-xs">2</div>
                                  <div className="flex-1">
                                    <p className="text-xs font-medium">Selecteaza folderul dezarhivat cu extensia</p>
                                    <p className="text-[10px] text-muted-foreground">Folderul care contine manifest.json</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-3 bg-emerald-50 rounded-lg p-3 border border-emerald-200">
                                  <CheckCircle className="h-5 w-5 text-emerald-600 flex-shrink-0" />
                                  <div className="flex-1">
                                    <p className="text-xs font-medium text-emerald-800">Extensia apare in lista! Asigura-te ca e activata.</p>
                                    <p className="text-[10px] text-emerald-600">Vei vedea iconita LinkedIn Galaxy in bara de extensii Chrome</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          {extensionWizardStep === 3 && (
                            <div className="space-y-3">
                              <div className="flex items-start gap-3">
                                <div className="h-10 w-10 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                                  <Key className="h-5 w-5 text-amber-600" />
                                </div>
                                <div>
                                  <h4 className="font-bold text-sm mb-1">Pasul 4: Genereaza si introdu tokenul API</h4>
                                  <p className="text-xs text-muted-foreground mb-2">Tokenul conecteaza extensia la contul tau. Genereaza unul si copiaza-l in extensie.</p>
                                </div>
                              </div>

                              <div className="flex items-center justify-between bg-slate-50 rounded-lg p-3 border">
                                <p className="text-xs font-semibold text-slate-600">Tokeni API activi ({linkedinTokens.length})</p>
                                <Button size="sm" onClick={handleGenerateToken} disabled={linkedinTokenLoading} className="bg-[#0A66C2] hover:bg-[#004182] text-xs h-8">
                                  {linkedinTokenLoading ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Key className="h-3.5 w-3.5 mr-1.5" />}
                                  Genereaza Token Nou
                                </Button>
                              </div>

                              {linkedinNewToken && (
                                <div className="bg-emerald-50 border-2 border-emerald-300 rounded-xl p-4 animate-in fade-in duration-300">
                                  <div className="flex items-center gap-2 mb-2">
                                    <CheckCircle className="h-4 w-4 text-emerald-600" />
                                    <p className="text-xs font-bold text-emerald-800">Token generat! Copiaza-l si lipeste-l in extensie:</p>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <code className="text-xs bg-white px-3 py-2 rounded-lg border-2 border-emerald-200 flex-1 break-all font-mono text-emerald-800 select-all">{linkedinNewToken}</code>
                                    <Button size="sm" className="h-9 px-3 bg-emerald-600 hover:bg-emerald-700" onClick={() => navigator.clipboard.writeText(linkedinNewToken)}>
                                      <Copy className="h-3.5 w-3.5 mr-1" /> Copiaza
                                    </Button>
                                  </div>
                                  <p className="text-[10px] text-emerald-600 mt-2">Deschide extensia LinkedIn Galaxy din bara Chrome si lipeste acest token.</p>
                                </div>
                              )}

                              {linkedinTokens.length > 0 && (
                                <div className="space-y-1.5">
                                  {linkedinTokens.map((t: any) => (
                                    <div key={t.id} className="flex items-center gap-2 bg-white rounded-lg p-2.5 border text-xs">
                                      <Key className="h-3.5 w-3.5 text-amber-500" />
                                      <code className="font-mono text-slate-600">{t.tokenPreview}</code>
                                      <Badge variant="outline" className="text-[10px] h-4">{t.name}</Badge>
                                      {t.lastUsedAt && <span className="text-[10px] text-muted-foreground ml-auto">Folosit: {new Date(t.lastUsedAt).toLocaleDateString("ro-RO")}</span>}
                                      <Button size="sm" variant="ghost" className="h-5 w-5 p-0 text-red-400 hover:text-red-600" onClick={() => handleDeleteToken(t.id)}>
                                        <Trash2 className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {linkedinTokens.length === 0 && !linkedinNewToken && (
                                <p className="text-xs text-amber-600 bg-amber-50 rounded-lg p-2 border border-amber-200 flex items-center gap-1.5">
                                  <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" /> Niciun token activ. Genereaza unul apasand butonul de mai sus.
                                </p>
                              )}
                            </div>
                          )}

                          {extensionWizardStep === 4 && (
                            <div className="space-y-3">
                              <div className="flex items-start gap-3">
                                <div className="h-10 w-10 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
                                  <Linkedin className="h-5 w-5 text-emerald-600" />
                                </div>
                                <div>
                                  <h4 className="font-bold text-sm mb-1">Pasul 5: Incepe sa importi prospecte!</h4>
                                  <p className="text-xs text-muted-foreground mb-2">Mergi pe LinkedIn, cauta persoane sau companii, iar extensia le va importa automat.</p>
                                </div>
                              </div>
                              <div className="grid gap-2 sm:grid-cols-3">
                                <a href="https://www.linkedin.com/search/results/people/?keywords=CSR%20Romania&origin=GLOBAL_SEARCH_HEADER" target="_blank" rel="noopener noreferrer"
                                  className="bg-slate-50 rounded-lg p-3 border text-center hover:border-[#0A66C2] hover:bg-blue-50/50 transition-colors group cursor-pointer block">
                                  <UserSearch className="h-5 w-5 text-purple-500 mx-auto mb-1.5" />
                                  <p className="text-xs font-semibold">Cauta persoane CSR</p>
                                  <p className="text-[10px] text-muted-foreground">Factori de decizie CSR</p>
                                </a>
                                <a href="https://www.linkedin.com/search/results/companies/?keywords=Romania&origin=GLOBAL_SEARCH_HEADER" target="_blank" rel="noopener noreferrer"
                                  className="bg-slate-50 rounded-lg p-3 border text-center hover:border-[#0A66C2] hover:bg-blue-50/50 transition-colors group cursor-pointer block">
                                  <Building className="h-5 w-5 text-blue-500 mx-auto mb-1.5" />
                                  <p className="text-xs font-semibold">Cauta companii</p>
                                  <p className="text-[10px] text-muted-foreground">Companii din Romania</p>
                                </a>
                                <a href="https://www.linkedin.com/search/results/people/?keywords=Director%20General%20Romania&origin=GLOBAL_SEARCH_HEADER" target="_blank" rel="noopener noreferrer"
                                  className="bg-slate-50 rounded-lg p-3 border text-center hover:border-[#0A66C2] hover:bg-blue-50/50 transition-colors group cursor-pointer block">
                                  <Briefcase className="h-5 w-5 text-amber-500 mx-auto mb-1.5" />
                                  <p className="text-xs font-semibold">CEO / Directori</p>
                                  <p className="text-[10px] text-muted-foreground">Directori executivi</p>
                                </a>
                              </div>
                              <div className="bg-blue-50 rounded-lg p-3 border border-blue-200 text-xs text-blue-700 space-y-1">
                                <p className="font-semibold flex items-center gap-1.5"><Lightbulb className="h-3.5 w-3.5" /> Cum functioneaza:</p>
                                <ul className="space-y-0.5 text-blue-600 ml-5">
                                  <li>Extensia scrolleaza automat prin rezultatele LinkedIn</li>
                                  <li>Profilurile sunt importate automat (max 150/zi)</li>
                                  <li>Revino aici si apasa &quot;Actualizeaza&quot; sa vezi prospectele noi</li>
                                  <li>Apoi analizeaza fiecare cu AI pentru profil psihologic</li>
                                </ul>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Navigation buttons */}
                        <div className="flex items-center justify-between">
                          <Button size="sm" variant="outline" className="text-xs h-7"
                            onClick={() => setExtensionWizardStep(Math.max(0, extensionWizardStep - 1))}
                            disabled={extensionWizardStep === 0}>
                            Inapoi
                          </Button>
                          <div className="flex items-center gap-1">
                            {[0,1,2,3,4].map(i => (
                              <div key={i} className={`h-1.5 rounded-full transition-all ${extensionWizardStep === i ? "w-6 bg-[#0A66C2]" : extensionWizardStep > i ? "w-1.5 bg-emerald-400" : "w-1.5 bg-slate-300"}`} />
                            ))}
                          </div>
                          <Button size="sm" className="text-xs h-7 bg-[#0A66C2] hover:bg-[#004182]"
                            onClick={() => setExtensionWizardStep(Math.min(4, extensionWizardStep + 1))}
                            disabled={extensionWizardStep === 4}>
                            Urmatorul Pas <ArrowRight className="h-3 w-3 ml-1" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* ═══ Stats mini cards ═══ */}
              <div className="grid gap-2 grid-cols-2 sm:grid-cols-4">
                <div className="bg-white rounded-xl p-3 border shadow-sm text-center relative overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-400 to-blue-600" />
                  <p className="text-2xl font-bold mt-1">{linkedinStats.total || 0}</p>
                  <p className="text-[10px] text-muted-foreground font-medium">Total Prospecte</p>
                </div>
                <div className="bg-white rounded-xl p-3 border shadow-sm text-center relative overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 to-emerald-600" />
                  <p className="text-2xl font-bold text-emerald-600 mt-1">{linkedinStats.avgMatchScore || 0}%</p>
                  <p className="text-[10px] text-muted-foreground font-medium">Scor Mediu AI</p>
                </div>
                <div className="bg-white rounded-xl p-3 border shadow-sm text-center relative overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 to-amber-600" />
                  <p className="text-2xl font-bold text-amber-600 mt-1">{linkedinStats.importedToday || 0}</p>
                  <p className="text-[10px] text-muted-foreground font-medium">Importate Azi</p>
                </div>
                <div className="bg-white rounded-xl p-3 border shadow-sm text-center relative overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-400 to-purple-600" />
                  <p className="text-2xl font-bold text-purple-600 mt-1">{linkedinStats.dailyRemaining ?? 150}</p>
                  <p className="text-[10px] text-muted-foreground font-medium">Ramase Azi</p>
                </div>
              </div>

              {/* ═══ Search + Filter ═══ */}
              <div className="flex flex-wrap gap-2 items-center">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Cauta dupa nume, companie..." value={linkedinSearch} onChange={(e) => setLinkedinSearch(e.target.value)} className="pl-9 h-9" />
                </div>
                <div className="flex gap-1 flex-wrap">
                  {["", "NEW", "ANALYZED", "CONTACTED", "REPLIED", "MEETING", "CONVERTED", "NOT_INTERESTED"].map((s) => {
                    const labels: Record<string, string> = { "": "Toate", ...statusLabels };
                    const count = s ? (linkedinStats.byStatus?.[s] || 0) : linkedinTotal;
                    return (
                      <Button key={s} size="sm" variant={linkedinStatusFilter === s ? "default" : "outline"}
                        className={`text-[10px] h-6 px-2 ${linkedinStatusFilter === s ? "" : statusColors[s] || ""}`}
                        onClick={() => setLinkedinStatusFilter(s)}>
                        {labels[s]} {count > 0 && <span className="ml-0.5 opacity-70">({count})</span>}
                      </Button>
                    );
                  })}
                </div>
              </div>

              {/* ═══ Prospects List ═══ */}
              {linkedinLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-[#0A66C2]" />
                </div>
              ) : linkedinProspects.length === 0 ? (
                <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
                  {/* Hero empty state with gradient */}
                  <div className="bg-gradient-to-br from-[#0A66C2]/5 via-blue-50 to-indigo-50 p-8 text-center">
                    <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-[#0A66C2] to-[#004182] flex items-center justify-center mx-auto mb-4 shadow-lg">
                      <Linkedin className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="font-bold text-lg mb-2">Incepe sa construiesti reteaua de sponsori</h3>
                    <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6">
                      Importa prospecte din LinkedIn automat cu extensia Chrome sau adauga manual link-uri de profil.
                      AI-ul va analiza psihologic fiecare factor de decizie.
                    </p>

                    {/* Two main CTAs */}
                    <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-lg mx-auto">
                      <Button size="lg" className="bg-[#0A66C2] hover:bg-[#004182] text-sm flex-1 h-12 shadow-md"
                        onClick={() => { setShowExtensionWizard(true); setExtensionWizardStep(0); }}>
                        <Puzzle className="h-5 w-5 mr-2" /> Instaleaza Extensia Chrome
                      </Button>
                      <Button size="lg" variant="outline" className="text-sm flex-1 h-12 border-2"
                        onClick={() => setShowManualAdd(true)}>
                        <Link className="h-5 w-5 mr-2" /> Adauga Link LinkedIn
                      </Button>
                    </div>
                  </div>

                  {/* Features grid */}
                  <div className="grid gap-0 sm:grid-cols-3 border-t">
                    <div className="p-5 border-b sm:border-b-0 sm:border-r">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="h-8 w-8 rounded-lg bg-purple-100 flex items-center justify-center">
                          <Brain className="h-4 w-4 text-purple-600" />
                        </div>
                        <p className="font-semibold text-sm">Profil Psihologic AI</p>
                      </div>
                      <p className="text-xs text-muted-foreground">Analizeaza psihologic fiecare factor de decizie: personalitate, motivatii, stil de comunicare, si triggere de persuasiune.</p>
                    </div>
                    <div className="p-5 border-b sm:border-b-0 sm:border-r">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="h-8 w-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                          <Target className="h-4 w-4 text-emerald-600" />
                        </div>
                        <p className="font-semibold text-sm">Matching ONG-Companie</p>
                      </div>
                      <p className="text-xs text-muted-foreground">AI calculeaza scorul de compatibilitate intre ONG-ul tau si fiecare companie, cu argumente specifice.</p>
                    </div>
                    <div className="p-5">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center">
                          <Mail className="h-4 w-4 text-blue-600" />
                        </div>
                        <p className="font-semibold text-sm">Mesaje Personalizate</p>
                      </div>
                      <p className="text-xs text-muted-foreground">Genereaza mesaje persuasive adaptate profilului psihologic al fiecarui factor de decizie.</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {linkedinProspects.map((prospect: any) => {
                    const isExpanded = linkedinExpanded === prospect.id;
                    const hasAnalysis = prospect.aiAnalysis;
                    const score = prospect.aiMatchScore;
                    const scoreColor = score >= 70 ? "text-emerald-600 bg-emerald-50 border-emerald-200" :
                      score >= 40 ? "text-amber-600 bg-amber-50 border-amber-200" :
                      score ? "text-red-600 bg-red-50 border-red-200" : "text-slate-400 bg-slate-50 border-slate-200";

                    return (
                      <Card key={prospect.id} className="border-0 shadow-sm hover:shadow-md transition-all overflow-hidden">
                        <CardContent className="p-3">
                          <div className="flex items-center gap-3">
                            {/* Score */}
                            <div className={`flex-shrink-0 w-11 h-11 rounded-lg border-2 flex items-center justify-center font-bold text-sm ${scoreColor}`}>
                              {score ? `${score}%` : "?"}
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="font-semibold text-sm truncate">{prospect.fullName}</span>
                                <Badge className={`text-[10px] h-4 ${statusColors[prospect.status] || "bg-slate-100 text-slate-600"}`}>
                                  {statusLabels[prospect.status] || prospect.status}
                                </Badge>
                              </div>
                              {prospect.headline && <p className="text-xs text-muted-foreground truncate">{prospect.headline}</p>}
                              <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-0.5">
                                {prospect.company && <span className="flex items-center gap-0.5"><Building className="h-2.5 w-2.5" />{prospect.company}</span>}
                                {prospect.location && <span className="flex items-center gap-0.5"><MapPin className="h-2.5 w-2.5" />{prospect.location}</span>}
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-1 flex-shrink-0">
                              {!hasAnalysis && (
                                <Button size="sm" className="text-xs h-7 bg-purple-600 hover:bg-purple-700"
                                  onClick={() => handleLinkedinAnalyze(prospect.id)} disabled={linkedinAnalyzing === prospect.id}>
                                  {linkedinAnalyzing === prospect.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Brain className="h-3 w-3" />}
                                </Button>
                              )}
                              <Button size="sm" variant="outline" className="text-xs h-7 px-2"
                                onClick={() => handleLinkedinMessage(prospect.id, "linkedin")}
                                disabled={linkedinMsgGen?.loading && linkedinMsgGen.id === prospect.id}>
                                <Linkedin className="h-3 w-3" />
                              </Button>
                              <Button size="sm" variant="outline" className="text-xs h-7 px-2"
                                onClick={() => handleLinkedinMessage(prospect.id, "email")}
                                disabled={linkedinMsgGen?.loading && linkedinMsgGen.id === prospect.id}>
                                <Mail className="h-3 w-3" />
                              </Button>
                              <a href={prospect.profileUrl} target="_blank" rel="noopener noreferrer">
                                <Button size="sm" variant="ghost" className="h-7 w-7 p-0"><ExternalLink className="h-3 w-3" /></Button>
                              </a>
                              <Button size="sm" variant="ghost" className="h-7 w-7 p-0"
                                onClick={() => setLinkedinExpanded(isExpanded ? null : prospect.id)}>
                                {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                              </Button>
                            </div>
                          </div>

                          {/* Match reasons preview */}
                          {prospect.aiMatchReasons && !isExpanded && (
                            <div className="flex flex-wrap gap-1 mt-2 ml-14">
                              {(prospect.aiMatchReasons as string[]).slice(0, 2).map((r: string, i: number) => (
                                <span key={i} className="text-[10px] bg-slate-100 text-slate-600 rounded-full px-2 py-0.5">{r}</span>
                              ))}
                              {(prospect.aiMatchReasons as string[]).length > 2 && <span className="text-[10px] text-muted-foreground">+{(prospect.aiMatchReasons as string[]).length - 2}</span>}
                            </div>
                          )}

                          {/* Expanded */}
                          {isExpanded && (
                            <div className="mt-3 pt-3 border-t space-y-3">
                              {/* Status changer */}
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-[10px] font-semibold text-slate-500">Status:</span>
                                {["NEW", "CONTACTED", "REPLIED", "MEETING", "CONVERTED", "NOT_INTERESTED"].map((s) => (
                                  <Button key={s} size="sm" variant={prospect.status === s ? "default" : "outline"}
                                    className={`text-[10px] h-5 px-2 ${prospect.status !== s ? (statusColors[s] || "") : ""}`}
                                    onClick={() => handleLinkedinStatusChange(prospect.id, s)}>
                                    {statusLabels[s]}
                                  </Button>
                                ))}
                                <Button size="sm" variant="ghost" className="h-5 text-red-400 hover:text-red-600 ml-auto text-[10px]"
                                  onClick={() => handleLinkedinDelete(prospect.id)}>
                                  <Trash2 className="h-3 w-3 mr-0.5" /> Sterge
                                </Button>
                              </div>

                              {/* AI Analysis - Enhanced Psychological Profile */}
                              {hasAnalysis && (
                                <div className="space-y-3">
                                  {/* Match Score & Summary Header */}
                                  <div className="bg-gradient-to-r from-purple-50 via-blue-50 to-emerald-50 rounded-xl p-4 border">
                                    <div className="flex items-center gap-3 mb-3">
                                      <div className={`h-14 w-14 rounded-xl border-2 flex flex-col items-center justify-center font-bold ${scoreColor}`}>
                                        <span className="text-lg leading-none">{score || "?"}</span>
                                        {score && <span className="text-[8px] font-normal">match</span>}
                                      </div>
                                      <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                          <Brain className="h-4 w-4 text-purple-600" />
                                          <span className="font-bold text-sm">Analiza Factor de Decizie</span>
                                          {prospect.aiAnalysis.riskLevel && (
                                            <Badge className={`text-[10px] h-5 ${
                                              prospect.aiAnalysis.riskLevel === "low" ? "bg-green-100 text-green-700" :
                                              prospect.aiAnalysis.riskLevel === "medium" ? "bg-amber-100 text-amber-700" :
                                              "bg-red-100 text-red-700"
                                            }`}>
                                              {prospect.aiAnalysis.riskLevel === "low" ? "Sansa mare" :
                                               prospect.aiAnalysis.riskLevel === "medium" ? "Sansa medie" : "Sansa mica"}
                                            </Badge>
                                          )}
                                          {prospect.aiAnalysis.conversionEstimate && (
                                            <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                                              <Clock className="h-3 w-3" /> {prospect.aiAnalysis.conversionEstimate}
                                            </span>
                                          )}
                                        </div>
                                        {prospect.aiMatchReasons && (
                                          <div className="flex flex-wrap gap-1">
                                            {(prospect.aiMatchReasons as string[]).map((r: string, i: number) => (
                                              <span key={i} className="text-[10px] bg-white border rounded-full px-2 py-0.5 text-slate-600">{r}</span>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>

                                  {/* Psychological Profile - Full Width Prominent Section */}
                                  {prospect.aiAnalysis.psychologicalProfile && (
                                    <div className="bg-purple-50 rounded-xl border border-purple-200 overflow-hidden">
                                      <div className="bg-purple-100/50 px-4 py-2 border-b border-purple-200 flex items-center gap-2">
                                        <Brain className="h-4 w-4 text-purple-700" />
                                        <span className="text-xs font-bold text-purple-800 uppercase tracking-wider">Profil Psihologic - Factor de Decizie</span>
                                      </div>
                                      <div className="p-4 grid gap-3 sm:grid-cols-2">
                                        {prospect.aiAnalysis.psychologicalProfile.personalityType && (
                                          <div className="sm:col-span-2 bg-white rounded-lg p-3 border border-purple-100">
                                            <div className="flex items-center gap-2 mb-1">
                                              <Award className="h-3.5 w-3.5 text-purple-600" />
                                              <span className="text-[10px] font-bold text-purple-700 uppercase">Tip Personalitate</span>
                                            </div>
                                            <p className="text-sm text-purple-800 font-medium">{prospect.aiAnalysis.psychologicalProfile.personalityType}</p>
                                          </div>
                                        )}
                                        {prospect.aiAnalysis.psychologicalProfile.motivations && prospect.aiAnalysis.psychologicalProfile.motivations.length > 0 && (
                                          <div className="bg-white rounded-lg p-3 border border-purple-100">
                                            <div className="flex items-center gap-2 mb-1.5">
                                              <Target className="h-3.5 w-3.5 text-purple-600" />
                                              <span className="text-[10px] font-bold text-purple-700 uppercase">Motivatii Sponsorizare</span>
                                            </div>
                                            <ul className="space-y-1">
                                              {prospect.aiAnalysis.psychologicalProfile.motivations.map((m: string, i: number) => (
                                                <li key={i} className="text-xs text-purple-700 flex items-start gap-1.5">
                                                  <span className="text-purple-400 mt-0.5">&#9679;</span> {m}
                                                </li>
                                              ))}
                                            </ul>
                                          </div>
                                        )}
                                        <div className="space-y-3">
                                          {prospect.aiAnalysis.psychologicalProfile.communicationStyle && (
                                            <div className="bg-white rounded-lg p-3 border border-purple-100">
                                              <div className="flex items-center gap-2 mb-1">
                                                <MessageCircle className="h-3.5 w-3.5 text-purple-600" />
                                                <span className="text-[10px] font-bold text-purple-700 uppercase">Stil Comunicare</span>
                                              </div>
                                              <p className="text-xs text-purple-700">{prospect.aiAnalysis.psychologicalProfile.communicationStyle}</p>
                                            </div>
                                          )}
                                          {prospect.aiAnalysis.psychologicalProfile.decisionStyle && (
                                            <div className="bg-white rounded-lg p-3 border border-purple-100">
                                              <div className="flex items-center gap-2 mb-1">
                                                <Lightbulb className="h-3.5 w-3.5 text-purple-600" />
                                                <span className="text-[10px] font-bold text-purple-700 uppercase">Stil Decizie</span>
                                              </div>
                                              <p className="text-xs text-purple-700">{prospect.aiAnalysis.psychologicalProfile.decisionStyle}</p>
                                            </div>
                                          )}
                                        </div>
                                        {prospect.aiAnalysis.psychologicalProfile.values && (
                                          <div className="sm:col-span-2">
                                            <div className="flex items-center gap-2 mb-1.5">
                                              <Heart className="h-3 w-3 text-purple-600" />
                                              <span className="text-[10px] font-bold text-purple-700 uppercase">Valori</span>
                                            </div>
                                            <div className="flex flex-wrap gap-1.5">
                                              {prospect.aiAnalysis.psychologicalProfile.values.map((v: string, i: number) => (
                                                <span key={i} className="text-xs bg-purple-100 text-purple-700 rounded-full px-2.5 py-1 font-medium">{v}</span>
                                              ))}
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  )}

                                  {/* Strategy & Company in two columns */}
                                  <div className="grid gap-3 sm:grid-cols-2">
                                    {/* Approach Strategy */}
                                    {prospect.aiAnalysis.approachStrategy && (
                                      <div className="bg-blue-50 rounded-xl border border-blue-200 overflow-hidden">
                                        <div className="bg-blue-100/50 px-4 py-2 border-b border-blue-200 flex items-center gap-2">
                                          <Zap className="h-3.5 w-3.5 text-blue-700" />
                                          <span className="text-[10px] font-bold text-blue-800 uppercase tracking-wider">Strategie Abordare</span>
                                        </div>
                                        <div className="p-3 space-y-2 text-xs text-blue-700">
                                          {prospect.aiAnalysis.approachStrategy.bestChannel && (
                                            <div className="flex items-center gap-2 bg-white rounded-lg p-2 border border-blue-100">
                                              <span className="text-[10px] font-bold text-blue-500 w-12">Canal</span>
                                              <span>{prospect.aiAnalysis.approachStrategy.bestChannel}</span>
                                            </div>
                                          )}
                                          {prospect.aiAnalysis.approachStrategy.toneOfVoice && (
                                            <div className="flex items-center gap-2 bg-white rounded-lg p-2 border border-blue-100">
                                              <span className="text-[10px] font-bold text-blue-500 w-12">Ton</span>
                                              <span>{prospect.aiAnalysis.approachStrategy.toneOfVoice}</span>
                                            </div>
                                          )}
                                          {prospect.aiAnalysis.approachStrategy.openingHook && (
                                            <div className="bg-white rounded-lg p-2.5 border border-blue-100">
                                              <span className="text-[10px] font-bold text-blue-500 block mb-0.5">Deschidere perfecta:</span>
                                              <p className="text-blue-800 italic">&quot;{prospect.aiAnalysis.approachStrategy.openingHook}&quot;</p>
                                            </div>
                                          )}
                                          {prospect.aiAnalysis.approachStrategy.keyArguments && (
                                            <div className="bg-white rounded-lg p-2.5 border border-blue-100">
                                              <span className="text-[10px] font-bold text-blue-500 block mb-1">Argumente cheie:</span>
                                              <ul className="space-y-0.5">
                                                {prospect.aiAnalysis.approachStrategy.keyArguments.map((arg: string, i: number) => (
                                                  <li key={i} className="flex items-start gap-1">
                                                    <span className="text-blue-400 text-[10px] mt-0.5">{i + 1}.</span> {arg}
                                                  </li>
                                                ))}
                                              </ul>
                                            </div>
                                          )}
                                          {prospect.aiAnalysis.approachStrategy.callToAction && (
                                            <div className="bg-blue-100 rounded-lg p-2.5 border border-blue-200">
                                              <span className="text-[10px] font-bold text-blue-600 block mb-0.5">Call to Action:</span>
                                              <p className="text-blue-800 font-medium">{prospect.aiAnalysis.approachStrategy.callToAction}</p>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    )}

                                    {/* Company Insights */}
                                    <div className="space-y-3">
                                      <div className="bg-emerald-50 rounded-xl border border-emerald-200 overflow-hidden">
                                        <div className="bg-emerald-100/50 px-4 py-2 border-b border-emerald-200 flex items-center gap-2">
                                          <Building className="h-3.5 w-3.5 text-emerald-700" />
                                          <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">Companie & ONG Match</span>
                                        </div>
                                        <div className="p-3 space-y-2 text-xs">
                                          {prospect.aiAnalysis.companyInsights?.industry && (
                                            <div className="flex items-center justify-between bg-white rounded-lg p-2 border border-emerald-100">
                                              <span className="text-emerald-600">Industrie</span>
                                              <span className="font-medium text-emerald-800">{prospect.aiAnalysis.companyInsights.industry}</span>
                                            </div>
                                          )}
                                          {prospect.aiAnalysis.companyInsights?.estimatedSize && (
                                            <div className="flex items-center justify-between bg-white rounded-lg p-2 border border-emerald-100">
                                              <span className="text-emerald-600">Marime</span>
                                              <span className="font-medium text-emerald-800">{prospect.aiAnalysis.companyInsights.estimatedSize}</span>
                                            </div>
                                          )}
                                          {prospect.aiAnalysis.companyInsights?.csrPotential && (
                                            <div className="flex items-center justify-between bg-white rounded-lg p-2 border border-emerald-100">
                                              <span className="text-emerald-600">Potential CSR</span>
                                              <Badge className={`text-[10px] ${
                                                prospect.aiAnalysis.companyInsights.csrPotential === "ridicat" ? "bg-emerald-100 text-emerald-700" :
                                                prospect.aiAnalysis.companyInsights.csrPotential === "mediu" ? "bg-amber-100 text-amber-700" :
                                                "bg-red-100 text-red-700"
                                              }`}>{prospect.aiAnalysis.companyInsights.csrPotential}</Badge>
                                            </div>
                                          )}
                                          {prospect.aiAnalysis.companyInsights?.budgetEstimate && (
                                            <div className="flex items-center justify-between bg-white rounded-lg p-2 border border-emerald-100">
                                              <span className="text-emerald-600">Buget Estimat</span>
                                              <span className="font-medium text-emerald-800">{prospect.aiAnalysis.companyInsights.budgetEstimate}</span>
                                            </div>
                                          )}
                                        </div>
                                      </div>

                                      {/* Follow-up Plan */}
                                      {prospect.aiAnalysis.followUpPlan && (
                                        <div className="bg-amber-50 rounded-xl border border-amber-200 overflow-hidden">
                                          <div className="bg-amber-100/50 px-4 py-2 border-b border-amber-200 flex items-center gap-2">
                                            <Clock className="h-3.5 w-3.5 text-amber-700" />
                                            <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider">Plan Follow-up</span>
                                          </div>
                                          <div className="p-3 space-y-1.5">
                                            {prospect.aiAnalysis.followUpPlan.map((step: string, i: number) => (
                                              <div key={i} className="flex items-start gap-2 text-xs text-amber-700">
                                                <div className="h-5 w-5 rounded-full bg-amber-200 flex items-center justify-center text-amber-800 font-bold text-[10px] flex-shrink-0 mt-0.5">{i + 1}</div>
                                                <span>{step}</span>
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      )}

                                      {/* Objection Handling */}
                                      {prospect.aiAnalysis.approachStrategy?.objectionHandling && prospect.aiAnalysis.approachStrategy.objectionHandling.length > 0 && (
                                        <div className="bg-red-50 rounded-xl border border-red-200 overflow-hidden">
                                          <div className="bg-red-100/50 px-4 py-2 border-b border-red-200 flex items-center gap-2">
                                            <Shield className="h-3.5 w-3.5 text-red-700" />
                                            <span className="text-[10px] font-bold text-red-800 uppercase tracking-wider">Obiectii & Raspunsuri</span>
                                          </div>
                                          <div className="p-3 space-y-2">
                                            {prospect.aiAnalysis.approachStrategy.objectionHandling.map((oh: any, i: number) => (
                                              <div key={i} className="text-xs">
                                                <p className="text-red-700 font-medium mb-0.5">&quot;{oh.objection}&quot;</p>
                                                <p className="text-red-600 bg-white rounded-lg p-2 border border-red-100">{oh.response}</p>
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* Generated message */}
                              {linkedinMsgGen && linkedinMsgGen.id === prospect.id && !linkedinMsgGen.loading && linkedinMsgGen.data && (
                                <div className="bg-slate-50 rounded-lg p-3 space-y-2">
                                  <div className="flex items-center justify-between">
                                    <p className="text-xs font-semibold flex items-center gap-1.5">
                                      {linkedinMsgGen.channel === "linkedin" ? <Linkedin className="h-3.5 w-3.5 text-[#0A66C2]" /> : <Mail className="h-3.5 w-3.5 text-indigo-600" />}
                                      {linkedinMsgGen.channel === "linkedin" ? "Mesaj LinkedIn" : "Email"}
                                    </p>
                                    <Button size="sm" variant="ghost" className="h-5 w-5 p-0" onClick={() => setLinkedinMsgGen(null)}><X className="h-3 w-3" /></Button>
                                  </div>
                                  {linkedinMsgGen.channel === "linkedin" && linkedinMsgGen.data.connectionMessage && (
                                    <div className="bg-white rounded-lg p-2.5 border">
                                      <div className="flex items-center justify-between mb-1">
                                        <p className="text-[10px] uppercase text-slate-500 font-semibold">Connection Request</p>
                                        <Button size="sm" variant="ghost" className="h-5 px-1.5 text-[10px]" onClick={() => navigator.clipboard.writeText(linkedinMsgGen!.data.connectionMessage)}>
                                          <Copy className="h-3 w-3" />
                                        </Button>
                                      </div>
                                      <p className="text-xs">{linkedinMsgGen.data.connectionMessage}</p>
                                    </div>
                                  )}
                                  {linkedinMsgGen.channel === "linkedin" && linkedinMsgGen.data.inMailMessage && (
                                    <div className="bg-white rounded-lg p-2.5 border">
                                      <div className="flex items-center justify-between mb-1">
                                        <p className="text-[10px] uppercase text-slate-500 font-semibold">InMail</p>
                                        <Button size="sm" variant="ghost" className="h-5 px-1.5 text-[10px]" onClick={() => navigator.clipboard.writeText(linkedinMsgGen!.data.inMailMessage)}>
                                          <Copy className="h-3 w-3" />
                                        </Button>
                                      </div>
                                      <p className="text-xs whitespace-pre-wrap">{linkedinMsgGen.data.inMailMessage}</p>
                                    </div>
                                  )}
                                  {linkedinMsgGen.channel === "email" && linkedinMsgGen.data.subject && (
                                    <div className="bg-white rounded-lg p-2.5 border space-y-1">
                                      <div className="flex items-center justify-between">
                                        <p className="text-xs"><strong>Subiect:</strong> {linkedinMsgGen.data.subject}</p>
                                        <Button size="sm" variant="ghost" className="h-5 px-1.5 text-[10px]" onClick={() => {
                                          const txt = `Subject: ${linkedinMsgGen!.data.subject}\n\n${linkedinMsgGen!.data.emailBody?.replace(/<[^>]*>/g, "") || ""}`;
                                          navigator.clipboard.writeText(txt);
                                        }}>
                                          <Copy className="h-3 w-3" />
                                        </Button>
                                      </div>
                                      <div className="text-xs prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: linkedinMsgGen.data.emailBody || "" }} />
                                    </div>
                                  )}
                                  {linkedinMsgGen.data.psychologicalApproach && (
                                    <p className="text-xs text-purple-600 bg-purple-50 rounded-lg p-2">{linkedinMsgGen.data.psychologicalApproach}</p>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}

                  {/* Pagination */}
                  {linkedinTotal > 30 && (
                    <div className="flex items-center justify-center gap-2 pt-3">
                      <Button size="sm" variant="outline" disabled={linkedinPage <= 1}
                        onClick={() => { const p = linkedinPage - 1; setLinkedinPage(p); fetchLinkedinProspects(p, linkedinSearch, linkedinStatusFilter); }}>
                        Anterior
                      </Button>
                      <span className="text-xs text-muted-foreground">
                        {linkedinPage} / {Math.ceil(linkedinTotal / 30)}
                      </span>
                      <Button size="sm" variant="outline" disabled={linkedinPage >= Math.ceil(linkedinTotal / 30)}
                        onClick={() => { const p = linkedinPage + 1; setLinkedinPage(p); fetchLinkedinProspects(p, linkedinSearch, linkedinStatusFilter); }}>
                        Urmator
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ─────────────── CRM COMPANII ──────────── */}
      {activeSection === "crm" && (
        <>
          <SponsorCRM />
        </>
      )}

      {/* ─────────────── RETEA ONG ────────────── */}
      {activeSection === "retea" && (
        <div className="space-y-4">
          {/* Sub-nav: Conexiuni / Descopera */}
          <div className="flex items-center gap-2 bg-white rounded-lg p-1 border shadow-sm w-fit">
            <button onClick={() => setNetworkMode("conexiuni")}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                networkMode === "conexiuni" ? "bg-purple-500 text-white shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}>
              <Users className="h-4 w-4" /> Conexiuni
              {pendingReceived.length > 0 && (
                <Badge variant="destructive" className="h-4 text-[10px] px-1.5 rounded-full">{pendingReceived.length}</Badge>
              )}
            </button>
            <button onClick={() => setNetworkMode("descopera")}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                networkMode === "descopera" ? "bg-purple-500 text-white shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}>
              <Search className="h-4 w-4" /> Descopera ONG-uri
            </button>
          </div>

          {/* CONEXIUNI MODE */}
          {networkMode === "conexiuni" && (
            <div className="space-y-4">
              {loadingConnections ? (
                <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
              ) : (
                <>
                  {/* Pending received */}
                  {pendingReceived.length > 0 && (
                    <div>
                      <p className="text-sm font-semibold mb-2 flex items-center gap-2">
                        <UserPlus className="h-4 w-4 text-orange-500" /> Cereri primite
                        <Badge variant="secondary" className="text-xs">{pendingReceived.length}</Badge>
                      </p>
                      <div className="grid gap-2 md:grid-cols-2">
                        {pendingReceived.map((item) => (
                          <div key={item.id} className="flex items-center gap-3 bg-orange-50 rounded-xl p-3 border border-orange-200">
                            <Avatar name={item.user.name} email={item.user.email} className="h-10 w-10 text-sm shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-sm truncate">{item.user.name || item.user.email}</p>
                              {item.user.ngo && <p className="text-xs text-muted-foreground truncate">{item.user.ngo.name}</p>}
                              {item.message && <p className="text-xs text-muted-foreground italic truncate mt-0.5">&quot;{item.message}&quot;</p>}
                            </div>
                            <div className="flex gap-1.5 shrink-0">
                              <Button size="sm" className="h-8 w-8 p-0 bg-emerald-500 hover:bg-emerald-600"
                                onClick={() => handleConnectionAction(item.id, "accept")} disabled={actionLoading === item.id}>
                                {actionLoading === item.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                              </Button>
                              <Button size="sm" variant="outline" className="h-8 w-8 p-0"
                                onClick={() => handleConnectionAction(item.id, "reject")} disabled={actionLoading === item.id}>
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Pending sent */}
                  {pendingSent.length > 0 && (
                    <div>
                      <p className="text-sm font-semibold mb-2 flex items-center gap-2">
                        <Clock className="h-4 w-4 text-blue-500" /> Cereri trimise
                        <Badge variant="secondary" className="text-xs">{pendingSent.length}</Badge>
                      </p>
                      <div className="grid gap-2 md:grid-cols-2">
                        {pendingSent.map((item) => (
                          <div key={item.id} className="flex items-center gap-3 bg-blue-50 rounded-xl p-3 border border-blue-200">
                            <Avatar name={item.user.name} email={item.user.email} className="h-10 w-10 text-sm shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-sm truncate">{item.user.name || item.user.email}</p>
                              {item.user.ngo && <p className="text-xs text-muted-foreground truncate">{item.user.ngo.name}</p>}
                              <p className="text-[10px] text-muted-foreground mt-0.5">Trimis {item.requestedAt && formatRelativeDate(item.requestedAt)}</p>
                            </div>
                            <Button size="sm" variant="outline" className="text-red-600 text-xs h-7 shrink-0"
                              onClick={() => handleDeleteConnection(item.id)} disabled={actionLoading === item.id}>
                              {actionLoading === item.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <X className="h-3 w-3 mr-0.5" />}
                              Anuleaza
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Accepted connections */}
                  <div>
                    <p className="text-sm font-semibold mb-2 flex items-center gap-2">
                      <Users className="h-4 w-4 text-green-500" /> Conexiunile mele
                      <Badge variant="secondary" className="text-xs">{accepted.length}</Badge>
                    </p>
                    {accepted.length === 0 ? (
                      <div className="text-center py-8 bg-white rounded-xl border">
                        <Users className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                        <p className="font-semibold text-sm mb-1">Nicio conexiune</p>
                        <p className="text-xs text-muted-foreground mb-3">Descopera ONG-uri si trimite cereri de conectare</p>
                        <Button size="sm" onClick={() => setNetworkMode("descopera")}>
                          <Search className="h-3.5 w-3.5 mr-1.5" /> Descopera ONG-uri
                        </Button>
                      </div>
                    ) : (
                      <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                        {accepted.map((item) => (
                          <div key={item.id} className="bg-white rounded-xl p-3 border shadow-sm hover:shadow-md transition-all">
                            <div className="flex items-center gap-3">
                              <Avatar name={item.user.name} email={item.user.email} className="h-10 w-10 text-sm shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-sm truncate">{item.user.name || item.user.email}</p>
                                {item.user.ngo && <p className="text-xs text-muted-foreground truncate">{item.user.ngo.name}</p>}
                                {item.user.ngo?.category && <Badge variant="outline" className="text-[10px] h-4 mt-0.5">{item.user.ngo.category}</Badge>}
                              </div>
                            </div>
                            <div className="flex gap-2 mt-2 pt-2 border-t">
                              <Button size="sm" variant="outline" className="flex-1 text-xs h-7" onClick={() => openChatWith(item.user.id)}>
                                <MessageCircle className="h-3 w-3 mr-1" /> Mesaj
                              </Button>
                              <Button size="sm" variant="ghost" className="text-red-400 hover:text-red-600 h-7 w-7 p-0"
                                onClick={() => handleDeleteConnection(item.id)} disabled={actionLoading === item.id}>
                                {actionLoading === item.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <X className="h-3 w-3" />}
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {/* DESCOPERA MODE */}
          {networkMode === "descopera" && (
            <div className="space-y-3">
              {/* Search + categories */}
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input placeholder="Cauta organizatii..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9 h-9" />
                </div>
                <div className="flex gap-1 flex-wrap">
                  <Button size="sm" variant={selectedCategory === "" ? "default" : "outline"} className="text-xs h-7" onClick={() => setSelectedCategory("")}>Toate</Button>
                  {discoverCategories.map((cat) => (
                    <Button key={cat} size="sm" variant={selectedCategory === cat ? "default" : "outline"} className="text-xs h-7"
                      onClick={() => setSelectedCategory(cat === selectedCategory ? "" : cat)}>
                      {cat}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Results */}
              {loadingDiscover ? (
                <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
              ) : discoverResults.length === 0 ? (
                <div className="text-center py-8 bg-white rounded-xl border">
                  <Building className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                  <p className="font-semibold text-sm mb-1">Nicio organizatie gasita</p>
                  <p className="text-xs text-muted-foreground">
                    {searchQuery ? `Niciun rezultat pentru "${searchQuery}"` : "Nu exista organizatii disponibile momentan."}
                  </p>
                </div>
              ) : (
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {discoverResults.map((item) => (
                    <div key={item.ngo.id} className={`bg-white rounded-xl p-4 border shadow-sm hover:shadow-md transition-all ${item.ngo.isFeatured ? "border-yellow-300 bg-yellow-50/30" : ""}`}>
                      <div className="flex items-start gap-3 mb-3">
                        {item.ngo.logoUrl ? (
                          <img src={item.ngo.logoUrl} alt={item.ngo.name} className="h-10 w-10 rounded-lg object-cover shrink-0" />
                        ) : (
                          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                            <Building className="h-5 w-5 text-primary" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm truncate flex items-center gap-1.5">
                            {item.ngo.name}
                            {item.ngo.isFeatured && <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />}
                          </p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            {item.ngo.category && <Badge variant="outline" className="text-[10px] h-4">{item.ngo.category}</Badge>}
                            {item.ngo.rating > 0 && (
                              <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                                <Heart className="h-2.5 w-2.5 text-red-500 fill-red-500" /> {item.ngo.rating.toFixed(1)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {item.ngo.description && <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{item.ngo.description}</p>}

                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground mb-3">
                        <Users className="h-3 w-3" />
                        <span className="truncate">{item.user.name || item.user.email}</span>
                        {item.ngo.websiteUrl && (
                          <a href={item.ngo.websiteUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-0.5 hover:underline ml-auto">
                            <Globe className="h-3 w-3" /> Website
                          </a>
                        )}
                      </div>

                      {item.connectionStatus === "ACCEPTED" ? (
                        <Button size="sm" variant="outline" className="w-full h-8 text-xs" disabled>
                          <Check className="h-3.5 w-3.5 mr-1.5 text-green-500" /> Conectat
                        </Button>
                      ) : item.connectionStatus === "PENDING" ? (
                        <Button size="sm" variant="outline" className="w-full h-8 text-xs" disabled>
                          <Clock className="h-3.5 w-3.5 mr-1.5" /> In asteptare
                        </Button>
                      ) : (
                        <Button size="sm" className="w-full h-8 text-xs" onClick={() => sendConnectionRequest(item.user.id)} disabled={connectingTo === item.user.id}>
                          {connectingTo === item.user.id ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <UserPlus className="h-3.5 w-3.5 mr-1.5" />}
                          Conecteaza-te
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ─────────────── MESAJE ────────────── */}
      {activeSection === "mesaje" && (
        <>
        <Card className="overflow-hidden border-0 shadow-sm">
          <div className="flex h-[550px]">
            {/* Conversations sidebar */}
            <div className={`w-full md:w-72 border-r flex flex-col ${selectedConversation ? "hidden md:flex" : "flex"}`}>
              <div className="p-3 border-b">
                <p className="font-semibold text-sm">Conversatii</p>
              </div>
              <div className="flex-1 overflow-y-auto">
                {loadingConversations ? (
                  <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
                ) : conversations.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                    <MessageCircle className="h-8 w-8 text-muted-foreground mb-2" />
                    <p className="text-xs text-muted-foreground">Nicio conversatie. Conecteaza-te cu ONG-uri si trimite mesaje.</p>
                  </div>
                ) : (
                  conversations.map((conv) => (
                    <button key={conv.user.id} onClick={() => setSelectedConversation(conv.user.id)}
                      className={`w-full p-3 flex items-center gap-2.5 hover:bg-muted/50 transition-colors text-left border-b ${selectedConversation === conv.user.id ? "bg-muted" : ""}`}>
                      <Avatar name={conv.user.name} email={conv.user.email} className="h-9 w-9 text-xs shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className={`text-sm truncate ${conv.unreadCount > 0 ? "font-bold" : "font-medium"}`}>
                            {conv.user.name || conv.user.email}
                          </p>
                          <span className="text-[10px] text-muted-foreground shrink-0 ml-1">{formatRelativeDate(conv.lastMessage.createdAt)}</span>
                        </div>
                        <p className={`text-xs truncate ${conv.unreadCount > 0 ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                          {conv.lastMessage.senderId === currentUserId ? "Tu: " : ""}{conv.lastMessage.content}
                        </p>
                      </div>
                      {conv.unreadCount > 0 && (
                        <Badge variant="destructive" className="h-4 min-w-[16px] rounded-full p-0 text-[10px] flex items-center justify-center shrink-0">
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
                  <MessageCircle className="h-12 w-12 text-muted-foreground mb-3" />
                  <p className="font-semibold text-sm mb-1">Selecteaza o conversatie</p>
                  <p className="text-xs text-muted-foreground">Alege din lista sau trimite un mesaj unei conexiuni.</p>
                </div>
              ) : (
                <>
                  {/* Chat header */}
                  <div className="p-3 border-b flex items-center gap-2.5">
                    <Button size="sm" variant="ghost" className="md:hidden h-7 w-7 p-0" onClick={() => setSelectedConversation(null)}>
                      <ChevronRight className="h-4 w-4 rotate-180" />
                    </Button>
                    {chatPartner && (
                      <>
                        <Avatar name={chatPartner.name} email={chatPartner.email} className="h-8 w-8 text-xs" />
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm truncate">{chatPartner.name || chatPartner.email}</p>
                          {chatPartner.ngo && <p className="text-xs text-muted-foreground truncate">{chatPartner.ngo.name}</p>}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-2">
                    {loadingChat ? (
                      <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
                    ) : chatMessages.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12 text-center">
                        <Send className="h-8 w-8 text-muted-foreground mb-2" />
                        <p className="text-xs text-muted-foreground">Niciun mesaj. Trimite primul mesaj!</p>
                      </div>
                    ) : (
                      chatMessages.map((msg) => {
                        const isMine = msg.senderId === currentUserId;
                        return (
                          <div key={msg.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                            <div className={`max-w-[75%] rounded-2xl px-3 py-2 ${
                              isMine ? "bg-primary text-primary-foreground rounded-br-md" : "bg-muted rounded-bl-md"
                            }`}>
                              <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                              <p className={`text-[10px] mt-0.5 ${isMine ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
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
                    <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} className="flex gap-2">
                      <Textarea
                        placeholder="Scrie un mesaj..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
                        className="min-h-[38px] max-h-[100px] resize-none text-sm"
                        rows={1}
                      />
                      <Button type="submit" size="icon" className="h-9 w-9" disabled={!newMessage.trim() || sendingMessage}>
                        {sendingMessage ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                      </Button>
                    </form>
                  </div>
                </>
              )}
            </div>
          </div>
        </Card>
        </>
      )}

      <PageHelp items={[
        { title: "Cauta Sponsori", description: "Gaseste companii potrivite pentru sponsorizari folosind AI (cuvinte cheie) sau LinkedIn Galaxy (import prospecti)." },
        { title: "Cautare AI", description: "Scrie cuvinte cheie (ex: IT, banci) si AI-ul gaseste companii cu informatii de contact si motive de sponsorizare." },
        { title: "LinkedIn Galaxy", description: "Importa prospecti din LinkedIn cu extensia Chrome. Genereaza mesaje personalizate si analizeaza compatibilitatea." },
        { title: "CRM Companii", description: "Gestioneaza relatiile cu sponsorii: adauga companii, contacte, interactiuni si urmareste statusul (Nou, Contactat, Sponsor)." },
        { title: "Retea ONG", description: "Conecteaza-te cu alte ONG-uri. Tab Conexiuni = organizatii conectate, tab Descopera = gaseste ONG-uri noi." },
        { title: "Mesaje", description: "Chat direct cu ONG-urile conectate. Selecteaza o conversatie si trimite mesaje." },
        { title: "Carduri rapide LinkedIn", description: "Shortcut-uri care deschid cautari LinkedIn preconfigurate: companii Romania, CSR, CEO/Directori." },
      ]} />
    </div>
  );
}

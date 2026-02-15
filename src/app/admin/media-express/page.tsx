"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Zap, Search, Loader2, ExternalLink, Send, CheckCircle2,
  Clock, AlertCircle, Building2, Mail, Plus, Trash2,
  FileText, Package, Eye, ChevronDown, ChevronUp,
  Link as LinkIcon, Globe,
} from "lucide-react";

interface MediaExpressOrder {
  id: string;
  title: string;
  summary: string | null;
  mediaExpressOrderId: string;
  mediaExpressStatus: string;
  mediaExpressPackage: string;
  mediaExpressPrice: number;
  mediaExpressReport: any;
  createdAt: string;
  ngo: {
    id: string;
    name: string;
    slug: string;
    senderEmail: string | null;
    billingEmail: string | null;
    users: { email: string; name: string | null }[];
  };
}

interface Stats {
  total: number;
  pending: number;
  processing: number;
  completed: number;
  failed: number;
  totalRevenue: number;
}

interface LinkItem {
  url: string;
  publicationName: string;
}

export default function AdminMediaExpressPage() {
  const [orders, setOrders] = useState<MediaExpressOrder[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, pending: 0, processing: 0, completed: 0, failed: 0, totalRevenue: 0 });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");

  // Expanded order for editing links
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [editLinks, setEditLinks] = useState<LinkItem[]>([]);
  const [savingLinks, setSavingLinks] = useState(false);
  const [sendingReport, setSendingReport] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState("");

  const loadOrders = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter && statusFilter !== "all") params.set("status", statusFilter);
      if (search) params.set("search", search);
      const res = await fetch(`/api/admin/media-express?${params.toString()}`);
      const data = await res.json();
      setOrders(data.orders || []);
      setStats(data.stats || { total: 0, pending: 0, processing: 0, completed: 0, failed: 0, totalRevenue: 0 });
    } catch {
      // keep state
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [statusFilter]);

  const handleExpandOrder = (order: MediaExpressOrder) => {
    if (expandedOrderId === order.id) {
      setExpandedOrderId(null);
      setEditLinks([]);
      return;
    }
    setExpandedOrderId(order.id);
    // Load existing links or start empty
    const existingLinks = order.mediaExpressReport?.links || [];
    if (existingLinks.length > 0) {
      setEditLinks(existingLinks);
    } else {
      // Start with 5 empty rows
      setEditLinks(Array.from({ length: 5 }, () => ({ url: "", publicationName: "" })));
    }
  };

  const handleAddLink = () => {
    setEditLinks((prev) => [...prev, { url: "", publicationName: "" }]);
  };

  const handleAddMultipleLinks = () => {
    setEditLinks((prev) => [...prev, ...Array.from({ length: 10 }, () => ({ url: "", publicationName: "" }))]);
  };

  const handleRemoveLink = (index: number) => {
    setEditLinks((prev) => prev.filter((_, i) => i !== index));
  };

  const handleLinkChange = (index: number, field: "url" | "publicationName", value: string) => {
    setEditLinks((prev) =>
      prev.map((link, i) => (i === index ? { ...link, [field]: value } : link))
    );
  };

  const handleSaveLinks = async (orderId: string) => {
    const validLinks = editLinks.filter((l) => l.url.trim());
    if (validLinks.length === 0) return;

    setSavingLinks(true);
    try {
      const res = await fetch("/api/admin/media-express", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "save_links", orderId, links: validLinks }),
      });
      if (res.ok) {
        setSuccessMsg("Linkurile au fost salvate cu succes!");
        setTimeout(() => setSuccessMsg(""), 3000);
        await loadOrders();
      }
    } catch {
      // silently fail
    } finally {
      setSavingLinks(false);
    }
  };

  const handleUpdateStatus = async (orderId: string, status: string) => {
    try {
      await fetch("/api/admin/media-express", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "update_status", orderId, status }),
      });
      await loadOrders();
    } catch {
      // silently fail
    }
  };

  const handleSendReport = async (orderId: string) => {
    setSendingReport(orderId);
    try {
      const res = await fetch("/api/admin/media-express", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "send_report", orderId }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccessMsg(`Raport trimis cu succes la ${data.sentTo}!`);
        setTimeout(() => setSuccessMsg(""), 5000);
        await loadOrders();
      } else {
        setSuccessMsg(`Eroare: ${data.error}`);
        setTimeout(() => setSuccessMsg(""), 5000);
      }
    } catch {
      setSuccessMsg("Eroare la trimiterea raportului");
      setTimeout(() => setSuccessMsg(""), 5000);
    } finally {
      setSendingReport(null);
    }
  };

  const handlePasteBulkLinks = (text: string) => {
    // Parse pasted text - each line is a URL, optionally with publication name separated by tab or |
    const lines = text.split("\n").filter((l) => l.trim());
    const newLinks: LinkItem[] = lines.map((line) => {
      const parts = line.split(/\t|\|/).map((p) => p.trim());
      if (parts.length >= 2) {
        return { publicationName: parts[0], url: parts[1] };
      }
      return { url: parts[0], publicationName: "" };
    });
    if (newLinks.length > 0) {
      setEditLinks(newLinks);
    }
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200 text-xs"><Clock className="h-3 w-3 mr-1" />In asteptare</Badge>;
      case "processing":
        return <Badge className="bg-blue-100 text-blue-700 border-blue-200 text-xs"><Loader2 className="h-3 w-3 mr-1 animate-spin" />Se proceseaza</Badge>;
      case "completed":
        return <Badge className="bg-green-100 text-green-700 border-green-200 text-xs"><CheckCircle2 className="h-3 w-3 mr-1" />Completat</Badge>;
      case "failed":
        return <Badge className="bg-red-100 text-red-700 border-red-200 text-xs"><AlertCircle className="h-3 w-3 mr-1" />Esuat</Badge>;
      default:
        return <Badge variant="outline" className="text-xs">{status}</Badge>;
    }
  };

  const validLinksCount = editLinks.filter((l) => l.url.trim()).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500 via-orange-500 to-rose-600 p-6 text-white shadow-xl">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djZoLTZWMzRoNnptMC0zMHY2aC02VjRoNnptMCAxMnY2aC02VjE2aDZ6bTAgMTJ2Nmg2djZoLTZ2LTZ6bTEyLTEydjZoLTZWMTZoNnptLTI0IDB2Nmg2djZILTZ2LTZIMjR6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-30" />
        <div className="relative">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
              <Zap className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">MediaExpress - Comenzi</h1>
              <p className="text-white/80 text-sm">
                Gestioneaza comenzile MediaExpress, adauga linkuri de publicare si trimite rapoarte clientilor.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Success Message */}
      {successMsg && (
        <div className={`p-3 rounded-xl text-sm font-medium ${successMsg.startsWith("Eroare") ? "bg-red-50 text-red-700 border border-red-200" : "bg-green-50 text-green-700 border border-green-200"}`}>
          {successMsg.startsWith("Eroare") ? <AlertCircle className="h-4 w-4 inline mr-2" /> : <CheckCircle2 className="h-4 w-4 inline mr-2" />}
          {successMsg}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <Card className="border-0 shadow-md">
          <CardContent className="py-4 text-center">
            <div className="text-2xl font-bold text-slate-800">{stats.total}</div>
            <div className="text-xs text-muted-foreground mt-1">Total comenzi</div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="py-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            <div className="text-xs text-muted-foreground mt-1">In asteptare</div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="py-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.processing}</div>
            <div className="text-xs text-muted-foreground mt-1">Se proceseaza</div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="py-4 text-center">
            <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
            <div className="text-xs text-muted-foreground mt-1">Completate</div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="py-4 text-center">
            <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
            <div className="text-xs text-muted-foreground mt-1">Esuate</div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="py-4 text-center">
            <div className="text-2xl font-bold text-violet-600">{stats.totalRevenue.toLocaleString("ro-RO")}</div>
            <div className="text-xs text-muted-foreground mt-1">LEI total</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-md">
        <CardContent className="py-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 flex-1">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cauta dupa titlu, comanda sau ONG..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && loadOrders()}
                className="h-9 rounded-lg border-0 bg-muted/50"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[160px] h-9 rounded-lg">
                <SelectValue placeholder="Toate statusurile" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toate statusurile</SelectItem>
                <SelectItem value="pending">In asteptare</SelectItem>
                <SelectItem value="processing">Se proceseaza</SelectItem>
                <SelectItem value="completed">Completat</SelectItem>
                <SelectItem value="failed">Esuat</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" className="h-9 rounded-lg" onClick={loadOrders}>
              <Search className="h-3.5 w-3.5 mr-1" />
              Cauta
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Orders List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : orders.length === 0 ? (
        <Card className="border-0 shadow-md">
          <CardContent className="py-12 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100 text-amber-600 mx-auto mb-4">
              <Package className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-semibold mb-1">Nicio comanda MediaExpress</h3>
            <p className="text-sm text-muted-foreground">
              Comenzile plasate de ONG-uri vor aparea aici.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <Card key={order.id} className="border-0 shadow-md overflow-hidden">
              {/* Order Header */}
              <CardContent className="py-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-100 to-orange-100 text-amber-600 shrink-0">
                    <Zap className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h4 className="font-semibold text-sm">{order.title}</h4>
                      {statusBadge(order.mediaExpressStatus)}
                      <Badge variant="outline" className="text-xs font-mono">
                        {order.mediaExpressOrderId}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Building2 className="h-3 w-3" />
                        {order.ngo.name}
                      </span>
                      <span className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {order.ngo.billingEmail || order.ngo.senderEmail || order.ngo.users?.[0]?.email || "N/A"}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(order.createdAt).toLocaleDateString("ro-RO", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </span>
                      <span className="flex items-center gap-1 font-semibold text-violet-600">
                        {(order.mediaExpressPrice || 0).toLocaleString("ro-RO")} LEI
                      </span>
                      {order.mediaExpressReport?.links?.length > 0 && (
                        <span className="flex items-center gap-1 text-green-600 font-medium">
                          <LinkIcon className="h-3 w-3" />
                          {order.mediaExpressReport.links.length} linkuri
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {/* Status change dropdown */}
                    <Select
                      value={order.mediaExpressStatus}
                      onValueChange={(v) => handleUpdateStatus(order.id, v)}
                    >
                      <SelectTrigger className="w-[130px] h-8 text-xs rounded-lg">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">In asteptare</SelectItem>
                        <SelectItem value="processing">Se proceseaza</SelectItem>
                        <SelectItem value="completed">Completat</SelectItem>
                        <SelectItem value="failed">Esuat</SelectItem>
                      </SelectContent>
                    </Select>

                    {/* Send Report Button */}
                    {order.mediaExpressReport?.links?.length > 0 && (
                      <Button
                        size="sm"
                        className="h-8 text-xs bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-lg"
                        onClick={() => handleSendReport(order.id)}
                        disabled={sendingReport === order.id}
                      >
                        {sendingReport === order.id ? (
                          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                        ) : (
                          <Send className="h-3 w-3 mr-1" />
                        )}
                        Trimite raport
                      </Button>
                    )}

                    {/* Expand/Collapse */}
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs rounded-lg"
                      onClick={() => handleExpandOrder(order)}
                    >
                      {expandedOrderId === order.id ? (
                        <><ChevronUp className="h-3 w-3 mr-1" />Inchide</>
                      ) : (
                        <><ChevronDown className="h-3 w-3 mr-1" />Linkuri</>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>

              {/* Expanded: Link Editor */}
              {expandedOrderId === order.id && (
                <div className="border-t bg-muted/20 px-6 py-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-semibold flex items-center gap-2">
                        <LinkIcon className="h-4 w-4 text-violet-500" />
                        Linkuri publicare ({validLinksCount} linkuri valide)
                      </h4>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Adauga linkurile articolelor publicate. Poti face paste la mai multe linkuri deodata (un link pe linie).
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" className="h-7 text-xs rounded-lg" onClick={handleAddLink}>
                        <Plus className="h-3 w-3 mr-1" />
                        +1 rand
                      </Button>
                      <Button variant="outline" size="sm" className="h-7 text-xs rounded-lg" onClick={handleAddMultipleLinks}>
                        <Plus className="h-3 w-3 mr-1" />
                        +10 randuri
                      </Button>
                    </div>
                  </div>

                  {/* Bulk paste area */}
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                    <Label className="text-xs font-semibold text-amber-700 mb-1 block">
                      Paste rapid (un link pe linie, optional: NumePublicatie | URL)
                    </Label>
                    <textarea
                      className="w-full h-20 text-xs border border-amber-200 rounded-lg p-2 bg-white resize-none focus:outline-none focus:ring-2 focus:ring-amber-300"
                      placeholder={"Exemplu:\nMonitorul de Cluj | https://monitorulcj.ro/articol-123\nhttps://ziarullocal.ro/stiri/articol-456\nDigi24 | https://digi24.ro/stiri/articol-789"}
                      onPaste={(e) => {
                        e.preventDefault();
                        const text = e.clipboardData.getData("text");
                        handlePasteBulkLinks(text);
                      }}
                    />
                  </div>

                  {/* Individual link rows */}
                  <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
                    {editLinks.map((link, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground w-6 text-right shrink-0">{i + 1}.</span>
                        <Input
                          placeholder="Numele publicatiei"
                          value={link.publicationName}
                          onChange={(e) => handleLinkChange(i, "publicationName", e.target.value)}
                          className="h-8 text-xs rounded-lg w-[200px]"
                        />
                        <Input
                          placeholder="https://..."
                          value={link.url}
                          onChange={(e) => handleLinkChange(i, "url", e.target.value)}
                          className="h-8 text-xs rounded-lg flex-1"
                        />
                        {link.url && (
                          <a
                            href={link.url.startsWith("http") ? link.url : `https://${link.url}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-500 hover:text-blue-700 shrink-0"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg shrink-0"
                          onClick={() => handleRemoveLink(i)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>

                  {/* Save & Send Actions */}
                  <div className="flex items-center gap-3 pt-2 border-t">
                    <Button
                      className="bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white shadow-md rounded-lg"
                      onClick={() => handleSaveLinks(order.id)}
                      disabled={savingLinks || validLinksCount === 0}
                    >
                      {savingLinks ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                      )}
                      Salveaza {validLinksCount} linkuri
                    </Button>
                    {validLinksCount > 0 && (
                      <Button
                        className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-md rounded-lg"
                        onClick={() => handleSendReport(order.id)}
                        disabled={sendingReport === order.id}
                      >
                        {sendingReport === order.id ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Mail className="h-4 w-4 mr-2" />
                        )}
                        Salveaza & trimite raport pe email
                      </Button>
                    )}
                    <span className="text-xs text-muted-foreground">
                      Userul va primi raportul cu toate linkurile pe email.
                    </span>
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  CreditCard, TrendingUp, AlertTriangle, Clock, Users,
  CheckCircle, XCircle, RefreshCw, Send, Calendar, FileText,
} from "lucide-react";

interface NgoSubscription {
  id: string;
  name: string;
  slug: string;
  subscriptionPlan: string;
  subscriptionStatus: string | null;
  subscriptionStartAt: string | null;
  subscriptionExpiresAt: string | null;
  subscriptionNotes: string | null;
  autoRenew: boolean;
  isActive: boolean;
  category: string | null;
  createdAt: string;
  verification: { status: string } | null;
  _count: { donors: number; donations: number; campaigns: number; users: number };
  users: { email: string; name: string | null }[];
}

interface Summary {
  total: number;
  byPlan: Record<string, number>;
  active: number;
  expiring: number;
  expired: number;
  revenue: { monthly: number; annual: number };
}

export default function AdminSubscriptionsPage() {
  const [ngos, setNgos] = useState<NgoSubscription[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [filter, setFilter] = useState("all");
  const [planFilter, setPlanFilter] = useState("");

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [selectedNgo, setSelectedNgo] = useState<NgoSubscription | null>(null);
  const [modalPlan, setModalPlan] = useState("PRO");
  const [modalDuration, setModalDuration] = useState("12");
  const [modalNotes, setModalNotes] = useState("");
  const [modalSendEmail, setModalSendEmail] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Renew modal
  const [showRenewModal, setShowRenewModal] = useState(false);
  const [renewDuration, setRenewDuration] = useState("12");

  useEffect(() => {
    fetchData();
  }, [filter, planFilter]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter !== "all") params.set("filter", filter);
      if (planFilter) params.set("plan", planFilter);

      const res = await fetch(`/api/admin/subscriptions?${params}`);
      const data = await res.json();
      setNgos(data.ngos || []);
      setSummary(data.summary || null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openAssignModal = (ngo: NgoSubscription) => {
    setSelectedNgo(ngo);
    setModalPlan(ngo.subscriptionPlan === "BASIC" ? "PRO" : ngo.subscriptionPlan);
    setModalDuration("12");
    setModalNotes("");
    setModalSendEmail(true);
    setShowModal(true);
  };

  const openRenewModal = (ngo: NgoSubscription) => {
    setSelectedNgo(ngo);
    setRenewDuration("12");
    setShowRenewModal(true);
  };

  const handleAssignPlan = async () => {
    if (!selectedNgo) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/ngos/${selectedNgo.id}/subscription`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan: modalPlan,
          durationMonths: modalDuration === "0" ? null : parseInt(modalDuration),
          notes: modalNotes || undefined,
          sendNotification: modalSendEmail,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Eroare");
      setSuccessMsg(data.message || `Planul ${modalPlan} atribuit cu succes!`);
      setErrorMsg("");
      setShowModal(false);
      setTimeout(() => setSuccessMsg(""), 5000);
      fetchData();
    } catch (err: any) {
      setErrorMsg(err.message || "Eroare la atribuirea planului");
      setSuccessMsg("");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRenew = async () => {
    if (!selectedNgo) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/ngos/${selectedNgo.id}/subscription`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ durationMonths: parseInt(renewDuration) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Eroare");
      setSuccessMsg(data.message || "Abonament reinnoit cu succes!");
      setErrorMsg("");
      setShowRenewModal(false);
      setTimeout(() => setSuccessMsg(""), 5000);
      fetchData();
    } catch (err: any) {
      setErrorMsg(err.message || "Eroare la reinnoire");
      setSuccessMsg("");
    } finally {
      setSubmitting(false);
    }
  };

  const runCronCheck = async () => {
    try {
      const res = await fetch("/api/cron/subscriptions");
      const data = await res.json();
      if (data.success) {
        setSuccessMsg(
          `Verificare completa: ${data.results.subscriptionsExpiring} in curs de expirare, ${data.results.subscriptionsExpired} expirate`
        );
        fetchData();
      } else {
        setErrorMsg("Eroare la verificarea abonamentelor");
      }
      setTimeout(() => setSuccessMsg(""), 5000);
    } catch {
      setErrorMsg("Eroare la verificare");
    }
  };

  const planColors: Record<string, string> = {
    BASIC: "bg-slate-100 text-slate-800",
    PRO: "bg-blue-100 text-blue-800",
    ELITE: "bg-purple-100 text-purple-800",
  };

  const statusLabels: Record<string, { label: string; color: string }> = {
    active: { label: "Activ", color: "bg-green-100 text-green-800" },
    expired: { label: "Expirat", color: "bg-red-100 text-red-800" },
    past_due: { label: "Plata restanta", color: "bg-orange-100 text-orange-800" },
    canceled: { label: "Anulat", color: "bg-gray-100 text-gray-800" },
    trialing: { label: "Trial", color: "bg-cyan-100 text-cyan-800" },
  };

  const getDaysLeft = (expiresAt: string | null): number | null => {
    if (!expiresAt) return null;
    const diff = new Date(expiresAt).getTime() - Date.now();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const prices: Record<string, number> = { BASIC: 0, PRO: 149, ELITE: 349 };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <CreditCard className="h-7 w-7 text-blue-600" />
          <h1 className="text-3xl font-bold">Abonamente</h1>
        </div>
        <Button onClick={runCronCheck} variant="outline" size="sm" className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Verifica Expirari
        </Button>
      </div>

      {/* Messages */}
      {successMsg && (
        <div className="bg-green-50 border border-green-200 text-green-700 p-4 rounded-lg text-sm flex items-center gap-2">
          <CheckCircle className="h-4 w-4 flex-shrink-0" />
          {successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg text-sm flex items-center gap-2">
          <XCircle className="h-4 w-4 flex-shrink-0" />
          {errorMsg}
        </div>
      )}

      {/* Summary Cards */}
      {summary && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Total ONG-uri</p>
                  <p className="text-2xl font-bold mt-1">{summary.total}</p>
                </div>
                <Users className="h-8 w-8 text-blue-500 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Venit Lunar</p>
                  <p className="text-2xl font-bold mt-1 text-green-600">{summary.revenue.monthly} RON</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-500 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:bg-muted/30" onClick={() => setFilter("active")}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Active</p>
                  <p className="text-2xl font-bold mt-1 text-blue-600">{summary.active}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-blue-500 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:bg-muted/30" onClick={() => setFilter("expiring")}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Expira Curand</p>
                  <p className="text-2xl font-bold mt-1 text-amber-600">{summary.expiring}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-amber-500 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:bg-muted/30" onClick={() => setFilter("expired")}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Expirate</p>
                  <p className="text-2xl font-bold mt-1 text-red-600">{summary.expired}</p>
                </div>
                <XCircle className="h-8 w-8 text-red-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Plan Distribution */}
      {summary && (
        <div className="grid gap-4 md:grid-cols-3">
          {["BASIC", "PRO", "ELITE"].map((plan) => (
            <Card
              key={plan}
              className={`cursor-pointer hover:shadow-md transition-shadow ${planFilter === plan ? "ring-2 ring-blue-500" : ""}`}
              onClick={() => setPlanFilter(planFilter === plan ? "" : plan)}
            >
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <Badge className={`${planColors[plan]} text-sm px-3 py-1`}>{plan}</Badge>
                    <p className="text-3xl font-bold mt-2">{summary.byPlan[plan] || 0}</p>
                    <p className="text-sm text-muted-foreground">ONG-uri</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold text-muted-foreground">{prices[plan]} RON</p>
                    <p className="text-xs text-muted-foreground">/ luna</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-3">
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filtreaza" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toate</SelectItem>
            <SelectItem value="active">Active (non-BASIC)</SelectItem>
            <SelectItem value="expiring">Expira curand</SelectItem>
            <SelectItem value="expired">Expirate</SelectItem>
          </SelectContent>
        </Select>

        {(filter !== "all" || planFilter) && (
          <Button variant="ghost" size="sm" onClick={() => { setFilter("all"); setPlanFilter(""); }}>
            Reseteaza filtrele
          </Button>
        )}
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Abonamente ({ngos.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">Se incarca...</div>
          ) : ngos.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">Niciun rezultat gasit</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50 text-left text-muted-foreground">
                    <th className="p-3 font-medium">ONG</th>
                    <th className="p-3 font-medium">Plan</th>
                    <th className="p-3 font-medium">Status</th>
                    <th className="p-3 font-medium">Expirare</th>
                    <th className="p-3 font-medium">Utilizare</th>
                    <th className="p-3 font-medium">Admin</th>
                    <th className="p-3 font-medium text-right">Actiuni</th>
                  </tr>
                </thead>
                <tbody>
                  {ngos.map((ngo) => {
                    const daysLeft = getDaysLeft(ngo.subscriptionExpiresAt);
                    const isExpiringSoon = daysLeft !== null && daysLeft > 0 && daysLeft <= 7;
                    const isExpired = daysLeft !== null && daysLeft <= 0;
                    const status = ngo.subscriptionStatus || "active";

                    return (
                      <tr key={ngo.id} className={`border-b hover:bg-muted/30 ${isExpiringSoon ? "bg-amber-50/50" : ""} ${isExpired ? "bg-red-50/50" : ""}`}>
                        <td className="p-3">
                          <div>
                            <p className="font-medium">{ngo.name}</p>
                            <p className="text-xs text-muted-foreground">{ngo.category || "Necategorizat"}</p>
                          </div>
                        </td>
                        <td className="p-3">
                          <Badge className={planColors[ngo.subscriptionPlan] || planColors.BASIC}>
                            {ngo.subscriptionPlan}
                          </Badge>
                        </td>
                        <td className="p-3">
                          <Badge className={statusLabels[status]?.color || "bg-gray-100 text-gray-800"}>
                            {statusLabels[status]?.label || status}
                          </Badge>
                        </td>
                        <td className="p-3">
                          {ngo.subscriptionExpiresAt ? (
                            <div>
                              <p className={`text-sm ${isExpiringSoon ? "text-amber-600 font-semibold" : ""} ${isExpired ? "text-red-600 font-semibold" : ""}`}>
                                {new Date(ngo.subscriptionExpiresAt).toLocaleDateString("ro-RO")}
                              </p>
                              {daysLeft !== null && daysLeft > 0 && (
                                <p className={`text-xs ${isExpiringSoon ? "text-amber-500" : "text-muted-foreground"}`}>
                                  {daysLeft} zile ramase
                                </p>
                              )}
                              {isExpired && (
                                <p className="text-xs text-red-500 font-medium">Expirat</p>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-xs">Nelimitat</span>
                          )}
                        </td>
                        <td className="p-3">
                          <div className="text-xs space-y-0.5">
                            <p>{ngo._count.donors} donatori</p>
                            <p>{ngo._count.donations} donatii</p>
                            <p>{ngo._count.campaigns} campanii</p>
                          </div>
                        </td>
                        <td className="p-3">
                          {ngo.users[0] ? (
                            <div>
                              <p className="text-xs font-medium">{ngo.users[0].name}</p>
                              <p className="text-xs text-muted-foreground">{ngo.users[0].email}</p>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">-</span>
                          )}
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openAssignModal(ngo)}
                              className="gap-1 text-xs"
                            >
                              <CreditCard className="h-3 w-3" />
                              Atribuie
                            </Button>
                            {ngo.subscriptionPlan !== "BASIC" && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openRenewModal(ngo)}
                                className="gap-1 text-xs"
                              >
                                <RefreshCw className="h-3 w-3" />
                                Reinnoieste
                              </Button>
                            )}
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

      {/* Assign Plan Modal */}
      {showModal && selectedNgo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-1">Atribuie Abonament</h2>
            <p className="text-sm text-muted-foreground mb-6">{selectedNgo.name}</p>

            <div className="space-y-4">
              {/* Plan Selection */}
              <div>
                <label className="block text-sm font-medium mb-1.5">Plan</label>
                <div className="grid grid-cols-3 gap-2">
                  {["BASIC", "PRO", "ELITE"].map((plan) => (
                    <button
                      key={plan}
                      onClick={() => setModalPlan(plan)}
                      className={`p-3 rounded-lg border-2 text-center transition-all ${
                        modalPlan === plan
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <Badge className={planColors[plan]}>{plan}</Badge>
                      <p className="text-lg font-bold mt-1">{prices[plan]} RON</p>
                      <p className="text-xs text-muted-foreground">/ luna</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Duration */}
              <div>
                <label className="block text-sm font-medium mb-1.5">
                  <Calendar className="h-4 w-4 inline mr-1" />
                  Durata
                </label>
                <Select value={modalDuration} onValueChange={setModalDuration}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 luna</SelectItem>
                    <SelectItem value="3">3 luni</SelectItem>
                    <SelectItem value="6">6 luni</SelectItem>
                    <SelectItem value="12">12 luni (1 an)</SelectItem>
                    <SelectItem value="24">24 luni (2 ani)</SelectItem>
                    <SelectItem value="36">36 luni (3 ani)</SelectItem>
                    <SelectItem value="0">Nelimitat</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium mb-1.5">
                  <FileText className="h-4 w-4 inline mr-1" />
                  Note (optional)
                </label>
                <textarea
                  value={modalNotes}
                  onChange={(e) => setModalNotes(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm min-h-[60px] resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Note despre abonament..."
                />
              </div>

              {/* Send Email */}
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={modalSendEmail}
                  onChange={(e) => setModalSendEmail(e.target.checked)}
                  className="rounded border-gray-300"
                />
                <Send className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Trimite notificare email catre admin-ul ONG</span>
              </label>

              {/* Summary */}
              <div className="bg-blue-50 rounded-lg p-3 text-sm">
                <p className="font-medium text-blue-800">Rezumat:</p>
                <p className="text-blue-700 mt-1">
                  Plan <strong>{modalPlan}</strong> pentru <strong>{selectedNgo.name}</strong>
                  {modalDuration !== "0"
                    ? `, durata ${modalDuration} luni`
                    : ", fara limita de timp"}
                  {modalSendEmail && " + notificare email"}
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <Button variant="outline" onClick={() => setShowModal(false)}>
                Anuleaza
              </Button>
              <Button onClick={handleAssignPlan} disabled={submitting}>
                {submitting ? "Se proceseaza..." : "Atribuie Plan"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Renew Modal */}
      {showRenewModal && selectedNgo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowRenewModal(false)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-1">Reinnoieste Abonament</h2>
            <p className="text-sm text-muted-foreground mb-4">
              {selectedNgo.name} - Plan {selectedNgo.subscriptionPlan}
            </p>

            {selectedNgo.subscriptionExpiresAt && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm mb-4">
                <p className="text-amber-800">
                  Expira: <strong>{new Date(selectedNgo.subscriptionExpiresAt).toLocaleDateString("ro-RO")}</strong>
                </p>
                <p className="text-amber-700 text-xs mt-1">
                  Reinnoirea va extinde de la data expirarii curente.
                </p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-1.5">Durata reinoire</label>
              <Select value={renewDuration} onValueChange={setRenewDuration}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 luna</SelectItem>
                  <SelectItem value="3">3 luni</SelectItem>
                  <SelectItem value="6">6 luni</SelectItem>
                  <SelectItem value="12">12 luni (1 an)</SelectItem>
                  <SelectItem value="24">24 luni (2 ani)</SelectItem>
                  <SelectItem value="36">36 luni (3 ani)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <Button variant="outline" onClick={() => setShowRenewModal(false)}>
                Anuleaza
              </Button>
              <Button onClick={handleRenew} disabled={submitting} className="gap-2">
                <RefreshCw className="h-4 w-4" />
                {submitting ? "Se proceseaza..." : "Reinnoieste"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Bell, Activity, Users, DollarSign, Building2, ShieldCheck,
  RefreshCw, Loader2, Clock, UserPlus, CreditCard, Mail,
  AlertTriangle, CheckCircle2, FileText, MessageSquare,
} from "lucide-react";

interface ActivityItem {
  id: string;
  action: string;
  entityType: string | null;
  entityId: string | null;
  details: any;
  ipAddress: string | null;
  createdAt: string;
  user: { name: string | null; email: string } | null;
  ngo: { name: string; slug: string } | null;
}

interface Summary {
  actionsToday: number;
  newUsersToday: number;
  donationsToday: number;
  donationAmountToday: number;
  newNgosWeek: number;
  pendingVerifications: number;
}

const actionIcons: Record<string, any> = {
  USER_REGISTERED: UserPlus,
  SUBSCRIPTION_ASSIGNED: CreditCard,
  SUBSCRIPTION_EXPIRED: AlertTriangle,
  SUBSCRIPTION_RENEWED: CheckCircle2,
  CAMPAIGN_SENT: Mail,
  VOLUNTEER_REQUEST: Users,
  DONATION_RECEIVED: DollarSign,
  VERIFICATION_APPROVED: ShieldCheck,
  VERIFICATION_REJECTED: AlertTriangle,
  NGO_CREATED: Building2,
};

const actionColors: Record<string, string> = {
  USER_REGISTERED: "bg-blue-100 text-blue-700",
  SUBSCRIPTION_ASSIGNED: "bg-purple-100 text-purple-700",
  SUBSCRIPTION_EXPIRED: "bg-red-100 text-red-700",
  SUBSCRIPTION_RENEWED: "bg-green-100 text-green-700",
  CAMPAIGN_SENT: "bg-indigo-100 text-indigo-700",
  VOLUNTEER_REQUEST: "bg-amber-100 text-amber-700",
  DONATION_RECEIVED: "bg-emerald-100 text-emerald-700",
  VERIFICATION_APPROVED: "bg-green-100 text-green-700",
  VERIFICATION_REJECTED: "bg-red-100 text-red-700",
  NGO_CREATED: "bg-blue-100 text-blue-700",
};

const actionLabels: Record<string, string> = {
  USER_REGISTERED: "Utilizator Nou",
  SUBSCRIPTION_ASSIGNED: "Abonament Atribuit",
  SUBSCRIPTION_EXPIRED: "Abonament Expirat",
  SUBSCRIPTION_RENEWED: "Abonament Reinnoit",
  CAMPAIGN_SENT: "Campanie Trimisa",
  VOLUNTEER_REQUEST: "Cerere Voluntariat",
  DONATION_RECEIVED: "Donatie Primita",
  DONOR_CREATED: "Donator Nou",
  DONOR_UPDATED: "Donator Actualizat",
  DONOR_IMPORTED: "Donatori Importati",
  CAMPAIGN_CREATED: "Campanie Creata",
  MINISITE_UPDATED: "Mini-site Actualizat",
  SETTINGS_UPDATED: "Setari Actualizate",
  VERIFICATION_SUBMITTED: "Verificare Trimisa",
};

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return "acum";
  if (seconds < 3600) return `acum ${Math.floor(seconds / 60)} min`;
  if (seconds < 86400) return `acum ${Math.floor(seconds / 3600)} ore`;
  if (seconds < 604800) return `acum ${Math.floor(seconds / 86400)} zile`;
  return date.toLocaleDateString("ro-RO");
}

export default function AdminNotificationsPage() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await fetch("/api/admin/notifications?limit=50");
      if (!res.ok) throw new Error("Eroare");
      const data = await res.json();
      setActivities(data.activities || []);
      setSummary(data.summary || null);
    } catch {
      console.error("Failed to load notifications");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const filteredActivities = filter === "all"
    ? activities
    : activities.filter((a) => a.action === filter);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Bell className="h-7 w-7 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold">Centru de Notificari</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Activitate platforma in timp real - alerte si evenimente
            </p>
          </div>
        </div>
        <Button onClick={handleRefresh} disabled={refreshing} variant="outline" size="sm">
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
          Actualizeaza
        </Button>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <Activity className="h-5 w-5 mx-auto text-blue-600 mb-1" />
              <p className="text-2xl font-bold">{summary.actionsToday}</p>
              <p className="text-xs text-muted-foreground">Actiuni azi</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <UserPlus className="h-5 w-5 mx-auto text-green-600 mb-1" />
              <p className="text-2xl font-bold">{summary.newUsersToday}</p>
              <p className="text-xs text-muted-foreground">Useri noi azi</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <DollarSign className="h-5 w-5 mx-auto text-emerald-600 mb-1" />
              <p className="text-2xl font-bold">{summary.donationsToday}</p>
              <p className="text-xs text-muted-foreground">Donatii azi</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <DollarSign className="h-5 w-5 mx-auto text-purple-600 mb-1" />
              <p className="text-2xl font-bold">{summary.donationAmountToday.toLocaleString("ro-RO")} RON</p>
              <p className="text-xs text-muted-foreground">Suma donatii azi</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Building2 className="h-5 w-5 mx-auto text-orange-600 mb-1" />
              <p className="text-2xl font-bold">{summary.newNgosWeek}</p>
              <p className="text-xs text-muted-foreground">ONG noi (7 zile)</p>
            </CardContent>
          </Card>
          <Card className={summary.pendingVerifications > 0 ? "border-amber-300 bg-amber-50" : ""}>
            <CardContent className="p-4 text-center">
              <ShieldCheck className={`h-5 w-5 mx-auto mb-1 ${summary.pendingVerifications > 0 ? "text-amber-600" : "text-slate-400"}`} />
              <p className="text-2xl font-bold">{summary.pendingVerifications}</p>
              <p className="text-xs text-muted-foreground">Verificari in asteptare</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filter */}
      <div className="flex flex-wrap gap-2">
        {[
          { id: "all", label: "Toate" },
          { id: "USER_REGISTERED", label: "Utilizatori" },
          { id: "SUBSCRIPTION_ASSIGNED", label: "Abonamente" },
          { id: "VOLUNTEER_REQUEST", label: "Voluntari" },
          { id: "CAMPAIGN_SENT", label: "Campanii" },
        ].map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
              filter === f.id
                ? "bg-blue-100 border-blue-300 text-blue-700"
                : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Activity Feed */}
      <Card>
        <CardContent className="p-0">
          {filteredActivities.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Bell className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>Nicio activitate recenta</p>
            </div>
          ) : (
            <div className="divide-y">
              {filteredActivities.map((activity) => {
                const IconComponent = actionIcons[activity.action] || Activity;
                const colorClass = actionColors[activity.action] || "bg-slate-100 text-slate-700";
                const label = actionLabels[activity.action] || activity.action;

                return (
                  <div key={activity.id} className="flex items-start gap-4 p-4 hover:bg-slate-50 transition-colors">
                    <div className={`p-2 rounded-lg flex-shrink-0 ${colorClass}`}>
                      <IconComponent className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className="text-[10px]">
                          {label}
                        </Badge>
                        {activity.ngo && (
                          <span className="text-sm font-medium text-blue-600">
                            {activity.ngo.name}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-600 mt-1">
                        {formatActivityMessage(activity)}
                      </p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {timeAgo(activity.createdAt)}
                        </span>
                        {activity.user && (
                          <span className="text-xs text-muted-foreground">
                            de {activity.user.name || activity.user.email}
                          </span>
                        )}
                        {activity.ipAddress && (
                          <span className="text-xs text-slate-400">
                            IP: {activity.ipAddress}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function formatActivityMessage(activity: ActivityItem): string {
  const d = activity.details as any;
  if (!d) return activity.action;

  switch (activity.action) {
    case "USER_REGISTERED":
      return `Utilizator nou inregistrat: ${d.email || ""}${d.ngoName ? ` (ONG: ${d.ngoName})` : ""}`;
    case "SUBSCRIPTION_ASSIGNED":
      return `Plan ${d.newPlan} atribuit${d.previousPlan ? ` (anterior: ${d.previousPlan})` : ""}. Durata: ${d.durationMonths === "nelimitat" ? "nelimitata" : `${d.durationMonths} luni`}`;
    case "SUBSCRIPTION_EXPIRED":
      return `Plan ${d.previousPlan} expirat - retrogradat automat la BASIC`;
    case "SUBSCRIPTION_RENEWED":
      return `Plan ${d.plan} reinnoit pentru ${d.durationMonths} luni`;
    case "CAMPAIGN_SENT":
      return `Campanie trimisa: ${d.campaignName || ""} - ${d.recipientCount || 0} destinatari`;
    case "VOLUNTEER_REQUEST":
      return `${d.name || "Anonim"} (${d.email || ""}) s-a inscris ca voluntar`;
    case "DONOR_CREATED":
      return `Donator nou adaugat: ${d.name || d.email || "Anonim"}`;
    case "DONOR_IMPORTED":
      return `${d.count || 0} donatori importati`;
    default:
      if (typeof d === "object") {
        const entries = Object.entries(d).slice(0, 3);
        return entries.map(([k, v]) => `${k}: ${v}`).join(", ");
      }
      return String(d);
  }
}

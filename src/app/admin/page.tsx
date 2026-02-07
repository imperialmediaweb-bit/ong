"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Building2, Users, ShieldCheck, Heart, Banknote, Mail, ArrowRight,
} from "lucide-react";

interface AdminStats {
  totalNgos: number;
  activeUsers: number;
  pendingVerifications: number;
  totalDonors: number;
  totalDonations: number;
  campaignsSent: number;
  planDistribution: { BASIC: number; PRO: number; ELITE: number };
  recentNgos: Array<{
    id: string;
    name: string;
    plan: string;
    status: string;
    createdAt: string;
  }>;
  recentVerifications: Array<{
    id: string;
    ngoName: string;
    status: string;
    createdAt: string;
  }>;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/stats");
      const data = await res.json();
      setStats(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("ro-RO", {
      style: "currency",
      currency: "RON",
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Panou principal</h1>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="h-20 animate-pulse bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: "Total ONG-uri",
      value: stats?.totalNgos ?? 0,
      icon: Building2,
      color: "text-blue-600",
      bg: "bg-blue-50",
      link: "/admin/ngos",
    },
    {
      title: "Utilizatori activi",
      value: stats?.activeUsers ?? 0,
      icon: Users,
      color: "text-green-600",
      bg: "bg-green-50",
    },
    {
      title: "Verificari in asteptare",
      value: stats?.pendingVerifications ?? 0,
      icon: ShieldCheck,
      color: (stats?.pendingVerifications ?? 0) > 0 ? "text-orange-600" : "text-slate-600",
      bg: (stats?.pendingVerifications ?? 0) > 0 ? "bg-orange-50" : "bg-slate-50",
      highlight: (stats?.pendingVerifications ?? 0) > 0,
    },
    {
      title: "Total donatori",
      value: stats?.totalDonors ?? 0,
      icon: Heart,
      color: "text-pink-600",
      bg: "bg-pink-50",
    },
    {
      title: "Total donatii",
      value: formatCurrency(stats?.totalDonations ?? 0),
      icon: Banknote,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      title: "Campanii trimise",
      value: stats?.campaignsSent ?? 0,
      icon: Mail,
      color: "text-purple-600",
      bg: "bg-purple-50",
    },
  ];

  const planColors: Record<string, string> = {
    BASIC: "bg-slate-100 text-slate-800",
    PRO: "bg-blue-100 text-blue-800",
    ELITE: "bg-purple-100 text-purple-800",
  };

  const statusColors: Record<string, string> = {
    PENDING: "bg-yellow-100 text-yellow-800",
    APPROVED: "bg-green-100 text-green-800",
    REJECTED: "bg-red-100 text-red-800",
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Panou principal</h1>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {statCards.map((card) => (
          <Card
            key={card.title}
            className={card.highlight ? "border-orange-300 shadow-orange-100" : ""}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{card.title}</p>
                  <p className="text-2xl font-bold mt-1">{card.value}</p>
                </div>
                <div className={`p-3 rounded-full ${card.bg}`}>
                  <card.icon className={`h-5 w-5 ${card.color}`} />
                </div>
              </div>
              {card.link && (
                <Link
                  href={card.link}
                  className="text-xs text-blue-600 hover:underline mt-2 inline-flex items-center gap-1"
                >
                  Vezi detalii <ArrowRight className="h-3 w-3" />
                </Link>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Plan Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Distributie planuri</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Badge className={planColors.BASIC}>BASIC</Badge>
              <span className="text-lg font-semibold">{stats?.planDistribution?.BASIC ?? 0}</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={planColors.PRO}>PRO</Badge>
              <span className="text-lg font-semibold">{stats?.planDistribution?.PRO ?? 0}</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={planColors.ELITE}>ELITE</Badge>
              <span className="text-lg font-semibold">{stats?.planDistribution?.ELITE ?? 0}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent NGOs */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Ultimele ONG-uri inregistrate</CardTitle>
            <Link href="/admin/ngos" className="text-sm text-blue-600 hover:underline">
              Vezi toate
            </Link>
          </CardHeader>
          <CardContent>
            {stats?.recentNgos && stats.recentNgos.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="pb-2 font-medium">Nume</th>
                      <th className="pb-2 font-medium">Plan</th>
                      <th className="pb-2 font-medium">Status</th>
                      <th className="pb-2 font-medium">Data</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.recentNgos.map((ngo) => (
                      <tr key={ngo.id} className="border-b last:border-0">
                        <td className="py-2 font-medium">{ngo.name}</td>
                        <td className="py-2">
                          <Badge className={planColors[ngo.plan] || planColors.BASIC}>
                            {ngo.plan}
                          </Badge>
                        </td>
                        <td className="py-2">
                          <Badge variant={ngo.status === "active" ? "success" : "secondary"}>
                            {ngo.status === "active" ? "Activ" : "Inactiv"}
                          </Badge>
                        </td>
                        <td className="py-2 text-muted-foreground">
                          {new Date(ngo.createdAt).toLocaleDateString("ro-RO")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Niciun ONG inregistrat</p>
            )}
          </CardContent>
        </Card>

        {/* Recent Verifications */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Verificari recente</CardTitle>
            <Link href="/admin/verifications" className="text-sm text-blue-600 hover:underline">
              Vezi toate
            </Link>
          </CardHeader>
          <CardContent>
            {stats?.recentVerifications && stats.recentVerifications.length > 0 ? (
              <div className="space-y-3">
                {stats.recentVerifications.map((v) => (
                  <div key={v.id} className="flex items-center justify-between border-b pb-3 last:border-0">
                    <div>
                      <p className="font-medium text-sm">{v.ngoName}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(v.createdAt).toLocaleDateString("ro-RO")}
                      </p>
                    </div>
                    <Badge className={statusColors[v.status] || statusColors.PENDING}>
                      {v.status === "PENDING" && "In asteptare"}
                      {v.status === "APPROVED" && "Aprobat"}
                      {v.status === "REJECTED" && "Respins"}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Nicio verificare recenta</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

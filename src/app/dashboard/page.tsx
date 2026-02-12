import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate, percentage, getInitials } from "@/lib/utils";
import {
  Users, Mail, Heart, TrendingUp, ArrowRight, Plus, Send, Zap,
  BarChart3, Globe, Sparkles, Target, Building2, ShieldCheck,
  CreditCard, Settings, FileText, UserPlus, Bell, Activity,
  CheckCircle2, Clock, AlertCircle,
} from "lucide-react";
import Link from "next/link";
import prisma from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

async function getPlatformData() {
  try {
    const [
      totalNgos,
      activeNgos,
      totalUsers,
      pendingVerifications,
      platformDonations,
      recentNgos,
      planDistribution,
    ] = await Promise.all([
      prisma.ngo.count(),
      prisma.ngo.count({ where: { isActive: true } }),
      prisma.user.count(),
      prisma.ngo.count({ where: { verification: { status: "PENDING" } } }),
      prisma.donation.aggregate({
        _sum: { amount: true },
        _count: true,
      }),
      prisma.ngo.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          name: true,
          slug: true,
          subscriptionPlan: true,
          isActive: true,
          verification: true,
          createdAt: true,
          _count: { select: { donors: true, donations: true } },
        },
      }),
      prisma.ngo.groupBy({
        by: ["subscriptionPlan"],
        _count: true,
      }),
    ]);

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [monthlyDonations, recentUsers] = await Promise.all([
      prisma.donation.aggregate({
        where: { createdAt: { gte: thirtyDaysAgo }, status: "COMPLETED" },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.user.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isActive: true,
          lastLoginAt: true,
          createdAt: true,
          ngo: { select: { name: true } },
        },
      }),
    ]);

    const plans: Record<string, number> = {};
    planDistribution.forEach((p: any) => {
      plans[p.subscriptionPlan] = p._count;
    });

    return {
      totalNgos,
      activeNgos,
      totalUsers,
      pendingVerifications,
      totalDonations: platformDonations._count,
      totalRevenue: platformDonations._sum.amount || 0,
      monthlyRevenue: monthlyDonations._sum.amount || 0,
      monthlyDonationCount: monthlyDonations._count,
      recentNgos,
      recentUsers,
      plans,
    };
  } catch (error) {
    console.error("Platform data error:", error);
    return null;
  }
}

async function getNgoDashboardData(ngoId: string, userName: string) {
  try {
    const [
      donorCount,
      activeCampaignCount,
      donationStats,
      recentDonations,
      topCampaigns,
      ngo,
    ] = await Promise.all([
      prisma.donor.count({ where: { ngoId, status: "ACTIVE" } }),
      prisma.campaign.count({ where: { ngoId, status: { in: ["SENDING", "SENT", "SCHEDULED"] } } }),
      prisma.donation.aggregate({
        where: { ngoId },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.donation.findMany({
        where: { ngoId },
        include: { donor: { select: { name: true, email: true } }, campaign: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
        take: 8,
      }),
      prisma.campaign.findMany({
        where: { ngoId, status: { in: ["SENT", "SENDING"] } },
        orderBy: { totalOpened: "desc" },
        take: 5,
      }),
      prisma.ngo.findUnique({
        where: { id: ngoId },
        select: { name: true, slug: true },
      }),
    ]);

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const monthlyRevenue = await prisma.donation.aggregate({
      where: { ngoId, createdAt: { gte: thirtyDaysAgo }, status: "COMPLETED" },
      _sum: { amount: true },
    });

    return {
      userName,
      ngoName: ngo?.name || "",
      ngoSlug: ngo?.slug || "",
      stats: {
        totalDonors: donorCount,
        activeCampaigns: activeCampaignCount,
        totalDonations: donationStats._count,
        totalRevenue: donationStats._sum.amount || 0,
        monthlyRevenue: monthlyRevenue._sum.amount || 0,
      },
      recentDonations,
      topCampaigns,
    };
  } catch (error) {
    console.error("NGO Dashboard data error:", error);
    return {
      userName,
      ngoName: "",
      ngoSlug: "",
      stats: { totalDonors: 0, activeCampaigns: 0, totalDonations: 0, totalRevenue: 0, monthlyRevenue: 0 },
      recentDonations: [],
      topCampaigns: [],
    };
  }
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <CardTitle>Bine ati venit la Binevo</CardTitle>
            <CardDescription>Va rugam sa va autentificati pentru a accesa panoul principal.</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Link href="/login">
              <Button>Autentificare</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const user = session.user as any;
  const isSuperAdmin = user.role === "SUPER_ADMIN";
  const ngoId = user.ngoId;
  const userName = user.name || user.email || "";

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Buna dimineata";
    if (h < 18) return "Buna ziua";
    return "Buna seara";
  })();

  // SUPER_ADMIN: platform dashboard + NGO data
  if (isSuperAdmin) {
    const [platformData, ngoData] = await Promise.all([
      getPlatformData(),
      ngoId ? getNgoDashboardData(ngoId, userName) : null,
    ]);

    const platform = platformData || {
      totalNgos: 0, activeNgos: 0, totalUsers: 0, pendingVerifications: 0,
      totalDonations: 0, totalRevenue: 0, monthlyRevenue: 0, monthlyDonationCount: 0,
      recentNgos: [], recentUsers: [], plans: {},
    };

    const platformStats = [
      {
        title: "ONG-uri pe platforma",
        value: platform.totalNgos.toString(),
        description: `${platform.activeNgos} active`,
        icon: Building2,
        gradient: "from-blue-500 to-blue-600",
        lightBg: "bg-blue-50",
        lightText: "text-blue-700",
        href: "/admin/ngos",
      },
      {
        title: "Utilizatori totali",
        value: platform.totalUsers.toString(),
        description: "Pe toata platforma",
        icon: Users,
        gradient: "from-violet-500 to-purple-600",
        lightBg: "bg-violet-50",
        lightText: "text-violet-700",
        href: "/admin/users",
      },
      {
        title: "Verificari in asteptare",
        value: platform.pendingVerifications.toString(),
        description: platform.pendingVerifications > 0 ? "Necesita atentie!" : "Totul la zi",
        icon: ShieldCheck,
        gradient: platform.pendingVerifications > 0 ? "from-amber-500 to-orange-600" : "from-emerald-500 to-green-600",
        lightBg: platform.pendingVerifications > 0 ? "bg-amber-50" : "bg-emerald-50",
        lightText: platform.pendingVerifications > 0 ? "text-amber-700" : "text-emerald-700",
        href: "/admin/verifications",
      },
      {
        title: "Venituri platforma",
        value: formatCurrency(platform.totalRevenue),
        description: `${formatCurrency(platform.monthlyRevenue)} luna aceasta`,
        icon: TrendingUp,
        gradient: "from-emerald-500 to-green-600",
        lightBg: "bg-emerald-50",
        lightText: "text-emerald-700",
        href: "/admin/subscriptions",
      },
    ];

    const adminActions = [
      { title: "Gestionare ONG-uri", desc: "Vezi si administreaza", icon: Building2, href: "/admin/ngos", gradient: "from-blue-500 to-cyan-500" },
      { title: "Utilizatori", desc: "Gestioneaza conturile", icon: Users, href: "/admin/users", gradient: "from-violet-500 to-purple-500" },
      { title: "Verificari", desc: "Aproba sau respinge", icon: ShieldCheck, href: "/admin/verifications", gradient: "from-amber-500 to-orange-500" },
      { title: "Abonamente", desc: "Planuri si facturare", icon: CreditCard, href: "/admin/subscriptions", gradient: "from-emerald-500 to-teal-500" },
      { title: "Blog", desc: "Gestioneaza articole", icon: FileText, href: "/admin/blog", gradient: "from-pink-500 to-rose-500" },
      { title: "Setari platforma", desc: "Configurare generala", icon: Settings, href: "/admin", gradient: "from-slate-500 to-slate-600" },
    ];

    const planColors: Record<string, string> = {
      BASIC: "bg-slate-100 text-slate-700",
      PRO: "bg-blue-100 text-blue-700",
      ELITE: "bg-purple-100 text-purple-700",
    };

    const verificationColors: Record<string, string> = {
      APPROVED: "text-emerald-600",
      PENDING: "text-amber-600",
      REJECTED: "text-red-600",
    };

    return (
      <div className="space-y-6 sm:space-y-8">
        {/* Hero Welcome Banner - Super Admin */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800 p-6 sm:p-8 text-white">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iYSIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVHJhbnNmb3JtPSJyb3RhdGUoNDUpIj48Y2lyY2xlIGN4PSIyMCIgY3k9IjIwIiByPSIxIiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDUpIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCBmaWxsPSJ1cmwoI2EpIiB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIvPjwvc3ZnPg==')] opacity-50" />
          <div className="relative z-10">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Badge className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs">
                    <ShieldCheck className="h-3 w-3 mr-1" />
                    SUPER ADMIN
                  </Badge>
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                  {greeting}, {userName.split(" ")[0] || "Admin"}!
                </h1>
                <p className="mt-1 text-white/70 text-sm sm:text-base">
                  Panou de administrare platforma Binevo
                </p>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <Link href="/admin">
                  <Button className="bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 text-white shadow-lg">
                    <Settings className="mr-2 h-4 w-4" />
                    Admin Panel
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Platform Stats */}
        <div>
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Activity className="h-5 w-5 text-slate-500" />
            Statistici platforma
          </h2>
          <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
            {platformStats.map((stat) => (
              <Link key={stat.title} href={stat.href}>
                <Card className="group relative overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer border-0 shadow-sm h-full">
                  <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 sm:p-6 sm:pb-2">
                    <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
                      {stat.title}
                    </CardTitle>
                    <div className={`${stat.lightBg} ${stat.lightText} p-2 sm:p-2.5 rounded-xl`}>
                      <stat.icon className="h-4 w-4 sm:h-5 sm:w-5" />
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
                    <div className="text-xl sm:text-2xl font-bold tracking-tight">{stat.value}</div>
                    <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">{stat.description}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        {/* Admin Quick Actions */}
        <div>
          <h2 className="text-lg font-semibold mb-3">Actiuni admin</h2>
          <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
            {adminActions.map((action) => (
              <Link key={action.title} href={action.href}>
                <div className="group relative flex flex-col items-center text-center p-4 rounded-xl border bg-card hover:shadow-md transition-all duration-300 cursor-pointer h-full">
                  <div className={`bg-gradient-to-br ${action.gradient} p-3 rounded-xl text-white mb-3 shadow-sm group-hover:scale-110 transition-transform duration-300`}>
                    <action.icon className="h-5 w-5" />
                  </div>
                  <p className="text-sm font-medium leading-tight">{action.title}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5 hidden sm:block">{action.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Plan Distribution + Donatii platforma */}
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
          {(["BASIC", "PRO", "ELITE"] as const).map((plan) => (
            <Card key={plan} className="border-0 shadow-sm">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Plan {plan}</p>
                    <p className="text-2xl font-bold mt-1">{platform.plans[plan] || 0}</p>
                    <p className="text-xs text-muted-foreground">
                      {platform.totalNgos > 0
                        ? `${(((platform.plans[plan] || 0) / platform.totalNgos) * 100).toFixed(0)}% din total`
                        : "0% din total"}
                    </p>
                  </div>
                  <Badge className={`${planColors[plan]} text-xs`}>{plan}</Badge>
                </div>
                <div className="w-full bg-secondary rounded-full h-2 mt-3 overflow-hidden">
                  <div
                    className={`h-2 rounded-full transition-all duration-500 ${
                      plan === "BASIC" ? "bg-slate-400" : plan === "PRO" ? "bg-blue-500" : "bg-purple-500"
                    }`}
                    style={{
                      width: `${platform.totalNgos > 0 ? ((platform.plans[plan] || 0) / platform.totalNgos) * 100 : 0}%`,
                    }}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-7">
          {/* Recent NGOs */}
          <Card className="lg:col-span-4 border-0 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <div className="flex items-center gap-3">
                <div className="bg-blue-50 text-blue-600 p-2 rounded-xl">
                  <Building2 className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-base sm:text-lg">ONG-uri recente</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">Ultimele organizatii inregistrate</CardDescription>
                </div>
              </div>
              <Link href="/admin/ngos">
                <Button variant="ghost" size="sm" className="text-xs">
                  Vezi toate
                  <ArrowRight className="ml-1 h-3 w-3" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {platform.recentNgos.length === 0 ? (
                <div className="text-center py-10">
                  <Building2 className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">Nicio organizatie inregistrata inca.</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {platform.recentNgos.map((ngo: any) => (
                    <Link key={ngo.id} href={`/admin/ngos/${ngo.id}`} className="block">
                      <div className="flex items-center justify-between py-3 px-3 -mx-3 rounded-lg hover:bg-accent/50 transition-colors">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 text-white text-xs sm:text-sm font-medium flex-shrink-0">
                            {getInitials(ngo.name)}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{ngo.name}</p>
                            <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
                              {ngo._count.donors} donatori &middot; {ngo._count.donations} donatii &middot; {formatDate(ngo.createdAt)}
                            </p>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0 ml-2 flex items-center gap-2">
                          <Badge className={`${planColors[ngo.subscriptionPlan] || "bg-slate-100 text-slate-700"} text-[10px]`}>
                            {ngo.subscriptionPlan}
                          </Badge>
                          {ngo.verification === "APPROVED" ? (
                            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                          ) : ngo.verification === "PENDING" ? (
                            <Clock className="h-4 w-4 text-amber-500" />
                          ) : (
                            <AlertCircle className="h-4 w-4 text-red-500" />
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Users */}
          <Card className="lg:col-span-3 border-0 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <div className="flex items-center gap-3">
                <div className="bg-violet-50 text-violet-600 p-2 rounded-xl">
                  <UserPlus className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-base sm:text-lg">Utilizatori recenti</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">Ultimele conturi create</CardDescription>
                </div>
              </div>
              <Link href="/admin/users">
                <Button variant="ghost" size="sm" className="text-xs">
                  Vezi toti
                  <ArrowRight className="ml-1 h-3 w-3" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {platform.recentUsers.length === 0 ? (
                <div className="text-center py-10">
                  <Users className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">Niciun utilizator inca.</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {platform.recentUsers.map((u: any) => (
                    <div key={u.id} className="flex items-center justify-between py-3 px-3 -mx-3 rounded-lg hover:bg-accent/50 transition-colors">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-violet-400 to-purple-500 text-white text-xs font-medium flex-shrink-0">
                          {u.name ? getInitials(u.name) : "?"}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{u.name || u.email}</p>
                          <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
                            {u.ngo?.name || "Fara ONG"} &middot; {formatDate(u.createdAt)}
                          </p>
                        </div>
                      </div>
                      <Badge variant={u.isActive ? "success" : "destructive"} className="text-[10px] flex-shrink-0">
                        {u.role}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* NGO Section for Super Admin */}
        {ngoData && (
          <>
            <div className="border-t pt-6">
              <h2 className="text-lg font-semibold mb-1 flex items-center gap-2">
                <Heart className="h-5 w-5 text-rose-500" />
                Organizatia: {ngoData.ngoName}
              </h2>
              <p className="text-sm text-muted-foreground mb-4">Date specifice organizatiei tale active</p>
            </div>
            <NgoStatsSection data={ngoData} />
          </>
        )}
      </div>
    );
  }

  // NGO Admin / Staff / Viewer dashboard
  if (!ngoId) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <CardTitle>Nicio organizatie asociata</CardTitle>
            <CardDescription>Contul tau nu este asociat cu nicio organizatie. Contacteaza administratorul platformei.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const ngoData = await getNgoDashboardData(ngoId, userName);

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Hero Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 p-6 sm:p-8 text-white">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iYSIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVHJhbnNmb3JtPSJyb3RhdGUoNDUpIj48Y2lyY2xlIGN4PSIyMCIgY3k9IjIwIiByPSIxIiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDUpIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCBmaWxsPSJ1cmwoI2EpIiB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIvPjwvc3ZnPg==')] opacity-50" />
        <div className="relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                {greeting}, {userName.split(" ")[0] || "Admin"}!
              </h1>
              <p className="mt-1 text-white/80 text-sm sm:text-base">
                {ngoData.ngoName ? `Panoul de control ${ngoData.ngoName}` : "Iata o prezentare generala a organizatiei tale."}
              </p>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <Link href="/dashboard/campaigns/new">
                <Button className="bg-white/20 backdrop-blur-sm border border-white/30 hover:bg-white/30 text-white shadow-lg">
                  <Plus className="mr-2 h-4 w-4" />
                  Campanie noua
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <NgoStatsSection data={ngoData} />
    </div>
  );
}

// Shared NGO stats component used by both SUPER_ADMIN and NGO_ADMIN
function NgoStatsSection({ data }: { data: any }) {
  const { stats, recentDonations, topCampaigns, ngoSlug } = data;

  const statCards = [
    {
      title: "Total Donatori",
      value: stats.totalDonors.toLocaleString(),
      description: "Donatori activi in CRM",
      icon: Users,
      gradient: "from-blue-500 to-blue-600",
      lightBg: "bg-blue-50",
      lightText: "text-blue-700",
      href: "/dashboard/donors",
    },
    {
      title: "Campanii Active",
      value: stats.activeCampaigns.toString(),
      description: "In desfasurare sau programate",
      icon: Mail,
      gradient: "from-violet-500 to-purple-600",
      lightBg: "bg-violet-50",
      lightText: "text-violet-700",
      href: "/dashboard/campaigns",
    },
    {
      title: "Total Donatii",
      value: stats.totalDonations.toLocaleString(),
      description: "Toate donatiile primite",
      icon: Heart,
      gradient: "from-rose-500 to-pink-600",
      lightBg: "bg-rose-50",
      lightText: "text-rose-700",
      href: "/dashboard/donations",
    },
    {
      title: "Venituri Totale",
      value: formatCurrency(stats.totalRevenue),
      description: `${formatCurrency(stats.monthlyRevenue)} luna aceasta`,
      icon: TrendingUp,
      gradient: "from-emerald-500 to-green-600",
      lightBg: "bg-emerald-50",
      lightText: "text-emerald-700",
      href: "/dashboard/analytics",
    },
  ];

  const quickActions = [
    { title: "Adauga donator", desc: "Inregistreaza un donator nou", icon: Users, href: "/dashboard/donors?action=add", gradient: "from-blue-500 to-cyan-500" },
    { title: "Creeaza campanie", desc: "Campanie email sau SMS", icon: Send, href: "/dashboard/campaigns/new", gradient: "from-violet-500 to-purple-500" },
    { title: "Automatizare noua", desc: "Automatizeaza fluxurile", icon: Zap, href: "/dashboard/automations/new", gradient: "from-amber-500 to-orange-500" },
    { title: "Agent AI Marketing", desc: "Sfaturi si strategii AI", icon: Sparkles, href: "/dashboard/social-ai", gradient: "from-pink-500 to-rose-500" },
    { title: "Analitica", desc: "Performanta detaliata", icon: BarChart3, href: "/dashboard/analytics", gradient: "from-emerald-500 to-teal-500" },
    { title: "Mini-Site", desc: "Pagina ta publica", icon: Globe, href: ngoSlug ? `/s/${ngoSlug}` : "/dashboard/minisite", gradient: "from-indigo-500 to-blue-500" },
  ];

  return (
    <>
      {/* Stats Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Link key={stat.title} href={stat.href}>
            <Card className="group relative overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer border-0 shadow-sm h-full">
              <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 sm:p-6 sm:pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <div className={`${stat.lightBg} ${stat.lightText} p-2 sm:p-2.5 rounded-xl`}>
                  <stat.icon className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
                <div className="text-xl sm:text-2xl font-bold tracking-tight">{stat.value}</div>
                <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">{stat.description}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Quick Actions Grid */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Actiuni rapide</h2>
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
          {quickActions.map((action) => (
            <Link key={action.title} href={action.href}>
              <div className="group relative flex flex-col items-center text-center p-4 rounded-xl border bg-card hover:shadow-md transition-all duration-300 cursor-pointer h-full">
                <div className={`bg-gradient-to-br ${action.gradient} p-3 rounded-xl text-white mb-3 shadow-sm group-hover:scale-110 transition-transform duration-300`}>
                  <action.icon className="h-5 w-5" />
                </div>
                <p className="text-sm font-medium leading-tight">{action.title}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5 hidden sm:block">{action.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-7">
        {/* Recent Donations */}
        <Card className="lg:col-span-4 border-0 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <div className="flex items-center gap-3">
              <div className="bg-emerald-50 text-emerald-600 p-2 rounded-xl">
                <Heart className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-base sm:text-lg">Donatii recente</CardTitle>
                <CardDescription className="text-xs sm:text-sm">Ultimele donatii primite</CardDescription>
              </div>
            </div>
            <Link href="/dashboard/donations">
              <Button variant="ghost" size="sm" className="text-xs">
                Vezi toate
                <ArrowRight className="ml-1 h-3 w-3" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {recentDonations.length === 0 ? (
              <div className="text-center py-10">
                <Heart className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">
                  Nicio donatie inca. Porniti o campanie pentru a primi donatii.
                </p>
                <Link href="/dashboard/campaigns/new">
                  <Button variant="outline" size="sm" className="mt-3">
                    <Plus className="mr-1 h-3 w-3" /> Creeaza campanie
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-1">
                {recentDonations.map((donation: any) => (
                  <div
                    key={donation.id}
                    className="flex items-center justify-between py-3 px-3 -mx-3 rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 text-white text-xs sm:text-sm font-medium flex-shrink-0">
                        {donation.donor?.name ? getInitials(donation.donor.name) : "AN"}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{donation.donor?.name || "Anonim"}</p>
                        <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
                          {donation.campaign?.name || "Donatie directa"} &middot; {formatDate(donation.createdAt)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 ml-2">
                      <p className="text-sm font-semibold text-emerald-600">
                        +{formatCurrency(donation.amount, donation.currency)}
                      </p>
                      <Badge
                        variant={
                          donation.status === "COMPLETED" ? "success" : donation.status === "PENDING" ? "warning" : "destructive"
                        }
                        className="text-[10px]"
                      >
                        {donation.status === "COMPLETED" ? "Finalizat" : donation.status === "PENDING" ? "In asteptare" : donation.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Campaigns */}
        <Card className="lg:col-span-3 border-0 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <div className="flex items-center gap-3">
              <div className="bg-violet-50 text-violet-600 p-2 rounded-xl">
                <Target className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-base sm:text-lg">Top campanii</CardTitle>
                <CardDescription className="text-xs sm:text-sm">Cele mai bune rezultate</CardDescription>
              </div>
            </div>
            <Link href="/dashboard/campaigns">
              <Button variant="ghost" size="sm" className="text-xs">
                Vezi toate
                <ArrowRight className="ml-1 h-3 w-3" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {topCampaigns.length === 0 ? (
              <div className="text-center py-10">
                <Mail className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">Nicio campanie trimisa inca.</p>
                <Link href="/dashboard/campaigns/new">
                  <Button variant="outline" size="sm" className="mt-3">
                    <Plus className="mr-1 h-3 w-3" /> Prima campanie
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {topCampaigns.map((campaign: any, idx: number) => (
                  <Link key={campaign.id} href={`/dashboard/campaigns/${campaign.id}`} className="block">
                    <div className="group space-y-2 rounded-xl p-3 -mx-3 hover:bg-accent/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-400 to-purple-500 text-white text-xs font-bold flex-shrink-0">
                          {idx + 1}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">{campaign.name}</p>
                          <div className="flex gap-3 text-[10px] sm:text-xs text-muted-foreground mt-0.5">
                            <span>Trimise: {campaign.totalSent}</span>
                            <span className="text-emerald-600 font-medium">Open: {percentage(campaign.totalOpened, campaign.totalSent)}</span>
                            <span className="text-blue-600 font-medium">Click: {percentage(campaign.totalClicked, campaign.totalSent)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="w-full bg-secondary rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-violet-500 to-purple-500 h-1.5 rounded-full transition-all duration-500"
                          style={{
                            width: `${campaign.totalSent > 0 ? (campaign.totalOpened / campaign.totalSent) * 100 : 0}%`,
                          }}
                        />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}

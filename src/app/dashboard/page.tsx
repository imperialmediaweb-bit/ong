import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate, percentage, getInitials } from "@/lib/utils";
import {
  Users, Mail, Heart, TrendingUp, ArrowRight, Plus, Send, Zap,
  BarChart3, Globe, Sparkles, Calendar, Target,
} from "lucide-react";
import Link from "next/link";
import prisma from "@/lib/db";
import { getServerSession } from "next-auth";

async function getDashboardData() {
  const session = await getServerSession();
  const ngoId = (session?.user as any)?.ngoId;
  const userName = (session?.user as any)?.name || session?.user?.email || "";

  if (!ngoId) {
    return null;
  }

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
    console.error("Dashboard data error:", error);
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
  const data = await getDashboardData();

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <CardTitle>Bine ati venit la NGO HUB</CardTitle>
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

  const { stats, recentDonations, topCampaigns, userName, ngoName, ngoSlug } = data;

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Buna dimineata";
    if (h < 18) return "Buna ziua";
    return "Buna seara";
  })();

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
    {
      title: "Adauga donator",
      desc: "Inregistreaza un donator nou",
      icon: Users,
      href: "/dashboard/donors?action=add",
      gradient: "from-blue-500 to-cyan-500",
    },
    {
      title: "Creeaza campanie",
      desc: "Campanie email sau SMS",
      icon: Send,
      href: "/dashboard/campaigns/new",
      gradient: "from-violet-500 to-purple-500",
    },
    {
      title: "Automatizare noua",
      desc: "Automatizeaza fluxurile",
      icon: Zap,
      href: "/dashboard/automations/new",
      gradient: "from-amber-500 to-orange-500",
    },
    {
      title: "Agent AI Marketing",
      desc: "Sfaturi si strategii AI",
      icon: Sparkles,
      href: "/dashboard/analytics",
      gradient: "from-pink-500 to-rose-500",
    },
    {
      title: "Analitica",
      desc: "Performanta detaliata",
      icon: BarChart3,
      href: "/dashboard/analytics",
      gradient: "from-emerald-500 to-teal-500",
    },
    {
      title: "Mini-Site",
      desc: "Pagina ta publica",
      icon: Globe,
      href: ngoSlug ? `/s/${ngoSlug}` : "/dashboard/minisite",
      gradient: "from-indigo-500 to-blue-500",
    },
  ];

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
                {ngoName ? `Panoul de control ${ngoName}` : "Iata o prezentare generala a organizatiei tale."}
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
                {recentDonations.map((donation) => (
                  <div
                    key={donation.id}
                    className="flex items-center justify-between py-3 px-3 -mx-3 rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 text-white text-xs sm:text-sm font-medium flex-shrink-0">
                        {donation.donor?.name
                          ? getInitials(donation.donor.name)
                          : "AN"}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">
                          {donation.donor?.name || "Anonim"}
                        </p>
                        <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
                          {donation.campaign?.name || "Donatie directa"} &middot;{" "}
                          {formatDate(donation.createdAt)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 ml-2">
                      <p className="text-sm font-semibold text-emerald-600">
                        +{formatCurrency(donation.amount, donation.currency)}
                      </p>
                      <Badge
                        variant={
                          donation.status === "COMPLETED"
                            ? "success"
                            : donation.status === "PENDING"
                            ? "warning"
                            : "destructive"
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
                <p className="text-sm text-muted-foreground">
                  Nicio campanie trimisa inca.
                </p>
                <Link href="/dashboard/campaigns/new">
                  <Button variant="outline" size="sm" className="mt-3">
                    <Plus className="mr-1 h-3 w-3" /> Prima campanie
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {topCampaigns.map((campaign, idx) => (
                  <Link
                    key={campaign.id}
                    href={`/dashboard/campaigns/${campaign.id}`}
                    className="block"
                  >
                    <div className="group space-y-2 rounded-xl p-3 -mx-3 hover:bg-accent/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-400 to-purple-500 text-white text-xs font-bold flex-shrink-0">
                          {idx + 1}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">
                            {campaign.name}
                          </p>
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
    </div>
  );
}

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate, formatDateTime, percentage, getInitials } from "@/lib/utils";
import { Users, Mail, Heart, TrendingUp, ArrowRight, Plus, Send, Zap } from "lucide-react";
import Link from "next/link";
import prisma from "@/lib/db";
import { getServerSession } from "next-auth";

async function getDashboardData() {
  const session = await getServerSession();
  const ngoId = (session?.user as any)?.ngoId;

  if (!ngoId) {
    return null;
  }

  const [
    donorCount,
    activeCampaignCount,
    donationStats,
    recentDonations,
    topCampaigns,
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
  ]);

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const monthlyRevenue = await prisma.donation.aggregate({
    where: { ngoId, createdAt: { gte: thirtyDaysAgo }, status: "COMPLETED" },
    _sum: { amount: true },
  });

  return {
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
}

export default async function DashboardPage() {
  const data = await getDashboardData();

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <CardTitle>Welcome to NGO HUB</CardTitle>
            <CardDescription>Please sign in to access your dashboard.</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Link href="/login">
              <Button>Sign In</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { stats, recentDonations, topCampaigns } = data;

  const statCards = [
    {
      title: "Total Donors",
      value: stats.totalDonors.toLocaleString(),
      description: "Active donors in CRM",
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      href: "/dashboard/donors",
    },
    {
      title: "Active Campaigns",
      value: stats.activeCampaigns.toString(),
      description: "Running or scheduled",
      icon: Mail,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      href: "/dashboard/campaigns",
    },
    {
      title: "Total Donations",
      value: stats.totalDonations.toLocaleString(),
      description: "All-time donations received",
      icon: Heart,
      color: "text-red-600",
      bgColor: "bg-red-50",
      href: "/dashboard/donations",
    },
    {
      title: "Revenue",
      value: formatCurrency(stats.totalRevenue),
      description: `${formatCurrency(stats.monthlyRevenue)} this month`,
      icon: TrendingUp,
      color: "text-green-600",
      bgColor: "bg-green-50",
      href: "/dashboard/analytics",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back. Here is an overview of your NGO.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/campaigns/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Campaign
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Link key={stat.title} href={stat.href}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <div className={`${stat.bgColor} ${stat.color} p-2 rounded-lg`}>
                  <stat.icon className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-7">
        {/* Recent Donations */}
        <Card className="lg:col-span-4">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Recent Donations</CardTitle>
              <CardDescription>Latest donations received</CardDescription>
            </div>
            <Link href="/dashboard/donations">
              <Button variant="ghost" size="sm">
                View All
                <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {recentDonations.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No donations yet. Start a campaign to receive donations.
              </p>
            ) : (
              <div className="space-y-3">
                {recentDonations.map((donation) => (
                  <div
                    key={donation.id}
                    className="flex items-center justify-between py-2 border-b last:border-0"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-medium">
                        {donation.donor?.name
                          ? getInitials(donation.donor.name)
                          : "AN"}
                      </div>
                      <div>
                        <p className="text-sm font-medium">
                          {donation.donor?.name || "Anonymous"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {donation.campaign?.name || "Direct donation"} &middot;{" "}
                          {formatDate(donation.createdAt)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-green-600">
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
                        {donation.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Campaigns */}
        <Card className="lg:col-span-3">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Campaign Performance</CardTitle>
              <CardDescription>Top performing campaigns</CardDescription>
            </div>
            <Link href="/dashboard/campaigns">
              <Button variant="ghost" size="sm">
                View All
                <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {topCampaigns.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No campaigns have been sent yet.
              </p>
            ) : (
              <div className="space-y-4">
                {topCampaigns.map((campaign) => (
                  <Link
                    key={campaign.id}
                    href={`/dashboard/campaigns/${campaign.id}`}
                    className="block"
                  >
                    <div className="space-y-2 hover:bg-accent/50 rounded-lg p-2 -mx-2 transition-colors">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium truncate max-w-[200px]">
                          {campaign.name}
                        </p>
                        <Badge
                          variant={
                            campaign.status === "SENT"
                              ? "success"
                              : campaign.status === "SENDING"
                              ? "warning"
                              : "secondary"
                          }
                        >
                          {campaign.status}
                        </Badge>
                      </div>
                      <div className="flex gap-4 text-xs text-muted-foreground">
                        <span>Sent: {campaign.totalSent}</span>
                        <span>Opened: {percentage(campaign.totalOpened, campaign.totalSent)}</span>
                        <span>Clicked: {percentage(campaign.totalClicked, campaign.totalSent)}</span>
                      </div>
                      <div className="w-full bg-secondary rounded-full h-1.5">
                        <div
                          className="bg-primary h-1.5 rounded-full"
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

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quick Actions</CardTitle>
          <CardDescription>Common tasks to get things done fast</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Link href="/dashboard/donors?action=add">
              <Button variant="outline" className="w-full justify-start h-auto py-3">
                <Users className="mr-2 h-4 w-4 text-blue-600" />
                <div className="text-left">
                  <p className="font-medium">Add Donor</p>
                  <p className="text-xs text-muted-foreground">Register a new donor</p>
                </div>
              </Button>
            </Link>
            <Link href="/dashboard/campaigns/new">
              <Button variant="outline" className="w-full justify-start h-auto py-3">
                <Send className="mr-2 h-4 w-4 text-purple-600" />
                <div className="text-left">
                  <p className="font-medium">Create Campaign</p>
                  <p className="text-xs text-muted-foreground">Email or SMS campaign</p>
                </div>
              </Button>
            </Link>
            <Link href="/dashboard/automations/new">
              <Button variant="outline" className="w-full justify-start h-auto py-3">
                <Zap className="mr-2 h-4 w-4 text-yellow-600" />
                <div className="text-left">
                  <p className="font-medium">New Automation</p>
                  <p className="text-xs text-muted-foreground">Automate workflows</p>
                </div>
              </Button>
            </Link>
            <Link href="/dashboard/analytics">
              <Button variant="outline" className="w-full justify-start h-auto py-3">
                <TrendingUp className="mr-2 h-4 w-4 text-green-600" />
                <div className="text-left">
                  <p className="font-medium">View Analytics</p>
                  <p className="text-xs text-muted-foreground">Performance insights</p>
                </div>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

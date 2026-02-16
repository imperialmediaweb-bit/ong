"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Heart,
  Share2,
  Users,
  Target,
  TrendingUp,
  Clock,
  CheckCircle2,
  Copy,
  ExternalLink,
  Building2,
  Megaphone,
  CalendarDays,
  ImageIcon,
} from "lucide-react";

interface CampaignUpdate {
  id: string;
  title: string;
  content: string;
  imageUrl: string | null;
  createdAt: string;
}

interface CampaignData {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  type: string;
  status: string;
  goalAmount: number | null;
  currentAmount: number;
  totalDonors: number;
  createdAt: string;
  sentAt: string | null;
  ngo: {
    name: string;
    slug: string;
    description: string | null;
    logoUrl: string | null;
    websiteUrl: string | null;
  };
  recentDonations: {
    id: string;
    amount: number;
    currency: string;
    createdAt: string;
    donorName: string;
  }[];
  updates: CampaignUpdate[];
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("ro-RO", {
    style: "currency",
    currency: "RON",
  }).format(amount);
}

function formatDate(date: string): string {
  return new Intl.DateTimeFormat("ro-RO", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(date));
}

function timeAgo(date: string): string {
  const now = new Date();
  const then = new Date(date);
  const diffMs = now.getTime() - then.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffH = Math.floor(diffMs / 3600000);
  const diffD = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return "chiar acum";
  if (diffMin < 60) return `acum ${diffMin} min`;
  if (diffH < 24) return `acum ${diffH} ore`;
  if (diffD < 30) return `acum ${diffD} zile`;
  return formatDate(date);
}

function getTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    THANK_YOU: "Multumire",
    UPDATE: "Actualizare",
    EMERGENCY_APPEAL: "Apel urgent",
    NEWSLETTER: "Newsletter",
    REACTIVATION: "Reactivare",
    CORPORATE_OUTREACH: "Corporate",
    CUSTOM: "Campanie",
  };
  return labels[type] || "Campanie";
}

export function CampaignPublicView({ campaign }: { campaign: CampaignData }) {
  const [copied, setCopied] = useState(false);
  const [showAllDonations, setShowAllDonations] = useState(false);
  const [activeTab, setActiveTab] = useState<"despre" | "donatii" | "updates">("despre");

  const progressPercent = campaign.goalAmount
    ? Math.min((campaign.currentAmount / campaign.goalAmount) * 100, 100)
    : 0;

  const shareUrl = typeof window !== "undefined" ? window.location.href : "";

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  const handleShareNative = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: campaign.name,
          text: `Sustine campania "${campaign.name}" de la ${campaign.ngo.name}`,
          url: shareUrl,
        });
      } catch {
        // User cancelled
      }
    } else {
      handleCopyLink();
    }
  };

  const visibleDonations = showAllDonations
    ? campaign.recentDonations
    : campaign.recentDonations.slice(0, 5);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header Bar */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="text-lg font-bold text-primary">
            Binevo
          </Link>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyLink}
              className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg border hover:bg-gray-50 transition-colors"
            >
              {copied ? (
                <>
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  Copiat!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  Copiaza link
                </>
              )}
            </button>
            <button
              onClick={handleShareNative}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors"
            >
              <Share2 className="h-4 w-4" />
              Distribuie
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Hero Image */}
        {campaign.imageUrl && (
          <div className="relative rounded-2xl overflow-hidden mb-8 aspect-[21/9] bg-gray-100">
            <img
              src={campaign.imageUrl}
              alt={campaign.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
              <div className="flex items-center gap-2 text-sm text-white/80 mb-2">
                <Building2 className="h-4 w-4" />
                <span className="font-medium">{campaign.ngo.name}</span>
                <span>&middot;</span>
                <span>{getTypeLabel(campaign.type)}</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white">
                {campaign.name}
              </h1>
            </div>
          </div>
        )}

        {/* Header without image */}
        {!campaign.imageUrl && (
          <div className="mb-8">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
              <Building2 className="h-4 w-4" />
              <Link
                href={`/s/${campaign.ngo.slug}`}
                className="hover:underline font-medium"
              >
                {campaign.ngo.name}
              </Link>
              <span>&middot;</span>
              <span>{getTypeLabel(campaign.type)}</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-gray-900">
              {campaign.name}
            </h1>
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Progress Card */}
            {campaign.goalAmount && campaign.goalAmount > 0 && (
              <div className="rounded-2xl border bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-3xl font-bold text-primary">
                      {formatCurrency(campaign.currentAmount)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      strans din {formatCurrency(campaign.goalAmount)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-gray-900">
                      {progressPercent.toFixed(0)}%
                    </p>
                    <p className="text-sm text-muted-foreground">din obiectiv</p>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-gray-100 rounded-full h-4 mb-4 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-primary to-green-500 transition-all duration-1000 ease-out"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>

                <div className="flex items-center gap-6 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <Users className="h-4 w-4" />
                    {campaign.totalDonors} donatori
                  </span>
                  {campaign.sentAt && (
                    <span className="flex items-center gap-1.5">
                      <Clock className="h-4 w-4" />
                      Lansata {formatDate(campaign.sentAt)}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Stats when no goal */}
            {(!campaign.goalAmount || campaign.goalAmount === 0) && campaign.currentAmount > 0 && (
              <div className="rounded-2xl border bg-white p-6 shadow-sm">
                <p className="text-3xl font-bold text-primary mb-1">
                  {formatCurrency(campaign.currentAmount)}
                </p>
                <p className="text-sm text-muted-foreground mb-4">total strans</p>
                <div className="flex items-center gap-6 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <Users className="h-4 w-4" />
                    {campaign.totalDonors} donatori
                  </span>
                  {campaign.sentAt && (
                    <span className="flex items-center gap-1.5">
                      <Clock className="h-4 w-4" />
                      Lansata {formatDate(campaign.sentAt)}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Tabs */}
            <div className="border-b">
              <div className="flex gap-1">
                <button
                  onClick={() => setActiveTab("despre")}
                  className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === "despre"
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-gray-700"
                  }`}
                >
                  Despre campanie
                </button>
                <button
                  onClick={() => setActiveTab("donatii")}
                  className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === "donatii"
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-gray-700"
                  }`}
                >
                  Donatii ({campaign.totalDonors})
                </button>
                {campaign.updates.length > 0 && (
                  <button
                    onClick={() => setActiveTab("updates")}
                    className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === "updates"
                        ? "border-primary text-primary"
                        : "border-transparent text-muted-foreground hover:text-gray-700"
                    }`}
                  >
                    Noutati ({campaign.updates.length})
                  </button>
                )}
              </div>
            </div>

            {/* Tab: About / Description */}
            {activeTab === "despre" && (
              <div className="space-y-6">
                {/* Campaign Description */}
                {campaign.description && (
                  <div className="rounded-2xl border bg-white p-6 shadow-sm">
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Megaphone className="h-5 w-5 text-primary" />
                      Despre aceasta campanie
                    </h2>
                    <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap leading-relaxed">
                      {campaign.description}
                    </div>
                  </div>
                )}

                {/* NGO Description fallback */}
                {!campaign.description && campaign.ngo.description && (
                  <div className="rounded-2xl border bg-white p-6 shadow-sm">
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-primary" />
                      Despre {campaign.ngo.name}
                    </h2>
                    <p className="text-gray-700 leading-relaxed">
                      {campaign.ngo.description}
                    </p>
                  </div>
                )}

                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="rounded-xl border bg-white p-4 shadow-sm text-center">
                    <Target className="h-6 w-6 text-primary mx-auto mb-2" />
                    <p className="text-2xl font-bold">{campaign.totalDonors}</p>
                    <p className="text-xs text-muted-foreground">Donatori</p>
                  </div>
                  <div className="rounded-xl border bg-white p-4 shadow-sm text-center">
                    <TrendingUp className="h-6 w-6 text-green-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold">
                      {formatCurrency(campaign.currentAmount)}
                    </p>
                    <p className="text-xs text-muted-foreground">Strans</p>
                  </div>
                  {campaign.goalAmount && campaign.goalAmount > 0 && (
                    <div className="rounded-xl border bg-white p-4 shadow-sm text-center col-span-2 md:col-span-1">
                      <CheckCircle2 className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                      <p className="text-2xl font-bold">{progressPercent.toFixed(0)}%</p>
                      <p className="text-xs text-muted-foreground">Obiectiv atins</p>
                    </div>
                  )}
                </div>

                {/* Latest update preview */}
                {campaign.updates.length > 0 && (
                  <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
                    <div className="p-6 pb-3">
                      <h2 className="text-lg font-semibold flex items-center gap-2">
                        <Megaphone className="h-5 w-5 text-orange-500" />
                        Ultima noutate
                      </h2>
                    </div>
                    <div className="px-6 pb-6">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                        <CalendarDays className="h-3.5 w-3.5" />
                        {formatDate(campaign.updates[0].createdAt)}
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-2">{campaign.updates[0].title}</h3>
                      <p className="text-sm text-gray-600 line-clamp-3">{campaign.updates[0].content}</p>
                      {campaign.updates.length > 1 && (
                        <button
                          onClick={() => setActiveTab("updates")}
                          className="mt-3 text-sm text-primary hover:underline font-medium"
                        >
                          Vezi toate cele {campaign.updates.length} noutati
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Tab: Donations */}
            {activeTab === "donatii" && (
              <div className="space-y-4">
                {campaign.recentDonations.length > 0 ? (
                  <div className="rounded-2xl border bg-white shadow-sm">
                    <div className="p-6 pb-3">
                      <h2 className="text-lg font-semibold flex items-center gap-2">
                        <Heart className="h-5 w-5 text-red-500" />
                        Donatii recente
                      </h2>
                    </div>
                    <div className="divide-y">
                      {visibleDonations.map((donation) => (
                        <div
                          key={donation.id}
                          className="px-6 py-3 flex items-center justify-between"
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-medium shrink-0">
                              {donation.donorName[0]?.toUpperCase() || "A"}
                            </div>
                            <div>
                              <p className="text-sm font-medium">{donation.donorName}</p>
                              <p className="text-xs text-muted-foreground">
                                {timeAgo(donation.createdAt)}
                              </p>
                            </div>
                          </div>
                          <span className="text-sm font-semibold text-green-700">
                            +{formatCurrency(donation.amount)}
                          </span>
                        </div>
                      ))}
                    </div>
                    {campaign.recentDonations.length > 5 && !showAllDonations && (
                      <div className="p-4 text-center border-t">
                        <button
                          onClick={() => setShowAllDonations(true)}
                          className="text-sm text-primary hover:underline font-medium"
                        >
                          Vezi toate cele {campaign.recentDonations.length} donatii recente
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="rounded-2xl border bg-white p-8 shadow-sm text-center">
                    <Heart className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                    <p className="text-muted-foreground">Inca nu sunt donatii. Fii primul care doneaza!</p>
                  </div>
                )}
              </div>
            )}

            {/* Tab: Updates */}
            {activeTab === "updates" && (
              <div className="space-y-4">
                {campaign.updates.map((update, index) => (
                  <div key={update.id} className="rounded-2xl border bg-white shadow-sm overflow-hidden">
                    {update.imageUrl && (
                      <div className="aspect-video bg-gray-100">
                        <img
                          src={update.imageUrl}
                          alt={update.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="p-6">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold shrink-0">
                          {campaign.updates.length - index}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <CalendarDays className="h-3.5 w-3.5" />
                          {formatDate(update.createdAt)}
                        </div>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {update.title}
                      </h3>
                      <p className="text-gray-600 whitespace-pre-wrap leading-relaxed">
                        {update.content}
                      </p>
                    </div>
                  </div>
                ))}

                {campaign.updates.length === 0 && (
                  <div className="rounded-2xl border bg-white p-8 shadow-sm text-center">
                    <Megaphone className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                    <p className="text-muted-foreground">Nu sunt noutati inca.</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Donate CTA */}
            <div className="rounded-2xl border bg-white p-6 shadow-sm sticky top-20">
              <h3 className="text-lg font-semibold mb-2">Sustine aceasta cauza</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Fiecare donatie conteaza. Ajuta {campaign.ngo.name} sa isi atinga obiectivul.
              </p>
              <Link
                href={`/s/${campaign.ngo.slug}`}
                className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-lg bg-primary text-white font-medium hover:bg-primary/90 transition-colors text-center"
              >
                <Heart className="h-4 w-4" />
                Doneaza acum
              </Link>

              {/* Share Section */}
              <div className="mt-6 pt-6 border-t">
                <p className="text-sm font-medium mb-3">Distribuie campania</p>
                <div className="flex gap-2">
                  <button
                    onClick={handleCopyLink}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 text-sm rounded-lg border hover:bg-gray-50 transition-colors"
                  >
                    {copied ? (
                      <>
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        Copiat!
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4" />
                        Copiaza link
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleShareNative}
                    className="inline-flex items-center justify-center gap-2 px-3 py-2 text-sm rounded-lg border hover:bg-gray-50 transition-colors"
                  >
                    <Share2 className="h-4 w-4" />
                  </button>
                </div>

                {/* Social share links */}
                <div className="flex gap-2 mt-3">
                  <a
                    href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 inline-flex items-center justify-center px-3 py-2 text-sm rounded-lg bg-[#1877F2] text-white hover:bg-[#1877F2]/90 transition-colors"
                  >
                    Facebook
                  </a>
                  <a
                    href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(`Sustine campania "${campaign.name}" de la ${campaign.ngo.name}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 inline-flex items-center justify-center px-3 py-2 text-sm rounded-lg bg-black text-white hover:bg-black/80 transition-colors"
                  >
                    X
                  </a>
                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(`${campaign.name} - ${shareUrl}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 inline-flex items-center justify-center px-3 py-2 text-sm rounded-lg bg-[#25D366] text-white hover:bg-[#25D366]/90 transition-colors"
                  >
                    WhatsApp
                  </a>
                </div>
              </div>
            </div>

            {/* NGO Info */}
            <div className="rounded-2xl border bg-white p-6 shadow-sm">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Organizator
              </h3>
              <div className="flex items-center gap-3 mb-3">
                {campaign.ngo.logoUrl ? (
                  <img
                    src={campaign.ngo.logoUrl}
                    alt={campaign.ngo.name}
                    className="h-10 w-10 rounded-lg object-cover"
                  />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold text-sm">
                    {campaign.ngo.name
                      .split(" ")
                      .map((w: string) => w[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase()}
                  </div>
                )}
                <div>
                  <p className="font-medium">{campaign.ngo.name}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Link
                  href={`/s/${campaign.ngo.slug}`}
                  className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-2 text-sm rounded-lg border hover:bg-gray-50 transition-colors"
                >
                  <ExternalLink className="h-3 w-3" />
                  Pagina ONG
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t mt-16 py-8">
        <div className="max-w-5xl mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>
            Pagina de campanie pe{" "}
            <Link href="/" className="font-medium hover:underline text-primary">
              Binevo
            </Link>{" "}
            &mdash; Platforma CRM pentru ONG-uri
          </p>
        </div>
      </footer>
    </div>
  );
}

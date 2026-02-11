export const dynamic = "force-dynamic";

import Link from "next/link";
import prisma from "@/lib/db";
import {
  Heart,
  Users,
  Mail,
  Zap,
  BarChart3,
  Shield,
  Globe,
  Lock,
  Smartphone,
  TrendingUp,
  CheckCircle,
  Star,
  Trophy,
  Sparkles,
  CreditCard,
  Megaphone,
  Bot,
  FileText,
  Bell,
  ArrowRight,
  Clock,
  Award,
  BadgeCheck,
  ChevronRight,
  Phone,
  Facebook,
  Twitter,
  Linkedin,
  Instagram,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("ro-RO", { style: "currency", currency: "RON" }).format(amount);

export default async function HomePage() {
  let verifiedNgos: any[] = [];
  let featuredNgos: any[] = [];
  let topNgosByDonations: any[] = [];
  let recentNgos: any[] = [];
  let totalNgos = 0;
  let totalRaised = 0;
  let totalDonors = 0;
  let totalDonations = 0;
  let maxRaised = 1;

  try {
    const [
      _verifiedNgos,
      _featuredNgos,
      _topNgosByDonations,
      _recentNgos,
      _platformStats,
    ] = await Promise.all([
      prisma.ngo.findMany({
        where: { isActive: true, verification: { status: "APPROVED" } },
        include: { verification: true, _count: { select: { donors: true, donations: true } } },
        orderBy: { totalRaised: "desc" },
        take: 50,
      }),
      prisma.ngo.findMany({
        where: { isActive: true, isFeatured: true, boostUntil: { gte: new Date() } },
        include: { verification: true },
        orderBy: { totalRaised: "desc" },
        take: 6,
      }),
      prisma.ngo.findMany({
        where: { isActive: true, totalRaised: { gt: 0 } },
        orderBy: { totalRaised: "desc" },
        take: 10,
      }),
      prisma.ngo.findMany({
        where: { isActive: true },
        orderBy: { createdAt: "desc" },
        take: 6,
      }),
      prisma.ngo.aggregate({
        _count: true,
        _sum: { totalRaised: true },
      }),
    ]);

    verifiedNgos = _verifiedNgos;
    featuredNgos = _featuredNgos;
    topNgosByDonations = _topNgosByDonations;
    recentNgos = _recentNgos;
    totalNgos = _platformStats._count;
    totalRaised = _platformStats._sum.totalRaised || 0;

    totalDonors = await prisma.donor.count();
    totalDonations = await prisma.donation.count({ where: { status: "COMPLETED" } });
    maxRaised = topNgosByDonations.length > 0 ? topNgosByDonations[0].totalRaised : 1;
  } catch (error) {
    console.error("[HOMEPAGE] Database error:", error);
  }

  return (
    <div className="min-h-screen">
      {/* ─── HEADER / NAV ────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b bg-white/80 backdrop-blur-md">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Heart className="h-7 w-7 text-indigo-600" />
            <span className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Binevo
            </span>
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600">
            <Link href="/ong" className="hover:text-indigo-600 transition-colors">ONG-uri</Link>
            <Link href="#functionalitati" className="hover:text-indigo-600 transition-colors">Functionalitati</Link>
            <Link href="#preturi" className="hover:text-indigo-600 transition-colors">Preturi</Link>
            <Link href="#cum-functioneaza" className="hover:text-indigo-600 transition-colors">Cum functioneaza</Link>
          </nav>
          <div className="flex gap-3">
            <Link href="/login">
              <Button variant="ghost">Autentificare</Button>
            </Link>
            <Link href="/register">
              <Button>Creeaza cont</Button>
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* ─── 1. HERO SECTION ──────────────────────────────────── */}
        <section className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 text-white">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-30" />
          <div className="container mx-auto px-4 py-24 md:py-32 relative z-10">
            <div className="max-w-4xl mx-auto text-center">
              <Badge className="mb-6 bg-white/20 text-white border-white/30 hover:bg-white/30 text-sm px-4 py-1.5">
                <Sparkles className="h-4 w-4 mr-2" />
                Platforma #1 pentru ONG-uri din Romania
              </Badge>
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight mb-6 leading-tight">
                Platforma #1 pentru{" "}
                <span className="bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent">
                  ONG-uri
                </span>{" "}
                din Romania
              </h1>
              <p className="text-lg sm:text-xl text-indigo-100 mb-10 max-w-3xl mx-auto leading-relaxed">
                Gestioneaza donatorii, accepta donatii online, creeaza campanii inteligente cu AI
                si automatizeaza comunicarea. Totul intr-un singur loc.
              </p>
              <div className="flex gap-4 justify-center flex-wrap">
                <Link href="/register">
                  <Button size="lg" className="bg-white text-indigo-700 hover:bg-gray-100 font-semibold text-base px-8 py-6 h-auto">
                    Inregistreaza ONG-ul gratuit
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/ong">
                  <Button size="lg" variant="outline" className="border-white/40 text-white hover:bg-white/10 font-semibold text-base px-8 py-6 h-auto">
                    Descopera ONG-uri
                    <ExternalLink className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              </div>
            </div>

            {/* Stats Bar */}
            <div className="mt-16 max-w-5xl mx-auto">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center border border-white/10">
                  <p className="text-3xl md:text-4xl font-bold text-white">
                    {totalNgos.toLocaleString("ro-RO")}
                  </p>
                  <p className="text-indigo-200 mt-1 text-sm font-medium">ONG-uri active</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center border border-white/10">
                  <p className="text-3xl md:text-4xl font-bold text-white">
                    {totalDonors.toLocaleString("ro-RO")}
                  </p>
                  <p className="text-indigo-200 mt-1 text-sm font-medium">Donatori</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center border border-white/10">
                  <p className="text-3xl md:text-4xl font-bold text-white">
                    {formatCurrency(totalRaised)}
                  </p>
                  <p className="text-indigo-200 mt-1 text-sm font-medium">Donatii stranse</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center border border-white/10">
                  <p className="text-3xl md:text-4xl font-bold text-white">
                    {totalDonations.toLocaleString("ro-RO")}
                  </p>
                  <p className="text-indigo-200 mt-1 text-sm font-medium">Campanii</p>
                </div>
              </div>
            </div>
          </div>
          {/* Bottom wave */}
          <div className="absolute bottom-0 left-0 right-0">
            <svg viewBox="0 0 1440 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M0 50L48 45C96 40 192 30 288 28C384 26 480 32 576 40C672 48 768 58 864 55C960 52 1056 36 1152 30C1248 24 1344 28 1392 30L1440 32V100H1392C1344 100 1248 100 1152 100C1056 100 960 100 864 100C768 100 672 100 576 100C480 100 384 100 288 100C192 100 96 100 48 100H0V50Z" fill="white"/>
            </svg>
          </div>
        </section>

        {/* ─── 2. FEATURED / BOOSTED NGOs ───────────────────────── */}
        {featuredNgos.length > 0 && (
          <section className="py-20 bg-white">
            <div className="container mx-auto px-4">
              <div className="text-center mb-12">
                <Badge className="mb-4 bg-amber-100 text-amber-800 border-amber-200">
                  <Star className="h-3.5 w-3.5 mr-1.5" />
                  Promovate
                </Badge>
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
                  ONG-uri promovate
                </h2>
                <p className="text-gray-500 mt-3 max-w-2xl mx-auto">
                  Organizatii de incredere care si-au demonstrat impactul in comunitate
                </p>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {featuredNgos.map((ngo) => (
                  <Card key={ngo.id} className="relative overflow-hidden hover:shadow-lg transition-all duration-300 border-amber-200/50 group">
                    <div className="absolute top-4 right-4 z-10">
                      <Badge className="bg-gradient-to-r from-amber-400 to-yellow-400 text-amber-900 border-0 shadow-sm">
                        <Star className="h-3 w-3 mr-1" />
                        Promovat
                      </Badge>
                    </div>
                    {ngo.coverImageUrl ? (
                      <div className="h-48 bg-gradient-to-br from-indigo-100 to-purple-100 overflow-hidden">
                        <img src={ngo.coverImageUrl} alt={ngo.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      </div>
                    ) : (
                      <div className="h-48 bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center">
                        <Heart className="h-16 w-16 text-indigo-300" />
                      </div>
                    )}
                    <CardHeader>
                      <div className="flex items-center gap-3 mb-2">
                        {ngo.logoUrl ? (
                          <img src={ngo.logoUrl} alt="" className="h-10 w-10 rounded-full object-cover border-2 border-white shadow" />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                            <Heart className="h-5 w-5 text-indigo-600" />
                          </div>
                        )}
                        <div>
                          <CardTitle className="text-lg">{ngo.name}</CardTitle>
                          {ngo.category && (
                            <Badge variant="secondary" className="mt-1 text-xs">
                              {ngo.category}
                            </Badge>
                          )}
                        </div>
                      </div>
                      {ngo.shortDescription && (
                        <CardDescription className="line-clamp-2">
                          {ngo.shortDescription}
                        </CardDescription>
                      )}
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <div className="flex items-center gap-1.5">
                          <TrendingUp className="h-4 w-4 text-green-600" />
                          <span className="font-semibold text-green-700">{formatCurrency(ngo.totalRaised)}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Users className="h-4 w-4" />
                          <span>{ngo.donorCountPublic.toLocaleString("ro-RO")} donatori</span>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Link href={`/s/${ngo.slug}`} className="w-full">
                        <Button className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700">
                          <Heart className="h-4 w-4 mr-2" />
                          Doneaza
                        </Button>
                      </Link>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ─── 3. TOP ONG-uri DUPA DONATII ──────────────────────── */}
        {topNgosByDonations.length > 0 && (
          <section className="py-20 bg-gray-50">
            <div className="container mx-auto px-4">
              <div className="text-center mb-12">
                <Badge className="mb-4 bg-indigo-100 text-indigo-800 border-indigo-200">
                  <Trophy className="h-3.5 w-3.5 mr-1.5" />
                  Clasament
                </Badge>
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
                  Top ONG-uri - Cele mai multe donatii stranse
                </h2>
                <p className="text-gray-500 mt-3 max-w-2xl mx-auto">
                  Organizatiile care au strans cele mai multe fonduri prin platforma noastra
                </p>
              </div>
              <div className="max-w-4xl mx-auto space-y-4">
                {topNgosByDonations.map((ngo, index) => {
                  const percentage = maxRaised > 0 ? (ngo.totalRaised / maxRaised) * 100 : 0;
                  const rankColors: Record<number, string> = {
                    0: "from-yellow-400 to-amber-500",
                    1: "from-gray-300 to-gray-400",
                    2: "from-orange-400 to-orange-500",
                  };
                  const rankBg: Record<number, string> = {
                    0: "bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-200",
                    1: "bg-gradient-to-r from-gray-50 to-slate-50 border-gray-200",
                    2: "bg-gradient-to-r from-orange-50 to-amber-50 border-orange-200",
                  };
                  return (
                    <Card
                      key={ngo.id}
                      className={`hover:shadow-lg transition-all duration-300 ${
                        index < 3 ? rankBg[index] : ""
                      }`}
                    >
                      <CardContent className="p-5">
                        <div className="flex items-center gap-4">
                          {/* Rank Badge */}
                          <div
                            className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${
                              index < 3
                                ? `bg-gradient-to-r ${rankColors[index]} text-white shadow-md`
                                : "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {index < 3 ? (
                              <Trophy className="h-6 w-6" />
                            ) : (
                              `#${index + 1}`
                            )}
                          </div>

                          {/* NGO Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-bold text-gray-900 text-lg truncate">{ngo.name}</h3>
                              {ngo.category && (
                                <Badge variant="secondary" className="text-xs flex-shrink-0">
                                  {ngo.category}
                                </Badge>
                              )}
                            </div>
                            <div className="mt-2 flex items-center gap-4 text-sm text-gray-500">
                              <span className="flex items-center gap-1">
                                <Users className="h-3.5 w-3.5" />
                                {ngo.donorCountPublic.toLocaleString("ro-RO")} donatori
                              </span>
                              <span className="font-bold text-green-700 text-base">
                                {formatCurrency(ngo.totalRaised)}
                              </span>
                            </div>
                            {/* Progress Bar */}
                            <div className="mt-3 w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${
                                  index < 3
                                    ? `bg-gradient-to-r ${rankColors[index] || "from-indigo-500 to-purple-500"}`
                                    : "bg-gradient-to-r from-indigo-500 to-purple-500"
                                }`}
                                style={{ width: `${Math.max(percentage, 5)}%` }}
                              />
                            </div>
                          </div>

                          {/* Action */}
                          <Link href={`/s/${ngo.slug}`} className="flex-shrink-0">
                            <Button variant="outline" size="sm" className="gap-1.5">
                              Vezi detalii
                              <ChevronRight className="h-4 w-4" />
                            </Button>
                          </Link>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* ─── 4. ONG-uri VERIFICATE ────────────────────────────── */}
        {verifiedNgos.length > 0 && (
          <section className="py-20 bg-white">
            <div className="container mx-auto px-4">
              <div className="text-center mb-12">
                <Badge variant="success" className="mb-4">
                  <BadgeCheck className="h-3.5 w-3.5 mr-1.5" />
                  Verificate
                </Badge>
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
                  ONG-uri verificate si de incredere
                </h2>
                <p className="text-gray-500 mt-3 max-w-2xl mx-auto">
                  Toate ONG-urile sunt verificate prin sistemul nostru inteligent de validare
                </p>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {verifiedNgos.slice(0, 12).map((ngo) => (
                  <Card key={ngo.id} className="hover:shadow-lg transition-all duration-300 group flex flex-col">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          {ngo.logoUrl ? (
                            <img src={ngo.logoUrl} alt="" className="h-12 w-12 rounded-full object-cover border shadow-sm" />
                          ) : (
                            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center">
                              <Heart className="h-6 w-6 text-indigo-500" />
                            </div>
                          )}
                          <div>
                            <CardTitle className="text-base leading-tight">{ngo.name}</CardTitle>
                            {ngo.category && (
                              <Badge variant="secondary" className="mt-1 text-xs">{ngo.category}</Badge>
                            )}
                          </div>
                        </div>
                        <Badge variant="success" className="flex-shrink-0">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Verificat
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="flex-1 pb-3">
                      {ngo.shortDescription && (
                        <p className="text-sm text-gray-500 line-clamp-2 mb-3">{ngo.shortDescription}</p>
                      )}
                      {!ngo.shortDescription && ngo.description && (
                        <p className="text-sm text-gray-500 line-clamp-2 mb-3">{ngo.description}</p>
                      )}
                      <div className="flex items-center gap-1 mb-2">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            className={`h-4 w-4 ${
                              s <= Math.round(ngo.rating)
                                ? "text-yellow-400 fill-yellow-400"
                                : "text-gray-200 fill-gray-200"
                            }`}
                          />
                        ))}
                        {ngo.ratingCount > 0 && (
                          <span className="text-xs text-gray-400 ml-1">({ngo.ratingCount})</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 text-sm">
                        <TrendingUp className="h-4 w-4 text-green-600" />
                        <span className="font-semibold text-green-700">{formatCurrency(ngo.totalRaised)}</span>
                      </div>
                    </CardContent>
                    <CardFooter className="gap-2">
                      <Link href={`/s/${ngo.slug}`} className="flex-1">
                        <Button className="w-full" size="sm">
                          <Heart className="h-3.5 w-3.5 mr-1.5" />
                          Doneaza
                        </Button>
                      </Link>
                      <Link href={`/s/${ngo.slug}`}>
                        <Button variant="outline" size="sm">
                          Afla mai mult
                        </Button>
                      </Link>
                    </CardFooter>
                  </Card>
                ))}
              </div>
              {verifiedNgos.length > 12 && (
                <div className="text-center mt-10">
                  <Link href="/ong">
                    <Button variant="outline" size="lg" className="gap-2">
                      Vezi toate ONG-urile verificate ({verifiedNgos.length})
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </section>
        )}

        {/* ─── 5. ONG-uri NOI PE PLATFORMA ──────────────────────── */}
        {recentNgos.length > 0 && (
          <section className="py-20 bg-gray-50">
            <div className="container mx-auto px-4">
              <div className="text-center mb-12">
                <Badge className="mb-4 bg-purple-100 text-purple-800 border-purple-200">
                  <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                  Nou
                </Badge>
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
                  Nou pe Binevo
                </h2>
                <p className="text-gray-500 mt-3 max-w-2xl mx-auto">
                  Cele mai noi organizatii inregistrate pe platforma noastra
                </p>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {recentNgos.map((ngo) => (
                  <Card key={ngo.id} className="hover:shadow-lg transition-all duration-300 group">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4">
                        {ngo.logoUrl ? (
                          <img src={ngo.logoUrl} alt="" className="h-14 w-14 rounded-xl object-cover border shadow-sm" />
                        ) : (
                          <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-purple-100 to-indigo-100 flex items-center justify-center">
                            <Heart className="h-7 w-7 text-purple-500" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-gray-900 truncate">{ngo.name}</h3>
                            <Badge className="bg-green-100 text-green-700 border-green-200 text-xs flex-shrink-0">
                              Bun venit!
                            </Badge>
                          </div>
                          {ngo.category && (
                            <Badge variant="secondary" className="mt-1.5 text-xs">{ngo.category}</Badge>
                          )}
                          <p className="text-xs text-gray-400 mt-1.5 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Inregistrat la {ngo.createdAt.toLocaleDateString("ro-RO", { day: "numeric", month: "long", year: "numeric" })}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ─── 6. CUM FUNCTIONEAZA ──────────────────────────────── */}
        <section id="cum-functioneaza" className="py-20 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <Badge className="mb-4 bg-indigo-100 text-indigo-800 border-indigo-200">
                <Zap className="h-3.5 w-3.5 mr-1.5" />
                Simplu si rapid
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
                Cum functioneaza Binevo?
              </h2>
              <p className="text-gray-500 mt-3 max-w-2xl mx-auto">
                In doar 4 pasi simpli, ONG-ul tau poate incepe sa creasca
              </p>
            </div>
            <div className="max-w-5xl mx-auto grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                {
                  step: "1",
                  icon: FileText,
                  title: "Inregistreaza-te",
                  desc: "Creeaza contul ONG-ului in cateva minute. Gratuit si fara obligatii.",
                  color: "from-blue-500 to-indigo-500",
                },
                {
                  step: "2",
                  icon: BadgeCheck,
                  title: "Verifica-te",
                  desc: "Completeaza procesul de verificare pentru a castiga increderea donatorilor.",
                  color: "from-green-500 to-emerald-500",
                },
                {
                  step: "3",
                  icon: CreditCard,
                  title: "Conecteaza Stripe",
                  desc: "Activeaza platile online pentru donatii directe in contul ONG-ului.",
                  color: "from-purple-500 to-violet-500",
                },
                {
                  step: "4",
                  icon: TrendingUp,
                  title: "Creste",
                  desc: "Foloseste CRM, campanii AI si automatizari pentru a-ti creste impactul.",
                  color: "from-orange-500 to-red-500",
                },
              ].map((item, i) => (
                <div key={item.step} className="relative text-center group">
                  {i < 3 && (
                    <div className="hidden lg:block absolute top-10 left-[60%] w-[80%] border-t-2 border-dashed border-gray-200" />
                  )}
                  <div className={`mx-auto w-20 h-20 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center mb-5 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    <item.icon className="h-10 w-10 text-white" />
                  </div>
                  <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-gray-600 font-bold text-sm mb-3">
                    {item.step}
                  </div>
                  <h3 className="font-bold text-lg text-gray-900 mb-2">{item.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── 7. FEATURES / FUNCTIONALITIES ────────────────────── */}
        <section id="functionalitati" className="py-20 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <Badge className="mb-4 bg-purple-100 text-purple-800 border-purple-200">
                <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                Functionalitati
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
                Tot ce are nevoie un ONG
              </h2>
              <p className="text-gray-500 mt-3 max-w-2xl mx-auto">
                O platforma completa cu toate instrumentele necesare pentru a-ti gestiona ONG-ul profesionist
              </p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 max-w-7xl mx-auto">
              {[
                {
                  icon: Users,
                  title: "CRM Donatori",
                  desc: "Gestioneaza baza de donatori cu criptare AES-256 si conformitate GDPR",
                  plan: "BASIC",
                  color: "text-blue-600 bg-blue-50",
                },
                {
                  icon: Mail,
                  title: "Campanii Email",
                  desc: "Creeaza si trimite campanii de email personalizate cu generator AI",
                  plan: "PRO",
                  color: "text-indigo-600 bg-indigo-50",
                },
                {
                  icon: Smartphone,
                  title: "Campanii SMS",
                  desc: "Notificari SMS catre donatori cu Twilio",
                  plan: "ELITE",
                  color: "text-purple-600 bg-purple-50",
                },
                {
                  icon: Zap,
                  title: "Automatizari",
                  desc: "Fluxuri automate - multumire, re-engagement, follow-up",
                  plan: "PRO",
                  color: "text-amber-600 bg-amber-50",
                },
                {
                  icon: Bot,
                  title: "Super Agent AI",
                  desc: "Agent inteligent cu OpenAI, Gemini si Claude pentru strategii",
                  plan: "ELITE",
                  color: "text-emerald-600 bg-emerald-50",
                },
                {
                  icon: CreditCard,
                  title: "Plati Online",
                  desc: "Donatii cu cardul direct in contul ONG-ului via Stripe Connect",
                  plan: "BASIC",
                  color: "text-green-600 bg-green-50",
                },
                {
                  icon: Globe,
                  title: "Mini-Site",
                  desc: "Pagina personalizabila de donatii si newsletter",
                  plan: "BASIC",
                  color: "text-cyan-600 bg-cyan-50",
                },
                {
                  icon: BarChart3,
                  title: "Analitica",
                  desc: "Dashboarduri si rapoarte detaliate de performanta",
                  plan: "PRO",
                  color: "text-pink-600 bg-pink-50",
                },
                {
                  icon: Shield,
                  title: "GDPR Complet",
                  desc: "Consimtamant, export date, anonimizare, audit log",
                  plan: "BASIC",
                  color: "text-teal-600 bg-teal-50",
                },
                {
                  icon: BadgeCheck,
                  title: "Verificare ONG",
                  desc: "Sistem inteligent de verificare cu AI a asociatiilor",
                  plan: "BASIC",
                  color: "text-orange-600 bg-orange-50",
                },
                {
                  icon: FileText,
                  title: "Blog",
                  desc: "Publica articole si tine comunitatea informata",
                  plan: "PRO",
                  color: "text-rose-600 bg-rose-50",
                },
                {
                  icon: Bell,
                  title: "Notificari",
                  desc: "Alerte pentru donatii, abonamente si evenimente importante",
                  plan: "BASIC",
                  color: "text-violet-600 bg-violet-50",
                },
              ].map((feature) => {
                const planColors: Record<string, string> = {
                  BASIC: "bg-gray-100 text-gray-700",
                  PRO: "bg-indigo-100 text-indigo-700",
                  ELITE: "bg-purple-100 text-purple-700",
                };
                return (
                  <Card key={feature.title} className="hover:shadow-lg transition-all duration-300 group">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className={`w-12 h-12 rounded-xl ${feature.color} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                          <feature.icon className="h-6 w-6" />
                        </div>
                        <Badge className={`${planColors[feature.plan]} border-0 text-xs`}>
                          {feature.plan}
                        </Badge>
                      </div>
                      <h3 className="font-bold text-gray-900 mb-2">{feature.title}</h3>
                      <p className="text-sm text-gray-500 leading-relaxed">{feature.desc}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* ─── 8. PLANS / PRICING ───────────────────────────────── */}
        <section id="preturi" className="py-20 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <Badge className="mb-4 bg-green-100 text-green-800 border-green-200">
                <CreditCard className="h-3.5 w-3.5 mr-1.5" />
                Preturi
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
                Alege planul potrivit
              </h2>
              <p className="text-gray-500 mt-3 max-w-2xl mx-auto">
                Incepe gratuit si upgradeaza pe masura ce cresti
              </p>
            </div>
            <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-8">
              {/* BASIC */}
              <Card className="flex flex-col hover:shadow-lg transition-all duration-300">
                <CardHeader className="text-center pb-2">
                  <Badge variant="secondary" className="w-fit mx-auto mb-3">BASIC</Badge>
                  <CardTitle className="text-2xl">Gratuit</CardTitle>
                  <CardDescription>Perfect pentru ONG-uri la inceput de drum</CardDescription>
                </CardHeader>
                <CardContent className="flex-1">
                  <div className="text-center mb-6">
                    <span className="text-5xl font-extrabold text-gray-900">0</span>
                    <span className="text-xl text-gray-500 ml-1">RON</span>
                  </div>
                  <ul className="space-y-3">
                    {[
                      "100 donatori",
                      "Mini-site donatii",
                      "GDPR tools de baza",
                      "Vizualizare donatori",
                      "Plati online Stripe Connect",
                      "1 utilizator",
                      "Suport email",
                    ].map((f) => (
                      <li key={f} className="flex items-start gap-2.5 text-sm text-gray-600">
                        <CheckCircle className="h-4.5 w-4.5 text-green-500 flex-shrink-0 mt-0.5" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  <Link href="/register" className="w-full">
                    <Button variant="outline" className="w-full" size="lg">
                      Incepe acum
                    </Button>
                  </Link>
                </CardFooter>
              </Card>

              {/* PRO */}
              <Card className="flex flex-col hover:shadow-xl transition-all duration-300 border-indigo-300 ring-2 ring-indigo-200 relative scale-[1.02]">
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white border-0 px-4 py-1 text-sm shadow-lg">
                    <Star className="h-3.5 w-3.5 mr-1.5" />
                    Cel mai popular
                  </Badge>
                </div>
                <CardHeader className="text-center pb-2 pt-8">
                  <Badge className="w-fit mx-auto mb-3 bg-indigo-100 text-indigo-700 border-indigo-200">PRO</Badge>
                  <CardTitle className="text-2xl">Pro</CardTitle>
                  <CardDescription>Pentru ONG-uri care vor sa creasca</CardDescription>
                </CardHeader>
                <CardContent className="flex-1">
                  <div className="text-center mb-6">
                    <span className="text-5xl font-extrabold text-gray-900">149</span>
                    <span className="text-xl text-gray-500 ml-1">RON/luna</span>
                  </div>
                  <ul className="space-y-3">
                    {[
                      "1.000 donatori",
                      "Campanii email nelimitate",
                      "Generator continut AI",
                      "Automatizari de baza",
                      "Analitica si rapoarte",
                      "Export CSV",
                      "5 utilizatori",
                      "Suport prioritar",
                      "Blog ONG",
                    ].map((f) => (
                      <li key={f} className="flex items-start gap-2.5 text-sm text-gray-600">
                        <CheckCircle className="h-4.5 w-4.5 text-indigo-500 flex-shrink-0 mt-0.5" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  <Link href="/register" className="w-full">
                    <Button className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700" size="lg">
                      Incepe acum
                    </Button>
                  </Link>
                </CardFooter>
              </Card>

              {/* ELITE */}
              <Card className="flex flex-col hover:shadow-lg transition-all duration-300">
                <CardHeader className="text-center pb-2">
                  <Badge className="w-fit mx-auto mb-3 bg-purple-100 text-purple-700 border-purple-200">ELITE</Badge>
                  <CardTitle className="text-2xl">Elite</CardTitle>
                  <CardDescription>Pentru ONG-uri cu impact maxim</CardDescription>
                </CardHeader>
                <CardContent className="flex-1">
                  <div className="text-center mb-6">
                    <span className="text-5xl font-extrabold text-gray-900">349</span>
                    <span className="text-xl text-gray-500 ml-1">RON/luna</span>
                  </div>
                  <ul className="space-y-3">
                    {[
                      "Donatori nelimitati",
                      "Email + SMS campanii",
                      "Automatizari avansate",
                      "A/B Testing",
                      "Super Agent AI (OpenAI, Gemini, Claude)",
                      "Optimizare AI continut",
                      "Verificare prioritara",
                      "Utilizatori nelimitati",
                      "Suport dedicat",
                      "Blog + pagini custom",
                      "ONG promovat pe homepage",
                    ].map((f) => (
                      <li key={f} className="flex items-start gap-2.5 text-sm text-gray-600">
                        <CheckCircle className="h-4.5 w-4.5 text-purple-500 flex-shrink-0 mt-0.5" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  <Link href="/register" className="w-full">
                    <Button variant="outline" className="w-full border-purple-300 text-purple-700 hover:bg-purple-50" size="lg">
                      Incepe acum
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            </div>
          </div>
        </section>

        {/* ─── 9. TESTIMONIALS ──────────────────────────────────── */}
        <section className="py-20 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <Badge className="mb-4 bg-pink-100 text-pink-800 border-pink-200">
                <Heart className="h-3.5 w-3.5 mr-1.5" />
                Testimoniale
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
                Ce spun ONG-urile despre noi
              </h2>
              <p className="text-gray-500 mt-3 max-w-2xl mx-auto">
                Povestile organizatiilor care au ales Binevo
              </p>
            </div>
            <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-8">
              {[
                {
                  quote: "Binevo ne-a ajutat sa crestem donatiile cu 300% in primele 3 luni.",
                  author: "Maria P.",
                  org: "Fundatia Sperantei",
                  avatar: "M",
                  color: "from-indigo-500 to-blue-500",
                },
                {
                  quote: "Automatizarile ne economisesc 20 de ore pe saptamana. Acum ne concentram pe misiune.",
                  author: "Ion G.",
                  org: "Asociatia Verde",
                  avatar: "I",
                  color: "from-green-500 to-emerald-500",
                },
                {
                  quote: "Sistemul de verificare da incredere donatorilor nostri. Cel mai bun investment.",
                  author: "Elena M.",
                  org: "ONG pentru Copii",
                  avatar: "E",
                  color: "from-purple-500 to-pink-500",
                },
              ].map((testimonial) => (
                <Card key={testimonial.author} className="hover:shadow-lg transition-all duration-300">
                  <CardContent className="p-8">
                    <div className="flex gap-1 mb-4">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star key={s} className="h-5 w-5 text-yellow-400 fill-yellow-400" />
                      ))}
                    </div>
                    <blockquote className="text-gray-700 leading-relaxed mb-6 italic">
                      &quot;{testimonial.quote}&quot;
                    </blockquote>
                    <div className="flex items-center gap-3">
                      <div className={`w-11 h-11 rounded-full bg-gradient-to-br ${testimonial.color} flex items-center justify-center text-white font-bold shadow`}>
                        {testimonial.avatar}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">{testimonial.author}</p>
                        <p className="text-xs text-gray-500">{testimonial.org}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* ─── 10. CTA SECTION ──────────────────────────────────── */}
        <section className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 text-white py-24">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-30" />
          <div className="container mx-auto px-4 text-center relative z-10">
            <div className="max-w-3xl mx-auto">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-sm mb-6">
                <TrendingUp className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-3xl md:text-5xl font-extrabold mb-4 leading-tight">
                Gata sa transformi ONG-ul tau?
              </h2>
              <p className="text-lg text-indigo-200 mb-10 leading-relaxed">
                Alatura-te celor {totalNgos.toLocaleString("ro-RO")} ONG-uri care folosesc deja Binevo
              </p>
              <div className="flex gap-4 justify-center flex-wrap">
                <Link href="/register">
                  <Button size="lg" className="bg-white text-indigo-700 hover:bg-gray-100 font-semibold text-base px-8 py-6 h-auto shadow-xl">
                    Inregistreaza-te gratuit
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <a href="mailto:contact@binevo.ro">
                  <Button size="lg" variant="outline" className="border-white/40 text-white hover:bg-white/10 font-semibold text-base px-8 py-6 h-auto">
                    <Mail className="mr-2 h-5 w-5" />
                    Contacteaza-ne
                  </Button>
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ─── 11. FOOTER ───────────────────────────────────────── */}
      <footer className="bg-gray-900 text-gray-300">
        <div className="container mx-auto px-4 py-16">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10">
            {/* Col 1 - Brand */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Heart className="h-6 w-6 text-indigo-400" />
                <span className="text-lg font-bold text-white">Binevo</span>
              </div>
              <p className="text-sm text-gray-400 mb-6 leading-relaxed">
                Platforma completa pentru gestionarea ONG-urilor din Romania.
                CRM, campanii, donatii online si automatizari inteligente.
              </p>
              <div className="flex gap-3">
                <a href="#" className="w-9 h-9 rounded-lg bg-gray-800 hover:bg-indigo-600 flex items-center justify-center transition-colors">
                  <Facebook className="h-4 w-4" />
                </a>
                <a href="#" className="w-9 h-9 rounded-lg bg-gray-800 hover:bg-indigo-600 flex items-center justify-center transition-colors">
                  <Twitter className="h-4 w-4" />
                </a>
                <a href="#" className="w-9 h-9 rounded-lg bg-gray-800 hover:bg-indigo-600 flex items-center justify-center transition-colors">
                  <Linkedin className="h-4 w-4" />
                </a>
                <a href="#" className="w-9 h-9 rounded-lg bg-gray-800 hover:bg-indigo-600 flex items-center justify-center transition-colors">
                  <Instagram className="h-4 w-4" />
                </a>
              </div>
            </div>

            {/* Col 2 - Platforma */}
            <div>
              <h4 className="font-semibold text-white mb-4">Platforma</h4>
              <ul className="space-y-2.5 text-sm">
                <li>
                  <Link href="#functionalitati" className="text-gray-400 hover:text-white transition-colors">
                    Functionalitati
                  </Link>
                </li>
                <li>
                  <Link href="#preturi" className="text-gray-400 hover:text-white transition-colors">
                    Preturi
                  </Link>
                </li>
                <li>
                  <Link href="/blog" className="text-gray-400 hover:text-white transition-colors">
                    Blog
                  </Link>
                </li>
                <li>
                  <Link href="/ong" className="text-gray-400 hover:text-white transition-colors">
                    ONG-uri verificate
                  </Link>
                </li>
              </ul>
            </div>

            {/* Col 3 - Legal */}
            <div>
              <h4 className="font-semibold text-white mb-4">Legal</h4>
              <ul className="space-y-2.5 text-sm">
                <li>
                  <Link href="/terms" className="text-gray-400 hover:text-white transition-colors">
                    Termeni si conditii
                  </Link>
                </li>
                <li>
                  <Link href="/privacy" className="text-gray-400 hover:text-white transition-colors">
                    Politica de confidentialitate
                  </Link>
                </li>
                <li>
                  <Link href="/gdpr" className="text-gray-400 hover:text-white transition-colors">
                    GDPR
                  </Link>
                </li>
              </ul>
            </div>

            {/* Col 4 - Contact */}
            <div>
              <h4 className="font-semibold text-white mb-4">Contact</h4>
              <ul className="space-y-2.5 text-sm">
                <li className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-gray-500" />
                  <a href="mailto:contact@binevo.ro" className="text-gray-400 hover:text-white transition-colors">
                    contact@binevo.ro
                  </a>
                </li>
                <li className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-gray-500" />
                  <a href="tel:+40700000000" className="text-gray-400 hover:text-white transition-colors">
                    +40 700 000 000
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
        <div className="border-t border-gray-800">
          <div className="container mx-auto px-4 py-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-500">
            <p>&copy; 2024 Binevo. Toate drepturile rezervate.</p>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <Shield className="h-3.5 w-3.5" />
                Conform GDPR
              </span>
              <span className="flex items-center gap-1.5">
                <Lock className="h-3.5 w-3.5" />
                Securitate AES-256
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

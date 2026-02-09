export const dynamic = "force-dynamic";

import prisma from "@/lib/db";
import Link from "next/link";
import {
  ArrowLeft,
  Heart,
  ShieldCheck,
  Star,
  Users,
  TrendingUp,
  Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";

const CATEGORIES = [
  "Toate",
  "Social",
  "Educatie",
  "Sanatate",
  "Mediu",
  "Cultura",
  "Sport",
  "Drepturile omului",
  "Altele",
];

function formatAmount(amount: number): string {
  return new Intl.NumberFormat("ro-RO", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function RatingStars({ rating }: { rating: number }) {
  const fullStars = Math.floor(rating);
  const hasHalf = rating - fullStars >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalf ? 1 : 0);

  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: fullStars }).map((_, i) => (
        <Star
          key={`full-${i}`}
          className="h-4 w-4 fill-yellow-400 text-yellow-400"
        />
      ))}
      {hasHalf && (
        <Star className="h-4 w-4 fill-yellow-400/50 text-yellow-400" />
      )}
      {Array.from({ length: emptyStars }).map((_, i) => (
        <Star key={`empty-${i}`} className="h-4 w-4 text-gray-300" />
      ))}
      <span className="ml-1 text-xs text-muted-foreground">
        ({rating.toFixed(1)})
      </span>
    </div>
  );
}

export default async function OngDirectoryPage() {
  let ngos: any[] = [];
  try {
    ngos = await prisma.ngo.findMany({
      where: { isActive: true },
      include: {
        verification: { select: { status: true } },
        _count: { select: { donors: true, donations: true } },
      },
      orderBy: { totalRaised: "desc" },
    });
  } catch (error) {
    console.error("ONG directory error:", error);
  }

  const totalNgos = ngos.length;
  const verifiedNgos = ngos.filter(
    (n) => n.verification?.status === "APPROVED"
  ).length;
  const totalRaised = ngos.reduce((sum, n) => sum + n.totalRaised, 0);
  const now = new Date();

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-8">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Inapoi la pagina principala
          </Link>
          <div className="flex items-center gap-2">
            <Heart className="h-6 w-6 text-primary" />
            <span className="font-bold text-lg">NGO HUB</span>
          </div>
        </div>

        <div className="text-center max-w-3xl mx-auto mb-10">
          <h1 className="text-4xl font-bold tracking-tight mb-4">
            Director ONG-uri
          </h1>
          <p className="text-lg text-muted-foreground mb-8">
            Descopera si sustine ONG-uri verificate din Romania
          </p>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-6 max-w-2xl mx-auto">
            <div className="rounded-lg border bg-card p-4 text-center">
              <p className="text-2xl font-bold text-primary">{totalNgos}</p>
              <p className="text-sm text-muted-foreground">Total ONG-uri</p>
            </div>
            <div className="rounded-lg border bg-card p-4 text-center">
              <p className="text-2xl font-bold text-green-600">
                {verifiedNgos}
              </p>
              <p className="text-sm text-muted-foreground">
                ONG-uri verificate
              </p>
            </div>
            <div className="rounded-lg border bg-card p-4 text-center">
              <p className="text-2xl font-bold text-primary">
                {formatAmount(totalRaised)} RON
              </p>
              <p className="text-sm text-muted-foreground">
                Total donatii stranse
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 pb-16">
        {/* Category Filter Bar */}
        <div className="flex flex-wrap gap-2 justify-center mb-10">
          {CATEGORIES.map((cat) => (
            <a key={cat} href={cat === "Toate" ? "#all" : `#cat-${cat}`}>
              <Badge
                variant={cat === "Toate" ? "default" : "secondary"}
                className="cursor-pointer px-4 py-1.5 text-sm hover:bg-primary hover:text-primary-foreground transition-colors"
              >
                {cat}
              </Badge>
            </a>
          ))}
        </div>

        {/* NGO Grid */}
        {ngos.length === 0 ? (
          <div className="text-center py-20">
            <Heart className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">
              Niciun ONG inregistrat inca. Fii primul!
            </h2>
            <p className="text-muted-foreground mb-6">
              Inregistreaza-ti ONG-ul pe platforma noastra si incepe sa
              colectezi donatii.
            </p>
            <Link href="/register">
              <Button size="lg">Inregistreaza ONG-ul tau</Button>
            </Link>
          </div>
        ) : (
          <div
            id="all"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {ngos.map((ngo) => {
              const isVerified =
                ngo.verification?.status === "APPROVED";
              const isBoosted =
                ngo.isFeatured &&
                ngo.boostUntil &&
                new Date(ngo.boostUntil) > now;
              const description =
                ngo.shortDescription || ngo.description || "";
              const truncatedDesc =
                description.length > 100
                  ? description.substring(0, 100) + "..."
                  : description;

              return (
                <Card
                  key={ngo.id}
                  id={ngo.category ? `cat-${ngo.category}` : undefined}
                  className={`overflow-hidden flex flex-col transition-shadow hover:shadow-lg ${
                    isBoosted
                      ? "border-2 border-yellow-400 ring-1 ring-yellow-400/50"
                      : ""
                  }`}
                >
                  {/* Cover Image / Placeholder */}
                  <div className="relative h-48 overflow-hidden">
                    {ngo.coverImageUrl ? (
                      <img
                        src={ngo.coverImageUrl}
                        alt={ngo.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary/20 via-primary/10 to-primary/5 flex items-center justify-center">
                        <span className="text-6xl font-bold text-primary/30">
                          {ngo.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}

                    {/* Badges overlay */}
                    <div className="absolute top-3 left-3 flex gap-2">
                      {isVerified && (
                        <Badge className="bg-green-600 text-white gap-1">
                          <ShieldCheck className="h-3 w-3" />
                          Verificat
                        </Badge>
                      )}
                      {isBoosted && (
                        <Badge className="bg-yellow-500 text-white gap-1">
                          <Sparkles className="h-3 w-3" />
                          Promovat
                        </Badge>
                      )}
                      {ngo.isFeatured && !isBoosted && (
                        <Badge className="bg-yellow-500/80 text-white gap-1">
                          <Star className="h-3 w-3" />
                          Recomandat
                        </Badge>
                      )}
                    </div>
                  </div>

                  <CardContent className="flex-1 p-5">
                    {/* Name */}
                    <Link href={`/s/${ngo.slug}`}>
                      <h3 className="text-lg font-bold hover:text-primary transition-colors mb-2">
                        {ngo.name}
                      </h3>
                    </Link>

                    {/* Category */}
                    {ngo.category && (
                      <Badge variant="secondary" className="mb-3">
                        {ngo.category}
                      </Badge>
                    )}

                    {/* Description */}
                    {truncatedDesc && (
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                        {truncatedDesc}
                      </p>
                    )}

                    {/* Stats */}
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                      <span className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {ngo._count.donors} donatori
                      </span>
                      <span className="flex items-center gap-1">
                        <TrendingUp className="h-4 w-4" />
                        {formatAmount(ngo.totalRaised)} RON stranse
                      </span>
                    </div>

                    {/* Rating */}
                    {ngo.rating > 0 && <RatingStars rating={ngo.rating} />}
                  </CardContent>

                  <CardFooter className="p-5 pt-0 gap-3">
                    <Link href={`/s/${ngo.slug}`} className="flex-1">
                      <Button className="w-full" size="sm">
                        <Heart className="h-4 w-4 mr-1" />
                        Doneaza
                      </Button>
                    </Link>
                    <Link href={`/s/${ngo.slug}`} className="flex-1">
                      <Button variant="outline" className="w-full" size="sm">
                        Afla mai mult
                      </Button>
                    </Link>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <Link
            href="/"
            className="flex items-center gap-2 hover:text-foreground transition-colors"
          >
            <Heart className="h-4 w-4 text-primary" />
            <span>NGO HUB - Platforma CRM pentru ONG-uri</span>
          </Link>
          <div className="flex items-center gap-4">
            <span>Vrei sa-ti inregistrezi ONG-ul?</span>
            <Link href="/register">
              <Button size="sm" variant="outline">
                Creeaza cont
              </Button>
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import prisma from "@/lib/db";
import {
  ArrowLeft,
  Heart,
  ShieldCheck,
  Globe,
  AlertCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DonationWidget } from "@/components/donate/donation-widget";

interface Props {
  params: { slug: string };
}

export default async function DonatePage({ params }: Props) {
  let ngo: any = null;
  try {
    ngo = await prisma.ngo.findUnique({
      where: { slug: params.slug, isActive: true },
      include: { verification: true },
    });
  } catch (error) {
    console.error("Donate page error:", error);
  }

  if (!ngo) {
    notFound();
  }

  const isVerified = ngo.verification?.status === "APPROVED";

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <Link
            href="/ong"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Inapoi la directorul ONG-uri
          </Link>
          <Link href="/" className="flex items-center gap-2">
            <Heart className="h-6 w-6 text-primary" />
            <span className="font-bold text-lg">NGO HUB</span>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-3xl">
        {/* Cover Image */}
        {ngo.coverImageUrl && (
          <div className="rounded-xl overflow-hidden mb-8 h-64">
            <img
              src={ngo.coverImageUrl}
              alt={ngo.name}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* NGO Info */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-3">
            {ngo.logoUrl ? (
              <img
                src={ngo.logoUrl}
                alt={ngo.name}
                className="h-12 w-12 rounded-full object-cover"
              />
            ) : (
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Heart className="h-6 w-6 text-primary" />
              </div>
            )}
            <h1 className="text-3xl font-bold">{ngo.name}</h1>
          </div>

          <div className="flex items-center justify-center gap-2 mb-4">
            {isVerified && (
              <Badge className="bg-green-600 text-white gap-1">
                <ShieldCheck className="h-3 w-3" />
                ONG Verificat
              </Badge>
            )}
            {ngo.category && (
              <Badge variant="secondary">{ngo.category}</Badge>
            )}
          </div>

          {ngo.description && (
            <p className="text-muted-foreground max-w-xl mx-auto">
              {ngo.description}
            </p>
          )}

          {ngo.websiteUrl && (
            <a
              href={ngo.websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-primary hover:underline mt-3"
            >
              <Globe className="h-4 w-4" />
              {ngo.websiteUrl}
            </a>
          )}
        </div>

        {/* Donation Section */}
        {ngo.stripeConnectOnboarded ? (
          <DonationWidget
            ngoSlug={ngo.slug}
            ngoName={ngo.name}
            isVerified={isVerified}
          />
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-yellow-50 flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="h-8 w-8 text-yellow-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">
                Plati online indisponibile momentan
              </h3>
              <p className="text-muted-foreground mb-6">
                Acest ONG nu accepta inca plati online. Contacteaza-i direct
                pentru a face o donatie.
              </p>
              {ngo.websiteUrl && (
                <a href={ngo.websiteUrl} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline">
                    <Globe className="h-4 w-4 mr-2" />
                    Viziteaza site-ul ONG-ului
                  </Button>
                </a>
              )}
            </CardContent>
          </Card>
        )}

        {/* Mini-site link */}
        <div className="text-center mt-8">
          <Link
            href={`/s/${ngo.slug}`}
            className="text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            Vezi pagina completa a ONG-ului &rarr;
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t py-8 mt-16">
        <div className="container mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <Link
            href="/"
            className="flex items-center gap-2 hover:text-foreground transition-colors"
          >
            <Heart className="h-4 w-4 text-primary" />
            <span>NGO HUB - Platforma CRM pentru ONG-uri</span>
          </Link>
          <span>Plati securizate prin Stripe</span>
        </div>
      </footer>
    </div>
  );
}

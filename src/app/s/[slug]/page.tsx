import { notFound } from "next/navigation";
import Image from "next/image";
import prisma from "@/lib/db";
import { MiniSiteDonation } from "@/components/minisite/donation-form";
import { MiniSiteNewsletter } from "@/components/minisite/newsletter-form";
import { Heart } from "lucide-react";

interface Props {
  params: { slug: string };
}

export default async function MiniSitePage({ params }: Props) {
  const ngo = await prisma.ngo.findUnique({
    where: { slug: params.slug, isActive: true },
    include: {
      miniSiteConfig: true,
      consentTexts: { where: { isActive: true } },
    },
  });

  if (!ngo) notFound();

  const config = ngo.miniSiteConfig;
  const consentTexts = Object.fromEntries(
    ngo.consentTexts.map((ct) => [ct.type, ct.text])
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <header className="text-center mb-10">
          <div className="flex justify-center mb-4">
            {ngo.logoUrl ? (
              <Image src={ngo.logoUrl} alt={ngo.name} width={64} height={64} className="h-16 w-16 rounded-full object-cover" />
            ) : (
              <Heart className="h-12 w-12 text-primary" />
            )}
          </div>
          <h1 className="text-3xl font-bold">{config?.heroTitle || ngo.name}</h1>
          {(config?.heroDescription || ngo.description) && (
            <p className="mt-3 text-muted-foreground max-w-lg mx-auto">
              {config?.heroDescription || ngo.description}
            </p>
          )}
        </header>

        {(config?.showDonation !== false) && (
          <section className="mb-8">
            <MiniSiteDonation
              ngoSlug={ngo.slug}
              ngoName={ngo.name}
              consentTexts={consentTexts}
            />
          </section>
        )}

        {(config?.showNewsletter !== false) && (
          <section className="mb-8">
            <MiniSiteNewsletter
              ngoSlug={ngo.slug}
              consentTexts={consentTexts}
            />
          </section>
        )}

        <footer className="text-center text-xs text-muted-foreground mt-10 pb-8">
          <p>Powered by NGO HUB. Your data is protected under GDPR.</p>
          {ngo.websiteUrl && (
            <a href={ngo.websiteUrl} className="text-primary hover:underline" target="_blank" rel="noopener">
              {ngo.name} website
            </a>
          )}
        </footer>
      </div>
    </div>
  );
}

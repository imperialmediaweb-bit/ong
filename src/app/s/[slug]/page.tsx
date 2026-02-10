import { notFound } from "next/navigation";
import prisma from "@/lib/db";
import { MiniSiteDonation } from "@/components/minisite/donation-form";
import { MiniSiteNewsletter } from "@/components/minisite/newsletter-form";
import {
  Heart,
  Target,
  TrendingUp,
  Users,
  Mail,
  Phone,
  MapPin,
  Globe,
  ExternalLink,
  FileText,
  Briefcase,
  ArrowRight,
  Instagram,
  Linkedin,
  Youtube,
  Twitter,
  Clock,
  ChevronRight,
  Calendar,
  Tag,
  Newspaper,
  Shield,
  Building2,
  CreditCard,
} from "lucide-react";

export const dynamic = "force-dynamic";

interface Props {
  params: { slug: string };
}

function hexToRgb(hex: string): string {
  const cleaned = hex.replace("#", "");
  const r = parseInt(cleaned.substring(0, 2), 16);
  const g = parseInt(cleaned.substring(2, 4), 16);
  const b = parseInt(cleaned.substring(4, 6), 16);
  return `${r}, ${g}, ${b}`;
}

function formatCurrency(amount: number): string {
  if (amount >= 1000000) {
    return `${(amount / 1000000).toFixed(1)}M`;
  }
  if (amount >= 1000) {
    return `${(amount / 1000).toFixed(1)}K`;
  }
  return amount.toLocaleString("ro-RO");
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").replace(/&[^;]+;/g, " ").trim();
}

export default async function MiniSitePage({ params }: Props) {
  let ngo: any = null;
  try {
    ngo = await prisma.ngo.findUnique({
      where: { slug: params.slug, isActive: true },
      include: {
        miniSiteConfig: true,
        consentTexts: { where: { isActive: true } },
      },
    });
  } catch (error) {
    console.error("Mini-site error:", error);
  }

  if (!ngo) notFound();

  const config = ngo.miniSiteConfig;
  const consentTexts = Object.fromEntries(
    ngo.consentTexts.map((ct: any) => [ct.type, ct.text])
  );

  const primaryColor = config?.primaryColor || "#6366f1";
  const accentColor = config?.accentColor || "#f59e0b";
  const primaryRgb = hexToRgb(primaryColor);
  const accentRgb = hexToRgb(accentColor);

  const heroTitle = config?.heroTitle || ngo.name;
  const heroDescription = config?.heroDescription || ngo.description || "";
  const shortDescription = ngo.shortDescription || config?.shortDescription || "";
  const heroCtaText = config?.heroCtaText || "Doneaza acum";
  const coverImageUrl = ngo.coverImageUrl || config?.coverImageUrl || "";

  const showAbout = config?.showAbout !== false;
  const showMission = config?.showMission !== false;
  const showImpact = config?.showImpact !== false;
  const showDonation = config?.showDonation !== false;
  const showNewsletter = config?.showNewsletter !== false;
  const showFormular230 = config?.showFormular230 === true;
  const showContract = config?.showContract === true;
  const showContact = config?.showContact !== false;
  const showSocial = config?.showSocial !== false;

  const yearsActive = Math.max(
    1,
    new Date().getFullYear() - new Date(ngo.createdAt).getFullYear()
  );

  const hasSocials =
    config?.socialFacebook ||
    config?.socialInstagram ||
    config?.socialLinkedin ||
    config?.socialTwitter ||
    config?.socialYoutube ||
    config?.socialTiktok;

  const hasContact =
    config?.contactEmail || config?.contactPhone || config?.contactAddress;

  // Fetch blog posts (with try/catch - table might not exist)
  let blogPosts: any[] = [];
  try {
    blogPosts = await (prisma as any).blogPost.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { publishedAt: "desc" },
      take: 3,
      select: {
        id: true,
        slug: true,
        title: true,
        excerpt: true,
        content: true,
        coverImage: true,
        category: true,
        publishedAt: true,
      },
    });
  } catch {
    // BlogPost table might not exist yet
    blogPosts = [];
  }

  // Dynamic campaigns from miniSiteCampaigns field
  const miniSiteCampaigns: any[] = Array.isArray((config as any)?.miniSiteCampaigns)
    ? (config as any).miniSiteCampaigns.filter((c: any) => c.isActive)
    : [];

  const showCampaigns = showFormular230 || showContract || showDonation || miniSiteCampaigns.length > 0;

  return (
    <div
      style={
        {
          "--color-primary": primaryColor,
          "--color-primary-rgb": primaryRgb,
          "--color-accent": accentColor,
          "--color-accent-rgb": accentRgb,
          scrollBehavior: "smooth",
        } as React.CSSProperties
      }
      className="min-h-screen bg-gray-50 antialiased"
    >
      {/* ── Sticky Navigation Bar ────────────────────────────────────── */}
      <nav
        className="fixed left-0 right-0 top-0 z-50 transition-all duration-300"
        style={{
          backgroundColor: `rgba(${primaryRgb}, 0.92)`,
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          borderBottom: `1px solid rgba(255, 255, 255, 0.1)`,
        }}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          {/* Logo + Name */}
          <a href="#" className="flex items-center gap-3 no-underline">
            {ngo.logoUrl ? (
              <img
                src={ngo.logoUrl}
                alt={ngo.name}
                className="h-9 w-9 rounded-lg object-cover shadow-sm ring-2 ring-white/20"
              />
            ) : (
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/20 shadow-sm">
                <Heart className="h-5 w-5 text-white" />
              </div>
            )}
            <span className="hidden text-base font-bold text-white sm:inline">
              {ngo.name}
            </span>
          </a>

          {/* Desktop Navigation Links */}
          <div className="hidden items-center gap-1 md:flex">
            <a
              href="#"
              className="rounded-lg px-3 py-2 text-sm font-medium text-white/90 transition-colors duration-200 hover:bg-white/10 hover:text-white"
            >
              Acasa
            </a>
            {(showAbout || showMission) && (
              <a
                href="#despre"
                className="rounded-lg px-3 py-2 text-sm font-medium text-white/90 transition-colors duration-200 hover:bg-white/10 hover:text-white"
              >
                Despre noi
              </a>
            )}
            {showCampaigns && (
              <a
                href="#campanii"
                className="rounded-lg px-3 py-2 text-sm font-medium text-white/90 transition-colors duration-200 hover:bg-white/10 hover:text-white"
              >
                Campanii
              </a>
            )}
            {blogPosts.length > 0 && (
              <a
                href="#blog"
                className="rounded-lg px-3 py-2 text-sm font-medium text-white/90 transition-colors duration-200 hover:bg-white/10 hover:text-white"
              >
                Blog
              </a>
            )}
            {showContact && hasContact && (
              <a
                href="#contact"
                className="rounded-lg px-3 py-2 text-sm font-medium text-white/90 transition-colors duration-200 hover:bg-white/10 hover:text-white"
              >
                Contact
              </a>
            )}
          </div>

          {/* CTA Button */}
          {showDonation && (
            <a
              href="#donatie"
              className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold text-white shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl"
              style={{
                backgroundColor: accentColor,
                boxShadow: `0 4px 14px rgba(${accentRgb}, 0.4)`,
              }}
            >
              <Heart className="h-4 w-4" />
              <span className="hidden sm:inline">Doneaza</span>
              <span className="sm:hidden">Doneaza</span>
            </a>
          )}
        </div>

        {/* Mobile Navigation - CSS only collapsible using :target */}
        <div className="border-t border-white/10 md:hidden">
          <div className="flex flex-wrap items-center justify-center gap-1 px-4 py-2">
            <a
              href="#"
              className="rounded-md px-3 py-1.5 text-xs font-medium text-white/80 transition-colors hover:bg-white/10 hover:text-white"
            >
              Acasa
            </a>
            {(showAbout || showMission) && (
              <a
                href="#despre"
                className="rounded-md px-3 py-1.5 text-xs font-medium text-white/80 transition-colors hover:bg-white/10 hover:text-white"
              >
                Despre
              </a>
            )}
            {showCampaigns && (
              <a
                href="#campanii"
                className="rounded-md px-3 py-1.5 text-xs font-medium text-white/80 transition-colors hover:bg-white/10 hover:text-white"
              >
                Campanii
              </a>
            )}
            {blogPosts.length > 0 && (
              <a
                href="#blog"
                className="rounded-md px-3 py-1.5 text-xs font-medium text-white/80 transition-colors hover:bg-white/10 hover:text-white"
              >
                Blog
              </a>
            )}
            {showContact && hasContact && (
              <a
                href="#contact"
                className="rounded-md px-3 py-1.5 text-xs font-medium text-white/80 transition-colors hover:bg-white/10 hover:text-white"
              >
                Contact
              </a>
            )}
          </div>
        </div>
      </nav>

      {/* ── Hero Section ─────────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-16" style={{ minHeight: "85vh" }}>
        {/* Background: cover image or gradient */}
        {coverImageUrl ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={coverImageUrl}
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div
              className="absolute inset-0"
              style={{
                background: `linear-gradient(180deg, ${primaryColor}ee 0%, ${primaryColor}cc 40%, ${primaryColor}aa 70%, ${primaryColor}dd 100%)`,
              }}
            />
          </>
        ) : (
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}dd 50%, ${primaryColor}bb 100%)`,
            }}
          />
        )}

        {/* Pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />

        {/* Floating shapes */}
        <div
          className="absolute -left-32 top-1/4 h-96 w-96 rounded-full opacity-15"
          style={{ backgroundColor: accentColor, filter: "blur(100px)" }}
        />
        <div
          className="absolute -right-32 bottom-1/4 h-[500px] w-[500px] rounded-full opacity-10"
          style={{ backgroundColor: "white", filter: "blur(120px)" }}
        />

        {/* Content */}
        <div className="relative z-10 flex min-h-[85vh] items-center px-4 sm:px-6">
          <div className="mx-auto w-full max-w-6xl">
            <div className="mx-auto max-w-4xl text-center">
              {/* Organization badge */}
              <div className="mb-6 inline-flex items-center gap-3 rounded-full bg-white/15 px-5 py-2.5 backdrop-blur-md ring-1 ring-white/20">
                {ngo.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={ngo.logoUrl}
                    alt={ngo.name}
                    className="h-8 w-8 rounded-lg object-cover ring-1 ring-white/30"
                  />
                ) : (
                  <Heart className="h-5 w-5 text-white" />
                )}
                <span className="text-sm font-semibold text-white/90">{ngo.name}</span>
                {ngo.category && (
                  <>
                    <span className="h-4 w-px bg-white/30" />
                    <span className="text-xs font-medium text-white/70">{ngo.category}</span>
                  </>
                )}
              </div>

              {/* Hero Title */}
              <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-4xl md:text-5xl lg:text-6xl">
                {heroTitle}
              </h1>

              {/* Short description - always visible */}
              {(shortDescription || heroDescription) && (
                <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-white/85 sm:text-lg md:text-xl">
                  {shortDescription || heroDescription}
                </p>
              )}

              {/* Extended description if both exist */}
              {shortDescription && heroDescription && shortDescription !== heroDescription && (
                <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-white/65 sm:text-base">
                  {heroDescription}
                </p>
              )}

              {/* CTA Buttons */}
              <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
                {showDonation && (
                  <a
                    href="#donatie"
                    className="inline-flex items-center gap-2.5 rounded-full px-8 py-4 text-base font-bold shadow-xl transition-all duration-300 hover:scale-105 hover:shadow-2xl sm:text-lg"
                    style={{
                      backgroundColor: accentColor,
                      color: "white",
                      boxShadow: `0 8px 30px rgba(${accentRgb}, 0.4)`,
                    }}
                  >
                    <Heart className="h-5 w-5" />
                    {heroCtaText}
                    <ArrowRight className="h-4 w-4" />
                  </a>
                )}
                {(showAbout || showMission) && (
                  <a
                    href="#despre"
                    className="inline-flex items-center gap-2 rounded-full border-2 border-white/30 bg-white/10 px-8 py-4 text-base font-bold text-white shadow-lg backdrop-blur-sm transition-all duration-300 hover:bg-white/20 sm:text-lg"
                  >
                    Afla mai multe
                    <ChevronRight className="h-4 w-4" />
                  </a>
                )}
              </div>

              {/* Trust badges */}
              <div className="mt-12 flex flex-wrap items-center justify-center gap-4 sm:gap-6">
                {config?.cui && (
                  <span className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-medium text-white/70 backdrop-blur-sm ring-1 ring-white/10 sm:text-sm">
                    <Shield className="h-3.5 w-3.5" />
                    Organizatie inregistrata
                  </span>
                )}
                <span className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-medium text-white/70 backdrop-blur-sm ring-1 ring-white/10 sm:text-sm">
                  <Users className="h-3.5 w-3.5" />
                  {ngo.donorCountPublic || 0} donatori
                </span>
                <span className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-medium text-white/70 backdrop-blur-sm ring-1 ring-white/10 sm:text-sm">
                  <Clock className="h-3.5 w-3.5" />
                  {yearsActive} {yearsActive === 1 ? "an" : "ani"} de activitate
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom wave */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg
            viewBox="0 0 1440 120"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full"
            preserveAspectRatio="none"
          >
            <path
              d="M0 120V80C240 30 480 0 720 20C960 40 1200 80 1440 60V120H0Z"
              fill="#f9fafb"
            />
          </svg>
        </div>
      </section>

      {/* ── Main Content ─────────────────────────────────────────────── */}
      <main>
        {/* ── Campaigns Cards Section ──────────────────────────────────── */}
        {showCampaigns && (
          <section id="campanii" className="scroll-mt-20 bg-gray-50 py-16 sm:py-20">
            <div className="mx-auto max-w-6xl px-4 sm:px-6">
              <div className="mb-12 text-center">
                <div
                  className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl"
                  style={{ backgroundColor: `rgba(${accentRgb}, 0.1)` }}
                >
                  <Target className="h-7 w-7" style={{ color: accentColor }} />
                </div>
                <h2 className="text-2xl font-extrabold text-gray-900 sm:text-3xl lg:text-4xl">
                  Campanii active
                </h2>
                <p className="mx-auto mt-3 max-w-2xl text-base text-gray-500 sm:text-lg">
                  Alege cum vrei sa contribui la misiunea noastra
                </p>
              </div>

              {/* Dynamic campaigns from builder */}
              {miniSiteCampaigns.length > 0 && (
                <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 mb-12">
                  {miniSiteCampaigns.map((camp: any, idx: number) => {
                    const progress = camp.goalAmount > 0 ? Math.min(100, Math.round(((camp.raisedAmount || 0) / camp.goalAmount) * 100)) : 0;
                    return (
                      <div
                        key={camp.id || idx}
                        className="group relative overflow-hidden rounded-3xl bg-white shadow-md transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl"
                        style={{ border: `1px solid rgba(${primaryRgb}, 0.1)` }}
                      >
                        {/* Campaign image */}
                        {camp.imageUrl ? (
                          <div className="relative h-52 overflow-hidden">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={camp.imageUrl}
                              alt={camp.title}
                              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                            {/* Overlay goal on image */}
                            {camp.goalAmount > 0 && (
                              <div className="absolute bottom-4 left-4 right-4">
                                <div className="flex items-baseline justify-between text-white mb-1.5">
                                  <span className="text-lg font-extrabold">
                                    {Number(camp.raisedAmount || 0).toLocaleString("ro-RO")} RON
                                  </span>
                                  <span className="text-sm text-white/80">
                                    din {Number(camp.goalAmount).toLocaleString("ro-RO")} RON
                                  </span>
                                </div>
                                <div className="h-2 rounded-full bg-white/30 overflow-hidden">
                                  <div
                                    className="h-full rounded-full transition-all duration-1000"
                                    style={{
                                      width: `${progress}%`,
                                      background: `linear-gradient(90deg, ${accentColor}, white)`,
                                    }}
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div
                            className="relative h-40 overflow-hidden"
                            style={{ background: `linear-gradient(135deg, ${primaryColor}, ${accentColor})` }}
                          >
                            <div className="absolute inset-0 flex items-center justify-center opacity-20">
                              <Heart className="h-24 w-24 text-white" />
                            </div>
                            {/* Overlay goal on gradient */}
                            {camp.goalAmount > 0 && (
                              <div className="absolute bottom-4 left-4 right-4">
                                <div className="flex items-baseline justify-between text-white mb-1.5">
                                  <span className="text-lg font-extrabold">
                                    {Number(camp.raisedAmount || 0).toLocaleString("ro-RO")} RON
                                  </span>
                                  <span className="text-sm text-white/80">
                                    din {Number(camp.goalAmount).toLocaleString("ro-RO")} RON
                                  </span>
                                </div>
                                <div className="h-2 rounded-full bg-white/30 overflow-hidden">
                                  <div
                                    className="h-full rounded-full transition-all duration-1000"
                                    style={{
                                      width: `${progress}%`,
                                      background: `linear-gradient(90deg, ${accentColor}, white)`,
                                    }}
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        <div className="p-6">
                          <h3 className="text-lg font-bold text-gray-900 leading-snug">
                            {camp.title}
                          </h3>
                          {camp.description && (
                            <p className="mt-2 text-sm text-gray-500 leading-relaxed line-clamp-3">
                              {camp.description}
                            </p>
                          )}

                          {/* Progress text */}
                          {camp.goalAmount > 0 && (
                            <div className="mt-3 flex items-center gap-2">
                              <div
                                className="flex h-8 w-8 items-center justify-center rounded-lg"
                                style={{ backgroundColor: `rgba(${primaryRgb}, 0.1)` }}
                              >
                                <Target className="h-4 w-4" style={{ color: primaryColor }} />
                              </div>
                              <span className="text-sm font-semibold" style={{ color: primaryColor }}>
                                {progress}% din obiectiv atins
                              </span>
                            </div>
                          )}

                          {/* CTA Button - always links to platform donate page */}
                          <a
                            href={`/donate/${ngo.slug}`}
                            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-sm font-bold text-white shadow-md transition-all duration-300 hover:shadow-lg hover:scale-[1.02]"
                            style={{
                              background: `linear-gradient(135deg, ${primaryColor}, ${accentColor})`,
                              boxShadow: `0 4px 14px rgba(${primaryRgb}, 0.25)`,
                            }}
                          >
                            <Heart className="h-4 w-4" />
                            Doneaza acum
                          </a>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Static cards: Formular 230, Contract, Donate */}
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {/* Card: Formular 230 */}
                {showFormular230 && (
                  <div
                    className="group relative overflow-hidden rounded-2xl bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                    style={{ border: `1px solid rgba(${accentRgb}, 0.15)` }}
                  >
                    <div className="h-1.5" style={{ background: `linear-gradient(90deg, ${accentColor}, ${accentColor}88)` }} />
                    <div className="p-6 sm:p-8">
                      <div
                        className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl transition-transform duration-300 group-hover:scale-110"
                        style={{ backgroundColor: `rgba(${accentRgb}, 0.1)` }}
                      >
                        <FileText className="h-7 w-7" style={{ color: accentColor }} />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900">Redirectioneaza 3,5% din impozit</h3>
                      <p className="mt-3 text-sm leading-relaxed text-gray-500">
                        Completeaza Formularul 230 si redirectioneaza 3,5% din impozitul
                        pe venit. Nu te costa nimic in plus - banii ar merge oricum la stat.
                      </p>
                      <a
                        href={`/s/${ngo.slug}/formular-230`}
                        className="mt-6 inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-bold text-white shadow-md transition-all duration-300 hover:shadow-lg"
                        style={{ backgroundColor: accentColor, boxShadow: `0 4px 14px rgba(${accentRgb}, 0.3)` }}
                      >
                        Completeaza formularul
                        <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                      </a>
                    </div>
                  </div>
                )}

                {/* Card: Contract Sponsorizare */}
                {showContract && (
                  <div
                    className="group relative overflow-hidden rounded-2xl bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                    style={{ border: `1px solid rgba(${primaryRgb}, 0.15)` }}
                  >
                    <div className="h-1.5" style={{ background: `linear-gradient(90deg, ${primaryColor}, ${primaryColor}88)` }} />
                    <div className="p-6 sm:p-8">
                      <div
                        className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl transition-transform duration-300 group-hover:scale-110"
                        style={{ backgroundColor: `rgba(${primaryRgb}, 0.1)` }}
                      >
                        <Briefcase className="h-7 w-7" style={{ color: primaryColor }} />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900">Sponsorizare 20% pentru firme</h3>
                      <p className="mt-3 text-sm leading-relaxed text-gray-500">
                        Firmele pot redirectiona pana la 20% din impozitul pe profit
                        prin contracte de sponsorizare. Genereaza contractul online.
                      </p>
                      <a
                        href={`/s/${ngo.slug}/contract-sponsorizare`}
                        className="mt-6 inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-bold text-white shadow-md transition-all duration-300 hover:shadow-lg"
                        style={{ backgroundColor: primaryColor, boxShadow: `0 4px 14px rgba(${primaryRgb}, 0.3)` }}
                      >
                        Genereaza contract
                        <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                      </a>
                    </div>
                  </div>
                )}

                {/* Card: Doneaza direct */}
                {showDonation && (
                  <div
                    className="group relative overflow-hidden rounded-2xl bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                    style={{ border: `1px solid rgba(${accentRgb}, 0.15)` }}
                  >
                    <div className="h-1.5" style={{ background: `linear-gradient(90deg, ${accentColor}, ${primaryColor})` }} />
                    <div className="p-6 sm:p-8">
                      <div
                        className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl transition-transform duration-300 group-hover:scale-110"
                        style={{ background: `linear-gradient(135deg, rgba(${accentRgb}, 0.15), rgba(${primaryRgb}, 0.15))` }}
                      >
                        <Heart className="h-7 w-7" style={{ color: accentColor }} />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900">Doneaza direct</h3>
                      <p className="mt-3 text-sm leading-relaxed text-gray-500">
                        Fiecare donatie conteaza. Contribuie direct la proiectele noastre
                        si fa o diferenta reala in viata celor care au nevoie.
                      </p>
                      <a
                        href="#donatie"
                        className="mt-6 inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-bold text-white shadow-md transition-all duration-300 hover:shadow-lg"
                        style={{ background: `linear-gradient(135deg, ${accentColor}, ${primaryColor})`, boxShadow: `0 4px 14px rgba(${accentRgb}, 0.3)` }}
                      >
                        Doneaza acum
                        <Heart className="h-4 w-4 transition-transform duration-300 group-hover:scale-110" />
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* ── About & Mission Section ──────────────────────────────────── */}
        {(showAbout || showMission) && (config?.aboutText || config?.missionText) && (
          <section id="despre" className="scroll-mt-20 bg-white py-16 sm:py-20">
            <div className="mx-auto max-w-6xl px-4 sm:px-6">
              <div className="mb-12 text-center">
                <div
                  className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl"
                  style={{ backgroundColor: `rgba(${primaryRgb}, 0.1)` }}
                >
                  <Heart className="h-7 w-7" style={{ color: primaryColor }} />
                </div>
                <h2 className="text-2xl font-extrabold text-gray-900 sm:text-3xl lg:text-4xl">
                  Despre noi
                </h2>
              </div>

              <div className={`grid gap-8 ${showAbout && config?.aboutText && showMission && config?.missionText ? "lg:grid-cols-2" : "lg:grid-cols-1 lg:max-w-3xl lg:mx-auto"}`}>
                {/* About Card */}
                {showAbout && config?.aboutText && (
                  <div className="overflow-hidden rounded-2xl bg-gray-50 shadow-sm ring-1 ring-gray-100">
                    <div
                      className="h-1.5"
                      style={{
                        background: `linear-gradient(90deg, ${primaryColor}, ${accentColor})`,
                      }}
                    />
                    <div className="p-6 sm:p-8 md:p-10">
                      <div className="mb-6 flex items-center gap-3">
                        <div
                          className="flex h-11 w-11 items-center justify-center rounded-xl"
                          style={{
                            backgroundColor: `rgba(${primaryRgb}, 0.12)`,
                          }}
                        >
                          <Heart
                            className="h-5 w-5"
                            style={{ color: primaryColor }}
                          />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900">
                          Povestea noastra
                        </h3>
                      </div>
                      <p className="text-base leading-relaxed text-gray-600 sm:text-lg">
                        {config.aboutText}
                      </p>
                    </div>
                  </div>
                )}

                {/* Mission Card */}
                {showMission && config?.missionText && (
                  <div
                    className="overflow-hidden rounded-2xl shadow-sm"
                    style={{
                      backgroundColor: `rgba(${primaryRgb}, 0.04)`,
                      border: `1px solid rgba(${primaryRgb}, 0.12)`,
                    }}
                  >
                    <div
                      className="h-1.5"
                      style={{
                        background: `linear-gradient(90deg, ${accentColor}, ${primaryColor})`,
                      }}
                    />
                    <div className="p-6 sm:p-8 md:p-10">
                      <div className="mb-6 flex items-center gap-3">
                        <div
                          className="flex h-11 w-11 items-center justify-center rounded-xl"
                          style={{
                            backgroundColor: `rgba(${primaryRgb}, 0.12)`,
                          }}
                        >
                          <Target
                            className="h-5 w-5"
                            style={{ color: primaryColor }}
                          />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900">
                          Misiunea noastra
                        </h3>
                      </div>
                      <p className="text-base leading-relaxed text-gray-600 sm:text-lg">
                        {config.missionText}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* ── Impact Stats Section ─────────────────────────────────────── */}
        {showImpact && (
          <section
            className="py-16 sm:py-20"
            style={{
              background: `linear-gradient(135deg, ${primaryColor}08, ${accentColor}08)`,
            }}
          >
            <div className="mx-auto max-w-6xl px-4 sm:px-6">
              <div className="mb-12 text-center">
                <div
                  className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl"
                  style={{ backgroundColor: `rgba(${primaryRgb}, 0.1)` }}
                >
                  <TrendingUp className="h-7 w-7" style={{ color: primaryColor }} />
                </div>
                <h2 className="text-2xl font-extrabold text-gray-900 sm:text-3xl lg:text-4xl">
                  Impactul nostru
                </h2>
                {config?.impactText && (
                  <p className="mx-auto mt-3 max-w-2xl text-base text-gray-500 sm:text-lg">
                    {config.impactText}
                  </p>
                )}
              </div>

              <div className="grid gap-6 sm:grid-cols-3">
                {/* Total raised */}
                <div className="group overflow-hidden rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg sm:p-8">
                  <div
                    className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl transition-transform duration-300 group-hover:scale-110"
                    style={{
                      backgroundColor: `rgba(${primaryRgb}, 0.1)`,
                    }}
                  >
                    <TrendingUp
                      className="h-7 w-7"
                      style={{ color: primaryColor }}
                    />
                  </div>
                  <div
                    className="text-3xl font-extrabold sm:text-4xl"
                    style={{ color: primaryColor }}
                  >
                    {formatCurrency(ngo.totalRaised || 0)}
                    <span className="ml-1 text-base font-semibold text-gray-400">
                      RON
                    </span>
                  </div>
                  <p className="mt-2 text-sm font-medium text-gray-500">
                    Strangeri prin donatii
                  </p>
                </div>

                {/* Donor count */}
                <div className="group overflow-hidden rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg sm:p-8">
                  <div
                    className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl transition-transform duration-300 group-hover:scale-110"
                    style={{
                      backgroundColor: `rgba(${accentRgb}, 0.12)`,
                    }}
                  >
                    <Users
                      className="h-7 w-7"
                      style={{ color: accentColor }}
                    />
                  </div>
                  <div
                    className="text-3xl font-extrabold sm:text-4xl"
                    style={{ color: accentColor }}
                  >
                    {ngo.donorCountPublic || 0}
                  </div>
                  <p className="mt-2 text-sm font-medium text-gray-500">
                    Donatori
                  </p>
                </div>

                {/* Years active */}
                <div className="group overflow-hidden rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg sm:p-8">
                  <div
                    className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl transition-transform duration-300 group-hover:scale-110"
                    style={{
                      backgroundColor: `rgba(${primaryRgb}, 0.1)`,
                    }}
                  >
                    <Clock
                      className="h-7 w-7"
                      style={{ color: primaryColor }}
                    />
                  </div>
                  <div
                    className="text-3xl font-extrabold sm:text-4xl"
                    style={{ color: primaryColor }}
                  >
                    {yearsActive}
                  </div>
                  <p className="mt-2 text-sm font-medium text-gray-500">
                    {yearsActive === 1 ? "An de activitate" : "Ani de activitate"}
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ── Blog / News Section ──────────────────────────────────────── */}
        {blogPosts.length > 0 && (
          <section id="blog" className="scroll-mt-20 bg-white py-16 sm:py-20">
            <div className="mx-auto max-w-6xl px-4 sm:px-6">
              <div className="mb-12 text-center">
                <div
                  className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl"
                  style={{ backgroundColor: `rgba(${primaryRgb}, 0.1)` }}
                >
                  <Newspaper className="h-7 w-7" style={{ color: primaryColor }} />
                </div>
                <h2 className="text-2xl font-extrabold text-gray-900 sm:text-3xl lg:text-4xl">
                  Ultimele noutati
                </h2>
                <p className="mx-auto mt-3 max-w-2xl text-base text-gray-500 sm:text-lg">
                  Ramai la curent cu activitatile si proiectele noastre
                </p>
              </div>

              <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                {blogPosts.map((post: any) => {
                  const postExcerpt = post.excerpt || stripHtml(post.content || "").substring(0, 150);
                  const publishDate = post.publishedAt
                    ? new Date(post.publishedAt).toLocaleDateString("ro-RO", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })
                    : null;

                  return (
                    <article
                      key={post.id}
                      className="group flex flex-col overflow-hidden rounded-2xl bg-gray-50 shadow-sm ring-1 ring-gray-100 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                    >
                      {/* Cover Image */}
                      {post.coverImage && (
                        <div className="aspect-video w-full overflow-hidden">
                          <img
                            src={post.coverImage}
                            alt={post.title}
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        </div>
                      )}

                      <div className="flex flex-1 flex-col p-6">
                        {/* Category & Date */}
                        <div className="mb-3 flex flex-wrap items-center gap-2">
                          {post.category && (
                            <span
                              className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold"
                              style={{
                                backgroundColor: `rgba(${primaryRgb}, 0.1)`,
                                color: primaryColor,
                              }}
                            >
                              <Tag className="h-3 w-3" />
                              {post.category}
                            </span>
                          )}
                          {publishDate && (
                            <span className="flex items-center gap-1 text-xs text-gray-400">
                              <Calendar className="h-3 w-3" />
                              {publishDate}
                            </span>
                          )}
                        </div>

                        {/* Title */}
                        <h3 className="text-lg font-bold text-gray-900 transition-colors duration-200 group-hover:text-gray-700">
                          {post.title}
                        </h3>

                        {/* Excerpt */}
                        {postExcerpt && (
                          <p className="mt-2 flex-1 text-sm leading-relaxed text-gray-500">
                            {postExcerpt.length > 150 ? `${postExcerpt.substring(0, 150)}...` : postExcerpt}
                          </p>
                        )}

                        {/* Read more */}
                        <div className="mt-4 pt-4" style={{ borderTop: "1px solid rgba(0,0,0,0.06)" }}>
                          <span
                            className="inline-flex items-center gap-1.5 text-sm font-semibold transition-colors"
                            style={{ color: primaryColor }}
                          >
                            Citeste mai mult
                            <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" />
                          </span>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* Placeholder if no blog posts */}
        {blogPosts.length === 0 && showNewsletter && (
          <section id="blog" className="scroll-mt-20 bg-white py-16 sm:py-20">
            <div className="mx-auto max-w-6xl px-4 sm:px-6">
              <div className="mx-auto max-w-2xl text-center">
                <div
                  className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl"
                  style={{ backgroundColor: `rgba(${primaryRgb}, 0.1)` }}
                >
                  <Newspaper className="h-7 w-7" style={{ color: primaryColor }} />
                </div>
                <h2 className="text-2xl font-extrabold text-gray-900 sm:text-3xl">
                  Ramai la curent
                </h2>
                <p className="mt-3 text-base text-gray-500">
                  Aboneaza-te la newsletter-ul nostru pentru a primi cele mai noi stiri
                  si actualizari despre proiectele noastre.
                </p>
                <a
                  href="#newsletter"
                  className="mt-6 inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-bold text-white shadow-md transition-all duration-300 hover:shadow-lg"
                  style={{
                    backgroundColor: primaryColor,
                    boxShadow: `0 4px 14px rgba(${primaryRgb}, 0.3)`,
                  }}
                >
                  <Mail className="h-4 w-4" />
                  Aboneaza-te
                  <ArrowRight className="h-4 w-4" />
                </a>
              </div>
            </div>
          </section>
        )}

        {/* ── Donation Section ───────────────────────────────────────── */}
        {showDonation && (
          <section
            id="donatie"
            className="scroll-mt-20 py-16 sm:py-20"
            style={{
              background: `linear-gradient(135deg, ${primaryColor}05, ${accentColor}08, ${primaryColor}05)`,
            }}
          >
            <div className="mx-auto max-w-4xl px-4 sm:px-6">
              <div className="mb-8 text-center">
                <div
                  className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl"
                  style={{
                    background: `linear-gradient(135deg, rgba(${accentRgb}, 0.15), rgba(${primaryRgb}, 0.15))`,
                  }}
                >
                  <Heart className="h-7 w-7" style={{ color: accentColor }} />
                </div>
                <h2 className="text-2xl font-extrabold text-gray-900 sm:text-3xl lg:text-4xl">
                  Sustine cauza noastra
                </h2>
                <p className="mx-auto mt-3 max-w-xl text-base text-gray-500 sm:text-lg">
                  Fiecare donatie conteaza si face o diferenta reala in viata celor care au nevoie
                </p>
              </div>
              <MiniSiteDonation
                ngoSlug={ngo.slug}
                ngoName={ngo.name}
                consentTexts={consentTexts}
              />
            </div>
          </section>
        )}

        {/* ── Newsletter Section ─────────────────────────────────────── */}
        {showNewsletter && (
          <section id="newsletter" className="scroll-mt-20 bg-white py-16 sm:py-20">
            <div className="mx-auto max-w-4xl px-4 sm:px-6">
              <MiniSiteNewsletter
                ngoSlug={ngo.slug}
                consentTexts={consentTexts}
              />
            </div>
          </section>
        )}

        {/* ── Contact Section ────────────────────────────────────────── */}
        {showContact && hasContact && (
          <section
            id="contact"
            className="scroll-mt-20 py-16 sm:py-20"
            style={{
              background: `linear-gradient(135deg, ${primaryColor}05, ${primaryColor}08)`,
            }}
          >
            <div className="mx-auto max-w-6xl px-4 sm:px-6">
              <div className="mb-12 text-center">
                <div
                  className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl"
                  style={{ backgroundColor: `rgba(${primaryRgb}, 0.1)` }}
                >
                  <Mail className="h-7 w-7" style={{ color: primaryColor }} />
                </div>
                <h2 className="text-2xl font-extrabold text-gray-900 sm:text-3xl lg:text-4xl">
                  Contact
                </h2>
                <p className="mx-auto mt-3 max-w-2xl text-base text-gray-500 sm:text-lg">
                  Nu ezita sa ne contactezi. Suntem aici sa raspundem la intrebarile tale.
                </p>
              </div>

              <div className="mx-auto grid max-w-4xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {config?.contactEmail && (
                  <a
                    href={`mailto:${config.contactEmail}`}
                    className="group flex items-center gap-4 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                  >
                    <div
                      className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110"
                      style={{
                        backgroundColor: `rgba(${primaryRgb}, 0.1)`,
                      }}
                    >
                      <Mail
                        className="h-5 w-5"
                        style={{ color: primaryColor }}
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                        Email
                      </p>
                      <p className="mt-0.5 truncate text-sm font-bold text-gray-700">
                        {config.contactEmail}
                      </p>
                    </div>
                  </a>
                )}

                {config?.contactPhone && (
                  <a
                    href={`tel:${config.contactPhone}`}
                    className="group flex items-center gap-4 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                  >
                    <div
                      className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110"
                      style={{
                        backgroundColor: `rgba(${primaryRgb}, 0.1)`,
                      }}
                    >
                      <Phone
                        className="h-5 w-5"
                        style={{ color: primaryColor }}
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                        Telefon
                      </p>
                      <p className="mt-0.5 truncate text-sm font-bold text-gray-700">
                        {config.contactPhone}
                      </p>
                    </div>
                  </a>
                )}

                {config?.contactAddress && (
                  <div className="group flex items-center gap-4 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                    <div
                      className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl"
                      style={{
                        backgroundColor: `rgba(${primaryRgb}, 0.1)`,
                      }}
                    >
                      <MapPin
                        className="h-5 w-5"
                        style={{ color: primaryColor }}
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                        Adresa
                      </p>
                      <p className="mt-0.5 text-sm font-bold text-gray-700">
                        {config.contactAddress}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* ── Social Links Section ───────────────────────────────────── */}
        {showSocial && hasSocials && (
          <section className="bg-white py-12 sm:py-16">
            <div className="mx-auto max-w-6xl px-4 sm:px-6">
              <div className="text-center">
                <h2 className="mb-2 text-xl font-bold text-gray-900 sm:text-2xl">
                  Urmareste-ne
                </h2>
                <p className="mb-8 text-sm text-gray-500">
                  Fii la curent cu activitatile noastre pe retelele sociale
                </p>
                <div className="flex flex-wrap items-center justify-center gap-3">
                  {config?.socialFacebook && (
                    <a
                      href={config.socialFacebook}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group inline-flex items-center gap-2 rounded-full bg-gray-50 px-5 py-3 text-sm font-semibold text-gray-700 ring-1 ring-gray-200 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
                    >
                      <Globe className="h-4 w-4 transition-colors" style={{ color: "#1877F2" }} />
                      Facebook
                    </a>
                  )}

                  {config?.socialInstagram && (
                    <a
                      href={config.socialInstagram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group inline-flex items-center gap-2 rounded-full bg-gray-50 px-5 py-3 text-sm font-semibold text-gray-700 ring-1 ring-gray-200 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
                    >
                      <Instagram
                        className="h-4 w-4"
                        style={{ color: "#E4405F" }}
                      />
                      Instagram
                    </a>
                  )}

                  {config?.socialLinkedin && (
                    <a
                      href={config.socialLinkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group inline-flex items-center gap-2 rounded-full bg-gray-50 px-5 py-3 text-sm font-semibold text-gray-700 ring-1 ring-gray-200 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
                    >
                      <Linkedin
                        className="h-4 w-4"
                        style={{ color: "#0A66C2" }}
                      />
                      LinkedIn
                    </a>
                  )}

                  {config?.socialYoutube && (
                    <a
                      href={config.socialYoutube}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group inline-flex items-center gap-2 rounded-full bg-gray-50 px-5 py-3 text-sm font-semibold text-gray-700 ring-1 ring-gray-200 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
                    >
                      <Youtube
                        className="h-4 w-4"
                        style={{ color: "#FF0000" }}
                      />
                      YouTube
                    </a>
                  )}

                  {config?.socialTiktok && (
                    <a
                      href={config.socialTiktok}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group inline-flex items-center gap-2 rounded-full bg-gray-50 px-5 py-3 text-sm font-semibold text-gray-700 ring-1 ring-gray-200 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
                    >
                      <Globe className="h-4 w-4" style={{ color: "#000000" }} />
                      TikTok
                    </a>
                  )}

                  {config?.socialTwitter && (
                    <a
                      href={config.socialTwitter}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group inline-flex items-center gap-2 rounded-full bg-gray-50 px-5 py-3 text-sm font-semibold text-gray-700 ring-1 ring-gray-200 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
                    >
                      <Twitter
                        className="h-4 w-4"
                        style={{ color: "#1DA1F2" }}
                      />
                      Twitter
                    </a>
                  )}
                </div>
              </div>
            </div>
          </section>
        )}
      </main>

      {/* ── Footer ─────────────────────────────────────────────────── */}
      <footer
        style={{
          backgroundColor: `rgba(${primaryRgb}, 0.97)`,
        }}
      >
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            {/* Column 1: NGO Info */}
            <div className="lg:col-span-2">
              <div className="flex items-center gap-3">
                {ngo.logoUrl ? (
                  <img
                    src={ngo.logoUrl}
                    alt={ngo.name}
                    className="h-10 w-10 rounded-lg object-cover ring-2 ring-white/20"
                  />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/15">
                    <Heart className="h-5 w-5 text-white" />
                  </div>
                )}
                <span className="text-lg font-bold text-white">{ngo.name}</span>
              </div>

              {/* Legal info */}
              <div className="mt-4 space-y-1">
                {config?.cui && (
                  <p className="flex items-center gap-2 text-sm text-white/60">
                    <Building2 className="h-3.5 w-3.5" />
                    CUI: {config.cui}
                  </p>
                )}
                {config?.registrationNr && (
                  <p className="flex items-center gap-2 text-sm text-white/60">
                    <FileText className="h-3.5 w-3.5" />
                    Nr. inregistrare: {config.registrationNr}
                  </p>
                )}
                {config?.bankAccount && (
                  <p className="flex items-center gap-2 text-sm text-white/60">
                    <CreditCard className="h-3.5 w-3.5" />
                    {config.bankAccount}
                    {config.bankName ? ` - ${config.bankName}` : ""}
                  </p>
                )}
              </div>

              {/* Website */}
              {ngo.websiteUrl && (
                <a
                  href={ngo.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-white/70 transition-colors hover:text-white"
                >
                  <Globe className="h-3.5 w-3.5" />
                  {ngo.websiteUrl.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>

            {/* Column 2: Quick Links */}
            <div>
              <h4 className="mb-4 text-sm font-bold uppercase tracking-wider text-white/80">
                Link-uri rapide
              </h4>
              <ul className="space-y-2.5">
                {showFormular230 && (
                  <li>
                    <a
                      href={`/s/${ngo.slug}/formular-230`}
                      className="inline-flex items-center gap-2 text-sm text-white/60 transition-colors hover:text-white"
                    >
                      <ChevronRight className="h-3.5 w-3.5" />
                      Formular 230
                    </a>
                  </li>
                )}
                {showContract && (
                  <li>
                    <a
                      href={`/s/${ngo.slug}/contract-sponsorizare`}
                      className="inline-flex items-center gap-2 text-sm text-white/60 transition-colors hover:text-white"
                    >
                      <ChevronRight className="h-3.5 w-3.5" />
                      Contract sponsorizare
                    </a>
                  </li>
                )}
                {showDonation && (
                  <li>
                    <a
                      href="#donatie"
                      className="inline-flex items-center gap-2 text-sm text-white/60 transition-colors hover:text-white"
                    >
                      <ChevronRight className="h-3.5 w-3.5" />
                      Doneaza
                    </a>
                  </li>
                )}
                {showNewsletter && (
                  <li>
                    <a
                      href="#newsletter"
                      className="inline-flex items-center gap-2 text-sm text-white/60 transition-colors hover:text-white"
                    >
                      <ChevronRight className="h-3.5 w-3.5" />
                      Newsletter
                    </a>
                  </li>
                )}
                {showContact && hasContact && (
                  <li>
                    <a
                      href="#contact"
                      className="inline-flex items-center gap-2 text-sm text-white/60 transition-colors hover:text-white"
                    >
                      <ChevronRight className="h-3.5 w-3.5" />
                      Contact
                    </a>
                  </li>
                )}
              </ul>
            </div>

            {/* Column 3: Social & Contact */}
            <div>
              {hasSocials && (
                <>
                  <h4 className="mb-4 text-sm font-bold uppercase tracking-wider text-white/80">
                    Social
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {config?.socialFacebook && (
                      <a
                        href={config.socialFacebook}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-white/70 transition-all duration-200 hover:bg-white/20 hover:text-white"
                        aria-label="Facebook"
                      >
                        <Globe className="h-4 w-4" />
                      </a>
                    )}
                    {config?.socialInstagram && (
                      <a
                        href={config.socialInstagram}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-white/70 transition-all duration-200 hover:bg-white/20 hover:text-white"
                        aria-label="Instagram"
                      >
                        <Instagram className="h-4 w-4" />
                      </a>
                    )}
                    {config?.socialLinkedin && (
                      <a
                        href={config.socialLinkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-white/70 transition-all duration-200 hover:bg-white/20 hover:text-white"
                        aria-label="LinkedIn"
                      >
                        <Linkedin className="h-4 w-4" />
                      </a>
                    )}
                    {config?.socialYoutube && (
                      <a
                        href={config.socialYoutube}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-white/70 transition-all duration-200 hover:bg-white/20 hover:text-white"
                        aria-label="YouTube"
                      >
                        <Youtube className="h-4 w-4" />
                      </a>
                    )}
                    {config?.socialTiktok && (
                      <a
                        href={config.socialTiktok}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-white/70 transition-all duration-200 hover:bg-white/20 hover:text-white"
                        aria-label="TikTok"
                      >
                        <Globe className="h-4 w-4" />
                      </a>
                    )}
                    {config?.socialTwitter && (
                      <a
                        href={config.socialTwitter}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-white/70 transition-all duration-200 hover:bg-white/20 hover:text-white"
                        aria-label="Twitter"
                      >
                        <Twitter className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                </>
              )}

              {/* Footer contact info */}
              {hasContact && (
                <div className={hasSocials ? "mt-6" : ""}>
                  <h4 className="mb-3 text-sm font-bold uppercase tracking-wider text-white/80">
                    Contact
                  </h4>
                  <div className="space-y-2">
                    {config?.contactEmail && (
                      <a
                        href={`mailto:${config.contactEmail}`}
                        className="flex items-center gap-2 text-sm text-white/60 transition-colors hover:text-white"
                      >
                        <Mail className="h-3.5 w-3.5" />
                        {config.contactEmail}
                      </a>
                    )}
                    {config?.contactPhone && (
                      <a
                        href={`tel:${config.contactPhone}`}
                        className="flex items-center gap-2 text-sm text-white/60 transition-colors hover:text-white"
                      >
                        <Phone className="h-3.5 w-3.5" />
                        {config.contactPhone}
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Divider */}
          <div className="my-8 h-px w-full bg-white/10" />

          {/* Bottom footer */}
          <div className="flex flex-col items-center gap-4 text-center">
            {/* GDPR */}
            <div className="flex items-start gap-2">
              <Shield className="mt-0.5 h-4 w-4 flex-shrink-0 text-white/40" />
              <p className="max-w-xl text-xs leading-relaxed text-white/40">
                Datele tale personale sunt protejate conform Regulamentului
                General privind Protectia Datelor (GDPR). Le folosim exclusiv
                in scopul pentru care au fost colectate si nu le transmitem
                catre terti fara consimtamantul tau.
              </p>
            </div>

            {/* Copyright & Built with */}
            <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-white/40">
              <span>&copy; {new Date().getFullYear()} {ngo.name}</span>
              <span className="hidden sm:inline">|</span>
              <span>
                Construit cu{" "}
                <span
                  className="font-bold transition-colors hover:text-white/70"
                  style={{ color: `rgba(${accentRgb}, 0.7)` }}
                >
                  NGO HUB
                </span>
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

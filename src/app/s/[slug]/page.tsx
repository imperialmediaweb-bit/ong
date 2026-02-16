import { notFound } from "next/navigation";
import prisma from "@/lib/db";
import { getEffectivePlan, isSectionAllowedForPlan } from "@/lib/permissions";
import { MiniSiteNewsletter } from "@/components/minisite/newsletter-form";
import { CounterAnimation } from "@/components/minisite/counter-animation";
import { FaqAccordion } from "@/components/minisite/faq-accordion";
import { VolunteerForm } from "@/components/minisite/volunteer-form";
import { DonationPopup } from "@/components/minisite/donation-popup";
import { UrgentBanner } from "@/components/minisite/urgent-banner";
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
  Play,
  HelpCircle,
  Download,
  Star,
  MessageSquare,
  UserPlus,
  CalendarDays,
  Handshake,
  Quote,
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

function getVideoEmbedUrl(url: string): string | null {
  if (!url) return null;
  // YouTube
  const ytMatch = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]+)/
  );
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`;
  // Vimeo
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
  // Return as-is if already an embed URL
  return url;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .toUpperCase()
    .substring(0, 2);
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

  // Determine effective plan (accounts for expiration)
  const effectivePlan = getEffectivePlan(ngo);
  const isPaidPlan = effectivePlan === "PRO" || effectivePlan === "ELITE";
  const canShowSection = (section: string) => isSectionAllowedForPlan(effectivePlan, section);

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

  // Fetch blog posts (premium section, with try/catch - table might not exist)
  let blogPosts: any[] = [];
  if (!canShowSection("blog")) {
    blogPosts = [];
  } else try {
    blogPosts = await (prisma as any).blogPost.findMany({
      where: { status: "PUBLISHED", ngoId: ngo.id },
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

  // Fetch confirmed press mentions for "Suntem in presa" section
  let pressMentions: any[] = [];
  try {
    pressMentions = await prisma.mention.findMany({
      where: {
        ngoId: ngo.id,
        status: "CONFIRMED",
      },
      orderBy: { publishedAt: "desc" },
      take: 12,
      select: {
        id: true,
        title: true,
        url: true,
        snippet: true,
        publishedAt: true,
        sourceType: true,
        entities: true,
      },
    });
  } catch {
    pressMentions = [];
  }

  // Dynamic campaigns from miniSiteCampaigns field
  const miniSiteCampaigns: any[] = Array.isArray((config as any)?.miniSiteCampaigns)
    ? (config as any).miniSiteCampaigns.filter((c: any) => c.isActive)
    : [];

  const showRedirectImpozit = showFormular230 || showContract;
  const showCampaigns = miniSiteCampaigns.length > 0 && canShowSection("campaigns");
  const showPressMentions = pressMentions.length > 0;

  // ── New section data (premium sections gated by plan) ──────────
  const urgentBanner = (config as any)?.urgentBanner;
  const showUrgentBanner = urgentBanner?.active && urgentBanner?.text && canShowSection("urgentBanner");

  const videoSection = (config as any)?.videoSection;
  const videoEmbedUrl = canShowSection("videoSection") && videoSection?.url
    ? getVideoEmbedUrl(videoSection.url)
    : null;

  const teamMembers: any[] = canShowSection("teamMembers") && Array.isArray((config as any)?.teamMembers)
    ? (config as any).teamMembers
    : [];

  const testimonials: any[] = canShowSection("testimonials") && Array.isArray((config as any)?.testimonials)
    ? (config as any).testimonials
    : [];

  const partners: any[] = canShowSection("partners") && Array.isArray((config as any)?.partners)
    ? (config as any).partners
    : [];

  const counterStats: any[] = canShowSection("counterStats") && Array.isArray((config as any)?.counterStats)
    ? (config as any).counterStats
    : [];

  const events: any[] = canShowSection("events") && Array.isArray((config as any)?.events)
    ? (config as any).events
    : [];

  const faqItems: any[] = canShowSection("faqItems") && Array.isArray((config as any)?.faqItems)
    ? (config as any).faqItems
    : [];

  const transparencyDocs: any[] = canShowSection("transparencyDocs") && Array.isArray((config as any)?.transparencyDocs)
    ? (config as any).transparencyDocs
    : [];

  const showVolunteerForm = (config as any)?.showVolunteerForm === true && canShowSection("volunteerForm");

  const googleMapsUrl = canShowSection("googleMaps") ? ((config as any)?.googleMapsUrl || "") : "";

  const donationPopup = (config as any)?.donationPopup;
  const showDonationPopup = donationPopup?.active && showDonation && canShowSection("donationPopup");

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
      className="min-h-screen overflow-x-hidden bg-gray-50 antialiased"
    >
      {/* ── Urgent Banner (above everything) ───────────────────────── */}
      {showUrgentBanner && (
        <UrgentBanner
          text={urgentBanner.text}
          linkUrl={urgentBanner.linkUrl}
          linkText={urgentBanner.linkText}
          bgColor={urgentBanner.bgColor}
          primaryColor={primaryColor}
        />
      )}

      {/* ── Sticky Navigation Bar ────────────────────────────────────── */}
      <nav
        className="fixed left-0 right-0 top-0 z-50 border-b border-gray-100 bg-white shadow-sm"
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          {/* Logo + Name */}
          <a href="#" className="flex items-center gap-3 no-underline">
            {ngo.logoUrl ? (
              <img
                src={ngo.logoUrl}
                alt={ngo.name}
                className="h-10 w-auto max-w-[160px] object-contain"
              />
            ) : (
              <div
                className="flex h-9 w-9 items-center justify-center rounded-lg"
                style={{ backgroundColor: `rgba(${primaryRgb}, 0.1)` }}
              >
                <Heart className="h-5 w-5" style={{ color: primaryColor }} />
              </div>
            )}
            <span className="hidden text-base font-bold text-gray-900 sm:inline">
              {ngo.name}
            </span>
          </a>

          {/* Desktop Navigation Links */}
          <div className="hidden items-center gap-1 md:flex">
            <a
              href="#"
              className="rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition-colors duration-200 hover:bg-gray-50 hover:text-gray-900"
            >
              Acasa
            </a>
            {(showAbout || showMission) && (
              <a
                href="#despre"
                className="rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition-colors duration-200 hover:bg-gray-50 hover:text-gray-900"
              >
                Despre noi
              </a>
            )}
            {showRedirectImpozit && (
              <a
                href="#redirectioneaza"
                className="rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition-colors duration-200 hover:bg-gray-50 hover:text-gray-900"
              >
                Redirectioneaza
              </a>
            )}
            {showCampaigns && (
              <a
                href="#campanii"
                className="rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition-colors duration-200 hover:bg-gray-50 hover:text-gray-900"
              >
                Campanii
              </a>
            )}
            {blogPosts.length > 0 && (
              <a
                href="#blog"
                className="rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition-colors duration-200 hover:bg-gray-50 hover:text-gray-900"
              >
                Blog
              </a>
            )}
            {showPressMentions && (
              <a
                href="#presa"
                className="rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition-colors duration-200 hover:bg-gray-50 hover:text-gray-900"
              >
                In presa
              </a>
            )}
            {showContact && hasContact && (
              <a
                href="#contact"
                className="rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition-colors duration-200 hover:bg-gray-50 hover:text-gray-900"
              >
                Contact
              </a>
            )}
          </div>

          {/* CTA Button */}
          {showCampaigns && (
            <a
              href="#campanii"
              className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold text-white shadow-md transition-all duration-300 hover:scale-105 hover:shadow-lg"
              style={{
                backgroundColor: primaryColor,
                boxShadow: `0 4px 14px rgba(${primaryRgb}, 0.3)`,
              }}
            >
              <Heart className="h-4 w-4" />
              <span>Doneaza</span>
            </a>
          )}
        </div>

        {/* Mobile Navigation */}
        <div className="border-t border-gray-100 md:hidden">
          <div className="flex flex-wrap items-center justify-center gap-1 px-4 py-2">
            <a
              href="#"
              className="rounded-md px-3 py-1.5 text-xs font-medium text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-900"
            >
              Acasa
            </a>
            {(showAbout || showMission) && (
              <a
                href="#despre"
                className="rounded-md px-3 py-1.5 text-xs font-medium text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-900"
              >
                Despre
              </a>
            )}
            {showRedirectImpozit && (
              <a
                href="#redirectioneaza"
                className="rounded-md px-3 py-1.5 text-xs font-medium text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-900"
              >
                Redirectioneaza
              </a>
            )}
            {showCampaigns && (
              <a
                href="#campanii"
                className="rounded-md px-3 py-1.5 text-xs font-medium text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-900"
              >
                Campanii
              </a>
            )}
            {blogPosts.length > 0 && (
              <a
                href="#blog"
                className="rounded-md px-3 py-1.5 text-xs font-medium text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-900"
              >
                Blog
              </a>
            )}
            {showPressMentions && (
              <a
                href="#presa"
                className="rounded-md px-3 py-1.5 text-xs font-medium text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-900"
              >
                In presa
              </a>
            )}
            {showContact && hasContact && (
              <a
                href="#contact"
                className="rounded-md px-3 py-1.5 text-xs font-medium text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-900"
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
                background: `linear-gradient(180deg, ${primaryColor}cc 0%, ${primaryColor}99 35%, ${primaryColor}77 60%, ${primaryColor}bb 100%)`,
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
        {/* ── Redirectioneaza Impozit Section (first, right after hero) ── */}
        {showRedirectImpozit && (
          <section id="redirectioneaza" className="scroll-mt-20 bg-gray-50 py-16 sm:py-20">
            <div className="mx-auto max-w-6xl px-4 sm:px-6">
              <div className="mb-12 text-center">
                <div
                  className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl"
                  style={{ backgroundColor: `rgba(${primaryRgb}, 0.1)` }}
                >
                  <Shield className="h-7 w-7" style={{ color: primaryColor }} />
                </div>
                <h2 className="text-2xl font-extrabold text-gray-900 sm:text-3xl lg:text-4xl">
                  Redirectioneaza impozitul
                </h2>
                <p className="mx-auto mt-3 max-w-2xl text-base text-gray-500 sm:text-lg">
                  Fara costuri suplimentare - banii ar merge oricum la stat
                </p>
              </div>

              <div className="mx-auto grid max-w-4xl gap-8 sm:grid-cols-2">
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
              </div>
            </div>
          </section>
        )}

        {/* ── Campanii / Donatii Section ─────────────────────────────── */}
        {showCampaigns && (
          <section id="campanii" className={`scroll-mt-20 py-16 sm:py-20 ${showRedirectImpozit ? "bg-white" : "bg-gray-50"}`}>
            <div className="mx-auto max-w-6xl px-4 sm:px-6">
              <div className="mb-12 text-center">
                <div
                  className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl"
                  style={{ backgroundColor: `rgba(${accentRgb}, 0.1)` }}
                >
                  <Heart className="h-7 w-7" style={{ color: accentColor }} />
                </div>
                <h2 className="text-2xl font-extrabold text-gray-900 sm:text-3xl lg:text-4xl">
                  Campanii active
                </h2>
                <p className="mx-auto mt-3 max-w-2xl text-base text-gray-500 sm:text-lg">
                  Sustine campaniile noastre de strangere de fonduri
                </p>
              </div>

              <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                {miniSiteCampaigns.map((camp: any, idx: number) => {
                  const progress = camp.goalAmount > 0 ? Math.min(100, Math.round(((camp.raisedAmount || 0) / camp.goalAmount) * 100)) : 0;
                  const campaignUrl = `/s/${ngo.slug}/campanie/${camp.id}`;
                  return (
                    <a
                      href={campaignUrl}
                      key={camp.id || idx}
                      className="group relative overflow-hidden rounded-3xl bg-white shadow-md transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl block"
                      style={{ border: `1px solid rgba(${primaryRgb}, 0.1)` }}
                    >
                      {camp.imageUrl ? (
                        <div className="relative h-52 overflow-hidden">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={camp.imageUrl}
                            alt={camp.title}
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
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

                        {/* Campaign updates timeline */}
                        {Array.isArray(camp.updates) && camp.updates.length > 0 && (
                          <div className="mt-4 space-y-2 border-t pt-3">
                            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Actualizari</p>
                            <div className="space-y-1.5">
                              {[...camp.updates]
                                .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
                                .slice(0, 3)
                                .map((update: any, uIdx: number) => (
                                <div key={uIdx} className="flex items-start gap-2">
                                  <div className="mt-1.5 h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: primaryColor }} />
                                  <div className="min-w-0">
                                    <span className="text-[11px] font-semibold" style={{ color: primaryColor }}>
                                      {new Date(update.date).toLocaleDateString("ro-RO", { day: "numeric", month: "short", year: "numeric" })}
                                    </span>
                                    <p className="text-xs text-gray-600 leading-snug">{update.text}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <span
                          className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-sm font-bold text-white shadow-md transition-all duration-300 hover:shadow-lg hover:scale-[1.02]"
                          style={{
                            background: `linear-gradient(135deg, ${primaryColor}, ${accentColor})`,
                            boxShadow: `0 4px 14px rgba(${primaryRgb}, 0.25)`,
                          }}
                        >
                          <Heart className="h-4 w-4" />
                          Doneaza acum
                        </span>
                      </div>
                    </a>
                  );
                })}
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

              {/* About image - full width when present */}
              {showAbout && config?.aboutText && config?.aboutImageUrl && (
                <div className="mb-10">
                  <div className="overflow-hidden rounded-2xl bg-gray-50 shadow-sm ring-1 ring-gray-100">
                    <div
                      className="h-1.5"
                      style={{
                        background: `linear-gradient(90deg, ${primaryColor}, ${accentColor})`,
                      }}
                    />
                    <div className="grid lg:grid-cols-2">
                      <div className="relative h-64 lg:h-full lg:min-h-[320px]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={config.aboutImageUrl}
                          alt="Despre noi"
                          className="h-full w-full object-cover"
                        />
                      </div>
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
                  </div>
                </div>
              )}

              {/* Side-by-side cards when no about image */}
              {(!config?.aboutImageUrl) && (showAbout || showMission) && (
                <div className={`grid gap-8 ${
                  showAbout && config?.aboutText && showMission && config?.missionText
                    ? "lg:grid-cols-2"
                    : "mx-auto max-w-3xl"
                }`}>
                  {/* About Card - "Povestea noastra" */}
                  {showAbout && config?.aboutText && (
                    <div className="flex">
                      <div className="flex flex-col overflow-hidden rounded-2xl bg-gray-50 shadow-sm ring-1 ring-gray-100 w-full">
                        <div
                          className="h-1.5 flex-shrink-0"
                          style={{
                            background: `linear-gradient(90deg, ${primaryColor}, ${accentColor})`,
                          }}
                        />
                        <div className="flex-1 p-6 sm:p-8">
                          <div className="mb-5 flex items-center gap-3">
                            <div
                              className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl"
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
                          <p className="text-base leading-relaxed text-gray-600">
                            {config.aboutText}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Mission Card - "Misiunea noastra" */}
                  {showMission && config?.missionText && (
                    <div className="flex">
                      <div
                        className="flex flex-col overflow-hidden rounded-2xl shadow-sm w-full"
                        style={{
                          backgroundColor: `rgba(${primaryRgb}, 0.04)`,
                          border: `1px solid rgba(${primaryRgb}, 0.12)`,
                        }}
                      >
                        <div
                          className="h-1.5 flex-shrink-0"
                          style={{
                            background: `linear-gradient(90deg, ${accentColor}, ${primaryColor})`,
                          }}
                        />
                        <div className="flex-1 p-6 sm:p-8">
                          <div className="mb-5 flex items-center gap-3">
                            <div
                              className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl"
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
                          <p className="text-base leading-relaxed text-gray-600">
                            {config.missionText}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Mission Card below image layout */}
              {config?.aboutImageUrl && showMission && config?.missionText && (
                <div className="mx-auto max-w-3xl">
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
                </div>
              )}
            </div>
          </section>
        )}

        {/* ── Video Section ────────────────────────────────────────────── */}
        {videoEmbedUrl && (
          <section className="scroll-mt-20 bg-gray-50 py-16 sm:py-20">
            <div className="mx-auto max-w-6xl px-4 sm:px-6">
              <div className="mb-12 text-center">
                <div
                  className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl"
                  style={{ backgroundColor: `rgba(${accentRgb}, 0.1)` }}
                >
                  <Play className="h-7 w-7" style={{ color: accentColor }} />
                </div>
                <h2 className="text-2xl font-extrabold text-gray-900 sm:text-3xl lg:text-4xl">
                  {videoSection?.title || "Descopera povestea noastra"}
                </h2>
                {videoSection?.subtitle && (
                  <p className="mx-auto mt-3 max-w-2xl text-base text-gray-500 sm:text-lg">
                    {videoSection.subtitle}
                  </p>
                )}
              </div>

              <div className="mx-auto max-w-4xl">
                <div
                  className="overflow-hidden rounded-3xl shadow-xl ring-1 ring-gray-200"
                  style={{ boxShadow: `0 20px 60px rgba(${primaryRgb}, 0.15)` }}
                >
                  <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
                    <iframe
                      src={videoEmbedUrl}
                      title={videoSection?.title || "Video"}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="absolute inset-0 h-full w-full"
                      style={{ border: "none" }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ── Team Section ─────────────────────────────────────────────── */}
        {teamMembers.length > 0 && (
          <section id="echipa" className="scroll-mt-20 bg-white py-16 sm:py-20">
            <div className="mx-auto max-w-6xl px-4 sm:px-6">
              <div className="mb-12 text-center">
                <div
                  className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl"
                  style={{ backgroundColor: `rgba(${primaryRgb}, 0.1)` }}
                >
                  <Users className="h-7 w-7" style={{ color: primaryColor }} />
                </div>
                <h2 className="text-2xl font-extrabold text-gray-900 sm:text-3xl lg:text-4xl">
                  Echipa noastra
                </h2>
                <p className="mx-auto mt-3 max-w-2xl text-base text-gray-500 sm:text-lg">
                  Oamenii dedicati care fac totul posibil
                </p>
              </div>

              <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {teamMembers.map((member: any, idx: number) => (
                  <div
                    key={idx}
                    className="group overflow-hidden rounded-2xl bg-gray-50 shadow-sm ring-1 ring-gray-100 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                  >
                    {/* Photo or Initials */}
                    <div className="relative flex items-center justify-center overflow-hidden pt-8 pb-4">
                      {member.photoUrl ? (
                        <div
                          className="h-28 w-28 overflow-hidden rounded-2xl shadow-lg transition-transform duration-300 group-hover:scale-105"
                          style={{ boxShadow: `0 0 0 4px rgba(${primaryRgb}, 0.15), 0 10px 15px -3px rgba(0,0,0,0.1)` }}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={member.photoUrl}
                            alt={member.name}
                            className="h-full w-full object-cover"
                          />
                        </div>
                      ) : (
                        <div
                          className="flex h-28 w-28 items-center justify-center rounded-2xl text-2xl font-extrabold text-white shadow-lg transition-transform duration-300 group-hover:scale-105"
                          style={{
                            background: `linear-gradient(135deg, ${primaryColor}, ${accentColor})`,
                          }}
                        >
                          {getInitials(member.name)}
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="px-5 pb-6 text-center">
                      <h3 className="text-base font-bold text-gray-900">
                        {member.name}
                      </h3>
                      {member.role && (
                        <p
                          className="mt-1 text-sm font-semibold"
                          style={{ color: primaryColor }}
                        >
                          {member.role}
                        </p>
                      )}
                      {member.bio && (
                        <p className="mt-3 text-xs leading-relaxed text-gray-500 line-clamp-3">
                          {member.bio}
                        </p>
                      )}
                      {/* Decorative line */}
                      <div
                        className="mx-auto mt-4 h-1 w-10 rounded-full transition-all duration-300 group-hover:w-16"
                        style={{ backgroundColor: `rgba(${primaryRgb}, 0.2)` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── Testimonials Section ─────────────────────────────────────── */}
        {testimonials.length > 0 && (
          <section className="scroll-mt-20 bg-gray-50 py-16 sm:py-20">
            <div className="mx-auto max-w-6xl px-4 sm:px-6">
              <div className="mb-12 text-center">
                <div
                  className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl"
                  style={{ backgroundColor: `rgba(${accentRgb}, 0.1)` }}
                >
                  <MessageSquare className="h-7 w-7" style={{ color: accentColor }} />
                </div>
                <h2 className="text-2xl font-extrabold text-gray-900 sm:text-3xl lg:text-4xl">
                  Ce spun sustinatorii nostri
                </h2>
                <p className="mx-auto mt-3 max-w-2xl text-base text-gray-500 sm:text-lg">
                  Povesti reale de la oamenii care ne-au sprijinit
                </p>
              </div>

              <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                {testimonials.map((testimonial: any, idx: number) => (
                  <div
                    key={idx}
                    className="group relative overflow-hidden rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg sm:p-8"
                  >
                    {/* Large decorative quote */}
                    <div
                      className="absolute -right-2 -top-2 text-8xl font-serif leading-none opacity-[0.07]"
                      style={{ color: primaryColor }}
                    >
                      &ldquo;
                    </div>

                    {/* Top accent bar */}
                    <div
                      className="absolute left-0 top-0 h-1 w-full"
                      style={{
                        background: `linear-gradient(90deg, ${primaryColor}, ${accentColor})`,
                      }}
                    />

                    {/* Stars */}
                    <div className="mb-4 flex gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className="h-4 w-4"
                          style={{ color: accentColor, fill: accentColor }}
                        />
                      ))}
                    </div>

                    {/* Quote text */}
                    <p className="relative z-10 text-sm leading-relaxed text-gray-600 italic sm:text-base">
                      &ldquo;{testimonial.text}&rdquo;
                    </p>

                    {/* Author */}
                    <div className="mt-6 flex items-center gap-3">
                      {testimonial.photoUrl ? (
                        <div className="h-10 w-10 overflow-hidden rounded-full" style={{ boxShadow: `0 0 0 2px rgba(${primaryRgb}, 0.15)` }}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={testimonial.photoUrl}
                            alt={testimonial.name}
                            className="h-full w-full object-cover"
                          />
                        </div>
                      ) : (
                        <div
                          className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white"
                          style={{
                            background: `linear-gradient(135deg, ${primaryColor}, ${accentColor})`,
                          }}
                        >
                          {getInitials(testimonial.name)}
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-bold text-gray-900">
                          {testimonial.name}
                        </p>
                        {testimonial.role && (
                          <p className="text-xs text-gray-400">
                            {testimonial.role}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── Partners Section ─────────────────────────────────────────── */}
        {partners.length > 0 && (
          <section className="scroll-mt-20 bg-white py-16 sm:py-20">
            <div className="mx-auto max-w-6xl px-4 sm:px-6">
              <div className="mb-12 text-center">
                <div
                  className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl"
                  style={{ backgroundColor: `rgba(${primaryRgb}, 0.1)` }}
                >
                  <Handshake className="h-7 w-7" style={{ color: primaryColor }} />
                </div>
                <h2 className="text-2xl font-extrabold text-gray-900 sm:text-3xl lg:text-4xl">
                  Partenerii nostri
                </h2>
                <p className="mx-auto mt-3 max-w-2xl text-base text-gray-500 sm:text-lg">
                  Impreuna facem mai mult. Multumim partenerilor nostri!
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-8">
                {partners.map((partner: any, idx: number) => {
                  const PartnerWrapper = partner.websiteUrl ? "a" : "div";
                  const linkProps = partner.websiteUrl
                    ? { href: partner.websiteUrl, target: "_blank", rel: "noopener noreferrer" }
                    : {};
                  return (
                    <PartnerWrapper
                      key={idx}
                      {...linkProps}
                      className="group flex h-24 w-40 items-center justify-center overflow-hidden rounded-2xl bg-gray-50 p-4 shadow-sm ring-1 ring-gray-100 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg sm:h-28 sm:w-48"
                    >
                      {partner.logoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={partner.logoUrl}
                          alt={partner.name}
                          className="max-h-full max-w-full object-contain opacity-70 transition-opacity duration-300 group-hover:opacity-100"
                        />
                      ) : (
                        <div className="text-center">
                          <div
                            className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-xl"
                            style={{ backgroundColor: `rgba(${primaryRgb}, 0.08)` }}
                          >
                            <Building2 className="h-5 w-5 text-gray-400 transition-colors duration-300 group-hover:text-gray-600" />
                          </div>
                          <span className="text-xs font-semibold text-gray-500 transition-colors duration-300 group-hover:text-gray-700">
                            {partner.name}
                          </span>
                        </div>
                      )}
                    </PartnerWrapper>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* ── Impact / Counter Stats Section ───────────────────────────── */}
        {showImpact && (
          <section
            id="impact"
            className="scroll-mt-20 py-16 sm:py-20"
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

              {/* Use animated CounterAnimation if counterStats exist, else fallback to static */}
              {counterStats.length > 0 ? (
                <CounterAnimation
                  stats={counterStats}
                  primaryColor={primaryColor}
                  accentColor={accentColor}
                  primaryRgb={primaryRgb}
                  accentRgb={accentRgb}
                />
              ) : (
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
              )}
            </div>
          </section>
        )}

        {/* ── Events Section ───────────────────────────────────────────── */}
        {events.length > 0 && (
          <section id="evenimente" className="scroll-mt-20 bg-white py-16 sm:py-20">
            <div className="mx-auto max-w-6xl px-4 sm:px-6">
              <div className="mb-12 text-center">
                <div
                  className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl"
                  style={{ backgroundColor: `rgba(${accentRgb}, 0.1)` }}
                >
                  <CalendarDays className="h-7 w-7" style={{ color: accentColor }} />
                </div>
                <h2 className="text-2xl font-extrabold text-gray-900 sm:text-3xl lg:text-4xl">
                  Evenimente
                </h2>
                <p className="mx-auto mt-3 max-w-2xl text-base text-gray-500 sm:text-lg">
                  Participa la evenimentele noastre si fii parte din comunitate
                </p>
              </div>

              <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                {events.map((event: any, idx: number) => {
                  const eventDate = event.date ? new Date(event.date) : null;
                  const day = eventDate
                    ? eventDate.toLocaleDateString("ro-RO", { day: "numeric" })
                    : "";
                  const month = eventDate
                    ? eventDate.toLocaleDateString("ro-RO", { month: "short" }).toUpperCase()
                    : "";
                  const fullDate = eventDate
                    ? eventDate.toLocaleDateString("ro-RO", { day: "numeric", month: "long", year: "numeric" })
                    : "";

                  return (
                    <div
                      key={idx}
                      className="group relative flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-100 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                    >
                      {/* Event Image */}
                      {event.imageUrl ? (
                        <div className="relative h-48 overflow-hidden">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={event.imageUrl}
                            alt={event.title}
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                          {/* Date badge over image */}
                          {eventDate && (
                            <div
                              className="absolute bottom-4 left-4 flex h-16 w-16 flex-col items-center justify-center rounded-xl text-white shadow-lg"
                              style={{
                                background: `linear-gradient(135deg, ${primaryColor}, ${accentColor})`,
                              }}
                            >
                              <span className="text-xl font-extrabold leading-none">{day}</span>
                              <span className="mt-0.5 text-[9px] font-bold uppercase tracking-wider opacity-80">{month}</span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div
                          className="relative flex h-32 items-end overflow-hidden p-4"
                          style={{ background: `linear-gradient(135deg, ${primaryColor}15, ${accentColor}15)` }}
                        >
                          <div
                            className="absolute right-4 top-4 flex h-12 w-12 items-center justify-center rounded-xl opacity-15"
                          >
                            <CalendarDays className="h-16 w-16" style={{ color: primaryColor }} />
                          </div>
                          {/* Date badge */}
                          {eventDate && (
                            <div
                              className="flex h-16 w-16 flex-col items-center justify-center rounded-xl text-white shadow-md"
                              style={{
                                background: `linear-gradient(135deg, ${primaryColor}, ${accentColor})`,
                              }}
                            >
                              <span className="text-xl font-extrabold leading-none">{day}</span>
                              <span className="mt-0.5 text-[9px] font-bold uppercase tracking-wider opacity-80">{month}</span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Event content */}
                      <div className="flex flex-1 flex-col p-6">
                        <h3 className="text-lg font-bold text-gray-900 leading-snug">
                          {event.title}
                        </h3>

                        <div className="mt-3 flex flex-col gap-2">
                          {fullDate && (
                            <p className="flex items-center gap-2 text-xs font-medium text-gray-500">
                              <Calendar className="h-3.5 w-3.5" style={{ color: accentColor }} />
                              {fullDate}
                            </p>
                          )}
                          {event.location && (
                            <p className="flex items-center gap-2 text-xs font-medium text-gray-500">
                              <MapPin className="h-3.5 w-3.5" style={{ color: primaryColor }} />
                              {event.location}
                            </p>
                          )}
                        </div>

                        {event.description && (
                          <p className="mt-3 flex-1 text-sm leading-relaxed text-gray-500 line-clamp-3">
                            {event.description}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* ── FAQ Section ──────────────────────────────────────────────── */}
        {faqItems.length > 0 && (
          <section id="faq" className="scroll-mt-20 bg-gray-50 py-16 sm:py-20">
            <div className="mx-auto max-w-6xl px-4 sm:px-6">
              <div className="mb-12 text-center">
                <div
                  className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl"
                  style={{ backgroundColor: `rgba(${primaryRgb}, 0.1)` }}
                >
                  <HelpCircle className="h-7 w-7" style={{ color: primaryColor }} />
                </div>
                <h2 className="text-2xl font-extrabold text-gray-900 sm:text-3xl lg:text-4xl">
                  Intrebari frecvente
                </h2>
                <p className="mx-auto mt-3 max-w-2xl text-base text-gray-500 sm:text-lg">
                  Raspunsuri la cele mai comune intrebari
                </p>
              </div>

              <div className="mx-auto max-w-3xl">
                <FaqAccordion
                  items={faqItems}
                  primaryColor={primaryColor}
                  primaryRgb={primaryRgb}
                />
              </div>
            </div>
          </section>
        )}

        {/* ── Transparency Documents Section ───────────────────────────── */}
        {transparencyDocs.length > 0 && (
          <section id="transparenta" className="scroll-mt-20 bg-white py-16 sm:py-20">
            <div className="mx-auto max-w-6xl px-4 sm:px-6">
              <div className="mb-12 text-center">
                <div
                  className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl"
                  style={{ backgroundColor: `rgba(${accentRgb}, 0.1)` }}
                >
                  <Shield className="h-7 w-7" style={{ color: accentColor }} />
                </div>
                <h2 className="text-2xl font-extrabold text-gray-900 sm:text-3xl lg:text-4xl">
                  Transparenta
                </h2>
                <p className="mx-auto mt-3 max-w-2xl text-base text-gray-500 sm:text-lg">
                  Rapoarte si documente publice ale organizatiei
                </p>
              </div>

              <div className="mx-auto grid max-w-4xl gap-4 sm:grid-cols-2">
                {transparencyDocs.map((doc: any, idx: number) => (
                  <a
                    key={idx}
                    href={doc.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center gap-4 overflow-hidden rounded-2xl bg-gray-50 p-5 shadow-sm ring-1 ring-gray-100 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg sm:p-6"
                  >
                    {/* PDF Icon */}
                    <div
                      className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl transition-transform duration-300 group-hover:scale-110"
                      style={{ backgroundColor: `rgba(${primaryRgb}, 0.1)` }}
                    >
                      <FileText className="h-7 w-7" style={{ color: primaryColor }} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-bold text-gray-900 sm:text-base">
                        {doc.title}
                      </h3>
                      {doc.description && (
                        <p className="mt-1 text-xs leading-relaxed text-gray-400 line-clamp-2">
                          {doc.description}
                        </p>
                      )}
                    </div>
                    <Download
                      className="h-5 w-5 flex-shrink-0 text-gray-300 transition-colors duration-300 group-hover:text-gray-600"
                    />
                  </a>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── Volunteer Form Section ───────────────────────────────────── */}
        {showVolunteerForm && (
          <section id="voluntariat" className="scroll-mt-20 bg-gray-50 py-16 sm:py-20">
            <div className="mx-auto max-w-6xl px-4 sm:px-6">
              <div className="mb-12 text-center">
                <div
                  className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl"
                  style={{ backgroundColor: `rgba(${primaryRgb}, 0.1)` }}
                >
                  <UserPlus className="h-7 w-7" style={{ color: primaryColor }} />
                </div>
                <h2 className="text-2xl font-extrabold text-gray-900 sm:text-3xl lg:text-4xl">
                  Devino voluntar
                </h2>
                <p className="mx-auto mt-3 max-w-2xl text-base text-gray-500 sm:text-lg">
                  Alatura-te echipei noastre de voluntari si fa o diferenta
                </p>
              </div>

              <div className="mx-auto max-w-2xl">
                <VolunteerForm
                  ngoSlug={ngo.slug}
                  ngoName={ngo.name}
                  primaryColor={primaryColor}
                  primaryRgb={primaryRgb}
                  accentColor={accentColor}
                  accentRgb={accentRgb}
                />
              </div>
            </div>
          </section>
        )}

        {/* ── Google Maps Section ──────────────────────────────────────── */}
        {googleMapsUrl && (
          <section className="scroll-mt-20 bg-white py-16 sm:py-20">
            <div className="mx-auto max-w-6xl px-4 sm:px-6">
              <div className="mb-12 text-center">
                <div
                  className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl"
                  style={{ backgroundColor: `rgba(${accentRgb}, 0.1)` }}
                >
                  <MapPin className="h-7 w-7" style={{ color: accentColor }} />
                </div>
                <h2 className="text-2xl font-extrabold text-gray-900 sm:text-3xl lg:text-4xl">
                  Unde ne gasesti
                </h2>
                <p className="mx-auto mt-3 max-w-2xl text-base text-gray-500 sm:text-lg">
                  Vino sa ne vizitezi sau contacteaza-ne pentru mai multe detalii
                </p>
              </div>

              <div
                className="mx-auto max-w-4xl overflow-hidden rounded-3xl shadow-lg ring-1 ring-gray-200"
                style={{ boxShadow: `0 10px 40px rgba(${primaryRgb}, 0.1)` }}
              >
                <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
                  <iframe
                    src={googleMapsUrl}
                    title="Locatie pe harta"
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    className="absolute inset-0 h-full w-full"
                    style={{ border: "none" }}
                  />
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ── Suntem in presa Section ─────────────────────────────────── */}
        {showPressMentions && (
          <section id="presa" className="scroll-mt-20 bg-white py-16 sm:py-20">
            <div className="mx-auto max-w-6xl px-4 sm:px-6">
              <div className="mb-12 text-center">
                <div
                  className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl"
                  style={{ backgroundColor: `rgba(${primaryRgb}, 0.1)` }}
                >
                  <Newspaper className="h-7 w-7" style={{ color: primaryColor }} />
                </div>
                <h2 className="text-2xl font-extrabold text-gray-900 sm:text-3xl lg:text-4xl">
                  Suntem in presa
                </h2>
                <p className="mx-auto mt-3 max-w-2xl text-base text-gray-500 sm:text-lg">
                  Articole si mentiuni despre activitatea noastra in publicatiile din Romania
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {pressMentions.map((mention: any) => {
                  const sourceName = mention.entities?.sourceName || (() => {
                    try { return new URL(mention.url).hostname.replace(/^www\./, ""); } catch { return ""; }
                  })();
                  return (
                    <a
                      key={mention.id}
                      href={mention.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group relative overflow-hidden rounded-2xl bg-gray-50 p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                      style={{ border: `1px solid rgba(${primaryRgb}, 0.1)` }}
                    >
                      <div className="mb-3 flex items-center gap-2">
                        <div
                          className="flex h-8 w-8 items-center justify-center rounded-lg"
                          style={{ backgroundColor: `rgba(${primaryRgb}, 0.1)` }}
                        >
                          <Newspaper className="h-4 w-4" style={{ color: primaryColor }} />
                        </div>
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          {sourceName}
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-gray-900 leading-snug line-clamp-2 group-hover:text-gray-700 transition-colors">
                        {mention.title}
                      </h3>
                      {mention.snippet && (
                        <p className="mt-2 text-xs text-gray-500 leading-relaxed line-clamp-2">
                          {mention.snippet}
                        </p>
                      )}
                      {mention.publishedAt && (
                        <p className="mt-3 text-[11px] text-gray-400">
                          {new Date(mention.publishedAt).toLocaleDateString("ro-RO", { day: "numeric", month: "long", year: "numeric" })}
                        </p>
                      )}
                    </a>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* ── Blog / News Section ──────────────────────────────────────── */}
        {blogPosts.length > 0 && (
          <section id="blog" className="scroll-mt-20 bg-gray-50 py-16 sm:py-20">
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
                    <a
                      href={`/s/${ngo.slug}/blog/${post.slug}`}
                      key={post.id}
                      className="group flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-100 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
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
                    </a>
                  );
                })}
              </div>

              {/* See all blog posts link */}
              <div className="mt-10 text-center">
                <a
                  href={`/s/${ngo.slug}/blog`}
                  className="inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-bold transition-all duration-300 hover:shadow-lg"
                  style={{
                    color: primaryColor,
                    border: `2px solid ${primaryColor}`,
                  }}
                >
                  Toate articolele
                  <ArrowRight className="h-4 w-4" />
                </a>
              </div>
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
                <li>
                  <a
                    href={`/s/${ngo.slug}/termeni-si-conditii`}
                    className="inline-flex items-center gap-2 text-sm text-white/60 transition-colors hover:text-white"
                  >
                    <ChevronRight className="h-3.5 w-3.5" />
                    Termeni si Conditii
                  </a>
                </li>
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
                catre terti fara consimtamantul tau.{" "}
                <a href={`/s/${ngo.slug}/termeni-si-conditii`} className="underline hover:text-white/60">
                  Citeste Termenii si Conditiile
                </a>
              </p>
            </div>

            {/* Copyright & Built with (branding shown only on free plan) */}
            <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-white/40">
              <span>&copy; {new Date().getFullYear()} {ngo.name}</span>
              {!isPaidPlan && (
                <>
                  <span className="hidden sm:inline">|</span>
                  <span>
                    Construit cu{" "}
                    <a
                      href="https://binevo.ro"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-bold transition-colors hover:text-white/70"
                      style={{ color: `rgba(${accentRgb}, 0.7)` }}
                    >
                      Binevo
                    </a>
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      </footer>

      {/* ── Donation Popup (outside main) ──────────────────────────── */}
      {showDonationPopup && (
        <DonationPopup
          delay={donationPopup.delay || 15}
          text={donationPopup.text || ""}
          ngoSlug={ngo.slug}
          primaryColor={primaryColor}
          accentColor={accentColor}
          primaryRgb={primaryRgb}
          accentRgb={accentRgb}
        />
      )}
    </div>
  );
}

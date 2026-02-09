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
  const heroCtaText = config?.heroCtaText || "Doneaza acum";

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

  return (
    <div
      style={
        {
          "--color-primary": primaryColor,
          "--color-primary-rgb": primaryRgb,
          "--color-accent": accentColor,
          "--color-accent-rgb": accentRgb,
        } as React.CSSProperties
      }
      className="min-h-screen bg-gray-50 antialiased"
    >
      {/* ── Hero Section ─────────────────────────────────────────────── */}
      <section
        className="relative overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}dd 50%, ${primaryColor}bb 100%)`,
        }}
      >
        {/* Pattern overlay */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />

        <div className="relative z-10 px-4 py-20 sm:py-28 md:py-32">
          <div className="mx-auto max-w-3xl text-center">
            {/* Logo */}
            {ngo.logoUrl ? (
              <div className="mb-8 flex justify-center">
                <div className="rounded-2xl bg-white/20 p-2 shadow-lg backdrop-blur-sm">
                  <img
                    src={ngo.logoUrl}
                    alt={ngo.name}
                    className="h-20 w-20 rounded-xl object-cover sm:h-24 sm:w-24"
                  />
                </div>
              </div>
            ) : (
              <div className="mb-8 flex justify-center">
                <div className="rounded-2xl bg-white/20 p-4 shadow-lg backdrop-blur-sm">
                  <Heart className="h-12 w-12 text-white sm:h-14 sm:w-14" />
                </div>
              </div>
            )}

            {/* Title */}
            <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl md:text-5xl lg:text-6xl">
              {heroTitle}
            </h1>

            {/* Description */}
            {heroDescription && (
              <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-white/90 sm:text-xl">
                {heroDescription}
              </p>
            )}

            {/* CTA Button */}
            {showDonation && (
              <div className="mt-10">
                <a
                  href="#donatie"
                  className="inline-flex items-center gap-2 rounded-full bg-white px-8 py-4 text-base font-bold shadow-xl transition-all duration-300 hover:scale-105 hover:shadow-2xl sm:text-lg"
                  style={{ color: primaryColor }}
                >
                  <Heart className="h-5 w-5" />
                  {heroCtaText}
                  <ArrowRight className="h-4 w-4" />
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Bottom wave */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg
            viewBox="0 0 1440 80"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full"
          >
            <path
              d="M0 80V40C240 0 480 0 720 20C960 40 1200 60 1440 40V80H0Z"
              fill="#f9fafb"
            />
          </svg>
        </div>
      </section>

      {/* ── Main Content ─────────────────────────────────────────────── */}
      <main className="mx-auto max-w-4xl px-4 pb-12">
        {/* ── About Section ──────────────────────────────────────────── */}
        {showAbout && config?.aboutText && (
          <section className="mt-12 sm:mt-16">
            <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-100">
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
                      backgroundColor: `rgba(${primaryRgb}, 0.1)`,
                    }}
                  >
                    <Heart
                      className="h-5 w-5"
                      style={{ color: primaryColor }}
                    />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    Despre noi
                  </h2>
                </div>
                <p className="text-base leading-relaxed text-gray-600 sm:text-lg">
                  {config.aboutText}
                </p>
              </div>
            </div>
          </section>
        )}

        {/* ── Mission Section ────────────────────────────────────────── */}
        {showMission && config?.missionText && (
          <section className="mt-10 sm:mt-12">
            <div
              className="overflow-hidden rounded-2xl shadow-sm"
              style={{
                backgroundColor: `rgba(${primaryRgb}, 0.04)`,
                border: `1px solid rgba(${primaryRgb}, 0.1)`,
              }}
            >
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
                  <h2 className="text-2xl font-bold text-gray-900">
                    Misiunea noastra
                  </h2>
                </div>
                <p className="text-base leading-relaxed text-gray-600 sm:text-lg">
                  {config.missionText}
                </p>
              </div>
            </div>
          </section>
        )}

        {/* ── Impact Section ─────────────────────────────────────────── */}
        {showImpact && (
          <section className="mt-10 sm:mt-12">
            <div className="mb-8 text-center">
              <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">
                Impactul nostru
              </h2>
              {config?.impactText && (
                <p className="mx-auto mt-3 max-w-2xl text-gray-500">
                  {config.impactText}
                </p>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-3 sm:gap-6">
              {/* Total raised */}
              <div className="group rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100 transition-all duration-300 hover:shadow-md sm:p-8">
                <div
                  className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110"
                  style={{
                    backgroundColor: `rgba(${primaryRgb}, 0.1)`,
                  }}
                >
                  <TrendingUp
                    className="h-6 w-6"
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
                <p className="mt-1 text-sm font-medium text-gray-500">
                  Strangeri prin donatii
                </p>
              </div>

              {/* Donor count */}
              <div className="group rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100 transition-all duration-300 hover:shadow-md sm:p-8">
                <div
                  className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110"
                  style={{
                    backgroundColor: `rgba(${accentRgb}, 0.12)`,
                  }}
                >
                  <Users
                    className="h-6 w-6"
                    style={{ color: accentColor }}
                  />
                </div>
                <div
                  className="text-3xl font-extrabold sm:text-4xl"
                  style={{ color: accentColor }}
                >
                  {ngo.donorCountPublic || 0}
                </div>
                <p className="mt-1 text-sm font-medium text-gray-500">
                  Donatori
                </p>
              </div>

              {/* Years active */}
              <div className="group rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100 transition-all duration-300 hover:shadow-md sm:p-8">
                <div
                  className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110"
                  style={{
                    backgroundColor: `rgba(${primaryRgb}, 0.1)`,
                  }}
                >
                  <Clock
                    className="h-6 w-6"
                    style={{ color: primaryColor }}
                  />
                </div>
                <div
                  className="text-3xl font-extrabold sm:text-4xl"
                  style={{ color: primaryColor }}
                >
                  {yearsActive}
                </div>
                <p className="mt-1 text-sm font-medium text-gray-500">
                  {yearsActive === 1 ? "An de activitate" : "Ani de activitate"}
                </p>
              </div>
            </div>
          </section>
        )}

        {/* ── Donation Section ───────────────────────────────────────── */}
        {showDonation && (
          <section id="donatie" className="mt-10 scroll-mt-8 sm:mt-12">
            <div className="mb-6 text-center">
              <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">
                Sustine cauza noastra
              </h2>
              <p className="mt-2 text-gray-500">
                Fiecare donatie conteaza si face o diferenta reala
              </p>
            </div>
            <MiniSiteDonation
              ngoSlug={ngo.slug}
              ngoName={ngo.name}
              consentTexts={consentTexts}
            />
          </section>
        )}

        {/* ── Newsletter Section ─────────────────────────────────────── */}
        {showNewsletter && (
          <section className="mt-10 sm:mt-12">
            <MiniSiteNewsletter
              ngoSlug={ngo.slug}
              consentTexts={consentTexts}
            />
          </section>
        )}

        {/* ── Formular 230 Section ───────────────────────────────────── */}
        {showFormular230 && (
          <section className="mt-10 sm:mt-12">
            <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-100">
              <div
                className="h-1.5"
                style={{
                  background: `linear-gradient(90deg, ${accentColor}, ${primaryColor})`,
                }}
              />
              <div className="p-6 sm:p-8">
                <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-4">
                    <div
                      className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl"
                      style={{
                        backgroundColor: `rgba(${accentRgb}, 0.12)`,
                      }}
                    >
                      <FileText
                        className="h-6 w-6"
                        style={{ color: accentColor }}
                      />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">
                        Formular 230 - Redirectioneaza 3,5%
                      </h3>
                      <p className="mt-1 text-sm leading-relaxed text-gray-500">
                        Poti redirectiona 3,5% din impozitul pe venit catre
                        organizatia noastra, fara niciun cost suplimentar
                        pentru tine. Completeaza formularul 230 si contribuie
                        la cauza noastra.
                      </p>
                    </div>
                  </div>
                  <a
                    href={`/s/${ngo.slug}/formular-230`}
                    className="inline-flex flex-shrink-0 items-center gap-2 rounded-xl px-6 py-3 text-sm font-bold text-white shadow-sm transition-all duration-300 hover:shadow-md"
                    style={{ backgroundColor: accentColor }}
                  >
                    Completeaza formularul
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ── Contract Sponsorizare Section ───────────────────────────── */}
        {showContract && (
          <section className="mt-10 sm:mt-12">
            <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-100">
              <div
                className="h-1.5"
                style={{
                  background: `linear-gradient(90deg, ${primaryColor}, ${accentColor})`,
                }}
              />
              <div className="p-6 sm:p-8">
                <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-4">
                    <div
                      className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl"
                      style={{
                        backgroundColor: `rgba(${primaryRgb}, 0.1)`,
                      }}
                    >
                      <Briefcase
                        className="h-6 w-6"
                        style={{ color: primaryColor }}
                      />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">
                        Contract de Sponsorizare
                      </h3>
                      <p className="mt-1 text-sm leading-relaxed text-gray-500">
                        Firmele pot redirectiona pana la 20% din impozitul pe
                        profit prin contracte de sponsorizare. Sustine cauza
                        noastra prin compania ta.
                      </p>
                    </div>
                  </div>
                  <a
                    href={`/s/${ngo.slug}/contract-sponsorizare`}
                    className="inline-flex flex-shrink-0 items-center gap-2 rounded-xl px-6 py-3 text-sm font-bold text-white shadow-sm transition-all duration-300 hover:shadow-md"
                    style={{ backgroundColor: primaryColor }}
                  >
                    Genereaza contract
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ── Contact Section ────────────────────────────────────────── */}
        {showContact && hasContact && (
          <section className="mt-10 sm:mt-12">
            <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-100">
              <div className="p-6 sm:p-8">
                <div className="mb-6 flex items-center gap-3">
                  <div
                    className="flex h-11 w-11 items-center justify-center rounded-xl"
                    style={{
                      backgroundColor: `rgba(${primaryRgb}, 0.1)`,
                    }}
                  >
                    <Mail
                      className="h-5 w-5"
                      style={{ color: primaryColor }}
                    />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    Contact
                  </h2>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {config?.contactEmail && (
                    <a
                      href={`mailto:${config.contactEmail}`}
                      className="group flex items-center gap-3 rounded-xl bg-gray-50 p-4 transition-colors duration-200 hover:bg-gray-100"
                    >
                      <div
                        className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg"
                        style={{
                          backgroundColor: `rgba(${primaryRgb}, 0.1)`,
                        }}
                      >
                        <Mail
                          className="h-4 w-4"
                          style={{ color: primaryColor }}
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-gray-400">
                          Email
                        </p>
                        <p className="truncate text-sm font-semibold text-gray-700">
                          {config.contactEmail}
                        </p>
                      </div>
                    </a>
                  )}

                  {config?.contactPhone && (
                    <a
                      href={`tel:${config.contactPhone}`}
                      className="group flex items-center gap-3 rounded-xl bg-gray-50 p-4 transition-colors duration-200 hover:bg-gray-100"
                    >
                      <div
                        className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg"
                        style={{
                          backgroundColor: `rgba(${primaryRgb}, 0.1)`,
                        }}
                      >
                        <Phone
                          className="h-4 w-4"
                          style={{ color: primaryColor }}
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-gray-400">
                          Telefon
                        </p>
                        <p className="truncate text-sm font-semibold text-gray-700">
                          {config.contactPhone}
                        </p>
                      </div>
                    </a>
                  )}

                  {config?.contactAddress && (
                    <div className="flex items-center gap-3 rounded-xl bg-gray-50 p-4">
                      <div
                        className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg"
                        style={{
                          backgroundColor: `rgba(${primaryRgb}, 0.1)`,
                        }}
                      >
                        <MapPin
                          className="h-4 w-4"
                          style={{ color: primaryColor }}
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-gray-400">
                          Adresa
                        </p>
                        <p className="text-sm font-semibold text-gray-700">
                          {config.contactAddress}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ── Social Links Section ───────────────────────────────────── */}
        {showSocial && hasSocials && (
          <section className="mt-10 sm:mt-12">
            <div className="text-center">
              <h2 className="mb-6 text-xl font-bold text-gray-900">
                Urmareste-ne
              </h2>
              <div className="flex flex-wrap items-center justify-center gap-3">
                {config?.socialFacebook && (
                  <a
                    href={config.socialFacebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 shadow-sm ring-1 ring-gray-200 transition-all duration-200 hover:shadow-md"
                    style={{
                      ["--hover-color" as string]: primaryColor,
                    }}
                  >
                    <Globe className="h-4 w-4" style={{ color: "#1877F2" }} />
                    Facebook
                  </a>
                )}

                {config?.socialInstagram && (
                  <a
                    href={config.socialInstagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 shadow-sm ring-1 ring-gray-200 transition-all duration-200 hover:shadow-md"
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
                    className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 shadow-sm ring-1 ring-gray-200 transition-all duration-200 hover:shadow-md"
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
                    className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 shadow-sm ring-1 ring-gray-200 transition-all duration-200 hover:shadow-md"
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
                    className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 shadow-sm ring-1 ring-gray-200 transition-all duration-200 hover:shadow-md"
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
                    className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 shadow-sm ring-1 ring-gray-200 transition-all duration-200 hover:shadow-md"
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
          </section>
        )}
      </main>

      {/* ── Footer ─────────────────────────────────────────────────── */}
      <footer
        className="mt-16"
        style={{
          backgroundColor: `rgba(${primaryRgb}, 0.04)`,
          borderTop: `1px solid rgba(${primaryRgb}, 0.08)`,
        }}
      >
        <div className="mx-auto max-w-4xl px-4 py-10 sm:py-12">
          <div className="text-center">
            {/* NGO name and CUI */}
            <p className="text-base font-bold text-gray-800">{ngo.name}</p>
            {config?.cui && (
              <p className="mt-1 text-sm text-gray-500">CUI: {config.cui}</p>
            )}
            {config?.registrationNr && (
              <p className="text-sm text-gray-500">
                Nr. inregistrare: {config.registrationNr}
              </p>
            )}

            {/* Bank details if available */}
            {config?.bankAccount && (
              <p className="mt-2 text-xs text-gray-400">
                Cont bancar: {config.bankAccount}
                {config.bankName ? ` - ${config.bankName}` : ""}
              </p>
            )}

            {/* Website link */}
            {ngo.websiteUrl && (
              <a
                href={ngo.websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium transition-colors hover:underline"
                style={{ color: primaryColor }}
              >
                <Globe className="h-3.5 w-3.5" />
                {ngo.websiteUrl.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                <ExternalLink className="h-3 w-3" />
              </a>
            )}

            {/* Divider */}
            <div className="mx-auto my-6 h-px w-16 bg-gray-200" />

            {/* GDPR */}
            <p className="mx-auto max-w-md text-xs leading-relaxed text-gray-400">
              Datele tale personale sunt protejate conform Regulamentului
              General privind Protectia Datelor (GDPR). Le folosim exclusiv
              in scopul pentru care au fost colectate.
            </p>

            {/* Built with */}
            <p className="mt-6 text-xs font-medium text-gray-400">
              Construit cu{" "}
              <span className="font-bold" style={{ color: primaryColor }}>
                NGO HUB
              </span>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

"use client";

import { Heart, FileText, Briefcase, ArrowRight, Shield } from "lucide-react";
import { MiniSiteDonation } from "@/components/minisite/donation-form";

interface Props {
  ngo: any;
  config: any;
  consentTexts: Record<string, string>;
  primaryColor: string;
  accentColor: string;
  primaryRgb: string;
}

function hexToRgb(hex: string): string {
  const cleaned = hex.replace("#", "");
  const r = parseInt(cleaned.substring(0, 2), 16);
  const g = parseInt(cleaned.substring(2, 4), 16);
  const b = parseInt(cleaned.substring(4, 6), 16);
  return `${r}, ${g}, ${b}`;
}

export function MiniSiteFooterCta({ ngo, config, consentTexts, primaryColor, accentColor, primaryRgb }: Props) {
  const showDonation = config?.showDonation !== false;
  const showFormular230 = config?.showFormular230 === true;
  const showContract = config?.showContract === true;
  const accentRgb = hexToRgb(accentColor);

  if (!showDonation && !showFormular230 && !showContract) return null;

  return (
    <div className="border-t bg-gray-50">
      {/* Donation Section */}
      {showDonation && (
        <section
          className="py-16 sm:py-20"
          style={{ background: `linear-gradient(135deg, ${primaryColor}05, ${accentColor}08, ${primaryColor}05)` }}
        >
          <div className="mx-auto max-w-4xl px-4 sm:px-6">
            <div className="mb-8 text-center">
              <h2 className="text-2xl font-extrabold text-gray-900 sm:text-3xl">
                Sustine cauza noastra
              </h2>
              <p className="mx-auto mt-3 max-w-xl text-base text-gray-500">
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

      {/* Redirectioneaza Impozit Section */}
      {(showFormular230 || showContract) && (
        <section className="py-16 sm:py-20 bg-white">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="mb-10 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl" style={{ backgroundColor: `rgba(${primaryRgb}, 0.1)` }}>
                <Shield className="h-7 w-7" style={{ color: primaryColor }} />
              </div>
              <h2 className="text-2xl font-extrabold text-gray-900 sm:text-3xl">
                Redirectioneaza impozitul
              </h2>
              <p className="mx-auto mt-3 max-w-2xl text-base text-gray-500">
                Fara costuri suplimentare - banii ar merge oricum la stat
              </p>
            </div>

            <div className="mx-auto grid max-w-4xl gap-8 sm:grid-cols-2">
              {showFormular230 && (
                <div className="group relative overflow-hidden rounded-2xl bg-gray-50 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl" style={{ border: `1px solid rgba(${accentRgb}, 0.15)` }}>
                  <div className="h-1.5" style={{ background: `linear-gradient(90deg, ${accentColor}, ${accentColor}88)` }} />
                  <div className="p-6 sm:p-8">
                    <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl" style={{ backgroundColor: `rgba(${accentRgb}, 0.1)` }}>
                      <FileText className="h-7 w-7" style={{ color: accentColor }} />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">Redirectioneaza 3,5% din impozit</h3>
                    <p className="mt-3 text-sm leading-relaxed text-gray-500">
                      Completeaza Formularul 230 si redirectioneaza 3,5% din impozitul pe venit.
                    </p>
                    <a
                      href={`/s/${ngo.slug}/formular-230`}
                      className="mt-6 inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-bold text-white shadow-md transition-all hover:shadow-lg"
                      style={{ backgroundColor: accentColor }}
                    >
                      Completeaza formularul
                      <ArrowRight className="h-4 w-4" />
                    </a>
                  </div>
                </div>
              )}

              {showContract && (
                <div className="group relative overflow-hidden rounded-2xl bg-gray-50 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl" style={{ border: `1px solid rgba(${primaryRgb}, 0.15)` }}>
                  <div className="h-1.5" style={{ background: `linear-gradient(90deg, ${primaryColor}, ${primaryColor}88)` }} />
                  <div className="p-6 sm:p-8">
                    <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl" style={{ backgroundColor: `rgba(${primaryRgb}, 0.1)` }}>
                      <Briefcase className="h-7 w-7" style={{ color: primaryColor }} />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">Sponsorizare 20% pentru firme</h3>
                    <p className="mt-3 text-sm leading-relaxed text-gray-500">
                      Firmele pot redirectiona pana la 20% din impozitul pe profit.
                    </p>
                    <a
                      href={`/s/${ngo.slug}/contract-sponsorizare`}
                      className="mt-6 inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-bold text-white shadow-md transition-all hover:shadow-lg"
                      style={{ backgroundColor: primaryColor }}
                    >
                      Genereaza contract
                      <ArrowRight className="h-4 w-4" />
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

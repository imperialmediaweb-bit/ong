"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  FileText, Printer, CheckCircle2, Heart, Loader2, ArrowLeft, Shield,
  Download, Info, Mail, ChevronDown, ChevronUp, Users, Calendar,
  BadgeCheck, ExternalLink, Globe, MessageCircle, Phone, Send,
  Smartphone, FileImage, ArrowRight
} from "lucide-react";

interface Props {
  params: { slug: string };
}

const COUNTIES = [
  "Alba", "Arad", "Arges", "Bacau", "Bihor", "Bistrita-Nasaud", "Botosani",
  "Braila", "Brasov", "Bucuresti", "Buzau", "Calarasi", "Caras-Severin", "Cluj",
  "Constanta", "Covasna", "Dambovita", "Dolj", "Galati", "Giurgiu", "Gorj",
  "Harghita", "Hunedoara", "Ialomita", "Iasi", "Ilfov", "Maramures", "Mehedinti",
  "Mures", "Neamt", "Olt", "Prahova", "Salaj", "Satu Mare", "Sibiu", "Suceava",
  "Teleorman", "Timis", "Tulcea", "Vaslui", "Valcea", "Vrancea",
];

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  );
}

export default function FormularAnafPage({ params }: Props) {
  const [ngo, setNgo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [showManualForm, setShowManualForm] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    cnp: "",
    street: "",
    number: "",
    block: "",
    staircase: "",
    floor: "",
    apartment: "",
    city: "",
    county: "",
    postalCode: "",
    phone: "",
    email: "",
    taxYear: new Date().getFullYear(),
  });

  useEffect(() => {
    fetch(`/api/public/ngo/${params.slug}`)
      .then((r) => r.json())
      .then((data) => {
        setNgo(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [params.slug]);

  const handleSubmit = async () => {
    if (!form.firstName || !form.lastName || !form.city || !form.county) return;
    setSubmitting(true);
    try {
      await fetch(`/api/public/formular-230/${params.slug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      setSubmitted(true);
    } catch {
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const getWhatsAppUrl = (phone: string, message: string) => {
    const cleanPhone = phone.replace(/[^0-9+]/g, "").replace(/^0/, "40");
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
  };

  const getMailtoUrl = (email: string, subject: string, body: string) => {
    return `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const emailSubject = `Formular 230 completat - redirectionare 3,5% catre ${ngo?.name || ""}`;
  const emailBody = `Buna ziua,\n\nVa trimit atasat Formularul 230 completat si semnat pentru redirectionarea a 3,5% din impozitul pe venit catre ${ngo?.name || ""}.\n\nVa rog sa confirmati primirea.\n\nCu stima`;
  const whatsAppMessage = `Buna ziua! Va trimit Formularul 230 completat si semnat pentru redirectionarea 3,5% catre ${ngo?.name || ""}. Va rog sa confirmati primirea.`;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-background">
        <div className="text-center space-y-3">
          <Loader2 className="h-8 w-8 animate-spin text-gray-500 mx-auto" />
          <p className="text-sm text-muted-foreground">Se incarca formularul...</p>
        </div>
      </div>
    );
  }

  if (!ngo || ngo.error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Organizatia nu a fost gasita.</p>
      </div>
    );
  }

  const hasEmbed = !!ngo.formular230EmbedCode;
  const hasPdf = !!ngo.formular230PdfUrl;
  const contactEmail = ngo.contactEmail;
  const contactPhone = ngo.contactPhone;
  const primaryColor = ngo.primaryColor || "#6366f1";
  const accentColor = ngo.accentColor || "#f59e0b";

  // ─── Print view after manual form submit ───────────────────────────
  if (submitted) {
    return (
      <div className="min-h-screen py-8 px-4" style={{ background: `linear-gradient(to bottom, ${primaryColor}08, transparent)` }}>
        <div className="max-w-3xl mx-auto">
          {/* Success banner */}
          <Card className="mb-6 border-0 shadow-lg print:hidden" style={{ background: `linear-gradient(to right, ${primaryColor}10, ${primaryColor}18)` }}>
            <CardContent className="pt-6 pb-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full flex-shrink-0" style={{ backgroundColor: `${primaryColor}15` }}>
                  <CheckCircle2 className="h-6 w-6" style={{ color: primaryColor }} />
                </div>
                <div>
                  <h3 className="font-bold text-lg" style={{ color: primaryColor }}>
                    Formularul a fost generat cu succes!
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Printeaza-l, semneaza-l si trimite-l catre {ngo.name} prin email sau WhatsApp.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action buttons - before form */}
          <div className="flex flex-wrap gap-3 justify-center mb-6 print:hidden">
            <Button onClick={handlePrint} size="lg" className="h-12 shadow-md text-white" style={{ backgroundColor: primaryColor }}>
              <Printer className="mr-2 h-5 w-5" />
              Printeaza / Descarca PDF
            </Button>
            {contactEmail && (
              <a href={getMailtoUrl(contactEmail, emailSubject, emailBody)}>
                <Button size="lg" className="h-12 shadow-md text-white" style={{ backgroundColor: primaryColor }}>
                  <Mail className="mr-2 h-5 w-5" />
                  Trimite pe Email
                </Button>
              </a>
            )}
            {contactPhone && (
              <a href={getWhatsAppUrl(contactPhone, whatsAppMessage)} target="_blank" rel="noopener noreferrer">
                <Button size="lg" className="h-12 shadow-md bg-[#25D366] hover:bg-[#1DA851]">
                  <WhatsAppIcon className="mr-2 h-5 w-5" />
                  Trimite pe WhatsApp
                </Button>
              </a>
            )}
          </div>

          {/* Printable form */}
          <div ref={printRef} className="print:block">
            <div className="border-2 border-black p-8 bg-white text-black print:border-0">
              <div className="text-center mb-6">
                <h1 className="text-xl font-bold">CERERE PRIVIND DESTINATIA SUMEI REPREZENTAND</h1>
                <h2 className="text-lg font-bold">PANA LA 3,5% DIN IMPOZITUL ANUAL DATORAT</h2>
                <p className="text-sm mt-2">Formular 230 - Anul fiscal {form.taxYear}</p>
              </div>
              <div className="space-y-4 text-sm">
                <div className="border p-3">
                  <h3 className="font-bold mb-2">I. DATE DE IDENTIFICARE ALE CONTRIBUABILULUI</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <p><strong>Nume:</strong> {form.lastName}</p>
                    <p><strong>Prenume:</strong> {form.firstName}</p>
                    <p><strong>CNP:</strong> {form.cnp || "_______________"}</p>
                    <p><strong>Telefon:</strong> {form.phone || "-"}</p>
                  </div>
                  <div className="mt-2">
                    <p>
                      <strong>Adresa:</strong> Str. {form.street || "___"} Nr. {form.number || "___"}{" "}
                      Bl. {form.block || "___"} Sc. {form.staircase || "___"}{" "}
                      Et. {form.floor || "___"} Ap. {form.apartment || "___"}
                    </p>
                    <p>
                      <strong>Localitate:</strong> {form.city}{" "}
                      <strong>Judet:</strong> {form.county}{" "}
                      <strong>Cod postal:</strong> {form.postalCode || "___"}
                    </p>
                    <p><strong>E-mail:</strong> {form.email || "-"}</p>
                  </div>
                </div>
                <div className="border p-3">
                  <h3 className="font-bold mb-2">II. DESTINATIA SUMEI REPREZENTAND PANA LA 3,5% DIN IMPOZITUL ANUAL</h3>
                  <p className="mb-2">Solicit directionarea sumei reprezentand <strong>3,5%</strong> din impozitul anual datorat catre:</p>
                  <div className="grid grid-cols-2 gap-2 bg-gray-50 p-2 rounded">
                    <p><strong>Entitate nonprofit:</strong> {ngo.name}</p>
                    <p><strong>Cod fiscal:</strong> {ngo.cui || "________________"}</p>
                    <p className="col-span-2"><strong>Cont bancar (IBAN):</strong> {ngo.iban || "________________________________"}</p>
                  </div>
                </div>
                <div className="border p-3">
                  <h3 className="font-bold mb-2">III. DATE PRIVIND OBLIGATIA ANUALA DE PLATA A IMPOZITULUI PE VENIT</h3>
                  <p>Anul fiscal: <strong>{form.taxYear}</strong></p>
                </div>
                <div className="mt-8 flex justify-between">
                  <p className="mb-8">Data: ___/___/______</p>
                  <p className="mb-8">Semnatura contribuabilului:</p>
                </div>
              </div>
            </div>
          </div>

          {/* How to send instructions */}
          <Card className="mt-6 border-0 shadow-lg print:hidden" style={{ background: `linear-gradient(to right, ${primaryColor}10, ${primaryColor}18)` }}>
            <CardContent className="pt-6 pb-6">
              <h3 className="font-bold text-base mb-4 flex items-center gap-2" style={{ color: primaryColor }}>
                <Send className="h-5 w-5" style={{ color: primaryColor }} />
                Cum trimiti formularul completat
              </h3>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="flex gap-3 items-start">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full font-bold text-sm flex-shrink-0" style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }}>1</div>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: primaryColor }}>Printeaza</p>
                    <p className="text-xs text-muted-foreground">Apasa butonul de printare sau salveaza ca PDF</p>
                  </div>
                </div>
                <div className="flex gap-3 items-start">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full font-bold text-sm flex-shrink-0" style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }}>2</div>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: primaryColor }}>Semneaza</p>
                    <p className="text-xs text-muted-foreground">Semneaza formularul olograf (de mana)</p>
                  </div>
                </div>
                <div className="flex gap-3 items-start">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full font-bold text-sm flex-shrink-0" style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }}>3</div>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: primaryColor }}>Trimite</p>
                    <p className="text-xs text-muted-foreground">
                      {contactEmail && contactPhone
                        ? "Trimite pe email sau WhatsApp folosind butoanele de mai sus"
                        : contactEmail
                          ? "Trimite pe email folosind butonul de mai sus"
                          : contactPhone
                            ? "Trimite pe WhatsApp folosind butonul de mai sus"
                            : "Trimite formularul la asociatie"}
                    </p>
                  </div>
                </div>
              </div>
              {(contactEmail || contactPhone) && (
                <div className="mt-4 p-3 bg-white/60 rounded-xl" style={{ border: `1px solid ${primaryColor}22` }}>
                  <p className="text-xs text-muted-foreground">
                    <strong>Poti trimite:</strong> PDF-ul salvat, o fotografie/scan al formularului semnat,
                    sau orice alt format de imagine. Atasaza fisierul la email sau trimite-l direct pe WhatsApp.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Bottom buttons */}
          <div className="mt-6 flex flex-wrap gap-3 justify-center print:hidden">
            <Button variant="outline" onClick={() => setSubmitted(false)} size="lg" className="h-11">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Completeaza din nou
            </Button>
            <a href={`/s/${params.slug}`}>
              <Button variant="outline" size="lg" className="h-11">
                Inapoi la {ngo.name}
              </Button>
            </a>
          </div>
        </div>
      </div>
    );
  }

  // ─── Main page ──────────────────────────────────────────────────────
  return (
    <div className="min-h-screen" style={{ background: `linear-gradient(to bottom, ${primaryColor}08, transparent, transparent)` }}>
      {/* Header bar */}
      <div className="bg-white/80 backdrop-blur-sm border-b sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <a
            href={`/s/${params.slug}`}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Inapoi la {ngo.name}
          </a>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Shield className="h-3.5 w-3.5" />
            Formular securizat
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">

        {/* ── Hero ────────────────────────────────────────────────── */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full shadow-lg mx-auto" style={{ background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}dd)` }}>
            <Heart className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
            Redirectioneaza 3,5% din impozit
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Sustine <strong>{ngo.name}</strong> fara niciun cost! Redirectioneaza
            3,5% din impozitul pe venit pe care oricum il platesti statului.
          </p>
        </div>

        {/* NGO info badge */}
        <div className="flex justify-center">
          <div className="inline-flex items-center gap-3 bg-white rounded-2xl px-6 py-4 shadow-sm border">
            {ngo.logoUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={ngo.logoUrl} alt="" className="h-10 w-10 rounded-full object-cover" />
            )}
            <div>
              <div className="font-semibold">{ngo.name}</div>
              <div className="text-xs text-muted-foreground flex items-center gap-3">
                {ngo.cui && <span>CUI: {ngo.cui}</span>}
                {ngo.iban && <span>IBAN: {ngo.iban}</span>}
              </div>
            </div>
          </div>
        </div>

        {/* ── Ce este Formularul 230 ──────────────────────────────── */}
        <Card style={{ borderColor: `${primaryColor}22` }}>
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <div className="shrink-0 w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: `${primaryColor}15` }}>
                <Info className="h-5 w-5" style={{ color: primaryColor }} />
              </div>
              <div className="space-y-3">
                <h3 className="text-lg font-semibold">Ce este Formularul 230?</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Formularul 230 este documentul oficial prin care orice persoana fizica
                  din Romania poate redirectiona <strong>pana la 3,5% din impozitul pe venit</strong> catre
                  o organizatie nonprofit. Este complet gratuit - aceasta suma se scade
                  din impozitul pe care il platesti oricum catre stat. Daca nu completezi
                  formularul, banii raman la bugetul de stat.
                </p>
                <div className="flex flex-wrap gap-4 text-xs text-muted-foreground pt-1">
                  <span className="flex items-center gap-1.5">
                    <BadgeCheck className="h-3.5 w-3.5 text-green-500" />
                    100% gratuit
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-blue-500" />
                    Termen: 25 mai anual
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5 text-purple-500" />
                    Orice persoana fizica
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── How it works - 2 options ────────────────────────────── */}
        <div className="text-center space-y-2">
          <h2 className="text-xl font-bold">Alege cum vrei sa completezi</h2>
          <p className="text-sm text-muted-foreground">Ai doua variante simple - online sau pe hartie</p>
        </div>

        {/* ══════════════════════════════════════════════════════════ */}
        {/* ── VARIANTA 1: ONLINE ─────────────────────────────────── */}
        {/* ══════════════════════════════════════════════════════════ */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full text-white font-bold text-lg shadow-md flex-shrink-0" style={{ background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}dd)` }}>1</div>
            <div>
              <h2 className="text-xl font-bold">Completeaza online</h2>
              <p className="text-sm text-muted-foreground">Cel mai rapid - completezi, semnezi electronic si trimiti automat</p>
            </div>
          </div>

          {/* Embed from formular230.ro (if configured by NGO) */}
          {hasEmbed ? (
            <Card className="overflow-hidden shadow-lg" style={{ borderColor: `${primaryColor}33` }}>
              <CardHeader style={{ background: `linear-gradient(to right, ${primaryColor}10, ${primaryColor}18)` }} className="border-b">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" style={{ color: primaryColor }} />
                  Completeaza Formularul 230 Online
                </CardTitle>
                <CardDescription>
                  Formularul este furnizat de formular230.ro - completati datele si trimiteti direct online, fara hartii.
                  Dupa completare, formularul se trimite automat la ANAF.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div
                  className="formular230-embed w-full"
                  dangerouslySetInnerHTML={{ __html: ngo.formular230EmbedCode }}
                />
              </CardContent>
            </Card>
          ) : (
            <Card className="hover:shadow-md transition-shadow" style={{ borderColor: `${primaryColor}33` }}>
              <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row gap-6 items-center">
                  <div className="shrink-0 w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg" style={{ background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}dd)` }}>
                    <Globe className="h-8 w-8 text-white" />
                  </div>
                  <div className="flex-1 text-center sm:text-left space-y-2">
                    <h3 className="text-lg font-bold">Completeaza pe formular230.ro</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Acceseaza platforma formular230.ro, cauta <strong>{ngo.name}</strong> si
                      completeaza formularul online. Este simplu, rapid si gratuit.
                      Semnezi electronic si trimiti direct de pe telefon sau calculator.
                    </p>
                    <div className="flex items-center gap-2 text-xs text-emerald-600 bg-emerald-50 rounded-lg px-3 py-1.5 w-fit">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Se trimite automat la ANAF - nu mai trebuie sa faci nimic!
                    </div>
                  </div>
                  <a
                    href="https://formular230.ro"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 inline-flex items-center gap-2 px-6 py-3 text-white rounded-xl font-semibold transition-all shadow-md hover:shadow-lg"
                    style={{ background: `linear-gradient(to right, ${primaryColor}, ${primaryColor}dd)` }}
                  >
                    <ExternalLink className="h-4 w-4" />
                    Mergi la formular230.ro
                  </a>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* ── Separator ──────────────────────────────────────────── */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200"></div>
          </div>
          <div className="relative flex justify-center">
            <span className="bg-gradient-to-b from-blue-50/0 via-background to-background px-4 text-sm text-muted-foreground font-medium">sau</span>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════ */}
        {/* ── VARIANTA 2: DESCARCA + TRIMITE ─────────────────────── */}
        {/* ══════════════════════════════════════════════════════════ */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full text-white font-bold text-lg shadow-md flex-shrink-0" style={{ background: `linear-gradient(135deg, ${accentColor}, ${accentColor}dd)` }}>2</div>
            <div>
              <h2 className="text-xl font-bold">Descarca, completeaza si trimite</h2>
              <p className="text-sm text-muted-foreground">Descarci formularul PDF, il completezi pe hartie, semnezi si il trimiti la asociatie</p>
            </div>
          </div>

          {/* Step-by-step cards */}
          <div className="grid gap-4 sm:grid-cols-3">
            {/* Step 1: Download */}
            <Card className="hover:shadow-lg transition-all relative overflow-hidden" style={{ borderColor: `${primaryColor}33` }}>
              <div className="absolute top-0 left-0 right-0 h-1" style={{ background: `linear-gradient(to right, ${primaryColor}, ${primaryColor}88)` }}></div>
              <CardContent className="pt-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full font-bold text-sm" style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }}>1</div>
                  <h3 className="font-bold" style={{ color: primaryColor }}>Descarca formularul</h3>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {hasPdf
                    ? "Descarca formularul PDF pre-completat cu datele asociatiei. Trebuie doar sa adaugi datele tale personale."
                    : "Descarca formularul PDF, completeaza-l cu datele tale si cu datele asociatiei de mai sus (CUI, IBAN)."}
                </p>
                {hasPdf ? (
                  <a
                    href={ngo.formular230PdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-2.5 text-white rounded-xl font-semibold transition-colors shadow-md hover:shadow-lg text-sm w-full justify-center"
                    style={{ backgroundColor: primaryColor }}
                  >
                    <Download className="h-4 w-4" />
                    Descarca PDF
                  </a>
                ) : (
                  <a
                    href="https://static.anaf.ro/static/10/Anaf/Declaratii_R/230.html"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-2.5 text-white rounded-xl font-semibold transition-colors shadow-md hover:shadow-lg text-sm w-full justify-center"
                    style={{ backgroundColor: primaryColor }}
                  >
                    <Download className="h-4 w-4" />
                    Descarca Formular 230
                  </a>
                )}
              </CardContent>
            </Card>

            {/* Step 2: Complete & Sign */}
            <Card className="hover:shadow-lg transition-all relative overflow-hidden" style={{ borderColor: `${accentColor}33` }}>
              <div className="absolute top-0 left-0 right-0 h-1" style={{ background: `linear-gradient(to right, ${accentColor}, ${accentColor}88)` }}></div>
              <CardContent className="pt-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full font-bold text-sm" style={{ backgroundColor: `${accentColor}15`, color: accentColor }}>2</div>
                  <h3 className="font-bold" style={{ color: accentColor }}>Completeaza si semneaza</h3>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Printeaza formularul, completeaza-l cu datele tale personale si semneaza-l olograf (de mana).
                  Apoi scaneaza-l sau fotografiaza-l.
                </p>
                <div className="flex items-center gap-2 text-xs rounded-lg px-3 py-2" style={{ backgroundColor: `${accentColor}10`, color: accentColor }}>
                  <FileImage className="h-3.5 w-3.5 flex-shrink-0" />
                  <span>Poti trimite scan, fotografie sau PDF - orice format este acceptat</span>
                </div>
              </CardContent>
            </Card>

            {/* Step 3: Send */}
            <Card className="hover:shadow-lg transition-all relative overflow-hidden" style={{ borderColor: `${primaryColor}33` }}>
              <div className="absolute top-0 left-0 right-0 h-1" style={{ background: `linear-gradient(to right, ${primaryColor}, ${accentColor})` }}></div>
              <CardContent className="pt-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full font-bold text-sm" style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }}>3</div>
                  <h3 className="font-bold" style={{ color: primaryColor }}>Trimite la asociatie</h3>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Trimite formularul completat si semnat catre {ngo.name} prin email sau WhatsApp.
                  Asociatia se va ocupa de depunerea la ANAF.
                </p>
                <div className="space-y-2">
                  {contactEmail && (
                    <a
                      href={getMailtoUrl(contactEmail, emailSubject, emailBody)}
                      className="flex items-center gap-2 px-4 py-2.5 text-white rounded-xl font-semibold transition-colors shadow-md text-sm w-full justify-center"
                      style={{ backgroundColor: primaryColor }}
                    >
                      <Mail className="h-4 w-4" />
                      Trimite pe Email
                    </a>
                  )}
                  {contactPhone && (
                    <a
                      href={getWhatsAppUrl(contactPhone, whatsAppMessage)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2.5 bg-[#25D366] text-white rounded-xl font-semibold hover:bg-[#1DA851] transition-colors shadow-md text-sm w-full justify-center"
                    >
                      <WhatsAppIcon className="h-4 w-4" />
                      Trimite pe WhatsApp
                    </a>
                  )}
                  {!contactEmail && !contactPhone && (
                    <p className="text-xs text-muted-foreground italic">
                      Contactati asociatia direct pentru a trimite formularul.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Contact info summary */}
          {(contactEmail || contactPhone) && (
            <Card className="border-0 shadow-md bg-gradient-to-r from-gray-50 to-slate-50">
              <CardContent className="py-4">
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-sm">
                  <span className="text-muted-foreground font-medium">Date de contact {ngo.name}:</span>
                  {contactEmail && (
                    <span className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-blue-500" />
                      <a href={`mailto:${contactEmail}`} className="text-blue-600 hover:underline font-medium">{contactEmail}</a>
                    </span>
                  )}
                  {contactPhone && (
                    <span className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-green-500" />
                      <a href={`tel:${contactPhone}`} className="text-green-600 hover:underline font-medium">{contactPhone}</a>
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* ── Manual Form (collapsible if embed exists) ───────────── */}
        <div>
          {hasEmbed ? (
            <button
              onClick={() => setShowManualForm(!showManualForm)}
              className="w-full flex items-center justify-center gap-2 py-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {showManualForm ? (
                <>
                  <ChevronUp className="h-4 w-4" />
                  Ascunde formularul manual
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4" />
                  Sau completeaza formularul manual direct pe site (pentru printare)
                </>
              )}
            </button>
          ) : (
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center">
                <span className="bg-gradient-to-b from-background to-background px-4 text-sm text-muted-foreground font-medium">sau completeaza direct pe site</span>
              </div>
            </div>
          )}

          {(!hasEmbed || showManualForm) && (
            <Card className="mt-4 shadow-lg">
              <CardHeader style={{ background: `linear-gradient(to right, ${primaryColor}10, ${primaryColor}18)` }} className="border-b">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" style={{ color: primaryColor }} />
                  Completeaza Formularul 230 pe site
                </CardTitle>
                <CardDescription>
                  Completeaza datele tale mai jos si genereaza formularul pre-completat.
                  Dupa generare, il poti printa, semna si trimite la {ngo.name} prin email sau WhatsApp.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                <div className="p-3 rounded-lg" style={{ backgroundColor: `${primaryColor}08`, border: `1px solid ${primaryColor}33` }}>
                  <p className="text-sm font-medium">
                    Organizatia beneficiara: <strong>{ngo.name}</strong>
                  </p>
                  {ngo.cui && <p className="text-xs text-muted-foreground">CUI/CIF: {ngo.cui}</p>}
                  {ngo.iban && <p className="text-xs text-muted-foreground">IBAN: {ngo.iban}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="lastName">Nume *</Label>
                    <Input id="lastName" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} placeholder="Popescu" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="firstName">Prenume *</Label>
                    <Input id="firstName" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} placeholder="Ion" />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="cnp">CNP (optional)</Label>
                  <Input id="cnp" value={form.cnp} onChange={(e) => setForm({ ...form, cnp: e.target.value })} placeholder="1234567890123" maxLength={13} />
                  <p className="text-xs text-muted-foreground">CNP-ul este optional dar recomandat pentru procesarea mai rapida.</p>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-medium mb-3">Adresa de domiciliu</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2 col-span-2">
                      <Label htmlFor="street">Strada</Label>
                      <Input id="street" value={form.street} onChange={(e) => setForm({ ...form, street: e.target.value })} placeholder="Str. Principala" />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="nr">Numar</Label>
                      <Input id="nr" value={form.number} onChange={(e) => setForm({ ...form, number: e.target.value })} placeholder="10" />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="block">Bloc</Label>
                      <Input id="block" value={form.block} onChange={(e) => setForm({ ...form, block: e.target.value })} placeholder="A1" />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="staircase">Scara</Label>
                      <Input id="staircase" value={form.staircase} onChange={(e) => setForm({ ...form, staircase: e.target.value })} placeholder="B" />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="floor">Etaj</Label>
                      <Input id="floor" value={form.floor} onChange={(e) => setForm({ ...form, floor: e.target.value })} placeholder="3" />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="apartment">Apartament</Label>
                      <Input id="apartment" value={form.apartment} onChange={(e) => setForm({ ...form, apartment: e.target.value })} placeholder="15" />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="postalCode">Cod postal</Label>
                      <Input id="postalCode" value={form.postalCode} onChange={(e) => setForm({ ...form, postalCode: e.target.value })} placeholder="010101" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="city">Localitate *</Label>
                    <Input id="city" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="Bucuresti" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="county">Judet *</Label>
                    <Select value={form.county || undefined} onValueChange={(v) => setForm({ ...form, county: v })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecteaza judetul" />
                      </SelectTrigger>
                      <SelectContent>
                        {COUNTIES.map((c) => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="phone">Telefon</Label>
                    <Input id="phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="07xx xxx xxx" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="ion@exemplu.ro" />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="taxYear">Anul fiscal</Label>
                  <Select value={String(form.taxYear)} onValueChange={(v) => setForm({ ...form, taxYear: parseInt(v) })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[new Date().getFullYear(), new Date().getFullYear() - 1].map((y) => (
                        <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
              <CardFooter className="border-t pt-6 flex gap-3">
                <Button
                  onClick={handleSubmit}
                  disabled={submitting || !form.firstName || !form.lastName || !form.city || !form.county}
                  size="lg"
                  style={{ background: `linear-gradient(to right, ${primaryColor}, ${primaryColor}dd)` }}
                >
                  {submitting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <FileText className="mr-2 h-4 w-4" />
                  )}
                  Genereaza formularul
                </Button>
              </CardFooter>
            </Card>
          )}
        </div>

        {/* ── Trust footer ────────────────────────────────────────── */}
        <div className="text-center space-y-3 pb-8">
          {hasEmbed && (
            <p className="text-xs text-muted-foreground">
              Formularul online este procesat in siguranta de formular230.ro conform GDPR.
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            Datele tale sunt folosite exclusiv pentru completarea Formularului 230
            si nu sunt partajate cu terti.
          </p>
          <a
            href={`/s/${params.slug}`}
            className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Inapoi la pagina {ngo.name}
          </a>
        </div>
      </div>

      <style jsx>{`
        .formular230-embed iframe {
          width: 100% !important;
          min-height: 700px;
          border: none;
        }
        .formular230-embed {
          min-height: 200px;
        }
      `}</style>
    </div>
  );
}

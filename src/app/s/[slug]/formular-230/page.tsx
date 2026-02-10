"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  FileText, Printer, CheckCircle2, Heart, Loader2, ArrowLeft, Shield,
  Download, MapPin, Info, Mail, ChevronDown, ChevronUp, Users, Calendar,
  BadgeCheck
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-background">
        <div className="text-center space-y-3">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto" />
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
  const hasAddress = !!ngo.formular230Address;

  // ─── Print view after manual form submit ───────────────────────────
  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-background py-8 px-4">
        <div className="max-w-3xl mx-auto">
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

          <div className="mt-6 flex gap-3 justify-center print:hidden">
            <Button onClick={handlePrint} size="lg">
              <Printer className="mr-2 h-4 w-4" />
              Printeaza formularul
            </Button>
            <Button variant="outline" onClick={() => setSubmitted(false)} size="lg">
              Completeaza din nou
            </Button>
          </div>

          <Card className="mt-6 print:hidden">
            <CardContent className="py-6">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                <div>
                  <h3 className="font-semibold">Pasii urmatori</h3>
                  <ol className="text-sm text-muted-foreground list-decimal ml-4 mt-2 space-y-1">
                    <li>Printeaza formularul completat</li>
                    <li>Semneaza formularul</li>
                    <li>
                      {hasAddress
                        ? <>Trimite-l prin posta la adresa: <strong>{ngo.formular230Address}</strong></>
                        : "Depune-l la administratia financiara (ANAF) din localitatea ta sau trimite-l prin posta"
                      }
                    </li>
                    <li>Termenul limita este de obicei <strong>25 mai</strong> al anului urmator</li>
                  </ol>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // ─── Main page - always shows rich layout ──────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 via-background to-background">
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
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg mx-auto">
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
        <Card className="border-blue-100">
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <div className="shrink-0 w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <Info className="h-5 w-5 text-blue-600" />
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

        {/* ── 3 Steps ─────────────────────────────────────────────── */}
        <div>
          <h2 className="text-xl font-bold text-center mb-6">
            Cum redirectionezi in 3 pasi simpli
          </h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="relative bg-white rounded-2xl border p-6 text-center space-y-3 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white font-bold flex items-center justify-center mx-auto text-xl shadow-md">
                1
              </div>
              <h4 className="font-bold">Completeaza</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {hasEmbed
                  ? "Completeaza formularul online mai jos sau descarca PDF-ul cu datele pre-completate"
                  : hasPdf
                    ? "Descarca PDF-ul pre-completat si adauga datele tale personale"
                    : "Completeaza formularul cu datele tale personale si cele ale organizatiei"}
              </p>
            </div>
            <div className="relative bg-white rounded-2xl border p-6 text-center space-y-3 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white font-bold flex items-center justify-center mx-auto text-xl shadow-md">
                2
              </div>
              <h4 className="font-bold">Semneaza</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {hasEmbed
                  ? "Daca completezi online pe formular230.ro, semnatura se face electronic"
                  : "Printeaza formularul completat si semneaza-l olograf (de mana)"}
              </p>
            </div>
            <div className="relative bg-white rounded-2xl border p-6 text-center space-y-3 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white font-bold flex items-center justify-center mx-auto text-xl shadow-md">
                3
              </div>
              <h4 className="font-bold">Trimite</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {hasEmbed
                  ? "Trimite formularul online cu un click sau depune-l la ANAF"
                  : hasAddress
                    ? "Trimite formularul prin posta la adresa de mai jos sau depune-l la ANAF"
                    : "Depune formularul la administratia financiara (ANAF) sau trimite-l prin posta"}
              </p>
            </div>
          </div>
        </div>

        {/* ── Embed from formular230.ro ───────────────────────────── */}
        {hasEmbed && (
          <Card className="overflow-hidden shadow-lg border-blue-200">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-600" />
                Completeaza Formularul 230 Online
              </CardTitle>
              <CardDescription>
                Formularul este furnizat de formular230.ro - completati datele si trimiteti direct online, fara hartii
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div
                className="formular230-embed w-full"
                dangerouslySetInnerHTML={{ __html: ngo.formular230EmbedCode }}
              />
            </CardContent>
          </Card>
        )}

        {/* ── PDF Download + Mailing Address ──────────────────────── */}
        {(hasPdf || hasAddress) && (
          <div className="grid gap-6 sm:grid-cols-2">
            {hasPdf && (
              <Card className="border-green-200 hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Download className="h-5 w-5 text-green-600" />
                    Descarca Formularul 230
                  </CardTitle>
                  <CardDescription>
                    PDF pre-completat cu datele {ngo.name}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Descarca formularul PDF pre-completat cu datele organizatiei
                    noastre. Trebuie doar sa adaugi datele tale personale, sa
                    semnezi si sa il trimiti.
                  </p>
                  <a
                    href={ngo.formular230PdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-colors shadow-md hover:shadow-lg"
                  >
                    <Download className="h-4 w-4" />
                    Descarca PDF
                  </a>
                </CardContent>
              </Card>
            )}

            {hasAddress && (
              <Card className="border-orange-200 hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Mail className="h-5 w-5 text-orange-600" />
                    Unde trimiti formularul?
                  </CardTitle>
                  <CardDescription>
                    Adresa pentru trimiterea formularului prin posta
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Dupa ce completezi si semnezi formularul, trimite-l prin
                    posta la urmatoarea adresa:
                  </p>
                  <div className="flex gap-3 p-4 bg-orange-50 border border-orange-200 rounded-xl">
                    <MapPin className="h-5 w-5 text-orange-600 mt-0.5 shrink-0" />
                    <p className="text-sm font-medium whitespace-pre-line">
                      {ngo.formular230Address}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

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
                  Sau completeaza formularul manual (pentru printare)
                </>
              )}
            </button>
          ) : (
            <h2 className="text-xl font-bold text-center mb-2">
              Completeaza Formularul 230
            </h2>
          )}

          {(!hasEmbed || showManualForm) && (
            <Card className="mt-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Formular 230 - ANAF
                </CardTitle>
                <CardDescription>
                  Completeaza datele tale si genereaza formularul pentru printare.
                  Redirectioneaza 3,5% din impozitul pe venit pentru anul {form.taxYear}.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
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
                >
                  {submitting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <FileText className="mr-2 h-4 w-4" />
                  )}
                  Genereaza formularul pentru printare
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

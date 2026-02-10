"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Printer, CheckCircle2, Heart, Loader2, ArrowLeft, Shield } from "lucide-react";

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
      // still show the form for printing
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
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
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

  // ─── If NGO has formular230.ro embed code, show it ─────────────────
  if (ngo.formular230EmbedCode) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background">
        {/* Header */}
        <div className="bg-white border-b">
          <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
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

        <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
          {/* Info card */}
          <div className="text-center space-y-3">
            <Heart className="h-10 w-10 text-primary mx-auto" />
            <h1 className="text-2xl sm:text-3xl font-bold">
              Redirectioneaza 3,5% din impozit
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Completeaza formularul de mai jos pentru a redirectiona 3,5% din
              impozitul pe venit catre <strong>{ngo.name}</strong>. Nu te costa
              nimic - banii merg din impozitul pe care oricum il platesti statului.
            </p>
          </div>

          {/* NGO info badge */}
          <div className="flex justify-center">
            <div className="inline-flex items-center gap-3 bg-white rounded-full px-6 py-3 shadow-sm border">
              {ngo.logoUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={ngo.logoUrl} alt="" className="h-8 w-8 rounded-full object-cover" />
              )}
              <div className="text-sm">
                <span className="font-semibold">{ngo.name}</span>
                {ngo.cui && (
                  <span className="text-muted-foreground ml-2">CUI: {ngo.cui}</span>
                )}
              </div>
            </div>
          </div>

          {/* Embed from formular230.ro */}
          <Card className="overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-600" />
                Formular 230 Online
              </CardTitle>
              <CardDescription>
                Formularul este furnizat de formular230.ro - completati datele si trimiteti online
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div
                className="formular230-embed w-full"
                dangerouslySetInnerHTML={{ __html: ngo.formular230EmbedCode }}
              />
            </CardContent>
          </Card>

          {/* Trust footer */}
          <div className="text-center space-y-2 pb-8">
            <p className="text-xs text-muted-foreground">
              Datele sunt procesate in siguranta de formular230.ro conform GDPR.
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

  // ─── Fallback: manual form (no embed code) ─────────────────────────

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background py-8 px-4">
        <div className="max-w-3xl mx-auto">
          {/* Print-ready version */}
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
                  <h3 className="font-bold mb-2">
                    II. DESTINATIA SUMEI REPREZENTAND PANA LA 3,5% DIN IMPOZITUL ANUAL
                  </h3>
                  <p className="mb-2">
                    Solicit directionarea sumei reprezentand <strong>3,5%</strong> din impozitul anual datorat catre:
                  </p>
                  <div className="grid grid-cols-2 gap-2 bg-gray-50 p-2 rounded">
                    <p><strong>Entitate nonprofit:</strong> {ngo.name}</p>
                    <p><strong>Cod fiscal:</strong> {ngo.cui || "________________"}</p>
                    <p className="col-span-2">
                      <strong>Cont bancar (IBAN):</strong> {ngo.iban || "________________________________"}
                    </p>
                  </div>
                </div>

                <div className="border p-3">
                  <h3 className="font-bold mb-2">
                    III. DATE PRIVIND OBLIGATIA ANUALA DE PLATA A IMPOZITULUI PE VENIT
                  </h3>
                  <p>Anul fiscal: <strong>{form.taxYear}</strong></p>
                </div>

                <div className="mt-8 flex justify-between">
                  <div className="text-center">
                    <p className="mb-8">Data: ___/___/______</p>
                  </div>
                  <div className="text-center">
                    <p className="mb-8">Semnatura contribuabilului:</p>
                  </div>
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
                      Depune-l la administratia financiara (ANAF) din localitatea ta
                      sau trimite-l prin posta
                    </li>
                    <li>
                      Termenul limita este de obicei <strong>25 mai</strong> al anului urmator
                    </li>
                  </ol>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Form input page (fallback when no embed code)
  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <a
          href={`/s/${params.slug}`}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Inapoi la {ngo.name}
        </a>

        <div className="text-center">
          <Heart className="h-10 w-10 text-primary mx-auto mb-3" />
          <h1 className="text-2xl font-bold">Redirectioneaza 3,5% din impozit</h1>
          <p className="text-muted-foreground mt-2">
            Completeaza formularul de mai jos pentru a redirectiona 3,5% din impozitul pe venit
            catre <strong>{ngo.name}</strong>. Nu te costa nimic, banii merg din impozitul pe
            care oricum il platesti.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Formular 230 - ANAF
            </CardTitle>
            <CardDescription>
              Redirectioneaza 3,5% din impozitul pe venit pentru anul {form.taxYear}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg">
              <p className="text-sm font-medium">
                Organizatia beneficiara: <strong>{ngo.name}</strong>
              </p>
              {ngo.cui && (
                <p className="text-xs text-muted-foreground">CUI/CIF: {ngo.cui}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="lastName">Nume *</Label>
                <Input
                  id="lastName"
                  value={form.lastName}
                  onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                  placeholder="Popescu"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="firstName">Prenume *</Label>
                <Input
                  id="firstName"
                  value={form.firstName}
                  onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                  placeholder="Ion"
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="cnp">CNP (optional)</Label>
              <Input
                id="cnp"
                value={form.cnp}
                onChange={(e) => setForm({ ...form, cnp: e.target.value })}
                placeholder="1234567890123"
                maxLength={13}
              />
              <p className="text-xs text-muted-foreground">
                CNP-ul este optional dar recomandat pentru procesarea mai rapida.
              </p>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-medium mb-3">Adresa de domiciliu</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2 col-span-2">
                  <Label htmlFor="street">Strada</Label>
                  <Input
                    id="street"
                    value={form.street}
                    onChange={(e) => setForm({ ...form, street: e.target.value })}
                    placeholder="Str. Principala"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="nr">Numar</Label>
                  <Input
                    id="nr"
                    value={form.number}
                    onChange={(e) => setForm({ ...form, number: e.target.value })}
                    placeholder="10"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="block">Bloc</Label>
                  <Input
                    id="block"
                    value={form.block}
                    onChange={(e) => setForm({ ...form, block: e.target.value })}
                    placeholder="A1"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="staircase">Scara</Label>
                  <Input
                    id="staircase"
                    value={form.staircase}
                    onChange={(e) => setForm({ ...form, staircase: e.target.value })}
                    placeholder="B"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="floor">Etaj</Label>
                  <Input
                    id="floor"
                    value={form.floor}
                    onChange={(e) => setForm({ ...form, floor: e.target.value })}
                    placeholder="3"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="apartment">Apartament</Label>
                  <Input
                    id="apartment"
                    value={form.apartment}
                    onChange={(e) => setForm({ ...form, apartment: e.target.value })}
                    placeholder="15"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="postalCode">Cod postal</Label>
                  <Input
                    id="postalCode"
                    value={form.postalCode}
                    onChange={(e) => setForm({ ...form, postalCode: e.target.value })}
                    placeholder="010101"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="city">Localitate *</Label>
                <Input
                  id="city"
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  placeholder="Bucuresti"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="county">Judet *</Label>
                <Select
                  value={form.county || undefined}
                  onValueChange={(v) => setForm({ ...form, county: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecteaza judetul" />
                  </SelectTrigger>
                  <SelectContent>
                    {COUNTIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="phone">Telefon</Label>
                <Input
                  id="phone"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="07xx xxx xxx"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="ion@exemplu.ro"
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="taxYear">Anul fiscal</Label>
              <Select
                value={String(form.taxYear)}
                onValueChange={(v) => setForm({ ...form, taxYear: parseInt(v) })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[new Date().getFullYear(), new Date().getFullYear() - 1].map((y) => (
                    <SelectItem key={y} value={String(y)}>
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
          <CardFooter className="border-t pt-6 flex gap-3">
            <Button
              onClick={handleSubmit}
              disabled={submitting || !form.firstName || !form.lastName || !form.city || !form.county}
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

        <p className="text-xs text-center text-muted-foreground">
          Datele tale sunt folosite exclusiv pentru generarea Formularului 230
          si nu sunt partajate cu terti. Conform GDPR.
        </p>
      </div>
    </div>
  );
}

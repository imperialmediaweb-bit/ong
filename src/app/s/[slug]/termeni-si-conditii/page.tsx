"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft, Shield, FileText, Lock, Eye, Users,
  Mail, Phone, Loader2, Printer, Download
} from "lucide-react";

interface Props {
  params: { slug: string };
}

export default function TermeniSiConditiiPage({ params }: Props) {
  const [ngo, setNgo] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/public/ngo/${params.slug}`)
      .then((r) => r.json())
      .then((data) => {
        setNgo(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [params.slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-background">
        <div className="text-center space-y-3">
          <Loader2 className="h-8 w-8 animate-spin text-gray-500 mx-auto" />
          <p className="text-sm text-muted-foreground">Se incarca...</p>
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

  const primaryColor = ngo.primaryColor || "#6366f1";
  const ngoName = ngo.name || "Organizatia";
  const cuiVal = ngo.cui || "N/A";
  const representative = ngo.legalRepresentative || null;
  const contactEmail = ngo.contactEmail;
  const contactPhone = ngo.contactPhone;
  const currentDate = new Date().toLocaleDateString("ro-RO", { year: "numeric", month: "long", day: "numeric" });

  return (
    <div className="min-h-screen" style={{ background: `linear-gradient(to bottom, ${primaryColor}08, transparent, transparent)` }}>
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <a
            href={`/s/${params.slug}`}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Inapoi la {ngoName}
          </a>
          <Button variant="outline" size="sm" onClick={() => window.print()} className="print:hidden">
            <Printer className="mr-2 h-4 w-4" />
            Printeaza
          </Button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Title */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full shadow-lg mx-auto" style={{ background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}dd)` }}>
            <Shield className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
            Termeni si Conditii
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Informatii despre cum <strong>{ngoName}</strong> colecteaza, protejeaza si utilizeaza datele donatorilor.
          </p>
        </div>

        {/* NGO Info */}
        <div className="flex justify-center">
          <div className="inline-flex items-center gap-3 bg-white rounded-2xl px-6 py-4 shadow-sm border">
            {ngo.logoUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={ngo.logoUrl} alt="" className="h-10 w-10 rounded-full object-cover" />
            )}
            <div>
              <div className="font-semibold">{ngoName}</div>
              <div className="text-xs text-muted-foreground flex items-center gap-3">
                {cuiVal !== "N/A" && <span>CUI: {cuiVal}</span>}
                {representative && <span>Reprezentant: {representative}</span>}
              </div>
            </div>
          </div>
        </div>

        {/* Section 1: About the organization */}
        <Card style={{ borderColor: `${primaryColor}22` }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" style={{ color: primaryColor }} />
              1. Despre {ngoName}
            </CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none space-y-3 text-muted-foreground">
            <p>
              <strong>{ngoName}</strong>{cuiVal !== "N/A" ? ` (CUI: ${cuiVal})` : ""} este o organizatie non-guvernamentala
              inregistrata in Romania care isi desfasoara activitatea in conformitate cu legislatia romaneasca
              privind asociatiile si fundatiile (OG 26/2000).
            </p>
            {representative && (
              <p>
                Organizatia este reprezentata legal de <strong>{representative}</strong>.
              </p>
            )}
            <p>
              Prezentii termeni si conditii reglementeaza relatia dintre {ngoName} si donatorii,
              sustinatorii si vizitatorii care interactioneaza cu organizatia prin intermediul
              acestei platforme.
            </p>
          </CardContent>
        </Card>

        {/* Section 2: Data collected */}
        <Card style={{ borderColor: `${primaryColor}22` }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" style={{ color: primaryColor }} />
              2. Ce date colectam
            </CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none space-y-3 text-muted-foreground">
            <p>
              {ngoName} poate colecta urmatoarele categorii de date personale, in functie
              de interactiunea dumneavoastra cu organizatia:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Date de identificare:</strong> nume, prenume, adresa de email, numar de telefon</li>
              <li><strong>Date de donatie:</strong> suma donata, data donatiei, metoda de plata (fara date de card)</li>
              <li><strong>Date de comunicare:</strong> preferinte de comunicare, istoricul mesajelor primite</li>
              <li><strong>Date Formular 230:</strong> CNP (optional), adresa de domiciliu - doar in scopul completarii formularului de redirectionare 3,5%</li>
              <li><strong>Date tehnice:</strong> adresa IP, tipul dispozitivului - colectate automat pentru securitate</li>
            </ul>
          </CardContent>
        </Card>

        {/* Section 3: How we use data */}
        <Card style={{ borderColor: `${primaryColor}22` }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" style={{ color: primaryColor }} />
              3. Cum folosim datele
            </CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none space-y-3 text-muted-foreground">
            <p>
              {ngoName} utilizeaza datele personale exclusiv in urmatoarele scopuri:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Gestionarea donatiilor:</strong> procesarea, confirmarea si raportarea donatiilor</li>
              <li><strong>Comunicare:</strong> trimiterea de actualizari, multumiri si rapoarte de impact catre donatori care si-au dat consimtamantul</li>
              <li><strong>Formular 230:</strong> generarea formularului de redirectionare 3,5% din impozitul pe venit</li>
              <li><strong>Obligatii legale:</strong> raportari fiscale si contabile cerute de legislatia romaneasca</li>
              <li><strong>Imbunatatirea serviciilor:</strong> analiza anonimizata pentru imbunatatirea experientei donatorilor</li>
            </ul>
            <p>
              <strong>Nu vindem, nu inchiriem si nu partajam datele dumneavoastra cu terti</strong> in
              scopuri comerciale. Datele sunt partajate doar cu furnizorii de servicii tehnice
              necesare functionarii platformei (trimitere email, SMS) si doar in masura strict necesara.
            </p>
          </CardContent>
        </Card>

        {/* Section 4: Data protection */}
        <Card style={{ borderColor: `${primaryColor}22` }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" style={{ color: primaryColor }} />
              4. Protectia datelor
            </CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none space-y-3 text-muted-foreground">
            <p>
              {ngoName} ia masuri tehnice si organizatorice adecvate pentru protejarea
              datelor dumneavoastra personale:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Criptare:</strong> datele sensibile (email, telefon) sunt criptate cu AES-256-GCM</li>
              <li><strong>Acces restrictionat:</strong> doar personalul autorizat al organizatiei are acces la datele donatorilor</li>
              <li><strong>Conexiuni securizate:</strong> toate comunicarile sunt protejate prin HTTPS/TLS</li>
              <li><strong>Audit:</strong> accesarile si modificarile datelor sunt inregistrate in jurnale de audit</li>
            </ul>
          </CardContent>
        </Card>

        {/* Section 5: Your rights */}
        <Card style={{ borderColor: `${primaryColor}22` }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" style={{ color: primaryColor }} />
              5. Drepturile dumneavoastra (GDPR)
            </CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none space-y-3 text-muted-foreground">
            <p>
              In conformitate cu Regulamentul General privind Protectia Datelor (GDPR),
              aveti urmatoarele drepturi:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Dreptul de acces:</strong> puteti solicita o copie a datelor personale detinute de {ngoName}</li>
              <li><strong>Dreptul la rectificare:</strong> puteti solicita corectarea datelor inexacte</li>
              <li><strong>Dreptul la stergere:</strong> puteti solicita stergerea datelor personale (&quot;dreptul de a fi uitat&quot;)</li>
              <li><strong>Dreptul la portabilitate:</strong> puteti solicita transferul datelor catre alt operator</li>
              <li><strong>Dreptul la opozitie:</strong> puteti refuza prelucrarea datelor in scopuri de marketing</li>
              <li><strong>Dreptul de dezabonare:</strong> fiecare mesaj contine un link de dezabonare</li>
            </ul>
            <p>
              Pentru exercitarea acestor drepturi, contactati {ngoName} folosind datele de contact
              de mai jos. Vom raspunde cererii in maximum 30 de zile.
            </p>
          </CardContent>
        </Card>

        {/* Section 6: Consent */}
        <Card style={{ borderColor: `${primaryColor}22` }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" style={{ color: primaryColor }} />
              6. Consimtamant si dezabonare
            </CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none space-y-3 text-muted-foreground">
            <p>
              {ngoName} comunica doar cu persoanele care si-au dat consimtamantul explicit.
              Consimtamantul este obtinut prin:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Completarea unui formular de donatie sau newsletter</li>
              <li>Bifarea explicita a optiunii de comunicare</li>
              <li>Solicitarea directa de informatii catre organizatie</li>
            </ul>
            <p>
              Puteti retrage consimtamantul in orice moment prin:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Click pe link-ul de dezabonare din orice mesaj primit</li>
              <li>Contactarea directa a organizatiei</li>
              <li>Raspunsul &quot;STOP&quot; la orice SMS primit</li>
            </ul>
          </CardContent>
        </Card>

        {/* Section 7: Cookies */}
        <Card style={{ borderColor: `${primaryColor}22` }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" style={{ color: primaryColor }} />
              7. Cookie-uri si tehnologii similare
            </CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none space-y-3 text-muted-foreground">
            <p>
              Aceasta pagina utilizeaza cookie-uri strict necesare pentru functionare.
              Nu folosim cookie-uri de marketing sau tracking. Cookie-urile utilizate sunt:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Cookie-uri de sesiune:</strong> pentru functionarea formularelor (expira la inchiderea browserului)</li>
              <li><strong>Cookie-uri functionale:</strong> pentru salvarea preferintelor (ex: limba)</li>
            </ul>
          </CardContent>
        </Card>

        {/* Section 8: Contact */}
        {(contactEmail || contactPhone) && (
          <Card style={{ borderColor: `${primaryColor}22` }}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" style={{ color: primaryColor }} />
                8. Contact
              </CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm max-w-none space-y-3 text-muted-foreground">
              <p>
                Pentru orice intrebari legate de datele dumneavoastra personale sau de
                acesti termeni si conditii, ne puteti contacta la:
              </p>
              <div className="not-prose flex flex-col sm:flex-row gap-4 mt-4">
                {contactEmail && (
                  <a
                    href={`mailto:${contactEmail}`}
                    className="inline-flex items-center gap-2 px-4 py-3 rounded-xl border hover:shadow-md transition-shadow"
                  >
                    <Mail className="h-5 w-5" style={{ color: primaryColor }} />
                    <span className="font-medium">{contactEmail}</span>
                  </a>
                )}
                {contactPhone && (
                  <a
                    href={`tel:${contactPhone}`}
                    className="inline-flex items-center gap-2 px-4 py-3 rounded-xl border hover:shadow-md transition-shadow"
                  >
                    <Phone className="h-5 w-5" style={{ color: primaryColor }} />
                    <span className="font-medium">{contactPhone}</span>
                  </a>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Footer */}
        <div className="text-center space-y-3 pb-8 print:pb-2">
          <p className="text-xs text-muted-foreground">
            Ultima actualizare: {currentDate}
          </p>
          <p className="text-xs text-muted-foreground">
            Acesti termeni si conditii sunt generati automat pe baza informatiilor furnizate
            de {ngoName} si sunt in conformitate cu legislatia GDPR aplicabila.
          </p>
          <a
            href={`/s/${params.slug}`}
            className="inline-flex items-center gap-1 text-sm hover:underline print:hidden"
            style={{ color: primaryColor }}
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Inapoi la pagina {ngoName}
          </a>
        </div>
      </div>
    </div>
  );
}

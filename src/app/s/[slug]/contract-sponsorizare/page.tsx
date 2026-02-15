"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  FileText,
  Loader2,
  Heart,
  Building,
  CheckCircle2,
  Download,
  ArrowLeft,
  Shield,
  Briefcase,
  Mail,
  Send,
} from "lucide-react";

interface NgoData {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logoUrl: string | null;
  websiteUrl: string | null;
  verification: {
    fiscalCode: string | null;
    registrationNumber: string | null;
    address: string | null;
    county: string | null;
    city: string | null;
    representativeName: string | null;
    representativeRole: string | null;
  } | null;
  miniSiteConfig: {
    bankAccount: string | null;
    bankName: string | null;
    contactEmail: string | null;
    contactPhone: string | null;
    contactAddress: string | null;
    legalRepresentative: string | null;
    legalRepresentativeRole: string | null;
    cui: string | null;
    registrationNr: string | null;
  } | null;
}

interface FormData {
  companyName: string;
  companyCui: string;
  companyAddress: string;
  companyCounty: string;
  companyCity: string;
  companyRegistration: string;
  companyRep: string;
  companyRepRole: string;
  companyEmail: string;
  companyPhone: string;
  companyIban: string;
  companyBank: string;
  amount: string;
  purpose: string;
  paymentDays: string;
}

const initialFormData: FormData = {
  companyName: "",
  companyCui: "",
  companyAddress: "",
  companyCounty: "",
  companyCity: "",
  companyRegistration: "",
  companyRep: "",
  companyRepRole: "Administrator",
  companyEmail: "",
  companyPhone: "",
  companyIban: "",
  companyBank: "",
  amount: "",
  purpose: "Sustinerea activitatilor si proiectelor organizatiei",
  paymentDays: "5",
};

export default function ContractSponsorizarePage() {
  const params = useParams();
  const slug = params?.slug as string;

  const [ngo, setNgo] = useState<NgoData | null>(null);
  const [form, setForm] = useState<FormData>(initialFormData);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [contractGenerated, setContractGenerated] = useState(false);
  const [contractNumber, setContractNumber] = useState("");
  const [contractDate, setContractDate] = useState("");
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);

  const contractRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!slug) return;
    const fetchNgo = async () => {
      try {
        const res = await fetch(`/api/minisite/${slug}`);
        if (!res.ok) throw new Error("Organizatia nu a fost gasita");
        const data = await res.json();
        setNgo(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchNgo();
  }, [slug]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!form.companyName || !form.companyCui || !form.companyRep || !form.amount) {
      setError("Completati campurile obligatorii: Denumire firma, CUI, Reprezentant, Suma.");
      return;
    }

    const amount = parseFloat(form.amount);
    if (isNaN(amount) || amount <= 0) {
      setError("Suma trebuie sa fie un numar pozitiv.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/public/contract-sponsorizare/${slug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Eroare la generarea contractului");
      }

      const data = await res.json();
      setContractNumber(data.contractNumber);
      setContractDate(
        new Date().toLocaleDateString("ro-RO", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        })
      );
      setContractGenerated(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownloadPdf = () => {
    const printContents = contractRef.current?.innerHTML;
    if (!printContents) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="ro">
      <head>
        <meta charset="UTF-8">
        <title>Contract de Sponsorizare - ${contractNumber}</title>
        <style>
          @page { margin: 2cm; size: A4; }
          body {
            font-family: "Times New Roman", Times, serif;
            font-size: 12pt; line-height: 1.6; color: #000;
            max-width: 21cm; margin: 0 auto; padding: 1cm;
          }
          .contract-logo { text-align: center; margin-bottom: 10px; }
          .contract-logo img { max-height: 80px; max-width: 200px; }
          .contract-header { text-align: center; margin-bottom: 30px; }
          .contract-header h1 { font-size: 18pt; font-weight: bold; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 8px; }
          .contract-header .contract-nr { font-size: 12pt; margin-bottom: 4px; }
          .contract-section { margin-bottom: 18px; }
          .contract-section h2 { font-size: 13pt; font-weight: bold; margin-bottom: 8px; text-transform: uppercase; }
          .contract-section p, .contract-section li { text-align: justify; margin-bottom: 6px; }
          .contract-section ol, .contract-section ul { padding-left: 20px; }
          .signatures { display: flex; justify-content: space-between; margin-top: 60px; page-break-inside: avoid; }
          .signature-block { width: 45%; text-align: center; }
          .signature-line { border-top: 1px solid #000; padding-top: 4px; margin-top: 60px; font-size: 10pt; }
          @media print { body { padding: 0; } }
        </style>
      </head>
      <body>${printContents}</body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  const handleSendEmail = async () => {
    if (!ngo || !contractRef.current) return;

    const contactEmail = ngo.miniSiteConfig?.contactEmail;
    if (!contactEmail) {
      setEmailError("Organizatia nu are o adresa de email configurata.");
      return;
    }

    setSendingEmail(true);
    setEmailError(null);

    try {
      const res = await fetch(`/api/public/contract-sponsorizare/${slug}/send-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contractHtml: contractRef.current.innerHTML,
          contractNumber,
          companyName: form.companyName,
          companyEmail: form.companyEmail,
          amount: form.amount,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Eroare la trimiterea emailului");
      }

      setEmailSent(true);
    } catch (err: any) {
      setEmailError(err.message);
    } finally {
      setSendingEmail(false);
    }
  };

  const formatAmount = (val: string) => {
    const num = parseFloat(val);
    if (isNaN(num)) return "0";
    return num.toLocaleString("ro-RO", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const numberToWordsRo = (num: number): string => {
    if (num === 0) return "zero";
    const units = ["", "unu", "doi", "trei", "patru", "cinci", "sase", "sapte", "opt", "noua"];
    const teens = ["zece", "unsprezece", "doisprezece", "treisprezece", "paisprezece", "cincisprezece", "saisprezece", "saptesprezece", "optsprezece", "nouasprezece"];
    const tens = ["", "", "douazeci", "treizeci", "patruzeci", "cincizeci", "saizeci", "saptezeci", "optzeci", "nouazeci"];

    const convertHundreds = (n: number): string => {
      let result = "";
      if (n >= 100) {
        if (n >= 200) {
          result += units[Math.floor(n / 100)] + "sute";
        } else {
          result += "osuta";
        }
        n %= 100;
        if (n > 0) result += " ";
      }
      if (n >= 20) {
        result += tens[Math.floor(n / 10)];
        if (n % 10 > 0) result += " si " + units[n % 10];
      } else if (n >= 10) {
        result += teens[n - 10];
      } else if (n > 0) {
        result += units[n];
      }
      return result;
    };

    const intPart = Math.floor(num);
    const decPart = Math.round((num - intPart) * 100);

    let result = "";
    if (intPart >= 1000000) {
      const mil = Math.floor(intPart / 1000000);
      result += (mil === 1 ? "unmilion" : convertHundreds(mil) + " milioane");
      const rest = intPart % 1000000;
      if (rest > 0) result += " " + convertLargeNumber(rest);
    } else {
      result = convertLargeNumber(intPart);
    }

    if (decPart > 0) {
      result += " lei si " + convertHundreds(decPart) + " bani";
    } else {
      result += " lei";
    }

    return result;

    function convertLargeNumber(n: number): string {
      if (n >= 1000) {
        const thousands = Math.floor(n / 1000);
        const rest = n % 1000;
        let s = "";
        if (thousands === 1) {
          s = "omie";
        } else {
          s = convertHundreds(thousands) + " mii";
        }
        if (rest > 0) s += " " + convertHundreds(rest);
        return s;
      }
      return convertHundreds(n);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-blue-600 mx-auto" />
          <p className="mt-4 text-sm text-gray-500">Se incarca datele organizatiei...</p>
        </div>
      </div>
    );
  }

  if (!ngo) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex items-center justify-center">
        <Card className="max-w-md w-full mx-4 shadow-xl border-0">
          <CardContent className="pt-8 pb-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
              <FileText className="h-8 w-8 text-red-400" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">Organizatia nu a fost gasita</h2>
            <p className="text-sm text-gray-500 mt-2">
              Verificati linkul si incercati din nou.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const ngoVerif = ngo.verification;
  const ngoConfig = ngo.miniSiteConfig;
  // Prefer miniSiteConfig data (edited in builder), fallback to verification
  const ngoCui = ngoConfig?.cui || ngoVerif?.fiscalCode || ngoVerif?.registrationNumber || "";
  const ngoRegistrationNr = ngoConfig?.registrationNr || ngoVerif?.registrationNumber || "";
  const ngoAddress = ngoConfig?.contactAddress || [
    ngoVerif?.address,
    ngoVerif?.city,
    ngoVerif?.county ? `jud. ${ngoVerif.county}` : "",
  ].filter(Boolean).join(", ");
  const ngoRep = ngoConfig?.legalRepresentative || ngoVerif?.representativeName || "";
  const ngoRepRole = ngoConfig?.legalRepresentativeRole || ngoVerif?.representativeRole || "Presedinte";
  const ngoIban = ngoConfig?.bankAccount || "";
  const ngoBank = ngoConfig?.bankName || "";
  const ngoPhone = ngoConfig?.contactPhone || "";
  const ngoEmail = ngoConfig?.contactEmail || "";
  const ngoWebsite = ngo.websiteUrl || "";
  const todayFormatted = new Date().toLocaleDateString("ro-RO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Back link */}
        <a
          href={`/s/${ngo.slug}`}
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-gray-500 transition-colors hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Inapoi la {ngo.name}
        </a>

        {/* Header */}
        <header className="mb-10 text-center">
          {ngo.logoUrl && (
            <div className="mb-4 flex justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={ngo.logoUrl}
                alt={ngo.name}
                className="h-16 w-auto object-contain"
              />
            </div>
          )}
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 shadow-sm">
            <Briefcase className="h-8 w-8 text-blue-600" />
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            Contract de Sponsorizare
          </h1>
          <p className="mt-3 text-base text-gray-500 max-w-2xl mx-auto">
            Completati datele firmei pentru a genera automat contractul de sponsorizare cu{" "}
            <span className="font-semibold text-gray-900">{ngo.name}</span>.
            Contractul va fi generat conform Legii nr. 32/1994 privind sponsorizarea.
          </p>
        </header>

        {!contractGenerated ? (
          /* ── FORM ── */
          <form onSubmit={handleSubmit}>
            <div className="grid gap-6">
              {/* Step 1: Company Data */}
              <Card className="border-0 shadow-lg">
                <CardHeader className="border-b bg-gray-50/50">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100">
                      <Building className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Datele Sponsorului</CardTitle>
                      <CardDescription>
                        Completati datele companiei care va sponsoriza organizatia.
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-5 pt-6">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="companyName">
                        Denumire firma / asociatie <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="companyName"
                        name="companyName"
                        placeholder="S.C. Exemplu S.R.L. sau Asociatia..."
                        value={form.companyName}
                        onChange={handleChange}
                        required
                        className="h-11"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="companyCui">
                        CUI / CIF <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="companyCui"
                        name="companyCui"
                        placeholder="RO12345678"
                        value={form.companyCui}
                        onChange={handleChange}
                        required
                        className="h-11"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="companyAddress">Sediul social (adresa completa)</Label>
                    <Input
                      id="companyAddress"
                      name="companyAddress"
                      placeholder="Str. Exemplu nr. 1, Bl. A, Sc. 1, Et. 2, Ap. 10"
                      value={form.companyAddress}
                      onChange={handleChange}
                      className="h-11"
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="space-y-2">
                      <Label htmlFor="companyCity">Oras</Label>
                      <Input
                        id="companyCity"
                        name="companyCity"
                        placeholder="Bucuresti"
                        value={form.companyCity}
                        onChange={handleChange}
                        className="h-11"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="companyCounty">Judet</Label>
                      <Input
                        id="companyCounty"
                        name="companyCounty"
                        placeholder="Bucuresti"
                        value={form.companyCounty}
                        onChange={handleChange}
                        className="h-11"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="companyRegistration">Nr. Reg. Comert / Registru special</Label>
                      <Input
                        id="companyRegistration"
                        name="companyRegistration"
                        placeholder="J40/1234/2020"
                        value={form.companyRegistration}
                        onChange={handleChange}
                        className="h-11"
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="companyRep">
                        Reprezentant legal <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="companyRep"
                        name="companyRep"
                        placeholder="Ion Popescu"
                        value={form.companyRep}
                        onChange={handleChange}
                        required
                        className="h-11"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="companyRepRole">Functia reprezentantului</Label>
                      <Input
                        id="companyRepRole"
                        name="companyRepRole"
                        placeholder="Administrator / Presedinte"
                        value={form.companyRepRole}
                        onChange={handleChange}
                        className="h-11"
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="companyIban">Cont bancar (IBAN)</Label>
                      <Input
                        id="companyIban"
                        name="companyIban"
                        placeholder="RO49AAAA1B31007593840000"
                        value={form.companyIban}
                        onChange={handleChange}
                        className="h-11"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="companyBank">Banca</Label>
                      <Input
                        id="companyBank"
                        name="companyBank"
                        placeholder="Banca Transilvania, Sucursala..."
                        value={form.companyBank}
                        onChange={handleChange}
                        className="h-11"
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="companyEmail">Email</Label>
                      <Input
                        id="companyEmail"
                        name="companyEmail"
                        type="email"
                        placeholder="contact@firma.ro"
                        value={form.companyEmail}
                        onChange={handleChange}
                        className="h-11"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="companyPhone">Telefon</Label>
                      <Input
                        id="companyPhone"
                        name="companyPhone"
                        placeholder="0721 123 456"
                        value={form.companyPhone}
                        onChange={handleChange}
                        className="h-11"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Step 2: Sponsorship Details */}
              <Card className="border-0 shadow-lg">
                <CardHeader className="border-b bg-gray-50/50">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100">
                      <FileText className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Detalii sponsorizare</CardTitle>
                      <CardDescription>
                        Specificati suma si scopul sponsorizarii.
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-5 pt-6">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="amount">
                        Suma sponsorizare (RON) <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="amount"
                        name="amount"
                        type="number"
                        step="0.01"
                        min="1"
                        placeholder="5000"
                        value={form.amount}
                        onChange={handleChange}
                        required
                        className="h-11"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="paymentDays">Termen plata (zile de la semnare)</Label>
                      <Input
                        id="paymentDays"
                        name="paymentDays"
                        type="number"
                        min="1"
                        placeholder="5"
                        value={form.paymentDays}
                        onChange={handleChange}
                        className="h-11"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="purpose">Obiectul / destinatia sponsorizarii</Label>
                    <Textarea
                      id="purpose"
                      name="purpose"
                      placeholder="Sustinerea activitatilor si proiectelor organizatiei..."
                      value={form.purpose}
                      onChange={handleChange}
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Step 3: NGO Info */}
              <Card className="border-0 shadow-lg">
                <CardHeader className="border-b bg-gray-50/50">
                  <div className="flex items-center gap-3">
                    {ngo.logoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={ngo.logoUrl} alt="" className="h-10 w-10 rounded-xl object-contain" />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100">
                        <Heart className="h-5 w-5 text-purple-600" />
                      </div>
                    )}
                    <div>
                      <CardTitle className="text-lg">Beneficiar: {ngo.name}</CardTitle>
                      <CardDescription>
                        Datele organizatiei sunt completate automat in contract.
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-xl bg-gray-50 p-4">
                      <p className="text-xs font-medium uppercase tracking-wider text-gray-400 mb-1">Denumire</p>
                      <p className="text-sm font-semibold text-gray-900">{ngo.name}</p>
                    </div>
                    {ngoCui && (
                      <div className="rounded-xl bg-gray-50 p-4">
                        <p className="text-xs font-medium uppercase tracking-wider text-gray-400 mb-1">CUI / CIF</p>
                        <p className="text-sm font-semibold text-gray-900">{ngoCui}</p>
                      </div>
                    )}
                    {ngoAddress && (
                      <div className="rounded-xl bg-gray-50 p-4">
                        <p className="text-xs font-medium uppercase tracking-wider text-gray-400 mb-1">Sediu</p>
                        <p className="text-sm font-semibold text-gray-900">{ngoAddress}</p>
                      </div>
                    )}
                    {ngoRep && (
                      <div className="rounded-xl bg-gray-50 p-4">
                        <p className="text-xs font-medium uppercase tracking-wider text-gray-400 mb-1">Reprezentant</p>
                        <p className="text-sm font-semibold text-gray-900">{ngoRep} - {ngoRepRole}</p>
                      </div>
                    )}
                    {ngoIban && (
                      <div className="rounded-xl bg-gray-50 p-4">
                        <p className="text-xs font-medium uppercase tracking-wider text-gray-400 mb-1">Cont bancar</p>
                        <p className="text-sm font-semibold text-gray-900">{ngoIban}{ngoBank ? ` - ${ngoBank}` : ""}</p>
                      </div>
                    )}
                    {(ngoPhone || ngoEmail) && (
                      <div className="rounded-xl bg-gray-50 p-4">
                        <p className="text-xs font-medium uppercase tracking-wider text-gray-400 mb-1">Contact</p>
                        <p className="text-sm font-semibold text-gray-900">
                          {ngoPhone}{ngoPhone && ngoEmail ? " | " : ""}{ngoEmail}
                        </p>
                      </div>
                    )}
                    {ngoWebsite && (
                      <div className="rounded-xl bg-gray-50 p-4">
                        <p className="text-xs font-medium uppercase tracking-wider text-gray-400 mb-1">Website</p>
                        <p className="text-sm font-semibold text-gray-900">{ngoWebsite}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="flex-col items-start gap-3">
                  {error && (
                    <div className="w-full rounded-xl bg-red-50 border border-red-100 p-4">
                      <p className="text-sm text-red-600">{error}</p>
                    </div>
                  )}
                </CardFooter>
              </Card>
            </div>

            {/* Info box */}
            <div className="mt-6 rounded-2xl bg-blue-50 border border-blue-100 p-5">
              <div className="flex gap-3">
                <Shield className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-blue-900">Contractul include clauze standard</p>
                  <p className="text-xs text-blue-600 mt-1">
                    Raspundere contractuala, cesiune, notificari, confidentialitate si dispozitii finale
                    conform legislatiei in vigoare (Legea 32/1994, Codul Civil, Codul Fiscal).
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8 flex justify-center">
              <Button type="submit" size="lg" disabled={submitting} className="min-w-[280px] h-14 text-base shadow-lg">
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Se genereaza contractul...
                  </>
                ) : (
                  <>
                    <FileText className="mr-2 h-5 w-5" />
                    Genereaza contractul de sponsorizare
                  </>
                )}
              </Button>
            </div>
          </form>
        ) : (
          /* ── GENERATED CONTRACT ── */
          <div>
            {/* Success banner */}
            <Card className="mb-6 border-0 shadow-lg bg-gradient-to-r from-emerald-50 to-green-50">
              <CardContent className="pt-6 pb-6">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 flex-shrink-0">
                    <CheckCircle2 className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-green-900 text-lg">
                      Contract generat cu succes!
                    </h3>
                    <p className="text-sm text-green-700">
                      Nr. <span className="font-bold">{contractNumber}</span> din {contractDate}.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Flow instructions */}
            <Card className="mb-6 border-0 shadow-lg bg-gradient-to-r from-blue-50 to-indigo-50">
              <CardContent className="pt-6 pb-6">
                <h3 className="font-bold text-blue-900 text-base mb-3 flex items-center gap-2">
                  <Shield className="h-5 w-5 text-blue-600" />
                  Cum finalizati contractul de sponsorizare
                </h3>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="flex gap-3 items-start">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-700 font-bold text-sm flex-shrink-0">1</div>
                    <div>
                      <p className="text-sm font-semibold text-blue-900">Descarcati</p>
                      <p className="text-xs text-blue-600">Printati sau salvati contractul ca PDF</p>
                    </div>
                  </div>
                  <div className="flex gap-3 items-start">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-700 font-bold text-sm flex-shrink-0">2</div>
                    <div>
                      <p className="text-sm font-semibold text-blue-900">Semnati si stampilati</p>
                      <p className="text-xs text-blue-600">Ambele exemplare trebuie semnate de sponsor</p>
                    </div>
                  </div>
                  <div className="flex gap-3 items-start">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-700 font-bold text-sm flex-shrink-0">3</div>
                    <div>
                      <p className="text-sm font-semibold text-blue-900">Trimiteti la ONG</p>
                      <p className="text-xs text-blue-600">Folositi butonul de mai jos pentru a trimite pe email</p>
                    </div>
                  </div>
                  <div className="flex gap-3 items-start">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-700 font-bold text-sm flex-shrink-0">4</div>
                    <div>
                      <p className="text-sm font-semibold text-blue-900">ONG-ul semneaza</p>
                      <p className="text-xs text-blue-600">Asociatia semneaza, stampileaza si va trimite inapoi</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Email status */}
            {emailSent && (
              <Card className="mb-6 border-0 shadow-lg bg-gradient-to-r from-green-50 to-emerald-50">
                <CardContent className="pt-5 pb-5">
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-green-600" />
                    <p className="text-sm font-semibold text-green-800">
                      Contractul a fost trimis cu succes pe email catre {ngo.miniSiteConfig?.contactEmail}!
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
            {emailError && (
              <Card className="mb-6 border-0 shadow-lg bg-red-50">
                <CardContent className="pt-5 pb-5">
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-red-500" />
                    <p className="text-sm text-red-700">{emailError}</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Action buttons */}
            <div className="flex flex-wrap justify-center gap-3 mb-8">
              <Button onClick={handleDownloadPdf} size="lg" className="h-12 shadow-md">
                <Download className="mr-2 h-5 w-5" />
                Descarca / Printeaza contractul
              </Button>
              {ngo.miniSiteConfig?.contactEmail && !emailSent && (
                <Button
                  onClick={handleSendEmail}
                  disabled={sendingEmail}
                  size="lg"
                  className="h-12 shadow-md bg-emerald-600 hover:bg-emerald-700"
                >
                  {sendingEmail ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Se trimite...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-5 w-5" />
                      Trimite pe email catre {ngo.name}
                    </>
                  )}
                </Button>
              )}
              <Button
                variant="outline"
                size="lg"
                className="h-12"
                onClick={() => {
                  setContractGenerated(false);
                  setEmailSent(false);
                  setEmailError(null);
                  setForm(initialFormData);
                }}
              >
                <FileText className="mr-2 h-4 w-4" />
                Contract nou
              </Button>
              <a href={`/s/${ngo.slug}`}>
                <Button variant="outline" size="lg" className="h-12">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Inapoi la site
                </Button>
              </a>
            </div>

            {/* Printable contract */}
            <Card className="shadow-2xl border-0">
              <CardContent className="p-8 sm:p-12 lg:p-16">
                <div ref={contractRef}>
                  {/* NGO Letterhead / Antet */}
                  <div style={{ borderBottom: "2px solid #333", paddingBottom: "15px", marginBottom: "25px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
                      {ngo.logoUrl && (
                        <div style={{ flexShrink: 0 }}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={ngo.logoUrl}
                            alt={ngo.name}
                            style={{ maxHeight: "70px", maxWidth: "160px", objectFit: "contain" }}
                          />
                        </div>
                      )}
                      <div style={{ flex: 1 }}>
                        <h2 style={{ fontSize: "16px", fontWeight: "bold", fontFamily: "serif", margin: "0 0 4px 0", textTransform: "uppercase" }}>
                          {ngo.name}
                        </h2>
                        {ngoAddress && (
                          <p style={{ fontSize: "11px", fontFamily: "serif", margin: "0 0 2px 0", color: "#333" }}>
                            Sediu: {ngoAddress}
                          </p>
                        )}
                        <div style={{ fontSize: "11px", fontFamily: "serif", color: "#333" }}>
                          {ngoCui && <span>CUI: {ngoCui}</span>}
                          {ngoCui && ngoRegistrationNr && <span> | </span>}
                          {ngoRegistrationNr && <span>Nr. inreg.: {ngoRegistrationNr}</span>}
                        </div>
                        <div style={{ fontSize: "11px", fontFamily: "serif", color: "#333", marginTop: "2px" }}>
                          {ngoPhone && <span>Tel: {ngoPhone}</span>}
                          {ngoPhone && ngoEmail && <span> | </span>}
                          {ngoEmail && <span>Email: {ngoEmail}</span>}
                          {(ngoPhone || ngoEmail) && ngoWebsite && <span> | </span>}
                          {ngoWebsite && <span>Web: {ngoWebsite}</span>}
                        </div>
                        {ngoIban && (
                          <p style={{ fontSize: "11px", fontFamily: "serif", margin: "2px 0 0 0", color: "#333" }}>
                            IBAN: {ngoIban}{ngoBank ? ` - ${ngoBank}` : ""}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Contract header */}
                  <div style={{ textAlign: "center", marginBottom: "35px" }}>
                    <h1
                      style={{
                        fontSize: "22px",
                        fontWeight: "bold",
                        textTransform: "uppercase",
                        letterSpacing: "3px",
                        marginBottom: "10px",
                        fontFamily: "serif",
                      }}
                    >
                      Contract de Sponsorizare
                    </h1>
                    <p style={{ fontSize: "14px", fontFamily: "serif" }}>
                      NR. <strong>{contractNumber}</strong> din data de{" "}
                      <strong>{contractDate}</strong>
                    </p>
                  </div>

                  <div style={{ fontFamily: "serif", fontSize: "13px", lineHeight: "1.8" }}>
                    {/* I. PARTIES */}
                    <div style={{ marginBottom: "22px" }}>
                      <h2 style={{ fontSize: "14px", fontWeight: "bold", textTransform: "uppercase", marginBottom: "10px" }}>
                        I. Prezentul contract a intervenit intre:
                      </h2>

                      <p style={{ textAlign: "justify", marginBottom: "12px" }}>
                        <strong>{ngo.name}</strong>
                        {ngoAddress && <>, cu sediul in {ngoAddress}</>}
                        {ngoVerif?.registrationNumber && (
                          <>, avand inregistrare la Registrul Comertului{ngoVerif.county ? ` ${ngoVerif.county}` : ""}</>
                        )}
                        {ngoCui && <>, CUI <strong>{ngoCui}</strong></>}
                        {ngoIban && (
                          <>, cont bancar {ngo.name} <strong>{ngoIban}</strong>{ngoBank ? ` deschis la ${ngoBank}` : ""}</>
                        )}
                        {ngoRep && (
                          <>, reprezentata legal prin <strong>{ngoRep}</strong></>
                        )}
                        , in calitate de <strong>BENEFICIAR</strong>
                      </p>

                      <p style={{ textAlign: "center", margin: "12px 0", fontWeight: "bold", fontSize: "14px" }}>
                        SI
                      </p>

                      <p style={{ textAlign: "justify", marginBottom: "12px" }}>
                        <strong>{form.companyName}</strong>
                        {(form.companyCity || form.companyAddress) && (
                          <>, cu sediul in{form.companyCity ? ` ${form.companyCity}` : ""}{form.companyAddress ? `, ${form.companyAddress}` : ""}{form.companyCounty ? `, judet ${form.companyCounty}` : ""}</>
                        )}
                        {form.companyRegistration && (
                          <>, inscrisa in Registrul Comertului sub nr. {form.companyRegistration}</>
                        )}
                        {form.companyCui && <>, avand CIF <strong>{form.companyCui}</strong></>}
                        {form.companyIban && (
                          <>, cont bancar <strong>{form.companyIban}</strong>{form.companyBank ? ` deschis la ${form.companyBank}` : ""}</>
                        )}
                        , reprezentata legal prin <strong>{form.companyRep}</strong> - {form.companyRepRole || "Administrator"}
                        , in calitate de <strong>SPONSOR</strong>.
                      </p>
                    </div>

                    {/* II. OBJECT */}
                    <div style={{ marginBottom: "22px" }}>
                      <h2 style={{ fontSize: "14px", fontWeight: "bold", textTransform: "uppercase", marginBottom: "10px" }}>
                        II. Obiectul contractului
                      </h2>
                      <p style={{ textAlign: "justify", marginBottom: "6px" }}>
                        <strong>2.1.</strong> Obiectul prezentului contract il constituie sponsorizarea BENEFICIARULUI
                        de catre SPONSOR in vederea sustinerii activitatilor{ngo.name ? ` ${ngo.name}` : ""}:
                      </p>
                      {form.purpose && (
                        <ul style={{ paddingLeft: "30px", marginBottom: "6px" }}>
                          <li style={{ textAlign: "justify", listStyleType: "disc" }}>
                            {form.purpose}
                          </li>
                        </ul>
                      )}
                    </div>

                    {/* III. DURATION */}
                    <div style={{ marginBottom: "22px" }}>
                      <h2 style={{ fontSize: "14px", fontWeight: "bold", textTransform: "uppercase", marginBottom: "10px" }}>
                        III. Durata contractului
                      </h2>
                      <p style={{ textAlign: "justify", marginBottom: "6px" }}>
                        <strong>3.1.</strong> Prezentul contract este valabil de la data semnarii sale pana
                        la indeplinirea obligatiilor de catre parti.
                      </p>
                    </div>

                    {/* IV. PRICE AND PAYMENT */}
                    <div style={{ marginBottom: "22px" }}>
                      <h2 style={{ fontSize: "14px", fontWeight: "bold", textTransform: "uppercase", marginBottom: "10px" }}>
                        IV. Pretul contractului si modalitatea de plata
                      </h2>
                      <p style={{ textAlign: "justify", marginBottom: "6px" }}>
                        <strong>4.1.</strong> Sponsorul va acorda Beneficiarului suma de{" "}
                        <strong>{formatAmount(form.amount)} RON</strong>{" "}
                        (adica: {numberToWordsRo(parseFloat(form.amount) || 0)}).
                      </p>
                    </div>

                    {/* V. BENEFICIARY OBLIGATIONS */}
                    <div style={{ marginBottom: "22px" }}>
                      <h2 style={{ fontSize: "14px", fontWeight: "bold", textTransform: "uppercase", marginBottom: "10px" }}>
                        V. Obligatiile Beneficiarului
                      </h2>
                      <p style={{ textAlign: "justify", marginBottom: "6px" }}>
                        <strong>5.1.</strong> Utilizarea sponsorizarii exclusiv in scopul precizat la capitolul
                        &quot;Obiectul contractului&quot; al prezentului contract.
                      </p>
                    </div>

                    {/* VI. SPONSOR OBLIGATIONS */}
                    <div style={{ marginBottom: "22px" }}>
                      <h2 style={{ fontSize: "14px", fontWeight: "bold", textTransform: "uppercase", marginBottom: "10px" }}>
                        VI. Obligatiile Sponsorului
                      </h2>
                      <p style={{ textAlign: "justify", marginBottom: "6px" }}>
                        <strong>6.1.</strong> Plata sumei reprezentand valoarea prezentului contract in conformitate
                        cu prevederile stabilite la capitolul &quot;PRETUL CONTRACTULUI SI MODALITATEA DE PLATA&quot;.
                      </p>
                      <p style={{ textAlign: "justify", marginBottom: "6px" }}>
                        <strong>6.2.</strong> Sa vireze suma in valoarea prevazuta la art. 4.1 in termen
                        de {form.paymentDays || "5"} zile de la semnarea contractului de catre parti.
                      </p>
                    </div>

                    {/* VII. LIABILITY */}
                    <div style={{ marginBottom: "22px" }}>
                      <h2 style={{ fontSize: "14px", fontWeight: "bold", textTransform: "uppercase", marginBottom: "10px" }}>
                        VII. Raspunderea contractuala
                      </h2>
                      <p style={{ textAlign: "justify", marginBottom: "6px" }}>
                        <strong>7.1.</strong> Nerespectarea clauzelor prezentului contract atrage dupa sine
                        raspunderea materiala sau dupa caz raspunderea civila si penala precum si plata
                        de penalitati si despagubiri la nivelul daunelor produse.
                      </p>
                      <p style={{ textAlign: "justify", marginBottom: "6px" }}>
                        <strong>7.2.</strong> Neexecutarea sau executarea necorespunzatoare a obligatiilor ce
                        revin partilor datorata fortei majore, degreveaza de raspundere cu conditia ca forta
                        majora sa poata fi dovedita cu acte si comunicata celeilalte parti in termen de cel
                        mult 15 zile de la aparitie.
                      </p>
                      <p style={{ textAlign: "justify", marginBottom: "6px" }}>
                        <strong>7.3.</strong> Cazurile de forta majora sunt prevazute in Codul Civil; se asimileaza
                        fortei majore si actele guvernamentale ce modifica vointa partilor, in totul sau in parte,
                        de la data incheierii acestui contract.
                      </p>
                    </div>

                    {/* VIII. ASSIGNMENT */}
                    <div style={{ marginBottom: "22px" }}>
                      <h2 style={{ fontSize: "14px", fontWeight: "bold", textTransform: "uppercase", marginBottom: "10px" }}>
                        VIII. Cesiunea contractului
                      </h2>
                      <p style={{ textAlign: "justify", marginBottom: "6px" }}>
                        <strong>8.1.</strong> Niciuna din partile prezentului contract nu va cesiona drepturile
                        si obligatiile sale rezultate din acest contract unei terte persoane.
                      </p>
                    </div>

                    {/* IX. NOTIFICATIONS */}
                    <div style={{ marginBottom: "22px" }}>
                      <h2 style={{ fontSize: "14px", fontWeight: "bold", textTransform: "uppercase", marginBottom: "10px" }}>
                        IX. Notificari
                      </h2>
                      <p style={{ textAlign: "justify", marginBottom: "6px" }}>
                        <strong>9.1.</strong> In cazul in care comunicarea va fi facuta prin posta, ea se va face
                        prin scrisoare recomandata care se va considera ca a fost primita de catre destinatar
                        in 6 zile de la data la care a fost predata serviciului postal.
                      </p>
                      <p style={{ textAlign: "justify", marginBottom: "6px" }}>
                        <strong>9.2.</strong> In cazul in care comunicarea va fi facuta sub forma de fax sau email,
                        comunicarea se considera primita de catre destinatar in prima zi lucratoare, urmatoare
                        celei in care a fost expediata.
                      </p>
                    </div>

                    {/* X. CONFIDENTIALITY */}
                    <div style={{ marginBottom: "22px" }}>
                      <h2 style={{ fontSize: "14px", fontWeight: "bold", textTransform: "uppercase", marginBottom: "10px" }}>
                        X. Confidentialitate
                      </h2>
                      <p style={{ textAlign: "justify", marginBottom: "6px" }}>
                        O parte contractanta nu are dreptul, fara acordul scris al celeilalte parti:
                      </p>
                      <ul style={{ paddingLeft: "30px", marginBottom: "6px" }}>
                        <li style={{ textAlign: "justify", marginBottom: "4px", listStyleType: "disc" }}>
                          De a face cunoscut contractul sau orice prevedere a acestuia unei terte parti,
                          in afara acelor persoane implicate in indeplinirea contractului;
                        </li>
                        <li style={{ textAlign: "justify", marginBottom: "4px", listStyleType: "disc" }}>
                          De a utiliza informatiile si documentele obtinute sau la care are acces in
                          perioada de derulare a contractului, in alt scop decat in acela de a-si
                          indeplini obligatiile contractuale;
                        </li>
                        <li style={{ textAlign: "justify", marginBottom: "4px", listStyleType: "disc" }}>
                          Dezvaluirea oricarei informatii fata de persoanele implicate in indeplinirea
                          contractului se va face confidential si se va extinde numai asupra acelor
                          informatii necesare in vederea indeplinirii contractului.
                        </li>
                      </ul>
                      <p style={{ textAlign: "justify", marginBottom: "6px" }}>
                        O parte contractanta va fi exonerata de raspunderea pentru dezvaluirea de informatii
                        referitoare la contract daca:
                      </p>
                      <ul style={{ paddingLeft: "30px", marginBottom: "6px" }}>
                        <li style={{ textAlign: "justify", marginBottom: "4px", listStyleType: "disc" }}>
                          Informatia era cunoscuta partii contractante inainte ca ea sa fi fost primita
                          de la cealalta parte contractanta; sau
                        </li>
                        <li style={{ textAlign: "justify", marginBottom: "4px", listStyleType: "disc" }}>
                          Informatia a fost dezvaluita dupa ce a fost obtinut acordul scris al celeilalte
                          parti contractante pentru asemenea dezvaluire; sau
                        </li>
                        <li style={{ textAlign: "justify", marginBottom: "4px", listStyleType: "disc" }}>
                          Partea contractanta a fost obligata in mod legal sa dezvaluie informatia.
                        </li>
                      </ul>
                    </div>

                    {/* XI. FINAL PROVISIONS */}
                    <div style={{ marginBottom: "22px" }}>
                      <h2 style={{ fontSize: "14px", fontWeight: "bold", textTransform: "uppercase", marginBottom: "10px" }}>
                        XI. Dispozitii finale
                      </h2>
                      <p style={{ textAlign: "justify", marginBottom: "6px" }}>
                        <strong>11.1.</strong> Modificarea prezentului contract poate fi facuta numai in scris,
                        prin acordul ambelor parti.
                      </p>
                      <p style={{ textAlign: "justify", marginBottom: "6px" }}>
                        <strong>11.2.</strong> Orice litigii nascute din interpretarea si executarea acestui
                        contract se vor solutiona pe cale amiabila, iar in situatia in care nu se va ajunge
                        la un rezultat pe aceasta cale, litigiile se supun instantelor judecatoresti competente.
                      </p>
                      <p style={{ textAlign: "justify", marginBottom: "6px" }}>
                        <strong>11.3.</strong> Prezentul contract a fost incheiat azi {contractDate},
                        in 2 (doua) exemplare, cate unul pentru fiecare parte.
                      </p>
                    </div>

                    {/* SIGNATURES */}
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginTop: "60px",
                        pageBreakInside: "avoid",
                      }}
                    >
                      <div style={{ width: "45%", textAlign: "center" }}>
                        <p style={{ fontWeight: "bold", fontSize: "13px", marginBottom: "6px", textTransform: "uppercase" }}>
                          SPONSOR
                        </p>
                        <p style={{ fontSize: "13px", fontWeight: "bold", marginBottom: "4px" }}>
                          {form.companyName}
                        </p>
                        <p style={{ fontSize: "12px", marginBottom: "4px" }}>
                          {form.companyRepRole || "Administrator"}: {form.companyRep}
                        </p>
                        <div
                          style={{
                            borderTop: "1px solid #000",
                            paddingTop: "6px",
                            marginTop: "70px",
                            fontSize: "11px",
                          }}
                        >
                          Semnatura si stampila
                        </div>
                      </div>

                      <div style={{ width: "45%", textAlign: "center" }}>
                        <p style={{ fontWeight: "bold", fontSize: "13px", marginBottom: "6px", textTransform: "uppercase" }}>
                          BENEFICIAR
                        </p>
                        <p style={{ fontSize: "13px", fontWeight: "bold", marginBottom: "4px" }}>
                          {ngo.name}
                        </p>
                        {ngoRep && (
                          <p style={{ fontSize: "12px", marginBottom: "4px" }}>
                            {ngoRepRole}: {ngoRep}
                          </p>
                        )}
                        <div
                          style={{
                            borderTop: "1px solid #000",
                            paddingTop: "6px",
                            marginTop: "70px",
                            fontSize: "11px",
                          }}
                        >
                          Semnatura si stampila
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Bottom action buttons */}
            <div className="flex flex-wrap justify-center gap-3 mt-8">
              <Button onClick={handleDownloadPdf} size="lg" className="h-12 shadow-md">
                <Download className="mr-2 h-5 w-5" />
                Descarca / Printeaza
              </Button>
              {ngo.miniSiteConfig?.contactEmail && !emailSent && (
                <Button
                  onClick={handleSendEmail}
                  disabled={sendingEmail}
                  size="lg"
                  className="h-12 shadow-md bg-emerald-600 hover:bg-emerald-700"
                >
                  {sendingEmail ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Se trimite...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-5 w-5" />
                      Trimite pe email catre {ngo.name}
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="text-center text-xs text-gray-400 mt-12 pb-8">
          <p>Contract generat automat. Respecta prevederile Legii nr. 32/1994 privind sponsorizarea si ale Codului Civil.</p>
        </footer>
      </div>
    </div>
  );
}

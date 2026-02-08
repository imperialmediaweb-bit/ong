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
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Printer,
  Loader2,
  Heart,
  Building,
  CheckCircle2,
} from "lucide-react";

interface NgoData {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logoUrl: string | null;
  verification: {
    fiscalCode: string | null;
    registrationNumber: string | null;
    address: string | null;
    county: string | null;
    city: string | null;
    representativeName: string | null;
    representativeRole: string | null;
  } | null;
}

interface FormData {
  companyName: string;
  companyCui: string;
  companyAddress: string;
  companyCounty: string;
  companyCity: string;
  companyRep: string;
  companyRepRole: string;
  companyEmail: string;
  companyPhone: string;
  companyIban: string;
  amount: string;
  purpose: string;
  paymentTerms: string;
  duration: string;
}

const initialFormData: FormData = {
  companyName: "",
  companyCui: "",
  companyAddress: "",
  companyCounty: "",
  companyCity: "",
  companyRep: "",
  companyRepRole: "Administrator",
  companyEmail: "",
  companyPhone: "",
  companyIban: "",
  amount: "",
  purpose: "",
  paymentTerms: "30 de zile de la semnarea contractului",
  duration: "12 luni",
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

  const handlePrint = () => {
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
          @page {
            margin: 2cm;
            size: A4;
          }
          body {
            font-family: "Times New Roman", Times, serif;
            font-size: 12pt;
            line-height: 1.6;
            color: #000;
            max-width: 21cm;
            margin: 0 auto;
            padding: 1cm;
          }
          .contract-header {
            text-align: center;
            margin-bottom: 30px;
          }
          .contract-header h1 {
            font-size: 18pt;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 2px;
            margin-bottom: 8px;
          }
          .contract-header .contract-nr {
            font-size: 12pt;
            margin-bottom: 4px;
          }
          .contract-section {
            margin-bottom: 20px;
          }
          .contract-section h2 {
            font-size: 13pt;
            font-weight: bold;
            margin-bottom: 8px;
            text-transform: uppercase;
          }
          .contract-section p, .contract-section li {
            text-align: justify;
            margin-bottom: 6px;
          }
          .contract-section ol {
            padding-left: 20px;
          }
          .contract-section ol li {
            margin-bottom: 4px;
          }
          .signatures {
            display: flex;
            justify-content: space-between;
            margin-top: 60px;
            page-break-inside: avoid;
          }
          .signature-block {
            width: 45%;
            text-align: center;
          }
          .signature-block .role {
            font-weight: bold;
            margin-bottom: 4px;
          }
          .signature-block .name {
            margin-bottom: 40px;
          }
          .signature-line {
            border-top: 1px solid #000;
            padding-top: 4px;
            margin-top: 60px;
            font-size: 10pt;
          }
          .stamp-area {
            margin-top: 10px;
            font-size: 10pt;
            font-style: italic;
            color: #666;
          }
          @media print {
            body { padding: 0; }
          }
        </style>
      </head>
      <body>
        ${printContents}
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 250);
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
      <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!ngo) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="pt-6 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-lg font-semibold">Organizatia nu a fost gasita</h2>
            <p className="text-sm text-muted-foreground mt-2">
              Verificati linkul si incercati din nou.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const ngoVerif = ngo.verification;
  const ngoCui = ngoVerif?.fiscalCode || ngoVerif?.registrationNumber || "";
  const ngoAddress = ngoVerif?.address || "";
  const ngoRep = ngoVerif?.representativeName || "";
  const ngoRepRole = ngoVerif?.representativeRole || "Presedinte";

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <header className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-primary/10 p-3 rounded-full">
              <FileText className="h-8 w-8 text-primary" />
            </div>
          </div>
          <h1 className="text-3xl font-bold">Contract de Sponsorizare</h1>
          <p className="mt-2 text-muted-foreground">
            Completati datele firmei pentru a genera automat contractul de sponsorizare cu{" "}
            <span className="font-semibold text-foreground">{ngo.name}</span>
          </p>
        </header>

        {!contractGenerated ? (
          /* ── FORM ── */
          <form onSubmit={handleSubmit}>
            <div className="grid gap-6 md:grid-cols-2">
              {/* Company Data Card */}
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building className="h-5 w-5" />
                    Datele firmei sponsorizatoare
                  </CardTitle>
                  <CardDescription>
                    Completati datele companiei care va fi parte in contractul de sponsorizare.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="companyName">
                        Denumire firma <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="companyName"
                        name="companyName"
                        placeholder="S.C. Exemplu S.R.L."
                        value={form.companyName}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="companyCui">
                        CUI / CIF <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="companyCui"
                        name="companyCui"
                        placeholder="RO12345678"
                        value={form.companyCui}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="companyAddress">Adresa sediului social</Label>
                    <Input
                      id="companyAddress"
                      name="companyAddress"
                      placeholder="Str. Exemplu nr. 1"
                      value={form.companyAddress}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="companyCity">Oras</Label>
                      <Input
                        id="companyCity"
                        name="companyCity"
                        placeholder="Bucuresti"
                        value={form.companyCity}
                        onChange={handleChange}
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
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="companyRep">
                        Reprezentant legal <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="companyRep"
                        name="companyRep"
                        placeholder="Ion Popescu"
                        value={form.companyRep}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="companyRepRole">Functia</Label>
                      <Input
                        id="companyRepRole"
                        name="companyRepRole"
                        placeholder="Administrator"
                        value={form.companyRepRole}
                        onChange={handleChange}
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
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="companyIban">IBAN (optional)</Label>
                    <Input
                      id="companyIban"
                      name="companyIban"
                      placeholder="RO49AAAA1B31007593840000"
                      value={form.companyIban}
                      onChange={handleChange}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Contract Details Card */}
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Detalii sponsorizare
                  </CardTitle>
                  <CardDescription>
                    Specificati suma, scopul si conditiile sponsorizarii.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="amount">
                        Suma sponsorizare (RON) <span className="text-destructive">*</span>
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
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="duration">Durata contract</Label>
                      <Input
                        id="duration"
                        name="duration"
                        placeholder="12 luni"
                        value={form.duration}
                        onChange={handleChange}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="purpose">Scopul / destinatia sponsorizarii</Label>
                    <Textarea
                      id="purpose"
                      name="purpose"
                      placeholder="Sustinerea activitatilor organizatiei, programe educationale, etc."
                      value={form.purpose}
                      onChange={handleChange}
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="paymentTerms">Conditii de plata</Label>
                    <Input
                      id="paymentTerms"
                      name="paymentTerms"
                      placeholder="30 de zile de la semnarea contractului"
                      value={form.paymentTerms}
                      onChange={handleChange}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* NGO Info (read-only) */}
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Heart className="h-5 w-5 text-primary" />
                    Beneficiar: {ngo.name}
                  </CardTitle>
                  <CardDescription>
                    Datele organizatiei vor fi completate automat in contract.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3 sm:grid-cols-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Denumire:</span>{" "}
                      <span className="font-medium">{ngo.name}</span>
                    </div>
                    {ngoCui && (
                      <div>
                        <span className="text-muted-foreground">CUI/CIF:</span>{" "}
                        <span className="font-medium">{ngoCui}</span>
                      </div>
                    )}
                    {ngoAddress && (
                      <div>
                        <span className="text-muted-foreground">Adresa:</span>{" "}
                        <span className="font-medium">{ngoAddress}</span>
                      </div>
                    )}
                    {ngoRep && (
                      <div>
                        <span className="text-muted-foreground">Reprezentant:</span>{" "}
                        <span className="font-medium">{ngoRep} - {ngoRepRole}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
                <CardFooter>
                  {error && (
                    <p className="text-sm text-destructive w-full">{error}</p>
                  )}
                </CardFooter>
              </Card>
            </div>

            <div className="mt-6 flex justify-center">
              <Button type="submit" size="lg" disabled={submitting} className="min-w-[240px]">
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Se genereaza...
                  </>
                ) : (
                  <>
                    <FileText className="mr-2 h-4 w-4" />
                    Genereaza contractul
                  </>
                )}
              </Button>
            </div>
          </form>
        ) : (
          /* ── GENERATED CONTRACT ── */
          <div>
            {/* Success banner */}
            <Card className="mb-6 border-green-200 bg-green-50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-6 w-6 text-green-600 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-green-900">
                      Contract generat cu succes!
                    </h3>
                    <p className="text-sm text-green-700">
                      Numarul contractului: <span className="font-bold">{contractNumber}</span>.
                      Printati, semnati si stampilati contractul de mai jos.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Print button */}
            <div className="flex justify-center gap-3 mb-6">
              <Button onClick={handlePrint} size="lg">
                <Printer className="mr-2 h-4 w-4" />
                Printeaza contractul
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => {
                  setContractGenerated(false);
                  setForm(initialFormData);
                }}
              >
                Contract nou
              </Button>
            </div>

            {/* Printable contract */}
            <Card className="shadow-lg">
              <CardContent className="p-8 sm:p-12">
                <div ref={contractRef}>
                  <div className="contract-header" style={{ textAlign: "center", marginBottom: "30px" }}>
                    <h1
                      style={{
                        fontSize: "22px",
                        fontWeight: "bold",
                        textTransform: "uppercase",
                        letterSpacing: "2px",
                        marginBottom: "8px",
                        fontFamily: "serif",
                      }}
                    >
                      Contract de Sponsorizare
                    </h1>
                    <p style={{ fontSize: "14px", fontFamily: "serif" }}>
                      Nr. <strong>{contractNumber}</strong> din data de{" "}
                      <strong>{contractDate}</strong>
                    </p>
                  </div>

                  <div style={{ fontFamily: "serif", fontSize: "13px", lineHeight: "1.8" }}>
                    {/* CHAPTER I - Parties */}
                    <div style={{ marginBottom: "20px" }}>
                      <h2
                        style={{
                          fontSize: "14px",
                          fontWeight: "bold",
                          textTransform: "uppercase",
                          marginBottom: "10px",
                        }}
                      >
                        Capitolul I - Partile contractante
                      </h2>

                      <p style={{ textAlign: "justify", marginBottom: "10px" }}>
                        <strong>1. SPONSORUL:</strong>{" "}
                        <strong>{form.companyName}</strong>, cu sediul social in{" "}
                        {form.companyCity && `${form.companyCity}, `}
                        {form.companyCounty && `jud. ${form.companyCounty}, `}
                        {form.companyAddress && `${form.companyAddress}, `}
                        inregistrata la Registrul Comertului, avand Codul Unic de Inregistrare (CUI){" "}
                        <strong>{form.companyCui}</strong>
                        {form.companyIban && (
                          <>, cont bancar IBAN: {form.companyIban}</>
                        )}
                        , reprezentata legal prin{" "}
                        <strong>{form.companyRep}</strong>, in calitate de{" "}
                        <strong>{form.companyRepRole || "Administrator"}</strong>,
                        {form.companyEmail && <> email: {form.companyEmail},</>}
                        {form.companyPhone && <> telefon: {form.companyPhone},</>}
                        {" "}denumit/a in continuare <strong>&quot;Sponsorul&quot;</strong>,
                      </p>

                      <p style={{ textAlign: "center", margin: "8px 0", fontWeight: "bold" }}>
                        si
                      </p>

                      <p style={{ textAlign: "justify", marginBottom: "10px" }}>
                        <strong>2. BENEFICIARUL:</strong>{" "}
                        <strong>{ngo.name}</strong>
                        {ngoAddress && <>, cu sediul in {ngoAddress}</>}
                        {ngoCui && (
                          <>, avand Codul de Identificare Fiscala (CIF) <strong>{ngoCui}</strong></>
                        )}
                        {ngoRep && (
                          <>
                            , reprezentat/a legal prin <strong>{ngoRep}</strong>, in calitate de{" "}
                            <strong>{ngoRepRole}</strong>
                          </>
                        )}
                        , denumit/a in continuare <strong>&quot;Beneficiarul&quot;</strong>.
                      </p>
                    </div>

                    {/* CHAPTER II - Object */}
                    <div style={{ marginBottom: "20px" }}>
                      <h2
                        style={{
                          fontSize: "14px",
                          fontWeight: "bold",
                          textTransform: "uppercase",
                          marginBottom: "10px",
                        }}
                      >
                        Capitolul II - Obiectul contractului
                      </h2>
                      <p style={{ textAlign: "justify", marginBottom: "6px" }}>
                        <strong>Art. 1.</strong> Obiectul prezentului contract il constituie sponsorizarea de catre
                        Sponsor a Beneficiarului, in conformitate cu prevederile Legii nr. 32/1994 privind
                        sponsorizarea, cu modificarile si completarile ulterioare.
                      </p>
                      {form.purpose && (
                        <p style={{ textAlign: "justify", marginBottom: "6px" }}>
                          <strong>Art. 2.</strong> Sponsorizarea are ca destinatie:{" "}
                          <strong>{form.purpose}</strong>.
                        </p>
                      )}
                    </div>

                    {/* CHAPTER III - Value */}
                    <div style={{ marginBottom: "20px" }}>
                      <h2
                        style={{
                          fontSize: "14px",
                          fontWeight: "bold",
                          textTransform: "uppercase",
                          marginBottom: "10px",
                        }}
                      >
                        Capitolul III - Valoarea contractului
                      </h2>
                      <p style={{ textAlign: "justify", marginBottom: "6px" }}>
                        <strong>Art. 3.</strong> Valoarea totala a sponsorizarii este de{" "}
                        <strong>{formatAmount(form.amount)} RON</strong>{" "}
                        (adica: {numberToWordsRo(parseFloat(form.amount) || 0)}).
                      </p>
                      <p style={{ textAlign: "justify", marginBottom: "6px" }}>
                        <strong>Art. 4.</strong> Plata sponsorizarii se va efectua prin virament bancar in contul
                        Beneficiarului, in termen de{" "}
                        <strong>{form.paymentTerms}</strong>.
                      </p>
                    </div>

                    {/* CHAPTER IV - Sponsor Obligations */}
                    <div style={{ marginBottom: "20px" }}>
                      <h2
                        style={{
                          fontSize: "14px",
                          fontWeight: "bold",
                          textTransform: "uppercase",
                          marginBottom: "10px",
                        }}
                      >
                        Capitolul IV - Obligatiile Sponsorului
                      </h2>
                      <p style={{ textAlign: "justify", marginBottom: "6px" }}>
                        <strong>Art. 5.</strong> Sponsorul se obliga:
                      </p>
                      <ol style={{ paddingLeft: "20px", marginBottom: "6px" }}>
                        <li style={{ textAlign: "justify", marginBottom: "4px" }}>
                          Sa vireze suma prevazuta la art. 3 din prezentul contract in contul bancar al
                          Beneficiarului, in termenul stabilit;
                        </li>
                        <li style={{ textAlign: "justify", marginBottom: "4px" }}>
                          Sa nu impuna Beneficiarului efectuarea de activitati cu caracter publicitar sau
                          de reclama avand scop comercial;
                        </li>
                        <li style={{ textAlign: "justify", marginBottom: "4px" }}>
                          Sa respecte prevederile Legii nr. 32/1994 privind sponsorizarea.
                        </li>
                      </ol>
                    </div>

                    {/* CHAPTER V - Beneficiary Obligations */}
                    <div style={{ marginBottom: "20px" }}>
                      <h2
                        style={{
                          fontSize: "14px",
                          fontWeight: "bold",
                          textTransform: "uppercase",
                          marginBottom: "10px",
                        }}
                      >
                        Capitolul V - Obligatiile Beneficiarului
                      </h2>
                      <p style={{ textAlign: "justify", marginBottom: "6px" }}>
                        <strong>Art. 6.</strong> Beneficiarul se obliga:
                      </p>
                      <ol style={{ paddingLeft: "20px", marginBottom: "6px" }}>
                        <li style={{ textAlign: "justify", marginBottom: "4px" }}>
                          Sa utilizeze suma primita exclusiv in scopul declarat in prezentul contract;
                        </li>
                        <li style={{ textAlign: "justify", marginBottom: "4px" }}>
                          Sa emita o confirmare scrisa de primire a sponsorizarii;
                        </li>
                        <li style={{ textAlign: "justify", marginBottom: "4px" }}>
                          Sa aduca la cunostinta Sponsorului modul de utilizare a sumelor primite, la cererea acestuia;
                        </li>
                        <li style={{ textAlign: "justify", marginBottom: "4px" }}>
                          Sa respecte prevederile legale in vigoare cu privire la organizatiile neguvernamentale
                          si la sponsorizare.
                        </li>
                      </ol>
                    </div>

                    {/* CHAPTER VI - Duration */}
                    <div style={{ marginBottom: "20px" }}>
                      <h2
                        style={{
                          fontSize: "14px",
                          fontWeight: "bold",
                          textTransform: "uppercase",
                          marginBottom: "10px",
                        }}
                      >
                        Capitolul VI - Durata contractului
                      </h2>
                      <p style={{ textAlign: "justify", marginBottom: "6px" }}>
                        <strong>Art. 7.</strong> Prezentul contract intra in vigoare la data semnarii sale de catre
                        ambele parti si este valabil pe o perioada de{" "}
                        <strong>{form.duration || "12 luni"}</strong>.
                      </p>
                      <p style={{ textAlign: "justify", marginBottom: "6px" }}>
                        <strong>Art. 8.</strong> Contractul poate fi prelungit prin acordul scris al ambelor parti.
                      </p>
                    </div>

                    {/* CHAPTER VII - Fiscal Provisions */}
                    <div style={{ marginBottom: "20px" }}>
                      <h2
                        style={{
                          fontSize: "14px",
                          fontWeight: "bold",
                          textTransform: "uppercase",
                          marginBottom: "10px",
                        }}
                      >
                        Capitolul VII - Prevederi fiscale
                      </h2>
                      <p style={{ textAlign: "justify", marginBottom: "6px" }}>
                        <strong>Art. 9.</strong> In conformitate cu prevederile Legii nr. 227/2015 privind Codul
                        fiscal, cu modificarile si completarile ulterioare, Sponsorul beneficiaza de facilitati
                        fiscale pentru sumele alocate sponsorizarii, in limitele si conditiile prevazute de lege.
                      </p>
                      <p style={{ textAlign: "justify", marginBottom: "6px" }}>
                        <strong>Art. 10.</strong> Sponsorul are dreptul de a deduce cheltuielile de sponsorizare din
                        impozitul pe profit datorat, in limita a 0,75% din cifra de afaceri si in limita a 20% din
                        impozitul pe profit datorat, conform legislatiei in vigoare.
                      </p>
                    </div>

                    {/* CHAPTER VIII - Final Provisions */}
                    <div style={{ marginBottom: "20px" }}>
                      <h2
                        style={{
                          fontSize: "14px",
                          fontWeight: "bold",
                          textTransform: "uppercase",
                          marginBottom: "10px",
                        }}
                      >
                        Capitolul VIII - Dispozitii finale
                      </h2>
                      <p style={{ textAlign: "justify", marginBottom: "6px" }}>
                        <strong>Art. 11.</strong> Orice modificare a prezentului contract se face prin act aditional
                        semnat de ambele parti.
                      </p>
                      <p style={{ textAlign: "justify", marginBottom: "6px" }}>
                        <strong>Art. 12.</strong> Eventualele litigii aparute in legatura cu executarea prezentului
                        contract se vor rezolva pe cale amiabila. In cazul in care nu se ajunge la o intelegere, litigiile
                        vor fi solutionate de instanta de judecata competenta.
                      </p>
                      <p style={{ textAlign: "justify", marginBottom: "6px" }}>
                        <strong>Art. 13.</strong> Prezentul contract s-a incheiat in doua (2) exemplare originale,
                        cate unul pentru fiecare parte, avand aceeasi valoare juridica.
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
                        <p style={{ fontWeight: "bold", fontSize: "13px", marginBottom: "4px" }}>
                          SPONSORUL
                        </p>
                        <p style={{ fontSize: "13px", marginBottom: "4px" }}>
                          {form.companyName}
                        </p>
                        <p style={{ fontSize: "12px", marginBottom: "4px" }}>
                          Prin: {form.companyRep}
                        </p>
                        <p style={{ fontSize: "12px", marginBottom: "40px" }}>
                          {form.companyRepRole || "Administrator"}
                        </p>
                        <div
                          style={{
                            borderTop: "1px solid #000",
                            paddingTop: "4px",
                            marginTop: "40px",
                            fontSize: "11px",
                          }}
                        >
                          Semnatura si stampila
                        </div>
                      </div>

                      <div style={{ width: "45%", textAlign: "center" }}>
                        <p style={{ fontWeight: "bold", fontSize: "13px", marginBottom: "4px" }}>
                          BENEFICIARUL
                        </p>
                        <p style={{ fontSize: "13px", marginBottom: "4px" }}>
                          {ngo.name}
                        </p>
                        {ngoRep && (
                          <p style={{ fontSize: "12px", marginBottom: "4px" }}>
                            Prin: {ngoRep}
                          </p>
                        )}
                        <p style={{ fontSize: "12px", marginBottom: "40px" }}>
                          {ngoRepRole}
                        </p>
                        <div
                          style={{
                            borderTop: "1px solid #000",
                            paddingTop: "4px",
                            marginTop: "40px",
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

            {/* Bottom print button */}
            <div className="flex justify-center gap-3 mt-6">
              <Button onClick={handlePrint} size="lg">
                <Printer className="mr-2 h-4 w-4" />
                Printeaza contractul
              </Button>
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="text-center text-xs text-muted-foreground mt-10 pb-8">
          <p>Generat automat prin NGO HUB. Contractul respecta prevederile Legii nr. 32/1994 privind sponsorizarea.</p>
        </footer>
      </div>
    </div>
  );
}

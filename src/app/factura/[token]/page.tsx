"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { BinevoLogo } from "@/components/BinevoLogo";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  CreditCard,
  Building2,
  Upload,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  Loader2,
  Download,
  Copy,
  Check,
  ExternalLink,
  Shield,
} from "lucide-react";

interface InvoiceData {
  id: string;
  invoiceNumber: string;
  sellerName: string;
  sellerCui: string | null;
  sellerRegCom: string | null;
  sellerAddress: string | null;
  sellerCity: string | null;
  sellerCounty: string | null;
  sellerEmail: string | null;
  sellerPhone: string | null;
  sellerIban: string | null;
  sellerBankName: string | null;
  sellerVatPayer: boolean;
  buyerName: string;
  buyerCui: string | null;
  buyerEmail: string | null;
  issueDate: string;
  dueDate: string | null;
  status: string;
  items: any[];
  subtotal: number;
  vatAmount: number;
  totalAmount: number;
  currency: string;
  paidAt: string | null;
  paymentMethod: string | null;
  notes: string | null;
  subscriptionPlan: string | null;
  paymentProofUrl: string | null;
}

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  DRAFT: { label: "Ciorna", color: "bg-slate-100 text-slate-700", icon: FileText },
  ISSUED: { label: "Emisa", color: "bg-blue-100 text-blue-700", icon: Clock },
  SENT: { label: "Trimisa", color: "bg-purple-100 text-purple-700", icon: Clock },
  PAID: { label: "Platita", color: "bg-green-100 text-green-700", icon: CheckCircle2 },
  OVERDUE: { label: "Restanta", color: "bg-red-100 text-red-700", icon: AlertCircle },
  CANCELLED: { label: "Anulata", color: "bg-gray-100 text-gray-700", icon: AlertCircle },
  STORNO: { label: "Stornata", color: "bg-orange-100 text-orange-700", icon: AlertCircle },
};

interface PaymentMethodOption {
  id: string;
  label: string;
  description: string;
  processor: string;
}

export default function InvoicePaymentPage({ params }: { params: { token: string } }) {
  const [invoice, setInvoice] = useState<InvoiceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [showBankTransfer, setShowBankTransfer] = useState(false);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofNote, setProofNote] = useState("");
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [copiedIban, setCopiedIban] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodOption[]>([]);

  const fetchInvoice = useCallback(async () => {
    try {
      const res = await fetch(`/api/invoices/by-token?token=${params.token}`);
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Factura nu a fost gasita");
        return;
      }
      const data = await res.json();
      setInvoice(data);
    } catch {
      setError("Eroare la incarcarea facturii");
    } finally {
      setLoading(false);
    }
  }, [params.token]);

  useEffect(() => {
    fetchInvoice();
    // Fetch available payment methods
    fetch("/api/invoices/pay")
      .then((r) => r.json())
      .then((d) => setPaymentMethods(d.methods || []))
      .catch(() => {});
  }, [fetchInvoice]);

  const hasNetopia = paymentMethods.some((m) => m.id === "netopia");

  const handleCardPayment = async () => {
    if (!invoice) return;
    setPaymentLoading(true);
    try {
      const res = await fetch("/api/invoices/pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentToken: params.token,
          paymentMethod: "card",
        }),
      });
      const data = await res.json();
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        setError(data.error || "Eroare la procesarea platii");
      }
    } catch {
      setError("Eroare la procesarea platii");
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleNetopiaPayment = async () => {
    if (!invoice) return;
    setPaymentLoading(true);
    try {
      const res = await fetch("/api/invoices/pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentToken: params.token,
          paymentMethod: "netopia",
        }),
      });
      const data = await res.json();
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        setError(data.error || "Eroare la procesarea platii Netopia");
      }
    } catch {
      setError("Eroare la procesarea platii Netopia");
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleProofUpload = async () => {
    if (!invoice) return;
    setUploadLoading(true);
    try {
      const formData = new FormData();
      formData.append("paymentToken", params.token);
      if (proofFile) formData.append("proof", proofFile);
      if (proofNote) formData.append("note", proofNote);

      const res = await fetch("/api/invoices/upload-proof", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (data.success) {
        setUploadSuccess(true);
        fetchInvoice();
      } else {
        setError(data.error || "Eroare la incarcare");
      }
    } catch {
      setError("Eroare la incarcarea dovezii");
    } finally {
      setUploadLoading(false);
    }
  };

  const copyIban = () => {
    if (invoice?.sellerIban) {
      navigator.clipboard.writeText(invoice.sellerIban);
      setCopiedIban(true);
      setTimeout(() => setCopiedIban(false), 2000);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("ro-RO", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const formatAmount = (amount: number, currency: string) => {
    return `${amount.toLocaleString("ro-RO", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (error && !invoice) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h1 className="text-xl font-bold mb-2">Factura nu a fost gasita</h1>
            <p className="text-muted-foreground mb-6">{error}</p>
            <Link href="/">
              <Button>Inapoi la Binevo</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!invoice) return null;

  const statusInfo = statusConfig[invoice.status] || statusConfig.DRAFT;
  const StatusIcon = statusInfo.icon;
  const isPaid = invoice.status === "PAID";
  const isOverdue = invoice.status === "OVERDUE";
  const canPay = !isPaid && invoice.status !== "CANCELLED" && invoice.status !== "STORNO";

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white border-b shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/">
            <BinevoLogo size="md" />
          </Link>
          <Badge className={statusInfo.color}>
            <StatusIcon className="h-3.5 w-3.5 mr-1.5" />
            {statusInfo.label}
          </Badge>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {error && (
          <div className="bg-red-50 text-red-700 p-3 rounded-md text-sm mb-6">{error}</div>
        )}

        {/* Invoice Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Factura {invoice.invoiceNumber}
              </h1>
              {invoice.subscriptionPlan && (
                <p className="text-muted-foreground mt-1">
                  Abonament {invoice.subscriptionPlan} Binevo
                </p>
              )}
            </div>
            <div className="text-right">
              <p className="text-3xl font-extrabold text-indigo-600">
                {formatAmount(invoice.totalAmount, invoice.currency)}
              </p>
              {invoice.dueDate && !isPaid && (
                <p className={`text-sm mt-1 ${isOverdue ? "text-red-600 font-semibold" : "text-muted-foreground"}`}>
                  Scadenta: {formatDate(invoice.dueDate)}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Invoice Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Parties */}
            <Card>
              <CardContent className="p-6">
                <div className="grid md:grid-cols-2 gap-8">
                  {/* Seller */}
                  <div>
                    <h3 className="text-xs uppercase tracking-wider text-indigo-600 font-semibold mb-3">
                      Furnizor
                    </h3>
                    <p className="font-bold text-gray-900">{invoice.sellerName}</p>
                    {invoice.sellerCui && <p className="text-sm text-gray-600">CUI: {invoice.sellerCui}</p>}
                    {invoice.sellerRegCom && <p className="text-sm text-gray-600">Reg. Com.: {invoice.sellerRegCom}</p>}
                    {invoice.sellerAddress && <p className="text-sm text-gray-600">{invoice.sellerAddress}</p>}
                    {invoice.sellerCity && (
                      <p className="text-sm text-gray-600">
                        {invoice.sellerCity}{invoice.sellerCounty ? `, ${invoice.sellerCounty}` : ""}
                      </p>
                    )}
                    {invoice.sellerEmail && <p className="text-sm text-gray-600">{invoice.sellerEmail}</p>}
                  </div>

                  {/* Buyer */}
                  <div>
                    <h3 className="text-xs uppercase tracking-wider text-indigo-600 font-semibold mb-3">
                      Cumparator
                    </h3>
                    <p className="font-bold text-gray-900">{invoice.buyerName}</p>
                    {invoice.buyerCui && <p className="text-sm text-gray-600">CUI: {invoice.buyerCui}</p>}
                    {invoice.buyerEmail && <p className="text-sm text-gray-600">{invoice.buyerEmail}</p>}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Dates */}
            <Card>
              <CardContent className="p-6">
                <div className="flex gap-8 flex-wrap">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-gray-500 font-medium">Data emiterii</p>
                    <p className="font-semibold mt-1">{formatDate(invoice.issueDate)}</p>
                  </div>
                  {invoice.dueDate && (
                    <div>
                      <p className="text-xs uppercase tracking-wider text-gray-500 font-medium">Scadenta</p>
                      <p className={`font-semibold mt-1 ${isOverdue ? "text-red-600" : ""}`}>
                        {formatDate(invoice.dueDate)}
                      </p>
                    </div>
                  )}
                  {invoice.paidAt && (
                    <div>
                      <p className="text-xs uppercase tracking-wider text-gray-500 font-medium">Data platii</p>
                      <p className="font-semibold mt-1 text-green-700">{formatDate(invoice.paidAt)}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Items */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">Detalii factura</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left">
                        <th className="pb-2 font-medium text-gray-500">Descriere</th>
                        <th className="pb-2 font-medium text-gray-500 text-right">Cant.</th>
                        <th className="pb-2 font-medium text-gray-500 text-right">Pret unitar</th>
                        {invoice.sellerVatPayer && <th className="pb-2 font-medium text-gray-500 text-right">TVA</th>}
                        <th className="pb-2 font-medium text-gray-500 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(invoice.items || []).map((item: any, i: number) => (
                        <tr key={i} className="border-b last:border-0">
                          <td className="py-3">{item.description}</td>
                          <td className="py-3 text-right">{item.quantity} {item.unit}</td>
                          <td className="py-3 text-right">{formatAmount(item.unitPrice, invoice.currency)}</td>
                          {invoice.sellerVatPayer && <td className="py-3 text-right">{item.vatRate}%</td>}
                          <td className="py-3 text-right font-semibold">
                            {formatAmount(item.totalGross || item.totalNet, invoice.currency)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Totals */}
                <div className="mt-4 pt-4 border-t space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Subtotal</span>
                    <span>{formatAmount(invoice.subtotal, invoice.currency)}</span>
                  </div>
                  {invoice.sellerVatPayer && invoice.vatAmount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">TVA</span>
                      <span>{formatAmount(invoice.vatAmount, invoice.currency)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-bold pt-2 border-t">
                    <span>Total</span>
                    <span className="text-indigo-600">{formatAmount(invoice.totalAmount, invoice.currency)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {invoice.notes && (
              <Card>
                <CardContent className="p-6">
                  <p className="text-sm text-gray-500">{invoice.notes}</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Payment Panel */}
          <div className="space-y-6">
            {isPaid ? (
              <Card className="border-green-200 bg-green-50">
                <CardContent className="p-6 text-center">
                  <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto mb-3" />
                  <h3 className="text-lg font-bold text-green-800">Factura platita</h3>
                  <p className="text-sm text-green-700 mt-2">
                    Platita la {invoice.paidAt ? formatDate(invoice.paidAt) : ""}
                    {invoice.paymentMethod && (
                      <span className="block mt-1">
                        Metoda: {invoice.paymentMethod === "stripe" || invoice.paymentMethod === "card"
                          ? "Card bancar"
                          : invoice.paymentMethod === "bank_transfer"
                          ? "Transfer bancar"
                          : invoice.paymentMethod}
                      </span>
                    )}
                  </p>
                </CardContent>
              </Card>
            ) : invoice.paymentProofUrl ? (
              <Card className="border-amber-200 bg-amber-50">
                <CardContent className="p-6 text-center">
                  <Clock className="h-12 w-12 text-amber-600 mx-auto mb-3" />
                  <h3 className="text-lg font-bold text-amber-800">Dovada incarcata</h3>
                  <p className="text-sm text-amber-700 mt-2">
                    Am primit dovada de plata. Verificam si confirmam in cel mai scurt timp.
                  </p>
                </CardContent>
              </Card>
            ) : canPay ? (
              <>
                {/* Card Payment - Stripe */}
                <Card className="border-indigo-200">
                  <CardContent className="p-6">
                    <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <CreditCard className="h-5 w-5 text-indigo-600" />
                      Plateste cu cardul
                    </h3>
                    <p className="text-sm text-gray-500 mb-4">
                      Plata sigura prin Stripe. Acceptam Visa, Mastercard, American Express.
                    </p>
                    <Button
                      onClick={handleCardPayment}
                      disabled={paymentLoading}
                      className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                      size="lg"
                    >
                      {paymentLoading ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <CreditCard className="h-4 w-4 mr-2" />
                      )}
                      Plateste {formatAmount(invoice.totalAmount, invoice.currency)}
                    </Button>
                    <div className="flex items-center gap-1.5 justify-center mt-3 text-xs text-gray-400">
                      <Shield className="h-3 w-3" />
                      Securizat prin Stripe
                    </div>
                  </CardContent>
                </Card>

                {/* Netopia Payment */}
                {hasNetopia && (
                  <Card className="border-emerald-200">
                    <CardContent className="p-6">
                      <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <CreditCard className="h-5 w-5 text-emerald-600" />
                        Plateste cu Netopia
                      </h3>
                      <p className="text-sm text-gray-500 mb-4">
                        Plata cu cardul prin Netopia Payments. Visa, Mastercard.
                      </p>
                      <Button
                        onClick={handleNetopiaPayment}
                        disabled={paymentLoading}
                        variant="outline"
                        className="w-full border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                        size="lg"
                      >
                        {paymentLoading ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <CreditCard className="h-4 w-4 mr-2" />
                        )}
                        Plateste prin Netopia
                      </Button>
                      <div className="flex items-center gap-1.5 justify-center mt-3 text-xs text-gray-400">
                        <Shield className="h-3 w-3" />
                        Securizat prin Netopia Payments
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Bank Transfer */}
                <Card>
                  <CardContent className="p-6">
                    <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-gray-600" />
                      Transfer bancar
                    </h3>

                    {!showBankTransfer ? (
                      <Button
                        variant="outline"
                        onClick={() => setShowBankTransfer(true)}
                        className="w-full"
                      >
                        Plateste prin transfer bancar
                      </Button>
                    ) : (
                      <div className="space-y-4">
                        {/* Bank details */}
                        {invoice.sellerIban && (
                          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-xs text-gray-500 font-medium">IBAN</p>
                                <p className="font-mono text-sm font-semibold">{invoice.sellerIban}</p>
                              </div>
                              <Button size="sm" variant="ghost" onClick={copyIban}>
                                {copiedIban ? (
                                  <Check className="h-4 w-4 text-green-600" />
                                ) : (
                                  <Copy className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                            {invoice.sellerBankName && (
                              <div>
                                <p className="text-xs text-gray-500 font-medium">Banca</p>
                                <p className="text-sm">{invoice.sellerBankName}</p>
                              </div>
                            )}
                            <div>
                              <p className="text-xs text-gray-500 font-medium">Beneficiar</p>
                              <p className="text-sm">{invoice.sellerName}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 font-medium">Referinta plata</p>
                              <p className="text-sm font-semibold">{invoice.invoiceNumber}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 font-medium">Suma</p>
                              <p className="text-sm font-bold text-indigo-600">
                                {formatAmount(invoice.totalAmount, invoice.currency)}
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Upload proof */}
                        {!uploadSuccess ? (
                          <div className="space-y-3">
                            <p className="text-sm text-gray-500">
                              Dupa ce efectuati transferul, incarcati dovada platii (screenshot/PDF):
                            </p>
                            <div className="space-y-2">
                              <Label htmlFor="proof">Dovada de plata</Label>
                              <Input
                                id="proof"
                                type="file"
                                accept="image/*,.pdf"
                                onChange={(e) => setProofFile(e.target.files?.[0] || null)}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="note">Observatii (optional)</Label>
                              <Textarea
                                id="note"
                                placeholder="Ex: Transfer efectuat din contul RO..."
                                value={proofNote}
                                onChange={(e) => setProofNote(e.target.value)}
                                rows={2}
                              />
                            </div>
                            <Button
                              onClick={handleProofUpload}
                              disabled={uploadLoading || !proofFile}
                              className="w-full"
                              variant="outline"
                            >
                              {uploadLoading ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              ) : (
                                <Upload className="h-4 w-4 mr-2" />
                              )}
                              Incarca dovada platii
                            </Button>
                          </div>
                        ) : (
                          <div className="bg-green-50 rounded-lg p-4 text-center">
                            <CheckCircle2 className="h-8 w-8 text-green-600 mx-auto mb-2" />
                            <p className="text-sm font-semibold text-green-800">
                              Dovada a fost incarcata cu succes!
                            </p>
                            <p className="text-xs text-green-600 mt-1">
                              Vom verifica plata si veti primi confirmarea.
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card className="border-gray-200">
                <CardContent className="p-6 text-center">
                  <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <h3 className="text-lg font-bold text-gray-600">Factura indisponibila</h3>
                  <p className="text-sm text-gray-500 mt-2">
                    Aceasta factura nu mai poate fi platita.
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Help */}
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-gray-500 text-center">
                  Aveti intrebari? Contactati-ne la{" "}
                  <a href="mailto:contact@binevo.ro" className="text-indigo-600 hover:underline">
                    contact@binevo.ro
                  </a>
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-12 border-t bg-white">
        <div className="container mx-auto px-4 py-6 text-center text-sm text-gray-400">
          <BinevoLogo size="sm" />
          <p className="mt-2">&copy; 2024 Binevo. Platforma pentru ONG-uri din Romania.</p>
        </div>
      </footer>
    </div>
  );
}

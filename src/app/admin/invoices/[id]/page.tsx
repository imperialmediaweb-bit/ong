"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Receipt, ArrowLeft, Loader2, Printer, CheckCircle2,
  Send, FileText, XCircle, Clock, AlertCircle, Trash2, Upload, RefreshCw,
} from "lucide-react";
import Link from "next/link";

interface InvoiceItem {
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  vatRate: number;
  totalNet: number;
  totalVat: number;
  totalGross: number;
}

interface InvoiceDetail {
  id: string;
  invoiceNumber: string;
  invoiceSeries: string | null;
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
  buyerRegCom: string | null;
  buyerAddress: string | null;
  buyerCity: string | null;
  buyerCounty: string | null;
  buyerEmail: string | null;
  buyerPhone: string | null;
  issueDate: string;
  dueDate: string | null;
  status: string;
  items: InvoiceItem[];
  subtotal: number;
  vatAmount: number;
  totalAmount: number;
  currency: string;
  paidAt: string | null;
  paymentMethod: string | null;
  notes: string | null;
  internalNotes: string | null;
  createdAt: string;
  // e-Factura
  eFacturaStatus: string | null;
  eFacturaId: string | null;
  eFacturaSentAt: string | null;
  eFacturaValidAt: string | null;
  eFacturaErrors: any;
}

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  DRAFT: { label: "Ciorna", color: "bg-slate-100 text-slate-700", icon: FileText },
  ISSUED: { label: "Emisa", color: "bg-blue-100 text-blue-700", icon: Receipt },
  SENT: { label: "Trimisa", color: "bg-purple-100 text-purple-700", icon: Send },
  PAID: { label: "Platita", color: "bg-green-100 text-green-700", icon: CheckCircle2 },
  OVERDUE: { label: "Restanta", color: "bg-red-100 text-red-700", icon: AlertCircle },
  CANCELLED: { label: "Anulata", color: "bg-gray-100 text-gray-700", icon: XCircle },
  STORNO: { label: "Stornata", color: "bg-orange-100 text-orange-700", icon: XCircle },
};

export default function InvoiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [invoice, setInvoice] = useState<InvoiceDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState("");
  const [eFacturaLoading, setEFacturaLoading] = useState(false);
  const [eFacturaMsg, setEFacturaMsg] = useState("");

  useEffect(() => {
    fetchInvoice();
  }, [params.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchInvoice = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/invoices/${params.id}`);
      if (!res.ok) throw new Error("Eroare");
      const data = await res.json();
      setInvoice(data);
    } catch {
      setError("Eroare la incarcarea facturii");
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (newStatus: string) => {
    setUpdating(true);
    try {
      const res = await fetch(`/api/admin/invoices/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("Eroare");
      await fetchInvoice();
    } catch {
      setError("Eroare la actualizarea statusului");
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Sigur doriti sa stergeti aceasta factura?")) return;
    try {
      const res = await fetch(`/api/admin/invoices/${params.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Eroare la stergere");
        return;
      }
      router.push("/admin/invoices");
    } catch {
      setError("Eroare la stergerea facturii");
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleEFactura = async (action: "generate" | "upload" | "check") => {
    setEFacturaLoading(true);
    setEFacturaMsg("");
    try {
      const res = await fetch("/api/admin/efactura", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoiceId: params.id, action }),
      });
      const data = await res.json();
      if (!res.ok) {
        setEFacturaMsg(`Eroare: ${data.error || "Eroare necunoscuta"}`);
      } else {
        const msgs: Record<string, string> = {
          generate: "XML e-Factura generat cu succes",
          upload: "e-Factura incarcata in ANAF cu succes",
          check: `Status ANAF: ${data.eFacturaStatus || data.status}`,
        };
        setEFacturaMsg(msgs[action] || "Operatiune reusita");
        fetchInvoice();
      }
    } catch {
      setEFacturaMsg("Eroare la comunicarea cu serverul");
    } finally {
      setEFacturaLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("ro-RO", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const formatAmount = (amount: number, currency: string) => {
    return `${amount.toLocaleString("ro-RO", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground">{error || "Factura nu a fost gasita"}</p>
        <Link href="/admin/invoices">
          <Button className="mt-4" variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" /> Inapoi la facturi
          </Button>
        </Link>
      </div>
    );
  }

  const statusInfo = statusConfig[invoice.status] || statusConfig.DRAFT;
  const items: InvoiceItem[] = Array.isArray(invoice.items) ? invoice.items : [];

  return (
    <div className="space-y-6">
      {/* Header - hidden on print */}
      <div className="flex items-center justify-between print:hidden">
        <div className="flex items-center gap-3">
          <Link href="/admin/invoices">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Factura {invoice.invoiceNumber}</h1>
            <Badge className={statusInfo.color}>
              {statusInfo.label}
            </Badge>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" /> Printeaza
          </Button>
          {invoice.status === "DRAFT" && (
            <>
              <Button size="sm" onClick={() => updateStatus("ISSUED")} disabled={updating}>
                <Receipt className="h-4 w-4 mr-2" /> Emite
              </Button>
              <Button size="sm" variant="destructive" onClick={handleDelete}>
                <Trash2 className="h-4 w-4 mr-2" /> Sterge
              </Button>
            </>
          )}
          {invoice.status === "ISSUED" && (
            <Button size="sm" onClick={() => updateStatus("SENT")} disabled={updating}>
              <Send className="h-4 w-4 mr-2" /> Marcheaza trimisa
            </Button>
          )}
          {(invoice.status === "ISSUED" || invoice.status === "SENT" || invoice.status === "OVERDUE") && (
            <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => updateStatus("PAID")} disabled={updating}>
              <CheckCircle2 className="h-4 w-4 mr-2" /> Marcheaza platita
            </Button>
          )}
          {invoice.status !== "CANCELLED" && invoice.status !== "PAID" && invoice.status !== "STORNO" && (
            <Button size="sm" variant="outline" className="text-red-600" onClick={() => updateStatus("CANCELLED")} disabled={updating}>
              <XCircle className="h-4 w-4 mr-2" /> Anuleaza
            </Button>
          )}
        </div>
      </div>

      {/* e-Factura Section */}
      <Card className="print:hidden border-orange-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-orange-600" />
              <div>
                <p className="font-semibold text-sm">e-Factura ANAF</p>
                <p className="text-xs text-muted-foreground">
                  {invoice.eFacturaStatus === "validated" ? (
                    <span className="text-green-600">Validata de ANAF</span>
                  ) : invoice.eFacturaStatus === "uploaded" ? (
                    <span className="text-blue-600">Incarcata in ANAF - in procesare</span>
                  ) : invoice.eFacturaStatus === "generated" ? (
                    <span className="text-amber-600">XML generat - gata de incarcare</span>
                  ) : invoice.eFacturaStatus === "rejected" ? (
                    <span className="text-red-600">Respinsa de ANAF</span>
                  ) : invoice.eFacturaStatus === "error" ? (
                    <span className="text-red-600">Eroare</span>
                  ) : (
                    "Negenerata"
                  )}
                  {invoice.eFacturaId && <span className="ml-2 font-mono">ID: {invoice.eFacturaId}</span>}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              {!invoice.eFacturaStatus || invoice.eFacturaStatus === "rejected" || invoice.eFacturaStatus === "error" ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleEFactura("generate")}
                  disabled={eFacturaLoading}
                >
                  {eFacturaLoading ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <FileText className="h-3 w-3 mr-1" />}
                  Genereaza XML
                </Button>
              ) : null}
              {invoice.eFacturaStatus === "generated" && (
                <Button
                  size="sm"
                  onClick={() => handleEFactura("upload")}
                  disabled={eFacturaLoading}
                  className="bg-orange-600 hover:bg-orange-700"
                >
                  {eFacturaLoading ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Upload className="h-3 w-3 mr-1" />}
                  Trimite la ANAF
                </Button>
              )}
              {invoice.eFacturaStatus === "uploaded" && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleEFactura("check")}
                  disabled={eFacturaLoading}
                >
                  {eFacturaLoading ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <RefreshCw className="h-3 w-3 mr-1" />}
                  Verifica status
                </Button>
              )}
            </div>
          </div>
          {eFacturaMsg && (
            <p className={`text-xs mt-2 ${eFacturaMsg.startsWith("Eroare") ? "text-red-600" : "text-green-600"}`}>
              {eFacturaMsg}
            </p>
          )}
          {invoice.eFacturaErrors && Array.isArray(invoice.eFacturaErrors) && invoice.eFacturaErrors.length > 0 && (
            <div className="mt-2 text-xs text-red-600 bg-red-50 rounded p-2">
              {(invoice.eFacturaErrors as string[]).map((err: string, i: number) => (
                <p key={i}>{err}</p>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {error && <div className="bg-red-50 text-red-700 p-3 rounded-md text-sm print:hidden">{error}</div>}

      {/* Invoice Document */}
      <Card className="print:shadow-none print:border-0">
        <CardContent className="p-8">
          {/* Invoice Header */}
          <div className="flex justify-between items-start mb-8 border-b pb-6">
            <div>
              <h2 className="text-2xl font-bold text-blue-600">FACTURA</h2>
              <p className="text-lg font-mono font-bold mt-1">{invoice.invoiceNumber}</p>
              {invoice.invoiceSeries && (
                <p className="text-sm text-muted-foreground">Seria: {invoice.invoiceSeries}</p>
              )}
            </div>
            <div className="text-right">
              <p className="text-sm">
                <span className="text-muted-foreground">Data emitere: </span>
                <strong>{formatDate(invoice.issueDate)}</strong>
              </p>
              {invoice.dueDate && (
                <p className="text-sm">
                  <span className="text-muted-foreground">Scadenta: </span>
                  <strong>{formatDate(invoice.dueDate)}</strong>
                </p>
              )}
              {invoice.paidAt && (
                <p className="text-sm text-green-600">
                  <span>Platita: </span>
                  <strong>{formatDate(invoice.paidAt)}</strong>
                </p>
              )}
            </div>
          </div>

          {/* Seller & Buyer */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div>
              <h3 className="text-xs font-bold uppercase text-muted-foreground mb-2 tracking-wider">Furnizor</h3>
              <div className="text-sm space-y-0.5">
                <p className="font-bold text-base">{invoice.sellerName}</p>
                {invoice.sellerCui && <p>CUI: {invoice.sellerCui}</p>}
                {invoice.sellerRegCom && <p>Reg. Com.: {invoice.sellerRegCom}</p>}
                {invoice.sellerAddress && (
                  <p>{invoice.sellerAddress}{invoice.sellerCity ? `, ${invoice.sellerCity}` : ""}{invoice.sellerCounty ? `, ${invoice.sellerCounty}` : ""}</p>
                )}
                {invoice.sellerEmail && <p>Email: {invoice.sellerEmail}</p>}
                {invoice.sellerPhone && <p>Tel: {invoice.sellerPhone}</p>}
                {invoice.sellerIban && (
                  <p>IBAN: {invoice.sellerIban}{invoice.sellerBankName ? ` - ${invoice.sellerBankName}` : ""}</p>
                )}
              </div>
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase text-muted-foreground mb-2 tracking-wider">Cumparator</h3>
              <div className="text-sm space-y-0.5">
                <p className="font-bold text-base">{invoice.buyerName}</p>
                {invoice.buyerCui && <p>CUI: {invoice.buyerCui}</p>}
                {invoice.buyerRegCom && <p>Reg. Com.: {invoice.buyerRegCom}</p>}
                {invoice.buyerAddress && (
                  <p>{invoice.buyerAddress}{invoice.buyerCity ? `, ${invoice.buyerCity}` : ""}{invoice.buyerCounty ? `, ${invoice.buyerCounty}` : ""}</p>
                )}
                {invoice.buyerEmail && <p>Email: {invoice.buyerEmail}</p>}
                {invoice.buyerPhone && <p>Tel: {invoice.buyerPhone}</p>}
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="mb-8">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-slate-200">
                  <th className="text-left py-2 font-semibold">Nr.</th>
                  <th className="text-left py-2 font-semibold">Descriere</th>
                  <th className="text-center py-2 font-semibold">UM</th>
                  <th className="text-right py-2 font-semibold">Cant.</th>
                  <th className="text-right py-2 font-semibold">Pret unitar</th>
                  <th className="text-right py-2 font-semibold">TVA %</th>
                  <th className="text-right py-2 font-semibold">Valoare</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => (
                  <tr key={idx} className="border-b border-slate-100">
                    <td className="py-2">{idx + 1}</td>
                    <td className="py-2">{item.description}</td>
                    <td className="py-2 text-center">{item.unit || "buc"}</td>
                    <td className="py-2 text-right">{item.quantity}</td>
                    <td className="py-2 text-right">{formatAmount(item.unitPrice, invoice.currency)}</td>
                    <td className="py-2 text-right">{item.vatRate}%</td>
                    <td className="py-2 text-right font-medium">{formatAmount(item.totalNet, invoice.currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="flex justify-end">
            <div className="w-64 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal (fara TVA):</span>
                <span>{formatAmount(invoice.subtotal, invoice.currency)}</span>
              </div>
              {invoice.sellerVatPayer && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">TVA:</span>
                  <span>{formatAmount(invoice.vatAmount, invoice.currency)}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold border-t pt-2">
                <span>TOTAL:</span>
                <span>{formatAmount(invoice.totalAmount, invoice.currency)}</span>
              </div>
            </div>
          </div>

          {/* Notes */}
          {invoice.notes && (
            <div className="mt-8 pt-6 border-t">
              <h3 className="text-xs font-bold uppercase text-muted-foreground mb-2">Observatii</h3>
              <p className="text-sm whitespace-pre-wrap">{invoice.notes}</p>
            </div>
          )}

          {/* Payment info */}
          {invoice.paidAt && (
            <div className="mt-4 p-3 bg-green-50 rounded-lg text-sm">
              <div className="flex items-center gap-2 text-green-700">
                <CheckCircle2 className="h-4 w-4" />
                <span>Platita la {formatDate(invoice.paidAt)}</span>
                {invoice.paymentMethod && <span>- {invoice.paymentMethod}</span>}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Internal Notes - hidden on print */}
      {invoice.internalNotes && (
        <Card className="print:hidden border-yellow-200">
          <CardContent className="p-4">
            <h3 className="text-sm font-semibold flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4 text-yellow-600" /> Note interne
            </h3>
            <p className="text-sm text-muted-foreground">{invoice.internalNotes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

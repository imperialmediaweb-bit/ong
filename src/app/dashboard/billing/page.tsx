"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { BinevoLogo } from "@/components/BinevoLogo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Receipt, CreditCard, FileText, CheckCircle2, Clock, AlertCircle,
  Loader2, ExternalLink, Edit3, Save, Building2, RefreshCw,
} from "lucide-react";

interface Invoice {
  id: string;
  invoiceNumber: string;
  status: string;
  totalAmount: number;
  currency: string;
  issueDate: string;
  dueDate: string | null;
  paidAt: string | null;
  paymentToken: string | null;
  subscriptionPlan: string | null;
  subscriptionMonth: string | null;
}

interface BillingInfo {
  billingName: string | null;
  billingCui: string | null;
  billingRegCom: string | null;
  billingAddress: string | null;
  billingCity: string | null;
  billingCounty: string | null;
  billingEmail: string | null;
  billingPhone: string | null;
  paymentMethod: string | null;
}

interface NgoInfo extends BillingInfo {
  id: string;
  name: string;
  subscriptionPlan: string;
  subscriptionStatus: string | null;
  subscriptionStartAt: string | null;
  subscriptionExpiresAt: string | null;
  autoRenew: boolean;
}

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  DRAFT: { label: "Ciorna", color: "bg-slate-100 text-slate-700", icon: FileText },
  ISSUED: { label: "Emisa", color: "bg-blue-100 text-blue-700", icon: Clock },
  SENT: { label: "Trimisa", color: "bg-purple-100 text-purple-700", icon: Clock },
  PAID: { label: "Platita", color: "bg-green-100 text-green-700", icon: CheckCircle2 },
  OVERDUE: { label: "Restanta", color: "bg-red-100 text-red-700", icon: AlertCircle },
  CANCELLED: { label: "Anulata", color: "bg-gray-100 text-gray-700", icon: AlertCircle },
};

export default function BillingPage() {
  const [ngo, setNgo] = useState<NgoInfo | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [editBilling, setEditBilling] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [billingForm, setBillingForm] = useState<BillingInfo>({
    billingName: null,
    billingCui: null,
    billingRegCom: null,
    billingAddress: null,
    billingCity: null,
    billingCounty: null,
    billingEmail: null,
    billingPhone: null,
    paymentMethod: null,
  });

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/dashboard/billing");
      if (!res.ok) throw new Error("Eroare");
      const data = await res.json();
      setNgo(data.ngo);
      setInvoices(data.invoices || []);
      if (data.ngo) {
        setBillingForm({
          billingName: data.ngo.billingName,
          billingCui: data.ngo.billingCui,
          billingRegCom: data.ngo.billingRegCom,
          billingAddress: data.ngo.billingAddress,
          billingCity: data.ngo.billingCity,
          billingCounty: data.ngo.billingCounty,
          billingEmail: data.ngo.billingEmail,
          billingPhone: data.ngo.billingPhone,
          paymentMethod: data.ngo.paymentMethod,
        });
      }
    } catch {
      setError("Eroare la incarcarea datelor");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSaveBilling = async () => {
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/dashboard/billing", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(billingForm),
      });
      if (!res.ok) throw new Error("Eroare");
      setSuccess("Datele de facturare au fost actualizate");
      setTimeout(() => setSuccess(""), 3000);
      setEditBilling(false);
      fetchData();
    } catch {
      setError("Eroare la salvare");
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("ro-RO", { day: "2-digit", month: "long", year: "numeric" });

  const formatAmount = (amount: number, currency: string) =>
    `${amount.toLocaleString("ro-RO", { minimumFractionDigits: 2 })} ${currency}`;

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const planColors: Record<string, string> = {
    BASIC: "bg-gray-100 text-gray-700",
    PRO: "bg-indigo-100 text-indigo-700",
    ELITE: "bg-purple-100 text-purple-700",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Receipt className="h-7 w-7 text-indigo-600" />
        <div>
          <h1 className="text-3xl font-bold">Facturare</h1>
          <p className="text-sm text-muted-foreground">Gestioneaza abonamentul si facturile</p>
        </div>
      </div>

      {success && <div className="bg-green-50 text-green-700 p-3 rounded-md text-sm">{success}</div>}
      {error && <div className="bg-red-50 text-red-700 p-3 rounded-md text-sm">{error}</div>}

      {/* Subscription Status */}
      {ngo && (
        <div className="grid md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-5">
              <p className="text-sm text-muted-foreground">Plan curent</p>
              <div className="flex items-center gap-2 mt-1">
                <Badge className={planColors[ngo.subscriptionPlan] || planColors.BASIC}>
                  {ngo.subscriptionPlan}
                </Badge>
                {ngo.subscriptionStatus && (
                  <span className="text-xs text-muted-foreground">({ngo.subscriptionStatus})</span>
                )}
              </div>
              {ngo.subscriptionPlan === "BASIC" && (
                <Link href="/checkout" className="block mt-3">
                  <Button size="sm" className="bg-gradient-to-r from-indigo-600 to-purple-600">
                    <CreditCard className="h-3.5 w-3.5 mr-1.5" />
                    Upgradeaza
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <p className="text-sm text-muted-foreground">Metoda de plata</p>
              <p className="font-semibold mt-1 flex items-center gap-2">
                {ngo.paymentMethod === "recurring_card" ? (
                  <>
                    <RefreshCw className="h-4 w-4 text-indigo-600" />
                    Card recurent
                  </>
                ) : (
                  <>
                    <FileText className="h-4 w-4 text-gray-600" />
                    Factura cu termen
                  </>
                )}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <p className="text-sm text-muted-foreground">Expira la</p>
              <p className="font-semibold mt-1">
                {ngo.subscriptionExpiresAt
                  ? formatDate(ngo.subscriptionExpiresAt)
                  : ngo.subscriptionPlan === "BASIC"
                  ? "N/A"
                  : "Nelimitat"}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Billing Details */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Date de facturare
              </CardTitle>
              <CardDescription>Aceste date vor aparea pe facturile generate</CardDescription>
            </div>
            {!editBilling && (
              <Button variant="outline" size="sm" onClick={() => setEditBilling(true)}>
                <Edit3 className="h-3.5 w-3.5 mr-1.5" />
                Editeaza
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {editBilling ? (
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Denumire (pe factura)</Label>
                  <Input
                    value={billingForm.billingName || ""}
                    onChange={(e) => setBillingForm((p) => ({ ...p, billingName: e.target.value }))}
                    placeholder={ngo?.name || "Denumire organizatie"}
                  />
                </div>
                <div className="space-y-2">
                  <Label>CUI</Label>
                  <Input
                    value={billingForm.billingCui || ""}
                    onChange={(e) => setBillingForm((p) => ({ ...p, billingCui: e.target.value }))}
                    placeholder="RO12345678"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Nr. Reg. Com.</Label>
                  <Input
                    value={billingForm.billingRegCom || ""}
                    onChange={(e) => setBillingForm((p) => ({ ...p, billingRegCom: e.target.value }))}
                    placeholder="J12/345/2020"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email facturare</Label>
                  <Input
                    type="email"
                    value={billingForm.billingEmail || ""}
                    onChange={(e) => setBillingForm((p) => ({ ...p, billingEmail: e.target.value }))}
                    placeholder="facturare@ong.ro"
                  />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <Label>Adresa</Label>
                  <Input
                    value={billingForm.billingAddress || ""}
                    onChange={(e) => setBillingForm((p) => ({ ...p, billingAddress: e.target.value }))}
                    placeholder="Str. Exemplu, Nr. 10"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Oras</Label>
                  <Input
                    value={billingForm.billingCity || ""}
                    onChange={(e) => setBillingForm((p) => ({ ...p, billingCity: e.target.value }))}
                    placeholder="Bucuresti"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Judet</Label>
                  <Input
                    value={billingForm.billingCounty || ""}
                    onChange={(e) => setBillingForm((p) => ({ ...p, billingCounty: e.target.value }))}
                    placeholder="Bucuresti"
                  />
                </div>
              </div>
              <div className="flex gap-3 justify-end">
                <Button variant="outline" onClick={() => setEditBilling(false)}>Anuleaza</Button>
                <Button onClick={handleSaveBilling} disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                  Salveaza
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Denumire</p>
                <p className="font-medium">{billingForm.billingName || ngo?.name || "-"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">CUI</p>
                <p className="font-medium">{billingForm.billingCui || "-"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Nr. Reg. Com.</p>
                <p className="font-medium">{billingForm.billingRegCom || "-"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Email</p>
                <p className="font-medium">{billingForm.billingEmail || "-"}</p>
              </div>
              <div className="md:col-span-2">
                <p className="text-muted-foreground">Adresa</p>
                <p className="font-medium">
                  {billingForm.billingAddress
                    ? `${billingForm.billingAddress}, ${billingForm.billingCity || ""} ${billingForm.billingCounty || ""}`
                    : "-"}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Invoices List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Facturile mele
          </CardTitle>
          <CardDescription>Istoricul facturilor pentru abonamentul dumneavoastra</CardDescription>
        </CardHeader>
        <CardContent>
          {invoices.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Receipt className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>Nu aveti facturi inca.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {invoices.map((invoice) => {
                const sConfig = statusConfig[invoice.status] || statusConfig.DRAFT;
                const SIcon = sConfig.icon;
                return (
                  <div key={invoice.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div>
                        <p className="font-mono font-bold text-sm">{invoice.invoiceNumber}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(invoice.issueDate)}</p>
                      </div>
                      <Badge className={sConfig.color}>
                        <SIcon className="h-3 w-3 mr-1" />
                        {sConfig.label}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4">
                      <p className="font-bold text-sm">{formatAmount(invoice.totalAmount, invoice.currency)}</p>
                      {invoice.paymentToken && invoice.status !== "PAID" && invoice.status !== "CANCELLED" && (
                        <Link href={`/factura/${invoice.paymentToken}`}>
                          <Button size="sm" variant="outline">
                            <CreditCard className="h-3 w-3 mr-1" />
                            Plateste
                          </Button>
                        </Link>
                      )}
                      {invoice.paymentToken && (
                        <Link href={`/factura/${invoice.paymentToken}`}>
                          <Button size="sm" variant="ghost">
                            <ExternalLink className="h-3 w-3 mr-1" />
                            Vezi
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

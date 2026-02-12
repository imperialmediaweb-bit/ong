"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Building2, Save, Loader2, Receipt } from "lucide-react";

interface BillingData {
  companyName: string;
  companyCui: string;
  companyRegCom: string;
  companyAddress: string;
  companyCity: string;
  companyCounty: string;
  companyPostalCode: string;
  companyCountry: string;
  companyEmail: string;
  companyPhone: string;
  companyIban: string;
  companyBankName: string;
  companyVatPayer: boolean;
  companyCapital: string;
  invoicePrefix: string;
  invoiceNextNumber: number;
  invoiceSeries: string;
  invoiceCurrency: string;
  invoiceVatRate: number;
  invoiceNotes: string;
  invoicePaymentTerms: number;
}

const defaultBilling: BillingData = {
  companyName: "",
  companyCui: "",
  companyRegCom: "",
  companyAddress: "",
  companyCity: "",
  companyCounty: "",
  companyPostalCode: "",
  companyCountry: "Romania",
  companyEmail: "",
  companyPhone: "",
  companyIban: "",
  companyBankName: "",
  companyVatPayer: false,
  companyCapital: "",
  invoicePrefix: "BNV",
  invoiceNextNumber: 1,
  invoiceSeries: "",
  invoiceCurrency: "RON",
  invoiceVatRate: 19,
  invoiceNotes: "",
  invoicePaymentTerms: 30,
};

export default function AdminBillingPage() {
  const [data, setData] = useState<BillingData>(defaultBilling);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetchBilling();
  }, []);

  const fetchBilling = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/billing");
      if (!res.ok) throw new Error("Eroare la incarcare");
      const billing = await res.json();
      setData({
        companyName: billing.companyName || "",
        companyCui: billing.companyCui || "",
        companyRegCom: billing.companyRegCom || "",
        companyAddress: billing.companyAddress || "",
        companyCity: billing.companyCity || "",
        companyCounty: billing.companyCounty || "",
        companyPostalCode: billing.companyPostalCode || "",
        companyCountry: billing.companyCountry || "Romania",
        companyEmail: billing.companyEmail || "",
        companyPhone: billing.companyPhone || "",
        companyIban: billing.companyIban || "",
        companyBankName: billing.companyBankName || "",
        companyVatPayer: billing.companyVatPayer ?? false,
        companyCapital: billing.companyCapital || "",
        invoicePrefix: billing.invoicePrefix || "BNV",
        invoiceNextNumber: billing.invoiceNextNumber ?? 1,
        invoiceSeries: billing.invoiceSeries || "",
        invoiceCurrency: billing.invoiceCurrency || "RON",
        invoiceVatRate: billing.invoiceVatRate ?? 19,
        invoiceNotes: billing.invoiceNotes || "",
        invoicePaymentTerms: billing.invoicePaymentTerms ?? 30,
      });
    } catch {
      setError("Eroare la incarcarea datelor de facturare");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/admin/billing", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Eroare la salvare");
      setSuccess("Datele de facturare au fost salvate cu succes");
      setTimeout(() => setSuccess(""), 3000);
    } catch {
      setError("Eroare la salvarea datelor de facturare");
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field: keyof BillingData, value: string | boolean | number) => {
    setData((prev) => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Building2 className="h-7 w-7 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold">Date facturare</h1>
            <p className="text-sm text-muted-foreground">
              Configureaza datele firmei tale care vor aparea pe facturi
            </p>
          </div>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          {saving ? "Se salveaza..." : "Salveaza"}
        </Button>
      </div>

      {success && (
        <div className="bg-green-50 text-green-700 p-3 rounded-md text-sm">{success}</div>
      )}
      {error && (
        <div className="bg-red-50 text-red-700 p-3 rounded-md text-sm">{error}</div>
      )}

      {/* Company Details */}
      <Card>
        <CardContent className="p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Date firma (Furnizor)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Denumirea firmei *</Label>
              <Input
                value={data.companyName}
                onChange={(e) => updateField("companyName", e.target.value)}
                placeholder="SC Exemplu SRL"
              />
            </div>
            <div className="space-y-2">
              <Label>CUI (Cod Unic de Inregistrare) *</Label>
              <Input
                value={data.companyCui}
                onChange={(e) => updateField("companyCui", e.target.value)}
                placeholder="RO12345678"
              />
            </div>
            <div className="space-y-2">
              <Label>Nr. Registrul Comertului</Label>
              <Input
                value={data.companyRegCom}
                onChange={(e) => updateField("companyRegCom", e.target.value)}
                placeholder="J12/345/2020"
              />
            </div>
            <div className="space-y-2">
              <Label>Capital social</Label>
              <Input
                value={data.companyCapital}
                onChange={(e) => updateField("companyCapital", e.target.value)}
                placeholder="200 RON"
              />
            </div>
            <div className="md:col-span-2 space-y-2">
              <Label>Adresa *</Label>
              <Input
                value={data.companyAddress}
                onChange={(e) => updateField("companyAddress", e.target.value)}
                placeholder="Str. Exemplu, Nr. 10, Bl. A, Ap. 5"
              />
            </div>
            <div className="space-y-2">
              <Label>Oras *</Label>
              <Input
                value={data.companyCity}
                onChange={(e) => updateField("companyCity", e.target.value)}
                placeholder="Bucuresti"
              />
            </div>
            <div className="space-y-2">
              <Label>Judet</Label>
              <Input
                value={data.companyCounty}
                onChange={(e) => updateField("companyCounty", e.target.value)}
                placeholder="Bucuresti"
              />
            </div>
            <div className="space-y-2">
              <Label>Cod postal</Label>
              <Input
                value={data.companyPostalCode}
                onChange={(e) => updateField("companyPostalCode", e.target.value)}
                placeholder="010101"
              />
            </div>
            <div className="space-y-2">
              <Label>Tara</Label>
              <Input
                value={data.companyCountry}
                onChange={(e) => updateField("companyCountry", e.target.value)}
                placeholder="Romania"
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={data.companyEmail}
                onChange={(e) => updateField("companyEmail", e.target.value)}
                placeholder="facturare@firma.ro"
              />
            </div>
            <div className="space-y-2">
              <Label>Telefon</Label>
              <Input
                value={data.companyPhone}
                onChange={(e) => updateField("companyPhone", e.target.value)}
                placeholder="+40 721 234 567"
              />
            </div>
            <div className="md:col-span-2 flex items-center gap-3 pt-2">
              <Checkbox
                id="vatPayer"
                checked={data.companyVatPayer}
                onCheckedChange={(checked) => updateField("companyVatPayer", checked === true)}
              />
              <Label htmlFor="vatPayer" className="cursor-pointer">
                Platitor de TVA
              </Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bank Details */}
      <Card>
        <CardContent className="p-6">
          <h2 className="text-lg font-semibold mb-4">Date bancare</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>IBAN</Label>
              <Input
                value={data.companyIban}
                onChange={(e) => updateField("companyIban", e.target.value)}
                placeholder="RO49AAAA1B31007593840000"
              />
            </div>
            <div className="space-y-2">
              <Label>Banca</Label>
              <Input
                value={data.companyBankName}
                onChange={(e) => updateField("companyBankName", e.target.value)}
                placeholder="Banca Transilvania"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Invoice Settings */}
      <Card className="border-blue-200">
        <CardContent className="p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Receipt className="h-5 w-5 text-blue-600" />
            Setari facturare
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Serie factura</Label>
              <Input
                value={data.invoiceSeries}
                onChange={(e) => updateField("invoiceSeries", e.target.value)}
                placeholder="BNV"
              />
              <p className="text-xs text-muted-foreground">Seria care apare pe factura (ex: BNV)</p>
            </div>
            <div className="space-y-2">
              <Label>Prefix numar</Label>
              <Input
                value={data.invoicePrefix}
                onChange={(e) => updateField("invoicePrefix", e.target.value)}
                placeholder="BNV"
              />
              <p className="text-xs text-muted-foreground">Prefix pentru numarul facturii</p>
            </div>
            <div className="space-y-2">
              <Label>Urmatorul numar</Label>
              <Input
                type="number"
                min={1}
                value={data.invoiceNextNumber}
                onChange={(e) => updateField("invoiceNextNumber", parseInt(e.target.value) || 1)}
              />
              <p className="text-xs text-muted-foreground">Urmatorul numar de factura</p>
            </div>
            <div className="space-y-2">
              <Label>Moneda</Label>
              <Input
                value={data.invoiceCurrency}
                onChange={(e) => updateField("invoiceCurrency", e.target.value)}
                placeholder="RON"
              />
            </div>
            <div className="space-y-2">
              <Label>Rata TVA (%)</Label>
              <Input
                type="number"
                min={0}
                max={100}
                value={data.invoiceVatRate}
                onChange={(e) => updateField("invoiceVatRate", parseFloat(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-2">
              <Label>Termen de plata (zile)</Label>
              <Input
                type="number"
                min={0}
                value={data.invoicePaymentTerms}
                onChange={(e) => updateField("invoicePaymentTerms", parseInt(e.target.value) || 30)}
              />
            </div>
            <div className="md:col-span-2 lg:col-span-3 space-y-2">
              <Label>Observatii implicite pe factura</Label>
              <Textarea
                value={data.invoiceNotes}
                onChange={(e) => updateField("invoiceNotes", e.target.value)}
                placeholder="Observatii care apar implicit pe fiecare factura generata..."
                rows={3}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Preview */}
      <Card className="bg-slate-50">
        <CardContent className="p-6">
          <h2 className="text-lg font-semibold mb-3">Previzualizare date furnizor</h2>
          <div className="bg-white rounded-lg p-4 border text-sm space-y-1">
            <p className="font-bold text-base">{data.companyName || "Denumire firma"}</p>
            <p>CUI: {data.companyCui || "-"}</p>
            {data.companyRegCom && <p>Reg. Com.: {data.companyRegCom}</p>}
            <p>{data.companyAddress || "Adresa"}, {data.companyCity || "Oras"}, {data.companyCounty || "Judet"}</p>
            {data.companyEmail && <p>Email: {data.companyEmail}</p>}
            {data.companyPhone && <p>Tel: {data.companyPhone}</p>}
            {data.companyIban && <p>IBAN: {data.companyIban} - {data.companyBankName || "Banca"}</p>}
            <p className="text-muted-foreground mt-2">
              {data.companyVatPayer ? "Platitor de TVA" : "Neplatitor de TVA"} | TVA: {data.invoiceVatRate}%
            </p>
            <p className="text-muted-foreground">
              Urmatoarea factura: {data.invoiceSeries || data.invoicePrefix}-{String(data.invoiceNextNumber).padStart(4, "0")}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Bottom Save */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          {saving ? "Se salveaza..." : "Salveaza datele de facturare"}
        </Button>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Receipt, Plus, Eye, Loader2, Search, FileText,
  CheckCircle2, Clock, AlertCircle, XCircle, Send,
} from "lucide-react";

interface Invoice {
  id: string;
  invoiceNumber: string;
  buyerName: string;
  buyerCui: string | null;
  issueDate: string;
  dueDate: string | null;
  status: string;
  subtotal: number;
  vatAmount: number;
  totalAmount: number;
  currency: string;
  paidAt: string | null;
}

interface InvoiceItem {
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  vatRate: number;
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

export default function AdminInvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  // New invoice form
  const [newInvoice, setNewInvoice] = useState({
    buyerName: "",
    buyerCui: "",
    buyerRegCom: "",
    buyerAddress: "",
    buyerCity: "",
    buyerCounty: "",
    buyerEmail: "",
    buyerPhone: "",
    notes: "",
    status: "DRAFT",
    items: [{ description: "", quantity: 1, unit: "buc", unitPrice: 0, vatRate: 19 }] as InvoiceItem[],
  });

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set("status", statusFilter);
      const res = await fetch(`/api/admin/invoices?${params.toString()}`);
      if (!res.ok) throw new Error("Eroare");
      const result = await res.json();
      setInvoices(result.invoices || []);
      setTotal(result.total || 0);
    } catch {
      setError("Eroare la incarcarea facturilor");
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  const addItem = () => {
    setNewInvoice((prev) => ({
      ...prev,
      items: [...prev.items, { description: "", quantity: 1, unit: "buc", unitPrice: 0, vatRate: 19 }],
    }));
  };

  const removeItem = (index: number) => {
    setNewInvoice((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const updateItem = (index: number, field: keyof InvoiceItem, value: string | number) => {
    setNewInvoice((prev) => ({
      ...prev,
      items: prev.items.map((item, i) => (i === index ? { ...item, [field]: value } : item)),
    }));
  };

  const calculateTotal = () => {
    return newInvoice.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  };

  const handleCreate = async () => {
    if (!newInvoice.buyerName.trim()) {
      setError("Numele cumparatorului este obligatoriu");
      return;
    }
    if (newInvoice.items.length === 0 || !newInvoice.items[0].description) {
      setError("Adaugati cel putin un produs/serviciu");
      return;
    }

    setCreating(true);
    setError("");
    try {
      const res = await fetch("/api/admin/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newInvoice),
      });
      if (!res.ok) throw new Error("Eroare la creare");
      setSuccess("Factura a fost creata cu succes!");
      setTimeout(() => setSuccess(""), 3000);
      setShowCreate(false);
      setNewInvoice({
        buyerName: "",
        buyerCui: "",
        buyerRegCom: "",
        buyerAddress: "",
        buyerCity: "",
        buyerCounty: "",
        buyerEmail: "",
        buyerPhone: "",
        notes: "",
        status: "DRAFT",
        items: [{ description: "", quantity: 1, unit: "buc", unitPrice: 0, vatRate: 19 }],
      });
      fetchInvoices();
    } catch {
      setError("Eroare la crearea facturii");
    } finally {
      setCreating(false);
    }
  };

  const filteredInvoices = invoices.filter((inv) => {
    if (!filter) return true;
    const q = filter.toLowerCase();
    return (
      inv.invoiceNumber.toLowerCase().includes(q) ||
      inv.buyerName.toLowerCase().includes(q) ||
      (inv.buyerCui && inv.buyerCui.toLowerCase().includes(q))
    );
  });

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

  // Stats
  const totalRevenue = invoices
    .filter((i) => i.status === "PAID")
    .reduce((s, i) => s + i.totalAmount, 0);
  const totalPending = invoices
    .filter((i) => ["DRAFT", "ISSUED", "SENT"].includes(i.status))
    .reduce((s, i) => s + i.totalAmount, 0);
  const totalOverdue = invoices
    .filter((i) => i.status === "OVERDUE")
    .reduce((s, i) => s + i.totalAmount, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Receipt className="h-7 w-7 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold">Facturi</h1>
            <p className="text-sm text-muted-foreground">{total} facturi in total</p>
          </div>
        </div>
        <Button onClick={() => setShowCreate(!showCreate)}>
          <Plus className="h-4 w-4 mr-2" />
          Factura noua
        </Button>
      </div>

      {success && <div className="bg-green-50 text-green-700 p-3 rounded-md text-sm">{success}</div>}
      {error && <div className="bg-red-50 text-red-700 p-3 rounded-md text-sm">{error}</div>}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total facturi</p>
            <p className="text-2xl font-bold">{total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-green-600">Incasat</p>
            <p className="text-2xl font-bold text-green-700">{formatAmount(totalRevenue, "RON")}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-blue-600">In asteptare</p>
            <p className="text-2xl font-bold text-blue-700">{formatAmount(totalPending, "RON")}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-red-600">Restante</p>
            <p className="text-2xl font-bold text-red-700">{formatAmount(totalOverdue, "RON")}</p>
          </CardContent>
        </Card>
      </div>

      {/* Create Invoice Form */}
      {showCreate && (
        <Card className="border-blue-200">
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold mb-4">Creaza factura noua</h2>

            {/* Buyer Details */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-muted-foreground mb-3">Date cumparator</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Denumire cumparator *</Label>
                  <Input
                    value={newInvoice.buyerName}
                    onChange={(e) => setNewInvoice((p) => ({ ...p, buyerName: e.target.value }))}
                    placeholder="ONG Exemplu"
                  />
                </div>
                <div className="space-y-2">
                  <Label>CUI</Label>
                  <Input
                    value={newInvoice.buyerCui}
                    onChange={(e) => setNewInvoice((p) => ({ ...p, buyerCui: e.target.value }))}
                    placeholder="RO12345678"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Nr. Reg. Com.</Label>
                  <Input
                    value={newInvoice.buyerRegCom}
                    onChange={(e) => setNewInvoice((p) => ({ ...p, buyerRegCom: e.target.value }))}
                    placeholder="J12/345/2020"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={newInvoice.buyerEmail}
                    onChange={(e) => setNewInvoice((p) => ({ ...p, buyerEmail: e.target.value }))}
                    placeholder="contact@ong.ro"
                  />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <Label>Adresa</Label>
                  <Input
                    value={newInvoice.buyerAddress}
                    onChange={(e) => setNewInvoice((p) => ({ ...p, buyerAddress: e.target.value }))}
                    placeholder="Str. Exemplu, Nr. 10"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Oras</Label>
                  <Input
                    value={newInvoice.buyerCity}
                    onChange={(e) => setNewInvoice((p) => ({ ...p, buyerCity: e.target.value }))}
                    placeholder="Bucuresti"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Judet</Label>
                  <Input
                    value={newInvoice.buyerCounty}
                    onChange={(e) => setNewInvoice((p) => ({ ...p, buyerCounty: e.target.value }))}
                    placeholder="Bucuresti"
                  />
                </div>
              </div>
            </div>

            {/* Items */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-muted-foreground">Produse / Servicii</h3>
                <Button size="sm" variant="outline" onClick={addItem}>
                  <Plus className="h-3 w-3 mr-1" /> Adauga rand
                </Button>
              </div>
              <div className="space-y-3">
                {newInvoice.items.map((item, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-2 items-end">
                    <div className="col-span-12 md:col-span-5 space-y-1">
                      {idx === 0 && <Label className="text-xs">Descriere</Label>}
                      <Input
                        value={item.description}
                        onChange={(e) => updateItem(idx, "description", e.target.value)}
                        placeholder="Abonament PRO - Ianuarie 2026"
                      />
                    </div>
                    <div className="col-span-3 md:col-span-1 space-y-1">
                      {idx === 0 && <Label className="text-xs">Cant.</Label>}
                      <Input
                        type="number"
                        min={1}
                        value={item.quantity}
                        onChange={(e) => updateItem(idx, "quantity", parseFloat(e.target.value) || 1)}
                      />
                    </div>
                    <div className="col-span-3 md:col-span-1 space-y-1">
                      {idx === 0 && <Label className="text-xs">UM</Label>}
                      <Input
                        value={item.unit}
                        onChange={(e) => updateItem(idx, "unit", e.target.value)}
                        placeholder="buc"
                      />
                    </div>
                    <div className="col-span-4 md:col-span-2 space-y-1">
                      {idx === 0 && <Label className="text-xs">Pret unitar</Label>}
                      <Input
                        type="number"
                        min={0}
                        step={0.01}
                        value={item.unitPrice}
                        onChange={(e) => updateItem(idx, "unitPrice", parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div className="col-span-3 md:col-span-2 space-y-1">
                      {idx === 0 && <Label className="text-xs">TVA %</Label>}
                      <Input
                        type="number"
                        min={0}
                        value={item.vatRate}
                        onChange={(e) => updateItem(idx, "vatRate", parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div className="col-span-2 md:col-span-1">
                      {newInvoice.items.length > 1 && (
                        <Button size="sm" variant="ghost" className="text-red-500" onClick={() => removeItem(idx)}>
                          <XCircle className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-3 text-right">
                <p className="text-lg font-bold">
                  Total: {formatAmount(calculateTotal(), "RON")}
                </p>
              </div>
            </div>

            {/* Notes */}
            <div className="mb-6 space-y-2">
              <Label>Observatii</Label>
              <Textarea
                value={newInvoice.notes}
                onChange={(e) => setNewInvoice((p) => ({ ...p, notes: e.target.value }))}
                placeholder="Observatii care apar pe factura..."
                rows={2}
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setShowCreate(false)}>
                Anuleaza
              </Button>
              <Button onClick={handleCreate} disabled={creating}>
                {creating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Receipt className="h-4 w-4 mr-2" />}
                {creating ? "Se genereaza..." : "Genereaza factura"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Cauta dupa numar, cumparator, CUI..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {["", "DRAFT", "ISSUED", "SENT", "PAID", "OVERDUE", "CANCELLED"].map((s) => (
            <Button
              key={s}
              size="sm"
              variant={statusFilter === s ? "default" : "outline"}
              onClick={() => setStatusFilter(s)}
            >
              {s === "" ? "Toate" : statusConfig[s]?.label || s}
            </Button>
          ))}
        </div>
      </div>

      {/* Invoice List */}
      {loading ? (
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : filteredInvoices.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            <Receipt className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>Nu exista facturi{statusFilter ? ` cu status ${statusConfig[statusFilter]?.label}` : ""}</p>
            <Button className="mt-4" onClick={() => setShowCreate(true)}>
              <Plus className="h-4 w-4 mr-2" /> Creaza prima factura
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {/* Table Header */}
          <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-2 text-xs font-medium text-muted-foreground uppercase">
            <div className="col-span-2">Numar</div>
            <div className="col-span-3">Cumparator</div>
            <div className="col-span-2">Data emitere</div>
            <div className="col-span-1">Status</div>
            <div className="col-span-2 text-right">Total</div>
            <div className="col-span-2 text-right">Actiuni</div>
          </div>

          {filteredInvoices.map((invoice) => {
            const statusInfo = statusConfig[invoice.status] || statusConfig.DRAFT;
            const StatusIcon = statusInfo.icon;
            return (
              <Card key={invoice.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="grid grid-cols-12 gap-4 items-center">
                    <div className="col-span-12 md:col-span-2">
                      <p className="font-mono font-bold text-sm">{invoice.invoiceNumber}</p>
                      <p className="text-xs text-muted-foreground md:hidden">
                        {formatDate(invoice.issueDate)}
                      </p>
                    </div>
                    <div className="col-span-12 md:col-span-3">
                      <p className="font-medium text-sm">{invoice.buyerName}</p>
                      {invoice.buyerCui && (
                        <p className="text-xs text-muted-foreground">CUI: {invoice.buyerCui}</p>
                      )}
                    </div>
                    <div className="hidden md:block col-span-2">
                      <p className="text-sm">{formatDate(invoice.issueDate)}</p>
                      {invoice.dueDate && (
                        <p className="text-xs text-muted-foreground">
                          Scadenta: {formatDate(invoice.dueDate)}
                        </p>
                      )}
                    </div>
                    <div className="col-span-6 md:col-span-1">
                      <Badge className={statusInfo.color}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {statusInfo.label}
                      </Badge>
                    </div>
                    <div className="col-span-6 md:col-span-2 text-right">
                      <p className="font-bold text-sm">
                        {formatAmount(invoice.totalAmount, invoice.currency)}
                      </p>
                      {invoice.vatAmount > 0 && (
                        <p className="text-xs text-muted-foreground">
                          TVA: {formatAmount(invoice.vatAmount, invoice.currency)}
                        </p>
                      )}
                    </div>
                    <div className="col-span-12 md:col-span-2 flex justify-end gap-2">
                      <Link href={`/admin/invoices/${invoice.id}`}>
                        <Button size="sm" variant="outline">
                          <Eye className="h-3 w-3 mr-1" /> Detalii
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  Banknote,
  Wallet,
  Eye,
  Filter,
} from "lucide-react";

interface Pledge {
  id: string;
  donorName: string | null;
  donorEmail: string | null;
  donorPhone: string | null;
  amount: number | null;
  currency: string;
  paymentMethod: string;
  referenceCode: string;
  proofFilePath: string | null;
  status: string;
  adminNotes: string | null;
  verifiedAt: string | null;
  createdAt: string;
}

const statusConfig: Record<string, { label: string; variant: any; icon: any }> = {
  PENDING: { label: "In asteptare", variant: "secondary", icon: Clock },
  VERIFIED: { label: "Verificat", variant: "success", icon: CheckCircle2 },
  REJECTED: { label: "Respins", variant: "destructive", icon: XCircle },
};

export default function PledgesPage() {
  const [pledges, setPledges] = useState<Pledge[]>([]);
  const [counts, setCounts] = useState({ pending: 0, verified: 0, rejected: 0 });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Verify dialog
  const [dialogPledge, setDialogPledge] = useState<Pledge | null>(null);
  const [dialogAction, setDialogAction] = useState<"verify" | "reject">("verify");
  const [dialogAmount, setDialogAmount] = useState("");
  const [dialogNotes, setDialogNotes] = useState("");
  const [dialogLoading, setDialogLoading] = useState(false);

  const fetchPledges = useCallback(async () => {
    setLoading(true);
    try {
      const params = filter ? `?status=${filter}` : "";
      const res = await fetch(`/api/dashboard/pledges${params}`);
      if (!res.ok) throw new Error("Eroare la incarcarea pledgeurilor");
      const data = await res.json();
      setPledges(data.pledges || []);
      setCounts(data.counts || { pending: 0, verified: 0, rejected: 0 });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchPledges();
  }, [fetchPledges]);

  const openDialog = (pledge: Pledge, action: "verify" | "reject") => {
    setDialogPledge(pledge);
    setDialogAction(action);
    setDialogAmount(pledge.amount?.toString() || "");
    setDialogNotes("");
  };

  const handleAction = async () => {
    if (!dialogPledge) return;

    if (dialogAction === "verify" && (!dialogAmount || Number(dialogAmount) <= 0)) {
      setError("Suma este obligatorie pentru verificare.");
      return;
    }

    setDialogLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/dashboard/pledges", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pledgeId: dialogPledge.id,
          action: dialogAction,
          amount: dialogAction === "verify" ? Number(dialogAmount) : undefined,
          adminNotes: dialogNotes || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Eroare la procesarea actiunii");
      }

      setSuccess(
        dialogAction === "verify"
          ? `Pledgeul ${dialogPledge.referenceCode} a fost verificat si donatia inregistrata.`
          : `Pledgeul ${dialogPledge.referenceCode} a fost respins.`
      );
      setDialogPledge(null);
      fetchPledges();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setDialogLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Verificare donatii manuale</h1>
        <p className="text-muted-foreground">
          Verifica donatiile primite prin transfer bancar sau Revolut.
        </p>
      </div>

      {error && (
        <Card className="border-destructive">
          <CardContent className="py-4 flex items-center justify-between">
            <p className="text-sm text-destructive">{error}</p>
            <Button variant="ghost" size="sm" onClick={() => setError(null)}>Inchide</Button>
          </CardContent>
        </Card>
      )}

      {success && (
        <Card className="border-green-500">
          <CardContent className="py-4 flex items-center justify-between">
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle2 className="h-4 w-4" />
              <p className="text-sm">{success}</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setSuccess(null)}>Inchide</Button>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="cursor-pointer hover:border-primary/50 transition" onClick={() => setFilter(undefined)}>
          <CardContent className="py-4 text-center">
            <p className="text-2xl font-bold">{counts.pending + counts.verified + counts.rejected}</p>
            <p className="text-xs text-muted-foreground">Total</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:border-yellow-500/50 transition" onClick={() => setFilter("PENDING")}>
          <CardContent className="py-4 text-center">
            <p className="text-2xl font-bold text-yellow-600">{counts.pending}</p>
            <p className="text-xs text-muted-foreground">In asteptare</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:border-green-500/50 transition" onClick={() => setFilter("VERIFIED")}>
          <CardContent className="py-4 text-center">
            <p className="text-2xl font-bold text-green-600">{counts.verified}</p>
            <p className="text-xs text-muted-foreground">Verificate</p>
          </CardContent>
        </Card>
      </div>

      {/* Pledges List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Banknote className="h-5 w-5" />
                Pledgeuri donatii
              </CardTitle>
              <CardDescription>
                {filter ? `Filtru: ${statusConfig[filter]?.label || filter}` : "Toate pledgeurile"}
              </CardDescription>
            </div>
            {filter && (
              <Button variant="ghost" size="sm" onClick={() => setFilter(undefined)}>
                <Filter className="h-4 w-4 mr-1" />
                Sterge filtrul
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : pledges.length === 0 ? (
            <div className="text-center py-12">
              <Banknote className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                {filter ? "Niciun pledge cu acest status." : "Niciun pledge de donatie inca."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="p-3 text-left font-medium">Referinta</th>
                    <th className="p-3 text-left font-medium">Donator</th>
                    <th className="p-3 text-left font-medium">Metoda</th>
                    <th className="p-3 text-right font-medium">Suma</th>
                    <th className="p-3 text-left font-medium">Status</th>
                    <th className="p-3 text-left font-medium hidden md:table-cell">Data</th>
                    <th className="p-3 text-right font-medium">Actiuni</th>
                  </tr>
                </thead>
                <tbody>
                  {pledges.map((pledge) => {
                    const config = statusConfig[pledge.status] || statusConfig.PENDING;
                    const StatusIcon = config.icon;
                    return (
                      <tr key={pledge.id} className="border-b hover:bg-muted/30 transition-colors">
                        <td className="p-3">
                          <span className="font-mono text-xs font-medium bg-muted px-2 py-1 rounded">
                            {pledge.referenceCode}
                          </span>
                        </td>
                        <td className="p-3">
                          <div>
                            <p className="font-medium">{pledge.donorName || "Anonim"}</p>
                            {pledge.donorEmail && (
                              <p className="text-xs text-muted-foreground">{pledge.donorEmail}</p>
                            )}
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-1.5">
                            {pledge.paymentMethod === "bank_transfer" ? (
                              <Banknote className="h-3.5 w-3.5 text-blue-600" />
                            ) : (
                              <Wallet className="h-3.5 w-3.5 text-purple-600" />
                            )}
                            <span className="text-xs">
                              {pledge.paymentMethod === "bank_transfer" ? "Transfer" : "Revolut"}
                            </span>
                          </div>
                        </td>
                        <td className="p-3 text-right font-medium">
                          {pledge.amount ? `${pledge.amount} ${pledge.currency}` : "-"}
                        </td>
                        <td className="p-3">
                          <Badge variant={config.variant} className="gap-1 text-xs">
                            <StatusIcon className="h-3 w-3" />
                            {config.label}
                          </Badge>
                        </td>
                        <td className="p-3 hidden md:table-cell text-muted-foreground text-xs">
                          {new Date(pledge.createdAt).toLocaleDateString("ro-RO", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>
                        <td className="p-3 text-right">
                          {pledge.status === "PENDING" ? (
                            <div className="flex items-center gap-1 justify-end">
                              <Button
                                size="sm"
                                variant="default"
                                className="h-7 text-xs"
                                onClick={() => openDialog(pledge, "verify")}
                              >
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Verifica
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs text-destructive"
                                onClick={() => openDialog(pledge, "reject")}
                              >
                                <XCircle className="h-3 w-3 mr-1" />
                                Respinge
                              </Button>
                            </div>
                          ) : pledge.adminNotes ? (
                            <span className="text-xs text-muted-foreground" title={pledge.adminNotes}>
                              <Eye className="h-3 w-3 inline mr-1" />
                              Note
                            </span>
                          ) : null}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Verify/Reject Dialog */}
      <Dialog open={!!dialogPledge} onOpenChange={(open) => !open && setDialogPledge(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dialogAction === "verify" ? "Verifica donatia" : "Respinge pledgeul"}
            </DialogTitle>
            <DialogDescription>
              Pledgeul <span className="font-mono font-medium">{dialogPledge?.referenceCode}</span>
              {dialogPledge?.donorName && ` de la ${dialogPledge.donorName}`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {dialogAction === "verify" && (
              <div className="grid gap-2">
                <Label htmlFor="verifyAmount">Suma confirmata (RON)</Label>
                <Input
                  id="verifyAmount"
                  type="number"
                  min="0.01"
                  step="0.01"
                  placeholder="Ex: 100"
                  value={dialogAmount}
                  onChange={(e) => setDialogAmount(e.target.value)}
                />
              </div>
            )}
            <div className="grid gap-2">
              <Label htmlFor="adminNotes">Note admin (optional)</Label>
              <Textarea
                id="adminNotes"
                placeholder={dialogAction === "verify"
                  ? "Ex: Confirmat in extrasul bancar din 15.01.2025"
                  : "Ex: Nu s-a gasit transferul in extras"
                }
                value={dialogNotes}
                onChange={(e) => setDialogNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogPledge(null)}>
              Anuleaza
            </Button>
            <Button
              variant={dialogAction === "verify" ? "default" : "destructive"}
              onClick={handleAction}
              disabled={dialogLoading}
            >
              {dialogLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {dialogAction === "verify" ? "Confirma donatia" : "Respinge"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

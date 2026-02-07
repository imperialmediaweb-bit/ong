"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { CreditCard } from "lucide-react";

interface NgoSubscription {
  id: string;
  name: string;
  plan: string;
  verificationStatus: string;
  createdAt: string;
}

export default function AdminSubscriptionsPage() {
  const [ngos, setNgos] = useState<NgoSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [changingPlan, setChangingPlan] = useState<string | null>(null);

  useEffect(() => {
    fetchNgos();
  }, []);

  const fetchNgos = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/ngos?limit=200");
      const data = await res.json();
      setNgos(data.ngos || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePlan = async (ngoId: string, newPlan: string) => {
    setChangingPlan(ngoId);
    try {
      const res = await fetch(`/api/admin/ngos/${ngoId}/subscription`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: newPlan }),
      });
      if (!res.ok) throw new Error("Eroare la schimbarea planului");
      setSuccessMsg(`Planul a fost schimbat la ${newPlan}`);
      setErrorMsg("");
      setTimeout(() => setSuccessMsg(""), 3000);
      fetchNgos();
    } catch (err) {
      setErrorMsg("Eroare la schimbarea planului");
      setSuccessMsg("");
    } finally {
      setChangingPlan(null);
    }
  };

  const planColors: Record<string, string> = {
    BASIC: "bg-slate-100 text-slate-800",
    PRO: "bg-blue-100 text-blue-800",
    ELITE: "bg-purple-100 text-purple-800",
  };

  const verificationLabels: Record<string, string> = {
    PENDING: "In asteptare",
    APPROVED: "Aprobat",
    REJECTED: "Respins",
  };

  const verificationColors: Record<string, string> = {
    PENDING: "bg-yellow-100 text-yellow-800",
    APPROVED: "bg-green-100 text-green-800",
    REJECTED: "bg-red-100 text-red-800",
  };

  const basicCount = ngos.filter((n) => n.plan === "BASIC").length;
  const proCount = ngos.filter((n) => n.plan === "PRO").length;
  const eliteCount = ngos.filter((n) => n.plan === "ELITE").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <CreditCard className="h-7 w-7 text-blue-600" />
        <h1 className="text-3xl font-bold">Abonamente</h1>
      </div>

      {/* Messages */}
      {successMsg && (
        <div className="bg-green-50 text-green-700 p-3 rounded-md text-sm">{successMsg}</div>
      )}
      {errorMsg && (
        <div className="bg-red-50 text-red-700 p-3 rounded-md text-sm">{errorMsg}</div>
      )}

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-6 text-center">
            <Badge className={`text-lg px-4 py-1.5 mb-2 ${planColors.BASIC}`}>BASIC</Badge>
            <p className="text-3xl font-bold mt-2">{basicCount}</p>
            <p className="text-sm text-muted-foreground">ONG-uri</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <Badge className={`text-lg px-4 py-1.5 mb-2 ${planColors.PRO}`}>PRO</Badge>
            <p className="text-3xl font-bold mt-2">{proCount}</p>
            <p className="text-sm text-muted-foreground">ONG-uri</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <Badge className={`text-lg px-4 py-1.5 mb-2 ${planColors.ELITE}`}>ELITE</Badge>
            <p className="text-3xl font-bold mt-2">{eliteCount}</p>
            <p className="text-sm text-muted-foreground">ONG-uri</p>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Toate abonamentele</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">Se incarca...</div>
          ) : ngos.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">Niciun ONG gasit</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50 text-left text-muted-foreground">
                    <th className="p-3 font-medium">Nume</th>
                    <th className="p-3 font-medium">Plan actual</th>
                    <th className="p-3 font-medium">Verificare</th>
                    <th className="p-3 font-medium">Data inregistrarii</th>
                    <th className="p-3 font-medium">Actiuni</th>
                  </tr>
                </thead>
                <tbody>
                  {ngos.map((ngo) => (
                    <tr key={ngo.id} className="border-b hover:bg-muted/30">
                      <td className="p-3 font-medium">{ngo.name}</td>
                      <td className="p-3">
                        <Badge className={planColors[ngo.plan] || planColors.BASIC}>
                          {ngo.plan}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <Badge className={verificationColors[ngo.verificationStatus] || verificationColors.PENDING}>
                          {verificationLabels[ngo.verificationStatus] || ngo.verificationStatus}
                        </Badge>
                      </td>
                      <td className="p-3 text-muted-foreground">
                        {new Date(ngo.createdAt).toLocaleDateString("ro-RO")}
                      </td>
                      <td className="p-3">
                        <Select
                          value={ngo.plan}
                          onValueChange={(v) => handleChangePlan(ngo.id, v)}
                          disabled={changingPlan === ngo.id}
                        >
                          <SelectTrigger className="w-[130px]">
                            <SelectValue placeholder="Schimba plan" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="BASIC">BASIC</SelectItem>
                            <SelectItem value="PRO">PRO</SelectItem>
                            <SelectItem value="ELITE">ELITE</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

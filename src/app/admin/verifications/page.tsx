"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ShieldCheck, ExternalLink, CheckCircle, XCircle, Calendar, Building2, Hash,
} from "lucide-react";

interface PendingNgo {
  id: string;
  name: string;
  registrationNumber: string;
  legalForm: string;
  aiScore: number | null;
  createdAt: string;
}

export default function AdminVerificationsPage() {
  const router = useRouter();
  const [ngos, setNgos] = useState<PendingNgo[]>([]);
  const [loading, setLoading] = useState(true);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    fetchPending();
  }, []);

  const fetchPending = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/ngos?verificationStatus=PENDING");
      const data = await res.json();
      setNgos(data.ngos || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickApprove = async (ngoId: string) => {
    try {
      const res = await fetch(`/api/admin/ngos/${ngoId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          verificationStatus: "APPROVED",
          verificationNotes: "Aprobare rapida",
        }),
      });
      if (!res.ok) throw new Error("Eroare");
      setSuccessMsg("ONG-ul a fost aprobat");
      setErrorMsg("");
      setTimeout(() => setSuccessMsg(""), 3000);
      fetchPending();
    } catch (err) {
      setErrorMsg("Eroare la aprobarea ONG-ului");
      setSuccessMsg("");
    }
  };

  const handleQuickReject = async (ngoId: string) => {
    try {
      const res = await fetch(`/api/admin/ngos/${ngoId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          verificationStatus: "REJECTED",
          verificationNotes: "Respins - necesita revizuire",
        }),
      });
      if (!res.ok) throw new Error("Eroare");
      setSuccessMsg("ONG-ul a fost respins");
      setErrorMsg("");
      setTimeout(() => setSuccessMsg(""), 3000);
      fetchPending();
    } catch (err) {
      setErrorMsg("Eroare la respingerea ONG-ului");
      setSuccessMsg("");
    }
  };

  const getScoreColor = (score: number) => {
    if (score < 40) return "text-red-600 bg-red-50";
    if (score < 70) return "text-yellow-600 bg-yellow-50";
    return "text-green-600 bg-green-50";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <ShieldCheck className="h-7 w-7 text-blue-600" />
        <h1 className="text-3xl font-bold">Verificari</h1>
        {ngos.length > 0 && (
          <Badge className="bg-orange-100 text-orange-800 text-base px-3">
            {ngos.length} in asteptare
          </Badge>
        )}
      </div>

      {/* Messages */}
      {successMsg && (
        <div className="bg-green-50 text-green-700 p-3 rounded-md text-sm">{successMsg}</div>
      )}
      {errorMsg && (
        <div className="bg-red-50 text-red-700 p-3 rounded-md text-sm">{errorMsg}</div>
      )}

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="h-32 animate-pulse bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : ngos.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <ShieldCheck className="h-12 w-12 text-green-500 mx-auto mb-3" />
            <p className="text-lg font-medium">Nicio verificare in asteptare</p>
            <p className="text-sm text-muted-foreground mt-1">
              Toate ONG-urile au fost verificate
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {ngos.map((ngo) => (
            <Card key={ngo.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    {ngo.name}
                  </CardTitle>
                  <Badge className="bg-yellow-100 text-yellow-800">In asteptare</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5" />
                    Data: {new Date(ngo.createdAt).toLocaleDateString("ro-RO")}
                  </div>
                  {ngo.registrationNumber && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Hash className="h-3.5 w-3.5" />
                      Nr: {ngo.registrationNumber}
                    </div>
                  )}
                  {ngo.legalForm && (
                    <div className="text-muted-foreground text-sm col-span-2">
                      Forma juridica: {ngo.legalForm}
                    </div>
                  )}
                </div>

                {ngo.aiScore !== null && ngo.aiScore !== undefined && (
                  <div className={`inline-flex items-center gap-2 px-2 py-1 rounded-md text-sm font-medium ${getScoreColor(ngo.aiScore)}`}>
                    Scor AI: {ngo.aiScore}/100
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => router.push(`/admin/ngos/${ngo.id}`)}
                  >
                    <ExternalLink className="h-3.5 w-3.5 mr-1" />
                    Verifica
                  </Button>
                  <Button
                    size="sm"
                    className="bg-green-600 hover:bg-green-700 text-white"
                    onClick={() => handleQuickApprove(ngo.id)}
                  >
                    <CheckCircle className="h-3.5 w-3.5 mr-1" />
                    Aproba rapid
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleQuickReject(ngo.id)}
                  >
                    <XCircle className="h-3.5 w-3.5 mr-1" />
                    Respinge
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

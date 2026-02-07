"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  ArrowLeft, Save, CheckCircle, XCircle, Bot, AlertTriangle,
  Users, Heart, Mail, Building2,
} from "lucide-react";

interface NgoDetail {
  id: string;
  name: string;
  slug: string;
  description: string;
  website: string;
  logo: string;
  plan: string;
  isActive: boolean;
  senderName: string;
  senderEmail: string;
  verificationStatus: string;
  registrationNumber: string;
  legalForm: string;
  fiscalCode: string;
  address: string;
  documentUrls: string[];
  aiScore: number | null;
  aiFlags: string[];
  verificationNotes: string;
  reviewHistory: Array<{
    action: string;
    notes: string;
    reviewedBy: string;
    reviewedAt: string;
  }>;
  users: Array<{
    id: string;
    name: string;
    email: string;
    role: string;
  }>;
  stats: {
    donorCount: number;
    totalDonations: number;
    campaignCount: number;
  };
  createdAt: string;
}

export default function AdminNgoDetailPage() {
  const params = useParams();
  const router = useRouter();
  const ngoId = params.id as string;

  const [ngo, setNgo] = useState<NgoDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Editable fields
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [website, setWebsite] = useState("");
  const [logo, setLogo] = useState("");
  const [senderName, setSenderName] = useState("");
  const [senderEmail, setSenderEmail] = useState("");

  // Verification fields
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [legalForm, setLegalForm] = useState("");
  const [fiscalCode, setFiscalCode] = useState("");
  const [address, setAddress] = useState("");
  const [documentUrls, setDocumentUrls] = useState("");
  const [reviewNotes, setReviewNotes] = useState("");

  useEffect(() => {
    fetchNgo();
  }, [ngoId]);

  const fetchNgo = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/ngos/${ngoId}`);
      const data = await res.json();
      setNgo(data);
      // Fill form fields
      setName(data.name || "");
      setSlug(data.slug || "");
      setDescription(data.description || "");
      setWebsite(data.website || "");
      setLogo(data.logo || "");
      setSenderName(data.senderName || "");
      setSenderEmail(data.senderEmail || "");
      setRegistrationNumber(data.registrationNumber || "");
      setLegalForm(data.legalForm || "");
      setFiscalCode(data.fiscalCode || "");
      setAddress(data.address || "");
      setDocumentUrls((data.documentUrls || []).join("\n"));
    } catch (err) {
      console.error(err);
      setErrorMsg("Eroare la incarcarea datelor");
    } finally {
      setLoading(false);
    }
  };

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setErrorMsg("");
    setTimeout(() => setSuccessMsg(""), 3000);
  };

  const showError = (msg: string) => {
    setErrorMsg(msg);
    setSuccessMsg("");
  };

  const handleSaveDetails = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/ngos/${ngoId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name, slug, description, website, logo, senderName, senderEmail,
          registrationNumber, legalForm, fiscalCode, address,
          documentUrls: documentUrls.split("\n").filter(Boolean),
        }),
      });
      if (!res.ok) throw new Error("Eroare la salvare");
      showSuccess("Detaliile au fost salvate cu succes");
      fetchNgo();
    } catch (err) {
      showError("Eroare la salvarea detaliilor");
    } finally {
      setSaving(false);
    }
  };

  const handleVerifyAI = async () => {
    setVerifying(true);
    try {
      const res = await fetch("/api/admin/verify-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ngoId }),
      });
      if (!res.ok) throw new Error("Eroare verificare AI");
      showSuccess("Verificarea AI a fost efectuata");
      fetchNgo();
    } catch (err) {
      showError("Eroare la verificarea AI");
    } finally {
      setVerifying(false);
    }
  };

  const handleApprove = async () => {
    try {
      const res = await fetch(`/api/admin/ngos/${ngoId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          verificationStatus: "APPROVED",
          verificationNotes: reviewNotes,
        }),
      });
      if (!res.ok) throw new Error("Eroare la aprobare");
      showSuccess("ONG-ul a fost aprobat");
      fetchNgo();
      setReviewNotes("");
    } catch (err) {
      showError("Eroare la aprobarea ONG-ului");
    }
  };

  const handleReject = async () => {
    if (!reviewNotes.trim()) {
      showError("Va rugam sa adaugati note pentru respingere");
      return;
    }
    try {
      const res = await fetch(`/api/admin/ngos/${ngoId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          verificationStatus: "REJECTED",
          verificationNotes: reviewNotes,
        }),
      });
      if (!res.ok) throw new Error("Eroare la respingere");
      showSuccess("ONG-ul a fost respins");
      fetchNgo();
      setReviewNotes("");
    } catch (err) {
      showError("Eroare la respingerea ONG-ului");
    }
  };

  const handleChangePlan = async (newPlan: string) => {
    try {
      const res = await fetch(`/api/admin/ngos/${ngoId}/subscription`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: newPlan }),
      });
      if (!res.ok) throw new Error("Eroare la schimbarea planului");
      showSuccess(`Planul a fost schimbat la ${newPlan}`);
      fetchNgo();
    } catch (err) {
      showError("Eroare la schimbarea planului");
    }
  };

  const getScoreColor = (score: number) => {
    if (score < 40) return "text-red-600";
    if (score < 70) return "text-yellow-600";
    return "text-green-600";
  };

  const getScoreBarColor = (score: number) => {
    if (score < 40) return "[&>div]:bg-red-500";
    if (score < 70) return "[&>div]:bg-yellow-500";
    return "[&>div]:bg-green-500";
  };

  const planColors: Record<string, string> = {
    BASIC: "bg-slate-100 text-slate-800",
    PRO: "bg-blue-100 text-blue-800",
    ELITE: "bg-purple-100 text-purple-800",
  };

  const verificationColors: Record<string, string> = {
    PENDING: "bg-yellow-100 text-yellow-800",
    APPROVED: "bg-green-100 text-green-800",
    REJECTED: "bg-red-100 text-red-800",
  };

  const verificationLabels: Record<string, string> = {
    PENDING: "In asteptare",
    APPROVED: "Aprobat",
    REJECTED: "Respins",
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("ro-RO", {
      style: "currency",
      currency: "RON",
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => router.push("/admin/ngos")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Inapoi la ONG-uri
        </Button>
        <div className="h-96 animate-pulse bg-muted rounded-lg" />
      </div>
    );
  }

  if (!ngo) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => router.push("/admin/ngos")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Inapoi la ONG-uri
        </Button>
        <p className="text-red-600">ONG-ul nu a fost gasit</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.push("/admin/ngos")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Inapoi
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{ngo.name}</h1>
            <div className="flex gap-2 mt-1">
              <Badge className={planColors[ngo.plan] || planColors.BASIC}>{ngo.plan}</Badge>
              <Badge variant={ngo.isActive ? "success" : "secondary"}>
                {ngo.isActive ? "Activ" : "Inactiv"}
              </Badge>
              <Badge className={verificationColors[ngo.verificationStatus] || verificationColors.PENDING}>
                {verificationLabels[ngo.verificationStatus] || ngo.verificationStatus}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      {successMsg && (
        <div className="bg-green-50 text-green-700 p-3 rounded-md text-sm">{successMsg}</div>
      )}
      {errorMsg && (
        <div className="bg-red-50 text-red-700 p-3 rounded-md text-sm">{errorMsg}</div>
      )}

      <Tabs defaultValue="details">
        <TabsList className="flex-wrap">
          <TabsTrigger value="details">Detalii</TabsTrigger>
          <TabsTrigger value="verification">Verificare</TabsTrigger>
          <TabsTrigger value="subscription">Abonament</TabsTrigger>
          <TabsTrigger value="users">Utilizatori</TabsTrigger>
          <TabsTrigger value="stats">Statistici</TabsTrigger>
        </TabsList>

        {/* Details Tab */}
        <TabsContent value="details">
          <Card>
            <CardHeader>
              <CardTitle>Informatii ONG</CardTitle>
              <CardDescription>Editeaza detaliile organizatiei</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Nume</Label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Slug</Label>
                  <Input value={slug} onChange={(e) => setSlug(e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Descriere</Label>
                <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Website</Label>
                  <Input value={website} onChange={(e) => setWebsite(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Logo URL</Label>
                  <Input value={logo} onChange={(e) => setLogo(e.target.value)} />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Nume expeditor</Label>
                  <Input value={senderName} onChange={(e) => setSenderName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Email expeditor</Label>
                  <Input value={senderEmail} onChange={(e) => setSenderEmail(e.target.value)} />
                </div>
              </div>
              <Button onClick={handleSaveDetails} disabled={saving}>
                <Save className="h-4 w-4 mr-2" />
                {saving ? "Se salveaza..." : "Salveaza detalii"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Verification Tab */}
        <TabsContent value="verification" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Status verificare
                <Badge className={verificationColors[ngo.verificationStatus] || verificationColors.PENDING}>
                  {verificationLabels[ngo.verificationStatus] || ngo.verificationStatus}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Numar inregistrare</Label>
                  <Input value={registrationNumber} onChange={(e) => setRegistrationNumber(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Forma juridica</Label>
                  <Input value={legalForm} onChange={(e) => setLegalForm(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Cod fiscal</Label>
                  <Input value={fiscalCode} onChange={(e) => setFiscalCode(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Adresa</Label>
                  <Input value={address} onChange={(e) => setAddress(e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>URL-uri documente (cate unul pe linie)</Label>
                <Textarea
                  value={documentUrls}
                  onChange={(e) => setDocumentUrls(e.target.value)}
                  rows={3}
                  placeholder="https://..."
                />
              </div>
              <Button onClick={handleSaveDetails} disabled={saving} variant="secondary">
                <Save className="h-4 w-4 mr-2" />
                Salveaza date inregistrare
              </Button>
            </CardContent>
          </Card>

          {/* AI Verification */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5" />
                Verificare AI
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={handleVerifyAI} disabled={verifying}>
                <Bot className="h-4 w-4 mr-2" />
                {verifying ? "Se verifica..." : "Ruleaza verificare AI"}
              </Button>

              {ngo.aiScore !== null && ngo.aiScore !== undefined && (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium">Scor AI:</span>
                    <span className={`text-2xl font-bold ${getScoreColor(ngo.aiScore)}`}>
                      {ngo.aiScore}/100
                    </span>
                  </div>
                  <Progress
                    value={ngo.aiScore}
                    className={`h-3 ${getScoreBarColor(ngo.aiScore)}`}
                  />
                </div>
              )}

              {ngo.aiFlags && ngo.aiFlags.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Avertismente:</p>
                  <div className="flex flex-wrap gap-2">
                    {ngo.aiFlags.map((flag, i) => (
                      <Badge key={i} variant="warning" className="flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        {flag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Approve / Reject */}
          <Card>
            <CardHeader>
              <CardTitle>Decizie verificare</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Note recenzie</Label>
                <Textarea
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  rows={3}
                  placeholder="Adaugati note pentru aceasta recenzie..."
                />
              </div>
              <div className="flex gap-3">
                <Button onClick={handleApprove} className="bg-green-600 hover:bg-green-700 text-white">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Aproba
                </Button>
                <Button onClick={handleReject} variant="destructive">
                  <XCircle className="h-4 w-4 mr-2" />
                  Respinge
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Review History */}
          {ngo.reviewHistory && ngo.reviewHistory.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Istoric recenzii</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {ngo.reviewHistory.map((review, i) => (
                    <div key={i} className="border-b pb-3 last:border-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant={review.action === "APPROVED" ? "success" : "destructive"}>
                          {review.action === "APPROVED" ? "Aprobat" : "Respins"}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          de {review.reviewedBy}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          la {new Date(review.reviewedAt).toLocaleDateString("ro-RO")}
                        </span>
                      </div>
                      {review.notes && (
                        <p className="text-sm text-muted-foreground">{review.notes}</p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Subscription Tab */}
        <TabsContent value="subscription">
          <Card>
            <CardHeader>
              <CardTitle>Abonament</CardTitle>
              <CardDescription>Gestioneaza planul de abonament al ONG-ului</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium">Plan curent:</span>
                <Badge className={`text-base px-4 py-1 ${planColors[ngo.plan] || planColors.BASIC}`}>
                  {ngo.plan}
                </Badge>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                {["BASIC", "PRO", "ELITE"].map((plan) => (
                  <Card
                    key={plan}
                    className={ngo.plan === plan ? "border-blue-500 border-2" : ""}
                  >
                    <CardContent className="p-4 text-center">
                      <Badge className={`text-lg px-4 py-1 mb-3 ${planColors[plan]}`}>
                        {plan}
                      </Badge>
                      {ngo.plan === plan ? (
                        <p className="text-sm text-muted-foreground mt-2">Plan activ</p>
                      ) : (
                        <Button
                          variant="outline"
                          className="mt-2 w-full"
                          onClick={() => handleChangePlan(plan)}
                        >
                          Schimba la {plan}
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>Utilizatori</CardTitle>
              <CardDescription>Utilizatorii asociati acestui ONG</CardDescription>
            </CardHeader>
            <CardContent>
              {ngo.users && ngo.users.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50 text-left text-muted-foreground">
                        <th className="p-3 font-medium">Nume</th>
                        <th className="p-3 font-medium">Email</th>
                        <th className="p-3 font-medium">Rol</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ngo.users.map((user) => (
                        <tr key={user.id} className="border-b">
                          <td className="p-3 font-medium">{user.name}</td>
                          <td className="p-3 text-muted-foreground">{user.email}</td>
                          <td className="p-3">
                            <Badge variant="secondary">{user.role}</Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Niciun utilizator asociat</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Stats Tab */}
        <TabsContent value="stats">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-full bg-blue-50">
                    <Users className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Donatori</p>
                    <p className="text-2xl font-bold">{ngo.stats?.donorCount ?? 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-full bg-green-50">
                    <Heart className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total donatii</p>
                    <p className="text-2xl font-bold">{formatCurrency(ngo.stats?.totalDonations ?? 0)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-full bg-purple-50">
                    <Mail className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Campanii</p>
                    <p className="text-2xl font-bold">{ngo.stats?.campaignCount ?? 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

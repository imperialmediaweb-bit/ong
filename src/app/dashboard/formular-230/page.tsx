"use client";

import { useState, useEffect } from "react";
import { PageHelp } from "@/components/ui/page-help";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  FileText, Copy, ExternalLink, Loader2, CheckCircle2,
  TrendingUp, Calendar,
} from "lucide-react";
import { useSession } from "next-auth/react";

export default function FormularAnafDashboard() {
  const { data: session } = useSession();
  const [forms, setForms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const slug = (session?.user as any)?.ngoSlug || "";
  const publicUrl = typeof window !== "undefined"
    ? `${window.location.origin}/s/${slug}/formular-230`
    : "";

  useEffect(() => {
    fetch("/api/formular-230")
      .then((r) => r.json())
      .then((data) => {
        setForms(data.forms || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const copyLink = () => {
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const statusBadge = (s: string) => {
    switch (s) {
      case "GENERATED":
        return <Badge variant="secondary">Generat</Badge>;
      case "DOWNLOADED":
        return <Badge variant="outline">Descarcat</Badge>;
      case "SIGNED":
        return <Badge variant="default">Semnat</Badge>;
      case "SUBMITTED":
        return <Badge variant="success">Depus ANAF</Badge>;
      default:
        return <Badge variant="outline">{s}</Badge>;
    }
  };

  const thisYear = forms.filter((f) => f.taxYear === new Date().getFullYear()).length;
  const totalForms = forms.length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Formular 230 - ANAF</h1>
        <p className="text-muted-foreground">
          Gestioneaza formularele pentru redirectionarea celor 3,5% din impozitul pe venit.
        </p>
      </div>

      {/* Link public pentru partajare */}
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="flex-1">
              <p className="text-sm font-medium mb-1">Link public pentru completare formular 230:</p>
              <div className="flex items-center gap-2">
                <Input value={publicUrl} readOnly className="bg-white text-xs font-mono" />
                <Button variant="outline" size="sm" onClick={copyLink}>
                  {copied ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
                {slug && (
                  <a href={publicUrl} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="sm">
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </a>
                )}
              </div>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Distribuie acest link pe site-ul tau, retele sociale sau prin email pentru a
            incuraja suporterii sa redirectioneze 3,5%.
          </p>
        </CardContent>
      </Card>

      {/* Statistici */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="py-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <FileText className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalForms}</p>
              <p className="text-xs text-muted-foreground">Total formulare</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-500/10">
              <Calendar className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{thisYear}</p>
              <p className="text-xs text-muted-foreground">
                Anul curent ({new Date().getFullYear()})
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-500/10">
              <TrendingUp className="h-5 w-5 text-purple-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {totalForms > 0 ? `~${(totalForms * 150).toLocaleString()}` : "0"} RON
              </p>
              <p className="text-xs text-muted-foreground">
                Estimare impact (medie 150 RON/formular)
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista formulare */}
      <Card>
        <CardHeader>
          <CardTitle>Formulare completate</CardTitle>
          <CardDescription>
            Toate formularele 230 generate pentru organizatia ta.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : forms.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                Niciun formular completat inca.
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Distribuie linkul public pentru a primi formulare.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="p-3 text-left font-medium">Nume</th>
                    <th className="p-3 text-left font-medium">Localitate</th>
                    <th className="p-3 text-left font-medium">An fiscal</th>
                    <th className="p-3 text-left font-medium">Status</th>
                    <th className="p-3 text-left font-medium">Data</th>
                  </tr>
                </thead>
                <tbody>
                  {forms.map((f: any) => (
                    <tr
                      key={f.id}
                      className="border-b hover:bg-muted/30 transition-colors"
                    >
                      <td className="p-3 font-medium">
                        {f.lastName} {f.firstName}
                      </td>
                      <td className="p-3 text-muted-foreground">
                        {f.city}, {f.county}
                      </td>
                      <td className="p-3">{f.taxYear}</td>
                      <td className="p-3">{statusBadge(f.status)}</td>
                      <td className="p-3 text-muted-foreground text-xs">
                        {new Date(f.createdAt).toLocaleDateString("ro-RO")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <PageHelp items={[
        { title: "Ce este Formularul 230", description: "Formularul ANAF prin care cetatenii redirectioneaza 3.5% din impozitul pe venit catre ONG-ul tau." },
        { title: "Link public", description: "Copiaza link-ul si distribuie-l pe site, social media sau email — donatorii completeaza formularul online." },
        { title: "Status formulare", description: "GENERATED = generat, DOWNLOADED = descarcat, SIGNED = semnat, SUBMITTED = depus la ANAF." },
        { title: "An fiscal", description: "Filtreaza formularele pe anul fiscal pentru a vedea cate au fost completate in fiecare an." },
      ]} />
    </div>
  );
}

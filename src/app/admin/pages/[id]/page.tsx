"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { FileText, ArrowLeft, Save, Trash2 } from "lucide-react";

interface SitePage {
  id: string;
  title: string;
  slug: string;
  content: string;
  metaTitle: string;
  metaDescription: string;
  published: boolean;
  sortOrder: number;
}

export default function AdminEditPagePage() {
  const router = useRouter();
  const params = useParams();
  const pageId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [content, setContent] = useState("");
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [published, setPublished] = useState(false);
  const [sortOrder, setSortOrder] = useState(0);

  useEffect(() => {
    fetchPage();
  }, [pageId]);

  const fetchPage = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/pages/${pageId}`);
      if (!res.ok) throw new Error("Pagina nu a fost gasita");
      const data = await res.json();
      const page: SitePage = data.page || data;
      setTitle(page.title || "");
      setSlug(page.slug || "");
      setContent(page.content || "");
      setMetaTitle(page.metaTitle || "");
      setMetaDescription(page.metaDescription || "");
      setPublished(page.published || false);
      setSortOrder(page.sortOrder || 0);
    } catch (err) {
      console.error(err);
      setError("Eroare la incarcarea paginii");
    } finally {
      setLoading(false);
    }
  };

  const showSuccess = (msg: string) => {
    setSuccess(msg);
    setError("");
    setTimeout(() => setSuccess(""), 3000);
  };

  const showError = (msg: string) => {
    setError(msg);
    setSuccess("");
  };

  const handleSave = async () => {
    if (!title || !slug) {
      showError("Titlul si slug-ul sunt obligatorii");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/pages/${pageId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          slug,
          content,
          metaTitle,
          metaDescription,
          published,
          sortOrder,
        }),
      });
      if (!res.ok) throw new Error("Eroare la salvare");
      showSuccess("Pagina a fost salvata cu succes");
    } catch (err) {
      showError("Eroare la salvarea paginii");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Sigur doriti sa stergeti aceasta pagina? Aceasta actiune este ireversibila.")) return;
    try {
      const res = await fetch(`/api/admin/pages/${pageId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Eroare la stergere");
      router.push("/admin/pages");
    } catch (err) {
      showError("Eroare la stergerea paginii");
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-muted-foreground">Se incarca...</div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileText className="h-7 w-7 text-blue-600" />
          <h1 className="text-3xl font-bold">Editeaza pagina</h1>
        </div>
        <div className="flex gap-2">
          <Button
            variant="destructive"
            onClick={handleDelete}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Sterge
          </Button>
        </div>
      </div>

      {/* Messages */}
      {success && (
        <div className="bg-green-50 text-green-700 p-3 rounded-md text-sm">{success}</div>
      )}
      {error && (
        <div className="bg-red-50 text-red-700 p-3 rounded-md text-sm">{error}</div>
      )}

      <Card>
        <CardContent className="p-6 space-y-6">
          <div className="space-y-2">
            <Label>Titlu *</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Titlul paginii"
            />
          </div>

          <div className="space-y-2">
            <Label>Slug *</Label>
            <Input
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="slug-pagina"
            />
          </div>

          <div className="space-y-2">
            <Label>Continut</Label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Continutul paginii (JSON sau HTML)"
              rows={15}
              className="font-mono text-sm"
            />
          </div>

          <div className="space-y-2">
            <Label>Meta titlu</Label>
            <Input
              value={metaTitle}
              onChange={(e) => setMetaTitle(e.target.value)}
              placeholder="Titlu pentru SEO"
            />
          </div>

          <div className="space-y-2">
            <Label>Meta descriere</Label>
            <Textarea
              value={metaDescription}
              onChange={(e) => setMetaDescription(e.target.value)}
              placeholder="Descriere pentru SEO"
              rows={3}
            />
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="published"
              checked={published}
              onCheckedChange={(checked) => setPublished(checked === true)}
            />
            <Label htmlFor="published">Publicat</Label>
          </div>

          <div className="space-y-2">
            <Label>Ordine sortare</Label>
            <Input
              type="number"
              value={sortOrder}
              onChange={(e) => setSortOrder(parseInt(e.target.value) || 0)}
              placeholder="0"
            />
          </div>

          <div className="flex gap-3 pt-4 border-t">
            <Button onClick={handleSave} disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? "Se salveaza..." : "Salveaza"}
            </Button>
            <Button variant="outline" onClick={() => router.push("/admin/pages")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Inapoi
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

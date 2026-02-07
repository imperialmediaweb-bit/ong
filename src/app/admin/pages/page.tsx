"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { FileText, Plus, Pencil, Trash2 } from "lucide-react";

interface SitePage {
  id: string;
  title: string;
  slug: string;
  published: boolean;
  sortOrder: number;
  createdAt: string;
}

export default function AdminPagesPage() {
  const router = useRouter();
  const [pages, setPages] = useState<SitePage[]>([]);
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  // Dialog state
  const [showDialog, setShowDialog] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newSlug, setNewSlug] = useState("");
  const [newMetaTitle, setNewMetaTitle] = useState("");
  const [newMetaDescription, setNewMetaDescription] = useState("");
  const [newPublished, setNewPublished] = useState(false);
  const [newSortOrder, setNewSortOrder] = useState(0);
  const [newContent, setNewContent] = useState("");

  useEffect(() => {
    fetchPages();
  }, []);

  const fetchPages = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/pages");
      const data = await res.json();
      setPages(data.pages || []);
    } catch (err) {
      console.error(err);
      setError("Eroare la incarcarea paginilor");
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

  const resetDialog = () => {
    setNewTitle("");
    setNewSlug("");
    setNewMetaTitle("");
    setNewMetaDescription("");
    setNewPublished(false);
    setNewSortOrder(0);
    setNewContent("");
  };

  const handleCreate = async () => {
    if (!newTitle || !newSlug) {
      showError("Titlul si slug-ul sunt obligatorii");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/pages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle,
          slug: newSlug,
          content: newContent,
          metaTitle: newMetaTitle,
          metaDescription: newMetaDescription,
          published: newPublished,
          sortOrder: newSortOrder,
        }),
      });
      if (!res.ok) throw new Error("Eroare la creare");
      showSuccess("Pagina a fost creata cu succes");
      setShowDialog(false);
      resetDialog();
      fetchPages();
    } catch (err) {
      showError("Eroare la crearea paginii");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (pageId: string) => {
    if (!confirm("Sigur doriti sa stergeti aceasta pagina?")) return;
    try {
      const res = await fetch(`/api/admin/pages/${pageId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Eroare la stergere");
      showSuccess("Pagina a fost stearsa cu succes");
      fetchPages();
    } catch (err) {
      showError("Eroare la stergerea paginii");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileText className="h-7 w-7 text-blue-600" />
          <h1 className="text-3xl font-bold">Pagini site</h1>
        </div>
        <Button onClick={() => setShowDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Pagina noua
        </Button>
      </div>

      {/* Messages */}
      {success && (
        <div className="bg-green-50 text-green-700 p-3 rounded-md text-sm">{success}</div>
      )}
      {error && (
        <div className="bg-red-50 text-red-700 p-3 rounded-md text-sm">{error}</div>
      )}

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">Se incarca...</div>
          ) : pages.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">Nicio pagina gasita</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50 text-left text-muted-foreground">
                    <th className="p-3 font-medium">Titlu</th>
                    <th className="p-3 font-medium">Slug</th>
                    <th className="p-3 font-medium">Publicat</th>
                    <th className="p-3 font-medium">Ordine</th>
                    <th className="p-3 font-medium">Actiuni</th>
                  </tr>
                </thead>
                <tbody>
                  {pages.map((page) => (
                    <tr key={page.id} className="border-b hover:bg-muted/30">
                      <td className="p-3 font-medium">{page.title}</td>
                      <td className="p-3 text-muted-foreground">{page.slug}</td>
                      <td className="p-3">
                        <Badge className={page.published ? "bg-green-100 text-green-800" : "bg-slate-100 text-slate-800"}>
                          {page.published ? "Da" : "Nu"}
                        </Badge>
                      </td>
                      <td className="p-3 text-muted-foreground">{page.sortOrder}</td>
                      <td className="p-3">
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push(`/admin/pages/${page.id}`)}
                          >
                            <Pencil className="h-3.5 w-3.5 mr-1" />
                            Editeaza
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700"
                            onClick={() => handleDelete(page.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5 mr-1" />
                            Sterge
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Page Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Pagina noua</DialogTitle>
            <DialogDescription>Creeaza o pagina noua pentru site</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Titlu *</Label>
              <Input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Titlul paginii"
              />
            </div>
            <div className="space-y-2">
              <Label>Slug *</Label>
              <Input
                value={newSlug}
                onChange={(e) => setNewSlug(e.target.value)}
                placeholder="slug-pagina"
              />
            </div>
            <div className="space-y-2">
              <Label>Continut</Label>
              <Textarea
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                placeholder="Continutul paginii (JSON sau HTML)"
                rows={8}
              />
            </div>
            <div className="space-y-2">
              <Label>Meta titlu</Label>
              <Input
                value={newMetaTitle}
                onChange={(e) => setNewMetaTitle(e.target.value)}
                placeholder="Titlu pentru SEO"
              />
            </div>
            <div className="space-y-2">
              <Label>Meta descriere</Label>
              <Textarea
                value={newMetaDescription}
                onChange={(e) => setNewMetaDescription(e.target.value)}
                placeholder="Descriere pentru SEO"
                rows={3}
              />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="newPublished"
                checked={newPublished}
                onCheckedChange={(checked) => setNewPublished(checked === true)}
              />
              <Label htmlFor="newPublished">Publicat</Label>
            </div>
            <div className="space-y-2">
              <Label>Ordine sortare</Label>
              <Input
                type="number"
                value={newSortOrder}
                onChange={(e) => setNewSortOrder(parseInt(e.target.value) || 0)}
                placeholder="0"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Anuleaza
            </Button>
            <Button onClick={handleCreate} disabled={saving}>
              {saving ? "Se creeaza..." : "Creeaza pagina"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

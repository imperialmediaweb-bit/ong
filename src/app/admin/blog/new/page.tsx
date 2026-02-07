"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Save } from "lucide-react";

export default function AdminBlogNewPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [category, setCategory] = useState("Noutati");
  const [tags, setTags] = useState("");
  const [status, setStatus] = useState("DRAFT");
  const [featured, setFeatured] = useState(false);

  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
  };

  const handleTitleChange = (value: string) => {
    setTitle(value);
    if (!slug || slug === generateSlug(title)) {
      setSlug(generateSlug(value));
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      setErrorMsg("Titlul este obligatoriu");
      return;
    }
    setSaving(true);
    setErrorMsg("");
    try {
      const res = await fetch("/api/admin/blog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          slug: slug || generateSlug(title),
          excerpt,
          content,
          coverImage,
          category,
          tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
          status,
          featured,
        }),
      });
      if (!res.ok) throw new Error("Eroare la salvare");
      router.push("/admin/blog");
    } catch (err) {
      setErrorMsg("Eroare la salvarea articolului");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => router.push("/admin/blog")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Inapoi
        </Button>
        <h1 className="text-2xl font-bold">Articol nou</h1>
      </div>

      {errorMsg && (
        <div className="bg-red-50 text-red-700 p-3 rounded-md text-sm">{errorMsg}</div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Continut</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Titlu *</Label>
                <Input
                  value={title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="Titlul articolului"
                />
              </div>
              <div className="space-y-2">
                <Label>Slug</Label>
                <Input
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="slug-articol"
                />
              </div>
              <div className="space-y-2">
                <Label>Excerpt</Label>
                <Textarea
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value)}
                  rows={3}
                  placeholder="Scurta descriere a articolului..."
                />
              </div>
              <div className="space-y-2">
                <Label>Continut (HTML)</Label>
                <Textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={15}
                  placeholder="<p>Continutul articolului...</p>"
                  className="font-mono text-sm"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Publicare</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DRAFT">Ciorna</SelectItem>
                    <SelectItem value="PUBLISHED">Publicat</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="featured"
                  checked={featured}
                  onCheckedChange={(checked) => setFeatured(checked === true)}
                />
                <Label htmlFor="featured" className="cursor-pointer">
                  Articol recomandat
                </Label>
              </div>
              <Button onClick={handleSave} disabled={saving} className="w-full">
                <Save className="h-4 w-4 mr-2" />
                {saving ? "Se salveaza..." : "Salveaza articol"}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Detalii</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Imagine cover (URL)</Label>
                <Input
                  value={coverImage}
                  onChange={(e) => setCoverImage(e.target.value)}
                  placeholder="https://..."
                />
              </div>
              <div className="space-y-2">
                <Label>Categorie</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Noutati">Noutati</SelectItem>
                    <SelectItem value="Ghiduri">Ghiduri</SelectItem>
                    <SelectItem value="Resurse">Resurse</SelectItem>
                    <SelectItem value="Comunitate">Comunitate</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Etichete (separate prin virgula)</Label>
                <Input
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="ngo, donatii, voluntariat"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

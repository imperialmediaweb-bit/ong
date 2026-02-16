"use client";

import { useState, useRef } from "react";
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
import { ArrowLeft, Save, Sparkles, Loader2, Upload, Image as ImageIcon } from "lucide-react";

export default function DashboardBlogNewPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [uploading, setUploading] = useState(false);
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
  const [aiTopic, setAiTopic] = useState("");
  const [aiTone, setAiTone] = useState("professional");

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

  const handleAIGenerate = async () => {
    if (!aiTopic.trim()) {
      setErrorMsg("Introdu un subiect pentru generarea AI");
      return;
    }
    setGenerating(true);
    setErrorMsg("");
    try {
      const res = await fetch("/api/blog/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: aiTopic,
          tone: aiTone,
          language: "ro",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Eroare AI");
      setTitle(data.title || "");
      setSlug(generateSlug(data.title || ""));
      setExcerpt(data.excerpt || "");
      setContent(data.content || "");
      setCategory(data.category || "Noutati");
      if (data.tags?.length) setTags(data.tags.join(", "));
    } catch (err: any) {
      setErrorMsg(err.message || "Eroare la generarea AI");
    } finally {
      setGenerating(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setErrorMsg("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/blog/upload-image", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Eroare upload");
      setCoverImage(data.url);
    } catch (err: any) {
      setErrorMsg(err.message || "Eroare la incarcarea imaginii");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      setErrorMsg("Titlul este obligatoriu");
      return;
    }
    if (!content.trim()) {
      setErrorMsg("Continutul este obligatoriu");
      return;
    }
    setSaving(true);
    setErrorMsg("");
    try {
      const res = await fetch("/api/blog", {
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
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Eroare la salvare");
      }
      router.push("/dashboard/blog");
    } catch (err: any) {
      setErrorMsg(err.message || "Eroare la salvarea articolului");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => router.push("/dashboard/blog")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Inapoi
        </Button>
        <h1 className="text-2xl font-bold">Articol nou</h1>
      </div>

      {errorMsg && (
        <div className="bg-red-50 text-red-700 p-3 rounded-md text-sm">{errorMsg}</div>
      )}

      {/* AI Generator */}
      <Card className="border-indigo-200 bg-gradient-to-r from-indigo-50/50 to-purple-50/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-indigo-600" />
            Genereaza cu AI
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="sm:col-span-2 space-y-2">
              <Label>Subiect / Tema articolului</Label>
              <Input
                value={aiTopic}
                onChange={(e) => setAiTopic(e.target.value)}
                placeholder="ex: Importanta voluntariatului in comunitate"
              />
            </div>
            <div className="space-y-2">
              <Label>Ton</Label>
              <Select value={aiTone} onValueChange={setAiTone}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="professional">Profesional</SelectItem>
                  <SelectItem value="friendly">Prietenos</SelectItem>
                  <SelectItem value="emotional">Emotional</SelectItem>
                  <SelectItem value="formal">Formal</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button onClick={handleAIGenerate} disabled={generating} variant="outline" className="border-indigo-300 text-indigo-700 hover:bg-indigo-50">
            {generating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Se genereaza...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Genereaza articol
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
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
                <Label>Excerpt / Rezumat</Label>
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
                <Label htmlFor="featured" className="cursor-pointer">Articol recomandat</Label>
              </div>
              <Button onClick={handleSave} disabled={saving} className="w-full">
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Se salveaza...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Salveaza articol
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Imagine cover</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {coverImage ? (
                <div className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={coverImage} alt="Cover" className="w-full h-40 object-cover rounded-lg" />
                  <Button
                    variant="outline"
                    size="sm"
                    className="absolute top-2 right-2 bg-white/80"
                    onClick={() => setCoverImage("")}
                  >
                    Sterge
                  </Button>
                </div>
              ) : (
                <div
                  className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {uploading ? (
                    <Loader2 className="h-8 w-8 mx-auto animate-spin text-muted-foreground" />
                  ) : (
                    <>
                      <ImageIcon className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
                      <p className="text-sm text-muted-foreground">Click pentru a incarca imagine</p>
                      <p className="text-xs text-muted-foreground/60 mt-1">JPEG, PNG, WebP, GIF - max 5MB</p>
                    </>
                  )}
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={handleImageUpload}
              />
              <div className="space-y-2">
                <Label>sau URL imagine</Label>
                <Input
                  value={coverImage}
                  onChange={(e) => setCoverImage(e.target.value)}
                  placeholder="https://..."
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Detalii</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Categorie</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Noutati">Noutati</SelectItem>
                    <SelectItem value="Proiecte">Proiecte</SelectItem>
                    <SelectItem value="Ghiduri">Ghiduri</SelectItem>
                    <SelectItem value="Resurse">Resurse</SelectItem>
                    <SelectItem value="Comunitate">Comunitate</SelectItem>
                    <SelectItem value="Evenimente">Evenimente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Etichete (separate prin virgula)</Label>
                <Input
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="voluntariat, comunitate, proiect"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

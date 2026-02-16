"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Save, Sparkles, Loader2, Image as ImageIcon } from "lucide-react";

export default function DashboardBlogEditPage() {
  const router = useRouter();
  const params = useParams();
  const postId = params?.id as string;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
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

  useEffect(() => {
    if (!postId) return;
    fetch(`/api/blog/${postId}`)
      .then((r) => r.json())
      .then((data) => {
        const p = data.post;
        if (p) {
          setTitle(p.title || "");
          setSlug(p.slug || "");
          setExcerpt(p.excerpt || "");
          setContent(p.content || "");
          setCoverImage(p.coverImage || "");
          setCategory(p.category || "Noutati");
          setTags((p.tags || []).join(", "));
          setStatus(p.status || "DRAFT");
          setFeatured(p.featured || false);
        }
      })
      .catch(() => setErrorMsg("Eroare la incarcarea articolului"))
      .finally(() => setLoading(false));
  }, [postId]);

  const handleAIGenerate = async () => {
    if (!aiTopic.trim()) {
      setErrorMsg("Introdu un subiect");
      return;
    }
    setGenerating(true);
    setErrorMsg("");
    try {
      const res = await fetch("/api/blog/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: aiTopic, tone: aiTone, language: "ro" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Eroare AI");
      setContent(data.content || "");
      if (!title) setTitle(data.title || "");
      if (!excerpt) setExcerpt(data.excerpt || "");
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setGenerating(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/blog/upload-image", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setCoverImage(data.url);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) {
      setErrorMsg("Titlul si continutul sunt obligatorii");
      return;
    }
    setSaving(true);
    setErrorMsg("");
    try {
      const res = await fetch(`/api/blog/${postId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title, slug, excerpt, content, coverImage, category,
          tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
          status, featured,
        }),
      });
      if (!res.ok) throw new Error("Eroare la salvare");
      router.push("/dashboard/blog");
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => router.push("/dashboard/blog")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Inapoi
        </Button>
        <h1 className="text-2xl font-bold">Editeaza articol</h1>
      </div>

      {errorMsg && (
        <div className="bg-red-50 text-red-700 p-3 rounded-md text-sm">{errorMsg}</div>
      )}

      {/* AI Generator */}
      <Card className="border-indigo-200 bg-gradient-to-r from-indigo-50/50 to-purple-50/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="h-5 w-5 text-indigo-600" />
            Regenereaza cu AI
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <Input
              value={aiTopic}
              onChange={(e) => setAiTopic(e.target.value)}
              placeholder="Subiect nou..."
              className="flex-1"
            />
            <Select value={aiTone} onValueChange={setAiTone}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="professional">Profesional</SelectItem>
                <SelectItem value="friendly">Prietenos</SelectItem>
                <SelectItem value="emotional">Emotional</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleAIGenerate} disabled={generating} variant="outline" className="border-indigo-300">
              {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader><CardTitle>Continut</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Titlu *</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Slug</Label>
                <Input value={slug} onChange={(e) => setSlug(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Excerpt</Label>
                <Textarea value={excerpt} onChange={(e) => setExcerpt(e.target.value)} rows={3} />
              </div>
              <div className="space-y-2">
                <Label>Continut (HTML)</Label>
                <Textarea value={content} onChange={(e) => setContent(e.target.value)} rows={15} className="font-mono text-sm" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Publicare</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DRAFT">Ciorna</SelectItem>
                    <SelectItem value="PUBLISHED">Publicat</SelectItem>
                    <SelectItem value="ARCHIVED">Arhivat</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox id="featured" checked={featured} onCheckedChange={(c) => setFeatured(c === true)} />
                <Label htmlFor="featured" className="cursor-pointer">Articol recomandat</Label>
              </div>
              <Button onClick={handleSave} disabled={saving} className="w-full">
                {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Se salveaza...</> : <><Save className="h-4 w-4 mr-2" />Salveaza</>}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Imagine cover</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {coverImage ? (
                <div className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={coverImage} alt="Cover" className="w-full h-40 object-cover rounded-lg" />
                  <Button variant="outline" size="sm" className="absolute top-2 right-2 bg-white/80" onClick={() => setCoverImage("")}>Sterge</Button>
                </div>
              ) : (
                <div className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:bg-muted/50" onClick={() => fileInputRef.current?.click()}>
                  {uploading ? <Loader2 className="h-8 w-8 mx-auto animate-spin text-muted-foreground" /> : (
                    <>
                      <ImageIcon className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
                      <p className="text-sm text-muted-foreground">Click pentru upload</p>
                    </>
                  )}
                </div>
              )}
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
              <div className="space-y-2">
                <Label>sau URL imagine</Label>
                <Input value={coverImage} onChange={(e) => setCoverImage(e.target.value)} placeholder="https://..." />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Detalii</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Categorie</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
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
                <Label>Etichete</Label>
                <Input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="tag1, tag2" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

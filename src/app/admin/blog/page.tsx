"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { FileText, Plus, Pencil, Archive, Trash2, Eye, Send } from "lucide-react";

interface BlogPost {
  id: string;
  title: string;
  category: string;
  status: string;
  publishedAt: string | null;
  views: number;
  createdAt: string;
}

export default function AdminBlogPage() {
  const router = useRouter();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    fetchPosts();
  }, [statusFilter]);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);

      const res = await fetch(`/api/admin/blog?${params}`);
      const data = await res.json();
      setPosts(data.posts || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setErrorMsg("");
    setTimeout(() => setSuccessMsg(""), 3000);
  };

  const handlePublish = async (postId: string) => {
    try {
      const res = await fetch(`/api/admin/blog/${postId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "PUBLISHED" }),
      });
      if (!res.ok) throw new Error("Eroare");
      showSuccess("Articolul a fost publicat");
      fetchPosts();
    } catch (err) {
      setErrorMsg("Eroare la publicarea articolului");
    }
  };

  const handleArchive = async (postId: string) => {
    try {
      const res = await fetch(`/api/admin/blog/${postId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "ARCHIVED" }),
      });
      if (!res.ok) throw new Error("Eroare");
      showSuccess("Articolul a fost arhivat");
      fetchPosts();
    } catch (err) {
      setErrorMsg("Eroare la arhivarea articolului");
    }
  };

  const handleDelete = async (postId: string) => {
    if (!confirm("Sigur doriti sa stergeti acest articol?")) return;
    try {
      const res = await fetch(`/api/admin/blog/${postId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Eroare");
      showSuccess("Articolul a fost sters");
      fetchPosts();
    } catch (err) {
      setErrorMsg("Eroare la stergerea articolului");
    }
  };

  const statusColors: Record<string, string> = {
    DRAFT: "bg-slate-100 text-slate-800",
    PUBLISHED: "bg-green-100 text-green-800",
    ARCHIVED: "bg-yellow-100 text-yellow-800",
  };

  const statusLabels: Record<string, string> = {
    DRAFT: "Ciorna",
    PUBLISHED: "Publicat",
    ARCHIVED: "Arhivat",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileText className="h-7 w-7 text-blue-600" />
          <h1 className="text-3xl font-bold">Blog</h1>
        </div>
        <Button onClick={() => router.push("/admin/blog/new")}>
          <Plus className="h-4 w-4 mr-2" />
          Articol nou
        </Button>
      </div>

      {/* Messages */}
      {successMsg && (
        <div className="bg-green-50 text-green-700 p-3 rounded-md text-sm">{successMsg}</div>
      )}
      {errorMsg && (
        <div className="bg-red-50 text-red-700 p-3 rounded-md text-sm">{errorMsg}</div>
      )}

      {/* Filter */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium">Filtreaza dupa status:</span>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toate</SelectItem>
                <SelectItem value="DRAFT">Ciorna</SelectItem>
                <SelectItem value="PUBLISHED">Publicat</SelectItem>
                <SelectItem value="ARCHIVED">Arhivat</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">Se incarca...</div>
          ) : posts.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">Niciun articol gasit</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50 text-left text-muted-foreground">
                    <th className="p-3 font-medium">Titlu</th>
                    <th className="p-3 font-medium">Categorie</th>
                    <th className="p-3 font-medium">Status</th>
                    <th className="p-3 font-medium">Data publicarii</th>
                    <th className="p-3 font-medium text-right">Vizualizari</th>
                    <th className="p-3 font-medium">Actiuni</th>
                  </tr>
                </thead>
                <tbody>
                  {posts.map((post) => (
                    <tr key={post.id} className="border-b hover:bg-muted/30">
                      <td className="p-3 font-medium">{post.title}</td>
                      <td className="p-3 text-muted-foreground">{post.category}</td>
                      <td className="p-3">
                        <Badge className={statusColors[post.status] || statusColors.DRAFT}>
                          {statusLabels[post.status] || post.status}
                        </Badge>
                      </td>
                      <td className="p-3 text-muted-foreground">
                        {post.publishedAt
                          ? new Date(post.publishedAt).toLocaleDateString("ro-RO")
                          : "-"}
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1 text-muted-foreground">
                          <Eye className="h-3.5 w-3.5" />
                          {post.views}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push(`/admin/blog/${post.id}/edit`)}
                          >
                            <Pencil className="h-3.5 w-3.5 mr-1" />
                            Editeaza
                          </Button>
                          {post.status !== "PUBLISHED" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-green-600 hover:text-green-700"
                              onClick={() => handlePublish(post.id)}
                            >
                              <Send className="h-3.5 w-3.5 mr-1" />
                              Publica
                            </Button>
                          )}
                          {post.status !== "ARCHIVED" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-yellow-600 hover:text-yellow-700"
                              onClick={() => handleArchive(post.id)}
                            >
                              <Archive className="h-3.5 w-3.5 mr-1" />
                              Arhiveaza
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700"
                            onClick={() => handleDelete(post.id)}
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
    </div>
  );
}

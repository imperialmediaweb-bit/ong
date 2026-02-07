import Link from "next/link";
import prisma from "@/lib/db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, Eye, ArrowRight } from "lucide-react";

export const dynamic = "force-dynamic";

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("ro-RO", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

export default async function BlogPage() {
  const posts = await prisma.blogPost.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { publishedAt: "desc" },
    include: { author: { select: { name: true } } },
  });

  const featured = posts.find((p) => p.featured);
  const regular = posts.filter((p) => !p.featured || p.id !== featured?.id);

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background">
      <div className="container mx-auto px-4 py-12 max-w-5xl">
        <header className="text-center mb-12">
          <Link href="/" className="text-primary font-bold text-xl">
            NGO HUB
          </Link>
          <h1 className="text-4xl font-bold mt-4">Blog</h1>
          <p className="text-muted-foreground mt-2">
            Noutati, ghiduri si resurse pentru ONG-uri
          </p>
        </header>

        {featured && (
          <Link href={`/blog/${featured.slug}`}>
            <Card className="mb-10 hover:shadow-lg transition-shadow overflow-hidden">
              {featured.coverImage && (
                <div className="h-64 bg-cover bg-center" style={{ backgroundImage: `url(${featured.coverImage})` }} />
              )}
              <CardHeader>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="default">Recomandat</Badge>
                  {featured.category && (
                    <Badge variant="secondary">{featured.category}</Badge>
                  )}
                </div>
                <CardTitle className="text-2xl">{featured.title}</CardTitle>
                <CardDescription>{featured.excerpt}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>{featured.author?.name}</span>
                  <span className="flex items-center gap-1">
                    <CalendarDays className="h-3.5 w-3.5" />
                    {featured.publishedAt && formatDate(featured.publishedAt)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Eye className="h-3.5 w-3.5" />
                    {featured.viewCount} vizualizari
                  </span>
                </div>
              </CardContent>
            </Card>
          </Link>
        )}

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {regular.map((post) => (
            <Link key={post.id} href={`/blog/${post.slug}`}>
              <Card className="h-full hover:shadow-md transition-shadow">
                {post.coverImage && (
                  <div className="h-40 bg-cover bg-center rounded-t-lg" style={{ backgroundImage: `url(${post.coverImage})` }} />
                )}
                <CardHeader>
                  {post.category && (
                    <Badge variant="secondary" className="w-fit mb-1">{post.category}</Badge>
                  )}
                  <CardTitle className="text-lg">{post.title}</CardTitle>
                  <CardDescription className="line-clamp-2">{post.excerpt}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{post.publishedAt && formatDate(post.publishedAt)}</span>
                    <span className="flex items-center gap-1 text-primary">
                      Citeste <ArrowRight className="h-3 w-3" />
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {posts.length === 0 && (
          <div className="text-center py-16">
            <p className="text-muted-foreground">Niciun articol publicat inca.</p>
          </div>
        )}

        <footer className="text-center text-xs text-muted-foreground mt-16 pb-8">
          <Link href="/" className="text-primary hover:underline">
            Inapoi la NGO HUB
          </Link>
        </footer>
      </div>
    </div>
  );
}

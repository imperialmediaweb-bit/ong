import { notFound } from "next/navigation";
import Link from "next/link";
import prisma from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, Eye, ArrowLeft, User } from "lucide-react";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("ro-RO", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

interface Props {
  params: { slug: string };
}

export default async function BlogPostPage({ params }: Props) {
  const post = await prisma.blogPost.findUnique({
    where: { slug: params.slug },
    include: { author: { select: { name: true } } },
  });

  if (!post || post.status !== "PUBLISHED") notFound();

  // Increment view count
  await prisma.blogPost.update({
    where: { id: post.id },
    data: { viewCount: { increment: 1 } },
  });

  // Related posts
  const relatedPosts = await prisma.blogPost.findMany({
    where: {
      status: "PUBLISHED",
      id: { not: post.id },
      category: post.category || undefined,
    },
    take: 3,
    orderBy: { publishedAt: "desc" },
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background">
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <header className="flex items-center justify-between mb-8">
          <Link href="/" className="text-primary font-bold text-xl">
            NGO HUB
          </Link>
          <Link href="/blog">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-1 h-4 w-4" />
              Toate articolele
            </Button>
          </Link>
        </header>

        <article>
          {post.coverImage && (
            <div
              className="h-72 bg-cover bg-center rounded-xl mb-8"
              style={{ backgroundImage: `url(${post.coverImage})` }}
            />
          )}

          <div className="flex flex-wrap items-center gap-2 mb-4">
            {post.category && <Badge variant="secondary">{post.category}</Badge>}
            {post.tags.map((tag) => (
              <Badge key={tag} variant="outline">{tag}</Badge>
            ))}
          </div>

          <h1 className="text-3xl md:text-4xl font-bold mb-4">{post.title}</h1>

          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-8 pb-8 border-b">
            <span className="flex items-center gap-1">
              <User className="h-3.5 w-3.5" />
              {post.author?.name || "NGO HUB"}
            </span>
            <span className="flex items-center gap-1">
              <CalendarDays className="h-3.5 w-3.5" />
              {post.publishedAt && formatDate(post.publishedAt)}
            </span>
            <span className="flex items-center gap-1">
              <Eye className="h-3.5 w-3.5" />
              {post.viewCount} vizualizari
            </span>
          </div>

          <div
            className="prose prose-lg max-w-none"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />
        </article>

        {relatedPosts.length > 0 && (
          <section className="mt-16 pt-8 border-t">
            <h2 className="text-xl font-bold mb-6">Articole similare</h2>
            <div className="grid gap-4 md:grid-cols-3">
              {relatedPosts.map((rp) => (
                <Link key={rp.id} href={`/blog/${rp.slug}`}>
                  <div className="p-4 rounded-lg border hover:shadow-md transition-shadow">
                    <h3 className="font-semibold text-sm mb-2 line-clamp-2">{rp.title}</h3>
                    <p className="text-xs text-muted-foreground line-clamp-2">{rp.excerpt}</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        <footer className="text-center text-xs text-muted-foreground mt-16 pb-8">
          <p>
            <Link href="/" className="text-primary hover:underline">NGO HUB</Link>
            {" "}&middot;{" "}
            <Link href="/blog" className="text-primary hover:underline">Blog</Link>
          </p>
        </footer>
      </div>
    </div>
  );
}

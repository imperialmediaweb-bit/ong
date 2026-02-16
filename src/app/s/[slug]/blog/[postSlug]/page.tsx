import { notFound } from "next/navigation";
import { Metadata } from "next";
import prisma from "@/lib/db";
import { ArrowLeft, Calendar, Tag, Clock, Eye } from "lucide-react";
import { ShareButtons } from "@/components/minisite/share-buttons";
import { MiniSiteFooterCta } from "@/components/minisite/footer-cta";

export const dynamic = "force-dynamic";

function hexToRgb(hex: string): string {
  const cleaned = hex.replace("#", "");
  const r = parseInt(cleaned.substring(0, 2), 16);
  const g = parseInt(cleaned.substring(2, 4), 16);
  const b = parseInt(cleaned.substring(4, 6), 16);
  return `${r}, ${g}, ${b}`;
}

export async function generateMetadata({ params }: { params: { slug: string; postSlug: string } }): Promise<Metadata> {
  const ngo: any = await prisma.ngo.findUnique({
    where: { slug: params.slug, isActive: true },
    select: { id: true, name: true, logoUrl: true, coverImageUrl: true },
  });
  if (!ngo) return { title: "Articol negasit - Binevo" };

  let post: any = null;
  try {
    post = await prisma.blogPost.findFirst({
      where: { slug: params.postSlug, ngoId: ngo.id, status: "PUBLISHED" },
    });
  } catch {
    // table might not exist
  }

  if (!post) return { title: "Articol negasit - Binevo" };

  const title = post.title;
  const description = (post.excerpt || post.title).slice(0, 160);
  const ogImage = post.coverImage
    || ngo.coverImageUrl
    || ngo.logoUrl
    || `/api/og?title=${encodeURIComponent(title)}&subtitle=${encodeURIComponent(ngo.name)}`;

  return {
    title: `${title} - ${ngo.name} | Binevo`,
    description,
    openGraph: {
      title,
      description,
      type: "article",
      siteName: "Binevo",
      images: [{ url: ogImage, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
  };
}

export default async function BlogPostPage({ params }: { params: { slug: string; postSlug: string } }) {
  const ngo = await prisma.ngo.findUnique({
    where: { slug: params.slug, isActive: true },
    include: {
      miniSiteConfig: true,
      consentTexts: { where: { isActive: true } },
    },
  });

  if (!ngo) notFound();

  const config = ngo.miniSiteConfig;
  const primaryColor = config?.primaryColor || "#6366f1";
  const accentColor = config?.accentColor || "#f59e0b";
  const primaryRgb = hexToRgb(primaryColor);

  let post: any = null;
  try {
    post = await prisma.blogPost.findFirst({
      where: { slug: params.postSlug, ngoId: ngo.id, status: "PUBLISHED" },
    });
  } catch {
    // table might not exist
  }

  if (!post) notFound();

  // Increment view count
  try {
    await prisma.blogPost.update({
      where: { id: post.id },
      data: { viewCount: { increment: 1 } },
    });
  } catch {}

  const publishDate = post.publishedAt
    ? new Date(post.publishedAt).toLocaleDateString("ro-RO", { year: "numeric", month: "long", day: "numeric" })
    : null;

  const consentTexts = Object.fromEntries(
    ngo.consentTexts.map((ct: any) => [ct.type, ct.text])
  );

  // Estimate reading time
  const wordCount = (post.content || "").replace(/<[^>]*>/g, "").split(/\s+/).length;
  const readingTime = Math.max(1, Math.ceil(wordCount / 200));

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <a href={`/s/${params.slug}/blog`} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Inapoi la blog
          </a>
          <ShareButtons title={post.title} primaryColor={primaryColor} />
        </div>
      </div>

      {/* Cover Image */}
      {post.coverImage && (
        <div className="w-full h-64 sm:h-80 md:h-96 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={post.coverImage} alt={post.title} className="w-full h-full object-cover" />
        </div>
      )}

      {/* Article */}
      <article className="max-w-3xl mx-auto px-4 py-12">
        {/* Meta */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          {post.category && (
            <span className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold" style={{ backgroundColor: `rgba(${primaryRgb}, 0.1)`, color: primaryColor }}>
              <Tag className="h-3 w-3" />
              {post.category}
            </span>
          )}
          {publishDate && (
            <span className="flex items-center gap-1 text-sm text-gray-400">
              <Calendar className="h-3.5 w-3.5" />
              {publishDate}
            </span>
          )}
          <span className="flex items-center gap-1 text-sm text-gray-400">
            <Clock className="h-3.5 w-3.5" />
            {readingTime} min citire
          </span>
          <span className="flex items-center gap-1 text-sm text-gray-400">
            <Eye className="h-3.5 w-3.5" />
            {post.viewCount} vizualizari
          </span>
        </div>

        {/* Title */}
        <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 leading-tight mb-6">
          {post.title}
        </h1>

        {/* Excerpt */}
        {post.excerpt && (
          <p className="text-lg text-gray-500 leading-relaxed mb-8 border-l-4 pl-4" style={{ borderColor: primaryColor }}>
            {post.excerpt}
          </p>
        )}

        {/* Content */}
        <div
          className="prose prose-lg max-w-none prose-headings:text-gray-900 prose-p:text-gray-600 prose-a:text-indigo-600 prose-img:rounded-xl"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="mt-10 pt-6 border-t border-gray-200">
            <div className="flex flex-wrap gap-2">
              {post.tags.map((tag: string) => (
                <span key={tag} className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Share */}
        <div className="mt-8 pt-6 border-t border-gray-200 flex items-center justify-between">
          <span className="text-sm font-medium text-gray-500">Distribuie articolul:</span>
          <ShareButtons title={post.title} primaryColor={primaryColor} />
        </div>

        {/* Back */}
        <div className="mt-8 text-center">
          <a
            href={`/s/${params.slug}/blog`}
            className="inline-flex items-center gap-2 text-sm font-semibold hover:underline"
            style={{ color: primaryColor }}
          >
            <ArrowLeft className="h-4 w-4" />
            Toate articolele
          </a>
        </div>
      </article>

      {/* Footer CTA - Donation + Formular 230 */}
      <MiniSiteFooterCta
        ngo={ngo}
        config={config}
        consentTexts={consentTexts}
        primaryColor={primaryColor}
        accentColor={accentColor}
        primaryRgb={primaryRgb}
      />
    </div>
  );
}

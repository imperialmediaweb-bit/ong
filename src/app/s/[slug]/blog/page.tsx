import { notFound } from "next/navigation";
import { Metadata } from "next";
import prisma from "@/lib/db";
import { ArrowLeft, Calendar, Tag, ArrowRight, Newspaper } from "lucide-react";
import { ShareButtons } from "@/components/minisite/share-buttons";
import { MiniSiteFooterCta } from "@/components/minisite/footer-cta";

export const dynamic = "force-dynamic";

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").replace(/&[^;]+;/g, " ").trim();
}

function hexToRgb(hex: string): string {
  const cleaned = hex.replace("#", "");
  const r = parseInt(cleaned.substring(0, 2), 16);
  const g = parseInt(cleaned.substring(2, 4), 16);
  const b = parseInt(cleaned.substring(4, 6), 16);
  return `${r}, ${g}, ${b}`;
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const ngo: any = await prisma.ngo.findUnique({
    where: { slug: params.slug, isActive: true },
    select: { name: true, logoUrl: true, coverImageUrl: true },
  });
  if (!ngo) return { title: "Blog - Binevo" };

  const title = `Blog - ${ngo.name}`;
  const description = `Ultimele noutati si articole de la ${ngo.name}`;
  const ogImage = ngo.coverImageUrl
    || ngo.logoUrl
    || `/api/og?title=${encodeURIComponent("Blog")}&subtitle=${encodeURIComponent(ngo.name)}`;

  return {
    title: `${title} | Binevo`,
    description,
    openGraph: {
      title,
      description,
      type: "website",
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

export default async function BlogListPage({ params }: { params: { slug: string } }) {
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

  let blogPosts: any[] = [];
  try {
    blogPosts = await prisma.blogPost.findMany({
      where: { ngoId: ngo.id, status: "PUBLISHED" },
      orderBy: { publishedAt: "desc" },
      select: {
        id: true, slug: true, title: true, excerpt: true,
        content: true, coverImage: true, category: true,
        publishedAt: true, tags: true,
      },
    });
  } catch {
    blogPosts = [];
  }

  const consentTexts = Object.fromEntries(
    ngo.consentTexts.map((ct: any) => [ct.type, ct.text])
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <a href={`/s/${params.slug}`} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Inapoi la {ngo.name}
          </a>
          <ShareButtons title={`Blog - ${ngo.name}`} primaryColor={primaryColor} />
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl" style={{ backgroundColor: `rgba(${primaryRgb}, 0.1)` }}>
            <Newspaper className="h-7 w-7" style={{ color: primaryColor }} />
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">Blog</h1>
          <p className="mt-3 text-lg text-gray-500">Ultimele noutati si articole de la {ngo.name}</p>
        </div>

        {blogPosts.length === 0 ? (
          <div className="text-center py-16">
            <Newspaper className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Nu exista articole publicate inca.</p>
          </div>
        ) : (
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {blogPosts.map((post: any) => {
              const postExcerpt = post.excerpt || stripHtml(post.content || "").substring(0, 150);
              const publishDate = post.publishedAt
                ? new Date(post.publishedAt).toLocaleDateString("ro-RO", { year: "numeric", month: "long", day: "numeric" })
                : null;

              return (
                <a
                  key={post.id}
                  href={`/s/${params.slug}/blog/${post.slug}`}
                  className="group flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-100 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                >
                  {post.coverImage && (
                    <div className="aspect-video w-full overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={post.coverImage} alt={post.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    </div>
                  )}
                  <div className="flex flex-1 flex-col p-6">
                    <div className="mb-3 flex flex-wrap items-center gap-2">
                      {post.category && (
                        <span className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold" style={{ backgroundColor: `rgba(${primaryRgb}, 0.1)`, color: primaryColor }}>
                          <Tag className="h-3 w-3" />
                          {post.category}
                        </span>
                      )}
                      {publishDate && (
                        <span className="flex items-center gap-1 text-xs text-gray-400">
                          <Calendar className="h-3 w-3" />
                          {publishDate}
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 group-hover:text-gray-700">{post.title}</h3>
                    {postExcerpt && (
                      <p className="mt-2 flex-1 text-sm leading-relaxed text-gray-500">
                        {postExcerpt.length > 150 ? `${postExcerpt.substring(0, 150)}...` : postExcerpt}
                      </p>
                    )}
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <span className="inline-flex items-center gap-1.5 text-sm font-semibold" style={{ color: primaryColor }}>
                        Citeste mai mult
                        <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" />
                      </span>
                    </div>
                  </div>
                </a>
              );
            })}
          </div>
        )}
      </div>

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

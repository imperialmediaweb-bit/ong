/**
 * API Seed Endpoint
 * Runs seed logic directly without needing tsx
 * GET /api/seed?key=SEED_SECRET
 */

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { hash } from "bcryptjs";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  // Optional security key
  const seedSecret = process.env.SEED_SECRET || process.env.CRON_SECRET;
  const key = req.nextUrl.searchParams.get("key");

  if (seedSecret && key !== seedSecret) {
    return NextResponse.json({ error: "Cheie invalida" }, { status: 401 });
  }

  try {
    const log: string[] = [];

    const passwordHash = await hash("password123", 12);

    // ─── SUPER ADMIN ──────────────────────────────────────────────
    const superAdmin = await prisma.user.upsert({
      where: { email: "superadmin@binevo.ro" },
      update: { passwordHash },
      create: {
        email: "superadmin@binevo.ro",
        passwordHash,
        name: "Super Administrator",
        role: "SUPER_ADMIN",
        ngoId: null,
      },
    });
    log.push("Super Admin: superadmin@binevo.ro");

    // ─── Platform Settings ────────────────────────────────────────
    await prisma.platformSettings.upsert({
      where: { id: "platform" },
      update: {},
      create: {
        id: "platform",
        siteName: "Binevo",
        siteDescription: "Platforma completa de CRM si campanii pentru ONG-uri din Romania",
        heroTitle: "Platforma completa pentru ONG-uri",
        heroSubtitle: "Gestioneaza donatorii, creeaza campanii inteligente si automatizeaza comunicarea cu ajutorul AI.",
        heroCtaText: "Incepe gratuit",
        primaryColor: "#6366f1",
        statsEnabled: true,
        contactEmail: "contact@binevo.ro",
        footerText: "Binevo - Platforma de management pentru ONG-uri din Romania",
        featuresJson: [
          { icon: "Users", title: "CRM Donatori", description: "Gestioneaza baza de date a donatorilor cu criptare si GDPR" },
          { icon: "Mail", title: "Campanii Email & SMS", description: "Creeaza si trimite campanii personalizate cu AI" },
          { icon: "Zap", title: "Automatizari", description: "Fluxuri automate de comunicare cu donatorii" },
          { icon: "BarChart3", title: "Analitica", description: "Rapoarte detaliate si perspective valoroase" },
          { icon: "Shield", title: "GDPR Complet", description: "Conformitate completa cu regulamentul GDPR" },
          { icon: "Globe", title: "Mini-Site", description: "Pagina de donatii si newsletter personalizabila" },
          { icon: "Bot", title: "Super Agent AI", description: "Agent inteligent cu OpenAI, Gemini si Claude" },
          { icon: "CreditCard", title: "Strangere de fonduri", description: "Tracking complet al donatiilor si obiectivelor" },
          { icon: "Lock", title: "Securitate", description: "Criptare AES-256, RBAC si audit log complet" },
        ] as any,
        plansJson: [
          { name: "Basic", price: "0", currency: "RON", interval: "luna", description: "Pentru ONG-uri mici care incep", features: ["100 donatori", "Mini-site", "GDPR tools de baza", "Vizualizare donatori"], highlighted: false },
          { name: "Pro", price: "149", currency: "RON", interval: "luna", description: "Pentru ONG-uri in crestere", features: ["1.000 donatori", "Campanii email", "Generator AI", "Automatizari de baza", "Analitica", "Export CSV", "Suport prioritar"], highlighted: true },
          { name: "Elite", price: "349", currency: "RON", interval: "luna", description: "Pentru ONG-uri profesionale", features: ["Donatori nelimitati", "Email + SMS", "Automatizari avansate", "A/B Testing", "Super Agent AI", "Optimizare AI", "Suport dedicat"], highlighted: false },
        ] as any,
        socialLinks: { facebook: "https://facebook.com/binevo", linkedin: "https://linkedin.com/company/binevo", twitter: "https://twitter.com/binevo" } as any,
      },
    });
    log.push("Platform settings OK");

    // ─── Demo NGO ─────────────────────────────────────────────────
    const ngo = await prisma.ngo.upsert({
      where: { slug: "demo-ngo" },
      update: {
        subscriptionPlan: "ELITE",
        subscriptionStatus: "active",
        subscriptionStartAt: new Date(),
        subscriptionExpiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      },
      create: {
        name: "Asociatia Demo ONG",
        slug: "demo-ngo",
        description: "O asociatie demonstrativa pentru testarea platformei Binevo.",
        shortDescription: "Sprijinim comunitatile defavorizate si promovam educatia",
        subscriptionPlan: "ELITE",
        senderEmail: "noreply@demo-ngo.org",
        senderName: "Asociatia Demo ONG",
        subscriptionStatus: "active",
        subscriptionStartAt: new Date(),
        subscriptionExpiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        category: "Social",
        isFeatured: true,
        boostUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        rating: 4.8,
        ratingCount: 47,
        totalRaised: 125750,
        donorCountPublic: 342,
      },
    });
    log.push(`Demo NGO: ${ngo.name} (${ngo.id})`);

    // ─── NGO Admin ────────────────────────────────────────────────
    await prisma.user.upsert({
      where: { email: "admin@demo-ngo.org" },
      update: { passwordHash, ngoId: ngo.id },
      create: {
        email: "admin@demo-ngo.org",
        passwordHash,
        name: "Admin Demo",
        role: "NGO_ADMIN",
        ngoId: ngo.id,
      },
    });
    log.push("NGO Admin: admin@demo-ngo.org");

    // ─── Staff & Viewer ───────────────────────────────────────────
    await prisma.user.upsert({
      where: { email: "staff@demo-ngo.org" },
      update: { passwordHash, ngoId: ngo.id },
      create: {
        email: "staff@demo-ngo.org",
        passwordHash,
        name: "Staff Demo",
        role: "STAFF",
        ngoId: ngo.id,
      },
    });

    await prisma.user.upsert({
      where: { email: "viewer@demo-ngo.org" },
      update: { passwordHash, ngoId: ngo.id },
      create: {
        email: "viewer@demo-ngo.org",
        passwordHash,
        name: "Vizualizator Demo",
        role: "VIEWER",
        ngoId: ngo.id,
      },
    });
    log.push("Staff + Viewer created");

    // ─── NGO Verification ─────────────────────────────────────────
    await prisma.ngoVerification.upsert({
      where: { ngoId: ngo.id },
      update: {},
      create: {
        ngoId: ngo.id,
        status: "APPROVED",
        registrationNumber: "RO12345678",
        legalForm: "Asociatie",
        fiscalCode: "12345678",
        address: "Str. Exemplu nr. 1",
        county: "Bucuresti",
        city: "Bucuresti",
        representativeName: "Ion Popescu",
        representativeRole: "Presedinte",
        registrationDate: new Date("2020-01-15"),
        aiScore: 92,
        aiAnalysis: { nameCheck: { valid: true }, cuiCheck: { valid: true }, completeness: { score: 95 } } as any,
        aiFlags: [] as any,
        reviewedBy: superAdmin.id,
        reviewedAt: new Date(),
        reviewNotes: "Verificat si aprobat.",
      },
    });
    log.push("NGO Verification OK");

    // ─── Mini-site ────────────────────────────────────────────────
    await prisma.miniSiteConfig.upsert({
      where: { ngoId: ngo.id },
      update: {},
      create: {
        ngoId: ngo.id,
        heroTitle: "Ajuta-ne sa facem diferenta",
        heroDescription: "Fiecare donatie conteaza.",
        showNewsletter: true,
        showDonation: true,
      },
    });
    log.push("Mini-site config OK");

    // ─── Second NGO ───────────────────────────────────────────────
    const ngo2 = await prisma.ngo.upsert({
      where: { slug: "fundatia-sperantei" },
      update: {},
      create: {
        name: "Fundatia Sperantei",
        slug: "fundatia-sperantei",
        description: "Fundatie dedicata sprijinirii copiilor defavorizati din mediul rural.",
        shortDescription: "Sprijinim copiii defavorizati din mediul rural",
        subscriptionPlan: "PRO",
        subscriptionStatus: "active",
        subscriptionStartAt: new Date(),
        subscriptionExpiresAt: new Date(Date.now() + 305 * 24 * 60 * 60 * 1000),
        category: "Educatie",
        rating: 4.5,
        ratingCount: 28,
        totalRaised: 67200,
        donorCountPublic: 185,
      },
    });

    await prisma.user.upsert({
      where: { email: "admin@fundatia-sperantei.ro" },
      update: { passwordHash },
      create: {
        email: "admin@fundatia-sperantei.ro",
        passwordHash,
        name: "Elena Marinescu",
        role: "NGO_ADMIN",
        ngoId: ngo2.id,
      },
    });
    log.push("Fundatia Sperantei + admin OK");

    // ─── Third NGO ────────────────────────────────────────────────
    const ngo3 = await prisma.ngo.upsert({
      where: { slug: "ong-verde" },
      update: {},
      create: {
        name: "ONG Verde",
        slug: "ong-verde",
        description: "Organizatie dedicata protectiei mediului.",
        shortDescription: "Protejam mediul si promovam sustenabilitatea",
        subscriptionPlan: "BASIC",
        subscriptionStatus: "active",
        category: "Mediu",
        rating: 4.2,
        ratingCount: 15,
        totalRaised: 18500,
        donorCountPublic: 73,
      },
    });

    await prisma.user.upsert({
      where: { email: "admin@ong-verde.ro" },
      update: { passwordHash },
      create: {
        email: "admin@ong-verde.ro",
        passwordHash,
        name: "Mihai Popa",
        role: "NGO_ADMIN",
        ngoId: ngo3.id,
      },
    });
    log.push("ONG Verde + admin OK");

    // ─── Additional NGOs ──────────────────────────────────────────
    const moreNgos = [
      { name: "Asociatia pentru Sanatate", slug: "asociatia-sanatate", category: "Sanatate", plan: "PRO" as const, rating: 4.7, totalRaised: 234500, donorCountPublic: 512, featured: true, email: "admin@asociatia-sanatate.ro", adminName: "Dr. Ana Ionescu" },
      { name: "Fundatia Cultura Vie", slug: "cultura-vie", category: "Cultura", plan: "ELITE" as const, rating: 4.9, totalRaised: 89300, donorCountPublic: 198, featured: true, email: "admin@cultura-vie.ro", adminName: "Alexandra Stanescu" },
      { name: "Sport pentru Toti", slug: "sport-pentru-toti", category: "Sport", plan: "PRO" as const, rating: 4.4, totalRaised: 45600, donorCountPublic: 134, featured: false, email: "admin@sport-toti.ro", adminName: "Vlad Munteanu" },
      { name: "Hrana pentru Suflet", slug: "hrana-suflet", category: "Social", plan: "PRO" as const, rating: 4.8, totalRaised: 312400, donorCountPublic: 743, featured: true, email: "admin@hrana-suflet.ro", adminName: "Gheorghe Dinu" },
      { name: "TechEdu Romania", slug: "techedu", category: "Educatie", plan: "PRO" as const, rating: 4.3, totalRaised: 28900, donorCountPublic: 95, featured: false, email: "admin@techedu.ro", adminName: "Radu Serban" },
    ];

    for (const nd of moreNgos) {
      const newNgo = await prisma.ngo.upsert({
        where: { slug: nd.slug },
        update: {},
        create: {
          name: nd.name,
          slug: nd.slug,
          subscriptionPlan: nd.plan,
          subscriptionStatus: "active",
          subscriptionStartAt: new Date(),
          subscriptionExpiresAt: new Date(Date.now() + 270 * 24 * 60 * 60 * 1000),
          category: nd.category,
          rating: nd.rating,
          totalRaised: nd.totalRaised,
          donorCountPublic: nd.donorCountPublic,
          isFeatured: nd.featured,
          boostUntil: nd.featured ? new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) : null,
        },
      });

      await prisma.user.upsert({
        where: { email: nd.email },
        update: { passwordHash },
        create: {
          email: nd.email,
          passwordHash,
          name: nd.adminName,
          role: "NGO_ADMIN",
          ngoId: newNgo.id,
        },
      });
    }
    log.push(`${moreNgos.length} NGOs aditionale OK`);

    // ─── Blog posts ───────────────────────────────────────────────
    await prisma.blogPost.upsert({
      where: { slug: "bine-ati-venit-pe-binevo" },
      update: {},
      create: {
        slug: "bine-ati-venit-pe-binevo",
        title: "Bine ati venit pe Binevo!",
        excerpt: "Descopera platforma completa de management pentru ONG-uri din Romania.",
        content: "<h2>Ce este Binevo?</h2><p>Platforma completa de CRM pentru ONG-uri.</p>",
        authorId: superAdmin.id,
        status: "PUBLISHED",
        category: "Noutati",
        tags: ["platforma", "lansare"],
        featured: true,
        publishedAt: new Date(),
      },
    });
    log.push("Blog posts OK");

    // Count results
    const [userCount, ngoCount] = await Promise.all([
      prisma.user.count(),
      prisma.ngo.count(),
    ]);

    return NextResponse.json({
      success: true,
      message: "Seed complet!",
      log,
      counts: { users: userCount, ngos: ngoCount },
      credentials: {
        superAdmin: { email: "superadmin@binevo.ro", password: "password123", panel: "/admin" },
        demoNgo: { email: "admin@demo-ngo.org", password: "password123", panel: "/dashboard", plan: "ELITE" },
        staff: { email: "staff@demo-ngo.org", password: "password123" },
      },
    });
  } catch (error: any) {
    console.error("[SEED API] Error:", error);
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack?.split("\n").slice(0, 5),
    }, { status: 500 });
  }
}

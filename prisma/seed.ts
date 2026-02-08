import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  const passwordHash = await hash("password123", 12);

  // ─── SUPER ADMIN ────────────────────────────────────────────────
  const superAdmin = await prisma.user.upsert({
    where: { email: "superadmin@ngohub.ro" },
    update: {},
    create: {
      email: "superadmin@ngohub.ro",
      passwordHash,
      name: "Super Administrator",
      role: "SUPER_ADMIN",
      ngoId: null, // Super Admin nu apartine unui ONG
    },
  });
  console.log("Super Admin creat:", superAdmin.email);

  // ─── Platform Settings ──────────────────────────────────────────
  await prisma.platformSettings.upsert({
    where: { id: "platform" },
    update: {},
    create: {
      id: "platform",
      siteName: "NGO HUB",
      siteDescription: "Platforma completa de CRM si campanii pentru ONG-uri din Romania",
      heroTitle: "Platforma completa pentru ONG-uri",
      heroSubtitle: "Gestioneaza donatorii, creeaza campanii inteligente si automatizeaza comunicarea cu ajutorul AI.",
      heroCtaText: "Incepe gratuit",
      primaryColor: "#6366f1",
      statsEnabled: true,
      contactEmail: "contact@ngohub.ro",
      footerText: "NGO HUB - Platforma de management pentru ONG-uri din Romania",
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
        {
          name: "Basic",
          price: "0",
          currency: "RON",
          interval: "luna",
          description: "Pentru ONG-uri mici care incep",
          features: ["100 donatori", "Mini-site", "GDPR tools de baza", "Vizualizare donatori"],
          highlighted: false,
        },
        {
          name: "Pro",
          price: "149",
          currency: "RON",
          interval: "luna",
          description: "Pentru ONG-uri in crestere",
          features: ["1.000 donatori", "Campanii email", "Generator AI", "Automatizari de baza", "Analitica", "Export CSV", "Suport prioritar"],
          highlighted: true,
        },
        {
          name: "Elite",
          price: "349",
          currency: "RON",
          interval: "luna",
          description: "Pentru ONG-uri profesionale",
          features: ["Donatori nelimitati", "Email + SMS", "Automatizari avansate", "A/B Testing", "Super Agent AI", "Optimizare AI", "Suport dedicat"],
          highlighted: false,
        },
      ] as any,
      socialLinks: {
        facebook: "https://facebook.com/ngohub",
        linkedin: "https://linkedin.com/company/ngohub",
        twitter: "https://twitter.com/ngohub",
      } as any,
    },
  });
  console.log("Setari platforma create");

  // ─── Demo NGO ───────────────────────────────────────────────────
  const ngo = await prisma.ngo.upsert({
    where: { slug: "demo-ngo" },
    update: {},
    create: {
      name: "Asociatia Demo ONG",
      slug: "demo-ngo",
      description: "O asociatie demonstrativa pentru testarea platformei NGO HUB. Ne dedicam sprijinirii comunitatilor defavorizate si promovarii educatiei in mediul rural.",
      shortDescription: "Sprijinim comunitatile defavorizate si promovam educatia",
      subscriptionPlan: "ELITE",
      senderEmail: "noreply@demo-ngo.org",
      senderName: "Asociatia Demo ONG",
      subscriptionStatus: "active",
      category: "Social",
      isFeatured: true,
      boostUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      rating: 4.8,
      ratingCount: 47,
      totalRaised: 125750,
      donorCountPublic: 342,
    },
  });

  // ─── NGO Admin ──────────────────────────────────────────────────
  await prisma.user.upsert({
    where: { email: "admin@demo-ngo.org" },
    update: {},
    create: {
      email: "admin@demo-ngo.org",
      passwordHash,
      name: "Admin Demo",
      role: "NGO_ADMIN",
      ngoId: ngo.id,
    },
  });

  // ─── Staff User ─────────────────────────────────────────────────
  await prisma.user.upsert({
    where: { email: "staff@demo-ngo.org" },
    update: {},
    create: {
      email: "staff@demo-ngo.org",
      passwordHash,
      name: "Staff Demo",
      role: "STAFF",
      ngoId: ngo.id,
    },
  });

  // ─── Viewer User ────────────────────────────────────────────────
  await prisma.user.upsert({
    where: { email: "viewer@demo-ngo.org" },
    update: {},
    create: {
      email: "viewer@demo-ngo.org",
      passwordHash,
      name: "Vizualizator Demo",
      role: "VIEWER",
      ngoId: ngo.id,
    },
  });

  // ─── NGO Verification ──────────────────────────────────────────
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
      aiAnalysis: {
        nameCheck: { valid: true, note: "Numele respecta formatul standard" },
        cuiCheck: { valid: true, note: "CUI valid" },
        legalFormCheck: { valid: true, note: "Forma juridica corecta" },
        completeness: { score: 95, missing: [] },
      } as any,
      aiFlags: [] as any,
      reviewedBy: superAdmin.id,
      reviewedAt: new Date(),
      reviewNotes: "Verificat si aprobat - toate documentele in ordine.",
    },
  });

  // ─── Second Demo NGO (pending verification) ────────────────────
  const ngo2 = await prisma.ngo.upsert({
    where: { slug: "fundatia-sperantei" },
    update: {},
    create: {
      name: "Fundatia Sperantei",
      slug: "fundatia-sperantei",
      description: "Fundatie dedicata sprijinirii copiilor defavorizati din mediul rural. Oferim burse scolare, rechizite si sprijin educational.",
      shortDescription: "Sprijinim copiii defavorizati din mediul rural",
      subscriptionPlan: "PRO",
      senderEmail: "contact@fundatia-sperantei.ro",
      senderName: "Fundatia Sperantei",
      subscriptionStatus: "active",
      category: "Educatie",
      rating: 4.5,
      ratingCount: 28,
      totalRaised: 67200,
      donorCountPublic: 185,
    },
  });

  await prisma.user.upsert({
    where: { email: "admin@fundatia-sperantei.ro" },
    update: {},
    create: {
      email: "admin@fundatia-sperantei.ro",
      passwordHash,
      name: "Elena Marinescu",
      role: "NGO_ADMIN",
      ngoId: ngo2.id,
    },
  });

  await prisma.ngoVerification.upsert({
    where: { ngoId: ngo2.id },
    update: {},
    create: {
      ngoId: ngo2.id,
      status: "PENDING",
      registrationNumber: "RO87654321",
      legalForm: "Fundatie",
      fiscalCode: "87654321",
      address: "Bd. Unirii nr. 10",
      county: "Cluj",
      city: "Cluj-Napoca",
      representativeName: "Elena Marinescu",
      representativeRole: "Director",
      registrationDate: new Date("2023-06-01"),
    },
  });

  // ─── Third Demo NGO (BASIC, no verification) ───────────────────
  const ngo3 = await prisma.ngo.upsert({
    where: { slug: "ong-verde" },
    update: {},
    create: {
      name: "ONG Verde",
      slug: "ong-verde",
      description: "Organizatie dedicata protectiei mediului si promovarii sustenabilitatii. Organizam actiuni de ecologizare si campanii de constientizare.",
      shortDescription: "Protejam mediul si promovam sustenabilitatea",
      subscriptionPlan: "BASIC",
      senderEmail: "contact@ong-verde.ro",
      senderName: "ONG Verde",
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
    update: {},
    create: {
      email: "admin@ong-verde.ro",
      passwordHash,
      name: "Mihai Popa",
      role: "NGO_ADMIN",
      ngoId: ngo3.id,
    },
  });

  // ─── Additional Demo NGOs ────────────────────────────────────
  const moreNgos = [
    {
      name: "Asociatia pentru Sanatate",
      slug: "asociatia-sanatate",
      description: "Oferim servicii medicale gratuite pentru persoanele defavorizate din Romania. Organizam caravane medicale si campanii de preventie.",
      shortDescription: "Servicii medicale gratuite pentru persoane defavorizate",
      category: "Sanatate",
      plan: "PRO" as const,
      rating: 4.7,
      ratingCount: 63,
      totalRaised: 234500,
      donorCountPublic: 512,
      featured: true,
      adminEmail: "admin@asociatia-sanatate.ro",
      adminName: "Dr. Ana Ionescu",
      verified: true,
    },
    {
      name: "Fundatia Cultura Vie",
      slug: "cultura-vie",
      description: "Promovam cultura si artele in comunitatile marginalizate. Organizam ateliere creative, spectacole si evenimente culturale.",
      shortDescription: "Cultura si arte in comunitatile marginalizate",
      category: "Cultura",
      plan: "ELITE" as const,
      rating: 4.9,
      ratingCount: 31,
      totalRaised: 89300,
      donorCountPublic: 198,
      featured: true,
      adminEmail: "admin@cultura-vie.ro",
      adminName: "Alexandra Stanescu",
      verified: true,
    },
    {
      name: "Sport pentru Toti",
      slug: "sport-pentru-toti",
      description: "Promovam sportul si miscarea in randul tinerilor din medii defavorizate. Oferim echipament sportiv si antrenamente gratuite.",
      shortDescription: "Sport si miscare pentru tineri defavorizati",
      category: "Sport",
      plan: "PRO" as const,
      rating: 4.4,
      ratingCount: 22,
      totalRaised: 45600,
      donorCountPublic: 134,
      featured: false,
      adminEmail: "admin@sport-toti.ro",
      adminName: "Vlad Munteanu",
      verified: true,
    },
    {
      name: "Drepturile Omului Romania",
      slug: "drepturi-om",
      description: "Militam pentru respectarea drepturilor fundamentale ale omului. Oferim asistenta juridica gratuita si campanii de advocacy.",
      shortDescription: "Asistenta juridica gratuita si advocacy",
      category: "Drepturile omului",
      plan: "ELITE" as const,
      rating: 4.6,
      ratingCount: 41,
      totalRaised: 156800,
      donorCountPublic: 287,
      featured: false,
      adminEmail: "admin@drepturi-om.ro",
      adminName: "Cristina Radu",
      verified: true,
    },
    {
      name: "Hrana pentru Suflet",
      slug: "hrana-suflet",
      description: "Distribuim pachete alimentare si mese calde pentru persoane fara adapost si familii in nevoie din Bucuresti.",
      shortDescription: "Pachete alimentare si mese calde pentru cei in nevoie",
      category: "Social",
      plan: "PRO" as const,
      rating: 4.8,
      ratingCount: 89,
      totalRaised: 312400,
      donorCountPublic: 743,
      featured: true,
      adminEmail: "admin@hrana-suflet.ro",
      adminName: "Gheorghe Dinu",
      verified: true,
    },
    {
      name: "TechEdu Romania",
      slug: "techedu",
      description: "Invatam copiii si tinerii programare si competente digitale. Organizam bootcamp-uri gratuite si mentorat in IT.",
      shortDescription: "Programare si competente digitale pentru tineri",
      category: "Educatie",
      plan: "PRO" as const,
      rating: 4.3,
      ratingCount: 19,
      totalRaised: 28900,
      donorCountPublic: 95,
      featured: false,
      adminEmail: "admin@techedu.ro",
      adminName: "Radu Serban",
      verified: false,
    },
  ];

  for (const ngoData of moreNgos) {
    const newNgo = await prisma.ngo.upsert({
      where: { slug: ngoData.slug },
      update: {},
      create: {
        name: ngoData.name,
        slug: ngoData.slug,
        description: ngoData.description,
        shortDescription: ngoData.shortDescription,
        subscriptionPlan: ngoData.plan,
        subscriptionStatus: "active",
        category: ngoData.category,
        rating: ngoData.rating,
        ratingCount: ngoData.ratingCount,
        totalRaised: ngoData.totalRaised,
        donorCountPublic: ngoData.donorCountPublic,
        isFeatured: ngoData.featured,
        boostUntil: ngoData.featured ? new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) : null,
      },
    });

    await prisma.user.upsert({
      where: { email: ngoData.adminEmail },
      update: {},
      create: {
        email: ngoData.adminEmail,
        passwordHash,
        name: ngoData.adminName,
        role: "NGO_ADMIN",
        ngoId: newNgo.id,
      },
    });

    if (ngoData.verified) {
      await prisma.ngoVerification.upsert({
        where: { ngoId: newNgo.id },
        update: {},
        create: {
          ngoId: newNgo.id,
          status: "APPROVED",
          registrationNumber: `RO${Math.floor(10000000 + Math.random() * 90000000)}`,
          legalForm: ngoData.name.startsWith("Fundatia") ? "Fundatie" : "Asociatie",
          reviewedBy: superAdmin.id,
          reviewedAt: new Date(),
          aiScore: 80 + Math.floor(Math.random() * 20),
        },
      });
    }
  }

  console.log(`${moreNgos.length} ONG-uri demo aditionale create`);

  // ─── Mini-site config ──────────────────────────────────────────
  await prisma.miniSiteConfig.upsert({
    where: { ngoId: ngo.id },
    update: {},
    create: {
      ngoId: ngo.id,
      heroTitle: "Ajuta-ne sa facem diferenta",
      heroDescription: "Fiecare donatie conteaza. Sustine misiunea noastra de a crea schimbare pozitiva in comunitate.",
      showNewsletter: true,
      showDonation: true,
    },
  });

  // ─── Consent texts ─────────────────────────────────────────────
  const consentTypes = [
    { type: "EMAIL_MARKETING" as const, text: "Sunt de acord sa primesc actualizari prin email despre impactul donatiei mele si activitatile ONG-ului" },
    { type: "SMS_MARKETING" as const, text: "Sunt de acord sa primesc notificari SMS despre campanii si apeluri urgente" },
    { type: "PRIVACY_POLICY" as const, text: "Sunt de acord cu Politica de Confidentialitate si consimt la prelucrarea datelor mele personale" },
    { type: "TERMS_OF_SERVICE" as const, text: "Accept Termenii si Conditiile" },
  ];

  for (const ct of consentTypes) {
    await prisma.consentText.upsert({
      where: { id: `seed-${ct.type}` },
      update: { text: ct.text },
      create: {
        id: `seed-${ct.type}`,
        ngoId: ngo.id,
        type: ct.type,
        text: ct.text,
      },
    });
  }

  // ─── Tags ──────────────────────────────────────────────────────
  const tags = [
    { name: "Recurent", color: "#22c55e" },
    { name: "VIP", color: "#eab308" },
    { name: "Corporate", color: "#3b82f6" },
    { name: "Prima donatie", color: "#8b5cf6" },
    { name: "Newsletter", color: "#06b6d4" },
  ];

  for (const tag of tags) {
    await prisma.donorTag.upsert({
      where: { ngoId_name: { ngoId: ngo.id, name: tag.name } },
      update: {},
      create: { ngoId: ngo.id, name: tag.name, color: tag.color },
    });
  }

  // ─── Sample donors ─────────────────────────────────────────────
  const donorData = [
    { name: "Maria Popescu", email: "maria@example.com", phone: "+40721000001" },
    { name: "Ion Ionescu", email: "ion@example.com", phone: "+40721000002" },
    { name: "Elena Vasilescu", email: "elena@example.com", phone: "+40721000003" },
    { name: "Andrei Georgescu", email: "andrei@example.com", phone: null },
    { name: "Ana Dumitrescu", email: "ana@example.com", phone: "+40721000005" },
  ];

  for (const d of donorData) {
    const donor = await prisma.donor.upsert({
      where: { ngoId_email: { ngoId: ngo.id, email: d.email } },
      update: {},
      create: {
        ngoId: ngo.id,
        name: d.name,
        email: d.email,
        phone: d.phone,
        emailConsent: true,
        smsConsent: d.phone !== null,
        privacyConsent: true,
        preferredChannel: d.phone ? "BOTH" : "EMAIL",
      },
    });

    const amounts = [50, 100, 150, 200, 250];
    const randomAmount = amounts[Math.floor(Math.random() * amounts.length)];
    await prisma.donation.create({
      data: {
        ngoId: ngo.id,
        donorId: donor.id,
        amount: randomAmount,
        currency: "RON",
        status: "COMPLETED",
        source: "seed",
      },
    });

    await prisma.donor.update({
      where: { id: donor.id },
      data: {
        totalDonated: randomAmount,
        donationCount: 1,
        lastDonationAt: new Date(),
      },
    });

    await prisma.consentRecord.create({
      data: {
        donorId: donor.id,
        type: "EMAIL_MARKETING",
        granted: true,
        source: "seed",
        ipAddress: "127.0.0.1",
      },
    });
    await prisma.consentRecord.create({
      data: {
        donorId: donor.id,
        type: "PRIVACY_POLICY",
        granted: true,
        source: "seed",
        ipAddress: "127.0.0.1",
      },
    });
  }

  // ─── Sample campaign ───────────────────────────────────────────
  await prisma.campaign.create({
    data: {
      ngoId: ngo.id,
      name: "Campanie de bun venit",
      type: "THANK_YOU",
      channel: "EMAIL",
      status: "DRAFT",
      subject: "Multumim pentru sprijinul tau!",
      emailBody: "<h1>Multumim!</h1><p>Donatia ta ne ajuta sa facem diferenta in comunitate.</p>",
    },
  });

  // ─── Sample automation ─────────────────────────────────────────
  await prisma.automation.create({
    data: {
      ngoId: ngo.id,
      name: "Multumire dupa donatie",
      description: "Trimite un email de multumire dupa fiecare donatie",
      trigger: "NEW_DONATION",
      isActive: true,
      steps: {
        create: [
          {
            order: 0,
            action: "SEND_EMAIL",
            config: { subject: "Multumim pentru donatia ta!", template: "thank_you" } as any,
            delayMinutes: 0,
          },
          {
            order: 1,
            action: "WAIT",
            config: {} as any,
            delayMinutes: 10080, // 7 zile
          },
          {
            order: 2,
            action: "SEND_EMAIL",
            config: { subject: "Vezi impactul donatiei tale", template: "impact_update" } as any,
            delayMinutes: 0,
          },
        ],
      },
    },
  });

  // ─── Sample blog posts ─────────────────────────────────────────
  await prisma.blogPost.upsert({
    where: { slug: "bine-ati-venit-pe-ngo-hub" },
    update: {},
    create: {
      slug: "bine-ati-venit-pe-ngo-hub",
      title: "Bine ati venit pe NGO HUB!",
      excerpt: "Descopera platforma completa de management pentru ONG-uri din Romania.",
      content: `<h2>Ce este NGO HUB?</h2>
<p>NGO HUB este platforma completa de CRM si comunicare pentru ONG-uri din Romania. Oferim instrumente profesionale de gestionare a donatorilor, campanii inteligente cu AI si automatizari avansate.</p>
<h2>De ce NGO HUB?</h2>
<ul>
<li>CRM complet cu criptare si GDPR</li>
<li>Campanii email si SMS cu generator AI</li>
<li>Automatizari de comunicare</li>
<li>Analitica detaliata</li>
<li>Mini-site personalizabil</li>
</ul>
<p>Inregistreaza-te gratuit si descopera puterea NGO HUB!</p>`,
      authorId: superAdmin.id,
      status: "PUBLISHED",
      category: "Noutati",
      tags: ["platforma", "lansare", "ong"],
      featured: true,
      publishedAt: new Date(),
    },
  });

  await prisma.blogPost.upsert({
    where: { slug: "ghid-strangere-fonduri" },
    update: {},
    create: {
      slug: "ghid-strangere-fonduri",
      title: "Ghid complet de strangere de fonduri online",
      excerpt: "Invata cele mai bune practici pentru strangerea de fonduri online pentru ONG-ul tau.",
      content: `<h2>Introducere</h2>
<p>Strangerea de fonduri online este esentiala pentru ONG-urile moderne. In acest ghid vom acoperi strategiile cheie pentru succes.</p>
<h2>1. Cunoaste-ti donatorii</h2>
<p>Foloseste CRM-ul NGO HUB pentru a segmenta si intelege baza ta de donatori.</p>
<h2>2. Personalizeaza comunicarea</h2>
<p>Fiecare donator este unic. Foloseste automatizarile pentru a trimite mesaje personalizate.</p>
<h2>3. Masoara si optimizeaza</h2>
<p>Analitica NGO HUB iti arata ce functioneaza si ce trebuie imbunatatit.</p>`,
      authorId: superAdmin.id,
      status: "PUBLISHED",
      category: "Ghiduri",
      tags: ["fundraising", "ghid", "strategie"],
      featured: false,
      publishedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    },
  });

  // ─── Sample notifications ──────────────────────────────────────
  await prisma.notification.create({
    data: {
      ngoId: ngo.id,
      type: "VERIFICATION_APPROVED",
      title: "Verificare aprobata",
      message: "Asociatia dumneavoastra a fost verificata si aprobata cu succes.",
      isRead: true,
      actionUrl: "/dashboard/settings",
    },
  });

  await prisma.notification.create({
    data: {
      ngoId: ngo2.id,
      type: "SYSTEM",
      title: "Bine ati venit pe NGO HUB!",
      message: "Va rugam sa completati procesul de verificare pentru a activa toate functiile platformei.",
      isRead: false,
      actionUrl: "/dashboard/settings",
    },
  });

  console.log("\n" + "=".repeat(50));
  console.log("SEEDING COMPLET!");
  console.log("=".repeat(50));
  console.log("\nConturi create:");
  console.log("─".repeat(50));
  console.log("SUPER ADMIN:");
  console.log("  Email:    superadmin@ngohub.ro");
  console.log("  Parola:   password123");
  console.log("  Panou:    /admin");
  console.log("─".repeat(50));
  console.log("NGO ADMIN (Demo ONG):");
  console.log("  Email:    admin@demo-ngo.org");
  console.log("  Parola:   password123");
  console.log("  Panou:    /dashboard");
  console.log("─".repeat(50));
  console.log("NGO ADMIN (Fundatia Sperantei):");
  console.log("  Email:    admin@fundatia-sperantei.ro");
  console.log("  Parola:   password123");
  console.log("─".repeat(50));
  console.log("NGO ADMIN (ONG Verde):");
  console.log("  Email:    admin@ong-verde.ro");
  console.log("  Parola:   password123");
  console.log("─".repeat(50));
  console.log("STAFF:      staff@demo-ngo.org / password123");
  console.log("VIEWER:     viewer@demo-ngo.org / password123");
  console.log("─".repeat(50));
  console.log("\nMini-site: /s/demo-ngo");
  console.log("Blog:      /blog");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

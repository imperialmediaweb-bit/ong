import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  const passwordHash = await hash("password123", 12);

  // ─── SUPER ADMIN ────────────────────────────────────────────────
  const superAdmin = await prisma.user.upsert({
    where: { email: "superadmin@binevo.ro" },
    update: { passwordHash },
    create: {
      email: "superadmin@binevo.ro",
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
        facebook: "https://facebook.com/binevo",
        linkedin: "https://linkedin.com/company/binevo",
        twitter: "https://twitter.com/binevo",
      } as any,
    },
  });
  console.log("Setari platforma create");

  // ─── Demo NGO (FULL - cont complet de test) ─────────────────────
  const ngo = await prisma.ngo.upsert({
    where: { slug: "demo-ngo" },
    update: {},
    create: {
      name: "Asociatia Demo ONG",
      slug: "demo-ngo",
      description: "O asociatie demonstrativa pentru testarea platformei Binevo. Ne dedicam sprijinirii comunitatilor defavorizate si promovarii educatiei in mediul rural. Organizam programe de sprijin comunitar, burse scolare si campanii de constientizare.",
      shortDescription: "Sprijinim comunitatile defavorizate si promovam educatia",
      subscriptionPlan: "ELITE",
      senderEmail: "noreply@demo-ngo.org",
      senderName: "Asociatia Demo ONG",
      subscriptionStatus: "active",
      subscriptionStartAt: new Date(),
      subscriptionExpiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
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
    update: { passwordHash, ngoId: ngo.id },
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
    update: { passwordHash, ngoId: ngo.id },
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
    update: { passwordHash, ngoId: ngo.id },
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
      subscriptionStartAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
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
      subscriptionStartAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
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
        subscriptionStartAt: new Date(Date.now() - Math.floor(Math.random() * 180) * 24 * 60 * 60 * 1000),
        subscriptionExpiresAt: new Date(Date.now() + (180 + Math.floor(Math.random() * 180)) * 24 * 60 * 60 * 1000),
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
      update: { passwordHash },
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

  // ─── Sample donors (15 donatori cu donatii multiple) ────────────
  const donorData = [
    { name: "Maria Popescu", email: "maria@example.com", phone: "+40721000001", notes: "Donator recurent fidel" },
    { name: "Ion Ionescu", email: "ion@example.com", phone: "+40721000002", notes: "Corporate - SC Ionescu SRL" },
    { name: "Elena Vasilescu", email: "elena@example.com", phone: "+40721000003", notes: null },
    { name: "Andrei Georgescu", email: "andrei@example.com", phone: null, notes: "Preferd comunicare doar email" },
    { name: "Ana Dumitrescu", email: "ana@example.com", phone: "+40721000005", notes: "VIP - donator major" },
    { name: "Mihai Stanescu", email: "mihai.s@example.com", phone: "+40721000006", notes: null },
    { name: "Cristina Radu", email: "cristina.r@example.com", phone: "+40721000007", notes: "Newsletter activ" },
    { name: "Alexandru Popa", email: "alex.p@example.com", phone: null, notes: null },
    { name: "Ioana Marinescu", email: "ioana.m@example.com", phone: "+40721000009", notes: "Prima donatie online" },
    { name: "George Dinu", email: "george.d@example.com", phone: "+40721000010", notes: "Corporate - Dinu Consulting" },
    { name: "Simona Florescu", email: "simona.f@example.com", phone: "+40721000011", notes: null },
    { name: "Radu Barbu", email: "radu.b@example.com", phone: null, notes: "Student voluntar" },
    { name: "Laura Niculescu", email: "laura.n@example.com", phone: "+40721000013", notes: "Donatie lunara" },
    { name: "Stefan Preda", email: "stefan.p@example.com", phone: "+40721000014", notes: null },
    { name: "Diana Tomescu", email: "diana.t@example.com", phone: "+40721000015", notes: "Recomandata de Maria Popescu" },
  ];

  const tagRecords = await prisma.donorTag.findMany({ where: { ngoId: ngo.id } });
  const tagMap: Record<string, string> = {};
  tagRecords.forEach(t => { tagMap[t.name] = t.id; });

  for (let i = 0; i < donorData.length; i++) {
    const d = donorData[i];
    const donor = await prisma.donor.upsert({
      where: { ngoId_email: { ngoId: ngo.id, email: d.email } },
      update: {},
      create: {
        ngoId: ngo.id,
        name: d.name,
        email: d.email,
        phone: d.phone,
        notes: d.notes,
        emailConsent: true,
        smsConsent: d.phone !== null,
        privacyConsent: true,
        preferredChannel: d.phone ? "BOTH" : "EMAIL",
      },
    });

    // Create 1-4 donations per donor with varying dates
    const donationCount = 1 + Math.floor(Math.random() * 4);
    const amounts = [25, 50, 75, 100, 150, 200, 250, 500, 1000];
    let totalDonated = 0;

    for (let j = 0; j < donationCount; j++) {
      const amount = amounts[Math.floor(Math.random() * amounts.length)];
      totalDonated += amount;
      const daysAgo = Math.floor(Math.random() * 365);
      await prisma.donation.create({
        data: {
          ngoId: ngo.id,
          donorId: donor.id,
          amount,
          currency: "RON",
          status: "COMPLETED",
          source: j === 0 ? "minisite" : "manual",
          isRecurring: donationCount > 2 && j > 0,
          createdAt: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000),
        },
      });
    }

    await prisma.donor.update({
      where: { id: donor.id },
      data: {
        totalDonated,
        donationCount,
        lastDonationAt: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000),
      },
    });

    // Assign tags
    const tagNames = Object.keys(tagMap);
    if (i < 3 && tagMap["Recurent"]) {
      await prisma.donorTagAssignment.create({
        data: { donorId: donor.id, tagId: tagMap["Recurent"] },
      }).catch(() => {});
    }
    if (i === 4 && tagMap["VIP"]) {
      await prisma.donorTagAssignment.create({
        data: { donorId: donor.id, tagId: tagMap["VIP"] },
      }).catch(() => {});
    }
    if ((i === 1 || i === 9) && tagMap["Corporate"]) {
      await prisma.donorTagAssignment.create({
        data: { donorId: donor.id, tagId: tagMap["Corporate"] },
      }).catch(() => {});
    }
    if (i === 8 && tagMap["Prima donatie"]) {
      await prisma.donorTagAssignment.create({
        data: { donorId: donor.id, tagId: tagMap["Prima donatie"] },
      }).catch(() => {});
    }
    if (i % 3 === 0 && tagMap["Newsletter"]) {
      await prisma.donorTagAssignment.create({
        data: { donorId: donor.id, tagId: tagMap["Newsletter"] },
      }).catch(() => {});
    }

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

  console.log("15 donatori cu donatii multiple creati");

  // ─── Sample campaigns (multiple) ──────────────────────────────
  await prisma.campaign.create({
    data: {
      ngoId: ngo.id,
      name: "Campanie de bun venit",
      type: "THANK_YOU",
      channel: "EMAIL",
      status: "SENT",
      subject: "Multumim pentru sprijinul tau!",
      emailBody: "<h1>Multumim!</h1><p>Donatia ta ne ajuta sa facem diferenta in comunitate.</p>",
      totalSent: 12,
      totalDelivered: 11,
      totalOpened: 8,
      totalClicked: 3,
      sentAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.campaign.create({
    data: {
      ngoId: ngo.id,
      name: "Newsletter Ianuarie 2026",
      type: "NEWSLETTER",
      channel: "EMAIL",
      status: "SENT",
      subject: "Ce am realizat impreuna in 2025",
      emailBody: "<h1>Retrospectiva 2025</h1><p>Multumim tuturor donatorilor nostri pentru un an extraordinar!</p><p>Impreuna am reusit sa ajutam 500 de familii.</p>",
      totalSent: 45,
      totalDelivered: 42,
      totalOpened: 28,
      totalClicked: 12,
      sentAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.campaign.create({
    data: {
      ngoId: ngo.id,
      name: "Apel urgent - Iarna 2026",
      type: "EMERGENCY_APPEAL",
      channel: "BOTH",
      status: "SENT",
      subject: "Ajutor urgent pentru familiile afectate de ger",
      emailBody: "<h1>Apel Urgent</h1><p>Zeci de familii au nevoie de ajutor. Cu doar 50 RON putem oferi un pachet de iarna.</p>",
      smsBody: "URGENT: Familii au nevoie de ajutor! Doneaza 50 RON pentru un pachet de iarna. https://binevo.ro/donate/demo-ngo",
      goalAmount: 25000,
      currentAmount: 18750,
      totalSent: 120,
      totalDelivered: 115,
      totalOpened: 89,
      totalClicked: 45,
      sentAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.campaign.create({
    data: {
      ngoId: ngo.id,
      name: "Campanie reactivare donatori",
      type: "REACTIVATION",
      channel: "EMAIL",
      status: "DRAFT",
      subject: "Ne este dor de tine! Revino si ajuta-ne",
      emailBody: "<h1>Ne lipsesti!</h1><p>A trecut ceva timp de la ultima donatie. Situatia comunitatilor noastre necesita in continuare sprijin.</p>",
      recipientCount: 8,
    },
  });

  await prisma.campaign.create({
    data: {
      ngoId: ngo.id,
      name: "Parteneriat Corporate Q1 2026",
      type: "CORPORATE_OUTREACH",
      channel: "EMAIL",
      status: "SCHEDULED",
      subject: "Propunere de parteneriat CSR - Asociatia Demo ONG",
      emailBody: "<h1>Propunere de Parteneriat</h1><p>Va invitam sa va alaturati programului nostru de responsabilitate sociala.</p>",
      scheduledAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      recipientCount: 15,
    },
  });

  console.log("5 campanii create");

  // ─── Sample automations ─────────────────────────────────────────
  await prisma.automation.create({
    data: {
      ngoId: ngo.id,
      name: "Multumire dupa donatie",
      description: "Trimite un email de multumire dupa fiecare donatie, urmat de un update de impact dupa 7 zile",
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
            action: "ADD_TAG",
            config: { tagName: "Prima donatie" } as any,
            delayMinutes: 0,
          },
          {
            order: 2,
            action: "WAIT",
            config: {} as any,
            delayMinutes: 10080, // 7 zile
          },
          {
            order: 3,
            action: "SEND_EMAIL",
            config: { subject: "Vezi impactul donatiei tale", template: "impact_update" } as any,
            delayMinutes: 0,
          },
        ],
      },
    },
  });

  await prisma.automation.create({
    data: {
      ngoId: ngo.id,
      name: "Reactivare donatori inactivi",
      description: "Trimite remindere donatorilor care nu au mai donat de 90+ zile",
      trigger: "NO_DONATION_PERIOD",
      triggerConfig: { daysInactive: 90 } as any,
      isActive: true,
      steps: {
        create: [
          {
            order: 0,
            action: "SEND_EMAIL",
            config: { subject: "Ne este dor de tine!", template: "reactivation" } as any,
            delayMinutes: 0,
          },
          {
            order: 1,
            action: "WAIT",
            config: {} as any,
            delayMinutes: 20160, // 14 zile
          },
          {
            order: 2,
            action: "SEND_SMS",
            config: { message: "Salut! Comunitatile noastre inca au nevoie de tine. Doneaza acum!" } as any,
            delayMinutes: 0,
          },
        ],
      },
    },
  });

  await prisma.automation.create({
    data: {
      ngoId: ngo.id,
      name: "Bun venit subscriber nou",
      description: "Secventa de onboarding pentru subscriberi noi de pe mini-site",
      trigger: "NEW_SUBSCRIBER",
      isActive: true,
      steps: {
        create: [
          {
            order: 0,
            action: "SEND_EMAIL",
            config: { subject: "Bine ai venit in comunitatea noastra!", template: "welcome" } as any,
            delayMinutes: 0,
          },
          {
            order: 1,
            action: "ADD_TAG",
            config: { tagName: "Newsletter" } as any,
            delayMinutes: 0,
          },
          {
            order: 2,
            action: "WAIT",
            config: {} as any,
            delayMinutes: 4320, // 3 zile
          },
          {
            order: 3,
            action: "SEND_EMAIL",
            config: { subject: "Descopera cum poti face diferenta", template: "onboarding_2" } as any,
            delayMinutes: 0,
          },
        ],
      },
    },
  });

  console.log("3 automatizari create");

  // ─── Sample blog posts ─────────────────────────────────────────
  await prisma.blogPost.upsert({
    where: { slug: "bine-ati-venit-pe-binevo" },
    update: {},
    create: {
      slug: "bine-ati-venit-pe-binevo",
      title: "Bine ati venit pe Binevo!",
      excerpt: "Descopera platforma completa de management pentru ONG-uri din Romania.",
      content: `<h2>Ce este Binevo?</h2>
<p>Binevo este platforma completa de CRM si comunicare pentru ONG-uri din Romania. Oferim instrumente profesionale de gestionare a donatorilor, campanii inteligente cu AI si automatizari avansate.</p>
<h2>De ce Binevo?</h2>
<ul>
<li>CRM complet cu criptare si GDPR</li>
<li>Campanii email si SMS cu generator AI</li>
<li>Automatizari de comunicare</li>
<li>Analitica detaliata</li>
<li>Mini-site personalizabil</li>
</ul>
<p>Inregistreaza-te gratuit si descopera puterea Binevo!</p>`,
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
<p>Foloseste CRM-ul Binevo pentru a segmenta si intelege baza ta de donatori.</p>
<h2>2. Personalizeaza comunicarea</h2>
<p>Fiecare donator este unic. Foloseste automatizarile pentru a trimite mesaje personalizate.</p>
<h2>3. Masoara si optimizeaza</h2>
<p>Analitica Binevo iti arata ce functioneaza si ce trebuie imbunatatit.</p>`,
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
      ngoId: ngo.id,
      type: "SUBSCRIPTION_UPGRADED",
      title: "Abonament ELITE activat",
      message: "Planul ELITE a fost activat cu succes. Aveti acces la toate functiile platformei.",
      isRead: true,
      actionUrl: "/dashboard/settings",
    },
  });

  await prisma.notification.create({
    data: {
      ngoId: ngo.id,
      type: "DONATION_RECEIVED",
      title: "Donatie noua primita",
      message: "Ati primit o donatie de 500 RON de la un donator nou prin mini-site.",
      isRead: false,
      actionUrl: "/dashboard/donations",
    },
  });

  await prisma.notification.create({
    data: {
      ngoId: ngo.id,
      type: "CAMPAIGN_COMPLETED",
      title: "Campanie finalizata",
      message: "Campania 'Apel urgent - Iarna 2026' a fost trimisa cu succes la 120 de destinatari.",
      isRead: false,
      actionUrl: "/dashboard/campaigns",
    },
  });

  await prisma.notification.create({
    data: {
      ngoId: ngo2.id,
      type: "SYSTEM",
      title: "Bine ati venit pe Binevo!",
      message: "Va rugam sa completati procesul de verificare pentru a activa toate functiile platformei.",
      isRead: false,
      actionUrl: "/dashboard/settings",
    },
  });

  console.log("\n" + "=".repeat(60));
  console.log("SEEDING COMPLET!");
  console.log("=".repeat(60));
  console.log("\nConturi create:");
  console.log("─".repeat(60));
  console.log("SUPER ADMIN:");
  console.log("  Email:    superadmin@binevo.ro");
  console.log("  Parola:   password123");
  console.log("  Panou:    /admin");
  console.log("─".repeat(60));
  console.log("NGO ADMIN - CONT COMPLET DEMO (ELITE):");
  console.log("  Email:    admin@demo-ngo.org");
  console.log("  Parola:   password123");
  console.log("  Panou:    /dashboard");
  console.log("  Plan:     ELITE (expira peste 365 zile)");
  console.log("  Donatori: 15 | Donatii: multiple | Campanii: 5");
  console.log("  Automatizari: 3 | Tags: 5 | Verificare: Aprobat");
  console.log("─".repeat(60));
  console.log("NGO ADMIN (Fundatia Sperantei - PRO):");
  console.log("  Email:    admin@fundatia-sperantei.ro");
  console.log("  Parola:   password123");
  console.log("─".repeat(60));
  console.log("NGO ADMIN (ONG Verde - BASIC):");
  console.log("  Email:    admin@ong-verde.ro");
  console.log("  Parola:   password123");
  console.log("─".repeat(60));
  console.log("STAFF:      staff@demo-ngo.org / password123");
  console.log("VIEWER:     viewer@demo-ngo.org / password123");
  console.log("─".repeat(60));
  console.log("\n9 ONG-uri demo + 15 donatori + 5 campanii + 3 automatizari");
  console.log("Mini-site: /s/demo-ngo");
  console.log("Blog:      /blog");
  console.log("Donatii:   /donate/demo-ngo");
  console.log("Directorul ONG: /ong");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

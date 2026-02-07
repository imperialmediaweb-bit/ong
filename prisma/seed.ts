import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Create demo NGO
  const ngo = await prisma.ngo.upsert({
    where: { slug: "demo-ngo" },
    update: {},
    create: {
      name: "Demo NGO",
      slug: "demo-ngo",
      description: "A demonstration NGO for testing the platform",
      subscriptionPlan: "ELITE",
      senderEmail: "noreply@demo-ngo.org",
      senderName: "Demo NGO",
    },
  });

  // Create admin user
  const passwordHash = await hash("password123", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@demo-ngo.org" },
    update: {},
    create: {
      email: "admin@demo-ngo.org",
      passwordHash,
      name: "Admin User",
      role: "NGO_ADMIN",
      ngoId: ngo.id,
    },
  });

  // Create staff user
  await prisma.user.upsert({
    where: { email: "staff@demo-ngo.org" },
    update: {},
    create: {
      email: "staff@demo-ngo.org",
      passwordHash,
      name: "Staff User",
      role: "STAFF",
      ngoId: ngo.id,
    },
  });

  // Create mini-site config
  await prisma.miniSiteConfig.upsert({
    where: { ngoId: ngo.id },
    update: {},
    create: {
      ngoId: ngo.id,
      heroTitle: "Help us make a difference",
      heroDescription: "Every donation counts. Support our mission to create positive change in our community.",
      showNewsletter: true,
      showDonation: true,
    },
  });

  // Create consent texts
  const consentTypes = [
    { type: "EMAIL_MARKETING" as const, text: "I agree to receive email updates about the impact of my donation and NGO activities" },
    { type: "SMS_MARKETING" as const, text: "I agree to receive SMS notifications about campaigns and urgent appeals" },
    { type: "PRIVACY_POLICY" as const, text: "I agree to the Privacy Policy and consent to the processing of my personal data" },
    { type: "TERMS_OF_SERVICE" as const, text: "I accept the Terms of Service" },
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

  // Create tags
  const tags = [
    { name: "Recurrent", color: "#22c55e" },
    { name: "VIP", color: "#eab308" },
    { name: "Corporate", color: "#3b82f6" },
    { name: "First-time", color: "#8b5cf6" },
    { name: "Newsletter", color: "#06b6d4" },
  ];

  for (const tag of tags) {
    await prisma.donorTag.upsert({
      where: { ngoId_name: { ngoId: ngo.id, name: tag.name } },
      update: {},
      create: { ngoId: ngo.id, name: tag.name, color: tag.color },
    });
  }

  // Create sample donors
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

    // Create donations for each donor
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

    // Update donor stats
    await prisma.donor.update({
      where: { id: donor.id },
      data: {
        totalDonated: randomAmount,
        donationCount: 1,
        lastDonationAt: new Date(),
      },
    });

    // Create consent records
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

  // Create sample campaign
  await prisma.campaign.create({
    data: {
      ngoId: ngo.id,
      name: "Welcome Campaign",
      type: "THANK_YOU",
      channel: "EMAIL",
      status: "DRAFT",
      subject: "Thank you for your support!",
      emailBody: "<h1>Thank you!</h1><p>Your donation helps us make a difference.</p>",
    },
  });

  // Create sample automation
  await prisma.automation.create({
    data: {
      ngoId: ngo.id,
      name: "Post-Donation Thank You",
      description: "Send a thank you email after each donation",
      trigger: "NEW_DONATION",
      isActive: true,
      steps: {
        create: [
          {
            order: 0,
            action: "SEND_EMAIL",
            config: { subject: "Thank you for your donation!", template: "thank_you" },
            delayMinutes: 0,
          },
          {
            order: 1,
            action: "WAIT",
            config: {},
            delayMinutes: 10080, // 7 days
          },
          {
            order: 2,
            action: "SEND_EMAIL",
            config: { subject: "See the impact of your donation", template: "impact_update" },
            delayMinutes: 0,
          },
        ],
      },
    },
  });

  console.log("Seeding complete!");
  console.log(`\nDemo credentials:\n  Email: admin@demo-ngo.org\n  Password: password123`);
  console.log(`\nMini-site URL: /s/demo-ngo`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

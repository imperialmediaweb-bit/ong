import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Neautorizat" }, { status: 403 });
  }

  try {
    let settings = await prisma.platformSettings.findUnique({
      where: { id: "platform" },
    });

    // Creeaza setarile implicite daca nu exista
    if (!settings) {
      settings = await prisma.platformSettings.create({
        data: {
          id: "platform",
          siteName: "NGO HUB",
          siteDescription: "Platforma de management pentru organizatii non-profit",
          primaryColor: "#6366f1",
          heroTitle: "Digitalizeaza-ti ONG-ul",
          heroSubtitle: "Platforma completa pentru gestionarea donatorilor, campaniilor si comunicarii",
          heroCtaText: "Incepe gratuit",
          statsEnabled: true,
          featuresJson: {
            features: [
              {
                title: "CRM Donatori",
                description: "Gestioneaza relatiile cu donatorii intr-un singur loc",
                icon: "users",
              },
              {
                title: "Campanii Email & SMS",
                description: "Trimite campanii personalizate catre donatori",
                icon: "mail",
              },
              {
                title: "Automatizari AI",
                description: "Automatizeaza comunicarea cu ajutorul inteligentei artificiale",
                icon: "bot",
              },
            ],
          } as any,
          plansJson: {
            plans: [
              { name: "BASIC", price: 0, label: "Gratuit" },
              { name: "PRO", price: 99, label: "Profesional" },
              { name: "ELITE", price: 249, label: "Enterprise" },
            ],
          } as any,
          footerText: "NGO HUB - Platforma pentru ONG-uri din Romania",
          socialLinks: {} as any,
        },
      });
    }

    return NextResponse.json(settings);
  } catch (error: any) {
    console.error("Eroare la incarcarea setarilor platformei:", error);
    return NextResponse.json(
      { error: "Eroare la incarcarea setarilor platformei" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Neautorizat" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const allowedFields = [
      "siteName",
      "siteDescription",
      "logoUrl",
      "primaryColor",
      "heroTitle",
      "heroSubtitle",
      "heroCtaText",
      "statsEnabled",
      "featuresJson",
      "plansJson",
      "footerText",
      "contactEmail",
      "socialLinks",
    ];

    const data: any = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        if (["featuresJson", "plansJson", "socialLinks"].includes(field)) {
          data[field] = body[field] as any;
        } else {
          data[field] = body[field];
        }
      }
    }

    const settings = await prisma.platformSettings.upsert({
      where: { id: "platform" },
      create: {
        id: "platform",
        ...data,
      },
      update: data,
    });

    return NextResponse.json({
      settings,
      message: "Setarile platformei au fost actualizate cu succes",
    });
  } catch (error: any) {
    console.error("Eroare la actualizarea setarilor platformei:", error);
    return NextResponse.json(
      { error: "Eroare la actualizarea setarilor platformei" },
      { status: 500 }
    );
  }
}

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

// GET - List all system templates (email + SMS)
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Neautorizat" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type"); // "email" | "sms" | null (all)
    const category = searchParams.get("category");

    const [emailTemplates, smsTemplates] = await Promise.all([
      !type || type === "email"
        ? prisma.emailTemplate.findMany({
            where: {
              isSystem: true,
              ...(category ? { category } : {}),
            },
            orderBy: { updatedAt: "desc" },
          })
        : Promise.resolve([]),
      !type || type === "sms"
        ? prisma.smsTemplate.findMany({
            where: {
              isSystem: true,
              ...(category ? { category } : {}),
            },
            orderBy: { updatedAt: "desc" },
          })
        : Promise.resolve([]),
    ]);

    return NextResponse.json({
      emailTemplates,
      smsTemplates,
      total: emailTemplates.length + smsTemplates.length,
    });
  } catch (error: any) {
    console.error("Error loading templates:", error);
    return NextResponse.json({ error: "Eroare la incarcarea template-urilor" }, { status: 500 });
  }
}

// POST - Create a new system template
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Neautorizat" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { type, name, category, subject, htmlBody, body: smsBody } = body;

    if (!name || !category) {
      return NextResponse.json({ error: "Numele si categoria sunt obligatorii" }, { status: 400 });
    }

    if (type === "email") {
      if (!subject || !htmlBody) {
        return NextResponse.json({ error: "Subject si htmlBody sunt obligatorii pentru email" }, { status: 400 });
      }
      const template = await prisma.emailTemplate.create({
        data: {
          name,
          category,
          subject,
          htmlBody,
          isSystem: true,
        },
      });
      return NextResponse.json(template, { status: 201 });
    } else if (type === "sms") {
      if (!smsBody) {
        return NextResponse.json({ error: "Body este obligatoriu pentru SMS" }, { status: 400 });
      }
      const template = await prisma.smsTemplate.create({
        data: {
          name,
          category,
          body: smsBody,
          isSystem: true,
        },
      });
      return NextResponse.json(template, { status: 201 });
    } else {
      return NextResponse.json({ error: "Tipul trebuie sa fie 'email' sau 'sms'" }, { status: 400 });
    }
  } catch (error: any) {
    console.error("Error creating template:", error);
    return NextResponse.json({ error: "Eroare la crearea template-ului" }, { status: 500 });
  }
}

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

// GET - Get single template
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Neautorizat" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "email";

    if (type === "sms") {
      const template = await prisma.smsTemplate.findUnique({
        where: { id: params.id },
      });
      if (!template) {
        return NextResponse.json({ error: "Template negasit" }, { status: 404 });
      }
      return NextResponse.json({ ...template, type: "sms" });
    }

    const template = await prisma.emailTemplate.findUnique({
      where: { id: params.id },
    });
    if (!template) {
      return NextResponse.json({ error: "Template negasit" }, { status: 404 });
    }
    return NextResponse.json({ ...template, type: "email" });
  } catch (error: any) {
    console.error("Error loading template:", error);
    return NextResponse.json({ error: "Eroare la incarcarea template-ului" }, { status: 500 });
  }
}

// PATCH - Update template
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Neautorizat" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { type, name, category, subject, htmlBody, body: smsBody } = body;

    if (type === "sms") {
      const template = await prisma.smsTemplate.update({
        where: { id: params.id },
        data: {
          ...(name !== undefined ? { name } : {}),
          ...(category !== undefined ? { category } : {}),
          ...(smsBody !== undefined ? { body: smsBody } : {}),
        },
      });
      return NextResponse.json(template);
    }

    const template = await prisma.emailTemplate.update({
      where: { id: params.id },
      data: {
        ...(name !== undefined ? { name } : {}),
        ...(category !== undefined ? { category } : {}),
        ...(subject !== undefined ? { subject } : {}),
        ...(htmlBody !== undefined ? { htmlBody } : {}),
      },
    });
    return NextResponse.json(template);
  } catch (error: any) {
    console.error("Error updating template:", error);
    if (error.code === "P2025") {
      return NextResponse.json({ error: "Template negasit" }, { status: 404 });
    }
    return NextResponse.json({ error: "Eroare la actualizarea template-ului" }, { status: 500 });
  }
}

// DELETE - Delete template
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Neautorizat" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "email";

    if (type === "sms") {
      await prisma.smsTemplate.delete({ where: { id: params.id } });
    } else {
      await prisma.emailTemplate.delete({ where: { id: params.id } });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting template:", error);
    if (error.code === "P2025") {
      return NextResponse.json({ error: "Template negasit" }, { status: 404 });
    }
    return NextResponse.json({ error: "Eroare la stergerea template-ului" }, { status: 500 });
  }
}

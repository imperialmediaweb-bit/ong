import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { CREDIT_PACKAGES } from "@/lib/campaign-templates";

// GET - get credit balance and packages
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Neautorizat" }, { status: 401 });
  }

  const ngoId = (session.user as any).ngoId;
  if (!ngoId) {
    return NextResponse.json({ error: "Fara ONG asociat" }, { status: 403 });
  }

  try {
    const ngo = await prisma.ngo.findUnique({
      where: { id: ngoId },
      select: { emailCredits: true, smsCredits: true },
    });

    const recentTransactions = await prisma.creditTransaction.findMany({
      where: { ngoId },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    return NextResponse.json({
      emailCredits: ngo?.emailCredits ?? 0,
      smsCredits: ngo?.smsCredits ?? 0,
      packages: CREDIT_PACKAGES,
      transactions: recentTransactions,
    });
  } catch (error: any) {
    console.error("Error fetching credits:", error);
    return NextResponse.json({ error: "Eroare la incarcarea creditelor" }, { status: 500 });
  }
}

// POST - purchase credit package (simulate - in production would use Stripe)
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Neautorizat" }, { status: 401 });
  }

  const ngoId = (session.user as any).ngoId;
  if (!ngoId) {
    return NextResponse.json({ error: "Fara ONG asociat" }, { status: 403 });
  }

  try {
    const { packageId } = await request.json();
    const pkg = CREDIT_PACKAGES.find((p) => p.id === packageId);
    if (!pkg) {
      return NextResponse.json({ error: "Pachet invalid" }, { status: 400 });
    }

    // Get current balance
    const ngo = await prisma.ngo.findUnique({
      where: { id: ngoId },
      select: { emailCredits: true, smsCredits: true },
    });

    const currentEmail = ngo?.emailCredits ?? 0;
    const currentSms = ngo?.smsCredits ?? 0;

    // Update credits
    const updatedNgo = await prisma.ngo.update({
      where: { id: ngoId },
      data: {
        emailCredits: currentEmail + pkg.emailCredits,
        smsCredits: currentSms + pkg.smsCredits,
      },
    });

    // Log transactions
    const transactions = [];
    if (pkg.emailCredits > 0) {
      transactions.push(
        prisma.creditTransaction.create({
          data: {
            ngoId,
            type: "PURCHASE",
            channel: "EMAIL",
            amount: pkg.emailCredits,
            balance: updatedNgo.emailCredits,
            description: `Pachet: ${pkg.name} (${pkg.emailCredits} emailuri)`,
          },
        })
      );
    }
    if (pkg.smsCredits > 0) {
      transactions.push(
        prisma.creditTransaction.create({
          data: {
            ngoId,
            type: "PURCHASE",
            channel: "SMS",
            amount: pkg.smsCredits,
            balance: updatedNgo.smsCredits,
            description: `Pachet: ${pkg.name} (${pkg.smsCredits} SMS-uri)`,
          },
        })
      );
    }

    await Promise.all(transactions);

    return NextResponse.json({
      message: "Credite adaugate cu succes!",
      emailCredits: updatedNgo.emailCredits,
      smsCredits: updatedNgo.smsCredits,
    });
  } catch (error: any) {
    console.error("Error purchasing credits:", error);
    return NextResponse.json({ error: "Eroare la achizitionarea creditelor" }, { status: 500 });
  }
}

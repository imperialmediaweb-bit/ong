import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";

// GET - List manual donation pledges for the NGO
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Neautorizat" }, { status: 401 });
    }

    const ngoId = (session.user as any).ngoId;
    if (!ngoId) {
      return NextResponse.json({ error: "ONG-ul nu este asociat" }, { status: 403 });
    }

    const status = req.nextUrl.searchParams.get("status") || undefined;

    const pledges = await prisma.manualDonationPledge.findMany({
      where: {
        ngoId,
        ...(status ? { status: status as any } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    const counts = await prisma.manualDonationPledge.groupBy({
      by: ["status"],
      where: { ngoId },
      _count: true,
    });

    return NextResponse.json({
      pledges,
      counts: {
        pending: counts.find((c) => c.status === "PENDING")?._count || 0,
        verified: counts.find((c) => c.status === "VERIFIED")?._count || 0,
        rejected: counts.find((c) => c.status === "REJECTED")?._count || 0,
      },
    });
  } catch (error: any) {
    console.error("Pledges GET error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT - Verify or reject a pledge
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Neautorizat" }, { status: 401 });
    }

    const ngoId = (session.user as any).ngoId;
    const userId = (session.user as any).id;
    const role = (session.user as any).role;

    if (!ngoId || (role !== "NGO_ADMIN" && role !== "SUPER_ADMIN")) {
      return NextResponse.json(
        { error: "Doar administratorul poate verifica pledgeuri" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { pledgeId, action, adminNotes, amount } = body;

    if (!pledgeId || !["verify", "reject"].includes(action)) {
      return NextResponse.json(
        { error: "pledgeId si action (verify/reject) sunt obligatorii" },
        { status: 400 }
      );
    }

    const pledge = await prisma.manualDonationPledge.findFirst({
      where: { id: pledgeId, ngoId },
    });

    if (!pledge) {
      return NextResponse.json({ error: "Pledge-ul nu a fost gasit" }, { status: 404 });
    }

    if (pledge.status !== "PENDING") {
      return NextResponse.json(
        { error: "Pledge-ul a fost deja procesat" },
        { status: 400 }
      );
    }

    if (action === "verify") {
      const donationAmount = amount || pledge.amount;
      if (!donationAmount || donationAmount <= 0) {
        return NextResponse.json(
          { error: "Suma donatiei este obligatorie pentru verificare" },
          { status: 400 }
        );
      }

      // Create donation record
      let donorId: string | null = null;

      if (pledge.donorEmail) {
        let donor = await prisma.donor.findFirst({
          where: { ngoId, email: pledge.donorEmail },
        });

        if (!donor) {
          donor = await prisma.donor.create({
            data: {
              ngoId,
              email: pledge.donorEmail,
              name: pledge.donorName || null,
              phone: pledge.donorPhone || null,
              privacyConsent: true,
            },
          });
        }
        donorId = donor.id;
      }

      const donation = await prisma.donation.create({
        data: {
          ngoId,
          donorId,
          amount: donationAmount,
          currency: pledge.currency,
          status: "COMPLETED",
          source: "manual_pledge",
          paymentProvider: pledge.paymentMethod,
          metadata: {
            pledgeId: pledge.id,
            referenceCode: pledge.referenceCode,
            donorName: pledge.donorName,
            donorEmail: pledge.donorEmail,
            verifiedBy: userId,
          } as any,
        },
      });

      // Update donor stats
      if (donorId) {
        await prisma.donor.update({
          where: { id: donorId },
          data: {
            totalDonated: { increment: donationAmount },
            donationCount: { increment: 1 },
            lastDonationAt: new Date(),
          },
        });
      }

      // Update NGO stats
      await prisma.ngo.update({
        where: { id: ngoId },
        data: {
          totalRaised: { increment: donationAmount },
          donorCountPublic: { increment: 1 },
        },
      });

      // Update pledge
      await prisma.manualDonationPledge.update({
        where: { id: pledgeId },
        data: {
          status: "VERIFIED",
          adminNotes: adminNotes || null,
          verifiedBy: userId,
          verifiedAt: new Date(),
          donationId: donation.id,
          amount: donationAmount,
        },
      });

      return NextResponse.json({
        message: "Pledge-ul a fost verificat si donatia inregistrata",
        donationId: donation.id,
      });
    } else {
      // Reject
      await prisma.manualDonationPledge.update({
        where: { id: pledgeId },
        data: {
          status: "REJECTED",
          adminNotes: adminNotes || null,
          verifiedBy: userId,
          verifiedAt: new Date(),
        },
      });

      return NextResponse.json({ message: "Pledge-ul a fost respins" });
    }
  } catch (error: any) {
    console.error("Pledge verification error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

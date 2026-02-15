import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";
import { createAuditLog } from "@/lib/audit";
import { hasFeature, fetchEffectivePlan } from "@/lib/permissions";

interface ImportContact {
  fullName: string;
  role?: string;
  email?: string;
  phone?: string;
  linkedinUrl?: string;
}

interface ImportCompany {
  name: string;
  domain?: string;
  website?: string;
  industry?: string;
  city?: string;
  country?: string;
  contacts?: ImportContact[];
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Neautorizat" }, { status: 401 });
    }

    const ngoId = (session.user as any).ngoId;
    if (!ngoId) {
      return NextResponse.json(
        { error: "Nu exista un ONG asociat contului" },
        { status: 403 }
      );
    }

    const role = (session.user as any).role;
    const plan = await fetchEffectivePlan(ngoId, (session.user as any).plan, role);
    if (!hasFeature(plan, "sponsor_crm", role)) {
      return NextResponse.json({ error: "CRM Sponsori nu este disponibil pe planul tau. Fa upgrade la ELITE." }, { status: 403 });
    }

    const userId = (session.user as any).id;

    const body = await request.json();
    const { companies } = body as { companies: ImportCompany[] };

    if (!Array.isArray(companies) || companies.length === 0) {
      return NextResponse.json(
        { error: "Lista de companii este obligatorie si nu poate fi goala" },
        { status: 400 }
      );
    }

    if (companies.length > 1000) {
      return NextResponse.json(
        { error: "Maximul este de 1000 de companii per import" },
        { status: 400 }
      );
    }

    const stats = {
      companiesCreated: 0,
      companiesUpdated: 0,
      contactsCreated: 0,
      contactsUpdated: 0,
      errors: [] as { index: number; companyName: string; message: string }[],
    };

    for (let i = 0; i < companies.length; i++) {
      const companyData = companies[i];

      if (!companyData.name || !companyData.name.trim()) {
        stats.errors.push({
          index: i,
          companyName: companyData.name || "(fara nume)",
          message: "Numele companiei este obligatoriu",
        });
        continue;
      }

      try {
        // Check for duplicate company: same domain OR (same name + same city) within the NGO
        let existingCompany = null;

        if (companyData.domain) {
          existingCompany = await prisma.sponsorCompany.findFirst({
            where: {
              ngoId,
              domain: companyData.domain,
            },
          });
        }

        if (!existingCompany && companyData.name) {
          existingCompany = await prisma.sponsorCompany.findFirst({
            where: {
              ngoId,
              name: companyData.name.trim(),
              city: companyData.city?.trim() || null,
            },
          });
        }

        let companyId: string;

        if (existingCompany) {
          // Merge: update only non-empty fields, keep existing values if new value is empty
          await prisma.sponsorCompany.update({
            where: { id: existingCompany.id },
            data: {
              domain: companyData.domain?.trim() || existingCompany.domain,
              website: companyData.website?.trim() || existingCompany.website,
              industry: companyData.industry?.trim() || existingCompany.industry,
              city: companyData.city?.trim() || existingCompany.city,
              country: companyData.country?.trim() || existingCompany.country,
            },
          });
          companyId = existingCompany.id;
          stats.companiesUpdated++;
        } else {
          // Create new company
          const newCompany = await prisma.sponsorCompany.create({
            data: {
              ngoId,
              name: companyData.name.trim(),
              domain: companyData.domain?.trim() || null,
              website: companyData.website?.trim() || null,
              industry: companyData.industry?.trim() || null,
              city: companyData.city?.trim() || null,
              country: companyData.country?.trim() || "Romania",
              createdBy: userId,
            },
          });
          companyId = newCompany.id;
          stats.companiesCreated++;
        }

        // Process contacts for this company
        if (Array.isArray(companyData.contacts)) {
          for (const contactData of companyData.contacts) {
            if (!contactData.fullName || !contactData.fullName.trim()) {
              stats.errors.push({
                index: i,
                companyName: companyData.name,
                message: `Contact fara nume in compania "${companyData.name}"`,
              });
              continue;
            }

            try {
              // Check for duplicate contact: same email OR same linkedinUrl within the company
              let existingContact = null;

              if (contactData.email) {
                existingContact = await prisma.sponsorContact.findFirst({
                  where: {
                    companyId,
                    email: contactData.email.trim().toLowerCase(),
                  },
                });
              }

              if (!existingContact && contactData.linkedinUrl) {
                existingContact = await prisma.sponsorContact.findFirst({
                  where: {
                    companyId,
                    linkedinUrl: contactData.linkedinUrl.trim(),
                  },
                });
              }

              if (existingContact) {
                // Merge non-empty fields
                await prisma.sponsorContact.update({
                  where: { id: existingContact.id },
                  data: {
                    fullName: contactData.fullName.trim() || existingContact.fullName,
                    role: contactData.role?.trim() || existingContact.role,
                    email: contactData.email?.trim().toLowerCase() || existingContact.email,
                    phone: contactData.phone?.trim() || existingContact.phone,
                    linkedinUrl: contactData.linkedinUrl?.trim() || existingContact.linkedinUrl,
                  },
                });
                stats.contactsUpdated++;
              } else {
                // Create new contact
                await prisma.sponsorContact.create({
                  data: {
                    companyId,
                    fullName: contactData.fullName.trim(),
                    role: contactData.role?.trim() || null,
                    email: contactData.email?.trim().toLowerCase() || null,
                    phone: contactData.phone?.trim() || null,
                    linkedinUrl: contactData.linkedinUrl?.trim() || null,
                  },
                });
                stats.contactsCreated++;
              }
            } catch (contactError: any) {
              stats.errors.push({
                index: i,
                companyName: companyData.name,
                message: `Eroare la contactul "${contactData.fullName}": ${contactError.message}`,
              });
            }
          }
        }
      } catch (companyError: any) {
        stats.errors.push({
          index: i,
          companyName: companyData.name,
          message: companyError.message,
        });
      }
    }

    // Create audit log
    await createAuditLog({
      ngoId,
      userId,
      action: "SPONSOR_IMPORT_COMPLETED",
      details: {
        totalCompanies: companies.length,
        companiesCreated: stats.companiesCreated,
        companiesUpdated: stats.companiesUpdated,
        contactsCreated: stats.contactsCreated,
        contactsUpdated: stats.contactsUpdated,
        errorCount: stats.errors.length,
      },
      ipAddress:
        request.headers.get("x-forwarded-for") ||
        request.headers.get("x-real-ip") ||
        undefined,
    });

    return NextResponse.json({
      companiesCreated: stats.companiesCreated,
      companiesUpdated: stats.companiesUpdated,
      contactsCreated: stats.contactsCreated,
      contactsUpdated: stats.contactsUpdated,
      errors: stats.errors.length > 0 ? stats.errors.slice(0, 50) : [],
    });
  } catch (error) {
    console.error("Sponsor import error:", error);
    return NextResponse.json(
      { error: "Eroare interna de server" },
      { status: 500 }
    );
  }
}

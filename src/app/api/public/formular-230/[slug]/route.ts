import { NextRequest, NextResponse } from "next/server";

export async function POST(_req: NextRequest) {
  return NextResponse.json(
    { error: "Acest endpoint nu mai este disponibil. Formularul 230 se completeaza pe formular230.ro sau pe hartie." },
    { status: 410 }
  );
}

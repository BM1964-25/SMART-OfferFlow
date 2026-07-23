import { NextRequest, NextResponse } from "next/server";
import { createOfferSharePayload } from "@/lib/share";
import { loadOfferFromSupabase, saveOfferToSupabase } from "@/lib/supabase-offers";
import { CompanyProfile, PositionGroup, Project } from "@/lib/types";

export const dynamic = "force-dynamic";

function publicBaseUrl(request: NextRequest) {
  const configured = process.env.NEXT_PUBLIC_OFFERFLOW_PUBLIC_URL;
  if (configured) return configured.replace(/\/$/, "");
  return new URL(request.url).origin;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      project?: Project;
      groups?: PositionGroup[];
      profiles?: CompanyProfile[];
      token?: string;
    };

    if (!body.project || !body.groups || !body.profiles) {
      return NextResponse.json({ error: "Projekt, LV-Gruppen und Firmenprofile sind erforderlich." }, { status: 400 });
    }

    const payload = createOfferSharePayload(body.project, body.groups, body.profiles);
    const stored = await saveOfferToSupabase(payload, body.token);
    const link = `${publicBaseUrl(request)}/#offerToken=${encodeURIComponent(stored.token)}`;

    return NextResponse.json({
      ok: true,
      token: stored.token,
      link,
      updatedAt: stored.updated_at
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Angebot konnte nicht gespeichert werden.";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get("token");
    if (!token) {
      return NextResponse.json({ error: "Token fehlt." }, { status: 400 });
    }

    const stored = await loadOfferFromSupabase(token);
    if (!stored) {
      return NextResponse.json({ error: "Angebot wurde nicht gefunden." }, { status: 404 });
    }

    return NextResponse.json({
      token: stored.token,
      payload: stored.payload,
      updatedAt: stored.updated_at
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Angebot konnte nicht geladen werden.";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { mkdir, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { generateOfferPdf } from "@/lib/server-pdf";
import { loadOfferFromSupabase } from "@/lib/supabase-offers";
import { CompanyProfile, PositionGroup, Project } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function sanitizeFilename(value: string) {
  return (
    value
      .normalize("NFKD")
      .replace(/[^\w\s.-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 80) || "angebot"
  );
}

function contentDispositionFilename(filename: string, disposition: "attachment" | "inline" = "attachment") {
  const finalName = finalPdfFilename(filename);
  return `${disposition}; filename="${finalName}"; filename*=UTF-8''${encodeURIComponent(finalName)}`;
}

function finalPdfFilename(filename: string) {
  const sanitized = sanitizeFilename(filename.replace(/\.pdf$/i, ""));
  return `${sanitized}.pdf`;
}

function isLocalRequest(request: NextRequest) {
  const host = request.headers.get("host") ?? "";
  return host.startsWith("localhost") || host.startsWith("127.0.0.1") || host.startsWith("0.0.0.0");
}

async function savePdfToDownloads(filename: string, pdf: Buffer | Uint8Array) {
  const downloadsDir = path.join(os.homedir(), "Downloads");
  const finalName = finalPdfFilename(filename);
  const targetPath = path.join(downloadsDir, finalName);
  await mkdir(downloadsDir, { recursive: true });
  await writeFile(targetPath, pdf);
  return { filename: finalName, path: targetPath };
}

function pdfResponse(pdf: Buffer | Uint8Array, filename: string, inline = false) {
  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "content-type": "application/pdf",
      "content-disposition": contentDispositionFilename(filename, inline ? "inline" : "attachment"),
      "cache-control": "no-store"
    }
  });
}

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get("content-type") ?? "";
    const body = contentType.includes("application/json")
      ? ((await request.json()) as {
          project?: Project;
          groups?: PositionGroup[];
          profiles?: CompanyProfile[];
          html?: string;
          styles?: string;
          title?: string;
          filename?: string;
          baseUrl?: string;
          responseMode?: "download" | "json";
          saveLocal?: boolean;
          inline?: boolean;
        })
      : await request.formData().then((formData) => {
          const payload = String(formData.get("payload") ?? "");
          if (payload) {
            const parsed = JSON.parse(payload) as {
              project?: Project;
              groups?: PositionGroup[];
              profiles?: CompanyProfile[];
              title?: string;
              filename?: string;
              baseUrl?: string;
              responseMode?: "download" | "json";
              saveLocal?: boolean;
              inline?: boolean;
            };
            return parsed;
          }

          return {
            html: String(formData.get("html") ?? ""),
            styles: String(formData.get("styles") ?? ""),
            title: String(formData.get("title") ?? ""),
            filename: String(formData.get("filename") ?? ""),
            baseUrl: String(formData.get("baseUrl") ?? ""),
            responseMode: String(formData.get("responseMode") ?? "download") as "download" | "json",
            saveLocal: String(formData.get("saveLocal") ?? "") === "true"
          };
        });
    const pdfRequest = body as {
      project?: Project;
      groups?: PositionGroup[];
      profiles?: CompanyProfile[];
      html?: string;
      styles?: string;
      title?: string;
      filename?: string;
      baseUrl?: string;
      responseMode?: "download" | "json";
      saveLocal?: boolean;
      inline?: boolean;
    };

    if (pdfRequest.project && pdfRequest.profiles) {
      const generated = await generateOfferPdf({
        project: pdfRequest.project,
        groups: pdfRequest.groups ?? [],
        profiles: pdfRequest.profiles
      });
      const filename = pdfRequest.filename || generated.filename;

      if (pdfRequest.responseMode === "json") {
        if (pdfRequest.saveLocal && isLocalRequest(request) && !process.env.VERCEL) {
          const savedFile = await savePdfToDownloads(filename, generated.pdf);
          return NextResponse.json({
            saved: true,
            filename: savedFile.filename,
            path: savedFile.path
          });
        }

        return NextResponse.json({
          saved: false,
          filename: finalPdfFilename(filename),
          pdfBase64: generated.pdf.toString("base64")
        });
      }

      return pdfResponse(generated.pdf, filename, pdfRequest.inline);
    }

    return NextResponse.json({ error: "PDF-Erstellung benötigt Angebotsdaten. Bitte die Angebotsvorschau neu laden und erneut versuchen." }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "PDF konnte nicht erstellt werden.";
    return NextResponse.json({ error: message }, { status: 500 });
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

    const generated = await generateOfferPdf({
      project: stored.payload.project,
      groups: stored.payload.groups,
      profiles: stored.payload.profiles
    });

    return pdfResponse(generated.pdf, generated.filename, request.nextUrl.searchParams.get("inline") === "1");
  } catch (error) {
    const message = error instanceof Error ? error.message : "PDF konnte nicht erstellt werden.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

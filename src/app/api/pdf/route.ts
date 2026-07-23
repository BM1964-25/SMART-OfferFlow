import chromium from "@sparticuz/chromium";
import { NextRequest, NextResponse } from "next/server";
import { mkdir, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { chromium as playwrightChromium } from "playwright-core";

export const runtime = "nodejs";

const localChromePaths = [
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Chromium.app/Contents/MacOS/Chromium",
  "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge"
];

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

function contentDispositionFilename(filename: string) {
  const finalName = finalPdfFilename(filename);
  return `attachment; filename="${finalName}"; filename*=UTF-8''${encodeURIComponent(finalName)}`;
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

async function executablePath() {
  if (process.env.CHROME_EXECUTABLE_PATH) return process.env.CHROME_EXECUTABLE_PATH;
  if (process.env.VERCEL || process.env.AWS_REGION) return chromium.executablePath();

  const fs = await import("node:fs");
  const localPath = localChromePaths.find((path) => fs.existsSync(path));
  if (localPath) return localPath;

  return chromium.executablePath();
}

function pdfShell({ baseUrl, styles, html }: { baseUrl: string; styles: string; html: string }) {
  return `<!doctype html>
<html lang="de">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title> </title>
    <base href="${baseUrl.replace(/"/g, "&quot;")}/" />
    ${styles}
    <style>
      @page { size: A4; margin: 22mm 20mm 24mm; }
      html, body {
        margin: 0;
        background: #fff !important;
        color: #000;
        print-color-adjust: exact;
        -webkit-print-color-adjust: exact;
      }
      body { overflow: visible !important; }
      .no-print { display: none !important; }
      .print-area {
        width: 100% !important;
        max-width: none !important;
        padding: 0 !important;
        overflow: visible !important;
        border: 0 !important;
        border-radius: 0 !important;
        box-shadow: none !important;
        font-family: Arial, Helvetica, sans-serif !important;
        font-size: 11pt !important;
        line-height: 1.48 !important;
      }
      .print-area p,
      .print-area li,
      .print-area a,
      .print-area span,
      .print-area td,
      .print-area th {
        font-size: 11pt !important;
        line-height: 1.48 !important;
        overflow-wrap: break-word;
        word-break: normal;
      }
      .print-area h1 {
        font-size: 24px !important;
        line-height: 1.2 !important;
      }
      .print-area h2 {
        font-size: 14px !important;
        line-height: 1.35 !important;
      }
      .print-area h3,
      .structured-section-title {
        font-size: 12px !important;
        line-height: 1.35 !important;
      }
      .structured-offer-text,
      .structured-offer-list,
      .structured-offer-text p,
      .structured-offer-list li {
        font-size: 11pt !important;
        line-height: 1.5 !important;
      }
      .metzger-letterhead {
        white-space: nowrap !important;
        font-size: 21px !important;
        line-height: 1.15 !important;
      }
      .sender-card {
        width: 64mm !important;
        min-width: 64mm !important;
        max-width: 64mm !important;
        flex: 0 0 64mm !important;
        padding: 5mm !important;
        border-radius: 0 !important;
        overflow: visible !important;
      }
      .sender-card,
      .sender-card p,
      .sender-card span,
      .sender-card div {
        font-size: 9.4pt !important;
        line-height: 1.34 !important;
        overflow-wrap: normal !important;
        word-break: normal !important;
        hyphens: none !important;
      }
      .sender-card-company {
        font-size: 9.6pt !important;
        line-height: 1.32 !important;
      }
      .sender-card-label {
        font-size: 8.9pt !important;
        line-height: 1.3 !important;
      }
      img {
        max-width: 100% !important;
      }
      img[alt="Unterschrift Bernhard Metzger"] {
        display: block !important;
        width: 220px !important;
        height: auto !important;
        object-fit: contain !important;
      }
      .print-page-break-before {
        break-before: page !important;
        page-break-before: always !important;
      }
      .break-inside-avoid,
      .print-keep {
        break-inside: avoid;
        page-break-inside: avoid;
      }
      .offer-footer {
        display: block !important;
        margin-top: 28mm !important;
        padding-top: 5mm !important;
        font-size: 9.5pt !important;
        line-height: 1.35 !important;
      }
      .offer-footer-company {
        font-size: 11pt !important;
        line-height: 1.3 !important;
      }
      .offer-footer-columns {
        display: grid !important;
        grid-template-columns: 1.05fr 1fr 1.24fr !important;
        gap: 9mm !important;
      }
      .offer-footer-col,
      .offer-footer-col p,
      .offer-footer-col a {
        min-width: 0 !important;
        font-size: 9.2pt !important;
        line-height: 1.38 !important;
        overflow-wrap: break-word !important;
        word-break: normal !important;
        hyphens: none !important;
      }
      .offer-footer-heading {
        font-size: 8pt !important;
        line-height: 1.25 !important;
        letter-spacing: 0.16em !important;
      }
      .offer-footer-date { display: none !important; }
    </style>
  </head>
  <body>${html}</body>
</html>`;
}

export async function POST(request: NextRequest) {
  let browser: Awaited<ReturnType<typeof playwrightChromium.launch>> | null = null;

  try {
    const contentType = request.headers.get("content-type") ?? "";
    const body = contentType.includes("application/json")
      ? ((await request.json()) as {
          html?: string;
          styles?: string;
          title?: string;
          filename?: string;
          baseUrl?: string;
          responseMode?: "download" | "json";
          saveLocal?: boolean;
        })
      : await request.formData().then((formData) => ({
          html: String(formData.get("html") ?? ""),
          styles: String(formData.get("styles") ?? ""),
          title: String(formData.get("title") ?? ""),
          filename: String(formData.get("filename") ?? ""),
          baseUrl: String(formData.get("baseUrl") ?? ""),
          responseMode: String(formData.get("responseMode") ?? "download") as "download" | "json",
          saveLocal: String(formData.get("saveLocal") ?? "") === "true"
        }));
    const pdfRequest = body as {
      html?: string;
      styles?: string;
      title?: string;
      filename?: string;
      baseUrl?: string;
      responseMode?: "download" | "json";
      saveLocal?: boolean;
    };

    if (!pdfRequest.html) {
      return NextResponse.json({ error: "Angebots-HTML fehlt." }, { status: 400 });
    }

    const requestOrigin = new URL(request.url).origin;
    const baseUrl = (pdfRequest.baseUrl || requestOrigin).replace(/\/$/, "");
    const title = sanitizeFilename(pdfRequest.title || "angebot");
    const filename = pdfRequest.filename || `${title}.pdf`;

    browser = await playwrightChromium.launch({
      args: process.env.VERCEL || process.env.AWS_REGION ? chromium.args : ["--no-sandbox", "--disable-setuid-sandbox"],
      executablePath: await executablePath(),
      headless: true
    });

    const page = await browser.newPage({
      viewport: { width: 1240, height: 1754 },
      deviceScaleFactor: 1
    });

    await page.setContent(
      pdfShell({
        baseUrl,
        styles: pdfRequest.styles || "",
        html: pdfRequest.html
      }),
      { waitUntil: "networkidle", timeout: 30000 }
    );
    await page
      .waitForFunction(
        () => Array.from(document.images).every((image) => image.complete && image.naturalWidth > 0),
        null,
        { timeout: 5000 }
      )
      .catch(() => undefined);

    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate: "<div></div>",
      footerTemplate:
        '<div style="width:100%;font-family:Arial,sans-serif;font-size:8px;color:#444;text-align:right;padding:0 20mm;">Seite <span class="pageNumber"></span> von <span class="totalPages"></span></div>',
      margin: {
        top: "22mm",
        right: "20mm",
        bottom: "24mm",
        left: "20mm"
      }
    });

    if (pdfRequest.responseMode === "json") {
      if (pdfRequest.saveLocal && isLocalRequest(request) && !process.env.VERCEL) {
        const savedFile = await savePdfToDownloads(filename, pdf);
        return NextResponse.json({
          saved: true,
          filename: savedFile.filename,
          path: savedFile.path
        });
      }

      return NextResponse.json({
        saved: false,
        filename: finalPdfFilename(filename),
        pdfBase64: Buffer.from(pdf).toString("base64")
      });
    }

    return new NextResponse(new Uint8Array(pdf), {
      headers: {
        "content-type": "application/pdf",
        "content-disposition": contentDispositionFilename(filename),
        "cache-control": "no-store"
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "PDF konnte nicht erstellt werden.";
    return NextResponse.json({ error: message }, { status: 500 });
  } finally {
    await browser?.close();
  }
}

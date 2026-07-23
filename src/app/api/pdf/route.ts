import chromium from "@sparticuz/chromium";
import { NextRequest, NextResponse } from "next/server";
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
  const sanitized = sanitizeFilename(filename.replace(/\.pdf$/i, ""));
  const finalName = `${sanitized}.pdf`;
  return `attachment; filename="${finalName}"; filename*=UTF-8''${encodeURIComponent(finalName)}`;
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
    const body = (await request.json()) as {
      html?: string;
      styles?: string;
      title?: string;
      filename?: string;
      baseUrl?: string;
    };

    if (!body.html) {
      return NextResponse.json({ error: "Angebots-HTML fehlt." }, { status: 400 });
    }

    const requestOrigin = new URL(request.url).origin;
    const baseUrl = (body.baseUrl || requestOrigin).replace(/\/$/, "");
    const title = sanitizeFilename(body.title || "angebot");
    const filename = body.filename || `${title}.pdf`;

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
        styles: body.styles || "",
        html: body.html
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

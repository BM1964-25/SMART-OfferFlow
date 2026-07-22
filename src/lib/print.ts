export function printElement(selector: string, title: string) {
  const element = document.querySelector(selector);
  if (!element) {
    window.print();
    return;
  }

  const styleNodes = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
    .map((node) => node.outerHTML)
    .join("\n");
  const printWindow = window.open("", "_blank", "noopener,noreferrer,width=900,height=1200");

  if (!printWindow) {
    window.print();
    return;
  }

  printWindow.document.open();
  printWindow.document.write(`<!doctype html>
<html lang="de">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title> </title>
    ${styleNodes}
    <style>
      @page { size: A4; margin: 22mm 20mm 24mm; }
      html, body {
        height: auto !important;
        min-height: 0 !important;
        overflow: visible !important;
        background: #fff !important;
        color: #172033;
        font-size: 11.5pt !important;
        print-color-adjust: exact;
        -webkit-print-color-adjust: exact;
      }
      body {
        margin: 0;
        padding: 0;
      }
      .print-area {
        width: 100% !important;
        max-width: none !important;
        padding: 0 !important;
        font-size: 11.5pt !important;
        border: none !important;
        border-radius: 0 !important;
        box-shadow: none !important;
      }
      .print-area h1 {
        font-size: 24px !important;
        line-height: 1.2 !important;
      }
      .print-area h2 {
        font-size: 14px !important;
        line-height: 1.35 !important;
      }
      .print-area h3 {
        font-size: 12px !important;
        line-height: 1.35 !important;
      }
      .metzger-letterhead {
        white-space: nowrap !important;
        font-size: 22px !important;
        letter-spacing: 0.08em !important;
        line-height: 1.2 !important;
      }
      .structured-section-title {
        font-size: 13px !important;
        line-height: 1.35 !important;
      }
      .structured-subsection-title {
        font-size: 11.5px !important;
        line-height: 1.4 !important;
      }
      .structured-offer-text,
      .structured-offer-list {
        font-size: 11.5px !important;
        line-height: 1.55 !important;
      }
      .print-area p,
      .print-area span,
      .print-area div {
        line-height: 1.45;
      }
      .print-section {
        padding-top: 14px !important;
        padding-bottom: 14px !important;
      }
      .print-page-break-before {
        display: block !important;
        break-before: page !important;
        break-before: always !important;
        page-break-before: always !important;
        -webkit-column-break-before: always !important;
        margin-top: 0 !important;
      }
      .print-page-break-before.border-t {
        border-top: 0 !important;
      }
      .screen-page-break-before {
        margin-top: 0 !important;
        padding-top: 14px !important;
      }
      .break-inside-avoid,
      .print-keep {
        break-inside: avoid;
        page-break-inside: avoid;
      }
      .print-table {
        overflow: visible !important;
      }
      .print-table > div {
        break-inside: auto;
        page-break-inside: auto;
      }
      .no-print {
        display: none !important;
      }
      .offer-footer {
        display: none !important;
      }
      .offer-footer-full {
        display: none !important;
      }
      .offer-footer-date {
        display: none !important;
      }
      @media print {
        html, body {
          height: auto !important;
          overflow: visible !important;
        }
      }
    </style>
  </head>
  <body>
    ${element.outerHTML}
  </body>
</html>`);
  printWindow.document.close();
  printWindow.document.title = " ";

  printWindow.setTimeout(() => {
    printWindow.focus();
    printWindow.print();
  }, 250);
}

function escapeHtml(value: string) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}
